# EkoFin TSRS Raporlaması Veri Çıkarma Şeması (Data Blueprint)

Bu doküman, LangChain veri çıkarma ajanlarının (Extraction Agents) farklı belge türlerinden TSRS 1 ve TSRS 2 standartları için toplayacağı tüm verilerin net formatını ve veri şemasını içerir.

---

## 1. Belge: Şirket Yönetici Beyan Formu (Sistem Anketi)
**Amacı:** TSRS 1 ve 2 kapsamındaki Yönetişim, Strateji ve İleriye Dönük Hedefler (Niyet) verilerini dijital form üzerinden almak.

### Çekilecek Veriler (Ajanın JSON'a dizeceği liste):
- `Yonetim_Kurulu_Sorumlusu`: İklim risklerinden sorumlu YK üyesi var mı? (Boolean)
- `YK_Toplanti_Sikligi`: Sürdürülebilirlik konularının YK'da görüşülme sıklığı (Aylık/Çeyreklik/Yıllık)
- `Surdurulebilirlik_Komitesi_Durumu`: Aktif bir komite var mı? (Boolean)
- `Yonetici_Ucretlendirme_Baglantisi`: Yöneticilerin primleri ESG hedeflerine bağlı mı? (Boolean)
- `Risk_Yonetim_Sistemi`: Kurumsal Risk Yönetimi (ERM) çerçevesi kullanılıyor mu? (Metin)
- `Iklim_Senaryo_Analizi`: 1.5 derece senaryo analizi yapıldı mı? (Boolean)
- `Kisa_Vadeli_Hedef`: 1-3 yıl içindeki emisyon azaltım hedefi (%)
- `Uzun_Vadeli_Hedef`: Net sıfır taahhüt yılı (Tarih/Yıl)
- `Kapsam_3_Muafiyeti`: İlk yıl için Kapsam 3 muafiyeti kullanılacak mı? (Boolean)
- `Karbon_Kredisi_Kullanimi`: Hedeflere ulaşmak için karbon kredisi (offset) alınıyor mu? (Boolean)
- `Tedarik_Zinciri_Denetimi`: Tedarikçiler ESG kriterlerine göre denetleniyor mu? (Boolean)
- `Etik_Kurallar_Belgesi`: Şirketin yazılı iş etiği kuralları var mı? (Boolean)
- `Ihbar_Hatti_Mekanizmasi`: Anonim çalışan ihbar hattı var mı? (Boolean)
- `ISO_14001_Sertifikasi`: Çevre Yönetim Sistemi belgesi var mı? (Boolean)
- `ISO_50001_Sertifikasi`: Enerji Yönetim Sistemi belgesi var mı? (Boolean)
- `ISO_14064_Sertifikasi`: Karbon Ayak İzi doğrulama belgesi var mı? (Boolean)
- `ISO_45001_Sertifikasi`: İSG yönetim sistemi belgesi var mı? (Boolean)
- `Arge_Stratejisi`: Yeşil ürün/süreç geliştirmeye yönelik Ar-Ge stratejisi var mı? (Metin)
- `Sirket_Faaliyet_Sektoru`: Ana faaliyet NACE kodu açıklaması (Metin)
- `Fiziksel_Risk_Degerlendirmesi`: Tesislerin sel/kuraklık risklerine karşı analizi yapıldı mı? (Boolean)

---

## 2. Belge: SGK Hizmet Dökümü ve İnsan Kaynakları Listeleri
**Amacı:** TSRS 1 kapsamındaki "Sosyal Metrikler, Çeşitlilik, Kapsayıcılık ve İşgücü" istatistiklerini hesaplamak.

### Çekilecek Veriler / Hesaplanacak Metrikler:
- `Toplam_Aktif_Calisan`: Dönem sonu itibarıyla toplam bordrolu kişi (Integer)
- `Kadin_Calisan_Sayisi`: Toplam kadın personel (Integer)
- `Erkek_Calisan_Sayisi`: Toplam erkek personel (Integer)
- `Kadin_Yonetici_Sayisi`: Yönetici (Müdür ve üstü) kademesindeki kadınlar (Integer)
- `Kadin_Yonetici_Orani`: Yönetici kademesindeki kadın yüzdesi (Float %)
- `Engelli_Calisan_Sayisi`: Yasal engelli kadrosunda çalışanlar (Integer)
- `Yas_Grubu_30_Alti`: 30 yaş altı çalışan sayısı (Integer)
- `Yas_Grubu_30_50_Arasi`: 30-50 yaş arası çalışan sayısı (Integer)
- `Yas_Grubu_50_Ustu`: 50 yaş üstü çalışan sayısı (Integer)
- `Mavi_Yaka_Sayisi`: Beden gücü ile çalışanlar (Integer)
- `Beyaz_Yaka_Sayisi`: Ofis/yönetim çalışanları (Integer)
- `Tam_Zamanli_Sayisi`: 30 gün prim yatanlar (Integer)
- `Yari_Zamanli_Sayisi`: Kısmi süreli çalışanlar (Integer)
- `Taseron_Calisan_Sayisi`: Doğrudan bordrolu olmayan alt işveren personeli (Integer)
- `Yabanci_Uyruklu_Sayisi`: Yabancı çalışan sayısı (Integer)
- `Sendikali_Calisan_Sayisi`: Toplu iş sözleşmesine tabi çalışanlar (Integer)
- `Donem_Ici_Ise_Girisler`: Yıl içinde işe başlayanlar (Integer)
- `Donem_Ici_Isten_Cikislar`: Yıl içinde ayrılanlar (Integer)
- `Calisan_Devir_Orani_Turnover`: Ayrılanlar / Ortalama Çalışan oranı (Float %)
- `Dogum_Izni_Donus_Orani`: Doğum izninden sonra işe dönen kadın çalışan oranı (Float %)

---

## 3. Belge: Detaylı Mizan ve Finansal Tablolar
**Amacı:** TSRS "Strateji ve Risk Yönetimi" kapsamındaki sürdürülebilirlik bağlantılı "Finansal Etkileri" tespit etmek.

### Çekilecek Veriler (Hesap kodları taranarak bulunacak değerler - TL cinsinden):
- `Cevre_Cezalari_Tutari`: Çevre kirliliği vb. nedenlerle ödenen yasal cezalar (Float)
- `Yesil_Yatirim_Capex`: GES, RES, Arıtma tesisi gibi 253/258 hesaplardaki duran varlık yatırımları (Float)
- `ArGe_Harcamalari`: Çevre dostu inovasyon için ayrılan bütçe (Float)
- `Atik_Bertaraf_Giderleri`: Çöp ve tehlikeli atık bertarafı için firmalara ödenen tutarlar (Float)
- `Toplam_Elektrik_Gideri`: Finansal elektrik maliyeti (Float)
- `Toplam_Dogalgaz_Gideri`: Finansal doğalgaz maliyeti (Float)
- `Toplam_Akaryakit_Gideri`: Finansal araç/jeneratör yakıt maliyeti (Float)
- `Toplam_Su_Gideri`: Finansal şebeke suyu maliyeti (Float)
- `Yenilenebilir_Enerji_Satis_Geliri`: Varsa GES'ten şebekeye satılan elektrik geliri (Float)
- `Egitim_Giderleri`: Personele verilen İSG ve mesleki eğitim faturaları toplamı (Float)
- `Sivil_Toplum_Bagislari`: Derneklere/vakıflara yapılan sosyal yardımlar (Float)
- `Kidem_Tazminati_Karsiligi`: Ayrılan kıdem tazminatı (Sosyal güvenlik güvencesi) (Float)
- `Karbon_Kredisi_Giderleri`: Karbon offset için satın alınan sertifika (I-REC/VCS) harcamaları (Float)
- `Is_Sagligi_ve_Guvenligi_Giderleri`: OSGB, baret, maske, periyodik muayene giderleri (Float)
- `Sigorta_Giderleri`: Yangın, sel gibi fiziksel iklim risklerine karşı ödenen primler (Float)
- `Cevresel_Provizyonlar`: Gelecekteki çevre restorasyonu için ayrılan karşılıklar (Float)
- `Yesil_Kredi_Faiz_Gideri`: Sürdürülebilirlik bağlantılı kredilere ödenen faiz (Float)
- `Danismanlik_Giderleri`: ÇED, ESG veya karbon ayak izi danışmanlarına ödenen tutarlar (Float)

---

## 4. Belge: Tüketim Faturaları ve E-Fatura Dökümleri
**Amacı:** TSRS 2 Kapsam 2 (Dolaylı) ve Kapsam 1 (Doğrudan-Sabit Yanma) emisyonlarının fiziki metriklerini çıkarmak.

### Çekilecek Veriler:
- `Fatura_Turu`: Elektrik / Doğalgaz / Kömür / LNG vs. (Metin)
- `Fatura_Donemi`: İlgili ay ve yıl (Tarih)
- `Tuketim_Miktari`: Çekilen asıl tüketim rakamı (Float)
- `Tuketim_Birimi`: kWh, m³, ton, Sm³ (Metin)
- `Gunduz_Tuketimi`: Elektrik için gündüz çekişi (Float)
- `Puant_Tuketimi`: Elektrik için akşam yoğun saat çekişi (Float)
- `Gece_Tuketimi`: Elektrik için gece çekişi (Float)
- `Reaktif_Tuketim_Enduktif`: Elektrik verimliliği cezası var mı gösterir (Float)
- `Reaktif_Tuketim_Kapasitif`: Elektrik verimliliği cezası (Float)
- `Yenilenebilir_Enerji_Tarifesi`: Fatura Yeşil Tarife'den mi (YETA) kesilmiş? (Boolean)
- `Tedarikci_Sirket_Adi`: Enerjinin kimden alındığı (Metin)
- `Tesis_Lokasyonu`: Faturanın ait olduğu fabrika/şube adresi (Metin)

---

## 5. Belge: Taşıt Tanıma Sistemi (TTS) ve Filo Ruhsatları
**Amacı:** TSRS 2 Kapsam 1 (Mobil Yanma) sera gazı emisyonlarının hesaplanması.

### Çekilecek Veriler:
- `Toplam_Arac_Sayisi`: Filodaki toplam aktif araç (Integer)
- `Binek_Arac_Sayisi`: Otomobil sayısı (Integer)
- `Ticari_Arac_Sayisi`: Kamyon, tır, kamyonet sayısı (Integer)
- `Dizel_Arac_Sayisi`: Motorin kullanan araç sayısı (Integer)
- `Benzinli_Arac_Sayisi`: Benzin kullanan araç sayısı (Integer)
- `Elektrikli_Arac_Sayisi`: EV (Elektrikli) araç sayısı (Integer)
- `Hibrit_Arac_Sayisi`: Yarı elektrikli araç sayısı (Integer)
- `Yillik_Toplam_Dizel_Tuketimi`: TTS'den çekilen toplam litre (Float)
- `Yillik_Toplam_Benzin_Tuketimi`: TTS'den çekilen toplam litre (Float)
- `Kendimali_Arac_Sayisi`: Şirketin mülkiyetindeki araçlar (Integer)
- `Kiralik_Arac_Sayisi`: Uzun dönem operasyonel kiralama (Scope 3'e kayabilir) (Integer)
- `Sogutuculu_Arac_Sayisi`: Frigofirik (soğutucu gaz kaçak riski - Kapsam 1) araç sayısı (Integer)

---

## 6. Belge: Enerji Kimlik Belgesi (EKB) ve Etüt Raporları
**Amacı:** Bina enerji performansı ve iklim geçiş risklerindeki (Transition Risks) altyapı ihtiyaçlarını saptamak.

### Çekilecek Veriler:
- `Belge_Sertifika_No`: EKB numarası (Metin)
- `Genel_Enerji_Sinifi`: A, B, C, D, E, F, G (Karakter)
- `Sera_Gazi_Emisyon_Sinifi`: Karbon performansı sınıfı (Karakter)
- `Bina_Kullanim_Alani`: Toplam metrekare m² (Float)
- `Yillik_Birincil_Enerji_Tuketimi`: m² başına yıllık tüketim kWh (Float)
- `Aydinlatma_Sinifi`: Sadece aydınlatma verimliliği (Karakter)
- `Sogutma_Sinifi`: Soğutma sistemleri verimliliği (Karakter)
- `Isitma_Sinifi`: Isıtma sistemleri verimliliği (Karakter)
- `Yenilenebilir_Enerji_Payi`: Binanın kendi ürettiği enerjinin oranı % (Float)
- `Ana_Isitma_Sistemi`: Merkezi, Kombi, VRF vs. (Metin)
- `Ana_Sogutma_Sistemi`: Split klima, Chiller vs. (Metin)
- `Yalitim_Durumu`: Cephe yalıtım tipi veya kalınlığı (Metin)

---

## 7. Belge: OSGB ve İş Sağlığı Güvenliği (İSG) Raporları
**Amacı:** TSRS 1 Sosyal Metrikler altındaki işçi sağlığı, operasyonel güvenlik ve sosyal riskleri raporlamak.

### Çekilecek Veriler:
- `Toplam_Is_Kazasi_Sayisi`: İlgili yılda SGK'ya bildirilen kaza sayısı (Integer)
- `Olumlu_Is_Kazasi`: Can kaybı ile sonuçlanan kaza sayısı (Integer)
- `Kayip_Gun_Sayisi`: Kazalar nedeniyle işçilerin alamadığı raporlu günlerin toplamı (Integer)
- `Kaza_Siklik_Orani`: 1 milyon çalışma saatine düşen kaza sayısı (Hesaplanacak - Float)
- `Meslek_Hastaligi_Sayisi`: Tespit edilen meslek hastalığı vakası (Integer)
- `Ramak_Kala_Olay_Sayisi`: Ucuz atlatılan riskli olay ihbarı sayısı (Integer)
- `Verilen_Toplam_ISG_Egitimi`: Tüm çalışanlara verilen saat toplamı (Float)
- `Calisan_Basina_Egitim_Saati`: Toplam Saat / Çalışan Sayısı (Float)
- `Risk_Degerlendirme_Tarihi`: En son risk analizinin yapıldığı tarih (Tarih)
- `Acil_Durum_Tatbikati_Sayisi`: Yılda yapılan yangın/deprem tatbikatı sayısı (Integer)
- `Saglik_Taramasi_Orani`: Periyodik muayenesi tamamlanan çalışan yüzdesi (Float %)
- `ISG_Kurulu_Toplanti_Sayisi`: İSG kurulunun yıl içinde toplanma adedi (Integer)

---

## 8. Belge: Bakanlık MoTAT (Atık) ve Çevre/Su Beyanları
**Amacı:** TSRS "Çevresel Metrikler" (Enerji dışı çevresel etkiler, Döngüsel Ekonomi) kapsamını tamamlamak.

### Çekilecek Veriler:
- `Toplam_Tehlikeli_Atik`: Üretilen tehlikeli atık miktarı kg/ton (Float)
- `Toplam_Tehlikesiz_Atik`: Kağıt, plastik, metal atık miktarı kg/ton (Float)
- `Geri_Kazanima_Gonderilen_Atik`: Geri dönüşüm tesisine verilen miktar (Float)
- `Bertarafa_Gonderilen_Atik`: Çöpe/yakmaya giden miktar (Float)
- `Atik_Geri_Donusum_Orani`: Geri Kazanım / Toplam Atık (Float %)
- `Elektronik_Atik_Miktari`: E-atık (WEEE) miktarı kg (Float)
- `Sebeke_Suyu_Tuketimi`: Belediye hattından çekilen su m³ (Float)
- `Yeralti_Suyu_Tuketimi`: Kuyu vb. kaynaklardan çekilen su m³ (Float)
- `Geri_Kazanilan_Su_Miktari`: Arıtılıp tekrar kullanılan su m³ (Float)
- `Su_Tuketim_Yogunlugu`: m³ su / Milyon TL ciro veya Üretim birimi (Float)
- `Cevre_Izin_Lisans_Durumu`: Tesisin Çevre İzin ve Lisans Belgesi (ÇED) var mı? (Boolean)
- `Atik_Su_Desarj_Miktari`: Kanalizasyona veya doğaya bırakılan atıksu m³ (Float)
