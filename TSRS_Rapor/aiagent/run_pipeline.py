import os
import re
import json
import traceback
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser

load_dotenv(dotenv_path="/run/media/bera/çalışma/ekofin/.env")

WORKSPACE_DIR = "/run/media/bera/çalışma/ekofin"
AIAGENT_DIR = os.path.join(WORKSPACE_DIR, "aiagent")
TEMPLATE_PATH = os.path.join(WORKSPACE_DIR, "TSRS Uyumlu Sürdürülebilirlik Raporu Sablonu.md")
ADDED_DATA_PATH = os.path.join(WORKSPACE_DIR, "eklenen_veriler.md")
OUTPUT_REPORT_PATH = os.path.join(WORKSPACE_DIR, "TSRS_Uyumlu_Surdurulebilirlik_Raporu.md")
BENCHMARK_PATH = os.path.join(WORKSPACE_DIR, "örnek-tsrs-raporu.md")
TALIMATLAR_DIR = os.path.join(AIAGENT_DIR, "talimatlar")

model = ChatOpenAI(
    model="gpt-5.4",
    temperature=0,
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

# ============================================================
# SECTION → SOURCE MAPPING
# Her bölümün ihtiyaç duyduğu kaynak dosyalar
# ============================================================
SECTION_SOURCE_MAP = {
    "bolum_00_baslik.md": [
        "şirket-faliyet-raporu.md",
        "yönetici-beyan-formu.md",
    ],
    "bolum_01_rapor_hakkinda.md": [
        "şirket-faliyet-raporu.md",
        "yönetici-beyan-formu.md",
        "mizan.md",
        "sgk_listesi.md",
    ],
    "bolum_02_yonetisim.md": [
        "şirket-faliyet-raporu.md",
        "yönetici-beyan-formu.md",
        "sgk_listesi.md",
    ],
    "bolum_03_strateji.md": [
        "şirket-faliyet-raporu.md",
        "mizan.md",
        "faturalar.md",
        "motat-atik-ve-su-beyani.md",
        "ekb.md",
        "osgb-raporu.md",
    ],
    "bolum_04_risk_yonetimi.md": [
        "şirket-faliyet-raporu.md",
        "osgb-raporu.md",
        "ekb.md",
        "faturalar.md",
    ],
    "bolum_05_metrikler.md": [
        "faturalar.md",
        "mizan.md",
        "tasit-tanima-sistemi.md",
        "motat-atik-ve-su-beyani.md",
        "sgk_listesi.md",
        "ekb.md",
        "şirket-faliyet-raporu.md",
    ],
    "bolum_06_muhakemeler.md": [
        "mizan.md",
        "faturalar.md",
        "tasit-tanima-sistemi.md",
    ],
    "bolum_07_ekler.md": [
        "şirket-faliyet-raporu.md",
        "yönetici-beyan-formu.md",
    ],
    "bolum_08_iletisim.md": [
        "şirket-faliyet-raporu.md",
        "yönetici-beyan-formu.md",
    ],
    "bolum_09_dogrulama.md": [
        "şirket-faliyet-raporu.md",
    ],
}

# ============================================================
# HELPERS
# ============================================================

def preprocess_markdown(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
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

def load_source_file(filename):
    path = os.path.join(AIAGENT_DIR, filename)
    if not os.path.exists(path):
        print(f"  [!] Kaynak dosya bulunamadı: {filename}")
        return ""
    print(f"  [·] Kaynak yükleniyor: {filename}")
    return preprocess_markdown(path)

def get_sources_for_section(section_filename):
    """Bölüme ait kaynak dosyaları yükler ve birleştirir."""
    source_files = SECTION_SOURCE_MAP.get(section_filename, [])
    if not source_files:
        return "(Bu bölüm için ek kaynak dosya gerekmemektedir.)"
    parts = []
    for sf in source_files:
        content = load_source_file(sf)
        if content:
            parts.append(f"--- {sf} ---\n{content}\n--- SON ---\n")
    return "\n".join(parts) if parts else "(Kaynak dosyalar yüklenemedi.)"


# ============================================================
# TEMPLATE SPLITTING (sadece ilk sefer)
# ============================================================

def split_template_into_instructions():
    print(f"[*] Talimatlar dizini: {TALIMATLAR_DIR}")
    os.makedirs(TALIMATLAR_DIR, exist_ok=True)

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
        with open(os.path.join(TALIMATLAR_DIR, fn), "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[+] Talimat yazıldı: {fn}")
    return base64_blocks


# ============================================================
# AUDIT PHASE
# ============================================================

def run_audit_phase(all_sources_text):
    print("[*] Denetim ve Factsheet Aşaması...")
    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are a professional sustainability auditor specializing in TSRS.\n"
            "Analyze all source documents and compile a unified JSON factsheet.\n\n"
            "Extract: company profile, financial metrics, workforce metrics, consumption metrics, waste metrics.\n"
            "Verify billing↔ledger consistency. Calculate emissions with IPCC factors:\n"
            "- Electricity: 0.50 kg CO2e/kWh\n- Natural gas: 2.02 kg CO2e/m³\n"
            "- Diesel: 2.68 kg CO2e/L\n- Petrol: 2.31 kg CO2e/L\n\n"
            "Output ONLY a JSON with keys: 'factsheet' (dict) and 'consistency_statement' (Turkish paragraph).\n"
            "No markdown, no backticks."
        )),
        ("user", "Source Documents:\n{all_sources_text}\n\nGenerate JSON:")
    ])
    chain = prompt | model | JsonOutputParser()
    return chain.invoke({"all_sources_text": all_sources_text})


# ============================================================
# SECTION GENERATION
# ============================================================

SYSTEM_PROMPT = (
    "Sen TSRS 1 ve TSRS 2 konusunda uzmanlaşmış kıdemli bir ESG ve sürdürülebilirlik danışmanısın.\n"
    "Görevin: Verilen alt talimat dosyasındaki GEREKSİNİMLERE göre, sağlanan factsheet ve kaynak verileri kullanarak "
    "Türkçe olarak son derece detaylı, profesyonel ve kurumsal bir rapor bölümü YAZMAK.\n\n"
    "KRİTİK KURALLAR:\n"
    "1. Alt talimat dosyası bir ŞABLON DEĞİL, gereksinim listesidir. Onun yapısını, madde işaretlerini, köşeli parantezlerini "
    "([ZORUNLU], [OPSİYONEL], [Yazınız], [Değer] vb.) KESİNLİKLE kopyalama. Bunları doldurma. Bunların yerine akan, "
    "tutarlı, kurumsal anlatım paragrafları yaz. Soru-cevap formatında yazma.\n"
    "2. Hedef: Bu bölüm için 800-1200 kelime. Derinlemesine, zengin paragraflar.\n"
    "3. Hiçbir placeholder, köşeli parantez talimatı veya şablon metni bırakma.\n"
    "4. Şirket adı, NACE kodu, marka, raporlama dönemi gibi bilgileri factsheet'ten al.\n"
    "5. KGK eşik değerlerinin altındaysa (1 Milyar TL aktif, 2 Milyar TL satış, 500 çalışan) gönüllü raporlama bağlamını açıkla.\n"
    "6. Kapsam 3 muafiyeti varsa belirt.\n"
    "7. Tüm sayısal veriler factsheet ile %100 tutarlı olmalı.\n"
    "8. Stil referansındaki ton, derinlik ve kurumsal dili örnek al.\n"
    "9. ![][imageX] etiketlerini olduğu gibi koru.\n"
    "10. Bölüm 7 ise: Tam TSRS 1 ve TSRS 2 İçerik Endeksi tablolarını ve Bağımsız Denetçi Sınırlı Güvence Raporu metnini yaz.\n"
    "11. Başlıklarda [ZORUNLU], [OPSİYONEL] gibi etiketler OLMASIN. Temiz başlıklar yaz.\n"
    "12. Markdown code fence (```) kullanma."
)

def generate_section(section_filename, template_text, factsheet_json, section_sources_text, style_ref, previous_sections):
    print(f"\n{'='*60}")
    print(f"[*] AŞAMA: {section_filename}")
    print(f"{'='*60}")

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("user", (
            "Bölüm: {section_filename}\n\n"
            "Bu bölümün gereksinimleri (talimat dosyası):\n{template_text}\n\n"
            "Doğrulanmış veri seti (factsheet):\n{factsheet_json}\n\n"
            "Bu bölüm için ilgili kaynak belgeler:\n{section_sources_text}\n\n"
            "Stil referansı (örnek rapordan):\n{style_ref}\n\n"
            "Önceki bölümler (süreklilik için):\n{previous_sections}\n\n"
            "Şimdi bu bölümün tam, detaylı, kurumsal anlatım metnini Türkçe yaz:"
        ))
    ])

    chain = prompt | model | StrOutputParser()
    return chain.invoke({
        "section_filename": section_filename,
        "template_text": template_text,
        "factsheet_json": json.dumps(factsheet_json, indent=2, ensure_ascii=False),
        "section_sources_text": section_sources_text,
        "style_ref": style_ref,
        "previous_sections": previous_sections
    })


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 60)
    print("  TSRS SÜRDÜRÜLEBİLİRLİK RAPORU ÜRETİM AKIŞI")
    print("  Model: gpt-5.4 | Her bölüm ayrı aşama")
    print("=" * 60)

    # Aşama 0: Şablon bölme
    base64_blocks = split_template_into_instructions()

    # Aşama 0.5: Denetim için TÜM kaynakları oku (sadece audit için)
    print("\n[*] Denetim aşaması için tüm kaynaklar okunuyor...")
    audit_sources = []
    for fn in sorted(os.listdir(AIAGENT_DIR)):
        if fn.endswith(".md") and not fn.endswith("_ins.md") and fn != "run_pipeline.py" and not os.path.isdir(os.path.join(AIAGENT_DIR, fn)):
            content = preprocess_markdown(os.path.join(AIAGENT_DIR, fn))
            audit_sources.append(f"--- {fn} ---\n{content}\n--- SON ---\n")
    all_sources_for_audit = "\n".join(audit_sources)

    # Aşama 1: Denetim ve factsheet
    audit_result = run_audit_phase(all_sources_for_audit)
    factsheet = audit_result.get("factsheet", {})
    consistency = audit_result.get("consistency_statement", "")
    print("[+] Denetim tamamlandı.")

    # eklenen_veriler.md yaz
    write_eklenen_veriler(factsheet, consistency)

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

    # Aşama 2-11: Her bölüm kendi aşaması
    generated = {}
    prev_text = ""
    sorted_files = sorted(os.listdir(TALIMATLAR_DIR))

    for filename in sorted_files:
        if not filename.endswith(".md"):
            continue

        # Talimat dosyasını oku
        with open(os.path.join(TALIMATLAR_DIR, filename), "r", encoding="utf-8") as f:
            template = f.read()

        # BU bölüme ait kaynakları yükle
        sources = get_sources_for_section(filename)
        style = style_refs.get(filename, "")

        # Üret
        text = generate_section(filename, template, factsheet, sources, style, prev_text)

        generated[filename] = text
        prev_text += f"\n\n--- {filename} ---\n{text}\n"

    # Son montaj
    print("\n[*] Nihai rapor birleştiriliyor...")
    parts = [generated[fn] for fn in sorted_files if fn.endswith(".md")]
    parts.append("\n\n")
    parts.append(base64_blocks)

    with open(OUTPUT_REPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(parts))

    print(f"\n[+] Rapor başarıyla oluşturuldu: {OUTPUT_REPORT_PATH}")
    print("=" * 60)


def write_eklenen_veriler(factsheet, consistency):
    print(f"[*] eklenen_veriler.md yazılıyor...")
    p = factsheet.get("profile", {})
    w = factsheet.get("workforce", {})
    c = factsheet.get("consumption", {})
    e = factsheet.get("emissions", {})
    fi = factsheet.get("financial", {})
    s = factsheet.get("sustainability", {})
    lines = [
        "# EkoFin Eklenen, Hesaplanan ve Doğrulanan Veriler",
        "",
        "| Kategori | Değişken | Değer | Kaynak |",
        "| :--- | :--- | :--- | :--- |",
        f"| Profil | Unvan | {p.get('official_title', 'N/A')} | Faaliyet Raporu |",
        f"| Profil | Marka | {p.get('brand_name', 'N/A')} | Faaliyet Raporu |",
        f"| Profil | VKN | {p.get('vkn', 'N/A')} | Faaliyet Raporu |",
        f"| İstihdam | Toplam | {w.get('total_employees', 'N/A')} | SGK Listesi |",
        f"| Tüketim | Elektrik | {c.get('electricity_kwh', 'N/A')} kWh | Faturalar |",
        f"| Tüketim | Doğalgaz | {c.get('natural_gas_m3', 'N/A')} m³ | Faturalar |",
        f"| Emisyon | Kapsam 1 | {e.get('scope_1', 'N/A')} tCO2e | Hesaplama |",
        f"| Emisyon | Kapsam 2 | {e.get('scope_2', 'N/A')} tCO2e | Hesaplama |",
        f"| Emisyon | Toplam | {e.get('total_emissions', 'N/A')} tCO2e | Hesaplama |",
        f"| Finansal | Net Satış | {fi.get('net_sales', 'N/A')} TL | Mizan |",
        "",
        "## Tutarlılık Beyanı",
        f"- {consistency}",
    ]
    with open(ADDED_DATA_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("[+] eklenen_veriler.md yazıldı.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("[!] Kritik hata:")
        traceback.print_exc()
