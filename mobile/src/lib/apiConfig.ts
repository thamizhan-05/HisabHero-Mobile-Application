import AsyncStorage from '@react-native-async-storage/async-storage';

// Production Cloud API URL (Live Vercel Production Deployment)
export const PRODUCTION_API_URL = 'https://hisabhero.vercel.app/api';

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
      // Allow production Render endpoint, local LAN IPs, and localhost development URLs
      const isRenderUrl = cleanUrl.includes('hisabhero-mobile-application.onrender.com');
      const isLocalhost = cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1') || cleanUrl.includes('10.0.2.2') || cleanUrl.includes('192.168.') || cleanUrl.includes('10.');
      if (isRenderUrl || isLocalhost) {
        currentApiUrl = cleanUrl;
      } else {
        currentApiUrl = cleanUrl;
      }
    } else {
      currentApiUrl = DEFAULT_API_URL;
    }
  } catch (err) {
    console.error('Failed to load apiBaseUrl from AsyncStorage:', err);
    currentApiUrl = DEFAULT_API_URL;
  }
  return currentApiUrl;
}

