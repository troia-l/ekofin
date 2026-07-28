import React, { useState, useEffect } from 'react';
import { ShieldCheck, Building2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import CreditItem from '../components/CreditItem';
import HighlightCard from '../components/HighlightCard';
import { CalendarIcon } from '../components/Icons';
import ConditionsModal from '../components/ConditionsModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Home = () => {
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalData, setModalData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCredits = async () => {
            try {
                const res = await fetch(`${API_URL}/api/credits`);
                if (!res.ok) throw new Error("Krediler yüklenemedi.");
                const data = await res.json();
                setCredits(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCredits();
    }, []);

    return (
        <>
            <HeroSection />

            <main className="container flex gap-8 delay-200 animate-fade-in" style={{ padding: '40px 24px', alignItems: 'flex-start' }}>

                {/* Left Column - List */}
                <div style={{ flex: '1 1 70%' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>5.000.000 TL 24 Ay Vadeli İhtiyaç Kredileri</h2>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        <CalendarIcon /> 22 Şubat 2026
                    </div>

                    {loading && (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Krediler yükleniyor...
                        </div>
                    )}
                    
                    {error && (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
                            Hata: {error}
                        </div>
                    )}

                    {!loading && !error && credits.map((credit) => (
                        <CreditItem
                            key={credit.id}
                            type={credit.type}
                            sponsor={credit.sponsor}
                            name={credit.name}
                            bankLogoUrl={credit.bankLogoUrl}
                            rate={credit.rate}
                            total={credit.total}
                            isGreen={credit.isGreen}
                            esgScore={credit.esgScore}
                            esgDetails={credit.esgDetails}
                            features={credit.features}
                            onOpenConditions={() => setModalData({
                                name: credit.name,
                                esgScore: credit.esgScore
                            })}
                        />
                    ))}
                </div>

                {/* Right Column - Alternative Models */}
                <div style={{ flex: '1 1 30%', position: 'sticky', top: '100px' }}>
                    
                    {/* KOBİ Portalı Giriş Kartı */}
                    <div 
                        className="clean-card animate-fade-in" 
                        style={{ 
                            padding: '24px', 
                            marginBottom: '32px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '12px', 
                            cursor: 'pointer',
                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.02) 100%)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.05)',
                            borderRadius: '8px',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => navigate('/dashboard')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '8px', 
                                background: 'var(--accent-green-bg)', 
                                color: 'var(--accent-green)', 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center' 
                            }}>
                                <Building2 size={18} />
                            </div>
                            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                                KOBİ Portalı
                            </h4>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                            Yapay zeka tabanlı ESG analizi yapın, karbon ayak izinizi hesaplayın ve g-ROI yatırımlarınızı simüle edin.
                        </p>
                        <div className="flex items-center gap-1" style={{ color: 'var(--accent-green)', fontSize: '13.5px', fontWeight: 700, marginTop: '4px' }}>
                            Portala Git <ArrowRight size={16} />
                        </div>
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)' }}>
                        Alternatif Modeller
                    </h3>

                    <HighlightCard
                        title="Kitle Fonlaması"
                        desc="Tek bir yatırımcı yerine, binlerce kişinin 1.000'er TL ile güneş tarlanıza ortak olduğu yapı."
                        link="Projeleri Gör"
                    />

                    <HighlightCard
                        title="Enerji Sözleşmesi"
                        desc="Cebinizden para çıkmadan şirketiniz yeşil enerjiye geçer, aracı şirket payını tasarruftan alır."
                        link="Nasıl Çalışır?"
                    />

                    <div style={{ marginTop: '24px', padding: '16px', borderRadius: '4px', background: 'var(--accent-green-bg)', border: '1px solid var(--accent-green-border)' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <ShieldCheck size={16} />
                            Y.Z. Tarama Aktif
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--primary)', lineHeight: '1.5', opacity: 0.9 }}>
                            Listelenen raporlar yapay zeka ile nesnel IoT verileri ve haber kaynaklarından taranıp g-ROI olarak hesaplanmıştır. Greenwashing engellenir.
                        </p>
                    </div>
                </div>

            </main>

            {modalData && (
                <ConditionsModal
                    isOpen={!!modalData}
                    onClose={() => setModalData(null)}
                    bankName={modalData.name}
                    esgScore={modalData.esgScore}
                />
            )}
        </>
    );
};

export default Home;
