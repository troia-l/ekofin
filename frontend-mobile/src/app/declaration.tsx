import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { safeStorage } from '@/utils/storage';
import { 
  ArrowLeft, Users, Car, Leaf, ClipboardCheck, Check, 
  Plus, Minus, Info, Sparkles, ShieldCheck, AlertTriangle, RotateCcw
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function DeclarationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<any>(params.mode || 'wizard'); // 'wizard' or 'ai_generator'
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedPolicy, setAiGeneratedPolicy] = useState('');
  
  const [formData, setFormData] = useState({
    employeeCount: 45,
    weeklyWorkHours: 45,
    extraExcuseLeave: 5,
    remoteWork: 'partial', // 'yes', 'partial', 'no'
    vehiclesCount: {
      electric: 1,
      hybrid: 1,
      diesel: 2,
      gasoline: 1
    },
    hasEmsPolicy: 'planning', // 'yes', 'planning', 'no'
    zeroWasteLevel: 'basic', // 'none', 'basic', 'advanced'
    hasRenewableEnergy: false,
    annualElectricity: 14500, // kWh
    annualWater: 420, // m3
    confirmed: false
  });

  // Load existing data if available
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const saved = await safeStorage.getItem('manager_declaration');
        if (saved) {
          setFormData(JSON.parse(saved));
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkExisting();
  }, []);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateVehicleCount = (type: string, delta: number) => {
    setFormData(prev => {
      const current = (prev.vehiclesCount as any)[type] || 0;
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

  const handleFormSubmit = async () => {
    if (!formData.confirmed && step === 4) {
      alert("Lütfen bilgilerin doğruluğunu onaylayın.");
      return;
    }
    try {
      await safeStorage.setItem('manager_declaration', JSON.stringify(formData));
      router.back();
    } catch (e) {
      console.error(e);
    }
  };

  // AI ÇYS Policy Generator Logic
  const generateAiPolicy = () => {
    setAiGenerating(true);
    setTimeout(() => {
      const totalVehicles = getTotalVehicles();
      const { electric, hybrid, diesel, gasoline } = formData.vehiclesCount;
      const policyText = `ECOFIN ÇEVRE YÖNETİM SİSTEMİ (ÇYS)
ÇEVRE YÖNETİM POLİTİKASI VE ISO 14001 TAAHHÜTNAMESİ

Belge No: EF-ÇYS-2026-${Math.floor(100000 + Math.random() * 900000)}
Uyum Seviyesi: ISO 14001:2015 Uyumlu Mobil Taslak

1. GİRİŞ VE AMAÇ
${formData.employeeCount} aktif SGK çalışanına sahip işletmemiz, idari ve operasyonel faaliyetlerinin çevresel etkilerini en aza indirmeyi ve sürdürülebilirlik ilkelerini kurumsal kültürünün bir parçası haline getirmeyi taahhüt eder.

2. FİLO VE EMİSYON YÖNETİMİ (Scope 1)
Envanterimizde bulunan toplam ${totalVehicles} adet taşıtın yakıt türü dağılımı:
- Elektrikli Taşıt: ${electric} adet
- Hibrit Taşıt: ${hybrid} adet
- Benzinli Taşıt: ${gasoline} adet
- Dizel Taşıt: ${diesel} adet

Fosil yakıtlı araçlarımızın payını azaltarak elektrikli ve hibrit araç geçişimizi hızlandırmayı, böylece doğrudan emisyonlarımızı düşürmeyi taahhüt ediyoruz.

3. ENERJİ VE DOĞAL KAYNAK TÜKETİMİ (Scope 2)
- Yıllık tahmini elektrik tüketimi: ${formData.annualElectricity.toLocaleString()} kWh
- Yıllık tahmini su tüketimi: ${formData.annualWater} m³

Kaynak verimliliğini sağlamak adına tesislerimizde enerji tasarruflu sistemlerin kullanımı yaygınlaştırılacaktır. ${formData.hasRenewableEnergy ? 'Mevcut çatı GES kapasitemizi kullanarak' : 'Yenilenebilir enerji yatırımlarını değerlendirerek'} yeşil enerji payımızı artıracağız.

4. ATUK YÖNETİMİ VE SIFIR ATIK
Sıfır atık yönetimimiz "${formData.zeroWasteLevel === 'none' ? 'Geliştirilecek' : formData.zeroWasteLevel === 'basic' ? 'Temel Seviye' : 'Nitelikli Seviye'}" statüsündedir. Geri dönüşüm süreçleri optimize edilecektir.

Yönetici Adı: [Yönetim Kurulu Yetkilisi]
EcoFin Sürdürülebilirlik Yapay Zeka Onaylı Taslağı`;

      setAiGeneratedPolicy(policyText);
      setAiGenerating(false);
    }, 2000);
  };

  useEffect(() => {
    if (mode === 'ai_generator' && !aiGeneratedPolicy) {
      generateAiPolicy();
    }
  }, [mode]);

  const handleAcceptAiPolicy = async () => {
    const updatedData = {
      ...formData,
      hasEmsPolicy: 'yes', // Auto activate ÇYS
      confirmed: true
    };
    try {
      await safeStorage.setItem('manager_declaration', JSON.stringify(updatedData));
      router.back();
    } catch (e) {
      console.error(e);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, icon: Users },
      { num: 2, icon: Car },
      { num: 3, icon: Leaf },
      { num: 4, icon: ClipboardCheck }
    ];

    return (
      <View style={styles.indicatorContainer}>
        <View style={styles.indicatorLine} />
        <View style={[styles.indicatorProgressLine, { width: `${((step - 1) / 3) * 100}%` }]} />
        {steps.map(s => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isCompleted = step > s.num;

          return (
            <View 
              key={s.num} 
              style={[
                styles.indicatorCircle,
                isCompleted && styles.indicatorCircleCompleted,
                isActive && styles.indicatorCircleActive
              ]}
            >
              {isCompleted ? (
                <Check size={14} color="#FFFFFF" />
              ) : (
                <Icon size={14} color={isActive || isCompleted ? '#FFFFFF' : '#9CA3AF'} />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#0B1120', '#162032', '#090D16']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>
            {mode === 'wizard' ? 'Yönetici Beyan Formu' : 'YZ ÇYS Sihirbazı'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {mode === 'wizard' ? (
            <View style={styles.card}>
              {renderStepIndicator()}

              {/* Step 1: Kurumsal */}
              {step === 1 && (
                <View style={styles.stepContainer}>
                  <View style={styles.infoBanner}>
                    <Info size={16} color="#3B82F6" style={{ marginTop: 2 }} />
                    <Text style={styles.infoText}>
                      Çalışan refahı ve esnek çalışma imkanları, ESG değerlendirmesinin Sosyal (S) ayağını oluşturur.
                    </Text>
                  </View>

                  {/* Çalışan Sayısı */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Toplam Çalışan Sayısı (SGK)</Text>
                    <View style={styles.counterRow}>
                      <TouchableOpacity 
                        style={styles.counterBtn}
                        onPress={() => updateField('employeeCount', Math.max(1, formData.employeeCount - 5))}
                      >
                        <Text style={styles.counterBtnText}>-5</Text>
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{formData.employeeCount}</Text>
                      <TouchableOpacity 
                        style={styles.counterBtn}
                        onPress={() => updateField('employeeCount', formData.employeeCount + 5)}
                      >
                        <Text style={styles.counterBtnText}>+5</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Çalışma Saati */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Haftalık Ortalama Çalışma Süresi (Saat)</Text>
                    <View style={styles.counterRow}>
                      <TouchableOpacity 
                        style={styles.counterBtn}
                        onPress={() => updateField('weeklyWorkHours', Math.max(20, formData.weeklyWorkHours - 1))}
                      >
                        <Minus size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{formData.weeklyWorkHours}</Text>
                      <TouchableOpacity 
                        style={styles.counterBtn}
                        onPress={() => updateField('weeklyWorkHours', Math.min(60, formData.weeklyWorkHours + 1))}
                      >
                        <Plus size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Mazeret İzni Slider */}
                  <View style={styles.fieldContainer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={styles.fieldLabel}>Ekstra Mazeret İzni Hakkı</Text>
                      <Text style={styles.sliderBadge}>{formData.extraExcuseLeave} Gün</Text>
                    </View>
                    <View style={styles.sliderMockContainer}>
                      {/* Range slider mock using buttons for native consistency */}
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                        {[0, 5, 10, 15, 20, 25, 30].map(val => (
                          <TouchableOpacity
                            key={val}
                            style={[
                              styles.sliderMockBtn,
                              formData.extraExcuseLeave === val && styles.sliderMockBtnActive
                            ]}
                            onPress={() => updateField('extraExcuseLeave', val)}
                          >
                            <Text style={[
                              styles.sliderMockText,
                              formData.extraExcuseLeave === val && styles.sliderMockTextActive
                            ]}>{val}g</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Remote Work Selector */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Uzaktan Çalışma Modeli</Text>
                    <View style={{ gap: 8 }}>
                      {[
                        { key: 'yes', label: 'Evet (Tam Zamanlı)', desc: 'Tüm veya çoğu departman uzaktan çalışır.' },
                        { key: 'partial', label: 'Kısmen / Hibrit', desc: 'Haftada belirli günler uzaktan çalışma.' },
                        { key: 'no', label: 'Hayır (Yerinde)', desc: 'Tüm operasyonlar iş yerinde yürütülür.' }
                      ].map(item => (
                        <TouchableOpacity
                          key={item.key}
                          style={[
                            styles.radioCard,
                            formData.remoteWork === item.key && styles.radioCardActive
                          ]}
                          onPress={() => updateField('remoteWork', item.key)}
                        >
                          <Text style={[
                            styles.radioTitle,
                            formData.remoteWork === item.key && styles.radioTitleActive
                          ]}>{item.label}</Text>
                          <Text style={styles.radioDesc}>{item.desc}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {/* Step 2: Taşıtlar */}
              {step === 2 && (
                <View style={styles.stepContainer}>
                  <View style={[styles.infoBanner, { borderColor: 'rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.03)' }]}>
                    <Info size={16} color="#10B981" style={{ marginTop: 2 }} />
                    <Text style={[styles.infoText, { color: '#10B981' }]}>
                      Şirkete ait aktif araç filosu, doğrudan Scope 1 sera gazı emisyonlarının ana kaynağıdır.
                    </Text>
                  </View>

                  <View style={styles.totalVehiclesBanner}>
                    <Text style={styles.totalLabel}>Toplam Beyan Edilen Taşıt</Text>
                    <Text style={styles.totalValue}>{getTotalVehicles()} Adet</Text>
                  </View>

                  <View style={{ gap: 12 }}>
                    {[
                      { key: 'electric', name: 'Elektrikli Araç', color: '#10B981' },
                      { key: 'hybrid', name: 'Hibrit Araç', color: '#3B82F6' },
                      { key: 'diesel', name: 'Dizel Araç', color: '#EF4444' },
                      { key: 'gasoline', name: 'Benzinli Araç', color: '#F59E0B' }
                    ].map(type => (
                      <View key={type.key} style={styles.vehicleRowCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={[styles.dotIndicator, { backgroundColor: type.color }]} />
                          <Text style={styles.vehicleCardName}>{type.name}</Text>
                        </View>
                        <View style={styles.miniCounter}>
                          <TouchableOpacity 
                            style={styles.miniCounterBtn}
                            onPress={() => updateVehicleCount(type.key, -1)}
                          >
                            <Minus size={10} color="#FFFFFF" />
                          </TouchableOpacity>
                          <Text style={styles.miniCounterValue}>{(formData.vehiclesCount as any)[type.key]}</Text>
                          <TouchableOpacity 
                            style={styles.miniCounterBtn}
                            onPress={() => updateVehicleCount(type.key, 1)}
                          >
                            <Plus size={10} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Step 3: ÇYS */}
              {step === 3 && (
                <View style={styles.stepContainer}>
                  
                  {/* EMS Policy Selection */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>ÇYS / ISO 14001 Politikası</Text>
                    <View style={{ gap: 8 }}>
                      {[
                        { key: 'yes', label: 'Mevcut & Yürürlükte', desc: 'ISO 14001 sertifikalı veya yazılı beyan var.' },
                        { key: 'planning', label: 'Hazırlık Aşamasında', desc: 'Çalışmalar başladı, 6 ay içinde planlanıyor.' },
                        { key: 'no', label: 'Mevcut Değil', desc: 'Yazılı bir ÇYS politikası bulunmuyor.' }
                      ].map(item => (
                        <TouchableOpacity
                          key={item.key}
                          style={[
                            styles.radioCard,
                            formData.hasEmsPolicy === item.key && styles.radioCardActive
                          ]}
                          onPress={() => updateField('hasEmsPolicy', item.key)}
                        >
                          <Text style={[
                            styles.radioTitle,
                            formData.hasEmsPolicy === item.key && styles.radioTitleActive
                          ]}>{item.label}</Text>
                          <Text style={styles.radioDesc}>{item.desc}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* AI Generator Promo Banner */}
                  {(formData.hasEmsPolicy === 'no' || formData.hasEmsPolicy === 'planning') && (
                    <View style={styles.aiBanner}>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Sparkles size={20} color="#10B981" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.aiBannerTitle}>Çevre Politikanız Eksik mi?</Text>
                          <Text style={styles.aiBannerDesc}>
                            EcoFin YZ motoru verilerinizi analiz ederek firmanıza özel ISO 14001 çevre politikası üretebilir.
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.aiBannerBtn}
                        onPress={() => setMode('ai_generator')}
                      >
                        <Text style={styles.aiBannerBtnText}>Hemen Oluştur (YZ)</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Toggle GES */}
                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={styles.fieldLabel}>Tesislerde Çatı GES / Yeşil Tarife</Text>
                      <Text style={styles.radioDesc}>Yenilenebilir enerji kaynağı kullanımı</Text>
                    </View>
                    <Switch
                      value={formData.hasRenewableEnergy}
                      onValueChange={(val) => updateField('hasRenewableEnergy', val)}
                      trackColor={{ false: '#2D3748', true: '#10B981' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  {/* Tüketimler */}
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View style={[styles.fieldContainer, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Yıllık Elektrik (kWh)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={String(formData.annualElectricity)}
                        keyboardType="numeric"
                        onChangeText={(txt) => updateField('annualElectricity', parseInt(txt) || 0)}
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>

                    <View style={[styles.fieldContainer, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Yıllık Su (m³)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={String(formData.annualWater)}
                        keyboardType="numeric"
                        onChangeText={(txt) => updateField('annualWater', parseInt(txt) || 0)}
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Step 4: Özet */}
              {step === 4 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.summaryTitle}>Beyan Özeti</Text>
                  
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryRow}>👥 Çalışan: <Text style={{fontWeight: '700', color: '#FFF'}}>{formData.employeeCount} Kişi</Text></Text>
                    <Text style={styles.summaryRow}>🚗 Filo Taşıtı: <Text style={{fontWeight: '700', color: '#FFF'}}>{getTotalVehicles()} Araç</Text></Text>
                    <Text style={styles.summaryRow}>🔋 Enerji: <Text style={{fontWeight: '700', color: '#FFF'}}>{formData.annualElectricity.toLocaleString()} kWh</Text></Text>
                    <Text style={styles.summaryRow}>💧 Su Tüketimi: <Text style={{fontWeight: '700', color: '#FFF'}}>{formData.annualWater} m³</Text></Text>
                    <Text style={styles.summaryRow}>🌱 ÇYS Belgesi: <Text style={{fontWeight: '700', color: '#FFF'}}>{formData.hasEmsPolicy === 'yes' ? 'Mevcut' : 'Eksik'}</Text></Text>
                  </View>

                  {/* Confirm Checkbox */}
                  <TouchableOpacity 
                    style={[
                      styles.confirmBox,
                      formData.confirmed && styles.confirmBoxActive
                    ]}
                    onPress={() => updateField('confirmed', !formData.confirmed)}
                  >
                    <View style={[
                      styles.checkbox,
                      formData.confirmed && styles.checkboxActive
                    ]}>
                      {formData.confirmed && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.confirmTitle}>Yasal Beyan ve Taahhüt</Text>
                      <Text style={styles.confirmText}>
                        Girilen tüm bilgilerin şirket resmi kayıtlarına uygun olduğunu onaylıyorum.
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Nav Buttons */}
              <View style={styles.footerNav}>
                <View style={{ width: 80 }}>
                  {step > 1 && (
                    <TouchableOpacity onPress={handlePrev} style={styles.prevBtn}>
                      <Text style={styles.prevBtnText}>Geri</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {step < 4 ? (
                  <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
                    <Text style={styles.nextBtnText}>Devam Et</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    onPress={handleFormSubmit} 
                    disabled={!formData.confirmed}
                    style={[
                      styles.submitBtn,
                      !formData.confirmed && { opacity: 0.5 }
                    ]}
                  >
                    <Text style={styles.submitBtnText}>Beyanı Gönder</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            /* AI Generator Layout */
            <View style={styles.card}>
              {aiGenerating ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#10B981" />
                  <Text style={styles.loadingText}>Şirketinize Özel Çevre Politikası Hazırlanıyor...</Text>
                </View>
              ) : (
                <View style={{ gap: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.aiDocTitle}>YZ Çevre Politikası Taslağı</Text>
                    <TouchableOpacity onPress={generateAiPolicy} style={styles.retryBtn}>
                      <RotateCcw size={12} color="#FFFFFF" />
                      <Text style={styles.retryText}>Yenile</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.docScroll} showsVerticalScrollIndicator={true}>
                    <Text style={styles.docText}>{aiGeneratedPolicy}</Text>
                  </ScrollView>

                  <View style={styles.warningBox}>
                    <AlertTriangle size={16} color="#F59E0B" style={{ marginTop: 2 }} />
                    <Text style={styles.warningBoxText}>
                      Onayladığınızda ÇYS durumunuz "Mevcut (ISO 14001)" olarak güncellenecek ve Yeşil Kredi limitlerinize uygulanacaktır.
                    </Text>
                  </View>

                  <View style={styles.aiDocFooter}>
                    <TouchableOpacity 
                      onPress={() => setMode('wizard')} 
                      style={styles.cancelDocBtn}
                    >
                      <Text style={styles.cancelDocBtnText}>Vazgeç</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={handleAcceptAiPolicy} 
                      style={styles.acceptDocBtn}
                    >
                      <Text style={styles.acceptDocBtnText}>Politikayı Onayla</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
    marginBottom: 24,
  },
  indicatorLine: {
    position: 'absolute',
    top: 14,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  indicatorProgressLine: {
    position: 'absolute',
    top: 14,
    left: 20,
    height: 2,
    backgroundColor: '#10B981',
  },
  indicatorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  indicatorCircleActive: {
    backgroundColor: '#0B1120',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  indicatorCircleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepContainer: {
    gap: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#3B82F6',
    lineHeight: 14,
    fontWeight: '500',
  },
  fieldContainer: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 8,
  },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sliderBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  sliderMockContainer: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 10,
  },
  sliderMockBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sliderMockBtnActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  sliderMockText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  sliderMockTextActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  radioCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  radioCardActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
  },
  radioTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  radioTitleActive: {
    color: '#10B981',
  },
  radioDesc: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  totalVehiclesBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  vehicleRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vehicleCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  miniCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniCounterBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniCounterValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    minWidth: 16,
    textAlign: 'center',
  },
  aiBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#10B981',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  aiBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aiBannerDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 14,
    marginTop: 2,
  },
  aiBannerBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  aiBannerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B1120',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
  },
  textInput: {
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '700',
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  summaryBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  summaryRow: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  confirmBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  confirmBoxActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.02)',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  confirmTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    lineHeight: 13,
  },
  footerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  prevBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  prevBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  nextBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B1120',
  },
  submitBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    minHeight: 250,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  aiDocTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
  },
  retryText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  docScroll: {
    maxHeight: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderTopWidth: 4,
    borderTopColor: '#10B981',
  },
  docText: {
    fontFamily: 'Georgia',
    fontSize: 11,
    color: '#1F2937',
    lineHeight: 16,
  },
  warningBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    padding: 12,
  },
  warningBoxText: {
    flex: 1,
    fontSize: 11,
    color: '#F59E0B',
    lineHeight: 14,
    fontWeight: '500',
  },
  aiDocFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 16,
  },
  cancelDocBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelDocBtnText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  acceptDocBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  acceptDocBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
