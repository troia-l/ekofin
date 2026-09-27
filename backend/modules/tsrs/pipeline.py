"""
TSRS Modülü — Sürdürülebilirlik Raporu Üretim Pipeline'ı
LangChain + GPT ile bölüm bölüm TSRS uyumlu rapor üretir.

Taşındı: TSRS_Rapor/aiagent/run_pipeline.py → modules/tsrs/pipeline.py
Değişiklikler: Tüm hardcoded yollar config.py'ye taşındı.
"""

import os
import re
import traceback
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from config import (
    BASE_DIR, SOURCES_DIR, INSTRUCTIONS_DIR, TEMPLATES_DIR,
    BENCHMARKS_DIR, TALIMATLAR_DIR, REPORT_OUTPUT_PATH,
    EKLENEN_VERILER_PATH, TEMPLATE_PATH, BENCHMARK_PATH,
    INSTRUCTION_MAP,
)

# .env dosyasını backend kök dizininden yükle
load_dotenv(dotenv_path=BASE_DIR / ".env")

# Lazy-init: API key olmadan import hatası vermemesi için veya mock modu
_model = None

def _get_model():
    global _model
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key.strip() == "" or api_key.startswith("YOUR_") or api_key == "mock":
        return "mock"
    
    if _model is None:
        try:
            _model = ChatOpenAI(
                model=os.getenv("OPENAI_TSRS_MODEL", "gpt-5.4"),
                temperature=0,
                openai_api_key=api_key,
                openai_api_base=os.getenv("OPENAI_API_BASE") or None,
            )
        except Exception as e:
            print(f"[!] ChatOpenAI başlatılamadı: {e}. Mock moduna geçiliyor.")
            return "mock"
    return _model

# ============================================================
# SECTION → SOURCE MAPPING
# ============================================================
SECTION_SOURCE_MAP = {
    "bolum_00_baslik.md": [
        "şirket-faliyet-raporu.md",
        "yonetici_anketi.json",
        "sanayi_sicil.json",
    ],
    "bolum_01_rapor_hakkinda.md": [
        "şirket-faliyet-raporu.md",
        "yonetici_anketi.json",
        "mizan.md",
        "sgk_listesi.md",
    ],
    "bolum_02_yonetisim.md": [
        "şirket-faliyet-raporu.md",
        "yonetici_anketi.json",
        "iso_14001.json",
        "sgk_listesi.md",
    ],
    "bolum_03_strateji.md": [
        "şirket-faliyet-raporu.md",
        "yonetici_anketi.json",
        "kapasite_raporu.json",
        "mizan.md",
        "faturalar.md",
        "motat-atik-ve-su-beyani.md",
        "ekb.md",
        "osgb-raporu.md",
    ],
    "bolum_04_risk_yonetimi.md": [
        "şirket-faliyet-raporu.md",
        "yonetici_anketi.json",
        "iso_14001.json",
        "osgb-raporu.md",
        "ekb.md",
        "faturalar.md",
    ],
    "bolum_05_metrikler.md": [
        "hesaplanan_metrikler.md",
        "faturalar.md",
        "mizan.md",
        "tasit-tanima-sistemi.md",
        "motat-atik-ve-su-beyani.md",
        "sgk_listesi.md",
        "ekb.md",
        "şirket-faliyet-raporu.md",
        "kapasite_raporu.json"
    ],
    "bolum_06_muhakemeler.md": [
        "mizan.md",
        "faturalar.md",
        "tasit-tanima-sistemi.md",
        "yonetici_anketi.json"
    ],
    "bolum_07_ekler.md": [
        "şirket-faliyet-raporu.md",
        "yonetici_anketi.json",
    ],
    "bolum_08_iletisim.md": [
        "şirket-faliyet-raporu.md",
        "yonetici_anketi.json",
    ],
    "bolum_09_dogrulama.md": [
        "şirket-faliyet-raporu.md",
    ],
}

# ============================================================
# HELPERS
# ============================================================

def is_pdf_file(file_path):
    try:
        with open(file_path, "rb") as f:
            return f.read(4) == b"%PDF"
    except Exception:
        return False

def load_file_content_safe(file_path):
    file_path = Path(file_path)
    if not file_path.exists():
        return ""
    
    # 1. PDF Check
    if is_pdf_file(file_path):
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            text_parts = []
            for i, page in enumerate(reader.pages):
                text_parts.append(f"--- Sayfa {i+1} ---\n{page.extract_text() or ''}")
            return "\n".join(text_parts)
        except Exception as e:
            print(f"Error reading PDF {file_path.name}: {e}")

    # 2. Try UTF-8
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        pass

    # 3. Try Windows-1254 / ISO-8859-9
    try:
        with open(file_path, "r", encoding="iso-8859-9") as f:
            return f.read()
    except Exception:
        pass

    # 4. Fallback with replace
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except Exception as e:
        print(f"Error reading file {file_path.name}: {e}")
        return ""

def clean_base64_noise(content):
    cleaned = re.sub(
        r'!\[.*?\]\(data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=\s\r\n]+\)',
        '[Görsel verisi kaldırıldı]', content)
    cleaned = re.sub(
        r'data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=\s\r\n]+',
        '[base64 kaldırıldı]', cleaned)
    return cleaned

def extract_and_strip_base64_images(text):
    lines = text.split('\n')
    cleaned_lines, image_lines = [], []
    for line in lines:
        if line.strip().startswith("[image") and "data:image" in line:
            image_lines.append(line)
        else:
            cleaned_lines.append(line)
    return "\n".join(cleaned_lines), "\n".join(image_lines)

def preprocess_markdown(file_path):
    content = load_file_content_safe(file_path)
    return clean_base64_noise(content)

# Aktif şirkete (ticker) göre değişen yollar — run_tsrs_pipeline çağrısının
# başında ayarlanır. Rapor üretimi tek seferde bir tane çalışabildiği için
# (bkz. api.py: 409 kilidi) global durum burada güvenlidir.
_active_sources_dir = SOURCES_DIR
_active_report_path = REPORT_OUTPUT_PATH
_active_eklenen_path = EKLENEN_VERILER_PATH


def load_source_file(filename):
    path = _active_sources_dir / filename
    if not path.exists():
        print(f"  [!] Kaynak dosya bulunamadı: {filename}")
        return ""
    print(f"  [·] Kaynak yükleniyor: {filename}")
    if filename.endswith(".json") and not is_pdf_file(path):
        return load_file_content_safe(path)
    else:
        return preprocess_markdown(path)

def get_sources_for_section(section_filename):
    """Bölüme ait kaynak dosyaları ve OCR okuma kurallarını yükler."""
    source_files = SECTION_SOURCE_MAP.get(section_filename, [])
    if not source_files:
        return "(Bu bölüm için ek kaynak dosya gerekmemektedir.)", ""
    
    parts = []
    rules = []
    for sf in source_files:
        content = load_source_file(sf)
        if content:
            parts.append(f"--- {sf} ---\n{content}\n--- SON ---\n")
        
        rule_filename = INSTRUCTION_MAP.get(sf)
        if rule_filename:
            rule_path = INSTRUCTIONS_DIR / rule_filename
            if rule_path.exists():
                with open(rule_path, "r", encoding="utf-8") as rf:
                    rules.append(f"--- {sf} İÇİN ÖZEL OCR OKUMA KURALI ---\n{rf.read()}\n")
                    
    sources_text = "\n".join(parts) if parts else "(Kaynak dosyalar yüklenemedi.)"
    rules_text = "\n".join(rules) if rules else ""
    return sources_text, rules_text


# ============================================================
# TEMPLATE SPLITTING
# ============================================================

def split_template_into_instructions():
    print(f"[*] Talimatlar dizini: {TALIMATLAR_DIR}")
    TALIMATLAR_DIR.mkdir(parents=True, exist_ok=True)

    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        template_raw = f.read()
    template_clean, base64_blocks = extract_and_strip_base64_images(template_raw)

    existing = [f for f in os.listdir(TALIMATLAR_DIR) if f.endswith(".md")]
    if len(existing) >= 10:
        print("[*] Talimatlar zaten mevcut, bölme atlanıyor.")
        return base64_blocks

    lines = template_clean.split('\n')
    idx = {}
    for i, line in enumerate(lines):
        cl = line.strip().replace('\\', '')
        for n in range(1, 10):
            if cl.startswith(f"## **{n}. "):
                idx[n] = i

    files = {
        "bolum_00_baslik.md": "\n".join(lines[:idx[1]]),
        "bolum_01_rapor_hakkinda.md": "\n".join(lines[idx[1]:idx[2]]),
        "bolum_02_yonetisim.md": "\n".join(lines[idx[2]:idx[3]]),
        "bolum_03_strateji.md": "\n".join(lines[idx[3]:idx[4]]),
        "bolum_04_risk_yonetimi.md": "\n".join(lines[idx[4]:idx[5]]),
        "bolum_05_metrikler.md": "\n".join(lines[idx[5]:idx[6]]),
        "bolum_06_muhakemeler.md": "\n".join(lines[idx[6]:idx[7]]),
        "bolum_07_ekler.md": "\n".join(lines[idx[7]:idx[8]]),
        "bolum_08_iletisim.md": "\n".join(lines[idx[8]:idx[9]]),
        "bolum_09_dogrulama.md": "\n".join(lines[idx[9]:]),
    }
    for fn, content in files.items():
        with open(TALIMATLAR_DIR / fn, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[+] Talimat yazıldı: {fn}")
    return base64_blocks


# ============================================================
# SECTION GENERATION
# ============================================================

SYSTEM_PROMPT = (
    "Sen TSRS 1 ve TSRS 2 konusunda uzmanlaşmış kıdemli bir ESG ve sürdürülebilirlik danışmanısın.\n"
    "Görevin: Verilen alt talimat dosyasındaki GEREKSİNİMLERE göre, sağlanan kaynak verileri (MD ve JSON) okuyarak "
    "Türkçe olarak son derece detaylı, profesyonel ve kurumsal bir rapor bölümü YAZMAK.\n\n"
    "KRİTİK KURALLAR:\n"
    "1. Alt talimat dosyası bir ŞABLON DEĞİL, gereksinim listesidir. Onun yapısını KESİNLİKLE kopyalama. Soru-cevap formatında yazma.\n"
    "2. Hedef: Bu bölüm için 800-1200 kelime. Derinlemesine, zengin paragraflar.\n"
    "3. SANA VERİLEN KAYNAK BELGELERİN (MD dosyaları) İÇİNDEN VERİYİ KENDİN ÇIKARACAKSIN. Eğer sana OKUMA KURALLARI (Reading Rules) verildiyse, bu belgeleri okurken o kurallardaki hatalara (OCR kaymaları, boşluklar) DİKKAT ET.\n"
    "4. Kesin veriler (JSON dosyaları, örn: Yönetici Anketi) verildiyse bunları birincil doğru kaynak kabul et.\n"
    "5. Emisyon hesabı yalnızca kaynakta açıkça verilen tüketim ve emisyon faktörü varsa yapılabilir. Faktörün kaynağını, birimini ve dönemini yaz; eksikse hesap uydurma ve veri açığı olarak belirt.\n"
    "6. KGK eşik değerlerinin altındaysa (1 Milyar TL aktif, 2 Milyar TL satış, 500 çalışan) gönüllü raporlama bağlamını açıkla.\n"
    "7. Tüm sayısal veriler kaynaklarla %100 tutarlı olmalı.\n"
    "8. Stil referansından yalnızca ton ve bölüm düzeni al; oradaki şirket adlarını, sayıları, sistemleri, doğrulama veya uyum iddialarını ASLA gerçek veri gibi kullanma.\n"
    "9. Kaynaklarda bulunmayan görsel/image etiketlerini, URL'leri, hash değerlerini, sertifikaları, portal/blokzincir doğrulamalarını ve bağımsız güvence iddialarını üretme.\n"
    "10. Başlıklarda [ZORUNLU], [OPSİYONEL] gibi etiketler OLMASIN. Temiz başlıklar yaz.\n"
    "11. Markdown code fence (```) kullanma. Her önemli sayısal iddianın sonuna kaynak dosya adını parantez içinde ekle. Kanıt yoksa 'veri sağlanmadı' de.\n"
    "12. Raporun TSRS ile tam uyumlu, denetlenmiş, onaylanmış veya resmi bir portala kaydedilmiş olduğunu iddia etme."
)

def get_mock_section_content(section_filename: str) -> str:
    mock_data = {
        "bolum_00_baslik.md": (
            "# ECOFIN SÜRDÜRÜLEBİLİRLİK BEYANI VE YEŞİL PASAPORT RAPORU\n\n"
            "**Dönem:** 2026 Yıllık Uyum Raporu  \n"
            "**Yayın Tarihi:** 23 Mayıs 2026  \n"
            "**Rapor Durumu:** Bağımsız Denetime Hazır  \n"
            "**Blokzincir Hash ID:** SHA-256 Kriptografik İmzalı\n\n"
            "Bu rapor, Türkiye Sürdürülebilirlik Raporlama Standartları (TSRS-1 Genel ve TSRS-2 İklim) kapsamında "
            "işletmenin tüm ESG (Çevresel, Sosyal, Yönetişim) metriklerini doğrulamak amacıyla üretilmiştir."
        ),
        "bolum_01_rapor_hakkinda.md": (
            "## 1. Rapor Hakkında ve Kapsam\n\n"
            "Bu beyan, işletmenin sürdürülebilirlik performansını finansal paydaşlar, bankalar ve düzenleyici kurumlar ile "
            "paylaşmak amacıyla KGK TSRS-1 standartları uyarınca hazırlanmıştır. Rapordaki tüm veriler e-Fatura entegrasyonu, "
            "SAP ERP sistemi, LOGO Tiger muhasebe kayıtları ve yasal beyanname belgelerinden (SGK listeleri vb.) "
            "otomatik olarak toplanmış ve doğrulanmıştır."
        ),
        "bolum_02_yonetisim.md": (
            "## 2. Yönetişim (TSRS-1 Uyumu)\n\n"
            "### Sürdürülebilirlik Yönetişim Yapısı\n"
            "Şirketimiz bünyesinde, sürdürülebilirlik risk ve fırsatlarının izlenmesi amacıyla yönetim kuruluna doğrudan "
            "raporlama yapan bir **Sürdürülebilirlik Komitesi** kurulmuştur. Komite, enerji verimliliği, iş sağlığı ve güvenliği, "
            "ve karbon azaltım hedeflerinin takibinden sorumludur. Sorumlu yönetici bazında yetkilendirmeler tamamlanmış olup, "
            "ESG politikaları kurumsal karar mekanizmalarına entegre edilmiştir."
        ),
        "bolum_03_strateji.md": (
            "## 3. Sürdürülebilirlik Stratejisi (TSRS-2 Uyumu)\n\n"
            "Kısa, orta ve uzun vadeli sürdürülebilirlik stratejimiz, karbon yoğunluğunu azaltmak ve kaynak verimliliğini "
            "en üst düzeye çıkarmak üzerine kuruludur. Sanayi Sicil Belgesi ve Kapasite Raporu analizine göre, üretim "
            "hatlarımızda enerji tasarruflu sistemlere geçiş planlanmaktadır. Yeşil finansman imkanlarına (Yeşil Kredi Pasaportu) "
            "erişim sağlayarak sürdürülebilir yatırımların finanse edilmesi stratejimizin merkezinde yer almaktadır."
        ),
        "bolum_04_risk_yonetimi.md": (
            "## 4. Risk Yönetimi ve Fırsatlar\n\n"
            "İklim değişikliğinin getirdiği fiziksel riskler (aşırı hava olayları, su kıtlığı) ve geçiş riskleri "
            "(karbon vergileri, sınırda karbon düzenlemeleri) risk yönetim sistemimiz kapsamında düzenli olarak izlenmektedir. "
            "EcoFin AI motoru sayesinde iklim risklerimizin finansal tablolar üzerindeki olası etkileri simüle edilmekte ve "
            "proaktif önlemler alınmaktadır."
        ),
        "bolum_05_metrikler_ve_hedefler.md": (
            "## 5. Metrikler ve Karbon Emisyon Hedefleri\n\n"
            "Şirketimizin 2026 yılı karbon ayak izi hesaplamaları IPCC (Intergovernmental Panel on Climate Change) "
            "metodolojisi kullanılarak gerçekleştirilmiştir. Sera gazı emisyon azaltım hedeflerimiz yıllık bazda %5 azaltım "
            "olarak belirlenmiştir. Yeşil enerji kullanım oranımızın artırılması bu hedeflere ulaşılmasında temel etkendir."
        ),
        "bolum_06_kapsam_1_emisyonlari.md": (
            "## 6. Kapsam 1 Doğrudan Sera Gazı Emisyonları\n\n"
            "Şirketimizin kontrolü altındaki kaynaklardan kaynaklanan doğrudan sera gazı emisyonları (mobil kaynaklar, "
            "doğalgaz tüketimi vb.) hesaplanmıştır:\n"
            "- **Toplam Kapsam 1 Emisyonu:** 15.42 tCO2e (ton karbondioksit eşdeğeri)\n"
            "- **Mobil Kaynaklar (Araç Filosu):** 7 aktif aracın yıllık akaryakıt tüketimi analiz edilmiştir.\n"
            "- **Sabit Yanma:** Isınma ve üretim süreçlerindeki doğalgaz kullanımı dahil edilmiştir."
        ),
        "bolum_07_kapsam_2_emisyonlari.md": (
            "## 7. Kapsam 2 Dolaylı Sera Gazı Emisyonları\n\n"
            "Satın alınan ve tüketilen elektrik enerjisinden kaynaklanan dolaylı sera gazı emisyonları hesaplanmıştır:\n"
            "- **Toplam Kapsam 2 Emisyonu:** 7.25 tCO2e\n"
            "- **Yıllık Elektrik Tüketimi:** IoT Enerji Analizörleri ve e-Fatura kayıtlarına göre 14,500 kWh olarak kaydedilmiştir.\n"
            "- **Emisyon Faktörü:** Türkiye elektrik şebekesi ortalama emisyon faktörleri kullanılmıştır."
        ),
        "bolum_08_sosyal_kriterler.md": (
            "## 8. Sosyal Kriterler ve İş Gücü Yapısı\n\n"
            "### Çalışan Hakları ve Çeşitlilik\n"
            "SGK Hizmet Dökümleri analizi doğrultusunda, şirketimizde **55 aktif personel** çalışmaktadır. Kadın istihdam oranı, "
            "çalışan memnuniyeti ve iş güvenliği eğitim süreleri kurumsal hedeflerimizle uyumludur. İş sağlığı ve güvenliği "
            "(İSG) standartlarına tam uyum sağlanmakta ve düzenli OSGB raporlaması yapılmaktadır."
        ),
        "bolum_09_blockchain_sertifikasyonu.md": (
            "## 9. Blokzincir ve Kriptografik Güvence Sertifikasyonu\n\n"
            "### Güvenilirlik ve Değiştirilemezlik\n"
            "Bu raporda sunulan tüm beyanlar ve ham verilerin doğruluğu, EcoFin akıllı kontratları vasıtasıyla onaylanmıştır. "
            "Raporun SHA-256 hash kodu, bağımsız denetçiler ve bankaların doğrulamasına açık olarak Green Ledger blokzincir "
            "ağına mühürlenmiştir. Bu kriptografik güvence, yeşil kredi pasaportunun uluslararası standartlarda geçerliliğini korur."
        )
    }
    return mock_data.get(section_filename, (
        f"## {section_filename.replace('_', ' ').replace('.md', '').upper()}\n\n"
        "Bu bölüm, KGK ve TSRS standartlarına uygun olarak işletmenin ilgili alandaki uyum politikalarını, ölçümlerini ve hedeflerini içermektedir. "
        "Toplam 55 çalışan ve NACE uyumu doğrultusunda ilgili veri mizanları ve yasal evraklar analiz edilmiş, herhangi bir uyumsuzluk tespit edilmemiştir."
    ))

def generate_section(section_filename, template_text, section_sources_text, reading_rules_text, style_ref, previous_sections, reporting_year):
    print(f"\n{'='*60}")
    print(f"[*] AŞAMA: {section_filename}")
    print(f"{'='*60}")

    model = _get_model()
    if model == "mock":
        import time
        time.sleep(1.0)
        return get_mock_section_content(section_filename)

    system_template = SYSTEM_PROMPT
    if reading_rules_text:
        system_template += "\n\nÖZEL OKUMA KURALLARI:\nAşağıdaki belgeleri okurken lütfen bu kurallara dikkat et:\n{reading_rules}"

    user_template = (
        "Raporlama dönemi: {reporting_year}\nBölüm: {section_filename}\n\n"
        "Bu bölümün gereksinimleri (talimat dosyası):\n{template_text}\n\n"
        "Bu bölüm için ham kaynak belgeler (MD ve JSON):\n{section_sources_text}\n\n"
        "Stil referansı (örnek rapordan):\n{style_ref}\n\n"
        "Önceki bölümler (süreklilik için):\n{previous_sections}\n\n"
        "Şimdi bu bölümün tam, detaylı, kurumsal anlatım metnini Türkçe yaz:"
    )

    prompt_messages = [
        ("system", system_template),
        ("user", user_template)
    ]

    prompt = ChatPromptTemplate.from_messages(prompt_messages)
    chain = prompt | model | StrOutputParser()
    
    invoke_args = {
        "section_filename": section_filename,
        "reporting_year": reporting_year,
        "template_text": template_text,
        "section_sources_text": section_sources_text,
        "style_ref": style_ref,
        "previous_sections": previous_sections
    }
    if reading_rules_text:
        invoke_args["reading_rules"] = reading_rules_text
        
    return chain.invoke(invoke_args)


# ============================================================
# MAIN PIPELINE
# ============================================================

def write_eklenen_veriler():
    print(f"[*] eklenen_veriler.md oluşturuluyor...")
    _active_eklenen_path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# EkoFin Eklenen ve İşlenen Veriler",
        "",
        "Sisteme giren kesin veriler (JSON kaynakları) ve taranan OCR belgeleri (MD) LLM tarafından doğrudan işlenerek rapora entegre edilmiştir.",
        "Emisyon hesaplamaları doğrudan metin üretimi aşamasında yapılmıştır."
    ]
    with open(_active_eklenen_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("[+] eklenen_veriler.md yazıldı.")


def run_tsrs_pipeline(progress_callback=None, sources_dir=None, report_path=None, eklenen_path=None, reporting_year=None):
    """
    TSRS rapor üretim pipeline'ını çalıştırır.
    sources_dir/report_path/eklenen_path verilmezse varsayılan (global, tek şirketlik)
    yollar kullanılır — şirket bazlı ayrım için api.py bu üçünü ticker'a göre geçirir.
    Returns: dict with status, output_path, error info
    """
    global _active_sources_dir, _active_report_path, _active_eklenen_path
    _active_sources_dir = sources_dir or SOURCES_DIR
    _active_report_path = report_path or REPORT_OUTPUT_PATH
    _active_eklenen_path = eklenen_path or EKLENEN_VERILER_PATH
    reporting_year = reporting_year or datetime.now().year - 1

    if _get_model() == "mock":
        return {"status": "error", "error": "OPENAI_API_KEY yapılandırılmadı; mock rapor yayımlanamaz."}

    print("=" * 60)
    print("  TSRS SÜRDÜRÜLEBİLİRLİK RAPORU ÜRETİM AKIŞI")
    print("  Model: gpt-5.4 | Doğrudan Belge Okuma Mimarisi")
    print(f"  Kaynak dizini: {_active_sources_dir}")
    print("=" * 60)

    try:
        from modules.tsrs.metrics import write_metrics_source
        try:
            metrics_path = write_metrics_source(Path(_active_sources_dir), reporting_year)
        except (OSError, ValueError) as metrics_error:
            return {"status": "error", "error": f"Deterministik metrik üretilemedi: {metrics_error}"}

        # Aşama 0: Şablon bölme
        base64_blocks = split_template_into_instructions()

        # eklenen_veriler.md yaz
        write_eklenen_veriler()

        # Stil referanslarını yükle
        print(f"\n[*] Benchmark stil referansı yükleniyor: {BENCHMARK_PATH}")
        with open(BENCHMARK_PATH, "r", encoding="utf-8") as f:
            bm = f.readlines()

        style_refs = {
            "bolum_00_baslik.md": "".join(bm[0:119]),
            "bolum_01_rapor_hakkinda.md": "".join(bm[118:199]),
            "bolum_02_yonetisim.md": "".join(bm[199:791]),
            "bolum_03_strateji.md": "".join(bm[791:1791]),
            "bolum_04_risk_yonetimi.md": "".join(bm[1791:2191]),
            "bolum_05_metrikler.md": "".join(bm[2191:2548]),
            "bolum_06_muhakemeler.md": "".join(bm[2548:2800]),
            "bolum_07_ekler.md": "".join(bm[2800:3059]),
            "bolum_08_iletisim.md": "".join(bm[3059:]),
            "bolum_09_dogrulama.md": ""
        }

        # Her bölümü sırayla üret
        generated = {}
        prev_text = ""
        sorted_files = sorted(os.listdir(TALIMATLAR_DIR))
        md_files = [f for f in sorted_files if f.endswith(".md")]
        total_steps = len(md_files)

        for idx, filename in enumerate(md_files, 1):
            if progress_callback:
                try:
                    progress_callback(filename, idx, total_steps)
                except Exception as cb_err:
                    print(f"Callback error: {cb_err}")

            with open(TALIMATLAR_DIR / filename, "r", encoding="utf-8") as f:
                template = f.read()

            sources, rules = get_sources_for_section(filename)
            style = style_refs.get(filename, "")

            text = generate_section(filename, template, sources, rules, style, prev_text, reporting_year)

            generated[filename] = text
            prev_text += f"\n\n--- {filename} ---\n{text}\n"

        # Son montaj
        print("\n[*] Nihai rapor birleştiriliyor...")
        _active_report_path.parent.mkdir(parents=True, exist_ok=True)
        parts = [generated[fn] for fn in sorted_files if fn.endswith(".md")]
        parts.append("\n\n" + metrics_path.read_text(encoding="utf-8"))
        fixture_notice = Path(_active_sources_dir) / "README_TEST.md"
        if fixture_notice.exists() and "SENTETİK TEST VERİSİ" in fixture_notice.read_text(encoding="utf-8"):
            parts.append("\n\n> **Uyarı:** Bu rapor sentetik test verisi kullanılarak üretilmiştir; gerçek bir şirket raporu veya bağımsız güvence beyanı değildir.")
        parts.append("\n\n")
        parts.append(base64_blocks)

        with open(_active_report_path, "w", encoding="utf-8") as f:
            f.write("\n".join(parts))

        print(f"\n[+] Rapor başarıyla oluşturuldu: {_active_report_path}")
        print("=" * 60)

        return {
            "status": "success",
            "output_path": str(_active_report_path),
        }

    except Exception as e:
        print(f"[!] Pipeline hatası: {e}")
        traceback.print_exc()
        return {
            "status": "error",
            "error": str(e),
        }


if __name__ == "__main__":
    run_tsrs_pipeline()
