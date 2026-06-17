import React from 'react';
import { Building2, Globe2, ShieldCheck, Zap, ArrowRight, LineChart, Leaf, Hexagon } from 'lucide-react';

const FeatureCard = ({ icon, title, desc }) => (
    <div className="clean-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
        <div style={{ width: '48px', height: '48px', background: 'var(--primary-glow)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--primary)' }}>
            {icon}
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{title}</h3>
        <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6', margin: 0 }}>{desc}</p>
    </div>
);

const Corporate = () => {
    return (
        <div style={{ background: 'var(--bg-color)', minHeight: '100vh', paddingBottom: '80px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>

            {/* Hero Section */}
            <section style={{ position: 'relative', padding: '100px 0', overflow: 'hidden', background: '#0F172A', color: '#FFFFFF' }}>
                {/* Background Image & Overlay */}
                <div style={{ position: 'absolute', inset: 0 }}>
                    <img
                        src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"
                        alt="Corporate Office"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.7) 100%)' }} />
                </div>

                <div className="container animate-fade-in" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '800px' }}>
                    <div style={{ display: 'inline-flex', padding: '8px 16px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', borderRadius: '20px', marginBottom: '24px', fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        Kurumsal Çözümler
                    </div>
                    <h1 style={{ fontSize: '48px', fontWeight: 800, lineHeight: '1.2', marginBottom: '24px', letterSpacing: '-1px' }}>
                        Karbon Nötr Hedefinizi <span style={{ color: 'var(--accent-green)' }}>Y.Z. ile</span> Finanse Edin
                    </h1>
                    <p style={{ fontSize: '18px', color: '#94A3B8', lineHeight: '1.6', marginBottom: '40px', maxWidth: '600px' }}>
                        Bankalar ve finans kuruluşları için tescillenmiş yeşil portföyünüzü yapay zeka ile şeffaflaştırın. Greenwashing riskini sıfırlayan akıllı algoritmamızla sektörel indirimlerden anında faydalanın.
                    </p>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '16px', borderRadius: '8px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Platforma Katıl <ArrowRight size={18} />
                        </button>
                        <button className="btn" style={{ padding: '16px 32px', fontSize: '16px', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', zIndex: 10 }}>
                            API Dokümantasyonu
                        </button>
                    </div>
                </div>
            </section>

            {/* Features (Value Props) */}
            <section className="container" style={{ marginTop: '-40px', position: 'relative', zIndex: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    <FeatureCard
                        icon={<ShieldCheck size={28} />}
                        title="Subjektif Beyan Yerine g-ROI Metriği"
                        desc="Şirket beyanlarını değil, nesnel verileri temel alıyoruz. g-ROI metriği ile projenizin çevresel getirisini bağımsız ve ölçülebilir bir finansal modele dönüştürüyoruz."
                    />
                    <FeatureCard
                        icon={<Zap size={28} />}
                        title="Dinami̇k ESG Güven Değişi̇m Skoru"
                        desc="Yılda bir yayınlanan statik ESG raporlarına son veriyoruz. Sosyal medya ve dijital platformları canlı analiz ederek yıl boyu güncel kalan güven skorlaması sunuyoruz."
                    />
                    <FeatureCard
                        icon={<Globe2 size={28} />}
                        title="Toplumsal Deneti̇m Mekani̇zması"
                        desc="Şirket faaliyetlerinin halk tarafından şeffaf bir platformda izlenmesini, kamuoyunun doğrudan şikayet/övgü bildirebilmesini sağlıyoruz."
                    />
                </div>
            </section>

            {/* How It Works Section */}
            <section style={{ padding: '100px 0', background: '#FFFFFF', marginTop: '60px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', letterSpacing: '-0.5px' }}>
                        Yeşil Finansman Döngüsü
                    </h2>
                    <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 60px auto', lineHeight: '1.6' }}>
                        Aylarca süren denetim süreçlerini yapay zeka ile dakikalara indiriyoruz. İşte sistemin kurumsal şirketler için çalışma prensibi:
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', position: 'relative' }}>
                        {/* Connecting Line */}
                        <div style={{ position: 'absolute', top: '40px', left: '10%', right: '10%', height: '2px', background: 'var(--border-color)', zIndex: 0 }} className="hidden md:block" />

                        {/* Steps */}
                        {[
                            { step: 1, icon: <Hexagon size={24} />, title: "Objektif Veri Aktarımı", desc: "Projenizin enerji verileri ve IoT sensör metrikleri doğrudan sisteme entegre edilir." },
                            { step: 2, icon: <Globe2 size={24} />, title: "g-ROI Hesaplaması", desc: "Yatırımınızın çevresel performansı finansal matematik ile birleştirilip g-ROI metriği oluşturulur." },
                            { step: 3, icon: <ShieldCheck size={24} />, title: "ESG Risk Analizi", desc: "Veri yetersizliğini gideren YZ, yatırımınıza ait şeffaf bir kredi uygunluk raporu sunar." },
                            { step: 4, icon: <Building2 size={24} />, title: "Finansman & KOBİ Havuzu", desc: "Mikro ve KOBİ ölçekli projeler başta olmak üzere uygun faizli fon veya kitlesel destekle eşleşin." }
                        ].map((item) => (
                            <div key={item.step} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#FFFFFF', border: `4px solid ${item.step === 4 ? 'var(--accent-green)' : 'var(--bg-color)'}`, display: 'flex', justifyContent: 'center', alignItems: 'center', color: item.step === 4 ? 'var(--accent-green)' : 'var(--primary)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '24px' }}>
                                    {item.icon}
                                </div>
                                <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>{item.title}</h4>
                                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA / Contact Form Section */}
            <section className="container" style={{ marginTop: '80px', display: 'flex', gap: '60px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 400px' }}>
                    <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '24px', letterSpacing: '-1px' }}>
                        Kurumsal ESG Dönüşümünüzü Bugünden Başlatın
                    </h2>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: 'var(--text-main)', fontWeight: 500 }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-green-bg)', color: 'var(--accent-green)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Leaf size={16} /></div>
                            Ücretsiz Ön YZ ESG Taraması
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: 'var(--text-main)', fontWeight: 500 }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><ShieldCheck size={16} /></div>
                            Size Özel API Uzman Desteği
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: 'var(--text-main)', fontWeight: 500 }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Zap size={16} /></div>
                            Limitsiz Banka İstihbaratı
                        </li>
                    </ul>
                </div>

                <div style={{ flex: '1 1 400px', background: '#FFFFFF', padding: '40px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px', color: 'var(--text-main)' }}>İletişim Talebi Oluşturun</h3>
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <input type="text" placeholder="Adınız Soyadınız" className="clean-input" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#F8FAFC', outline: 'none', fontSize: '14px' }} />
                            <input type="text" placeholder="Şirket Ünvanı" className="clean-input" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#F8FAFC', outline: 'none', fontSize: '14px' }} />
                        </div>
                        <input type="email" placeholder="Kurumsal E-posta (örn: info@sirketiniz.com)" className="clean-input" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#F8FAFC', outline: 'none', fontSize: '14px' }} />
                        <select className="clean-input" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#F8FAFC', outline: 'none', fontSize: '14px', color: 'var(--text-muted)' }}>
                            <option>Enerji Üretimi</option>
                            <option>Lojistik & Ulaşım</option>
                            <option>Ağır Sanayi / Üretim</option>
                            <option>Gıda & Tarım</option>
                            <option>Diğer</option>
                        </select>
                        <textarea placeholder="Projenizden veya hedeflerinizden kısaca bahsedin..." rows="4" className="clean-input" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#F8FAFC', outline: 'none', fontSize: '14px', resize: 'vertical' }}></textarea>

                        <button type="button" className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 700, borderRadius: '8px', marginTop: '8px' }}>
                            Talebi Gönder
                        </button>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
                            Müşteri temsilcilerimiz sizinle en geç 2 saat içerisinde iletişime geçecektir.
                        </span>
                    </form>
                </div>
            </section>

        </div>
    );
};

export default Corporate;
