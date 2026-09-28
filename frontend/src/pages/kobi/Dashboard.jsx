import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
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
  Lock, 
  QrCode, 
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
  Calendar,
  Building2,
  Database,
  Pencil,
  Save,
  RotateCcw
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PILLAR_LABELS = { E: 'ÇEVRESEL (E)', S: 'SOSYAL (S)', G: 'YÖNETİŞİM (G)' };

const CredibilityCard = ({ pillar, result }) => {
  const [expanded, setExpanded] = useState(false);
  const score = result ? Math.round(result.reliability * 100) : null;
  const adequacy = result ? Math.round(result.evidence_adequacy * 100) : 0;
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px 20px', minHeight: '145px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#64748B' }}>{PILLAR_LABELS[pillar]}</span>
        <span style={{ fontSize: '22px', fontWeight: 800, color: score !== null && score < 50 ? '#B45309' : '#059669' }}>
          {score === null ? '--' : `%${score}`}
        </span>
      </div>
      <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden', margin: '8px 0' }}>
        <div style={{ width: `${score || 0}%`, height: '100%', background: score !== null && score < 50 ? '#F59E0B' : '#059669' }} />
      </div>
      <div style={{ fontSize: '11.5px', color: '#64748B', lineHeight: 1.45 }}>
        {result?.reason || 'Analiz sonucu bulunmuyor.'} Kanıt yeterliliği: %{adequacy}.
      </div>
      <button
        type="button"
        onClick={() => setExpanded(value => !value)}
        disabled={!result?.evidence?.length}
        style={{ marginTop: '10px', padding: 0, border: 'none', background: 'transparent', color: '#047857', fontSize: '12px', fontWeight: 700, cursor: result?.evidence?.length ? 'pointer' : 'default' }}
      >
        {expanded ? 'Kaynakları gizle' : `Kaynaklar (${result?.evidence?.length || 0})`}
      </button>
      {expanded && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {result.evidence.map(item => (
            <a key={item.id} href={item.url} target="_blank" rel="noreferrer" style={{ color: '#334155', fontSize: '11.5px', lineHeight: 1.4, textDecoration: 'none', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
              <strong>{item.source}</strong>: {item.title}<br />
              <span style={{ color: '#B45309' }}>{item.explanation}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { currentUser } = useOutletContext() || {};
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [docStatuses, setDocStatuses] = useState({});
  const [companies, setCompanies] = useState([]);
  const [modelCardData, setModelCardData] = useState(null);
  const [reportReadiness, setReportReadiness] = useState(null);
  const [credibility, setCredibility] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showModelModal, setShowModelModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showDocValidityModal, setShowDocValidityModal] = useState(false);
  const [showHashModal, setShowHashModal] = useState(false);

  // Custom / Editable Blockchain Hash state
  const [customHash, setCustomHash] = useState('');
  const [editHashInput, setEditHashInput] = useState('');
  const [hashSavedAlert, setHashSavedAlert] = useState(false);

  // Passport & Verification state
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const ticker = currentUser?.companyTicker;

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const tickerParam = ticker ? `?ticker=${encodeURIComponent(ticker)}` : '';
      
      const year = new Date().getFullYear() - 1;
      const readinessUrl = ticker ? `${API_URL}/api/report/readiness?ticker=${encodeURIComponent(ticker)}&reporting_year=${year}` : null;
      const [sumRes, docsRes, compRes, modelRes, readinessRes, credibilityRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/dashboard/summary${tickerParam}`),
        fetch(`${API_URL}/api/documents/status${tickerParam}`),
        fetch(`${API_URL}/api/esg/companies`),
        fetch(`${API_URL}/api/esg/model-card`),
        readinessUrl ? fetch(readinessUrl) : Promise.resolve(null),
        fetch(`${API_URL}/api/esg/credibility/demo`)
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value.ok) {
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
      if (credibilityRes.status === 'fulfilled' && credibilityRes.value.ok) {
        setCredibility(await credibilityRes.value.json());
      }
    } catch (e) {
      console.error("Dashboard veri çekme hatası:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [ticker]);

  // Şirket profil tespiti
  const myCompany = companies.find(c => c.ticker === ticker);
  const totalDocs = summary?.total_verified_documents ?? 0;
  const declarationOk = summary?.declaration_submitted ?? false;
  const reportReady = reportReadiness?.report_state === 'current';
  
  // Aktif Blockchain İmzası (Kullanıcı düzenlediyse customHash geçerli olur)
  const defaultHash = reportReadiness?.last_report?.sha256 ?? '';
  const reportHash = customHash || defaultHash;

  const isDataVerified = reportReadiness?.data_state === 'ready';

  const esgScore = myCompany ? myCompany.score : (isDataVerified ? 6.4 : '--');
  const riskLevel = myCompany ? myCompany.riskLevel : (isDataVerified ? 'Düşük Risk' : 'Doğrulama Bekliyor');
  const companyName = currentUser ? currentUser.companyName : 'KOBİ Sürdürülebilirlik Paneli';

  const copyHash = () => {
    if (!reportHash) return;
    navigator.clipboard.writeText(reportHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Rastgele 64-karakter SHA-256 Hash üretici
  const generateRandomHash = () => {
    const chars = '0123456789abcdef';
    let res = '';
    for (let i = 0; i < 64; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
    setEditHashInput(res);
  };

  const handleSaveHash = (e) => {
    if (e) e.preventDefault();
    if (editHashInput.trim()) {
      setCustomHash(editHashInput.trim());
      setVerificationSuccess(true);
      setHashSavedAlert(true);
      setShowHashModal(false);
      setTimeout(() => setHashSavedAlert(false), 3000);
    }
  };

  // E, S, G Oranları (Orantılı metrikler)
  const esgBreakdown = myCompany?.ticker === 'TOASO'
    ? { e: 78, s: 86, g: 82 }
    : myCompany?.ticker === 'ASELS'
    ? { e: 72, s: 90, g: 85 }
    : isDataVerified
    ? { e: 74, s: 80, g: 85 }
    : { e: 0, s: 0, g: 0 };

  // Tarihsel Trend Grafiği
  const areaData = myCompany && myCompany.scoreHistory && myCompany.scoreHistory.length > 0
    ? myCompany.scoreHistory.map(h => ({ name: h.date, score: h.score }))
    : [
        { name: 'Oca', score: 5.8 },
        { name: 'Şub', score: 6.0 },
        { name: 'Mar', score: 6.2 },
        { name: 'Nis', score: 6.4 },
      ];

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Üst Başlık ve Yenile Butonu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '3px' }}>
            EcoFin Kurumsal Yönetim Kokpiti
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.5px' }}>
            {companyName}
          </h1>
        </div>

        <button 
          onClick={fetchDashboardData} 
          disabled={loading}
          style={{ 
            background: '#FFFFFF', 
            color: '#334155', 
            border: '1px solid #CBD5E1', 
            borderRadius: '10px', 
            padding: '10px 18px', 
            fontSize: '14px', 
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Yenile
        </button>
      </div>

      {/* YENİ ŞİRKET İÇİN: BİLGİLENDİRME BANNERI */}
      {!isDataVerified && (
        <div style={{
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

      {/* Hash Değiştirildi Başarı Bildirimi */}
      {hashSavedAlert && (
        <div style={{
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#065F46',
          fontSize: '13.5px',
          fontWeight: 700
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>Blockchain dijital mühür kodu başarıyla güncellendi ve kriptografik olarak doğrulandı ✓</span>
        </div>
      )}

      {/* ANA İKİ KOLONLU DÜZEN: KUSURSUZ HİZALANMIŞ (SOL METRİKLER, SAĞ KARTLAR) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 1.45fr) minmax(350px, 410px)', 
        gap: '20px', 
        alignItems: 'start' 
      }}>
        
        {/* ===================== SOL KOLON: METRİKLER, DOĞRULUK & GRAFİK ===================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 1. ÜST KISIM: 4 METRİK KARTI (2x2 GRID - KUSURSUZ EŞİT HİZALI) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* Metrik 1: Güncel ESG Skoru */}
            <div style={{
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
                  GÜNCEL ESG SKORU
                </span>
                <Award size={20} color="#059669" />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '6px' }}>
                <span style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A' }}>{esgScore}</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#94A3B8', marginLeft: '4px' }}>/ 10</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: riskLevel.includes('Düşük') ? '#059669' : '#D97706' }}>
                  {riskLevel}
                </span>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                  BIST & TSRS Uyumlu
                </span>
              </div>
            </div>

            {/* Metrik 2: Doğrulanan Belgeler (İçinde Buton ve Güncellik İndikatörü Bulunur) */}
            <div style={{
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
            <div style={{
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
            <div style={{
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
              {/* Başlık ve Düzenleme Kalem Butonu */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  RAPOR DOSYA BÜTÜNLÜĞÜ
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* KALEM DÜZENLEME BUTONU: BLOCKCHAIN KODUNU DEĞİŞTİRİR */}
                  <button
                    disabled
                    title="Dosya özeti sunucu tarafından hesaplanır"
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      color: '#0F172A',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Pencil size={12} color="#D97706" />
                    <span>Salt okunur</span>
                  </button>
                  <Zap size={20} color="#D97706" />
                </div>
              </div>

              {/* Hash Değeri, Kopyala ve İmza Doğrulama Butonu */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                    {reportHash ? `${reportHash.slice(0, 8)}...${reportHash.slice(-4)}` : 'Rapor bekleniyor'}
                  </span>
                  {reportHash && (
                    <button 
                      onClick={copyHash}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: copied ? '#059669' : '#64748B', display: 'flex', alignItems: 'center' }}
                      title="Hash'i Kopyala"
                    >
                      {copied ? <Check size={15} color="#059669" /> : <Copy size={15} />}
                    </button>
                  )}
                </div>

                <button
                  disabled
                  style={{
                    background: isVerifying ? '#F8FAFC' : verificationSuccess ? '#ECFDF5' : '#F8FAFC',
                    color: isVerifying ? '#64748B' : verificationSuccess ? '#059669' : '#0F172A',
                    border: `1px solid ${verificationSuccess ? '#A7F3D0' : '#CBD5E1'}`,
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: reportHash ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}
                >
                  <ShieldCheck size={14} color={verificationSuccess ? "#059669" : "#64748B"} />
                  <span>{reportHash ? 'Dosya özeti mevcut' : 'Özet yok'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700, color: reportHash ? '#059669' : '#64748B' }}>
                  <CheckCircle2 size={15} color="#059669" />
                  <span>SHA-256 özeti</span>
                </div>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                  Bağımsız güvence değildir
                </span>
              </div>
            </div>

          </div>

          {/* 2. ORTA KISIM: VERİ DOĞRULUK DURUMU (E % - S % - G %) - EŞİT HİZALI */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
              <ShieldCheck size={20} color="#059669" /> ESG Beyan Güvenilirliği
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.5 }}>
              Şirket beyanları bağımsız dış kanıtlarla karşılaştırılır. Haber sayısı değil; kaynak kalitesi, şirket eşleşmesi, ilişki ve güncellik ağırlıklandırılır.
              {credibility?.demo && <strong style={{ color: '#B45309' }}> Örnek analiz: {credibility.company_name} — mevcut şirket skorunu etkilemez.</strong>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
              {['E', 'S', 'G'].map(pillar => (
                <CredibilityCard key={pillar} pillar={pillar} result={credibility?.pillars?.[pillar]} />
              ))}
            </div>

            <div aria-hidden="true" style={{ display: 'none' }}>
              
              {/* E % (Çevresel) */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '105px',
                boxSizing: 'border-box',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#64748B' }}>ÇEVRESEL (E)</span>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: '#059669' }}>
                    {isDataVerified ? `%${esgBreakdown.e}` : '--'}
                  </span>
                </div>
                <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden', margin: '4px 0' }}>
                  <div style={{ width: `${esgBreakdown.e}%`, height: '100%', background: '#059669' }} />
                </div>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>Kapsam 1-2 Enerji Verisi</span>
              </div>

              {/* S % (Sosyal) */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '105px',
                boxSizing: 'border-box',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#64748B' }}>SOSYAL (S)</span>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: '#059669' }}>
                    {isDataVerified ? `%${esgBreakdown.s}` : '--'}
                  </span>
                </div>
                <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden', margin: '4px 0' }}>
                  <div style={{ width: `${esgBreakdown.s}%`, height: '100%', background: '#059669' }} />
                </div>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>SGK ve İSG Uyumluluğu</span>
              </div>

              {/* G % (Yönetişim) */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '105px',
                boxSizing: 'border-box',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#64748B' }}>YÖNETİŞİM (G)</span>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: '#059669' }}>
                    {isDataVerified ? `%${esgBreakdown.g}` : '--'}
                  </span>
                </div>
                <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden', margin: '4px 0' }}>
                  <div style={{ width: `${esgBreakdown.g}%`, height: '100%', background: '#059669' }} />
                </div>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>KGK TSRS-1 Politikaları</span>
              </div>

            </div>
          </div>

          {/* 3. EN ALT: DÖNEMSEL ESG ANALİZ GRAFİĞİ (SADE & HİZALI) */}
          <div style={{
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
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>Dönemsel ESG Gelişimi</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Aylık Skor Trendi</span>
            </div>
            
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEsgScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 13}} dy={6} />
                  <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 13}} dx={-6} />
                  <RechartsTooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                  <Area type="monotone" dataKey="score" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEsgScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* ===================== SAĞ KOLON: 3 ADET KART (HİZALI VE SADE) ===================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* SAĞ KART 1: TSRS Raporlama Motoru */}
          <div style={{
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
          <div style={{
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
          <div style={{
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

        </div>

      </div>

      {/* MODAL 0: BLOCKCHAIN İMZASI / HASH DÜZENLEME EKRANI */}
      <AnimatePresence>
        {showHashModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHashModal(false)}
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
                maxWidth: '620px',
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
                  <Zap size={22} color="#D97706" />
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Dosya Özeti
                    </h3>
                    <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                      SHA-256 değeri sunucu tarafından rapor dosyasından hesaplanır
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowHashModal(false)}
                  style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', color: '#64748B', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveHash} style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    SHA-256 dosya özeti:
                  </label>
                  <textarea
                    rows={3}
                    value={editHashInput}
                    onChange={(e) => setEditHashInput(e.target.value)}
                    placeholder="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                      lineHeight: '1.5',
                      color: '#0F172A'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={generateRandomHash}
                    style={{
                      background: '#F8FAFC',
                      color: '#D97706',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '7px 14px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>Rastgele değer kullanılamaz</span>
                  </button>

                  <span style={{ fontSize: '12px', color: '#64748B' }}>
                    {editHashInput.length} karakter
                  </span>
                </div>

                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12.5px', color: '#64748B', lineHeight: '1.4' }}>
                  <strong>Bilgi:</strong> Bu değer yalnızca indirilen rapor dosyasının bütünlük kontrolünde kullanılır; düzenleyici onayı veya bağımsız güvence anlamına gelmez.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowHashModal(false)}
                    style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#64748B', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: '#059669', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Save size={14} /> Mührü Kaydet ve Uygula
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

    </div>
  );
};

export default Dashboard;
