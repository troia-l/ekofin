import React, { createContext, useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme, View, ActivityIndicator } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import LoginScreen from '@/components/login-screen';
import BankDashboardScreen from '@/components/bank-dashboard';
import { safeStorage } from '@/utils/storage';

export const AuthContext = createContext<{
  currentUser: any;
  login: (user: any) => Promise<void>;
  logout: () => Promise<void>;
}>({
  currentUser: null,
  login: async () => {},
  logout: async () => {},
});

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const saved = await safeStorage.getItem('user_session');
        if (saved) {
          setCurrentUser(JSON.parse(saved));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const handleLogin = async (user: any) => {
    setCurrentUser(user);
    await safeStorage.setItem('user_session', JSON.stringify(user));
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    await safeStorage.removeItem('user_session');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1120' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthContext.Provider value={{ currentUser, login: handleLogin, logout: handleLogout }}>
        <AnimatedSplashOverlay />
        {!currentUser ? (
          <LoginScreen onLogin={handleLogin} />
        ) : currentUser.role === 'bank' ? (
          <BankDashboardScreen currentUser={currentUser} onLogout={handleLogout} />
        ) : (
          <AppTabs />
        )}
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
