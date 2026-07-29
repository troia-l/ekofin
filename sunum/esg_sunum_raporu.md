# Yeşil Gelecek İmalat A.Ş. ESG Değerlendirme Raporu

Bu rapor, örnek bir KOBİ olan **Yeşil Gelecek İmalat A.Ş.** için hazırlanan mock (temsili) veriler üzerinden oluşturulmuştur.

## 1. Şirket Profili ve Girdi Verileri
Şirket, Avrupa (Türkiye) bölgesinde faaliyet gösteren orta ölçekli bir imalat firmasıdır. Çevresel etkilerini azaltma yönünde adımlar atmaya başlamıştır (Karbon emisyonlarında yıllık %2 düşüş).

**Temel Finansal ve Çevresel Veriler:**
- **Gelir (Revenue):** 50 Milyon TL/USD
- **Kar Marjı (Profit Margin):** %12
- **Karbon Emisyonu:** 1200 ton (Yıllık %2 azalış)
- **Su Kullanımı:** 25.000 m³
- **Enerji Tüketimi:** 85.000 MWh

## 2. ESG Modeli Tahmini
Makine öğrenmesi modelimiz (XGBoost Track B) kullanılarak şirketin verileri analiz edilmiştir.

**Tahmin Edilen Genel ESG Skoru: 60.75 / 100**

*(Not: Ortalama skorlara kıyasla bu değerin nerede durduğu, şirketin sektörel konumunu belirler. İmalat sektörü için bu skor geliştirilmeye açık ancak olumlu bir başlangıç seviyesine işaret edebilir.)*

## 3. Skora Etki Eden Faktörler (SHAP Analizi)
Modelin bu skoru verirken hangi özellikleri (feature) olumlu veya olumsuz değerlendirdiği SHAP analizi ile görselleştirilmiştir.

![SHAP Etki Analizi](./presentation_assets/kobi_shap_waterfall.png)

**Yorumlar:**
- **Olumlu Etkiler:** Karbon emisyonlarındaki düşüş trendi (`CarbonEmissions_yoy`) ve şirketin gelirine oranla görece optimize edilmiş karbon yoğunluğu (`carbon_intensity`) skoru yukarı çeken başlıca faktörlerdir.
- **Gelişim Alanları:** Enerji tüketimi (`EnergyConsumption`) ve su yoğunluğu (`water_intensity`) skor üzerinde baskı yaratmaktadır. İmalat sektörü doğası gereği yoğun enerji tüketse de, yenilenebilir enerji kaynaklarına geçiş bu metrikleri iyileştirebilir.

## 4. Yoğunluk Metrikleri Özeti
Aşağıdaki grafik, gelire oranlanmış çevresel etki yoğunluklarını göstermektedir. Bu metrikler, şirketin büyümesi ile çevresel etkisini ayrıştırıp ayrıştıramadığını (decoupling) anlamak için kritik öneme sahiptir.

![Yoğunluk Metrikleri](./presentation_assets/kobi_metrics.png)

**Öneriler:**
1. **Enerji Verimliliği Yatırımları:** Enerji yoğunluğu metriklerinin yüksek olması nedeniyle, üretim bandında enerji verimliliği sağlayacak makine güncellemeleri veya GES (Güneş Enerjisi Santrali) kurulumları değerlendirilmelidir.
2. **Su Geri Kazanımı:** İmalat süreçlerinde kullanılan suyun arıtılarak tekrar sisteme kazandırılması (kapalı döngü sistemler), su yoğunluğu metriğini hızla düşürecektir.
