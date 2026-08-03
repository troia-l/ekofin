import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, FileSpreadsheet, CheckCircle2, FileBadge2, Check, RefreshCw, 
  Link2, ShieldAlert, FileText, Leaf, AlertTriangle, AlertOctagon, Info, Eye, Download, X 
} from 'lucide-react';
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
];

const Integration = () => {
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

  // Yeşil Aklama (Greenwashing) ve Demo Senaryo State'leri
  const [auditResult, setAuditResult] = useState(null);
  const [activeScenario, setActiveScenario] = useState('clean');
  const [loadingScenario, setLoadingScenario] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Sayfa açıldığında API'den veri çek
  useEffect(() => {
    fetchDocStatuses();
    fetchDeclaration();
    fetchRecentUploads();
    fetchGreenwashAudit();
  }, []);

  const fetchDocStatuses = async () => {
    try {
      const res = await fetch(`${API_URL}/api/documents/status`);
      if (res.ok) {
        const data = await res.json();
        setDocStatuses(data.documents || {});
      }
    } catch (e) { console.error('Belge durumu alınamadı:', e); }
  };

  const fetchDeclaration = async () => {
    try {
      const res = await fetch(`${API_URL}/api/declaration`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'found') setDeclarationData(data.data);
      }
    } catch (e) { console.error('Anket verisi alınamadı:', e); }
  };

  const fetchRecentUploads = async () => {
    try {
      const res = await fetch(`${API_URL}/api/documents/list`);
      if (res.ok) {
        const data = await res.json();
        setRecentUploads(data.uploads || []);
      }
    } catch (e) { console.error('Yükleme listesi alınamadı:', e); }
  };

  const fetchGreenwashAudit = async () => {
    try {
      const res = await fetch(`${API_URL}/api/documents/audit-greenwash`);
      if (res.ok) {
        const data = await res.json();
        setAuditResult(data);
        if (data.active_scenario) setActiveScenario(data.active_scenario);
      }
    } catch (e) { console.error('Yeşil aklama denetim verisi alınamadı:', e); }
  };

  const handleScenarioChange = async (scenario) => {
    setLoadingScenario(true);
    try {
      const res = await fetch(`${API_URL}/api/demo/load-scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      if (res.ok) {
        const data = await res.json();
        setAuditResult(data);
        setActiveScenario(scenario);
        await fetchDocStatuses();
        await fetchRecentUploads();
      }
    } catch (e) {
      console.error('Senaryo geçiş hatası:', e);
    } finally {
      setLoadingScenario(false);
    }
  };

  const handleFileUpload = async (file, docType) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docType);
      const res = await fetch(`${API_URL}/api/documents/upload`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Yükleme hatası');
      await fetchDocStatuses();
      await fetchRecentUploads();
      await fetchGreenwashAudit();
    } catch (e) {
      console.error('Dosya yüklenemedi:', e);
      alert('Dosya yükleme hatası: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeclarationSubmit = async (data) => {
    try {
      const res = await fetch(`${API_URL}/api/declaration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setDeclarationData(data);
        setShowDeclarationDashboard(false);
        await fetchDocStatuses();
        await fetchGreenwashAudit();
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
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex-col gap-6" style={{ position: 'relative' }}>
      
      {/* Page Header */}
      <motion.div variants={itemVariants} className="mb-4 flex justify-between items-end">
        <div>
          <h1 className="page-title">Veri Entegrasyon & Çapraz AI Denetim Merkezi</h1>
          <p className="page-subtitle">ERP sistemlerinizi, faturalarınızı ve mizan verilerinizi yapay zeka ile çapraz denetleyin, greenwashing risklerini anında yakalayın.</p>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2" 
          style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald-dark)', padding: '10px 16px', borderRadius: '12px', fontWeight: 600, fontSize: '13px', border: '1px solid rgba(16, 185, 129, 0.2)' }}
        >
          <ShieldAlert size={16} /> Banka Düzeyi Güvenlik & Kriptografik Denetim Aktif
        </motion.div>
      </motion.div>

      {/* 🎬 DEMO SCENARIO CONTROLLER & GREENWASHING SIMULATOR PANEL */}
      <motion.div variants={itemVariants} className="card glass-panel" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.98))', color: '#FFFFFF', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#38BDF8', background: 'rgba(56, 189, 248, 0.15)', padding: '4px 10px', borderRadius: '20px', marginBottom: '8px', textTransform: 'uppercase' }}>
              <Eye size={14} /> Live Demo Simülatörü — Yeşil Aklama (Greenwashing) Test Paneli
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Fatura & Mali Mizan Çapraz Doğrulama Kurgusu
            </h3>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0 0 0' }}>
              Demoda önce temiz veri akışını gösterin, ardından <em>"Ya şirket emisyon verisini gizleseydi?"</em> senaryosunu tek tıkla simüle edin.
            </p>
          </div>

          {/* Scenario Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => handleScenarioChange('clean')}
              disabled={loadingScenario}
              style={{
                padding: '12px 20px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: activeScenario === 'clean' ? '2px solid #10B981' : '1px solid rgba(255,255,255,0.2)',
                background: activeScenario === 'clean' ? 'linear-gradient(135deg, #059669, #10B981)' : 'rgba(255,255,255,0.05)',
                color: '#FFFFFF',
                boxShadow: activeScenario === 'clean' ? '0 4px 14px rgba(16,185,129,0.4)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <CheckCircle2 size={16} /> 1. Temiz Akış (Gerçek Tutarlı Veri)
            </button>

            <button
              onClick={() => handleScenarioChange('greenwashed')}
              disabled={loadingScenario}
              style={{
                padding: '12px 20px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: activeScenario === 'greenwashed' ? '2px solid #EF4444' : '1px solid rgba(255,255,255,0.2)',
                background: activeScenario === 'greenwashed' ? 'linear-gradient(135deg, #DC2626, #EF4444)' : 'rgba(255,255,255,0.05)',
                color: '#FFFFFF',
                boxShadow: activeScenario === 'greenwashed' ? '0 4px 14px rgba(239,68,68,0.4)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <AlertOctagon size={16} /> 2. Yeşil Aklama Senaryosu (Tahrif Edilmiş Fatura)
            </button>
          </div>
        </div>
      </motion.div>

      {/* 🔴/🟢 AI GREENWASHING AUDIT SUMMARY CARD */}
      {auditResult && (
        <motion.div 
          variants={itemVariants}
          style={{
            padding: '24px',
            borderRadius: '16px',
            background: auditResult.is_greenwashed ? 'linear-gradient(135deg, #FEF2F2, #FFF5F5)' : 'linear-gradient(135deg, #F0FDF4, #ECFDF5)',
            border: auditResult.is_greenwashed ? '2px solid #EF4444' : '1px solid #10B981',
            boxShadow: auditResult.is_greenwashed ? '0 10px 25px rgba(239, 68, 68, 0.15)' : '0 4px 15px rgba(16, 185, 129, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div 
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: auditResult.is_greenwashed ? '#EF4444' : '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}
              >
                {auditResult.is_greenwashed ? <AlertOctagon size={28} /> : <CheckCircle2 size={28} />}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: auditResult.is_greenwashed ? '#991B1B' : '#065F46', margin: 0 }}>
                  {auditResult.verdict}
                </h3>
                <div style={{ fontSize: '13px', fontWeight: 600, color: auditResult.is_greenwashed ? '#DC2626' : '#059669', marginTop: '2px' }}>
                  Yapay Zeka Çapraz Belge Denetim Skoru: Risk %{auditResult.risk_score}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAuditModal(true)}
              style={{
                padding: '10px 18px',
                background: auditResult.is_greenwashed ? '#DC2626' : '#059669',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <FileText size={16} /> Detaylı YZ Çapraz Denetim Raporunu Aç
            </button>
          </div>

          <p style={{ fontSize: '14px', color: auditResult.is_greenwashed ? '#7F1D1D' : '#047857', lineHeight: '1.6', margin: 0, fontWeight: 500 }}>
            {auditResult.summary}
          </p>

          {/* Quick Metrics Badges */}
          {auditResult.is_greenwashed && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '4px' }}>
              <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #FCA5A5' }}>
                <span style={{ fontSize: '11px', color: '#991B1B', fontWeight: 600 }}>Mizan vs Fatura Tutarsızlığı</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#DC2626' }}>
                  {auditResult.audit_details?.implied_unit_price_tl} TL/L (5.7x Fiyat)
                </div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #FCA5A5' }}>
                <span style={{ fontSize: '11px', color: '#991B1B', fontWeight: 600 }}>Gizlenen Scope-1 Emisyon</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#DC2626' }}>
                  {auditResult.carbon_impact?.hidden_scope1_tco2e} tCO2e (%{auditResult.carbon_impact?.underreporting_pct} Gizleme)
                </div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #FCA5A5' }}>
                <span style={{ fontSize: '11px', color: '#991B1B', fontWeight: 600 }}>Filo Tüketim Beyanı</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#DC2626' }}>
                  1.71 L/gün/araç (İmkansız Seviye)
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Main Grid Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
        
        {/* Left Column: Connections & Uploads */}
        <div className="flex-col gap-6">
          
          {/* Active Connections */}
          <motion.div variants={itemVariants} className="card glass-panel flex-col gap-4">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-midnight)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link2 size={18} color="var(--accent-emerald)" /> Canlı Sistem Bağlantıları (API)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              
              <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '12px', right: '12px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 8px var(--accent-emerald)' }} />
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#008FD3' }}>SAP</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>ERP Senkronize</div>
              </div>

              <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '12px', right: '12px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 8px var(--accent-emerald)' }} />
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#E42528' }}>LOGO</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Muhasebe Aktif</div>
              </div>

              <motion.div 
                whileHover={{ scale: 1.05 }}
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
                        borderLeft: auditResult?.is_greenwashed && idx === 0 ? '4px solid #EF4444' : '4px solid var(--accent-emerald)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <FileSpreadsheet size={18} color="var(--primary-midnight)" />
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-midnight)' }}>{upload.filename}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: auditResult?.is_greenwashed && idx === 0 ? '#DC2626' : 'var(--accent-emerald)', fontWeight: 600 }}>
                          {auditResult?.is_greenwashed && idx === 0 ? <AlertOctagon size={14} /> : <Check size={14} />} 
                          {auditResult?.is_greenwashed && idx === 0 ? 'Çelişkili Belge' : 'İşlendi'}
                        </div>
                      </div>
                      <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '100%', background: auditResult?.is_greenwashed && idx === 0 ? '#EF4444' : 'var(--accent-emerald)' }}></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

        </div>

        {/* Right Column: Legal Documents & Manager Declaration */}
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
                      <div className="flex items-center gap-1" style={{ color: 'var(--accent-emerald-dark)', fontWeight: 700, fontSize: '12px' }}>
                        <CheckCircle2 size={14} /> ONAYLI
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
                    {doc.status === 'upload' && (
                      <>
                        <input ref={docFileInputRef} type="file" accept=".pdf,.md,.json,.xml,.zip,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0] && activeDocUpload) handleFileUpload(e.target.files[0], activeDocUpload); setActiveDocUpload(null); }} />
                        <button className="btn-outline" style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer' }} disabled={uploading} onClick={() => { setActiveDocUpload(doc.docType); docFileInputRef.current?.click(); }}>{uploading ? '...' : 'Yükle'}</button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <p style={{ fontSize: '12px', color: '#1E40AF', lineHeight: '1.6', fontWeight: 500, margin: 0 }}>
                <strong>TSRS & Kriptografik Güvence:</strong> Yüklenen tüm belgeler SHA-256 hash imzasıyla "Yeşil Kredi Pasaportu"na mühürlenmektedir. Mizan ile çelişen tahrif edilmiş belgeler banka denetçileri tarafından anında reddedilir.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 🔍 DETAILED AI AUDIT MODAL */}
      <AnimatePresence>
        {showAuditModal && auditResult && (
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
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px'
            }}
            onClick={() => setShowAuditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                maxWidth: '850px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '32px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: auditResult.is_greenwashed ? '#EF4444' : '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-midnight)', margin: 0 }}>
                      Yapay Zeka Yeşil Aklama (Greenwashing) Çapraz Denetim Raporu
                    </h2>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Belge: Tüketim Faturaları vs Detaylı Mizan & Filo Tanıma Kayıtları</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowAuditModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Status Banner */}
              <div style={{ padding: '16px', borderRadius: '12px', background: auditResult.is_greenwashed ? '#FEF2F2' : '#F0FDF4', border: auditResult.is_greenwashed ? '1px solid #FCA5A5' : '1px solid #6EE7B7', marginBottom: '24px' }}>
                <div style={{ fontWeight: 800, fontSize: '15px', color: auditResult.is_greenwashed ? '#991B1B' : '#065F46', marginBottom: '4px' }}>
                  {auditResult.verdict}
                </div>
                <div style={{ fontSize: '13px', color: auditResult.is_greenwashed ? '#B91C1C' : '#047857' }}>
                  {auditResult.summary}
                </div>
              </div>

              {/* Side-by-side Comparative Analysis Table */}
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-midnight)', marginBottom: '12px' }}>
                📊 Çapraz Belge Kanıt Karşılaştırması
              </h3>

              <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>Metrik / Parametre</th>
                      <th style={{ padding: '12px' }}>Beyan Edilen Fatura</th>
                      <th style={{ padding: '12px' }}>Resmi Mizan Kaydı</th>
                      <th style={{ padding: '12px' }}>YZ Denetim Sonucu</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>Dizel Akaryakıt Miktarı</td>
                      <td style={{ padding: '12px', color: auditResult.is_greenwashed ? '#DC2626' : '#059669', fontWeight: 700 }}>
                        {auditResult.audit_details?.invoice_dizel_liters?.toLocaleString()} Litre
                      </td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>
                        420,000 TL Akaryakıt Gideri
                      </td>
                      <td style={{ padding: '12px' }}>
                        {auditResult.is_greenwashed ? (
                          <span style={{ color: '#DC2626', fontWeight: 700 }}>⚠️ 5.7x Mali Çelişki</span>
                        ) : (
                          <span style={{ color: '#059669', fontWeight: 700 }}>✅ Tam Uyumlu</span>
                        )}
                      </td>
                    </tr>

                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>İma Edilen Litre Fiyatı</td>
                      <td style={{ padding: '12px', fontWeight: 700, color: auditResult.is_greenwashed ? '#DC2626' : '#059669' }}>
                        {auditResult.audit_details?.implied_unit_price_tl} TL/L
                      </td>
                      <td style={{ padding: '12px' }}>21.00 TL/L (Piyasa Ortalaması)</td>
                      <td style={{ padding: '12px' }}>
                        {auditResult.is_greenwashed ? (
                          <span style={{ color: '#DC2626', fontWeight: 700 }}>❌ 120 TL/L (Tahrif Edilmiş)</span>
                        ) : (
                          <span style={{ color: '#059669', fontWeight: 700 }}>✅ Makul Fiyat</span>
                        )}
                      </td>
                    </tr>

                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>Scope-1 Emisyon Beyanı</td>
                      <td style={{ padding: '12px', fontWeight: 700 }}>
                        {auditResult.carbon_impact?.declared_scope1_tco2e} tCO2e
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700 }}>
                        {auditResult.carbon_impact?.actual_scope1_tco2e} tCO2e (Gerçek)
                      </td>
                      <td style={{ padding: '12px' }}>
                        {auditResult.is_greenwashed ? (
                          <span style={{ color: '#DC2626', fontWeight: 800 }}>⚠️ {auditResult.carbon_impact?.hidden_scope1_tco2e} tCO2e Gizlendi!</span>
                        ) : (
                          <span style={{ color: '#059669', fontWeight: 700 }}>✅ Doğru Beyan</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Detected Discrepancies List */}
              {auditResult.discrepancies?.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#991B1B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={16} color="#DC2626" /> Tespit Edilen Kritik Çelişkiler & Kanıtlar
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {auditResult.discrepancies.map((disc, idx) => (
                      <div key={idx} style={{ padding: '16px', background: '#FEF2F2', borderLeft: '4px solid #EF4444', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#991B1B', marginBottom: '4px' }}>
                          {disc.title}
                        </div>
                        <p style={{ fontSize: '13px', color: '#7F1D1D', margin: '0 0 8px 0', lineHeight: '1.5' }}>
                          {disc.description}
                        </p>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#B91C1C', fontWeight: 600 }}>
                          <span><strong>Beyan Edilen:</strong> {disc.declared}</span>
                          <span><strong>Mizan/Saha Karşılığı:</strong> {disc.expected}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Modal Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="btn-primary"
                  style={{ padding: '10px 24px', cursor: 'pointer' }}
                >
                  Kapat
                </button>
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
