import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Car, Leaf, ClipboardCheck, ArrowRight, ArrowLeft, 
  Plus, Minus, Info, Zap, Droplet, ShieldCheck, Check, 
  HelpCircle, Sparkles, FileText, Download, RotateCcw, AlertTriangle
} from 'lucide-react';
import { NEW_DECLARATION_DATA, normalizeDeclarationData } from '../utils/declaration';

const ManagerDeclarationDashboard = ({ onBack, onSubmit, initialData, initialMode = 'wizard' }) => {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState(initialMode); // 'wizard' or 'ai_generator'
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedPolicy, setAiGeneratedPolicy] = useState('');
  
  const [formData, setFormData] = useState(() => initialData
    ? normalizeDeclarationData(initialData)
    : normalizeDeclarationData(NEW_DECLARATION_DATA));

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateVehicleCount = (type, delta) => {
    setFormData(prev => {
      const current = prev.vehiclesCount[type] || 0;
      const newValue = Math.max(0, current + delta);
      return {
        ...prev,
        vehiclesCount: {
          ...prev.vehiclesCount,
          [type]: newValue
        }
      };
    });
  };

  const getTotalVehicles = () => {
    return Object.values(formData.vehiclesCount).reduce((a, b) => a + b, 0);
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    if (!formData.confirmed && step === 4) {
      alert("Lütfen bilgilerin doğruluğunu onaylayın.");
      return;
    }
    onSubmit(formData);
  };

  // Trigger AI Policy Generation
  const generateAiPolicy = () => {
    setAiGenerating(true);
    setTimeout(() => {
      const totalVehicles = getTotalVehicles();
      const { electric, hybrid, diesel, gasoline } = formData.vehiclesCount;
      const policyText = `ECOFIN SÜRDÜRÜLEBİLİRLİK YÖNETİM SİSTEMİ (ÇYS)
ÇEVRE YÖNETİM POLİTİKASI VE ISO 14001 TAAHHÜTNAMESİ

Belge No: EF-ÇYS-2026-${Math.floor(100000 + Math.random() * 900000)}
Geçerlilik Tarihi: Haziran 2026 - Haziran 2027
Uyum Seviyesi: ISO 14001:2015 ÇYS Standartları ile Uyumlu Taslak

1. GİRİŞ VE AMAÇ
${formData.employeeCount} aktif SGK çalışanına sahip işletmemiz, tüm idari ve operasyonel faaliyetlerinde çevresel etkileri en aza indirmeyi ve sürdürülebilirlik ilkelerini kurumsal kültürünün bir parçası haline getirmeyi taahhüt eder.

2. MOBİLİTE VE EMİSYON YÖNETİMİ (Scope 1)
Envanterimizde bulunan toplam ${totalVehicles} adet taşıtın yakıt türü dağılımı:
- Elektrikli Taşıt: ${electric} adet (%${totalVehicles ? Math.round((electric/totalVehicles)*100) : 0})
- Hibrit Taşıt: ${hybrid} adet (%${totalVehicles ? Math.round((hybrid/totalVehicles)*100) : 0})
- Benzinli Taşıt: ${gasoline} adet (%${totalVehicles ? Math.round((gasoline/totalVehicles)*100) : 0})
- Dizel Taşıt: ${diesel} adet (%${totalVehicles ? Math.round((diesel/totalVehicles)*100) : 0})

Fosil yakıtlı araçlarımızın payını azaltarak elektrikli ve hibrit araç geçişimizi hızlandırmayı, böylece doğrudan Scope 1 emisyonlarımızı yıllık bazda en az %15 oranında düşürmeyi taahhüt ediyoruz.

3. ENERJİ VE DOĞAL KAYNAK TÜKETİMİ (Scope 2 & 3)
- Yıllık tahmini elektrik tüketimi: ${formData.annualElectricity.toLocaleString()} kWh
- Yıllık tahmini su tüketimi: ${formData.annualWater} m³

Kaynak verimliliğini sağlamak adına tesislerimizde enerji tasarruflu aydınlatma ve su armatürleri kullanımı yaygınlaştırılacaktır. ${formData.hasRenewableEnergy ? 'Mevcut çatı GES (Güneş Enerjisi) kapasitemizi optimize ederek' : 'Yenilenebilir enerji yatırımlarını (GES vb.) değerlendirerek'} elektrik tüketimimizin yeşil enerji payını artıracağız.

4. ATIK YÖNETİMİ VE SIFIR ATIK
Sıfır atık yönetimimiz "${formData.zeroWasteLevel === 'none' ? 'Geliştirilecek' : formData.zeroWasteLevel === 'basic' ? 'Temel Seviye' : 'Nitelikli/İleri Seviye'}" statüsündedir. Kağıt, plastik ve elektronik atıkların geri dönüşümü için lisanslı kuruluşlarla iş birliği sürdürülecek ve atıkların kaynağında ayrıştırılması teşvik edilecektir.

5. SOSYAL UYUM TAAHHÜTLERİ
Haftalık ortalama ${formData.weeklyWorkHours} saatlik çalışma düzeninde, çalışan refahını gözeterek yıllık ekstra ${formData.extraExcuseLeave} gün mazeret izni hakkını koruyacak, ${formData.remoteWork === 'yes' ? 'tam uzaktan' : formData.remoteWork === 'partial' ? 'hibrit' : 'esnek çalışma saatleri'} gibi sosyal imkanlarla iş-yaşam dengesini destekleyeceğiz.

Yönetici Adı: [Yönetim Kurulu Yetkilisi]
EcoFin Sürdürülebilirlik Modülü Yapay Zeka Onaylı Taslağı`;

      setAiGeneratedPolicy(policyText);
      setAiGenerating(false);
    }, 2000);
  };

  useEffect(() => {
    if (mode === 'ai_generator' && !aiGeneratedPolicy) {
      generateAiPolicy();
    }
  }, [mode]);

  const handleAcceptAiPolicy = () => {
    const updatedData = {
      ...formData,
      hasEmsPolicy: 'yes', // Auto activate ÇYS
      confirmed: true
    };
    setFormData(updatedData);
    onSubmit(updatedData);
  };

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, name: 'Kurumsal & Çalışanlar', icon: Users },
      { num: 2, name: 'Mobilite & Taşıtlar', icon: Car },
      { num: 3, name: 'ÇYS & Tüketim', icon: Leaf },
      { num: 4, name: 'Özet & Onay', icon: ClipboardCheck }
    ];

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', position: 'relative' }}>
        {/* Background Line */}
        <div style={{ position: 'absolute', top: '20px', left: '40px', right: '40px', height: '2px', background: 'var(--border-color)', zIndex: 1 }} />
        
        {/* Active Line Progress */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '40px',
          width: `${((step - 1) / 3) * 85}%`,
          height: '2px',
          background: 'var(--accent-emerald)',
          zIndex: 1,
          transition: 'width 0.3s ease'
        }} />

        {steps.map(s => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isCompleted = step > s.num;

          return (
            <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: isCompleted ? 'var(--accent-emerald)' : isActive ? 'var(--primary-midnight)' : '#FFFFFF',
                border: `2px solid ${isActive || isCompleted ? 'transparent' : 'var(--border-color)'}`,
                color: isCompleted || isActive ? '#FFFFFF' : 'var(--text-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px',
                boxShadow: isActive ? '0 0 0 4px rgba(16, 185, 129, 0.2)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {isCompleted ? <Check size={18} /> : <Icon size={18} />}
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--primary-midnight)' : 'var(--text-muted)',
                marginTop: '8px',
                textAlign: 'center',
                maxWidth: '120px'
              }}>
                {s.name}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-col gap-6" style={{ minHeight: '80vh', padding: '16px 0' }}>
      
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="btn-outline" 
            style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> Geri Dön
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '24px', margin: 0 }}>
              Yönetici Beyanı Yönetim Paneli
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
              Şirket ÇYS Politikası, Çalışan ve Emisyon Beyanı Yönetim Merkezi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'wizard' ? (
            <button 
              onClick={() => setMode('ai_generator')} 
              className="btn-outline"
              style={{ color: 'var(--accent-emerald-dark)', borderColor: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.05)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Sparkles size={16} color="var(--accent-emerald)" /> YZ ÇYS Sihirbazı
            </button>
          ) : (
            <button 
              onClick={() => setMode('wizard')} 
              className="btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Form Girdilerine Dön
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Layout (70% Form / 30% Help Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        
        {/* Left Area: Wizard or Generator */}
        <div className="flex-col gap-6">
          <AnimatePresence mode="wait">
            {mode === 'wizard' ? (
              <motion.div 
                key="wizard-panel"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="card glass-panel"
                style={{ padding: '32px' }}
              >
                {renderStepIndicator()}

                <form onSubmit={handleFormSubmit}>
                  {/* Step 1: Kurumsal */}
                  {step === 1 && (
                    <motion.div key="w-step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-col gap-6">
                      <div style={{ background: 'rgba(59, 130, 246, 0.04)', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <Info size={20} color="#3B82F6" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '13px', color: '#1E3A8A', lineHeight: '1.5', fontWeight: 500 }}>
                          Şirketinizin insan kaynakları yapısını tanımlayınız. Esnek çalışma imkanları ve mazeret izni gibi detaylar, sürdürülebilirlik endeksinin Sosyal (S) kriterlerini oluşturur.
                        </p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div className="flex-col gap-2">
                          <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary-midnight)' }}>Toplam Çalışan Sayısı (SGK Aktif)</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button type="button" onClick={() => updateField('employeeCount', Math.max(1, formData.employeeCount - 5))} style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border-color)', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-midnight)', fontWeight: 'bold' }}>-5</button>
                            <input 
                              type="number" 
                              value={formData.employeeCount} 
                              onChange={(e) => updateField('employeeCount', Math.max(1, parseInt(e.target.value) || 0))}
                              className="input-field" 
                              style={{ textAlign: 'center', fontWeight: 700, fontSize: '16px', borderRadius: '12px', height: '40px' }} 
                            />
                            <button type="button" onClick={() => updateField('employeeCount', formData.employeeCount + 5)} style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border-color)', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-midnight)', fontWeight: 'bold' }}>+5</button>
                          </div>
                        </div>

                        <div className="flex-col gap-2">
                          <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary-midnight)' }}>Haftalık Ortalama Çalışma Süresi (Saat)</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button type="button" onClick={() => updateField('weeklyWorkHours', Math.max(20, formData.weeklyWorkHours - 1))} style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border-color)', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-midnight)' }}><Minus size={16} /></button>
                            <input 
                              type="number" 
                              value={formData.weeklyWorkHours} 
                              onChange={(e) => updateField('weeklyWorkHours', Math.max(1, parseInt(e.target.value) || 0))}
                              className="input-field" 
                              style={{ textAlign: 'center', fontWeight: 700, fontSize: '16px', borderRadius: '12px', height: '40px' }} 
                            />
                            <button type="button" onClick={() => updateField('weeklyWorkHours', Math.min(60, formData.weeklyWorkHours + 1))} style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border-color)', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-midnight)' }}><Plus size={16} /></button>
                          </div>
                        </div>
                      </div>

                      <div className="flex-col gap-2">
                        <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary-midnight)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Yıllık Ekstra Mazeret İzni Hakkı</span>
                          <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{formData.extraExcuseLeave} Gün</span>
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <input 
                            type="range" 
                            min="0" 
                            max="30" 
                            value={formData.extraExcuseLeave} 
                            onChange={(e) => updateField('extraExcuseLeave', parseInt(e.target.value))}
                            style={{ flex: 1, accentColor: 'var(--accent-emerald)', height: '6px', borderRadius: '3px', cursor: 'pointer' }}
                          />
                          <span style={{ minWidth: '40px', textAlign: 'right', fontWeight: 700, fontSize: '14px' }}>
                            {formData.extraExcuseLeave} gün
                          </span>
                        </div>
                      </div>

                      <div className="flex-col gap-2">
                        <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary-midnight)' }}>Uzaktan / Esnek Çalışma Modeli Uygulaması</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                          {[
                            { key: 'yes', label: 'Evet (Tam Zamanlı)', desc: 'Tüm veya çoğu departman uzaktan çalışabilir.' },
                            { key: 'partial', label: 'Kısmen / Hibrit', desc: 'Haftada belirli günler veya belirli roller.' },
                            { key: 'no', label: 'Hayır (Yerinde)', desc: 'Tüm operasyonlar ofis/fabrika ortamındadır.' }
                          ].map(item => (
                            <div 
                              key={item.key}
                              onClick={() => updateField('remoteWork', item.key)}
                              style={{
                                padding: '16px',
                                borderRadius: '12px',
                                border: `2px solid ${formData.remoteWork === item.key ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
                                background: formData.remoteWork === item.key ? 'rgba(16, 185, 129, 0.03)' : '#FFFFFF',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <span style={{ fontWeight: 700, fontSize: '13px', color: formData.remoteWork === item.key ? 'var(--accent-emerald-dark)' : 'var(--primary-midnight)' }}>
                                {item.label}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                {item.desc}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Taşıtlar */}
                  {step === 2 && (
                    <motion.div key="w-step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-col gap-6">
                      <div style={{ background: 'rgba(16, 185, 129, 0.04)', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <Info size={20} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '13px', color: 'var(--accent-emerald-dark)', lineHeight: '1.5', fontWeight: 500 }}>
                          Şirkete ait aktif araç filosunun yakıt tipleri, Scope 1 doğrudan seragazı emisyonları hesabının temelini oluşturur.
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '16px 24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Toplam Beyan Edilen Araç Sayısı</span>
                          <h4 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-midnight)' }}>{getTotalVehicles()} Adet Taşıt</h4>
                        </div>
                        <div style={{ background: 'var(--accent-emerald)', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                          Scope 1 Hesabına Hazır
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {[
                          { key: 'electric', name: 'Elektrikli Araç', color: '#10B981', desc: '0 Emisyon - Çevre Dostu' },
                          { key: 'hybrid', name: 'Hibrit Araç', color: '#3B82F6', desc: 'Düşük Emisyon - Çift Motor' },
                          { key: 'diesel', name: 'Dizel Araç', color: '#EF4444', desc: 'Yüksek Emisyon - Fosil Yakıt' },
                          { key: 'gasoline', name: 'Benzinli Araç', color: '#F59E0B', desc: 'Standart Emisyon - Fosil Yakıt' }
                        ].map(type => (
                          <div key={type.key} style={{ padding: '20px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: type.color }} />
                                <strong style={{ fontSize: '14px', color: 'var(--primary-midnight)' }}>{type.name}</strong>
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{type.desc}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button type="button" onClick={() => updateVehicleCount(type.key, -1)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
                              <span style={{ fontWeight: 800, fontSize: '16px', minWidth: '24px', textAlign: 'center' }}>{formData.vehiclesCount[type.key]}</span>
                              <button type="button" onClick={() => updateVehicleCount(type.key, 1)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: ÇYS */}
                  {step === 3 && (
                    <motion.div key="w-step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-col gap-6">
                      <div className="flex-col gap-2">
                        <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary-midnight)' }}>
                          Yazılı Çevre Yönetim Sistemi (ÇYS / ISO 14001) Politikası
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                          {[
                            { key: 'yes', label: 'Mevcut & Yürürlükte', desc: 'ISO 14001 sertifikalı veya yazılı beyan var.' },
                            { key: 'planning', label: 'Hazırlık Aşamasında', desc: 'Çalışmalar başladı, 6 ay içinde planlanıyor.' },
                            { key: 'no', label: 'Mevcut Değil', desc: 'Yazılı bir ÇYS politikası bulunmuyor.' }
                          ].map(item => (
                            <div 
                              key={item.key}
                              onClick={() => updateField('hasEmsPolicy', item.key)}
                              style={{
                                padding: '16px',
                                borderRadius: '12px',
                                border: `2px solid ${formData.hasEmsPolicy === item.key ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
                                background: formData.hasEmsPolicy === item.key ? 'rgba(16, 185, 129, 0.03)' : '#FFFFFF',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <span style={{ fontWeight: 700, fontSize: '13px', color: formData.hasEmsPolicy === item.key ? 'var(--accent-emerald-dark)' : 'var(--primary-midnight)' }}>
                                {item.label}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                {item.desc}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Generator Helper Banner if ÇYS is missing */}
                      {(formData.hasEmsPolicy === 'no' || formData.hasEmsPolicy === 'planning') && (
                        <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.08))', padding: '20px', borderRadius: '16px', border: '1.5px dashed var(--accent-emerald)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', maxWidth: '70%' }}>
                            <Sparkles size={24} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <strong style={{ fontSize: '14px', color: 'var(--primary-midnight)', display: 'block', marginBottom: '4px' }}>
                                Çevre Politikanız Hazır Değil mi?
                              </strong>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                EcoFin YZ motoru, beyan ettiğiniz çalışan, araç ve tüketim verilerini kullanarak firmanıza özel ISO 14001 uyumlu bir Çevre Yönetim Politikası taslağı hazırlayabilir.
                              </span>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setMode('ai_generator')}
                            className="btn-primary"
                            style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '10px', cursor: 'pointer' }}
                          >
                            Hemen Oluştur (YZ)
                          </button>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="flex-col gap-2">
                          <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary-midnight)' }}>Sıfır Atık Belgesi Düzeyi</label>
                          <select 
                            value={formData.zeroWasteLevel}
                            onChange={(e) => updateField('zeroWasteLevel', e.target.value)}
                            className="input-field"
                            style={{ borderRadius: '12px', height: '48px', fontSize: '14px', background: '#FFF' }}
                          >
                            <option value="none">Sıfır Atık Belgesi Yok</option>
                            <option value="basic">Temel Seviye Sıfır Atık Belgesi</option>
                            <option value="advanced">Nitelikli (Gümüş/Altın/Platin) Belge</option>
                          </select>
                        </div>

                        <div className="flex-col gap-2">
                          <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary-midnight)' }}>Yenilenebilir Enerji Kullanımı (GES vb.)</label>
                          <div 
                            onClick={() => updateField('hasRenewableEnergy', !formData.hasRenewableEnergy)}
                            style={{
                              height: '48px',
                              border: `1.5px solid ${formData.hasRenewableEnergy ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0 16px',
                              justifyContent: 'space-between',
                              background: formData.hasRenewableEnergy ? 'rgba(16, 185, 129, 0.03)' : '#FFF',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '14px',
                              color: formData.hasRenewableEnergy ? 'var(--accent-emerald-dark)' : 'var(--primary-midnight)'
                            }}
                          >
                            <span>Tesislerde Çatı GES / Yeşil Tarife</span>
                            <div style={{
                              width: '38px',
                              height: '22px',
                              borderRadius: '11px',
                              background: formData.hasRenewableEnergy ? 'var(--accent-emerald)' : '#CBD5E1',
                              position: 'relative',
                              transition: 'background-color 0.2s'
                            }}>
                              <div style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: '#FFF',
                                position: 'absolute',
                                top: '2px',
                                left: formData.hasRenewableEnergy ? '18px' : '2px',
                                transition: 'left 0.2s'
                              }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="flex-col gap-2">
                          <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary-midnight)' }}>Yıllık Elektrik Tüketimi (kWh/yıl)</label>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input 
                              type="number" 
                              value={formData.annualElectricity} 
                              onChange={(e) => updateField('annualElectricity', Math.max(0, parseInt(e.target.value) || 0))}
                              className="input-field" 
                              style={{ borderRadius: '12px', paddingRight: '60px', height: '48px' }} 
                            />
                            <span style={{ position: 'absolute', right: '16px', color: 'var(--text-light)', fontWeight: 600, fontSize: '13px' }}>kWh</span>
                          </div>
                        </div>

                        <div className="flex-col gap-2">
                          <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary-midnight)' }}>Yıllık Su Tüketimi (m³/yıl)</label>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input 
                              type="number" 
                              value={formData.annualWater} 
                              onChange={(e) => updateField('annualWater', Math.max(0, parseInt(e.target.value) || 0))}
                              className="input-field" 
                              style={{ borderRadius: '12px', paddingRight: '60px', height: '48px' }} 
                            />
                            <span style={{ position: 'absolute', right: '16px', color: 'var(--text-light)', fontWeight: 600, fontSize: '13px' }}>m³</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Özet */}
                  {step === 4 && (
                    <motion.div key="w-step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-col gap-6">
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-midnight)', marginBottom: '4px' }}>
                        Beyan Edilen Bilgilerin Özeti
                      </h3>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
                            <Users size={16} /> Sosyal Yapı
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-midnight)' }}>{formData.employeeCount} Çalışan</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Haftalık {formData.weeklyWorkHours} saat çalışma</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formData.extraExcuseLeave} gün mazeret izni</div>
                          </div>
                        </div>

                        <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
                            <Car size={16} /> Filo Emisyon
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-midnight)' }}>{getTotalVehicles()} Araç</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                              <span>⚡ {formData.vehiclesCount.electric} Elek.</span>
                              <span>🌱 {formData.vehiclesCount.hybrid} Hib.</span>
                              <span>⛽ {formData.vehiclesCount.gasoline} Benz.</span>
                              <span>🛢️ {formData.vehiclesCount.diesel} Dizel</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
                            <Leaf size={16} /> Çevre & Tüketim
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-midnight)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {formData.hasEmsPolicy === 'yes' ? 'ÇYS Mevcut' : formData.hasEmsPolicy === 'planning' ? 'ÇYS Planlanıyor' : 'ÇYS Yok'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🔋 {formData.annualElectricity.toLocaleString()} kWh/yıl</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>💧 {formData.annualWater} m³/yıl</div>
                          </div>
                        </div>
                      </div>

                      <div 
                        onClick={() => updateField('confirmed', !formData.confirmed)}
                        style={{
                          marginTop: '16px',
                          padding: '20px',
                          background: formData.confirmed ? 'rgba(16, 185, 129, 0.03)' : '#FFF',
                          border: `1.5px solid ${formData.confirmed ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
                          borderRadius: '16px',
                          cursor: 'pointer',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'flex-start',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          border: `2px solid ${formData.confirmed ? 'var(--accent-emerald)' : 'var(--text-light)'}`,
                          background: formData.confirmed ? 'var(--accent-emerald)' : '#FFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFF',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          {formData.confirmed && <Check size={14} strokeWidth={3} />}
                        </div>
                        <div>
                          <strong style={{ display: 'block', fontSize: '14px', color: 'var(--primary-midnight)', marginBottom: '4px' }}>
                            Yasal Beyan ve Taahhüt
                          </strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                            Yukarıda girilen verilerin şirket kayıtları ve faturalar ile uyuştuğunu, bağımsız TSRS denetiminde bu belgeleri ibraz edeceğimi taahhüt ve beyan ederim.
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Nav Buttons */}
                  <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      {step > 1 && (
                        <button type="button" onClick={handlePrev} className="btn-outline" style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <ArrowLeft size={16} /> Geri
                        </button>
                      )}
                    </div>
                    <div>
                      {step < 4 ? (
                        <button type="button" onClick={handleNext} className="btn-primary" style={{ padding: '10px 24px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          Devam Et <ArrowRight size={16} />
                        </button>
                      ) : (
                        <button 
                          type="submit" 
                          className="btn-primary" 
                          disabled={!formData.confirmed}
                          style={{ 
                            padding: '12px 28px', 
                            borderRadius: '12px', 
                            fontSize: '13px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            opacity: formData.confirmed ? 1 : 0.6,
                            cursor: formData.confirmed ? 'pointer' : 'not-allowed',
                            background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-emerald-dark))'
                          }}
                        >
                          Beyanı Onayla ve Gönder <ShieldCheck size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </motion.div>
            ) : (
              /* AI Policy Generator screen */
              <motion.div 
                key="ai-generator-panel"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="card glass-panel"
                style={{ padding: '32px' }}
              >
                {aiGenerating ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', gap: '20px' }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                      <RotateCcw size={60} className="animate-spin" color="var(--accent-emerald)" style={{ opacity: 0.3 }} />
                      <Sparkles size={30} color="var(--accent-emerald)" style={{ position: 'absolute', top: '15px', left: '15px' }} className="animate-pulse" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ fontWeight: 700, color: 'var(--primary-midnight)', fontSize: '16px' }}>YZ ÇYS Sihirbazı Çevre Politikası Oluşturuyor</h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>Girilen şirket ve emisyon verileri analiz ediliyor...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-col gap-6">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-midnight)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Sparkles size={20} color="var(--accent-emerald)" /> AI Çevre Politikası Taslağı
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ISO 14001 standartlarına uyumlu sürdürülebilirlik deklarasyonu</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={generateAiPolicy}
                          className="btn-outline" 
                          style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                        >
                          <RotateCcw size={14} /> Yeniden Üret
                        </button>
                      </div>
                    </div>

                    {/* Paper Preview Document */}
                    <div style={{
                      background: '#FFFFFF',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '32px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                      fontFamily: 'Georgia, serif',
                      lineHeight: '1.6',
                      color: '#1E293B',
                      fontSize: '13px',
                      maxHeight: '380px',
                      overflowY: 'auto',
                      borderTop: '6px solid var(--accent-emerald)',
                      whiteSpace: 'pre-line'
                    }}>
                      {aiGeneratedPolicy}
                    </div>

                    <div style={{ background: 'rgba(245, 158, 11, 0.04)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.1)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <p style={{ fontSize: '12px', color: '#B45309', lineHeight: '1.5', fontWeight: 500 }}>
                        <strong>Taahhüt Onayı:</strong> Bu taslağı onayladığınızda şirketinizin çevre yönetim beyanı onaylanmış sayılacak ve ÇYS durumunuz **"Mevcut (ISO 14001)"** olarak işaretlenecektir.
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                      <button 
                        type="button" 
                        onClick={() => setMode('wizard')} 
                        className="btn-outline" 
                        style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '13px', cursor: 'pointer' }}
                      >
                        Vazgeç
                      </button>
                      <button 
                        type="button" 
                        onClick={handleAcceptAiPolicy} 
                        className="btn-primary" 
                        style={{ padding: '10px 24px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                      >
                        Politikayı Kabul Et ve ÇYS'yi Aktif Et <ShieldCheck size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Area: FAQ & ESG Guidelines */}
        <div className="flex-col gap-6">
          
          {/* FAQ Card */}
          <div className="card glass-panel flex-col gap-4" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-midnight)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={18} color="var(--accent-emerald)" /> ESG Kılavuzu & ÇYS Nedir?
            </h4>
            
            <div className="flex-col gap-3" style={{ fontSize: '12px', lineHeight: '1.5' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--primary-midnight)' }}>ÇYS (Çevre Yönetim Sistemi) Nedir?</strong>
                <span style={{ color: 'var(--text-muted)' }}>Kuruluşların faaliyetlerinin çevreye verdiği zararları sistematik bir şekilde azaltmak ve önlemek için uyguladıkları yönetim sistemidir (ISO 14001).</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border-color)' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--primary-midnight)' }}>Scope 1 (Doğrudan) Emisyonlar</strong>
                <span style={{ color: 'var(--text-muted)' }}>Şirketin doğrudan kontrol ettiği yakma kazanları veya sahip olduğu araç filosundan kaynaklanan sera gazı salınımlarıdır.</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border-color)' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--primary-midnight)' }}>Sürdürülebilirlik Puanı Katkısı</strong>
                <span style={{ color: 'var(--text-muted)' }}>Beyan ettiğiniz bu veriler Yeşil Kredi skorunuzu belirleyen algoritmanın temel girdisidir ve faiz indirimi oranınızı doğrudan belirler.</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Widget */}
          <div className="card glass-panel flex-col gap-3" style={{ padding: '24px', background: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} color="#3B82F6" /> Tahmini Emisyon Oranları
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div className="flex justify-between items-center">
                <span style={{ color: 'var(--text-muted)' }}>Mobilite (Fosil Yakıt):</span>
                <span style={{ fontWeight: 700, color: 'var(--primary-midnight)' }}>
                  {((formData.vehiclesCount.diesel * 2.6) + (formData.vehiclesCount.gasoline * 2.3)).toFixed(1)} tCO₂e / yıl
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: 'var(--text-muted)' }}>Tesis (Elektrik):</span>
                <span style={{ fontWeight: 700, color: 'var(--primary-midnight)' }}>
                  {(formData.annualElectricity * 0.45 / 1000).toFixed(2)} tCO₂e / yıl
                </span>
              </div>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
              <div className="flex justify-between items-center" style={{ fontWeight: 700 }}>
                <span style={{ color: '#1E3A8A' }}>Toplam Karbon İzi:</span>
                <span style={{ color: '#1E3A8A' }}>
                  {(((formData.vehiclesCount.diesel * 2.6) + (formData.vehiclesCount.gasoline * 2.3)) + (formData.annualElectricity * 0.45 / 1000)).toFixed(2)} tCO₂ / yıl
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ManagerDeclarationDashboard;
