import React, { useState, useEffect } from 'react';
import { Sun, Wind, Plug, TrendingUp, Users, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProjectDetailsModal from '../components/ProjectDetailsModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getIconForType = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('güneş') || t.includes('ges')) return <Sun size={64} color="var(--primary)" style={{ opacity: 0.4 }} />;
    if (t.includes('rüzgar') || t.includes('res')) return <Wind size={64} color="var(--primary)" style={{ opacity: 0.4 }} />;
    return <Plug size={64} color="var(--primary)" style={{ opacity: 0.4 }} />;
};

const FundingCard = ({ id, type, title, location, imageIcon, expectedReturn, raisedAmount, goalAmount, minInvestment, daysLeft, isCofunded, onOpenDetails, coverImage }) => {
    const navigate = useNavigate();
    const progressPercent = Math.min((raisedAmount / goalAmount) * 100, 100);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(amount) + ' TL';
    };

    return (
        <div className="clean-card animate-fade-in delay-100" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* Top Banner & Icon */}
            <div style={{ position: 'relative', height: '160px', background: 'var(--primary-glow)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                {coverImage && (
                    <img src={coverImage} alt={title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)' }} />

                {isCofunded && (
                    <div style={{ position: 'absolute', top: '16px', left: '16px', background: '#0F172A', color: 'var(--accent-green)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, display: 'flex', gap: '6px', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <ShieldCheck size={14} /> Banka Finansmanlı
                    </div>
                )}
                <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.95)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    ⏳ {daysLeft} Gün Kaldı
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                        <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{type}</span>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px', marginBottom: '4px' }}>{title}</h3>
                    </div>
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>📍 {location}</span>

                {/* Progress Bar */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', fontWeight: 600 }}>
                        <span style={{ color: 'var(--accent-green)' }}>{formatCurrency(raisedAmount)}</span>
                        <span style={{ color: 'var(--text-muted)' }}>Hedef: {formatCurrency(goalAmount)}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent-green)', borderRadius: '4px' }} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right' }}>
                        %{progressPercent.toFixed(1)} Fonlandı
                    </div>
                </div>

                {/* Financial Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: '#F8FAFC', borderRadius: '8px', marginBottom: '24px' }}>
                    <div className="flex-col">
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Beklenen Yıllık Getiri</span>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>%{expectedReturn}</span>
                    </div>
                    <div className="flex-col">
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Minimum Yatırım</span>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>{formatCurrency(minInvestment)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ marginTop: 'auto' }}>
                    <button onClick={() => navigate('/apply', { state: { mode: 'crowdfund', project: { id, type, title, location, expectedReturn, raisedAmount, goalAmount, minInvestment, daysLeft, isCofunded, coverImage } } })} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px', display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                        Yatırım Yap <ArrowRight size={18} />
                    </button>
                    <button onClick={(e) => { e.preventDefault(); if (onOpenDetails) onOpenDetails(); }} className="btn btn-outline" style={{ background: 'none', border: 'none', width: '100%', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, textDecoration: 'underline', padding: 0, cursor: 'pointer' }}>
                        Detaylar
                    </button>
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <ShieldCheck size={14} color="var(--accent-green)" /> YZ Tarafından Fizibilite Doğrulandı
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};


const Crowdfunding = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch(`${API_URL}/api/crowdfunding`);
                if (!res.ok) throw new Error("Projeler yüklenemedi.");
                const data = await res.json();
                setProjects(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    return (
        <>
            <div style={{ background: 'var(--bg-color)', minHeight: '100vh', paddingBottom: '80px' }}>

                {/* Hero Header */}
                <section style={{ background: 'var(--primary)', color: '#FFFFFF', padding: '60px 0', borderBottom: '4px solid var(--accent-green)' }}>
                    <div className="container animate-fade-in" style={{ textAlign: 'center', maxWidth: '800px' }}>
                        <div style={{ display: 'inline-flex', padding: '8px 16px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '20px', marginBottom: '24px', fontSize: '14px', fontWeight: 600 }}>
                            🌍 Yeşil Enerjiye Küçük Tutarlarla Ortak Olun
                        </div>
                        <h1 style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '20px' }}>
                            Geleceğin Enerjisini Bugünden <span style={{ color: 'var(--accent-green)' }}>Birlikte</span> İnşa Edelim
                        </h1>
                        <p style={{ fontSize: '18px', lineHeight: '1.6', opacity: 0.9, marginBottom: '32px' }}>
                            Sadece büyük holdinglerin değil, KOBİ ve mikro ölçekli işletmelerin de alternatif finansmana eriştiği; bireysel yatırımcıların yatırımlarının çevresel etkisini şeffaf g-ROI verileriyle anlık izleyebildiği güvenilir pazar yeri.
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <TrendingUp size={24} color="var(--accent-green)" />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <span style={{ block: 'block', fontSize: '20px', fontWeight: 800 }}>%45-65</span>
                                    <span style={{ fontSize: '12px', opacity: 0.8 }}>Yıllık Hedef Getiri</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Users size={24} color="#FF7F00" />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <span style={{ block: 'block', fontSize: '20px', fontWeight: 800 }}>8.500+</span>
                                    <span style={{ fontSize: '12px', opacity: 0.8 }}>Aktif Yatırımcı</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Projects Grid */}
                <main className="container" style={{ marginTop: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>Aktif Fonlamalar</h2>
                        {/* Filter Tabs Mock */}
                        <div style={{ display: 'flex', gap: '8px', background: '#FFFFFF', padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <button className="btn" style={{ background: 'var(--bg-color)', color: 'var(--text-main)', padding: '6px 16px' }}>Tümü</button>
                            <button className="btn" style={{ background: 'transparent', color: 'var(--text-muted)', padding: '6px 16px' }}>Güneş</button>
                            <button className="btn" style={{ background: 'transparent', color: 'var(--text-muted)', padding: '6px 16px' }}>Rüzgar</button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                        {loading && (
                            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                Projeler yükleniyor...
                            </div>
                        )}
                        
                        {error && (
                            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
                                Hata: {error}
                            </div>
                        )}

                        {!loading && !error && projects.map((project) => (
                            <FundingCard
                                key={project.id}
                                {...project}
                                imageIcon={getIconForType(project.type)}
                                onOpenDetails={() => setSelectedProject(project)}
                            />
                        ))}
                    </div>
                </main>

            </div>

            <ProjectDetailsModal
                isOpen={!!selectedProject}
                data={selectedProject}
                onClose={() => setSelectedProject(null)}
            />
        </>
    );
};

export default Crowdfunding;
