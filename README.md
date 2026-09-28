# 🌱 EkoFin — Yapay Zeka Destekli Yeşil Enerji Finansman Platformu

EkoFin, karbon nötrlük hedeflerine ulaşılmasını hızlandırmak için geliştirilmiş **yapay zeka destekli sürdürülebilirlik denetimi ve yeşil finansman platformudur.** Faturalar, mizanlar, faaliyet raporları, haberler ve toplumsal bildirimler ile projelerin **gerçek çevresel etkisini** tespit ederek greenwashing'i ortadan kaldırır.

---

## 🏗️ Proje Mimarisi ve Klasör Yapısı

```text
ekofin/
├── backend/                   # Merkezi FastAPI Backend Gateway ve Servisler
│   ├── api.py                 # Ana API giriş noktası (Tüm REST rotaları)
│   ├── config.py              # Merkezi yapılandırma ve şirket bazlı yol yönetimi
│   ├── database.py            # SQLite veri katmanı (Geri bildirim, ihbar, skor geçmişi)
│   ├── requirements.txt       # Python bağımlılıkları (FastAPI, LangChain, XGBoost, Pytest vb.)
│   ├── data/                  # Faktörler, şablonlar, şirket yükleme dizinleri (sources/)
│   ├── models/                # Eğitilmiş makine öğrenmesi modelleri (XGBoost pkl)
│   ├── modules/               # İş mantığı (Domain Modülleri)
│   │   ├── carbon/            # Karbon hesaplama, aktivite çıkarma, g-ROI ve yeşil kredi
│   │   ├── tsrs/              # 10 bölümlük TSRS sürdürülebilirlik rapor pipeline'ı
│   │   └── esg_prediction/    # XGBoost tahmin, NLP duygu analizörü, Google News RSS
│   ├── output/                # Üretilen resmi TSRS rapor çıktıları
│   └── tests/                 # Kapsamlı birim test paketi (Pytest)
│
├── frontend/                  # React 19 + Vite Web Uygulaması (Web Portalı)
│   ├── src/
│   │   ├── pages/             # Sayfalar (KOBİ Portalı, Banka Portalı, Kamu Ekranları)
│   │   │   ├── kobi/          # Dashboard, Integration, Simulator, TsrsReport
│   │   │   └── bank/          # BankDashboard (Yeşil Kredi Onay / İzleme)
│   │   ├── components/        # Yeniden kullanılabilir UI bileşenleri
│   │   └── App.jsx            # Rota, portal ve oturum yönetimi
│   └── package.json           # Frontend bağımlılıkları
│
├── frontend-mobile/           # React Native / Expo Mobil Uygulaması
├── esg-model/                 # XGBoost model eğitimi, 11K veri seti, Feature Engineering & SHAP
├── docs/                      # Resmi yarışma raporları (ÖDR, Tasarım Raporu), mimari ve kılavuzlar
├── sunum/                     # Yarışma ve yatırımcı sunum materyalleri (TAM-SAM-SOM, pazar analizi)
└── README.md                  # Proje dokümantasyonu
```

---

## ✨ Temel Özellikler

- **🏢 Kurumsal Yeşil Panel (KOBİ & Banka):** KOBİ'ler için entegrasyon ve raporlama; bankalar için yeşil kredi risk değerlendirme paneli.
- **📋 Otomatik TSRS Raporlama:** LangChain ve GPT tabanlı motor ile fatura, SGK ve mizanları analiz ederek Türkiye Sürdürülebilirlik Raporlama Standartlarına (TSRS 1 & TSRS 2) tam uyumlu, SHA-256 imzalı resmi rapor üretimi.
- **📊 g-ROI ve Yeşil Kredi Simülatörü:** GES, elektrikli filo ve enerji verimliliği projeleri için 5 bileşenli (karbon vergisi, enerji tasarrufu, faiz avantajı, karbon kredisi, ESG primi) yatırım getirisi hesabı.
- **🤖 XGBoost & Dinamik ESG Skoru:** Finansal rasyolar ve operasyonel verilerden makine öğrenmesi ile ESG skoru tahmini; güvenilir haberler, kullanıcı yorumları ve doğrulanmış ihbarlarla gerçek zamanlı skor modülasyonu.
- **🔍 Halka Açık Denetim (Public Audit):** Vatandaşların ve paydaşların çevre ihlallerini bildirebildiği ve moderasyon sürecinden geçirildiği şeffaflık paneli.

---

## 🚀 Kurulum ve Çalıştırma

### Sistem Gereksinimleri

- **Node.js** ≥ 18.x ve **npm** ≥ 9.x
- **Python** ≥ 3.10
- *(İsteğe Bağlı)* OpenAI ve Google Gemini API anahtarları. (Anahtarlar tanımlanmadığında sistem otomatik olarak yerel mock/kural tabanlı algoritmalarla çalışır).

---

### 1. Backend Kurulumu ve Başlatılması

```bash
# Backend dizinine gidin
cd backend

# Sanal ortam oluşturun ve aktif edin
python -m venv venv
source venv/bin/activate       # Linux/macOS
# Windows için: venv\Scripts\activate

# Bağımlılıkları yükleyin
pip install -r requirements.txt

# Ortam değişkenlerini yapılandırın (İsteğe bağlı)
cp .env.example .env

# Backend API sunucusunu başlatın
uvicorn api:app --reload --port 8000
```

API `http://localhost:8000` adresinde çalışacaktır. Swagger dokümantasyonuna `http://localhost:8000/docs` adresinden erişebilirsiniz.

---

### 2. Frontend Kurulumu ve Başlatılması

```bash
# Ayrı bir terminalde frontend dizinine gidin
cd frontend

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

Web arayüzü `http://localhost:5173` adresinde açılacaktır.

---

### 3. Birim Testlerinin Çalıştırılması

Projede karbon motoru, yeşil kredi hesabı, XGBoost tahmin hattı, NLP duygu analizörü ve SQLite veritabanı işlemlerini kapsayan birim testleri yer almaktadır:

```bash
cd backend

# Tüm testleri çalıştırma
pytest tests/

# Ayrıntılı test çıktısı alma
pytest tests/ -v
```

---

## 🛠️ Teknoloji Yığını

| Katman | Teknolojiler |
|---|---|
| **Frontend** | React 19, Vite, React Router 7, Framer Motion, Recharts, Lucide Icons |
| **Backend** | FastAPI, Uvicorn, Pydantic, SQLite, Python-Multipart |
| **Yapay Zeka & ML** | LangChain (OpenAI & Google GenAI), XGBoost, Scikit-Learn, Pandas, NumPy |
| **Mobil** | React Native, Expo SDK |
| **Test** | Pytest |

---

## 📄 Ortam Değişkenleri (`backend/.env`)

| Değişken | Zorunlu mu? | Açıklama |
|---|---|---|
| `OPENAI_API_KEY` | İsteğe Bağlı | TSRS rapor üretimi ve gelişmiş NLP analizleri için kullanılır. Tanımlı değilse mock moduna geçer. |
| `GEMINI_API_KEY` | İsteğe Bağlı | Karbon aktivite çıkarımı ve g-ROI kod üretim zinciri için kullanılır. Tanımlı değilse yerel regex/kural motoruna geçer. |

---

## 🤝 Katkıda Bulunma

1. Depoyu fork edin
2. Özellik dalı oluşturun (`git checkout -b feature/harika-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: harika özellik eklendi'`)
4. Dalınıza push edin (`git push origin feature/harika-ozellik`)
5. Pull Request açın

---

## 📝 Lisans ve Notlar

Bu proje sürdürülebilir finans ve yapay zeka denetimi amacıyla geliştirilmiştir.
