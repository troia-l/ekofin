# 🌱 EkoFin Frontend — AI-Powered Green Energy Finance UI

The frontend application for the EkoFin platform, built with **React 19** and **Vite 7**. It provides a modern, responsive interface for green energy financing, ESG reporting, and sustainability management.

## ✨ Features

- **🏢 Corporate Dashboard** — B2B-ready panel for banks and holdings with ESG insights
- **💰 AI-Powered Credit Marketplace** — Low-interest green credit opportunities optimized by ESG scores
- **🤝 Crowdfunding Module** — Modern investment interface for solar and wind energy projects
- **🔍 AI ESG Report (Greenwashing Shield)** — Real-time company analysis with NLP-powered trust scoring
- **📊 Green ROI Simulator** — Interactive calculator for green energy investment returns
- **📋 TSRS Report Generator** — Turkish Sustainability Reporting Standards compliant reporting
- **🏦 Bank Dashboard** — Dedicated view for financial institution operators
- **📝 Application Form** — Streamlined green credit application flow

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 7** | Build tool & dev server |
| **React Router 7** | Client-side routing (HashRouter) |
| **Framer Motion** | Animations & transitions |
| **Recharts** | Data visualization & charts |
| **Lucide React** | Icon library |
| **Vanilla CSS** | Styling with CSS Variables, Flexbox & Grid |

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### Installation

```bash
# 1. Navigate to the frontend directory (from project root)
cd frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot module replacement |
| `npm run build` | Create optimized production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check code quality |

## 📁 Project Structure

```
frontend/
├── public/                     # Static assets served as-is
│   ├── ecofin_logo.png         # Platform logo
│   └── vite.svg                # Vite default icon
│
├── src/
│   ├── assets/                 # Bundled static assets
│   │   └── react.svg
│   │
│   ├── components/             # Reusable UI components
│   │   ├── layout/
│   │   │   ├── MainLayout.jsx      # App shell with sidebar + topnav
│   │   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   │   └── Topnav.jsx          # Top navigation bar
│   │   ├── ConditionsModal.jsx     # Credit conditions popup
│   │   ├── CreditItem.jsx         # Credit listing card
│   │   ├── EsgBadge.jsx           # ESG score badge
│   │   ├── Header.jsx             # Page header
│   │   ├── HeroSection.jsx        # Landing hero section
│   │   ├── HighlightCard.jsx      # Feature highlight card
│   │   ├── Icons.jsx              # Custom icon components
│   │   └── ProjectDetailsModal.jsx # Project detail popup
│   │
│   ├── pages/                  # Page-level components
│   │   ├── bank/
│   │   │   └── BankDashboard.jsx   # Bank operator dashboard
│   │   ├── kobi/                   # SME (KOBİ) pages
│   │   │   ├── Dashboard.jsx       # SME main dashboard
│   │   │   ├── GreenROI.jsx        # ROI analysis page
│   │   │   ├── Integration.jsx     # System integration page
│   │   │   ├── Simulator.jsx       # Investment simulator
│   │   │   └── TsrsReport.jsx      # TSRS report generator
│   │   ├── ApplicationForm.jsx     # Credit application form
│   │   ├── Corporate.jsx           # Corporate overview
│   │   ├── Crowdfunding.jsx        # Crowdfunding marketplace
│   │   ├── ESGReport.jsx           # ESG analysis report
│   │   ├── Home.jsx                # Landing page
│   │   └── PublicAudit.jsx         # Public transparency audit
│   │
│   ├── App.jsx                 # Root component with routing
│   ├── App.css                 # App-level styles
│   ├── index.css               # Global styles & CSS variables
│   └── main.jsx                # Application entry point
│
├── index.html                  # HTML entry point
├── vite.config.js              # Vite configuration
├── eslint.config.js            # ESLint configuration
├── package.json                # Dependencies & scripts
└── package-lock.json           # Dependency lock file
```

## 🔗 Backend Connection

This frontend connects to the **Model C** backend API (FastAPI). By default, the API is expected at `http://localhost:8000`. See the [root README](../README.md) for backend setup instructions.

## 🌐 Deployment

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) for automated deployment to GitHub Pages.

---

*Built with ♻️ for a greener future.*
