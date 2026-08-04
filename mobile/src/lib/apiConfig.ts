import AsyncStorage from '@react-native-async-storage/async-storage';

// Production Cloud API URL (Live Render Production Web Service)
export const PRODUCTION_API_URL = 'https://hisabhero-mobile-application.onrender.com/api';

// Default API URL (uses environment variable if present, otherwise defaults to PRODUCTION_API_URL)
export const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL;

let currentApiUrl = DEFAULT_API_URL;

/**
 * Get the active API Base URL.
 */
export function sanitizeApiUrl(rawUrl: string): string {
  if (!rawUrl) return PRODUCTION_API_URL;
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
      const cleanUrl = sanitizeApiUrl(saved);
      const isLocal = cleanUrl.includes('localhost') || 
                      cleanUrl.includes('127.0.0.1') || 
                      /192\.168\.\d+\.\d+/.test(cleanUrl) || 
                      /10\.\d+\.\d+\.\d+/.test(cleanUrl);
                      
      if (isLocal) {
        await AsyncStorage.removeItem('apiBaseUrl');
        currentApiUrl = PRODUCTION_API_URL;
      } else {
        currentApiUrl = cleanUrl;
      }
    } else {
      currentApiUrl = PRODUCTION_API_URL;
    }
  } catch (err) {
    console.error('Failed to load apiBaseUrl from AsyncStorage:', err);
    currentApiUrl = PRODUCTION_API_URL;
  }
  return currentApiUrl;
}
