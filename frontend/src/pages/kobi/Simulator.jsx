import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf, Car, ArrowRight, TrendingUp, Sparkles, TrendingDown, Target,
  Zap, Clock, AlertCircle, RefreshCw, Info, Shield, Wallet, FileText, CheckCircle2, ChevronRight, ChevronLeft, Building
} from 'lucide-react';

// ─── Animasyon Varyantları ──────────────────────────────────────────────────────────────────────────────
const MODEL_C_URL = import.meta.env.VITE_MODEL_C_URL || 'http://localhost:8000/api/carbon';
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } }
};

const resultVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 15 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 20 } }
};

const Simulator = () => {
  const { currentUser } = useOutletContext() || {};
  const [searchParams] = useSearchParams();
  const queryTicker = searchParams.get('ticker');
  const [selectedTicker, setSelectedTicker] = useState((currentUser?.companyTicker || queryTicker || 'ASELS').toUpperCase());
  
  useEffect(() => {
    if (currentUser?.companyTicker) {
      setSelectedTicker(currentUser.companyTicker.toUpperCase());
    }
  }, [currentUser?.companyTicker]);
  
  const ticker = selectedTicker;
  const reportingYear = new Date().getFullYear() - 1;
  const withTicker = (url) => ticker ? `${url}${url.includes('?') ? '&' : '?'}ticker=${encodeURIComponent(ticker)}` : url;

  // Sihirbaz Adım State'i
  const [currentStep, setCurrentStep] = useState(1);

  // TSRS Raporu & LLM Otomatik Bağlam State'leri
  const [autoContext, setAutoContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(true);

  // Model C (LLM + Python) Giriş State'leri
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelCResult, setModelCResult] = useState(null);

  // Yeşil Senaryo Seçimleri (5 Scenarios)
  const [gesChecked, setGesChecked] = useState(false);
  const [evChecked, setEvChecked] = useState(false);
  const [effChecked, setEffChecked] = useState(false);
  const [wasteChecked, setWasteChecked] = useState(false);
  const [waterChecked, setWaterChecked] = useState(false);

  // Yatırım Senaryosu (CAPEX) State'leri
  const [gesBudget, setGesBudget] = useState(0);
  const [evCount, setEvCount] = useState(0);
  const [effBudget, setEffBudget] = useState(0);
  const [wasteBudget, setWasteBudget] = useState(0);
  const [waterBudget, setWaterBudget] = useState(0);

  // Kredi ve Finansal Parametreler
  const [loanAmount, setLoanAmount] = useState(0);
  const [financialRating, setFinancialRating] = useState('BBB'); // AAA - C
  const [loanYears, setLoanYears] = useState(5);          // 1 - 20 Yıl

  // TSRS Raporu ve LLM Önerilerini Otomatik Çek
  useEffect(() => {
    let refreshTimer;
    const fetchAutoContext = async () => {
      setContextLoading(true);
      try {
        const res = await fetch(withTicker(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/simulator/auto-context?reporting_year=${reportingYear}`));
        if (res.ok) {
          const data = await res.json();
          setAutoContext(data);
          // Eski "context" alanı bilgilendirme amaçlıdır; hesaplama girdisi değildir.
          const actText = data.activity_text || '';
          setInputText(actText);
          if (data.suggested_investments) {
            const si = data.suggested_investments;
            if (si.ges_budget !== undefined) setGesBudget(si.ges_budget);
            if (si.ev_count !== undefined) setEvCount(si.ev_count);
            if (si.eff_budget !== undefined) setEffBudget(si.eff_budget);
            if (si.waste_budget !== undefined) setWasteBudget(si.waste_budget);
            if (si.water_budget !== undefined) setWaterBudget(si.water_budget);
            if (si.ges_checked !== undefined) setGesChecked(si.ges_checked);
            if (si.ev_checked !== undefined) setEvChecked(si.ev_checked);
            if (si.eff_checked !== undefined) setEffChecked(si.eff_checked);
            if (si.loan_amount !== undefined) setLoanAmount(si.loan_amount);
            if (si.loan_years !== undefined) setLoanYears(si.loan_years);
            if (si.financial_rating !== undefined) setFinancialRating(si.financial_rating);
          }
          if (data.state === 'context_pending') {
            refreshTimer = setTimeout(fetchAutoContext, 2500);
          }
        }
      } catch (err) {
        console.error("Auto context fetch error:", err);
      } finally {
        setContextLoading(false);
      }
    };
    fetchAutoContext();
    return () => clearTimeout(refreshTimer);
  }, [ticker]);

  // Kategorik Mevcut Karbon Dağılımını Hesapla (Greeenwashing Önleme)
  let hammadde_co2 = 0.0;
  let lojistik_co2 = 0.0;
  let enerji_co2 = 0.0;

  if (modelCResult && modelCResult.extracted_activities) {
    modelCResult.extracted_activities.forEach(act => {
      const cat = (act.category || '').toLowerCase();
      const co2 = act.co2_tons || 0.0;
      if (cat === 'hammadde') hammadde_co2 += co2;
      else if (cat === 'lojistik') lojistik_co2 += co2;
      else if (cat === 'enerji') enerji_co2 += co2;
    });
  }

  // Rapor/aktivite analizi yapılmadan örnek emisyon göstermeyiz.
  const baselineEmission = modelCResult ? modelCResult.total_co2_tons : 0;
  if (modelCResult && hammadde_co2 === 0.0 && lojistik_co2 === 0.0 && enerji_co2 === 0.0) {
    hammadde_co2 = baselineEmission * 0.15;
    lojistik_co2 = baselineEmission * 0.25;
    enerji_co2 = baselineEmission * 0.60;
  }

  // Aktif Senaryo Seçimlerine göre Bütçeler
  const activeGesBudget = gesChecked ? gesBudget : 0;
  const activeEvCount = evChecked ? evCount : 0;
  const activeEffBudget = effChecked ? effBudget : 0;
  const activeWasteBudget = wasteChecked ? wasteBudget : 0;
  const activeWaterBudget = waterChecked ? waterBudget : 0;

  // ─── Dinamik Hesaplamalar ve Gerçekçilik Kuralları (LTV & Limit Kontrolleri) ───
  
  // 1. CAPEX Toplamı
  const totalCapex = activeGesBudget + (activeEvCount * 450000) + activeEffBudget + activeWasteBudget + activeWaterBudget;

  // 2. Karbon Azaltımı (Her kategori kendi baseline emisyonu ile sınırlıdır)
  const gesRedRaw = activeGesBudget * 0.000008;
  const gesLimit = enerji_co2 * 0.75;
  const gesReduction = Math.min(gesRedRaw, gesLimit);
  const gesLimitHit = gesRedRaw > gesLimit;

  const evRedRaw = activeEvCount * 5.0;
  const evLimit = lojistik_co2;
  const evReduction = Math.min(evRedRaw, evLimit);
  const evLimitHit = evRedRaw > evLimit;

  const effRedRaw = activeEffBudget * 0.000012;
  const effLimit = enerji_co2 * 0.25;
  const effReduction = Math.min(effRedRaw, effLimit);
  const effLimitHit = effRedRaw > effLimit;

  const wasteRedRaw = activeWasteBudget * 0.000015;
  const wasteLimit = hammadde_co2 * 0.30;
  const wasteReduction = Math.min(wasteRedRaw, wasteLimit);
  const wasteLimitHit = wasteRedRaw > wasteLimit;

  const waterRedRaw = activeWaterBudget * 0.000005;
  const waterLimit = 5.0;
  const waterReduction = Math.min(waterRedRaw, waterLimit);

  const carbonReduction = gesReduction + evReduction + effReduction + wasteReduction + waterReduction;
  const newEmission = Math.max(0, baselineEmission - carbonReduction);

  // 3. Dönemsel Yıllık Tasarruf
  const gesOpexSavings = activeGesBudget * 0.18;
  const evOpexSavings = activeEvCount * 55000;
  const effOpexSavings = activeEffBudget * 0.24;
  const wasteOpexSavings = activeWasteBudget * 0.20;
  const waterOpexSavings = activeWaterBudget * 0.15;
  const annualOpexSavings = gesOpexSavings + evOpexSavings + effOpexSavings + wasteOpexSavings + waterOpexSavings;

  // 4. g-ROI Payback
  const annualCarbonTaxAvoided = carbonReduction * 25 * 32.5;
  const totalAnnualReturns = annualOpexSavings + annualCarbonTaxAvoided;
  const groiPayback = totalCapex > 0 && totalAnnualReturns > 0 ? (totalCapex / totalAnnualReturns) : 0;

  // 5. Finansman Oranı (LTV) ve Özkaynak Oranı Hesaplama
  const ltvRatio = totalCapex > 0 ? (loanAmount / totalCapex) * 100 : 0;
  const equityRatio = ltvRatio <= 100 ? 100 - ltvRatio : 0;

  // 6. Kredi Skorlama Bileşenleri
  const ratingScores = {
    "AAA": 40.0, "AA": 37.0, "A": 34.0, "BBB": 30.0, "BB": 24.0, "B": 18.0, "C": 10.0
  };
  const financialScore = ratingScores[financialRating] || 30.0;

  const reductionPct = baselineEmission > 0 ? (carbonReduction / baselineEmission) * 100 : 0;
  const environmentalScore = Math.min(40.0, reductionPct * 0.8);

  let cashFlowScore = 10.0;
  if (totalCapex > 0) {
    if (groiPayback <= loanYears) {
      cashFlowScore = 20.0;
    } else {
      cashFlowScore = Math.max(0.0, 20.0 * (loanYears / groiPayback));
    }
  }

  // Finansal risk modifiyeri
  let financialModifier = 0.0;
  let creditWarning = "";
  if (totalCapex > 0) {
    if (loanAmount > totalCapex) {
      financialModifier = -20.0;
      creditWarning = "Talep edilen kredi yeşil CAPEX bütçesini aşıyor!";
    } else if (equityRatio >= 20.0) {
      financialModifier = 5.0;
    }
  }

  const greenCreditScore = Math.min(100, Math.max(0, Math.round(financialScore + environmentalScore + cashFlowScore + financialModifier)));

  let decision = "REDDEDİLDİ (Yetersiz Yeşil Etki veya Yüksek Risk)";
  let decisionColor = "#EF4444";
  let decisionBg = "rgba(239,68,68,0.12)";
  
  if (greenCreditScore >= 80) {
    decision = "ONAYLANDI (Yeşil Kredi Pasaportu Verildi)";
    decisionColor = "#10B981";
    decisionBg = "rgba(16,185,129,0.12)";
  } else if (greenCreditScore >= 50) {
    decision = "KOŞULLU ONAY (Ek Teminat veya Emisyon Taahhüdü Gerekli)";
    decisionColor = "#F59E0B";
    decisionBg = "rgba(245,158,11,0.12)";
  }

  const discountPct = greenCreditScore >= 50 ? Math.min(1.5, (greenCreditScore / 100) * 1.5) : 0.0;

  // API İstek Fonksiyonu - Otomatik veya Özel Metin ile Baseline Hesabı
  const handleCalculateBaseline = async (customText = null) => {
    const textToUse = customText || inputText || autoContext?.activity_text || '';
    if (!textToUse.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${MODEL_C_URL}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: textToUse,
          ges_budget: activeGesBudget,
          ev_count: activeEvCount,
          eff_budget: activeEffBudget,
          waste_budget: activeWasteBudget,
          water_budget: activeWaterBudget,
          loan_amount: loanAmount,
          loan_years: loanYears,
          financial_rating: financialRating
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Model C API hesaplama hatası oluştu.');
      }
      
      const data = await res.json();
      setModelCResult(data);
      // Analiz bitince 2. adıma otomatik aktaralım
      setCurrentStep(2);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* ── Üst Başlık ────────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} style={{ marginBottom: '2px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '3px' }}>
            Yeşil Finansman Simülasyonu
          </div>
          <h1 className="page-title">Yeşil Kredi Sihirbazı & g-ROI Simülatörü</h1>
          <p className="page-subtitle">TSRS raporundan derlenen şirket bağlamı ve yapay zeka (LLM) yeşil yatırım önerileri ile finansman senaryolarınızı kurgulayın</p>
        </div>
        
      </motion.div>
      {/* ── SÜREÇ ÇUBUĞU (STEP TRACKER) ────────────────────────────────────────── */}
      <motion.div variants={itemVariants} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-card)', padding: '12px 20px', borderRadius: '14px',
        border: '1px solid var(--border-color)', marginBottom: '0px', gap: '14px'
      }}>
        {[
          { step: 1, label: 'TSRS Durumu & LLM Önerisi', desc: 'Otomatik Şirket Bağlamı' },
          { step: 2, label: 'Finansman Girdileri', desc: 'Kredi ve Risk Notu' },
          { step: 3, label: 'Yeşil Senaryolar', desc: 'Genişletilmiş Yatırımlar' }
        ].map((s, idx) => {
          const isDone = modelCResult && currentStep > s.step;
          const isActive = currentStep === s.step;
          return (
            <React.Fragment key={s.step}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: isActive || isDone ? 1 : 0.45, transition: 'opacity 0.3s' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: isDone ? '#10B981' : isActive ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)' : 'var(--bg-main)',
                  border: isDone ? 'none' : isActive ? 'none' : '1px solid var(--border-color)',
                  color: isDone || isActive ? 'white' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 800,
                  boxShadow: isActive ? '0 0 10px rgba(59,130,246,0.3)' : isDone ? '0 0 10px rgba(16,185,129,0.3)' : 'none',
                  transition: 'all 0.3s'
                }}>
                  {isDone ? <CheckCircle2 size={16} /> : s.step}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-midnight)' }}>{s.label}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 500 }}>{s.desc}</div>
                </div>
              </div>
              {idx < 2 && (
                <div style={{ flex: 1, height: '1.5px', background: currentStep > s.step ? '#10B981' : 'var(--border-color)', transition: 'background 0.3s', margin: '0 12px' }} />
              )}
            </React.Fragment>
          );
        })}
      </motion.div>

      {/* ── İki Sütunlu Grid Düzeni ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '20px' }}>
        
        {/* SOL KOLON: Sihirbaz Adım İçeriği */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <AnimatePresence mode="wait">
            
            {/* ADIM 1: TSRS Şirket Durumu ve LLM Yeşil Yatırım Önerisi (Manuel Metin Girişi Kaldırıldı) */}
            {currentStep === 1 && (
              <motion.div 
                key="step1" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} transition={{ duration: 0.25 }}
                style={{
                  background: 'var(--bg-card)', borderRadius: '20px', padding: '24px 28px',
                  border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-premium-card)',
                  display: 'flex', flexDirection: 'column', gap: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #10B981, #047857)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                    }}>
                      <Sparkles size={18} color="white" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-midnight)' }}>1. TSRS Şirket Durumu & LLM Yeşil Yatırım Önerisi</h3>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500 }}>Şirket verileri rapordan otomatik derlenir, yeşil yatırım stratejisi LLM tarafından üretilir.</p>
                    </div>
                  </div>
                  
                  <span style={{ 
                    fontSize: '11px', fontWeight: 700, 
                    background: 'rgba(16,185,129,0.1)', color: '#047857', 
                    border: '1px solid rgba(16,185,129,0.25)', 
                    padding: '4px 10px', borderRadius: '8px', 
                    display: 'flex', alignItems: 'center', gap: '6px' 
                  }}>
                    <CheckCircle2 size={13} /> {autoContext?.state === 'ready' ? 'TSRS Hazır' : 'TSRS Bekleniyor'}
                  </span>
                </div>

                {!contextLoading && autoContext?.state !== 'ready' && (
                  <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412', fontSize: '12.5px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <AlertCircle size={16} />
                    {autoContext?.state === 'missing_data'
                      ? 'Veri yüklenmedi. Önce Veri Entegrasyonu sayfasından gerekli belgeleri yükleyin.'
                      : autoContext?.state === 'data_incomplete'
                        ? 'Kritik belgeler eksik. TSRS raporu oluşturulmadan öneri üretilemez.'
                        : autoContext?.state === 'report_stale'
                          ? 'Kaynak veriler değişti. TSRS raporunu yeniden oluşturun.'
                          : 'TSRS raporu oluşturulmadı. Önce raporu oluşturun.'}
                  </div>
                )}

                {/* 1. Kutu: Şirketin Mevcut Durumu (TSRS Raporundan Otomatik Derlendi) */}
                <div style={{
                  padding: '16px 18px', borderRadius: '14px',
                  background: 'var(--bg-main)', border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--primary-midnight)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building size={14} color="#10B981" /> Şirketin Mevcut Operasyonel Durumu
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {autoContext?.company_name || 'Şirket'} • {autoContext?.industry}
                    </span>
                  </div>

                  {contextLoading ? (
                    <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> TSRS raporundan kurumsal durum derleniyor...
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.65', color: 'var(--primary-midnight)' }}>
                      {autoContext?.current_status}
                    </p>
                  )}
                </div>

                {/* 2. Kutu: Yapay Zeka (LLM) Yeşil Yatırım Öneri Katmanı */}
                <div style={{
                  padding: '18px 20px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(6, 78, 59, 0.02) 100%)',
                  border: '1.5px solid rgba(16, 185, 129, 0.25)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Zap size={16} color="#10B981" />
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-midnight)' }}>
                      LLM Yeşil Yatırım & G-ROI Tavsiyesi
                    </div>
                    <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.15)', color: '#047857', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, marginLeft: 'auto' }}>
                      Gemini AI Danışmanı
                    </span>
                  </div>

                  {contextLoading ? (
                    <div style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> LLM yeşil yatırım önerileri üretiliyor...
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', lineHeight: '1.65', color: 'var(--primary-midnight)', whiteSpace: 'pre-line' }}>
                      {autoContext?.llm_recommendation}
                    </div>
                  )}

                  {/* Önerilen Yatırım Kalemleri Rozetleri */}
                  {autoContext?.suggested_investments && (
                    <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed rgba(16, 185, 129, 0.25)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', background: 'white', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#047857' }}>
                        ☀️ Çatı GES: {(autoContext.suggested_investments.ges_budget).toLocaleString('tr-TR')} ₺
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', background: 'white', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#1D4ED8' }}>
                        🚚 EV Ticari Filo: {autoContext.suggested_investments.ev_count} Araç
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', background: 'white', border: '1px solid rgba(212, 175, 55, 0.3)', color: '#B45309' }}>
                        ⚡ Enerji Verimliliği: {(autoContext.suggested_investments.eff_budget).toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <motion.button 
                    whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }} 
                    onClick={() => handleCalculateBaseline(autoContext?.activity_text)} 
                    disabled={loading || contextLoading || !autoContext?.usable}
                    style={{
                      flex: 1, padding: '14px 20px', borderRadius: '12px', border: 'none',
                      background: loading || contextLoading || !autoContext?.usable ? 'rgba(148,163,184,0.15)' : 'linear-gradient(135deg, #10B981, #047857)',
                      color: loading || contextLoading || !autoContext?.usable ? 'var(--text-muted)' : 'white',
                      fontSize: '13.5px', fontWeight: 800, cursor: loading || contextLoading || !autoContext?.usable ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: loading || contextLoading || !autoContext?.usable ? 'none' : '0 4px 14px rgba(16,185,129,0.3)',
                      transition: 'all 0.25s'
                    }}>
                    {loading ? (
                      <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Model C Karbon Analizi Yapılıyor...</>
                    ) : (
                      <><Sparkles size={16} /> Önerileri Onayla ve Finansman Adımına İlerle <ChevronRight size={16} /></>
                    )}
                  </motion.button>
                  
                  {modelCResult && (
                    <motion.button 
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={() => setCurrentStep(2)}
                      style={{
                        padding: '14px 22px', borderRadius: '12px', border: '1px solid var(--border-color)',
                        background: 'white', color: 'var(--primary-midnight)', fontSize: '13px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                      }}>
                      İlerle <ChevronRight size={14} />
                    </motion.button>
                  )}
                </div>

                {error && (
                  <div style={{
                    padding: '10px 16px', borderRadius: '8px',
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                    color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '12px', fontWeight: 600
                  }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
              </motion.div>
            )}

            {/* ADIM 2: Finansman Talebi ve Risk Girdileri */}
            {currentStep === 2 && (
              <motion.div 
                key="step2" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} transition={{ duration: 0.25 }}
                style={{
                  background: 'var(--bg-card)', borderRadius: '20px', padding: '24px 28px',
                  border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-premium-card)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(59,130,246,0.3)'
                  }}>
                    <Wallet size={16} color="white" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-midnight)' }}>2. Finansal Kredi Talebi</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Geleneksel risk ve talep edilen finansman tutarı</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  {/* Kredi Tutarı */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-midnight)' }}>Talep Edilen Kredi (TL)</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="number" value={loanAmount} onChange={e => setLoanAmount(Number(e.target.value))}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          padding: '10px 14px', borderRadius: '10px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-main)', fontSize: '13px',
                          color: 'var(--primary-midnight)', fontWeight: 700, outline: 'none'
                        }}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>₺</span>
                    </div>
                  </div>

                  {/* Geleneksel Not */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-midnight)' }}>Traditional Risk Notu</label>
                    <select 
                      value={financialRating} onChange={e => setFinancialRating(e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '10px 14px', borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-main)', fontSize: '13px',
                        color: 'var(--primary-midnight)', fontWeight: 700, outline: 'none', cursor: 'pointer'
                      }}>
                      {['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C'].map(r => (
                        <option key={r} value={r}>{r} (Finansal Puan: {ratingScores[r]}/40)</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Vade Slider */}
                <div style={{
                  padding: '14px 16px', borderRadius: '12px',
                  background: 'var(--bg-main)', border: '1px solid var(--border-color)',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-midnight)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={13} color="#3B82F6" /> Kredi Vadesi
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-midnight)' }}>{loanYears} Yıl</span>
                  </div>
                  <input 
                    type="range" min={1} max={20} step={1}
                    value={loanYears} onChange={e => setLoanYears(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#3B82F6', height: '4px', cursor: 'pointer' }}
                  />
                </div>

                {/* Navigasyon Butonları */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button 
                    onClick={() => setCurrentStep(1)}
                    style={{
                      padding: '12px 20px', borderRadius: '10px', border: '1px solid var(--border-color)',
                      background: 'white', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                    }}>
                    <ChevronLeft size={14} /> Geri
                  </button>
                  <button 
                    onClick={() => setCurrentStep(3)}
                    style={{
                      padding: '12px 20px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #0B1120, #162032)', color: 'white', fontSize: '13px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(11,17,32,0.15)'
                    }}>
                    Adım 3'e Geç <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ADIM 3: Genişletilmiş Yeşil Yatırım Senaryoları */}
            {currentStep === 3 && (
              <motion.div 
                key="step3" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} transition={{ duration: 0.25 }}
                style={{
                  background: 'var(--bg-card)', borderRadius: '20px', padding: '24px 28px',
                  border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-premium-card)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                  }}>
                    <Leaf size={16} color="white" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-midnight)' }}>3. Yeşil Yatırım Senaryoları</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Planlanan yeşil yatırımları ve CAPEX değerlerini seçin</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                  
                  {/* 1. GES */}
                  <div style={{
                    padding: '12px 14px', borderRadius: '12px',
                    background: gesChecked ? 'rgba(16,185,129,0.02)' : 'var(--bg-main)',
                    border: gesChecked ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--border-color)',
                    transition: 'all 0.2s'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: gesChecked ? '10px' : '0' }}>
                      <input 
                        type="checkbox" checked={gesChecked} onChange={e => setGesChecked(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#10B981', cursor: 'pointer' }}
                      />
                      <div>
                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--primary-midnight)' }}>Güneş Enerjisi Santrali (GES) Geçişi</span>
                        {gesLimitHit && <span style={{ fontSize: '9px', background: 'rgba(245,158,11,0.15)', color: '#D47A2A', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 700 }}>Limit Sınırı</span>}
                      </div>
                    </label>
                    {gesChecked && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                          <span>Yatırım Bütçesi (CAPEX)</span>
                          <span style={{ color: 'var(--primary-midnight)', fontVariantNumeric: 'tabular-nums' }}>{gesBudget.toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <input 
                          type="range" min={50000} max={5000000} step={50000}
                          value={gesBudget} onChange={e => setGesBudget(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#10B981', height: '4px', cursor: 'pointer' }}
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* 2. Elektrikli Ticari Araç Filosu */}
                  <div style={{
                    padding: '12px 14px', borderRadius: '12px',
                    background: evChecked ? 'rgba(59,130,246,0.02)' : 'var(--bg-main)',
                    border: evChecked ? '1px solid rgba(59,130,246,0.2)' : '1px solid var(--border-color)',
                    transition: 'all 0.2s'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: evChecked ? '10px' : '0' }}>
                      <input 
                        type="checkbox" checked={evChecked} onChange={e => setEvChecked(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#3B82F6', cursor: 'pointer' }}
                      />
                      <div>
                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--primary-midnight)' }}>Elektrikli Ticari Araç Filosu</span>
                        {evLimitHit && <span style={{ fontSize: '9px', background: 'rgba(245,158,11,0.15)', color: '#D47A2A', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 700 }}>Limit Sınırı</span>}
                      </div>
                    </label>
                    {evChecked && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                          <span>Araç Adedi (Adet başı 450.000 TL CAPEX)</span>
                          <span style={{ color: 'var(--primary-midnight)', fontVariantNumeric: 'tabular-nums' }}>{evCount} Adet</span>
                        </div>
                        <input 
                          type="range" min={1} max={50} step={1}
                          value={evCount} onChange={e => setEvCount(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#3B82F6', height: '4px', cursor: 'pointer' }}
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* 3. Enerji Verimliliği */}
                  <div style={{
                    padding: '12px 14px', borderRadius: '12px',
                    background: effChecked ? 'rgba(212,175,55,0.02)' : 'var(--bg-main)',
                    border: effChecked ? '1px solid rgba(212,175,55,0.2)' : '1px solid var(--border-color)',
                    transition: 'all 0.2s'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: effChecked ? '10px' : '0' }}>
                      <input 
                        type="checkbox" checked={effChecked} onChange={e => setEffChecked(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#D4AF37', cursor: 'pointer' }}
                      />
                      <div>
                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--primary-midnight)' }}>Üretim Hattı Enerji Verimliliği</span>
                        {effLimitHit && <span style={{ fontSize: '9px', background: 'rgba(245,158,11,0.15)', color: '#D47A2A', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 700 }}>Limit Sınırı</span>}
                      </div>
                    </label>
                    {effChecked && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                          <span>Yatırım Bütçesi (CAPEX)</span>
                          <span style={{ color: 'var(--primary-midnight)', fontVariantNumeric: 'tabular-nums' }}>{effBudget.toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <input 
                          type="range" min={10000} max={1000000} step={10000}
                          value={effBudget} onChange={e => setEffBudget(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#D4AF37', height: '4px', cursor: 'pointer' }}
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* 4. Atık Yönetimi */}
                  <div style={{
                    padding: '12px 14px', borderRadius: '12px',
                    background: wasteChecked ? 'rgba(139,92,246,0.02)' : 'var(--bg-main)',
                    border: wasteChecked ? '1px solid rgba(139,92,246,0.2)' : '1px solid var(--border-color)',
                    transition: 'all 0.2s'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: wasteChecked ? '10px' : '0' }}>
                      <input 
                        type="checkbox" checked={wasteChecked} onChange={e => setWasteChecked(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#8B5CF6', cursor: 'pointer' }}
                      />
                      <div>
                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--primary-midnight)' }}>Atık Yönetimi & Geri Dönüşüm (YENİ)</span>
                        {wasteLimitHit && <span style={{ fontSize: '9px', background: 'rgba(245,158,11,0.15)', color: '#D47A2A', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 700 }}>Limit Sınırı</span>}
                      </div>
                    </label>
                    {wasteChecked && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                          <span>Yatırım Bütçesi (CAPEX)</span>
                          <span style={{ color: 'var(--primary-midnight)', fontVariantNumeric: 'tabular-nums' }}>{wasteBudget.toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <input 
                          type="range" min={10000} max={1000000} step={10000}
                          value={wasteBudget} onChange={e => setWasteBudget(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#8B5CF6', height: '4px', cursor: 'pointer' }}
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* 5. Su Verimliliği */}
                  <div style={{
                    padding: '12px 14px', borderRadius: '12px',
                    background: waterChecked ? 'rgba(6,182,212,0.02)' : 'var(--bg-main)',
                    border: waterChecked ? '1px solid rgba(6,182,212,0.2)' : '1px solid var(--border-color)',
                    transition: 'all 0.2s'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: waterChecked ? '10px' : '0' }}>
                      <input 
                        type="checkbox" checked={waterChecked} onChange={e => setWaterChecked(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#06B6D4', cursor: 'pointer' }}
                      />
                      <div>
                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--primary-midnight)' }}>Su Verimliliği & Yağmur Hasadı (YENİ)</span>
                      </div>
                    </label>
                    {waterChecked && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                          <span>Yatırım Bütçesi (CAPEX)</span>
                          <span style={{ color: 'var(--primary-midnight)', fontVariantNumeric: 'tabular-nums' }}>{waterBudget.toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <input 
                          type="range" min={5000} max={500000} step={5000}
                          value={waterBudget} onChange={e => setWaterBudget(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#06B6D4', height: '4px', cursor: 'pointer' }}
                        />
                      </motion.div>
                    )}
                  </div>

                </div>

                {/* Navigasyon Butonları */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button 
                    onClick={() => setCurrentStep(2)}
                    style={{
                      padding: '12px 20px', borderRadius: '10px', border: '1px solid var(--border-color)',
                      background: 'white', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                    }}>
                    <ChevronLeft size={14} /> Geri
                  </button>
                  <button 
                    onClick={() => {
                      // Süreci tamamlamak için API'yi tekrar çağırabiliriz
                      handleCalculateBaseline();
                    }}
                    style={{
                      padding: '12px 20px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontSize: '13px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                    }}>
                    Skoru Güncelle <RefreshCw size={14} />
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* SAĞ KOLON: Kredi Skorlama Sonuçları (Premium Dark Panel - Adım Adım Rapor Görünümü) */}
        <motion.div variants={resultVariants} style={{
          background: 'linear-gradient(135deg, #0B1120 0%, #162032 60%, #1E293B 100%)',
          borderRadius: '18px',
          padding: '20px 24px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          alignSelf: 'start'
        }}>
          {/* Ambient Glow */}
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: `radial-gradient(circle, ${modelCResult ? decisionColor : '#10B981'}15 0%, transparent 70%)`, borderRadius: '50%' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles color="#D4AF37" size={18} />
              <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px' }}>Yeşil Kredi Değerlendirmesi</span>
            </div>
            <div style={{ 
              padding: '4px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', 
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', 
              color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.06)' 
            }}>
              Adım {currentStep} / 3
            </div>
          </div>

          {/* Durum 1: Baseline Hesaplanmamışsa */}
          {!modelCResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '400px', textAlign: 'center', zIndex: 1 }}>
              <Shield size={42} color="#10B981" style={{ marginBottom: '16px', opacity: 0.8, filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.3))' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>Analiz Bekleniyor</h3>
              <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.5)', maxWidth: '280px', lineHeight: '1.6', fontWeight: 500 }}>
                Kredi Değerlendirmesini başlatmak için lütfen sol taraftaki <strong>Kapasite & Faaliyet Beyanını</strong> doldurarak analizi başlatın.
              </p>
            </div>
          ) : (
            <>
              {/* Adım 1 Aktifse Rapor Görünümü (Sadece Karbon Verileri) */}
              {currentStep === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Mevcut Karbon Ayak İzi</div>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#F87171', letterSpacing: '-1.5px', lineHeight: 1 }}>
                      {modelCResult.total_co2_tons.toFixed(2)}
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginLeft: '4px' }}>tCO₂e / Ay</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '14px', padding: '16px 20px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginBottom: '10px' }}>Ayıklanan Karbon Faaliyetleri</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {modelCResult.extracted_activities.map((act, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{act.item_type} ({act.category}):</span>
                          <span style={{ fontWeight: 700 }}>{act.amount} {act.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    padding: '12px 16px', borderRadius: '12px', background: 'rgba(59,130,246,0.08)',
                    border: '1px solid rgba(59,130,246,0.2)', fontSize: '11px', display: 'flex', gap: '8px', alignItems: 'center'
                  }}>
                    <Info size={14} color="#60A5FA" />
                    <span style={{ color: '#93C5FD', fontWeight: 600 }}>Sonraki Adım: Finansman talebi ve derecelendirme notunuzu belirleyin.</span>
                  </div>
                </motion.div>
              )}

              {/* Adım 2 Aktifse Rapor Görünümü (Karbon + Kredi Talebi) */}
              {currentStep === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Talep Edilen Kredi</div>
                      <div style={{ fontSize: '20px', fontWeight: 850 }}>{loanAmount.toLocaleString('tr-TR')} ₺</div>
                    </div>
                    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Risk Derecelendirmesi</div>
                      <div style={{ fontSize: '20px', fontWeight: 850, color: '#3B82F6' }}>{financialRating}</div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '14px', padding: '16px 20px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Karbon Ayak İziniz:</span>
                      <span style={{ fontWeight: 700 }}>{baselineEmission.toFixed(1)} tCO₂e</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Kredi Vadesi:</span>
                      <span style={{ fontWeight: 700 }}>{loanYears} Yıl</span>
                    </div>
                  </div>

                  <div style={{
                    padding: '12px 16px', borderRadius: '12px', background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.2)', fontSize: '11px', display: 'flex', gap: '8px', alignItems: 'center'
                  }}>
                    <Info size={14} color="#F59E0B" />
                    <span style={{ color: '#FDE047', fontWeight: 600 }}>Sonraki Adım: Planladığınız yeşil yatırımları ekleyerek kredi skorunuzu alın.</span>
                  </div>
                </motion.div>
              )}

              {/* Adım 3 Aktifse (Nihai Yeşil Kredi Raporu) */}
              {currentStep === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* KREDİ KARARI KARTI */}
                  <div style={{
                    background: decisionBg,
                    border: `1px solid ${decisionColor}44`,
                    padding: '14px 18px', borderRadius: '14px',
                    display: 'flex', alignItems: 'center', gap: '12px', position: 'relative'
                  }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px', background: decisionColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 0 10px ${decisionColor}aa`
                    }}>
                      <CheckCircle2 size={15} color="#0B1120" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase' }}>Kredi Karar Durumu</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: decisionColor }}>{decision}</div>
                    </div>
                  </div>

                  {/* Hata veya Risk Bildirimi */}
                  {loanAmount > totalCapex && (
                    <div style={{
                      background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                      padding: '10px 14px', borderRadius: '10px', display: 'flex', gap: '8px', alignItems: 'center',
                      fontSize: '11.5px', color: '#FCA5A5', fontWeight: 600
                    }}>
                      <AlertCircle size={14} />
                      {creditWarning} (-20 Puan Ceza)
                    </div>
                  )}

                  {/* KREDİ SKORU VE FAİZ İNDİRİMİ */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '14px', padding: '14px 18px', display: 'flex', flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                        YEŞİL KREDİ SKORU
                      </span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                        <span style={{ fontSize: '36px', fontWeight: 900, color: decisionColor, letterSpacing: '-1.5px', lineHeight: 1 }}>
                          {greenCreditScore}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>/ 100</span>
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '14px', padding: '14px 18px', display: 'flex', flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                        FAİZ AVANTAJI
                      </span>
                      <div style={{ display: 'flex', alignItems: 'baseline', color: '#D4AF37' }}>
                        <span style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1 }}>
                          -%{discountPct.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PUAN KIRILIM ÇUBUKLARI */}
                  <div style={{ 
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '14px', padding: '16px 20px'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* 1. Finansal Sağlık */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', fontWeight: 600 }}>
                          <span>Finansal Sağlık Notu ({financialRating})</span>
                          <span>{financialScore.toFixed(0)} / 40</span>
                        </div>
                        <div style={{ height: '3.5px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(financialScore / 40) * 100}%`, background: '#3B82F6' }} />
                        </div>
                      </div>

                      {/* 2. Ekolojik Azaltım */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', fontWeight: 600 }}>
                          <span>Ekolojik Azaltım Oranı</span>
                          <span>{environmentalScore.toFixed(1)} / 40</span>
                        </div>
                        <div style={{ height: '3.5px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(environmentalScore / 40) * 100}%`, background: '#10B981' }} />
                        </div>
                      </div>

                      {/* 3. Vade Nakit Akışı */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', fontWeight: 600 }}>
                          <span>Vade & g-ROI Nakit Uyumu</span>
                          <span>{cashFlowScore.toFixed(1)} / 20</span>
                        </div>
                        <div style={{ height: '3.5px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(cashFlowScore / 20) * 100}%`, background: '#F59E0B' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FİNANSMAN ORANLARI VE ÖZKAYNAK */}
                  {totalCapex > 0 && (
                    <div style={{
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '14px', padding: '14px 18px', fontSize: '11.5px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Toplam Yeşil CAPEX:</span>
                        <span style={{ fontWeight: 700 }}>{totalCapex.toLocaleString('tr-TR')} ₺</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Kredi Oranı (Finansman):</span>
                        <span style={{ fontWeight: 700, color: '#3B82F6' }}>%{Math.min(100, Math.round(ltvRatio)) } ({loanAmount.toLocaleString('tr-TR')} ₺)</span>
                      </div>
                      {loanAmount <= totalCapex && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Şirket Özkaynak Katkısı:</span>
                          <span style={{ fontWeight: 700, color: '#10B981' }}>%{Math.round(equityRatio)}% ({(totalCapex - loanAmount).toLocaleString('tr-TR')} ₺)</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ÇEVRESEL VE FİNANSAL DETAY KARTLARI */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '11.5px' }}>
                    {/* Karbon */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '14px', padding: '12px 14px' }}>
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Karbon Farkı</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Eski:</span>
                        <span>{baselineEmission.toFixed(1)} t</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Yeni:</span>
                        <span style={{ color: '#10B981', fontWeight: 700 }}>{newEmission.toFixed(1)} t</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Azaltım:</span>
                        <span style={{ color: '#10B981', fontWeight: 700 }}>-%{reductionPct.toFixed(0)}%</span>
                      </div>
                    </div>

                    {/* Finansal */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '14px', padding: '12px 14px' }}>
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Finansal Kazanç</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Aylık Tasarruf:</span>
                        <span style={{ color: '#10B981', fontWeight: 700 }}>{Math.round(annualOpexSavings / 12).toLocaleString('tr-TR')} ₺</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>g-ROI Geri Dönüş:</span>
                        <span style={{ color: '#D4AF37', fontWeight: 700 }}>{totalCapex > 0 ? `${groiPayback.toFixed(1)} Yıl` : '0 Yıl'}</span>
                      </div>
                    </div>
                  </div>

                  {/* DENETİM İZİ / AUDIT TRAIL */}
                  <div style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '12px', padding: '12px 16px', fontSize: '10.5px', display: 'flex', flexDirection: 'column', gap: '4px'
                  }}>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Info size={11} /> Kredi Skor Analiz Detayları
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', opacity: 0.8, fontFamily: 'monospace' }}>
                      <div>[FINANSAL] Not: {financialRating} -&gt; Puan: {financialScore.toFixed(0)} / 40.0</div>
                      <div>[EKOLOJIK] Azaltım: {carbonReduction.toFixed(1)} tCO2e -&gt; Puan: {environmentalScore.toFixed(1)} / 40.0</div>
                      <div>[VADE] Vade: {loanYears} yıl / g-ROI: {totalCapex > 0 ? `${groiPayback.toFixed(1)} yıl` : 'N/A'} -&gt; Puan: {cashFlowScore.toFixed(0)} / 20.0</div>
                      {financialModifier !== 0.0 && (
                        <div style={{ color: financialModifier > 0 ? '#10B981' : '#F87171' }}>
                          [FINANSAL ETKEN] Modifikatör: {financialModifier > 0 ? '+' : ''}{financialModifier.toFixed(0)} Puan
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TEKNİK NOT FOOTER */}
                  <div style={{
                    padding: '10px 14px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)',
                    display: 'flex', gap: '8px', alignItems: 'flex-start'
                  }}>
                    <Info size={11} color="rgba(255,255,255,0.3)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.4', fontWeight: 500 }}>
                      <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Teknik Not:</strong> Bu sayfa Model C ve deterministik hesap motoruyla çalışır; kullanılan faktör sürümü sonuçlarla birlikte izlenmelidir.
                    </div>
                  </div>

                </motion.div>
              )}

            </>
          )}

        </motion.div>

      </div>

    </motion.div>
  );
};

export default Simulator;
