# Tüketim Faturaları (Elektrik, Su, Doğalgaz) Parse Talimatı

## 1. Belgenin Amacı ve Çekilecek Kritik Veriler
Tüketim faturaları; şirketin elektrik, su ve doğalgaz gibi çevresel etkisini doğrudan belirleyen kaynakların fiziksel kullanım miktarını belgeleyen evraklardır. Kapsam 1 ve 2 emisyonlarının hesaplanmasında sadece fatura bedelleri (TL) değil, asıl tüketilen miktar (kWh, m3 vb.) esastır.

Hedeflenen kritik veriler JSON formatında aşağıdaki gibi olmalıdır:
```json
{
  "fatura_bilgileri": {
    "fatura_tarihi": "DD-MM-YYYY",
    "fatura_tipi": "Elektrik | Su | Doğalgaz",
    "tesisat_no": "String"
  },
  "tuketim_verisi": {
    "fiziksel_tuketim_miktari": "float",
    "tuketim_birimi": "kWh | m3 | ton",
    "toplam_odenecek_tutar": "float"
  }
}
```

## 2. TSRS ve Yasal Referans Linkleri
Tüketim verilerinin doğrulanması, şirketin raporladığı çevresel tüketim oranlarının greenwashing (yeşil badana) olup olmadığını (gerçeklik testi) denetlemek için hayati bir kontrol noktasıdır.
* **EPDK Fatura Standartları:** [EPDK Elektrik Fatura Örneği](https://www.epdk.gov.tr/Detay/Icerik/3-0-104/elektrik-fatura-ornegi)
* **KGK TSRS 2 (İklim Riskleri ve Kapsam 1-2):** [TSRS 2 PDF](https://www.kgk.gov.tr/Portalv2Uploads/files/Duyurular/v2/Surdurulebilirlik/RaporlamaStandarti/TSRS2_.pdf)

## 3. Sık Karşılaşılan LLM ve OCR Hataları (Pitfalls)
* **Tutar vs. Miktar Karışıklığı:** "Toplam Ödenecek Tutar (TL)" değeri ile "Toplam Tüketim Miktarı (kWh/m3)" değerinin birbirine karıştırılması. LLM'lerin sadece en büyük veya en alttaki sayıyı çekme eğilimi.
* **Çarpan Hatası:** Bazı endüstriyel faturalarda sayacın gösterdiği endeks ile faturalanan tüketim arasında bir "Çarpan" bulunur. OCR bu çarpan katsayısını kaçırarak doğrudan ham endeks farkını çekebilir.
* **Birim Okuma Zorluğu:** Fatura üstünde m3, kWh gibi birimlerin silik veya çok küçük puntolarla basılması nedeniyle anlaşılamaması.

## 4. Hatayı Önleme ve Parse Etme Talimatı
* **Fiziksel Tüketime Odaklan (Anti-Greenwashing):** Finansal maliyetten çok "Fiziksel Tüketim Miktarı" değerinin çekilmesine odaklan. Bu değer, emisyon hesaplamasının temelidir. `tuketim_birimi` ile eşleştirerek ("Aktif Enerji Tüketimi - kWh", "Tüketilen Doğalgaz - m3") doğru alandan veri al.
* **İlk / Son Endeks Kontrolü:** Eğer faturada İlk Endeks ve Son Endeks değerleri varsa, `Fiziksel Tüketim = (Son Endeks - İlk Endeks) * (varsa Çarpan)` formülünü mantıksal olarak doğrula.
* **Sayı Formatı Dönüşümü:** Türkçe formatlı faturalardaki ondalık virgül ve binlik nokta sistemini float'a çevirirken "1.234,56" yapısını standart "1234.56" şekline getir.
