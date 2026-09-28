import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Dimensions, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Download, QrCode, ShieldCheck, Copy, Check, RefreshCw, 
  Building, Globe, Award, ChevronDown, ChevronUp, Lock, 
  CheckCircle2, FileText, AlertCircle
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function TsrsReportScreen() {
  const [activeTab, setActiveTab] = useState('summary');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const hashID = "0x8f4b2c1d9a7e635489b0cf34d2a1b9e84cd54ef92a0134f7b2c9f8021d7b322a";

  const handleExport = () => {
    setIsExporting(true);
    setExportProgress(0);
  };

  useEffect(() => {
    let interval: any;
    if (isExporting && exportProgress < 100) {
      interval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsExporting(false);
            }, 2000);
            return 100;
          }
          return prev + 10;
        });
      }, 1500 / 10); // 1.5 seconds total
    }
    return () => clearInterval(interval);
  }, [isExporting, exportProgress]);

  const handleVerify = () => {
    setIsVerifying(true);
    setVerificationSuccess(false);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationSuccess(true);
    }, 1500);
  };

  const copyHash = () => {
    if (Platform.OS === 'web') {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(hashID);
      }
    } else {
      Clipboard.setString(hashID);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const tabs = [
    { id: 'summary', name: 'Özet' },
    { id: 'tsrs1', name: 'TSRS-1' },
    { id: 'tsrs2', name: 'TSRS-2' },
    { id: 'emissions', name: 'Emisyon' }
  ];

  return (
    <LinearGradient
      colors={['#0B1120', '#162032', '#090D16']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSubtitle}>TSRS & YEŞİL PASAPORT</Text>
              <Text style={styles.headerTitle}>Raporlama ve Doğrulama</Text>
            </View>
          </View>

          {/* Export PDF Action Button */}
          <TouchableOpacity 
            style={[styles.exportButton, isExporting && styles.exportButtonDisabled]} 
            onPress={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <View style={styles.btnRow}>
                <ActivityIndicator size="small" color="#022c22" />
                <Text style={styles.exportButtonText}>Rapor Üretiliyor (%{exportProgress})</Text>
              </View>
            ) : (
              <View style={styles.btnRow}>
                <Download size={18} color="#022c22" />
                <Text style={styles.exportButtonText}>Resmi Dışa Aktar (PDF)</Text>
              </View>
            )}
            {isExporting && (
              <View style={[styles.progressBar, { width: `${exportProgress}%` }]} />
            )}
          </TouchableOpacity>

          {/* Export Success Banner */}
          {exportProgress === 100 && (
            <View style={styles.successBanner}>
              <CheckCircle2 size={18} color="#10B981" />
              <Text style={styles.successBannerText}>
                TSRS Raporu derlendi ve blockchain onaylı resmi PDF indirildi.
              </Text>
            </View>
          )}

          {/* Green Credit Passport */}
          <View style={styles.passportCard}>
            <LinearGradient
              colors={['#022c22', '#111827']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.passportGradient}
            >
              {/* Glowing Highlights */}
              <View style={styles.glowTop} />
              <View style={styles.glowBottom} />

              {/* Verification radar overlay */}
              {isVerifying && (
                <View style={styles.verifyOverlay}>
                  <ActivityIndicator size="large" color="#D4AF37" />
                  <Text style={styles.verifyOverlayText}>Kriptografik İmza Denetleniyor...</Text>
                </View>
              )}

              {/* Passport Header */}
              <View style={styles.passportHeader}>
                <View>
                  <Text style={styles.passportTitle}>Yeşil Kredi Pasaportu</Text>
                  <Text style={styles.passportSubtitle}>ECOFIN VERIFIED ENTERPRISE</Text>
                </View>
                <View style={styles.qrIconWrapper}>
                  <QrCode size={38} color="#FFFFFF" />
                </View>
              </View>

              {/* Hash Display */}
              <View style={styles.hashSection}>
                <Text style={styles.hashLabel}>Kriptografik Doğrulama Kodu (Hash)</Text>
                <View style={styles.hashRow}>
                  <Text style={styles.hashValue} numberOfLines={1} ellipsizeMode="middle">
                    {hashID}
                  </Text>
                  <TouchableOpacity onPress={copyHash} style={styles.copyBtn}>
                    {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} color="#9CA3AF" />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Passport Footer */}
              <View style={styles.passportFooter}>
                <View style={styles.statusWrapper}>
                  <View style={[
                    styles.statusIndicator, 
                    { backgroundColor: verificationSuccess ? '#10B981' : '#D4AF37' }
                  ]} />
                  <Text style={styles.statusText}>
                    {verificationSuccess ? "İmza Geçerli (KGK Onaylı)" : "Pasaport Aktif"}
                  </Text>
                </View>

                <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify}>
                  <Text style={styles.verifyBtnText}>İmza Doğrula</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Interactive Report View */}
          <View style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportCategory}>Resmi Uyum Belgesi</Text>
              <Text style={styles.reportTitle}>TSRS Sürdürülebilirlik Beyanı</Text>
              <View style={styles.reportMetadataRow}>
                <Text style={styles.reportMetadataText}>Dönem: 2026/Yıllık</Text>
                <Text style={styles.reportMetadataText}>Yayın: 23 Mayıs 2026</Text>
              </View>
            </View>

            {/* Custom Tab Selector */}
            <View style={styles.tabBar}>
              {tabs.map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                    {tab.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            {/* Report Content */}
            <View style={styles.reportContent}>
              {activeTab === 'summary' && (
                <View style={styles.tabContent}>
                  <View style={styles.contentSectionHeader}>
                    <Building size={16} color="#10B981" />
                    <Text style={styles.contentSectionTitle}>1. Yönetici Özeti ve Profil</Text>
                  </View>
                  <Text style={styles.paragraph}>
                    Bu rapor, Kamu Gözetimi Kurumu (KGK) tarafından yayınlanan Türkiye Sürdürülebilirlik Raporlama Standartları (TSRS) ile tam uyumlu olarak üretilmiştir.
                  </Text>

                  {/* Summary Grid stats */}
                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxLabel}>ESG Derecesi</Text>
                      <Text style={[styles.statBoxValue, { color: '#10B981' }]}>A+</Text>
                      <Text style={styles.statBoxSub}>Çok Yüksek</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxLabel}>Karbon Y.</Text>
                      <Text style={styles.statBoxValue}>-%24</Text>
                      <Text style={styles.statBoxSub}>Yıllık Azaltım</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxLabel}>Kredi Skoru</Text>
                      <Text style={[styles.statBoxValue, { color: '#D4AF37' }]}>94</Text>
                      <Text style={styles.statBoxSub}>Fonlama Limiti</Text>
                    </View>
                  </View>

                  <View style={styles.calloutBox}>
                    <Text style={styles.calloutTitle}>Kritik Beyan:</Text>
                    <Text style={styles.calloutText}>
                      Şirketin doğrudan operasyonel emisyonları (Kapsam 1) ve satın alınan enerji kaynaklı dolaylı emisyonları (Kapsam 2) son 12 ayda planlanan azaltım rotasına uygun ilerleme göstermiştir.
                    </Text>
                  </View>
                </View>
              )}

              {activeTab === 'tsrs1' && (
                <View style={styles.tabContent}>
                  <View style={styles.contentSectionHeader}>
                    <Award size={16} color="#10B981" />
                    <Text style={styles.contentSectionTitle}>TSRS-1 Genel Hükümler</Text>
                  </View>
                  <Text style={styles.paragraph}>
                    TSRS 1 standardı kapsamında, şirketin karşı karşıya olduğu sürdürülebilirlikle ilgili risklerin ve fırsatların yatırımcı kararlarını nasıl etkilediği beyan edilmiştir.
                  </Text>

                  <View style={styles.checklist}>
                    <View style={styles.checkItem}>
                      <CheckCircle2 size={16} color="#10B981" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.checkTitle}>Yönetişim Yapısı</Text>
                        <Text style={styles.checkDesc}>Sürdürülebilirlik Komitesi kurulmuş ve aylık denetimler yapılmaktadır.</Text>
                      </View>
                    </View>

                    <View style={styles.checkItem}>
                      <CheckCircle2 size={16} color="#10B981" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.checkTitle}>Stratejik Karar Mekanizmaları</Text>
                        <Text style={styles.checkDesc}>Sürdürülebilirlik riskleri şirketin genel risk yönetim matrisine %100 entegredir.</Text>
                      </View>
                    </View>

                    <View style={styles.checkItem}>
                      <CheckCircle2 size={16} color="#10B981" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.checkTitle}>Finansal Planlama Uyum Matrisi</Text>
                        <Text style={styles.checkDesc}>Sürdürülebilirlik hedefleri, şirketin 3 ve 5 yıllık bütçe planlarına yansıtılmıştır.</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {activeTab === 'tsrs2' && (
                <View style={styles.tabContent}>
                  <View style={styles.contentSectionHeader}>
                    <Globe size={16} color="#10B981" />
                    <Text style={styles.contentSectionTitle}>TSRS-2 İklim Beyanları</Text>
                  </View>
                  <Text style={styles.paragraph}>
                    İklim değişikliği kaynaklı geçiş riskleri (karbon vergileri, piyasa dönüşümleri) ve fiziksel riskler senaryo analizleri ile modellendirilmiştir.
                  </Text>

                  <View style={styles.twoColumn}>
                    <View style={styles.riskCard}>
                      <Text style={styles.riskTitle}>Geçiş Riskleri</Text>
                      <Text style={styles.riskText}>• SKDM Karbon vergisi maliyet artışları.</Text>
                      <Text style={styles.riskText}>• Lojistik tedarik zinciri kısıtlamaları.</Text>
                    </View>
                    <View style={styles.opportunityCard}>
                      <Text style={styles.opportunityTitle}>Fırsatlar</Text>
                      <Text style={styles.opportunityText}>• GES ile elektrik giderlerinde %40 tasarruf.</Text>
                      <Text style={styles.opportunityText}>• Yeşil kredi faiz indirimi avantajı.</Text>
                    </View>
                  </View>
                </View>
              )}

              {activeTab === 'emissions' && (
                <View style={styles.tabContent}>
                  <View style={styles.contentSectionHeader}>
                    <FileText size={16} color="#10B981" />
                    <Text style={styles.contentSectionTitle}>Emisyon Dağılım Tablosu</Text>
                  </View>
                  <Text style={styles.paragraph}>
                    Şirketin GHG Protokolü standardına göre hesaplanan sera gazı emisyonlarının kategorik dökümü aşağıdaki gibidir.
                  </Text>

                  <View style={styles.emissionRows}>
                    {/* Kapsam 1 */}
                    <View style={styles.emissionItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.emissionName}>Kapsam 1 (Doğrudan Tesis)</Text>
                        <Text style={styles.emissionTrendText}>Rotaya Uyumlu • Yıllık Azaltım: -%18</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.emissionValue}>120.4 t</Text>
                        <View style={styles.statusBadgeGreen}>
                          <Text style={styles.statusBadgeTextGreen}>ONAYLI</Text>
                        </View>
                      </View>
                    </View>

                    {/* Kapsam 2 */}
                    <View style={styles.emissionItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.emissionName}>Kapsam 2 (Dolaylı Enerji)</Text>
                        <Text style={styles.emissionTrendText}>Enerji Verimliliği • Yıllık Azaltım: -%31</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.emissionValue}>85.2 t</Text>
                        <View style={styles.statusBadgeGreen}>
                          <Text style={styles.statusBadgeTextGreen}>ONAYLI</Text>
                        </View>
                      </View>
                    </View>

                    {/* Kapsam 3 */}
                    <View style={styles.emissionItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.emissionName}>Kapsam 3 (Değer Zinciri)</Text>
                        <Text style={styles.emissionTrendText}>Tedarikçi Beyanı • Yıllık Değişim: +%2</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.emissionValue}>340.5 t</Text>
                        <View style={styles.statusBadgeYellow}>
                          <Text style={styles.statusBadgeTextYellow}>HESAPLANDI</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Signature Box */}
            <View style={styles.signatureBox}>
              <View>
                <Text style={styles.sigLabel}>DIJITAL BLOKZINCIR İMZASI</Text>
                <View style={styles.sigRow}>
                  <Lock size={12} color="#10B981" />
                  <Text style={styles.sigAuthor}>EcoFin AI Entegrasyonu</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.sigVerifyText}>KGK Bağımsız Denetçi Uyumlu</Text>
                <Text style={styles.sigHash}>Hash ID: {hashID.slice(0, 10)}...</Text>
              </View>
            </View>
          </View>

          {/* Audit Expandable Sections */}
          <View style={styles.accordionContainer}>
            <Text style={styles.accordionMainTitle}>Denetim ve Güvence Durumu</Text>
            
            {/* Section 1 */}
            <View style={styles.accordionCard}>
              <TouchableOpacity 
                style={styles.accordionHeader}
                onPress={() => toggleSection('sec1')}
              >
                <View style={styles.accordionHeaderTitleWrapper}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <Text style={styles.accordionTitle}>TSRS-1 Genel Hükümler</Text>
                </View>
                {expandedSection === 'sec1' ? <ChevronUp size={16} color="#E5E7EB" /> : <ChevronDown size={16} color="#9CA3AF" />}
              </TouchableOpacity>
              {expandedSection === 'sec1' && (
                <View style={styles.accordionContent}>
                  <Text style={styles.accordionText}><Text style={{ fontWeight: 'bold' }}>Denetim Standardı:</Text> KGK TSRS-1 Genel İlkeleri</Text>
                  <Text style={styles.accordionText}><Text style={{ fontWeight: 'bold' }}>Doğrulama Kaynağı:</Text> Şirket Beyannamesi & Yönetici Karar Defterleri</Text>
                  <Text style={styles.accordionText}><Text style={{ fontWeight: 'bold' }}>Son Kontrol:</Text> 23.05.2026 14:32 (EcoFin AI Entegrasyonu ile)</Text>
                </View>
              )}
            </View>

            {/* Section 2 */}
            <View style={styles.accordionCard}>
              <TouchableOpacity 
                style={styles.accordionHeader}
                onPress={() => toggleSection('sec2')}
              >
                <View style={styles.accordionHeaderTitleWrapper}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <Text style={styles.accordionTitle}>TSRS-2 İklim Riskleri</Text>
                </View>
                {expandedSection === 'sec2' ? <ChevronUp size={16} color="#E5E7EB" /> : <ChevronDown size={16} color="#9CA3AF" />}
              </TouchableOpacity>
              {expandedSection === 'sec2' && (
                <View style={styles.accordionContent}>
                  <Text style={styles.accordionText}><Text style={{ fontWeight: 'bold' }}>Denetim Standardı:</Text> KGK TSRS-2 İklim ve Risk Beyanları</Text>
                  <Text style={styles.accordionText}><Text style={{ fontWeight: 'bold' }}>Doğrulama Kaynağı:</Text> IoT Enerji Analizörleri & Elektrik Faturaları (e-Fatura Entegre)</Text>
                  <Text style={styles.accordionText}><Text style={{ fontWeight: 'bold' }}>Son Kontrol:</Text> 23.05.2026 14:32</Text>
                </View>
              )}
            </View>

            {/* Section 3 */}
            <View style={styles.accordionCard}>
              <TouchableOpacity 
                style={styles.accordionHeader}
                onPress={() => toggleSection('sec3')}
              >
                <View style={styles.accordionHeaderTitleWrapper}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <Text style={styles.accordionTitle}>Sektörel Limit Uyumu</Text>
                </View>
                {expandedSection === 'sec3' ? <ChevronUp size={16} color="#E5E7EB" /> : <ChevronDown size={16} color="#9CA3AF" />}
              </TouchableOpacity>
              {expandedSection === 'sec3' && (
                <View style={styles.accordionContent}>
                  <Text style={styles.accordionText}><Text style={{ fontWeight: 'bold' }}>Denetim Standardı:</Text> İlgili NACE Kodu Sektör Limit Kıyaslamaları</Text>
                  <Text style={styles.accordionText}><Text style={{ fontWeight: 'bold' }}>Doğrulama Kaynağı:</Text> EcoFin Sektörel Kıyaslama Algoritması</Text>
                  <Text style={styles.accordionText}><Text style={{ fontWeight: 'bold' }}>Son Kontrol:</Text> 23.05.2026 14:32</Text>
                </View>
              )}
            </View>
          </View>

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
    paddingBottom: 60,
  },
  header: {
    marginBottom: 20,
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
  exportButton: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  exportButtonDisabled: {
    opacity: 0.8,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportButtonText: {
    color: '#022c22',
    fontWeight: '700',
    fontSize: 14,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 4,
    backgroundColor: '#D4AF37',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 20,
  },
  successBannerText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    flex: 1,
  },
  passportCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  passportGradient: {
    padding: 24,
    minHeight: 230,
    position: 'relative',
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  verifyOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 44, 34, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: 12,
  },
  verifyOverlayText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  passportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  passportTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  passportSubtitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  qrIconWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  hashSection: {
    marginBottom: 20,
  },
  hashLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  hashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'space-between',
  },
  hashValue: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'CourierNewPSMT', android: 'monospace', web: 'monospace' }),
    flex: 1,
    marginRight: 8,
  },
  copyBtn: {
    padding: 4,
  },
  passportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '700',
  },
  verifyBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  verifyBtnText: {
    color: '#022c22',
    fontWeight: '800',
    fontSize: 11,
  },
  reportCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  reportHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 16,
    marginBottom: 16,
  },
  reportCategory: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  reportTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
  },
  reportMetadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  reportMetadataText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: '#0B1120',
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  reportContent: {
    minHeight: 220,
  },
  tabContent: {
    gap: 12,
  },
  contentSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  contentSectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  paragraph: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statBoxLabel: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 4,
  },
  statBoxValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statBoxSub: {
    color: '#6B7280',
    fontSize: 8,
    marginTop: 2,
    fontWeight: '500',
  },
  calloutBox: {
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
  },
  calloutTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  calloutText: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 16,
  },
  checklist: {
    gap: 12,
    marginTop: 4,
  },
  checkItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  checkTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  checkDesc: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  riskCard: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  riskTitle: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  riskText: {
    color: '#9CA3AF',
    fontSize: 10,
    lineHeight: 14,
  },
  opportunityCard: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  opportunityTitle: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  opportunityText: {
    color: '#9CA3AF',
    fontSize: 10,
    lineHeight: 14,
  },
  emissionRows: {
    gap: 10,
    marginTop: 6,
  },
  emissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  emissionName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emissionTrendText: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 2,
  },
  emissionValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  statusBadgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  statusBadgeTextGreen: {
    color: '#10B981',
    fontSize: 8,
    fontWeight: '800',
  },
  statusBadgeYellow: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  statusBadgeTextYellow: {
    color: '#F59E0B',
    fontSize: 8,
    fontWeight: '800',
  },
  signatureBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  sigLabel: {
    color: '#6B7280',
    fontSize: 9,
    fontWeight: '700',
  },
  sigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sigAuthor: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  sigVerifyText: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '500',
  },
  sigHash: {
    color: '#6B7280',
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
  },
  accordionContainer: {
    gap: 10,
  },
  accordionMainTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginVertical: 10,
  },
  accordionCard: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  accordionHeaderTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accordionTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  accordionContent: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    gap: 6,
  },
  accordionText: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 15,
  },
}) as any;
