# 🌱 EkoFin — Yapay Zeka Destekli Yeşil Enerji Finansmanı ve Dinamik ESG Denetim Platformu

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB.svg?style=flat&logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?style=flat&logo=python)](https://www.python.org/)
[![XGBoost](https://img.shields.io/badge/ML-XGBoost%20%2B%20SHAP-orange.svg?style=flat)](https://xgboost.readthedocs.io/)
[![TSRS](https://img.shields.io/badge/Standard-KGK%20TSRS%201%20%26%202-success.svg)](https://www.kgk.gov.tr/)
[![Tests](https://img.shields.io/badge/Tests-43%20Passed-brightgreen.svg)]()

> **EkoFin**, reel sektörün (özellikle KOBİ'lerin) yeşil dönüşümünü hızlandırmak, karbon nötrlük hedeflerine ulaşılmasını sağlamak ve yeşil aklamayı (*greenwashing*) ortadan kaldırmak amacıyla geliştirilmiş **uçtan uca yapay zeka destekli sürdürülebilirlik denetimi, TSRS raporlama ve yeşil finansman karar destek platformudur.**

---

## 📌 İçindekiler

1. [Proje Vizyonu ve Çözülen Problem](#-proje-vizyonu-ve-çözülen-problem)
2. [Temel Yetenekler ve Değer Önerisi](#-temel-yetenekler-ve-değer-önerisi)
3. [Ekranlar ve İş Mantığı (Business Logic)](#-ekranlar-ve-iş-mantığı-business-logic)
   - [3.1. Halka Açık & Kurumsal Sayfalar (Public Web)](#31-halka-açık--kurumsal-sayfalar-public-web)
   - [3.2. KOBİ Portalı (Sürdürülebilirlik & Dönüşüm)](#32-kobi-portalı-sürdürülebilirlik--dönüşüm)
   - [3.3. Banka Portalı (Yeşil Kredi & Risk Değerleme)](#33-banka-portalı-yeşil-kredi--risk-değerleme)
4. [Ayrıntılı Kurulum ve Çalıştırma Rehberi](#-ayrıntılı-kurulum-ve-çalıştırma-rehberi)
   - [4.1. Sistem Gereksinimleri](#41-sistem-gereksinimleri)
   - [4.2. Backend Kurulumu ve Başlatılması](#42-backend-kurulumu-ve-başlatılması)
   - [4.3. Frontend Kurulumu ve Başlatılması](#43-frontend-kurulumu-ve-başlatılması)
   - [4.4. Ortam Değişkenleri (.env Yapılandırması)](#44-ortam-değişkenleri-env-yapılandırması)
   - [4.5. Otomatik Mock / Fallback Mekanizmaları](#45-otomatik-mock--fallback-mekanizmaları)
   - [4.6. Birim ve Entegrasyon Testleri](#46-birim-ve-entegrasyon-testleri)
5. [Proje Dizin Yapısı](#-proje-dizin-yapısı)
6. [Kullanılan Teknoloji Yığını](#-kullanılan-teknoloji-yığını)
7. [Mimari ve Teknik Tasarım Dökümanı Referansı](#-mimari-ve-teknik-tasarım-dökümanı-referansı)
8. [Lisans ve Telif Hakkı](#-lisans-ve-telif-hakkı)

---

## 🎯 Proje Vizyonu ve Çözülen Problem

### Güncel Durum ve Yapısal Kriz
1. **Regülasyon Baskısı:** Avrupa Birliği SKDM (Sınırda Karbon Düzenleme Mekanizması / CBAM) ve Türkiye'de KGK (Kamu Gözetimi Kurumu) tarafından zorunlu kılınan **TSRS 1** ve **TSRS 2** standartları, şirketlerin sürdürülebilirlik ve karbon verilerini bağımsız denetlenebilir biçimde açıklamasını şart koşmaktadır.
2. **KOBİ Engeli:** KOBİ'ler yüksek danışmanlık maliyetleri, karmaşık sera gazı hesaplama metodolojileri ve uzman eksikliği nedeniyle TSRS raporu hazırlayamamakta; ihracat pazarlarında karbon vergisi cezalarıyla karşı karşıya kalmaktadır.
3. **Finansal Uyuşmazlık ve Greenwashing:** Bankalar yeşil kredi dağıtmak istemekte ancak şirketlerin beyan ettiği çevresel iddiaları doğrulayamamakta ve yeşil aklama riskiyle karşı karşıya kalmaktadır. Yılda bir kez yayınlanan statik PDF beyanları güncel riskleri yansıtmamaktadır.

### EkoFin Çözüm Modeli
EkoFin; operasyonel kanıt belgelerini (fatura, SGK, OSGB, mizan, MOTAT) çapraz doğrulamadan geçirir, **ISO 14064 / GHG Protocol** Kapsam 1-2-3 karbon emisyonlarını hesaplar, **LangChain** orkestrasyonuyla 10 bölümlük resmi TSRS raporu üretir, **XGBoost & TreeSHAP** ile objektif ESG skoru belirler, **Fin-NLP ve Google News** ile skoru canlı haber ve doğrulanmış halk ihbarlarıyla modüle eder ve **g-ROI tekno-ekonomik simülatörü** ile yeşil yatırımlara (GES, Elektrikli Filo, Enerji Verimliliği) özel banka yeşil kredi faiz indirimi (**Greenium**) hesaplar.

---

## ⚡ Temel Yetenekler ve Değer Önerisi

* 📑 **Uçtan Uca 10 Bölümlük TSRS Raporlama:** Faturalar, mizan, SGK ve atık belgelerinden otomatik veri çekerek KGK TSRS standartlarına %100 uyumlu resmi rapor üretimi ve ReportLab tabanlı profesyonel PDF çıktısı.
* 🧮 **Kapsam 1, 2 ve 3 Karbon Muhasebesi:** Türkiye enterkonnekte şebeke katsayıları (TEİAŞ/EPDK) ve IPCC faktörleriyle hatasız sera gazı hesabı.
* 💡 **g-ROI (Green Return on Investment) Simülatörü:** Çatı GES, EV Filo ve Enerji Verimliliği projelerinde 5 bileşenli finansal getiri analizi (SKDM/Karbon Vergisi Tasarrufu, Enerji Tasarrufu, Yeşil Kredi Faiz İskontosu, Karbon Kredisi Geliri, ESG Primi) ve NPV/IRR/Amortisman hesabı.
* 🤖 **Açıklanabilir Makine Öğrenmesi (XGBoost + TreeSHAP):** 11.000+ kurumsal veri ile eğitilmiş Track B modeli sayesinde sektör ve finansal göstergelere dayalı objektif ESG tahmini ve yerel SHAP katkı analizi.
* 🛡️ **Dinamik Toplumsal Denetim (Public Audit) & Fin-NLP:** Vatandaşların çevre ihlallerini bildirebildiği, moderasyondan geçen doğrulanmış ihbarların ve Google News haberlerinin üstel zaman sönümlenmesiyle (`half-life = 30 gün`) şirket ESG skorunu anlık güncellediği canlı denetim mekanizması.
* 🏦 **Bankacılık Entegrasyonu ve Yeşil Varlık Rasyosu (GAR):** Kredi tahsis uzmanlarının firmaların kanıt zincirini, karbon azaltım oranını ve SHA-256 rapor mühürlerini tek ekranda inceleyip yeşil kredi faiz sübvansiyonunu onaylayabilmesi.

---

## 🖥️ Ekranlar ve İş Mantığı (Business Logic)

Platform üç ana portal ve kullanıcı deneyimi üzerinden inşa edilmiştir:

```text
                                 ┌─────────────────────────────────┐
                                 │       EkoFin Web Platformu      │
                                 └────────────────┬────────────────┘
                                                  │
         ┌────────────────────────────────────────┼────────────────────────────────────────┐
         │                                        │                                        │
         ▼                                        ▼                                        ▼
┌──────────────────┐                    ┌──────────────────┐                    ┌──────────────────┐
│  Halka Açık Web  │                    │   KOBİ Portalı   │                    │  Banka Portalı   │
│  (Public Portal) │                    │  (Sürdürülebilik)│                    │   (Risk & GAR)   │
└────────┬─────────┘                    └────────┬─────────┘                    └────────┬─────────┘
         │                                        │                                        │
         ├► Kurumsal Vitrin (/)                   ├► KOBİ Dashboard (/dashboard)           ├► Portföy Paneli (/bank/dashboard)
         ├► Yeşil Krediler (/credits)             ├► Veri Entegrasyonu (/integration)      └► Başvuru Detayı (/bank/applications/:id)
         ├► Kitlesel Fonlama (/crowdfunding)      ├► g-ROI Simülatörü (/simulator)
         ├► ESG Analiz & Rapor (/esg-report)      └► TSRS Raporlama (/tsrs-report)
         ├► Yeşil Başvuru Formu (/apply)
         ├► Toplumsal Denetim (/public-audit)
         └► Rol & Giriş Ekranı (/login)
```

---

### 3.1. Halka Açık & Kurumsal Sayfalar (Public Web)

#### 1. Kurumsal Vitrin (`/` veya `/corporate`)
* **İş Mantığı:** EkoFin'in vizyonunu, çözüm sunduğu küresel iklim finansmanı regülasyonlarını (TSRS, CBAM, GHG Protocol) ve sunduğu 4 temel motoru (Karbon, g-ROI, ESG Tahmini, Public Audit) tanıtır.
* **Kullanıcı Etkileşimi:** Platformun nasıl çalıştığına dair interaktif akış şemaları, platform istatistikleri ve doğrudan KOBİ/Banka girişine yönlendiren aksiyon butonları sunar.

#### 2. Yeşil Finansman ve Krediler (`/credits`)
* **İş Mantığı:** Türkiye'deki anlaşmalı bankaların (Garanti BBVA, İş Bankası, Yapı Kredi, TSKB vb.) yeşil enerji, çatı GES, enerji verimliliği ve döngüsel ekonomi kredilerini tek ekranda listeler.
* **Kullanıcı Etkileşimi:** Kredi faiz oranları, yeşil faiz indirimi (Greenium), maksimum vade ve teminat gereksinimlerini karşılaştırmalı olarak sunar; firmaların doğrudan şartları inceleyip ön başvuru yapmasını sağlar.

#### 3. Yeşil Kitlesel Fonlama (`/crowdfunding`)
* **İş Mantığı:** KOBİ ölçeğindeki yenilenebilir enerji kooperatifleri veya çevre dostu projeler için topluluk destekli kitle fonlama kampanyalarını sergiler.
* **Kullanıcı Etkileşimi:** Toplanan fon oranı, hedef bütçe, kalan süre ve projenin yıllık tahmini karbon azaltım miktarı yatırımcılara şeffaf biçimde sunulur.

#### 4. Kurumsal ESG Raporu & Derecelendirme (`/esg-report`)
* **İş Mantığı:** BIST'te işlem gören veya platforma kayıtlı şirketlerin (örn: ASELS, TOASO, EREGL) güncel ESG karnesini inceler.
* **Kullanıcı Etkileşimi:**
  * **XGBoost ESG Skoru:** Çevresel (E), Sosyal (S), Yönetişim (G) alt kırılımları.
  * **TreeSHAP Faktör Analizi:** Hangi parametrenin (Ar-Ge harcaması, su tüketimi, karbon yoğunluğu vb.) skoru kaç puan artırdığını/düşürdüğünü gösteren şelale (waterfall) grafiği.
  * **Canlı Haber Akışı:** Google News üzerinden taranıp Fin-NLP ile analiz edilmiş duygu ve etki skorları. `POST /api/esg/news/{ticker}/refresh` ile anlık canlı tazeleme ve dinamik haber modülasyonu (`db.compute_news_modulation()`) desteği.
  * **Tarihsel Skor Trendi:** Geri bildirim, doğrulanmış ihbar ve güncel haber modülasyonlarıyla oluşan dinamik zaman serisi grafiği.

#### 5. Yeşil Proje Başvuru Formu (`/apply`)
* **İş Mantığı:** İşletmelerin yeşil dönüşüm projeleri için bankalara doğrudan resmi başvuru göndermesini sağlar.
* **Kullanıcı Etkileşimi:** Proje türü (GES, Rüzgar, Biyoenerji, Yalıtım vb.), talep edilen finansman tutarı, hedeflenen karbon azaltımı ve teknik fizibilite bilgileri girilerek banka risk havuzuna iletilir.

#### 6. Halka Açık Çevre Denetimi & İhbar Paneli (`/public-audit`)
* **İş Mantığı:** Yeşil aklamayı engellemek adına vatandaşların, çalışanların ve sivil toplum kuruluşlarının çevre ihlallerini (arıtmasız atık deşarjı, kaçak filtre kullanımı, iş güvenliği kusurları) bildirdiği şeffaflık platformudur.
* **Kullanıcı Etkileşimi:**
  * **İhbar Gönderme:** Şirket adı/kodu, ihlal kategorisi ve kanıt açıklamasıyla ihbar oluşturulur. Metin anında Fin-NLP analizinden geçirilir.
  * **Topluluk Doğrulaması:** Kullanıcılar ihbarları yukarı oylayabilir (upvote).
  * **Moderatör İnceleme Akışı:** İhbarlar *İnceleniyor*, *Doğrulandı*, *Doğrulandı - Skor Düşürüldü* veya *Reddedildi* statülerine alınır. Yalnızca yetkili denetimce **doğrulanan** ihbarlar şirketin nihai ESG skorunu kalıcı olarak düşürür.

#### 7. Rol Seçimi ve Giriş Ekranı (`/login`)
* **İş Mantığı:** Geliştirme, değerlendirme ve jüri sunumlarında roller arasında kesintisiz geçiş sağlar.
* **Kullanıcı Etkileşimi:** KOBİ Yöneticisi (`TOASO - Tofaş Türk Otomobil Fabrikası`, `ASELS - Aselsan Elektronik Sanayi` veya bağımsız yeni kayıt), Banka Kredi Risk Uzmanı veya Bağımsız Kamu Denetçisi tek tıkla seçilerek ilgili oturum açılır.

---

### 3.2. KOBİ Portalı (Sürdürülebilirlik & Dönüşüm)

KOBİ Portalı, KOBİ'nin karbon ve sürdürülebilirlik yolculuğunu 4 birbirine bağlı adımda yönetir:

#### 1. KOBİ Dashboard (`/dashboard`)
* **İş Mantığı:** İşletmenin sürdürülebilirlik sağlık durumunun (Health Check) tek bakışta izlendiği komuta merkezidir.
* **Öne Çıkan Bileşenler:**
  * **Karbon Dağılım Kartları:** Toplam sera gazı emisyonu ($tCO_2e$), Kapsam 1 (Doğal gaz ve şirket filosu), Kapsam 2 (Şebeke elektriği) ve Kapsam 3 (Tedarik zinciri & atık).
  * **Dinamik ESG Skoru:** Şirketin 100 üzerinden güncel puanı ve sektördeki sıralaması.
  * **Doğrulama ve Kanıt Durumu:** Kaç belgenin yüklendiği ve doğrulandığı, yönetici beyanının durumu.
  * **Önerilen Yeşil Aksiyonlar:** Firmanın karbon yoğunluğunu düşürecek öncelikli adımlar.

#### 2. Veri Entegrasyonu & Belge Yükleme (`/integration`)
* **İş Mantığı:** İşletmenin beyanlarını resmi ve kanıtlanabilir evraklarla doğrulama merkezidir. Sisteme girilen hiçbir veri belgesiz kabul edilmez.
* **Kullanıcı Etkileşimi:**
  * **9 Resmi Belge Türü:**
    1. *Elektrik ve Doğalgaz Faturaları* (TEDAŞ/OSB/İGDAŞ fatura dökümleri)
    2. *Onaylı Mizan* (730/770 enerji ve lojistik gider hesapları)
    3. *SGK Prim ve Hizmet Listesi* (Çalışan sayısı ve sosyal hak güvencesi)
    4. *MOTAT Atık ve Su Beyanı* (Tehlikeli/tehlikesiz atık irsaliyeleri)
    5. *Taşıt Tanıma Sistemi (TTS) Ekstresi* (Akaryakıt tüketimleri)
    6. *Enerji Kimlik Belgesi (EKB)* (Bina enerji verimlilik sınıfı)
    7. *OSGB Faaliyet Raporu* (İş sağlığı ve kaza sıklık oranları)
    8. *Sanayi Sicil Belgesi* (NACE kodu ve üretim kapasitesi)
    9. *ISO 14001 / ISO 50001 Sertifikaları* (Çevre ve enerji yönetim akreditasyonu)
  * **Yönetici Çevre Beyanı Anketi:** Çalışan sayısı, araç filosu yakıt tipleri, mazeret izinleri ve çevre politikalarını içeren yapılandırılmış form.
  * **Otomatik OCR ve Çapraz Sağlama:** Yüklenen evraklar şirket dizininde saklanır, SHA-256 özeti alınır ve mizan giderleri ile fatura tutarları çapraz kontrolden geçirilir.

#### 3. g-ROI Tekno-Ekonomik Yatırım Simülatörü (`/simulator`)
* **İş Mantığı:** Sürdürülebilirlik yatırımlarını mühendislik ve finansal metriklere döken karar destek motorudur. TSRS raporundan üretilen şirket bağlamını (`simulator_contexts`) otomatik olarak içe aktarır.
* **Yatırım Senaryoları:**
  1. *Çatı GES (Güneş Enerjisi Santrali):* Yıllık elektrik tüketimi ve güneşlenme süresine göre gereken optimum kWp kapasitesi, LCOE ve şebeke mahsuplaşması.
  2. *Ticari Filo Elektrifikasyonu:* Şirket bünyesindeki fosil yakıtlı ticari araçların elektrikli araçlarla (EV) ikamesi, TCO (Toplam Sahip Olma Maliyeti) ve yakıt tasarrufu.
  3. *Endüstriyel Enerji Verimliliği:* Frekans konvertörleri (VFD), atık ısı geri kazanımı ve motor iyileştirmeleri ile elektrik tüketiminde %15-25 tasarruf.
* **5 Bileşenli Finansal Getiri Modeli:**
  $$\text{Yıllık Toplam Getiri} = \Delta_{\text{Karbon Vergisi}} + \Delta_{\text{Enerji Tasarrufu}} + \Delta_{\text{Yeşil Kredi Faizi}} + \Delta_{\text{Karbon Kredisi Geliri}} + \Delta_{\text{ESG Değerleme Primi}}$$
* **Çıktılar:** Net Bugünkü Değer (NPV), İç Verim Oranı (IRR), Amortisman Süresi (Payback), Yeşil Kredi Faiz İndirimi (**Greenium**) ve Banka Yeşil Kredi Uygunluk Skoru (0-100).

#### 4. TSRS Raporlama Sihirbazı & Canlı İşlem Hattı (`/tsrs-report`)
* **İş Mantığı:** KGK TSRS 1 (Genel Hükümler) ve TSRS 2 (İklim Standardı) uyumlu 10 bölümlük resmi sürdürülebilirlik raporunu sıfırdan üreten yapay zeka hattıdır.
* **Bölüm Yapısı:**
  * Bölüm 0: Kapak ve Şirket Kimliği
  * Bölüm 1: Rapor Hakkında ve Raporlama Sınırları
  * Bölüm 2: Yönetişim (Sürdürülebilirlik Komitesi ve Politika)
  * Bölüm 3: Strateji ve İklim Senaryoları
  * Bölüm 4: Risk Yönetimi ve Fırsatlar
  * Bölüm 5: Metrikler ve Hedefler (Kapsam 1-2-3 Emisyonları, Enerji ve Su)
  * Bölüm 6: Muhakemeler ve Belirsizlikler
  * Bölüm 7: Ekler ve Kaynak Doküman Tablosu
  * Bölüm 8: İletişim ve Beyan İmzası
  * Bölüm 9: Bağımsız Doğrulama ve Kriptografik Denetim İzi
* **Asenkron SQLite İş Kuyruğu (Job Pipeline):**
  * Rapor üretimi tetiklendiğinde `report_jobs` tablosunda benzersiz `job_id` oluşturulur.
  * Aşamalar canlı izlenir: `queued` ➔ `snapshotting` ➔ `normalizing` ➔ `generating` ➔ `validating` ➔ `publishing`.
  * Rapor tamamlandığında SHA-256 kriptografik mührü oluşturulur ve `report_versions` tablosuna yazılır.
* **Önizleme ve Dışa Aktarım:**
  * Rapor metni zengin Markdown formatında görüntülenir.
  * **PDF İndirme / Önizleme:** Backend tarafında `reportlab` kütüphanesiyle derlenen kurumsal stil şablonlu, kapak sayfalı, tablolu ve SHA-256 barkodlu resmi PDF çıktısı tek tıkla tarayıcıda açılır veya indirilir.
  * Hazır demo verisi için **ASELS 2025 Demo Raporu** tek tıkla görüntülenebilir.

---

### 3.3. Banka Portalı (Yeşil Kredi & Risk Değerleme)

#### 1. Banka Risk & Portföy Paneli (`/bank/dashboard`)
* **İş Mantığı:** Bankaların kredi tahsis uzmanları ve sürdürülebilirlik risk komiteleri için kurumsal kredi portföyünü yönetir.
* **Temel Göstergeler:**
  * Toplam yeşil kredi hacmi (₺)
  * Portföy ortalama ESG skoru ve karbon yoğunluğu ($tCO_2e / M₺$)
  * **Yeşil Varlık Rasyosu (GAR - Green Asset Ratio):** Bankanın toplam bilançosundaki AB Taksonomisi uyumlu yeşil kredilerin oranı.
  * Gelen başvurular tablosu (Firma, Talep Tutarı, Yeşil Skor, Önerilen Faiz İndirimi, Karar Durumu).

#### 2. Başvuru Detay & Yeşil Kredi Tahsis Ekranı (`/bank/applications/:id`)
* **İş Mantığı:** Belirli bir KOBİ'nin yeşil kredi başvurusunu derinlemesine inceleme ve onay/ret sürecidir.
* **Analiz Araçları:**
  * **Kriptografik Doğrulama:** Simülatörden yapılan başvuruya damgalanan TSRS raporu SHA-256 özeti, banka uzmanı tarafından `/api/report/verify` uç noktası üzerinden doğrulanır; evrakta manipülasyon yapılıp yapılmadığı bağımsız olarak teyit edilir.
  * **g-ROI Simülasyon Denetimi:** Yatırımın amortisman süresi ve firmanın karbon salımını gerçekten yüzde kaç azaltacağı kontrol edilir.
  * **Greenium Faiz İndirimi:** Şirketin yüksek yeşil skoru sayesinde standart kredi faizinden (örn: %42.0) sübvanse edilen indirimli oran (örn: %39.5) belirlenir.
  * **Kredi Onaylama/Reddetme:** Uzman açıklaması girilerek başvuru sonuçlandırılır (`PATCH /api/credit-applications/:id/status`); sonuç anında sisteme ve KOBİ ekranlarına yansır.

---

## 🚀 Ayrıntılı Kurulum ve Çalıştırma Rehberi

Platform, mikro-servis esnekliğinde tasarlanmış ancak geliştirme ve çalıştırma kolaylığı için yerel bağımlılıkları asgari düzeyde tutacak şekilde yapılandırılmıştır.

### 4.1. Sistem Gereksinimleri

| Bileşen | Asgari Sürüm | Önerilen |
|---|---|---|
| **İşletim Sistemi** | Windows 10/11, macOS 12+, Ubuntu 20.04+ | 64-bit modern OS |
| **Python** | Python 3.10.x | Python 3.10.x - 3.11.x |
| **Node.js** | Node.js v18.x | Node.js v20.x (LTS) |
| **Paket Yöneticisi**| npm v9.x+ | npm veya yarn |
| **Bellek (RAM)** | 4 GB | 8 GB+ (XGBoost ve SHAP modelleri için) |

---

### 4.2. Backend Kurulumu ve Başlatılması

Backend; FastAPI omurgası üzerinde çalışan, SQLite veri tabanı katmanı, asenkron rapor kuyruğu, makine öğrenmesi tahmincisi ve PDF motorunu barındıran servistir.

```bash
# 1. Depoyu klonlayın ve backend dizinine geçin
cd c:/Users/emreo/Desktop/ekofin/backend

# 2. Python sanal ortamını (virtual environment) oluşturun
python -m venv venv

# 3. Sanal ortamı aktif edin
# Windows için (PowerShell):
venv\Scripts\Activate.ps1
# Windows için (CMD):
venv\Scripts\activate.bat
# Linux / macOS için:
source venv/bin/activate

# 4. Gerekli Python kütüphanelerini yükleyin
pip install --upgrade pip
pip install -r requirements.txt

# 5. Ortam değişkenleri dosyasını hazırlayın
# .env.example dosyasını .env olarak kopyalayın
cp .env.example .env

# 6. Backend API sunucusunu başlatın
uvicorn api:app --reload --port 8000
```

> **Başarılı Çalıştırma:**
> Konsolda `Application startup complete.` mesajını gördükten sonra:
> * API Ana Uç Noktası: `http://localhost:8000`
> * İnteraktif Swagger UI Belgeleri: `http://localhost:8000/docs`
> * ReDoc Alternatif Dokümantasyon: `http://localhost:8000/redoc`

---

### 4.3. Frontend Kurulumu ve Başlatılması

Frontend; React 19, Vite, React Router 7 ve Lucide simgeleri ile geliştirilmiş modern, reaktif ve kurumsal web portalıdır.

```bash
# 1. Yeni bir terminal açın ve frontend dizinine geçin
cd c:/Users/emreo/Desktop/ekofin/frontend

# 2. NPM bağımlılıklarını yükleyin
npm install

# 3. Geliştirme (development) sunucusunu başlatın
npm run dev
```

> **Web Portalı Erişimi:**
> Tarayıcınızda `http://localhost:5173` adresine giderek EkoFin'i kullanmaya başlayabilirsiniz.
> *(Not: Frontend, varsayılan olarak `http://localhost:8000` adresindeki backend API ile doğrudan haberleşir).*

Üretim (Production) derlemesi almak için:
```bash
npm run build
```
*(Derlenen optimize statik dosyalar `frontend/dist/` klasörüne aktarılır).*

---

### 4.4. Ortam Değişkenleri (`backend/.env` Yapılandırması)

`backend/.env` dosyası aşağıdaki anahtarları kabul eder:

```ini
# EkoFin Backend Ortam Yapılandırması
PORT=8000
DEBUG=True

# Yapay Zeka Servis Sağlayıcıları (İsteğe Bağlı - Detaylar için aşağıya bakın)
# Google Gemini API (OpenAI Uyumluluk Modu: https://ai.google.dev/gemini-api/docs/openai?hl=tr)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_API_BASE=https://generativelanguage.googleapis.com/v1beta/openai/
GEMINI_MODEL=gemini-2.5-flash

# OpenAI API (TSRS Rapor Pipeline)
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_TSRS_MODEL=gpt-4o

# Özel NLP API Anahtarları (İsteğe Bağlı)
NLP_GEMINI_API_KEY=
NLP_OPENAI_API_KEY=

# Veritabanı ve Çalışma Dizinleri (Varsayılan olarak backend/data kullanılır)
DATA_DIR=data
OUTPUT_DIR=output
```

---

### 4.5. Otomatik Mock / Fallback Mekanizmaları

EkoFin mimarisi, **dış API'lara (OpenAI, Google Gemini) bağımlı kalmadan tam fonksiyonel çalışabilecek hibrit bir altyapıya** sahiptir:

1. **API Anahtarı Yoksa (Zero-API Fallback):**
   * `.env` dosyasında `OPENAI_API_KEY` veya `GEMINI_API_KEY` tanımlanmamışsa veya boşsa; sistem **asla çökmez**.
   * TSRS Raporlama Motoru (`modules/tsrs/pipeline.py`): Yüklenen mizan, fatura ve SGK dosyalarındaki gerçek sayısal verileri kullanarak şablon tabanlı deterministik ve tutarlı 10 bölümlük resmi rapor üretir.
   * g-ROI ve Karbon Motoru (`modules/carbon/`): TEİAŞ ve IPCC formülleriyle yerel matematiksel hesaplama motorunu devreye sokar.
   * NLP Duygu Analizörü (`modules/esg_prediction/nlp_analyzer.py`): Kural ve sözlük tabanlı finansal duygu analitiği algoritmasına geçiş yapar.
2. **API Anahtarı Tanımlandığında:**
   * LangChain orkestrasyonu GPT-4o / GPT-5.4 veya Gemini 2.5 Flash modellerini kullanarak zengin semantik muhakeme ve detaylı metinsel analizler üretir.

---

### 4.6. Birim ve Entegrasyon Testleri

Tüm motorlar, hesaplama algoritmaları, veri tabanı modelleri ve API uç noktaları kapsamlı bir **Pytest** test paketi ile korunmaktadır:

```bash
cd c:/Users/emreo/Desktop/ekofin/backend

# Tüm test paketini çalıştırın (43 test)
pytest tests/ -v
```

**Test Kapsamı:**
* `test_carbon.py`: Kapsam 1-2 elektrik ve yakıt emisyonları, ton dönüşümleri, g-ROI matematiksel doğrulukları ve yeşil kredi iskonto limitleri.
* `test_config.py`: Çoklu şirket yolları, güvenli dosya adlandırma (safe ticker) ve belge türü bütünlüğü.
* `test_database.py`: SQLite tabloları, ihbar oylama, durum güncellemeleri, doğrulanmamış ihbarların skoru etkilememesi kuralı.
* `test_esg_prediction.py`: XGBoost Track B tahmin doğrulaması, TreeSHAP yerel katkı hesabı, Fin-NLP kural tabanlı duygu analizi ve KAP veri yükleyicisi.
* `test_esg_credibility.py`: Dış kanıt tekilleştirme (deduplication), regülasyon ihlali tespiti ve iddia-kanıt çelişki analizi.
* `test_report_pipeline.py`: TSRS hazır bulunuşluk kontrolü (readiness), asenkron iş kuyruğu (job queue) ve çakışma (conflict) yönetimi.
* `test_tsrs_metrics.py`: Deterministik KOBİ metriklerinin doğrulanması.

---

## 📂 Proje Dizin Yapısı

```text
ekofin/
├── backend/                              # Merkezi FastAPI Backend ve Motorlar
│   ├── api.py                            # Ana API Giriş Noktası & Gateway
│   ├── config.py                         # Şirket dizinleri, yollar ve dosya haritaları
│   ├── database.py                       # SQLite Veritabanı (İhbarlar, Geri Bildirim, Rapor Kuyruğu)
│   ├── requirements.txt                  # Python kütüphaneleri (FastAPI, LangChain, XGBoost, ReportLab vb.)
│   ├── data/                             # Sistem veri katmanı
│   │   ├── ekofin.db                     # Kalıcı SQLite veri tabanı
│   │   ├── demo/                         # ASELS 2025 sentetik demo TSRS raporu
│   │   ├── factors/                      # IPCC & TEİAŞ elektrik ve yakıt emisyon faktörleri
│   │   └── sources/                      # Şirket bazlı yükleme dizinleri (Sources/TOASO, Sources/ASELS vb.)
│   ├── models/                           # Eğitilmiş ML Modelleri
│   │   ├── esg_model_trackB.pkl          # XGBoost ESG Regresyon Modeli
│   │   └── esg_features_trackB.pkl       # Eğitilmiş Model Öznitelik Listesi
│   ├── modules/                          # Temel İş ve Mühendislik Modülleri
│   │   ├── carbon/                       # Kapsam 1-2-3 Karbon Muhasebesi & g-ROI Motoru
│   │   │   ├── calculator.py             # GHG Protocol emisyon hesabı
│   │   │   ├── extractor.py              # Belge içi aktivite çıkarma
│   │   │   └── roi.py                    # 5 bileşenli g-ROI, NPV/IRR ve Greenium hesabı
│   │   ├── tsrs/                         # KGK TSRS Raporlama İşlem Hattı
│   │   │   ├── pipeline.py               # 10 bölümlük LangChain & Mock rapor motoru
│   │   │   ├── job_service.py            # Asenkron SQLite iş kuyruğu ve durum makinesi
│   │   │   ├── pdf_export.py             # ReportLab destekli kurumsal PDF derleyici
│   │   │   └── metrics.py                # Deterministik şirket metrikleri hesabı
│   │   ├── esg_prediction/               # Makine Öğrenmesi & NLP Modülü
│   │   │   ├── predictor.py              # XGBoost tahmin motoru ve TreeSHAP explainer
│   │   │   ├── nlp_analyzer.py           # Fin-NLP duygu ve pillar sınıflandırıcı
│   │   │   ├── news_fetcher.py           # Google News RSS akış yöneticisi
│   │   │   └── kap_loader.py             # KAP ve sentetik finansal rasyo yükleyici
│   │   └── esg_credibility/              # ESG İddia & Kanıt Güvenilirlik Analitiği
│   ├── routers/                          # Modüler FastAPI Rota Tanımları
│   │   ├── documents.py                  # Belge yükleme, OCR ve yönetici anketi rotaları
│   │   ├── report.py                     # TSRS raporlama, kuyruk, PDF ve doğrulama rotaları
│   │   ├── carbon.py                     # Karbon hesabı, g-ROI simülasyonu rotaları
│   │   ├── esg.py                        # ESG tahmin, SHAP ve haber rotaları
│   │   ├── audits.py                     # Halka açık denetim ve ihbar rotaları
│   │   ├── finance.py                    # Yeşil kredi ve kitle fonlama rotaları
│   │   ├── applications.py               # Yeşil kredi başvuruları (Simülatör → Banka) rotaları
│   │   └── common.py                     # Ortak Pydantic modelleri ve yardımcı fonksiyonlar
│   └── tests/                            # Kapsamlı Pytest Birim Test Paketi
│
├── frontend/                             # React 19 + Vite Web Portalı
│   ├── src/
│   │   ├── App.jsx                       # Rota tanımları, portal süzgeci ve oturum yönetimi
│   │   ├── index.css                     # Global kurumsal tasarım sistemi ve CSS değişkenleri
│   │   ├── components/                   # Yeniden kullanılabilir UI bileşenleri
│   │   │   ├── Header.jsx                # Global başlık ve navigasyon
│   │   │   ├── layout/MainLayout.jsx     # Portal sidebar ve ortak çerçeve
│   │   │   └── ManagerDeclarationDashboard.jsx # Yönetici anket bileşeni
│   │   └── pages/                        # Sayfalar
│   │       ├── Corporate.jsx             # Kurumsal Tanıtım Ekranı
│   │       ├── Home.jsx                  # Yeşil Krediler Ekranı
│   │       ├── Crowdfunding.jsx          # Kitlesel Fonlama Ekranı
│   │       ├── ESGReport.jsx             # ESG Raporu & Analiz Ekranı
│   │       ├── ApplicationForm.jsx       # Doğrudan Yeşil Başvuru Formu
│   │       ├── PublicAudit.jsx           # Halka Açık Denetim ve Moderasyon
│   │       ├── Login.jsx                 # Giriş & Rol Değiştirme
│   │       ├── kobi/                     # KOBİ Portalı Sayfaları
│   │       │   ├── Dashboard.jsx         # KOBİ Genel Bakış & Karbon Durumu
│   │       │   ├── Integration.jsx       # 9 Belge Yükleme & Doğrulama
│   │       │   ├── Simulator.jsx         # g-ROI Tekno-Ekonomik Simülatör
│   │       │   └── TsrsReport.jsx        # TSRS Rapor Sihirbazı & Canlı İşlem Hattı
│   │       └── bank/                     # Banka Portalı Sayfaları
│   │           ├── BankDashboard.jsx     # Banka Portföy & Yeşil Varlık Rasyosu
│   │           └── ApplicationDetail.jsx # Kredi İnceleme & Greenium Onaylama
│   └── package.json                      # Frontend bağımlılıkları ve scriptler
│
├── docs/                                 # Kapsamlı Mimari ve Teknik Dokümantasyon
│   ├── EKOFIN_MIMARI_VE_TEKNIK_TASARIM_DOKUMANI.md # Detaylı Sistem Mimarisi & Şartname
│   └── DOKUMAN_HARITASI.md               # Yarışma ve teknik doküman indeksleri
└── README.md                             # Ana Proje Kılavuzu (Bu belge)
```

---

## 🛠️ Kullanılan Teknoloji Yığını

| Katman | Teknoloji / Kütüphane | Kullanım Amacı |
|---|---|---|
| **Arayüz (Frontend)** | React 19, Vite, React Router 7 | Yüksek performanslı SPA ve modern web arayüzü |
| **Görselleştirme & UI** | Recharts, Lucide React, Framer Motion | Dinamik finansal grafikler, gösterge panelleri ve simgeler |
| **Backend API** | FastAPI, Uvicorn, Pydantic v2 | Yüksek eşzamanlılıklı asenkron REST Gateway |
| **Veri Tabanı** | SQLite (WAL mode, Foreign Keys ON) | Hafif, ilişkisel, kalıcı veri saklama katmanı |
| **Asenkron Kuyruk** | Python BackgroundTasks + SQLite Job Engine | Ağır raporlama ve simülasyon işlerinin durum takibi |
| **Makine Öğrenmesi** | XGBoost (v2.0+), Scikit-Learn | 11.000+ şirket verisiyle eğitilmiş ESG Overall tahmin modeli |
| **Açıklanabilir YZ (XAI)**| TreeSHAP (SHAP Library) | ESG tahmininde yerel Shapley değerleri ve faktör şeffaflığı |
| **Doğal Dil İşleme** | LangChain Core, Fin-NLP Heuristics | Haber ve ihbar duygu polaritesi, Pillar (E/S/G) ayrımı |
| **Doküman & PDF Motoru**| ReportLab (v4.0+) | TSRS raporunun kurumsal formatta vektörel PDF derlemesi |
| **Kriptografi & Güvenlik**| Python `hashlib` (SHA-256) | Değişmez rapor özeti, içerik adresleme ve kanıt mühürleme |
| **Test Altyapısı** | Pytest, Pytest-Mock | 43 birim ve regresyon testinin otomatik yürütülmesi |

---

## 📖 Mimari ve Teknik Tasarım Dökümanı Referansı

Sistemin matematiksel modellemeleri, algoritmik temelleri, kurumsal genişleme mimarisi ve regülatif uyum analizleri hakkında derinlemesine teknik bilgi için lütfen ana teknik tasarım belgemizi inceleyiniz:

👉 **[EkoFin Sistem Mimarisi ve Teknik Tasarım Şartnamesi (EKOFIN_MIMARI_VE_TEKNIK_TASARIM_DOKUMANI.md)](docs/EKOFIN_MIMARI_VE_TEKNIK_TASARIM_DOKUMANI.md)**

### İlgili Belgede Yer Alan Temel Konu Başlıkları:
* 🧮 **Bölüm 4: GHG Protocol Kapsam 1-2-3 Matematiksel Formülasyonları** (IPCC Tier-1/Tier-2, yakıt NCV, şebeke faktörleri).
* 🌲 **Bölüm 5: XGBoost Regresyonu ve TreeSHAP Oyun Teorisi Formülasyonu** (L1/L2 regülarizasyonu, Taylor serisi gradyan/hessian optimizasyonu, $\phi_i$ Shapley katkı formülü).
* ⏱️ **Bölüm 6: Dinamik ESG Modülasyonu ve Üstel Zaman Sönümlenmesi** (Fin-NLP, half-life $\lambda = \ln(2)/t_{1/2}$ formülasyonu, Bayesian prior güncellemesi).
* 💰 **Bölüm 7: g-ROI Tekno-Ekonomik Optimizasyon ve Greenium Arbitrajı** (LCOE, DCF, Gölge Karbon Fiyatlaması $85 \, \text{€}/tCO_2e$, Basel III/IV RWA karşılığı indirimi).
* 🔒 **Bölüm 8: Kriptografik Bütünlük ve Merkle Ağacı Güvence İzi** (SHA-256 içerik adresleme, RFC 3161 zaman damgası ve bağımsız denetim kanıt zinciri).
* 🏛️ **Bölüm 9: Aktif Referans Mimarisi (SQLite/FastAPI) ve Kurumsal Hedef Mimari (PostgreSQL/TimescaleDB/Kafka/Kubernetes)**.

---

## 📄 Lisans ve Telif Hakkı

Bu proje, yapay zeka destekli sürdürülebilir finansman, iklim adaleti ve şeffaf yeşil dönüşüm ilkeleri doğrultusunda geliştirilmiştir.

© 2026 EkoFin Technologies. Tüm hakları saklıdır.
