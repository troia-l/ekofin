import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ShieldCheck, TrendingDown, Zap, FileOutput, Leaf, Activity, RefreshCw, AlertCircle, Sparkles, HelpCircle, Award, Landmark, ArrowRight, Check } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#6366F1'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Dashboard = () => {
  const { currentUser } = useOutletContext();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const ticker = currentUser?.companyTicker;
      const url = ticker ? `${API_URL}/api/dashboard/summary?ticker=${encodeURIComponent(ticker)}` : `${API_URL}/api/dashboard/summary`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Dashboard verisi alınamadı.');
      const data = await res.json();
      setSummary(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${API_URL}/api/esg/companies`);
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (e) {
      console.error("Şirket verileri çekilemedi:", e);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchCompanies();
  }, [currentUser?.companyTicker]);

  // Find the BIST company profile matching the logged-in user
  const myCompany = companies.find(c => c.ticker === currentUser?.companyTicker);

  // Sync metrics depending on if logged in as general KOBI or a premium BIST company
  const companyName = currentUser ? currentUser.companyName : 'KOBİ Sürdürülebilirlik Paneli';
  const userTitle = currentUser ? `${currentUser.userTitle} (${currentUser.userName})` : 'KOBİ CFO';
  
  const totalDocs = myCompany ? 11 : (summary?.total_verified_documents ?? 0);
  const declarationOk = myCompany ? true : (summary?.declaration_submitted ?? false);
  const reportReady = myCompany ? true : (summary?.report_generated ?? false);
  const reportHash = myCompany 
    ? "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" 
    : (summary?.report_hash ?? '');
  
  const esgScore = myCompany ? myCompany.score : 6.4;
  const riskLevel = myCompany ? myCompany.riskLevel : 'Orta';

  // Customize charts based on company profile
  const areaData = myCompany && myCompany.scoreHistory && myCompany.scoreHistory.length > 0
    ? myCompany.scoreHistory.map(h => ({ name: h.date, score: h.score }))
    : [
        { name: 'Oca 2026', score: 5.8 },
        { name: 'Şub 2026', score: 6.0 },
        { name: 'Mar 2026', score: 6.2 },
        { name: 'Nis 2026', score: 6.4 },
      ];

  const pieData = myCompany && myCompany.ticker === 'TOASO'
    ? [
        { name: 'Kapsam 1 (Tesis Enerji)', value: 45 },
        { name: 'Kapsam 2 (Lojistik & Araçlar)', value: 35 },
        { name: 'Kapsam 3 (Tedarik Zinciri)', value: 20 },
      ]
    : myCompany && myCompany.ticker === 'ASELS'
    ? [
        { name: 'Kapsam 1 (Üretim Enerjisi)', value: 30 },
        { name: 'Kapsam 2 (Hizmet Binaları)', value: 25 },
        { name: 'Kapsam 3 (Donanım Hammadde)', value: 45 },
      ]
    : [
        { name: 'Doğal Gaz & Isınma', value: 40 },
        { name: 'Elektrik Tüketimi', value: 35 },
        { name: 'Nakliye & Lojistik', value: 25 },
      ];

  const verifiedPoints = myCompany?.verifiedPoints || [
    "Enerji verimliliği raporlama uyumu",
    "Çevresel beyanlar doğrulanmıştır",
    "ISO 14001 Çevre Yönetim belgesi"
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex-col gap-6"
    >
      {/* Upper Navigation Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald-dark)', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
            <Award size={14} /> Sürdürülebilirlik Yönetim Paneli
          </div>
          <h1 className="page-title">{companyName}</h1>
          <p className="page-subtitle">Şirketinizin güncel ESG skoru, emisyon verileri ve TSRS uyum durumu.</p>
        </div>
        <div className="flex gap-4">
          <button className="btn-outline" onClick={fetchSummary} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Yenile
          </button>
          <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #10B981, #047857)' }}>
            <FileOutput size={16} /> TSRS Raporu İndir
          </button>
        </div>
      </motion.div>

      {/* Backend Connection Check */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ 
            padding: '16px 20px', borderRadius: '12px', 
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#EF4444', display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '14px', fontWeight: 600, marginBottom: '24px'
          }}
        >
          <AlertCircle size={18} /> {error}
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Sunucu bağlantısı kurulamadı (localhost:8000). Varsayılan profil verileri gösteriliyor.
          </span>
        </motion.div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Card 1 — ESG Score */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="glass-panel card flex-col justify-between" style={{ minHeight: '160px', borderLeft: '4px solid var(--accent-emerald)' }}>
          <div className="flex justify-between items-start">
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>GÜNCEL ESG SKORU</div>
              <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--primary-midnight)', marginTop: '8px', letterSpacing: '-1px' }}>
                {esgScore} <span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>/ 10</span>
              </div>
            </div>
            <div className="icon-3d" style={{ background: 'linear-gradient(135deg, #10B981, #047857)' }}>
              <Award color="white" size={28} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
            <span style={{ 
              fontSize: '12px', 
              color: riskLevel === 'Düşük' ? 'var(--accent-emerald-dark)' : 'var(--warning)', 
              background: riskLevel === 'Düşük' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
              padding: '3px 8px', 
              borderRadius: '8px',
              fontWeight: 700 
            }}>
              {riskLevel} Çevresel Risk
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 500 }}>BIST Derecesi</span>
          </div>
        </motion.div>
        
        {/* Card 2 — Verified Documents */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="glass-panel card flex-col justify-between" style={{ minHeight: '160px' }}>
          <div className="flex justify-between items-start">
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>DOĞRULANAN BELGELER</div>
              <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--primary-midnight)', marginTop: '8px', letterSpacing: '-1px' }}>
                {totalDocs} <span style={{ fontSize: '16px', color: 'var(--accent-emerald)', fontWeight: 700 }}>/ 12</span>
              </div>
            </div>
            <div className="icon-3d" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
              <Leaf color="white" size={28} />
            </div>
          </div>
          <div style={{ fontSize: '12px', color: totalDocs >= 8 ? 'var(--accent-emerald)' : 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} /> {totalDocs >= 8 ? 'TSRS Raporu için yeterli' : 'Ek belgeler gerekli'}
          </div>
        </motion.div>

        {/* Card 3 — Manager Declaration */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="glass-panel card flex-col justify-between" style={{ minHeight: '160px' }}>
          <div className="flex justify-between items-start">
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>YÖNETİCİ BEYANI</div>
              <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--primary-midnight)', marginTop: '8px', letterSpacing: '-1px' }}>
                {declarationOk ? '✓' : '✗'}
              </div>
            </div>
            <div className="icon-3d" style={{ background: declarationOk ? 'linear-gradient(135deg, #10B981, #047857)' : 'linear-gradient(135deg, #94a3b8, #64748b)' }}>
              <ShieldCheck color="white" size={28} />
            </div>
          </div>
          <div style={{ fontSize: '12px', color: declarationOk ? 'var(--accent-emerald-dark)' : 'var(--text-muted)', fontWeight: 600 }}>
            {declarationOk ? 'Beyan anketleri tamamlandı' : 'Anket bekliyor'}
          </div>
        </motion.div>

        {/* Card 4 — Digital Ledger Signature */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="glass-panel card flex-col justify-between" style={{ minHeight: '160px' }}>
          <div className="flex justify-between items-start">
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>BLOCKCHAIN İMZASI</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-emerald-dark)', marginTop: '16px', letterSpacing: '-0.5px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {reportHash ? `${reportHash.slice(0, 14)}...` : '—'}
              </div>
            </div>
            <div className="icon-3d" style={{ background: 'linear-gradient(135deg, #FCE883, #D4AF37)' }}>
              <Zap color="white" size={28} />
            </div>
          </div>
          <div style={{ fontSize: '12px', color: reportHash ? 'var(--accent-gold)' : 'var(--text-muted)', fontWeight: 600 }}>
            {reportHash ? 'Rapor Kaydı Doğrulanabilir' : 'Dijital imza alınmadı'}
          </div>
        </motion.div>

      </div>

      {/* Prominent ESG Simulator Call to Action Banner */}
      <motion.div 
        variants={itemVariants} 
        whileHover={{ scale: 1.01 }}
        style={{
          background: 'linear-gradient(135deg, #0B1120 0%, #064E3B 100%)',
          borderRadius: '20px',
          padding: '32px',
          color: '#FFFFFF',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(6, 78, 59, 0.2)'
        }}
      >
        <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: 0.08,
            backgroundImage: 'radial-gradient(var(--accent-emerald) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
        }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', position: 'relative', zIndex: 1 }}>
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'inline-flex', padding: '4px 10px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)', borderRadius: '20px', fontSize: '11px', fontWeight: 700, gap: '6px', alignItems: 'center', marginBottom: '14px' }}>
              <Sparkles size={12} /> YZ ESG Karbon Simülasyon Motoru
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Şirketinizin ESG Karbon Skorunu İyileştirin
            </h2>
            <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.6' }}>
              GES projesi kurulumu, lojistik filonuzun elektrikli araçlara dönüştürülmesi veya enerji verimliliği yatırımları planlıyor musunuz? Bu yatırımların finansal ROI oranlarını, yeşil kredi faiz indirimlerini ve ESG skorunuza net etkisini Yapay Zekayla simüle edin.
            </p>
          </div>
          <button 
            onClick={() => navigate('/simulator')}
            className="btn-primary" 
            style={{ 
              padding: '14px 28px', 
              fontSize: '14px', 
              background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-emerald-dark))',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
              border: 'none'
            }}
          >
            YZ Simülatörünü Başlat <ArrowRight size={16} style={{ marginLeft: '4px' }} />
          </button>
        </div>
      </motion.div>

      {/* Two Column Layout: Charts and Verified Points */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
        
        {/* Left Column Chart */}
        <motion.div variants={itemVariants} className="glass-panel card" style={{ height: '420px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--accent-emerald), transparent)' }}></div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-midnight)', marginBottom: '4px' }}>Dönemsel ESG Performans Analizi</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Yapay zeka analiz skorlarınızın tarihsel bazda sürdürülebilirlik gelişimi.</p>
          
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={areaData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEsgScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-emerald)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent-emerald)" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500}} dy={10} />
              <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500}} dx={-10} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 600, padding: '12px 16px' }}
                itemStyle={{ color: 'var(--primary-midnight)' }}
              />
              <Area 
                type="monotone" dataKey="score" name="ESG Skoru" stroke="var(--accent-emerald)" strokeWidth={4} 
                fillOpacity={1} fill="url(#colorEsgScore)"
                activeDot={{ r: 7, strokeWidth: 0, fill: 'var(--accent-emerald)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Right Column Pie Chart */}
        <motion.div variants={itemVariants} className="glass-panel card" style={{ height: '420px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--accent-gold), transparent)' }}></div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-midnight)', marginBottom: '4px' }}>Karbon Ayak İzi Dağılımı</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Kapsam bazlı sera gazı emisyon dağılım oranları (Scope 1, 2, 3).</p>
          
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 600 }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Verified Achievements & Points Checklist */}
      <motion.div variants={itemVariants} className="glass-panel card" style={{ padding: '28px', borderTop: '4px solid #3B82F6' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-midnight)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={20} color="#3B82F6" /> Yapay Zeka Tarafından Onaylanan ESG Başarıları
        </h3>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Blockchain tabanlı şifreli ESG motorumuzun denetlediği ve doğruladığı sürdürülebilirlik kriterleri:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {verifiedPoints.map((point, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '14px 18px', 
              background: 'rgba(59, 130, 246, 0.05)', 
              border: '1px solid rgba(59, 130, 246, 0.1)', 
              borderRadius: '12px' 
            }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: 'rgba(59,130,246,0.15)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Check size={14} color="#3B82F6" strokeWidth={3} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{point}</span>
            </div>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
};

export default Dashboard;
