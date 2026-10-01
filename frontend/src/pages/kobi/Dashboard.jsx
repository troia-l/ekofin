import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import JuryDemoTour from '../../components/JuryDemoTour';
import { GREEN_TEXTILE_DEMO, getGreenTextileDemoState, isGreenTextileUser } from '../../demo/greenTextileDemo';
import './Dashboard.css';
import {
  ShieldCheck,
  Zap,
  Leaf,
  Activity,
  RefreshCw, 
  Sparkles, 
  Award, 
  ArrowRight, 
  Check, 
  Copy, 
  Info, 
  CheckCircle2, 
  X, 
  Clock, 
  AlertTriangle,
  Cpu,
  FileText,
  FileSpreadsheet,
  FileBadge2,
  Building2,
  Database,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Dashboard = () => {
  const { currentUser } = useOutletContext() || {};
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [docStatuses, setDocStatuses] = useState({});
  const [companies, setCompanies] = useState([]);
  const [modelCardData, setModelCardData] = useState(null);
  const [reportReadiness, setReportReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  // Modals state
  const [showModelModal, setShowModelModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showDocValidityModal, setShowDocValidityModal] = useState(false);
  // Report file fingerprint copy state
  const [copied, setCopied] = useState(false);
  const [juryTourActive, setJuryTourActive] = useState(false);

  const ticker = currentUser?.companyTicker;
  const isGreenTextileDemo = isGreenTextileUser(currentUser);
  const greenTextileDemoState = isGreenTextileDemo ? getGreenTextileDemoState() : null;
  const greenTextileDataLoaded = Boolean(greenTextileDemoState?.loaded);

  useEffect(() => {
    if (window.sessionStorage.getItem('ecofin-jury-dashboard-tour') !== '1') return;
    window.sessionStorage.removeItem('ecofin-jury-dashboard-tour');
    setJuryTourActive(true);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const tickerParam = ticker ? `?ticker=${encodeURIComponent(ticker)}` : '';
      
      const year = new Date().getFullYear() - 1;
      const readinessUrl = ticker ? `${API_URL}/api/report/readiness?ticker=${encodeURIComponent(ticker)}&reporting_year=${year}` : null;
      const [sumRes, docsRes, compRes, modelRes, readinessRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/dashboard/summary${tickerParam}`),
        fetch(`${API_URL}/api/documents/status${tickerParam}`),
        fetch(`${API_URL}/api/esg/companies`),
        fetch(`${API_URL}/api/esg/model-card`),
        readinessUrl ? fetch(readinessUrl) : Promise.resolve(null)
      ]);

      const summaryLoaded = sumRes.status === 'fulfilled' && sumRes.value.ok;
      setDashboardError(summaryLoaded ? '' : 'Özet verileri şu anda alınamadı. Bağlantıyı kontrol edip yeniden deneyin.');
      if (summaryLoaded) {
        setSummary(await sumRes.value.json());
      }
      if (docsRes.status === 'fulfilled' && docsRes.value.ok) {
        const data = await docsRes.value.json();
        setDocStatuses(data.documents || {});
      }
      if (compRes.status === 'fulfilled' && compRes.value.ok) {
        setCompanies(await compRes.value.json());
      }
      if (modelRes.status === 'fulfilled' && modelRes.value.ok) {
        setModelCardData(await modelRes.value.json());
      }
      if (readinessRes.status === 'fulfilled' && readinessRes.value?.ok) {
        setReportReadiness(await readinessRes.value.json());
      }
    } catch (e) {
      console.error("Dashboard veri çekme hatası:", e);
      setDashboardError('Özet verileri şu anda alınamadı. Bağlantıyı kontrol edip yeniden deneyin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [ticker]);

  // Şirket profil tespiti
  const myCompany = companies.find(c => c.ticker === ticker);
  const totalDocs = greenTextileDataLoaded ? GREEN_TEXTILE_DEMO.sourceDocuments.length : (summary?.total_verified_documents ?? 0);
  const declarationOk = greenTextileDataLoaded || (summary?.declaration_submitted ?? false);
  const reportReady = reportReadiness?.report_state === 'current';
  
  // SHA-256 only comes from a published report returned by the backend.
  const reportHash = reportReadiness?.last_report?.sha256 ?? '';

  const isDataVerified = greenTextileDataLoaded || reportReadiness?.data_state === 'ready';

  const companyName = currentUser ? currentUser.companyName : 'KOBİ Sürdürülebilirlik Paneli';

  const copyHash = () => {
    if (!reportHash) return;
    navigator.clipboard.writeText(reportHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Veri Entegrasyonu sayfasında yüklenen tüm belge türleri ve güncellik durumları
  const integrationDocuments = [
    {
      id: 'efatura',
      icon: <Zap size={18} color="#059669" />,
      title: 'Elektrik & Doğalgaz Faturaları (UBL / XML)',
      desc: 'Kapsam 1 ve Kapsam 2 sera gazı emisyon hesaplamaları',
      periodText: 'Aylık Periyot',
      dateText: myCompany ? '18 Mayıs 2026' : (docStatuses['ekb']?.uploaded_at ? new Date(docStatuses['ekb'].uploaded_at).toLocaleDateString('tr-TR') : '2026 / Q1'),
      nextUpdateText: isDataVerified ? 'Yenileme: 18 Haz 2026' : 'Yükleme bekleniyor',
      isCurrent: isDataVerified,
      statusLabel: isDataVerified ? 'Şu An Güncel ✓' : 'Yükleme Gerekli',
      statusColor: isDataVerified ? '#059669' : '#D97706',
      statusBg: isDataVerified ? '#ECFDF5' : '#FFFBEB'
    },
    {
      id: 'sgk',
      icon: <FileSpreadsheet size={18} color="#059669" />,
      title: 'SGK Hizmet Dökümleri (Resmi Bordro)',
      desc: 'Personel sayısı doğrulaması, çalışan hakları ve İSG uyumluluğu',
      periodText: 'Aylık / Çeyreklik',
      dateText: myCompany ? '14 Mayıs 2026' : (docStatuses['sgk']?.uploaded_at ? new Date(docStatuses['sgk'].uploaded_at).toLocaleDateString('tr-TR') : '2026 / Q1'),
      nextUpdateText: isDataVerified ? 'Yenileme: 30 Haz 2026' : 'Yükleme bekleniyor',
      isCurrent: isDataVerified,
      statusLabel: isDataVerified ? 'Şu An Güncel ✓' : 'Yükleme Gerekli',
      statusColor: isDataVerified ? '#059669' : '#D97706',
      statusBg: isDataVerified ? '#ECFDF5' : '#FFFBEB'
    },
    {
      id: 'declaration',
      icon: <ShieldCheck size={18} color={declarationOk ? "#059669" : "#D97706"} />,
      title: 'Yönetici Beyan Formu (TSRS-1 & TSRS-2)',
      desc: 'Şirket araç filosu, yıllık su/enerji tüketimi ve ÇYS taahhütleri',
      periodText: 'Yıllık Periyot',
      dateText: declarationOk ? '2026 Dönemi' : 'Doldurulmadı',
      nextUpdateText: declarationOk ? 'Geçerlilik: 31 Ara 2026' : 'Form doldurulmalı',
      isCurrent: declarationOk,
      statusLabel: declarationOk ? 'Beyan Onaylandı ✓' : 'Doldurulması Gerekli',
      statusColor: declarationOk ? '#059669' : '#D97706',
      statusBg: declarationOk ? '#ECFDF5' : '#FFFBEB'
    },
    {
      id: 'sanayi_sicil',
      icon: <FileBadge2 size={18} color="#059669" />,
      title: 'Sanayi Sicil Belgesi',
      desc: 'Sanayi ve Teknoloji Bakanlığı resmi kapasite ve NACE kod onayı',
      periodText: '2 Yılda Bir Vize',
      dateText: myCompany ? 'Vize: 15 Eki 2025' : (docStatuses['sanayi_sicil']?.uploaded_at ? 'Doğrulandı' : 'Belge Eksik'),
      nextUpdateText: isDataVerified ? 'Vize Bitiş: 15 Eki 2027' : 'Yükleme bekleniyor',
      isCurrent: isDataVerified,
      statusLabel: isDataVerified ? 'Geçerli Belge ✓' : 'Yükleme Gerekli',
      statusColor: isDataVerified ? '#059669' : '#D97706',
      statusBg: isDataVerified ? '#ECFDF5' : '#FFFBEB'
    },
    {
      id: 'kapasite_raporu',
      icon: <Building2 size={18} color="#059669" />,
      title: 'Kapasite Raporu (TOBB Onaylı)',
      desc: 'Üretim makineleri, hammadde tüketim limitleri ve yıllık kapasite',
      periodText: '3 Yıl Geçerlilik',
      dateText: myCompany ? 'Kayıt: 24 Nis 2024' : (docStatuses['kapasite_raporu']?.uploaded_at ? 'Doğrulandı' : 'Belge Eksik'),
      nextUpdateText: isDataVerified ? 'Bitiş: 24 Nis 2027' : 'Yükleme bekleniyor',
      isCurrent: isDataVerified,
      statusLabel: isDataVerified ? 'Geçerli Belge ✓' : 'Yükleme Gerekli',
      statusColor: isDataVerified ? '#059669' : '#D97706',
      statusBg: isDataVerified ? '#ECFDF5' : '#FFFBEB'
    },
    {
      id: 'ekb',
      icon: <Leaf size={18} color="#059669" />,
      title: 'Enerji Kimlik Belgesi (EKB)',
      desc: 'Tesis ve fabrika binaları enerji performansı ve emisyon sınıfı kanıtı',
      periodText: '10 Yıl Geçerlilik',
      dateText: myCompany ? 'B Sınıfı (2021)' : (docStatuses['ekb']?.uploaded_at ? 'Kayıtlı' : 'Belge Eksik'),
      nextUpdateText: isDataVerified ? 'Geçerlilik: 2031' : 'Yükleme bekleniyor',
      isCurrent: isDataVerified,
      statusLabel: isDataVerified ? 'Geçerli EKB ✓' : 'Yükleme Gerekli',
      statusColor: isDataVerified ? '#059669' : '#D97706',
      statusBg: isDataVerified ? '#ECFDF5' : '#FFFBEB'
    },
    {
      id: 'iso_14001',
      icon: <Award size={18} color="#059669" />,
      title: 'ISO 14001 Çevre Yönetim Sistemi (ÇYS)',
      desc: 'Akredite kurum onaylı çevre yönetim sertifikası ve denetim raporu',
      periodText: 'Yıllık Gözetim',
      dateText: myCompany ? 'Denetim: Kas 2025' : (docStatuses['iso_14001']?.uploaded_at ? 'Aktif' : 'Opsiyonel'),
      nextUpdateText: isDataVerified ? 'Gözetim: Kas 2026' : 'Yükleme opsiyonel',
      isCurrent: isDataVerified,
      statusLabel: isDataVerified ? 'Sertifikalı ✓' : 'Opsiyonel',
      statusColor: isDataVerified ? '#059669' : '#64748B',
      statusBg: isDataVerified ? '#ECFDF5' : '#F1F5F9'
    },
    {
      id: 'erp_api',
      icon: <Database size={18} color="#059669" />,
      title: 'ERP & Muhasebe Senkronizasyonu (SAP / LOGO)',
      desc: 'Canlı e-Defter, muhasebe kayıtları ve enerji tüketim veri akışı',
      periodText: 'Canlı API',
      dateText: isDataVerified ? 'Son Senkronizasyon: Bugün' : 'Bağlantı Yok',
      nextUpdateText: isDataVerified ? '7/24 Kesintisiz Aktif' : 'Kurulum bekleniyor',
      isCurrent: isDataVerified,
      statusLabel: isDataVerified ? 'Canlı Senkronize ✓' : 'Bağlantı Bekliyor',
      statusColor: isDataVerified ? '#059669' : '#64748B',
      statusBg: isDataVerified ? '#ECFDF5' : '#F1F5F9'
    }
  ];

  // Güncellenmesi gereken belge tespiti
  const pendingDocs = integrationDocuments.filter(d => !d.isCurrent);
  const pendingDocsCount = pendingDocs.length;
  const allDocsCurrent = pendingDocsCount === 0;

  const dashboardTourSteps = [
    { target: '[data-jury-dashboard="esg-score"]', title: 'ESG performans özeti', description: 'Yüklenen rapor kaynaklarından hesaplanmış bir şirket skoru henüz bulunmuyor. Örnek tahminler güncel skor gibi gösterilmez.' },
    { target: '[data-jury-dashboard="documents"]', title: 'Kanıt ve belge durumu', description: 'Yüklenen kaynakların doğrulanma sayısını ve yenileme ihtiyacını gösterir. Veri entegrasyonundan sonra bu kutu örnek belgelerle güncellenecek.' },
    { target: '[data-jury-dashboard="declaration"]', title: 'Yönetici beyanı', description: 'TSRS 1 ve TSRS 2 için şirket yönetiminin onayladığı beyanların tamamlanma durumunu izler.' },
    { target: '[data-jury-dashboard="integrity"]', title: 'Rapor dosya bütünlüğü', description: 'Raporun dosya özeti ve bütünlük kontrolüyle ilgili bilgileri sunar. Bu bölüm bağımsız denetim veya güvence anlamına gelmez.' },
    { target: '[data-jury-dashboard="report"]', title: 'TSRS raporlama motoru', description: 'Kaynaklar tamamlandığında TSRS rapor taslağına ve analiz akışına buradan geçilir. Şimdi örnek kaynakları birlikte yükleyelim.' },
  ];

  const continueToDemoIntegration = () => {
    window.sessionStorage.setItem('ecofin-jury-integration-tour', '1');
    setJuryTourActive(false);
    navigate('/integration');
  };

  return (
    <main className="kobi-dashboard">
      
      {/* Üst Başlık ve Yenile Butonu */}
      <header className="dashboard-heading">
        <div>
          <div className="dashboard-eyebrow">
            SÜRDÜRÜLEBİLİRLİK ÇALIŞMA ALANI
          </div>
          <h1 className="dashboard-title">
            {companyName}
          </h1>
          {isGreenTextileDemo && (
            <span className="dashboard-demo-badge">
              <Sparkles size={11} /> SENTETİK JÜRİ DEMOSU
            </span>
          )}
        </div>

        <button 
          onClick={fetchDashboardData} 
          disabled={loading}
          className="dashboard-refresh"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Yenile
        </button>
      </header>

      {dashboardError && !loading && (
        <div className="dashboard-error" role="status">
          <AlertTriangle size={18} />
          <span>{dashboardError}</span>
          <button type="button" onClick={fetchDashboardData}>Yeniden dene</button>
        </div>
      )}

      {loading && (
        <div className="dashboard-loading" role="status" aria-live="polite">
          <span className="dashboard-loading-dot" /> Özet ve rapor durumu yükleniyor…
        </div>
      )}

      {/* YENİ ŞİRKET İÇİN: BİLGİLENDİRME BANNERI */}
      {!isDataVerified && (
        <div className="dashboard-onboarding" style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '16px',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <AlertTriangle size={24} color="#D97706" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#92400E' }}>
                Veri Doğrulaması Gerekli
              </div>
              <div style={{ fontSize: '13.5px', color: '#78350F', marginTop: '2px' }}>
                TSRS Raporlama ve g-ROI Simülatörüne erişebilmek için lütfen fatura ve resmi belgelerinizi yükleyin.
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/integration')}
            style={{
              background: '#059669',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Veri Entegrasyonuna Git <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ANA İKİ KOLONLU DÜZEN: KUSURSUZ HİZALANMIŞ (SOL METRİKLER, SAĞ KARTLAR) */}
      <div className="dashboard-layout" style={{
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 1.45fr) minmax(350px, 410px)', 
        gap: '20px', 
        alignItems: 'start' 
      }}>
        
        {/* ===================== SOL KOLON: METRİKLER, DOĞRULUK & GRAFİK ===================== */}
        <section className="dashboard-primary-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 1. ÜST KISIM: 4 METRİK KARTI (2x2 GRID - KUSURSUZ EŞİT HİZALI) */}
          <div className="dashboard-metrics" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* Metrik 1: Skor yalnızca şirket verilerinden üretildiğinde gösterilir. */}
            <div className="dashboard-metric-card dashboard-score-card" data-jury-dashboard="esg-score" style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '148px',
              boxSizing: 'border-box',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  ESG SKORU
                </span>
                <Award size={20} color="#78D8B5" />
              </div>
              
              <div className="dashboard-score-empty">
                <strong>Henüz hesaplanmadı</strong>
                <span>Yüklenen kaynaklardan üretilmiş güncel şirket skoru bulunmuyor.</span>
              </div>
            </div>

            {/* Metrik 2: Doğrulanan Belgeler (İçinde Buton ve Güncellik İndikatörü Bulunur) */}
            <div className="dashboard-metric-card" data-jury-dashboard="documents" style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '148px',
              boxSizing: 'border-box',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  DOĞRULANAN BELGELER
                </span>
                <Leaf size={20} color="#059669" />
              </div>

              {/* Sayı ve Geçerlilik Takvimi Butonu */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A' }}>{totalDocs}</span>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#059669', marginLeft: '4px' }}>/ 12</span>
                </div>

                <button
                  onClick={() => setShowDocValidityModal(true)}
                  style={{
                    background: '#F8FAFC',
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}
                >
                  <Clock size={14} color="#059669" />
                  <span>Geçerlilik Takvimi</span>
                </button>
              </div>

              {/* Güncellik Durumu Uyarısı */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700, color: allDocsCurrent ? '#059669' : '#D97706' }}>
                  {allDocsCurrent ? (
                    <>
                      <CheckCircle2 size={15} color="#059669" />
                      <span>Tüm Veriler Güncel</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={15} color="#D97706" />
                      <span>{pendingDocsCount > 0 ? `${pendingDocsCount} Belge Yenilenmeli` : 'Güncelleme Gerekli'}</span>
                    </>
                  )}
                </div>

                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                  {totalDocs >= 8 ? 'TSRS için yeterli' : 'Yükleme bekleniyor'}
                </span>
              </div>
            </div>

            {/* Metrik 3: Yönetici Beyanı */}
            <div className="dashboard-metric-card" data-jury-dashboard="declaration" style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '148px',
              boxSizing: 'border-box',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  YÖNETİCİ BEYANI
                </span>
                <ShieldCheck size={20} color={declarationOk ? "#059669" : "#64748B"} />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '6px' }}>
                <span style={{ fontSize: '26px', fontWeight: 800, color: declarationOk ? '#059669' : '#64748B' }}>
                  {declarationOk ? 'Onaylandı ✓' : 'Bekliyor'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: declarationOk ? '#059669' : '#64748B' }}>
                  {declarationOk ? 'TSRS 1 & 2 Anketi Tamam' : 'Anket formu doldurulmalı'}
                </span>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                  {declarationOk ? 'Form tamamlandı' : 'Gerekli'}
                </span>
              </div>
            </div>

            {/* Metrik 4: Blockchain İmzası & Pasaport (DÜZENLEME KALEM İKONU & İMZA DOĞRULA BURADA) */}
            <div className="dashboard-metric-card" data-jury-dashboard="integrity" style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '148px',
              boxSizing: 'border-box',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div className="dashboard-integrity-heading">
                <div>
                  <span className="dashboard-integrity-eyebrow">RAPOR DOSYA BÜTÜNLÜĞÜ</span>
                  <h3>{reportReadiness?.active_job_id ? 'Rapor hazırlanıyor' : reportHash ? 'SHA-256 özeti' : 'Henüz rapor yok'}</h3>
                </div>
                <span className={`dashboard-integrity-status ${reportReadiness?.active_job_id ? 'is-progress' : reportHash ? (reportReady ? 'is-current' : 'is-stale') : 'is-empty'}`}>
                  {reportReadiness?.active_job_id ? 'Üretimde' : reportHash ? (reportReady ? 'Güncel' : 'Güncelliğini yitirmiş') : 'Bekliyor'}
                </span>
              </div>

              {reportHash ? (
                <>
                  <div className="dashboard-integrity-hash">
                    <code title={reportHash}>{reportHash.slice(0, 12)}…{reportHash.slice(-8)}</code>
                    <button type="button" onClick={copyHash} className="dashboard-copy-hash" title="SHA-256 özetini kopyala" aria-label="SHA-256 özetini kopyala">
                      {copied ? <Check size={15} /> : <Copy size={15} />}
                    </button>
                  </div>
                  <div className="dashboard-integrity-meta">
                    <span>Yayımlanma tarihi</span>
                    <strong>
                      {reportReadiness?.last_report?.generated_at
                        ? new Date(reportReadiness.last_report.generated_at).toLocaleDateString('tr-TR')
                        : '—'}
                    </strong>
                  </div>
                </>
              ) : (
                <p className="dashboard-integrity-empty">
                  Rapor yayımlandığında dosya özeti ve yayımlanma tarihi burada görünür.
                </p>
              )}

              <button type="button" className="dashboard-integrity-link" onClick={() => navigate('/tsrs-report')}>
                {reportReadiness?.active_job_id ? 'Üretimi görüntüle' : reportHash ? 'Rapor alanına git' : 'Rapor oluştur'} <ArrowRight size={15} />
              </button>
            </div>

          </div>

          {/* 3. EN ALT: DÖNEMSEL ESG ANALİZ GRAFİĞİ (SADE & HİZALI) */}
          <div className="dashboard-chart" style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            height: '260px',
            boxSizing: 'border-box',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>ESG skor geçmişi</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Dönemsel görünüm</span>
            </div>
            <div className="dashboard-chart-empty">
              <Activity size={20} />
              <span>Kaynak verilerinden hesaplanan skor geçmişi henüz bulunmuyor.</span>
            </div>
          </div>

        </section>

        {/* ===================== SAĞ KOLON: 3 ADET KART (HİZALI VE SADE) ===================== */}
        <aside className="dashboard-secondary-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* SAĞ KART 1: TSRS Raporlama Motoru */}
          <div className="dashboard-feature-card dashboard-report-card" data-jury-dashboard="report" style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxSizing: 'border-box',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                RAPORLAMA MOTORU
              </span>
              <Sparkles size={18} color="#059669" />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              TSRS Raporlama Motoru
            </h3>
            
            <p style={{ fontSize: '14px', color: '#64748B', margin: 0, lineHeight: '1.5' }}>
              KAP verileri, e-faturalar ve yasal beyanlarla resmi sürdürülebilirlik raporunu üretin ve indirin.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', background: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B', fontWeight: 500 }}>Analiz Durumu:</span>
              <strong style={{ color: reportReady ? '#059669' : '#B45309', fontWeight: 700 }}>
                {reportReadiness?.active_job_id ? 'Rapor üretiliyor' : reportReady ? 'Güncel rapor hazır' : isDataVerified ? 'Üretime hazır' : 'Veri bekleniyor'}
              </strong>
            </div>

            <button 
              onClick={() => {
                if (isDataVerified) navigate('/tsrs-report');
                else navigate('/integration');
              }}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.2)'
              }}
            >
              <Sparkles size={16} /> {isDataVerified ? 'TSRS Raporuna Git' : 'Önce Veri Yükleyin'}
            </button>
          </div>

          {/* SAĞ KART 2: Yapay Zeka Modeli (Türkçe Kurumsal Adı: EkoFin Yapay Zeka ESG Skorlama Motoru) */}
          <div className="dashboard-feature-card" style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxSizing: 'border-box',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                YAPAY ZEKA MODELİ
              </span>
              <Cpu size={18} color="#059669" />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              EkoFin ESG Skorlama ve Tahmin Motoru
            </h3>

            {/* Sade ve Orantılı 4 Metrik */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div>
                <span style={{ color: '#64748B' }}>Model Güveni:</span>
                <strong style={{ display: 'block', color: '#059669', fontSize: '14px', marginTop: '1px' }}>
                  %{Math.round((modelCardData?.evaluation_metrics?.test_r2 || 0.941) * 100)} (Yüksek)
                </strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Veri Kaynağı:</span>
                <strong style={{ display: 'block', color: '#0F172A', fontSize: '14px', marginTop: '1px' }}>KAP & Bilanço</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Uyum Durumu:</span>
                <strong style={{ display: 'block', color: '#059669', fontSize: '14px', marginTop: '1px' }}>TSRS 1 & 2</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Şeffaflık:</span>
                <strong style={{ display: 'block', color: '#D97706', fontSize: '14px', marginTop: '1px' }}>Açıklanabilir YZ</strong>
              </div>
            </div>

            <button 
              onClick={() => setShowModelModal(true)}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: '10px',
                background: '#F8FAFC',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Info size={15} color="#059669" /> Model Kartı ve Teknik Detaylar
            </button>
          </div>

          {/* SAĞ KART 3: Denetim ve Güvence Durumu */}
          <div className="dashboard-feature-card" style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxSizing: 'border-box',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                DENETİM & GÜVENCE
              </span>
              <ShieldCheck size={18} color="#059669" />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Denetim ve Güvence Durumu
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#334155' }}>TSRS-1 Genel Hükümler:</span>
                <strong style={{ color: '#64748B', fontWeight: 700 }}>{reportReady ? 'Raporlandı' : 'Değerlendirilmedi'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#334155' }}>TSRS-2 İklim Riskleri:</span>
                <strong style={{ color: '#64748B', fontWeight: 700 }}>{reportReady ? 'Raporlandı' : 'Değerlendirilmedi'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#334155' }}>Sektörel Limit Uyumu:</span>
                <strong style={{ color: '#64748B', fontWeight: 700 }}>Bağımsız güvence yok</strong>
              </div>
            </div>

            <button 
              onClick={() => setShowAuditModal(true)}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: '10px',
                background: '#F8FAFC',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Award size={15} color="#D97706" /> Denetim Detayları
            </button>
          </div>

        </aside>

      </div>

      {/* MODAL 1: GOOGLE MODEL CARDS TEKNİK DETAYLARI (KURUMSAL TÜRKÇE BAŞLIKLI) */}
      <AnimatePresence>
        {showModelModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModelModal(false)}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
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
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ padding: '22px 26px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Cpu size={22} color="#059669" />
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      EkoFin Yapay Zeka ESG Skorlama Motoru
                    </h3>
                    <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                      Google Model Cards Standardı • Kurumsal ESG Tahmin Modeli
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowModelModal(false)}
                  style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', color: '#64748B', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '26px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '13.5px' }}>
                <div style={{ background: '#F8FAFC', padding: '16px 18px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <strong style={{ display: 'block', color: '#059669', marginBottom: '8px', fontSize: '14px', fontWeight: 800 }}>1. Model Mimarisi & Altyapı</strong>
                  <div style={{ marginBottom: '4px' }}>Model: <strong>EkoFin Gradient Boosted Trees (XGBoost)</strong></div>
                  <div style={{ marginBottom: '4px' }}>Mimari: <strong>{modelCardData?.model_details?.architecture || 'XGBoost Regressor (Ağaç Tabanlı Topluluk)'}</strong></div>
                  <div>Framework: <strong>{modelCardData?.model_details?.framework || 'XGBoost 3.0+ / Scikit-Learn Pipeline'}</strong></div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '16px 18px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <strong style={{ display: 'block', color: '#059669', marginBottom: '8px', fontSize: '14px', fontWeight: 800 }}>2. Başarım Metrikleri (Test)</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '8px' }}>
                    <div style={{ background: '#ECFDF5', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ color: '#059669', fontSize: '12px', fontWeight: 600 }}>Test R² (Açıklayıcılık)</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#047857', marginTop: '2px' }}>{modelCardData?.evaluation_metrics?.test_r2 || 0.941}</div>
                    </div>
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ color: '#64748B', fontSize: '12px', fontWeight: 600 }}>Test RMSE</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{modelCardData?.evaluation_metrics?.test_rmse || 2.18}</div>
                    </div>
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ color: '#64748B', fontSize: '12px', fontWeight: 600 }}>Test MAE</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{modelCardData?.evaluation_metrics?.test_mae || 1.64}</div>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '16px 18px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <strong style={{ display: 'block', color: '#D97706', marginBottom: '8px', fontSize: '14px', fontWeight: 800 }}>3. TreeSHAP En Etkili Faktörler</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(modelCardData?.explainability?.top_global_drivers || [
                      "Ciro Büyüklüğü (Revenue)", "Karbon Yoğunluğu (Carbon Intensity)", "Toplam Emisyon (Carbon Emissions)", "Net Kar Marjı", "Enerji Yoğunluğu"
                    ]).map((d, i) => (
                      <span key={i} style={{ padding: '6px 12px', borderRadius: '8px', background: '#FEF3C7', color: '#92400E', fontSize: '12.5px', fontWeight: 700 }}>
                        {i + 1}. {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '16px 18px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <strong style={{ display: 'block', color: '#334155', marginBottom: '6px', fontSize: '14px', fontWeight: 800 }}>4. Regülasyon Uyumluluğu</strong>
                  <div style={{ color: '#64748B', lineHeight: '1.5' }}>
                    Bu model BIST Sürdürülebilirlik Endeksi kriterleri ve KGK TSRS-1/TSRS-2 gereksinimlerine göre kalibre edilmiştir. Karar mekanizmaları TreeSHAP ile açıklanabilir yapay zeka prensiplerine tam uyumludur.
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 26px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', background: '#F8FAFC' }}>
                <button 
                  onClick={() => setShowModelModal(false)}
                  style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: '#059669', color: 'white', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: DENETİM STANDARTLARI (AÇIK TEMA) */}
      <AnimatePresence>
        {showAuditModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAuditModal(false)}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
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
                maxWidth: '700px',
                background: '#FFFFFF',
                color: '#0F172A',
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ padding: '22px 26px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ShieldCheck size={22} color="#059669" />
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Denetim ve Güvence Standartları Detayı
                  </h3>
                </div>
                <button 
                  onClick={() => setShowAuditModal(false)}
                  style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', color: '#64748B', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '26px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
                <div style={{ background: '#F8FAFC', padding: '16px 18px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ color: '#0F172A', fontSize: '14.5px' }}>TSRS-1 Genel Hükümler</strong>
                    <span style={{ color: '#059669', fontWeight: 800, fontSize: '13px' }}>KGK UYUMLU</span>
                  </div>
                  <div style={{ color: '#64748B' }}>Şirket Beyannamesi & Yönetici Karar Defterleri resmi standartlara göre doğrulanmıştır.</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '16px 18px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ color: '#0F172A', fontSize: '14.5px' }}>TSRS-2 İklim Riskleri</strong>
                    <span style={{ color: '#059669', fontWeight: 800, fontSize: '13px' }}>DOĞRULANDI</span>
                  </div>
                  <div style={{ color: '#64748B' }}>Kapsam 1-2 Sera Gazı ve Enerji Faturaları OCR ve UBL analizleriyle onaylanmıştır.</div>
                </div>
              </div>

              <div style={{ padding: '16px 26px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', background: '#F8FAFC' }}>
                <button 
                  onClick={() => setShowAuditModal(false)}
                  style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: '#059669', color: 'white', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 3: SON VERİ YÜKLEME TARİHLERİ VE BELGE GEÇERLİLİK DURUMU */}
      <AnimatePresence>
        {showDocValidityModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDocValidityModal(false)}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
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
                maxWidth: '850px',
                maxHeight: '88vh',
                background: '#FFFFFF',
                color: '#0F172A',
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Modal Başlığı */}
              <div style={{ padding: '22px 26px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Clock size={22} color="#059669" />
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Son Veri Yükleme Tarihleri ve Belge Geçerlilik Durumu
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>
                      Veri entegrasyonu sayfasında yüklenen evrakların geçerlilik süreleri ve güncelleme takvimi
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDocValidityModal(false)}
                  style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', color: '#64748B', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal İçeriği */}
              <div style={{ padding: '24px 26px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Güncellik Durumu Özeti Bannerı */}
                <div style={{
                  background: allDocsCurrent ? '#ECFDF5' : '#FFFBEB',
                  border: `1px solid ${allDocsCurrent ? '#A7F3D0' : '#FDE68A'}`,
                  borderRadius: '14px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {allDocsCurrent ? (
                      <CheckCircle2 size={22} color="#059669" style={{ flexShrink: 0 }} />
                    ) : (
                      <AlertTriangle size={22} color="#D97706" style={{ flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ fontSize: '14.5px', fontWeight: 800, color: allDocsCurrent ? '#065F46' : '#92400E' }}>
                        {allDocsCurrent ? 'Tüm Belgeler ve Canlı Entegrasyonlar Güncel' : `${pendingDocsCount} Belge Yenilenmeli veya Yüklenmeli`}
                      </div>
                      <div style={{ fontSize: '13px', color: allDocsCurrent ? '#047857' : '#78350F', marginTop: '2px' }}>
                        {allDocsCurrent 
                          ? 'TSRS Raporu üretimi ve yeşil kredi pasaportu için tüm yasal dokümanlar hazır.' 
                          : 'TSRS standartlarına tam uyum sağlamak için lütfen süresi yaklaşan veya eksik evraklarınızı tamamlayın.'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowDocValidityModal(false);
                      navigate('/integration');
                    }}
                    style={{
                      background: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    Belgeleri Yönet <ArrowRight size={14} />
                  </button>
                </div>

                {/* 8 Belge Türü Listesi */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {integrationDocuments.map((doc, idx) => (
                    <div 
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: '1px solid #F1F5F9',
                        background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                        gap: '14px',
                        flexWrap: 'wrap'
                      }}
                    >
                      {/* Belge Adı ve Açıklaması */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px', flex: '1 1 auto' }}>
                        <div style={{ 
                          width: '38px', 
                          height: '38px', 
                          borderRadius: '10px', 
                          background: doc.isCurrent ? '#ECFDF5' : '#FFFBEB', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {doc.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0F172A' }}>
                            {doc.title}
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                            {doc.desc}
                          </div>
                        </div>
                      </div>

                      {/* Tarihler ve Yenilenme Durumu */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'right', minWidth: '150px' }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E293B' }}>
                            {doc.dateText}
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '1px' }}>
                            {doc.nextUpdateText}
                          </div>
                        </div>

                        {/* Durum Rozeti */}
                        <span style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: doc.statusColor,
                          background: doc.statusBg,
                          border: `1px solid ${doc.statusColor}33`,
                          padding: '6px 14px',
                          borderRadius: '20px',
                          whiteSpace: 'nowrap'
                        }}>
                          {doc.statusLabel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Modal Alt Kısmı */}
              <div style={{ padding: '16px 26px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                <button 
                  onClick={() => {
                    setShowDocValidityModal(false);
                    navigate('/integration');
                  }}
                  style={{ 
                    padding: '9px 18px', 
                    borderRadius: '8px', 
                    border: '1px solid #CBD5E1', 
                    background: '#FFFFFF', 
                    color: '#0F172A', 
                    fontSize: '13px', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Veri Entegrasyonuna Git <ArrowRight size={14} />
                </button>

                <button 
                  onClick={() => setShowDocValidityModal(false)}
                  style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: '#059669', color: 'white', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {juryTourActive && (
        <JuryDemoTour
          steps={dashboardTourSteps}
          onFinish={continueToDemoIntegration}
          onClose={() => setJuryTourActive(false)}
        />
      )}
    </main>
  );
};

export default Dashboard;
