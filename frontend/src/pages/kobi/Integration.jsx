import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileSpreadsheet, CheckCircle2, FileBadge2, Check, RefreshCw, Link2, ShieldAlert } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Integration = () => {
  const [isHoveringDrop, setIsHoveringDrop] = useState(false);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex-col gap-6">
      <motion.div variants={itemVariants} className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="page-title">Veri Entegrasyon Merkezi</h1>
          <p className="page-subtitle">ERP sistemlerinizi, faturalarınızı ve yasal belgelerinizi 256-bit uçtan uca şifrelemeyle senkronize edin.</p>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2" 
          style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald-dark)', padding: '10px 16px', borderRadius: '12px', fontWeight: 600, fontSize: '13px', border: '1px solid rgba(16, 185, 129, 0.2)' }}
        >
          <ShieldAlert size={16} /> Banka Düzeyi Güvenlik Aktif
        </motion.div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
        
        {/* Left Column: Connections & Uploads */}
        <div className="flex-col gap-6">
          
          {/* Active Connections */}
          <motion.div variants={itemVariants} className="card glass-panel flex-col gap-4">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-midnight)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link2 size={18} color="var(--accent-emerald)" /> Canlı Sistem Bağlantıları (API)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              
              <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '12px', right: '12px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 8px var(--accent-emerald)' }} />
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#008FD3' }}>SAP</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>ERP Senkronize</div>
              </div>

              <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '12px', right: '12px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 8px var(--accent-emerald)' }} />
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#E42528' }}>LOGO</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Muhasebe Aktif</div>
              </div>

              <motion.div 
                whileHover={{ scale: 1.05 }}
                style={{ padding: '16px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', border: '1px dashed var(--text-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '8px' }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>+</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Yeni Bağlantı</div>
              </motion.div>

            </div>
          </motion.div>

          {/* Manual Upload */}
          <motion.div variants={itemVariants} className="card glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-midnight)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DatabaseIcon color="var(--primary-midnight)" /> e-Fatura & UBL Paketi Yükle
            </h3>
            
            <motion.div 
              onMouseEnter={() => setIsHoveringDrop(true)}
              onMouseLeave={() => setIsHoveringDrop(false)}
              animate={{ 
                borderColor: isHoveringDrop ? 'var(--accent-emerald)' : 'var(--border-color)',
                background: isHoveringDrop ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.4)'
              }}
              style={{ 
                border: '2px dashed', 
                borderRadius: '16px', 
                padding: '40px 20px', 
                textAlign: 'center', 
                marginBottom: '24px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              <motion.div animate={{ y: isHoveringDrop ? -5 : 0 }} transition={{ type: 'spring' }}>
                <UploadCloud size={48} color={isHoveringDrop ? 'var(--accent-emerald)' : 'var(--text-light)'} style={{ margin: '0 auto 16px auto', filter: isHoveringDrop ? 'drop-shadow(0 4px 10px rgba(16,185,129,0.4))' : 'none', transition: 'all 0.3s' }} />
              </motion.div>
              <h4 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--primary-midnight)' }}>UBL / XML Paketlerini Sürükleyin</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>veya bilgisayarınızdan seçmek için tıklayın.</p>
              <button className="btn-primary" style={{ padding: '10px 24px', pointerEvents: 'none' }}>Dosya Seç</button>
            </motion.div>

            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.5px' }}>SON YÜKLENEN PAKETLER</h4>
              
              <motion.div 
                whileHover={{ x: 5 }}
                className="flex-col gap-2" 
                style={{ 
                  padding: '16px', 
                  background: 'var(--bg-main)', 
                  borderRadius: '12px',
                  borderLeft: '4px solid var(--accent-emerald)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet size={18} color="var(--primary-midnight)" />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-midnight)' }}>2026_Q1_Maliyet.zip</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                    <Check size={14} /> İşlendi
                  </div>
                </div>
                <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '100%', background: 'var(--accent-emerald)' }}></div>
                </div>
              </motion.div>

            </div>
          </motion.div>

        </div>

        {/* Right Column: Legal Documents */}
        <div className="flex-col gap-6">
          <motion.div variants={itemVariants} className="card glass-panel" style={{ height: '100%' }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="icon-3d" style={{ background: 'linear-gradient(135deg, #F59E0B, #B45309)', width: '48px', height: '48px' }}>
                <FileBadge2 color="white" size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-midnight)' }}>Yasal Beyanlar</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>TSRS Denetim Dokümanları</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              {[
                { title: 'SGK Hizmet Dökümleri', desc: 'Personel sayısı doğrulaması için', status: 'upload', date: '-' },
                { title: 'Sanayi Sicil Belgesi', desc: 'Resmi kapasite ve NACE kod onayı', status: 'verified', date: 'Güncel' },
                { title: 'Kapasite Raporu (TOBB)', desc: 'Üretim limitleri doğrulaması', status: 'verified', date: '12 May 2026' },
                { title: 'Enerji Kimlik Belgesi (EKB)', desc: 'Tesis enerji verimlilik kanıtı', status: 'upload', date: '-' },
                { title: 'ISO 14001 Çevre YYS', desc: 'Çevre yönetim sistemi sertifikası', status: 'pending', date: 'İnceleniyor' }
              ].map((doc, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  className="flex justify-between items-center" 
                  style={{ 
                    padding: '16px 20px', 
                    background: doc.status === 'verified' ? 'rgba(16, 185, 129, 0.03)' : 'var(--bg-main)', 
                    borderRadius: '12px',
                    border: doc.status === 'verified' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-color)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.01)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-midnight)' }}>{doc.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{doc.desc}</div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {doc.status === 'verified' && (
                      <div className="flex items-center gap-1" style={{ color: 'var(--accent-emerald-dark)', fontWeight: 700, fontSize: '12px' }}>
                        <CheckCircle2 size={14} /> ONAYLI
                      </div>
                    )}
                    {doc.status === 'pending' && (
                      <div className="flex items-center gap-1" style={{ color: 'var(--warning)', fontWeight: 700, fontSize: '12px' }}>
                        <RefreshCw size={14} className="animate-spin" /> İNCELENİYOR
                      </div>
                    )}
                    {doc.status === 'upload' && (
                      <button className="btn-outline" style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '8px' }}>Yükle</button>
                    )}
                    
                    {doc.status !== 'upload' && (
                      <div style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 500 }}>{doc.date}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <p style={{ fontSize: '12px', color: '#1E40AF', lineHeight: '1.6', fontWeight: 500 }}>
                <strong>TSRS Uyarı:</strong> Yüklenen belgeler, bağımsız denetim sürecinde doğrudan "Yeşil Kredi Pasaportu"na kriptografik olarak (Hash) mühürlenecektir. 
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

// Local Icon for Database
const DatabaseIcon = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg>
);

export default Integration;
