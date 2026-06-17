import React from 'react';
import { X, MapPin, Building, Leaf, ShieldCheck, CheckCircle2 } from 'lucide-react';

const ProjectDetailsModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '40px'
        }}>
            <div className="animate-fade-in" style={{
                background: '#FFFFFF',
                width: '100%',
                maxWidth: '1000px',
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
                            {data.title}
                        </h2>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={16} /> {data.location}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building size={16} /> {data.companyName}</span>
                        </div>
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
                <div style={{ padding: '0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

                    {/* Hero Image Area */}
                    <div style={{ width: '100%', height: '280px', position: 'relative' }}>
                        <img src={data.coverImage} alt={data.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
                        <div style={{ position: 'absolute', bottom: '24px', left: '32px', right: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', color: '#FFF' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', padding: '12px', borderRadius: '8px' }}>
                                    <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', opacity: 0.9 }}>YZ ESG Skoru</span>
                                    <span style={{ fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <ShieldCheck size={24} color="#10B981" /> {data.esgScore}/10
                                    </span>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', padding: '12px', borderRadius: '8px' }}>
                                    <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', opacity: 0.9 }}>Beklenen Getiri</span>
                                    <span style={{ fontSize: '24px', fontWeight: 800, color: '#FF7F00' }}>%{data.expectedReturn}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>

                        {/* Left: About Project */}
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Leaf size={24} color="var(--primary)" /> Proje Hakkında
                            </h3>
                            <p style={{ fontSize: '15px', color: '#334155', lineHeight: '1.7', marginBottom: '24px' }}>
                                {data.description}
                            </p>

                            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)' }}>Enerji ve Sürdürülebilirlik Çıktıları</h4>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {data.impacts.map((impact, idx) => (
                                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                        <CheckCircle2 size={18} color="var(--accent-green)" /> {impact}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Right: Technical & Financial Summary */}
                        <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', height: 'fit-content' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Projeksiyon Özeti</h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Proje Büyüklüğü</span>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{data.projectSize}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Kurulum Süresi</span>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{data.duration} Aydan Kısa</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Asgari Yatırım Katı</span>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{data.minInvestmentTier}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>Banka Katılımı</span>
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>{data.bankParticipation}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProjectDetailsModal;
