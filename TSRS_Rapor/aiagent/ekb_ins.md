# LLM Instruction: Enerji Kimlik Belgesi (EKB) Ayrıştırma Kılavuzu

## 1. Belgenin Amacı ve Çekilecek Kritik Veriler

**Amaç:** Bu belgeden çekilecek veriler, şirketin genel enerji tüketim profilini, bina kabuğu performansını ve enerji sınıfını belirlemek içindir. Bu veriler TSRS'ye (Türkiye Sürdürülebilirlik Raporlama Standartları) göre Kapsam 1 ve Kapsam 2 emisyonlarının hesaplanmasında çapraz doğrulama (cross-validation) için kullanılacaktır.

**Hedeflenen Veriler (JSON Formatında Beklenenler):**

* **Bina/Proje Bilgileri:**
    * `Sertifika_No`: Belge Numarası (Sertifika No) veya UavtNo.
    * `Bina_Sahibi`: Bina Sahibinin Adı/Soyadı.
* **Enerji Performansı ve Sınıfı:**
    * `Birincil_Enerji_Kazanci`: Birincil Enerji Kazancı değeri (genellikle kW veya benzeri bir birim).
    * `Enerji_Sinifi`: Tüketim/skor değerleri (eğer metinde varsa, örneğin A, B, C, D harf sınıfları).
* **Mekanik/Bina Sistemleri:**
    * `Sistem_Tipi`: Kullanılan sistemlerin tipleri (Örn: "Yoğuşmalı Kombi", "Ayrık (Split) Sistemler", "Rüzgar Enerjisi", "Fluoresan").
    * `Sistem_Kapasitesi`: Bu sistemlerin adetleri veya kapasiteleri (Örn: "24 Mahal", "55").
* **Bina Kabuğu/Yalıtım Bilgileri:**
    * `Bina_Bolgesi_Alan`: Dış Bina Bölgesi (m2) değerleri (Örn: Dolgu Duvar, Kolon, Temel, Çatı için m2 alanları).
    * `Bina_Bolgesi_U_Degeri`: U-değerleri (Örn: "0,51", "0,68" vb.).
    * `Pencere_Cerceve_Tipi`: Pencere/Cam Tipleri (Örn: "Renksiz Yalıtım Camı", "PVC Çerçeve").

---

## 2. TSRS ve Yasal Referans Linkleri

Modelin bu veriyi neden çektiğini anlaması için referans kaynaklar aşağıda listelenmiştir:

* **KGK TSRS 1 (Genel Hükümler):** Şirketlerin genel sürdürülebilirlik raporlamasına yönelik temel prensipleri belirler.
    [KGK TSRS 1](https://www.kgk.gov.tr/Portalv2Uploads/files/Duyurular/v2/Surdurulebilirlik/RaporlamaStandarti/TSRS%201.pdf)
* **KGK TSRS 2 (İklim Riskleri ve Kapsam 1-2):** İklimle bağlantılı risklerin ve fırsatların, aynı zamanda Kapsam 1 ve 2 emisyonlarının raporlanmasıyla ilgilidir. Enerji tüketim verileri bu kapsamların hesaplanmasında doğrudan kullanılır.
    [KGK TSRS 2](https://www.kgk.gov.tr/Portalv2Uploads/files/Duyurular/v2/Surdurulebilirlik/RaporlamaStandarti/TSRS2_.pdf)
* **Enerji Kimlik Belgesi (EKB) Yönetmeliği:** Binaların enerji performansının değerlendirilmesi ve belgelendirilmesine ilişkin usul ve esasları belirler.
    [EKB Yönetmeliği](https://www.resmigazete.gov.tr/eskiler/2008/12/20081205-9.htm)

---

## 3. Ayrıştırma Mantığı ve Kurallar

Belgeyi işlerken şu kurallara dikkat edilmelidir:

1.  **Anahtar Kelime Araması:** Belgedeki veriler yapılandırılmamış (unstructured) olabilir. Tablo içerisindeki değerleri ayıklamak için sütun başlıklarını veya satır içi etiketleri kullanın. Örneğin, "Sertifika No:" ifadesinden sonra gelen metni `Sertifika_No` olarak alın. "Bina Sahibinin Adı Soyadı:" ifadesinden sonraki metni `Bina_Sahibi` olarak alın.
2.  **Tablo Verilerinin İşlenmesi:** Eğer belge içinde "Bina Dış Kabuğunda En Fazla Kullanılan Yapı Bileşenleri" veya benzeri bir tablo yapısı varsa, bu yapıları hiyerarşik bir şekilde JSON objesine aktarın. "Bileşen Adı", "Alan (m2)", "U-değeri" gibi yapıları tanımlamaya çalışın.
3.  **Enerji Sınıflandırması:** Enerji sınıfı genellikle A, B, C, D gibi harflerle ifade edilir. Belge içindeki tabloları kontrol ederek hangi sisteme (Aydınlatma, Soğutma vb.) ait enerji sınıfının atandığını tespit edin.
4.  **Mekanik Sistemler:** "Mekanik sistemler", "Yoğuşmalı Kombi", "Ayrık Sistemler", "Rüzgar Enerjisi" vb. anahtar kelimelerle arayın ve ilişkili kapasite (Örn: "24 Mahal") veya üretim değerlerini bulun.
5.  **Açıklamalar:** Belgede geçen önemli notları, örneğin "Kırmızı renk ile gösterilen mekanik sistemler..." gibi uyarıları da yakalayıp JSON'a ekleyin.

---

## 4. Beklenen JSON Çıktı Formatı

Çıkarılan verileri aşağıdaki JSON yapısına uygun olarak döndürün. Bulunamayan veriler için `null` değeri kullanın.

```json
{
  "Bina_Proje_Bilgileri": {
    "Sertifika_No": "M2261D2DB3FE7",
    "Bina_Sahibi": "Kale Apartmanı"
  },
  "Enerji_Performansi_ve_Sinifi": {
    "Birincil_Enerji_Kazanci": 0.00,
    "Enerji_Sinifi_Aydinlatma": null, 
    "Enerji_Sinifi_Sogutma": null,
    "Enerji_Sinifi_Havalandirma": null,
    "Enerji_Sinifi_Sicak_Su": null
  },
  "Mekanik_Bina_Sistemleri": [
    {
      "Sistem_Tipi": "Yoğuşmalı Kombi",
      "Adet_Kapasite": "24 Mahal"
    },
    {
      "Sistem_Tipi": "Ayrık (Split) Sistemler",
      "Adet_Kapasite": "3 Mahal"
    },
    {
      "Sistem_Tipi": "Fluoresan (18 W)",
      "Adet_Kapasite": "55"
    }
  ],
  "Bina_Kabugu_Yalitim_Bilgileri": [
    {
      "Bilesen_Tipi": "Dolgu Duvar",
      "Alan_m2": 1274.70,
      "U_Degeri": 0.51
    },
    {
      "Bilesen_Tipi": "Kolon/B.arme",
      "Alan_m2": 617.86,
      "U_Degeri": 0.68
    },
    {
      "Bilesen_Tipi": "Temel",
      "Alan_m2": 488.23,
      "U_Degeri": 1.39
    },
    {
      "Bilesen_Tipi": "Kırma Çatı",
      "Alan_m2": 488.23,
      "U_Degeri": 0.32
    },
    {
      "Bilesen_Tipi": "2011 Sonrası - Renksiz Yalıtım Camı",
      "Alan_m2": 530.17,
      "U_Degeri": 2.70
    }
  ]
}