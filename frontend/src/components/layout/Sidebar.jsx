import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Database, 
  Activity, 
  FileText,
  Building2,
  Settings,
  ShieldCheck,
  Lock
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Sidebar = ({ activePortal, currentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isPredefinedCompany = currentUser?.companyTicker === 'TOASO' || currentUser?.companyTicker === 'ASELS';
  const [isVerified, setIsVerified] = useState(isPredefinedCompany);

  useEffect(() => {
    if (isPredefinedCompany) {
      setIsVerified(true);
      return;
    }

    const checkStatus = async () => {
      try {
        const ticker = currentUser?.companyTicker;
        const url = ticker ? `${API_URL}/api/dashboard/summary?ticker=${encodeURIComponent(ticker)}` : `${API_URL}/api/dashboard/summary`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const hasData = (data.total_verified_documents > 0) || data.declaration_submitted || data.report_generated;
          setIsVerified(Boolean(hasData));
        }
      } catch (e) {
        console.error("Sidebar verification check error:", e);
      }
    };

    checkStatus();
  }, [currentUser?.companyTicker, isPredefinedCompany]);

  const kobiLinks = [
    { name: 'Ana Sayfa', path: '/dashboard', icon: <LayoutDashboard size={20} />, locked: false },
    { name: 'Veri Entegrasyonu', path: '/integration', icon: <Database size={20} />, locked: false },
    { 
      name: 'g-ROI Simülatörü', 
      path: '/simulator', 
      icon: <Activity size={20} />, 
      locked: !isVerified,
      lockMessage: 'g-ROI simülatörünü kullanabilmek için lütfen önce belgelerinizi ve yönetici beyanınızı yükleyin.'
    },
    { 
      name: 'TSRS Raporlama', 
      path: '/tsrs-report', 
      icon: <FileText size={20} />, 
      locked: !isVerified,
      lockMessage: 'TSRS Raporu üretebilmek için lütfen önce belgelerinizi ve yönetici beyanınızı yükleyin.'
    },
  ];

  const bankLinks = [
    { name: 'Kredi Tahsis', path: '/bank/dashboard', icon: <Building2 size={20} />, locked: false },
  ];

  const links = activePortal === 'kobi' ? kobiLinks : bankLinks;

  const handleLinkClick = (e, link) => {
    if (link.locked) {
      e.preventDefault();
      navigate('/integration', { 
        state: { 
          redirectReason: 'unverified', 
          lockedFeature: link.name,
          message: link.lockMessage 
        } 
      });
    }
  };

  return (
    <div style={{
      width: '280px',
      background: 'linear-gradient(180deg, var(--primary-midnight) 0%, #0F172A 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px 0',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Blur */}
      <div style={{
        position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px',
        background: 'rgba(16, 185, 129, 0.15)', filter: 'blur(50px)', borderRadius: '50%'
      }}></div>

      <div style={{ padding: '0 24px', marginBottom: '24px', position: 'relative' }}>
        <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.75px', textTransform: 'uppercase' }}>
          {activePortal === 'kobi' ? 'KOBİ Portali' : 'Banka Portali'}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 16px', position: 'relative' }}>
        {links.map((link, i) => {
          const isActive = location.pathname === link.path;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={(e) => handleLinkClick(e, link)}
              style={{ textDecoration: 'none' }}
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                whileHover={{ x: 4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  position: 'relative',
                  color: isActive ? 'white' : (link.locked ? '#64748B' : '#94A3B8'),
                  fontWeight: isActive ? 600 : 500,
                  transition: 'color 0.2s',
                  background: isActive ? 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)' : 'transparent',
                  border: isActive ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
                  cursor: link.locked ? 'pointer' : 'pointer'
                }}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    style={{
                      position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '4px',
                      background: 'var(--accent-emerald)', borderRadius: '0 4px 4px 0',
                      boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)'
                    }}
                  />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ 
                    color: isActive ? 'var(--accent-emerald)' : (link.locked ? '#64748B' : 'inherit'),
                    filter: isActive ? 'drop-shadow(0 0 8px rgba(16,185,129,0.4))' : 'none',
                    transition: 'all 0.3s'
                  }}>
                    {link.icon}
                  </div>
                  <span>{link.name}</span>
                </div>

                {link.locked && (
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    fontSize: '10.5px', 
                    fontWeight: 700, 
                    color: '#F59E0B', 
                    background: 'rgba(245, 158, 11, 0.12)', 
                    padding: '3px 8px', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(245, 158, 11, 0.25)' 
                  }}>
                    <Lock size={11} /> Kilitli
                  </span>
                )}
              </motion.div>
            </NavLink>
          );
        })}
      </div>

      <div style={{ padding: '0 16px', marginTop: 'auto' }}>
        <motion.div 
          whileHover={{ x: 4 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 20px',
            borderRadius: '12px',
            color: '#94A3B8',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          <Settings size={20} />
          <span>Ayarlar</span>
        </motion.div>
      </div>
    </div>
  );
};

export default Sidebar;
