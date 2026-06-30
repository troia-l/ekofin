import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { safeStorage } from '@/utils/storage';
import { 
  FileText, CheckCircle2, RefreshCw, UploadCloud, 
  AlertTriangle, Leaf, Users, Car, Zap, Droplet, Check
} from 'lucide-react-native';

export default function IntegrationScreen() {
  const router = useRouter();
  const [declarationData, setDeclarationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { status: string; date: string }>>({});

  // Load declaration from AsyncStorage on focus
  const loadDeclarationData = async () => {
    try {
      const data = await safeStorage.getItem('manager_declaration');
      if (data) {
        setDeclarationData(JSON.parse(data));
      } else {
        setDeclarationData(null);
      }
      
      const docsSaved = await safeStorage.getItem('uploaded_documents');
      if (docsSaved) {
        setUploadedDocs(JSON.parse(docsSaved));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDoc = async (docId: string) => {
    setUploadingDocId(docId);
    setTimeout(async () => {
      const now = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
      const updated = { ...uploadedDocs, [docId]: { status: 'verified', date: now } };
      setUploadedDocs(updated);
      await safeStorage.setItem('uploaded_documents', JSON.stringify(updated));
      setUploadingDocId(null);
    }, 1500);
  };

  useEffect(() => {
    loadDeclarationData();
    // Simulate refetching when navigating back
    const interval = setInterval(loadDeclarationData, 1500);
    return () => clearInterval(interval);
  }, [uploadedDocs]);

  const getTotalVehicles = (): number => {
    if (!declarationData || !declarationData.vehiclesCount) return 0;
    return (Object.values(declarationData.vehiclesCount) as number[]).reduce((a: number, b: number) => a + b, 0);
  };

  const getDocStatus = (id: string) => {
    if (id === 'declaration') {
      return declarationData ? 'verified_decl' : 'fill_decl';
    }
    return uploadedDocs[id]?.status || 'upload';
  };

  const getDocDate = (id: string) => {
    if (id === 'declaration') {
      return declarationData ? 'Güncel' : '-';
    }
    return uploadedDocs[id]?.date || '-';
  };

  const docs = [
    { id: 'sgk', title: 'SGK Hizmet Dökümleri', desc: 'Personel sayısı doğrulaması için', status: getDocStatus('sgk'), date: getDocDate('sgk') },
    { id: 'declaration', title: 'Yönetici Beyan Formu', desc: 'Şirket araç, çalışan ve ÇYS beyanı', status: getDocStatus('declaration'), date: getDocDate('declaration') },
    { id: 'sanayi', title: 'Sanayi Sicil Belgesi', desc: 'Resmi kapasite ve NACE kod onayı', status: getDocStatus('sanayi'), date: getDocDate('sanayi') },
    { id: 'kapasite', title: 'Kapasite Raporu (TOBB)', desc: 'Üretim limitleri doğrulaması', status: getDocStatus('kapasite'), date: getDocDate('kapasite') },
    { id: 'ekb', title: 'Enerji Kimlik Belgesi (EKB)', desc: 'Tesis enerji verimlilik kanıtı', status: getDocStatus('ekb'), date: getDocDate('ekb') },
    { id: 'iso', title: 'ISO 14001 Çevre YYS', desc: 'Çevre yönetim sistemi sertifikası', status: getDocStatus('iso'), date: getDocDate('iso') }
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
            <Text style={styles.headerSubtitle}>TSRS & FİNANS VERİ HAVUZU</Text>
            <Text style={styles.headerTitle}>Veri Entegrasyonu</Text>
          </View>

          {/* Left Column Web Widget -> Mobile Top Widget (Management Declaration Summary) */}
          {declarationData && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Leaf size={18} color="#10B981" />
                  <Text style={styles.summaryTitle}>Aktif Yönetici Beyan Özeti</Text>
                </View>
                <Text style={styles.summaryStatusText}>İşlendi</Text>
              </View>

              <View style={styles.summaryGrid}>
                {/* Stats 1 */}
                <View style={styles.summaryStatItem}>
                  <Text style={styles.statLabel}>Sosyal Yapı</Text>
                  <Text style={styles.statValue}>{declarationData.employeeCount} Çalışan</Text>
                  <Text style={styles.statSub}>+{declarationData.extraExcuseLeave} Gün İzin</Text>
                </View>

                {/* Stats 2 */}
                <View style={styles.summaryStatItem}>
                  <Text style={styles.statLabel}>Taşıt Filosu</Text>
                  <Text style={styles.statValue}>{getTotalVehicles()} Araç</Text>
                  <Text style={styles.statSub} numberOfLines={1}>
                    ⚡{declarationData.vehiclesCount.electric} / 🌱{declarationData.vehiclesCount.hybrid}
                  </Text>
                </View>

                {/* Stats 3 */}
                <View style={styles.summaryStatItem}>
                  <Text style={styles.statLabel}>Tüketim</Text>
                  <Text style={styles.statValue}>{declarationData.annualElectricity.toLocaleString()} kWh</Text>
                  <Text style={styles.statSub}>💧{declarationData.annualWater}m³ Su</Text>
                </View>
              </View>

              <View style={styles.summaryFooter}>
                <Check size={14} color="#10B981" />
                <Text style={styles.summaryFooterText} numberOfLines={1}>
                  ÇYS Beyanı: {declarationData.hasEmsPolicy === 'yes' ? 'Mevcut (ISO 14001)' : declarationData.hasEmsPolicy === 'planning' ? 'Hazırlanıyor' : 'Mevcut Değil'}
                </Text>
              </View>

              {/* Hemen Oluştur (YZ) Warning Banner */}
              {declarationData.hasEmsPolicy !== 'yes' && (
                <View style={styles.warningBanner}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <AlertTriangle size={16} color="#F59E0B" />
                    <Text style={styles.warningText} numberOfLines={1}>ÇYS Politikası Belgesi Eksik!</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.warningBtn}
                    onPress={() => router.push({ pathname: '/declaration', params: { mode: 'ai_generator' } })}
                  >
                    <Text style={styles.warningBtnText}>Hemen Oluştur (YZ)</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Legal Documents Section Title */}
          <Text style={styles.sectionTitle}>TSRS Denetim Dokümanları</Text>

          {/* Documents List */}
          <View style={styles.docList}>
            {docs.map((doc, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.docItem,
                  (doc.status === 'verified' || doc.status === 'verified_decl') && styles.docItemVerified
                ]}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <Text style={styles.docDesc}>{doc.desc}</Text>
                </View>

                <View style={styles.docActionContainer}>
                  {doc.status === 'verified' && (
                    <View style={styles.statusVerifiedBadge}>
                      <CheckCircle2 size={12} color="#10B981" />
                      <Text style={styles.statusVerifiedText}>ONAYLI</Text>
                    </View>
                  )}

                  {doc.status === 'verified_decl' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={styles.statusVerifiedBadge}>
                        <CheckCircle2 size={12} color="#10B981" />
                        <Text style={styles.statusVerifiedText}>BEYAN EDİLDİ</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.editBtn}
                        onPress={() => router.push({ pathname: '/declaration', params: { mode: 'wizard' } })}
                      >
                        <Text style={styles.editBtnText}>Düzenle</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {doc.status === 'fill_decl' && (
                    <TouchableOpacity 
                      style={styles.fillBtn}
                      onPress={() => router.push({ pathname: '/declaration', params: { mode: 'wizard' } })}
                    >
                      <Text style={styles.fillBtnText}>Doldur</Text>
                    </TouchableOpacity>
                  )}

                  {doc.status === 'pending' && (
                    <View style={styles.statusPendingBadge}>
                      <RefreshCw size={12} color="#F59E0B" />
                      <Text style={styles.statusPendingText}>İNCELEMEDE</Text>
                    </View>
                  )}

                  {doc.status === 'upload' && (
                    <TouchableOpacity 
                      style={styles.uploadBtn}
                      disabled={uploadingDocId !== null}
                      onPress={() => handleUploadDoc(doc.id)}
                    >
                      {uploadingDocId === doc.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
                      ) : (
                        <UploadCloud size={14} color="#FFFFFF" />
                      )}
                      <Text style={styles.uploadBtnText}>
                        {uploadingDocId === doc.id ? 'Yükleniyor...' : 'Yükle'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {doc.status !== 'upload' && doc.status !== 'fill_decl' && doc.status !== 'verified_decl' && (
                    <Text style={styles.docDate}>{doc.date}</Text>
                  )}
                  {doc.status === 'verified_decl' && (
                    <Text style={styles.docDate}>{doc.date}</Text>
                  )}
                </View>
              </View>
            ))}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  summaryStatItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 10,
  },
  statLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  statSub: {
    fontSize: 9,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  summaryFooterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    gap: 8,
  },
  warningText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  warningBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  warningBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0B1120',
  },
  docList: {
    gap: 12,
  },
  docItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
  },
  docItemVerified: {
    backgroundColor: 'rgba(16, 185, 129, 0.01)',
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  docDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    lineHeight: 14,
  },
  docActionContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusVerifiedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
  },
  statusPendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusPendingText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#F59E0B',
  },
  editBtn: {
    borderWidth: 1,
    borderColor: '#10B981',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  editBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
  },
  fillBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  fillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B1120',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  uploadBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  docDate: {
    fontSize: 10,
    color: '#9CA3AF',
  },
});
