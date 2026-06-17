import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShieldAlert, TrendingDown, CheckCircle, AlertTriangle, 
  Building2, Zap, Check, X, RefreshCw, Sparkles, Cpu, Award, 
  FileText, ChevronRight, Info, Lock, ShieldCheck, HelpCircle
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 15 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } }
};

const mockCompanies = {
  "1234567890": {
    name: "Güneş Plastik San. A.Ş.",
    vkn: "1234567890",
    nace: "22.21.04",
    scale: "Orta Boy (KOBİ)",
    sectorRank: "%15 (En İyi Dilim)",
    esgScore: 88,
    esgGrade: "A+",
    riskLevel: "DÜŞÜK",
    riskClass: "low-risk",
    riskColor: "var(--accent-emerald-dark)",
    riskBg: "rgba(16, 185, 129, 0.05)",
    riskBorder: "rgba(16, 185, 129, 0.2)",
    discount: "-2.5%",
    maxLimit: "5.000.000 ₺",
    comment: "Firma, TSRS standartlarında beyan ettiği sera gazı emisyon azaltım hedeflerini (Kapsam 1) son çeyrek e-Fatura elektrik tüketim verileri ile matematiksel olarak kanıtlamıştır. Model C tahmini uyarınca, alınacak kredi tamamen yeşil dönüşüme (GES kurulumu) gidecek olup g-ROI 3.2 yıl hesaplanmıştır. Kredi tahsisi yeşil portföy kotasından güvenle yapılabilir.",
    greenwashingScore: "%98 Fatura Eşleşmesi",
    checklist: [
      { name: "TSRS-1 Genel Hükümler", status: "compliant" },
      { name: "TSRS-2 İklim Riskleri", status: "compliant" },
      { name: "e-Defter & ERP Eşleşmesi", status: "compliant" }
    ]
  },
  "9876543210": {
    name: "Atlas Lojistik Ltd. Şti.",
    vkn: "9876543210",
    nace: "49.41.01",
    scale: "Küçük Boy (KOBİ)",
    sectorRank: "%42 (Ortalama Dilim)",
    esgScore: 68,
    esgGrade: "B",
    riskLevel: "ORTA",
    riskClass: "medium-risk",
    riskColor: "var(--warning)",
    riskBg: "rgba(245, 158, 11, 0.05)",
    riskBorder: "rgba(245, 158, 11, 0.2)",
    discount: "-1.0%",
    maxLimit: "2.500.000 ₺",
    comment: "Firma filosunu elektrikli araçlara dönüştürmek amacıyla kredi talebinde bulunmuştur. Ancak e-Defter yakıt giderleri faturaları ile Kapsam 1 doğrudan emisyon beyanları arasında %28 oranında veri uyuşmazlığı saptanmıştır. Limit onaylanabilir fakat faiz indirim oranı oransal olarak sınırlandırılmıştır.",
    greenwashingScore: "%72 Fatura Eşleşmesi (Scope 3 Yakıt Eksik)",
    checklist: [
      { name: "TSRS-1 Genel Hükümler", status: "compliant" },
      { name: "TSRS-2 İklim Riskleri", status: "partial" },
      { name: "e-Defter & ERP Eşleşmesi", status: "warning" }
    ]
  },
  "1122334455": {
    name: "Karbon Kimya A.Ş.",
    vkn: "1122334455",
    nace: "20.13.01",
    scale: "Orta Boy (KOBİ)",
    sectorRank: "%88 (Kötü Dilim)",
    esgScore: 32,
    esgGrade: "E",
    riskLevel: "YÜKSEK",
    riskClass: "high-risk",
    riskColor: "var(--danger)",
    riskBg: "rgba(239, 68, 68, 0.05)",
    riskBorder: "rgba(239, 68, 68, 0.2)",
    discount: "%0 (Kapsam Dışı)",
    maxLimit: "0 ₺ (Onaylanamaz)",
    comment: "Firma beyanları ile e-Defter enerji faturaları arasında tutarsızlık tespit edilmiştir. Yeşil dönüşüm yatırımlarının (Capex) izlenebilirliği şüphelidir. Yeşil kredi kullandırılması bankamızın yeşil tahvil fonu kuralları gereği uygun değildir.",
    greenwashingScore: "%40 Fatura Eşleşmesi (Veri Sapması)",
    checklist: [
      { name: "TSRS-1 Genel Hükümler", status: "non-compliant" },
      { name: "TSRS-2 İklim Riskleri", status: "non-compliant" },
      { name: "e-Defter & ERP Eşleşmesi", status: "non-compliant" }
    ]
  }
};

const BankDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('1234567890');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState(0);
  const [activeCompany, setActiveCompany] = useState(mockCompanies["1234567890"]);
  const [showResult, setShowResult] = useState(true);
  const [decision, setDecision] = useState(null); // 'approved', 'rejected'

  const searchStepsText = [
    "VKN ve e-Fatura kayıtları taranıyor...",
    "e-Defter veri bütünlüğü doğrulanıyor...",
    "TSRS-1 & TSRS-2 emisyon beyanları karşılaştırılıyor...",
    "NLP Greenwashing risk analizi tamamlanıyor..."
  ];

  const handleSearch = () => {
    if (!mockCompanies[searchTerm]) {
      alert("Lütfen geçerli bir mock VKN girin veya hızlı seçim kartlarını kullanın: 1234567890, 9876543210, 1122334455");
      return;
    }
    
    setIsSearching(true);
    setSearchStep(0);
    setShowResult(false);
    setDecision(null);
  };

  useEffect(() => {
    let interval;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchStep(prev => {
          if (prev >= 3) {
            clearInterval(interval);
            setTimeout(() => {
              setIsSearching(false);
              setActiveCompany(mockCompanies[searchTerm]);
              setShowResult(true);
            }, 500);
            return 3;
          }
          return prev + 1;
        });
      }, 400);
    }
    return () => clearInterval(interval);
  }, [isSearching, searchTerm]);

  const selectCompany = (vkn) => {
    setSearchTerm(vkn);
    setIsSearching(true);
    setSearchStep(0);
    setShowResult(false);
    setDecision(null);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex-col gap-6">
      
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="page-title">Banka Kredi Tahsis ve Yeşil Finansman Analitiği</h1>
        <p className="page-subtitle">KOBİ'lerin yeşil dönüşüm beyanlarını, e-Defter entegrasyonu ve yapay zeka denetimiyle saniyeler içinde doğrulayın.</p>
      </motion.div>

      {/* Quick Selection Cards */}
      <motion.div variants={itemVariants} className="flex-col gap-2">
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>HIZLI ŞİRKET SEÇİMİ VE TEST SENARYOLARI</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          
          <div 
            onClick={() => selectCompany("1234567890")}
            style={{ 
              background: 'white', 
              padding: '16px', 
              borderRadius: '16px', 
              border: `1px solid ${searchTerm === '1234567890' ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: searchTerm === '1234567890' ? '0 4px 15px rgba(16,185,129,0.1)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-midnight)' }}>Güneş Plastik San. A.Ş.</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ESG: A+ | Risk: Düşük</div>
            </div>
            <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-emerald-dark)', padding: '4px 8px', borderRadius: '20px', fontWeight: 700 }}>GES Projesi</span>
          </div>

          <div 
            onClick={() => selectCompany("9876543210")}
            style={{ 
              background: 'white', 
              padding: '16px', 
              borderRadius: '16px', 
              border: `1px solid ${searchTerm === '9876543210' ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: searchTerm === '9876543210' ? '0 4px 15px rgba(16,185,129,0.1)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-midnight)' }}>Atlas Lojistik Ltd. Şti.</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ESG: B | Risk: Orta</div>
            </div>
            <span style={{ fontSize: '11px', background: 'rgba(245,158,11,0.1)', color: '#d97706', padding: '4px 8px', borderRadius: '20px', fontWeight: 700 }}>Araç Dönüşümü</span>
          </div>

          <div 
            onClick={() => selectCompany("1122334455")}
            style={{ 
              background: 'white', 
              padding: '16px', 
              borderRadius: '16px', 
              border: `1px solid ${searchTerm === '1122334455' ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: searchTerm === '1122334455' ? '0 4px 15px rgba(16,185,129,0.1)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-midnight)' }}>Karbon Kimya A.Ş.</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ESG: E | Risk: Yüksek</div>
            </div>
            <span style={{ fontSize: '11px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '4px 8px', borderRadius: '20px', fontWeight: 700 }}>Data Tutarsızlığı</span>
          </div>

        </div>
      </motion.div>

      {/* Search Input Card */}
      <motion.div variants={itemVariants} className="card glass-panel flex gap-4 items-center" style={{ padding: '20px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '20px', top: '16px' }} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="KOBİ Vergi Kimlik No (VKN) veya EkoFin ID girin (Örn: 1234567890)"
            style={{ 
              width: '100%', 
              padding: '16px 20px 16px 56px', 
              borderRadius: '12px', 
              border: '2px solid var(--border-color)',
              fontSize: '16px',
              fontWeight: 500,
              background: 'var(--bg-main)',
              transition: 'all 0.3s',
              outline: 'none'
            }} 
          />
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          className="btn-primary" 
          onClick={handleSearch} 
          style={{ padding: '16px 40px', fontSize: '16px', borderRadius: '12px' }}
        >
          Analiz Et
        </motion.button>
      </motion.div>

      {/* Simulated Search Loading View */}
      <AnimatePresence>
        {isSearching && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="card glass-panel flex-col items-center justify-center"
            style={{ minHeight: '380px', padding: '40px', gap: '24px' }}
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              style={{ display: 'inline-block' }}
            >
              <RefreshCw size={48} color="var(--accent-emerald)" />
            </motion.div>
            
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-midnight)', marginBottom: '8px' }}>Yapay Zeka Analiz Motoru Devrede</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {searchStepsText[searchStep]}
              </p>
            </div>
            
            {/* Progress indicators */}
            <div style={{ display: 'flex', gap: '8px', width: '200px' }}>
              {[0, 1, 2, 3].map((step) => (
                <div 
                  key={step}
                  style={{ 
                    flex: 1, 
                    height: '4px', 
                    borderRadius: '2px', 
                    background: step <= searchStep ? 'var(--accent-emerald)' : 'var(--border-color)',
                    transition: 'background-color 0.2s ease'
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Analysis Results */}
      <AnimatePresence>
        {showResult && activeCompany && !isSearching && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: '32px' }}
          >
            {/* Left Column: Company Profile & Verification checklist */}
            <div className="flex-col gap-6">
              
              {/* Profile Card */}
              <div className="card glass-panel" style={{ position: 'relative', overflow: 'hidden', padding: '32px' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, var(--primary-midnight), var(--accent-emerald))' }}></div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="icon-3d" style={{ background: 'linear-gradient(135deg, var(--primary-midnight), var(--secondary-midnight))', flexShrink: 0 }}>
                    <Building2 color="white" size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: '2px', textTransform: 'uppercase' }}>Firma Detayları</div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-midnight)', lineHeight: '1.2' }}>{activeCompany.name}</h2>
                  </div>
                </div>
                
                <div className="flex-col gap-4" style={{ fontSize: '14px', background: 'var(--bg-main)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <div className="flex justify-between" style={{ borderBottom: '1px dashed var(--border-color)', paddingBottom: '10px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>VKN</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-midnight)', fontFamily: 'monospace' }}>{activeCompany.vkn}</span>
                  </div>
                  <div className="flex justify-between" style={{ borderBottom: '1px dashed var(--border-color)', paddingBottom: '10px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>NACE Kodu</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-midnight)' }}>{activeCompany.nace}</span>
                  </div>
                  <div className="flex justify-between" style={{ borderBottom: '1px dashed var(--border-color)', paddingBottom: '10px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Ölçek Sınıfı</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-midnight)' }}>{activeCompany.scale}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Sektör Sıralaması</span>
                    <span style={{ fontWeight: 800, color: activeCompany.esgScore > 50 ? 'var(--accent-emerald-dark)' : 'var(--danger)' }}>{activeCompany.sectorRank}</span>
                  </div>
                </div>
              </div>

              {/* Greenwashing Risk Card */}
              <div 
                className="card glass-panel" 
                style={{ 
                  background: activeCompany.riskLevel === 'DÜŞÜK' ? 'rgba(16, 185, 129, 0.03)' : activeCompany.riskLevel === 'ORTA' ? 'rgba(245, 158, 11, 0.03)' : 'rgba(239, 68, 68, 0.03)',
                  border: `1px solid ${activeCompany.riskLevel === 'DÜŞÜK' ? 'rgba(16, 185, 129, 0.2)' : activeCompany.riskLevel === 'ORTA' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                  padding: '24px'
                }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div style={{ 
                    background: 'white', 
                    padding: '8px', 
                    borderRadius: '50%', 
                    boxShadow: `0 2px 4px rgba(0,0,0,0.03)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {activeCompany.riskLevel === 'DÜŞÜK' ? (
                      <ShieldCheck size={20} color="var(--accent-emerald)" />
                    ) : activeCompany.riskLevel === 'ORTA' ? (
                      <AlertTriangle size={20} color="var(--warning)" />
                    ) : (
                      <ShieldAlert size={20} color="var(--danger)" />
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-midnight)' }}>Greenwashing Risk Analizi</h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 700 }}>NLP & FATURA KONTROLÜ</span>
                  </div>
                </div>
                
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', fontWeight: 500, marginBottom: '12px' }}>
                  Sosyal medya yeşil beyanları ile resmi e-Defter/e-Fatura kayıtları karşılaştırma verisi:
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'white', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Tutarlılık:</span>
                  <span style={{ fontWeight: 800, color: activeCompany.riskColor }}>{activeCompany.greenwashingScore}</span>
                </div>
              </div>

            </div>

            {/* Right Column: Risk & Credit Committee Report */}
            <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '36px', position: 'relative' }}>
              
              {/* Decision Overlays */}
              <AnimatePresence>
                {decision === 'approved' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(255, 255, 255, 0.97)',
                      borderRadius: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 30,
                      padding: '40px',
                      textAlign: 'center',
                      gap: '20px'
                    }}
                  >
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '24px', borderRadius: '50%' }}>
                      <CheckCircle size={56} color="var(--accent-emerald)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-midnight)', marginBottom: '8px' }}>Yeşil Kredi Onaylandı!</h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 16px auto', lineHeight: '1.6' }}>
                        Şirket yeşil portföy tahsis şartlarını tamamlamıştır. Faiz indirimi sisteme tanımlandı ve akıllı kontrat blockchain imzası oluşturuldu.
                      </p>
                      <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-light)', border: '1px solid var(--border-color)' }}>
                        Tx Hash: 0x3e1d9a2c...b54a (Smart Contract Verified)
                      </div>
                    </div>
                    <button className="btn-outline" onClick={() => setDecision(null)} style={{ padding: '10px 24px', fontSize: '13px' }}>Geri Dön</button>
                  </motion.div>
                )}

                {decision === 'rejected' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(255, 255, 255, 0.97)',
                      borderRadius: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 30,
                      padding: '40px',
                      textAlign: 'center',
                      gap: '20px'
                    }}
                  >
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '24px', borderRadius: '50%' }}>
                      <X size={56} color="var(--danger)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-midnight)', marginBottom: '8px' }}>Tahsis Talebi Reddedildi</h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto', lineHeight: '1.6' }}>
                        Yeşil kredi talebi reddedilmiştir. Karar gerekçesi ve veri tutarsızlık raporu sistem üzerinden KOBİ portalına iletilmiştir.
                      </p>
                    </div>
                    <button className="btn-outline" onClick={() => setDecision(null)} style={{ padding: '10px 24px', fontSize: '13px' }}>Geri Dön</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Committee Title */}
              <div className="flex items-center gap-4 mb-6">
                <div className="icon-3d" style={{ background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-emerald-dark))', flexShrink: 0 }}>
                  <Zap color="white" size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-midnight)' }}>Tahsis Komitesi Özet Raporu</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 700 }}>OTOMATİK KARAR DESTEK SİSTEMİ</span>
                </div>
              </div>
              
              {/* Dynamic Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', marginBottom: '28px' }}>
                
                {/* ESG Score Gauge */}
                <div style={{ padding: '20px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 800, letterSpacing: '0.5px' }}>DİJİTAL GÜVENCE ESG SKORU</div>
                  <div style={{ fontSize: '44px', fontWeight: 800, color: 'var(--primary-midnight)', letterSpacing: '-1px', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                    {activeCompany.esgScore} <span style={{ fontSize: '20px', color: 'var(--text-muted)', fontWeight: 600 }}>/100</span>
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: activeCompany.esgScore > 50 ? 'var(--accent-emerald-dark)' : 'var(--danger)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '4px', 
                    marginTop: '8px', 
                    fontWeight: 700 
                  }}>
                    <Award size={14}/> Sınıfı: {activeCompany.esgGrade}
                  </div>
                </div>
                
                {/* Discount Card */}
                <div style={{ 
                  padding: '20px', 
                  background: activeCompany.esgScore > 50 ? 'linear-gradient(135deg, var(--accent-emerald-light), #dcfce7)' : 'rgba(0, 0, 0, 0.03)', 
                  borderRadius: '16px', 
                  border: `1px solid ${activeCompany.esgScore > 50 ? '#86efac' : 'var(--border-color)'}`, 
                  textAlign: 'center', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '11px', color: activeCompany.esgScore > 50 ? 'var(--accent-emerald-dark)' : 'var(--text-muted)', marginBottom: '8px', fontWeight: 800, letterSpacing: '0.5px' }}>ÖNERİLEN FAİZ İNDİRİMİ</div>
                  <div style={{ fontSize: '44px', fontWeight: 800, color: activeCompany.esgScore > 50 ? 'var(--accent-emerald-dark)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', letterSpacing: '-1px' }}>
                    {activeCompany.esgScore > 50 && <TrendingDown size={28} />} {activeCompany.discount}
                  </div>
                  <div style={{ fontSize: '12px', color: activeCompany.esgScore > 50 ? '#065f46' : 'var(--text-light)', marginTop: '8px', fontWeight: 700 }}>
                    Tahsis Üst Limiti: {activeCompany.maxLimit}
                  </div>
                </div>
              </div>

              {/* Verification Checklist */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '12px', letterSpacing: '0.5px' }}>STANDART UYUM KONTROLLERİ</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {activeCompany.checklist.map((item, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        padding: '12px', 
                        background: 'white', 
                        borderRadius: '12px', 
                        border: '1px solid var(--border-color)',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        textAlign: 'center'
                      }}
                    >
                      {item.status === 'compliant' ? (
                        <CheckCircle size={16} color="var(--accent-emerald)" />
                      ) : item.status === 'partial' || item.status === 'warning' ? (
                        <AlertTriangle size={16} color="var(--warning)" />
                      ) : (
                        <X size={16} color="var(--danger)" />
                      )}
                      <span style={{ color: 'var(--primary-midnight)' }}>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Opinion Comment Box */}
              <div style={{ padding: '20px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--primary-midnight)', marginBottom: '8px' }}>
                  <Sparkles size={16} color="var(--accent-emerald)" /> EkoFin Analist Yorumu
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.7', fontWeight: 500 }}>
                  {activeCompany.comment}
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end gap-4 mt-auto" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-outline" 
                  onClick={() => setDecision('rejected')} 
                  style={{ padding: '12px 32px' }}
                >
                  Talebi Reddet
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary" 
                  onClick={() => setDecision('approved')}
                  disabled={activeCompany.esgScore < 50}
                  style={{ 
                    padding: '12px 32px', 
                    boxShadow: activeCompany.esgScore >= 50 ? '0 4px 15px rgba(16,185,129,0.3)' : 'none',
                    opacity: activeCompany.esgScore >= 50 ? 1 : 0.5,
                    cursor: activeCompany.esgScore >= 50 ? 'pointer' : 'not-allowed',
                    background: activeCompany.esgScore >= 50 ? 'linear-gradient(135deg, var(--accent-emerald), var(--accent-emerald-dark))' : 'var(--text-light)'
                  }}
                >
                  Yeşil Krediyi Onayla
                </motion.button>
              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default BankDashboard;
