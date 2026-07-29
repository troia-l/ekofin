"""
EkoFin Backend — Merkezi Konfigürasyon
Tüm yol sabitleri ve ortam değişkenleri burada tanımlanır.
"""

from pathlib import Path

# ─── Temel Dizin Sabitleri ──────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent                    # backend/
PROJECT_ROOT = BASE_DIR.parent                                # ekofin-1/

# ─── Veri Dizinleri ─────────────────────────────────────────────────────────
DATA_DIR = BASE_DIR / "data"
SOURCES_DIR = DATA_DIR / "sources"
INSTRUCTIONS_DIR = DATA_DIR / "instructions"
TEMPLATES_DIR = DATA_DIR / "templates"
BENCHMARKS_DIR = DATA_DIR / "benchmarks"

# ─── ML Model Dizini ────────────────────────────────────────────────────────
MODELS_DIR = BASE_DIR / "models"

# ─── Çıktı Dizinleri ────────────────────────────────────────────────────────
OUTPUT_DIR = BASE_DIR / "output"
TALIMATLAR_DIR = OUTPUT_DIR / "talimatlar"
REPORT_OUTPUT_PATH = OUTPUT_DIR / "TSRS_Uyumlu_Surdurulebilirlik_Raporu.md"
EKLENEN_VERILER_PATH = OUTPUT_DIR / "eklenen_veriler.md"

# ─── Veri Dosyaları ─────────────────────────────────────────────────────────
FACTORS_PATH = DATA_DIR / "factors.json"
DECLARATION_PATH = SOURCES_DIR / "yonetici_anketi.json"
TEMPLATE_PATH = TEMPLATES_DIR / "TSRS_Uyumlu_Sablon.md"
BENCHMARK_PATH = BENCHMARKS_DIR / "ornek_tsrs_raporu.md"
CREDITS_PATH = DATA_DIR / "credits.json"
CROWDFUNDING_PATH = DATA_DIR / "crowdfunding.json"
ESG_COMPANIES_PATH = DATA_DIR / "esg_companies.json"
ESG_FEEDBACK_PATH = DATA_DIR / "esg_feedback.json"
PUBLIC_AUDITS_PATH = DATA_DIR / "public_audits.json"

# ─── Meta Dosyaları ─────────────────────────────────────────────────────────
UPLOADS_META_PATH = BASE_DIR / "uploads_meta.json"

# ─── Şirket Bazlı (Ticker-Scoped) Yol Yardımcıları ──────────────────────────
# Portaldaki her şirket kendi belge/beyan/rapor verisini görmeli — tek bir
# paylaşılan global dosya kullanılırsa bir şirketin yüklediği belgeler diğer
# tüm şirketlerin hesabında da görünür (ve birbirinin üzerine yazılır).
def _safe_ticker(ticker: str | None) -> str:
    t = (ticker or "").strip().upper()
    return t if t else "DEFAULT"


def get_company_sources_dir(ticker: str | None) -> Path:
    d = SOURCES_DIR / _safe_ticker(ticker)
    d.mkdir(parents=True, exist_ok=True)
    return d


def get_company_declaration_path(ticker: str | None) -> Path:
    return get_company_sources_dir(ticker) / "yonetici_anketi.json"


def get_company_uploads_meta_path(ticker: str | None) -> Path:
    return get_company_sources_dir(ticker) / "_uploads_meta.json"


def get_company_output_dir(ticker: str | None) -> Path:
    d = OUTPUT_DIR / _safe_ticker(ticker)
    d.mkdir(parents=True, exist_ok=True)
    return d


def get_company_report_path(ticker: str | None) -> Path:
    return get_company_output_dir(ticker) / "TSRS_Uyumlu_Surdurulebilirlik_Raporu.md"


def get_company_eklenen_veriler_path(ticker: str | None) -> Path:
    return get_company_output_dir(ticker) / "eklenen_veriler.md"

# ─── Belge Türü → Hedef Dosya Eşlemesi ──────────────────────────────────────
DOCUMENT_TYPE_MAP = {
    "sgk": "sgk_listesi.md",
    "ekb": "ekb.md",
    "fatura": "faturalar.md",
    "mizan": "mizan.md",
    "motat": "motat-atik-ve-su-beyani.md",
    "osgb": "osgb-raporu.md",
    "tasit": "tasit-tanima-sistemi.md",
    "faaliyet": "şirket-faliyet-raporu.md",
    "sanayi_sicil": "sanayi_sicil.json",
    "kapasite_raporu": "kapasite_raporu.json",
    "iso_14001": "iso_14001.json",
    "efatura": "faturalar.md",
}

# ─── OCR Instruction Eşlemesi ────────────────────────────────────────────────
# Kaynak belge adı → instruction dosyası adı
INSTRUCTION_MAP = {
    "mizan.md": "kurumsal_bilanco_mizan_instruction.md",
    "sgk_listesi.md": "sgk_hizmet_dokumu_instruction.md",
    "ekb.md": "enerji_kimlik_belgesi_instruction.md",
    "faturalar.md": "tuketim_faturalari_instruction.md",
}
