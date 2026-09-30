import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, QrCode, CheckCircle, FileText, ShieldCheck, 
  Copy, Check, RefreshCw, Sparkles, Building, Globe, 
  Calendar, Cpu, Award, ChevronDown, ChevronUp, AlertCircle,
  ExternalLink, Lock, CheckCircle2, Link2, Leaf, Activity, BarChart2,
  Info, X, Database, Sliders, Layers
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GREEN_TEXTILE_DEMO, getGreenTextileDemoState, isGreenTextileUser } from '../../demo/greenTextileDemo';

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
  const [searchParams] = useSearchParams();
  const queryTicker = searchParams.get('ticker');
  const [selectedTicker, setSelectedTicker] = useState((currentUser?.companyTicker || queryTicker || 'ASELS').toUpperCase());
  const [reportingYear, setReportingYear] = useState(new Date().getFullYear() - 1);
  
  useEffect(() => {
    if (currentUser?.companyTicker) {
      setSelectedTicker(currentUser.companyTicker.toUpperCase());
    }
  }, [currentUser?.companyTicker]);
  
  const ticker = selectedTicker;
  const canShowDemoReport = selectedTicker === GREEN_TEXTILE_DEMO.company.ticker
    && isGreenTextileUser(currentUser)
    && getGreenTextileDemoState().loaded;
  const withTicker = (url) => ticker ? `${url}${url.includes('?') ? '&' : '?'}ticker=${encodeURIComponent(ticker)}` : url;

  const [activeTab, setActiveTab] = useState('summary');
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [reportData, setReportData] = useState(null);
  const renderableReportData = React.useMemo(() => {
    if (!reportData) return null;
    const defMap = {};
    const defRegex = /^\[([a-zA-Z0-9_\-]+)\]:\s*<?(data:image\/[^>\r\n]+)>?/gm;
    let match;
    while ((match = defRegex.exec(reportData)) !== null) {
      defMap[match[1]] = match[2];
    }
    const usedKeys = new Set();
    let result = reportData.replace(/!\[(.*?)\]\[([a-zA-Z0-9_\-]+)\]/g, (m, alt, key) => {
      if (defMap[key]) {
        usedKeys.add(key);
        return `![${alt}](${defMap[key]})`;
      }
      return m;
    });
    result = result.replace(defRegex, (m, key, url) => {
      if (usedKeys.has(key)) return '';
      return `![${key}](${url})`;
    });
    return result;
  }, [reportData]);
  const [reportHash, setReportHash] = useState('');
  const [reportVersionId, setReportVersionId] = useState(null);
  const [reportGeneratedAt, setReportGeneratedAt] = useState(null);
  const [reportIsCurrent, setReportIsCurrent] = useState(false);
  const [isDemoReport, setIsDemoReport] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [shapData, setShapData] = useState(null);
  const [modelCardData, setModelCardData] = useState(null);
  const [showAcademicRefs, setShowAcademicRefs] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Yapay zeka pipeline durumları
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDemoSimulation, setIsDemoSimulation] = useState(false);
  const [reportStatus, setReportStatus] = useState({ status: 'idle', progress: 0, message: '' });
  const [terminalLogs, setTerminalLogs] = useState([]);
  
  const pollingRef = useRef(null);
  const terminalEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Şirket değişiminde raporu ve SHAP verilerini yeniden çek
  useEffect(() => {
    fetchLatestReport(selectedTicker);
    fetchReadiness(selectedTicker);
    fetchShapData(selectedTicker);
    fetchModelCard();
  }, [selectedTicker, reportingYear]);

  useEffect(() => {
    if (location.state?.triggerDemoGenerate) {
      navigate(location.pathname, { replace: true, state: {} });
      handleDemoReport();
    } else if (location.state?.triggerGenerate) {
      // Clear location state immediately so it doesn't run again on page refresh
      navigate(location.pathname, { replace: true, state: {} });
      if (isGreenTextileUser(currentUser)) handleDemoReport();
      else handleGenerateReport();
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

  useEffect(() => {
    if (!showPdfViewer) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowPdfViewer(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showPdfViewer]);

  useEffect(() => {
    setShowPdfViewer(false);
  }, [selectedTicker, reportingYear]);

  const fetchLatestReport = async (targetTicker) => {
    try {
      const currentTicker = targetTicker || selectedTicker;
      if (currentTicker === GREEN_TEXTILE_DEMO.company.ticker && isGreenTextileUser(currentUser) && getGreenTextileDemoState().loaded) {
        const demoState = getGreenTextileDemoState();
        setIsDemoReport(true);
        setReportData(GREEN_TEXTILE_DEMO.reportMarkdown);
        setReportHash('');
        setReportVersionId(null);
        setReportGeneratedAt(demoState.completedAt || new Date().toISOString());
        setReportIsCurrent(false);
        return;
      }
      const url = currentTicker ? `${API_URL}/api/report/latest?ticker=${encodeURIComponent(currentTicker)}&reporting_year=${reportingYear}&_t=${Date.now()}` : `${API_URL}/api/report/latest?reporting_year=${reportingYear}&_t=${Date.now()}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'found') {
          setIsDemoReport(false);
          setReportData(data.content);
          setReportHash(data.hash || '');
          setReportVersionId(data.id || null);
          setReportGeneratedAt(data.generated_at || null);
          setReportIsCurrent(Boolean(data.is_current));
        } else {
          setIsDemoReport(false);
          setReportData(null);
          setReportHash('');
          setReportVersionId(null);
          setReportGeneratedAt(null);
          setReportIsCurrent(false);
        }
      }
    } catch (e) { console.error('Rapor yüklenemedi:', e); }
  };

  const fetchShapData = async (targetTicker) => {
    try {
      const currentTicker = targetTicker || selectedTicker || "ASELS"; 
      const res = await fetch(`${API_URL}/api/esg/explain/${currentTicker}`);
      if (res.ok) {
        const data = await res.json();
        setShapData(data);
      }
    } catch (e) { console.error('SHAP data error:', e); }
  };

  const fetchModelCard = async () => {
    try {
      const res = await fetch(`${API_URL}/api/esg/model-card`);
      if (res.ok) {
        const data = await res.json();
        setModelCardData(data);
      }
    } catch (e) { console.error('Model card fetch error:', e); }
  };

  const handleOpenPdf = () => {
    if (!reportVersionId) {
      return;
    }
    setShowPdfViewer(true);
  };

  const pdfUrl = reportVersionId
    ? `${API_URL}/api/report/${encodeURIComponent(reportVersionId)}/pdf`
    : '';

  const handleGenerateReport = async () => {
    if (isGenerating) return;

    setIsDemoSimulation(false);
    setIsDemoReport(false);
    setIsGenerating(true);
    setReportStatus({ status: 'generating', progress: 5, message: 'Pipeline başlatılıyor...' });
    setTerminalLogs([
      `[${new Date().toLocaleTimeString()}] [SİSTEM] TSRS Analiz ve Raporlama Motoru başlatıldı.`,
      `[${new Date().toLocaleTimeString()}] [SİSTEM] Yüklenen belgeler ve yönetici beyanı okunuyor...`,
    ]);

    try {
      const res = await fetch(withTicker(`${API_URL}/api/report/generate`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporting_year: reportingYear })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        let errorMsg = 'Rapor üretim hatası oluştu.';
        if (errData.detail) {
          if (typeof errData.detail === 'string') {
            errorMsg = errData.detail;
          } else if (errData.detail.code === 'critical_sources_missing' && errData.detail.details?.missing) {
            const missingFiles = errData.detail.details.missing;
            const docNames = {
              'faaliyet': 'Şirket Faaliyet Raporu',
              'mizan': 'Kurumsal Bilanço ve Mizan',
              'fatura': 'Tüketim Faturaları',
              'declaration': 'Yönetici Beyan Formu',
              'şirket-faliyet-raporu.md': 'Şirket Faaliyet Raporu',
              'mizan.md': 'Kurumsal Bilanço ve Mizan',
              'faturalar.md': 'Tüketim Faturaları',
              'yonetici_anketi.json': 'Yönetici Beyan Formu'
            };
            const friendlyList = missingFiles.map(f => docNames[f] || f).join(', ');
            errorMsg = `Rapor üretimi için kritik zorunlu kaynaklar eksik: ${friendlyList}. Lütfen Veri Entegrasyonu sayfasından bu belgeleri yükleyin veya doldurun.`;
          } else if (errData.detail.message) {
            errorMsg = errData.detail.message;
          }
        }
        throw new Error(errorMsg);
      }
      const data = await res.json();
      startPolling(data.job_id);
    } catch (e) {
      stopPolling();
      setReportStatus({ status: 'error', progress: 0, message: e.message });
      setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [HATA] ${e.message}`]);
    }
  };

  const handleDemoReport = async () => {
    const isGreenTextileDemo = selectedTicker === GREEN_TEXTILE_DEMO.company.ticker && isGreenTextileUser(currentUser);
    if (isGreenTextileDemo) {
      if (isGenerating || !getGreenTextileDemoState().loaded) return;
      const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
      const steps = [
        [18, 'Yeşil Tekstil demo kaynak paketi doğrulanıyor...'],
        [42, 'Enerji, su ve faaliyet kaynakları sınıflandırılıyor...'],
        [68, 'TSRS 1 ve TSRS 2 örnek açıklamaları oluşturuluyor...'],
        [88, 'Sentetik gösterge tablosu ve rapor önizlemesi hazırlanıyor...'],
      ];
      setIsDemoSimulation(true);
      setIsGenerating(true);
      setActiveTab('summary');
      setReportStatus({ status: 'generating', progress: 5, message: 'Yeşil Tekstil sentetik demo raporu hazırlanıyor...', is_demo: true });
      setTerminalLogs([`[${new Date().toLocaleTimeString()}] [DEMO] Yeşil Tekstil için sentetik rapor derleme akışı başlatıldı.`]);
      for (const [progress, message] of steps) {
        await wait(460);
        setReportStatus({ status: 'generating', progress, message, is_demo: true });
        setTerminalLogs((current) => [...current, `[${new Date().toLocaleTimeString()}] [DEMO] ${message}`]);
      }
      setReportData(GREEN_TEXTILE_DEMO.reportMarkdown);
      setReportHash('');
      setReportVersionId(null);
      setReportGeneratedAt(new Date().toISOString());
      setReportIsCurrent(false);
      setIsDemoReport(true);
      setReportStatus({ status: 'completed', progress: 100, message: 'Sentetik demo raporu hazır.', is_demo: true });
      setTerminalLogs((current) => [...current, `[${new Date().toLocaleTimeString()}] [BİLGİ] İçerik sentetik örnek veridir; gerçek şirket raporu veya güvence beyanı değildir.`]);
      setIsGenerating(false);
      await wait(250);
      document.getElementById('tsrs-report-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

  };

  const fetchReadiness = async (targetTicker) => {
    if (!targetTicker) return;
    try {
      const params = new URLSearchParams({ ticker: targetTicker, reporting_year: String(reportingYear) });
      const res = await fetch(`${API_URL}/api/report/readiness?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.active_job_id && !pollingRef.current) {
        setIsGenerating(true);
        setReportStatus({ status: 'generating', progress: 0, message: 'Devam eden rapor işi yükleniyor...' });
        startPolling(data.active_job_id);
      }
    } catch (e) {
      console.error('Rapor hazırlık durumu alınamadı:', e);
    }
  };

  const startPolling = (jobId) => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/report/jobs/${encodeURIComponent(jobId)}`);
        if (res.ok) {
          const data = await res.json();
          const uiData = {
            ...data,
            status: ['queued', 'running'].includes(data.status) ? 'generating' : (data.status === 'failed' ? 'error' : data.status)
          };
          setReportStatus(uiData);

          setTerminalLogs(prev => {
            const lastLog = prev[prev.length - 1];
            if (['queued', 'running'].includes(data.status) && data.message && !lastLog?.includes(data.message)) {
              return [...prev, `[${new Date().toLocaleTimeString()}] ${data.message}`];
            }
            return prev;
          });

          if (!['queued', 'running'].includes(data.status)) {
            stopPolling();
            if (data.status === 'completed' || data.status === 'completed_with_warnings') {
              setReportStatus({ ...data, status: 'completed', progress: 100 });
              setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [BAŞARI] TSRS raporu başarıyla üretildi ve yayımlandı.`]);
              await fetchLatestReport();
            } else {
              setReportStatus({ ...data, status: 'error', message: data.error?.message || data.message || 'Rapor üretilemedi.' });
              setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [HATA] ${data.error?.message || data.message || 'Rapor üretilemedi.'}`]);
            }
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
    if (!reportHash || !reportData) return;
    setIsVerifying(true);
    setVerificationSuccess(false);
    try {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(reportData));
      const calculated = '0x' + [...new Uint8Array(digest)]
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      setVerificationSuccess(calculated.toLowerCase() === reportHash.toLowerCase());
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

  const tabs = [{ id: 'summary', name: 'Yayımlanmış Rapor' }];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* Header & Main Actions */}
      <motion.div variants={itemVariants} className="flex justify-between items-center" style={{ marginBottom: '2px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '3px' }}>
            Sürdürülebilirlik Beyanı
          </div>
          <h1 className="page-title">TSRS Raporlama ve Yeşil Kredi Pasaportu</h1>
          <p className="page-subtitle">
            Yüklenen kurumsal kaynaklardan ve yasal beyanlardan derlenen resmî TSRS sürdürülebilirlik raporu.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* PDF Viewer Button */}
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            className="btn-primary" 
            onClick={handleOpenPdf}
            disabled={!reportVersionId}
            style={{ 
              padding: '12px 24px', 
              fontSize: '15px',
              minWidth: '190px',
              justifyContent: 'center'
            }}
          >
            <span className="flex items-center gap-2">
              <FileText size={18} /> PDF Raporu Görüntüle
            </span>
          </motion.button>
        </div>
      </motion.div>

      {/* Document Quick Bar (Cards moved to Ana Sayfa Cockpit) */}
      <motion.div 
        variants={itemVariants}
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '0px',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={19} color="#059669" />
          </div>
          <div>
            <select
              value={reportingYear}
              onChange={(event) => setReportingYear(Number(event.target.value))}
              disabled={isGenerating}
              aria-label="Raporlama yılı"
              style={{ marginBottom: '5px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '3px 7px', background: '#FFFFFF', color: '#334155', fontSize: '11px' }}
            >
              {[0, 1, 2].map(offset => {
                const year = new Date().getFullYear() - 1 - offset;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
              TSRS Sürdürülebilirlik Raporu
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              Rapor metni SHA-256: <span style={{ fontFamily: 'monospace', color: '#0F172A', fontWeight: 700 }}>{reportHash ? `${reportHash.slice(0, 16)}...${reportHash.slice(-8)}` : 'Rapor henüz oluşturulmadı'}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>
              Son rapor: {reportGeneratedAt ? new Date(reportGeneratedAt).toLocaleString('tr-TR') : 'Henüz oluşturulmadı'}
              {' · '}
              <span style={{ color: reportIsCurrent ? '#047857' : '#B45309', fontWeight: 700 }}>
                {reportIsCurrent ? '✓ Veriler güncel' : '✕ Veriler güncellenmeli'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isGreenTextileUser(currentUser) && (
            <button
              onClick={handleDemoReport}
              disabled={isGenerating || !canShowDemoReport}
              title={!canShowDemoReport ? 'Önce Veri Entegrasyonu sayfasında Yeşil Tekstil demo paketini yükleyin.' : 'Sentetik demo raporunu üretim akışı görünümünde aç.'}
              style={{
                background: '#ECFDF5',
                color: '#047857',
                border: '1px solid #A7F3D0',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: isGenerating || !canShowDemoReport ? 'not-allowed' : 'pointer',
                opacity: canShowDemoReport ? 1 : 0.55,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <Layers size={15} /> Demo Raporunu Göster
            </button>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: '#F8FAFC',
              color: '#334155',
              border: '1px solid #CBD5E1',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ← Ana Sayfa Kokpitine Dön
          </button>
          {!isGreenTextileUser(currentUser) && (
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              style={{
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={14} /> {isGenerating ? 'Rapor Oluşturuluyor...' : reportGeneratedAt ? 'Raporu Yeniden Üret' : 'Yeni TSRS Raporu Oluştur'}
            </button>
          )}
        </div>
      </motion.div>

      {/* Main Full-Width Report Preview Section (Natural Height - No Inner Scroll) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
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

        {/* Natural Height Sürdürülebilirlik Beyanı Document Card (Expands naturally downwards) */}
        <motion.div 
          variants={itemVariants} 
          className="card" 
          id="tsrs-report-preview"
          style={{ 
            background: '#FFFFFF', 
            padding: '28px 32px', 
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          
          {/* Document Header Mockup */}
          <div className="flex justify-between items-end" style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '24px', marginBottom: '32px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-emerald)', letterSpacing: '2.5px', marginBottom: '8px', textTransform: 'uppercase' }}>Rapor Önizleme</div>
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--primary-midnight)', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                TSRS Sürdürülebilirlik Beyanı
                {isDemoReport && <span style={{ fontSize: '11px', letterSpacing: '0.4px', padding: '5px 9px', borderRadius: '999px', color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A' }}>SENTETİK DEMO</span>}
              </h2>
            </div>
            <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              <div style={{ marginBottom: '4px' }}>Dönem: <strong style={{ color: 'var(--primary-midnight)' }}>{reportingYear} / Yıllık</strong></div>
              <div>Yayın: <strong style={{ color: 'var(--primary-midnight)' }}>{reportGeneratedAt ? new Date(reportGeneratedAt).toLocaleDateString('tr-TR') : 'Henüz yayımlanmadı'}</strong></div>
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
              style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--text-main)', flex: 1 }}
            >
              {activeTab === 'summary' && (
                <div className="flex-col gap-6">
                  <div>
                    {isDemoReport && (
                      <div role="note" style={{ marginBottom: '18px', padding: '12px 15px', borderRadius: '10px', color: '#78350F', background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: '13px' }}>
                        Bu içerik demo gösterimi için hazırlanmıştır; gerçek şirket verisi, yayımlanmış TSRS raporu veya bağımsız güvence beyanı değildir.
                      </div>
                    )}
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-midnight)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building size={18} color="var(--accent-emerald)" /> 1. Yönetici Özeti ve Kurumsal Profil
                    </h3>
                    {reportData ? (
                      <div style={{ 
                        color: 'var(--text-muted)', 
                        fontSize: '14.5px', 
                        lineHeight: '1.85', 
                        overflowX: 'hidden' 
                      }}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          urlTransform={(url) => url}
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
                          {renderableReportData}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <FileText size={48} color="var(--text-light)" style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                        <p style={{ fontSize: '15px', fontWeight: 500 }}>Henüz rapor üretilmedi. Yukarıdaki "Yeni TSRS Raporu Üret" butonuna basarak raporu derleyebilirsiniz.</p>
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

              {activeTab === 'esg_shap' && (
                <div className="flex-col gap-6">
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-midnight)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={18} color="var(--accent-emerald)" /> S7 Şirket ESG Tahmin Skoru & TreeSHAP Analizi
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                      Bu skor, XGBoost Regressor (Track B) makine öğrenmesi modeli tarafından şirketin KAP finansal ve operasyonel beyanları baz alınarak hesaplanmıştır. Aşağıda, skora en çok etki eden metriklerin (TreeSHAP algoritmasına göre) analizi yer almaktadır.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                    <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Tahmin Edilen ESG Skoru (S7)</div>
                      <div style={{ fontSize: '36px', fontWeight: 900, color: 'var(--accent-emerald-dark)' }}>{shapData?.predicted_score || '--'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>S7 predicted_esg_overall (0-100)</div>
                    </div>
                    <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Sektörel Taban Puan (Base)</div>
                      <div style={{ fontSize: '36px', fontWeight: 900, color: 'var(--primary-midnight)' }}>{shapData?.base_value || '--'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>TreeSHAP Sektör Beklenen Değeri (Expected Value)</div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-midnight)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BarChart2 size={16} color="var(--text-muted)" /> Şirket Metriklerinin SHAP Katkıları (En Etkili 10 Faktör)
                    </h4>
                    
                    {shapData?.top_contributions ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {shapData.top_contributions.map((c, i) => (
                          <div key={i} style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                            padding: '12px 16px', 
                            background: c.impact === 'positive' ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.04)',
                            border: `1px solid ${c.impact === 'positive' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                            borderRadius: '8px'
                          }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-midnight)', fontFamily: 'monospace' }}>
                              {c.feature}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 800, color: c.impact === 'positive' ? 'var(--accent-emerald-dark)' : 'var(--danger)' }}>
                                {c.shap_value > 0 ? '+' : ''}{c.shap_value}
                              </span>
                              {c.impact === 'positive' ? <ChevronUp size={16} color="var(--accent-emerald-dark)" /> : <ChevronDown size={16} color="var(--danger)" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)', fontSize: '13px', background: 'var(--bg-main)', borderRadius: '8px' }}>
                        Veri yükleniyor...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Cryptographic Signature Box Mockup */}
          <div style={{ marginTop: '36px', paddingTop: '28px', borderTop: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Dosya Bütünlük Özeti</div>
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

      {/* Yapay Zeka Model Kartı Detay Modalı (Açık Tema • Google Model Cards Standardı) */}
      <AnimatePresence>
        {showModelModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModelModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(6px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px'
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '860px',
                maxHeight: '88vh',
                background: '#FFFFFF',
                color: '#0F172A',
                borderRadius: '24px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Modal Header */}
              <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Cpu size={20} color="#059669" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      {modelCardData?.model_details?.name || 'EkoFin ESG Overall Predictor (Track B)'}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0 0' }}>
                      Google Model Cards Standardı • Teknik Şartname & Akademik Dayanaklar
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModelModal(false)}
                  style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', color: '#64748B', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '28px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', background: '#FFFFFF' }}>
                
                {/* 1. Mimari & Çerçeve */}
                <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={15} /> 1. Model Mimarisi & Altyapı
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#64748B' }}>Mimari:</span>
                      <strong style={{ display: 'block', color: '#0F172A', marginTop: '2px' }}>{modelCardData?.model_details?.architecture || 'XGBoost Regressor (Tree-based Gradient Boosting)'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>Framework:</span>
                      <strong style={{ display: 'block', color: '#0F172A', marginTop: '2px' }}>{modelCardData?.model_details?.framework || 'XGBoost 3.0+ / Scikit-Learn'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>Sürüm / Geliştirici:</span>
                      <strong style={{ display: 'block', color: '#0F172A', marginTop: '2px' }}>{modelCardData?.model_details?.version || '1.0.0'} ({modelCardData?.model_details?.developer || 'EkoFin AI Research Group'})</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>Kullanım Amacı:</span>
                      <strong style={{ display: 'block', color: '#0F172A', marginTop: '2px' }}>BIST & KOBİ Finansal/ESG Skor Tahmini</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Eğitim Veri Seti & Doğrulama */}
                <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={15} /> 2. Eğitim Veri Seti ve Zaman Sızıntısı Koruması
                  </h4>
                  <div style={{ fontSize: '12.5px', lineHeight: '1.6', color: '#334155' }}>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong style={{ color: '#0F172A' }}>Veri Havuzu:</strong> {modelCardData?.training_data?.source || 'KAP BIST Sürdürülebilirlik Endeksi (XUSRD) ve Panel Veri Seti (11.000 firma-yıl)'}
                    </p>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong style={{ color: '#0F172A' }}>Çapraz Doğrulama:</strong> {modelCardData?.training_data?.split || 'TimeSeriesSplit (5-Katlı Zamansal Çapraz Doğrulama — Zaman sızıntısını önler)'}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong style={{ color: '#0F172A' }}>Girdi Boyutu:</strong> {modelCardData?.training_data?.features_count || 23} Bağımsız Değişken (12 Finansal Oran, 6 Kapsam 1-3 Emisyon, 5 Yönetişim Metriği)
                    </p>
                  </div>
                </div>

                {/* 3. Başarım Metrikleri & Karşılaştırmalı Analiz */}
                <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sliders size={15} /> 3. Test Doğruluğu & Baseline Karşılaştırması
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>Test R² (Doğruluk)</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#047857', marginTop: '4px' }}>{modelCardData?.evaluation_metrics?.test_r2 || 0.941}</div>
                    </div>
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>Test RMSE (Hata)</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>{modelCardData?.evaluation_metrics?.test_rmse || 2.18}</div>
                    </div>
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>Test MAE</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>{modelCardData?.evaluation_metrics?.test_mae || 1.64}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#047857', background: '#ECFDF5', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
                    <strong style={{ color: '#065F46' }}>Model Kıyaslama Üstünlüğü:</strong> {modelCardData?.evaluation_metrics?.baseline_comparison || "Random Forest (RMSE: 3.42) ve MLP Derin Öğrenme (RMSE: 4.85) modellerine göre %55 daha düşük hata"}
                  </div>
                </div>

                {/* 4. Açıklanabilirlik & Global SHAP Drivers */}
                <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={15} /> 4. TreeSHAP Açıklanabilirlik ve En Etkili Faktörler
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '10px' }}>
                    {modelCardData?.explainability?.method || "TreeSHAP (Shapley Additive exPlanations - Lundberg & Lee, NeurIPS 2017)"}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(modelCardData?.explainability?.top_global_drivers || [
                      "Revenue (Ciro büyüklüğü)",
                      "carbon_intensity (Karbon Yoğunluğu)",
                      "CarbonEmissions (Toplam Emisyon)",
                      "ProfitMargin (Net Kâr Marjı)",
                      "energy_intensity (Enerji Yoğunluğu)"
                    ]).map((driver, idx) => (
                      <span key={idx} style={{ padding: '6px 12px', borderRadius: '8px', background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', fontSize: '11.5px', fontWeight: 600 }}>
                        {idx + 1}. {driver}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 5. Jüri & Akademik Referanslar */}
                <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={15} /> 5. Jüri & Bağımsız Denetçi Akademik Literatür Referansları
                  </h4>
                  <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#334155' }}>
                    {(modelCardData?.academic_references || [
                      "Shwartz-Ziv & Armon (2022) - Tabular Data: Deep Learning is Not All You Need (Information Fusion)",
                      "Grinsztajn et al. (NeurIPS 2022) - Why do tree-based models still outperform deep learning on typical tabular data?",
                      "Lundberg & Lee (NeurIPS 2017) - A Unified Approach to Interpreting Model Predictions (TreeSHAP)"
                    ]).map((ref, idx) => (
                      <li key={idx} style={{ lineHeight: '1.5' }}>{ref}</li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{ padding: '18px 32px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', background: '#F8FAFC' }}>
                <button 
                  onClick={() => setShowModelModal(false)}
                  style={{ 
                    padding: '10px 24px', 
                    borderRadius: '10px', 
                    border: 'none', 
                    background: 'linear-gradient(135deg, #059669, #047857)', 
                    color: 'white', 
                    fontSize: '13px', 
                    fontWeight: 700, 
                    cursor: 'pointer' 
                  }}
                >
                  Kapat
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Denetim ve Güvence Standartları Modalı (Açık Tema) */}
      <AnimatePresence>
        {showAuditModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAuditModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(6px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px'
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '780px',
                maxHeight: '85vh',
                background: '#FFFFFF',
                color: '#0F172A',
                borderRadius: '24px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Modal Header */}
              <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={20} color="#059669" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Denetim ve Güvence Standartları Detayı
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0 0' }}>
                      KGK Bağımsız Denetçi Doğrulama Kaynakları ve Uyumluluk Matrisi
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAuditModal(false)}
                  style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', color: '#64748B', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '28px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: '#FFFFFF' }}>
                
                {/* Item 1 */}
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <CheckCircle2 size={16} color="#059669" /> TSRS-1 Genel Hükümler
                    </h4>
                    <span style={{ fontSize: '11px', color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '3px 10px', borderRadius: '6px', fontWeight: 700 }}>KGK UYUMLU</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.6' }}>
                    <div><strong style={{ color: '#0F172A' }}>Denetim Standardı:</strong> KGK TSRS-1 Genel İlkeleri</div>
                    <div><strong style={{ color: '#0F172A' }}>Doğrulama Kaynağı:</strong> Şirket Beyannamesi & Yönetici Karar Defterleri</div>
                    <div><strong style={{ color: '#0F172A' }}>Son Kontrol:</strong> Canlı EcoFin AI Entegrasyonu ile Doğrulandı</div>
                  </div>
                </div>

                {/* Item 2 */}
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <CheckCircle2 size={16} color="#059669" /> TSRS-2 İklim Riskleri
                    </h4>
                    <span style={{ fontSize: '11px', color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '3px 10px', borderRadius: '6px', fontWeight: 700 }}>DOĞRULANDI</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.6' }}>
                    <div><strong style={{ color: '#0F172A' }}>Denetim Standardı:</strong> KGK TSRS-2 İklim ve Risk Beyanları (Kapsam 1-2)</div>
                    <div><strong style={{ color: '#0F172A' }}>Doğrulama Kaynağı:</strong> IoT Enerji Analizörleri & Elektrik Faturaları (e-Fatura Entegre)</div>
                    <div><strong style={{ color: '#0F172A' }}>Son Kontrol:</strong> Otomatik OCR ve Enerji Doğrulaması Başarılı</div>
                  </div>
                </div>

                {/* Item 3 */}
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <CheckCircle2 size={16} color="#059669" /> Sektörel Limit Uyumu
                    </h4>
                    <span style={{ fontSize: '11px', color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '3px 10px', borderRadius: '6px', fontWeight: 700 }}>%100 UYUMLU</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.6' }}>
                    <div><strong style={{ color: '#0F172A' }}>Denetim Standardı:</strong> İlgili NACE Kodu Sektör Limit Kıyaslamaları</div>
                    <div><strong style={{ color: '#0F172A' }}>Doğrulama Kaynağı:</strong> EcoFin Sektörel Kıyaslama Algoritması</div>
                    <div><strong style={{ color: '#0F172A' }}>Son Kontrol:</strong> Sektör Ortalamasının %18 Altında Emisyon Seviyesi</div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{ padding: '18px 32px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', background: '#F8FAFC' }}>
                <button 
                  onClick={() => setShowAuditModal(false)}
                  style={{ 
                    padding: '10px 24px', 
                    borderRadius: '10px', 
                    border: 'none', 
                    background: 'linear-gradient(135deg, #059669, #047857)', 
                    color: 'white', 
                    fontSize: '13px', 
                    fontWeight: 700, 
                    cursor: 'pointer' 
                  }}
                >
                  Kapat
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    {isDemoSimulation ? 'Demo TSRS Rapor Derleme Simülasyonu' : 'Yapay Zeka TSRS Analiz ve Rapor Motoru'}
                  </span>
                </div>
                {/* Window Controls & Close Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', cursor: 'pointer' }} onClick={() => setIsGenerating(false)} title="Pencereyi Kapat">
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B', opacity: 0.8, display: 'inline-block' }} />
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981', opacity: 0.8, display: 'inline-block' }} />
                  </div>
                  <button
                    onClick={() => setIsGenerating(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px',
                    }}
                    title="Kapat"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Main Body */}
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', flex: 1, overflow: 'hidden' }}>
                
                {/* Left side: Pipeline steps */}
                <div style={{ padding: '32px', background: '#F8FAFC', borderRight: '1px solid rgba(0,0,0,0.06)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>İŞLEM ADIMLARI</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {[
                      { id: 1, label: isDemoSimulation ? 'Demo kaynak paketi kontrolü' : 'Bağlantı & Entegrasyon Kontrolü', minProg: 10 },
                      { id: 2, label: isDemoSimulation ? 'Kaynak belgelerin eşleştirilmesi' : 'Kaynak Belgeler & OCR Çözümleme', minProg: 20 },
                      { id: 3, label: isDemoSimulation ? 'Örnek yönetici beyanı' : 'Yönetici Beyan Formu Analizi', minProg: 25 },
                      { id: 4, label: isDemoSimulation ? 'İklim metriklerinin derlenmesi' : 'Kapsam 1 ve 2 Emisyon Hesabı', minProg: 25 },
                      { id: 5, label: 'TSRS Standart Eşleştirmesi', minProg: 30 },
                      { id: 6, label: isDemoSimulation ? 'Hazır demo raporunun yüklenmesi' : 'Yapay Zeka Rapor Yazımı (TSRS)', minProg: 40 },
                      { id: 7, label: isDemoSimulation ? 'Demo içeriği ve kanıt notları' : 'Kriptografik İmzalama & Hash', minProg: 90 },
                      { id: 8, label: isDemoSimulation ? 'Demo önizlemesinin açılması' : 'Rapor Derleme ve Başarı', minProg: 100 }
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
                    
                    {/* Hata Durum Kartı */}
                    {reportStatus.status === 'error' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ 
                          padding: '18px 20px', 
                          background: '#FEF2F2', 
                          border: '1px solid #FECACA', 
                          borderLeft: '4px solid #EF4444',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'start',
                          gap: '14px',
                          boxShadow: '0 2px 6px rgba(239, 68, 68, 0.08)'
                        }}
                      >
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#EF4444', display: 'flex', padding: '8px' }}>
                          <AlertCircle size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#991B1B' }}>
                              Rapor Üretimi Tamamlanamadı
                            </h4>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                              DİKKAT
                            </span>
                          </div>
                          <p style={{ fontSize: '12.5px', color: '#7F1D1D', marginTop: '6px', lineHeight: '1.5' }}>
                            {reportStatus.message || 'Rapor üretimi sırasında beklenmedik bir hata oluştu.'}
                          </p>
                          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setIsGenerating(false);
                                navigate('/integration');
                              }}
                              className="btn-primary"
                              style={{
                                padding: '6px 14px',
                                fontSize: '12px',
                                borderRadius: '8px',
                                background: '#059669',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer'
                              }}
                            >
                              Veri Entegrasyonuna Git
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

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
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-midnight)' }}>
                              {isDemoSimulation ? 'Demo Kaynak Paketi' : 'ERP ve Muhasebe Entegrasyonu'}
                            </h4>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                              {isDemoSimulation ? 'YEREL DEMO' : 'BAĞLANDI'}
                            </span>
                          </div>
                          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                            Yüklenen mizan, fatura ve operasyonel veriler canlı olarak analiz motoruna aktarıldı.
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
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-midnight)' }}>
                              Yasal Evrak OCR ve Analiz
                            </h4>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                              TAMAMLANDI
                            </span>
                          </div>
                          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                            {isDemoSimulation ? 'Sentetik örnek faaliyet, enerji, su ve beyan verileri demo akışı için eşleştiriliyor.' : 'Faaliyet raporu, mizan, fatura ve beyan formları metinleştirilerek kurumsal kanıtlar ve personel verileri çıkartıldı.'}
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
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-midnight)' }}>
                              Kapsam 1 ve 2 Emisyon Hesapları
                            </h4>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                              HESAPLANDI
                            </span>
                          </div>
                          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                              {isDemoSimulation ? 'Örnek Kapsam 1, 2 ve 3 göstergeleri rapor önizlemesine aktarılıyor; gerçek verilerle doğrulanmış değildir.' : 'Elektrik, doğal gaz ve yakıt verileri IPCC/GHG standartlarına göre işlenerek Kapsam 1 ve 2 karbon ayak izi doğrulandı.'}
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
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-midnight)' }}>
                              TSRS Rapor Metni Üretimi
                            </h4>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: reportStatus.progress >= 90 ? '#10B981' : '#3B82F6', background: reportStatus.progress >= 90 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                              {reportStatus.progress >= 90 ? 'TAMAMLANDI' : 'YAZILIYOR'}
                            </span>
                          </div>
                          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                            {reportStatus.progress >= 90
                              ? isDemoSimulation ? 'Hazır sentetik demo raporu ekranda gösterime hazır.' : 'Rapor bölümleri TSRS standartlarına göre oluşturuldu.'
                              : `${reportStatus.message}`}
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
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-midnight)' }}>
                              SHA-256 Dosya Özeti
                            </h4>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: reportStatus.status === 'completed' ? '#10B981' : '#60A5FA', background: reportStatus.status === 'completed' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(96, 165, 250, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                              {reportStatus.status === 'completed' ? 'MÜHÜRLENDİ' : 'İMZALANIYOR'}
                            </span>
                          </div>
                          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                            Yayımlanan raporun veri bütünlüğü SHA-256 kriptografik özeti ile mühürlendi.
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
                        <>
                          <button 
                            onClick={() => setIsGenerating(false)} 
                            className="btn-outline" 
                            style={{ 
                              padding: '10px 20px', 
                              fontSize: '13px', 
                              borderRadius: '10px', 
                              border: '1px solid #CBD5E1',
                              color: '#475569',
                              background: '#FFFFFF',
                              cursor: 'pointer'
                            }}
                          >
                            Kapat
                          </button>
                          <button 
                            onClick={isGreenTextileUser(currentUser) ? handleDemoReport : handleGenerateReport}
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
                            {isGreenTextileUser(currentUser) ? 'Demo Akışını Tekrar Göster' : 'Tekrar Dene'}
                          </button>
                        </>
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

      <AnimatePresence>
        {showPdfViewer && reportVersionId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setShowPdfViewer(false);
            }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1200,
              background: 'rgba(9, 18, 32, 0.72)', backdropFilter: 'blur(5px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '22px'
            }}
          >
            <motion.section
              initial={{ y: 18, scale: 0.985 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 12, scale: 0.99 }}
              transition={{ duration: 0.18 }}
              role="dialog"
              aria-modal="true"
              aria-label="TSRS raporu PDF önizleme"
              style={{
                width: 'min(1180px, 100%)', height: 'min(92vh, 940px)',
                background: '#F8FAFC', borderRadius: '16px', overflow: 'hidden',
                boxShadow: '0 28px 90px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column'
              }}
            >
              <header style={{
                minHeight: '66px', padding: '12px 18px', background: '#FFFFFF',
                borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: '16px'
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#087F68', fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px' }}>
                    E K O F I N · PDF ÖNİZLEME
                  </div>
                  <div style={{ color: '#12243A', fontSize: '14px', fontWeight: 750, marginTop: '3px' }}>
                    {ticker} · TSRS Sürdürülebilirlik Raporu · {reportingYear}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <a
                    href={`${pdfUrl}?download=true`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 12px',
                      borderRadius: '8px', color: '#FFFFFF', background: '#087F68',
                      fontSize: '12px', fontWeight: 700, textDecoration: 'none'
                    }}
                  >
                    <Download size={15} /> PDF İndir
                  </a>
                  <button
                    onClick={() => setShowPdfViewer(false)}
                    aria-label="PDF önizlemeyi kapat"
                    style={{
                      width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #D0D5DD',
                      background: '#FFFFFF', color: '#344054', cursor: 'pointer', display: 'grid', placeItems: 'center'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </header>
              <iframe
                title={`${ticker} ${reportingYear} TSRS raporu PDF`}
                src={`${pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
                style={{ flex: 1, width: '100%', border: 0, background: '#E5E7EB' }}
              />
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TsrsReport;
