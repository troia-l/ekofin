# Kurumsal Bilanço ve Mizan (Muhasebe Verileri) Parse Talimatı

## 1. Belgenin Amacı ve Çekilecek Kritik Veriler
Kurumsal Bilanço ve Mizan, şirketlerin finansal durumlarını ve faaliyet sonuçlarını gösteren temel muhasebe tablolarıdır. Sürdürülebilirlik (ESG) raporlaması bağlamında, bu tablolardaki spesifik enerji giderleri ve yeşil yatırımlar tespit edilerek çevresel performans analiz edilir.

Hedeflenen kritik veriler JSON formatında aşağıdaki gibi olmalıdır:
```json
{
  "enerji_yakit_giderleri": {
    "730": "Genel Üretim Giderleri (Enerji/Yakıt detayı)",
    "740": "Hizmet Üretim Maliyeti (Enerji/Yakıt detayı)",
    "760": "Pazarlama Satış ve Dağıtım Giderleri (Yakıt/Enerji detayı)",
    "770": "Genel Yönetim Giderleri (Yakıt/Enerji detayı)"
  },
  "yesil_yatirim_capex": {
    "253": "Tesis, Makine ve Cihazlar (Yeşil enerji odaklı cihaz yatırımları)",
    "254": "Taşıtlar (Elektrikli/hibrit araçlar vb.)",
    "258": "Yapılmakta Olan Yatırımlar (Çevresel/sürdürülebilirlik projeleri)"
  }
}
```

## 2. TSRS ve Yasal Referans Linkleri
Bu verilerin çekilme amacı, şirketlerin iklim değişikliği risklerini (TSRS 2) ve genel sürdürülebilirlik hedeflerini (TSRS 1) finansal tablolarıyla nasıl entegre ettiklerini doğrulamaktır.
* **KGK TSRS 1 (Genel Hükümler):** [TSRS 1 PDF](https://www.kgk.gov.tr/Portalv2Uploads/files/Duyurular/v2/Surdurulebilirlik/RaporlamaStandarti/TSRS%201.pdf)
* **KGK TSRS 2 (İklim Riskleri ve Kapsam 1-2):** [TSRS 2 PDF](https://www.kgk.gov.tr/Portalv2Uploads/files/Duyurular/v2/Surdurulebilirlik/RaporlamaStandarti/TSRS2_.pdf)

## 3. Sık Karşılaşılan LLM ve OCR Hataları (Pitfalls)
* **Satır Başlarında Fazladan Karakterler (Örn: Köşeli Parantez):** OCR, satır başlarına veya kelime önlerine anlamsız `[` karakterleri ekleyebilmektedir (Örn: `[Dönen Varlıklar`, `[Hazır Degerler`, `[Ticari Borçlar`).
* **Harf Hataları (Typos):** Düşük çözünürlüklü tablolar nedeniyle harfler yanlış okunabilir. (Örn: "Maddi" yerine `Madci`, "Kıymetler" yerine `Kryretler`, "Gider" yerine `Gicer`, "Tahakkukları" yerine `Tanakkukları`).
* **Yanlış Sütun Başlıkları:** Tablo başlıkları OCR tarafından yanlış hizalanıp algılanabilir. Örn: Olması gereken `| AKTİF | TUTAR | PASİF | TUTAR |` iken MD dosyasında `| AKTİF | PASİF | PASİF | PASİF |` gibi hatalı başlıklar bulunabilir.
* **Tutarların Alt/Üst Satıra Kayması (Dikey Kayma):** Karşılığı olan sayısal değerler bazen aynı satırda okunamaz ve bir alt satırdaki bağımsız bir hücreye düşebilir. (Örn: "Alınan Avanslar" satırında tutar boşken, hemen altındaki satırda sadece `50` yazıyor olabilir).
* **Ondalık/Binlik Ayracı Karışıklığı:** Türkiye'de binlik ayracı olarak nokta (`.`), ondalık ayracı olarak virgül (`,`) kullanılır.

## 4. Hatayı Önleme ve Parse Etme Talimatı
* **Esnek Eşleştirme (Fuzzy Matching) ve Hata Toleransı:** Kalem isimlerini ararken baştaki `[` gibi işaretleri yoksay. `Madci`, `Kryretler`, `Gicer` gibi bozuk yazımları semantik (anlamsal) olarak analiz et ve doğru muhasebe kalemiyle ("Maddi", "Kıymetler", "Gider") eşleştir.
* **Dikey Kaymaları Tespit Etme:** Bir kalemin (örn. "Alınan Avanslar") karşısındaki tutar boş görünüyorsa, tablonun o sütunundaki bir alt veya bir üst satırı kontrol et. Sadece sayıdan oluşan bağımsız bir hücre varsa, bu tutarı asıl kaleme bağla.
* **Başlıklara Değil Mantığa Odaklan:** Tablo başlıklarında yazan (örn. `PASİF | PASİF`) hatalı ifadelere takılma. Tablonun ilk 2 sütununun Varlıklar (Aktif) ve tutarları, son 2 sütununun ise Kaynaklar (Pasif) ve tutarları olduğunu bilerek çapraz ve yapısal okuma yap.
* **Kapsam Odaklı Okuma:** Sadece hedeflediğimiz enerji giderleri (730, 740, 760, 770) ve CAPEX (253, 254, 258) alt kalemlerine odaklan. (Hesap kodları MD içinde açıkça belirtilmemişse, isimlendirmeler üzerinden -örn. Elektrik, Yakıt, Tesis/Makine- ilerle).
* **Sayısal Format Çevirimi:** Türkçe formatında yazılmış tutarları (Örn: 1.500,75) her zaman standart float formatına (1500.75) dönüştürerek JSON çıktısına aktar. Virgül ve nokta ayrımlarına dikkat et.
