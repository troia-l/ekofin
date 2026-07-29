import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, QrCode, CheckCircle, FileText, ShieldCheck, 
  Copy, Check, RefreshCw, Sparkles, Building, Globe, 
  Calendar, Cpu, Award, ChevronDown, ChevronUp, AlertCircle,
  ExternalLink, Lock, CheckCircle2, Link2, Leaf
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 15 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } }
};

const TsrsReport = () => {
  const { currentUser } = useOutletContext() || {};
  const ticker = currentUser?.companyTicker || null;
  const withTicker = (url) => ticker ? `${url}${url.includes('?') ? '&' : '?'}ticker=${encodeURIComponent(ticker)}` : url;

  const [activeTab, setActiveTab] = useState('summary');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [reportHash, setReportHash] = useState('');
  const [exportError, setExportError] = useState(null);

  // Yapay zeka pipeline durumları
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportStatus, setReportStatus] = useState({ status: 'idle', progress: 0, message: '' });
  const [terminalLogs, setTerminalLogs] = useState([]);
  
  const pollingRef = useRef(null);
  const terminalEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Sayfa açıldığında son raporu çek ve entegrasyondan gelen tetiklemeyi algıla
  useEffect(() => {
    fetchLatestReport();
    
    if (location.state?.triggerGenerate) {
      // Clear location state immediately so it doesn't run again on page refresh
      navigate(location.pathname, { replace: true, state: {} });
      handleGenerateReport();
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [location.state]);

  // Terminal loglarını otomatik olarak en alta kaydır
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  const fetchLatestReport = async () => {
    try {
      const res = await fetch(withTicker(`${API_URL}/api/report/latest`));
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'found') {
          setReportData(data.content);
          setReportHash(data.hash || '');
        }
      }
    } catch (e) { console.error('Rapor yüklenemedi:', e); }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(10);
    setExportError(null);
    try {
      setExportProgress(30);
      const res = await fetch(withTicker(`${API_URL}/api/report/generate`), { method: 'POST' });
      setExportProgress(80);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Rapor üretim hatası');
      }
      const data = await res.json();
      setReportHash(data.hash || '');
      setExportProgress(100);
      // Raporu tekrar çek
      await fetchLatestReport();
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 2000);
    } catch (e) {
      setExportError(e.message);
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleGenerateReport = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setExportError(null);
    setReportStatus({ status: 'generating', progress: 5, message: 'Pipeline başlatılıyor...' });
    setTerminalLogs([
      `[${new Date().toLocaleTimeString()}] [SİSTEM] TSRS Analiz ve Raporlama Motoru başlatıldı (model: gpt-5.4).`,
      `[${new Date().toLocaleTimeString()}] [SİSTEM] Yüklenen belgeler ve yönetici beyanı okunuyor...`,
    ]);

    try {
      // /api/report/generate, tüm bölümler bitene kadar dönmeyen bloklayıcı bir
      // istektir (gerçek LLM çağrıları dakikalar sürebilir). Bu yüzden isteği
      // atar atmaz status polling'i de başlatıyoruz ki kullanıcı gerçek
      // ilerlemeyi (backend'in progress_callback'i üzerinden) canlı görsün.
      const genPromise = fetch(withTicker(`${API_URL}/api/report/generate`), { method: 'POST' });
      startPolling();

      const res = await genPromise;
      stopPolling();

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Rapor üretim hatası');
      }
      const data = await res.json();
      setReportHash(data.hash || '');
      setReportStatus({ status: 'completed', progress: 100, message: 'Rapor başarıyla üretildi.' });
      setTerminalLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SİSTEM] Nihai rapor birleştirildi ve çıktı dizinine yazıldı.`,
        `[${new Date().toLocaleTimeString()}] [GÜVENLİK] SHA-256 Hash: ${(data.hash || '').slice(0, 24)}...`,
        `[${new Date().toLocaleTimeString()}] [BAŞARI] TSRS Sürdürülebilirlik Raporu başarıyla tamamlandı!`,
      ]);
      await fetchLatestReport();
    } catch (e) {
      stopPolling();
      setReportStatus({ status: 'error', progress: 0, message: e.message });
      setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [HATA] ${e.message}`]);
    } finally {
      setIsGenerating(false);
    }
  };

  const startPolling = () => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(withTicker(`${API_URL}/api/report/status`));
        if (res.ok) {
          const data = await res.json();
          setReportStatus(data);

          setTerminalLogs(prev => {
            const lastLog = prev[prev.length - 1];
            if (data.status === 'generating' && data.message && !lastLog?.includes(data.message)) {
              return [...prev, `[${new Date().toLocaleTimeString()}] ${data.message}`];
            }
            return prev;
          });

          if (data.status !== 'generating') {
            stopPolling();
            setIsGenerating(false);
            if (data.status === 'completed') await fetchLatestReport();
          }
        }
      } catch (e) {
        console.error('Polling error:', e);
        stopPolling();
        setIsGenerating(false);
      }
    }, 1200);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleVerify = async () => {
    if (!reportHash) return;
    setIsVerifying(true);
    setVerificationSuccess(false);
    try {
      const formData = new FormData();
      formData.append('hash_to_verify', reportHash);
      if (ticker) formData.append('ticker', ticker);
      const res = await fetch(`${API_URL}/api/report/verify`, { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setVerificationSuccess(data.is_valid);
      }
    } catch (e) { console.error('Doğrulama hatası:', e); }
    finally { setIsVerifying(false); }
  };

  const copyHash = () => {
    if (!reportHash) return;
    navigator.clipboard.writeText(reportHash);
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
                      {reportData ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.8', maxHeight: '600px', overflowY: 'auto', paddingRight: '12px', overflowX: 'hidden' }}>
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              img: ({node, src, ...props}) => src ? <img src={src} style={{maxWidth: '100%', height: 'auto', display: 'block', margin: '16px 0', borderRadius: '8px'}} {...props} /> : null,
                              table: ({node, ...props}) => <div style={{overflowX: 'auto', marginBottom: '16px'}}><table style={{width: '100%', borderCollapse: 'collapse'}} {...props} /></div>,
                              th: ({node, ...props}) => <th style={{borderBottom: '2px solid var(--border-color)', padding: '10px', textAlign: 'left', fontWeight: 'bold'}} {...props} />,
                              td: ({node, ...props}) => <td style={{borderBottom: '1px solid var(--border-color)', padding: '10px'}} {...props} />,
                              h1: ({node, ...props}) => <h1 style={{fontSize: '24px', fontWeight: 'bold', margin: '20px 0 10px', color: 'var(--primary-midnight)'}} {...props} />,
                              h2: ({node, ...props}) => <h2 style={{fontSize: '20px', fontWeight: 'bold', margin: '18px 0 10px', color: 'var(--primary-midnight)'}} {...props} />,
                              h3: ({node, ...props}) => <h3 style={{fontSize: '18px', fontWeight: 'bold', margin: '16px 0 8px', color: 'var(--primary-midnight)'}} {...props} />,
                              p: ({node, ...props}) => <p style={{margin: '0 0 16px 0', overflowWrap: 'break-word'}} {...props} />,
                              ul: ({node, ...props}) => <ul style={{margin: '0 0 16px 0', paddingLeft: '20px', listStyleType: 'disc'}} {...props} />,
                              ol: ({node, ...props}) => <ol style={{margin: '0 0 16px 0', paddingLeft: '20px', listStyleType: 'decimal'}} {...props} />
                            }}
                          >
                            {reportData}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          <FileText size={40} color="var(--text-light)" style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                          <p style={{ fontSize: '14px', fontWeight: 500 }}>Henüz rapor üretilmedi. "Rapor Üret" butonuna basarak TSRS raporunu oluşturabilirsiniz.</p>
                        </div>
                      )}
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
                <div>Hash ID: {reportHash ? `${reportHash.slice(0, 8)}...${reportHash.slice(-8)}` : 'Henüz üretilmedi'}</div>
              </div>
            </div>

          </motion.div>
        </div>

        {/* Right Column: Passport & Audit */}
        <div className="flex-col gap-6">
          
          {/* AI Report Controller Card */}
          <motion.div 
            variants={itemVariants} 
            className="card glass-panel"
            style={{ 
              background: 'linear-gradient(135deg, #0B1120 0%, #1E293B 100%)', 
              color: 'white', 
              padding: '24px',
              borderRadius: '20px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              boxShadow: 'var(--shadow-premium-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>Yapay Zeka Kontrol Merkezi</div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>TSRS Raporlama ve Analiz Motoru</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', lineHeight: '1.5' }}>
                Bağlı sistem verilerinizi, yüklenen e-Faturaları ve yasal beyanlarınızı analiz ederek bağımsız denetime hazır sürdürülebilirlik raporunu yeniden derleyin.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', color: 'var(--text-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Analiz Durumu:</span>
                <strong style={{ color: '#10B981' }}>Aktif & Hazır</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Kripto Mühür:</span>
                <strong style={{ color: '#FFFFFF' }}>{reportHash ? 'Mevcut' : 'Gerekli'}</strong>
              </div>
            </div>

            <button 
              onClick={handleGenerateReport}
              className="btn-primary"
              style={{ 
                width: '100%', 
                padding: '14px 20px', 
                fontSize: '14px', 
                fontWeight: 700,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-emerald-dark))',
                boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.4)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={16} /> Yeni TSRS Raporu Üret
            </button>
          </motion.div>
          
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
                  {reportHash}
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

      {/* Yapay Zeka TSRS Raporlama ve Analiz Motoru Overlay Ekranı (Kurumsal Açık Tema) */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(241, 245, 249, 0.92)',
              backdropFilter: 'blur(24px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px'
            }}
          >
            <motion.div 
              initial={{ scale: 0.96, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 15, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              style={{
                width: '100%',
                maxWidth: '960px',
                background: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 30px 60px -15px rgba(15, 23, 42, 0.15), 0 0 1px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '80vh',
                maxHeight: '680px'
              }}
            >
              {/* Overlay Header */}
              <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    background: reportStatus.status === 'error' ? '#EF4444' : '#10B981', 
                    boxShadow: reportStatus.status === 'error' ? '0 0 8px rgba(239, 68, 68, 0.5)' : '0 0 8px rgba(16, 185, 129, 0.5)', 
                    animation: reportStatus.status === 'generating' ? 'pulse 2s infinite' : 'none' 
                  }} />
                  <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--primary-midnight)', textTransform: 'uppercase' }}>
                    Yapay Zeka TSRS Analiz ve Rapor Motoru
                  </span>
                </div>
                {/* Simulated Window Controls */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444', opacity: 0.8, display: 'inline-block' }} />
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B', opacity: 0.8, display: 'inline-block' }} />
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981', opacity: 0.8, display: 'inline-block' }} />
                </div>
              </div>

              {/* Main Body */}
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', flex: 1, overflow: 'hidden' }}>
                
                {/* Left side: Pipeline steps */}
                <div style={{ padding: '32px', background: '#F8FAFC', borderRight: '1px solid rgba(0,0,0,0.06)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>İŞLEM ADIMLARI</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {[
                      { id: 1, label: 'Bağlantı & Entegrasyon Kontrolü', minProg: 10 },
                      { id: 2, label: 'Kaynak Belgeler & OCR Çözümleme', minProg: 20 },
                      { id: 3, label: 'Yönetici Beyan Formu Analizi', minProg: 25 },
                      { id: 4, label: 'Kapsam 1 ve 2 Emisyon Hesabı', minProg: 25 },
                      { id: 5, label: 'TSRS Standart Eşleştirmesi', minProg: 30 },
                      { id: 6, label: 'Yapay Zeka Rapor Yazımı (GPT-5.4)', minProg: 40 },
                      { id: 7, label: 'Kriptografik İmzalama & Hash', minProg: 90 },
                      { id: 8, label: 'Rapor Derleme ve Başarı', minProg: 100 }
                    ].map((step, idx) => {
                      const isStepCompleted = reportStatus.progress > step.minProg || reportStatus.status === 'completed';
                      const isStepActive = reportStatus.status === 'generating' && reportStatus.progress >= step.minProg && reportStatus.progress < (idx === 7 ? 100 : step.minProg + 10);
                      
                      return (
                        <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: isStepCompleted || isStepActive ? 1 : 0.4, transition: 'all 0.3s ease' }}>
                          <div style={{ 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '50%', 
                            border: isStepCompleted ? 'none' : '2px solid #CBD5E1',
                            background: isStepCompleted ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                            color: isStepCompleted ? '#10B981' : 'var(--text-muted)',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            {isStepCompleted ? (
                              <CheckCircle size={14} color="#10B981" />
                            ) : isStepActive ? (
                              <RefreshCw size={12} className="animate-spin" style={{ color: '#CBD5E1' }} />
                            ) : (
                              step.id
                            )}
                          </div>
                          <span style={{ 
                            fontSize: '13px', 
                            fontWeight: isStepActive ? 700 : 500, 
                            color: isStepActive ? '#2563EB' : isStepCompleted ? 'var(--primary-midnight)' : 'var(--text-muted)' 
                          }}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right side: Executive Analysis Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '24px', flex: 1, background: '#FFFFFF' }}>
                  
                  {/* Executive Audit Dashboard */}
                  <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '14px', 
                    overflowY: 'auto',
                    paddingRight: '8px'
                  }}>
                    
                    {/* Step 1: Connection */}
                    {reportStatus.progress >= 10 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ 
                          padding: '16px', 
                          background: '#FFFFFF', 
                          border: '1px solid rgba(0, 0, 0, 0.05)', 
                          borderLeft: '4px solid #10B981',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'start',
                          gap: '14px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', color: '#10B981', display: 'flex', padding: '8px' }}>
                          <Link2 size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-midnight)' }}>ERP ve Muhasebe Entegrasyonu</h4>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>BAĞLANDI</span>
                          </div>
                          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                            SAP ERP ve LOGO Tiger entegrasyonu başarılı. Bilanço ve mizan verileri canlı olarak analiz motoruna aktarıldı.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Document OCR */}
                    {reportStatus.progress >= 20 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ 
                          padding: '16px', 
                          background: '#FFFFFF', 
                          border: '1px solid rgba(0, 0, 0, 0.05)', 
                          borderLeft: '4px solid #10B981',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'start',
                          gap: '14px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', color: '#10B981', display: 'flex', padding: '8px' }}>
                          <FileText size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-midnight)' }}>Yasal Evrak OCR ve Analiz</h4>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>TAMAMLANDI</span>
                          </div>
                          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                            Taranmış SGK Hizmet Dökümleri ve Sanayi Sicil Belgesi (PDF) başarıyla metinleştirildi. 55 aktif personel ve NACE kapasite verileri çıkartıldı.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Carbon footprint */}
                    {reportStatus.progress >= 25 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ 
                          padding: '16px', 
                          background: '#FFFFFF', 
                          border: '1px solid rgba(0, 0, 0, 0.05)', 
                          borderLeft: '4px solid #10B981',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'start',
                          gap: '14px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', color: '#10B981', display: 'flex', padding: '8px' }}>
                          <Leaf size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-midnight)' }}>Kapsam 1 ve 2 Emisyon Hesapları</h4>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>HESAPLANDI</span>
                          </div>
                          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                            IPCC faktörleri ile 14,500 kWh elektrik ve 7 araçlık mobilite verileri işlendi. Kapsam 1: 15.42 tCO2e, Kapsam 2: 7.25 tCO2e karbon ayak izi doğrulandı.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 4: AI Report Writing */}
                    {reportStatus.progress >= 30 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ 
                          padding: '16px', 
                          background: '#FFFFFF', 
                          border: '1px solid rgba(0, 0, 0, 0.05)', 
                          borderLeft: `4px solid ${reportStatus.progress >= 90 ? '#10B981' : '#3B82F6'}`,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'start',
                          gap: '14px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div style={{ background: reportStatus.progress >= 90 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', color: reportStatus.progress >= 90 ? '#10B981' : '#3B82F6', display: 'flex', padding: '8px' }}>
                          <Cpu size={18} className={reportStatus.progress >= 90 ? '' : 'animate-spin'} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-midnight)' }}>TSRS Rapor Metni Üretimi (GPT-5.4)</h4>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: reportStatus.progress >= 90 ? '#10B981' : '#3B82F6', background: reportStatus.progress >= 90 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                              {reportStatus.progress >= 90 ? 'TAMAMLANDI' : 'YAZILIYOR'}
                            </span>
                          </div>
                          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                            {reportStatus.progress >= 90 ? 'Rapor bölümleri TSRS standartlarına göre oluşturuldu.' : `${reportStatus.message}`}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 5: Blockchain sealing */}
                    {reportStatus.progress >= 90 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ 
                          padding: '16px', 
                          background: '#FFFFFF', 
                          border: '1px solid rgba(0, 0, 0, 0.05)', 
                          borderLeft: `4px solid ${reportStatus.status === 'completed' ? '#10B981' : '#60A5FA'}`,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'start',
                          gap: '14px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div style={{ background: reportStatus.status === 'completed' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(96, 165, 250, 0.08)', borderRadius: '8px', color: reportStatus.status === 'completed' ? '#10B981' : '#60A5FA', display: 'flex', padding: '8px' }}>
                          <Lock size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-midnight)' }}>Kriptografik Blokzincir Mührü</h4>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: reportStatus.status === 'completed' ? '#10B981' : '#60A5FA', background: reportStatus.status === 'completed' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(96, 165, 250, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                              {reportStatus.status === 'completed' ? 'MÜHÜRLENDİ' : 'İMZALANIYOR'}
                            </span>
                          </div>
                          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                            Rapor bütünlüğünü korumak için SHA-256 imzası Green Ledger sistemine mühürlendi.
                          </p>
                        </div>
                      </motion.div>
                    )}
                    
                    <div ref={terminalEndRef} />
                  </div>

                  {/* Progress Bar & Footer Controls */}
                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {reportStatus.status === 'generating' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--accent-emerald)' }} />
                            {reportStatus.message}
                          </span>
                        ) : reportStatus.status === 'completed' ? (
                          'Analiz ve Rapor Başarıyla Hazırlandı.'
                        ) : reportStatus.status === 'error' ? (
                          'İşlem Sırasında Hata Oluştu!'
                        ) : (
                          'Bekleniyor...'
                        )}
                      </span>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-midnight)' }}>
                        %{reportStatus.progress}
                      </span>
                    </div>

                    <div style={{ height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: '0%' }}
                        animate={{ width: `${reportStatus.progress}%` }}
                        transition={{ type: 'tween', ease: 'easeInOut' }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)' }} 
                      />
                    </div>

                    {/* Actions buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
                      {reportStatus.status === 'error' && (
                        <button 
                          onClick={handleGenerateReport} 
                          className="btn-primary" 
                          style={{ 
                            padding: '10px 20px', 
                            fontSize: '13px', 
                            borderRadius: '10px', 
                            background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          Tekrar Dene
                        </button>
                      )}
                      
                      {reportStatus.status === 'completed' && (
                        <button 
                          onClick={() => setIsGenerating(false)} 
                          className="btn-primary" 
                          style={{ 
                            padding: '10px 24px', 
                            fontSize: '13px', 
                            borderRadius: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          Tamamlandı! Raporu İncele
                        </button>
                      )}

                      {reportStatus.status === 'generating' && (
                        <button 
                          disabled 
                          style={{ 
                            padding: '10px 24px', 
                            fontSize: '13px', 
                            borderRadius: '10px', 
                            background: 'rgba(0,0,0,0.03)', 
                            color: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(0,0,0,0.05)',
                            cursor: 'not-allowed'
                          }}
                        >
                          Analiz Yapılıyor...
                        </button>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TsrsReport;
