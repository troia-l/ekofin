import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Building2, Landmark, ShieldCheck, ShieldAlert, RefreshCw,
  CheckCircle2, XCircle, Copy, Check, Leaf, TrendingUp, Wallet, Calendar
} from 'lucide-react';
import TsrsWarningBox from '../../components/TsrsWarningBox';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const statusStyle = (status) => {
  if (status === 'Onaylandı') return { bg: 'rgba(16,185,129,0.1)', color: 'var(--accent-emerald-dark)' };
  if (status === 'Reddedildi') return { bg: 'rgba(239,68,68,0.1)', color: '#DC2626' };
  return { bg: 'rgba(245,158,11,0.1)', color: '#D97706' };
};

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [esgCompany, setEsgCompany] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchApplication = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/credit-applications/${id}`);
      if (!res.ok) throw new Error('Başvuru bulunamadı.');
      const data = await res.json();
      setApp(data);

      if (data.ticker) {
        try {
          const compRes = await fetch(`${API_URL}/api/esg/companies`);
          if (compRes.ok) {
            const companies = await compRes.json();
            setEsgCompany(companies.find(c => c.ticker === data.ticker) || null);
          }
        } catch (e) { console.error('ESG verisi alınamadı:', e); }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplication(); }, [id]);

  const handleVerifyHash = async () => {
    if (!app?.reportHash) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const formData = new FormData();
      formData.append('hash_to_verify', app.reportHash);
      if (app.ticker) formData.append('ticker', app.ticker);
      const res = await fetch(`${API_URL}/api/report/verify`, { method: 'POST', body: formData });
      if (res.ok) setVerifyResult(await res.json());
      else setVerifyResult({ is_valid: false, error: true });
    } catch (e) {
      setVerifyResult({ is_valid: false, error: true });
    } finally {
      setVerifying(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`${API_URL}/api/credit-applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setApp(data.application);
      }
    } catch (e) {
      console.error('Durum güncellenemedi:', e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const copyHash = () => {
    if (!app?.reportHash) return;
    navigator.clipboard.writeText(app.reportHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={22} className="animate-spin" style={{ marginBottom: '10px' }} />
        <div>Başvuru yükleniyor...</div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <p style={{ color: '#EF4444', fontWeight: 600, marginBottom: '16px' }}>{error || 'Başvuru bulunamadı.'}</p>
        <button className="btn-outline" onClick={() => navigate('/bank/dashboard')}>← Başvurulara Dön</button>
      </div>
    );
  }

  const sStyle = statusStyle(app.status);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-col gap-6">
      <button
        onClick={() => navigate('/bank/dashboard')}
        className="btn-outline"
        style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <ArrowLeft size={15} /> Başvurulara Dön
      </button>

      {/* Başlık */}
      <div className="card glass-panel" style={{ padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="icon-3d" style={{ background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-emerald-dark))', width: '48px', height: '48px' }}>
            <Building2 color="white" size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-midnight)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {app.companyName}
              {app.ticker && <span style={{ fontSize: '11px', fontWeight: 700, color: '#3B82F6', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '8px' }}>{app.ticker}</span>}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Başvuru #{app.id} · {app.createdAt}</p>
          </div>
        </div>
        <span style={{ fontSize: '13px', fontWeight: 700, padding: '8px 16px', borderRadius: '20px', background: sStyle.bg, color: sStyle.color }}>
          {app.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* SOL: Kredi & Finansal Özet */}
        <div className="flex-col gap-6">
          <div className="card glass-panel">
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-midnight)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Landmark size={17} color="var(--accent-emerald)" /> Kredi Teklifi Özeti
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              <SummaryTile label="Banka" value={app.bankName} icon={Landmark} />
              <SummaryTile label="Kredi Tutarı" value={`${app.loanAmount.toLocaleString('tr-TR')} ₺`} icon={Wallet} />
              <SummaryTile label="Vade" value={`${app.loanYears} yıl`} icon={Calendar} />
              <SummaryTile label="Efektif Faiz" value={`%${app.bankRate.toFixed(2)} (taban %${app.baseRate.toFixed(2)} - %${app.discountPct.toFixed(2)} indirim)`} icon={TrendingUp} small />
              <SummaryTile label="Aylık Taksit" value={`${Math.round(app.monthlyPayment).toLocaleString('tr-TR')} ₺`} icon={Wallet} highlight />
              <SummaryTile label="Toplam Yeşil CAPEX" value={app.totalCapex ? `${app.totalCapex.toLocaleString('tr-TR')} ₺` : '—'} icon={Leaf} />
            </div>
          </div>

          <div className="card glass-panel">
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-midnight)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Leaf size={17} color="var(--accent-emerald)" /> Yeşil Kredi Değerlendirmesi
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '14px' }}>
              <div style={{ fontSize: '40px', fontWeight: 900, color: 'var(--accent-emerald-dark)', lineHeight: 1 }}>
                {app.greenCreditScore}<span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>/100</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-midnight)', flex: 1 }}>{app.decision}</div>
            </div>
            {esgCompany && (
              <div style={{ display: 'flex', gap: '12px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <SummaryTile label="Şirket ESG Skoru (BIST)" value={`${esgCompany.score.toFixed(1)} / 10`} icon={ShieldCheck} />
                <SummaryTile label="Sektör" value={esgCompany.sector} icon={Building2} small />
                <SummaryTile label="Risk Seviyesi" value={esgCompany.riskLevel} icon={ShieldAlert} />
              </div>
            )}
          </div>

          {/* Banka Aksiyonları */}
          {app.status === 'Beklemede' && (
            <div className="card glass-panel" style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleStatusChange('Reddedildi')}
                disabled={updatingStatus}
                className="btn-outline"
                style={{ flex: 1, justifyContent: 'center', borderColor: '#EF4444', color: '#EF4444' }}
              >
                <XCircle size={16} /> Reddet
              </button>
              <button
                onClick={() => handleStatusChange('Onaylandı')}
                disabled={updatingStatus}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <CheckCircle2 size={16} /> Onayla
              </button>
            </div>
          )}
        </div>

        {/* SAĞ: TSRS Hash Doğrulama + Uyarılar */}
        <div className="flex-col gap-6">
          <div className="card glass-panel">
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-midnight)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={17} color="var(--accent-emerald)" /> TSRS Rapor Doğrulaması
            </h3>

            {!app.reportHash ? (
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Bu başvuru anında şirketin üretilmiş bir TSRS raporu bulunmuyordu — hash mühürlenmedi.
              </div>
            ) : (
              <>
                <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', wordBreak: 'break-all', flex: 1 }}>
                    {app.reportHash}
                  </span>
                  <button onClick={copyHash} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                  </button>
                </div>

                <button
                  onClick={handleVerifyHash}
                  disabled={verifying}
                  className="btn-outline"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: verifyResult ? '12px' : 0 }}
                >
                  {verifying ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  {verifying ? 'Doğrulanıyor...' : 'Hash\'i Bağımsız Doğrula'}
                </button>

                {verifyResult && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px',
                    background: verifyResult.is_valid ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${verifyResult.is_valid ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  }}>
                    {verifyResult.is_valid ? <ShieldCheck size={18} color="#10B981" /> : <ShieldAlert size={18} color="#EF4444" />}
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: verifyResult.is_valid ? '#065F46' : '#991B1B' }}>
                        {verifyResult.is_valid ? 'Belge doğrulandı — değiştirilmemiştir' : 'Doğrulama başarısız'}
                      </div>
                      {verifyResult.verified_at && (
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{verifyResult.verified_at}</div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card glass-panel">
            <TsrsWarningBox />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SummaryTile = ({ label, value, icon: Icon, highlight, small }) => (
  <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
      {Icon && <Icon size={11} color="var(--text-muted)" />}
      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
    </div>
    <div style={{ fontSize: small ? '12px' : '14.5px', fontWeight: 800, color: highlight ? 'var(--accent-emerald-dark)' : 'var(--primary-midnight)' }}>
      {value}
    </div>
  </div>
);

export default ApplicationDetail;
