# 🚀 EkoFin API Endpoint Kılavuzu ve Referans Dokümantasyonu

Bu doküman, EkoFin backend servisindeki tüm REST API uç noktalarını (endpoints), parametrelerini, veri modellerini ve frontend entegrasyonlarını özetler.

Backend FastAPI Gateway Portu: `http://localhost:8000`  
Etkileşimli Swagger Dokümantasyonu: `http://localhost:8000/docs`

---

## 📑 Modüler Router Mimarisi Özeti

```text
backend/
├── api.py                    # Ana Gateway & Router Birleştirici (~90 satır)
└── routers/
    ├── __init__.py           # Paket tanımlayıcısı
    ├── common.py             # Paylaşılan modeller, lazy-load yardımcıları ve şirket sabitleri
    ├── documents.py          # Belge yükleme, OCR durumu, anket beyanı ve dashboard özeti
    ├── report.py             # TSRS 10 bölümlük rapor üretimi, son rapor ve blokzincir hash doğrulama
    ├── carbon.py             # Karbon hesaplama motoru, yeşil kredi skorlama ve G-ROI simülatörü
    ├── esg.py                # XGBoost ESG tahmini, Model Kartı, TreeSHAP, haberler ve geri bildirim
    ├── finance.py            # Yeşil kredi teklifleri ve kitlesel fonlama projeleri
    └── audits.py             # Halka açık denetim (Public Audits), ihbar bildirimi ve moderasyon
```

---

## 1. Belge ve Yönetici Beyanı Modülü (`routers/documents.py`)

Şirketlerin OCR belgelerini (EKB, mizan, fatura, SGK vb.) ve yönetim kurulu beyanlarını yönetir.

| Metot | Uç Nokta (Endpoint) | Parametreler | Açıklama |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | `ticker` *(opsiyonel)* | Dashboard için doğrulanmış belge sayısı, anket durumu, rapor hash'i ve işlenen veri özetini döner. |
| `POST` | `/api/documents/upload` | `file`, `doc_type`, `ticker` | Şirkete özel OCR belgesini yükler, dosya tipine göre doğrular ve `sources/` dizinine kaydeder. |
| `GET` | `/api/documents/list` | `ticker` *(opsiyonel)* | Şirketin son yüklediği belge paketlerinin geçmiş logunu (son 20) döner. |
| `GET` | `/api/documents/status` | `ticker` *(opsiyonel)* | 9 temel TSRS belgesinin ve anketin yüklenme durumunu (`verified` / `not_uploaded`) döner. |
| `DELETE` | `/api/documents/{doc_type}` | `doc_type` *(path)*, `ticker` | Yüklenmiş bir belgeyi diskten ve meta kaydından siler; yeniden yüklenebilir hale getirir. |
| `DELETE` | `/api/documents/list/{upload_index}` | `upload_index` *(path)*, `ticker` | Yükleme geçmişi listesinden belirli bir log kaydını siler. |
| `POST` | `/api/declaration` | Body (`DeclarationData`), `ticker` | Yönetici Anketi (çalışan, araç, enerji, ISO sertifikaları) verilerini şirkete özel JSON olarak kaydeder. |
| `GET` | `/api/declaration` | `ticker` *(opsiyonel)* | Şirketin önceden kaydettiği yönetici anketi verilerini döner. |
| `DELETE` | `/api/declaration` | `ticker` *(opsiyonel)* | Kayıtlı yönetici beyanını siler (formun baştan doldurulması için). |

---

## 2. TSRS Sürdürülebilirlik Raporu Modülü (`routers/report.py`)

KGK Türkiye Sürdürülebilirlik Raporlama Standartları (TSRS 1 Genel ve TSRS 2 İklim) ile uyumlu resmi raporlama ve kriptografik doğrulama sağlar.

| Metot | Uç Nokta (Endpoint) | Parametreler | Açıklama |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/report/generate` | `ticker` *(opsiyonel)* | LangChain motorunu tetikleyerek 10 bölümlük TSRS raporunu sırayla üretir ve ilerleme durumunu günceller. |
| `GET` | `/api/report/latest` | `ticker` *(opsiyonel)* | Şirket için en son üretilmiş TSRS raporunun Markdown metnini, üretim tarihini ve SHA-256 hash'ini döner. |
| `GET` | `/api/report/status` | `ticker` *(opsiyonel)* | Rapor üretiminin anlık durumunu (`idle`, `generating`, `completed`, `error`) ve yüzde ilerlemesini (%0-100) döner. |
| `POST` | `/api/report/verify` | `hash_to_verify` *(form)*, `ticker` | Kullanıcının elindeki SHA-256 hash'ini sistemdeki resmi rapor dosyasının hash'i ile karşılaştırarak doğrular. |

---

## 3. Karbon, Yeşil Kredi ve Simülatör Modülü (`routers/carbon.py`)

Fiziksel emisyon hesaplama, Yeşil Kredi derecelendirmesi ve G-ROI yatırım getirisi analizlerini yürütür.

| Metot | Uç Nokta (Endpoint) | Parametreler | Açıklama |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/carbon/calculate` | Body (`CalculationRequest`) | Serbest metinden veya formdan Kapsam 1-2 emisyonlarını hesaplar; Yeşil Kredi Notunu (0-100), faiz indirimini ve 5 yıllık G-ROI tasarrufunu üretir. |
| `GET` | `/api/simulator/auto-context` | `ticker` *(opsiyonel)* | Şirketin KAP ve TSRS verilerini otomatik derler; Gemini LLM üzerinden şirkete özel yeşil yatırım (GES, EV Filosu, Verimlilik) önerileri üretir. |

---

## 4. ESG Tahmin ve NLP Analitiği Modülü (`routers/esg.py`)

XGBoost makine öğrenmesi modeli, Google News RSS, sentiment analizi ve halka açık geri bildirim entegrasyonu.

| Metot | Uç Nokta (Endpoint) | Parametreler | Açıklama |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/esg/model-card` | - | Google Model Cards formatında XGBoost modelinin eğitim parametrelerini, R² / RMSE metriklerini ve SHAP önem sıralamasını döner. |
| `GET` | `/api/esg/explain/{ticker}` | `ticker` *(path)* | Şirketin KAP verileri üzerinden XGBoost skorunu TreeSHAP ile yerel öznitelik katkılarına (+/- puan) ayrıştırır. |
| `GET` | `/api/esg/companies` | - | BIST 100 şirketlerinin geçmiş tahmin serilerini, canlı toplumsal modülasyon puanlarını, 7 günlük delta'larını ve AI içgörülerini döner. |
| `POST` | `/api/esg/predict` | Body (`CompanyFeatures`) | Finansal ve operasyonel rasyolar verildiğinde eğitilmiş XGBoost modeli ile anlık ESG Overall skoru (0-100) tahmin eder. |
| `GET` | `/api/esg/health` | - | XGBoost model dosyasının yüklü olup olmadığını ve feature sayısını test eden sağlık kontrolü. |
| `GET` | `/api/esg/feedback/{ticker}` | `ticker` *(path)* | Şirket için yapılmış kullanıcı yorumlarını, yıldız puanlarını ve NLP duygu analizi etiketlerini döner. |
| `POST` | `/api/esg/feedback/{ticker}` | `ticker` *(path)*, Body (`FeedbackSubmit`) | Şirket için yeni yorum ekler; metin anında NLP analizinden geçirilerek şirketin dinamik ESG skorunu modüle eder. |
| `GET` | `/api/esg/score-history/{ticker}` | `ticker` *(path)* | Şirketin SQLite'ta tutulan günlük gerçek skor geçmişini ve son 7/30 günlük değişim delta'larını döner. |
| `GET` | `/api/esg/news/{ticker}` | `ticker` *(path)* | Şirketle ilgili güvenilir kaynaklardan çekilen güncel haberleri ve her haberin ESG skor etkisini döner. |
| `POST` | `/api/esg/news/{ticker}/refresh` | `ticker` *(path)* | Şirketin Google News RSS akışını zorla yeniler ve yeni haberleri NLP analiziyle kaydeder. |

---

## 5. Finans ve Kredi Teklifleri Modülü (`routers/finance.py`)

Bankaların yeşil kredi ürünlerini ve kitlesel fonlama (crowdfunding) fırsatlarını listeler.

| Metot | Uç Nokta (Endpoint) | Parametreler | Açıklama |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/credits` | - | Anlaşmalı bankaların yeşil kredi tekliflerini, faiz oranlarını ve vade seçeneklerini döner. |
| `GET` | `/api/crowdfunding` | - | Platformdaki aktif yeşil kitlesel fonlama projelerini, fonlama hedeflerini ve toplanan tutarları döner. |

---

## 6. Halka Açık Denetim Modülü (`routers/audits.py`)

Vatandaşların ve paydaşların çevre ihlallerini bildirebildiği şeffaflık ve denetim mekanizması.

| Metot | Uç Nokta (Endpoint) | Parametreler | Açıklama |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/public-audits` | `ticker` *(opsiyonel)* | Tüm kamuya açık çevre/sosyal ihlal ihbarlarını listeler (opsiyonel şirket filtresiyle). |
| `POST` | `/api/public-audits` | Body (`AuditSubmit`) | Yeni çevre veya sosyal ihlal bildirimi oluşturur; açıklama NLP analizinden geçirilir. |
| `POST` | `/api/public-audits/{audit_id}/upvote` | `audit_id` *(path)* | Bir ihbarın topluluk onayını (upvote sayısını) 1 artırır. |
| `PATCH` | `/api/public-audits/{audit_id}/status` | `audit_id` *(path)*, Body (`AuditStatusUpdate`) | İhbarın inceleme durumunu günceller (`Doğrulandı`, `Reddedildi` vb.). Sadece doğrulanan ihbarlar ESG skorunu cezalandırır. |
