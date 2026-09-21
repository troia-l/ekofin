
KOBİ segmentini eklemek SAM'i önemli ölçüde büyütür çünkü TSRS zorunlu kapsamı yalnızca büyük/halka açık şirketleri kapsıyor — KOBİ'ler şu an gönüllü raporlama kategorisinde, yani senin ürünün için ayrı ve çok daha büyük bir pazar segmenti bu. Bunu ayrı bir katman olarak modelleyeceğim.

Excel dosyasını kurmadan önce skill dosyasına bakayım.


Excel oluşturma kurallarını kontrol ediyorum
Excel oluşturma kurallarını kontrol ediyorum
Türkiye'de KOBİ sayısına dair güncel resmi veriyi de kontrol edeyim, sonra modeli kuracağım.


Searched the web
Searched the web
İyi rakamlar buldum. Şimdi modeli kuruyorum.


Ran 4 commands, created a file
Ran 4 commands, created a file
Sıfır hata, 61 formül başarıyla hesaplandı. Sonuçları doğrulamak için değerleri kontrol edeyim.


Ran 2 commands
Ran 2 commands
Sayılar mantıklı görünüyor ve formüller doğru zincirleniyor. Dosyayı çıktı klasörüne kopyalayıp sunuyorum.


Ran a command, read a file
Ran a command, read a file
4 sekme:

Özet — Sonuç tablosu + metodoloji notu (TL ve $ olarak)
Varsayımlar — Tüm mavi (değiştirilebilir) girdiler: zorunlu kapsam şirket sayıları, KOBİ evreni (3,93M — TÜİK 2024), daraltma oranları, ARPU varsayımları
Hesaplama — Formül zinciri, TAM/SAM/SOM'u otomatik hesaplıyor
Hassasiyet Analizi — KOBİ alt-segment oranı × erişilebilirlik oranı matrisi, ARPU duyarlılığı
Şu anki temel senaryo sonuçları:

TAM ≈ 11,9 milyar TL/yıl (~283M $)
SAM ≈ 2,26 milyar TL/yıl (~54M $)
SOM ≈ 68 milyon TL/yıl (~1,6M $) — 3 yıl, %3 SAM penetrasyonu varsayımıyla
KOBİ'yi nasıl modelledim: TÜİK'in 3,93M KOBİ rakamından başlayıp iki kademeli daraltma yaptım — önce gerçekten ESG talebi olası alt-segment (%8, ihracatçı/tedarikçi/kredi arayan kesim), sonra bunun fiilen erişilebilir kısmı (%15). Bu iki oranı Varsayımlar sekmesinde değiştirip SAM'in nasıl hareket ettiğini canlı görebilirsin.

En kırılgan nokta KOBİ tarafındaki yüzdeler — Hassasiyet sekmesi bunu göstermek için var. Rakamları kendi gözlemlerinle (hackathon/TSRS şablon çalışman, gördüğün şirketlerin profili) eşleştirip ayarlaman en doğrusu olur.


