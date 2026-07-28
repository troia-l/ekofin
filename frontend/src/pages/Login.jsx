import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, Building2, Landmark, Sparkles, ArrowRight, Leaf, BarChart3 } from 'lucide-react';

const Login = ({ setCurrentUser }) => {
    const navigate = useNavigate();
    const [role, setRole] = useState('kobi'); // 'kobi' or 'bank'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleManualLogin = (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Lütfen tüm alanları doldurun.');
            return;
        }

        // Mock manual login
        let mockUser = null;
        if (role === 'bank') {
            mockUser = {
                role: 'bank',
                companyName: 'Akbank Yeşil Finans Dep.',
                companyTicker: 'AKBNK',
                userName: 'Selin Demir',
                userTitle: 'Kredi Tahsis Uzmanı'
            };
        } else {
            mockUser = {
                role: 'kobi',
                companyName: 'Genel Sanayi A.Ş.',
                companyTicker: 'GENEL',
                userName: 'Ahmet Yılmaz',
                userTitle: 'KOBİ CFO'
            };
        }

        localStorage.setItem('currentUser', JSON.stringify(mockUser));
        setCurrentUser(mockUser);

        if (mockUser.role === 'bank') {
            navigate('/bank/dashboard');
        } else {
            navigate('/dashboard');
        }
    };

    const handleQuickLogin = (preset) => {
        let mockUser = null;

        if (preset === 'tofas') {
            mockUser = {
                role: 'kobi',
                companyName: 'Tofaş Türk Otomobil Fabrikası A.Ş.',
                companyTicker: 'TOASO',
                userName: 'Kerem Özdemir',
                userTitle: 'Sürdürülebilirlik Müdürü'
            };
        } else if (preset === 'aselsan') {
            mockUser = {
                role: 'kobi',
                companyName: 'Aselsan Elektronik Sanayi',
                companyTicker: 'ASELS',
                userName: 'Burak Yılmaz',
                userTitle: 'Çevresel Etki ve İSG Direktörü'
            };
        } else if (preset === 'bank') {
            mockUser = {
                role: 'bank',
                companyName: 'Yeşil Kalkınma Bankası A.Ş.',
                companyTicker: 'YKBNK',
                userName: 'Selin Demir',
                userTitle: 'Yeşil Finansman Kredi Lideri'
            };
        }

        if (mockUser) {
            localStorage.setItem('currentUser', JSON.stringify(mockUser));
            setCurrentUser(mockUser);
            if (mockUser.role === 'bank') {
                navigate('/bank/dashboard');
            } else {
                navigate('/dashboard');
            }
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            background: '#FFFFFF',
            fontFamily: 'Inter, sans-serif',
            overflow: 'hidden'
        }}>
            
            <style>{`
                .split-container {
                    display: flex;
                    width: 100%;
                    height: 100vh;
                    overflow: hidden;
                }
                .left-pane {
                    flex: 1.25;
                    background: #F8FAFC;
                    color: var(--text-main);
                    padding: 40px 60px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                    border-right: 1px solid #E2E8F0;
                }
                .right-pane {
                    flex: 0.75;
                    padding: 40px 80px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    background: #FFFFFF;
                    overflow-y: auto;
                    box-sizing: border-box;
                }
                .left-grid {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    opacity: 0.55;
                    background-image: 
                        linear-gradient(#E2E8F0 1px, transparent 1px),
                        linear-gradient(90deg, #E2E8F0 1px, transparent 1px);
                    background-size: 30px 30px;
                    pointer-events: none;
                }
                .main-dashboard-card {
                    background: #FFFFFF;
                    border: 1px solid rgba(0, 0, 0, 0.05);
                    box-shadow: 0 15px 35px rgba(11, 17, 32, 0.04), 0 5px 15px rgba(0, 0, 0, 0.01);
                    border-radius: 24px;
                    width: 100%;
                    max-width: 460px;
                    padding: 34px;
                    box-sizing: border-box;
                }
                .mini-card {
                    background: #FFFFFF;
                    border: 1px solid rgba(0, 0, 0, 0.05);
                    box-shadow: 0 10px 20px rgba(11, 17, 32, 0.02);
                    border-radius: 18px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex: 1;
                    box-sizing: border-box;
                }
                .chart-bar {
                    flex: 1;
                    background: #F1F5F9;
                    border-radius: 6px;
                    transition: height 0.3s ease;
                }
                .chart-bar.active {
                    background: linear-gradient(to top, var(--accent-emerald-dark), var(--accent-emerald));
                }
                .login-glass-card {
                    background: #FFFFFF;
                    border: 1px solid #E2E8F0;
                    box-shadow: 0 20px 40px rgba(11, 17, 32, 0.04);
                    border-radius: 24px;
                    width: 100%;
                    max-width: 400px;
                    padding: 32px;
                    margin: 0 auto;
                    box-sizing: border-box;
                }
                .role-btn {
                    flex: 1;
                    padding: 11px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 700;
                    border: 1px solid #E2E8F0;
                    background: #FFFFFF;
                    color: var(--text-muted);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    transition: all 0.25s ease;
                }
                .role-btn.active {
                    background: var(--primary-midnight);
                    color: #FFFFFF;
                    border-color: var(--primary-midnight);
                    box-shadow: 0 4px 12px rgba(11, 17, 32, 0.12);
                }
                .preset-card {
                    background: rgba(248, 250, 252, 0.8);
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    padding: 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    transition: all 0.2s ease;
                }
                .preset-card:hover {
                    border-color: var(--accent-emerald);
                    background: rgba(16, 185, 129, 0.04);
                    transform: translateY(-1px);
                }
                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    width: 100%;
                }
                .input-icon {
                    position: absolute;
                    left: 14px;
                    pointer-events: none;
                    color: var(--text-light);
                }
                .custom-input {
                    width: 100%;
                    height: 44px;
                    padding: 0 16px 0 42px;
                    background: rgba(248, 250, 252, 0.95);
                    border: 1px solid #E2E8F0;
                    border-radius: 8px;
                    font-size: 13.5px;
                    color: var(--text-main);
                    outline: none;
                    transition: all 0.2s ease;
                    box-sizing: border-box;
                }
                .custom-input:focus {
                    background: #FFFFFF;
                    border-color: var(--accent-emerald);
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
                }
                @media (max-width: 992px) {
                    .split-container {
                        flex-direction: column;
                        height: auto;
                        overflow: visible;
                    }
                    .left-pane {
                        padding: 60px 40px;
                        height: 450px;
                    }
                    .right-pane {
                        padding: 40px;
                        overflow-y: visible;
                    }
                }
            `}</style>

            <div className="split-container">
                
                {/* Left Pane (Graph Paper Background & Visual Cards) */}
                <div className="left-pane">
                    <div className="left-grid" />
                    
                    {/* Brand Logo inside Pane (Top Left) */}
                    <div style={{ position: 'absolute', top: '40px', left: '40px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 2 }}>
                        <img src="./ecofin_logo.png" alt="EcoFin" style={{ height: '36px', width: 'auto' }} />
                        <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                            <span style={{ color: 'var(--primary-midnight)' }}>Eco</span><span style={{ color: '#FF7F00' }}>Fin</span>
                        </span>
                    </div>

                    <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Main Floating Card */}
                        <div className="main-dashboard-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
                                <BarChart3 size={15} />
                                <span>Canlı ESG Endeksi</span>
                            </div>
                            
                            <h2 style={{ 
                                fontSize: '36px', 
                                fontWeight: 800, 
                                color: 'var(--primary-midnight)', 
                                marginTop: '20px', 
                                lineHeight: '1.2',
                                fontFamily: 'Plus Jakarta Sans, sans-serif'
                            }}>
                                Sürdürülebilir <br/>
                                <span style={{ color: 'var(--accent-emerald)' }}>Büyüyün</span>
                            </h2>
                            
                            {/* Increasing vertical bar chart visual */}
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '135px', marginTop: '32px' }}>
                                <div className="chart-bar" style={{ height: '25%' }}></div>
                                <div className="chart-bar" style={{ height: '40%' }}></div>
                                <div className="chart-bar" style={{ height: '65%' }}></div>
                                <div className="chart-bar" style={{ height: '55%' }}></div>
                                <div className="chart-bar active" style={{ height: '90%' }}></div>
                            </div>
                        </div>

                        {/* Two Bottom Cards side by side */}
                        <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
                            
                            {/* Card A: Carbon reduction */}
                            <div className="mini-card">
                                <div style={{ 
                                    width: '42px', 
                                    height: '42px', 
                                    borderRadius: '50%', 
                                    background: 'rgba(16, 185, 129, 0.1)', 
                                    color: 'var(--accent-emerald)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Leaf size={20} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Karbon Azaltımı</span>
                                    <span style={{ fontSize: '19px', fontWeight: 800, color: 'var(--primary-midnight)', marginTop: '2px' }}>-%32</span>
                                </div>
                            </div>

                            {/* Card B: Interest reduction ROI */}
                            <div className="mini-card">
                                <div style={{ 
                                    width: '42px', 
                                    height: '42px', 
                                    borderRadius: '50%', 
                                    background: 'rgba(16, 185, 129, 0.1)', 
                                    color: 'var(--accent-emerald)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Sparkles size={20} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Faiz Avantajı</span>
                                    <span style={{ fontSize: '19px', fontWeight: 800, color: 'var(--accent-emerald-dark)', marginTop: '2px' }}>-%2.4</span>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

                {/* Right Pane (Login form & presets) */}
                <div className="right-pane">
                    <div className="login-glass-card">
                        
                        {/* Logo in Login Card */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
                            <img src="./ecofin_logo.png" alt="EcoFin" style={{ height: '32px', width: 'auto' }} />
                            <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                                <span style={{ color: 'var(--primary)' }}>Eco</span><span style={{ color: '#FF7F00' }}>Fin</span>
                            </span>
                        </div>
                        
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-midnight)', marginBottom: '4px' }}>
                                Portal Girişi
                            </h2>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Sürdürülebilirlik paneline güvenle erişin
                            </p>
                        </div>

                        {/* Role Switcher */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <button 
                                type="button" 
                                className={`role-btn ${role === 'kobi' ? 'active' : ''}`}
                                onClick={() => setRole('kobi')}
                            >
                                <Building2 size={12} /> Şirket Yetkilisi
                            </button>
                            <button 
                                type="button" 
                                className={`role-btn ${role === 'bank' ? 'active' : ''}`}
                                onClick={() => setRole('bank')}
                            >
                                <Landmark size={12} /> Banka Yetkilisi
                            </button>
                        </div>

                        {/* Quick Presets for Demo */}
                        <div style={{ marginBottom: '16px' }}>
                            <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Sparkles size={10} color="var(--accent-emerald)" /> Hızlı Giriş Profilleri
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {role === 'kobi' ? (
                                    <>
                                        <div className="preset-card" onClick={() => handleQuickLogin('tofas')}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--primary-midnight)' }}>Tofaş Otomotiv (TOASO)</div>
                                                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '1px' }}>Sürdürülebilirlik Müdürü</div>
                                            </div>
                                            <ArrowRight size={12} color="var(--accent-emerald)" />
                                        </div>
                                        <div className="preset-card" onClick={() => handleQuickLogin('aselsan')}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--primary-midnight)' }}>Aselsan Elektronik (ASELS)</div>
                                                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '1px' }}>İSG ve Çevre Direktörü</div>
                                            </div>
                                            <ArrowRight size={12} color="var(--accent-emerald)" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="preset-card" onClick={() => handleQuickLogin('bank')}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--primary-midnight)' }}>Yeşil Kalkınma Bankası</div>
                                            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '1px' }}>Kredi Tahsis Lideri</div>
                                        </div>
                                        <ArrowRight size={12} color="var(--accent-emerald)" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: '10px' }}>
                            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
                            <span style={{ fontSize: '10px', color: 'var(--text-light)', fontWeight: 600 }}>veya manuel giriş</span>
                            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleManualLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            
                            {error && (
                                <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', fontSize: '11px', fontWeight: 600 }}>
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="form-label" style={{ fontWeight: 600, fontSize: '11px', marginBottom: '4px' }}>E-posta Adresi</label>
                                <div className="input-wrapper">
                                    <input 
                                        type="email" 
                                        className="custom-input" 
                                        placeholder={role === 'bank' ? 'banka@ecofin.com' : 'sirket@ecofin.com'} 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <Mail className="input-icon" size={14} />
                                </div>
                            </div>

                            <div>
                                <label className="form-label" style={{ fontWeight: 600, fontSize: '11px', marginBottom: '4px' }}>Şifre</label>
                                <div className="input-wrapper">
                                    <input 
                                        type="password" 
                                        className="custom-input" 
                                        placeholder="••••••••" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <Lock className="input-icon" size={14} />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="btn-primary" 
                                style={{ 
                                    width: '100%', 
                                    padding: '11px', 
                                    background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-emerald-dark))', 
                                    border: 'none',
                                    justifyContent: 'center',
                                    marginTop: '6px',
                                    borderRadius: '8px',
                                    fontSize: '13px'
                                }}
                            >
                                Giriş Yap <ArrowRight size={12} style={{ marginLeft: '4px' }} />
                            </button>
                        </form>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;
