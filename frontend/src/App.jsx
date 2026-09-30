import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';

// Public Pages
import Header from './components/Header';
import Corporate from './pages/Corporate';
import Home from './pages/Home';
import Crowdfunding from './pages/Crowdfunding';
import ESGReport from './pages/ESGReport';
import ApplicationForm from './pages/ApplicationForm';
import PublicAudit from './pages/PublicAudit';
import Login from './pages/Login';
import JuryHome from './pages/JuryHome';
import { getGreenTextileDemoState, isGreenTextileUser } from './demo/greenTextileDemo';

// KOBİ Pages
import Dashboard from './pages/kobi/Dashboard';
import Integration from './pages/kobi/Integration';
import Simulator from './pages/kobi/Simulator';
import TsrsReport from './pages/kobi/TsrsReport';

// Bank Pages
import BankDashboard from './pages/bank/BankDashboard';
import ApplicationDetail from './pages/bank/ApplicationDetail';

// Public Layout Wrapper
const PublicLayout = ({ currentUser, setCurrentUser }) => {
  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: 'var(--text-main)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Header currentUser={currentUser} setCurrentUser={setCurrentUser} />
      <Outlet context={{ currentUser, setCurrentUser }} />
      {/* Global Footer (Simplified) */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '40px 0', marginTop: '60px', background: '#F8FAFC' }}>
        <div className="container" style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          <p>© 2026 EcoFin Financial Technologies. All rights reserved.</p>
          <p style={{ marginTop: '8px' }}>Yapay Zeka Destekli ESG Analizi ve Şeffaf Finansman Platformu</p>
        </div>
      </footer>
    </div>
  );
};

// Portal Layout Wrapper
const PortalLayout = ({ activePortal, setActivePortal, currentUser, setCurrentUser }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Sync activePortal state based on URL path
    if (pathname.startsWith('/bank')) {
      if (activePortal !== 'bank') setActivePortal('bank');
    } else {
      if (activePortal !== 'kobi') setActivePortal('kobi');
    }
  }, [pathname, activePortal, setActivePortal, currentUser, navigate]);

  if (!currentUser) return null;

  const handlePortalChange = (portal) => {
    setActivePortal(portal);
    if (portal === 'kobi') {
      navigate('/dashboard');
    } else {
      navigate('/bank/dashboard');
    }
  };

  return (
    <MainLayout activePortal={activePortal} setActivePortal={handlePortalChange} currentUser={currentUser} setCurrentUser={setCurrentUser}>
      <Outlet context={{ currentUser, setCurrentUser }} />
    </MainLayout>
  );
};

// Route Guard for KOBİ features requiring verified data
const DataVerifiedRoute = ({ currentUser, children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    if (isGreenTextileUser(currentUser) && getGreenTextileDemoState().loaded) {
      setCanAccess(true);
      setLoading(false);
      return;
    }

    const isPredefined = currentUser?.companyTicker === 'TOASO' || currentUser?.companyTicker === 'ASELS';
    if (isPredefined) {
      setCanAccess(true);
      setLoading(false);
      return;
    }

    const check = async () => {
      try {
        const ticker = currentUser?.companyTicker;
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const url = ticker ? `${API_URL}/api/dashboard/summary?ticker=${encodeURIComponent(ticker)}` : `${API_URL}/api/dashboard/summary`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const hasData = (data.total_verified_documents > 0) || data.declaration_submitted || data.report_generated;
          if (!hasData) {
            navigate('/integration', { replace: true, state: { redirectReason: 'unverified' } });
            return;
          }
          setCanAccess(true);
        } else {
          setCanAccess(true);
        }
      } catch (e) {
        console.error("Data verification route check error:", e);
        setCanAccess(true);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '28px', height: '28px', border: '3px solid #E2E8F0', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '14px', fontWeight: 600 }}>Şirket veri ve doğrulama durumu kontrol ediliyor...</span>
      </div>
    );
  }

  return canAccess ? children : null;
};

function App() {
  const [activePortal, setActivePortal] = useState('kobi'); // 'kobi' or 'bank'
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  return (
    <Router>
      <Routes>
        {/* Public Website Routes */}
        <Route element={<PublicLayout currentUser={currentUser} setCurrentUser={setCurrentUser} />}>
          <Route path="/" element={<JuryHome />} />
          <Route path="/corporate" element={<Corporate />} />
          <Route path="/credits" element={<Home />} />
          <Route path="/crowdfunding" element={<Crowdfunding />} />
          <Route path="/esg-report" element={<ESGReport />} />
          <Route path="/apply" element={<ApplicationForm />} />
          <Route path="/public-audit" element={<PublicAudit />} />
        </Route>

        <Route path="/login" element={<Login setCurrentUser={setCurrentUser} />} />

        {/* Portal Routes */}
        <Route element={<PortalLayout activePortal={activePortal} setActivePortal={setActivePortal} currentUser={currentUser} setCurrentUser={setCurrentUser} />}>
          {/* KOBİ Portal Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/integration" element={<Integration />} />
          <Route 
            path="/simulator" 
            element={
              <DataVerifiedRoute currentUser={currentUser}>
                <Simulator />
              </DataVerifiedRoute>
            } 
          />
          <Route 
            path="/tsrs-report" 
            element={
              <DataVerifiedRoute currentUser={currentUser}>
                <TsrsReport />
              </DataVerifiedRoute>
            } 
          />

          {/* Bank Portal Routes */}
          <Route path="/bank/dashboard" element={<BankDashboard />} />
          <Route path="/bank/applications/:id" element={<ApplicationDetail />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
