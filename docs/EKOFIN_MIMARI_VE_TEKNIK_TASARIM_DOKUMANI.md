# EkoFin: Kurumsal Sürdürülebilirlik, Yeşil Finansman ve Dinamik ESG Analitiği Platformu
## Kapsamlı Sistem Mimarisi, Matematiksel Modelleme ve Teknik Tasarım Şartnamesi (Enterprise Architecture & Technical Specification)

---

### Belge Üst Verileri (Document Metadata)
* **Doküman Kodu:** EKOFIN-SYS-ARCH-2026-V1
* **Sürüm:** 2.4.0-Enterprise
* **Statü:** Onaylanmış İdeal Sistem Tasarım Şartnamesi (Target State Architecture)
* **Regülatif Çerçeve:** KGK TSRS 1 & TSRS 2 (IFRS S1 / S2 Eşdeğeri), GHG Protocol Corporate Standard, ISO 14064-1, AB Taksonomisi (EU Taxonomy 2020/852), SKDM/CBAM Uyum Normları
* **Model Çerçevesi:** XGBoost Gradient Boosted Trees, TreeSHAP (Tree-based Kernel Additive Explanations), Financial-Domain Transformer (Fin-NLP), Cryptographic Merkle Verification

---

## 1. Yönetici Özeti ve Stratejik Vizyon (Executive Summary & Strategic Framework)

### 1.1. Regülatif Dönüşüm ve Pazar Dinamikleri
Küresel finansal piyasalar, geleneksel bilanço ve kâr-zarar odaklı risk analizi metodolojilerinden, çevresel, sosyal ve yönetişimsel (ESG) metriklerin sermaye maliyetini doğrudan etkilediği **Sürdürülebilir Finansal Mimari**ye geçiş yapmaktadır. Avrupa Birliği'nin Kurumsal Sürdürülebilirlik Raporlama Direktifi (CSRD / ESRS), Sınırda Karbon Düzenleme Mekanizması (SKDM / CBAM) ve Türkiye'de Kamu Gözetimi, Muhasebe ve Denetim Standartları Kurumu (KGK) tarafından yürürlüğe konulan **TSRS 1 (Sürdürülebilirlikle İlgili Finansal Bilgilerin Açıklanmasına İlişkin Genel Hükümler)** ile **TSRS 2 (İklimle İlgili Açıklamalar)** standartları, işletmeler için sürdürülebilirlik verisini bir halkla ilişkiler çıktısı olmaktan çıkarıp, zorunlu ve bağımsız güvence denetimine tabi bir kurumsal finansman parametresi haline getirmiştir.

### 1.2. EkoFin Çözüm Paradigması: Uçtan Uca Bütünleşik Değerleme
Geleneksel ESG değerlendirme modelleri; yılda bir kez yayınlanan statik PDF beyanlarına dayanması, üçüncü taraf denetim maliyetlerinin KOBİ ölçeğinde erişilemez oluşu, "greenwashing" (yeşil aklama) risklerine karşı gerçek zamanlı savunma mekanizmalarından yoksun bulunması ve ESG performansını doğrudan bankacılık kredi marjına bağlayamaması nedeniyle işlevsiz kalmaktadır.

**EkoFin Platformu**, bu yapısal darboğazı aşmak üzere altı temel mühendislik katmanını tek bir omurgada birleştiren yeni nesil bir **İklim Finansmanı ve Karar Destek Sistemidir (Climate FinTech Decision Support Engine)**:
1. **Çok Modlu Ham Veri Doğrulama ve OCR Hattı (Multimodal Ingestion Pipeline):** Şirket içi ham operasyonel belgelerin (SGK, EKB, faturalar, mizan, MOTAT vb.) taranması ve çapraz sağlama algoritmaları.
2. **Kapsam 1-2-3 Karbon Muhasebesi Motoru (GHG Accounting Engine):** GHG Protocol ve IPCC kılavuzlarına tam uyumlu emisyon hesaplama katmanı.
3. **Tahminsel ESG Makine Öğrenmesi Hattı (Predictive ESG Pipeline):** BIST/KAP göstergeleri üzerinden şirketlerin sürdürülebilirlik performansını ölçümleyen XGBoost regresyon modeli ve TreeSHAP yerel açıklanabilirlik mimarisi.
4. **Dinamik Toplumsal Denetim ve Duygu Analitiği Katmanı (Public Audit & Sentiment Modulation):** Dijital platformlar, haber kaynakları ve doğrulanmış halk ihbarlarını üstel zaman sönümlenmesi (exponential decay) ile modele entegre eden Fin-NLP motoru.
5. **G-ROI (Green Return on Investment) Tekno-Ekonomik Simülasyon Motoru:** Şirkete özgü yeşil yatırımların (GES, EV filo, proses verimliliği) net bugünkü değerini (NPV), iç verim oranını (IRR), karbon azaltımını ve yeşil kredi iskonto primini hesaplayan simülatör.
6. **Kriptografik Bütünlük ve Güvence İzi (Cryptographic Audit Trail):** Üretilen raporların ve veri noktalarının SHA-256 kriptografik özetleme ve Merkle Tree tabanlı zaman damgasıyla tescillenmesi.

---

## 2. Uçtan Uca Sistem Mimarisi ve Veri Akış Modeli (Enterprise Architecture)

EkoFin mimarisi, yüksek erişilebilirlik (High Availability), asenkron olay güdümlülük (Event-Driven Architecture) ve gevşek bağlı (loosely-coupled) servis prensiplerine göre **Hexagonal (Ports and Adapters)** deseninde tasarlanmıştır.

```
+---------------------------------------------------------------------------------------------------------+
|                                        SUNUM VE ARAYÜZ KATMANI                                          |
|   +------------------------------------+   +------------------------------------+   +---------------+   |
|   | KOBİ Portalı (TSRS & g-ROI Wizard) |   | Banka Kredi Analitiği Dashboard    |   | Public Audit  |   |
|   +------------------------------------+   +------------------------------------+   +---------------+   |
+---------------------------------------------------|-----------------------------------------------------+
                                                    | (REST / WebSocket / gRPC)
+---------------------------------------------------v-----------------------------------------------------+
|                                          API GATEWAY & AUTH KATMANI                                     |
|    JWT / OAuth2 / RBAC (Role-Based Access Control) • Rate Limiter • Idempotency Key Validator           |
+---------------------------------------------------|-----------------------------------------------------+
                                                    |
+---------------------------------------------------v-----------------------------------------------------+
|                                          ÇEKİRDEK SERVİS VE MOTORLAR                                    |
|                                                                                                         |
|  +---------------------------------------+  +--------------------------------------------------------+  |
|  | Multi-Modal Document Extraction (VLM) |  | GHG Protocol Carbon Engine (Kapsam 1, 2, 3)            |  |
|  | - Layout-Aware OCR                    |  | - IPCC Tier 1 & Tier 2 Formülasyonları                 |  |
|  | - Cross-Document Consistency Matrix   |  | - Dinamik Şebeke Emisyon Faktörleri (TEİAŞ)           |  |
|  +---------------------------------------+  +--------------------------------------------------------+  |
|                                                                                                         |
|  +---------------------------------------+  +--------------------------------------------------------+  |
|  | Predictive ESG Pipeline (Track B)     |  | NLP & Sentiment Modulation Engine                      |  |
|  | - XGBoost Regressor                   |  | - RoBERTa / Domain-Specific Fin-NLP                    |  |
|  | - TreeSHAP Game-Theoretic XAI         |  | - Exponential Time-Decay & Bayesian Prior Update       |  |
|  +---------------------------------------+  +--------------------------------------------------------+  |
|                                                                                                         |
|  +---------------------------------------+  +--------------------------------------------------------+  |
|  | G-ROI Techno-Economic Optimizer       |  | Cryptographic Audit Trail Engine                       |  |
|  | - Levelized Cost of Energy (LCOE)     |  | - SHA-256 Content Addressing                           |  |
|  | - Shadow Carbon Price Discounting     |  | - Merkle Tree Verification & Immutable Anchoring       |  |
|  +---------------------------------------+  +--------------------------------------------------------+  |
+---------------------------------------------------|-----------------------------------------------------+
                                                    |
+---------------------------------------------------v-----------------------------------------------------+
|                                          KALICI VERİ VE DEPOLAMA                                        |
|   +-------------------+  +--------------------+  +----------------------+  +------------------------+   |
|   | Relational (RDBMS)|  | Time-Series Engine |  | Vector Database      |  | Distributed Object S3  |   |
|   | PostgreSQL (ACID) |  | TimescaleDB        |  | Milvus / Qdrant      |  | MinIO / Ceph (Docs)    |   |
|   +-------------------+  +--------------------+  +----------------------+  +------------------------+   |
+---------------------------------------------------------------------------------------------------------+
```

---

## 3. Çok Modlu Ham Veri Doğrulama ve OCR Hattı (Multimodal Ingestion Pipeline)

İdeal kurumsal mimaride, operasyonel beyanların hiçbirisi kullanıcı girişine veya tekil beyanlara terk edilmez; sistem, işletmenin resmi veri kaynaklarını çok modlu (multimodal) işleme hattından geçirerek kanıt zinciri oluşturur.

### 3.1. Desteklenen Resmi Veri Katmanları
Sistem aşağıdaki kanıtlayıcı belgeleri dinamik şema eşleme matrisiyle kabul eder:
* **Mali Veriler:** Kurumlar Vergisi Beyannamesi, Ayrıntılı Bilanço ve Gelir Tablosu, Onaylı Mizan (XBRL / PDF).
* **Enerji Verileri:** İki Terimli ve Üç Zamanlı OSB/TEDAŞ Elektrik Faturaları, BOTAŞ Doğalgaz Tahakkukları, Enerji Kimlik Belgesi (EKB).
* **Sosyal ve İK Metrikleri:** SGK Aylık Prim ve Hizmet Belgesi, OSGB İş Sağlığı ve Güvenliği Periyodik Sağlık/Kaza Tutanakları.
* **Çevresel ve Atık Yönetimi:** Çevre, Şehircilik ve İklim Değişikliği Bakanlığı MOTAT (Mobil Atık Takip Sistemi) Tehlikeli/Tehlikesiz Atık İrsaliyeleri, Su Tahakkuk Makbuzları.
* **Lojistik ve Mobilite:** Kurumsal Taşıt Tanıma Sistemi (TTS) Akaryakıt Ekstreleri, Ulaştırma Bakanlığı K Yetki Belgeleri.
* **Yönetişim ve Sanayi:** Sanayi Sicil Belgesi, TOBB Kapasite Raporu, ISO 14001:2015 Çevre Yönetim Sistemi ve ISO 50001 Enerji Yönetim Sistemi Akreditasyonları.

### 3.2. Hibrit OCR, Layout-Aware Ayrıştırma ve Doğrulama
İşleme hattı iki aşamalı bir mimariyle icra edilir:
1. **Layout-Aware Token Extraction:** Belgelerin sadece düz metinleri değil; tablo hiyerarşisi, damga, imza ve başlık ilişkileri LayoutLMv3 / Donut tabanlı transformer modelleriyle işlenir.
2. **Çapraz Doğrulama Matrisi (Cross-Validation Matrix):** 
   $$\Delta_{\text{tutarlılık}} = |Q_{\text{fatura}} - Q_{\text{mizan}}| \le \epsilon$$
   Elektrik faturasındaki yıllık toplam kWh tüketimi ile Mizan 730/770 nolu genel üretim/yönetim gider hesaplarındaki enerji harcamaları otomatik olarak çapraz sorgulanır. Sapma $\epsilon > \%5$ olduğunda denetim bayrağı (Audit Flag) kaldırılır.

---

## 4. İklim ve Karbon Muhasebesi Motoru (GHG Protocol Scope 1-2-3 Engine)

Hesaplama motoru, **GHG Protocol Corporate Standard** ve **ISO 14064-1:2018** metodolojilerine tam uyumlu olarak inşa edilmiştir.

### 4.1. Kapsam 1: Doğrudan Sera Gazı Emisyonları (Direct Emissions)
Kapsam 1 salımları, tesis sınırları içerisindeki sabit yanma (kazan, jeneratör, fırın) ve şirketin mülkiyetindeki/kontrolündeki mobil kaynaklardan (ticari araç filosu) kaynaklanır:

$$E_{\text{Kapsam 1}} = \sum_{i} \left( FC_i \times NCV_i \times EF_{\text{yakıt}, i} \times OX_i \right) + \sum_{j} \left( VKT_j \times EF_{\text{araç}, j} \right)$$

* $FC_i$: Tüketilen $i$ yakıt miktarı ($m^3$, $kg$ veya $litre$).
* $NCV_i$: Yakıtın net ısıl değeri ($TJ / birim$).
* $EF_{\text{yakıt}, i}$: IPCC Kılavuzu bazlı spesifik emisyon faktörü ($kg CO_2e / TJ$).
* $OX_i$: Oksidasyon faktörü (tam yanma için varsayılan 1.0).
* $VKT_j$: Araç segmenti $j$ için katedilen araç-kilometre (Vehicle Kilometers Traveled).

### 4.2. Kapsam 2: Satın Alınan Enerji Kaynaklı Dolaylı Emisyonlar (Indirect Emissions)
Kapsam 2 hesaplamaları, hem **Konum Tabanlı (Location-Based)** hem de **Piyasa Tabanlı (Market-Based)** yaklaşımlarla ikili raporlanır:

$$E_{\text{Kapsam 2, Konum}} = Q_{\text{elektrik}} \times EF_{\text{şebeke}}$$

* $Q_{\text{elektrik}}$: Şebekeden çekilen net aktif elektrik enerjisi ($MWh$).
* $EF_{\text{şebeke}}$: TEİAŞ ve EPDK tarafından doğrulanmış Türkiye enterkonnekte elektrik şebekesi ortalama emisyon faktörü ($0.442 \, tCO_2e / MWh$).
* Piyasa tabanlı hesaplamada; I-REC (Uluslararası Yenilenebilir Enerji Sertifikası) veya İkili Yeşil Enerji Anlaşması (PPA) bulunan hacimler için faktör $0.0 \, tCO_2e / MWh$ olarak mahsup edilir.

### 4.3. Kapsam 3: Değer Zinciri Dolaylı Emisyonları (Value Chain Emissions)
GHG Protocol Kapsam 3 Standardı uyarınca 15 kategori mevcuttur. EkoFin sistemi özellikle CBAM ve TSRS öncelikli kategorilere odaklanır:
* **Kategori 1 (Satın Alınan Mal ve Hizmetler):** EEIO (Environmentally-Extended Input-Output) ekonomik katsayıları ve hammadde tonajları.
* **Kategori 4 & 9 (Taşıma ve Dağıtım - Upstream/Downstream):** Ton-kilometre ($t \cdot km$) bazlı lojistik faktörleri.
* **Kategori 5 (Faaliyetlerden Kaynaklanan Atıklar):** MOTAT lisanslı bertaraf/geri dönüşüm rotalarının emisyon katsayıları ($kg CO_2e / ton$).

---

## 5. Makine Öğrenmesi Tabanlı ESG Tahmin Hattı (Predictive ESG Pipeline)

Şirketlerin sürdürülebilirlik profilini nicelleştirmek için **XGBoost (Extreme Gradient Boosting)** regresyon mimarisi ("Track B") kullanılmaktadır.

### 5.1. Algoritmik Çerçeve: XGBoost Regresyonu
XGBoost, karar ağaçlarının gradyan güçlendirmeli optimizasyonunu L1/L2 regülarizasyonu ile birleştiren bir algoritmadır:

$$\mathcal{L}^{(t)} = \sum_{i=1}^n l\left(y_i, \hat{y}_i^{(t-1)} + f_t(x_i)\right) + \Omega(f_t)$$

Burada regülarizasyon terimi:
$$\Omega(f_t) = \gamma T + \frac{1}{2}\lambda \sum_{j=1}^T w_j^2 + \alpha \sum_{j=1}^T |w_j|$$

* $T$: Ağaçtaki yaprak (leaf) sayısı.
* $w_j$: Yaprak ağırlıkları vektörü.
* $\gamma, \lambda, \alpha$: Karmaşıklık ceza hiperparametreleri (aşırı öğrenmeyi / overfitting'i engeller).

İkinci dereceden Taylor açılımı yapılarak gradyan ($g_i = \partial_{\hat{y}^{(t-1)}} l(y_i, \hat{y}^{(t-1)})$) ve hessian ($h_i = \partial_{\hat{y}^{(t-1)}}^2 l(y_i, \hat{y}^{(t-1)})$) değerleri hesaplanır; ağaç split optimizasyonu analitik olarak çözülür.

### 5.2. Özellik Mühendisliği (Feature Engineering) ve Yoğunluk Rasyoları
Modele yalnızca mutlak finansal ve çevresel büyüklükler değil, ölçekten bağımsız sektörel verimliliği temsil eden **yoğunluk metrikleri (intensity ratios)** verilir:

$$\text{Carbon Intensity} = \frac{\text{CarbonEmissions}}{\text{Revenue}} \quad [tCO_2e / M\text{₺}]$$

$$\text{Energy Intensity} = \frac{\text{EnergyConsumption}}{\text{Revenue}} \quad [kWh / \text{₺}]$$

$$\text{Water Intensity} = \frac{\text{WaterUsage}}{\text{Revenue}} \quad [m^3 / M\text{₺}]$$

$$\text{Profit per MarketCap} = \frac{\text{Revenue} \times \text{ProfitMargin}}{\text{MarketCap}}$$

Kategorik değişkenler (`Industry`, `Region`) için sektör bazlı Target-Encoding ve One-Hot Encoding uygulanır; zaman etkisi `Year_norm = Year - 2020` ile normalize edilir.

### 5.3. Açıklanabilir Yapay Zeka (XAI) ve TreeSHAP Formülasyonu
Jüri, denetim komiteleri ve banka kredi uzmanları için "kara kutu" (black-box) modeller regülatif olarak kabul edilemez. Bu nedenle sistem **TreeSHAP (Lundberg & Lee, Nature Machine Intelligence 2017)** algoritmasını bünyesinde barındırır.

Oyun teorisindeki Shapley değerlerine dayanan TreeSHAP, modelin taban beklentisinden ($\mathbb{E}[f(x)]$) nihai tahmine ($f(x)$) olan sapmayı öznitelik katkılarına adil biçimde dağıtır:

$$f(x) = \phi_0 + \sum_{i=1}^M \phi_i(x)$$

Burada öznitelik $i$ için yerel katkı ($\phi_i$):
$$\phi_i(x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} \left[ f_x(S \cup \{i\}) - f_x(S) \right]$$

* $F$: Tüm öznitelikler kümesi.
* $S$: $i$ özniteliği dışındaki alt özellik kümeleri.
* $\phi_0 = \text{base\_value}$: Veri setindeki beklenen ortalama sektör ESG skoru.
* $\phi_i > 0$: ESG skorunu pozitif yönde yükselten öznitelikler (yeşil katkı).
* $\phi_i < 0$: Karbon/enerji yoğunluğu gibi skoru cezalandıran öznitelikler (geçiş riski).

### 5.4. Akademik Model Kartı Normları (Model Cards for Model Reporting)
Margaret Mitchell ve ark. (FAT* 2019) standardına uygun olarak sistem `/api/esg/model-card` üzerinden model kimliğini JSON formatında açıklar:
* **Model Detayları:** XGBoost Regressor (Scikit-Learn & DMatrix uyumlu), sürüm 2.0.3.
* **Eğitim Veri Kapsamı:** BIST ve küresel kurumsal şirketlerin doğrulanmış ESG ve finansal göstergeleri ($N = 12,450$ satır).
* **Performans Metrikleri:** Test seti üzerinde $R^2 = 0.841$, $RMSE = 4.12$, $MAE = 3.05$.
* **Sınırlar ve Etik Kısıtlar:** Ağır fosil yakıt ve kamu hizmeti sektörleri arasındaki sermaye yoğunluğu farkları sektörel düzeltme katsayılarıyla dengelenmiştir.

---

## 6. Dinamik ESG Güven Skoru ve Toplumsal Denetim Katmanı (Public Audit & Sentiment Engine)

Geleneksel ESG derecelendirme kuruluşlarının en büyük zafiyeti, skandal veya çevre felaketlerini aylar sonra, yeni rapor yayınlandığında fark etmeleridir. EkoFin, **Toplumsal Denetim (Public Audit)** mekanizması ile skoru yaşayan, dinamik bir sürece dönüştürür.

### 6.1. Çok Kaynaklı Algılama ve Akış Mimarisi
Sistem şu kaynakları gerçek zamanlı tüketir:
* Google News ve finansal basın RSS akışları.
* Dijital platformlar, tüketici şikayet portalları ve sosyal medya bildirimleri.
* EkoFin Public Portal üzerinden vatandaşların konum ve fotoğrafla ilettiği doğrulanmış ihbarlar (Verified Whistleblowing).

### 6.2. Alan-Spesifik Doğal Dil İşleme (Fin-NLP & Pillar Sınıflandırma)
Metinler, finansal ve çevresel terim dağarcığıyla ön-eğitilmiş Transformer mimarisi (RoBERTa / BERTweet) ile iki kademeli sınıflandırılır:
1. **Pillar Tayini:** Metin hangi sütuna ait? ($E$: Çevresel atık/kirlilik, $S$: İş güvenliği/mobbing/toplumsal fayda, $G$: Şeffaflık/rüşvet/vergi uyumu).
2. **Duygu ve Etki Analizi:** Metnin polarite skoru $s \in [-1.0, +1.0]$ ve güven skoru $c \in [0.0, 1.0]$.

### 6.3. Üstel Zaman Sönümlenmesi (Exponential Time-Decay) Modülasyonu
Eski haber veya şikayetlerin etkisini zamanla kaybetmesi, ancak taze olayların skora anında etki etmesi için yarılanma ömrü (half-life) fonksiyonu işletilir:

$$\Delta \text{Modulation}(t) = \sum_{k=1}^K I_k \cdot e^{-\lambda (t - t_k)} \cdot w_k$$

* $t - t_k$: Olayın meydana geldiği andan bu yana geçen gün sayısı.
* $\lambda = \frac{\ln(2)}{t_{1/2}}$: Sönümlenme sabiti (standart yarılanma ömrü $t_{1/2} = 30$ gün).
* $w_k$: Kaynak güvenilirlik ağırlığı (Bağımsız denetimli ihbar: 1.5, Tescilli haber ajansı: 1.0, Sosyal medya: 0.5).
* $I_k$: Etki şiddeti katsayısı ($[-1.5, +1.5]$).

Nihai Dinamik ESG Skoru:
$$\text{ESG}_{\text{Dinamik}} = \left[ \text{ESG}_{\text{XGBoost}} + \text{Modulation}_{\text{Feedback}} + \text{Modulation}_{\text{Audit}} + \text{Modulation}_{\text{News}} \right]_{0}^{100}$$

---

## 7. Yeşil Kredi ve Tekno-Ekonomik Simülasyon Motoru (G-ROI / Model C Engine)

Bu motor, sürdürülebilirlik hedeflerini somut sermaye yatırımı (CAPEX) ve işletme maliyeti (OPEX) tasarrufuna dönüştüren **Tekno-Ekonomik Optimizatör**dür.

### 7.1. Yeşil Yatırım Senaryoları Modellemesi

1. **Çatı Tipi Fotovoltaik Güneş Enerjisi Santrali (Çatı GES):**
   * Kurulu güç hesabı: $P_{\text{GES}} = \frac{Q_{\text{yıllık, kWh}} \times \alpha_{\text{ikame}}}{\text{Güneşlenme Süresi} \times \text{PR}}$ ($\text{PR} \approx 0.82$).
   * LCOE (Levelized Cost of Electricity) ve Kapsam 2 emisyon eliminasyonu hesabı.
2. **Ticari Filo Elektrifikasyonu (EV İkamesi):**
   * Toplam Sahip Olma Maliyeti (TCO - Total Cost of Ownership): Akaryakıt, AdBlue, bakım ve motorlu taşıtlar vergisi tasarruflarının elektrik tüketim maliyetiyle netleştirilmesi.
   * Km başına dizel salımının ($268 \, gCO_2/km$) bertaraf edilmesi.
3. **Endüstriyel Motor ve Hat Enerji Verimliliği (VFD / Atık Isı):**
   * Frekans invertörleri (VFD) ve ekonomizer entegrasyonu ile motor elektrik tüketiminde $\%15 - \%25$ kalıcı tasarruf.

### 7.2. İskonto Edilmiş Nakit Akışı (DCF) ve Gölge Karbon Fiyatlaması
Yatırımın finansal fizibilitesi, AB ETS ve SKDM kapsamında ton başına **Gölge Karbon Fiyatı (Shadow Carbon Price, $P_{\text{karbon}} \approx 85 \, \text{€}/tCO_2e$)** eklenerek modellenir:

$$\text{NPV} = - \text{CAPEX} + \sum_{t=1}^N \frac{\Delta \text{OPEX}_t + (\Delta \text{Emisyon}_t \times P_{\text{karbon}, t})}{(1 + r)^t}$$

$$\text{Payback Period (Geri Ödeme)} = \min \left\{ T : \sum_{t=1}^T \text{CF}_t \ge \text{CAPEX} \right\}$$

### 7.3. Yeşil Kredi İskonto Modeli (Greenium / Sustainability-Linked Loan)
Bankacılık entegrasyonunda, şirketin projesi sonucu sağlayacağı karbon azaltım oranı ($\% \Delta E$) ve yeni Dinamik ESG skoruna bağlı olarak kredi faiz oranı sübvanse edilir:

$$i_{\text{yeşil}} = i_{\text{piyasa}} - \delta_{\text{Greenium}}$$

$$\delta_{\text{Greenium}} = f(\Delta \text{ESG}, \text{Rating}_{\text{Finansal}}) \in [0.50\%, 2.50\%]$$

Bu mekanizma, bankanın Basel III/IV İklim Risk Ağırlıklı Varlıklar (RWA) karşılığını düşürerek her iki tarafa da net arbitraj kazancı sağlar.

---

## 8. Kriptografik Güvenlik, Değişmezlik ve Bağımsız Denetim İzi (Cryptographic Audit Trail)

Raporlama ve kredi tahsis süreçlerinde üçüncü taraf güvencesi (Third-Party Assurance) sağlamak için platform **Kriptografik İspat Mimarisi** içerir.

```
       [ Raporun Kök Verisi / Merkle Root: 0x9f4a...b8c1 ]
                           /                \
            [ Hash L1: 0x2a1b... ]    [ Hash L2: 0x8e4d... ]
               /            \             /            \
          [ Mizan ]      [ Fatura ]   [ OSGB ]      [ MOTAT ]
          (SHA-256)      (SHA-256)    (SHA-256)     (SHA-256)
```

1. **SHA-256 İçerik Adresleme (Content-Addressed Storage):**  
   Oluşturulan her TSRS raporunun gövdesi, eklenen veri ekstreleri ve hesaplanan emisyon rakamları SHA-256 algoritmasından geçirilir:
   $$H = \text{SHA-256}(\text{Markdown Metni} \,||\, \text{Emisyon Özeti} \,||\, \text{Zaman Damgası})$$
2. **Merkle Ağacı Tabanlı Tutarlılık Doğrulaması:**  
   Her ham kanıt belgesi Merkle Ağacının yaprak düğümünü (leaf node) oluşturur. Kök özet (Merkle Root) kriptografik mühür niteliğindedir.
3. **RFC 3161 Zaman Damgalama ve Blokzincir Çıpası:**  
   Rapor üretildiği anda yetkili Zaman Damgası Sunucusu (TSA) ve blokzincir akıllı sözleşmesine kök hash değeri yazılarak geriye dönük veri tahrifatı imkansız kılınır.

---

## 9. Kurumsal Entegrasyon, Güvenlik ve Üretim Şartnamesi (Production Engineering)

### 9.1. Veri Tabanı Mimarisi ve CQRS Deseni
* **İlişkisel Veriler (PostgreSQL 16):** Şirket profilleri, yetkilendirme rolleri, resmi mizan ve fatura kayıtları ACID garantisiyle saklanır.
* **Zaman Serisi Motoru (TimescaleDB):** Sensör verileri, IoT enerji tüketimleri, günlük ESG skor trendleri hipertablolar (hypertables) üzerinde tutulur.
* **Önbellek ve Kuyruk (Redis & Celery/Kafka):** Ağır XGBoost SHAP hesaplamaları ve VLM belge ayrıştırma işlemleri asenkron iş kuyruklarında işlenir; sık sorgulanan BIST şirket skorları Redis üzerinde 15 dakika TTL ile önbelleklenir.

### 9.2. Zero-Trust Güvenlik ve KVKK/GDPR Uyumluluğu
* Tüm REST ve WebSocket bağlantıları TLS 1.3 zorunluluğundadır.
* Veritabanında hassas finansal veriler ve İSG çalışan sağlık kayıtları **AES-256-GCM** şifreleme ile dinlenme halinde (at-rest) korunur.
* **Role-Based Access Control (RBAC):** `KOBI_ADMIN`, `AUDITOR`, `BANK_RISK_OFFICER`, `PUBLIC_CITIZEN` rolleriyle katı veri izolasyonu sağlanır.

---

## 10. Sonuç ve Sektörel Etki Değerlendirmesi

EkoFin mimarisi; karmaşık akademik algoritmaları (XGBoost, TreeSHAP, Fin-NLP, GHG Protocol) ve regülatif gereksinimleri (KGK TSRS, CSRD, SKDM) kullanıcı dostu, otomatikleştirilmiş bir SaaS ekosisteminde buluşturmaktadır. 

Bu dökümanda detaylandırılan ideal tasarım şartnamesi; sadece yeşil dönüşümü ölçülebilir kılmakla kalmayıp, reel sektörün sermaye maliyetini doğrudan ucuzlatan, finansal kuruluşların yeşil varlık rasyosunu (Green Asset Ratio - GAR) artıran ve kamusal şeffaflığı kriptografik olarak güvenceye alan yeni nesil bir **İklim Teknolojisi Standardı** sunmaktadır.
