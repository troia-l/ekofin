import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ApplicationForm = () => {
    const navigate = useNavigate();

    return (
        <div className="container animate-fade-in" style={{ padding: '40px 24px', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>

            {/* Left Column: Form */}
            <div className="clean-card" style={{ flex: '1 1 65%', padding: '40px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>Finansman Başvurusu</h1>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px' }}>
                    Lütfen işletme bilgilerinizi eksiksiz doldurun. YZ destekli sistemimiz g-ROI ön analizini saniyeler içinde tamamlayacaktır.
                </p>

                <form style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} onSubmit={(e) => { e.preventDefault(); alert("Başvurunuz başarıyla alındı. YZ g-ROI hesaplaması sonrası dinamik risk skorunuz oluşturulacaktır."); navigate("/credits"); }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label className="form-label">Şirket Ünvanı</label>
                            <input type="text" className="input-field" placeholder="Örn: EcoTech KOBİ Ltd. Şti." required />
                        </div>
                        <div>
                            <label className="form-label">Vergi Numarası</label>
                            <input type="text" className="input-field" placeholder="Vergi No / TC Kimlik No" required />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label className="form-label">Yetkili Kişi Adı Soyadı</label>
                            <input type="text" className="input-field" placeholder="Ad Soyad" required />
                        </div>
                        <div>
                            <label className="form-label">Cep Telefonu</label>
                            <input type="tel" className="input-field" placeholder="05XX XXX XX XX" required />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">E-Posta Adresi</label>
                        <input type="email" className="input-field" placeholder="sirket@ornek.com" required />
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
                        <button type="submit" className="btn btn-primary" style={{ padding: '14px 24px', flex: 2, background: '#FF7F00', color: '#fff', fontSize: '15px', border: 'none', borderRadius: '4px' }}>Başvuruyu Tamamla</button>
                    </div>
                </form>
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
