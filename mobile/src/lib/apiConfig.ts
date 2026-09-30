import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Local Server PC IP on Wi-Fi
export const LOCAL_PC_IP = '10.0.11.116';

// Local backend URL for Web browser preview
export const LOCAL_WEB_API_URL = 'http://localhost:5000/api';

// Local backend URL for Android physical device on Wi-Fi
export const LOCAL_DEVICE_API_URL = `http://${LOCAL_PC_IP}:5000/api`;

// Production Cloud API URL (Live Vercel Production Deployment)
export const PRODUCTION_API_URL = 'https://hisabhero.vercel.app/api';

// Intelligent Default URL
export function getDefaultApiUrl(): string {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_API_URL || LOCAL_WEB_API_URL;
  }
  // Native Android / iOS Device
  if (process.env.EXPO_PUBLIC_API_URL && !process.env.EXPO_PUBLIC_API_URL.includes('localhost') && !process.env.EXPO_PUBLIC_API_URL.includes('127.0.0.1')) {
    return sanitizeApiUrl(process.env.EXPO_PUBLIC_API_URL);
  }
  return LOCAL_DEVICE_API_URL;
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
      if (Platform.OS !== 'web' && (clean.includes('localhost') || clean.includes('127.0.0.1'))) {
        currentApiUrl = LOCAL_DEVICE_API_URL;
      } else {
        currentApiUrl = clean;
      }
    } else {
      if (Platform.OS === 'web') {
        currentApiUrl = LOCAL_WEB_API_URL;
      } else {
        currentApiUrl = LOCAL_DEVICE_API_URL;
      }
    }
  } catch (err) {
    console.error('Failed to load apiBaseUrl from AsyncStorage:', err);
    currentApiUrl = getDefaultApiUrl();
  }
  return currentApiUrl;
}
