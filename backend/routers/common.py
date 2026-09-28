"""
EkoFin Ortak Yardımcılar, Global Durum ve Paylaşılan Veri Modelleri
Router modülleri tarafından paylaşılan ortak fonksiyonlar ve nesneler.
"""

import os
import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Optional

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

# ─── Karbon Hesaplayıcı ──────────────────────────────────────────────────────
from modules.carbon.calculator import CarbonCalculator
calculator = CarbonCalculator()

# ─── ESG Modeli Lazy-Load ────────────────────────────────────────────────────
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
    Yeni haber başlıkları TEK bir LLM çağrısında toplu (batch) analiz edilir."""
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
    Ağ hatası olursa sessizce mevcut önbelleği kullanmaya devam eder."""
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

# ─── Dosya ve Meta Yardımcıları ───────────────────────────────────────────────

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

# ─── Pydantic Veri Modelleri ──────────────────────────────────────────────────

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

class FeedbackSubmit(BaseModel):
    userName: str
    rating: int = Field(..., ge=1, le=5)
    comment: str

class AuditSubmit(BaseModel):
    ticker: Optional[str] = None
    company: str
    category: str
    description: str

class AuditStatusUpdate(BaseModel):
    status: str

# ─── Global Rapor Durumu State'i ─────────────────────────────────────────────
_report_status_by_ticker: dict = {}

def _report_key(ticker: Optional[str]) -> str:
    return (ticker or "DEFAULT").strip().upper() or "DEFAULT"

def _get_report_status(ticker: Optional[str]) -> ReportStatus:
    return _report_status_by_ticker.setdefault(
        _report_key(ticker), ReportStatus(status="idle", progress=0, message="")
    )

def _set_report_status(ticker: Optional[str], status: ReportStatus):
    _report_status_by_ticker[_report_key(ticker)] = status

# ─── Şirket Bilgileri ve Yardımcılar ──────────────────────────────────────────

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

def _company_name(ticker: str) -> str:
    details = COMPANY_DETAILS.get(ticker.upper())
    return details["name"] if details else ticker.upper()
