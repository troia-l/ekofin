import React, { useState, useEffect, useRef } from 'react';
import {
    AlertOctagon,
    ThumbsDown,
    Plus,
    Search,
    CheckCircle2,
    Loader2,
    Sparkles,
    Building2,
    X,
    AlertTriangle,
    Info,
    ShieldCheck,
    ShieldAlert,
    Gavel
} from 'lucide-react';

const AUDIT_STATUS_OPTIONS = [
    'İnceleniyor',
    'Doğrulandı - Skor Düşürüldü',
    'Doğrulandı - Acil Bildirim',
    'Reddedildi (Asılsız)',
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PublicAudit = () => {
    // State management
    const [reports, setReports] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [moderatorMode, setModeratorMode] = useState(false);
    const [statusUpdatingId, setStatusUpdatingId] = useState(null);

    // Form inputs
    const [companyInput, setCompanyInput] = useState('');
    const [companyTicker, setCompanyTicker] = useState(null);
    const [categoryInput, setCategoryInput] = useState('');
    const [descriptionInput, setDescriptionInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [formTerms, setFormTerms] = useState(false);

    // AI analiz durumu — görsel adımlar animasyonludur, sonuçlar backend'deki
    // gerçek NLP analizinden (nlp_analyzer.py) gelir, uydurma sayı üretilmez.
    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [aiStep, setAiStep] = useState(0); // 0: Medya/Kanıt OCR, 1: Karşılaştırmalı ESG Analizi, 2: Yeşil Aklama Skorlama, 3: Başarı Raporu
    const [aiSuccessReport, setAiSuccessReport] = useState(null);
    const [aiError, setAiError] = useState(null);
    const [submittedAudit, setSubmittedAudit] = useState(null);

    const suggestionRef = useRef(null);

    // Fetch audits & companies on load
    useEffect(() => {
        fetchReports();
        fetchCompanies();

        // Click outside listener for autocomplete suggestions
        const handleClickOutside = (event) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/public-audits`);
            if (!res.ok) throw new Error("İhbarlar sunucudan yüklenemedi.");
            const data = await res.json();
            setReports(data);
        } catch (err) {
            console.error("Hata:", err);
            setError("Bildirimler yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await fetch(`${API_URL}/api/esg/companies`);
            if (res.ok) {
                const data = await res.json();
                setCompanies(data);
            }
        } catch (err) {
            console.error("Şirket listesi çekilemedi:", err);
        }
    };

    const handleUpvote = async (auditId) => {
        try {
            const res = await fetch(`${API_URL}/api/public-audits/${auditId}/upvote`, {
                method: 'POST'
            });
            if (res.ok) {
                const data = await res.json();
                setReports(prev => prev.map(r => r.id === auditId ? { ...r, upvotes: data.upvotes } : r));
            }
        } catch (err) {
            console.error("Oylama hatası:", err);
        }
    };

    const handleStatusChange = async (auditId, newStatus) => {
        setStatusUpdatingId(auditId);
        try {
            const res = await fetch(`${API_URL}/api/public-audits/${auditId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                const data = await res.json();
                setReports(prev => prev.map(r => r.id === auditId ? data.audit : r));
            }
        } catch (err) {
            console.error("Durum güncelleme hatası:", err);
        } finally {
            setStatusUpdatingId(null);
        }
    };

    const handleCompanyInputChange = (e) => {
        setCompanyInput(e.target.value);
        setCompanyTicker(null);
        setShowSuggestions(true);
    };

    const handleSelectSuggestion = (company) => {
        setCompanyInput(company.name);
        setCompanyTicker(company.ticker);
        setShowSuggestions(false);
    };

    const triggerAISimulation = async (e) => {
        e.preventDefault();
        if (!companyInput || !categoryInput || !descriptionInput) return;

        setAiAnalyzing(true);
        setAiError(null);
        setAiStep(0);

        // Backend'e gönderimi hemen başlat — gösterilecek sonuç gerçek NLP
        // analizinden (sentiment/pillar/impact_score) gelecek, uydurulmayacak.
        const submitPromise = fetch(`${API_URL}/api/public-audits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticker: companyTicker,
                company: companyInput,
                category: categoryInput,
                description: descriptionInput
            })
        }).then(async (res) => {
            if (!res.ok) throw new Error('İhbar kaydedilemedi.');
            return res.json();
        });

        // Görsel adım animasyonu (kanıt taraması vb.) — yalnızca UX amaçlı
        await new Promise(r => setTimeout(r, 900));
        setAiStep(1);
        await new Promise(r => setTimeout(r, 900));
        setAiStep(2);

        try {
            const data = await submitPromise;
            const audit = data.audit;
            const nlp = audit.nlp || {};
            setSubmittedAudit(audit);
            setAiSuccessReport({
                sentiment: nlp.sentiment,
                pillar: nlp.pillar,
                impact_score: nlp.impact_score,
                explanation: nlp.explanation,
                status: audit.status
            });
            setAiStep(3);
        } catch (err) {
            console.error("Kaydetme hatası:", err);
            setAiError("İhbar backend'e gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
            setAiStep(-1);
        }
    };

    const handleCloseAiOverlay = () => {
        setAiAnalyzing(false);
        setAiError(null);
        setAiStep(0);
    };

    const handleFinalizeReport = () => {
        setCompanyInput('');
        setCompanyTicker(null);
        setCategoryInput('');
        setDescriptionInput('');
        setFormTerms(false);
        setIsFormOpen(false);
        setAiAnalyzing(false);
        setAiSuccessReport(null);
        setSubmittedAudit(null);
        fetchReports();
    };

    // Filtered reports
    const filteredReports = reports.filter(rep => {
        const matchesSearch = (rep.company || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (rep.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (rep.category || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || rep.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getStatusStyle = (status) => {
        if (status.includes('Reddedildi')) {
            return { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748B', border: 'rgba(100, 116, 139, 0.2)' };
        } else if (status.includes('Acil')) {
            return { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'rgba(239, 68, 68, 0.2)' };
        } else if (status.includes('Düşürüldü') || status.includes('Doğrulandı')) {
            return { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: 'rgba(245, 158, 11, 0.2)' };
        } else {
            return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: 'rgba(59, 130, 246, 0.2)' };
        }
    };

    return (
        <div style={{ background: 'var(--bg-main)', minHeight: '100vh', paddingBottom: '80px', position: 'relative' }}>
            
            {/* Embedded styles for beautiful animations */}
            <style>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    box-shadow: 0 8px 32px 0 rgba(11, 17, 32, 0.04);
                    border-radius: 20px;
                    transition: all 0.3s ease;
                }
                .glass-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 40px 0 rgba(11, 17, 32, 0.08);
                    border-color: rgba(255, 255, 255, 0.9);
                }
                .glass-form-card {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.9);
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
                    border-radius: 20px;
                }
                .custom-input {
                    width: 100%;
                    padding: 14px 16px;
                    background: rgba(248, 250, 252, 0.8);
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                    font-size: 14px;
                    color: var(--text-main);
                    outline: none;
                    transition: all 0.2s ease;
                }
                .custom-input:focus {
                    background: #FFFFFF;
                    border-color: var(--accent-emerald);
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
                }
                .autocomplete-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: #FFFFFF;
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.08);
                    max-height: 220px;
                    overflow-y: auto;
                    z-index: 10;
                    margin-top: 4px;
                }
                .suggestion-item {
                    padding: 12px 16px;
                    font-size: 14px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #F1F5F9;
                    transition: background 0.2s;
                }
                .suggestion-item:last-child {
                    border-bottom: none;
                }
                .suggestion-item:hover {
                    background: #F8FAFC;
                }
                .pulse-scanner {
                    position: relative;
                    overflow: hidden;
                }
                .pulse-scanner::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 3px;
                    background: linear-gradient(90deg, transparent, var(--accent-emerald), transparent);
                    animation: scanning 1.5s linear infinite;
                }
                @keyframes scanning {
                    0% { top: 0%; }
                    50% { top: 100%; }
                    100% { top: 0%; }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #CBD5E1;
                    border-radius: 10px;
                }
                .upvote-button {
                    background: #FFFFFF;
                    border: 1px solid #E2E8F0;
                    border-radius: 14px;
                    padding: 10px 14px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 64px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .upvote-button:hover {
                    border-color: #EF4444;
                    background: rgba(239, 68, 68, 0.02);
                    transform: scale(1.05);
                }
                .upvote-button:active {
                    transform: scale(0.95);
                }
            `}</style>

            {/* Premium Header */}
            <section style={{ 
                background: 'linear-gradient(135deg, #0B1120 0%, #064E3B 100%)', 
                padding: '70px 0 50px 0', 
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Visual grid backgrounds */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    opacity: 0.1,
                    backgroundImage: 'radial-gradient(var(--accent-emerald) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }} />
                
                <div className="container animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
                        <div>
                            <div style={{ 
                                display: 'inline-flex', 
                                padding: '6px 12px', 
                                background: 'rgba(16, 185, 129, 0.15)', 
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                color: 'var(--accent-emerald)', 
                                borderRadius: '30px', 
                                marginBottom: '16px', 
                                fontSize: '12px', 
                                fontWeight: 700, 
                                alignItems: 'center', 
                                gap: '8px' 
                            }}>
                                <AlertOctagon size={14} /> Toplumsal ESG İhbar Portalı
                            </div>
                            <h1 style={{ 
                                fontSize: '38px', 
                                fontWeight: 800, 
                                color: '#FFFFFF', 
                                marginBottom: '14px', 
                                letterSpacing: '-0.8px',
                                fontFamily: 'Plus Jakarta Sans, sans-serif'
                            }}>
                                Toplumsal Denetim Platformu
                            </h1>
                            <p style={{ fontSize: '15px', color: '#94A3B8', lineHeight: '1.6', maxWidth: '650px' }}>
                                Şirketlerin kamuoyuna sundukları yeşil beyanları, halkın kanıtları ve Yapay Zeka doğrulama motorumuz ile denetliyoruz. Asılsız iddiaları (Greenwashing) tespit edin, ESG derecelerine halkın katkısını sağlayın.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                            {!isFormOpen && (
                                <button
                                    onClick={() => setIsFormOpen(true)}
                                    className="btn-primary"
                                    style={{
                                        padding: '14px 28px',
                                        fontSize: '15px',
                                        background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
                                        boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)'
                                    }}
                                >
                                    <Plus size={18} /> Yeni İhlal Bildir
                                </button>
                            )}
                            <button
                                onClick={() => setModeratorMode(m => !m)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 14px', fontSize: '12.5px', fontWeight: 700,
                                    borderRadius: '8px', cursor: 'pointer',
                                    background: moderatorMode ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)',
                                    border: `1px solid ${moderatorMode ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.15)'}`,
                                    color: moderatorMode ? 'var(--accent-emerald)' : '#94A3B8'
                                }}
                            >
                                <Gavel size={14} /> {moderatorMode ? 'Moderasyon Modu: Açık' : 'Moderasyon Modu'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dashboard and Feed */}
            <main className="container" style={{ marginTop: '40px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                
                {/* Reports Feed Column */}
                <div style={{ flex: isFormOpen ? '1 1 55%' : '1 1 100%', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Filter / Search Bar */}
                    <div className="glass-card" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {['All', 'Greenwashing (Yeşil Aklama)', 'Hava / Su / Toprak Kirliliği', 'Kaçak Atık Dökümü', 'Diğer'].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        border: '1px solid',
                                        borderColor: selectedCategory === cat ? 'var(--accent-emerald)' : '#E2E8F0',
                                        background: selectedCategory === cat ? 'rgba(16, 185, 129, 0.1)' : '#FFFFFF',
                                        color: selectedCategory === cat ? 'var(--accent-emerald-dark)' : 'var(--text-muted)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {cat === 'All' ? 'Tüm Kategoriler' : cat}
                                </button>
                            ))}
                        </div>

                        <div style={{ position: 'relative', width: '260px' }}>
                            <input 
                                type="text" 
                                placeholder="Şirket, konu veya açıklama ara..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="custom-input" 
                                style={{ padding: '10px 16px 10px 38px', borderRadius: '12px', fontSize: '13px' }} 
                            />
                            <Search size={15} color="var(--text-light)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                            {searchTerm && (
                                <X 
                                    size={14} 
                                    color="var(--text-light)" 
                                    onClick={() => setSearchTerm('')}
                                    style={{ position: 'absolute', right: '14px', top: '13px', cursor: 'pointer' }} 
                                />
                            )}
                        </div>
                    </div>

                    {/* Loader */}
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '12px' }}>
                            <Loader2 size={36} className="animate-spin" color="var(--accent-emerald)" />
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Raporlar yükleniyor...</p>
                        </div>
                    ) : error ? (
                        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <AlertTriangle size={32} color="#EF4444" style={{ margin: '0 auto 12px auto' }} />
                            <p style={{ color: '#EF4444', fontWeight: 600 }}>{error}</p>
                            <button onClick={fetchReports} className="btn-outline" style={{ marginTop: '16px' }}>Tekrar Dene</button>
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
                            <Info size={32} color="var(--text-light)" style={{ margin: '0 auto 12px auto' }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                                Arama kriterlerinize veya kategoriye uygun ihbar kaydı bulunamadı.
                            </p>
                        </div>
                    ) : (
                        filteredReports.map((rep) => {
                            const statusStyle = getStatusStyle(rep.status);
                            return (
                                <div
                                    key={rep.id}
                                    className="glass-card"
                                    style={{
                                        padding: '24px',
                                        display: 'flex',
                                        gap: '20px',
                                        alignItems: 'flex-start',
                                        position: 'relative'
                                    }}
                                >
                                    {/* Left voting box */}
                                    <div className="upvote-button" onClick={() => handleUpvote(rep.id)}>
                                        <ThumbsDown size={18} color="#EF4444" style={{ marginBottom: '4px' }} />
                                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>{rep.upvotes}</span>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Oyla</span>
                                    </div>

                                    {/* Main content body */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Building2 size={16} color="var(--text-muted)" />
                                                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>{rep.company}</h4>
                                                    {rep.ticker && (
                                                        <span style={{ fontSize: '11px', color: '#3B82F6', background: 'rgba(59,130,246,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{rep.ticker}</span>
                                                    )}
                                                </div>
                                                <span style={{
                                                    display: 'inline-block',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    color: 'var(--accent-emerald-dark)',
                                                    background: 'rgba(16, 185, 129, 0.1)',
                                                    padding: '2px 8px',
                                                    borderRadius: '8px',
                                                    marginTop: '4px'
                                                }}>
                                                    {rep.category}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 500 }}>{rep.date}</span>
                                        </div>

                                        <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', marginBottom: '16px' }}>
                                            {rep.description}
                                        </p>

                                        {/* Action buttons inside card */}
                                        <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            borderTop: '1px solid #F1F5F9',
                                            paddingTop: '14px',
                                            flexWrap: 'wrap',
                                            gap: '12px'
                                        }}>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {rep.nlp?.sentiment && (
                                                    <span style={{
                                                        fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px'
                                                    }}>
                                                        <Sparkles size={13} /> NLP: {rep.nlp.sentiment} ({rep.nlp.pillar}), etki {rep.nlp.impact_score >= 0 ? '+' : ''}{rep.nlp.impact_score?.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>

                                            <span style={{
                                                background: statusStyle.bg,
                                                color: statusStyle.color,
                                                border: `1px solid ${statusStyle.border}`,
                                                borderRadius: '8px',
                                                padding: '4px 10px',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                <Sparkles size={12} /> YZ Durumu: {rep.status}
                                            </span>
                                        </div>

                                        {moderatorMode && (
                                            <div style={{
                                                marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #E2E8F0',
                                                display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap'
                                            }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: '#B91C1C' }}>
                                                    <ShieldAlert size={13} /> Moderasyon:
                                                </span>
                                                <select
                                                    value={rep.status}
                                                    disabled={statusUpdatingId === rep.id}
                                                    onChange={(e) => handleStatusChange(rep.id, e.target.value)}
                                                    style={{ fontSize: '12.5px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFFFFF' }}
                                                >
                                                    {AUDIT_STATUS_OPTIONS.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                                {statusUpdatingId === rep.id && <Loader2 size={14} className="animate-spin" color="var(--text-muted)" />}
                                                {rep.status.includes('Doğrulandı') && (
                                                    <span style={{ fontSize: '11px', color: 'var(--accent-emerald-dark)' }}>Bu ihbar ESG skorunu etkiliyor.</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Sidebar Submission Form */}
                {isFormOpen && (
                    <div 
                        className="glass-form-card animate-fade-in" 
                        style={{ 
                            flex: '1 1 38%', 
                            minWidth: '320px', 
                            padding: '28px', 
                            position: 'sticky', 
                            top: '20px',
                            maxHeight: 'calc(100vh - 40px)',
                            overflowY: 'auto'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle size={18} color="#EF4444" /> İhlal Bildirim Formu
                            </h3>
                            <button 
                                onClick={() => setIsFormOpen(false)} 
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={triggerAISimulation} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            
                            {/* Autocomplete Company Input */}
                            <div style={{ position: 'relative' }} ref={suggestionRef}>
                                <label className="form-label" style={{ fontWeight: 600 }}>Şirket Adı (BIST)</label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="text" 
                                        className="custom-input" 
                                        placeholder="Örn: Kardemir Karabük Demir Çelik" 
                                        value={companyInput}
                                        onChange={handleCompanyInputChange}
                                        required 
                                        style={{ paddingLeft: '38px' }}
                                    />
                                    <Building2 size={16} color="var(--text-light)" style={{ position: 'absolute', left: '14px', top: '16px' }} />
                                </div>

                                {showSuggestions && companyInput && (
                                    <div className="autocomplete-dropdown custom-scrollbar">
                                        {companies
                                            .filter(c => (c.name || '').toLowerCase().includes(companyInput.toLowerCase()) || (c.ticker || '').toLowerCase().includes(companyInput.toLowerCase()))
                                            .map((c, i) => (
                                                <div
                                                    key={i}
                                                    className="suggestion-item"
                                                    onClick={() => handleSelectSuggestion(c)}
                                                >
                                                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                                                    <span style={{ fontSize: '11px', color: '#3B82F6', background: 'rgba(59,130,246,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{c.ticker}</span>
                                                </div>
                                            ))}
                                        {companies.filter(c => (c.name || '').toLowerCase().includes(companyInput.toLowerCase()) || (c.ticker || '').toLowerCase().includes(companyInput.toLowerCase())).length === 0 && (
                                            <div style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                                Eşleşen BIST şirketi bulunamadı. Serbest yazabilirsiniz.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Violation Category */}
                            <div>
                                <label className="form-label" style={{ fontWeight: 600 }}>İhlal Kategorisi</label>
                                <select 
                                    className="custom-input" 
                                    value={categoryInput}
                                    onChange={(e) => setCategoryInput(e.target.value)}
                                    required
                                >
                                    <option value="">Kategori Seçiniz</option>
                                    <option value="Greenwashing (Yeşil Aklama)">Greenwashing (Yeşil Aklama)</option>
                                    <option value="Hava / Su / Toprak Kirliliği">Hava / Su / Toprak Kirliliği</option>
                                    <option value="Kaçak Atık Dökümü">Kaçak Atık Dökümü</option>
                                    <option value="Diğer">Diğer</option>
                                </select>
                            </div>

                            {/* Description Box */}
                            <div>
                                <label className="form-label" style={{ fontWeight: 600 }}>Açıklama & Gözlemler</label>
                                <textarea 
                                    className="custom-input" 
                                    placeholder="İhlali veya yanıltıcı yeşil aklama eylemini detaylıca tarif edin..." 
                                    rows="4" 
                                    value={descriptionInput}
                                    onChange={(e) => setDescriptionInput(e.target.value)}
                                    required
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            {/* Security / Agreement Checkbox */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                <input 
                                    type="checkbox" 
                                    checked={formTerms}
                                    onChange={(e) => setFormTerms(e.target.checked)}
                                    required 
                                    style={{ marginTop: '3px', cursor: 'pointer' }} 
                                    id="terms-checkbox"
                                />
                                <label htmlFor="terms-checkbox" style={{ cursor: 'pointer' }}>
                                    Yüklediğim bilgi ve kanıtların doğruluğunu onaylıyorum. Asılsız ihbarların yasal sorumluluğunu kabul ediyorum.
                                </label>
                            </div>

                            <button 
                                className="btn-primary" 
                                type="submit" 
                                style={{ 
                                    width: '100%', 
                                    padding: '14px', 
                                    background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-emerald-dark))', 
                                    border: 'none',
                                    justifyContent: 'center'
                                }}
                            >
                                <Sparkles size={16} /> YZ Doğrulamasına Gönder
                            </button>
                        </form>
                    </div>
                )}
            </main>

            {/* AI Analysis Immersive Simulation Overlay */}
            {aiAnalyzing && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(11, 17, 32, 0.85)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px'
                }}>
                    <div 
                        className="glass-form-card pulse-scanner" 
                        style={{ 
                            width: '100%', 
                            maxWidth: '540px', 
                            padding: '40px',
                            background: '#0B1120',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#FFFFFF'
                        }}
                    >
                        {aiStep === -1 ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '50%',
                                    background: 'rgba(239, 68, 68, 0.15)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 20px auto', border: '2px solid #EF4444'
                                }}>
                                    <X size={32} color="#EF4444" />
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px', color: '#FFFFFF' }}>Gönderim Başarısız</h3>
                                <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '24px' }}>{aiError}</p>
                                <button onClick={handleCloseAiOverlay} className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Kapat</button>
                            </div>
                        ) : aiStep < 3 ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ position: 'relative', display: 'inline-flex', marginBottom: '24px' }}>
                                    <div style={{
                                        position: 'absolute',
                                        inset: -10,
                                        borderRadius: '50%',
                                        background: 'rgba(16, 185, 129, 0.15)',
                                        animation: 'pulse 1.5s ease-out infinite'
                                    }} />
                                    <Loader2 size={48} className="animate-spin" color="var(--accent-emerald)" />
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: '#FFFFFF' }}>
                                    Yapay Zeka Analiz Motoru Aktif
                                </h3>
                                <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '32px' }}>
                                    İhbar verileri ve eklenen kanıtlar bağımsız doğrulama algoritması tarafından taranıyor...
                                </p>

                                {/* Process steps */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                                    
                                    {/* Step 1 */}
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', opacity: aiStep >= 0 ? 1 : 0.4 }}>
                                        <div style={{ marginTop: '2px' }}>
                                            {aiStep > 0 ? (
                                                <CheckCircle2 size={20} color="var(--accent-emerald)" />
                                            ) : aiStep === 0 ? (
                                                <Loader2 size={20} className="animate-spin" color="var(--accent-emerald)" />
                                            ) : (
                                                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #475569' }} />
                                            )}
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: aiStep === 0 ? 'var(--accent-emerald)' : '#FFFFFF' }}>
                                                1. Kanıt Dokümanları & Medya Analizi
                                            </h4>
                                            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                                                OCR görsel metin taraması, metadata analizi ve konum doğrulama yapılıyor.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Step 2 */}
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', opacity: aiStep >= 1 ? 1 : 0.4 }}>
                                        <div style={{ marginTop: '2px' }}>
                                            {aiStep > 1 ? (
                                                <CheckCircle2 size={20} color="var(--accent-emerald)" />
                                            ) : aiStep === 1 ? (
                                                <Loader2 size={20} className="animate-spin" color="var(--accent-emerald)" />
                                            ) : (
                                                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #475569' }} />
                                            )}
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: aiStep === 1 ? 'var(--accent-emerald)' : '#FFFFFF' }}>
                                                2. BIST ESG Karşılaştırmalı Analizi
                                            </h4>
                                            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                                                Şirketin resmî ESG beyanları ve tarihsel sürdürülebilirlik verileriyle ihbar eşleştiriliyor.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Step 3 */}
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', opacity: aiStep >= 2 ? 1 : 0.4 }}>
                                        <div style={{ marginTop: '2px' }}>
                                            {aiStep > 2 ? (
                                                <CheckCircle2 size={20} color="var(--accent-emerald)" />
                                            ) : aiStep === 2 ? (
                                                <Loader2 size={20} className="animate-spin" color="var(--accent-emerald)" />
                                            ) : (
                                                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #475569' }} />
                                            )}
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: aiStep === 2 ? 'var(--accent-emerald)' : '#FFFFFF' }}>
                                                3. Yeşil Aklama Risk Skoru Belirleme
                                            </h4>
                                            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                                                Doğruluk tutarlılığı hesaplanıyor ve ESG risk derecesine etkisi belirleniyor.
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ) : (
                            // Success report state
                            <div style={{ textAlign: 'center' }} className="animate-fade-in">
                                <div style={{ 
                                    width: '64px', 
                                    height: '64px', 
                                    borderRadius: '50%', 
                                    background: 'rgba(16, 185, 129, 0.15)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    margin: '0 auto 20px auto',
                                    border: '2px solid var(--accent-emerald)'
                                }}>
                                    <ShieldCheck size={36} color="var(--accent-emerald)" />
                                </div>
                                <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: '#FFFFFF' }}>
                                    Doğrulama Raporu Hazır!
                                </h3>
                                <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '24px' }}>
                                    Yapay zeka analiz motorumuz bildirilen ihlali geçerli saymıştır.
                                </p>

                                {/* Mini Analysis report details */}
                                <div style={{
                                    background: '#162032',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    textAlign: 'left',
                                    marginBottom: '32px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
                                        <span style={{ fontSize: '13px', color: '#94A3B8' }}>Duygu Analizi</span>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: aiSuccessReport?.sentiment === 'Negatif' ? '#EF4444' : aiSuccessReport?.sentiment === 'Pozitif' ? 'var(--accent-emerald)' : '#94A3B8' }}>{aiSuccessReport?.sentiment}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
                                        <span style={{ fontSize: '13px', color: '#94A3B8' }}>Etkilenen ESG Sütunu</span>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-emerald)' }}>{aiSuccessReport?.pillar}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
                                        <span style={{ fontSize: '13px', color: '#94A3B8' }}>Olası ESG Skor Etkisi</span>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#EF4444' }}>{aiSuccessReport?.impact_score >= 0 ? '+' : ''}{aiSuccessReport?.impact_score} Puan</span>
                                    </div>
                                    <div style={{ marginTop: '12px' }}>
                                        <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>YZ Analiz Özeti</p>
                                        <p style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: '1.5' }}>
                                            {aiSuccessReport?.explanation}
                                        </p>
                                    </div>
                                    <div style={{ marginTop: '14px', padding: '10px 12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', fontSize: '11.5px', color: '#F59E0B', lineHeight: 1.4 }}>
                                        Durum: <strong>{aiSuccessReport?.status}</strong> — bu ihbar moderasyon tarafından "Doğrulandı" olarak işaretlenmeden ESG skorunu etkilemez. Bu, asılsız ihbarlarla skor manipülasyonunu önlemek içindir.
                                    </div>
                                </div>
                                {aiError && (
                                    <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '16px' }}>{aiError}</p>
                                )}

                                <button 
                                    onClick={handleFinalizeReport} 
                                    className="btn-primary" 
                                    style={{ 
                                        width: '100%', 
                                        padding: '14px', 
                                        background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-emerald-dark))', 
                                        border: 'none',
                                        justifyContent: 'center',
                                        fontSize: '15px'
                                    }}
                                >
                                    Raporu Ağa Ekle ve Kaydet
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicAudit;
