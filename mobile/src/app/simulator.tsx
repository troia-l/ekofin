import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Sparkles, Check, ChevronRight, ChevronLeft, Shield, 
  Leaf, Zap, Clock, Info, ShieldAlert, Award, TrendingDown
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const TEMPLATES = [
  { 
    label: 'Tekstil', 
    text: 'Aylık 12 ton pamuk, 4 ton plastik polimer hammadde işlenmektedir. Sevkiyatlar için 3 dizel kamyonla lojistik sağlanmakta ve aylık ortalama 2.200 km yol yapılmaktadır. Üretimde aylık 15.000 kWh elektrik şebekesinden çekilmekte, 950 m³ doğalgaz tüketilmektedir.' 
  },
  { 
    label: 'Ağır Metal', 
    text: 'Aylık 18 ton çelik hammadde, 2 ton plastik polimer kullanılmaktadır. 4 dizel kamyonla lojistik sağlanmakta ve aylık 3.500 km yapılmaktadır. Fabrikada aylık 24.000 kWh elektrik ve 1.800 m³ doğalgaz tüketilmektedir.' 
  },
  { 
    label: 'Lojistik', 
    text: 'Aylık lojistik faaliyetleri için 8 dizel kamyon kullanılmakta ve toplamda 12.000 km yol yapılmaktadır. Ana dağıtım merkezinde aylık 8.000 kWh elektrik şebekesinden tüketilmektedir.' 
  },
];

export default function SimulatorScreen() {
  const [step, setStep] = useState(1);
  const [inputText, setInputText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  
  // Simulation Inputs
  const [loanAmount, setLoanAmount] = useState(2500000); // TL
  const [financialRating, setFinancialRating] = useState('BBB');
  const [loanYears, setLoanYears] = useState(5);
  
  // Investments
  const [gesChecked, setGesChecked] = useState(true);
  const [gesBudget, setGesBudget] = useState(1200000);
  
  const [evChecked, setEvChecked] = useState(false);
  const [evCount, setEvCount] = useState(3);
  
  const [effChecked, setEffChecked] = useState(false);
  const [effBudget, setEffBudget] = useState(400000);

  const [wasteChecked, setWasteChecked] = useState(false);
  const [wasteBudget, setWasteBudget] = useState(200000);

  // Dynamic Calculations (Simulating Web Model C rules)
  const baselineEmission = analyzed ? (inputText.includes('Metal') ? 180.0 : inputText.includes('Lojistik') ? 240.0 : 120.0) : 120.0;
  
  const activeGesBudget = gesChecked ? gesBudget : 0;
  const activeEvCount = evChecked ? evCount : 0;
  const activeEffBudget = effChecked ? effBudget : 0;
  const activeWasteBudget = wasteChecked ? wasteBudget : 0;

  const totalCapex = activeGesBudget + (activeEvCount * 450000) + activeEffBudget + activeWasteBudget;

  const gesReduction = Math.min(activeGesBudget * 0.000008, 45);
  const evReduction = Math.min(activeEvCount * 5.0, 30);
  const effReduction = Math.min(activeEffBudget * 0.000012, 15);
  const wasteReduction = Math.min(activeWasteBudget * 0.000015, 10);

  const carbonReduction = gesReduction + evReduction + effReduction + wasteReduction;
  const newEmission = Math.max(0, baselineEmission - carbonReduction);

  // OPEX Savings & ROI
  const gesSavings = activeGesBudget * 0.18;
  const evSavings = activeEvCount * 55000;
  const effSavings = activeEffBudget * 0.24;
  const wasteSavings = activeWasteBudget * 0.20;
  const annualOpexSavings = gesSavings + evSavings + effSavings + wasteSavings;

  const annualCarbonTaxAvoided = carbonReduction * 25 * 32.5; // Carbon tax mock
  const totalAnnualReturns = annualOpexSavings + annualCarbonTaxAvoided;
  const groiPayback = totalCapex > 0 && totalAnnualReturns > 0 ? (totalCapex / totalAnnualReturns).toFixed(1) : '0';

  // Credit Scoring
  const ratingScores: any = {
    "AAA": 40.0, "AA": 37.0, "A": 34.0, "BBB": 30.0, "BB": 24.0, "B": 18.0, "C": 10.0
  };
  const financialScore = ratingScores[financialRating] || 30.0;
  const reductionPct = baselineEmission > 0 ? (carbonReduction / baselineEmission) * 100 : 0;
  const environmentalScore = Math.min(40.0, reductionPct * 0.8);
  const cashFlowScore = totalCapex > 0 ? (Number(groiPayback) <= loanYears ? 20.0 : Math.max(0.0, 20.0 * (loanYears / Number(groiPayback)))) : 10.0;
  
  let financialModifier = 0.0;
  if (totalCapex > 0 && loanAmount > totalCapex) {
    financialModifier = -20.0; // warning
  }

  const greenCreditScore = Math.min(100, Math.max(0, Math.round(financialScore + environmentalScore + cashFlowScore + financialModifier)));

  let decision = "REDDEDİLDİ";
  let decisionColor = "#EF4444";
  if (greenCreditScore >= 80) {
    decision = "ONAYLANDI";
    decisionColor = "#10B981";
  } else if (greenCreditScore >= 50) {
    decision = "KOŞULLU ONAY";
    decisionColor = "#F59E0B";
  }

  const discountPct = greenCreditScore >= 50 ? Math.min(1.5, (greenCreditScore / 100) * 1.5).toFixed(2) : '0.00';

  const handleStartAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
      setStep(2);
    }, 1500);
  };

  return (
    <LinearGradient
      colors={['#0B1120', '#162032', '#090D16']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerSubtitle}>MODEL C SIMULATOR</Text>
            <Text style={styles.headerTitle}>Yeşil Kredi Sihirbazı</Text>
          </View>

          {/* Steps Progress bar */}
          <View style={styles.stepBar}>
            {[1, 2, 3].map((s) => (
              <View key={s} style={styles.stepItem}>
                <View style={[
                  styles.stepDot,
                  step === s && styles.stepDotActive,
                  step > s && styles.stepDotCompleted
                ]}>
                  {step > s ? <Check size={12} color="#FFFFFF" /> : <Text style={styles.stepText}>{s}</Text>}
                </View>
                <Text style={[styles.stepLabel, step === s && styles.stepLabelActive]}>
                  {s === 1 ? 'Ekolojik' : s === 2 ? 'Finansal' : 'Yatırımlar'}
                </Text>
              </View>
            ))}
          </View>

          {/* Step 1: Ekolojik Beyan */}
          {step === 1 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Sparkles size={18} color="#10B981" />
                <Text style={styles.cardTitle}>1. Şirket Faaliyet Beyanı</Text>
              </View>

              {/* Template Buttons */}
              <View style={styles.templateRow}>
                {TEMPLATES.map((tmpl, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.templateBtn,
                      inputText === tmpl.text && styles.templateBtnActive
                    ]}
                    onPress={() => setInputText(tmpl.text)}
                  >
                    <Text style={[
                      styles.templateBtnText,
                      inputText === tmpl.text && styles.templateBtnTextActive
                    ]}>{tmpl.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Text Input */}
              <TextInput
                style={styles.textArea}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Şirketinizin lojistik, üretim hammaddesi ve aylık enerji tüketim beyanını buraya yazın..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
              />

              <TouchableOpacity
                style={[styles.primaryActionBtn, !inputText.trim() && { opacity: 0.5 }]}
                disabled={!inputText.trim() || analyzing}
                onPress={handleStartAnalysis}
              >
                {analyzing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryActionText}>YZ Faaliyet Analizini Başlat</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Finansal Girdiler */}
          {step === 2 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Award size={18} color="#3B82F6" />
                <Text style={styles.cardTitle}>2. Finansal Kredi Talebi</Text>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Kredi Miktarı (TL)</Text>
                <TextInput
                  style={styles.textInput}
                  value={String(loanAmount)}
                  keyboardType="numeric"
                  onChangeText={(txt) => setLoanAmount(parseInt(txt) || 0)}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Geleneksel Kredi Risk Notu</Text>
                <View style={styles.ratingRow}>
                  {['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C'].map(rating => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingBtn,
                        financialRating === rating && styles.ratingBtnActive
                      ]}
                      onPress={() => setFinancialRating(rating)}
                    >
                      <Text style={[
                        styles.ratingBtnText,
                        financialRating === rating && styles.ratingBtnTextActive
                      ]}>{rating}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={styles.fieldLabel}>Vade (Yıl)</Text>
                  <Text style={styles.fieldValueBold}>{loanYears} Yıl</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[1, 3, 5, 7, 10, 15].map(y => (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.vadeBtn,
                        loanYears === y && styles.vadeBtnActive
                      ]}
                      onPress={() => setLoanYears(y)}
                    >
                      <Text style={[
                        styles.vadeText,
                        loanYears === y && styles.vadeTextActive
                      ]}>{y}y</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.footerNav}>
                <TouchableOpacity onPress={() => setStep(1)} style={styles.prevBtn}>
                  <Text style={styles.prevText}>Geri</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep(3)} style={styles.nextBtn}>
                  <Text style={styles.nextText}>İlerle</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3: Yeşil Senaryolar */}
          {step === 3 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Leaf size={18} color="#10B981" />
                <Text style={styles.cardTitle}>3. Yeşil Yatırım Bütçeleri</Text>
              </View>

              <View style={{ gap: 14 }}>
                {/* GES */}
                <View style={[styles.scenarioCard, gesChecked && styles.scenarioCardActive]}>
                  <TouchableOpacity 
                    style={styles.scenarioHeader} 
                    onPress={() => setGesChecked(!gesChecked)}
                  >
                    <View style={[styles.checkbox, gesChecked && styles.checkboxActive]}>
                      {gesChecked && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                    <Text style={styles.scenarioTitleText}>Güneş Enerjisi Santrali (GES)</Text>
                  </TouchableOpacity>
                  {gesChecked && (
                    <View style={{ marginTop: 12, gap: 6 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.sliderLabel}>Yatırım Bütçesi (CAPEX)</Text>
                        <Text style={styles.sliderVal}>{gesBudget.toLocaleString()} TL</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                        {[300000, 600000, 1200000, 2000000, 4000000].map(val => (
                          <TouchableOpacity
                            key={val}
                            style={[styles.miniBudgetBtn, gesBudget === val && styles.miniBudgetBtnActive]}
                            onPress={() => setGesBudget(val)}
                          >
                            <Text style={[styles.miniBudgetText, gesBudget === val && styles.miniBudgetTextActive]}>{(val/1000).toFixed(0)}k</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                {/* EV */}
                <View style={[styles.scenarioCard, evChecked && styles.scenarioCardActive]}>
                  <TouchableOpacity 
                    style={styles.scenarioHeader} 
                    onPress={() => setEvChecked(!evChecked)}
                  >
                    <View style={[styles.checkbox, evChecked && styles.checkboxActive]}>
                      {evChecked && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                    <Text style={styles.scenarioTitleText}>Elektrikli Taşıt Filosu (EV)</Text>
                  </TouchableOpacity>
                  {evChecked && (
                    <View style={{ marginTop: 12, gap: 6 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.sliderLabel}>Araç Sayısı (450k TL / adet)</Text>
                        <Text style={styles.sliderVal}>{evCount} Adet</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        {[1, 2, 3, 5, 10, 15].map(val => (
                          <TouchableOpacity
                            key={val}
                            style={[styles.miniBudgetBtn, evCount === val && styles.miniBudgetBtnActive]}
                            onPress={() => setEvCount(val)}
                          >
                            <Text style={[styles.miniBudgetText, evCount === val && styles.miniBudgetTextActive]}>{val}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                {/* Energy Efficiency */}
                <View style={[styles.scenarioCard, effChecked && styles.scenarioCardActive]}>
                  <TouchableOpacity 
                    style={styles.scenarioHeader} 
                    onPress={() => setEffChecked(!effChecked)}
                  >
                    <View style={[styles.checkbox, effChecked && styles.checkboxActive]}>
                      {effChecked && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                    <Text style={styles.scenarioTitleText}>Tesis Enerji Verimliliği</Text>
                  </TouchableOpacity>
                  {effChecked && (
                    <View style={{ marginTop: 12, gap: 6 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.sliderLabel}>Enerji Tasarruf CAPEX</Text>
                        <Text style={styles.sliderVal}>{effBudget.toLocaleString()} TL</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                        {[100000, 200000, 400000, 750000].map(val => (
                          <TouchableOpacity
                            key={val}
                            style={[styles.miniBudgetBtn, effBudget === val && styles.miniBudgetBtnActive]}
                            onPress={() => setEffBudget(val)}
                          >
                            <Text style={[styles.miniBudgetText, effBudget === val && styles.miniBudgetTextActive]}>{(val/1000).toFixed(0)}k</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.footerNav}>
                <TouchableOpacity onPress={() => setStep(2)} style={styles.prevBtn}>
                  <Text style={styles.prevText}>Geri</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep(3)} style={styles.nextBtn}>
                  <Text style={styles.nextText}>Yenile</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Result Card (Visible on Step 2 and Step 3 if analyzed) */}
          {analyzed && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>Kredi Karar Raporu</Text>
                <View style={[styles.decisionBadge, { backgroundColor: `${decisionColor}15` }]}>
                  <Text style={[styles.decisionText, { color: decisionColor }]}>{decision}</Text>
                </View>
              </View>

              <View style={styles.resultGrid}>
                {/* Score */}
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Yeşil Kredi Skoru</Text>
                  <Text style={styles.resultValue}>{greenCreditScore} <Text style={{ fontSize: 11, color: '#9CA3AF' }}>/100</Text></Text>
                </View>

                {/* Faiz İndirimi */}
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Faiz İndirimi</Text>
                  <Text style={[styles.resultValue, { color: '#D4AF37' }]}>-%{discountPct}</Text>
                </View>

                {/* g-ROI Payback */}
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>g-ROI Amortisman</Text>
                  <Text style={styles.resultValue}>{groiPayback} Yıl</Text>
                </View>

                {/* Karbon Azaltımı */}
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Karbon Azaltımı</Text>
                  <Text style={[styles.resultValue, { color: '#10B981' }]}>{carbonReduction.toFixed(1)}t <Text style={{ fontSize: 10, color: '#9CA3AF' }}>CO₂e</Text></Text>
                </View>
              </View>

              {/* Warning if Loan exceeds Capex */}
              {loanAmount > totalCapex && totalCapex > 0 && (
                <View style={styles.limitWarning}>
                  <ShieldAlert size={14} color="#EF4444" />
                  <Text style={styles.limitWarningText}>
                    Talep edilen kredi yeşil CAPEX bütçesini ({totalCapex.toLocaleString()} TL) aşıyor!
                  </Text>
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
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  stepBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 24,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stepDotActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  stepDotCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  stepLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  templateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  templateBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
  },
  templateBtnActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  templateBtnText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  templateBtnTextActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  textArea: {
    height: 140,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    color: '#FFFFFF',
    padding: 14,
    fontSize: 13,
    lineHeight: 18,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  primaryActionBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fieldContainer: {
    gap: 8,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  fieldValueBold: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
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
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  ratingBtn: {
    flex: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  ratingBtnText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  ratingBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  vadeBtn: {
    flex: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vadeBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  vadeText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  vadeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scenarioCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 12,
  },
  scenarioCardActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scenarioTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  sliderLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  sliderVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  miniBudgetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  miniBudgetBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  miniBudgetText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  miniBudgetTextActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  decisionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  decisionText: {
    fontSize: 9,
    fontWeight: '800',
  },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  resultItem: {
    width: (width - 72) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
  },
  resultLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
  },
  limitWarningText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '600',
    flex: 1,
  },
  footerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  prevBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  prevText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  nextText: {
    fontSize: 13,
    color: '#0B1120',
    fontWeight: '700',
  },
});
