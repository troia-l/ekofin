import React, { useState } from 'react';
import { ShieldCheck, Search, Activity, Cpu, Globe, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';

const EsgCompanyCard = ({ name, sector, score, riskLevel, coverImage, aiInsights, verifiedPoints }) => {

    // Determine gradient based on score
    let scoreColor = '#10B981'; // Green
    if (score < 7.5 && score >= 5) scoreColor = '#F59E0B'; // Orange
    if (score < 5) scoreColor = '#EF4444'; // Red

    return (
        <div className="clean-card animate-fade-in delay-100" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Header Image */}
            <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                <img src={coverImage} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.2) 100%)' }} />

                {/* Score Badge */}
                <div style={{ position: 'absolute', bottom: '16px', left: '20px', display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        padding: '8px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}>
                        <span style={{ fontSize: '24px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>YZ Skoru</span>
                    </div>
                    <div style={{ color: '#FFF' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '2px' }}>{name}</h3>
                        <span style={{ fontSize: '12px', fontWeight: 500, opacity: 0.9 }}>{sector}</span>
                    </div>
                </div>

                {/* Risk Badge */}
                <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                    <div className="badge" style={{
                        background: riskLevel === 'Düşük' ? 'rgba(16, 185, 129, 0.9)' : riskLevel === 'Orta' ? 'rgba(245, 158, 11, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                        color: '#FFF',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        {riskLevel === 'Yüksek' && <AlertTriangle size={12} />}
                        Risk: {riskLevel}
                    </div>
                </div>
            </div>

            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* AI Insight Box */}
                <div style={{ background: 'rgba(4, 78, 59, 0.05)', borderRadius: '8px', padding: '16px', borderLeft: `3px solid ${scoreColor}` }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Cpu size={16} color="var(--primary)" /> Yapay Zeka Özeti
                    </h4>
                    <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                        {aiInsights}
                    </p>
                </div>

                {/* Verified Points */}
                <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Doğrulanan Metrikler</span>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {verifiedPoints.map((pt, idx) => (
                            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-main)' }}>
                                <CheckCircle2 size={16} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span style={{ lineHeight: '1.4' }}>{pt}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Son Analiz: Az Önce, Canlı Veri</span>
                    <button className="btn" style={{ background: 'transparent', color: 'var(--primary)', fontWeight: 700, fontSize: '13px', padding: '4px 8px' }}>Geri Bildirim Oku/Yaz</button>
                </div>

            </div>
        </div>
    );
};


const ESGReport = () => {
    const [searchTerm, setSearchTerm] = useState("");

    const mockCompanies = [
        {
            name: "Zorlu Enerji A.Ş.",
            sector: "Enerji Üretimi",
            score: 9.6,
            riskLevel: "Düşük",
            coverImage: "https://images.unsplash.com/photo-1513828583688-c52646db42da?q=80&w=2070&auto=format&fit=crop",
            aiInsights: "Sosyal medyadan ve dijital haber platformlarından alınan veriler, şirketin şeffaflık seviyesini destekliyor. Çevresel etki konusunda halktan gelen 450+ olumlu geri bildirim kaydedildi.",
            verifiedPoints: ["Toplumsal projeler yüksek takdir aldı", "Halkın şikayet taleplerine %95 çözüm", "Sosyal yönetişim raporları şeffaf"]
        },
        {
            name: "EcoLogi C Lojistik",
            sector: "Taşımacılık & Lojistik",
            score: 7.2,
            riskLevel: "Orta",
            coverImage: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=2070&auto=format&fit=crop",
            aiInsights: "Filo yenileme taahhütleri uygulansa da, son 2 ayda Twitter ve Şikayetvar üzerinden gelen karbon salınımı kaynaklı eleştiriler Dinamik Güven Skorunu düşürdü.",
            verifiedPoints: ["Toplumsal geri bildirimlere yavaş dönüş", "Elektrikli filo bölgesel şikayetleri"]
        },
        {
            name: "Global Çimento Sanayi",
            sector: "Ağır Sanayi",
            score: 4.8,
            riskLevel: "Yüksek",
            coverImage: "https://images.unsplash.com/photo-1611273426858-450d873c25ea?q=80&w=2070&auto=format&fit=crop",
            aiInsights: "Bölge halkı tarafından bildirilen baca tozu şikayetleri ve sensör ağından çekilen veriler eşleşiyor. Toplumsal denetimde en çok eleştirilenler arasında.",
            verifiedPoints: ["Sosyal medyada negatif eğilim (Sentiment: -%42)", "Tedarik zinciri şeffaflığı zayıf"]
        },
        {
            name: "Mavi Dalga Denizcilik",
            sector: "Deniz Taşımacılığı",
            score: 8.8,
            riskLevel: "Düşük",
            coverImage: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?q=80&w=2070&auto=format&fit=crop",
            aiInsights: "LNG yakıtlı gemiler liman bölgelerinde yaşayan halktan olumlu tepki alıyor. Dinamik skor, yerel basındaki pozitif haberlerle yükselişte.",
            verifiedPoints: ["Liman sakinlerinden sıfır şikayet", "Uluslararası ESG standartı tam uyumu"]
        }
    ];

    const filteredCompanies = mockCompanies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.sector.toLowerCase().includes(searchTerm.toLowerCase()));

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
                                Y.Z. Destekli Dinamik ESG Güven Değişim Skoru
                            </h1>
                            <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '600px' }}>
                                Şirketlerin yılda bir yayınladığı statik raporlara mahkum değilsiniz. Sosyal medya verileri, dijital platform bildirimleri ve kamuoyu geri bildirimlerini harmanlayan <strong>Dinamik Güven Skorumuzla</strong> halkın denetimini yeşil finansmana entegre ediyoruz.
                            </p>
                        </div>

                        {/* Stats Panel */}
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', minWidth: '160px' }}>
                                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Taranan Şirket</span>
                                <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Activity size={24} color="#3B82F6" /> 1,204
                                </span>
                            </div>
                            <div style={{ background: 'var(--primary-glow)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(4, 78, 59, 0.1)', minWidth: '160px' }}>
                                <span style={{ display: 'block', fontSize: '12px', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Tespit Edilen İhlal</span>
                                <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertTriangle size={24} color="#EF4444" /> 47
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div style={{ marginTop: '40px', position: 'relative', maxWidth: '800px' }}>
                        <div style={{ position: 'absolute', top: '50%', left: '20px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Şirket adı, VKN veya Sektör girerek ESG skorunu anında sorgulayın..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                            Y.Z. Tarama
                        </button>
                    </div>

                </div>
            </section>

            {/* Results Grid */}
            <main className="container" style={{ marginTop: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={24} color="var(--primary)" /> Anlık Güven Endeksi
                    </h2>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>{filteredCompanies.length} sonuç listeleniyor</span>
                </div>

                {filteredCompanies.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                        <Search size={48} color="var(--border-color)" style={{ margin: '0 auto 16px auto' }} />
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Sonuç Bulunamadı</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Farklı bir şirket veya sektör adı girmeyi deneyin.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>
                        {filteredCompanies.map((comp, i) => (
                            <EsgCompanyCard key={i} {...comp} />
                        ))}
                    </div>
                )}
            </main>

        </div>
    );
};

export default ESGReport;
