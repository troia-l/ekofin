import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Wallet, 
  CreditCard, Sparkles, Building2, Download, Printer, KeyRound, 
  Shield, RefreshCw, Leaf, Landmark, User, AlertTriangle, TrendingUp
} from 'lucide-react';

const ApplicationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const mode = state.mode || 'general'; // 'crowdfund' | 'credit' | 'general'
  const project = state.project || null;
  const credit = state.credit || null;

  // Crowdfund Investment Flow States
  const [step, setStep] = useState(1);
  const [investmentAmount, setInvestmentAmount] = useState(project?.minInvestment || 5000);
  const [selectedAccount, setSelectedAccount] = useState('vadesiz');
  const [smsCode, setSmsCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [txHash, setTxHash] = useState('');

  // Loan Application States
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [taxNo, setTaxNo] = useState('');
  const [authName, setAuthName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [useEsgScoring, setUseEsgScoring] = useState(true);

  // Projections for Crowdfunding
  const expectedReturn = project ? project.expectedReturn : 50;
  const yieldAmount = (investmentAmount * expectedReturn) / 100;
  const co2Offset = investmentAmount * 0.0015; // 1.5 kg CO2 per TL invested
  const equivalentTrees = Math.round(co2Offset * 40); // 40 trees per ton equivalent

  useEffect(() => {
    // Generate a mock tx hash when reaching the success step
    if (step === 3) {
      const hash = '0x' + Array.from({ length: 40 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      setTxHash(hash);
    }
  }, [step]);

  const handleSmsSubmit = (e) => {
    e.preventDefault();
    if (smsCode === '1923') {
      setIsVerifying(true);
      setOtpError('');
      setTimeout(() => {
        setIsVerifying(false);
        setStep(3);
      }, 1500);
    } else {
      setOtpError('Hatalı SMS kodu! Lütfen test için "1923" yazın.');
    }
  };

  const handleLoanSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(val) + ' TL';
  };

  // ────────────────────────────────────────────────────────────────────────
  // 1. KİTLE FONLAMASI YATIRIM AKIŞI (CROWDFUNDING FLOW)
  // ────────────────────────────────────────────────────────────────────────
  if (mode === 'crowdfund' && project) {
    return (
      <div className="container animate-fade-in" style={{ padding: '40px 24px', maxWidth: '1000px' }}>
        
        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', background: '#FFFFFF', padding: '16px 28px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ 
              width: '28px', height: '28px', borderRadius: '50%', 
              background: step >= 1 ? 'var(--primary)' : 'var(--border-color)', 
              color: '#FFF', display: 'flex', justifyContent: 'center', alignItems: 'center', 
              fontSize: '13px', fontWeight: 700 
            }}>1</span>
            <span style={{ fontSize: '14px', fontWeight: step === 1 ? 800 : 500, color: step === 1 ? 'var(--text-main)' : 'var(--text-muted)' }}>Miktar ve Etki</span>
          </div>
          <div style={{ width: '40px', height: '1px', background: 'var(--border-color)' }} />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ 
              width: '28px', height: '28px', borderRadius: '50%', 
              background: step >= 2 ? 'var(--primary)' : 'var(--border-color)', 
              color: '#FFF', display: 'flex', justifyContent: 'center', alignItems: 'center', 
              fontSize: '13px', fontWeight: 700 
            }}>2</span>
            <span style={{ fontSize: '14px', fontWeight: step === 2 ? 800 : 500, color: step === 2 ? 'var(--text-main)' : 'var(--text-muted)' }}>Güvenli Onay (OTP)</span>
          </div>
          <div style={{ width: '40px', height: '1px', background: 'var(--border-color)' }} />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ 
              width: '28px', height: '28px', borderRadius: '50%', 
              background: step >= 3 ? 'var(--accent-green)' : 'var(--border-color)', 
              color: '#FFF', display: 'flex', justifyContent: 'center', alignItems: 'center', 
              fontSize: '13px', fontWeight: 700 
            }}>3</span>
            <span style={{ fontSize: '14px', fontWeight: step === 3 ? 800 : 500, color: step === 3 ? 'var(--text-main)' : 'var(--text-muted)' }}>Yeşil Makbuz</span>
          </div>
        </div>

        {/* STEP 1: AMOUNT AND PROJECTIONS */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '32px', alignItems: 'start' }}>
            
            <div className="clean-card" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>Yatırım Tutarı ve Finansman Kaynağı</h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                {project.companyName} tarafından yönetilen <strong>{project.title}</strong> projesine yapacağınız yatırımı yapılandırın.
              </p>

              <div style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Yatırım Tutarı (TL)</span>
                  <span style={{ color: 'var(--primary)' }}>Min. {formatCurrency(project.minInvestment)}</span>
                </label>
                <input 
                  type="number" 
                  className="input-field" 
                  min={project.minInvestment} 
                  value={investmentAmount} 
                  onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                  style={{ fontSize: '20px', fontWeight: 800, padding: '16px' }}
                />
                
                {/* Fast select options */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  {[5000, 10000, 50000, 100000].map((val) => (
                    <button 
                      key={val} 
                      type="button" 
                      onClick={() => setInvestmentAmount(val)}
                      className="btn-outline" 
                      style={{ 
                        padding: '8px 16px', fontSize: '13px', borderRadius: '20px',
                        borderColor: investmentAmount === val ? 'var(--primary)' : 'var(--border-color)',
                        background: investmentAmount === val ? 'rgba(255, 127, 0, 0.05)' : 'none',
                        color: investmentAmount === val ? 'var(--primary)' : 'var(--text-main)'
                      }}
                    >
                      {formatCurrency(val)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Ödeme Yapılacak Banka Hesabı</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', 
                    borderRadius: '8px', border: '1px solid ' + (selectedAccount === 'vadesiz' ? 'var(--primary)' : 'var(--border-color)'),
                    background: selectedAccount === 'vadesiz' ? 'rgba(255, 127, 0, 0.02)' : 'none',
                    cursor: 'pointer' 
                  }}>
                    <input 
                      type="radio" 
                      name="account" 
                      checked={selectedAccount === 'vadesiz'} 
                      onChange={() => setSelectedAccount('vadesiz')} 
                      style={{ cursor: 'pointer', width: '18px', height: '18px', margin: 0, flexShrink: 0 }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Wallet size={20} color="var(--primary)" />
                      <div>
                        <span style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>Vadesiz Mevduat Hesabı</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>TR29 0006 2000 4001 0288 3409 — Bakiye: 254.800 TL</span>
                      </div>
                    </div>
                  </label>

                  <label style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', 
                    borderRadius: '8px', border: '1px solid ' + (selectedAccount === 'yesil' ? 'var(--primary)' : 'var(--border-color)'),
                    background: selectedAccount === 'yesil' ? 'rgba(255, 127, 0, 0.02)' : 'none',
                    cursor: 'pointer' 
                  }}>
                    <input 
                      type="radio" 
                      name="account" 
                      checked={selectedAccount === 'yesil'} 
                      onChange={() => setSelectedAccount('yesil')} 
                      style={{ cursor: 'pointer', width: '18px', height: '18px', margin: 0, flexShrink: 0 }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Leaf size={20} color="var(--accent-green)" />
                      <div>
                        <span style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>EcoFin Yeşil Fon Yatırım Hesabı</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>TR45 0001 1000 9092 0188 9012 — Bakiye: 85.000 TL</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button type="button" onClick={() => navigate(-1)} className="btn btn-outline" style={{ flex: 1, padding: '14px' }}>İptal Et</button>
                <button 
                  type="button" 
                  onClick={() => setStep(2)} 
                  disabled={investmentAmount < project.minInvestment}
                  className="btn btn-primary" 
                  style={{ flex: 2, padding: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  Devam Et <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Projections Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="clean-card" style={{ padding: '28px', background: 'linear-gradient(135deg, var(--primary) 0%, #1E293B 100%)', color: '#FFF', border: 'none' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '1px' }}>YATIRIM ETKİ PROJEKSİYONU</span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', marginBottom: '24px' }}>EcoFin Yeşil Getiri Hesabı</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <TrendingUp size={20} color="var(--accent-green)" />
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Yıllık Tahmini Getiri</span>
                      <strong style={{ fontSize: '18px', fontWeight: 800 }}>+{formatCurrency(yieldAmount)} (%{expectedReturn})</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Leaf size={20} color="var(--accent-green)" />
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Engellenen Karbon Salınımı</span>
                      <strong style={{ fontSize: '18px', fontWeight: 800 }}>{co2Offset.toFixed(2)} Ton CO₂ / yıl</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Sparkles size={20} color="#FF7F00" />
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Eşdeğer Ağaç Katkısı</span>
                      <strong style={{ fontSize: '18px', fontWeight: 800 }}>{equivalentTrees} Ağaç Dikimine Denk</strong>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '12.5px', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} color="var(--accent-green)" />
                  EcoFin Blokzincir & I-REC Lisanslı Doğrulama
                </div>
              </div>

              <div className="clean-card" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Landmark size={16} color="var(--primary)" /> Banka Şeffaflık Taahhüdü
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  Yatırım yaptığınız fonlar doğrudan projeyi yürüten KOBİ'nin yeşil CAPEX hesabına aktarılır. IoT sensör takip sistemlerimiz sayesinde yatırımınızın yarattığı reel elektrik üretimi ve CO2 azaltımı mobil uygulamanız üzerinden canlı izlenebilir.
                </p>
              </div>
            </div>

          </motion.div>
        )}

        {/* STEP 2: SMS SECURE OTP VERIFICATION */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '520px', margin: '40px auto', padding: '36px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)' }} className="clean-card">
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,127,0,0.1)', color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px auto' }}>
                <KeyRound size={32} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>Güvenli Yatırım Doğrulaması</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Mevduat hesabınızdan <strong>{formatCurrency(investmentAmount)}</strong> tutarında transfer gerçekleştirilecektir. Lütfen telefonunuza gönderilen tek kullanımlık şifreyi girin.
              </p>
            </div>

            <form onSubmit={handleSmsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="form-label" style={{ textAlign: 'center', display: 'block', fontWeight: 700 }}>Tek Kullanımlık Şifre (OTP)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="SMS Onay Kodu (Test için '1923' yazın)" 
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                  style={{ letterSpacing: smsCode ? '8px' : 'normal', fontSize: smsCode ? '22px' : '15px', fontWeight: 800, textAlign: 'center' }}
                  required
                />
                
                {otpError && (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--danger)', fontSize: '12.5px', marginTop: '8px', justifyContent: 'center' }}>
                    <AlertCircle size={14} />
                    <span>{otpError}</span>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isVerifying}
                className="btn btn-primary" 
                style={{ width: '100%', padding: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                {isVerifying ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Doğrulanıyor...
                  </>
                ) : (
                  <>
                    <Shield size={18} />
                    Yatırımı Onayla
                  </>
                )}
              </button>
              
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="btn btn-outline" 
                style={{ width: '100%', border: 'none', background: 'none', textDecoration: 'underline' }}
              >
                Geri Dön
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 3: SUCCESS GREEN RECEIPT */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: '680px', margin: '40px auto', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)' }} className="clean-card">
            
            {/* Success Header */}
            <div style={{ textAlign: 'center', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', color: 'var(--accent-green)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px auto' }}>
                <CheckCircle2 size={32} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>Yatırımınız Başarıyla Kaydedildi</h2>
              <span style={{ fontSize: '13px', color: 'var(--accent-green)', fontWeight: 700 }}>ECOFIN YEŞİL PORTFÖY SERTİFİKASI AKTİF</span>
            </div>

            {/* Receipt Box */}
            <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>YATIRIMCI</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>EcoFin Bireysel Müşterisi</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>PROJE DETAYI</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>{project.title}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>YATIRILAN TUTAR</span>
                  <strong style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(investmentAmount)}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>BEKLENEN YILLIK GETİRİ</span>
                  <strong style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>%{expectedReturn}</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>KARBON OFFSET HEDEFİ</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-green)' }}>{co2Offset.toFixed(2)} Ton CO₂ / Yıl</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>DÖNGÜSEL EKONOMİ KATKISI</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>{equivalentTrees} Ağaç Eşdeğeri</span>
                </div>
              </div>

              <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>BLOKZİNCİR TRANSACTON HASH (ETKİ KANITI)</span>
                <code style={{ fontSize: '11.5px', color: 'var(--text-main)', wordBreak: 'break-all', fontFamily: 'monospace' }}>{txHash}</code>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
              <button type="button" onClick={() => window.print()} className="btn btn-outline" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <Printer size={16} /> Yazdır
              </button>
              <button type="button" onClick={() => navigate('/crowdfunding')} className="btn btn-primary" style={{ flex: 2 }}>
                Pazar Yerine Dön
              </button>
            </div>
            
          </motion.div>
        )}

      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // 2. BANKA YEŞİL KREDİ BAŞVURU AKIŞI (BANK GREEN LOAN FLOW)
  // ────────────────────────────────────────────────────────────────────────
  if (mode === 'credit' && credit) {
    return (
      <div className="container animate-fade-in" style={{ padding: '40px 24px', maxWidth: '900px' }}>
        
        {!isSubmitted ? (
          <div className="clean-card" style={{ padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '32px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>ECOFIN KREDİ PORTALI</span>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>{credit.name} - Yeşil Finansman Başvurusu</h1>
              </div>
              {credit.bankLogoUrl && (
                <img src={credit.bankLogoUrl} alt={credit.name} style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
              )}
            </div>

            <form style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} onSubmit={handleLoanSubmit}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="flex-col">
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Seçilen Paket Türü</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>{credit.type}</span>
                </div>
                <div className="flex-col">
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Faiz Avantajı / Hacim</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-green)' }}>{credit.rate} — {credit.total}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label className="form-label">KOBİ Şirket Resmi Ünvanı</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Örn: EkoTech Enerji Sanayi Ltd. Şti." 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required 
                  />
                </div>
                <div>
                  <label className="form-label">Vergi Dairesi & Numarası</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Vergi No / TC Kimlik No" 
                    value={taxNo}
                    onChange={(e) => setTaxNo(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label className="form-label">Şirket Temsilcisi Ad Soyad</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Yetkili Adı Soyadı" 
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    required 
                  />
                </div>
                <div>
                  <label className="form-label">İrtibat Cep Telefonu</label>
                  <input 
                    type="tel" 
                    className="input-field" 
                    placeholder="05XX XXX XX XX" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Resmi E-Posta Adresi</label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="sirket@ornek.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>

              <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={useEsgScoring}
                    onChange={() => setUseEsgScoring(!useEsgScoring)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="var(--primary)" />
                    Dinamik g-ROI ve TSRS Entegrasyonu Yapılsın
                  </span>
                </label>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, paddingLeft: '24px', lineHeight: '1.5' }}>
                  Bunu seçtiğinizde, platformumuzda taranmış olan OCR mizanlarınız, SGK listeleriniz ve enerji kimlik belgeleriniz bankanın kredi tahsis birimine otomatik olarak güvenli kanaldan iletilir. Bu sayede dosya masraflarında indirim ve faiz oranı indirimi hak edersiniz.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button type="button" onClick={() => navigate(-1)} className="btn btn-outline" style={{ flex: 1, padding: '14px' }}>Geri Dön</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '14px', background: 'var(--primary)', border: 'none', color: '#FFF' }}>
                  Yeşil Başvuruyu Gönder
                </button>
              </div>
            </form>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="clean-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', color: 'var(--accent-green)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px auto' }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>Kredi Ön Başvurunuz İletildi</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '32px' }}>
              Sayın <strong>{authName}</strong>, <strong>{companyName}</strong> adına yaptığınız yeşil finansman talebi başarıyla {credit.name} tahsis birimine iletilmiştir. g-ROI ve ESG veri paketiniz güvenli API vasıtasıyla paylaşıldı. Banka danışmanınız 2 saat içerisinde sizinle iletişime geçecektir.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => navigate('/credits')} className="btn btn-primary" style={{ padding: '12px' }}>Kredi Listesine Dön</button>
              <button onClick={() => navigate('/dashboard')} className="btn btn-outline" style={{ border: 'none', background: 'none', textDecoration: 'underline' }}>KOBİ Paneline Git</button>
            </div>
          </motion.div>
        )}

      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // 3. GENEL BAŞVURU FORMU (GENERAL APPLICATION FORM FALLBACK)
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="container animate-fade-in" style={{ padding: '40px 24px', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>

      {/* Left Column: Form */}
      <div className="clean-card" style={{ flex: '1 1 65%', padding: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>Finansman Başvurusu</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px' }}>
          Lütfen işletme bilgilerinizi eksiksiz doldurun. YZ destekli sistemimiz g-ROI ön analizini saniyeler içinde tamamlayacaktır.
        </p>

        {!isSubmitted ? (
          <form style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} onSubmit={handleLoanSubmit}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label className="form-label">Şirket Ünvanı</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Örn: EcoTech KOBİ Ltd. Şti." 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required 
                />
              </div>
              <div>
                <label className="form-label">Vergi Numarası</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Vergi No / TC Kimlik No" 
                  value={taxNo}
                  onChange={(e) => setTaxNo(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label className="form-label">Yetkili Kişi Adı Soyadı</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ad Soyad" 
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  required 
                />
              </div>
              <div>
                <label className="form-label">Cep Telefonu</label>
                <input 
                  type="tel" 
                  className="input-field" 
                  placeholder="05XX XXX XX XX" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div>
              <label className="form-label">E-Posta Adresi</label>
              <input 
                type="email" 
                className="input-field" 
                placeholder="sirket@ornek.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div>
              <label className="form-label">Finansman Amacı</label>
              <div style={{ position: 'relative' }}>
                <select className="input-field" required style={{ appearance: 'none' }}>
                  <option value="">Seçiniz</option>
                  <option value="ges">Çatı/Arazi Güneş Enerji Santrali (GES)</option>
                  <option value="res">Rüzgar Enerji Santrali (RES)</option>
                  <option value="verimlilik">Enerji Verimliliği Yatırımı</option>
                  <option value="arac">Elektrikli Araç Filosu</option>
                </select>
              </div>
            </div>

            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <input type="checkbox" style={{ marginTop: '3px', cursor: 'pointer' }} required />
                <span style={{ lineHeight: '1.5' }}>
                  EcoFin Kullanıcı Sözleşmesi'ni ve KVKK Aydınlatma Metni'ni okuduğumu, verilerimin yapay zeka tarafından Dinamik ESG ve g-ROI analizi süreçlerinde kullanılmasına açık rıza verdiğimi kabul ediyorum.
                </span>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <button type="button" onClick={() => navigate(-1)} className="btn btn-outline" style={{ padding: '14px 24px', flex: 1, color: 'var(--text-muted)', borderColor: 'var(--border-color)', fontSize: '15px' }}>Geri Dön</button>
              <button type="submit" className="btn btn-primary" style={{ padding: '14px 24px', flex: 2, background: 'var(--primary)', color: '#fff', fontSize: '15px', border: 'none', borderRadius: '4px' }}>Başvuruyu Tamamla</button>
            </div>
          </form>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', color: 'var(--accent-green)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px auto' }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>Başvurunuz Alındı</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '32px' }}>
              Finansman talebiniz başarıyla kaydedilmiştir. Yapay zeka motorumuz g-ROI analizleri ve doküman eşlemelerini inceleyerek ön onay raporunu oluşturacaktır. Sonuçlar e-posta adresinize gönderilecektir.
            </p>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ padding: '12px 24px' }}>KOBİ Paneline Git</button>
          </motion.div>
        )}
      </div>

      {/* Right Column: Info */}
      <div style={{ flex: '1 1 35%', display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '100px' }}>
        <div className="clean-card" style={{ padding: '24px', background: 'var(--primary)', color: '#FFFFFF', border: 'none' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="#10B981" />
            YZ ile Güvenli Başvuru
          </h3>
          <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.9 }}>
            Başvurunuz, g-ROI finansal matematik modeliyle entegre yapay zekamız tarafından anında analiz edilir. Mikro ve KOBİ ölçekli verileriniz uçtan uca şifrelenerek korunur.
          </p>
        </div>

        <div className="clean-card" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)' }}>Neden EcoFin?</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ display: 'flex', gap: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span>Saniyeler içinde ön onay</span>
            </li>
            <li style={{ display: 'flex', gap: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span>Size özel atanmış çevre & finans mühendisi</span>
            </li>
            <li style={{ display: 'flex', gap: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span>Şubeye gitmeden %100 dijital yeşil dönüşüm</span>
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
};

export default ApplicationForm;
