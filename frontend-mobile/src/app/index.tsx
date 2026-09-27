import React, { useContext, useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Leaf, ShieldCheck, Zap, TrendingDown, ArrowRight, Award, Calendar, ChevronRight, LogOut } from 'lucide-react-native';
import { AuthContext } from './_layout';
import { safeStorage } from '@/utils/storage';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const { currentUser, logout } = useContext(AuthContext);
  const [totalVerifiedDocs, setTotalVerifiedDocs] = useState(0);

  // Load uploaded documents count for general KOBİ (GENEL)
  useEffect(() => {
    const loadDocs = async () => {
      try {
        const saved = await safeStorage.getItem('uploaded_documents');
        const declaration = await safeStorage.getItem('manager_declaration');
        let count = 0;
        if (saved) {
          const docs = JSON.parse(saved);
          count += Object.keys(docs).length;
        }
        if (declaration) {
          count += 1;
        }
        setTotalVerifiedDocs(count);
      } catch (e) {
        console.error(e);
      }
    };
    loadDocs();
    const interval = setInterval(loadDocs, 1500);
    return () => clearInterval(interval);
  }, []);

  // Sync metrics with logged-in user profile
  const isPremium = currentUser?.companyTicker === 'TOASO' || currentUser?.companyTicker === 'ASELS';
  const esgScore = currentUser?.companyTicker === 'TOASO' ? 8.2 : currentUser?.companyTicker === 'ASELS' ? 8.8 : 6.4;
  const advantageText = currentUser?.companyTicker === 'TOASO' ? '-2.40%' : currentUser?.companyTicker === 'ASELS' ? '-2.60%' : '-1.25%';
  const emisyonValue = currentUser?.companyTicker === 'TOASO' ? '120 Ton' : currentUser?.companyTicker === 'ASELS' ? '85 Ton' : '150 Ton';
  const complianceScore = currentUser?.companyTicker === 'TOASO' ? '%92' : currentUser?.companyTicker === 'ASELS' ? '%96' : '%60';
  const docCountText = isPremium ? '11 Belge' : `${totalVerifiedDocs} Belge`;
  const heroFooterText = esgScore >= 7.5 
    ? '🎉 Sektör ortalamasının %15 üzerindesiniz. Yeşil pasaport onaylandı.'
    : 'ℹ️ ESG hedeflerinizi tamamlayarak yeşil kredi faiz indirim oranınızı artırabilirsiniz.';

  // Mock Data
  const emisyonTrend = [
    { çeyrek: 'Q1', emisyon: 120, height: 100 },
    { çeyrek: 'Q2', emisyon: 115, height: 95 },
    { çeyrek: 'Q3', emisyon: 105, height: 85 },
    { çeyrek: 'Q4', emisyon: 90, height: 70 },
  ];

  const emisyonDagitim = [
    { ad: 'Kapsam 1 (Doğrudan)', value: '65%', oran: 0.65, renk: '#10B981' },
    { ad: 'Kapsam 2 (Dolaylı)', value: '25%', oran: 0.25, renk: '#F59E0B' },
    { ad: 'Kapsam 3 (Tedarik)', value: '10%', oran: 0.10, renk: '#3B82F6' },
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
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.headerSubtitle} numberOfLines={1}>{currentUser ? currentUser.companyName : 'ECOFIN SÜRDÜRÜLEBİLİRLİK'}</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>{currentUser ? `${currentUser.userName} (${currentUser.userTitle})` : 'Yönetici Özeti'}</Text>
            </View>
            <TouchableOpacity style={styles.logoutHeaderBtn} onPress={logout}>
              <LogOut size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Hero Card - ESG Score */}
          <View style={styles.heroCard}>
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.15)', 'rgba(4, 120, 87, 0.05)']}
              style={styles.heroGradient}
            >
              <View style={styles.heroHeader}>
                <View>
                  <Text style={styles.heroLabel}>DD-ESG GÜVEN SKORU</Text>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreValue}>{esgScore}</Text>
                    <Text style={styles.scoreMax}>/10</Text>
                  </View>
                </View>
                <View style={styles.heroIconContainer}>
                  <Award size={32} color="#10B981" />
                </View>
              </View>
              <View style={styles.divider} />
              <Text style={styles.heroFooter}>
                {heroFooterText}
              </Text>
            </LinearGradient>
          </View>

          {/* Grid Cards */}
          <View style={styles.grid}>
            
            {/* Card 1: Kredi İndirimi */}
            <View style={styles.gridCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>FAİZ İNDİRİMİ</Text>
                <TrendingDown size={20} color="#D4AF37" />
              </View>
              <Text style={[styles.cardValue, { color: '#D4AF37' }]}>{advantageText}</Text>
              <Text style={styles.cardDesc}>Yeşil Pasaport Avantajı</Text>
            </View>

            {/* Card 2: Emisyon */}
            <View style={styles.gridCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>EMİSYON</Text>
                <Zap size={20} color="#3B82F6" />
              </View>
              <Text style={styles.cardValue}>{emisyonValue}</Text>
              <Text style={styles.cardDesc}>Kapsam 1 & Kapsam 2</Text>
            </View>

            {/* Card 3: Güvenilirlik */}
            <View style={styles.gridCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>GÜVENİLİRLİK</Text>
                <ShieldCheck size={20} color="#10B981" />
              </View>
              <Text style={[styles.cardValue, { color: '#10B981' }]}>{complianceScore}</Text>
              <Text style={styles.cardDesc}>YZ Taraması Başarılı</Text>
            </View>

            {/* Card 4: Aktif Dosya */}
            <View style={styles.gridCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>AKTARIM</Text>
                <Calendar size={20} color="#A78BFA" />
              </View>
              <Text style={styles.cardValue}>{docCountText}</Text>
              <Text style={styles.cardDesc}>Veri Entegrasyonu Aktif</Text>
            </View>

          </View>

          {/* Section: Periodical Emissions */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Dönemsel Emisyon Trendi (2026)</Text>
            <View style={styles.chartContainer}>
              {emisyonTrend.map((item, idx) => (
                <View key={idx} style={styles.barColumn}>
                  <View style={styles.barTrack}>
                    <LinearGradient
                      colors={['#10B981', '#047857']}
                      style={[styles.barFill, { height: item.height }]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{item.çeyrek}</Text>
                  <Text style={styles.barValue}>{item.emisyon}t</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Section: Scope Distribution */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Emisyon Kaynak Dağılımı</Text>
            <View style={styles.progressList}>
              {emisyonDagitim.map((item, idx) => (
                <View key={idx} style={styles.progressItem}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>{item.ad}</Text>
                    <Text style={styles.progressValue}>{item.value}</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${item.oran * 100}%`, backgroundColor: item.renk }
                      ]} 
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Action Button to Integration */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/integration')}
          >
            <Text style={styles.actionButtonText}>Veri Entegrasyon Merkezine Git</Text>
            <ChevronRight size={18} color="#FFFFFF" />
          </TouchableOpacity>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  logoutHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 24,
    backgroundColor: '#111827',
  },
  heroGradient: {
    padding: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 48,
  },
  scoreMax: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 16,
  },
  heroFooter: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gridCard: {
    width: (width - 56) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  cardDesc: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 10,
  },
  barColumn: {
    alignItems: 'center',
  },
  barTrack: {
    width: 24,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 12,
  },
  barLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
    fontWeight: '600',
  },
  barValue: {
    fontSize: 10,
    color: '#FFFFFF',
    marginTop: 2,
    fontWeight: '700',
  },
  progressList: {
    gap: 16,
  },
  progressItem: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
