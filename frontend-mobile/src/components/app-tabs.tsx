import React from 'react';
import { useColorScheme } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Database, Sliders, Award } from 'lucide-react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: scheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: scheme === 'dark' ? '#9CA3AF' : '#6B7280',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Özet',
          tabBarIcon: ({ color, size }) => <Home size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="integration"
        options={{
          title: 'Veri Girişi',
          tabBarIcon: ({ color, size }) => <Database size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="simulator"
        options={{
          title: 'Simülatör',
          tabBarIcon: ({ color, size }) => <Sliders size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tsrs-report"
        options={{
          title: 'TSRS Raporu',
          tabBarIcon: ({ color, size }) => <Award size={size || 22} color={color} />,
        }}
      />
      {/* Hide the declaration stack screen from the bottom tab bar */}
      <Tabs.Screen
        name="declaration"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
