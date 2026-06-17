import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, TrendingUp, Leaf, Zap, CreditCard, BarChart3,
  Clock, ChevronDown, ChevronUp, AlertCircle, CheckCircle2,
  RefreshCw, ArrowRight, Info, Shield, Wallet
} from 'lucide-react';

const MODEL_C_URL = import.meta.env.VITE_MODEL_C_URL || 'http://localhost:8005';

// ─── Animasyon Varyantları ────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } }
};
const resultVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 20, duration: 0.5 } }
};

// ─── Yarım Daire Gauge Bileşeni ───────────────────────────────────────────────
const ScoreGauge = ({ score, color, label }) => {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = 0;
    const timer = setInterval(() => {
      start += 2;
      if (start >= score) { setDisplayed(score); clearInterval(timer); }
      else setDisplayed(start);
    }, 16);
    return () => clearInterval(timer);
  }, [score]);

  const radius = 70;
  const circumference = Math.PI * radius; // yarım daire
  const offset = circumference - (displayed / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg width="180" height="100" viewBox="0 0 180 100">
        {/* Arka plan yarım daire */}
        <path
          d={`M 10 90 A ${radius} ${radius} 0 0 1 170 90`}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Dolgu yarım daire */}
        <path
          d={`M 10 90 A ${radius} ${radius} 0 0 1 170 90`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.05s linear', filter: `drop-shadow(0 0 8px ${color}88)` }}
        />
        {/* Merkez skor */}
        <text x="90" y="80" textAnchor="middle" fill="white" fontSize="32" fontWeight="800">
          {displayed}
        </text>
        <text x="90" y="96" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11">
          / 100
        </text>
      </svg>
      <span style={{
        fontSize: '13px', fontWeight: 700, color, letterSpacing: '0.5px',
        background: `${color}22`, padding: '4px 12px', borderRadius: '20px',
        border: `1px solid ${color}44`
      }}>{label}</span>
    </div>
  );
};

// ─── Animasyonlu Sayı Bileşeni ────────────────────────────────────────────────
const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplayed(value); clearInterval(timer); }
      else setDisplayed(start);
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <span>{prefix}{decimals > 0 ? displayed.toFixed(decimals) : Math.round(displayed).toLocaleString('tr-TR')}{suffix}</span>
  );
};

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
const GreenROI = () => {
  const [inputText, setInputText] = useState('');
  const [investmentTl, setInvestmentTl] = useState(500000);
  const [loanYears, setLoanYears] = useState(5);
  const [reductionPct, setReductionPct] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showAudit, setShowAudit] = useState(false);
  const [showCarbon, setShowCarbon] = useState(false);
  const resultRef = useRef(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(`${MODEL_C_URL}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          investment_tl: investmentTl,
          loan_years: loanYears,
          reduction_target_pct: reductionPct
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'API hatası');
      }
      const data = await res.json();
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const groi = result?.groi;

  // Breakdown kartları
  const breakdownCards = groi ? [
    {
      icon: <Leaf size={20} />,
      label: 'Karbon Vergisi Tasarrufu',
      value: groi.breakdown.carbon_tax_saving_tl,
      color: '#10B981',
      bg: 'rgba(16,185,129,0.12)',
      source: 'AB ETS Gölge Fiyatı 2025'
    },
    {
      icon: <Zap size={20} />,
      label: 'Enerji Maliyeti Tasarrufu',
      value: groi.breakdown.energy_saving_tl,
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.12)',
      source: 'TEİAŞ 2024'
    },
    {
      icon: <CreditCard size={20} />,
      label: 'Yeşil Kredi Faiz Avantajı',
      value: groi.breakdown.green_loan_advantage_tl,
      color: '#3B82F6',
      bg: 'rgba(59,130,246,0.12)',
      source: 'TCMB Referansı'
    },
    {
      icon: <BarChart3 size={20} />,
      label: 'Karbon Kredisi Geliri',
      value: groi.breakdown.carbon_credit_revenue_tl,
      color: '#8B5CF6',
      bg: 'rgba(139,92,246,0.12)',
      source: 'VCS/Gold Standard 2025'
    },
    {
      icon: <TrendingUp size={20} />,
      label: 'ESG Değerleme Primi',
      value: groi.breakdown.esg_premium_tl,
      color: '#EC4899',
      bg: 'rgba(236,72,153,0.12)',
      source: 'MSCI ESG Araştırma 2024'
    },
  ] : [];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex-col gap-6">

      {/* ── Başlık ─────────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex justify-between items-center mb-2">
        <div>
          <h1 className="page-title">Green Finance ROI Analizi</h1>
          <p className="page-subtitle">
            Şirket faaliyetlerinizi serbest metin olarak girin — Model C ve G-ROI motoru anlık analiz üretsin
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
          border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px',
          padding: '10px 18px', fontSize: '13px', fontWeight: 700, color: '#10B981'
        }}>
          <Shield size={16} /> Model C v2.0 Aktif
        </div>
      </motion.div>

      {/* ── Girdi Paneli ───────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="glass-panel card" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #10B981, #3B82F6, #8B5CF6)' }} />

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-midnight)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#10B981" /> Faaliyet Metni
          </div>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Örnek: Bu ay 15 ton pamuk, 5 ton plastik polimer kullandık. 2500 km dizel kamyon lojistiği, 18.000 kWh elektrik ve 1.200 m³ doğalgaz tüketimiz var..."
            rows={5}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '16px', borderRadius: '12px',
              border: '1.5px solid var(--border-color)',
              background: 'rgba(248,250,252,0.6)', resize: 'vertical',
              fontSize: '14px', lineHeight: '1.7', color: 'var(--primary-midnight)',
              fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#10B981'}
            onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
          />
        </div>

        {/* ── Parametreler ─────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>

          {/* Yatırım Tutarı */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wallet size={14} /> Yatırım Tutarı
              </span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-midnight)' }}>
                {investmentTl.toLocaleString('tr-TR')} TL
              </span>
            </div>
            <input type="range" min="100000" max="5000000" step="50000"
              value={investmentTl} onChange={e => setInvestmentTl(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#10B981', height: '6px', borderRadius: '4px', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>100K</span><span>5M</span>
            </div>
          </div>

          {/* Kredi Vadesi */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} /> Kredi Vadesi
              </span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-midnight)' }}>{loanYears} Yıl</span>
            </div>
            <input type="range" min="1" max="20" step="1"
              value={loanYears} onChange={e => setLoanYears(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#3B82F6', height: '6px', borderRadius: '4px', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>1 yıl</span><span>20 yıl</span>
            </div>
          </div>

          {/* Azaltma Hedefi */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Leaf size={14} /> Azaltma Hedefi
              </span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-midnight)' }}>%{reductionPct}</span>
            </div>
            <input type="range" min="5" max="100" step="5"
              value={reductionPct} onChange={e => setReductionPct(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#8B5CF6', height: '6px', borderRadius: '4px', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>%5</span><span>%100</span>
            </div>
          </div>
        </div>

        {/* ── Buton ────────────────────────────────────────────────────── */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAnalyze}
          disabled={loading || !inputText.trim()}
          style={{
            width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
            background: loading || !inputText.trim()
              ? 'rgba(156,163,175,0.3)'
              : 'linear-gradient(135deg, #10B981, #047857)',
            color: 'white', fontSize: '16px', fontWeight: 700,
            cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: loading || !inputText.trim() ? 'none' : '0 8px 24px rgba(16,185,129,0.35)',
            transition: 'all 0.3s'
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Gemini AI analiz ediyor...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Green Finance Analizi Başlat
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>
      </motion.div>

      {/* ── Hata ────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              padding: '16px 20px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444',
              display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600
            }}
          >
            <AlertCircle size={18} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sonuç Dashboard'u ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {result && groi && (
          <motion.div ref={resultRef} variants={containerVariants} initial="hidden" animate="show" exit="hidden">

            {/* ── Üst: Gauge + G-ROI + Payback ─────────────────────────────── */}
            <motion.div variants={resultVariants} className="glass-panel card" style={{ position: 'relative', marginBottom: '24px' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${groi.green_finance_color}, transparent)` }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '24px', alignItems: 'center' }}>

                {/* Green Finance Skoru */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    Green Finance Skoru
                  </div>
                  <ScoreGauge score={groi.green_finance_score} color={groi.green_finance_color} label={groi.green_finance_label} />
                </div>

                {/* G-ROI % */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px' }}>
                    G-ROI (5 Bileşen)
                  </div>
                  <div style={{ fontSize: '52px', fontWeight: 900, color: groi.groi_percent >= 0 ? '#10B981' : '#EF4444', letterSpacing: '-2px', lineHeight: 1 }}>
                    <AnimatedNumber value={groi.groi_percent} prefix="%" decimals={1} />
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
                    {loanYears} yıl üzerinden
                  </div>
                </div>

                {/* Net Fayda */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Net Toplam Fayda
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: 900, color: 'var(--primary-midnight)', letterSpacing: '-1px', lineHeight: 1 }}>
                    <AnimatedNumber value={groi.net_benefit_tl} suffix=" TL" />
                  </div>
                  <div style={{ fontSize: '13px', color: '#10B981', fontWeight: 600, marginTop: '4px' }}>
                    ≈ <AnimatedNumber value={groi.annual_benefit_tl} suffix=" TL/yıl" />
                  </div>
                </div>

                {/* Karbon + Payback */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    padding: '14px 18px', borderRadius: '12px',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#EF4444', letterSpacing: '0.5px', marginBottom: '4px' }}>TOPLAM EMİSYON</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-midnight)' }}>
                      <AnimatedNumber value={result.total_co2_tons} decimals={2} suffix=" tCO₂e" />
                    </div>
                  </div>
                  <div style={{
                    padding: '14px 18px', borderRadius: '12px',
                    background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#3B82F6', letterSpacing: '0.5px', marginBottom: '4px' }}>GERİ DÖNÜŞ SÜRESİ</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-midnight)' }}>
                      <AnimatedNumber value={groi.payback_years} decimals={1} suffix=" Yıl" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Breakdown Kartları ─────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {breakdownCards.map((card, i) => (
                <motion.div
                  key={i}
                  variants={resultVariants}
                  whileHover={{ y: -4, scale: 1.02 }}
                  style={{
                    padding: '20px', borderRadius: '16px',
                    background: card.bg, border: `1px solid ${card.color}33`,
                    display: 'flex', flexDirection: 'column', gap: '10px'
                  }}
                >
                  <div style={{ color: card.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {card.icon}
                    <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px' }}>{card.label}</span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--primary-midnight)', letterSpacing: '-0.5px' }}>
                    <AnimatedNumber value={card.value} suffix=" TL" />
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>
                    /yıl · {card.source}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ── AI Öneri Kutusu ────────────────────────────────────────────── */}
            <motion.div variants={resultVariants} style={{
              padding: '20px 24px', borderRadius: '16px', marginBottom: '24px',
              background: `linear-gradient(135deg, ${groi.green_finance_color}18, ${groi.green_finance_color}08)`,
              border: `1px solid ${groi.green_finance_color}40`,
              display: 'flex', alignItems: 'flex-start', gap: '14px'
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                background: groi.green_finance_color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 12px ${groi.green_finance_color}55`
              }}>
                <CheckCircle2 size={20} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-midnight)', marginBottom: '6px' }}>
                  Model C Öneri
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.7', fontWeight: 500 }}>
                  {groi.recommendation}
                </div>
              </div>
            </motion.div>

            {/* ── Denetim İzleri ─────────────────────────────────────────────── */}
            <motion.div variants={resultVariants} className="glass-panel card">
              <button
                onClick={() => setShowAudit(v => !v)}
                style={{
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 700, color: 'var(--primary-midnight)' }}>
                  <Info size={16} color="#8B5CF6" /> G-ROI Denetim İzi
                </div>
                {showAudit ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              <AnimatePresence>
                {showAudit && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {groi.audit_notes.map((note, i) => (
                        <div key={i} style={{
                          padding: '12px 16px', borderRadius: '10px',
                          background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
                          fontSize: '12.5px', color: 'var(--text-muted)', fontFamily: 'monospace', lineHeight: '1.6', fontWeight: 500
                        }}>
                          {note}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── Karbon Aktivite Detayı ──────────────────────────────────────── */}
            <motion.div variants={resultVariants} className="glass-panel card" style={{ marginTop: '16px' }}>
              <button
                onClick={() => setShowCarbon(v => !v)}
                style={{
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 700, color: 'var(--primary-midnight)' }}>
                  <Leaf size={16} color="#10B981" /> Karbon Emisyon Detayı ({result.extracted_activities.length} aktivite)
                </div>
                {showCarbon ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              <AnimatePresence>
                {showCarbon && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ marginTop: '16px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                            {['Kategori', 'Öğe', 'Miktar', 'Birim', 'CO₂ (tCO₂e)'].map(h => (
                              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.extracted_activities.map((act, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.04)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <td style={{ padding: '12px 14px' }}>
                                <span style={{
                                  padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                                  background: act.category === 'hammadde' ? 'rgba(16,185,129,0.12)' : act.category === 'lojistik' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)',
                                  color: act.category === 'hammadde' ? '#10B981' : act.category === 'lojistik' ? '#F59E0B' : '#3B82F6',
                                }}>
                                  {act.category}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: 'var(--primary-midnight)' }}>{act.item_type}</td>
                              <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>{act.amount.toLocaleString('tr-TR')}</td>
                              <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>{act.unit}</td>
                              <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: 800, color: '#EF4444' }}>{act.co2_tons}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {result.audit_trail.slice(0, 2).map((t, i) => (
                          <span key={i} style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default GreenROI;
