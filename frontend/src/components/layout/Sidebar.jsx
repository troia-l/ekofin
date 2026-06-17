import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Database, 
  Activity, 
  FileText,
  Building2,
  Settings,
  ShieldCheck
} from 'lucide-react';

const Sidebar = ({ activePortal }) => {
  const location = useLocation();

  const kobiLinks = [
    { name: 'Yönetici Özeti', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Veri Entegrasyonu', path: '/integration', icon: <Database size={20} /> },
    { name: 'g-ROI Simülatörü', path: '/simulator', icon: <Activity size={20} /> },
    { name: 'TSRS Raporlama', path: '/tsrs-report', icon: <FileText size={20} /> },
  ];

  const bankLinks = [
    { name: 'Kredi Tahsis', path: '/bank/dashboard', icon: <Building2 size={20} /> },
  ];

  const links = activePortal === 'kobi' ? kobiLinks : bankLinks;

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

      <div style={{ padding: '0 24px', marginBottom: '48px', position: 'relative' }}>
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ fontSize: '28px', fontWeight: 800, color: 'white', letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px', 
            background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-emerald-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.4)'
          }}>
            <ShieldCheck size={18} color="white" />
          </div>
          EkoFin <span style={{ color: 'var(--accent-emerald)', fontWeight: 300 }}>V2</span>
        </motion.h2>
        <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '8px', paddingLeft: '40px', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
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
                  gap: '14px',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  position: 'relative',
                  color: isActive ? 'white' : '#94A3B8',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'color 0.2s',
                  background: isActive ? 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)' : 'transparent',
                  border: isActive ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent'
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
                <div style={{ 
                  color: isActive ? 'var(--accent-emerald)' : 'inherit',
                  filter: isActive ? 'drop-shadow(0 0 8px rgba(16,185,129,0.4))' : 'none',
                  transition: 'all 0.3s'
                }}>
                  {link.icon}
                </div>
                {link.name}
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
