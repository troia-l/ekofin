import React from 'react';
import { ChevronDown } from 'lucide-react';

const HeroSection = () => (
    <section style={{
        padding: '40px 0',
        background: '#FFFFFF',
        borderBottom: '1px solid var(--border-color)'
    }}>
        <div className="container animate-fade-in">
            <div style={{ padding: '24px 32px', background: 'var(--primary)', borderRadius: 'var(--radius-md)', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.5px' }}>
                        5.000.000 TL 24 Ay Vadeli Tasarruf Finansmanı
                    </h1>
                    <p style={{ fontSize: '15px', opacity: 0.9 }}>
                        Yapay Zeka destekli ESG doğrulama ve yenilenebilir enerji destekli kredi seçenekleri.
                    </p>
                </div>

                <div style={{ flex: 1, display: 'flex', gap: '16px', background: '#FFFFFF', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ flex: 1 }}>
                        <label className="form-label">Kredi Tutarı (TL)</label>
                        <input type="text" className="input-field" defaultValue="5.000.000" />
                    </div>

                    <div style={{ flex: 1 }}>
                        <label className="form-label">Kredi Vadesi</label>
                        <div style={{ position: 'relative' }}>
                            <select className="input-field" style={{ appearance: 'none', paddingRight: '40px' }} defaultValue="24">
                                <option value="12">12 Ay</option>
                                <option value="24">24 Ay</option>
                                <option value="36">36 Ay</option>
                            </select>
                            <ChevronDown size={16} color="var(--text-muted)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button className="btn btn-primary" style={{ padding: '12px 24px', height: '44.5px', background: '#FF7F00', color: '#fff', border: 'none', borderRadius: '4px' }}>Yeniden Hesapla</button>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

export default HeroSection;
