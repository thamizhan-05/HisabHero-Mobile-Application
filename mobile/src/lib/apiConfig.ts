import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Local Server PC IP on Wi-Fi
export const LOCAL_PC_IP = '10.0.11.116';

// Local backend URL for Web browser preview
export const LOCAL_WEB_API_URL = 'http://localhost:5000/api';

// Local backend URL for Android physical device on Wi-Fi
export const LOCAL_DEVICE_API_URL = `http://${LOCAL_PC_IP}:5000/api`;

// Production Cloud API URL (Live Render Production Web Service)
export const RENDER_API_URL = 'https://hisabhero-mobile-application.onrender.com/api';

// Production Cloud API URL (Live Vercel Production Deployment)
export const VERCEL_API_URL = 'https://hisabhero.vercel.app/api';

// Primary Production URL
export const PRODUCTION_API_URL = RENDER_API_URL;

// Intelligent Default URL
export function getDefaultApiUrl(): string {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_API_URL || LOCAL_WEB_API_URL;
  }
  // Native Android / iOS Device: Default to high-speed live Production Cloud API
  return process.env.EXPO_PUBLIC_API_URL || RENDER_API_URL;
}

export const DEFAULT_API_URL = getDefaultApiUrl();

let currentApiUrl = DEFAULT_API_URL;

/**
 * Get the active API Base URL.
 */
export function sanitizeApiUrl(rawUrl: string): string {
  if (!rawUrl) return DEFAULT_API_URL;
  let clean = rawUrl.trim().replace(/\/+$/, '');
  if (!clean.endsWith('/api') && !clean.includes('/api/')) {
    clean = `${clean}/api`;
  }
  return clean;
}

export function getApiBaseUrl(): string {
  return sanitizeApiUrl(currentApiUrl);
}

export async function setApiBaseUrl(newUrl: string): Promise<void> {
  const cleanUrl = sanitizeApiUrl(newUrl);
  currentApiUrl = cleanUrl;
  try {
    await AsyncStorage.setItem('apiBaseUrl', cleanUrl);
  } catch (err) {
    console.error('Failed to save apiBaseUrl to AsyncStorage:', err);
  }
}

export async function loadSavedApiBaseUrl(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem('apiBaseUrl');
    if (saved && saved.trim()) {
      const clean = sanitizeApiUrl(saved);
      // If a native mobile app had previously cached an unreachable LAN IP or localhost,
      // reset it to the live Production Cloud API so the user never gets stuck with a timeout!
      if (Platform.OS !== 'web' && (clean.includes('localhost') || clean.includes('127.0.0.1') || clean.includes('10.') || clean.includes('192.168.') || clean.includes('172.'))) {
        await AsyncStorage.setItem('apiBaseUrl', RENDER_API_URL);
        currentApiUrl = RENDER_API_URL;
      } else {
        currentApiUrl = clean;
      }
    } else {
      currentApiUrl = getDefaultApiUrl();
    }
  } catch (err) {
    console.error('Failed to load apiBaseUrl from AsyncStorage:', err);
    currentApiUrl = getDefaultApiUrl();
  }
  return currentApiUrl;
}
