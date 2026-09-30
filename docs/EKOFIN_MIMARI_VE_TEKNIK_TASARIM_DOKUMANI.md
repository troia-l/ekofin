# EkoFin: Kurumsal Sürdürülebilirlik, Yeşil Finansman ve Dinamik ESG Analitiği Platformu
## Kapsamlı Sistem Mimarisi, Matematiksel Modelleme ve Teknik Tasarım Şartnamesi (Enterprise Architecture & Technical Specification)

---

### Belge Üst Verileri (Document Metadata)
* **Doküman Kodu:** EKOFIN-SYS-ARCH-2026-V2.5
* **Sürüm:** 2.5.0-Production & Enterprise Target
* **Statü:** Doğrulanmış Çalışan Çekirdek (Verified Working Core) & Kurumsal Hedef Şartnamesi (Enterprise Target State)
* **Regülatif Çerçeve:** KGK TSRS 1 & TSRS 2 (IFRS S1 / S2 Eşdeğeri), GHG Protocol Corporate Standard, ISO 14064-1:2018, AB Taksonomisi (EU Taxonomy 2020/852), SKDM/CBAM Uyum Normları
* **Model Çerçevesi:** XGBoost Gradient Boosted Trees (Track B), TreeSHAP (Tree-based Kernel Additive Explanations), Financial-Domain NLP (Fin-NLP & RoBERTa), Çoklu Ajan ve LLM Orkestrasyonu (LangChain), Kriptografik Merkle ve SHA-256 İçerik Adresleme

---

## 1. Yönetici Özeti ve Stratejik Vizyon (Executive Summary & Strategic Framework)

### 1.1. Regülatif Dönüşüm ve Pazar Dinamikleri
Küresel finansal piyasalar, geleneksel bilanço ve kâr-zarar odaklı risk analizi metodolojilerinden; çevresel, sosyal ve yönetişimsel (ESG) metriklerin sermaye maliyetini doğrudan belirlediği **Sürdürülebilir Finansal Mimari**ye geçiş yapmaktadır. 
* Avrupa Birliği'nin **Kurumsal Sürdürülebilirlik Raporlama Direktifi (CSRD / ESRS)** ve **Sınırda Karbon Düzenleme Mekanizması (SKDM / CBAM)**,
* Türkiye'de Kamu Gözetimi, Muhasebe ve Denetim Standartları Kurumu (KGK) tarafından yürürlüğe konulan **TSRS 1 (Sürdürülebilirlikle İlgili Finansal Bilgilerin Açıklanmasına İlişkin Genel Hükümler)** ile **TSRS 2 (İklimle İlgili Açıklamalar)** standartları,

işletmeler için sürdürülebilirlik verisini bir halkla ilişkiler çıktısı olmaktan çıkarıp, zorunlu ve bağımsız güvence denetimine tabi bir kurumsal finansman parametresi haline getirmiştir.

### 1.2. EkoFin Çözüm Paradigması: Uçtan Uca Bütünleşik Değerleme
Geleneksel ESG değerlendirme modelleri; yılda bir kez yayınlanan statik PDF beyanlarına dayanması, üçüncü taraf danışmanlık ve denetim maliyetlerinin KOBİ ölçeğinde erişilemez oluşu, "greenwashing" (yeşil aklama) risklerine karşı gerçek zamanlı savunma mekanizmalarından yoksun bulunması ve ESG performansını doğrudan bankacılık kredi marjına bağlayamaması nedeniyle işlevsiz kalmaktadır.

**EkoFin Platformu**, bu yapısal darboğazı aşmak üzere yedi temel mühendislik katmanını tek bir omurgada birleştiren yeni nesil bir **İklim Finansmanı ve Karar Destek Sistemidir (Climate FinTech Decision Support Engine)**:
1. **Çok Modlu Ham Veri Doğrulama ve Çapraz Sağlama Hattı:** Şirket içi ham operasyonel belgelerin (SGK, faturalar, mizan, MOTAT, OSGB, EKB vb.) ayrıştırılması ve mizan-fatura tutarlılık matrisi.
2. **Kapsam 1-2-3 Karbon Muhasebesi Motoru (GHG Protocol Engine):** GHG Protocol ve IPCC kılavuzlarına tam uyumlu emisyon hesaplama katmanı.
3. **10 Bölümlük TSRS Sürdürülebilirlik Raporu Asenkron İş Motoru:** KGK standartlarına %100 uyumlu, asenkron durum makineli, SHA-256 imzalı rapor üretimi ve ReportLab tabanlı profesyonel PDF derleyicisi.
4. **Tahminsel ESG Makine Öğrenmesi Hattı:** Finansal rasyolar ve operasyonel verilerden ESG skoru tahmin eden XGBoost regresyon modeli ve TreeSHAP yerel açıklanabilirlik mimarisi.
5. **Dinamik Toplumsal Denetim ve Duygu Analitiği (Public Audit & Sentiment):** Dijital platformlar, Google News RSS haberleri ve doğrulanmış halk ihbarlarını üstel zaman sönümlenmesi (exponential decay) ile modele entegre eden Fin-NLP motoru.
6. **g-ROI (Green Return on Investment) Tekno-Ekonomik Simülasyon Motoru:** Şirkete özgü yeşil yatırımların (GES, EV filo, proses verimliliği) net bugünkü değerini (NPV), iç verim oranını (IRR), karbon azaltımını ve yeşil kredi faiz avantajını (Greenium) hesaplayan simülatör.
7. **Kriptografik Bütünlük ve İddia-Kanıt Güvenilirlik Analitiği:** Verilerin ve raporların SHA-256 kriptografik özetleme ve dış kanıt tekilleştirme algoritmalarıyla denetlenmesi.

---

## 2. Uçtan Uca Sistem Mimarisi (Enterprise Architecture)

EkoFin mimarisi; geliştirme, test ve dağıtım aşamasında hafif, deterministik ve sıfır dış bağımlılıkla ayağa kalkabilen **Doğrulanmış Çalışan Çekirdek (Verified Working Core)** ile yüksek ölçekli kurumsal bankacılık seviyesindeki **Kurumsal Hedef Mimari (Enterprise Target State)** arasında pürüzsüz bir soyutlama köprüsüne sahiptir.

```
+---------------------------------------------------------------------------------------------------------+
|                                        SUNUM VE ARAYÜZ KATMANI                                          |
|   +------------------------------------+   +------------------------------------+   +---------------+   |
|   | KOBİ Portalı (TSRS & g-ROI Wizard) |   | Banka Kredi Analitiği & GAR Paneli |   | Public Audit  |   |
|   | React 19 • Vite • Recharts • Lucide|   | Risk Skorlama • Kredi Tahsis Kararı|   | Çevre İhbar   |   |
|   +------------------------------------+   +------------------------------------+   +---------------+   |
+---------------------------------------------------|-----------------------------------------------------+
                                                    | (REST / JSON / Multipart Form)
+---------------------------------------------------v-----------------------------------------------------+
|                                          API GATEWAY & ROUTER KATMANI                                   |
|   FastAPI Omurgası • Modüler Router'lar • CORS Middleware • Pydantic v2 Veri Doğrulama ve Tip Güvenliği|
|   (/routers/documents, /routers/report, /routers/carbon, /routers/esg, /routers/audits,                |
|    /routers/finance, /routers/applications)                                                             |
+---------------------------------------------------|-----------------------------------------------------+
                                                    |
+---------------------------------------------------v-----------------------------------------------------+
|                                          ÇEKİRDEK İŞ VE HESAPLAMA MOTORLARI                             |
|                                                                                                         |
|  +---------------------------------------+  +--------------------------------------------------------+  |
|  | Çok Modlu Belge & Çapraz Sağlama     |  | GHG Protocol Karbon Motoru (Kapsam 1, 2, 3)            |  |
|  | - 9 Resmi Belge Tipi Haritalama       |  | - IPCC Tier 1 & Tier 2 Katsayıları                     |  |
|  | - Mizan-Fatura Tutarlılık Analizi     |  | - TEİAŞ Türkiye Şebeke Emisyon Faktörü (0.442 tCO2/MWh)|  |
|  +---------------------------------------+  +--------------------------------------------------------+  |
|                                                                                                         |
|  +---------------------------------------+  +--------------------------------------------------------+  |
|  | Makine Öğrenmesi ESG Hattı (Track B)  |  | Fin-NLP & Dinamik Skor Modülasyonu                    |  |
|  | - XGBoost Regressor (11K+ Veri Seti)  |  | - Fin-NLP Hibrit Kural + LLM Duygu Analizi             |  |
|  | - TreeSHAP Yerel Öznitelik Katkısı   |  | - Üstel Zaman Sönümlenmesi (Half-Life = 30 gün)        |  |
|  +---------------------------------------+  +--------------------------------------------------------+  |
|                                                                                                         |
|  +---------------------------------------+  +--------------------------------------------------------+  |
|  | g-ROI Tekno-Ekonomik Simülatörü       |  | Asenkron TSRS Raporlama & PDF Motoru                   |  |
|  | - Çatı GES, EV Filo, Enerji Verimlilik|  | - 10 Bölümlük LangChain & Deterministik Şablon Pipeline|  |
|  | - 5 Bileşenli Finansal Getiri Modeli  |  | - SQLite Asenkron İş Kuyruğu (Job Service)             |  |
|  | - Greenium Kredi Faiz İskontosu       |  | - ReportLab Profesyonel Vektörel PDF Derleyicisi       |  |
|  +---------------------------------------+  +--------------------------------------------------------+  |
+---------------------------------------------------|-----------------------------------------------------+
                                                    |
+---------------------------------------------------v-----------------------------------------------------+
|                                          VERİ TABANI VE KALICI SAKLAMA KATMANI                          |
|                                                                                                         |
|   [Aktif Çalışan Çekirdek]: SQLite 3 (WAL Mode, Foreign Keys On)                                       |
|   • esg_feedback • public_audits • esg_score_history • esg_news • credit_applications                  |
|   • report_jobs • report_versions • simulator_contexts • credibility_snapshots • external_evidence     |
|                                                                                                         |
|   [Kurumsal Hedef Genişleme]:                                                                           |
|   • PostgreSQL 16 (İlişkisel ACID) • TimescaleDB (IoT/Sayaç Verisi) • MinIO (S3 Belge Deposu)           |
+---------------------------------------------------------------------------------------------------------+
```

### 2.1. API Gateway ve Modüler Router Ayrımı (Modular Router Architecture)
Platform backend'i, monolitik kod şişkinliğini ve rota çakışmalarını önlemek üzere **İnce Gateway (Thin Gateway) + Ayrık Alan Router'ları (Domain-Driven Routers)** prensibine göre yapılandırılmıştır:
* **Merkezi Gateway (`backend/api.py`):** Yalnızca FastAPI uygulama başlatma, CORS konfigürasyonu, veritabanı ilklendirmesi (`db.init_db()`), router kayıtları ve servis sağlık durumu kök uç noktasını barındırır. İş mantığı içermez.
* **Ayrık Alan Router'ları (`backend/routers/`):**
  1. `documents.py`: 9 resmi belge yükleme, OCR çıkarma, güvenli dosya saklama ve yönetici beyanları (`/api/documents/*`, `/api/declaration`).
  2. `report.py`: 10 bölümlük TSRS rapor oluşturma, asenkron iş kuyruğu takibi, ReportLab PDF önizleme/indirme ve bağımsız SHA-256 hash doğrulama (`/api/report/*`).
  3. `carbon.py`: Kapsam 1-2-3 sera gazı hesaplamaları, g-ROI fizibilite simülasyonları ve TSRS raporlarından otomatik simülatör bağlamı derleme (`/api/carbon/*`).
  4. `esg.py`: XGBoost ESG tahmini, TreeSHAP yerel katkı açıklamaları, dinamik haber modülasyonu ve canlı haber tazeleme (`/api/esg/*`).
  5. `finance.py`: Banka yeşil kredi kataloğu ve topluluk odaklı kitle fonlama kampanyaları (`/api/green-credits`, `/api/crowdfunding`).
  6. `audits.py`: Halka açık çevre ihbarları, topluluk yukarı oylama ve resmi moderasyon süreci (`/api/audits/*`).
  7. `applications.py`: Simülatörden banka portalına uzanan kredi başvuru yaşam döngüsü, rapor hash mührü damgalama ve onay/ret durum güncellemeleri (`/api/credit-applications/*`).

---

## 3. Çok Modlu Veri Doğrulama ve Çapraz Sağlama Hattı

Platformda kullanıcı beyanları tek başına nihai kabul görmez; işletmenin operasyonel gerçekliği, kurumsal kanıt belgeleriyle çapraz eşleştirmeden geçirilir.

### 3.1. Desteklenen 9 Resmi Belge Tipi ve Haritalama (`DOCUMENT_TYPE_MAP`)
Sistem, `backend/config.py` ve `backend/routers/documents.py` içerisinde tanımlanan standart belge matrisiyle çalışır:

| Belge Kodu (`doc_type`) | Hedef Dosya Adı | Kapsadığı Alan ve Doğrulama Parametreleri |
|---|---|---|
| `fatura` | `faturalar.md` | Elektrik tüketimi ($kWh$), doğalgaz hacmi ($m^3$), aktif/reaktif tüketimler, tedarikçi bilgisi |
| `mizan` | `mizan.md` | Tekdüzen hesap planı 730 (Genel Üretim) ve 770 (Genel Yönetim) enerji ve lojistik giderleri |
| `sgk` | `sgk_listesi.md` | Toplam sigortalı çalışan sayısı, cinsiyet dağılımı, prim ödeme gün sayıları |
| `motat` | `motat-atik-ve-su-beyani.md` | Tehlikeli/tehlikesiz atık bertaraf miktarları ($kg$), şebeke/kuyu suyu tüketimleri ($m^3$) |
| `tts` | `tasit-tanima-sistemi.md` | Filo akaryakıt (motorin/benzin) alımları ($litre$), plaka bazlı kilometreler |
| `ekb` | `ekb.md` | Bina Enerji Kimlik Belgesi sınıfı (A-G), yıllık birincil enerji tüketimi ($kWh/m^2 \cdot yıl$) |
| `osgb` | `osgb-raporu.md` | İSG kurul kararları, kaza sıklık/ağırlık oranları, periyodik muayene oranları |
| `sanayi_sicil` | `sanayi_sicil.json` | Sanayi Sicil Belgesi, NACE rev.2 sektörel faaliyet kodu, kurulu makine gücü |
| `iso14001` | `iso_14001.json` | ISO 14001 Çevre ve ISO 50001 Enerji Yönetim Sistemi akreditasyon geçerlilikleri |

### 3.2. Mizan ve Fatura Çapraz Tutarlılık Formülasyonu
Operasyonel tüketim rakamları ile mali defter kayıtları arasındaki tutarlılık denetimi şu formülle modellenir:

$$\Delta_{\text{tutarlılık}} = \frac{|Q_{\text{fatura}} \times P_{\text{birim, enerji}} - \text{Mizan}_{\text{Hesap } 730.03}|}{\text{Mizan}_{\text{Hesap } 730.03}}$$

Sapma $\Delta_{\text{tutarlılık}} \le \%5$ ise veri kümesi `verified` statüsü kazanır; sapma $\%15$'i aştığında denetim alarmı (Audit Flag) üretilir ve bağımsız inceleme talep edilir.

---

## 4. İklim ve Karbon Muhasebesi Motoru (GHG Protocol Scope 1-2-3 Engine)

Hesaplama motoru, **GHG Protocol Corporate Standard** ve **ISO 14064-1:2018** metodolojilerine tam uyumlu olarak inşa edilmiştir (`backend/modules/carbon/calculator.py`).

### 4.1. Kapsam 1: Doğrudan Sera Gazı Emisyonları (Direct Emissions)
Kapsam 1 salımları, sabit yanma (kazan, jeneratör, fırın) ve şirketin mülkiyetindeki ticari araç filosundan kaynaklanır:

$$E_{\text{Kapsam 1}} = \sum_{i} \left( FC_i \times NCV_i \times EF_{\text{yakıt}, i} \times OX_i \right) + \sum_{j} \left( VKT_j \times EF_{\text{araç}, j} \right)$$

* $FC_i$: Tüketilen $i$ yakıt miktarı ($m^3$, $kg$ veya $litre$).
* $NCV_i$: Yakıtın net ısıl değeri ($TJ / \text{birim}$). (Örn: Doğalgaz için $0.0345 \, TJ / 1000 \, m^3$).
* $EF_{\text{yakıt}, i}$: IPCC Kılavuzu bazlı spesifik emisyon faktörü ($kg CO_2e / TJ$).
* $OX_i$: Oksidasyon faktörü (tam yanma için varsayılan 1.0).
* $VKT_j$: Araç segmenti $j$ için katedilen araç-kilometre.

### 4.2. Kapsam 2: Satın Alınan Elektrik Kaynaklı Dolaylı Emisyonlar
Kapsam 2 hesaplamaları, Türkiye enterkonnekte elektrik şebekesi ortalama faktörü üzerinden yürütülür:

$$E_{\text{Kapsam 2, Konum}} = Q_{\text{elektrik, MWh}} \times EF_{\text{şebeke}}$$

* $EF_{\text{şebeke}} = 0.442 \, tCO_2e / MWh$ (TEİAŞ ve EPDK resmi doğrulama katsayısı).
* Tesis bünyesinde lisanssız çatı GES veya I-REC yenilenebilir enerji sertifikası bulunması halinde, ikame edilen elektrik miktarı piyasa tabanlı (market-based) olarak $0.0 \, tCO_2e / MWh$ katsayısıyla mahsup edilir.

### 4.3. Kapsam 3: Değer Zinciri Dolaylı Emisyonları
Tedarik zinciri (Kategori 1), hammadde lojistiği (Kategori 4) ve faaliyetlerden kaynaklanan atıklar (Kategori 5) MOTAT ve taşıma irsaliyelerinden türetilen faktörlerle hesaplanır:

$$E_{\text{Kapsam 3}} = \sum_m \left( W_m \times EF_{\text{atık}, m} \right) + \sum_n \left( T_n \times D_n \times EF_{\text{ton-km}} \right)$$

---

## 5. Makine Öğrenmesi Tabanlı ESG Tahmin Hattı (Predictive ESG Pipeline)

Şirketlerin sürdürülebilirlik profilini nicelleştirmek için **XGBoost (Extreme Gradient Boosting)** regresyon mimarisi ("Track B") kullanılmaktadır (`backend/modules/esg_prediction/predictor.py`).

### 5.1. Algoritmik Çerçeve: XGBoost Regresyonu
XGBoost, karar ağaçlarının gradyan güçlendirmeli optimizasyonunu L1/L2 regülarizasyonu ile birleştiren bir algoritmadır:

$$\mathcal{L}^{(t)} = \sum_{i=1}^n l\left(y_i, \hat{y}_i^{(t-1)} + f_t(x_i)\right) + \Omega(f_t)$$

Burada regülarizasyon terimi:
$$\Omega(f_t) = \gamma T + \frac{1}{2}\lambda \sum_{j=1}^T w_j^2 + \alpha \sum_{j=1}^T |w_j|$$

* $T$: Ağaçtaki yaprak (leaf) sayısı.
* $w_j$: Yaprak ağırlıkları vektörü.
* $\gamma, \lambda, \alpha$: Karmaşıklık ceza hiperparametreleri (aşırı öğrenmeyi / overfitting'i engeller).

### 5.2. Özellik Mühendisliği (Feature Engineering) ve Yoğunluk Rasyoları
Modele yalnızca mutlak finansal ve çevresel büyüklükler değil, ölçekten bağımsız sektörel verimliliği temsil eden **yoğunluk metrikleri (intensity ratios)** verilir:

$$\text{Carbon Intensity} = \frac{\text{CarbonEmissions}}{\text{Revenue} + \epsilon} \quad [tCO_2e / M\text{₺}]$$

$$\text{Energy Intensity} = \frac{\text{EnergyConsumption}}{\text{Revenue} + \epsilon} \quad [kWh / \text{₺}]$$

$$\text{Water Intensity} = \frac{\text{WaterUsage}}{\text{Revenue} + \epsilon} \quad [m^3 / M\text{₺}]$$

$$\text{Profit per MarketCap} = \frac{\text{Revenue} \times \text{ProfitMargin}}{\text{MarketCap} + \epsilon}$$

Zaman etkisi ise $\text{Year\_norm} = \frac{\text{Year} - 2015}{2025 - 2015}$ formülüyle normalize edilir.

### 5.3. Açıklanabilir Yapay Zeka (XAI) ve TreeSHAP Formülasyonu
Model kararlarının şeffaflığı ve banka denetim komitelerine açıklanabilirliği için sistem **TreeSHAP (Lundberg & Lee, Nature Machine Intelligence 2017)** motorunu entegre etmiştir:

$$f(x) = \phi_0 + \sum_{i=1}^M \phi_i(x)$$

Burada öznitelik $i$ için yerel Shapley katkısı ($\phi_i$):
$$\phi_i(x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} \left[ f_x(S \cup \{i\}) - f_x(S) \right]$$

* $\phi_0 = \text{base\_value}$: Veri setindeki beklenen ortalama sektör ESG skoru.
* $\phi_i > 0$: ESG skorunu pozitif yönde yükselten yeşil öznitelikler.
* $\phi_i < 0$: Karbon/enerji yoğunluğu gibi skoru cezalandıran geçiş riskleri.

---

## 6. Dinamik ESG Güven Skoru ve Toplumsal Denetim Katmanı (Public Audit & Sentiment Engine)

EkoFin, statik yıllık beyanların ötesine geçerek kamuoyu geri bildirimlerini, doğrulanmış ihbarları ve finansal haberleri dinamik bir skorlama akışında birleştirir (`backend/modules/esg_prediction/nlp_analyzer.py`, `backend/routers/audits.py`).

### 6.1. Çok Kaynaklı Algılama ve Akış Mimarisi
Sistem üç ana dinamik kaynaktan beslenir:
1. **Google News RSS Akışları:** Şirket unvanı ve hisse kodu üzerinden taranan güncel haberler. URL bazlı tekilleştirme (deduplication) uygulanarak sadece yeni haberler batch analize alınır.
2. **Kullanıcı Geri Bildirimleri (`esg_feedback`):** Müşteri ve tedarikçilerin hizmet/ürün sürdürülebilirlik puanlamaları.
3. **Doğrulanmış Çevre İhbarları (`public_audits`):** Vatandaşların konum, fotoğraf ve açıklamayla ilettiği, moderasyon kurulundan onay almış ihlaller.

### 6.2. Alan-Spesifik Fin-NLP & Pillar Sınıflandırma
Metinler iki kademeli doğal dil işleme süzgecinden geçirilir:
1. **Pillar Ayrımı:** İfadenin hangi sütuna ait olduğu ($E$: Çevre, $S$: Sosyal, $G$: Yönetişim).
2. **Duygu Polaritesi ve Etki Skoru:** $s \in [-1.0, +1.0]$ arasında kutupsallık ve etki şiddeti ($I_k \in [-1.5, +1.5]$).

### 6.3. Üstel Zaman Sönümlenmesi (Exponential Time-Decay) Modülasyonu
Olayların etkisinin zamanla azalması ve güncel durumun yansıtılması için yarılanma ömrü (half-life) formülü işletilir:

$$\Delta \text{Modulation}(t) = \sum_{k=1}^K I_k \cdot e^{-\lambda (t - t_k)} \cdot w_k$$

* $\lambda = \frac{\ln(2)}{t_{1/2}}$: Sönümlenme katsayısı ($t_{1/2} = 30$ gün).
* $w_k$: Kaynak güvenilirlik katsayısı (Doğrulanmış Kamu İhbarı: 1.5, Tescilli Haber Ajansı: 1.0, Kullanıcı Yorumu: 0.5).

Nihai Dinamik ESG Skoru:
$$\text{ESG}_{\text{Dinamik}} = \min\left(100, \max\left(0, \text{ESG}_{\text{XGBoost}} + \Delta \text{Mod}_{\text{Feedback}} + \Delta \text{Mod}_{\text{Audit}} + \Delta \text{Mod}_{\text{News}}\right)\right)$$

#### 6.3.1. Canlı Haber Modülasyonu ve Tazeleme Uygulaması (`routers/esg.py`)
* **Dinamik Hesaplama Motoru (`db.compute_news_modulation`):** Haberler sadece statik bir metin listesi değildir; her haberin Fin-NLP etki puanı ($I_k$) ve yayınlanma tarihinden geçen süreye bağlı sönümlenmiş ağırlığı toplanarak anlık $\Delta \text{Mod}_{\text{News}}$ hesaplanır ve skora yansıtılır.
* **Canlı Haber Tazeleme (`POST /api/esg/news/{ticker}/refresh`):** Kullanıcı veya denetçi istediği anda şirketin Google News RSS akışını canlı olarak yeniden taratabilir; yeni haberler Fin-NLP süzgecinden geçirilerek `esg_news` tablosuna yazılır ve dinamik skor anında güncellenir.
* **Otomatik Tazeleme Koruması (`_ensure_fresh_news`):** Haber verisi 24 saatten eskiyse `GET /api/esg/news/{ticker}` çağrısında arka planda otomatik güncellenir.

---

## 7. Yeşil Kredi ve Tekno-Ekonomik Simülasyon Motoru (g-ROI / Model C)

Bu motor, sürdürülebilirlik hedeflerini somut sermaye yatırımı (CAPEX) ve işletme maliyeti (OPEX) tasarrufuna dönüştüren **Tekno-Ekonomik Optimizatör**dür (`backend/modules/carbon/roi.py`).

### 7.1. Yeşil Yatırım Senaryoları
1. **Çatı Tipi Fotovoltaik Güneş Enerjisi Santrali (Çatı GES):**
   * Kurulu güç hesabı: $P_{\text{GES}} = \frac{Q_{\text{yıllık, kWh}} \times \alpha_{\text{ikame}}}{\text{Güneşlenme Süresi} \times \text{PR}}$ ($\text{PR} \approx 0.82$).
   * LCOE (Levelized Cost of Electricity) ve Kapsam 2 emisyon eliminasyonu hesabı.
2. **Ticari Filo Elektrifikasyonu (EV İkamesi):**
   * Toplam Sahip Olma Maliyeti (TCO): Akaryakıt, AdBlue ve bakım tasarruflarının elektrik tüketim maliyetiyle netleştirilmesi.
3. **Endüstriyel Enerji Verimliliği (VFD & Atık Isı Geri Kazanımı):**
   * Frekans konvertörleri ve proses izolasyonuyla elektrik tüketiminde kalıcı %15-25 tasarruf.

### 7.2. İskonto Edilmiş Nakit Akışı (DCF) ve Gölge Karbon Fiyatlaması
Yatırımın finansal fizibilitesi, AB ETS ve SKDM kapsamında ton başına **Gölge Karbon Fiyatı (Shadow Carbon Price, $P_{\text{karbon}} \approx 25-85 \, \text{€}/tCO_2e$)** eklenerek modellenir:

$$\text{NPV} = - \text{CAPEX} + \sum_{t=1}^N \frac{\Delta \text{OPEX}_t + (\Delta \text{Emisyon}_t \times P_{\text{karbon}, t})}{(1 + r)^t}$$

$$\text{Payback Period} = \min \left\{ T : \sum_{t=1}^T \text{CF}_t \ge \text{CAPEX} \right\}$$

### 7.3. Yeşil Kredi İskonto Modeli (Greenium / Sustainability-Linked Loan)
Bankacılık entegrasyonunda, şirketin sağladığı karbon azaltım oranı ($\% \Delta E$) ve yeni dinamik ESG skoruna bağlı olarak kredi faiz oranı sübvanse edilir:

$$i_{\text{yeşil}} = i_{\text{piyasa}} - \delta_{\text{Greenium}}$$

$$\delta_{\text{Greenium}} = f(\Delta \text{ESG}, \text{Yeşil Kredi Skoru}) \in [0.50\%, 2.50\%]$$

Bu mekanizma, bankanın Basel III/IV İklim Risk Ağırlıklı Varlıklar (RWA) karşılığını düşürerek her iki tarafa da net finansal avantaj sağlar.

### 7.4. TSRS Otomatik Bağlam Aktarımı ve Banka Başvuru Köprüsü (`routers/carbon.py`, `routers/applications.py`)
Simülatör ve Banka Portalı birbirinden kopuk iki ada değildir; aralarındaki veri köprüsü otomatikleştirilmiş uç noktalarla sağlanır:
1. **Otomatik Bağlam Çıkarımı (`POST /api/carbon/aggregate-context`):**
   * Şirketin yayınlanmış TSRS raporundan (`report_versions` ve `simulator_contexts`) önerilen yeşil yatırımlar, baz emisyon verileri ve hedefleri otomatik olarak ayıklanır.
   * Gerektiğinde izole Python alt süreçleri (`subprocess`) veya Gemini/OpenAI API fallback'i ile güvenli JSON çıktısı üretilerek simülatör ekranına aktarılır.
2. **Kriptografik Başvuru Damgalama (`POST /api/credit-applications`):**
   * KOBİ simülatörde optimize ettiği teklifi seçip başvurduğunda; şirketin o anki aktif TSRS raporunun SHA-256 hash özeti hesaplanarak başvuru nesnesine (`report_hash`) kriptografik mühür olarak iliştirilir.
3. **Banka Portalı Kredi Yaşam Döngüsü:**
   * Banka kredi uzmanı `GET /api/credit-applications` ile portföyü listeler.
   * `ApplicationDetail` sayfasında başvuru detayı incelenir, damgalanmış `report_hash` backend'de `/api/report/verify` üzerinden doğrulanır.
   * İnceleme neticesinde bankacı `PATCH /api/credit-applications/{id}/status` çağrısıyla başvuruyu "Onaylandı" veya "Reddedildi" olarak karara bağlar.

---

## 8. Asenkron TSRS Raporlama Pipeline'ı ve Durum Makinesi (State Machine)

TSRS 1 ve TSRS 2 uyumlu 10 bölümlük raporun üretimi, asenkron ve hataya dayanıklı bir iş kuyruğu mimarisi üzerinde çalışır (`backend/modules/tsrs/job_service.py`, `backend/routers/report.py`).

### 8.1. Durum Makinesi Aşamaları (State Machine Transitions)

```text
 [İş Tetikleme] ──► [QUEUED] ──► [SNAPSHOTTING] ──► [NORMALIZING] 
                                                         │
 [PUBLISHED] ◄── [VALIDATING] ◄── [GENERATING] ◄─────────┘
      │
      ▼ (Hata durumunda herhangi bir aşamadan ──► [FAILED])
 [PDF Derleme & Önizleme]
```

1. **QUEUED:** İş `report_jobs` tablosuna benzersiz UUID ile kaydedilir. Çakışma kontrolü yapılır; devam eden bir iş varsa `409 Conflict` döner.
2. **SNAPSHOTTING:** Şirketin kaynak dizinindeki (`data/sources/<TICKER>/`) tüm kanıt dosyaları kilitlenir ve `source_fingerprint` oluşturulur.
3. **NORMALIZING:** Belgeler metinsel tokenlara ayrıştırılır ve hesaplanan metrikler (`modules/tsrs/metrics.py`) üretilir.
4. **GENERATING:** LangChain zinciri veya yerel deterministik şablon motoru devreye girerek 10 bölümü sırayla oluşturur. Canlı ilerleme `%0`dan `%90`a güncellenir.
5. **VALIDATING:** Üretilen metin denetim kurallarından geçirilir, SHA-256 hash değeri hesaplanır.
6. **PUBLISHING:** Rapor `report_versions` tablosuna aktarılır ve `simulator_contexts` tablosuna simülatör bağlamı kaydedilir.

### 8.2. ReportLab Profesyonel PDF Derleme Motoru (`modules/tsrs/pdf_export.py`)
Üretilen raporlar; kurumsal kapak sayfası, otomatik sayfa numaralandırması ("Sayfa X / Y"), şık başlık hiyerarşisi, veri tabloları ve altbilgide yer alan **SHA-256 doğrulama mührü** ile vektörel PDF dokümanı olarak derlenir. Tarayıcıda `inline` görüntüleme veya `attachment` indirme desteklenir.

---

## 9. Kriptografik Bütünlük ve Güvence İzi (Cryptographic Audit Trail)

Raporlama ve kredi tahsis süreçlerinde üçüncü taraf güvencesi (Third-Party Assurance) sağlamak için platform **Kriptografik İspat Mimarisi** içerir.

```
       [ Raporun Kök Özeti / Merkle Root: 0x9f4a...b8c1 ]
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

### 9.1. Canlı Hash Doğrulama Uç Noktası (Zero-Trust Verification: `POST /api/report/verify`)
Bankacılık kredi tahsis uzmanı veya bağımsız kamu denetçisi, şirketin sunduğu herhangi bir rapor özetini sıfır güven (zero-trust) ilkesiyle anında teyit edebilir (`backend/routers/report.py`):
* **Çoklu İstek Biçimi Desteği:** Uç nokta, web arayüzünün (`ApplicationDetail.jsx`) ilettiği `multipart/form-data` parametrelerini (`hash_to_verify`, `ticker`) doğrudan kabul eder.
* **İki Kademeli Sağlama:**
  1. *Veritabanı Katmanı:* `report_versions` tablosundaki kayıtlı ve onaylı rapor SHA-256 hash'leri taranır.
  2. *Fiziksel Dosya Sistemi Katmanı:* Ticker bazlı fiziksel Markdown raporunun anlık SHA-256 özeti hesaplanarak veritabanı ile eşleştirilir.
* **Güvenlik Çıktısı:**
  * Doğrulandıysa: `{ "status": "success", "verified": true, "version_id": "...", "ticker": "...", "reporting_year": 2025, "match_type": "database" }`
  * Tahrifat/Uyuşmazlık Varsa: `{ "status": "failed", "verified": false, "detail": "Verilen hash değeri sistemdeki hiçbir yayımlanmış rapor ile eşleşmedi." }`
Bu mekanizma sayesinde, PDF veya metin üzerinde manipülasyon yapılmış hiçbir sahte sürdürülebilirlik raporu banka tarafından onaylanamaz (Anti-Greenwashing Shield).

---

## 10. Veritabanı Şeması ve Tablo Sözleşmeleri (`backend/database.py`)

Kalıcı veri katmanı, SQLite üzerinde yabancı anahtar kısıtlamaları (Foreign Keys ON) ve Write-Ahead Logging (WAL) moduyla çalışır:

```sql
-- 1. ESG Kullanıcı Geri Bildirimleri
CREATE TABLE esg_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at TEXT NOT NULL,
    sentiment TEXT NOT NULL,
    pillar TEXT NOT NULL,
    impact_score REAL NOT NULL,
    explanation TEXT NOT NULL
);

-- 2. Halka Açık Çevre İhbarları
CREATE TABLE public_audits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT,
    company TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    upvotes INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'İnceleniyor',
    sentiment TEXT,
    pillar TEXT,
    impact_score REAL,
    explanation TEXT,
    created_at TEXT NOT NULL
);

-- 3. Tarihsel ESG Skor Günlüğü
CREATE TABLE esg_score_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    date TEXT NOT NULL,
    base_score REAL NOT NULL,
    feedback_mod REAL NOT NULL,
    audit_mod REAL NOT NULL,
    news_mod REAL NOT NULL DEFAULT 0,
    final_score REAL NOT NULL,
    UNIQUE(ticker, date)
);

-- 4. Google News RSS Haberleri
CREATE TABLE esg_news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    url TEXT NOT NULL,
    published_date TEXT,
    fetched_at TEXT NOT NULL,
    sentiment TEXT NOT NULL,
    pillar TEXT NOT NULL,
    impact_score REAL NOT NULL,
    explanation TEXT NOT NULL,
    UNIQUE(ticker, url)
);

-- 5. Yeşil Kredi Başvuruları
CREATE TABLE credit_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT,
    company_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    bank_rate REAL NOT NULL,
    base_rate REAL NOT NULL,
    discount_pct REAL NOT NULL,
    loan_amount REAL NOT NULL,
    loan_years INTEGER NOT NULL,
    monthly_payment REAL NOT NULL,
    green_credit_score INTEGER NOT NULL,
    decision TEXT NOT NULL,
    total_capex REAL,
    status TEXT NOT NULL DEFAULT 'Beklemede',
    report_hash TEXT,
    created_at TEXT NOT NULL
);

-- 6. Asenkron TSRS Rapor İş Kuyruğu
CREATE TABLE report_jobs (
    id TEXT PRIMARY KEY,
    ticker TEXT NOT NULL,
    reporting_year INTEGER NOT NULL,
    status TEXT NOT NULL,
    stage TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
    message TEXT NOT NULL DEFAULT '',
    error_code TEXT,
    error_details_json TEXT,
    source_fingerprint TEXT,
    report_version_id TEXT,
    created_at TEXT NOT NULL,
    started_at TEXT,
    finished_at TEXT,
    updated_at TEXT NOT NULL
);

-- 7. Yayınlanmış TSRS Rapor Sürümleri
CREATE TABLE report_versions (
    id TEXT PRIMARY KEY,
    ticker TEXT NOT NULL,
    reporting_year INTEGER NOT NULL,
    status TEXT NOT NULL,
    markdown_path TEXT NOT NULL,
    sha256 TEXT,
    source_fingerprint TEXT NOT NULL,
    validation_status TEXT NOT NULL,
    validation_details_json TEXT NOT NULL,
    model_provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    created_at TEXT NOT NULL,
    published_at TEXT
);

-- 8. TSRS Bağlamından Beslenen Simülatör Bağlamları
CREATE TABLE simulator_contexts (
    id TEXT PRIMARY KEY,
    report_version_id TEXT NOT NULL UNIQUE,
    ticker TEXT NOT NULL,
    reporting_year INTEGER NOT NULL,
    status TEXT NOT NULL,
    current_status TEXT,
    recommendation TEXT,
    suggested_investments_json TEXT,
    activity_text TEXT,
    model_provider TEXT,
    model_name TEXT,
    error_code TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(report_version_id) REFERENCES report_versions(id)
);
```

---

## 11. Kurumsal Hedef Genişleme Şartnamesi (Enterprise Scaling & Target State)

Platformun kurumsal banka konsorsiyumları ve ulusal ölçekte milyonlarca mükellefe hizmet verecek hedef mimari bileşenleri şunlardır:

1. **İlişkisel Veritabanı Geçişi (PostgreSQL 16 Enterprise):** ACID güvenceli çoklu şema (multi-tenant) veri izolasyonu ve satır seviyesi güvenlik (Row-Level Security - RLS).
2. **Zaman Serisi ve Sensör Verisi (TimescaleDB):** Fabrikalardan gelen akıllı sayaç (IoT) ve telemetri verilerinin saniyelik hipertablolarda tutulması.
3. **Dağıtık Nesne Depolama (MinIO / S3):** Milyonlarca taranmış faturanın ve imzalı PDF raporunun şifrelenmiş (AES-256) içerik adresli nesne deposunda saklanması.
4. **Olay Güdümlü Kuyruk Mimarisi (Apache Kafka & Celery/Redis):** VLM belge okuma, SHAP hesaplama ve toplu haber analizlerinin dağıtık worker havuzlarında paralel işletilmesi.
5. **Vektör Veritabanı ve Hibrit Arama (Qdrant / Milvus):** Sektörel faaliyet raporları ve akademik emisyon faktörleri üzerinde Retrieval-Augmented Generation (RAG) sorguları için anlamsal indeksleme.

---

## 12. Sonuç ve Stratejik Etki

EkoFin mimarisi; karmaşık akademik algoritmaları (XGBoost, TreeSHAP, Fin-NLP, GHG Protocol) ve regülatif gereksinimleri (KGK TSRS, CSRD, SKDM) kullanıcı dostu, otomatikleştirilmiş ve güvenli bir SaaS ekosisteminde buluşturmaktadır. 

Bu dökümanda detaylandırılan sistem şartnamesi; yalnızca yeşil dönüşümü ölçülebilir kılmakla kalmayıp, reel sektörün sermaye maliyetini doğrudan ucuzlatan, finansal kuruluşların yeşil varlık rasyosunu (GAR) artıran ve kamusal şeffaflığı kriptografik olarak güvenceye alan yeni nesil bir **İklim Teknolojisi Standardı** sunmaktadır.
