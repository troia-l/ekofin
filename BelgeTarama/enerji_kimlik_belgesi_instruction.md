# Enerji Kimlik Belgesi (EKB) Parse Talimatı

## 1. Belgenin Amacı ve Çekilecek Kritik Veriler
Enerji Kimlik Belgesi (EKB), binanın enerji ihtiyacını, enerji tüketim sınıflandırmasını, yalıtım özelliklerini ve sera gazı emisyon sınıfını gösteren resmi bir belgedir. Sürdürülebilirlik raporlarında binaların çevresel etkisi doğrudan bu belge üzerinden ölçülür.

Hedeflenen kritik veriler JSON formatında aşağıdaki gibi olmalıdır:
```json
{
  "bina_bilgileri": {
    "belge_no": "EKB Belge Numarası",
    "duzenlenme_tarihi": "DD-MM-YYYY",
    "gecerlilik_tarihi": "DD-MM-YYYY"
  },
  "enerji_sinifi": {
    "genel_enerji_sinifi": "A, B, C, vb.",
    "yillik_enerji_tuketimi_kwh_m2": "float"
  },
  "sera_gazi_emisyon_sinifi": {
    "genel_emisyon_sinifi": "A, B, C, vb.",
    "yillik_emisyon_kgco2_m2": "float"
  }
}
```

## 2. TSRS ve Yasal Referans Linkleri
EKB'den çekilecek sınıf verileri, binaların fiziksel risklerinin (TSRS 2) ve Kapsam 1/2 sera gazı emisyon hesaplamalarının doğrulanmasında kullanılacaktır.
* **Enerji Kimlik Belgesi (EKB) Yönetmeliği:** [Resmi Gazete Linki](https://www.resmigazete.gov.tr/eskiler/2008/12/20081205-9.htm)
* **KGK TSRS 2 (İklim Riskleri ve Kapsam 1-2):** [TSRS 2 PDF](https://www.kgk.gov.tr/Portalv2Uploads/files/Duyurular/v2/Surdurulebilirlik/RaporlamaStandarti/TSRS2_.pdf)

## 3. Sık Karşılaşılan LLM ve OCR Hataları (Pitfalls)
* **Türkçe Karakterlerde Fazladan Boşluklar:** OCR motoru "ı", "İ", "ş", "ğ", gibi karakterleri okurken bazen harfin önüne veya arkasına boşluk koyabilmektedir (Örn: "SahibininAd ı Soyad ı", "Apartman ı", "ORTAH İ").
* **Tablo Sütunlarında Veri Yığılması:** "Düzenlenme Tarihi", "Geçerlilik Tarihi" ve "İl/İlçe" gibi farklı alanlar, MD dosyasında tek bir tablo hücresine sıkışmış olabilir (Örn: "21.10.2022 21.10.2032 C SAR/TRABZON").
* **Grafiklerin Yanlış Okunması veya Base64 Formatına Dönüşmesi:** EKB üzerinde Enerji ve Emisyon sınıfları, ok işaretleri ve renkli barlar (A'dan G'ye) ile görsel olarak gösterilir. MD dosyasına bu barlar kocaman `![Image](data:image/png;base64...)` etiketleri olarak yansıyabilir ve etrafında A B C D E F G harfleri dağınık bir metin olarak sıralanabilir.
* **Tarih Formatı Hataları:** Düzenlenme ve geçerlilik tarihlerinin "Gün/Ay/Yıl" yerine Amerikan formatında algılanması.
* **Birimlerin Ayrıştırılamaması:** "kWh/m²-yıl" ve "kgCO2/m²-yıl" gibi birimlerin metin içerisinde değerle bitişik okunması.

## 4. Hatayı Önleme ve Parse Etme Talimatı
* **Boşlukları Temizleme (Fuzzy Matching):** Verileri ararken "Adı Soyadı" veya "Ortahisar" gibi kelimeleri MD içinde bulamazsan, aradaki boşlukları ("Ad ı", "ORTAH İ") tolere ederek birleştir.
* **Hücre İçi Veri Çıkarımı:** Tablo yapısı kaymış olsa bile, metnin içerisinde yan yana yazılmış olan ardışık iki tarihi (Örn: "21.10.2022 21.10.2032") bul. İlkini düzenlenme, ikincisini geçerlilik tarihi olarak JSON'a eşle.
* **Grafik/Bant Analizi:** Sınıf harfleri listesinde (A,B,C,D,E,F,G), yanında sayısal değer (örneğin "125 kWh/m2-yıl") veya binanın mevcut durumunu gösteren harfi (Binanın genel enerji sınıfı veya emisyon sınıfı) çek. Eğer harfler (A B C D vb.) dümdüz bir satırda yazılmışsa ve yanında ok işareti yoksa, belgenin o bölgesindeki tekil ve vurgulanan (ya da birime sahip olan) harfi bulmaya odaklan.
* **İki Farklı Sınıf Ayrımı:** Belgede iki farklı renkli bant yapısı vardır: 1. Enerji Sınıfı, 2. Sera Gazı Emisyon Sınıfı. Her ikisinin de sınıf harflerini ayrı alanlar olarak (A-G arası) JSON'a aktar.
* **Değer Temizliği:** Sayısal verilerden "kWh/m2", "kgCO2" gibi birim takılarını çıkart, sayısal formatları float olarak ata.
