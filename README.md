# 🌱 EkoFin — Yapay Zeka Destekli Yeşil Enerji Finansman Platformu

EkoFin, karbon nötrlük hedeflerine ulaşılmasını hızlandırmak için geliştirilmiş **yapay zeka destekli sürdürülebilirlik denetimi ve yeşil finansman platformudur.** Uydu verileri, IoT sensörleri ve çapraz veri kaynakları ile projelerin **gerçek çevresel etkisini** tespit ederek greenwashing'i ortadan kaldırır.

## 🏗️ Proje Yapısı

```
ekofin/
├── frontend/          # React + Vite web uygulaması
│   ├── src/
│   │   ├── components/    # Yeniden kullanılabilir UI bileşenleri
│   │   ├── pages/         # Sayfa bileşenleri (Ana Sayfa, Dashboard, ESG Raporu vb.)
│   │   └── assets/        # Statik dosyalar
│   ├── public/            # Herkese açık dosyalar ve dokümanlar
│   ├── package.json       # Node.js bağımlılıkları
│   └── vite.config.js     # Vite yapılandırması
│
├── model_c/           # FastAPI backend — Yapay Zeka analiz motoru
│   ├── app.py             # API giriş noktası
│   ├── model.py           # Veri modelleri (Pydantic)
│   ├── calculator.py      # Yeşil ROI hesaplayıcı
│   ├── roi.py             # ROI analiz motoru
│   ├── factors.json       # Emisyon faktörleri verisi
│   ├── requirements.txt   # Python bağımlılıkları
│   └── .env.example       # Ortam değişkenleri şablonu
│
├── BelgeTarama/       # Belge tarama talimatları (OCR rehberleri)
├── TSRS_Rapor/        # TSRS uyumlu sürdürülebilirlik rapor şablonları ve verileri
├── kaynaklar/         # Referans materyalleri ve kaynaklar
└── .gitignore
```

## ✨ Temel Özellikler

- **🏢 Kurumsal Yeşil Panel** — Bankalar ve holdingler için B2B uyumlu dashboard
- **🤖 YZ Destekli ESG Analizi** — Gemini AI ile gerçek sürdürülebilirlik doğrulaması
- **📊 Yeşil ROI Simülatörü** — Yeşil enerji projeleri için yatırım getirisi hesaplama
- **📋 TSRS Raporlama** — Türkiye Sürdürülebilirlik Raporlama Standartlarına uyumlu rapor üretimi
- **🌍 Kitle Fonlaması** — Bireysel yatırımcıların yeşil dönüşüme katılımı
- **🔍 Halka Açık Denetim Paneli** — Çevresel iddialarda şeffaflık öncelikli yaklaşım
- **📄 Belge Tarama** — OCR tabanlı belge doğrulama (enerji kimlik belgeleri, faturalar vb.)

## 🚀 Kurulum

### Gereksinimler

- **Node.js** ≥ 18.x ve **npm** ≥ 9.x
- **Python** ≥ 3.10
- **Gemini API Anahtarı** (isteğe bağlı — test için mock algoritma otomatik çalışır)

---

### Frontend Kurulumu

```bash
# Frontend dizinine gidin
cd frontend

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

Uygulama `http://localhost:5173` adresinde erişilebilir olacaktır.

#### Kullanılabilir Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusunu başlatır (hot reload) |
| `npm run build` | Üretim için derler |
| `npm run preview` | Üretim derlemesini yerel olarak önizler |
| `npm run lint` | ESLint kontrollerini çalıştırır |

---

### Backend Kurulumu (Model C — YZ Motoru)

```bash
# Backend dizinine gidin
cd model_c

# Sanal ortam oluşturun ve aktif edin
python -m venv venv
source venv/bin/activate   # Windows için: venv\Scripts\activate

# Bağımlılıkları yükleyin
pip install -r requirements.txt

# Ortam değişkenlerini yapılandırın
cp .env.example .env
# .env dosyasını açıp GEMINI_API_KEY ekleyin (isteğe bağlı)

# API sunucusunu başlatın
uvicorn app:app --reload --port 8000
```

API `http://localhost:8000` adresinde erişilebilir olacaktır.

> **Not:** `GEMINI_API_KEY` boş bırakılırsa, sistem otonom mock eşleştirme algoritmasını (regex tabanlı) kullanır. API anahtarı olmadan da test yapabilirsiniz.

---

### Tam Çalıştırma (Frontend + Backend)

İki ayrı terminal penceresi açın:

```bash
# Terminal 1 — Backend
cd model_c
source venv/bin/activate
uvicorn app:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

## 🛠️ Teknoloji Yığını

| Katman | Teknolojiler |
|---|---|
| **Frontend** | React 19, Vite 7, React Router 7, Framer Motion, Recharts, Lucide Icons |
| **Backend** | FastAPI, Uvicorn, Pydantic, Pandas |
| **YZ/ML** | Google Gemini API (gemini-2.5-flash), Instructor, OpenAI SDK |
| **Veri** | JSON tabanlı emisyon faktörleri, TSRS şablonları |

## 📄 Ortam Değişkenleri

### Backend (`model_c/.env`)

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `GEMINI_API_KEY` | İsteğe bağlı | Google Gemini API anahtarı. Boş bırakılırsa mock algoritma kullanılır. |

## 🤝 Katkıda Bulunma

1. Depoyu fork edin
2. Özellik dalı oluşturun (`git checkout -b feature/harika-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: harika özellik eklendi'`)
4. Dalınıza push edin (`git push origin feature/harika-ozellik`)
5. Pull Request açın

## 📝 Lisans

Bu proje akademik ve demonstrasyon amaçlı geliştirilmiştir.
