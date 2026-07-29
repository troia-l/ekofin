### kullanılan veriler
datas = set(list({
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
}))


### 2.2 Ham Özellikler
**Finansal:**
- `Revenue`, `ProfitMargin`, `MarketCap`, `GrowthRate`

**Çevre / Operasyonel:**
- `CarbonEmissions`, `WaterUsage`, `EnergyConsumption`

**ESG Alt Skorları (yalnızca Track A'da kullanılır):**
- `ESG_Environmental`, `ESG_Social`, `ESG_Governance`

**Kategorik:**
- `Industry` (9 kategori: Consumer Goods, Energy, Finance, Healthcare, Manufacturing, Retail, Technology, Transportation, Utilities)
- `Region` (7 bölge: Africa, Asia, Europe, Latin America, Middle East, North America, Oceania)

**Hedef Değişken:**
- `ESG_Overall` (0–100 arası sürekli skor)

---

datas[0] # şirket-faliyet-raporu
- `Revenue`, `ProfitMargin`, `MarketCap`, `GrowthRate`
ESG_Social <- spor salonu açılması <- Operasyonel Verimlilik
ESG_Environmental <- teknolojik çevresel verimlilik artışı <- Ar-Ge 
bu şekilde gereken etkilerden 