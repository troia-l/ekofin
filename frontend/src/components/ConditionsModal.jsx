import React from 'react';
import { X, TrendingUp, AlertCircle, CheckCircle2, Factory } from 'lucide-react';

const ConditionsModal = ({ isOpen, onClose, bankName, esgScore }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '40px'
        }}>
            <div className="animate-fade-in" style={{
                background: '#FFFFFF',
                width: '100%',
                maxWidth: '900px',
                maxHeight: '90vh',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Modal Header */}
                <div style={{
                    padding: '24px 32px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#F8FAFC'
                }}>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                            {bankName} - Kredi Koşulları ve YZ Analizi
                        </h2>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                            Referans Kodu: YZ-ESG-2026-X892
                        </span>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#F1F5F9'
                    }}>
                        <X size={24} color="var(--text-muted)" />
                    </button>
                </div>

                {/* Modal Body */}
                <div style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Top Section: Quick Summary & Purpose */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                        <div style={{ background: 'var(--primary-glow)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(4, 78, 59, 0.1)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Factory size={20} />Kredinin Amacı ve Kapsamı
                            </h3>
                            <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#1E293B', marginBottom: '16px' }}>
                                Bu finansman paketi, işletmelerin Karbon Nötr (Net Zero) hedeflerine ulaşmalarını hızlandırmak amacıyla tasarlanmıştır. Başvurunuzun onaylanması durumunda fonlar yalnızca tescillenmiş yenilenebilir enerji yatırımları veya enerji verimliliği projeleri için kullanılabilir.
                            </p>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <span className="badge" style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>Güneş Enerjisi (GES)</span>
                                <span className="badge" style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>Rüzgar Enerjisi (RES)</span>
                                <span className="badge" style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>Ev İstasyonları</span>
                            </div>
                        </div>

                        <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', fontWeight: 800, color: esgScore >= 8 ? 'var(--accent-green)' : '#FF7F00', lineHeight: 1 }}>
                                {esgScore}<span style={{ fontSize: '24px', color: 'var(--text-muted)' }}>/10</span>
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Yapay Zeka ESG Güven Skoru
                            </span>
                        </div>
                    </div>

                    {/* Middle Section: Graphics (Mock) & Details */}
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>Finansal Projeksiyon ve Şartlar</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            {/* Bullet Points */}
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <CheckCircle2 size={20} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-main)' }}>Geri Ödemesiz Dönem (Grace Period)</strong>
                                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>Proje kurulum süresince (12 aya kadar) anapara ve faiz ödemesi ertelenebilir.</span>
                                    </div>
                                </li>
                                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <CheckCircle2 size={20} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-main)' }}>ESG Performans İndirimi</strong>
                                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>Kurulum sonrası karbon salınımınızdaki düşüş YZ ile kanıtlandığında, faiz oranında anında %0.5 ek indirim uygulanır.</span>
                                    </div>
                                </li>
                                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <AlertCircle size={20} color="#FF7F00" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-main)' }}>Cezai Şartlar (Greenwashing Koruması)</strong>
                                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>Kredinin beyan edilen çevresel yatırım dışında kullanılması (Greenwashing) tespit edildiğinde, kredi standart ticari kredi faizi ile yeniden yapılandırılır.</span>
                                    </div>
                                </li>
                            </ul>

                            {/* Mock Graph Area */}
                            <div style={{ background: '#F8FAFC', border: '1px dashed var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', minHeight: '200px' }}>
                                <TrendingUp size={48} color="var(--primary)" style={{ opacity: 0.2, marginBottom: '16px' }} />
                                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Karbon Emisyonu Azaltım Projeksiyonu</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Amortisman ve Tasarruf Grafiği Önizlemesi</span>
                                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'flex-end', height: '60px' }}>
                                    {/* Fake Bar Chart */}
                                    <div style={{ width: '20px', height: '100%', background: '#EF4444', borderRadius: '4px 4px 0 0', opacity: 0.5 }}></div>
                                    <div style={{ width: '20px', height: '80%', background: '#F59E0B', borderRadius: '4px 4px 0 0', opacity: 0.6 }}></div>
                                    <div style={{ width: '20px', height: '50%', background: '#10B981', borderRadius: '4px 4px 0 0', opacity: 0.8 }}></div>
                                    <div style={{ width: '20px', height: '20%', background: 'var(--primary)', borderRadius: '4px 4px 0 0', opacity: 1 }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div style={{ padding: '20px 32px', background: '#F8FAFC', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} className="btn btn-primary" style={{ background: '#FF7F00', color: '#FFF', border: 'none', padding: '12px 32px' }}>
                        Anladım, Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConditionsModal;
