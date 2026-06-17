# SGK Hizmet Dökümü / Sigortalı Çalışan Listesi Parse Talimatı

## 1. Belgenin Amacı ve Çekilecek Kritik Veriler
SGK Hizmet Dökümü, şirketin ilgili dönemdeki kayıtlı istihdam sayısını, çalışma günlerini ve çalışan demografisini (kadın/erkek kırılımı vb.) gösteren resmi tablolardır. Sosyal (Social - ESG) metrikler bağlamında fırsat eşitliği, çalışan hakları ve istihdam kalitesi analiz edilir.

Hedeflenen kritik veriler JSON formatında aşağıdaki gibi olmalıdır:
```json
{
  "donem_bilgisi": {
    "yil": "YYYY",
    "ay": "MM"
  },
  "istihdam_metrikleri": {
    "toplam_calisan_sayisi": "integer",
    "kadin_calisan_sayisi": "integer",
    "erkek_calisan_sayisi": "integer",
    "toplam_fiili_calisma_gunu": "integer"
  }
}
```

## 2. TSRS ve Yasal Referans Linkleri
Sosyal ölçütler kapsamında, şirketin istihdam sağladığı kitlenin şeffaflığı ve iş gücü metriklerinin resmi belgelerden doğrulanması için gereklidir.
* **SGK İşveren Uygulamaları ve Belge Formatları:** [SGK İşveren Sistemi](https://uyg.sgk.gov.tr/IsverenSistemi)
* **KGK TSRS 1 (Genel Hükümler - Sosyal Kapsam):** [TSRS 1 PDF](https://www.kgk.gov.tr/Portalv2Uploads/files/Duyurular/v2/Surdurulebilirlik/RaporlamaStandarti/TSRS%201.pdf)

## 3. Sık Karşılaşılan LLM ve OCR Hataları (Pitfalls)
* **Satır ve Sütun Kaymaları (Halüsinasyon):** SGK dökümleri genellikle geniş tablolardır. "Cinsiyet", "Prim Ödeme Gün Sayısı" ve "İsim" sütunları arasında kaymalar yaşanarak erkek bir çalışanın kadın, ya da eksik çalışma gününün tam (30) olarak okunması.
* **Toplam Gün Hatası:** Kişi bazlı prim günlerinin (örn. 30, 25, 10) toplanırken sayfa sonu toplamlarında (footer) hata yapılması.
* **Ayrılanlar/Girenler:** Ay içerisinde işe giren veya işten ayrılan personelin gün sayılarının (örn. 15 gün) tüm ay çalışmış gibi (30) değerlendirilmesi.

## 4. Hatayı Önleme ve Parse Etme Talimatı
* **Tablolar-Arası Okuma (Cross-Reading):** Tablo yapısındaki satır kaymalarında halüsinasyon oluşmaması için her satırdaki "TC Kimlik No" veya "Sicil No" alanını bir çapa (anchor) olarak kullan. Cinsiyet ve Prim Gün Sayısı değerlerini o satırın hizasından çapraz okuyarak doğrula.
* **Kadın/Erkek Kırılımı Toplamı:** Her satırdaki cinsiyet belirteçlerini ("E", "K" veya "Erkek", "Kadın") dikkatle topla. Toplam kadın ve erkek sayısının `toplam_calisan_sayisi`na eşit olup olmadığını bir sağlama adımı olarak kullan.
* **Toplam Fiili Çalışma Günü:** Sadece "Prim Ödeme Gün Sayısı" (veya Fiili Çalışma Gün Sayısı) sütunundaki sayısal değerleri topla. Ayak (footer) kısmındaki genel toplamları parse ediyorsan mutlaka liste üzerindeki satırlarla tutarlılığını test et.
