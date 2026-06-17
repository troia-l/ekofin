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

// KOBİ Pages
import Dashboard from './pages/kobi/Dashboard';
import Integration from './pages/kobi/Integration';
import Simulator from './pages/kobi/Simulator';
import TsrsReport from './pages/kobi/TsrsReport';

// Bank Pages
import BankDashboard from './pages/bank/BankDashboard';

// Public Layout Wrapper
const PublicLayout = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: 'var(--text-main)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Header />
      <Outlet />
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
const PortalLayout = ({ activePortal, setActivePortal }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Sync activePortal state based on URL path
  useEffect(() => {
    if (pathname.startsWith('/bank')) {
      if (activePortal !== 'bank') setActivePortal('bank');
    } else {
      if (activePortal !== 'kobi') setActivePortal('kobi');
    }
  }, [pathname, activePortal, setActivePortal]);

  const handlePortalChange = (portal) => {
    setActivePortal(portal);
    if (portal === 'kobi') {
      navigate('/dashboard');
    } else {
      navigate('/bank/dashboard');
    }
  };

  return (
    <MainLayout activePortal={activePortal} setActivePortal={handlePortalChange}>
      <Outlet />
    </MainLayout>
  );
};

function App() {
  const [activePortal, setActivePortal] = useState('kobi'); // 'kobi' or 'bank'

  return (
    <Router>
      <Routes>
        {/* Public Website Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Corporate />} />
          <Route path="/corporate" element={<Corporate />} />
          <Route path="/credits" element={<Home />} />
          <Route path="/crowdfunding" element={<Crowdfunding />} />
          <Route path="/esg-report" element={<ESGReport />} />
          <Route path="/apply" element={<ApplicationForm />} />
          <Route path="/public-audit" element={<PublicAudit />} />
        </Route>

        {/* Portal Routes */}
        <Route element={<PortalLayout activePortal={activePortal} setActivePortal={setActivePortal} />}>
          {/* KOBİ Portal Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/integration" element={<Integration />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/tsrs-report" element={<TsrsReport />} />

          {/* Bank Portal Routes */}
          <Route path="/bank/dashboard" element={<BankDashboard />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
