import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ShieldCheck, TrendingDown, Zap, FileOutput, Leaf, Activity, RefreshCw, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const COLORS = ['var(--accent-emerald)', 'var(--accent-gold)', 'var(--primary-midnight)'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/dashboard/summary`);
      if (!res.ok) throw new Error('Dashboard verisi alınamadı.');
      const data = await res.json();
      setSummary(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Dashboard verisi yokken veya yüklenirken gösterilecek varsayılan değerler
  const totalDocs = summary?.total_verified_documents ?? 0;
  const declarationOk = summary?.declaration_submitted ?? false;
  const reportReady = summary?.report_generated ?? false;
  const reportHash = summary?.report_hash ?? '';

  // Basit metrikler (henüz backend'den gelen gerçek hesaplama yoksa placeholder)
  const esgScore = reportReady ? '--' : '--';
  const totalEmission = reportReady ? '--' : '--';

  // Grafik verileri — backend rapor ürettikten sonra dinamik doldurulabilir
  // Şimdilik boş verilerle başla
  const areaData = summary?.quarterly_data || [];
  const pieData = summary?.emission_breakdown || [];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex-col gap-6"
    >
      <motion.div variants={itemVariants} className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Yönetici Özeti</h1>
          <p className="page-subtitle">Şirketinizin güncel yeşil finansal ve yasal uyum durumu (TSRS Standartları)</p>
        </div>
        <div className="flex gap-4">
          <button className="btn-outline" onClick={fetchSummary} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Yenile
          </button>
          <button className="btn-primary">
            <FileOutput size={16} /> Yeşil Pasaport Oluştur
          </button>
        </div>
      </motion.div>

      {/* Hata Mesajı */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ 
            padding: '16px 20px', borderRadius: '12px', 
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#EF4444', display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '14px', fontWeight: 600, marginBottom: '8px'
          }}
        >
          <AlertCircle size={18} /> {error}
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Backend bağlantısını kontrol edin (localhost:8000)
          </span>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        
        {/* Card 1 — Yüklenen Belge Sayısı */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="glass-panel card flex-col justify-between" style={{ minHeight: '160px' }}>
          <div className="flex justify-between items-start">
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>YÜKLENEN BELGELER</div>
              <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--primary-midnight)', marginTop: '8px', letterSpacing: '-1px' }}>
                {totalDocs} <span style={{ fontSize: '16px', color: 'var(--accent-emerald)', fontWeight: 700 }}>/ 12</span>
              </div>
            </div>
            <div className="icon-3d" style={{ background: 'linear-gradient(135deg, #10B981, #047857)' }}>
              <Leaf color="white" size={28} />
            </div>
          </div>
          <div style={{ fontSize: '13px', color: totalDocs >= 6 ? 'var(--accent-emerald)' : 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={14} /> {totalDocs >= 6 ? 'Yeterli belge yüklendi' : 'Daha fazla belge yükleyin'}
          </div>
        </motion.div>
        
        {/* Card 2 — Yönetici Beyanı */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="glass-panel card flex-col justify-between" style={{ minHeight: '160px' }}>
          <div className="flex justify-between items-start">
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>YÖNETİCİ BEYANI</div>
              <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--primary-midnight)', marginTop: '8px', letterSpacing: '-1px' }}>
                {declarationOk ? '✓' : '✗'}
              </div>
            </div>
            <div className="icon-3d" style={{ background: declarationOk ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)' : 'linear-gradient(135deg, #94a3b8, #64748b)' }}>
              <ShieldCheck color="white" size={28} />
            </div>
          </div>
          <div style={{ fontSize: '13px', color: declarationOk ? 'var(--accent-emerald)' : 'var(--text-muted)', fontWeight: 500 }}>
            {declarationOk ? 'Anket gönderildi' : 'Henüz doldurulmadı'}
          </div>
        </motion.div>

        {/* Card 3 — Rapor Durumu */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="glass-panel card flex-col justify-between" style={{ minHeight: '160px' }}>
          <div className="flex justify-between items-start">
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>TSRS RAPORU</div>
              <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--primary-midnight)', marginTop: '8px', letterSpacing: '-1px' }}>
                {reportReady ? '✓' : '—'}
              </div>
            </div>
            <div className="icon-3d" style={{ background: reportReady ? 'linear-gradient(135deg, #F59E0B, #B45309)' : 'linear-gradient(135deg, #94a3b8, #64748b)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
            {reportReady ? 'Rapor üretildi' : 'Henüz üretilmedi'}
          </div>
        </motion.div>

        {/* Card 4 — Rapor Hash */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="glass-panel card flex-col justify-between" style={{ minHeight: '160px' }}>
          <div className="flex justify-between items-start">
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>DİJİTAL İMZA</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-emerald-dark)', marginTop: '8px', letterSpacing: '-0.5px', wordBreak: 'break-all' }}>
                {reportHash ? `${reportHash.slice(0, 10)}...` : '—'}
              </div>
            </div>
            <div className="icon-3d" style={{ background: 'linear-gradient(135deg, #FCE883, #D4AF37)' }}>
              <TrendingDown color="white" size={28} />
            </div>
          </div>
          <div style={{ fontSize: '13px', color: reportHash ? 'var(--accent-gold)' : 'var(--text-muted)', fontWeight: 600 }}>
            {reportHash ? 'SHA-256 Doğrulanabilir' : 'Hash üretilmedi'}
          </div>
        </motion.div>

      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <motion.div variants={itemVariants} className="glass-panel card" style={{ height: '420px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--accent-emerald), transparent)' }}></div>
          <div className="flex justify-between items-center mb-6">
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-midnight)' }}>Dönemsel Emisyon Trendi</h3>
          </div>
          
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={areaData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEmisyonPremium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-emerald)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-emerald)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 13, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 13, fontWeight: 500}} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 600, padding: '12px 16px' }}
                  itemStyle={{ color: 'var(--primary-midnight)' }}
                />
                <Area 
                  type="monotone" dataKey="emisyon" stroke="var(--accent-emerald)" strokeWidth={4} 
                  fillOpacity={1} fill="url(#colorEmisyonPremium)"
                  activeDot={{ r: 8, strokeWidth: 0, fill: 'var(--accent-emerald)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '85%', flexDirection: 'column', gap: '12px' }}>
              <Leaf size={40} color="var(--text-light)" style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Rapor üretildikten sonra emisyon verileri burada görüntülenecek.</p>
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel card" style={{ height: '420px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--accent-gold), transparent)' }}></div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-midnight)', marginBottom: '16px' }}>Emisyon Kaynak Dağılımı</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Tesis, operasyon ve tedarik zincirinden kaynaklı toplam emisyon oranları.</p>
          
          {pieData.length > 0 ? (
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 600 }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: '12px' }}>
              <Activity size={40} color="var(--text-light)" style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'center' }}>Veriler yüklendikten sonra burada görüntülenecek.</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
