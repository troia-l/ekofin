import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, Building2, Landmark, Sparkles, ArrowRight, Leaf, BarChart3, X } from 'lucide-react';
import './LoginJuryGuide.css';
import { createPortal } from 'react-dom';
import useMobileTourLayout from '../hooks/useMobileTourLayout';

const juryWizardFlag = 'ecofin-jury-login-wizard';
const demoEmail = 'juri@yesiltekstil.example';
const demoPassword = 'EcoFinJuri2026!';
const guideTargets = {
    profile: '[data-jury-guide-target="green-textile"]',
    email: '[data-jury-guide-target="email"]',
    password: '[data-jury-guide-target="password"]',
    submit: '[data-jury-guide-target="submit"]',
};

const guideCopy = {
    profile: { title: 'Yeşil Tekstil profilini seçin', text: 'Demo şirket profiline basın. Örnek e-posta ve parola giriş alanlarına sırayla yazılacak.' },
    email: { title: 'Demo e-postası yazılıyor', text: 'Jüri sunumuna özel örnek e-posta karakter karakter dolduruluyor.' },
    password: { title: 'Demo parolası yazılıyor', text: 'E-posta tamamlandı. Şimdi örnek parola alanı dolduruluyor.' },
    submit: { title: 'Girişe devam edin', text: 'Alanlar dolduruldu. Vurgulanan düğmeye basarak Yeşil Tekstil demo panelini açın.' },
};

const LoginGuideWaiting = () => (
    <motion.aside
        className="jury-login-waiting"
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
    >
        <div className="jury-login-waiting-copy">
            <span className="jury-login-waiting-icon"><Sparkles size={15} /></span>
            <span>
                <strong>Jüri demosu hazırlanıyor</strong>
                <small>Giriş ekranı birazdan adım adım vurgulanacak</small>
            </span>
        </div>
        <div className="jury-login-waiting-progress"><span /></div>
    </motion.aside>
);

const LoginGuideSpotlight = ({ target, step, onClose }) => {
    const cardRef = React.useRef(null);
    const [cardHeight, setCardHeight] = React.useState(0);
    const mobileStyle = useMobileTourLayout(guideTargets[step], cardRef);

    React.useLayoutEffect(() => {
        const card = cardRef.current;
        if (!card) return undefined;
        const measure = () => setCardHeight(card.getBoundingClientRect().height);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(card);
        return () => observer.disconnect();
    }, [step, target]);

    if (!target || !step) return null;
    const { top, left, right, bottom, width, height } = target;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tipWidth = Math.max(0, Math.min(320, viewportWidth - 32));
    const tipLeft = Math.max(16, Math.min(right - tipWidth, viewportWidth - tipWidth - 16));
    const spaceAbove = top - 16;
    const spaceBelow = viewportHeight - bottom - 16;
    const placeAbove = step === 'submit' || spaceAbove >= cardHeight + 18 || spaceAbove > spaceBelow;
    const maxTipTop = Math.max(16, viewportHeight - cardHeight - 16);
    const tipTop = placeAbove
        ? Math.max(16, Math.min(maxTipTop, top - cardHeight - 18))
        : Math.max(16, Math.min(maxTipTop, bottom + 18));
    const blocker = { position: 'fixed', zIndex: 1000, background: 'rgba(5, 14, 26, 0.58)', backdropFilter: 'blur(0.6px)', pointerEvents: 'auto' };

    return createPortal(
        <motion.div className="jury-login-tour-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none' }}>
            <div className="jury-login-tour-inset" aria-hidden="true" />
            <motion.div aria-hidden="true" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} style={{ ...blocker, top: 0, left: 0, right: 0, height: Math.max(0, top) }} />
            <motion.div aria-hidden="true" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.02 }} style={{ ...blocker, top: bottom, left: 0, right: 0, bottom: 0 }} />
            <motion.div aria-hidden="true" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.03 }} style={{ ...blocker, top, left: 0, width: Math.max(0, left), height }} />
            <motion.div aria-hidden="true" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.04 }} style={{ ...blocker, top, left: right, right: 0, height }} />
            <motion.div className="jury-login-tour-frame" aria-hidden="true" layout initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 360, damping: 25, delay: 0.08, layout: { type: 'spring', stiffness: 340, damping: 32 } }} style={{ top, left, width, height }} />
            <motion.section ref={cardRef} className="jury-login-tour-card" layout role="dialog" aria-labelledby="jury-login-tour-title" initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 310, damping: 27, delay: 0.1, layout: { type: 'spring', stiffness: 320, damping: 32 } }} style={{ top: tipTop, left: tipLeft, width: tipWidth, ...mobileStyle }}>
                <div className="jury-login-tour-heading">
                    <span><Sparkles size={12} /> Jüri demo · {step === 'profile' ? '2/4' : step === 'email' ? '3/4' : step === 'password' ? '3/4' : '4/4'}</span>
                    <button type="button" onClick={onClose} aria-label="Jüri sihirbazını kapat"><X size={15} /></button>
                </div>
                <strong id="jury-login-tour-title">{guideCopy[step]?.title}</strong>
                <p>{guideCopy[step]?.text}</p>
                <div className="jury-login-tour-progress"><span style={{ width: `${step === 'profile' ? 50 : step === 'email' || step === 'password' ? 72 : 100}%` }} /></div>
                <button type="button" className="jury-login-tour-dismiss" onClick={onClose}>Sihirbazı kapat</button>
            </motion.section>
        </motion.div>, document.body
    );
};

const Login = ({ setCurrentUser }) => {
    const navigate = useNavigate();
    const [role, setRole] = useState('kobi'); // 'kobi' or 'bank'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [juryLoginPending, setJuryLoginPending] = useState(false);
    const [juryWizardActive, setJuryWizardActive] = useState(false);
    const [juryWizardPreparing, setJuryWizardPreparing] = useState(false);
    const [guideStep, setGuideStep] = useState(null);
    const [guideTargetRect, setGuideTargetRect] = useState(null);
    const typingRun = React.useRef(0);

    useEffect(() => {
        const startedFromJury = window.sessionStorage.getItem(juryWizardFlag) === '1';
        if (!startedFromJury) return undefined;

        setJuryWizardPreparing(true);
        const startGuideTimer = window.setTimeout(() => {
            window.sessionStorage.removeItem(juryWizardFlag);
            setJuryWizardPreparing(false);
            setJuryWizardActive(true);
            setGuideStep('profile');
        }, 833);

        return () => window.clearTimeout(startGuideTimer);
    }, []);

    const closeJuryWizard = useCallback(() => {
        typingRun.current += 1;
        setJuryWizardActive(false);
        setGuideStep(null);
        setGuideTargetRect(null);
    }, []);

    const updateGuideTarget = useCallback(() => {
        const selector = guideTargets[guideStep];
        const element = selector ? document.querySelector(selector) : null;
        if (!element) {
            setGuideTargetRect(null);
            return;
        }
        const rect = element.getBoundingClientRect();
        const top = Math.max(8, rect.top - 12);
        const left = Math.max(8, rect.left - 12);
        const right = Math.max(left, Math.min(window.innerWidth - 8, rect.right + 12));
        const bottom = Math.max(top, Math.min(window.innerHeight - 8, rect.bottom + 12));
        setGuideTargetRect({ top, left, right, bottom, width: right - left, height: bottom - top });
    }, [guideStep]);

    useLayoutEffect(() => {
        if (!juryWizardActive || !guideStep) return;
        updateGuideTarget();
    }, [guideStep, juryWizardActive, updateGuideTarget]);

    useEffect(() => {
        if (!juryWizardActive || !guideStep) return undefined;
        const dismissOnEscape = (event) => {
            if (event.key === 'Escape') closeJuryWizard();
        };
        window.addEventListener('resize', updateGuideTarget);
        window.addEventListener('scroll', updateGuideTarget, true);
        window.addEventListener('keydown', dismissOnEscape);
        if (guideStep === 'profile' || guideStep === 'submit') document.querySelector(guideTargets[guideStep])?.focus({ preventScroll: true });
        return () => {
            window.removeEventListener('resize', updateGuideTarget);
            window.removeEventListener('scroll', updateGuideTarget, true);
            window.removeEventListener('keydown', dismissOnEscape);
        };
    }, [juryWizardActive, guideStep, updateGuideTarget, closeJuryWizard]);

    const typeDemoCredentials = async () => {
        const currentRun = ++typingRun.current;
        const typeValue = async (value, setter) => {
            setter('');
            for (let index = 1; index <= value.length; index += 1) {
                if (typingRun.current !== currentRun) return false;
                setter(value.slice(0, index));
                await new Promise(resolve => window.setTimeout(resolve, 28));
            }
            return typingRun.current === currentRun;
        };
        const pause = (duration) => new Promise(resolve => window.setTimeout(resolve, duration));

        setError('');
        setEmail('');
        setPassword('');
        setGuideStep('email');
        if (!await typeValue(demoEmail, setEmail)) return;
        await pause(107);
        if (typingRun.current !== currentRun) return;
        setGuideStep('password');
        if (!await typeValue(demoPassword, setPassword)) return;
        await pause(207);
        if (typingRun.current !== currentRun) return;
        setGuideStep('submit');
    };

    const handleManualLogin = async (e) => {
        e.preventDefault();
        if (juryLoginPending) return;
        setError('');

        if (!email || !password) {
            setError('Lütfen tüm alanları doldurun.');
            return;
        }

        if (juryWizardActive && guideStep === 'submit') {
            setJuryLoginPending(true);
            await new Promise(resolve => window.setTimeout(resolve, 140));
        }

        const isGreenTextileDemo = role === 'kobi' && email.trim().toLowerCase() === demoEmail;
        let mockUser = null;
        if (isGreenTextileDemo) {
            mockUser = {
                role: 'kobi',
                companyName: 'Yeşil Tekstil A.Ş.',
                companyTicker: 'YESTK',
                userName: 'Ece Yılmaz',
                userTitle: 'Sürdürülebilirlik Yöneticisi'
            };
        } else if (role === 'bank') {
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

        typingRun.current += 1;
        window.sessionStorage.removeItem(juryWizardFlag);
        const startJuryFeatureFlow = isGreenTextileDemo && juryWizardActive;
        if (startJuryFeatureFlow) window.sessionStorage.setItem('ecofin-jury-integration-tour', '1');

        localStorage.setItem('currentUser', JSON.stringify(mockUser));
        setCurrentUser(mockUser);

        if (startJuryFeatureFlow) {
            navigate('/integration');
        } else if (mockUser.role === 'bank') {
            navigate('/bank/dashboard');
        } else {
            navigate('/dashboard');
        }
    };

    const handleQuickLogin = (preset) => {
        if (preset === 'green-textile') {
            if (juryWizardActive) {
                setRole('kobi');
                typeDemoCredentials();
                return;
            }
            const textileUser = {
                role: 'kobi',
                companyName: 'Yeşil Tekstil A.Ş.',
                companyTicker: 'YESTK',
                userName: 'Ece Yılmaz',
                userTitle: 'Sürdürülebilirlik Yöneticisi'
            };
            localStorage.setItem('currentUser', JSON.stringify(textileUser));
            setCurrentUser(textileUser);
            navigate('/dashboard');
            return;
        }

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
        <div className="login-page" style={{
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
                @media (max-width: 600px) {
                    .split-container { min-height: 100dvh; }
                    .left-pane { display: none; }
                    .right-pane { width: 100%; min-height: 100dvh; padding: 24px 18px; }
                    .login-glass-card { width: 100%; max-width: 440px; padding: 24px 20px; }
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
                                        <button
                                            type="button"
                                            className="preset-card jury-textile-preset"
                                            data-jury-guide-target="green-textile"
                                            onClick={() => handleQuickLogin('green-textile')}
                                        >
                                            <div className="jury-textile-mark"><Leaf size={15} /></div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--primary-midnight)' }}>Yeşil Tekstil A.Ş. (YESTK)</div>
                                                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '1px' }}>Sürdürülebilirlik Yöneticisi · Jüri demosu</div>
                                            </div>
                                            <ArrowRight size={12} color="var(--accent-emerald)" />
                                        </button>
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
                        <form onSubmit={handleManualLogin} className="jury-login-form" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            
                            {error && (
                                <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', fontSize: '11px', fontWeight: 600 }}>
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="form-label" style={{ fontWeight: 600, fontSize: '11px', marginBottom: '7px' }}>E-posta Adresi</label>
                                <div className="input-wrapper">
                                    <input 
                                        type="email" 
                                        className="custom-input" 
                                        placeholder={role === 'bank' ? 'banka@ecofin.com' : 'sirket@ecofin.com'} 
                                        value={email}
                                        data-jury-guide-target="email"
                                        readOnly={juryWizardActive}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <Mail className="input-icon" size={14} />
                                </div>
                            </div>

                            <div>
                                <label className="form-label" style={{ fontWeight: 600, fontSize: '11px', marginBottom: '7px' }}>Şifre</label>
                                <div className="input-wrapper">
                                    <input 
                                        type="password" 
                                        className="custom-input" 
                                        placeholder="••••••••" 
                                        value={password}
                                        data-jury-guide-target="password"
                                        readOnly={juryWizardActive}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <Lock className="input-icon" size={14} />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="btn-primary" 
                                data-jury-guide-target="submit"
                                disabled={juryLoginPending}
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
                                {juryLoginPending ? 'Giriş yapılıyor…' : <>Giriş Yap <ArrowRight size={12} style={{ marginLeft: '4px' }} /></>}
                            </button>
                        </form>

                    </div>
                </div>

            </div>
            <AnimatePresence>
                {juryWizardPreparing && <LoginGuideWaiting key="jury-login-waiting" />}
            </AnimatePresence>
            <AnimatePresence>
                {juryWizardActive && guideStep && guideTargetRect && (
                    <LoginGuideSpotlight
                    key="jury-login-guide"
                        target={guideTargetRect}
                        step={guideStep}
                        onClose={closeJuryWizard}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Login;
