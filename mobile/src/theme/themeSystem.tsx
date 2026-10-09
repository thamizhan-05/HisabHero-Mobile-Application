import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../lib/apiClient';

export type ThemeId = 'hisabhero_light' | 'soft_mint' | 'warm_pearl' | 'system' | string;
export type AccentColorId = 'blue' | string;

export interface ThemeTokens {
  id: string;
  name: string;
  subtitle: string;
  isDark: boolean;
  bg: string;
  card: string;
  cardBorder: string;
  cardHeader: string;
  primary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  inputBg: string;
  inputBorder: string;
  tabBarBg: string;
  tabBarBorder: string;
  badgeBg: string;
  glowColor: string;
  modalBg?: string;
  divider?: string;
  skeletonBg?: string;
  subtleCard?: string;
}

export const ACCENT_COLORS: Record<string, { id: string; name: string; hex: string }> = {
  blue: { id: 'blue', name: 'HisabHero Blue', hex: '#0284c7' }
};

export const CURATED_THEMES: Record<'hisabhero_light' | 'hisabhero_dark' | 'linear_zinc' | 'ramp_emerald' | 'swiss_light', ThemeTokens> = {
  hisabhero_light: {
    id: 'hisabhero_light',
    name: 'HisabHero Light 🌿 (Default)',
    subtitle: 'Arctic Surface • Forest Spruce • Celadon Mint',
    isDark: false,
    bg: '#F8FAFC',
    card: '#FFFFFF',
    cardBorder: '#E2E8F0',
    cardHeader: '#F1F5F9',
    primary: '#173F35',
    accent: '#DCEFE5',
    success: '#15803D',
    warning: '#B45309',
    error: '#B91C1C',
    text: '#17212B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    inputBg: '#FFFFFF',
    inputBorder: '#E2E8F0',
    tabBarBg: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    badgeBg: '#DCEFE5',
    glowColor: 'rgba(23, 63, 53, 0.08)',
    modalBg: '#FFFFFF',
    divider: '#E2E8F0',
    skeletonBg: 'rgba(15, 23, 42, 0.06)',
    subtleCard: '#F8FAFC'
  },
  swiss_light: {
    id: 'swiss_light',
    name: 'Swiss Light 🕊️',
    subtitle: 'Pure Arctic White • Crisp Indigo • Executive Clarity',
    isDark: false,
    bg: '#F8FAFC',
    card: '#FFFFFF',
    cardBorder: '#E2E8F0',
    cardHeader: '#F1F5F9',
    primary: '#4F46E5',
    accent: '#6366F1',
    success: '#15803D',
    warning: '#B45309',
    error: '#B91C1C',
    text: '#17212B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    inputBg: '#FFFFFF',
    inputBorder: '#CBD5E1',
    tabBarBg: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    badgeBg: 'rgba(79, 70, 229, 0.08)',
    glowColor: 'rgba(79, 70, 229, 0.12)',
    modalBg: '#FFFFFF',
    divider: '#E2E8F0',
    skeletonBg: 'rgba(15, 23, 42, 0.06)',
    subtleCard: '#F1F5F9'
  },
  hisabhero_dark: {
    id: 'hisabhero_dark',
    name: 'Mercury Obsidian 🌌',
    subtitle: 'Obsidian Navy • Emerald & Sapphire • Optional Dark',
    isDark: true,
    bg: '#06111f',
    card: '#0f172a',
    cardBorder: '#1e293b',
    cardHeader: '#1e293b',
    primary: '#10b981',
    accent: '#38bdf8',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    inputBg: '#0f172a',
    inputBorder: '#334155',
    tabBarBg: '#0f172a',
    tabBarBorder: '#1e293b',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    glowColor: 'rgba(16, 185, 129, 0.20)',
    modalBg: '#0f172a',
    divider: '#1e293b',
    skeletonBg: 'rgba(255, 255, 255, 0.08)',
    subtleCard: '#1e293b'
  },
  linear_zinc: {
    id: 'linear_zinc',
    name: 'Linear Zinc ⚡',
    subtitle: 'Pitch Carbon • Slate Zinc • Indigo Accents',
    isDark: true,
    bg: '#09090b',
    card: '#18181b',
    cardBorder: '#27272a',
    cardHeader: '#27272a',
    primary: '#6366f1',
    accent: '#818cf8',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    text: '#fafafa',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    inputBg: '#18181b',
    inputBorder: '#3f3f46',
    tabBarBg: '#18181b',
    tabBarBorder: '#27272a',
    badgeBg: 'rgba(99, 102, 241, 0.12)',
    glowColor: 'rgba(99, 102, 241, 0.20)',
    modalBg: '#18181b',
    divider: '#27272a',
    skeletonBg: 'rgba(255, 255, 255, 0.08)',
    subtleCard: '#27272a'
  },
  ramp_emerald: {
    id: 'ramp_emerald',
    name: 'Ramp Emerald 🌿',
    subtitle: 'Deep Forest • Emerald Accents • Wealth Velocity',
    isDark: true,
    bg: '#061a14',
    card: '#0d281e',
    cardBorder: '#134e38',
    cardHeader: '#134e38',
    primary: '#10b981',
    accent: '#34d399',
    success: '#10b981',
    warning: '#d97706',
    error: '#dc2626',
    text: '#ecfdf5',
    textSecondary: '#a7f3d0',
    textMuted: '#6ee7b7',
    inputBg: '#0d281e',
    inputBorder: '#134e38',
    tabBarBg: '#0d281e',
    tabBarBorder: '#134e38',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    modalBg: '#0d281e',
    divider: '#134e38',
    skeletonBg: 'rgba(16, 185, 129, 0.08)',
    subtleCard: '#134e38'
  }
};

export const CORE_THEMES = CURATED_THEMES;

// Map legacy theme keys cleanly to curated themes
export const THEMES: Record<string, ThemeTokens> = {
  ...CURATED_THEMES,
  default: CURATED_THEMES.hisabhero_light,
  light: CURATED_THEMES.hisabhero_light,
  dark: CURATED_THEMES.hisabhero_dark,
  mercury: CURATED_THEMES.hisabhero_dark,
  mercury_obsidian: CURATED_THEMES.hisabhero_dark,
  hisabhero_dark: CURATED_THEMES.hisabhero_dark,
  hisabhero_light: CURATED_THEMES.hisabhero_light,
  soft_mint: CURATED_THEMES.ramp_emerald,
  warm_pearl: CURATED_THEMES.linear_zinc,
  linear: CURATED_THEMES.linear_zinc,
  linear_zinc: CURATED_THEMES.linear_zinc,
  ramp: CURATED_THEMES.ramp_emerald,
  ramp_emerald: CURATED_THEMES.ramp_emerald,
  swiss: CURATED_THEMES.swiss_light,
  swiss_light: CURATED_THEMES.swiss_light,
  midnight_professional: CURATED_THEMES.hisabhero_dark,
  pearl_professional: CURATED_THEMES.hisabhero_light,
  executive_graphite: CURATED_THEMES.linear_zinc,
  midnight_titanium: CURATED_THEMES.hisabhero_dark,
  emerald_wealth: CURATED_THEMES.ramp_emerald,
  royal_indigo: CURATED_THEMES.swiss_light,
  carbon_black: CURATED_THEMES.linear_zinc,
  cosmic_purple: CURATED_THEMES.linear_zinc,
  pearl_white: CURATED_THEMES.hisabhero_light,
  ocean_breeze: CURATED_THEMES.hisabhero_dark,
  sunset_gold: CURATED_THEMES.linear_zinc,
  forest_green: CURATED_THEMES.ramp_emerald,
  rose_blush: CURATED_THEMES.linear_zinc,
};

interface ThemeContextType {
  themeId: string;
  theme: ThemeTokens;
  accentId: string;
  accentHex: string;
  dynamicAiTheme: boolean;
  setThemeId: (id: string) => void;
  setAccentId: (id: string) => void;
  setDynamicAiTheme: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeId: 'hisabhero_light',
  theme: CURATED_THEMES.hisabhero_light,
  accentId: 'blue',
  accentHex: '#173F35',
  dynamicAiTheme: false,
  setThemeId: () => {},
  setAccentId: () => {},
  setDynamicAiTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeId, setThemeIdState] = useState<string>('hisabhero_light');

  useEffect(() => {
    loadThemePreferences();
  }, []);

  const loadThemePreferences = async () => {
    try {
      // One-time migration: make HisabHero Light the default on existing installs too.
      const migrated = await AsyncStorage.getItem('themeLightDefaultV2');
      if (!migrated) {
        await AsyncStorage.setItem('appThemeId', 'hisabhero_light');
        await AsyncStorage.setItem('themeLightDefaultV2', '1');
        setThemeIdState('hisabhero_light');
        return;
      }
      const savedTheme = await AsyncStorage.getItem('appThemeId');
      if (savedTheme && (CURATED_THEMES[savedTheme as keyof typeof CURATED_THEMES] || THEMES[savedTheme])) {
        setThemeIdState(savedTheme);
      } else {
        setThemeIdState('hisabhero_light');
      }
    } catch (e) {
      console.warn('Failed to load theme preferences:', e);
    }
  };

  const setThemeId = async (id: string) => {
    setThemeIdState(id);
    try {
      await AsyncStorage.setItem('appThemeId', id);
      await apiClient.put('/api/auth/profile', { themeId: id }).catch(() => {});
    } catch (e) {}
  };

  let activeTheme: ThemeTokens = CURATED_THEMES.hisabhero_light;
  if (THEMES[themeId]) {
    activeTheme = THEMES[themeId];
  } else if (CURATED_THEMES[themeId as keyof typeof CURATED_THEMES]) {
    activeTheme = CURATED_THEMES[themeId as keyof typeof CURATED_THEMES];
  }

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        theme: activeTheme,
        accentId: 'blue',
        accentHex: activeTheme.primary,
        dynamicAiTheme: false,
        setThemeId,
        setAccentId: () => {},
        setDynamicAiTheme: () => {},
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

