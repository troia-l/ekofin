import React, { useState } from 'react';
import { AlertOctagon, ThumbsDown, MessageSquare, Plus, FileText, UploadCloud, Search } from 'lucide-react';

const ReportItem = ({ company, category, date, description, status, upvotes }) => {
    return (
        <div className="clean-card" style={{ padding: '24px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{
                background: '#F8FAFC',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '60px'
            }}>
                <ThumbsDown size={20} color="#EF4444" style={{ marginBottom: '8px' }} />
                <span style={{ fontSize: '14px', fontWeight: 800 }}>{upvotes}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Onay</span>
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>{company}</h4>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                            {category}
                        </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{date}</span>
                </div>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', marginBottom: '16px' }}>
                    {description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn" style={{ background: 'transparent', padding: 0, color: 'var(--text-muted)', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <MessageSquare size={14} /> Yorumlar (12)
                        </button>
                        <button className="btn" style={{ background: 'transparent', padding: 0, color: 'var(--text-muted)', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <FileText size={14} /> Kanıtları İncele
                        </button>
                    </div>
                    <span className="badge" style={{
                        background: status === 'İnceleniyor' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: status === 'İnceleniyor' ? '#F59E0B' : 'var(--accent-green)',
                        border: 'none'
                    }}>
                        YZ Durumu: {status}
                    </span>
                </div>
            </div>
        </div>
    );
};

const PublicAudit = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);

    const mockupReports = [
        {
            company: "Global Çimento Sanayi",
            category: "Hava Kirliliği / Yalan Beyan",
            date: "Bugün, 14:30",
            description: "Şirket ESG raporunda %100 filtreleme kullandığını iddia ediyor ama gece 02:00-04:00 arası filtreleri kapatarak yoğun kül ve duman salınımı yapıyorlar. Bölge halkı olarak çektiğimiz videoları sisteme yükledik.",
            upvotes: 842,
            status: "İnceleniyor"
        },
        {
            company: "EcoLogi Kargo C Lojistik",
            category: "Yeşil Aklama (Greenwashing)",
            date: "Dün, 09:15",
            description: "Reklamlarında tüm filolarının elektrikli olduğu söyleniyor ancak depolarında hala eski model dizel araçlar aktif çalışıyor. Araç plakalarını ve depo giriş çıkışlarını belgeledim.",
            upvotes: 523,
            status: "Doğrulandı - Skor Düşürüldü"
        },
        {
            company: "Mavi Su Tekstil A.Ş.",
            category: "Atık Su Deşarjı",
            date: "12 Şubat 2026",
            description: "Arıtma tesisi gündüzleri çalışır gösterilirken gece nehre boyalı ve köpüklü kimyasal atık su deşarj ediliyor. Numune sonuçları ektedir.",
            upvotes: 1205,
            status: "Doğrulandı - Acil Bildirim"
        }
    ];

    return (
        <div style={{ background: 'var(--bg-color)', minHeight: '100vh', paddingBottom: '80px' }}>

            {/* Header Area */}
            <section style={{ background: '#FFFFFF', borderBottom: '1px solid var(--border-color)', padding: '60px 0 40px 0' }}>
                <div className="container animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '32px' }}>
                        <div style={{ flex: '1 1 500px' }}>
                            <div style={{ display: 'inline-flex', padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '20px', marginBottom: '16px', fontSize: '13px', fontWeight: 800, alignItems: 'center', gap: '6px' }}>
                                <AlertOctagon size={16} /> Anti-Yeşil İhbar Ağı
                            </div>
                            <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', letterSpacing: '-0.5px' }}>
                                Toplumsal Denetim Platformu
                            </h1>
                            <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '600px' }}>
                                Şirketlerin kurumsal beyanlarını halkın gücüyle doğruluyoruz. Gözlemlediğiniz çevre ihlallerini ve greenwashing (yeşil aklama) vakalarını bildirin, yapay zeka analiz etsin, şirket skorları gerçekleri yansıtsın.
                            </p>
                        </div>

                        <button onClick={() => setIsFormOpen(!isFormOpen)} className="btn btn-primary" style={{ background: '#EF4444', border: 'none', padding: '16px 24px', fontSize: '15px', display: 'flex', gap: '8px' }}>
                            <Plus size={20} /> Yeni İhlal Bildir
                        </button>
                    </div>
                </div>
            </section>

            <main className="container" style={{ marginTop: '40px', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>

                {/* Reports List */}
                <div style={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>Son Bildirimler</h2>
                        <div style={{ position: 'relative' }}>
                            <input type="text" placeholder="Şirket Ara..." className="input-field" style={{ padding: '8px 16px 8px 36px', width: '250px', borderRadius: '20px', fontSize: '13px' }} />
                            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                        </div>
                    </div>

                    {mockupReports.map((rep, idx) => (
                        <ReportItem key={idx} {...rep} />
                    ))}
                </div>

                {/* Form Sidebar (Conditional) */}
                {isFormOpen && (
                    <div className="clean-card animate-fade-in" style={{ flex: '1 1 35%', padding: '24px', position: 'sticky', top: '100px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            İhlal Bildirim Formu
                        </h3>
                        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={(e) => { e.preventDefault(); alert('Bildiriminiz YZ havuzuna aktarıldı. Teşekkürler.'); setIsFormOpen(false); }}>
                            <div>
                                <label className="form-label">Şirket Adı</label>
                                <input type="text" className="input-field" placeholder="Örn: X Fabrikası" required />
                            </div>
                            <div>
                                <label className="form-label">İhlal Kategorisi</label>
                                <select className="input-field" required>
                                    <option value="">Seçiniz</option>
                                    <option value="greenwashing">Greenwashing (Yeşil Aklama)</option>
                                    <option value="pollution">Hava / Su / Toprak Kirliliği</option>
                                    <option value="waste">Kaçak Atık Dökümü</option>
                                    <option value="other">Diğer</option>
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Açıklama & Gözlem</label>
                                <textarea className="input-field" placeholder="Lütfen durumu detaylıca açıklayın..." rows="4" required></textarea>
                            </div>
                            <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '24px', textAlign: 'center', background: '#F8FAFC', cursor: 'pointer' }}>
                                <UploadCloud size={24} color="var(--text-muted)" style={{ margin: '0 auto 8px auto' }} />
                                <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block' }}>Fotoğraf veya Video Yükle</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                <input type="checkbox" required style={{ marginTop: '2px' }} />
                                Yüklediğim dosyaların bana ait olduğunu ve yanlış ihbar yapmadığımı onaylıyorum.
                            </div>
                            <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '14px', background: '#EF4444', border: 'none' }}>
                                Ağa Gönder
                            </button>
                        </form>
                    </div>
                )}
            </main>

        </div>
    );
};

export default PublicAudit;
