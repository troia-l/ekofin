import React from 'react';
import { ShieldCheck, Building2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import CreditItem from '../components/CreditItem';
import HighlightCard from '../components/HighlightCard';
import { CalendarIcon } from '../components/Icons';
import ConditionsModal from '../components/ConditionsModal';
import { useState } from 'react';

const Home = () => {
    const [modalData, setModalData] = useState(null);
    const navigate = useNavigate();

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

                    <CreditItem
                        type="Enerji Performans Fırsatı"
                        sponsor={true}
                        name="Garanti BBVA"
                        bankLogoUrl="https://cdn.hangikredi.com/images/bank/89cdb7eb-d063-40a7-9753-bf289acebaed.svg"
                        rate="%0 (Faizsiz)"
                        total="Bedava Kurulum*"
                        isGreen={true}
                        esgScore={9.4}
                        esgDetails="Objektif sensör verileri ve g-ROI analizi ile fabrikanın karbon emisyonu azaltımı ve panel kurulumu %100 doğrulanmıştır."
                        features={[
                            "g-ROI ile hesaplanmış özel faiz indirimi",
                            "Aylık faturadan kesinti hesaplama sistemi"
                        ]}
                        onOpenConditions={() => setModalData({
                            name: "Garanti BBVA",
                            esgScore: 9.4
                        })}
                    />

                    <CreditItem
                        type="Öne Çıkan"
                        sponsor={true}
                        name="Yapı Kredi"
                        bankLogoUrl="https://cdn.hangikredi.com/images/bank/23b08f7f-df4e-4c63-aa01-3776279f5186.svg"
                        rate="%1,89"
                        total="7.550.000 TL"
                        isGreen={true}
                        esgScore={9.1}
                        esgDetails="Yenilenebilir enerji portföyü ve sürdürülebilirlik raporu YZ tarafından g-ROI metriği ile yüksek güvenle hesaplanmıştır."
                        features={[
                            "Özel güneş enerjisi finansman paketi",
                            "Hızlı dijital onay süreci"
                        ]}
                        onOpenConditions={() => setModalData({
                            name: "Yapı Kredi",
                            esgScore: 9.1
                        })}
                    />

                    <CreditItem
                        type="Fırsat"
                        sponsor={true}
                        name="Akbank"
                        bankLogoUrl="https://cdn.hangikredi.com/images/bank/0b1edd96-0755-4ce2-9c99-8c27829d26d0.svg"
                        rate="%1,99"
                        total="7.800.000 TL"
                        isGreen={false}
                        esgScore={8.7}
                        esgDetails="Dinamik ESG skoru yüksek, zorlu standartlar çerçevesinde şeffaf finansman onayı almıştır."
                        features={[
                            "Dinamik ESG taramasından geçti",
                            "12 ay ödemesiz dönem fırsatı!"
                        ]}
                        onOpenConditions={() => setModalData({
                            name: "Akbank",
                            esgScore: 8.7
                        })}
                    />

                    <CreditItem
                        type="Girişimci Fırsatı"
                        sponsor={false}
                        name="TEB"
                        bankLogoUrl="https://cdn.hangikredi.com/images/bank/teb-logo-svg.svg"
                        rate="%2,49"
                        total="8.250.000 TL"
                        isGreen={false}
                        esgScore={7.2}
                        esgDetails="Tedarik zinciri analizi devam etmektedir ancak çevre politikaları olumludur."
                        features={[
                            "Erken aşama sürdürülebilir projelere özel",
                            "Sıfır tahsis ücreti ve ESG indirimi"
                        ]}
                        onOpenConditions={() => setModalData({
                            name: "TEB",
                            esgScore: 7.2
                        })}
                    />
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
