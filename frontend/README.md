# 🌱 EkoFin Frontend — Yeşil Enerji Finansman Arayüzü

EkoFin platformunun **React 19** ve **Vite 7** ile geliştirilmiş frontend uygulamasıdır. Yeşil enerji finansmanı, ESG raporlama ve sürdürülebilirlik yönetimi için modern ve duyarlı bir arayüz sunar.

## ✨ Özellikler

- **🏢 Kurumsal Dashboard** — Bankalar ve holdingler için ESG içgörülü B2B panel
- **💰 YZ Destekli Kredi Pazarı** — ESG skorlarına göre optimize edilmiş düşük faizli yeşil kredi fırsatları
- **🤝 Kitle Fonlaması** — Güneş ve rüzgar enerjisi projelerine yatırım için modern arayüz
- **🔍 YZ ESG Raporu (Greenwashing Kalkanı)** — NLP destekli güven puanlamasıyla anlık şirket analizi
- **📊 Yeşil ROI Simülatörü** — Yeşil enerji yatırım getirisi için interaktif hesaplayıcı
- **📋 TSRS Rapor Üretici** — Türkiye Sürdürülebilirlik Raporlama Standartlarına uyumlu raporlama
- **🏦 Banka Dashboard** — Finans kuruluşu operatörleri için özel görünüm
- **📝 Başvuru Formu** — Yeşil kredi başvuru akışı

## 🛠️ Teknoloji Yığını

| Teknoloji | Kullanım Amacı |
|---|---|
| **React 19** | UI framework |
| **Vite 7** | Derleme aracı ve geliştirme sunucusu |
| **React Router 7** | İstemci taraflı yönlendirme (HashRouter) |
| **Framer Motion** | Animasyonlar ve geçişler |
| **Recharts** | Veri görselleştirme ve grafikler |
| **Lucide React** | İkon kütüphanesi |
| **Vanilla CSS** | CSS Variables, Flexbox ve Grid ile stillendirme |

## 🚀 Kurulum

### Gereksinimler

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### Yükleme ve Çalıştırma

```bash
# 1. Frontend dizinine gidin (proje kök dizininden)
cd frontend

# 2. Bağımlılıkları yükleyin
npm install

# 3. Geliştirme sunucusunu başlatın
npm run dev
```

Uygulama **http://localhost:5173** adresinde erişilebilir olacaktır.

### Kullanılabilir Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Hot module replacement ile geliştirme sunucusunu başlatır |
| `npm run build` | `dist/` klasörüne optimize üretim derlemesi oluşturur |
| `npm run preview` | Üretim derlemesini yerel olarak önizler |
| `npm run lint` | Kod kalitesi için ESLint kontrolü çalıştırır |

## 📁 Proje Yapısı

```
frontend/
├── public/                     # Doğrudan sunulan statik dosyalar
│   ├── ecofin_logo.png         # Platform logosu
│   └── vite.svg                # Vite varsayılan ikon
│
├── src/
│   ├── assets/                 # Paketlenen statik dosyalar
│   │   └── react.svg
│   │
│   ├── components/             # Yeniden kullanılabilir UI bileşenleri
│   │   ├── layout/
│   │   │   ├── MainLayout.jsx      # Sidebar + topnav ile uygulama kabuğu
│   │   │   ├── Sidebar.jsx         # Navigasyon kenar çubuğu
│   │   │   └── Topnav.jsx          # Üst navigasyon çubuğu
│   │   ├── ConditionsModal.jsx     # Kredi koşulları popup'ı
│   │   ├── CreditItem.jsx         # Kredi listeleme kartı
│   │   ├── EsgBadge.jsx           # ESG skor rozeti
│   │   ├── Header.jsx             # Sayfa başlığı
│   │   ├── HeroSection.jsx        # Ana sayfa hero bölümü
│   │   ├── HighlightCard.jsx      # Özellik vurgulama kartı
│   │   ├── Icons.jsx              # Özel ikon bileşenleri
│   │   └── ProjectDetailsModal.jsx # Proje detay popup'ı
│   │
│   ├── pages/                  # Sayfa bileşenleri
│   │   ├── bank/
│   │   │   └── BankDashboard.jsx   # Banka operatör paneli
│   │   ├── kobi/                   # KOBİ sayfaları
│   │   │   ├── Dashboard.jsx       # KOBİ ana dashboard
│   │   │   ├── GreenROI.jsx        # ROI analiz sayfası
│   │   │   ├── Integration.jsx     # Sistem entegrasyon sayfası
│   │   │   ├── Simulator.jsx       # Yatırım simülatörü
│   │   │   └── TsrsReport.jsx      # TSRS rapor üretici
│   │   ├── ApplicationForm.jsx     # Kredi başvuru formu
│   │   ├── Corporate.jsx           # Kurumsal genel bakış
│   │   ├── Crowdfunding.jsx        # Kitle fonlaması pazarı
│   │   ├── ESGReport.jsx           # ESG analiz raporu
│   │   ├── Home.jsx                # Ana sayfa
│   │   └── PublicAudit.jsx         # Halka açık şeffaflık denetimi
│   │
│   ├── App.jsx                 # Yönlendirme ile kök bileşen
│   ├── App.css                 # Uygulama düzeyinde stiller
│   ├── index.css               # Global stiller ve CSS değişkenleri
│   └── main.jsx                # Uygulama giriş noktası
│
├── index.html                  # HTML giriş noktası
├── vite.config.js              # Vite yapılandırması
├── eslint.config.js            # ESLint yapılandırması
├── package.json                # Bağımlılıklar ve komutlar
└── package-lock.json           # Bağımlılık kilit dosyası
```

## 🔗 Backend Bağlantısı

Bu frontend, **Model C** backend API'sine (FastAPI) bağlanır. Varsayılan olarak API `http://localhost:8000` adresinde beklenir. Backend kurulumu için [ana README](../README.md) dosyasına bakınız.

## 🌐 Dağıtım

Proje, GitHub Pages'e otomatik dağıtım için GitHub Actions iş akışı (`.github/workflows/deploy.yml`) içermektedir.

---

*Daha yeşil bir gelecek için ♻️ ile geliştirilmiştir.*
