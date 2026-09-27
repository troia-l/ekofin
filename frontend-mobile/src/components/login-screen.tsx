import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Building2, Landmark, Sparkles, ArrowRight } from 'lucide-react-native';

interface LoginScreenProps {
  onLogin: (user: any) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [role, setRole] = useState<'kobi' | 'bank'>('kobi');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleManualLogin = () => {
    setError('');
    if (!email || !password) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      let mockUser = null;
      if (role === 'bank') {
        mockUser = {
          role: 'bank',
          companyName: 'Akbank Yeşil Finans Dep.',
          companyTicker: 'AKBNK',
          userName: 'Selin Demir',
          userTitle: 'Kredi Tahsis Uzmanı'
        };
      } else {
        mockUser = {
          role: 'kobi',
          companyName: 'Genel Sanayi A.Ş.',
          companyTicker: 'GENEL',
          userName: 'Ahmet Yılmaz',
          userTitle: 'KOBİ CFO'
        };
      }
      onLogin(mockUser);
    }, 1000);
  };

  const handleQuickLogin = (preset: 'tofas' | 'aselsan' | 'bank') => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      let mockUser = null;

      if (preset === 'tofas') {
        mockUser = {
          role: 'kobi',
          companyName: 'Tofaş Türk Otomobil Fabrikası A.Ş.',
          companyTicker: 'TOASO',
          userName: 'Kerem Özdemir',
          userTitle: 'Sürdürülebilirlik Müdürü'
        };
      } else if (preset === 'aselsan') {
        mockUser = {
          role: 'kobi',
          companyName: 'Aselsan Elektronik Sanayi',
          companyTicker: 'ASELS',
          userName: 'Burak Yılmaz',
          userTitle: 'Çevresel Etki ve İSG Direktörü'
        };
      } else if (preset === 'bank') {
        mockUser = {
          role: 'bank',
          companyName: 'Yeşil Kalkınma Bankası A.Ş.',
          companyTicker: 'YKBNK',
          userName: 'Selin Demir',
          userTitle: 'Yeşil Finansman Kredi Lideri'
        };
      }

      if (mockUser) {
        onLogin(mockUser);
      }
    }, 800);
  };

  return (
    <LinearGradient
      colors={['#0B1120', '#162032', '#090D16']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            
            {/* Logo and Brand */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCard}>
                <Image 
                  source={require('../../assets/images/ecofin_logo.png')} 
                  style={styles.logoImage} 
                  resizeMode="contain"
                />
                <Text style={styles.brandText}>
                  <Text style={{ color: '#0B1120' }}>Eco</Text>
                  <Text style={{ color: '#FF7F00' }}>Fin</Text>
                </Text>
              </View>
              <Text style={styles.welcomeText}>Portal Girişi</Text>
              <Text style={styles.subtitleText}>Sürdürülebilirlik paneline güvenle erişin</Text>
            </View>

            {/* Role Switcher */}
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleBtn, role === 'kobi' && styles.roleBtnActive]}
                onPress={() => setRole('kobi')}
              >
                <Building2 size={16} color={role === 'kobi' ? '#FFFFFF' : '#9CA3AF'} />
                <Text style={[styles.roleBtnText, role === 'kobi' && styles.roleBtnTextActive]}>Şirket Yetkilisi</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.roleBtn, role === 'bank' && styles.roleBtnActive]}
                onPress={() => setRole('bank')}
              >
                <Landmark size={16} color={role === 'bank' ? '#FFFFFF' : '#9CA3AF'} />
                <Text style={[styles.roleBtnText, role === 'bank' && styles.roleBtnTextActive]}>Banka Yetkilisi</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <View style={styles.presetsWrapper}>
              <View style={styles.presetsHeader}>
                <Sparkles size={14} color="#10B981" />
                <Text style={styles.presetsTitle}>HIZLI GİRİŞ PROFİLLERİ</Text>
              </View>

              {role === 'kobi' ? (
                <View style={styles.presetList}>
                  <TouchableOpacity 
                    style={styles.presetCard}
                    onPress={() => handleQuickLogin('tofas')}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.presetName}>Tofaş Otomotiv (TOASO)</Text>
                      <Text style={styles.presetTitle}>Sürdürülebilirlik Müdürü</Text>
                    </View>
                    <ArrowRight size={16} color="#10B981" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.presetCard}
                    onPress={() => handleQuickLogin('aselsan')}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.presetName}>Aselsan Elektronik (ASELS)</Text>
                      <Text style={styles.presetTitle}>İSG ve Çevre Direktörü</Text>
                    </View>
                    <ArrowRight size={16} color="#10B981" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.presetCard}
                  onPress={() => handleQuickLogin('bank')}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.presetName}>Yeşil Kalkınma Bankası</Text>
                    <Text style={styles.presetTitle}>Kredi Tahsis Lideri</Text>
                  </View>
                  <ArrowRight size={16} color="#10B981" />
                </TouchableOpacity>
              )}
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya manuel giriş</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>E-posta Adresi</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={16} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={role === 'bank' ? 'banka@ecofin.com' : 'sirket@ecofin.com'}
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Şifre</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={16} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.submitBtn}
                onPress={handleManualLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.submitBtnText}>Giriş Yap</Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 48,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  logoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  logoImage: {
    height: 28,
    width: 28,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 12,
  },
  roleBtnActive: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  roleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  roleBtnTextActive: {
    color: '#FFFFFF',
  },
  presetsWrapper: {
    marginBottom: 20,
  },
  presetsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  presetsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  presetList: {
    gap: 8,
  },
  presetCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  presetName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  presetTitle: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  formContainer: {
    gap: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    padding: 8,
    borderRadius: 6,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
