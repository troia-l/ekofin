# EkoFin Proje Doküman ve Dizin Haritası

Bu kılavuz, EkoFin projesindeki tüm veri setlerinin, OCR belgelerinin, ayrıştırma talimatlarının, TSRS raporlama şablonlarının ve proje modüllerinin dosya yollarını ve işlevlerini haritalandırır.

> **Tek Doğruluk Kaynağı (Single Source of Truth) İlkesi:**  
> Sistemde çalışan tüm veri dosyaları, OCR girdi belgeleri, prompt talimatları ve üretilen raporlar **sadece `backend/` dizini altında** tutulmaktadır. `docs/` klasöründe sadece proje/yarışma raporları ve harici çalışma dokümanları yer alır.

---

## 1. Backend Veri ve Doküman Dizinleri

### 1.1. Kaynak Veriler ve OCR Belgeleri (`backend/data/sources/`)
Pipeline'ın şirket TSRS raporunu üretirken ve karbon hesaplamalarını yaparken okuduğu girdi belgeleridir.

| Dosya / Dizin | Açıklama |
| :--- | :--- |
| [`backend/data/sources/ekb.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/sources/ekb.md) | **Enerji Kimlik Belgesi (EKB):** Bina enerji sınıfı, primer enerji tüketimi ve yalıtım verileri (672 KB). |
| [`backend/data/sources/faturalar.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/sources/faturalar.md) | **Tüketim Faturaları:** Elektrik (kWh), doğalgaz (m³) ve su tüketim/maliyet kayıtları. |
| [`backend/data/sources/mizan.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/sources/mizan.md) | **Mizan ve Finansal Tablolar:** Yeşil Capex yatırımları, Ar-Ge harcamaları, çevre cezaları ve enerji maliyetleri. |
| [`backend/data/sources/motat-atik-ve-su-beyani.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/sources/motat-atik-ve-su-beyani.md) | **MoTAT Atık ve Su Beyanı:** Tehlikeli/tehlikesiz atık miktarları, geri dönüşüm ve su deşarj verileri. |
| [`backend/data/sources/osgb-raporu.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/sources/osgb-raporu.md) | **İSG / OSGB Raporu:** İş kazası istatistikleri, kayıp gün sayıları ve çalışan başına İSG eğitim saatleri. |
| [`backend/data/sources/sgk_listesi.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/sources/sgk_listesi.md) | **SGK ve Personel Listesi:** Toplam çalışan, kadın yönetici oranı, engelli çalışan ve yaş dağılımı. |
| [`backend/data/sources/tasit-tanima-sistemi.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/sources/tasit-tanima-sistemi.md) | **Taşıt Tanıma Sistemi (TTS):** Araç filosu, benzin/motorin tüketimleri (Kapsam 1 Mobil Yanma). |
| [`backend/data/sources/yönetici-beyan-formu.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/sources/yönetici-beyan-formu.md) | **Yönetici Beyanı:** Yönetim kurulu sürdürülebilirlik yapısı, iklim hedefleri ve sertifikalar (ISO 14001 vb.). |
| [`backend/data/sources/şirket-faliyet-raporu.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/sources/şirket-faliyet-raporu.md) | **Şirket Faaliyet Raporu:** Şirket künyesi, iş modeli, NACE kodu ve kurumsal profil verileri. |
| [`backend/data/sources/ASELS/`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/sources/ASELS/) | **ASELS Özel Verileri:** ASELS için sisteme yüklenen tüm OCR belgeleri ve `_uploads_meta.json`. |
| [`backend/data/sources/TOASO/`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/sources/TOASO/) | **TOASO Özel Verileri:** TOASO için sisteme yüklenen belgeler ve `_uploads_meta.json`. |

---

### 1.2. LLM Ayrıştırma Talimatları ve Veri Şemaları (`backend/data/instructions/`)
Belgelerden veri çeken LangChain / LLM extraction ajanlarının kullandığı prompt şablonları ve veri çıkarma kurallarıdır.

| Dosya | Açıklama |
| :--- | :--- |
| [`backend/data/instructions/veri_cikarma_semasi_blueprint.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/instructions/veri_cikarma_semasi_blueprint.md) | **Master Veri Çıkarma Şeması (Data Blueprint):** 9 belgeden çekilecek tüm alanların, değişken isimlerinin ve tiplerinin ana referans dokümanı. |
| [`backend/data/instructions/enerji_kimlik_belgesi_instruction.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/instructions/enerji_kimlik_belgesi_instruction.md) | EKB belgeleri için özel OCR ve alan ayrıştırma talimatı. |
| [`backend/data/instructions/kurumsal_bilanco_mizan_instruction.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/instructions/kurumsal_bilanco_mizan_instruction.md) | Mizan ve bilanço kayıtları için muhasebe hesap kodu parse talimatı. |
| [`backend/data/instructions/sgk_hizmet_dokumu_instruction.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/instructions/sgk_hizmet_dokumu_instruction.md) | SGK bordro dökümleri ve demografi metrikleri çıkarma talimatı. |
| [`backend/data/instructions/tuketim_faturalari_instruction.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/instructions/tuketim_faturalari_instruction.md) | Elektrik/doğalgaz/su faturalarından tüketim ve reaktif ceza ayrıştırma talimatı. |
| [`backend/data/instructions/ocr_kullanim_rehberi.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/instructions/ocr_kullanim_rehberi.md) | Belge tarama, OCR pipeline'ı ve veri çıkarma kullanım rehberi. |

---

### 1.3. Şablonlar ve Karşılaştırma Belgeleri (`backend/data/templates/` & `benchmarks/`)

| Dosya | Açıklama |
| :--- | :--- |
| [`backend/data/templates/TSRS_Uyumlu_Sablon.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/templates/TSRS_Uyumlu_Sablon.md) | **Resmi TSRS Rapor Şablonu:** KGK Türkiye Sürdürülebilirlik Raporlama Standartları (TSRS 1 Genel ve TSRS 2 İklim) ile uyumlu 10 ana bölümden oluşan ana şablon. |
| [`backend/data/benchmarks/ornek_tsrs_raporu.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/data/benchmarks/ornek_tsrs_raporu.md) | **Referans TSRS Benchmark Raporu:** LLM'in stil ve derinlik karşılaştırması yapması için tam teşekküllü örnek TSRS raporu. |

---

### 1.4. Dinamik Çıktılar ve Üretilen Raporlar (`backend/output/`)

| Dizin / Dosya | Açıklama |
| :--- | :--- |
| [`backend/output/talimatlar/`](file:///c:/Users/emreo/Desktop/ekofin/backend/output/talimatlar/) | Ana şablonun pipeline tarafından dinamik parçalandığı 10 bölüm talimatı (`bolum_00_baslik.md` ... `bolum_09_dogrulama.md`). |
| [`backend/output/ASELS/TSRS_Uyumlu_Surdurulebilirlik_Raporu.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/output/ASELS/TSRS_Uyumlu_Surdurulebilirlik_Raporu.md) | ASELS için pipeline tarafından üretilmiş nihai TSRS sürdürülebilirlik raporu. |
| [`backend/output/ASELS/eklenen_veriler.md`](file:///c:/Users/emreo/Desktop/ekofin/backend/output/ASELS/eklenen_veriler.md) | Rapora işlenen doğrulanmış veri özeti ve tutarlılık beyanı. |

---

## 2. Yapay Zeka Model Eğitim Laboratuvarı (`esg-model/`)
XGBoost Track B ESG tahmin modelinin sıfırdan eğitildiği, değerlendirildiği ve SHAP analizlerinin yapıldığı Ar-Ge çalışma alanıdır.

| Dosya | Açıklama |
| :--- | :--- |
| [`esg-model/veriseti_01_doldurulmus.csv`](file:///c:/Users/emreo/Desktop/ekofin/esg-model/veriseti_01_doldurulmus.csv) | 11.000 satırlık ana model eğitim panel veri seti. |
| [`esg-model/esg_pipeline.py`](file:///c:/Users/emreo/Desktop/ekofin/esg-model/esg_pipeline.py) | Veri analizi, XGBoost/LightGBM eğitimi, hiperparametre optimizasyonu ve SHAP hesaplama hattı. |
| `esg-model/*.png` | Model performans ve açıklanabilirlik grafikleri (`shap_summary.png`, `shap_bar.png`, `eval_residuals.png`, `eda_correlation.png`, `eda_target.png`). |
| [`esg-model/track_b_features.json`](file:///c:/Users/emreo/Desktop/ekofin/esg-model/track_b_features.json) | Modelin kullandığı 30 girdi özniteliğinin listesi. |

---

## 3. Dokümantasyon ve Araştırma Klasörü (`docs/`)
Harici yarışma raporları, teknik notlar ve sunum hazırlık dosyaları:

- [`docs/EkoFin Sistem ve Arayüz Tasarım Raporu (2).pdf`](file:///c:/Users/emreo/Desktop/ekofin/docs/EkoFin%20Sistem%20ve%20Aray%C3%BCz%20Tasar%C4%B1m%20Raporu%20(2).pdf): Sistem mimarisi ve arayüz tasarım raporu.
- [`docs/Finansal_Teknolojiler_Türkçe_ÖDR_Şablon_6Wfrb (2).docx`](file:///c:/Users/emreo/Desktop/ekofin/docs/Finansal_Teknolojiler_T%C3%BCrk%C3%A7e_%C3%96DR_%C5%9Eablon_6Wfrb%20(2).docx): TEKNOFEST Finansal Teknolojiler Ön Değerlendirme Raporu şablonu.
- [`docs/ESG_Yesil_Finans_Raporu.docx`](file:///c:/Users/emreo/Desktop/ekofin/docs/ESG_Yesil_Finans_Raporu.docx): ESG ve yeşil finansman araştırma raporu.
- [`docs/ön_rapor_0.1.docx`](file:///c:/Users/emreo/Desktop/ekofin/docs/%C3%B6n_rapor_0.1.docx): Proje ön rapor çalışma dokümanı.
- [`docs/detaylı kaynak.txt`](file:///c:/Users/emreo/Desktop/ekofin/docs/detayl%C4%B1%20kaynak.txt): Akademik ESG literatürü ve kaynakça havuzu.
- [`docs/esg formülize.txt`](file:///c:/Users/emreo/Desktop/ekofin/docs/esg%20form%C3%BClize.txt): DD-ESG modeli matematik formülleri özeti.

---

## 4. Kullanıcı Arayüzleri (Frontend)

- **Web Frontend:** [`frontend/`](file:///c:/Users/emreo/Desktop/ekofin/frontend/) (React + Vite + Tailwind/Custom CSS kurumsal web paneli)
- **Mobil Frontend:** [`frontend-mobile/`](file:///c:/Users/emreo/Desktop/ekofin/frontend-mobile/) (React Native + Expo tabanlı mobil uygulama)

---

## 5. Sunum ve İş Modeli Dokümanları (`sunum/`)

- [`sunum/tam-sam-som.md`](file:///c:/Users/emreo/Desktop/ekofin/sunum/tam-sam-som.md): Pazar büyüklüğü analizi (TAM, SAM, SOM).
- [`sunum/rakip_analizi_slayti_outline.md`](file:///c:/Users/emreo/Desktop/ekofin/sunum/rakip_analizi_slayti_outline.md): Yerli ve yabancı ESG rakipleri karşılaştırması.
- [`sunum/satis_kanallari_slayti_outline.md`](file:///c:/Users/emreo/Desktop/ekofin/sunum/satis_kanallari_slayti_outline.md): B2B SaaS ve banka/fon entegrasyonu gelir modeli.
- [`sunum/ekofin_sunum_alternatifleri.md`](file:///c:/Users/emreo/Desktop/ekofin/sunum/ekofin_sunum_alternatifleri.md): Sunum varyasyonları ve senaryolar.

---

## 6. Ana Mimari Dokümanları (Kök Dizin)

- [`EKOFIN_MIMARI_VE_TEKNIK_TASARIM_DOKUMANI.md`](file:///c:/Users/emreo/Desktop/ekofin/EKOFIN_MIMARI_VE_TEKNIK_TASARIM_DOKUMANI.md): Sistem mimarisi, yapay zeka modelleri (XGBoost + LLM + OCR), formüller ve kurumsal standartların akademik/sektörel teknik tasarım dokümanı.
- [`README.md`](file:///c:/Users/emreo/Desktop/ekofin/README.md): Hızlı başlangıç, kurulum adımları ve modül özetleri.
- [`YAPILACAKLAR_8_9_10_DETAYLI_PLAN.md`](file:///c:/Users/emreo/Desktop/ekofin/YAPILACAKLAR_8_9_10_DETAYLI_PLAN.md): KAP-XGBoost entegrasyonu, Model Kartı, TSRS ESG entegrasyonu ve G-ROI simülatör planı.
