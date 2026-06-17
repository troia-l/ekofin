import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ShieldCheck, TrendingDown, Zap, FileOutput, Leaf, Activity } from 'lucide-react';

const areaData = [
  { name: 'Q1', emisyon: 120, tuketim: 400 },
  { name: 'Q2', emisyon: 115, tuketim: 380 },
  { name: 'Q3', emisyon: 105, tuketim: 350 },
  { name: 'Q4', emisyon: 90, tuketim: 310 },
];

const pieData = [
  { name: 'Kapsam 1 (Doğrudan)', value: 65 },
  { name: 'Kapsam 2 (Dolaylı)', value: 25 },
  { name: 'Kapsam 3 (Tedarik)', value: 10 },
];

const COLORS = ['var(--accent-emerald)', 'var(--accent-gold)', 'var(--primary-midnight)'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Dashboard = () => {
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
          <button className="btn-outline">
            <Zap size={16} /> ERP Senkronizasyonu
          </button>
          <button className="btn-primary">
            <FileOutput size={16} /> Yeşil Pasaport Oluştur
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        
        {/* Card 1 */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="glass-panel card flex-col justify-between" style={{ minHeight: '160px' }}>
          <div className="flex justify-between items-start">
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>DD-ESG SKORU</div>
              <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--primary-midnight)', marginTop: '8px', letterSpacing: '-1px' }}>
                88 <span style={{ fontSize: '16px', color: 'var(--accent-emerald)', fontWeight: 700 }}>/ 100</span>
              </div>
            </div>
            <div className="icon-3d" style={{ background: 'linear-gradient(135deg, #10B981, #047857)' }}>
              <Leaf color="white" size={28} />
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={14} /> Sektör ortalamasının %15 üzerinde
          </div>
        </motion.div>
        
        {/* Card 2 */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="glass-panel card flex-col justify-between" style={{ minHeight: '160px' }}>
          <div className="flex justify-between items-start">
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>GÜVENİLİRLİK</div>
              <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--primary-midnight)', marginTop: '8px', letterSpacing: '-1px' }}>
                %94
              </div>
            </div>
            <div className="icon-3d" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
              <ShieldCheck color="white" size={28} />
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Model A NLP Taraması Başarılı</div>
        </motion.div>

        {/* Card 3 */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="glass-panel card flex-col justify-between" style={{ minHeight: '160px' }}>
          <div className="flex justify-between items-start">
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>KONSOLİDE EMİSYON</div>
              <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--primary-midnight)', marginTop: '8px', letterSpacing: '-1px' }}>
                90 <span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>Ton</span>
              </div>
            </div>
            <div className="icon-3d" style={{ background: 'linear-gradient(135deg, #F59E0B, #B45309)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Kapsam 1 ve Kapsam 2</div>
        </motion.div>

        {/* Card 4 */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="glass-panel card flex-col justify-between" style={{ minHeight: '160px' }}>
          <div className="flex justify-between items-start">
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>KREDİ İNDİRİMİ</div>
              <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--accent-emerald-dark)', marginTop: '8px', letterSpacing: '-1px' }}>
                -%2.5
              </div>
            </div>
            <div className="icon-3d" style={{ background: 'linear-gradient(135deg, #FCE883, #D4AF37)' }}>
              <TrendingDown color="white" size={28} />
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--accent-gold)', fontWeight: 600 }}>Yeşil Pasaport Avantajı</div>
        </motion.div>

      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <motion.div variants={itemVariants} className="glass-panel card" style={{ height: '420px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--accent-emerald), transparent)' }}></div>
          <div className="flex justify-between items-center mb-6">
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-midnight)' }}>Dönemsel Emisyon Trendi (2026)</h3>
          </div>
          
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={areaData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEmisyonPremium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-emerald)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--accent-emerald)" stopOpacity={0.0}/>
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 13, fontWeight: 500}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 13, fontWeight: 500}} dx={-10} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 600, padding: '12px 16px' }}
                itemStyle={{ color: 'var(--primary-midnight)' }}
              />
              <Area 
                type="monotone" 
                dataKey="emisyon" 
                stroke="var(--accent-emerald)" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorEmisyonPremium)"
                activeDot={{ r: 8, strokeWidth: 0, fill: 'var(--accent-emerald)', filter: 'url(#glow)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel card" style={{ height: '420px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--accent-gold), transparent)' }}></div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-midnight)', marginBottom: '16px' }}>Emisyon Kaynak Dağılımı</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Tesis, operasyon ve tedarik zincirinden kaynaklı toplam emisyon oranları.</p>
          
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 600 }}
                  itemStyle={{ color: 'var(--primary-midnight)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
