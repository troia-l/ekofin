# Docling OCR Motoru Seçim ve Kullanım Rehberi

Bu belge, ESG raporlamaları için kullanılan PDF ve görsel belgelerin (Bilanço, EKB, SGK dökümleri, Faturalar) ayrıştırılmasında hangi OCR motorunun kullanılması gerektiğini ve komut satırı detaylarını içerir.

## 0. Kurulum ve Ön Hazırlık

Depo boyutunu gereksiz yere şişirmemek ve projeyi hafif tutmak amacıyla, `docling` kütüphanesi ve Tesseract dil modelleri (`tessdata`) bu modüle **dahil edilmemiştir**. Kullanıma başlamadan önce aşağıdaki adımları izleyerek ortamınızı hazırlamanız gerekmektedir:

### Adım 1: Docling'in Klonlanması ve Kurulumu
Çalışma ortamınızda (modül dizininizde) terminali açarak öncelikle Docling projesini klonlayıp gerekli bağımlılıkları kurmalısınız:
```bash
# Docling reposunu klonlayın
git clone https://github.com/DS4SD/docling.git
cd docling

# Bağımlılıkları kurun (uv veya pip kullanarak)
uv sync # Alternatif olarak: uv venv && uv pip install -e .
```

### Adım 2: Tessdata (Türkçe Dil Modelleri) İndirilmesi
Tesseract (tesserocr) motorunun Türkçe belgeleri okuyabilmesi için `tur` modeline ihtiyacı vardır. `docling` klasörünün hemen dışına veya içine bir `tessdata` klasörü oluşturup dil dosyasını indirmelisiniz:
```bash
# tessdata klasörü oluşturun
mkdir tessdata
cd tessdata

# Türkçe dil dosyasını indirin
curl -O https://raw.githubusercontent.com/tesseract-ocr/tessdata/main/tur.traineddata
```

---

## 1. Kullanılmaması Gerekenler

*   **RapidOCR (Varsayılan):** Docling'in varsayılan OCR motoru olan RapidOCR yalnızca İngilizce ve Çince dil modelleriyle çalışacak şekilde yapılandırılmıştır. Türkçe belgelerde (Ş, Ğ, Ç, Ö vb. harfler) ciddi birleştirme ve algılama hatalarına (örn: Şişli -> Sisli) yol açtığı için **kesinlikle kullanılmamalıdır.**

## 2. Hangi Durumda Hangi OCR Kullanılmalı?

### Senaryo A: Bilançolar ve Bol Boşluklu Tablolar (EasyOCR)
**Sorun:** Tesseract, çok geniş sütun aralıkları olan bilançoları okurken rakamları yakalasa bile, Docling'in `TableFormer` modeli hücreler arası mesafe çok büyük olduğunda bu rakamları tablo dışı varsayarak **sonuçtan silmektedir.**
**Çözüm:** Rakamların kaybolmaması ve tablo yapısının (satır/sütun hizalamasının) kusursuz çıkartılması için tablo/mizan gibi sayısal boşlukların çok olduğu dokümanlarda **EasyOCR** kullanılmalıdır. Türkçe dil desteği (`tr`) son derece başarılıdır.

**EasyOCR Çalıştırma Komutu:**
```bash
# Klonlayıp kurduğunuz docling dizinine geçtikten sonra:
uv run docling <dosya_adi> --ocr-engine easyocr --ocr-lang tr
```
*(Örnek: `uv run docling bilanco.jpeg --ocr-engine easyocr --ocr-lang tr`)*

### Senaryo B: Yoğun Metinli veya Düz Formatlı Resmi Evraklar (TesserOCR)
**Sorun:** EasyOCR düz ve sıkışık metinlerde Tesseract kadar tutarlı bir okuma akışı sunmayabilir.
**Çözüm:** SGK Hizmet Dökümleri, Enerji Kimlik Belgeleri (EKB) ve standart sözleşme tarzı ardışık metinlerin olduğu evraklarda **Tesseract (tesserocr)** kullanılması önerilir. Tesseract, kelime ve harf bazlı çok iyi bir Türkçe (`tur`) modeline sahiptir ve sayfa yapısı bozuk olmadıkça `TableFormer` ile sorunsuz çalışır.

**Tesseract Çalıştırma Komutu:**
```powershell
# Windows ortamında ($env:TESSDATA_PREFIX için kendi oluşturduğunuz tessdata klasörünün tam yolunu verin)
$env:TESSDATA_PREFIX="C:\...<sizin_proje_yolunuz>...\tessdata"; uv run docling <dosya_adi> --ocr-engine tesserocr --ocr-lang tur
```
*(Örnek: `$env:TESSDATA_PREFIX="C:\Projelerim\esg_ocr_parser\tessdata"; uv run docling document.pdf --ocr-engine tesserocr --ocr-lang tur`)*

## 3. Özet Karar Matrisi
| Belge Tipi | Önerilen OCR Motoru | Dil Kodu | Sebep |
| :--- | :--- | :--- | :--- |
| **Kurumsal Bilanço / Mizan** | EasyOCR | `tr` | Uzak mesafeli rakamları tabloya doğru yerleştirmesi |
| **Enerji Kimlik Belgesi (EKB)** | TesserOCR | `tur` | Metin ve etiket okuma başarısı |
| **Tüketim Faturaları** | EasyOCR | `tr` | Sayısal faturadaki hizalamaları kaybetmemesi |
| **SGK Hizmet Dökümü** | TesserOCR | `tur` | Sayfalarca süren uzun metin akışında yüksek kararlılık |
