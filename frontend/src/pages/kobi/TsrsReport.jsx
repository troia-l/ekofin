import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, QrCode, CheckCircle, FileText, ShieldCheck, 
  Copy, Check, RefreshCw, Sparkles, Building, Globe, 
  Calendar, Cpu, Award, ChevronDown, ChevronUp, AlertCircle,
  ExternalLink, Lock, CheckCircle2
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 15 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } }
};

const TsrsReport = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  const hashID = "0x8f4b2c1d9a7e635489b0cf34d2a1b9e84cd54ef92a0134f7b2c9f8021d7b322a";

  const handleExport = () => {
    setIsExporting(true);
    setExportProgress(0);
  };

  useEffect(() => {
    let interval;
    if (isExporting && exportProgress < 100) {
      interval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsExporting(false);
              setExportProgress(0);
            }, 1500);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isExporting, exportProgress]);

  const handleVerify = () => {
    setIsVerifying(true);
    setVerificationSuccess(false);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationSuccess(true);
    }, 1500);
  };

  const copyHash = () => {
    navigator.clipboard.writeText(hashID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const tabs = [
    { id: 'summary', name: 'Yönetici Özeti' },
    { id: 'tsrs1', name: 'TSRS-1 Genel' },
    { id: 'tsrs2', name: 'TSRS-2 İklim' },
    { id: 'emissions', name: 'Emisyon & Detay' }
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex-col gap-6">
      
      {/* Header & Main Actions */}
      <motion.div variants={itemVariants} className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">TSRS Raporlama ve Yeşil Kredi Pasaportu</h1>
          <p className="page-subtitle">Bağımsız denetime hazır, blockchain tabanlı ve kriptografik onaylı kurumsal sürdürülebilirlik belgeniz.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* PDF Export Button with Simulated Progress */}
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            className="btn-primary" 
            onClick={handleExport}
            disabled={isExporting}
            style={{ 
              padding: '12px 24px', 
              fontSize: '15px',
              position: 'relative',
              overflow: 'hidden',
              minWidth: '220px',
              justifyContent: 'center'
            }}
          >
            {isExporting ? (
              <span className="flex items-center gap-2">
                <RefreshCw size={16} className="animate-spin" />
                Rapor Üretiliyor (%{exportProgress})
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Download size={18} /> Resmi Dışa Aktar (PDF)
              </span>
            )}
            
            {isExporting && (
              <motion.div 
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  height: '4px',
                  background: 'var(--accent-gold)',
                  width: `${exportProgress}%`
                }}
              />
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Export Success Banner */}
      <AnimatePresence>
        {isExporting && exportProgress === 100 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              color: 'var(--accent-emerald-dark)', 
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '16px 24px',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <CheckCircle size={20} color="var(--accent-emerald)" />
            TSRS Raporu başarıyla derlendi ve imzalı resmi PDF olarak indirildi. (SHA-256 doğrulandı)
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '32px' }}>
        
        {/* Left Column: Report Preview Card */}
        <div className="flex-col gap-6">
          {/* Navigation Tabs */}
          <motion.div variants={itemVariants} className="flex gap-2" style={{ background: 'rgba(0,0,0,0.03)', padding: '6px', borderRadius: '14px', width: 'fit-content' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === tab.id ? 'white' : 'transparent',
                  color: activeTab === tab.id ? 'var(--primary-midnight)' : 'var(--text-muted)',
                  boxShadow: activeTab === tab.id ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.name}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTabUnderline"
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: '20%',
                      right: '20%',
                      height: '2px',
                      background: 'var(--accent-emerald)',
                      borderRadius: '2px'
                    }}
                  />
                )}
              </button>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="card glass-panel" style={{ minHeight: '620px', background: 'var(--bg-card)', padding: '40px', boxShadow: 'var(--shadow-premium-card)' }}>
            
            {/* Document Header Mockup */}
            <div className="flex justify-between items-end" style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '24px', marginBottom: '32px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-emerald)', letterSpacing: '2.5px', marginBottom: '8px', textTransform: 'uppercase' }}>Resmi Uyum Belgesi</div>
                <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--primary-midnight)', letterSpacing: '-0.5px' }}>
                  TSRS Sürdürülebilirlik Beyanı
                </h2>
              </div>
              <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                <div style={{ marginBottom: '4px' }}>Dönem: <strong style={{ color: 'var(--primary-midnight)' }}>2026 / Yıllık</strong></div>
                <div>Yayın: <strong style={{ color: 'var(--primary-midnight)' }}>23 Mayıs 2026</strong></div>
              </div>
            </div>

            {/* Dynamic Content Sections based on Active Tab */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--text-main)' }}
              >
                {activeTab === 'summary' && (
                  <div className="flex-col gap-6">
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-midnight)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building size={18} color="var(--accent-emerald)" /> 1. Yönetici Özeti ve Kurumsal Profil
                      </h3>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                        Bu rapor, Kamu Gözetimi Kurumu (KGK) tarafından yayınlanan Türkiye Sürdürülebilirlik Raporlama Standartları (TSRS) ile tam uyumlu olarak üretilmiştir. Entegre edilen ERP, e-Defter ve fatura verileri yapay zeka denetim algoritmalarımız tarafından doğrulanarak güvenli bir veri tabanı oluşturulmuştur.
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', margin: '12px 0' }}>
                      <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>ESG Derecesi</div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-emerald)' }}>A+</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>Çok Yüksek Uyum</div>
                      </div>
                      
                      <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Karbon Yoğunluğu</div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary-midnight)' }}>-%24</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>Yıllık Değişim</div>
                      </div>
                      
                      <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Kredi Skoru</div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-gold)' }}>94/100</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>Yeşil Fonlama Limiti</div>
                      </div>
                    </div>

                    <div style={{ borderLeft: '3px solid var(--accent-emerald)', paddingLeft: '16px', margin: '16px 0', background: 'rgba(16, 185, 129, 0.03)', padding: '16px', borderRadius: '0 12px 12px 0' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary-midnight)', display: 'block', marginBottom: '6px' }}>Kritik Beyan:</span>
                      Şirketin doğrudan operasyonel emisyonları (Kapsam 1) ve satın alınan enerji kaynaklı dolaylı emisyonları (Kapsam 2) son 12 ayda planlanan azaltım rotasına uygun ilerleme göstermiştir.
                    </div>
                  </div>
                )}

                {activeTab === 'tsrs1' && (
                  <div className="flex-col gap-6">
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-midnight)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={18} color="var(--accent-emerald)" /> TSRS-1 Sürdürülebilirlikle İlgili Finansal Bilgilerin Açıklanmasına İlişkin Genel Hükümler
                      </h3>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                        TSRS 1 standardı kapsamında, şirketin karşı karşıya olduğu sürdürülebilirlikle ilgili risklerin ve fırsatların yatırımcı kararlarını nasıl etkilediği beyan edilmiştir.
                      </p>
                    </div>

                    <div className="flex-col gap-4">
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <CheckCircle size={20} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong style={{ color: 'var(--primary-midnight)' }}>Yönetişim Yapısı:</strong>
                          <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '13px' }}>Yönetim Kurulu düzeyinde Sürdürülebilirlik Komitesi kurulmuş olup aylık denetimler yapılmaktadır.</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <CheckCircle size={20} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong style={{ color: 'var(--primary-midnight)' }}>Stratejik Karar Mekanizmaları:</strong>
                          <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '13px' }}>Sürdürülebilirlik riskleri şirketin genel risk yönetim matrisine %100 oranında entegre edilmiştir.</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <CheckCircle size={20} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong style={{ color: 'var(--primary-midnight)' }}>Finansal Planlama Uyum Matrisi:</strong>
                          <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '13px' }}>Sürdürülebilirlik hedefleri, şirketin 3 ve 5 yıllık bütçe planlamalarına yansıtılmıştır.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'tsrs2' && (
                  <div className="flex-col gap-6">
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-midnight)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Globe size={18} color="var(--accent-emerald)" /> TSRS-2 İklim Değişikliği Standartları ve Risk Yönetimi
                      </h3>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                        İklim değişikliği kaynaklı geçiş riskleri (karbon vergileri, piyasa dönüşümleri) ve fiziksel riskler (ekstrem hava olayları) senaryo analizleri ile modellendirilmiştir.
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '12px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '14px', marginBottom: '8px' }}>Geçiş Riskleri (Transition Risks)</div>
                        <ul style={{ paddingLeft: '16px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <li>Sınırda Karbon Düzenleme Mekanizması (SKDM) maliyet artışları.</li>
                          <li>Fosil yakıt bazlı lojistik tedarik zinciri kısıtlamaları.</li>
                        </ul>
                      </div>
                      
                      <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--accent-emerald-dark)', fontSize: '14px', marginBottom: '8px' }}>Yakaladığımız Fırsatlar</div>
                        <ul style={{ paddingLeft: '16px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <li>GES kurulumu ile elektrik giderlerinde %40 tasarruf beklentisi.</li>
                          <li>Düşük faizli yeşil kredi imkanlarına hızlı erişim yetkinliği.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'emissions' && (
                  <div className="flex-col gap-6">
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-midnight)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={18} color="var(--accent-emerald)" /> Kapsamlı Emisyon Dağılımı ve Doğrulama Raporu
                      </h3>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                        Şirketin GHG Protokolü standardına göre hesaplanan sera gazı emisyonlarının kategorik dökümü aşağıdaki gibidir.
                      </p>
                    </div>

                    <div style={{ background: 'var(--bg-main)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Emisyon Kaynağı</th>
                            <th style={{ textAlign: 'right', padding: '14px 20px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fiili Değer (tCO2e)</th>
                            <th style={{ textAlign: 'right', padding: '14px 20px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gelişim Raporu</th>
                            <th style={{ textAlign: 'center', padding: '14px 20px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Durum</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--primary-midnight)' }}>Kapsam 1 (Doğrudan Tesis)</td>
                            <td style={{ textAlign: 'right', padding: '16px 20px', fontWeight: 800, fontSize: '15px' }}>120.4</td>
                            <td style={{ textAlign: 'right', padding: '16px 20px', color: 'var(--accent-emerald-dark)', fontWeight: 600 }}>-%18</td>
                            <td style={{ textAlign: 'center', padding: '16px 20px' }}>
                              <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald-dark)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>ONAYLI</span>
                            </td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--primary-midnight)' }}>Kapsam 2 (Dolaylı Elektrik)</td>
                            <td style={{ textAlign: 'right', padding: '16px 20px', fontWeight: 800, fontSize: '15px' }}>85.2</td>
                            <td style={{ textAlign: 'right', padding: '16px 20px', color: 'var(--accent-emerald-dark)', fontWeight: 600 }}>-%31</td>
                            <td style={{ textAlign: 'center', padding: '16px 20px' }}>
                              <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald-dark)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>ONAYLI</span>
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--primary-midnight)' }}>Kapsam 3 (Değer Zinciri - Est.)</td>
                            <td style={{ textAlign: 'right', padding: '16px 20px', fontWeight: 800, fontSize: '15px' }}>340.5</td>
                            <td style={{ textAlign: 'right', padding: '16px 20px', color: 'var(--warning)', fontWeight: 600 }}>+%2</td>
                            <td style={{ textAlign: 'center', padding: '16px 20px' }}>
                              <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>HESAPLANDI</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Cryptographic Signature Box Mockup */}
            <div style={{ marginTop: 'auto', paddingTop: '32px', borderTop: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Dijital Blokzincir İmzası</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald-dark)', fontWeight: 700, fontSize: '13px' }}>
                  <Lock size={14} /> EcoFin AI - Akıllı Kontrat Güvenceli
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>
                <div>Sertifika Yetkilisi: KGK Bağımsız Denetçi Uyumlu</div>
                <div>Hash ID: {hashID.slice(0, 8)}...{hashID.slice(-8)}</div>
              </div>
            </div>

          </motion.div>
        </div>

        {/* Right Column: Passport & Audit */}
        <div className="flex-col gap-6">
          
          {/* Green Credit Passport - Premium Credit Card Design */}
          <motion.div 
            variants={itemVariants} 
            className="card"
            style={{ 
              background: 'linear-gradient(135deg, #022c22 0%, #111827 100%)', 
              color: 'white', 
              padding: '32px',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '340px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* Glowing background highlights */}
            <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)', borderRadius: '50%' }} />

            {/* Verification Radar Overlay */}
            <AnimatePresence>
              {isVerifying && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(2, 44, 34, 0.95)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    zIndex: 20,
                    borderRadius: '24px'
                  }}
                >
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  >
                    <RefreshCw size={40} color="var(--accent-gold)" />
                  </motion.div>
                  <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', color: 'white' }}>
                    Kriptografik İmza Denetleniyor...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-start" style={{ position: 'relative', zIndex: 5 }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px' }}>
                  <Cpu size={22} color="var(--accent-gold)" /> Yeşil Kredi Pasaportu
                </h3>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.5px' }}>ECOFIN VERIFIED ENTERPRISE</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <QrCode size={48} color="white" />
              </div>
            </div>

            <div style={{ margin: '24px 0', position: 'relative', zIndex: 5 }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '1px' }}>Kriptografik Doğrulama Kodu (Hash)</div>
              <div className="flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                  {hashID}
                </span>
                <motion.button 
                  onClick={copyHash}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ background: 'transparent', border: 'none', color: copied ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </motion.button>
              </div>
            </div>

            <div className="flex justify-between items-center" style={{ position: 'relative', zIndex: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', background: verificationSuccess ? 'var(--accent-emerald)' : 'var(--accent-gold)', borderRadius: '50%', boxShadow: `0 0 10px ${verificationSuccess ? 'var(--accent-emerald)' : 'var(--accent-gold)'}` }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                  {verificationSuccess ? "İmza Geçerli (KGK Onaylı)" : "Pasaport Aktif"}
                </span>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                onClick={handleVerify}
                style={{ 
                  background: 'linear-gradient(135deg, var(--accent-gold), #B8901C)', 
                  border: 'none', 
                  color: 'var(--primary-midnight)', 
                  padding: '8px 16px', 
                  borderRadius: '10px', 
                  fontSize: '12px', 
                  fontWeight: 800,
                  boxShadow: '0 4px 10px rgba(212, 175, 55, 0.25)'
                }}
              >
                İmza Doğrula
              </motion.button>
            </div>
          </motion.div>

          {/* Denetim ve Güvence Durumu - Collapsible List */}
          <motion.div variants={itemVariants} className="card glass-panel" style={{ padding: '32px' }}>
            <h4 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary-midnight)' }}>
              <ShieldCheck size={20} color="var(--accent-emerald)" />
              Denetim ve Güvence Durumu
            </h4>

            <div className="flex-col" style={{ gap: '16px' }}>
              
              {/* Checklist Item 1 */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                <button 
                  onClick={() => toggleSection('section1')}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-midnight)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    TSRS-1 Genel Hükümler
                  </span>
                  {expandedSection === 'section1' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <AnimatePresence>
                  {expandedSection === 'section1' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 16px 16px 16px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', background: 'var(--bg-main)' }}>
                        <div style={{ marginBottom: '8px' }}><strong>Denetim Standardı:</strong> KGK TSRS-1 Genel İlkeleri</div>
                        <div style={{ marginBottom: '8px' }}><strong>Doğrulama Kaynağı:</strong> Şirket Beyannamesi & Yönetici Karar Defterleri</div>
                        <div><strong>Son Kontrol:</strong> 23.05.2026 14:32 (EcoFin AI Entegrasyonu ile)</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Checklist Item 2 */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                <button 
                  onClick={() => toggleSection('section2')}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-midnight)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    TSRS-2 İklim Riskleri
                  </span>
                  {expandedSection === 'section2' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <AnimatePresence>
                  {expandedSection === 'section2' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 16px 16px 16px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', background: 'var(--bg-main)' }}>
                        <div style={{ marginBottom: '8px' }}><strong>Denetim Standardı:</strong> KGK TSRS-2 İklim ve Risk Beyanları</div>
                        <div style={{ marginBottom: '8px' }}><strong>Doğrulama Kaynağı:</strong> IoT Enerji Analizörleri & Elektrik Faturaları (e-Fatura Entegre)</div>
                        <div><strong>Son Kontrol:</strong> 23.05.2026 14:32</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Checklist Item 3 */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                <button 
                  onClick={() => toggleSection('section3')}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-midnight)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    Sektörel Limit Uyumu
                  </span>
                  {expandedSection === 'section3' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <AnimatePresence>
                  {expandedSection === 'section3' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 16px 16px 16px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', background: 'var(--bg-main)' }}>
                        <div style={{ marginBottom: '8px' }}><strong>Denetim Standardı:</strong> İlgili NACE Kodu Sektör Limit Kıyaslamaları</div>
                        <div style={{ marginBottom: '8px' }}><strong>Doğrulama Kaynağı:</strong> EcoFin Sektörel Kıyaslama Algoritması</div>
                        <div><strong>Son Kontrol:</strong> 23.05.2026 14:32</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
};

export default TsrsReport;
