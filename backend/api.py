"""
EkoFin Birleşik Backend Gateway API
Tüm modülleri (Carbon, TSRS, ESG) tek bir FastAPI uygulamasında birleştirir.
Port: 8000
"""

import os
import json
import hashlib
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from config import (
    BASE_DIR, SOURCES_DIR, REPORT_OUTPUT_PATH, DECLARATION_PATH,
    UPLOADS_META_PATH, DOCUMENT_TYPE_MAP, EKLENEN_VERILER_PATH,
    OUTPUT_DIR, CREDITS_PATH, CROWDFUNDING_PATH, ESG_COMPANIES_PATH,
    get_company_sources_dir, get_company_declaration_path,
    get_company_uploads_meta_path, get_company_report_path,
    get_company_eklenen_veriler_path,
)
import database as db

load_dotenv(dotenv_path=BASE_DIR / ".env")
db.init_db()

# ─── Modül İmportları ────────────────────────────────────────────────────────
from modules.carbon.extractor import extract_activities, _mock_parser, CarbonExtractionModel
from modules.carbon.calculator import CarbonCalculator
from modules.carbon.roi import calculate_groi, ROIRequest, calculate_green_credit

# New modular routes add the versioned TSRS workflow and credibility analysis.
# Existing monolithic endpoints below remain as compatibility fallbacks; route
# registration order lets these updated handlers serve their shared paths first.
from routers.documents import router as documents_router
from routers.report import router as report_router
from routers.carbon import router as carbon_router
from routers.esg import router as esg_router
from routers.finance import router as finance_router
from routers.audits import router as audits_router

# ESG modeli lazy-load edilecek (pkl dosyaları büyük olabilir)
_esg_predictor = None
_nlp_analyzer = None
_news_fetcher = None

def _get_esg_predictor():
    global _esg_predictor
    if _esg_predictor is None:
        try:
            from modules.esg_prediction.predictor import ESGPredictor
            _esg_predictor = ESGPredictor()
        except Exception as e:
            print(f"[UYARI] ESG modeli yüklenemedi: {e}")
            raise
    return _esg_predictor

def _get_nlp_analyzer():
    global _nlp_analyzer
    if _nlp_analyzer is None:
        try:
            from modules.esg_prediction.nlp_analyzer import ESGCommentAnalyzer
            _nlp_analyzer = ESGCommentAnalyzer()
        except Exception as e:
            print(f"[UYARI] NLP Analizör yüklenemedi: {e}")
            raise
    return _nlp_analyzer

def _get_news_fetcher():
    global _news_fetcher
    if _news_fetcher is None:
        from modules.esg_prediction.news_fetcher import NewsFetcher
        _news_fetcher = NewsFetcher()
    return _news_fetcher

NEWS_REFRESH_INTERVAL_HOURS = 6

def _fetch_and_store_news(ticker: str, company_name: str) -> int:
    """RSS'ten ham haberleri çeker, yalnızca DB'de henüz olmayanları (dedup by URL)
    NLP'den geçirip kaydeder. Zaten var olan haberleri tekrar analiz etmez.
    Yeni haber başlıkları TEK bir LLM çağrısında toplu (batch) analiz edilir —
    seri/paralel per-item analiz her haber için ayrı kota tüketiyordu (8 haber = 8 çağrı);
    bu yaklaşım aynı işi 1 çağrıya indirir."""
    fetcher = _get_news_fetcher()
    raw_items = fetcher.fetch_for_company(ticker, company_name)
    existing_urls = db.get_existing_news_urls(ticker)
    new_items = [it for it in raw_items if it["url"] not in existing_urls]

    if new_items:
        analyzer = _get_nlp_analyzer()
        nlp_results = analyzer.analyze_batch([it["title"] for it in new_items])
        for item, nlp_result in zip(new_items, nlp_results):
            item["nlp"] = nlp_result

    return db.add_news_items(new_items), len(raw_items)

def _ensure_fresh_news(ticker: str, company_name: str):
    """Haber önbelleği NEWS_REFRESH_INTERVAL_HOURS'tan eskiyse Google News RSS'ten yeniler.
    Ağ hatası olursa sessizce mevcut önbelleği kullanmaya devam eder (uygulamayı bloklamaz)."""
    last_fetch = db.get_last_news_fetch(ticker)
    if last_fetch:
        try:
            last_dt = datetime.strptime(last_fetch, "%Y-%m-%d %H:%M:%S")
            if (datetime.now() - last_dt).total_seconds() < NEWS_REFRESH_INTERVAL_HOURS * 3600:
                return
        except ValueError:
            pass
    try:
        _fetch_and_store_news(ticker, company_name)
    except Exception as e:
        print(f"[UYARI] {ticker} için haber güncellenemedi: {e}")


# ─── FastAPI Uygulaması ──────────────────────────────────────────────────────
app = FastAPI(
    title="EkoFin Birleşik Backend",
    description="Belge yükleme, TSRS rapor üretimi, karbon hesaplama, yeşil kredi skorlama ve ESG tahmini — tek API.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router)
app.include_router(report_router)
app.include_router(carbon_router)
app.include_router(esg_router)
app.include_router(finance_router)
app.include_router(audits_router)

calculator = CarbonCalculator()


# ─── Yardımcı Fonksiyonlar ───────────────────────────────────────────────────

def _load_uploads_meta(ticker: Optional[str] = None) -> dict:
    """Yüklenen belgelerin meta bilgilerini şirkete (ticker) özel dosyadan yükle."""
    path = get_company_uploads_meta_path(ticker)
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"documents": {}, "uploads": []}


def _save_uploads_meta(meta: dict, ticker: Optional[str] = None):
    """Meta bilgilerini şirkete özel dosyaya kaydet."""
    path = get_company_uploads_meta_path(ticker)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)


def _compute_file_hash(file_path: Path) -> str:
    """Dosyanın SHA-256 hash'ini hesapla."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return "0x" + sha256.hexdigest()


# ─── Request/Response Modeller ────────────────────────────────────────────────

class DeclarationData(BaseModel):
    """Yönetici Anketi / Beyan Formu verisi."""
    employeeCount: Optional[int] = None
    femaleEmployeeCount: Optional[int] = None
    maleEmployeeCount: Optional[int] = None
    extraExcuseLeave: Optional[int] = None
    vehiclesCount: Optional[dict] = None
    annualElectricity: Optional[float] = None
    annualNaturalGas: Optional[float] = None
    annualWater: Optional[float] = None
    hasEmsPolicy: Optional[str] = None
    hasRenewableEnergy: Optional[bool] = None
    sustainabilityGoals: Optional[str] = None
    climateRiskAssessment: Optional[str] = None
    scope3Exemption: Optional[bool] = None


class ReportStatus(BaseModel):
    status: str  # "idle" | "generating" | "completed" | "error"
    progress: int = 0
    message: str = ""


class CalculationRequest(BaseModel):
    text: str
    ges_budget: float = Field(default=0.0, description="GES Yatırımı (TL)")
    ev_count: int = Field(default=0, description="Elektrikli Araç Sayısı")
    eff_budget: float = Field(default=0.0, description="Enerji Verimliliği Bütçesi (TL)")
    waste_budget: float = Field(default=0.0, description="Atık Yönetimi Bütçesi (TL)")
    water_budget: float = Field(default=0.0, description="Su Verimliliği Bütçesi (TL)")
    loan_amount: float = Field(default=500_000.0, description="Talep Edilen Kredi (TL)")
    loan_years: int = Field(default=5, description="Kredi vadesi (yıl)")
    financial_rating: str = Field(default="BBB", description="Derecelendirme Notu")
    
    # Optional fields for ROI / GreenROI.jsx compatibility
    investment_tl: Optional[float] = Field(default=None, description="Yeşil dönüşüm yatırımı (TL)")
    reduction_target_pct: Optional[float] = Field(default=None, description="Hedeflenen emisyon azalma oranı (%)")


# ─── Global State ────────────────────────────────────────────────────────────
# Şirket başına ayrı rapor üretim durumu (aksi halde bir şirketin raporu
# üretilirken diğer şirketin ekranında da "üretiliyor" görünürdü).
_report_status_by_ticker: dict = {}


def _report_key(ticker: Optional[str]) -> str:
    return (ticker or "DEFAULT").strip().upper() or "DEFAULT"


def _get_report_status(ticker: Optional[str]) -> ReportStatus:
    return _report_status_by_ticker.setdefault(
        _report_key(ticker), ReportStatus(status="idle", progress=0, message="")
    )


def _set_report_status(ticker: Optional[str], status: ReportStatus):
    _report_status_by_ticker[_report_key(ticker)] = status


# ═══════════════════════════════════════════════════════════════════════════════
#                              ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {
        "service": "EkoFin Birleşik Backend",
        "version": "2.0.0",
        "endpoints": [
            "GET  /api/dashboard/summary",
            "POST /api/documents/upload",
            "GET  /api/documents/list",
            "GET  /api/documents/status",
            "POST /api/declaration",
            "GET  /api/declaration",
            "POST /api/report/generate",
            "GET  /api/report/latest",
            "GET  /api/report/status",
            "POST /api/report/verify",
            "GET  /api/simulator/aggregate-context",
            "POST /api/carbon/calculate",
            "POST /api/esg/predict",
            "GET  /api/esg/health",
            "GET  /api/credits",
            "GET  /api/crowdfunding",
            "GET  /api/esg/companies",
        ],
    }


@app.get("/api/credits")
def get_credits():
    """Kredi tekliflerini JSON veritabanından yükle."""
    if not CREDITS_PATH.exists():
        raise HTTPException(status_code=404, detail="Kredi teklifleri veritabanı bulunamadı.")
    with open(CREDITS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/api/crowdfunding")
def get_crowdfunding():
    """Kitle fonlama projelerini JSON veritabanından yükle."""
    if not CROWDFUNDING_PATH.exists():
        raise HTTPException(status_code=404, detail="Kitle fonlama veritabanı bulunamadı.")
    with open(CROWDFUNDING_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


# ─── ESG Tahmin Veri Eşlemeleri (esg_tahmin.csv için) ─────────────────────────

COMPANY_DETAILS = {
    "ASELS": {"name": "Aselsan Elektronik Sanayi", "sector": "Savunma & Havacılık", "domain": "aselsan.com.tr", "verified": ["ISO 14001 ve ISO 50001 sertifikasyonu", "Ar-Ge harcamalarının %100 sürdürülebilirlik odağı"]},
    "BIMAS": {"name": "BİM Birleşik Mağazalar", "sector": "Perakende & Ticaret", "domain": "bim.com.tr", "verified": ["Atık gıda yönetimi entegrasyonu", "Plastik ambalaj azaltım taahhüdü"]},
    "EKGYO": {"name": "Emlak Konut GYO", "sector": "Gayrimenkul Yatırım", "domain": "emlakkonut.com.tr", "verified": ["Yeşil bina sertifikalı projeler", "Sıfır atık şantiye yönetimi"]},
    "FROTO": {"name": "Ford Otosan", "sector": "Otomotiv Sanayi", "domain": "fordotosan.com.tr", "verified": ["Kocaeli fabrikalarında karbon nötr hedefleri", "Elektrikli araç dönüşüm yatırımları"]},
    "GARAN": {"name": "Garanti BBVA", "sector": "Bankacılık & Finans", "domain": "garantibbva.com.tr", "verified": ["Kömür yatırımlarından tamamen çıkış taahhüdü", "Yeşil tahvil ihraç liderliği"]},
    "KRDMD": {"name": "Kardemir Karabük Demir Çelik", "sector": "Demir Çelik Sanayi", "domain": "kardemir.com", "verified": ["Baca gazı arıtma sistemleri modernizasyonu", "Atık ısı geri kazanım projesi"]},
    "KOZAL": {"name": "Koza Altın İşletmeleri", "sector": "Maden & Metalurji", "domain": "kozaaltin.com.tr", "verified": ["Siyanür yönetimi uluslararası uyum", "Rehabilitasyon yapılan maden sahaları"]},
    "KOZAA": {"name": "Koza Anadolu Metal", "sector": "Maden & Metalurji", "domain": "kozaametal.com.tr", "verified": ["Çevresel etki değerlendirme raporları", "İş güvenliği sıfır kaza hedefi"]},
    "KCHOL": {"name": "Koç Holding", "sector": "Holding / Yatırım", "domain": "koc.com.tr", "verified": ["Karbon Dönüşüm Programı liderliği", "Toplumsal cinsiyet eşitliği projeleri"]},
    "MGROS": {"name": "Migros Ticaret", "sector": "Perakende & Ticaret", "domain": "migros.com.tr", "verified": ["Gıda imha oranlarında %50 azaltım", "Sürdürülebilir tarım sertifikalı tedarik"]},
    "PGSUS": {"name": "Pegasus Hava Yolları", "sector": "Havacılık & Taşımacılık", "domain": "flypgs.com", "verified": ["Genç filo ile düşük emisyon oranı", "Sürdürülebilir Havacılık Yakıtı (SAF) kullanımı"]},
    "PETKM": {"name": "Petkim Petrokimya", "sector": "Kimya Sanayi", "domain": "petkim.com.tr", "verified": ["Enerji verimliliği projeleri", "Atık su geri kazanım oranlarında artış"]},
    "SASA": {"name": "Sasa Polyester", "sector": "Tekstil & Kimya", "domain": "sasa.com.tr", "verified": ["Geri dönüştürülmüş pet üretimi", "Su döngüsü kapalı devre sistemler"]},
    "SAHOL": {"name": "Sabancı Holding", "sector": "Holding / Yatırım", "domain": "sabanci.com", "verified": ["2050 net sıfır emisyon taahhüdü", "Sürdürülebilir portföy büyüme hedefleri"]},
    "TAVHL": {"name": "TAV Havalimanları", "sector": "Havacılık & İşletme", "domain": "tavhavalimanlari.com.tr", "verified": ["Karbon akreditasyon sertifikası (Level 3+)", "Güneş enerjisi destekli terminaller"]},
    "TCELL": {"name": "Turkcell", "sector": "Telekomünikasyon", "domain": "turkcell.com.tr", "verified": ["%100 yenilenebilir enerji kaynaklı tüketim", "Engelsiz eğitim ve teknoloji projeleri"]},
    "THYAO": {"name": "Türk Hava Yolları", "sector": "Havacılık & Taşımacılık", "domain": "turkishairlines.com", "verified": ["Biyo-yakıt Ar-Ge çalışmaları", "Sıfır atık uçuş konsepti uygulamaları"]},
    "VAKBN": {"name": "Vakıfbank", "sector": "Bankacılık & Finans", "domain": "vakifbank.com.tr", "verified": ["Karbon saydamlık projesi (CDP) raporlaması", "Sürdürülebilir finansman hacminde %40 artış"]},
    "VESTL": {"name": "Vestel Elektronik", "sector": "Dayanıklı Tüketim", "domain": "vestel.com.tr", "verified": ["A+++ sınıfı yüksek verimli cihaz Ar-Ge", "Geri dönüştürülmüş plastik kullanımı"]},
    "ISCTR": {"name": "Türkiye İş Bankası", "sector": "Bankacılık & Finans", "domain": "isbank.com.tr", "verified": ["Denizleri koruma (Marmara) bilimsel projeleri", "Yeşil fon seçenekleri genişletilmesi"]},
    "SISE": {"name": "Şişecam", "sector": "Cam & Kimya Sanayi", "domain": "sisecam.com.tr", "verified": ["Cam geri dönüşüm oranlarında artış", "Düşük emisyonlu fırın teknolojileri"]},
    "AEFES": {"name": "Anadolu Efes", "sector": "Hızlı Tüketim", "domain": "anadoluefes.com", "verified": ["Su tüketiminde %30 tasarruf", "Akıllı tarım ve arpa üreticileri desteği"]},
    "AGHOL": {"name": "Anadolu Grubu", "sector": "Holding / Yatırım", "domain": "anadolugrubu.com.tr", "verified": ["Grup genelinde sürdürülebilirlik komitesi", "Yenilenebilir enerji yatırımları"]},
    "AKSEN": {"name": "Aksa Enerji", "sector": "Enerji Üretimi", "domain": "aksaenerji.com.tr", "verified": ["Doğal gaz çevrim santralleri modernizasyonu", "Afrika projelerinde çevresel etki izleme"]},
    "ALARK": {"name": "Alarko Holding", "sector": "Holding / Yatırım", "domain": "alarko.com.tr", "verified": ["Jeotermal tarım yatırımları", "Karbon ayak izi azaltma yol haritası"]},
    "ANHYT": {"name": "Anadolu Hayat Emeklilik", "sector": "Sigortacılık & Emeklilik", "domain": "anadoluhayat.com.tr", "verified": ["Kağıtsız bireysel emeklilik işlemleri", "Sürdürülebilir fon yönetimi"]},
    "ANSGR": {"name": "Anadolu Sigorta", "sector": "Sigortacılık & Emeklilik", "domain": "anadolusigorta.com.tr", "verified": ["İklim dostu sigorta ürünleri", "Dijital hasar tespit süreçleri"]},
    "ASTOR": {"name": "Astor Enerji", "sector": "Elektrik Ekipmanları", "domain": "astor.com.tr", "verified": ["Çevre dostu trafo tasarımları", "Çatı GES ile kendi elektriğini üretme"]},
    "BRSAN": {"name": "Borusan Boru", "sector": "Endüstri & Metal", "domain": "borusan.com", "verified": ["Sıfır karbonlu boru üretimi Ar-Ge", "Kadın istihdamını artırma projeleri"]},
    "BRYAT": {"name": "Borusan Yatırım", "sector": "Holding / Yatırım", "domain": "borusanyatirim.com", "verified": ["Portföy şirketlerinde ESG kriterleri", "Karbon salınımı dengeleme"]},
    "BTCIM": {"name": "Batıçim Çimento", "sector": "Çimento & İnşaat", "domain": "baticim.com.tr", "verified": ["Alternatif yakıt kullanım oranı artışı", "Toz emisyon filtre sistemleri"]},
    "CANTE": {"name": "Çan2 Termik", "sector": "Enerji Üretimi", "domain": "cantetermik.com.tr", "verified": ["Baca gazı kükürt arıtma tesisleri", "Kül barajı çevresel rehabilitasyonu"]},
    "CWENE": {"name": "CW Enerji", "sector": "Güneş Enerjisi", "domain": "cw-enerji.com", "verified": ["Güneş paneli geri dönüşüm programı", "Sıfır karbon fabrika operasyonları"]},
    "DOAS": {"name": "Doğuş Otomotiv", "sector": "Otomotiv Dağıtım", "domain": "dogusotomotiv.com.tr", "verified": ["Sürdürülebilirlik raporlama şeffaflığı", "Servis alanlarında su ve atık geri dönüşümü"]},
    "DOHOL": {"name": "Doğan Holding", "sector": "Holding / Yatırım", "domain": "doganholding.com.tr", "verified": ["Yenilenebilir enerji portföy odağı", "Değer katan kadın girişimciler desteği"]},
    "ECILC": {"name": "Eczacıbaşı İlaç", "sector": "Sağlık & İlaç", "domain": "eczacibasi.com.tr", "verified": ["Yeşil üretim tesis standartları", "Su ve atık minimizasyonu programları"]},
    "ENJSA": {"name": "Enerjisa Enerji", "sector": "Enerji Dağıtımı", "domain": "enerjisa.com.tr", "verified": ["E-şarj altyapısı genişletilmesi", "Akıllı şebeke sürdürülebilirlik yatırımları"]},
    "ENKAI": {"name": "Enka İnşaat", "sector": "İnşaat & Taahhüt", "domain": "enka.com", "verified": ["Sürdürülebilir şantiye kriterleri", "Yeşil bina tasarım ortaklıkları"]},
    "EREGL": {"name": "Ereğli Demir Çelik", "sector": "Demir Çelik Sanayi", "domain": "erdemir.com.tr", "verified": ["Yeşil çelik üretim teknolojisi yatırımları", "Toz toplama sistemleri modernizasyonu"]},
    "EUPWR": {"name": "Europower Enerji", "sector": "Elektrik Ekipmanları", "domain": "europowerenerji.com.tr", "verified": ["Yenilenebilir enerji ekipman üretim tesisi", "Karbon ayak izi izleme yazılımı"]},
    "GESAN": {"name": "Girişim Elektrik", "sector": "Enerji & Taahhüt", "domain": "girisim-elektrik.com.tr", "verified": ["GES mühendislik sürdürülebilir standartları", "Çevre dostu enerji ekipmanları"]},
    "GUBRF": {"name": "Gübre Fabrikaları", "sector": "Kimya & Gübre", "domain": "gubretas.com.tr", "verified": ["Toprak analizi ile verimli gübre kullanımı", "Çevresel etki izleme raporları"]},
    "HALKB": {"name": "Halkbank", "sector": "Bankacılık & Finans", "domain": "halkbank.com.tr", "verified": ["KOBİ sürdürülebilir dönüşüm kredileri", "Sıfır atık belgesi (Platin seviye)"]},
    "ISMEN": {"name": "İş Yatırım", "sector": "Finansal Yatırım", "domain": "isyatirim.com.tr", "verified": ["Dijital portföy yönetim araçları", "Sürdürülebilirlik endeksi hisse analizi"]},
    "KARSN": {"name": "Karsan Otomotiv", "sector": "Otomotiv Sanayi", "domain": "karsan.com.tr", "verified": ["Elektrikli toplu taşıma araç üretimi", "Fabrikalarda sıfır atık yönetimi"]},
    "KCAER": {"name": "Kocaer Çelik", "sector": "Demir Çelik Sanayi", "domain": "kocaersteel.com", "verified": ["Kendi elektriğini üreten çatı GES", "Yeşil çelik üretici sertifikası"]},
    "KONTR": {"name": "Kontrolmatik Teknoloji", "sector": "Teknoloji & Enerji", "domain": "kontrolmatik.com", "verified": ["Lityum-iyon pil hücresi fabrikası yatırımı", "Akıllı şebeke ve enerji depolama"]},
    "MAGEN": {"name": "Margün Enerji", "sector": "Güneş Enerjisi", "domain": "margunenerji.com.tr", "verified": ["Yurt içi ve dışı temiz enerji yatırımı", "Yıllık CO2 azaltım sertifikasyonu"]},
    "MAVI": {"name": "Mavi Giyim", "sector": "Tekstil & Perakende", "domain": "mavi.com", "verified": ["Sürdürülebilir pamuk (BCI) kullanımı", "Su tasarruflu denim üretimi"]},
    "MPARK": {"name": "MLP Sağlık (Medical Park)", "sector": "Sağlık Hizmetleri", "domain": "medicalpark.com.tr", "verified": ["Hastanelerde enerji verimliliği", "Tıbbi atıkların güvenli yönetimi"]},
    "OTKAR": {"name": "Otokar", "sector": "Otomotiv Sanayi", "domain": "otokar.com.tr", "verified": ["Elektrikli ve alternatif yakıtlı otobüsler", "Karbon emisyonu azaltım projeleri"]},
    "OYAKC": {"name": "Oyak Çimento", "sector": "Çimento & İnşaat", "domain": "oyakcimento.com.tr", "verified": ["Düşük klinkerli çevre dostu çimento", "Atık bertarafı ve yakıt alternatifi"]},
    "SELEC": {"name": "Selçuk Ecza", "sector": "Sağlık & Dağıtım", "domain": "selcukecza.com.tr", "verified": ["Elektrikli araçlarla şehir içi lojistik", "Atık ilaç toplama ve imha standartları"]},
    "SKBNK": {"name": "Şekerbank", "sector": "Bankacılık & Finans", "domain": "sekerbank.com.tr", "verified": ["Mikro finansman ve tarım bankacılığı liderliği", "Enerji tasarrufu (EKOkredi) projeleri"]},
    "SMRTG": {"name": "Smart Güneş Teknolojileri", "sector": "Güneş Enerjisi", "domain": "smartgunes.com", "verified": ["Fotovoltaik hücre üretim tesisi yerlileştirme", "Çatı GES kurulum uzmanlığı"]},
    "SOKM": {"name": "Şok Marketler", "sector": "Perakende & Ticaret", "domain": "sokmarket.com.tr", "verified": ["Enerji verimli soğutma sistemleri", "Plastik ambalaj optimizasyonu"]},
    "TABGD": {"name": "TAB Gıda", "sector": "Hızlı Tüketim & Gıda", "domain": "tabgida.com.tr", "verified": ["Yerli ve sürdürülebilir tarım tedariki", "Atık yağların biyodizele dönüştürülmesi"]},
    "TKFEN": {"name": "Tekfen Holding", "sector": "Holding / Yatırım", "domain": "tekfen.com.tr", "verified": ["Tarımsal Ar-Ge ve biyoteknoloji yatırımları", "İnşaatta düşük karbonlu malzemeler"]},
    "TOASO": {"name": "Tofaş", "sector": "Otomotiv Sanayi", "domain": "tofas.com.tr", "verified": ["Fabrika atık geri dönüşüm oranı %99+", "Geleceğin mobilite çözümleri Ar-Ge"]},
    "TTKOM": {"name": "Türk Telekom", "sector": "Telekomünikasyon", "domain": "turktelekom.com.tr", "verified": ["Akıllı şehirler teknolojik altyapısı", "Baz istasyonlarında güneş enerjisi"]},
    "TTRAK": {"name": "Türk Traktör", "sector": "Otomotiv Sanayi", "domain": "turktraktor.com.tr", "verified": ["Faz V düşük emisyonlu motor üretimi", "Hassas tarım teknolojileri geliştirme"]},
    "TURSG": {"name": "Türkiye Sigorta", "sector": "Sigortacılık", "domain": "turkiyesigorta.com.tr", "verified": ["Katılım sigortacılığı ve sürdürülebilir fonlar", "Kağıtsız hasar süreçleri"]},
    "ULKER": {"name": "Ülker Bisküvi", "sector": "Gıda & Hızlı Tüketim", "domain": "ulker.com.tr", "verified": ["Sürdürülebilir kakao tedarik zinciri", "Fabrikalarda sıfır atık belgelendirmesi"]},
    "YKBNK": {"name": "Yapı Kredi", "sector": "Bankacılık & Finans", "domain": "yapikredi.com.tr", "verified": ["Yeşil binalar için finansman paketleri", "Karbon denkleştirme projeleri fonlaması"]},
    "ZOREN": {"name": "Zorlu Enerji", "sector": "Enerji Üretimi", "domain": "zoren.com.tr", "verified": ["Jeotermal ve rüzgar enerjisi liderliği", "Elektrikli araç şarj ağı (ZES) altyapısı"]}
}

def get_cover_image(sector: str) -> str:
    sector_lower = sector.lower()
    if "enerji" in sector_lower or "güç" in sector_lower or "trafo" in sector_lower:
        return "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=600&auto=format&fit=crop"
    elif "banka" in sector_lower or "finans" in sector_lower or "sigorta" in sector_lower or "emeklilik" in sector_lower:
        return "https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=600&auto=format&fit=crop"
    elif "otomotiv" in sector_lower or "sanayi" in sector_lower or "çelik" in sector_lower or "endüstri" in sector_lower or "havacılık" in sector_lower or "savunma" in sector_lower:
        return "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop"
    elif "taşımacılık" in sector_lower or "havayolu" in sector_lower or "havalimanı" in sector_lower or "lojistik" in sector_lower:
        return "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=600&auto=format&fit=crop"
    elif "perakende" in sector_lower or "ticaret" in sector_lower or "market" in sector_lower or "gıda" in sector_lower or "tüketim" in sector_lower:
        return "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop"
    elif "telekom" in sector_lower or "teknoloji" in sector_lower:
        return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop"
    elif "gayrimenkul" in sector_lower or "inşaat" in sector_lower:
        return "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop"
    return "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?q=80&w=600&auto=format&fit=crop"

def generate_ai_insights(ticker: str, name: str, score: float) -> str:
    if score >= 8.0:
        return f"{name} ({ticker}), yapay zeka modelimizin analizine göre çevresel etki ve sürdürülebilirlik alanında sektör lideridir. Karbon nötr hedefleri ve temiz enerji kullanımı dinamik güven skorunu en üst seviyede tutmaktadır."
    elif score >= 5.0:
        return f"{name} ({ticker}) için yapılan haber ve bildirim analizlerinde sürdürülebilirlik hedefleri olumlu olmakla birlikte, karbon ayak izi azaltma hedeflerinde geçici yavaşlamalar tespit edilmiştir. Sosyal yönetişim skoru ortalama düzeydedir."
    else:
        return f"{name} ({ticker}), ağır fosil yakıt bağımlılığı veya sosyal etki bildirimlerindeki eksiklikler nedeniyle riskli gruptadır. Yapay zeka modelimiz son 30 günde artan çevresel şikayetler tespit etmiştir."


@app.get("/api/esg/companies")
def get_esg_companies():
    """esg_tahmin.csv dosyasından verileri oku ve şirket verileriyle birleştirerek döndür."""
    import csv
    from config import DATA_DIR
    csv_path = DATA_DIR / "esg_tahmin.csv"
    
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail="ESG tahmin veritabanı (esg_tahmin.csv) bulunamadı.")
        
    companies = []
    today_str = datetime.now().strftime("%Y-%m-%d")
    try:
        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader)
            # Tarihler 1. kolondan sonrasıdır.
            dates = header[1:]

            for row in reader:
                if not row:
                    continue
                ticker = row[0]
                # En son tahmin edilen skor satırın son değeridir.
                raw_score = float(row[-1])
                score_out_of_10 = round(raw_score / 10.0, 1)

                # Toplumsal (yorum + doğrulanmış ihbar + haber) modülasyonu decay ağırlıklı hesapla
                # Not: haber önbelleği burada ağ çağrısı yapmaz (liste isteği yavaşlamasın diye);
                # tazeleme yalnızca /api/esg/news/{ticker} detay görüntülemesinde tetiklenir.
                feedback_mod = db.compute_feedback_modulation(ticker)
                audit_mod = db.compute_audit_modulation(ticker)
                news_mod = db.compute_news_modulation(ticker)

                # Bugünün snapshot'ı yoksa yaz (günlük skor geçmişi için idempotent)
                snapshot = db.upsert_score_snapshot(ticker, today_str, score_out_of_10, feedback_mod, audit_mod, news_mod)
                dynamic_score = snapshot["score"]
                total_modulation = round(feedback_mod + audit_mod + news_mod, 2)

                # 7 gün önceki skora göre gerçek artış/azalış delta'sı
                week_ago = db.get_snapshot_n_days_ago(ticker, 7)
                delta_7d = round(dynamic_score - week_ago["score"], 2) if week_ago else 0.0

                # Dinamik risk seviyesi belirleme (dinamik skora göre)
                dynamic_raw_score = dynamic_score * 10.0
                if dynamic_raw_score >= 80:
                    risk_level = "Düşük"
                elif dynamic_raw_score >= 50:
                    risk_level = "Orta"
                else:
                    risk_level = "Yüksek"

                # Eşlemelerden detaylar alınır
                details = COMPANY_DETAILS.get(ticker, {
                    "name": f"{ticker} Ticaret A.Ş.",
                    "sector": "Genel Sektör",
                    "domain": "",
                    "verified": ["Yıllık ESG raporlama uyumu", "Çevresel beyanlar doğrulanmıştır"]
                })

                # Grafik için geçmiş tahmin serisi (CSV) + gerçek günlük skor geçmişi (SQLite)
                score_history = []
                for i, date in enumerate(dates):
                    try:
                        score_history.append({
                            "date": date,
                            "score": round(float(row[i+1]) / 10.0, 1)
                        })
                    except:
                        pass

                daily_history = db.get_score_history(ticker)
                score_history.extend(daily_history)

                companies.append({
                    "ticker": ticker,
                    "name": details["name"],
                    "sector": details["sector"],
                    "domain": details["domain"],
                    "score": dynamic_score,
                    "baseScore": score_out_of_10,
                    "modulation": total_modulation,
                    "delta7d": delta_7d,
                    "riskLevel": risk_level,
                    "coverImage": get_cover_image(details["sector"]),
                    "aiInsights": generate_ai_insights(ticker, details["name"], dynamic_score),
                    "verifiedPoints": details["verified"],
                    "scoreHistory": score_history
                })
    except Exception as e:
        print(f"[HATA] esg_tahmin.csv okunurken hata oluştu: {e}")
        raise HTTPException(status_code=500, detail=f"CSV dosyası okunamadı: {str(e)}")


    return companies


# ── Dashboard ────────────────────────────────────────────────────────────────

@app.get("/api/dashboard/summary")
def dashboard_summary(ticker: Optional[str] = None):
    """Dashboard için özet metrikleri döndür (şirkete özel)."""
    meta = _load_uploads_meta(ticker)
    docs = meta.get("documents", {})

    declaration_path = get_company_declaration_path(ticker)
    report_path = get_company_report_path(ticker)
    eklenen_path = get_company_eklenen_veriler_path(ticker)

    total_docs = len([d for d in docs.values() if d.get("status") == "verified"])
    declaration_exists = declaration_path.exists()
    report_exists = report_path.exists()
    report_hash = ""
    if report_exists:
        report_hash = _compute_file_hash(report_path)

    eklenen_content = ""
    if eklenen_path.exists():
        with open(eklenen_path, "r", encoding="utf-8") as f:
            eklenen_content = f.read()

    return {
        "total_verified_documents": total_docs,
        "declaration_submitted": declaration_exists,
        "report_generated": report_exists,
        "report_hash": report_hash,
        "eklenen_veriler": eklenen_content,
        "last_updated": datetime.now().isoformat(),
    }


# ── Belge Yükleme ───────────────────────────────────────────────────────────

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    ticker: Optional[str] = Form(None),
):
    """Belge yükle ve şirkete özel sources dizinine kaydet."""
    if doc_type not in DOCUMENT_TYPE_MAP:
        raise HTTPException(
            status_code=400,
            detail=f"Geçersiz belge türü: {doc_type}. Geçerli türler: {list(DOCUMENT_TYPE_MAP.keys())}",
        )

    target_filename = DOCUMENT_TYPE_MAP[doc_type]
    company_sources_dir = get_company_sources_dir(ticker)
    target_path = company_sources_dir / target_filename

    content = await file.read()
    with open(target_path, "wb") as f:
        f.write(content)

    meta = _load_uploads_meta(ticker)
    meta["documents"][doc_type] = {
        "status": "verified",
        "original_filename": file.filename,
        "target_filename": target_filename,
        "uploaded_at": datetime.now().isoformat(),
        "size_bytes": len(content),
    }
    meta["uploads"].insert(0, {
        "filename": file.filename,
        "doc_type": doc_type,
        "uploaded_at": datetime.now().isoformat(),
        "status": "processed",
    })
    meta["uploads"] = meta["uploads"][:20]
    _save_uploads_meta(meta, ticker)

    return {
        "status": "success",
        "message": f"{file.filename} başarıyla yüklendi ve {target_filename} olarak kaydedildi.",
        "doc_type": doc_type,
        "target_filename": target_filename,
    }


@app.get("/api/documents/list")
def list_uploads(ticker: Optional[str] = None):
    """Son yüklenen dosyaların listesini (şirkete özel) döndür."""
    meta = _load_uploads_meta(ticker)
    return {"uploads": meta.get("uploads", [])}


@app.get("/api/documents/status")
def documents_status(ticker: Optional[str] = None):
    """Her belge türünün (şirkete özel) durumunu döndür."""
    meta = _load_uploads_meta(ticker)
    docs = meta.get("documents", {})

    declaration_status = "verified" if get_company_declaration_path(ticker).exists() else "not_uploaded"

    statuses = {}
    for doc_type, target_file in DOCUMENT_TYPE_MAP.items():
        if doc_type in docs:
            statuses[doc_type] = docs[doc_type]
        else:
            statuses[doc_type] = {"status": "not_uploaded"}

    statuses["declaration"] = {"status": declaration_status}

    return {"documents": statuses}


@app.delete("/api/documents/{doc_type}")
def delete_document(doc_type: str, ticker: Optional[str] = None):
    """Yüklenen bir belgeyi (fiziksel dosya + meta kaydı) kaldırır — yeniden
    yüklenebilmesi için durumu 'not_uploaded'a döner."""
    if doc_type not in DOCUMENT_TYPE_MAP:
        raise HTTPException(status_code=400, detail=f"Geçersiz belge türü: {doc_type}")

    company_sources_dir = get_company_sources_dir(ticker)
    target_path = company_sources_dir / DOCUMENT_TYPE_MAP[doc_type]
    if target_path.exists():
        target_path.unlink()

    meta = _load_uploads_meta(ticker)
    removed = meta["documents"].pop(doc_type, None)
    if removed is None:
        raise HTTPException(status_code=404, detail="Bu belge türü için yüklenmiş bir kayıt yok.")
    _save_uploads_meta(meta, ticker)

    return {"status": "success", "message": f"{doc_type} belgesi kaldırıldı."}


@app.delete("/api/documents/list/{upload_index}")
def delete_upload_log_entry(upload_index: int, ticker: Optional[str] = None):
    """'Son Yüklenen Paketler' listesindeki tek bir kaydı (sadece log girişini) kaldırır."""
    meta = _load_uploads_meta(ticker)
    uploads = meta.get("uploads", [])
    if upload_index < 0 or upload_index >= len(uploads):
        raise HTTPException(status_code=404, detail="Yükleme kaydı bulunamadı.")
    removed = uploads.pop(upload_index)
    meta["uploads"] = uploads
    _save_uploads_meta(meta, ticker)
    return {"status": "success", "removed": removed}


# ── Yönetici Anketi ──────────────────────────────────────────────────────────

@app.post("/api/declaration")
def save_declaration(data: DeclarationData, ticker: Optional[str] = None):
    """Yönetici Anketi verisini şirkete özel JSON olarak kaydet."""
    declaration_path = get_company_declaration_path(ticker)
    payload = data.model_dump(exclude_none=True)
    payload["submitted_at"] = datetime.now().isoformat()

    with open(declaration_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    return {
        "status": "success",
        "message": "Yönetici beyanı kaydedildi.",
        "path": str(declaration_path),
    }


@app.get("/api/declaration")
def get_declaration(ticker: Optional[str] = None):
    """Kayıtlı (şirkete özel) yönetici anketi verisini getir."""
    declaration_path = get_company_declaration_path(ticker)
    if not declaration_path.exists():
        return {"status": "not_found", "data": None}
    with open(declaration_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {"status": "found", "data": data}


@app.delete("/api/declaration")
def delete_declaration(ticker: Optional[str] = None):
    """Kayıtlı yönetici anketini kaldırır (yeniden doldurulabilmesi için)."""
    declaration_path = get_company_declaration_path(ticker)
    if not declaration_path.exists():
        raise HTTPException(status_code=404, detail="Kayıtlı bir yönetici beyanı yok.")
    declaration_path.unlink()
    return {"status": "success", "message": "Yönetici beyanı kaldırıldı."}


# ── TSRS Rapor Üretimi ───────────────────────────────────────────────────────

@app.post("/api/report/generate")
def generate_report(ticker: Optional[str] = None):
    """TSRS pipeline'ını doğrudan modül olarak çağırarak (şirkete özel) rapor üret."""
    if _get_report_status(ticker).status == "generating":
        raise HTTPException(status_code=409, detail="Rapor üretimi zaten devam ediyor.")

    _set_report_status(ticker, ReportStatus(
        status="generating", progress=10, message="Pipeline başlatılıyor..."
    ))

    try:
        from modules.tsrs.pipeline import run_tsrs_pipeline

        def progress_cb(filename, current_step, total_steps):
            progress_pct = int(20 + (current_step / total_steps) * 75)
            section_titles = {
                "bolum_00_baslik.md": "Kapak ve Başlık Bölümü",
                "bolum_01_rapor_hakkinda.md": "Rapor Hakkında ve Kapsam",
                "bolum_02_yonetisim.md": "Yönetişim Yapısı ve Politikalar",
                "bolum_03_strateji.md": "Sürdürülebilirlik Stratejisi",
                "bolum_04_risk_yonetimi.md": "Risk Yönetimi Süreçleri",
                "bolum_05_metrikler.md": "Metrikler, Göstergeler ve Hedefler",
                "bolum_06_muhakemeler.md": "Önemli Muhakemeler ve Varsayımlar",
                "bolum_07_ekler.md": "Ekler, Kısıtlar ve Hesaplama Metotları",
                "bolum_08_iletisim.md": "Geri Bildirim ve İletişim Kanalları",
                "bolum_09_dogrulama.md": "Güvence ve Doğrulama Beyanı"
            }
            title = section_titles.get(filename, filename)
            _set_report_status(ticker, ReportStatus(
                status="generating",
                progress=progress_pct,
                message=f"{title} oluşturuluyor ({current_step}/{total_steps})..."
            ))

        _set_report_status(ticker, ReportStatus(
            status="generating", progress=20, message="Pipeline çalıştırılıyor..."
        ))

        result = run_tsrs_pipeline(
            progress_callback=progress_cb,
            sources_dir=get_company_sources_dir(ticker),
            report_path=get_company_report_path(ticker),
            eklenen_path=get_company_eklenen_veriler_path(ticker),
        )

        if result["status"] == "error":
            _set_report_status(ticker, ReportStatus(
                status="error",
                progress=0,
                message=f"Pipeline hatası: {result.get('error', 'Bilinmeyen hata')[:500]}",
            ))
            raise HTTPException(
                status_code=500,
                detail=f"Pipeline hatası: {result.get('error', '')}",
            )

        _set_report_status(ticker, ReportStatus(
            status="completed", progress=100, message="Rapor başarıyla üretildi."
        ))

        report_path = get_company_report_path(ticker)
        return {
            "status": "success",
            "message": "TSRS raporu başarıyla üretildi.",
            "output_path": result.get("output_path"),
            "hash": _compute_file_hash(report_path) if report_path.exists() else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        _set_report_status(ticker, ReportStatus(status="error", progress=0, message=str(e)))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/report/latest")
def get_latest_report(ticker: Optional[str] = None):
    """Son üretilen (şirkete özel) TSRS raporunun içeriğini döndür."""
    report_path = get_company_report_path(ticker)
    if not report_path.exists():
        return {"status": "not_found", "content": None}

    with open(report_path, "r", encoding="utf-8") as f:
        content = f.read()

    return {
        "status": "found",
        "content": content,
        "hash": _compute_file_hash(report_path),
        "generated_at": datetime.fromtimestamp(
            report_path.stat().st_mtime
        ).isoformat(),
    }


@app.get("/api/report/status")
def report_status(ticker: Optional[str] = None):
    """Rapor üretim durumunu (şirkete özel) döndür."""
    current = _get_report_status(ticker)
    state = current.model_dump()
    if current.status == "error":
        # Hata durumunu bir kez döndürdükten sonra sıfırla (sayfa yenilenince temizlenmesi için)
        _set_report_status(ticker, ReportStatus(status="idle", progress=0, message=""))
    return state


@app.post("/api/report/verify")
def verify_report(hash_to_verify: str = Form(...), ticker: Optional[str] = Form(None)):
    """Rapor hash'ini (şirkete özel) doğrula."""
    report_path = get_company_report_path(ticker)
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Rapor dosyası bulunamadı.")

    actual_hash = _compute_file_hash(report_path)
    is_valid = actual_hash == hash_to_verify

    return {
        "is_valid": is_valid,
        "actual_hash": actual_hash,
        "provided_hash": hash_to_verify,
        "verified_at": datetime.now().isoformat(),
    }


# ── Yeşil Kredi Başvuruları (G-ROI Simülatörü → Banka Portalı) ──────────────

class CreditApplicationSubmit(BaseModel):
    ticker: Optional[str] = None
    company_name: str
    bank_name: str
    bank_rate: float
    base_rate: float
    discount_pct: float
    loan_amount: float
    loan_years: int
    monthly_payment: float
    green_credit_score: int
    decision: str
    total_capex: Optional[float] = None


class ApplicationStatusUpdate(BaseModel):
    status: str


@app.post("/api/credit-applications")
def create_credit_application(data: CreditApplicationSubmit):
    """Simülatörden seçilen banka teklifi için başvuru oluşturur. Şirketin
    o anda üretilmiş bir TSRS raporu varsa hash'i başvuruya damgalanır —
    banka tarafı bu hash'i /api/report/verify ile bağımsız doğrulayabilir."""
    report_hash = None
    if data.ticker:
        report_path = get_company_report_path(data.ticker)
        if report_path.exists():
            report_hash = _compute_file_hash(report_path)

    payload = data.model_dump()
    payload["report_hash"] = report_hash
    new_app = db.add_credit_application(payload)
    return {"status": "success", "application": new_app}


@app.get("/api/credit-applications")
def get_credit_applications():
    """Banka portalı için tüm başvuruları (en yeni en üstte) döndürür."""
    return db.list_credit_applications()


@app.get("/api/credit-applications/{app_id}")
def get_credit_application(app_id: int):
    app_data = db.get_credit_application(app_id)
    if app_data is None:
        raise HTTPException(status_code=404, detail="Başvuru bulunamadı.")
    return app_data


@app.patch("/api/credit-applications/{app_id}/status")
def update_credit_application_status(app_id: int, data: ApplicationStatusUpdate):
    """Banka tarafının başvuruyu Onaylandı/Reddedildi olarak işaretlemesi."""
    updated = db.set_credit_application_status(app_id, data.status.strip())
    if updated is None:
        raise HTTPException(status_code=404, detail="Başvuru bulunamadı.")
    return {"status": "success", "application": updated}


# ── Karbon Hesaplama & Yeşil Kredi (eski model_c) ───────────────────────────

DOCUMENT_TYPE_LABELS = {
    "sgk": "SGK Hizmet Dökümü",
    "ekb": "Enerji Kimlik Belgesi",
    "fatura": "Tüketim Faturaları",
    "mizan": "Kurumsal Bilanço/Mizan",
    "motat": "MOTAT Atık ve Su Beyanı",
    "osgb": "OSGB Raporu",
    "tasit": "Taşıt Tanıma Sistemi",
    "faaliyet": "Şirket Faaliyet Raporu",
    "sanayi_sicil": "Sanayi Sicil Belgesi",
    "kapasite_raporu": "Kapasite Raporu",
    "iso_14001": "ISO 14001 Sertifikası",
    "efatura": "e-Fatura",
}


@app.get("/api/simulator/aggregate-context")
def get_simulator_context(ticker: Optional[str] = None):
    """Yüklenen belgeler + yönetici anketinden g-ROI simülatörü için
    Model C'ye (karbon çıkarımı) beslenecek özet metni üretir."""
    company_sources_dir = get_company_sources_dir(ticker)
    declaration_path = get_company_declaration_path(ticker)
    meta = _load_uploads_meta(ticker)
    docs_meta = meta.get("documents", {})

    parts = []
    uploaded_docs = []
    seen_files = set()
    for doc_type, target_filename in DOCUMENT_TYPE_MAP.items():
        if doc_type not in docs_meta:
            continue
        if target_filename in seen_files:
            continue
        file_path = company_sources_dir / target_filename
        if not file_path.exists():
            continue
        try:
            content = file_path.read_text(encoding="utf-8").strip()
        except (UnicodeDecodeError, OSError):
            content = ""
        if not content:
            continue
        seen_files.add(target_filename)
        parts.append(f"[{DOCUMENT_TYPE_LABELS.get(doc_type, doc_type)}]\n{content}")
        uploaded_docs.append({"doc_type": doc_type, "label": DOCUMENT_TYPE_LABELS.get(doc_type, doc_type)})

    declaration_summary = None
    declaration_data = None
    if declaration_path.exists():
        with open(declaration_path, "r", encoding="utf-8") as f:
            declaration_data = json.load(f)

        sentences = []
        if declaration_data.get("employeeCount"):
            sentences.append(f"Şirkette toplam {declaration_data['employeeCount']} çalışan bulunmaktadır.")
        if declaration_data.get("annualElectricity"):
            sentences.append(f"Yıllık elektrik tüketimi {declaration_data['annualElectricity']} kWh'tir.")
        if declaration_data.get("annualNaturalGas"):
            sentences.append(f"Yıllık doğalgaz tüketimi {declaration_data['annualNaturalGas']} m³'tür.")
        if declaration_data.get("annualWater"):
            sentences.append(f"Yıllık su tüketimi {declaration_data['annualWater']} m³'tür.")
        vehicles = declaration_data.get("vehiclesCount") or {}
        vehicle_parts = [f"{count} adet {vtype}" for vtype, count in vehicles.items() if count]
        if vehicle_parts:
            sentences.append("Şirket filosunda " + ", ".join(vehicle_parts) + " bulunmaktadır.")
        if declaration_data.get("hasRenewableEnergy"):
            sentences.append("Şirket yenilenebilir enerji kaynağı kullanmaktadır.")
        if declaration_data.get("sustainabilityGoals"):
            sentences.append(f"Sürdürülebilirlik hedefleri: {declaration_data['sustainabilityGoals']}")

        if sentences:
            declaration_summary = " ".join(sentences)
            parts.append(f"[Yönetici Anketi]\n{declaration_summary}")

    return {
        "ticker": (ticker or "DEFAULT").strip().upper() or "DEFAULT",
        "has_documents": len(uploaded_docs) > 0,
        "uploaded_docs": uploaded_docs,
        "has_declaration": declaration_summary is not None,
        "declaration_summary": declaration_summary,
        "aggregated_text": "\n\n".join(parts),
    }


def _extract_activities_isolated(text: str, timeout: int = 25) -> CarbonExtractionModel:
    """extract_activities'i (Gemini LLM çağrısı) ayrı bir Python sürecinde
    çalıştırır. Aynı çağrı FastAPI'nin senkron endpoint thread havuzu
    içinde bazen süresiz askıda kalabiliyordu; izole süreç + sert timeout
    bunu önler ve zaman aşımında hızlıca mock moda düşer."""
    try:
        proc = subprocess.run(
            [sys.executable, "-m", "modules.carbon.extract_worker"],
            input=text, capture_output=True, text=True, timeout=timeout, cwd=str(BASE_DIR),
        )
        if proc.returncode == 0 and proc.stdout.strip():
            return CarbonExtractionModel(**json.loads(proc.stdout.strip()))
        print(f"[Uyarı] Karbon çıkarım süreci beklenmeyen çıktı verdi: {proc.stderr[-500:] if proc.stderr else ''}")
    except subprocess.TimeoutExpired:
        print(f"[Uyarı] Karbon aktivite çıkarımı {timeout}s içinde tamamlanamadı, mock moda düşülüyor.")
    except Exception as e:
        print(f"[Uyarı] İzole karbon çıkarım süreci hata verdi: {e}")

    return _mock_parser(text)


@app.post("/api/carbon/calculate")
def calculate_carbon(req: CalculationRequest):
    """Metin gir → karbon hesabı + Yeşil Kredi Skoru al."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Girdi metni boş olamaz.")

    try:
        # Aşama 1: Yapılandırılmış aktivite çıkarımı (izole süreçte, hang koruması ile)
        extracted_data = _extract_activities_isolated(req.text)

        # Aşama 2: Deterministik karbon hesaplama
        carbon_result = calculator.process_calculation(extracted_data)

        # Aşama 3: Yeşil Kredi Skorlama
        credit_result = calculate_green_credit(
            total_co2_tons=carbon_result["total_co2_tons"],
            ges_budget=req.ges_budget,
            ev_count=req.ev_count,
            eff_budget=req.eff_budget,
            waste_budget=req.waste_budget,
            water_budget=req.water_budget,
            loan_amount=req.loan_amount,
            loan_years=req.loan_years,
            financial_rating=req.financial_rating,
            extracted_activities=carbon_result["results"]
        )

        # Aşama 4: G-ROI Hesaplama (GreenROI.jsx uyumluluğu için)
        roi_req = ROIRequest(
            total_co2_tons=carbon_result["total_co2_tons"],
            extracted_activities=carbon_result["results"],
            investment_tl=req.investment_tl if req.investment_tl is not None else req.loan_amount,
            loan_years=req.loan_years,
            reduction_target_pct=req.reduction_target_pct if req.reduction_target_pct is not None else 30.0
        )
        groi_result = calculate_groi(roi_req)

        return {
            "status": "success",
            "total_co2_tons": carbon_result["total_co2_tons"],
            "audit_trail": carbon_result["audit_trail"],
            "extracted_activities": carbon_result["results"],
            "credit_score": {
                "green_credit_score": credit_result.green_credit_score,
                "financial_score": credit_result.financial_score,
                "environmental_score": credit_result.environmental_score,
                "cash_flow_score": credit_result.cash_flow_score,
                "decision": credit_result.decision,
                "discount_pct": credit_result.discount_pct,
                "total_capex": credit_result.total_capex,
                "carbon_reduction": credit_result.carbon_reduction,
                "new_emission": credit_result.new_emission,
                "annual_opex_savings": credit_result.annual_opex_savings,
                "groi_payback_years": credit_result.groi_payback_years,
                "audit_notes": credit_result.audit_notes
            },
            "groi": groi_result.model_dump()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sorgu işlenirken hata: {str(e)}")


# ── ESG Skor Tahmini (eski esg_pred) ────────────────────────────────────────

@app.post("/api/esg/predict")
def predict_esg(data: dict):
    """ESG Overall skorunu tahmin et."""
    try:
        from modules.esg_prediction.predictor import CompanyFeatures, ESGPredictor
        predictor = _get_esg_predictor()
        features = CompanyFeatures(**data)
        result = predictor.predict(features)
        return result.model_dump()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=f"ESG modeli yüklenemedi: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/esg/health")
def esg_health():
    """ESG model sağlık kontrolü."""
    try:
        predictor = _get_esg_predictor()
        return {
            "status": "ok",
            "model_version": "1.0.0",
            "n_features": len(predictor.features)
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}


# ── ESG Geri Bildirim Entegrasyonu ──────────────────────────────────────────

class FeedbackSubmit(BaseModel):
    userName: str
    rating: int = Field(..., ge=1, le=5)
    comment: str

def _run_nlp(comment: str) -> dict:
    try:
        analyzer = _get_nlp_analyzer()
        return analyzer.analyze(comment)
    except Exception as e:
        print(f"[UYARI] NLP analizör çalıştırılamadı: {e}")
        return {
            "sentiment": "Nötr",
            "pillar": "Environmental",
            "impact_score": 0.0,
            "explanation": "Analiz sırasında teknik bir hata oluştu."
        }

@app.get("/api/esg/feedback/{ticker}")
def get_company_feedback(ticker: str):
    """Belirli bir şirket için yapılan geri bildirimleri getir."""
    return db.list_feedback(ticker)

@app.post("/api/esg/feedback/{ticker}")
def add_company_feedback(ticker: str, data: FeedbackSubmit):
    """Belirli bir şirket için geri bildirim ekle (NLP analizinden geçirilip skor modülasyonuna dahil edilir)."""
    nlp_result = _run_nlp(data.comment)
    new_item = db.add_feedback(ticker, data.userName.strip(), data.rating, data.comment.strip(), nlp_result)
    return {"status": "success", "message": "Geri bildirim başarıyla kaydedildi.", "feedback": new_item}


@app.get("/api/esg/score-history/{ticker}")
def get_company_score_history(ticker: str):
    """Şirketin gerçek tarihli günlük ESG skor geçmişini ve son 7/30 gün delta'sını döndürür."""
    history = db.get_score_history(ticker)
    latest = db.get_latest_snapshot(ticker)
    week_ago = db.get_snapshot_n_days_ago(ticker, 7)
    month_ago = db.get_snapshot_n_days_ago(ticker, 30)
    return {
        "ticker": ticker.upper(),
        "history": history,
        "current": latest,
        "delta7d": round(latest["score"] - week_ago["score"], 2) if (latest and week_ago) else 0.0,
        "delta30d": round(latest["score"] - month_ago["score"], 2) if (latest and month_ago) else 0.0,
    }


def _company_name(ticker: str) -> str:
    details = COMPANY_DETAILS.get(ticker.upper())
    return details["name"] if details else ticker.upper()


@app.get("/api/esg/news/{ticker}")
def get_company_news(ticker: str):
    """Şirketle ilgili güvenilir kaynaklardan (Google News RSS, whitelist filtreli) çekilen
    haberleri, her birinin NLP analizi ve ESG skor etkisiyle birlikte döner. Önbellek
    NEWS_REFRESH_INTERVAL_HOURS'tan eskiyse otomatik tazelenir."""
    _ensure_fresh_news(ticker, _company_name(ticker))
    return db.list_news(ticker)


@app.post("/api/esg/news/{ticker}/refresh")
def refresh_company_news(ticker: str):
    """Haber önbelleğini yaş sınırını yok sayarak zorla yeniler (manuel tetikleme).
    Sadece yeni (henüz kayıtlı olmayan) haberler analiz edilir."""
    try:
        added, fetched = _fetch_and_store_news(ticker, _company_name(ticker))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Haber servisi şu anda ulaşılamıyor: {e}")
    return {"status": "success", "fetched": fetched, "added": added, "news": db.list_news(ticker)}


# ── Toplumsal Denetim (Public Audit) Entegrasyonu ─────────────────────────────

class AuditSubmit(BaseModel):
    ticker: Optional[str] = None
    company: str
    category: str
    description: str

class AuditStatusUpdate(BaseModel):
    status: str

@app.get("/api/public-audits")
def get_public_audits(ticker: Optional[str] = None):
    """Tüm toplumsal denetim ihbarlarını (opsiyonel ticker filtresiyle) getir."""
    return db.list_audits(ticker)

@app.post("/api/public-audits")
def add_public_audit(data: AuditSubmit):
    """Yeni bir ihlal bildirme ve kaydetme. Açıklama NLP ile analiz edilir; skoru etkilemesi için ayrıca doğrulanması gerekir."""
    nlp_result = _run_nlp(data.description)
    new_item = db.add_audit(data.ticker, data.company.strip(), data.category.strip(), data.description.strip(), nlp_result)
    return {"status": "success", "message": "Bildirim başarıyla kaydedildi.", "audit": new_item}

@app.post("/api/public-audits/{audit_id}/upvote")
def upvote_public_audit(audit_id: int):
    """Bir ihbarı upvote et."""
    try:
        new_count = db.upvote_audit(audit_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="İhbar bulunamadı.")
    return {"status": "success", "upvotes": new_count}

@app.patch("/api/public-audits/{audit_id}/status")
def update_public_audit_status(audit_id: int, data: AuditStatusUpdate):
    """İhbar durumunu günceller (moderasyon). Sadece 'Doğrulandı...' statüsüne geçenler ESG skor
    modülasyonuna dahil edilir — böylece doğrulanmamış ihbarların skoru manipüle etmesi engellenir."""
    try:
        updated = db.set_audit_status(audit_id, data.status.strip())
    except KeyError:
        raise HTTPException(status_code=404, detail="İhbar bulunamadı.")
    return {"status": "success", "audit": updated}


# ─── Çalıştırma ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
