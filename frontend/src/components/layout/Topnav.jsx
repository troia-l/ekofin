import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, User, RefreshCw, Zap, LogOut } from 'lucide-react';

const Topnav = ({ activePortal, setActivePortal, currentUser, setCurrentUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    navigate('/');
  };

  const displayName = currentUser ? currentUser.userName : (activePortal === 'kobi' ? 'Ahmet Yılmaz' : 'Selin Demir');
  const displayTitle = currentUser ? `${currentUser.userTitle} - ${currentUser.companyTicker}` : (activePortal === 'kobi' ? 'KOBİ CFO' : 'Kredi Uzmanı');
  const displayCompany = currentUser ? currentUser.companyName : '';

  return (
    <div className="portal-topnav" style={{
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
      {/* SOL: EcoFin Logosu + Sağında Şirket İsmi */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} 
          onClick={() => navigate(currentUser?.role === 'bank' ? '/bank/dashboard' : '/dashboard')}
        >
          <img src="/ecofin_logo.png" alt="EcoFin" style={{ height: '32px', width: 'auto' }} />
          <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span style={{ color: 'var(--primary-midnight)' }}>Eco</span><span style={{ color: '#FF7F00' }}>Fin</span>
          </span>
        </div>

        {displayCompany && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '1px', height: '22px', background: 'var(--border-color)' }}></div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-midnight)', letterSpacing: '-0.2px' }}>
              {displayCompany}
            </span>
          </div>
        )}
      </div>

      {/* SAĞ: ERP Durumu, Kullanıcı Profili, Bildirim İkonu (Çıkışın Solunda), Çıkış Butonu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald-dark)', fontSize: '13px', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '6px 12px', borderRadius: '20px' }}
        >
          <Zap size={14} color="var(--accent-emerald)" fill="var(--accent-emerald)" />
          ERP: Aktif
        </motion.div>
        
        <div style={{ width: '1px', height: '32px', background: 'var(--border-color)', margin: '0 4px' }}></div>

        {/* Kullanıcı Profili */}
        <motion.div 
          whileHover={{ y: -2 }}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '6px 16px 6px 6px', borderRadius: '30px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #FCE883, #D4AF37)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), 0 2px 4px rgba(212,175,55,0.3)' }}>
            <User size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-midnight)' }}>
              {displayName}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {displayTitle}
            </span>
          </div>
        </motion.div>

        {/* Bildirim İkonu: Çıkış Butonunun Hemen Solunda */}
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          style={{ 
            background: 'white', 
            border: '1px solid var(--border-color)', 
            borderRadius: '50%', 
            width: '40px', 
            height: '40px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'var(--text-main)', 
            position: 'relative', 
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
            cursor: 'pointer'
          }}
          title="Bildirimler"
        >
          <Bell size={18} />
          <span style={{ position: 'absolute', top: '0', right: '0', width: '10px', height: '10px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid white' }}></span>
        </motion.button>

        {/* Çıkış Butonu */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLogout}
          style={{ 
            background: 'white', 
            border: '1px solid var(--border-color)', 
            borderRadius: '50%', 
            width: '40px', 
            height: '40px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'var(--danger)',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
          }}
          title="Çıkış Yap"
        >
          <LogOut size={18} />
        </motion.button>
      </div>
    </div>
  );
};

export default Topnav;
