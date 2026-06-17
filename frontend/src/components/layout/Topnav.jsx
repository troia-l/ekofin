import React from 'react';
import { motion } from 'framer-motion';
import { Bell, User, RefreshCw, Zap } from 'lucide-react';

const Topnav = ({ activePortal, setActivePortal }) => {
  return (
    <div style={{
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      background: 'rgba(243, 246, 248, 0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ 
          display: 'flex', 
          background: 'rgba(0,0,0,0.04)', 
          borderRadius: '12px', 
          padding: '6px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' 
        }}>
          {['kobi', 'bank'].map((portal) => (
            <motion.button
              key={portal}
              onClick={() => setActivePortal(portal)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                position: 'relative',
                padding: '8px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: activePortal === portal ? 'var(--primary-midnight)' : 'var(--text-muted)',
                fontWeight: activePortal === portal ? 700 : 500,
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {activePortal === portal && (
                <motion.div
                  layoutId="portal-indicator"
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)',
                    zIndex: -1
                  }}
                />
              )}
              {portal === 'kobi' ? 'KOBİ' : 'Banka'}
            </motion.button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald-dark)', fontSize: '13px', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '6px 12px', borderRadius: '20px' }}
        >
          <Zap size={14} color="var(--accent-emerald)" fill="var(--accent-emerald)" />
          ERP: Aktif
        </motion.div>
        
        <div style={{ width: '1px', height: '32px', background: 'var(--border-color)' }}></div>
        
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', position: 'relative', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}
        >
          <Bell size={18} />
          <span style={{ position: 'absolute', top: '0', right: '0', width: '10px', height: '10px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid white' }}></span>
        </motion.button>

        <motion.div 
          whileHover={{ y: -2 }}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: 'white', padding: '6px 16px 6px 6px', borderRadius: '30px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #FCE883, #D4AF37)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), 0 2px 4px rgba(212,175,55,0.3)' }}>
            <User size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-midnight)' }}>
              {activePortal === 'kobi' ? 'Ahmet Yılmaz' : 'Selin Demir'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {activePortal === 'kobi' ? 'KOBİ CFO' : 'Kredi Uzmanı'}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Topnav;
