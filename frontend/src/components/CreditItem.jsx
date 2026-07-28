import React, { useState } from 'react';
import { Award, ShieldCheck, Leaf, CheckCircle2, Info } from 'lucide-react';
import EsgBadge from './EsgBadge';
import { useNavigate } from 'react-router-dom';
import ConditionsModal from './ConditionsModal';

const CreditItem = ({ sponsor, type, name, rate, total, features, isGreen, bankLogoUrl, esgScore, esgDetails, onOpenConditions }) => {
    const navigate = useNavigate();

    return (
        <div className="clean-card animate-fade-in flex-col delay-100" style={{ padding: '0', marginBottom: '24px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#FFFFFF' }}>
            {/* Head - Top Bar */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2" style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 700 }}>
                        {isGreen ? <Award size={18} color="#FF7F00" /> : <ShieldCheck size={18} color="var(--accent-green)" />}
                        {type}
                    </div>
                    {esgScore && <EsgBadge score={esgScore} />}
                </div>
                {sponsor && <span className="badge badge-sponsor">Sponsor</span>}
            </div>

            {/* Table-like Body with CSS Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.6fr) 140px',
                gap: '24px',
                padding: '28px 24px',
                alignItems: 'center'
            }}>

                {/* 1. Brand */}
                <div className="flex items-center gap-4" style={{ paddingRight: '16px' }}>
                    {bankLogoUrl ? (
                        <img src={bankLogoUrl} alt={name} style={{ width: '80px', height: 'auto', maxHeight: '40px', objectFit: 'contain' }} />
                    ) : (
                        <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                            <Leaf size={28} color={isGreen ? "var(--primary)" : "var(--text-muted)"} />
                        </div>
                    )}
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-main)' }}>{name}</h3>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Yeni Müşterilere Özel</span>
                    </div>
                </div>

                {/* 2. Rates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingRight: '16px' }}>
                    <div className="flex-col">
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Faiz Oranı</span>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>{rate}</span>
                    </div>
                    <div className="flex-col">
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Toplam</span>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>{total}</span>
                    </div>
                </div>

                {/* 3. Action */}
                <div className="flex-col items-center justify-center" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button onClick={() => navigate('/apply', { state: { mode: 'credit', credit: { name, rate, total, esgScore, features, isGreen, bankLogoUrl, type } } })} className="btn btn-outline" style={{ width: '100%', borderColor: '#FF7F00', color: '#FF7F00', fontSize: '14px', fontWeight: 700, padding: '12px 0', background: '#FFF', justifyContent: 'center' }}>
                        Hemen Başvur
                    </button>
                    <button onClick={(e) => { e.preventDefault(); if (onOpenConditions) onOpenConditions(); }} className="btn btn-outline" style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'underline', fontWeight: 600, marginTop: '2px', cursor: 'pointer', padding: 0 }}>Koşullar</button>
                </div>

            </div>

            {/* YZ Detailed Analysis Info Row */}
            {esgDetails && (
                <div style={{ padding: '12px 24px', borderTop: '1px dotted var(--border-color)', background: '#FAFBFC', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Info size={16} color="var(--primary)" />
                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                        <strong style={{ color: 'var(--primary)' }}>YZ Doğrulaması:</strong> {esgDetails}
                    </span>
                </div>
            )}

            {/* 4. Features (Bottom Panel) */}
            {features && features.length > 0 && (
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: '#F8FAFC' }}>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                        {features.map((feat, i) => (
                            <li key={i} className="flex gap-2" style={{ fontSize: '13px', color: 'var(--text-main)', alignItems: 'center' }}>
                                <CheckCircle2 size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                                <span style={{ fontWeight: 500, color: '#334155' }}>{feat}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CreditItem;
