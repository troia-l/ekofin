# 🌱 EkoFin — AI-Powered Green Energy Finance Platform

EkoFin is an **AI-powered sustainability auditing and green financing platform** built to accelerate the transition to carbon neutrality. It provides transparent, data-driven investment decisions by leveraging satellite data, IoT sensors, and cross-referenced data sources to verify the **real environmental impact** of projects — eliminating greenwashing.

## 🏗️ Project Structure

```
ekofin/
├── frontend/          # React + Vite web application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page-level components (Home, Dashboard, ESG Report, etc.)
│   │   └── assets/        # Static assets
│   ├── public/            # Public assets & documents
│   ├── package.json       # Node.js dependencies
│   └── vite.config.js     # Vite configuration
│
├── model_c/           # FastAPI backend — AI analysis engine
│   ├── app.py             # API entry point
│   ├── model.py           # Data models (Pydantic)
│   ├── calculator.py      # Green ROI calculator
│   ├── roi.py             # ROI analysis engine
│   ├── factors.json       # Emission factors data
│   ├── requirements.txt   # Python dependencies
│   └── .env.example       # Environment variable template
│
├── BelgeTarama/       # Document scanning instruction sets (OCR guides)
├── TSRS_Rapor/        # TSRS-compliant sustainability report templates & data
├── kaynaklar/         # Reference materials and resources
└── .gitignore
```

## ✨ Key Features

- **🏢 Corporate Green Dashboard** — B2B-ready dashboard for banks and holdings
- **🤖 AI-Powered ESG Analysis** — Gemini AI integration for real sustainability verification
- **📊 Green ROI Simulator** — Calculate return on investment for green energy projects
- **📋 TSRS Reporting** — Generate Turkish Sustainability Reporting Standards compliant reports
- **🌍 Crowdfunding Module** — Enable individual investors to participate in green transformation
- **🔍 Public Audit Panel** — Transparency-first approach to environmental claims
- **📄 Document Scanning** — OCR-based document verification (energy certificates, invoices, etc.)

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x and **npm** ≥ 9.x
- **Python** ≥ 3.10
- **Gemini API Key** (optional — system falls back to mock matching algorithm for testing)

---

### Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

#### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint checks |

---

### Backend Setup (Model C — AI Engine)

```bash
# Navigate to the backend directory
cd model_c

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY (optional)

# Start the API server
uvicorn app:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

> **Note:** If `GEMINI_API_KEY` is left empty, the system will use an autonomous mock matching algorithm (regex-based) so you can test without an API key.

---

### Full Stack (Running Both)

Open two terminal windows:

```bash
# Terminal 1 — Backend
cd model_c
source venv/bin/activate
uvicorn app:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 7, React Router 7, Framer Motion, Recharts, Lucide Icons |
| **Backend** | FastAPI, Uvicorn, Pydantic, Pandas |
| **AI/ML** | Google Gemini API (gemini-2.5-flash), Instructor, OpenAI SDK |
| **Data** | JSON-based emission factors, TSRS templates |

## 📄 Environment Variables

### Backend (`model_c/.env`)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Optional | Google Gemini API key for AI-powered analysis. If omitted, the system uses a mock algorithm. |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is developed for academic and demonstration purposes.
