import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Landmark, LogOut, Award, ShieldCheck, CheckCircle2, TrendingDown, Users, ChevronRight } from 'lucide-react-native';

interface BankDashboardScreenProps {
  currentUser: any;
  onLogout: () => void;
}

export default function BankDashboardScreen({ currentUser, onLogout }: BankDashboardScreenProps) {
  const [approvingId, setApprovingId] = useState<string | null>(null);
  
  // Mock credit allocation data
  const [applications, setApplications] = useState([
    { id: '1', company: 'Tofaş Türk Otomobil Fabrikası A.Ş.', ticker: 'TOASO', score: 8.2, status: 'approved', amount: '24,000,000 TL', advantage: '-2.40%' },
    { id: '2', company: 'Aselsan Elektronik Sanayi', ticker: 'ASELS', score: 8.8, status: 'approved', amount: '45,000,000 TL', advantage: '-2.60%' },
    { id: '3', company: 'Genel Sanayi A.Ş. (KOBİ)', ticker: 'GENEL', score: 6.4, status: 'pending', amount: '4,500,000 TL', advantage: '-1.25%' },
    { id: '4', company: 'Migros Ticaret A.Ş.', ticker: 'MGROS', score: 7.9, status: 'approved', amount: '18,500,000 TL', advantage: '-2.10%' },
    { id: '5', company: 'Kardemir Demir Çelik', ticker: 'KRDMD', score: 5.2, status: 'pending', amount: '35,000,000 TL', advantage: '0.00% (Düşük ESG)' }
  ]);

  const handleApprove = (id: string, company: string) => {
    setApprovingId(id);
    setTimeout(() => {
      setApplications(prev => prev.map(app => app.id === id ? { ...app, status: 'approved' } : app));
      setApprovingId(null);
      Alert.alert('Onay Başarılı', `${company} yeşil kredi talebi onaylandı ve faiz indirimi sisteme tanımlandı.`);
    }, 1000);
  };

  return (
    <LinearGradient
      colors={['#0B1120', '#162032', '#090D16']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.bankIconContainer}>
              <Landmark size={20} color="#10B981" />
            </View>
            <View>
              <Text style={styles.bankName}>{currentUser.companyName}</Text>
              <Text style={styles.userName}>{currentUser.userName} ({currentUser.userTitle})</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <LogOut size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Dashboard Summary Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TALEP HACMİ</Text>
              <Text style={styles.statValue}>127 M TL</Text>
              <Text style={styles.statSub}>5 Aktif Dosya</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ONAYLANAN</Text>
              <Text style={styles.statValue}>87.5 M TL</Text>
              <Text style={[styles.statSub, { color: '#10B981' }]}>3 Başvuru</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ORT. ESG SKORU</Text>
              <Text style={styles.statValue}>7.3</Text>
              <Text style={styles.statSub}>Hedef: 6.5+</Text>
            </View>
          </View>

          {/* Section Title */}
          <Text style={styles.sectionTitle}>Yeşil Kredi Talepleri & ESG Karnesi</Text>

          {/* Applications list */}
          <View style={styles.listContainer}>
            {applications.map((app) => (
              <View key={app.id} style={styles.appCard}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.companyNameText}>{app.company}</Text>
                    <Text style={styles.tickerText}>{app.ticker} • ESG Güven Skoru: {app.score}/10</Text>
                  </View>
                  <View style={[
                    styles.scoreBadge, 
                    app.score >= 7.5 ? styles.scoreHigh : app.score >= 6.0 ? styles.scoreMedium : styles.scoreLow
                  ]}>
                    <Text style={[
                      styles.scoreText, 
                      app.score >= 7.5 ? { color: '#10B981' } : app.score >= 6.0 ? { color: '#F59E0B' } : { color: '#EF4444' }
                    ]}>{app.score}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardDetails}>
                  <View>
                    <Text style={styles.detailLabel}>KREDİ TUTARI</Text>
                    <Text style={styles.detailValue}>{app.amount}</Text>
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>HAK EDİLEN FAİZ İNDİRİMİ</Text>
                    <Text style={[styles.detailValue, { color: '#D4AF37' }]}>{app.advantage}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  {app.status === 'approved' ? (
                    <View style={styles.approvedStatus}>
                      <CheckCircle2 size={16} color="#10B981" />
                      <Text style={styles.approvedText}>Onaylandı & Faiz İndirimi Uygulandı</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.approveBtn}
                      disabled={approvingId !== null}
                      onPress={() => handleApprove(app.id, app.company)}
                    >
                      {approvingId === app.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.approveBtnText}>Talebi İncele & Onayla</Text>
                      )}
                    </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  bankIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
  },
  statSub: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  listContainer: {
    gap: 16,
  },
  appCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tickerText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  scoreBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreHigh: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  scoreMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  scoreLow: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 12,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardFooter: {
    marginTop: 4,
  },
  approvedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  approvedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  approveBtn: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
