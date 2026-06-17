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
BELGE_TARAMA_DIR = os.path.join(WORKSPACE_DIR, "BelgeTarama")

model = ChatOpenAI(
    model="gpt-5.4",
    temperature=0,
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

# ============================================================
# SECTION → SOURCE MAPPING
# Her bölümün ihtiyaç duyduğu kaynak dosyalar (MD ve JSON)
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

INSTRUCTION_MAP = {
    "mizan.md": "kurumsal_bilanco_mizan_instruction.md",
    "sgk_listesi.md": "sgk_hizmet_dokumu_instruction.md",
    "ekb.md": "enerji_kimlik_belgesi_instruction.md",
    "faturalar.md": "tuketim_faturalari_instruction.md",
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
    if filename.endswith(".json"):
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
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
            rule_path = os.path.join(BELGE_TARAMA_DIR, rule_filename)
            if os.path.exists(rule_path):
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
    "5. Tüketim verilerinden (kWh, m3, Litre) Kapsam 1 ve 2 emisyonlarını yazarken, IPCC standart faktörlerini (Elektrik: 0.50, Doğalgaz: 2.02 vb.) kullanarak arka planda hesapla ve rapor metnine dök.\n"
    "6. KGK eşik değerlerinin altındaysa (1 Milyar TL aktif, 2 Milyar TL satış, 500 çalışan) gönüllü raporlama bağlamını açıkla.\n"
    "7. Tüm sayısal veriler kaynaklarla %100 tutarlı olmalı.\n"
    "8. Stil referansındaki ton, derinlik ve kurumsal dili örnek al.\n"
    "9. ![][imageX] etiketlerini olduğu gibi koru.\n"
    "10. Başlıklarda [ZORUNLU], [OPSİYONEL] gibi etiketler OLMASIN. Temiz başlıklar yaz.\n"
    "11. Markdown code fence (```) kullanma."
)

def generate_section(section_filename, template_text, section_sources_text, reading_rules_text, style_ref, previous_sections):
    print(f"\n{'='*60}")
    print(f"[*] AŞAMA: {section_filename}")
    print(f"{'='*60}")

    prompt_messages = [
        ("system", SYSTEM_PROMPT)
    ]
    
    if reading_rules_text:
        prompt_messages.append(("system", f"ÖZEL OKUMA KURALLARI:\nAşağıdaki belgeleri okurken lütfen bu kurallara dikkat et:\n{reading_rules_text}"))

    user_content = (
        f"Bölüm: {section_filename}\n\n"
        f"Bu bölümün gereksinimleri (talimat dosyası):\n{template_text}\n\n"
        f"Bu bölüm için ham kaynak belgeler (MD ve JSON):\n{section_sources_text}\n\n"
        f"Stil referansı (örnek rapordan):\n{style_ref}\n\n"
        f"Önceki bölümler (süreklilik için):\n{previous_sections}\n\n"
        "Şimdi bu bölümün tam, detaylı, kurumsal anlatım metnini Türkçe yaz:"
    )
    prompt_messages.append(("user", user_content))

    prompt = ChatPromptTemplate.from_messages(prompt_messages)
    chain = prompt | model | StrOutputParser()
    
    return chain.invoke({})


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 60)
    print("  TSRS SÜRDÜRÜLEBİLİRLİK RAPORU ÜRETİM AKIŞI")
    print("  Model: gpt-5.4 | Doğrudan Belge Okuma Mimarisi")
    print("=" * 60)

    # Aşama 0: Şablon bölme
    base64_blocks = split_template_into_instructions()

    # eklenen_veriler.md yaz (Eski JSON bağımlılığı kalktığı için statik bilgi)
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

    # Aşama 2-11: Her bölüm kendi aşaması
    generated = {}
    prev_text = ""
    sorted_files = sorted(os.listdir(TALIMATLAR_DIR))

    for filename in sorted_files:
        if not filename.endswith(".md"):
            continue

        with open(os.path.join(TALIMATLAR_DIR, filename), "r", encoding="utf-8") as f:
            template = f.read()

        sources, rules = get_sources_for_section(filename)
        style = style_refs.get(filename, "")

        text = generate_section(filename, template, sources, rules, style, prev_text)

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


def write_eklenen_veriler():
    print(f"[*] eklenen_veriler.md oluşturuluyor...")
    lines = [
        "# EkoFin Eklenen ve İşlenen Veriler",
        "",
        "Sisteme giren kesin veriler (JSON kaynakları) ve taranan OCR belgeleri (MD) LLM tarafından doğrudan işlenerek rapora entegre edilmiştir.",
        "Emisyon hesaplamaları doğrudan metin üretimi aşamasında yapılmıştır."
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
