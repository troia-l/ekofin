import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileSpreadsheet, CheckCircle2, FileBadge2, Check, RefreshCw, Link2, ShieldAlert, FileText, Leaf, AlertTriangle, Sparkles, Trash2, X, ExternalLink, Plus } from 'lucide-react';

// Bağlanılabilir ERP/muhasebe/e-fatura servisleri — tıklanınca ilgili sağlayıcının
// gerçek giriş/tanıtım sayfasına yönlendirir (gerçek OAuth entegrasyonu yok,
// bilinçli olarak "hacky" bir yönlendirme).
const AVAILABLE_INTEGRATIONS = [
  { id: 'sap', name: 'SAP Business One', desc: 'ERP & Finansal Yönetim', color: '#008FD3', url: 'https://accounts.sap.com/', connected: true },
  { id: 'logo', name: 'LOGO Tiger', desc: 'Muhasebe & Ön Muhasebe', color: '#E42528', url: 'https://cloud.logo.com.tr/', connected: true },
  { id: 'netsis', name: 'Netsis', desc: 'ERP Yazılımı', color: '#6D28D9', url: 'https://www.netsis.com.tr/' },
  { id: 'mikro', name: 'Mikro Yazılım', desc: 'Muhasebe & ERP', color: '#0EA5E9', url: 'https://www.mikro.com.tr/' },
  { id: 'parasut', name: 'Paraşüt', desc: 'Bulut Ön Muhasebe', color: '#8B5CF6', url: 'https://uygulama.parasut.com/users/sign_in' },
  { id: 'nilvera', name: 'Nilvera', desc: 'e-Fatura & e-Arşiv Entegrasyonu', color: '#10B981', url: 'https://portal.nilvera.com/' },
  { id: 'luca', name: 'Luca', desc: 'Bulut Muhasebe', color: '#F59E0B', url: 'https://www.luca.com.tr/' },
];
import ManagerDeclarationDashboard from '../../components/ManagerDeclarationDashboard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

// Belge türü tanımları
const DOC_DEFINITIONS = [
  { id: 'sgk', title: 'SGK Hizmet Dökümleri', desc: 'Personel sayısı doğrulaması için', docType: 'sgk' },
  { id: 'declaration', title: 'Yönetici Beyan Formu', desc: 'Şirket araç, çalışan ve ÇYS beyanı', docType: null },
  { id: 'sanayi_sicil', title: 'Sanayi Sicil Belgesi', desc: 'Resmi kapasite ve NACE kod onayı', docType: 'sanayi_sicil' },
  { id: 'kapasite_raporu', title: 'Kapasite Raporu (TOBB)', desc: 'Üretim limitleri doğrulaması', docType: 'kapasite_raporu' },
  { id: 'ekb', title: 'Enerji Kimlik Belgesi (EKB)', desc: 'Tesis enerji verimlilik kanıtı', docType: 'ekb' },
  { id: 'iso_14001', title: 'ISO 14001 Çevre YYS', desc: 'Çevre yönetim sistemi sertifikası', docType: 'iso_14001' },
  { id: 'mizan', title: 'Mizan (Muhasebe Bilançosu)', desc: 'Kurumsal bilanço ve hesap planı verisi', docType: 'mizan' },
  { id: 'motat', title: 'MOTAT Atık ve Su Beyanı', desc: 'Atık yönetimi ve su tüketim beyanı', docType: 'motat' },
  { id: 'osgb', title: 'OSGB Raporu', desc: 'İş sağlığı ve güvenliği denetim raporu', docType: 'osgb' },
  { id: 'tasit', title: 'Taşıt Tanıma Sistemi Kaydı', desc: 'Filo/araç envanteri doğrulaması', docType: 'tasit' },
  { id: 'faaliyet', title: 'Şirket Faaliyet Raporu', desc: 'Genel faaliyet ve finansal özet', docType: 'faaliyet' },
];

const Integration = () => {
  const { currentUser } = useOutletContext() || {};
  const ticker = currentUser?.companyTicker || null;
  const withTicker = (url) => ticker ? `${url}${url.includes('?') ? '&' : '?'}ticker=${encodeURIComponent(ticker)}` : url;

  const [isHoveringDrop, setIsHoveringDrop] = useState(false);
  const [showDeclarationDashboard, setShowDeclarationDashboard] = useState(false);
  const [initialDashboardMode, setInitialDashboardMode] = useState('wizard');
  const [declarationData, setDeclarationData] = useState(null);
  const [docStatuses, setDocStatuses] = useState({});
  const [recentUploads, setRecentUploads] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const docFileInputRef = useRef(null);
  const [activeDocUpload, setActiveDocUpload] = useState(null);

  // Rapor durum ve polling state'leri
  const [reportStatus, setReportStatus] = useState({ status: 'idle', progress: 0, message: '' });
  const [isLatestReportFound, setIsLatestReportFound] = useState(false);
  const pollingRef = useRef(null);
  const navigate = useNavigate();

  // Sayfa açıldığında (ve hangi şirket olarak giriş yapıldığı belli olunca) API'den veri çek
  useEffect(() => {
    fetchDocStatuses();
    fetchDeclaration();
    fetchRecentUploads();
    fetchReportStatus();
    checkLatestReport();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [ticker]);

  const checkLatestReport = async () => {
    try {
      const res = await fetch(withTicker(`${API_URL}/api/report/latest`));
      if (res.ok) {
        const data = await res.json();
        setIsLatestReportFound(data.status === 'found');
      }
    } catch (e) { console.error('Son rapor kontrol edilemedi:', e); }
  };

  const fetchReportStatus = async () => {
    try {
      const res = await fetch(withTicker(`${API_URL}/api/report/status`));
      if (res.ok) {
        const data = await res.json();
        setReportStatus(data);
        if (data.status === 'generating') {
          startPolling();
        } else {
          stopPolling();
        }
      }
    } catch (e) { console.error('Rapor durumu alınamadı:', e); }
  };

  const startPolling = () => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(withTicker(`${API_URL}/api/report/status`));
        if (res.ok) {
          const data = await res.json();
          setReportStatus(data);
          if (data.status !== 'generating') {
            stopPolling();
            checkLatestReport();
          }
        }
      } catch (e) {
        console.error('Polling hatası:', e);
        stopPolling();
      }
    }, 1500);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleGenerateReport = () => {
    navigate('/tsrs-report', { state: { triggerGenerate: true } });
  };

  const fetchDocStatuses = async () => {
    try {
      const res = await fetch(withTicker(`${API_URL}/api/documents/status`));
      if (res.ok) {
        const data = await res.json();
        setDocStatuses(data.documents || {});
      }
    } catch (e) { console.error('Belge durumu alınamadı:', e); }
  };

  const fetchDeclaration = async () => {
    try {
      const res = await fetch(withTicker(`${API_URL}/api/declaration`));
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'found') setDeclarationData(data.data);
        else setDeclarationData(null);
      }
    } catch (e) { console.error('Anket verisi alınamadı:', e); }
  };

  const fetchRecentUploads = async () => {
    try {
      const res = await fetch(withTicker(`${API_URL}/api/documents/list`));
      if (res.ok) {
        const data = await res.json();
        setRecentUploads(data.uploads || []);
      }
    } catch (e) { console.error('Yükleme listesi alınamadı:', e); }
  };

  const handleFileUpload = async (file, docType) => {
    if (!file || !docType) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docType);
      if (ticker) formData.append('ticker', ticker);
      const res = await fetch(`${API_URL}/api/documents/upload`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Yükleme hatası');
      await fetchDocStatuses();
      await fetchRecentUploads();
    } catch (e) {
      console.error('Dosya yüklenemedi:', e);
      alert('Dosya yükleme hatası: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const [deletingDocType, setDeletingDocType] = useState(null);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);

  const openIntegration = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteDocument = async (docType) => {
    if (!docType || !window.confirm('Bu belgeyi kaldırmak istediğinize emin misiniz? Yeniden yüklemeniz gerekecek.')) return;
    setDeletingDocType(docType);
    try {
      const res = await fetch(withTicker(`${API_URL}/api/documents/${docType}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Belge kaldırılamadı');
      await fetchDocStatuses();
      await fetchRecentUploads();
    } catch (e) {
      console.error('Belge kaldırılamadı:', e);
      alert('Belge kaldırma hatası: ' + e.message);
    } finally {
      setDeletingDocType(null);
    }
  };

  const handleDeleteUploadLogEntry = async (index) => {
    try {
      const res = await fetch(withTicker(`${API_URL}/api/documents/list/${index}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Kayıt kaldırılamadı');
      await fetchRecentUploads();
    } catch (e) {
      console.error('Yükleme kaydı kaldırılamadı:', e);
    }
  };

  const handleDeleteDeclaration = async () => {
    if (!window.confirm('Yönetici beyanını kaldırmak istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(withTicker(`${API_URL}/api/declaration`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Beyan kaldırılamadı');
      setDeclarationData(null);
      await fetchDocStatuses();
    } catch (e) {
      console.error('Beyan kaldırılamadı:', e);
      alert('Beyan kaldırma hatası: ' + e.message);
    }
  };

  const handleDeclarationSubmit = async (data) => {
    try {
      const res = await fetch(withTicker(`${API_URL}/api/declaration`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setDeclarationData(data);
        setShowDeclarationDashboard(false);
        await fetchDocStatuses();
      }
    } catch (e) {
      console.error('Anket gönderilemedi:', e);
    }
  };

  // Belge durumunu hesapla
  const getDocStatus = (docDef) => {
    if (docDef.id === 'declaration') {
      return declarationData ? 'verified_decl' : 'fill_decl';
    }
    const apiStatus = docStatuses[docDef.id];
    if (apiStatus?.status === 'verified') return 'verified';
    return 'upload';
  };

  const getDocDate = (docDef) => {
    if (docDef.id === 'declaration') return declarationData ? 'Güncel' : '-';
    const apiStatus = docStatuses[docDef.id];
    if (apiStatus?.uploaded_at) {
      return new Date(apiStatus.uploaded_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    if (apiStatus?.status === 'verified') return 'Güncel';
    return '-';
  };

  const docs = DOC_DEFINITIONS.map(d => ({
    ...d, status: getDocStatus(d), date: getDocDate(d),
  }));

  if (showDeclarationDashboard) {
    return (
      <ManagerDeclarationDashboard 
        onBack={() => setShowDeclarationDashboard(false)}
        onSubmit={handleDeclarationSubmit}
        initialData={declarationData}
        initialMode={initialDashboardMode}
      />
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex-col gap-6">
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="page-title">Veri Entegrasyon Merkezi</h1>
        <p className="page-subtitle">ERP sistemlerinizi, faturalarınızı ve yasal belgelerinizi 256-bit uçtan uca şifrelemeyle senkronize edin.</p>
      </motion.div>

      {/* AI TSRS Raporlama ve Analiz Motoru */}
      <motion.div 
        variants={itemVariants} 
        className="card glass-panel"
        style={{
          background: 'linear-gradient(135deg, #0B1120 0%, #063C31 100%)',
          color: '#FFFFFF',
          padding: '28px',
          borderRadius: '20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Dekoratör glow */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="flex justify-between items-start" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <div className="flex gap-4 items-center" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="icon-3d" style={{ background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-emerald-dark))', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-3d-icon)', flexShrink: 0 }}>
              <Sparkles color="white" size={24} className={reportStatus.status === 'generating' ? 'animate-pulse' : ''} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Yapay Zeka TSRS Raporlama ve Analiz Motoru
              </h3>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500, marginTop: '2px' }}>
                Veri kaynaklarınızı birleştirerek bağımsız denetime hazır sürdürülebilirlik beyanınızı oluşturun.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {reportStatus.status === 'generating' && (
              <span className="animate-pulse" style={{ fontSize: '12px', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.15)', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                Rapor Üretiliyor (%{reportStatus.progress})
              </span>
            )}
            {reportStatus.status === 'completed' && (
              <span style={{ fontSize: '12px', color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                Rapor Hazır (Güncel)
              </span>
            )}
            {reportStatus.status === 'idle' && isLatestReportFound && (
              <span style={{ fontSize: '12px', color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                Rapor Mevcut
              </span>
            )}
            {reportStatus.status === 'idle' && !isLatestReportFound && (
              <span style={{ fontSize: '12px', color: '#94A3B8', background: 'rgba(148, 163, 184, 0.1)', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, border: '1px solid rgba(148, 163, 184, 0.15)' }}>
                Rapor Üretilmedi
              </span>
            )}
            {reportStatus.status === 'error' && (
              <span style={{ fontSize: '12px', color: '#EF4444', background: 'rgba(239, 68, 68, 0.15)', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                Hata Oluştu
              </span>
            )}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          {reportStatus.status === 'generating' ? (
            <div className="flex-col gap-3" style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
              <div className="flex justify-between items-center mb-1" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--accent-emerald)' }} />
                  {reportStatus.message}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  %{reportStatus.progress}
                </span>
              </div>
              
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', position: 'relative', width: '100%', marginTop: '8px' }}>
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: `${reportStatus.progress}%` }}
                  transition={{ type: 'tween', ease: 'easeInOut' }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-emerald), #34D399)' }} 
                />
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
                Yapay zeka verilerinizi okuyor, standartlara göre sınıflandırıyor ve TSRS-1/TSRS-2 uyumlu raporunuzu oluşturuyor. Lütfen sayfayı kapatmayın.
              </p>
            </div>
          ) : reportStatus.status === 'completed' || (reportStatus.status === 'idle' && isLatestReportFound) ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.05)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.2)', width: '100%' }}>
              <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle2 size={20} style={{ color: '#10B981', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>TSRS Raporu Hazır ve Kriptografik Olarak Mühürlendi!</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                    Verileriniz işlendi ve TSRS Sürdürülebilirlik Raporu başarıyla üretildi.
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  onClick={handleGenerateReport} 
                  className="btn-outline" 
                  style={{ 
                    padding: '10px 16px', 
                    fontSize: '13px', 
                    borderRadius: '10px', 
                    border: '1px solid rgba(255,255,255,0.2)', 
                    color: '#FFFFFF',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={14} /> Yeniden Oluştur
                </button>
                <button 
                  onClick={() => navigate('/tsrs-report')} 
                  className="btn-primary" 
                  style={{ 
                    padding: '10px 20px', 
                    fontSize: '13px', 
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FileText size={14} /> Raporu Görüntüle
                </button>
              </div>
            </div>
          ) : reportStatus.status === 'error' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239, 68, 68, 0.05)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.2)', width: '100%' }}>
              <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle size={20} style={{ color: '#EF4444', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Rapor Üretim Hatası</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                    {reportStatus.message}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleGenerateReport} 
                className="btn-primary" 
                style={{ 
                  padding: '10px 20px', 
                  fontSize: '13px', 
                  borderRadius: '10px', 
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} /> Tekrar Dene
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.05)', width: '100%' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>TSRS Standartlarına Göre Rapor Oluşturun</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                  Bağlantılı API verileriniz, yüklediğiniz e-Faturalar ve beyan ettiğiniz yasal evraklar analiz edilir.
                </div>
              </div>
              
              <button 
                onClick={handleGenerateReport} 
                className="btn-primary" 
                style={{ 
                  padding: '12px 24px', 
                  fontSize: '14px', 
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Sparkles size={16} /> TSRS Raporu Oluştur
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
        
        {/* Left Column: Connections & Uploads */}
        <div className="flex-col gap-6">
          
          {/* Active Connections */}
          <motion.div variants={itemVariants} className="card glass-panel flex-col gap-4">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-midnight)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link2 size={18} color="var(--accent-emerald)" /> Canlı Sistem Bağlantıları (API)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              
              <motion.div
                whileHover={{ scale: 1.03 }}
                onClick={() => openIntegration('https://accounts.sap.com/')}
                title="SAP hesabınıza giriş yapmak için tıklayın"
                style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative', cursor: 'pointer' }}
              >
                <div style={{ position: 'absolute', top: '12px', right: '12px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 8px var(--accent-emerald)' }} />
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#008FD3' }}>SAP</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>ERP Senkronize <ExternalLink size={10} /></div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                onClick={() => openIntegration('https://cloud.logo.com.tr/')}
                title="LOGO hesabınıza giriş yapmak için tıklayın"
                style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative', cursor: 'pointer' }}
              >
                <div style={{ position: 'absolute', top: '12px', right: '12px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 8px var(--accent-emerald)' }} />
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#E42528' }}>LOGO</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>Muhasebe Aktif <ExternalLink size={10} /></div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowIntegrationsModal(true)}
                style={{ padding: '16px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', border: '1px dashed var(--text-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '8px' }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>+</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Yeni Bağlantı</div>
              </motion.div>

            </div>
          </motion.div>

          {/* Manual Upload */}
          <motion.div variants={itemVariants} className="card glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-midnight)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DatabaseIcon color="var(--primary-midnight)" /> e-Fatura & UBL Paketi Yükle
            </h3>
            
            <motion.div 
              onMouseEnter={() => setIsHoveringDrop(true)}
              onMouseLeave={() => setIsHoveringDrop(false)}
              animate={{ 
                borderColor: isHoveringDrop ? 'var(--accent-emerald)' : 'var(--border-color)',
                background: isHoveringDrop ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.4)'
              }}
              style={{ 
                border: '2px dashed', 
                borderRadius: '16px', 
                padding: '40px 20px', 
                textAlign: 'center', 
                marginBottom: '24px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              <motion.div animate={{ y: isHoveringDrop ? -5 : 0 }} transition={{ type: 'spring' }}>
                <UploadCloud size={48} color={isHoveringDrop ? 'var(--accent-emerald)' : 'var(--text-light)'} style={{ margin: '0 auto 16px auto', filter: isHoveringDrop ? 'drop-shadow(0 4px 10px rgba(16,185,129,0.4))' : 'none', transition: 'all 0.3s' }} />
              </motion.div>
              <h4 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--primary-midnight)' }}>UBL / XML Paketlerini Sürükleyin</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>veya bilgisayarınızdan seçmek için tıklayın.</p>
              <input ref={fileInputRef} type="file" accept=".xml,.zip,.pdf,.md,.json" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) handleFileUpload(e.target.files[0], 'efatura'); }} />
              <button className="btn-primary" style={{ padding: '10px 24px', cursor: 'pointer' }} disabled={uploading} onClick={() => fileInputRef.current?.click()}>{uploading ? 'Yükleniyor...' : 'Dosya Seç'}</button>
            </motion.div>

            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.5px' }}>SON YÜKLENEN PAKETLER</h4>
              
              {recentUploads.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Henüz dosya yüklenmedi.</div>
              ) : (
                <div className="flex-col gap-2">
                  {recentUploads.slice(0, 5).map((upload, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ x: 5 }}
                      className="flex-col gap-2" 
                      style={{ 
                        padding: '16px', 
                        background: 'var(--bg-main)', 
                        borderRadius: '12px',
                        borderLeft: '4px solid var(--accent-emerald)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <FileSpreadsheet size={18} color="var(--primary-midnight)" />
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-midnight)' }}>{upload.filename}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: upload.status === 'processed' ? 'var(--accent-emerald)' : 'var(--warning)', fontWeight: 600 }}>
                            <Check size={14} /> {upload.status === 'processed' ? 'İşlendi' : 'Bekliyor'}
                          </div>
                          <button
                            onClick={() => handleDeleteUploadLogEntry(idx)}
                            title="Kaydı listeden kaldır"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', padding: 0 }}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                      <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '100%', background: 'var(--accent-emerald)' }}></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Management Declaration Summary Widget */}
          {declarationData && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="card glass-panel flex-col gap-4"
              style={{
                borderLeft: '4px solid var(--accent-emerald)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(244,252,248,0.9))'
              }}
            >
              <div className="flex justify-between items-center">
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-midnight)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Leaf size={18} color="var(--accent-emerald)" /> Aktif Yönetici Beyan Özeti
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--accent-emerald-dark)', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
                  Veriler Raporlamaya İşlendi
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '4px' }}>
                <div style={{ padding: '12px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Sosyal Yapı</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-midnight)' }}>{declarationData.employeeCount} Çalışan</div>
                  <span style={{ fontSize: '10px', color: 'var(--text-light)', fontWeight: 600 }}>+{declarationData.extraExcuseLeave} Gün İzin</span>
                </div>

                <div style={{ padding: '12px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Mobilite Filosu</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-midnight)' }}>
                    {Object.values(declarationData.vehiclesCount).reduce((a, b) => a + b, 0)} Araç
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-light)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    ⚡{declarationData.vehiclesCount.electric} / 🌱{declarationData.vehiclesCount.hybrid} / ⛽{declarationData.vehiclesCount.gasoline}
                  </span>
                </div>

                <div style={{ padding: '12px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Yıllık Tüketim</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-midnight)' }}>
                    {declarationData.annualElectricity.toLocaleString()} kWh
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-light)', fontWeight: 600 }}>
                    💧{declarationData.annualWater} m³ Su
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.04)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.1)', fontSize: '12px', color: 'var(--accent-emerald-dark)', fontWeight: 500 }}>
                <Check size={16} /> Beyan edilen ÇYS: &nbsp;
                <strong style={{ textTransform: 'capitalize' }}>
                  {declarationData.hasEmsPolicy === 'yes' ? 'Mevcut (ISO 14001)' : declarationData.hasEmsPolicy === 'planning' ? 'Hazırlanıyor' : 'Mevcut Değil'}
                </strong>
                {declarationData.hasRenewableEnergy && " | ☀️ GES Aktif"}
              </div>

              {/* Hemen Oluştur Button if EMS is not ready */}
              {declarationData.hasEmsPolicy !== 'yes' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.1)', marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <AlertTriangle size={14} /> ÇYS Belgesi Eksik!
                  </div>
                  <button 
                    onClick={() => {
                      setInitialDashboardMode('ai_generator');
                      setShowDeclarationDashboard(true);
                    }}
                    className="btn-primary" 
                    style={{ 
                      padding: '4px 10px', 
                      fontSize: '11px', 
                      borderRadius: '6px', 
                      height: 'auto', 
                      background: 'linear-gradient(135deg, var(--warning), #D97706)',
                      boxShadow: '0 2px 5px rgba(245, 158, 11, 0.2)',
                      cursor: 'pointer'
                    }}
                  >
                    Hemen Oluştur (YZ)
                  </button>
                </div>
              )}
            </motion.div>
          )}

        </div>

        {/* Right Column: Legal Documents */}
        <div className="flex-col gap-6">
          <motion.div variants={itemVariants} className="card glass-panel" style={{ height: '100%' }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="icon-3d" style={{ background: 'linear-gradient(135deg, #F59E0B, #B45309)', width: '48px', height: '48px' }}>
                <FileBadge2 color="white" size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-midnight)' }}>Yasal Beyanlar</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>TSRS Denetim Dokümanları</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              {docs.map((doc, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  className="flex justify-between items-center" 
                  style={{ 
                    padding: '16px 20px', 
                    background: (doc.status === 'verified' || doc.status === 'verified_decl') ? 'rgba(16, 185, 129, 0.03)' : 'var(--bg-main)', 
                    borderRadius: '12px',
                    border: (doc.status === 'verified' || doc.status === 'verified_decl') ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-color)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.01)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-midnight)' }}>{doc.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{doc.desc}</div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {doc.status === 'verified' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="flex items-center gap-1" style={{ color: 'var(--accent-emerald-dark)', fontWeight: 700, fontSize: '12px' }}>
                          <CheckCircle2 size={14} /> ONAYLI
                        </div>
                        <button
                          onClick={() => { setActiveDocUpload(doc.docType); docFileInputRef.current?.click(); }}
                          title="Belgeyi değiştir (yeniden yükle)"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', padding: 0 }}
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.docType)}
                          disabled={deletingDocType === doc.docType}
                          title="Belgeyi kaldır"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', padding: 0 }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                    {doc.status === 'verified_decl' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="flex items-center gap-1" style={{ color: 'var(--accent-emerald-dark)', fontWeight: 700, fontSize: '12px' }}>
                          <CheckCircle2 size={14} /> GÖNDERİLDİ
                        </div>
                        <button
                          onClick={() => {
                            setInitialDashboardMode('wizard');
                            setShowDeclarationDashboard(true);
                          }}
                          className="btn-outline"
                          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', height: 'auto', border: '1px solid var(--accent-emerald)', cursor: 'pointer' }}
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={handleDeleteDeclaration}
                          title="Beyanı kaldır"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', padding: 0 }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                    {doc.status === 'fill_decl' && (
                      <button 
                        onClick={() => {
                          setInitialDashboardMode('wizard');
                          setShowDeclarationDashboard(true);
                        }}
                        className="btn-primary" 
                        style={{ 
                          padding: '6px 16px', 
                          fontSize: '12px', 
                          borderRadius: '8px', 
                          background: 'linear-gradient(135deg, var(--warning), #D97706)', 
                          boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)',
                          cursor: 'pointer'
                        }}
                      >
                        Doldur
                      </button>
                    )}
                    {doc.status === 'pending' && (
                      <div className="flex items-center gap-1" style={{ color: 'var(--warning)', fontWeight: 700, fontSize: '12px' }}>
                        <RefreshCw size={14} className="animate-spin" /> İNCELENİYOR
                      </div>
                    )}
                    {doc.status === 'upload' && (
                      <button className="btn-outline" style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer' }} disabled={uploading} onClick={() => { setActiveDocUpload(doc.docType); docFileInputRef.current?.click(); }}>{uploading ? '...' : 'Yükle'}</button>
                    )}
                    
                    {doc.status !== 'upload' && doc.status !== 'fill_decl' && doc.status !== 'verified_decl' && (
                      <div style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 500 }}>{doc.date}</div>
                    )}
                    {doc.status === 'verified_decl' && (
                      <div style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 500 }}>{doc.date}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <p style={{ fontSize: '12px', color: '#1E40AF', lineHeight: '1.6', fontWeight: 500 }}>
                <strong>TSRS Uyarı:</strong> Yüklenen belgeler, bağımsız denetim sürecinde doğrudan "Yeşil Kredi Pasaportu"na kriptografik olarak (Hash) mühürlenecektir. 
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Yasal Beyanlar listesindeki tüm "Yükle" butonları bu TEK gizli input'u
          paylaşır (activeDocUpload state'i hangi belge türü olduğunu taşır).
          Önceden bu input .map() içinde tekrar tekrar render ediliyordu ve
          docFileInputRef sadece SONUNCUSUNA bağlanıyordu — bu yüzden bazı
          butonlar hiç çalışmıyor gibi görünüyordu. */}
      <input
        ref={docFileInputRef}
        type="file"
        accept=".pdf,.md,.json,.xml,.zip,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files[0] && activeDocUpload) handleFileUpload(e.target.files[0], activeDocUpload);
          setActiveDocUpload(null);
          e.target.value = '';
        }}
      />

      {/* Yeni Bağlantı Ekle modalı — gerçek bir OAuth akışı yok; her servis
          kartı ilgili sağlayıcının gerçek giriş/tanıtım sayfasına yeni sekmede
          yönlendirir. */}
      <AnimatePresence>
        {showIntegrationsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowIntegrationsModal(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(11,17,32,0.6)',
              backdropFilter: 'blur(4px)', zIndex: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="card glass-panel"
              style={{ width: '100%', maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto', padding: '28px' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-midnight)' }}>Servis Ekle</h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Bağlamak istediğiniz ERP / muhasebe / e-fatura servisini seçin.
                  </p>
                </div>
                <button onClick={() => setShowIntegrationsModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              <div className="flex-col gap-3">
                {AVAILABLE_INTEGRATIONS.map((svc) => (
                  <motion.div
                    key={svc.id}
                    whileHover={{ x: 4 }}
                    onClick={() => openIntegration(svc.url)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)',
                      background: 'var(--bg-main)', cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${svc.color}1A`, color: svc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                        {svc.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--primary-midnight)' }}>{svc.name}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{svc.desc}</div>
                      </div>
                    </div>
                    {svc.connected ? (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-emerald-dark)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={13} /> Bağlı
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Plus size={13} /> Ekle
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Local Icon for Database
const DatabaseIcon = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg>
);

export default Integration;
