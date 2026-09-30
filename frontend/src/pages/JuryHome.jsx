import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ArrowDown, ArrowRight, BarChart3, Check, ChevronRight, FileText, Leaf, LockKeyhole, Play, ShieldCheck, Sparkles, X, Zap } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import './JuryHome.css';

const tourTargetSelector = '[data-jury-tour-target="entry"]';
const juryWizardFlag = 'ecofin-jury-login-wizard';
const juryHomeWizardSeen = 'ecofin-jury-home-wizard-seen';
const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const staggerIn = {
    hidden: {},
    show: { transition: { staggerChildren: 0.11, delayChildren: 0.08 } },
};

const TourSpotlight = ({ target, onClose, isLoggedIn }) => {
    if (!target) return null;

    const { top, left, right, bottom, width, height } = target;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tipWidth = Math.min(340, viewportWidth - 32);
    const tipLeft = Math.max(16, Math.min(right - tipWidth, viewportWidth - tipWidth - 16));
    const tipTop = bottom + 18 + 150 > viewportHeight ? Math.max(16, top - 164) : bottom + 18;
    const blockerStyle = { position: 'fixed', zIndex: 1000, background: 'rgba(5, 14, 26, 0.76)', backdropFilter: 'blur(2px)', pointerEvents: 'auto' };

    return (
        <motion.div
            className="jury-tour-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none' }}
        >
            <motion.div aria-hidden="true" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24 }} style={{ ...blockerStyle, top: 0, left: 0, right: 0, height: Math.max(0, top) }} />
            <motion.div aria-hidden="true" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24, delay: 0.02 }} style={{ ...blockerStyle, top: bottom, left: 0, right: 0, bottom: 0 }} />
            <motion.div aria-hidden="true" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24, delay: 0.03 }} style={{ ...blockerStyle, top, left: 0, width: Math.max(0, left), height }} />
            <motion.div aria-hidden="true" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24, delay: 0.04 }} style={{ ...blockerStyle, top, left: right, right: 0, height }} />

            <motion.div
                className="jury-tour-target-frame"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 360, damping: 24, delay: 0.1 }}
                style={{ top, left, width, height }}
                aria-hidden="true"
            />
            <motion.section
                className="jury-tour-card"
                role="dialog"
                aria-labelledby="jury-tour-title"
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 27, delay: 0.12 }}
                style={{ top: tipTop, left: tipLeft, width: tipWidth }}
            >
                <div className="jury-tour-card-topline">
                    <span className="jury-tour-step"><Sparkles size={13} /> Jüri turu · 1/1</span>
                    <button type="button" className="jury-tour-close" onClick={onClose} aria-label="Sihirbaz turunu kapat"><X size={17} /></button>
                </div>
                <h2 id="jury-tour-title">{isLoggedIn ? 'Demo paneline geçin' : 'Demo girişine geçin'}</h2>
                <p>
                    {isLoggedIn
                        ? 'Oturumunuz açık. Sağ üstteki Panel düğmesine basarak demo akışını başlatın.'
                        : 'Demo ortamına geçmek için sağ üstte vurgulanan Giriş Yap düğmesine basın. Bu ilk tur burada tamamlanıyor.'}
                </p>
                <div className="jury-tour-hint"><span className="jury-tour-hint-icon"><ArrowRight size={15} /></span> Sonraki adım: demo şirketi seçimi</div>
                <button type="button" className="jury-tour-dismiss" onClick={onClose}>Şimdilik kapat</button>
            </motion.section>
        </motion.div>
    );
};

const JuryHome = () => {
    const { currentUser } = useOutletContext() || {};
    const [tourOpen, setTourOpen] = useState(false);
    const [targetRect, setTargetRect] = useState(null);

    const updateTarget = useCallback(() => {
        const target = document.querySelector(tourTargetSelector);
        if (!target) {
            setTargetRect(null);
            return;
        }
        const rect = target.getBoundingClientRect();
        setTargetRect({ top: rect.top - 7, left: rect.left - 7, right: rect.right + 7, bottom: rect.bottom + 7, width: rect.width + 14, height: rect.height + 14 });
    }, []);

    const startTour = useCallback(() => {
        if (!currentUser) window.sessionStorage.setItem(juryWizardFlag, '1');
        updateTarget();
        setTourOpen(true);
    }, [currentUser, updateTarget]);

    const closeTour = useCallback(() => {
        window.sessionStorage.removeItem(juryWizardFlag);
        setTourOpen(false);
    }, []);

    useEffect(() => {
        if (window.sessionStorage.getItem(juryHomeWizardSeen) === '1') return undefined;
        const frame = window.requestAnimationFrame(() => {
            window.sessionStorage.setItem(juryHomeWizardSeen, '1');
            startTour();
        });
        return () => window.cancelAnimationFrame(frame);
    }, [startTour]);

    useEffect(() => {
        if (!tourOpen) return undefined;
        updateTarget();
        const dismissOnEscape = (event) => {
            if (event.key === 'Escape') closeTour();
        };
        window.addEventListener('resize', updateTarget);
        window.addEventListener('scroll', updateTarget, true);
        window.addEventListener('keydown', dismissOnEscape);
        const target = document.querySelector(tourTargetSelector);
        target?.focus({ preventScroll: true });
        return () => {
            window.removeEventListener('resize', updateTarget);
            window.removeEventListener('scroll', updateTarget, true);
            window.removeEventListener('keydown', dismissOnEscape);
        };
    }, [tourOpen, updateTarget, closeTour]);

    const valueCards = [
        { icon: <FileText size={20} />, eyebrow: '01 · VERİ', title: 'Belge ve beyanları bir araya getirin', text: 'Şirket belgeleri ve yönetici beyanları tek akışta toplanır; raporun dayanakları görünür kalır.' },
        { icon: <ShieldCheck size={20} />, eyebrow: '02 · ANALİZ', title: 'TSRS açıklamalarını inceleyin', text: 'Kaynak veriler sınıflandırılır, tutarlılık kontrolleriyle desteklenir ve rapor taslağına bağlanır.' },
        { icon: <BarChart3 size={20} />, eyebrow: '03 · FİNANSMAN', title: 'Etkiyi finansal karara taşıyın', text: 'g-ROI ve ESG göstergeleri, sürdürülebilirlik performansını finansman perspektifinde görünür kılar.' },
    ];

    return (
        <MotionConfig reducedMotion="user">
        <main className="jury-home">
            <motion.section className="jury-hero" initial="hidden" animate="show" variants={staggerIn}>
                <div className="jury-hero-glow jury-hero-glow-one" />
                <div className="jury-hero-glow jury-hero-glow-two" />
                <div className="jury-shell jury-hero-grid">
                    <motion.div className="jury-hero-copy" variants={staggerIn}>
                        <motion.div className="jury-eyebrow" variants={fadeUp}><span className="jury-live-dot" /> JÜRİ DEMO DENEYİMİ <span className="jury-eyebrow-divider" /> EcoFin Platformu</motion.div>
                        <motion.h1 variants={fadeUp}>Sürdürülebilirlik verisini <span>finansman kararına</span> dönüştürün.</motion.h1>
                        <motion.p className="jury-hero-description" variants={fadeUp}>EcoFin; şirket belgelerini, ESG göstergelerini ve finansman analizini ortak bir karar akışında buluşturur. Demo sihirbazını açın, sisteme giriş adımına birlikte ilerleyelim.</motion.p>
                        <motion.div className="jury-hero-actions" variants={fadeUp}>
                            <motion.button type="button" className="jury-primary-button" onClick={startTour} whileHover={{ y: -2, scale: 1.015 }} whileTap={{ scale: 0.98 }}>
                                <Play size={16} fill="currentColor" /> Sihirbazı Gör <ArrowRight size={17} />
                            </motion.button>
                            <motion.a className="jury-secondary-button" href="#demo-akisi" whileHover={{ x: 3 }}>Demo akışını incele <ArrowDown size={15} /></motion.a>
                        </motion.div>
                        <motion.div className="jury-trust-line" variants={fadeUp}><LockKeyhole size={14} /> Jüri sunumu için hazırlanmış demo ortamı <span>·</span> Şirket verileri örnek içeriklerden oluşur</motion.div>
                    </motion.div>

                    <motion.div className="jury-preview-wrap" aria-label="EcoFin platform önizlemesi" variants={fadeUp}>
                        <div className="jury-preview-orbit jury-orbit-one" />
                        <div className="jury-preview-orbit jury-orbit-two" />
                        <motion.div className="jury-preview-card" initial={{ opacity: 0, y: 22, rotateX: 5 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 0.75, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}>
                            <div className="jury-preview-head">
                                <div><span className="jury-preview-label">PLATFORM ÖNİZLEMESİ</span><h2>ESG Etki Paneli</h2></div>
                                <span className="jury-preview-icon"><Leaf size={18} /></span>
                            </div>
                            <div className="jury-score-block">
                                <div><span className="jury-score-caption">Sürdürülebilirlik görünümü</span><strong>ASELSAN <span>· Demo</span></strong></div>
                                <div className="jury-score-value">82<small>/100</small></div>
                            </div>
                            <div className="jury-score-track"><motion.span initial={{ width: 0 }} animate={{ width: '82%' }} transition={{ duration: 1.05, delay: 0.7, ease: 'easeOut' }} /></div>
                            <div className="jury-preview-stats">
                                <div><span>Belge durumu</span><strong><Check size={14} /> Doğrulandı</strong></div>
                                <div><span>Rapor akışı</span><strong><Sparkles size={14} /> TSRS analizi</strong></div>
                            </div>
                            <div className="jury-preview-report">
                                <div className="jury-report-icon"><FileText size={17} /></div>
                                <div><strong>TSRS sürdürülebilirlik raporu</strong><span>Kaynaklarla ilişkilendirilmiş demo çıktı</span></div>
                                <ChevronRight size={17} />
                            </div>
                            <div className="jury-preview-footer"><span><span className="jury-live-dot" /> DEMO AKIŞI</span><span>Veri → Analiz → Finansman</span></div>
                        </motion.div>
                        <motion.div className="jury-floating-chip jury-chip-top" animate={{ y: [0, -6, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}><span><ShieldCheck size={15} /></span> Kaynak izi</motion.div>
                        <motion.div className="jury-floating-chip jury-chip-bottom" animate={{ y: [0, 6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}><span><Zap size={15} /></span> g-ROI analizi</motion.div>
                    </motion.div>
                </div>
                <motion.div className="jury-shell jury-hero-bottom" variants={fadeUp}><span>DEMO YOLCULUĞU</span><div /><span>Giriş <ChevronRight size={13} /> Şirket paneli <ChevronRight size={13} /> Rapor ve analiz</span></motion.div>
            </motion.section>

            <section className="jury-value-section" id="demo-akisi">
                <div className="jury-shell">
                    <motion.div className="jury-section-heading" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.55 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
                        <div><span className="jury-section-kicker">SİSTEMİ KEŞFEDİN</span><h2>Tek akışta veriden karara</h2></div>
                        <p>Demo boyunca bir sürdürülebilirlik verisinin nasıl toplandığını, analiz edildiğini ve finansman kararına bağlandığını görün.</p>
                    </motion.div>
                    <div className="jury-value-grid">
                        {valueCards.map((card, index) => (
                            <motion.article className="jury-value-card" key={card.eyebrow} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.45, delay: index * 0.1, ease: 'easeOut' }} whileHover={{ y: -4, boxShadow: '0 16px 34px rgba(24, 43, 59, 0.09)' }}>
                                <div className="jury-value-icon">{card.icon}</div>
                                <span className="jury-card-eyebrow">{card.eyebrow}</span>
                                <h3>{card.title}</h3>
                                <p>{card.text}</p>
                                <div className="jury-card-rule" />
                            </motion.article>
                        ))}
                    </div>
                    <motion.div className="jury-next-step" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.45, delay: 0.12, ease: 'easeOut' }}>
                        <div className="jury-next-step-icon"><Sparkles size={19} /></div>
                        <div><strong>Hazır olduğunuzda demoyu başlatın</strong><span>Sihirbaz sizi önce sağ üstteki giriş alanına yönlendirir. Devamı giriş ekranında karşılar.</span></div>
                        <motion.button type="button" onClick={startTour} whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}>Sihirbazı başlat <ArrowRight size={16} /></motion.button>
                    </motion.div>
                </div>
            </section>

            <AnimatePresence>
                {tourOpen && targetRect && <TourSpotlight key="jury-tour-spotlight" target={targetRect} onClose={closeTour} isLoggedIn={Boolean(currentUser)} />}
            </AnimatePresence>
        </main>
        </MotionConfig>
    );
};

export default JuryHome;
