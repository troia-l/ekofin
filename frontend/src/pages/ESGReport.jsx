import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Activity, Cpu, Globe, AlertTriangle, TrendingUp, CheckCircle2, RefreshCw, Star, X, Info } from 'lucide-react';

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

const getSubMetrics = (ticker, score) => {
    const hash = (ticker || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const getVal = (base, offsetSeed) => {
        const val = Math.round(base + ((hash + offsetSeed) % 3) - 1);
        return Math.max(1, Math.min(5, val));
    };

    const envBase = Math.round((score / 10) * 5);
    const socBase = Math.round((score / 10) * 4.8);
    const govBase = Math.round((score / 10) * 4.5);

    const envScores = [
        getVal(envBase, 1),
        getVal(envBase, 2),
        getVal(envBase, 3),
        getVal(envBase, 4),
        getVal(envBase, 5)
    ];
    const envAvg = (envScores.reduce((a,b)=>a+b, 0) / 5).toFixed(1);

    const socScores = [
        getVal(socBase, 6),
        getVal(socBase, 7),
        getVal(socBase, 8)
    ];
    const socAvg = (socScores.reduce((a,b)=>a+b, 0) / 3).toFixed(1);

    const govScores = [
        getVal(govBase, 9),
        getVal(govBase, 10),
        getVal(govBase, 11),
        getVal(govBase, 12)
    ];
    const govAvg = (govScores.reduce((a,b)=>a+b, 0) / 4).toFixed(1);

    return {
        envScores, envAvg,
        socScores, socAvg,
        govScores, govAvg
    };
};

const CompanyDetailsView = ({ company, onBack, totalCompaniesCount, companyRank }) => {
    const score5 = (company.score / 2).toFixed(1);
    const { envScores, envAvg, socScores, socAvg, govScores, govAvg } = getSubMetrics(company.ticker, company.score);

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

    const slices = [];
    
    // Outer slices (radius 120): Sub-metrics
    // Environmental: Slices 0-4 (Teal)
    for (let i = 0; i < 5; i++) {
        const start = -90 + i * 30;
        const end = start + 30;
        slices.push(drawSlice(start, end, envScores[i], '#0D9488', 120));
    }
    // Social: Slices 5-7 (Blue)
    for (let i = 0; i < 3; i++) {
        const start = -90 + 5 * 30 + i * 30;
        const end = start + 30;
        slices.push(drawSlice(start, end, socScores[i], '#2563EB', 120));
    }
    // Governance: Slices 8-11 (Purple)
    for (let i = 0; i < 4; i++) {
        const start = -90 + 8 * 30 + i * 30;
        const end = start + 30;
        slices.push(drawSlice(start, end, govScores[i], '#7C3AED', 120));
    }

    // Inner slices (radius 85): Category averages
    // Environmental average
    slices.push(drawSlice(-90, 60, parseFloat(envAvg), '#0D9488', 85));
    // Social average
    slices.push(drawSlice(60, 150, parseFloat(socAvg), '#2563EB', 85));
    // Governance average
    slices.push(drawSlice(150, 270, parseFloat(govAvg), '#7C3AED', 85));

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

    const getChevronStyle = (rowType, levelIdx) => {
        const colors = {
            E: ['#E2E8F0', '#CCFBF1', '#99F6E4', '#5EEAD4', '#2DD4BF', '#0D9488'],
            S: ['#E2E8F0', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#2563EB'],
            G: ['#E2E8F0', '#F3E8FF', '#E9D5FF', '#D8B4FE', '#C084FC', '#7C3AED'],
        };
        const bg = colors[rowType][levelIdx];
        return {
            flex: 1,
            height: '10px',
            background: bg,
            clipPath: 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%, 15% 50%)',
            marginRight: '-3px',
        };
    };

    return (
        <div className="container animate-fade-in" style={{ padding: '40px 0 80px 0' }}>
            {/* Back button */}
            <button className="btn btn-outline" onClick={onBack} style={{ marginBottom: '32px', gap: '8px' }}>
                ← ESG Endeksine Geri Dön
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px', background: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                    {company.name} ESG Derecesi: {score5} / 5.0
                </h1>
                <p style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {company.name} tarafından beyan edilen FY 2024 verilerine göre hesaplanmıştır.
                </p>
            </div>

            {/* Grid Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '32px', alignItems: 'start' }}>
                
                {/* Column 1: ESG Details Table */}
                <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    
                    {/* Environmental */}
                    <div>
                        <div style={categoryHeaderStyle('#0D9488')}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#0D9488', display: 'inline-block', marginRight: '8px' }} />
                                <span>Çevresel (Environmental)</span>
                                <Info size={14} style={{ color: '#94A3B8', marginLeft: '6px', cursor: 'pointer' }} />
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#0D9488' }}>{envAvg}</span>
                        </div>
                        <div>
                            {[
                                { name: 'İklim Geçişi (Climate Transition)', val: envScores[0] },
                                { name: 'Enerji ve Kaynak Kullanımı (Energy & Resource Use)', val: envScores[1] },
                                { name: 'Biyoçeşitlilik (Biodiversity)', val: envScores[2] },
                                { name: 'Su Kullanımı (Water Use)', val: envScores[3] },
                                { name: 'Atık ve Kirlilik (Waste & Pollution)', val: envScores[4] },
                            ].map((row, idx) => (
                                <div key={idx} style={subMetricRowStyle}>
                                    <span>{row.name}</span>
                                    <span style={{ fontWeight: 800, color: '#1E293B' }}>{row.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Social */}
                    <div>
                        <div style={categoryHeaderStyle('#2563EB')}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#2563EB', display: 'inline-block', marginRight: '8px' }} />
                                <span>Sosyal (Social)</span>
                                <Info size={14} style={{ color: '#94A3B8', marginLeft: '6px', cursor: 'pointer' }} />
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#2563EB' }}>{socAvg}</span>
                        </div>
                        <div>
                            {[
                                { name: 'Çalışan İlişkileri (Labour Relations)', val: socScores[0] },
                                { name: 'Sağlık ve Güvenlik (Health & Safety)', val: socScores[1] },
                                { name: 'İnsan Hakları ve Toplum (Human Rights & Community)', val: socScores[2] },
                            ].map((row, idx) => (
                                <div key={idx} style={subMetricRowStyle}>
                                    <span>{row.name}</span>
                                    <span style={{ fontWeight: 800, color: '#1E293B' }}>{row.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Governance */}
                    <div>
                        <div style={categoryHeaderStyle('#7C3AED')}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#7C3AED', display: 'inline-block', marginRight: '8px' }} />
                                <span>Yönetişim (Governance)</span>
                                <Info size={14} style={{ color: '#94A3B8', marginLeft: '6px', cursor: 'pointer' }} />
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#7C3AED' }}>{govAvg}</span>
                        </div>
                        <div>
                            {[
                                { name: 'Yönetim Kurulu ve Yapı (Board & Management)', val: govScores[0] },
                                { name: 'Hissedar Hakları (Shareholder Rights)', val: govScores[1] },
                                { name: 'Etik Davranış ve Uyum (Conduct & Anti-Corruption)', val: govScores[2] },
                                { name: 'Vergi Şeffaflığı ve Muhasebe (Tax Transparency & Accounting)', val: govScores[3] },
                            ].map((row, idx) => (
                                <div key={idx} style={subMetricRowStyle}>
                                    <span>{row.name}</span>
                                    <span style={{ fontWeight: 800, color: '#1E293B' }}>{row.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Column 2: ESG Wheel SVG & Chevron Legend */}
                <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ position: 'relative', width: '300px', height: '300px' }}>
                        <svg width="300" height="300">
                            {slices}
                            <circle cx={cx} cy={cy} r="54" fill="#FFFFFF" />
                        </svg>

                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none'
                        }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ESG Skoru</span>
                            <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>{score5}</span>
                        </div>
                    </div>

                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.5', maxWidth: '280px' }}>
                        Renk derinliği skor değerini yansıtır. Her bir ESG temasının detaylı skorunu görmek için segmentlerin üzerine gelin.
                    </p>

                    {/* Chevron Legend Row */}
                    <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        
                        {/* Headers */}
                        <div style={{ display: 'flex', paddingLeft: '24px', justifyContent: 'space-between', fontSize: '9px', fontWeight: 700, color: '#64748B' }}>
                            <span style={{ flex: 1, textAlign: 'center' }}>0 Katılım Yok</span>
                            <span style={{ flex: 1, textAlign: 'center' }}>1 Sınırlı</span>
                            <span style={{ flex: 1, textAlign: 'center' }}>2 Gelişmekte</span>
                            <span style={{ flex: 1, textAlign: 'center' }}>3 Kurulmuş</span>
                            <span style={{ flex: 1, textAlign: 'center' }}>4 İleri Seviye</span>
                            <span style={{ flex: 1, textAlign: 'center' }}>5 Lider</span>
                        </div>
                        
                        {/* E */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '16px', fontSize: '11px', fontWeight: 800, color: '#0D9488', textAlign: 'center' }}>E</span>
                            <div style={{ display: 'flex', flex: 1 }}>
                                {[0, 1, 2, 3, 4, 5].map((lvl) => (
                                    <div key={lvl} style={getChevronStyle('E', lvl)} />
                                ))}
                            </div>
                        </div>

                        {/* S */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '16px', fontSize: '11px', fontWeight: 800, color: '#2563EB', textAlign: 'center' }}>S</span>
                            <div style={{ display: 'flex', flex: 1 }}>
                                {[0, 1, 2, 3, 4, 5].map((lvl) => (
                                    <div key={lvl} style={getChevronStyle('S', lvl)} />
                                ))}
                            </div>
                        </div>

                        {/* G */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '16px', fontSize: '11px', fontWeight: 800, color: '#7C3AED', textAlign: 'center' }}>G</span>
                            <div style={{ display: 'flex', flex: 1 }}>
                                {[0, 1, 2, 3, 4, 5].map((lvl) => (
                                    <div key={lvl} style={getChevronStyle('G', lvl)} />
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Column 3: Comparison, Rank & TODO Notice */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Rank Card */}
                    <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>KARŞILAŞTIRMA VE SIRALAMA</span>
                        <h4 style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 600, marginBottom: '16px' }}>
                            {company.sector} Sektöründeki Şirketler Arasında
                        </h4>
                        
                        <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
                            {companyRank} <span style={{ fontSize: '16.5px', color: 'var(--text-muted)', fontWeight: 500 }}>/ {totalCompaniesCount} Şirket</span>
                        </div>

                        <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                            <strong>{company.name}</strong>, sürdürülebilirlik kriterleri kapsamında yapılan analizlerde kendi sektör grubunda yer alan tüm şirketler arasından <strong>{companyRank}.</strong> sıradadır. Detaylı sektörel sınıflandırmalara ulaşmak için <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#2563EB', textDecoration: 'underline', fontWeight: 600 }}>TRBC Sektör Sınıflandırmasını</a> inceleyebilirsiniz.
                        </p>
                    </div>

                    {/* TODO Notice Card */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(4, 78, 59, 0.05), rgba(16, 185, 129, 0.05))',
                        padding: '24px',
                        borderRadius: '16px',
                        border: '1px dashed var(--primary)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'inline-flex', padding: '4px 10px', background: 'rgba(4, 78, 59, 0.1)', color: 'var(--primary)', borderRadius: '12px', fontSize: '11px', fontWeight: 800, width: 'fit-content' }}>
                            📌 ENTEGRASYON NOTU
                        </div>
                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>
                            TODO: ESG Raporlama Motoru
                        </h4>
                        <p style={{ fontSize: '12px', color: '#334155', lineHeight: '1.6' }}>
                            Bu kırılım ve puanlama tabloları için arka planda <strong>ESG Değerlendirme Motoru</strong> geliştirilecektir.
                        </p>
                    </div>

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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
        const sorted = [...companies].sort((a, b) => b.score - a.score);
        const companyRank = sorted.findIndex(c => c.ticker === selectedCompany.ticker) + 1;

        return (
            <div style={{ background: 'var(--bg-color)', minHeight: '100vh', paddingBottom: '80px' }}>
                <CompanyDetailsView 
                    company={selectedCompany} 
                    onBack={() => setSelectedCompany(null)} 
                    totalCompaniesCount={companies.length} 
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
