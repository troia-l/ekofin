# EkoFin Gerçek TSRS Raporlama ve ESG Beyan Doğrulama Uygulama Planı

## 1. Amaç ve temel karar

Bu planın amacı mevcut mock TSRS üretimini kaldırarak, şirketin yüklediği özgün belgelerden izlenebilir veriler çıkaran, hesaplamaları deterministik yapan, eksik veya çelişkili veriyi açıkça gösteren ve yalnızca desteklenen bilgilerle TSRS taslak raporu üreten çalışan bir sistem kurmaktır.

Temel doğruluk zinciri şöyledir:

```text
Özgün şirket belgesi / yönetici beyanı
                ↓
Kaynak konumu belli yapılandırılmış gerçekler ve iddialar
                ↓
Deterministik hesaplamalar + veri kalite kontrolleri
                ↓
KAP / resmî kurum / güvenilir haber dış kanıtları
                ↓
İddia bazlı güvenilirlik ve kanıt yeterliliği
                ↓
Kaynak işaretli TSRS taslak raporu
                ↓
Rapor-gerçek tutarlılık denetimi
```

AI tarafından üretilmiş TSRS raporu doğruluğun ana kaynağı olmayacaktır. Rapor, özgün verilerden türetilen ve ayrıca denetlenen bir çıktı olacaktır. Haberler raporun genel tonuyla değil, raporda kullanılan atomik şirket iddialarıyla karşılaştırılacaktır.

İlk sürüm BIST/Türkiye odaklı bir pilot olacaktır. Dış doğrulama sonuçları mevcut ESG puanını veya kredi kararını otomatik değiştirmeyecektir.

## 2. Mevcut sistemde tespit edilen sorunlar

### 2.1 TSRS üretimi

- `backend/modules/tsrs/pipeline.py`, `OPENAI_API_KEY` olmadığında veya model başlatılamadığında `mock` moduna geçip sabit metin üretmektedir. Bu durum hata yerine başarılı rapor olarak dönmektedir.
- Mock metin; 55 çalışan, 14.500 kWh tüketim, 15,42 tCO2e Kapsam 1, SAP/LOGO entegrasyonu, bağımsız denetime hazır olma ve blokzincire mühürleme gibi gerçek kaynağı olmayan iddialar içermektedir.
- Gerçek LLM akışında da eksik kaynak dosyası yalnızca loglanmakta, rapor üretimi devam etmektedir.
- Emisyon hesabı deterministik hesap motoru yerine LLM prompt’una bırakılmıştır.
- Bölümler serbest metin olarak üretilmekte; kullanılan her sayının kaynak belge, sayfa veya alan bilgisi tutulmamaktadır.
- Benchmark raporu sabit satır aralıklarıyla parçalanmaktadır; dosya değiştiğinde bölüm eşleşmesi bozulabilir.
- Pipeline şirket bazlı global değişkenler kullanmaktadır. Farklı şirketlerin eşzamanlı rapor üretimi kaynak ve çıktı yollarını karıştırabilir.
- Rapor üretim durumu yalnız proses belleğinde tutulmaktadır; yeniden başlatmada kaybolur ve çoklu worker kullanımında tutarsızdır.
- SHA-256 yalnız dosya bütünlük kontrolüdür. Buna rağmen arayüzde blokzincir mühürü ve bağımsız doğrulama gibi gösterilmektedir.

### 2.2 Belge ve beyan işleme

- Yüklenen dosya içerik ve MIME doğrulaması yapılmadan hedef dosya adına yazılmakta ve hemen `verified` işaretlenmektedir.
- Metin katmanı olmayan taranmış PDF için gerçek OCR yoktur; `pypdf` boş metin döndürse bile işlem başarısız sayılmamaktadır.
- Frontend yönetici formu yeni şirketlerde 45 çalışan, 14.500 kWh ve 420 m³ gibi dolu demo değerleriyle açılmaktadır.
- Frontend’in gönderdiği bazı alanlar backend Pydantic modelinde bulunmadığı için sessizce atılmaktadır.
- AI politika üretimi yalnız `setTimeout` ve şablon metindir; kabul edilince çevre yönetim sistemi varmış gibi `hasEmsPolicy=yes` kaydedebilmektedir.
- SGK gibi kişisel veri içeren ham belgelerin bulut LLM’ye gönderilmesini engelleyen veri minimizasyonu veya maskeleme katmanı yoktur.

### 2.3 ESG ve haber akışı

- Ana ESG ekranı canlı model sonucu yerine son sütunu 25 Mayıs 2025 olan `backend/data/esg_tahmin.csv` dosyasını kullanmaktadır.
- `kap_loader.py` gerçek KAP verisi çekmemektedir; bazı şirketler için sabit profil, diğerleri için ticker karakterlerinden sentetik veri üretmektedir.
- Haber analizi yalnız başlık sentiment’i ve tek E/S/G etiketi üretmektedir. Haber gövdesi, şirket beyanı, kaynak güvenilirliği ve kanıt niteliği karşılaştırılmamaktadır.
- Haber etkileri doğrudan genel skora eklenmektedir. Aynı olayın farklı yayınlardaki kopyaları ayrı ayrı sayılabilir.
- Frontend genel ESG skorunu üçe eşit dağıtarak E/S/G alt skoru gibi göstermektedir; model gerçekte bu alt skorları üretmemektedir.
- Model kartı, predictor açıklaması ve teknik dokümandaki hata metrikleri birbiriyle tutarlı değildir.

### 2.4 Test kapsamı

- Mevcut `python -m pytest -q` sonucu 30 test başarılıdır.
- Testler mock raporun gerçek belgeyle tutarlılığını, halüsinasyonu, kaynak izlenebilirliğini, eksik belge davranışını veya dış kanıt eşleştirmesini sınamamaktadır.

## 3. Hedef mimari ve değişmez kurallar

1. **Fail closed:** API anahtarı, zorunlu kaynak, parser veya hesaplama başarısızsa rapor üretimi başarısız/eksik durumuna geçer; sahte içerik üretilmez.
2. **Kaynak önceliği:** Özgün belge → çıkarılmış gerçek → türetilmiş metrik → rapor cümlesi zinciri her aşamada saklanır.
3. **LLM hesap yapmaz:** Toplama, oran, birim dönüşümü, emisyon ve güvenilirlik formülleri Python tarafından hesaplanır.
4. **Eksik veri uydurulmaz:** Değer yoksa `missing`, okunamıyorsa `unreadable`, çelişkiliyse `conflict`, uygulanmıyorsa `not_applicable` kullanılır.
5. **Beyan doğruluk değildir:** Yönetici formu ve şirket açıklaması `self_declared` kaynağıdır; bağımsız doğrulama sayılmaz.
6. **Haber yokluğu doğrulama değildir:** Dış kanıt bulunamazsa sonuç `insufficient_evidence` olur.
7. **Rapor taslaktır:** İnsan/bağımsız denetçi onayı olmadan “TSRS ile tam uyumlu”, “doğrulandı” veya “bağımsız denetime hazır” iddiası gösterilmez.
8. **Hash güvence değildir:** SHA-256 yalnız bütünlük kontrolü olarak adlandırılır; gerçek bir ledger entegrasyonu yapılmadıkça blokzincir ifadesi kaldırılır.
9. **PII minimizasyonu:** Kimlik numarası, çalışan adı, telefon, e-posta ve adres gibi kişisel veriler bulut LLM’ye gönderilmez.
10. **Tekrarlanabilirlik:** Model, prompt, kaynak kayıt listesi, faktör seti ve metodoloji sürümü her çalışma için kaydedilir.

## 4. Uygulama aşamaları

### Aşama 0 — Yanıltıcı mock davranışını durdurma

1. `get_mock_section_content` ve otomatik mock geçişi kaldırılacak.
2. LLM yapılandırılmamışsa `/api/report/generate` başarılı çıktı yerine açık `503` veya başarısız job sonucu döndürecek.
3. Kaynak dosyaları eksikse pipeline, TSRS gereksinim matrisi üretip `not_ready` durumunda duracak; eksikleri kullanıcıya listeleyecek.
4. Frontend’deki sabit ERP bağlantısı, 55 çalışan, sabit emisyonlar ve blokzincir mühürü metinleri gerçek API durumuyla değiştirilecek.
5. Yönetici formunun başlangıç değerleri boş/null olacak. Demo doldurma gerekiyorsa ayrı ve açık bir “Örnek veri yükle” eylemi olacak; üretim akışına kendiliğinden girmeyecek.
6. AI politika taslağı bir yönetim sistemi sertifikası veya mevcut politika olarak kaydedilmeyecek. Kabul edilse bile `draft_policy` statüsünde tutulacak.

**Kabul kriteri:** API anahtarı olmayan veya zorunlu belgesi bulunmayan şirket için hiçbir TSRS rapor dosyası üretilmemeli ve önceki raporun üzerine yazılmamalıdır.

### Aşama 1 — Güvenli belge alımı ve normalizasyon

1. `POST /api/documents/upload` geriye dönük korunacak ancak şu kontroller eklenecek:
   - İzinli biçimler: PDF, JSON, CSV, XLSX, DOCX, TXT ve Markdown.
   - Dosya adı yerine sunucu tarafından üretilen güvenli kimlik kullanılacak.
   - Uzantı, MIME ve dosya imzası birlikte doğrulanacak.
   - Varsayılan üst boyut 25 MB olacak.
   - SHA-256, yükleme anında hesaplanacak; aynı şirkette aynı hash tekrar işlenmeyecek.
   - Durum sırası `uploaded → parsing → parsed|needs_ocr|invalid|failed` olacak; yükleme hiçbir zaman doğrudan `verified` sayılmayacak.
2. Kaynak dosya orijinal uzantısıyla saklanacak; mevcut dosya tipi sabit hedef ada yazma yaklaşımı kaldırılacak.
3. Parser katmanı:
   - Metin PDF: `pypdf` ile sayfa bazlı metin ve sayfa numarası.
   - JSON/CSV/XLSX: şema ve veri tipi kontrollü yapılandırılmış okuma.
   - DOCX: paragraf ve tablo konumu korunarak okuma.
   - TXT/Markdown: UTF-8 öncelikli güvenli okuma.
   - Metin katmanı olmayan PDF: `needs_ocr`; pilotta sessiz OCR yapılmayacak. Kullanıcıdan makine okunur belge/CSV istenecek ve arayüzde gerçek durum gösterilecek.
4. SGK belgelerinde kimlik numarası ve çalışan isimleri yerel olarak maskelenecek; LLM’ye yalnız anonim satırlar veya toplulaştırılmış değerler gönderilecek.
5. Her belge için `source_document_id`, şirket, belge türü, dönem, hash, parser sürümü, sayfa sayısı ve işleme durumu saklanacak.

**Kabul kriteri:** Bozuk, yanlış uzantılı, boş metinli veya desteklenmeyen dosya “işlendi/doğrulandı” görünmemelidir.

### Aşama 2 — Yapılandırılmış gerçek ve iddia deposu

1. `veri_cikarma_semasi_blueprint.md`, serbest metin talimatı olmaktan çıkarılıp Pydantic modellerine dönüştürülecek.
2. Her çıkarılmış gerçek aşağıdaki alanları taşıyacak:

```json
{
  "factId": "fact_...",
  "ticker": "ASELS",
  "fieldCode": "annual_electricity_kwh",
  "value": 12000.0,
  "unit": "kWh",
  "periodStart": "2025-01-01",
  "periodEnd": "2025-12-31",
  "sourceDocumentId": "doc_...",
  "sourceLocator": {"page": 3, "table": 1, "row": 7},
  "sourceExcerpt": "...",
  "sourceKind": "document|self_declared",
  "extractionConfidence": 0.97,
  "reviewStatus": "machine_extracted"
}
```

3. LLM yalnız şemalı çıkarım için kullanılacak. OpenAI Responses API’nin Pydantic Structured Outputs özelliği kullanılacak; varsayılan model `gpt-6-luna`, yapılandırma `TSRS_LLM_MODEL` olacaktır.
4. Model başarısızsa anahtar kelime veya varsayılan değerle gerçek üretilmeyecek. İlgili belge `extraction_failed` durumuna geçecek.
5. Aynı alan ve dönem için birden fazla kaynak varsa kaynak önceliği uygulanacak:
   - Resmî belge/kurum kaydı
   - Fatura, bordro veya imzalı operasyonel kayıt
   - Bağımsız denetim/sertifika
   - Şirket beyanı
   - AI tarafından üretilmiş metin hiçbir zaman kaynak değildir.
6. Farklı kaynaklar tolerans dışında ayrışırsa değer seçilmeyecek; `conflict` kaydı oluşturulacak.
7. Yönetici beyanı backend şeması frontend ile birebir eşlenecek; raporlama dönemi, birim, onay zamanı ve beyan sahibi rolü zorunlu olacak. `confirmed`, yalnız şirketin beyanı gönderdiğini gösterir; bağımsız doğrulama anlamına gelmez.

**Kabul kriteri:** Raporda kullanılabilecek her sayısal değer en az bir belge kimliği ve kaynak konumuna sahip olmalıdır.

### Aşama 3 — Deterministik hesaplama motoru

1. Kapsam 1 ve 2 hesapları LLM prompt’undan çıkarılacak ve ayrı Python servisinde yapılacak.
2. Emisyon faktörü kaydı şu bilgileri zorunlu tutacak: faktör değeri, birim, coğrafya, geçerli dönem, gaz/GWP tabanı, yayıncı, kaynak URL’si ve sürüm.
3. Hesap sonucu; girdi `factId` listesi, formül, birim dönüşümleri, kullanılan faktör kimliği ve yuvarlanmamış değerle saklanacak.
4. Desteklenmeyen yakıt/birim veya eksik dönem için varsayılan faktör kullanılmayacak; hesap `blocked` olacaktır.
5. Çalışan oranları, atık geri kazanım oranı, su/enerji yoğunluğu ve finansal oranlar aynı deterministik hesap katmanından üretilecek.
6. Birim ve dönem kontrolleri yapılacak: kWh/MWh, litre/m³, kg/ton ve takvim/mali yıl karışıklıkları hata veya açık dönüşüm kaydı üretmelidir.
7. Sonuçlar belge değerleriyle çapraz kontrol edilecek; toplam-alt kırılım farkları yapılandırılabilir toleransın dışındaysa rapor hazır sayılmayacak.

**Kabul kriteri:** Aynı kaynak paketi ve faktör sürümü her çalıştırmada aynı hesap sonucunu üretmelidir.

### Aşama 4 — TSRS gereksinim ve hazırlık matrisi

1. TSRS 1 ve TSRS 2 gereksinimleri sürümlü bir katalogda tutulacak; dayanak olarak KGK’nın resmî [TSRS 1](https://www.kgk.gov.tr/Portalv2Uploads/files/Duyurular/v2/Surdurulebilirlik/RaporlamaStandarti/TSRS%201.pdf) ve [TSRS 2](https://www.kgk.gov.tr/Portalv2Uploads/files/Duyurular/v2/Surdurulebilirlik/RaporlamaStandarti/TSRS2_.pdf) metinleri kullanılacak.
2. Uygulama kapsamı, geçiş muafiyetleri ve eşikler kod içindeki prompt’a gömülmeyecek; `effective_from`, `effective_to`, kaynak ve sürüm bilgili kural kaydında tutulacak.
3. Her gereksinim için `complete|partial|missing|not_applicable|conflict` sonucu, ilgili `factId` ve gerekçe üretilecek.
4. Rapor üretimi için asgari kapı:
   - Şirket kimliği ve raporlama dönemi mevcut.
   - Zorunlu gereksinimlerde çözümlenmemiş kritik çelişki yok.
   - Kullanılan tüm emisyon sonuçlarının faktör ve girdi soy ağacı mevcut.
   - Eksik zorunlu bilgiler raporda açıkça eksik olarak belirtilebiliyor; “tam uyum” beyanı üretilmiyor.
5. `GET /api/tsrs/readiness/{ticker}` gereksinim bazlı durum ve eksik belge listesini döndürecek.

### Aşama 5 — Dış kanıt ve beyan güvenilirliği

1. Dış doğrulama, oluşturulmuş raporun genel metnini değil Aşama 2’deki atomik iddiaları hedefleyecek.
2. İlk sürüm kaynakları:
   - Yüklenmiş özgün şirket belgeleri.
   - Google News RSS üzerinden şirket adı/ticker ve E/S/G konu sorguları.
   - `site:kap.org.tr` ile keşfedilen kamuya açık KAP bildirimleri.
   - Yapılandırılmış izinli kaynak listesi.
3. Google News yalnız keşif katmanıdır. Haber gövdesi veya birincil belge alınamazsa kayıt skora dahil edilmez.
4. Kaynak ağırlıkları sürümlü yapılandırmadan gelir: resmî nihai kayıt `1.00`, güçlü haber ajansı/orijinal habercilik `0.85`, diğer izinli yayın `0.65`. Bilinmeyen kaynak dışlanır.
5. Şirket kontrollü açıklama olumlu bağımsız destek sayılmaz; düzeltme veya açık kabul çelişki kanıtı olabilir.
6. LLM her iddia–kanıt çifti için yalnız şu yapıyı üretir: şirket eşleşmesi, E/S/G, konu, `support|contradict|unclear`, ilişki güveni, olay tarihi, kanıt alıntısı ve olay olgunluğu.
7. URL, içerik hash’i ve olay anahtarıyla mükerrer/sindikasyon haberleri tek olay sayılır.
8. Kanıt ağırlığı:

\[
w_i=source_i \times entity_i \times relevance_i \times provenance_i
\times maturity_i \times recency_i
\]

9. İddia güvenilirliği ve kanıt yeterliliği:

\[
R_c=\frac{2+\sum w_i\,support_i}
{4+\sum w_i(support_i+contradict_i)}
\]

\[
Q_c=1-e^{-\sum w_i/2}
\]

10. E/S/G sonuçları, iddia önemliliği ve `Q_c` ile ağırlıklandırılacak. Kanıt yoksa `R=0.50`, `Q=0.00` ve `insufficient_evidence` dönecek.
11. Genel haber sentiment’i, haber sayısı veya şirket PR hacmi güvenilirlik değerini yükseltmeyecek.
12. Bu değerler pilotta mevcut ESG skoruna eklenmeyecek ve kredi kararında kullanılmayacak.

### Aşama 6 — Kaynak kontrollü TSRS rapor üretimi

1. Pipeline global değişkenlerden arındırılacak; her çalışma immutable bir `PipelineContext` ile ticker, kaynak snapshot’ı, faktör sürümü, model sürümü ve çıktı yolunu taşıyacak.
2. Bölümler ham belgelerden değil, PII’dan arındırılmış doğrulanabilir fact/metric paketinden üretilecek.
3. Her faktüel cümle geçici `[F:fact_id]`, her dış kanıt `[E:evidence_id]` işareti taşıyacak. Son render aşaması bunları dipnot/kaynak listesine çevirecek.
4. LLM yalnız anlatım, özetleme ve bölüm düzeni için kullanılacak. Yeni sayı, sertifika, entegrasyon, hedef veya güvence iddiası üretmesi yasak olacak.
5. Kaynakta olmayan ancak TSRS için gerekli alanlar “Bilgi sağlanmamıştır” veya “Değerlendirme tamamlanmamıştır” şeklinde açık bırakılacak.
6. Bölüm üretiminden sonra otomatik validator çalışacak:
   - Bilinmeyen fact/evidence kimliği.
   - Kaynaksız sayı ve yüzde.
   - Kaynaktaki değerle uyuşmayan sayı/birim/dönem.
   - Yasak güvence ifadeleri.
   - Gereksinim matrisinde `missing/conflict` iken kesinlik bildiren metin.
7. Kritik hata varsa yeni rapor yayımlanmayacak. Çıktı geçici dizinde tutulacak; yalnız başarılı validasyondan sonra atomik olarak `latest` raporuna geçirilecek.
8. Rapor durumları `queued → extracting → calculating → checking_readiness → generating → validating → ready_for_review|failed` olacaktır.
9. Çıktılar Markdown rapor, makine okunur JSON veri paketi, kaynak manifesti, doğrulama raporu ve SHA-256 bütünlük hash’inden oluşacaktır.
10. Rapor başlığı “AI destekli TSRS taslak raporu” olacaktır. İnsan/denetçi onayı eklenmeden “tam uyumlu” veya “doğrulanmış” etiketi kullanılmayacaktır.

### Aşama 7 — Kalıcı iş çalıştırma ve API sözleşmeleri

1. Uzun LLM işlemi HTTP isteğini açık tutmayacak. SQLite tabanlı `pipeline_jobs` kuyruğu ve tek yerel worker kullanılacak.
2. Job atomik lease ile alınacak; aynı ticker ve kaynak hash’i için ikinci aktif job oluşturulmayacak. Uygulama yeniden başladığında süresi geçmiş `running` job’ları tekrar kuyruğa alınacak.
3. Yeni API’ler:
   - `POST /api/tsrs/runs` — ticker ile job oluşturur, `202` ve `runId` döner.
   - `GET /api/tsrs/runs/{runId}` — gerçek aşama, ilerleme, uyarı ve hata kodlarını döner.
   - `GET /api/tsrs/readiness/{ticker}` — eksik/çelişkili gereksinimleri döner.
   - `GET /api/tsrs/reports/{ticker}/latest` — yalnız validation geçmiş son raporu döner.
   - `GET /api/tsrs/reports/{reportId}/manifest` — kaynak ve hesap soy ağacını döner.
   - `POST /api/esg/credibility/{ticker}/refresh` — dış kanıt analiz job’ı başlatır.
   - `GET /api/esg/credibility/{ticker}` — E/S/G güvenilirlik ve kapsama sonuçlarını döner.
   - `GET /api/esg/credibility/{ticker}/evidence` — iddia bazlı kanıtları döner.
4. Mevcut `/api/report/generate`, `/status` ve `/latest` endpoint’leri bir geçiş sürümü boyunca yeni servise delegasyon yapan uyumluluk katmanı olarak korunacak.
5. Job, belge, fact, hesap, kanıt ve rapor meta verileri SQLite’ta; orijinal dosya ve sürümlü rapor artifact’leri dosya sisteminde tutulacak.

### Aşama 8 — Veritabanı modeli

İdempotent migration ile aşağıdaki tablolar eklenecek:

- `source_documents`: belge kimliği, ticker, tür, dönem, MIME, hash, dosya yolu ve işleme durumu.
- `extraction_runs`: model/parser/prompt sürümü, durum, hata ve süre bilgisi.
- `extracted_facts`: alan kodu, tipli değer JSON’u, birim, dönem, kaynak konumu, güven ve inceleme durumu.
- `derived_metrics`: formül sürümü, sonuç, birim, faktör ve girdi fact kimlikleri.
- `tsrs_requirements`: standart/paragraf, geçerlilik tarihi ve zorunluluk kuralı.
- `requirement_assessments`: şirket/run bazında tamamlanma durumu ve bağlı gerçekler.
- `external_evidence`: URL, kaynak, tarih, excerpt, hash, kaynak ağırlığı ve olay anahtarı.
- `claim_evidence_links`: ilişki yönü, güven, olgunluk, toplam ağırlık ve model sürümü.
- `pipeline_jobs`: tür, durum, lease, ilerleme ve hata kodu.
- `report_artifacts`: rapor sürümü, kaynak snapshot hash’i, dosya yolları, validation sonucu ve bütünlük hash’i.

Mevcut `esg_news` ve `esg_score_history` tabloları migration sırasında silinmeyecek. Haber bazlı `news_mod` yeni snapshot’larda `0` olacak; tarihsel değerler korunacaktır.

### Aşama 9 — Frontend düzeltmeleri

1. Entegrasyon ekranı belge durumlarını gerçek backend statülerinden gösterecek; `uploaded` ile `parsed` veya `reviewed` ayrılacak.
2. Rapor üretim butonu readiness başarısızsa eksik belge/alan listesini gösterecek.
3. Sabit terminal mesajları kaldırılacak; yalnız backend job olayları gösterilecek.
4. “Blockchain mühürü” yerine “Dosya bütünlük özeti (SHA-256)” kullanılacak.
5. Genel ESG skorundan türetilen sahte E/S/G performans grafiği kaldırılacak.
6. Yerine E/S/G beyan güvenilirliği, kanıt yeterliliği ve `Yetersiz kanıt` durumu gösterilecek.
7. Her sonuçtan ilgili şirket iddiasına, özgün belge konumuna ve dış kanıt URL’sine gidilebilecek.
8. Oluşturulan rapor açıkça `Taslak`, `Doğrulama başarısız` veya `İncelemeye hazır` statüsünü gösterecek.

## 5. Kod organizasyonu

Mevcut modüller küçük ve test edilebilir servislere ayrılacaktır:

```text
backend/modules/tsrs/
  ingestion.py          # Dosya tanıma ve metin/tablo çıkarımı
  schemas.py            # Pydantic fact, claim, metric ve rapor modelleri
  extractors.py         # Belge türü bazlı yapılandırılmış çıkarım
  privacy.py            # PII maskeleme ve veri minimizasyonu
  calculations.py       # Emisyon ve diğer deterministik hesaplar
  requirements.py       # TSRS gereksinim matrisi
  generator.py          # Kaynak işaretli bölüm üretimi
  validator.py          # Rapor–kaynak tutarlılık kontrolü
  orchestrator.py       # PipelineContext ve aşama yönetimi

backend/modules/esg_credibility/
  discovery.py          # Google News/KAP keşfi
  article_reader.py     # Güvenli içerik çıkarımı
  entity_resolution.py  # Şirket/iştirak eşleştirmesi
  evidence_analyzer.py  # Şemalı LLM ilişki çıkarımı
  deduplication.py      # URL/içerik/olay tekilleştirme
  scoring.py            # Deterministik R ve Q hesapları
```

`pipeline.py` geçiş sırasında yeni orchestrator’a ince bir uyumluluk wrapper’ı olacaktır. Yeni iş mantığı router veya frontend dosyalarına konmayacaktır.

## 6. Test planı

### Birim testleri

- Her belge türü için geçerli, bozuk, boş ve yanlış MIME örnekleri.
- PDF sayfa konumu, tablo satırı ve kaynak excerpt izlenebilirliği.
- PII maskeleme: TCKN, isim, telefon ve e-posta LLM payload’ında bulunmamalı.
- Birim dönüşümleri, dönem uyumu ve emisyon hesaplarının golden testleri.
- Eksik faktör ve desteklenmeyen birimlerde fail-closed davranışı.
- Aynı alan için kaynak önceliği ve çelişki tespiti.
- TSRS gereksinim matrisi için complete/partial/missing/not_applicable/conflict durumları.
- R/Q formülü sınırları, kanıtsız durum ve ağırlık kalibrasyonu.
- Aynı olayın farklı URL’lerde yayımlanmasının bir kez sayılması.
- Şirket PR’ının bağımsız olumlu destek sayılmaması.

### LLM sözleşme testleri

- Ağ çağrıları mock edilerek geçerli Structured Output.
- Eksik alan, geçersiz enum, refusal, timeout ve rate-limit durumları.
- Haber metnindeki prompt injection’ın komut olarak uygulanmaması.
- Model başarısızlığında fallback ile sahte gerçek üretilmemesi.
- Aynı fixture üzerinde prompt/model sürümü sabitken şema ve kritik değerlerin korunması.

### Pipeline ve API testleri

- Uçtan uca örnek şirket: yükleme → çıkarım → hesap → readiness → üretim → validation → latest.
- Eksik zorunlu belgeyle raporun yayımlanmaması.
- Kaynaksız sayısal iddia üreten LLM çıktısının validator tarafından reddedilmesi.
- İki ticker’ın eşzamanlı çalışmasında kaynak ve çıktı izolasyonu.
- Sunucu yeniden başlatıldığında job’ın devam/tekrar kuyruğa alınması.
- Eski endpointlerin yeni endpointlere uyumlu cevap vermesi.
- Başarısız yeni run’ın önceki geçerli raporun üzerine yazmaması.

### Frontend testleri

- Boş yönetici formu ve zorunlu alan doğrulaması.
- `needs_ocr`, `missing`, `conflict`, `failed` ve `ready_for_review` ekranları.
- Sabit başarı/ERP/blokzincir mesajlarının görünmemesi.
- Güvenilirlik değeri düşük kapsamada sayı yerine “Yetersiz kanıt” gösterimi.
- Kaynak ve kanıt bağlantılarının doğru iddiayı açması.

### Pilot değerlendirme

- En az 10 BIST şirketinden E/S/G dengeli 300 iddia–kanıt çifti iki uzman tarafından etiketlenecek.
- Şirket eşleştirme precision hedefi en az `%95`.
- E/S/G sınıflandırma macro-F1 hedefi en az `%85`.
- Çelişki sınıflandırma precision hedefi en az `%90`.
- Hedefler sağlanmazsa sonuçlar `experimental` olarak kalacak ve dış rapora otomatik taşınmayacak.

## 7. Uygulama sırası ve tamamlanma ölçütleri

1. **Doğruluk güvenlik yaması:** Mock/fake başarıları ve yanıltıcı UI metinlerini kaldır.
2. **Belge temeli:** Güvenli upload, parsing durumları, PII maskeleme ve kaynak manifestini tamamla.
3. **Gerçek deposu:** Pydantic şemalar, çıkarım, kaynak konumu ve çelişki yönetimini tamamla.
4. **Hesap motoru:** Emisyon ve diğer metrikleri sürümlü faktörlerle deterministik hesapla.
5. **TSRS readiness:** Resmî standart katalogu ve gereksinim matrisini bağla.
6. **Raporlama:** Kaynak işaretli üretim, validator, atomik yayın ve kalıcı job akışını tamamla.
7. **Dış doğrulama:** Haber/KAP keşfi, içerik çıkarımı, iddia eşleştirme ve R/Q hesaplarını ekle.
8. **Arayüz:** Gerçek durumları, rapor manifestini ve E/S/G güvenilirlik kartlarını göster.
9. **Kalibrasyon:** Uzman etiketli pilot setiyle eşikleri ölç ve metodoloji sürümünü dondur.

Sistem ancak aşağıdaki koşullar birlikte sağlandığında “çalışan v1” kabul edilecektir:

- API anahtarı veya veri yokken sahte rapor üretilmiyor.
- Rapordaki her sayısal iddia kaynak veya deterministik hesap zincirine bağlı.
- Eksik ve çelişkili bilgiler açıkça gösteriliyor.
- Haber doğrulaması yalnız iddia ilişkili, tam metinli ve tekilleştirilmiş kanıtlardan hesaplanıyor.
- E/S/G güvenilirlik ile kanıt yeterliliği ayrı sunuluyor.
- TSRS raporu, ESG tahmini ve dış beyan doğrulaması birbirine karıştırılmıyor.
- SHA-256, AI ve kaynak kapsamı kullanıcıya gerçekte oldukları biçimde açıklanıyor.
- Yeni testlerin yanı sıra mevcut 30 backend testi de geçiyor.

## 8. Kapsam dışı ve sonraki sürüm

- Otomatik kredi reddi/onayı veya güvenilirlik katsayısının kredi fiyatlamasına doğrudan uygulanması.
- Bağımsız denetçi yerine geçen “güvence” kararı.
- Gerçek blokzincir/ledger entegrasyonu.
- Lisanslı Reuters/Factiva arşivi; pilotta ücretsiz ve hukuken erişilebilir kaynaklar kullanılacak.
- Metin katmanı olmayan hassas SGK PDF’lerinin bulut OCR’a gönderilmesi.
- Gerçek ve doğrulanmış eğitim verisi sağlanmadan mevcut XGBoost modelinin yeniden eğitilmesi veya model metriklerinin pazarlama amacıyla kullanılması.

Bu öğeler ancak pilot doğruluk sonuçları, veri lisansları, KVKK değerlendirmesi ve operasyonel sahiplik belirlendikten sonra ayrı sürüm olarak planlanmalıdır.
