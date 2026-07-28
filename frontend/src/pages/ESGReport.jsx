import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Activity, Cpu, Globe, AlertTriangle, TrendingUp, CheckCircle2, RefreshCw, Star, X, MessageSquare, Sparkles, Newspaper, Flag, ExternalLink } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CompanyLogo = ({ domain, ticker, size = 40 }) => {
    const [error, setError] = useState(false);
    
    const gradients = [
        'linear-gradient(135deg, #0F172A, #1E293B)',
        'linear-gradient(135deg, #044E3B, #065F46)',
        'linear-gradient(135deg, #1E3A8A, #3B82F6)',
        'linear-gradient(135deg, #581C87, #7C3AED)',
        'linear-gradient(135deg, #7C2D12, #EA580C)',
    ];
    
    const hash = (ticker || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const bgGradient = gradients[hash % gradients.length];

    useEffect(() => {
        setError(false);
    }, [domain]);

    if (error || !domain) {
        return (
            <div style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: bgGradient,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: size > 40 ? '15px' : '10px',
                border: '2px solid #FFFFFF',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                textTransform: 'uppercase',
                flexShrink: 0
            }}>
                {(ticker || "").slice(0, 3)}
            </div>
        );
    }

    return (
        <img
            src={`https://logo.clearbit.com/${domain}`}
            alt={ticker}
            onError={() => setError(true)}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                objectFit: 'contain',
                background: '#FFFFFF',
                padding: '4px',
                border: '2px solid #FFFFFF',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                flexShrink: 0
            }}
        />
    );
};

const Sparkline = ({ history }) => {
    if (!history || history.length === 0) return null;
    const scores = history.map(h => h.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const range = max - min === 0 ? 1 : max - min;
    const width = 120;
    const height = 30;
    
    const points = scores.map((score, index) => {
        const x = (index / (scores.length - 1)) * width;
        const y = height - ((score - min) / range) * height * 0.7 - height * 0.15;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} style={{ overflow: 'visible' }}>
            <polyline
                fill="none"
                stroke="var(--accent-emerald)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
};

const nlpBoxStyle = (nlp) => {
    const isPositive = nlp?.sentiment === "Pozitif";
    const isNegative = nlp?.sentiment === "Negatif";
    return {
        background: isPositive ? 'rgba(16, 185, 129, 0.05)' : isNegative ? 'rgba(239, 68, 68, 0.05)' : 'rgba(241, 245, 249, 0.8)',
        border: `1px solid ${isPositive ? 'rgba(16, 185, 129, 0.15)' : isNegative ? 'rgba(239, 68, 68, 0.15)' : 'rgba(226, 232, 240, 0.8)'}`,
        titleColor: isPositive ? '#065F46' : isNegative ? '#991B1B' : '#334155',
    };
};

const NlpImpactRow = ({ nlp }) => {
    if (!nlp?.sentiment) return null;
    const s = nlpBoxStyle(nlp);
    return (
        <div style={{ marginTop: '4px', padding: '10px 12px', borderRadius: '8px', background: s.background, border: s.border, fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: s.titleColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={12} /> NLP Analizi: {nlp.sentiment} ({nlp.pillar})
                </span>
                <span style={{ fontWeight: 800, color: (nlp.impact_score || 0) >= 0 ? '#10B981' : '#EF4444' }}>
                    {(nlp.impact_score || 0) >= 0 ? '+' : ''}{(nlp.impact_score || 0).toFixed(2)} ESG Etkisi
                </span>
            </div>
            {nlp.explanation && <span style={{ color: '#475569', fontSize: '11.5px', lineHeight: 1.4 }}>{nlp.explanation}</span>}
        </div>
    );
};

const sourceCardStyle = { background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: '8px' };
const typeBadgeStyle = (bg, color) => ({ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 800, color, background: bg, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' });

const FeedbackSourceCard = ({ fb }) => (
    <div style={sourceCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={typeBadgeStyle('rgba(99,102,241,0.1)', '#6366F1')}><MessageSquare size={11} /> Yorum</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>{fb.userName}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fb.date}</span>
            </div>
            <div style={{ display: 'flex', gap: '2px' }}>
                {Array.from({ length: fb.rating || 0 }).map((_, i) => <span key={i} style={{ fontSize: '11px' }}>⭐</span>)}
            </div>
        </div>
        <p style={{ fontSize: '13px', color: '#334155', margin: 0, lineHeight: 1.5 }}>"{fb.comment}"</p>
        <NlpImpactRow nlp={fb.nlp} />
    </div>
);

const NewsSourceCard = ({ item }) => (
    <div style={sourceCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={typeBadgeStyle('rgba(59,130,246,0.1)', '#3B82F6')}><Newspaper size={11} /> Haber</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>{item.source}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.publishedDate || item.fetchedAt}</span>
            </div>
        </div>
        <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#1D4ED8', margin: 0, lineHeight: 1.5, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {item.title} <ExternalLink size={12} style={{ flexShrink: 0 }} />
        </a>
        <NlpImpactRow nlp={item.nlp} />
    </div>
);

const AuditSourceCard = ({ audit }) => {
    const isVerified = (audit.status || '').includes('Doğrulandı');
    return (
        <div style={sourceCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={typeBadgeStyle('rgba(239,68,68,0.1)', '#EF4444')}><Flag size={11} /> İhbar</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>{audit.category}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{audit.date}</span>
                </div>
                <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                    color: isVerified ? '#92400E' : '#1D4ED8',
                    background: isVerified ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)'
                }}>
                    {audit.status}
                </span>
            </div>
            <p style={{ fontSize: '13px', color: '#334155', margin: 0, lineHeight: 1.5 }}>{audit.description}</p>
            <NlpImpactRow nlp={audit.nlp} />
            {!isVerified && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Bu ihbar henüz doğrulanmadığı için ESG skorunu etkilemiyor.
                </span>
            )}
        </div>
    );
};

const PILLARS = [
    { key: 'Environmental', label: 'Çevresel (Environmental)', short: 'E', color: '#0D9488' },
    { key: 'Social', label: 'Sosyal (Social)', short: 'S', color: '#2563EB' },
    { key: 'Governance', label: 'Yönetişim (Governance)', short: 'G', color: '#7C3AED' },
];

// baseScore (0-10, XGBoost modelinden) 3 pillar'a eşit dağıtılır (model E/S/G kırılımı
// üretmiyor), sonra her pillar'a gerçekten etiketlenmiş kaynakların (yorum + haber +
// SADECE doğrulanmış ihbar — skor hesaplamasıyla tutarlı olsun diye) ortalama etkisiyle
// düzeltilir. Kaynağı olmayan pillar, sadece temel skoru gösterir; uydurma sayı üretilmez.
const getPillarBreakdown = (baseScore, feedbacks, news, audits) => {
    const verifiedAudits = (audits || []).filter(a => (a.status || '').includes('Doğrulandı'));
    const realSources = [
        ...(feedbacks || []).map(f => ({ type: 'feedback', label: f.userName, snippet: f.comment, nlp: f.nlp })),
        ...(news || []).map(n => ({ type: 'news', label: n.source, snippet: n.title, nlp: n.nlp })),
        ...verifiedAudits.map(a => ({ type: 'audit', label: a.category, snippet: a.description, nlp: a.nlp })),
    ];

    const basePer5 = (baseScore || 0) / 2;

    return PILLARS.map(p => {
        const items = realSources.filter(s => s.nlp?.pillar === p.key);
        const avgImpact = items.length
            ? items.reduce((sum, i) => sum + (i.nlp.impact_score || 0), 0) / items.length
            : 0;
        const score = Math.max(0, Math.min(5, basePer5 + avgImpact / 2));
        return { ...p, score: Math.round(score * 10) / 10, count: items.length, items };
    });
};

const CompanyDetailsView = ({ company: initialCompany, onBack, totalCompaniesCount, companyRank }) => {
    const company = initialCompany;
    const [feedbacks, setFeedbacks] = useState([]);
    const [news, setNews] = useState([]);
    const [audits, setAudits] = useState([]);
    const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
    const [loadingNews, setLoadingNews] = useState(true);
    const [scoreHistory, setScoreHistory] = useState([]);

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const res = await fetch(`${API_URL}/api/esg/feedback/${company.ticker}`);
                if (res.ok) {
                    const data = await res.json();
                    setFeedbacks(data);
                }
            } catch (err) {
                console.error("Geri bildirimler yüklenemedi:", err);
            } finally {
                setLoadingFeedbacks(false);
            }
        };
        const fetchNews = async () => {
            setLoadingNews(true);
            try {
                const res = await fetch(`${API_URL}/api/esg/news/${company.ticker}`);
                if (res.ok) {
                    const data = await res.json();
                    setNews(data);
                }
            } catch (err) {
                console.error("Haberler yüklenemedi:", err);
            } finally {
                setLoadingNews(false);
            }
        };
        const fetchAudits = async () => {
            try {
                const res = await fetch(`${API_URL}/api/public-audits?ticker=${company.ticker}`);
                if (res.ok) {
                    const data = await res.json();
                    setAudits(data);
                }
            } catch (err) {
                console.error("İhbarlar yüklenemedi:", err);
            }
        };
        const fetchScoreHistory = async () => {
            try {
                const res = await fetch(`${API_URL}/api/esg/score-history/${company.ticker}`);
                if (res.ok) {
                    const data = await res.json();
                    setScoreHistory(data.history || []);
                }
            } catch (err) {
                console.error("Skor geçmişi yüklenemedi:", err);
            }
        };
        fetchFeedback();
        fetchNews();
        fetchAudits();
        fetchScoreHistory();
    }, [company.ticker]);

    // Yorum, haber ve (yalnızca incelenen/doğrulanan) ihbarları tek, tarihe göre
    // sıralı "Kaynaklar" akışında birleştirir.
    const combinedSources = [
        ...feedbacks.map(fb => ({ type: 'feedback', date: fb.date, data: fb })),
        ...news.map(n => ({ type: 'news', date: n.publishedDate || n.fetchedAt, data: n })),
        ...audits.map(a => ({ type: 'audit', date: a.date, data: a })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const score5 = (company.score / 2).toFixed(1);
    const pillars = getPillarBreakdown(company.baseScore ?? company.score, feedbacks, news, audits);

    const cx = 150;
    const cy = 150;

    const drawSlice = (startAngle, endAngle, val, baseColor, radius) => {
        const rad = Math.PI / 180;
        const opacity = 0.15 + (val / 5) * 0.85;

        const x1 = cx + radius * Math.cos(startAngle * rad);
        const y1 = cy + radius * Math.sin(startAngle * rad);
        const x2 = cx + radius * Math.cos(endAngle * rad);
        const y2 = cy + radius * Math.sin(endAngle * rad);

        const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

        return (
            <path
                key={`${startAngle}-${radius}`}
                d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill={baseColor}
                opacity={opacity}
                stroke="#FFFFFF"
                strokeWidth="2.5"
                style={{ transition: 'opacity 0.3s' }}
            />
        );
    };

    // Tek halka, 3 gerçek pillar dilimi (120° eşit pay) — eskiden 12 sahte alt-metrik
    // dış halkası vardı, model bu kırılımı hiç üretmiyordu.
    const slices = pillars.map((p, i) => drawSlice(-90 + i * 120, -90 + (i + 1) * 120, p.score, p.color, 120));

    const categoryHeaderStyle = (color) => ({
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '16px',
        fontWeight: 800,
        color: '#0F172A',
        marginBottom: '12px',
        paddingBottom: '6px',
        borderBottom: `2px solid ${color}`
    });

    const subMetricRowStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        fontSize: '13px',
        color: '#475569',
        borderBottom: '1px dashed #E2E8F0'
    };

    const kpiCardStyle = { flex: '1 1 240px', background: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' };
    const kpiLabelStyle = { display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '10px' };

    return (
        <div className="container animate-fade-in" style={{ padding: '40px 0 80px 0' }}>
            {/* Back button */}
            <button className="btn btn-outline" onClick={onBack} style={{ marginBottom: '32px', gap: '8px' }}>
                ← ESG Endeksine Geri Dön
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px', background: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                    {company.name} ESG Derecesi: {score5} / 5.0
                </h1>
                <p style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 500 }}>
                    XGBoost model tahmini, toplumsal yorum, güvenilir haber ve doğrulanmış ihbarlarla gerçek zamanlı güncellenir.
                </p>
            </div>

            {/* KPI Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                <div style={kpiCardStyle}>
                    <span style={kpiLabelStyle}>Dinamik ESG Skoru</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                            fontSize: '30px', fontWeight: 800, color: '#FFFFFF',
                            background: company.score >= 7.5 ? '#10B981' : company.score >= 5.0 ? '#F59E0B' : '#EF4444',
                            padding: '4px 14px', borderRadius: '8px'
                        }}>
                            {company.score.toFixed(1)}
                        </span>
                        {typeof company.delta7d === 'number' && company.delta7d !== 0 && (
                            <span style={{
                                fontSize: '12px', fontWeight: 800,
                                color: company.delta7d > 0 ? '#10B981' : '#EF4444',
                                background: company.delta7d > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                padding: '3px 8px', borderRadius: '6px'
                            }}>
                                {company.delta7d > 0 ? '▲' : '▼'} {company.delta7d > 0 ? '+' : ''}{company.delta7d.toFixed(2)} (7g)
                            </span>
                        )}
                    </div>
                </div>

                <div style={kpiCardStyle}>
                    <span style={kpiLabelStyle}>Temel Skor + Toplumsal Modülasyon</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
                        <span>{(company.baseScore ?? company.score).toFixed(1)}</span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: (company.modulation || 0) >= 0 ? '#10B981' : '#EF4444' }}>
                            {(company.modulation || 0) >= 0 ? '+' : ''}{(company.modulation || 0).toFixed(2)}
                        </span>
                    </div>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>XGBoost temel / 10</span>
                </div>

                <div style={kpiCardStyle}>
                    <span style={kpiLabelStyle}>{company.sector} Sektöründe Sıralama</span>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--primary)' }}>
                        {companyRank}<span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}> / {totalCompaniesCount} şirket</span>
                    </div>
                </div>
            </div>

            {/* Pillar Breakdown: donut + gerçek kaynak listesi TEK kart içinde (hizalama sorunu yaşamaması için) */}
            <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>E/S/G Kırılımı</h2>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Model tek bir genel skor üretir; aşağıdaki 3 pillar skoru gerçek yorum/haber/doğrulanmış ihbar kaynaklarının etkisiyle hesaplanır.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
                    <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative', width: '220px', height: '220px' }}>
                            <svg width="220" height="220" viewBox="0 0 300 300">
                                {slices}
                                <circle cx={cx} cy={cy} r="70" fill="#FFFFFF" />
                            </svg>
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none'
                            }}>
                                <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>ESG Skoru</span>
                                <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>{score5}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '14px' }}>
                            {pillars.map(p => (
                                <span key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                    <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: p.color, display: 'inline-block' }} />
                                    {p.short}: {p.score.toFixed(1)}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
                        {pillars.map(p => (
                            <div key={p.key}>
                                <div style={categoryHeaderStyle(p.color)}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: p.color, display: 'inline-block', marginRight: '8px' }} />
                                        <span>{p.label}</span>
                                    </div>
                                    <span style={{ fontSize: '16px', fontWeight: 800, color: p.color }}>{p.score.toFixed(1)}</span>
                                </div>
                                {p.items.length === 0 ? (
                                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                                        Bu alanda henüz analiz edilmiş yorum/haber/ihbar yok — temel model skoru gösteriliyor.
                                    </p>
                                ) : (
                                    <div>
                                        {p.items.slice(0, 3).map((row, idx) => (
                                            <div key={idx} style={subMetricRowStyle}>
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }} title={row.snippet}>
                                                    {row.label}: "{row.snippet}"
                                                </span>
                                                <span style={{ fontWeight: 800, color: row.nlp.impact_score >= 0 ? '#10B981' : '#EF4444', flexShrink: 0 }}>
                                                    {row.nlp.impact_score >= 0 ? '+' : ''}{row.nlp.impact_score.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                        {p.count > 3 && (
                                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>+ {p.count - 3} kaynak daha</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Gerçek Tarihli Günlük Skor Geçmişi */}
            {scoreHistory.length > 1 && (
                <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>GÜNLÜK ESG SKOR SEYRİ</h3>
                    <div style={{ width: '100%', height: 180 }}>
                        <ResponsiveContainer>
                            <LineChart data={scoreHistory} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(d) => d.slice(5)} />
                                <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#94A3B8' }} width={28} />
                                <ReferenceLine y={company.baseScore} stroke="#94A3B8" strokeDasharray="4 4" />
                                <Tooltip
                                    formatter={(value) => [value, 'Skor']}
                                    labelFormatter={(label) => `Tarih: ${label}`}
                                    contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                                />
                                <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Kesikli çizgi: temel (XGBoost) skor. Düz çizgi: toplumsal yorum/haber/ihbar modülasyonuyla güncellenen günlük skor.
                    </p>
                </div>
            )}

            {/* Kaynaklar — Birleşik Akış */}
            <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', padding: '8px', borderRadius: '8px' }}>
                        <MessageSquare size={22} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                            Kaynaklar — Haberler, Yorumlar ve Toplumsal İhbarlar
                        </h2>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                            Bir ihlal bildirmek veya toplumsal denetim yorumu eklemek için{' '}
                            <a href="/public-audit" style={{ color: '#1D4ED8', fontWeight: 700, textDecoration: 'underline' }}>Toplumsal Denetim</a> sayfasını kullanın.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '520px', overflowY: 'auto', paddingRight: '8px' }}>
                    {(loadingFeedbacks || loadingNews) ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
                    ) : combinedSources.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                            Henüz kayıtlı kaynak bulunmamaktadır.
                        </div>
                    ) : (
                        combinedSources.map((src, idx) => {
                            if (src.type === 'feedback') return <FeedbackSourceCard key={`fb-${idx}`} fb={src.data} />;
                            if (src.type === 'news') return <NewsSourceCard key={`news-${idx}`} item={src.data} />;
                            if (src.type === 'audit') return <AuditSourceCard key={`audit-${idx}`} audit={src.data} />;
                            return null;
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

const EsgCompanyCard = ({ name, sector, score, riskLevel, coverImage, verifiedPoints, domain, ticker, scoreHistory, onClick }) => {
    let scoreColor = '#10B981'; // Green
    let scoreBg = 'rgba(16, 185, 129, 0.1)';
    if (score < 7.5 && score >= 5) {
        scoreColor = '#F59E0B'; // Orange
        scoreBg = 'rgba(245, 158, 11, 0.1)';
    } else if (score < 5) {
        scoreColor = '#EF4444'; // Red
        scoreBg = 'rgba(239, 68, 68, 0.1)';
    }

    const score5 = (score / 2).toFixed(1);

    return (
        <div 
            className="clean-card esg-card animate-fade-in delay-100" 
            onClick={onClick} 
            style={{ 
                padding: 0, 
                overflow: 'hidden', 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%', 
                cursor: 'pointer',
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)';
            }}
        >
            {/* Header Image Cover */}
            <div style={{ position: 'relative', height: '140px', overflow: 'hidden' }}>
                <img src={coverImage} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.1) 100%)' }} />
                
                {/* Floating Risk Badge */}
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <div style={{
                        background: riskLevel === 'Düşük' ? 'rgba(16, 185, 129, 0.9)' : riskLevel === 'Orta' ? 'rgba(245, 158, 11, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                        color: '#FFFFFF',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}>
                        {riskLevel} Risk
                    </div>
                </div>

                {/* Company Logo & Ticker floating */}
                <div style={{ position: 'absolute', bottom: '-20px', left: '20px', zIndex: 10 }}>
                    <CompanyLogo domain={domain} ticker={ticker} size={48} />
                </div>
            </div>

            {/* Card Body */}
            <div style={{ padding: '32px 24px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                                {name}
                            </h3>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                                {sector}
                            </span>
                        </div>
                        {/* Circle Score Badge */}
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: scoreBg,
                            color: scoreColor,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '16px',
                            border: `2px solid ${scoreColor}`,
                            flexShrink: 0
                        }}>
                            {score5}
                        </div>
                    </div>
                </div>

                {/* Sparkline Trend */}
                {scoreHistory && scoreHistory.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                        <div>
                            <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>30 GÜNLÜK FORECAST</span>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-main)' }}>Skor Seyri</span>
                        </div>
                        <Sparkline history={scoreHistory} />
                    </div>
                )}

                {/* Metrics Summary */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
                    <span>Sembol: <strong>{ticker}</strong></span>
                    <span style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Raporu İncele →
                    </span>
                </div>
            </div>
        </div>
    );
};


const ESGReport = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);

    const fetchCompanies = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/esg/companies`);
            if (!res.ok) throw new Error("Şirket verileri sunucudan yüklenemedi.");
            const data = await res.json();
            setCompanies(data);
        } catch (err) {
            setError(err.message || "Bilinmeyen bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const filteredCompanies = companies.filter(c => 
        (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.sector || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedCompany) {
        const sectorPeers = companies
            .filter(c => c.sector === selectedCompany.sector)
            .sort((a, b) => b.score - a.score);
        const companyRank = sectorPeers.findIndex(c => c.ticker === selectedCompany.ticker) + 1;

        return (
            <div style={{ background: 'var(--bg-color)', minHeight: '100vh', paddingBottom: '80px' }}>
                <CompanyDetailsView
                    company={selectedCompany}
                    onBack={() => setSelectedCompany(null)}
                    totalCompaniesCount={sectorPeers.length}
                    companyRank={companyRank}
                />
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--bg-color)', minHeight: '100vh', paddingBottom: '80px' }}>

            {/* Header Area */}
            <section style={{ background: '#FFFFFF', borderBottom: '1px solid var(--border-color)', padding: '60px 0 40px 0' }}>
                <div className="container animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '32px' }}>
                        <div style={{ flex: '1 1 500px' }}>
                            <div style={{ display: 'inline-flex', padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', borderRadius: '20px', marginBottom: '16px', fontSize: '13px', fontWeight: 800, alignItems: 'center', gap: '6px' }}>
                                <Globe size={16} /> Şeffaf Toplumsal Denetim ve Analiz
                            </div>
                            <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', letterSpacing: '-0.5px' }}>
                                Dinamik ESG Derecelendirme ve Güven Skoru
                            </h1>
                            <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '600px' }}>
                                Şirketlerin yılda bir yayınladığı statik raporlara mahkum değilsiniz. Sosyal medya verileri, dijital platform bildirimleri ve kamuoyu geri bildirimlerini harmanlayan <strong>Dinamik ESG Güven Skorumuzla</strong> halkın denetimini yeşil finansmana entegre ediyoruz.
                            </p>
                        </div>
                    </div>

                    {/* Search Bar with Autocomplete */}
                    <div style={{ marginTop: '40px', position: 'relative', maxWidth: '800px' }}>
                        <div style={{ position: 'absolute', top: '50%', left: '20px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Şirket adı, ticker veya Sektör girerek ESG skorunu anında sorgulayın..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                            style={{
                                width: '100%',
                                padding: '20px 24px 20px 52px',
                                fontSize: '16px',
                                borderRadius: '12px',
                                border: '2px solid var(--border-color)',
                                outline: 'none',
                                background: '#F8FAFC',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                            }}
                        />
                        <button className="btn btn-primary" style={{ position: 'absolute', right: '8px', top: '8px', bottom: '8px', padding: '0 24px', borderRadius: '8px' }}>
                            ESG Tarama
                        </button>

                        {/* Autocomplete Dropdown suggestions */}
                        {showSuggestions && searchTerm.trim() !== "" && (
                            (() => {
                                const suggestions = companies.filter(c => 
                                    (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                                    (c.ticker || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (c.sector || "").toLowerCase().includes(searchTerm.toLowerCase())
                                ).slice(0, 6);

                                return suggestions.length > 0 ? (
                                    <div className="glass-panel animate-fade-in" style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        marginTop: '8px',
                                        background: 'rgba(255, 255, 255, 0.98)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-color)',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                        zIndex: 99,
                                        overflow: 'hidden',
                                        padding: '6px 0'
                                    }}>
                                        {suggestions.map((sug, idx) => (
                                            <div
                                                key={idx}
                                                onMouseDown={() => {
                                                    setSelectedCompany(sug);
                                                    setShowSuggestions(false);
                                                }}
                                                className="suggestion-item"
                                                style={{
                                                    padding: '10px 20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <CompanyLogo domain={sug.domain} ticker={sug.ticker} size={28} />
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>{sug.name}</span>
                                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{sug.sector}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : null;
                            })()
                        )}
                    </div>
                </div>
            </section>

            {/* Results Grid */}
            <main className="container" style={{ marginTop: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={24} color="var(--primary)" /> Anlık ESG Endeksi
                    </h2>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {loading ? "Yükleniyor..." : `${filteredCompanies.length} sonuç listeleniyor`}
                    </span>
                </div>

                {loading ? (
                    <p>Yükleniyor...</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>
                        {filteredCompanies.map((comp, i) => (
                            <EsgCompanyCard 
                                key={i} 
                                {...comp} 
                                onClick={() => setSelectedCompany(comp)} 
                            />
                        ))}
                    </div>
                )}
            </main>

        </div>
    );
};

export default ESGReport;
