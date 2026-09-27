# TSRS Pipeline – Frontend Entegrasyonu Uygulama Planı

## 1. Amaç ve mevcut durum

Bu belge, başka bir geliştirici veya kodlama modelinin ek ürün kararı vermeden TSRS üretim akışını backend ve frontend arasında güvenilir şekilde bağlaması için hazırlanmıştır.

Mevcut sistem endpoint çağırıp Markdown dosyası oluşturabiliyor; ancak üretim akışı güvenilir değildir:

- `POST /api/report/generate` yaklaşık 4–5 dakika HTTP isteğini açık tutuyor.
- İlerleme durumu process belleğinde tutuluyor ve backend yeniden başlatılınca kayboluyor.
- `TsrsReport.jsx` içinde `queryTicker` tanımlanmadan kullanılabiliyor.
- Rapor dönemi ve yayın tarihi hardcoded.
- Rapor yokken g-ROI endpointi KAP/sentetik fallback ile durum ve tavsiye üretiyor.
- Simülatör gerçek veri yokken 120 ton baseline ve örnek bütçeler kullanıyor.
- `ASELS` ve `TOASO` için veri kontrollerini atlayan özel durumlar bulunuyor.
- Dosyanın oluşması içerik doğrulaması yapılmadan başarı kabul ediliyor.
- “TSRS Onaylı”, “Resmî Uyum Belgesi”, “dijital mühür” ve KGK portal doğrulaması gibi kanıtlanmayan ifadeler gösteriliyor.
- PDF butonu gerçek PDF indirmek yerine raporu yeniden üretiyor.

Hedef akış:

```text
Belge/Beyan
    ↓
Hazırlık kontrolü
    ↓
SQLite kalıcı rapor işi
    ↓
Kaynak snapshot + normalize veri
    ↓
Deterministik hesaplar + LLM anlatımı
    ↓
Kalite doğrulama kapısı
    ├── başarısız → taslak reddedilir, son geçerli rapor korunur
    └── başarılı → rapor yayımlanır
                         ↓
              g-ROI bağlamı ve tavsiyesi üretilir
                         ↓
                  Frontend state yenilenir
```

## 2. Kesinleşmiş kararlar

- İş kuyruğu ve durumlar mevcut SQLite veritabanında tutulacak.
- Redis/Celery eklenmeyecek; tek FastAPI instance kullanılacak.
- Pipeline HTTP request thread'ini bloklamayacak.
- TSRS ve g-ROI için aynı OpenAI uyumlu servis kullanılacak.
- OpenAI hatasında mock/sabit rapora sessiz geçiş yapılmayacak.
- Şirket kimliği şimdilik `ticker` query parametresiyle taşınacak; format ve path kontrolü zorunlu olacak.
- Raporlama yılını kullanıcı seçecek; varsayılan tamamlanmış son takvim yılı olacak.
- Kritik girdiler: faaliyet raporu, mizan, faturalar ve yönetici beyanı.
- Diğer belgeler eksikse rapor üretilebilir; eksikler açık veri boşluğu olarak yazılır.
- Yeni rapor doğrulamadan geçmezse son geçerli rapor korunur.
- Simülatör her durumda açılır; geçerli ve güncel rapor yoksa hesaplama kapalıdır.
- Tarihler UTC saklanır, arayüzde `Europe/Istanbul` ile gösterilir.
- İlk sürümde gerçek PDF yoktur; buton “Markdown indir” olur.

## 3. Kullanılacak teknoloji

### Backend

- FastAPI ve mevcut router yapısı.
- Pydantic request/response ve LLM structured output modelleri.
- SQLite; her worker işleminde ayrı connection.
- `asyncio.to_thread` veya `ThreadPoolExecutor(max_workers=1)` ile tek rapor worker'ı.
- `langchain_openai.ChatOpenAI` ile TSRS ve g-ROI üretimi.
- `hashlib.sha256` ile kaynak fingerprint ve çıktı hash'i.
- `uuid.uuid4()` ile job ve rapor sürüm kimlikleri.
- Hesaplamalarda `Decimal`; float ile finansal/emisyon toplamı yapılmamalı.

Ortam değişkenleri:

```env
OPENAI_API_KEY=...
OPENAI_API_BASE=https://.../v1
OPENAI_TSRS_MODEL=gpt-5.4
OPENAI_GROI_MODEL=gpt-5.4
REPORT_WORKER_POLL_MS=500
OPENAI_TIMEOUT_SECONDS=120
OPENAI_MAX_RETRIES=2
```

`OPENAI_API_BASE` opsiyoneldir. API anahtarı, prompt veya belge içeriği loglanmamalıdır.

### Frontend

- React 19 ve mevcut `fetch` yaklaşımı korunacak.
- Ortak TSRS durumu React Context ve custom hook ile yönetilecek.
- Polling kontrollü `setTimeout` ve `AbortController` ile yapılacak; çakışan interval oluşturulmayacak.
- Tarihler `Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Istanbul' })` ile gösterilecek.
- Test için `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `msw` ve `@playwright/test` eklenecek.

## 4. SQLite veri modeli

Mevcut `database.py` içindeki idempotent `init_db()` yaklaşımıyla üç tablo eklenecek.

### `report_jobs`

```sql
CREATE TABLE IF NOT EXISTS report_jobs (
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
```

Durumlar: `queued`, `snapshotting`, `normalizing`, `generating`, `validating`, `publishing`, `generating_context`, `completed`, `completed_with_warnings`, `failed`, `interrupted`.

Aynı `ticker + reporting_year` için yalnız bir terminal olmayan işe izin verilecek. Kontrol SQLite transaction içinde yapılacak; çakışmada API `409` ve mevcut `job_id` döndürecek.

### `report_versions`

```sql
CREATE TABLE IF NOT EXISTS report_versions (
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
```

`status`: `draft`, `published`, `rejected`. Her şirket/yıl için sürüm geçmişi tutulacak; frontend yalnız son `published` sürümü kullanacak.

### `simulator_contexts`

```sql
CREATE TABLE IF NOT EXISTS simulator_contexts (
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

`status`: `pending`, `ready`, `failed`.

Mevcut `_uploads_meta.json` içindeki `verified` gerçek güvence sayılmayacak. Yeni sözleşmede `ingestion_status: uploaded|parsed|invalid` ve `assurance_status: unverified|verified` ayrılacak. Eski `verified`, geçiş sırasında `parsed + unverified` olarak okunacak. `fatura` ile `efatura` aynı fiziksel dosya olduğundan iki belge sayılmayacak.

## 5. Hazırlık, snapshot ve güncellik

### Ticker doğrulaması

```text
^[A-Z0-9][A-Z0-9._-]{0,15}$
```

`/`, `\`, `..`, boş ticker ve 16 karakterden uzun değer reddedilecek. Hedef yol `resolve()` edilecek ve kaynak kök dizini altında kaldığı doğrulanacak. Geçersiz ticker `422 invalid_ticker` döndürecek. Sessiz `ASELS` fallback'i kaldırılacak.

Kritik kanonik kaynaklar:

```text
faaliyet   -> şirket-faliyet-raporu.md
mizan      -> mizan.md
fatura     -> faturalar.md
declaration -> yonetici_anketi.json
```

Veri durumları:

- `empty`: kaynak ve beyan yok.
- `incomplete`: veri var ama kritik set eksik/parse edilemiyor.
- `ready`: kritik set tam ve parse edilebilir.

Üretim başında kullanılan dosyalar `backend/output/{TICKER}/runs/{JOB_ID}/sources/` altına kopyalanacak. Pipeline canlı upload klasörünü değil bu değişmez snapshot'ı okuyacak.

Fingerprint şu girdilerden canonical JSON üzerinden hesaplanacak:

- raporlama yılı;
- sıralanmış dosya adı ve SHA-256 değerleri;
- normalize yönetici beyanı;
- emisyon faktörü seti sürümü;
- prompt/template sürümü.

Rapor durumları:

- `missing`: yayımlanmış rapor yok.
- `current`: yıl ve fingerprint mevcut girdilerle aynı, validation başarılı.
- `stale`: kaynak, beyan, faktör, prompt veya yıl değişmiş ya da kritik belge eksilmiş.
- `invalid`: yalnız reddedilmiş taslak var.

`stale_reasons`: `source_changed`, `declaration_changed`, `critical_source_missing`, `reporting_year_changed`, `factor_version_changed`, `prompt_version_changed`.

## 6. Kalıcı worker ve yüzde ilerleme

FastAPI startup aşamasında tek report worker başlatılacak. Worker en eski `queued` işi alacak ve her geçişi SQLite'a yazacak. Startup sırasında yarım kalmış işler `interrupted` yapılacak; maliyet riski nedeniyle otomatik tekrar başlatılmayacak.

Frontend yüzdesi yalnız gerçek backend aşamasından gelecek:

| Yüzde | Stage | Mesaj |
|---:|---|---|
| 0 | `queued` | Rapor işi sıraya alındı. |
| 5 | `snapshotting` | Kaynak belgelerin değişmez kopyası hazırlanıyor. |
| 10 | `normalizing` | Veriler doğrulanıyor ve ortak formata dönüştürülüyor. |
| 15 | `generating` | Kapak ve rapor kimliği hazırlanıyor. |
| 22 | `generating` | Rapor kapsamı hazırlanıyor. |
| 29 | `generating` | Yönetişim bölümü hazırlanıyor. |
| 36 | `generating` | Strateji bölümü hazırlanıyor. |
| 43 | `generating` | Risk yönetimi bölümü hazırlanıyor. |
| 50 | `generating` | Metrikler ve hedefler hazırlanıyor. |
| 57 | `generating` | Muhakemeler ve belirsizlikler hazırlanıyor. |
| 64 | `generating` | Ekler ve metodoloji hazırlanıyor. |
| 71 | `generating` | İletişim bölümü hazırlanıyor. |
| 78 | `generating` | Güvence açıklaması hazırlanıyor. |
| 82 | `generating` | Bölümler birleştiriliyor. |
| 86 | `validating` | Rapor tutarlılık kontrolünden geçiriliyor. |
| 92 | `publishing` | Doğrulanan rapor yayımlanıyor. |
| 95 | `generating_context` | g-ROI şirket durumu ve tavsiyeleri hazırlanıyor. |
| 100 | `completed` | Rapor ve simülatör bağlamı hazır. |

Job cevabında daima `status`, `stage`, `progress`, `message`, `updated_at` bulunacak. Frontend 1,5 saniyede bir polling yapacak. Üç ağ hatasından sonra 3–5 saniye backoff uygulanacak; sekme görünür değilken aralık 5 saniye olacak. Terminal durumda polling duracak.

UI'da dönen `RefreshCw`, gerçek yüzde, progress bar ve backend mesajı gösterilecek. Frontend sahte log veya sahte ilerleme üretmeyecek. Sayfa yenilenince readiness cevabındaki `active_job_id` ile polling sürecek.

## 7. Pipeline güvenilirliği

- Modül seviyesindeki global aktif path/state kaldırılacak; her işe immutable `PipelineContext` verilecek.
- Pipeline `PipelineResult` döndürecek:

```python
class PipelineResult(BaseModel):
    draft_path: str
    normalized_facts: dict
    section_results: list[dict]
    model_name: str
    prompt_version: str
    token_usage: dict | None
```

- Elektrik, gaz, yakıt, su, çalışan, atık ve finansal metrikler önce normalize edilecek.
- Kapsam 1, Kapsam 2, toplam ve yoğunluk Python `Decimal` ile hesaplanacak; LLM hesap yapmayacak.
- LLM yalnız ilgili bölüm kaynaklarını ve kanonik hesapları alacak. Önceki raporun tamamı her çağrıya eklenmeyecek.
- Benchmark'tan şirket adı, içerik, görsel, hash ve doğrulama iddiası taşınmayacak; yalnız statik yazım stili kullanılacak.
- Eksik API anahtarı veya model hatası job'ı `failed` yapacak; mock çıktı oluşturulmayacak.
- Kanıt olmadan şu ifadeler yasaklanacak: tam/koşulsuz TSRS uyumu, bağımsız güvence, “doğrulandı”, KGK portalı, blockchain, QR entegrasyonu, sertifika doğrulaması ve resmî hedef.
- Rapor içine kendi hash'i yazılmayacak. Hash son dosya byte'larından hesaplanıp DB/API metadata'sında tutulacak.
- Validation; zorunlu bölümleri, kanonik sayıları, bölümler arası sayı tutarlılığını, kaynak dışı özel isimleri, placeholder'ları, eksik veri açıklamalarını ve sentetik fixture etiketini kontrol edecek.
- Validation başarısızsa sürüm `rejected` olacak; yayın pointer'ı değişmeyecek.

## 8. g-ROI bağlamı

`GET /api/simulator/auto-context` hiçbir durumda LLM çağırmayacak. Bağlam yalnız yayımlanan rapordan sonra job'ın `%95` aşamasında üretilecek.

Structured output:

```python
class SuggestedInvestment(BaseModel):
    code: Literal["ges", "ev", "efficiency", "waste", "water"]
    title: str
    rationale: str
    enabled: bool
    budget_try: Decimal = Field(ge=0)
    vehicle_count: int | None = Field(default=None, ge=0)

class SimulatorContextOutput(BaseModel):
    current_status: str
    recommendation: str
    activity_text: str
    investments: list[SuggestedInvestment]
```

Prompt yalnız rapor kimliği, normalize gerçekler, hesaplanmış emisyonlar ve veri boşluklarını alacak. Modelin yeni tesis, araç, tüketim, tasarruf yüzdesi veya doğrulama iddiası uydurmasına izin verilmeyecek. Çıktı Pydantic ve iş kurallarıyla doğrulanacak.

Bağlam üretimi başarısızsa rapor yayımlanmış kalacak, job `completed_with_warnings`, context `failed` olacak. Ayrı retry endpointi yalnız bağlamı yeniden üretecek.

## 9. API sözleşmeleri

### Readiness

```http
GET /api/report/readiness?ticker=TESTCO&reporting_year=2025
```

```json
{
  "ticker": "TESTCO",
  "reporting_year": 2025,
  "data_state": "ready",
  "critical_documents": {
    "required": ["faaliyet", "mizan", "fatura", "declaration"],
    "missing": []
  },
  "latest_source_updated_at": "2026-09-27T14:00:00Z",
  "report_state": "current",
  "active_job_id": null,
  "last_report": {
    "id": "uuid",
    "generated_at": "2026-09-27T14:05:00Z",
    "sha256": "hex",
    "validation_status": "passed"
  },
  "freshness": {"is_current": true, "reasons": []},
  "can_generate": true,
  "can_use_simulator": true
}
```

### Rapor başlatma

```http
POST /api/report/generate?ticker=TESTCO
Content-Type: application/json

{"reporting_year": 2025}
```

Başarılı başlangıç `HTTP 202`:

```json
{
  "job_id": "uuid",
  "status": "queued",
  "status_url": "/api/report/jobs/uuid"
}
```

Kritik veri eksikse `422`, aktif iş varsa `409`, sağlayıcı yoksa `503`.

### İş durumu

```http
GET /api/report/jobs/{job_id}
```

```json
{
  "job_id": "uuid",
  "ticker": "TESTCO",
  "reporting_year": 2025,
  "status": "generating",
  "stage": "generating",
  "progress": 43,
  "message": "Risk yönetimi bölümü hazırlanıyor.",
  "report_version_id": null,
  "error": null,
  "updated_at": "2026-09-27T14:03:00Z"
}
```

### Son geçerli rapor

```http
GET /api/report/latest?ticker=TESTCO&reporting_year=2025
```

Rapor yoksa geriye uyumluluk için `200` ve `{"status":"not_found","report":null}` dönecek. Rapor varsa content, version id, tarih, hash, validation ve freshness dönecek.

### Simülatör bağlamı

```http
GET /api/simulator/auto-context?ticker=TESTCO&reporting_year=2025
```

```json
{
  "state": "ready",
  "usable": true,
  "report": {
    "id": "uuid",
    "generated_at": "2026-09-27T14:05:00Z",
    "is_current": true
  },
  "current_status": "...",
  "llm_recommendation": "...",
  "activity_text": "...",
  "suggested_investments": {
    "ges_budget": 800000,
    "ev_count": 3,
    "eff_budget": 250000,
    "waste_budget": 150000,
    "water_budget": 75000
  }
}
```

`missing_data`, `data_incomplete` ve `report_missing` durumlarında dört içerik alanı `null` olacak. `report_stale` eski bağlamı salt okunur döndürebilir fakat `usable: false` olacak.

Ek endpointler:

```text
POST /api/report/{report_version_id}/simulator-context/retry
GET  /api/report/{report_version_id}/download?format=md
```

Standart hata gövdesi:

```json
{
  "error": {
    "code": "critical_sources_missing",
    "message": "Rapor için gerekli veriler eksik.",
    "details": {"missing": ["mizan", "fatura"]}
  }
}
```

Eski `/api/report/status` bir geçiş sürümü korunacak; yeni frontend yalnız job endpointini kullanacak.

## 10. Frontend servis ve ortak state

Yeni modüller:

```text
frontend/src/api/tsrs.js
frontend/src/context/TsrsStateContext.jsx
frontend/src/hooks/useTsrsState.js
frontend/src/components/tsrs/TsrsStatusBar.jsx
frontend/src/components/tsrs/ReportJobProgress.jsx
frontend/src/components/tsrs/TsrsEmptyState.jsx
frontend/src/components/tsrs/FreshnessBadge.jsx
```

API client fonksiyonları:

```text
getReadiness(ticker, year, signal)
startReportJob(ticker, year, signal)
getReportJob(jobId, signal)
getLatestReport(ticker, year, signal)
getSimulatorContext(ticker, year, signal)
retrySimulatorContext(reportVersionId, signal)
downloadReport(reportVersionId)
```

Her fonksiyon `res.ok` kontrolü, güvenli JSON/error parse ve `URLSearchParams` encoding yapacak. Sayfa bileşenlerinde dağınık doğrudan `fetch` çağrısı kalmayacak.

Ortak state:

```js
{
  ticker,
  reportingYear,
  readiness,
  activeJob,
  latestReport,
  simulatorContext,
  loading,
  error
}
```

Ticker/yıl değişiminde eski state temizlenecek ve requestler abort edilecek. Aktif job bulunursa polling yeniden başlayacak. Terminal durumda readiness, latest report ve simulator context birlikte yenilenecek.

## 11. TSRS ekranı

`queryTicker` kullanım sırası düzeltilecek:

```js
const [searchParams] = useSearchParams();
const queryTicker = searchParams.get('ticker');
const ticker = normalizeTicker(currentUser?.companyTicker || queryTicker);
```

Ticker yoksa sayfa çökmek veya ASELS göstermek yerine “Şirket seçilmedi” gösterecek.

Sade üst durum satırı:

```text
[2025 ▼]  Son rapor: 27 Eyl 2026 17:46  [✓ Veriler güncel]  [Raporu güncelle]
```

Durum gösterimi:

- Rapor yok: “Son rapor: Henüz oluşturulmadı”.
- Güncel: yeşil `CheckCircle`, “Veriler güncel”.
- Eski: turuncu `XCircle`, “Güncelleme gerekli” ve kısa neden.
- Üretiliyor: spinner, gerçek yüzde, progress bar ve backend mesajı.
- Hatalı taslak: kırmızı `AlertCircle`; son geçerli rapor görünmeye devam eder.

Kritik veri eksikleri sade kutuda listelenecek ve Veri Entegrasyonu CTA'sı verilecek. Rapor yoksa hardcoded örnek metin ve ESG/SHAP kutuları gösterilmeyecek.

Şunlar kaldırılacak: hardcoded yıl/tarih, `Resmi Uyum Belgesi`, `TSRS Onaylı`, `SHA-256 Dijital Mühür`, `imzalı resmi PDF`, frontend tarafından üretilmiş terminal logları ve rapor başlığındaki bağımsız ESG/SHAP skoru.

Hash etiketi “SHA-256 dosya özeti” olacak. Export butonu yeni rapor üretmeyecek; mevcut published Markdown dosyasını indirecek.

## 12. g-ROI simülatörü

Başlangıç state'i:

```js
autoContext = null
inputText = ''
baselineEmission = null
gesBudget = null
evCount = null
effBudget = null
wasteBudget = null
waterBudget = null
```

Geçerli bağlam gelmeden 120 ton varsayımı, otomatik dağılım ve örnek yatırım hesabı yapılmayacak. ("Model C Sihirbaz Modu" UI'dan kaldırıldı).

| State | Gösterim | Aksiyon |
|---|---|---|
| `missing_data` | “Şirket verisi yüklenmedi.” | Veri Entegrasyonuna Git |
| `data_incomplete` | “TSRS için gerekli veriler eksik.” | Eksik Verileri Tamamla |
| `report_missing` | “Veriler hazır ancak TSRS raporu oluşturulmadı.” | TSRS Raporu Oluştur |
| `context_pending` | Spinner ve “AI bağlamı hazırlanıyor.” | Bekle |
| `context_failed` | “Rapor hazır ancak tavsiye üretilemedi.” | Tavsiyeyi Yeniden Dene |
| `report_stale` | Eski bağlam gri/salt okunur | Raporu Güncelle |
| `ready` | Durum, tavsiye ve yatırımlar | Simülasyona Devam Et |

İlk üç durumda durum ve tavsiye kartlarının içeriği tamamen boş olacak. “KAP Paneli” fallback'i kaldırılacak. Hazır bağlamda rapor tarihi/yılı gösterilecek. Eski raporla hesaplama yapılmayacak. Simülatör açıkken job tamamlanırsa ortak Context bağlamı otomatik yenileyecek.

## 13. Integration, Dashboard ve Sidebar

- Veri Entegrasyonu sayfasında devasa TSRS raporlama oluşturma kısmı kaldırıldı. Bunun yerine sayfanın en altında sade, kompakt bir footer kontrol barı eklendi.
- Bu footer'daki “Rapor oluştur” butonu önce readiness çağıracak; hazırsa job oluşturup `/tsrs-report?year=YYYY&job=UUID` adresine gidecek.
- Eksikse aynı ekranda kritik eksik listesini gösterecek.
- “Kriptografik mühür” yerine “Kalite kontrolünden geçti” yazılacak.
- Dashboard ve Sidebar `ASELS/TOASO` hardcoded hazır kabulünü kaldıracak.
- “Herhangi veri var” ile “rapor üretmeye hazır” ayrılacak.
- Sidebar sayfayı kilitlemek yerine sayfanın kendi empty state'ini göstermesine izin verecek.
- Tüm sayfalarda typography (`.page-title`, `.page-subtitle`) ve padding/gap standartları global `index.css` üzerinden sağlanacak.
- Bütün ekranlar tek readiness sözleşmesini kullanacak.

## 14. Hata yönetimi ve loglama

Hata kodları: `invalid_ticker`, `provider_unavailable`, `critical_sources_missing`, `source_parse_failed`, `generation_failed`, `validation_failed`, `context_generation_failed`, `server_restarted`.

Loglarda job id, ticker, yıl, stage, süre, model ve varsa token kullanımı bulunacak. Anahtar, tam prompt ve belge içeriği loglanmayacak. Kalıcı 4xx model hatalarında retry yapılmayacak. Kullanıcı tekrar üretime basarsa yeni maliyet oluşturmak yerine aktif işe yönlendirilecek.

## 15. Test planı

### Backend

- Ticker doğrulama ve path traversal reddi.
- `empty`, `incomplete`, `ready` hazırlık durumları.
- Fingerprint determinizmi ve kaynak/beyan/faktör/prompt değişimi.
- `Decimal` emisyon hesapları.
- Job geçişleri, yüzdeler, duplicate `409`, restart sonrası `interrupted`.
- LLM hatasında mock üretilmemesi.
- Validation başarısızlığında son published raporun korunması.
- Dosya hash'inin gerçek byte'larla eşleşmesi.
- Auto-context'in rapor yokken bütün metinleri `null` döndürmesi.
- Context'in yalnız published rapordan üretilebilmesi.

### TESTCO entegrasyonu

- Kapsam 1 `136,05`, Kapsam 2 `180,00`, toplam `316,05 tCO2e`.
- `276,96` değerinin Kapsam 1+2 toplamı olarak kullanılması validation hatası.
- Kaynaksız portal, blockchain, doğrulama ve tam uyum iddiaları raporu reddetmeli.
- Kaynak değişince readiness `stale`, simülatör `usable: false` olmalı.
- g-ROI LLM hatasında rapor published kalmalı, context `failed` olmalı.
- Canlı OpenAI testi yalnız `RUN_LIVE_LLM_TESTS=1` ile opt-in çalışmalı.

### Frontend

- Ticker olmayan kullanıcıda TSRS ekranı çökmemeli.
- Veri yokken simülatör metinleri ve varsayılan hesaplar görünmemeli.
- Eksik veri ve rapor yok durumları doğru CTA'yı göstermeli.
- Yüzde/stage backend cevabıyla aynı görünmeli.
- Yenilemede aktif job polling'i devam etmeli.
- Son rapor tarihi API'den Türkçe formatlanmalı.
- Güncel raporda yeşil tik, stale raporda turuncu çarpı görünmeli.
- Yeni belge simülatörü kilitlemeli.
- Başarısız yeni rapor önceki geçerli raporu korumalı.
- Context hazır olunca durum, tavsiye ve bütçeler görünmeli.
- Export yeni LLM çağrısı yapmadan dosyayı indirmeli.
- Yasak UI ifadeleri bulunmamalı.

Zorunlu doğrulama komutları:

```powershell
cd backend
python -m pytest -q
python scripts/validate_tsrs_testco.py

cd ../frontend
npm run lint
npm run test -- --run
npm run build
npx playwright test
```

## 16. Uygulama sırası

1. Ticker doğrulaması ve SQLite tabloları.
2. Readiness/fingerprint servisi ve dashboard bağlantısı.
3. Pipeline global state temizliği, snapshot ve deterministik hesap katmanı.
4. Kalıcı worker ve job API'leri.
5. Validation gate ve sürümlü publish.
6. OpenAI structured g-ROI context üretimi.
7. Readiness/latest/context API sözleşmeleri.
8. Frontend API client ve ortak TSRS Context.
9. TSRS ekranında gerçek tarih, güncellik ve yüzde ilerleme.
10. Simülatör empty-state ve rapora bağlı bağlam.
11. Integration, Dashboard ve Sidebar hardcoded/bypass temizliği.
12. Backend, frontend ve Playwright testleri.
13. TESTCO ile mocked test ve opt-in canlı smoke test.

## 17. Definition of Done

- Veri yüklenmeden TSRS veya g-ROI metni gösterilmiyor.
- Kritik veri tamamlanmadan rapor işi başlamıyor.
- Rapor POST isteği bir saniye içinde `202 + job_id` dönüyor.
- Frontend gerçek aşamayı, yüzdeyi, spinner'ı ve mesajı gösteriyor.
- Yenileme ve backend restartında iş durumu kaybolmuyor.
- Yalnız validation geçen rapor yayımlanıyor.
- Son rapor tarihi gerçek metadata'dan geliyor.
- Kaynak değişince “Güncelleme gerekli” otomatik oluşuyor.
- g-ROI metinleri yalnız geçerli rapor oluşturulduktan sonra üretiliyor.
- Rapor yenilenince g-ROI bağlamı aynı sürüme göre yenileniyor.
- Sahte onay, portal, mühür, hash ve PDF iddiası kalmıyor.
- TESTCO doğrulayıcısı ile tüm backend/frontend/E2E testleri geçiyor.
