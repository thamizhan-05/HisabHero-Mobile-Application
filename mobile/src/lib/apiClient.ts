import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { DEFAULT_API_URL, loadSavedApiBaseUrl, setApiBaseUrl as updateConfigApiUrl } from './apiConfig';

let globalLogoutCallback: (() => void) | null = null;
let globalApiUrl = DEFAULT_API_URL;

export function setGlobalLogoutCallback(callback: () => void) {
  globalLogoutCallback = callback;
}

export function setGlobalApiUrl(url: string) {
  globalApiUrl = url;
  updateConfigApiUrl(url);
}

export async function getGlobalApiUrl() {
  globalApiUrl = await loadSavedApiBaseUrl();
  return globalApiUrl;
}

async function request(endpoint: string, options: any = {}) {
  const baseUrl = await getGlobalApiUrl();
  const token = await AsyncStorage.getItem('token');
  const activeWorkspaceId = await AsyncStorage.getItem('activeWorkspaceId') || 'personal';

  // Format headers
  const headers = {
    'Content-Type': options.headers?.['Content-Type'] || 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    'X-Workspace-Id': activeWorkspaceId,
    ...options.headers,
  };

  // If body is multipart/form-data, delete Content-Type so fetch can set boundaries automatically
  if (headers['Content-Type'] === 'multipart/form-data') {
    delete headers['Content-Type'];
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000); // 10s default timeout

  const config = {
    ...options,
    headers,
    signal: controller.signal,
  };

  try {
    const fullUrl = `${baseUrl}${endpoint}`;
    console.log(`[API Client] ${config.method || 'GET'} ${fullUrl}`);
    
    const response = await fetch(fullUrl, config);
    clearTimeout(timeoutId);

    // Handle 401 / 403 Session Expired
    if (response.status === 401 || response.status === 403) {
      console.warn('[API Client] Unauthorized status received. Logging out.');
      if (globalLogoutCallback) {
        globalLogoutCallback();
        Alert.alert('Session Expired', 'Your session has expired. Please log in again to continue.');
      }
      throw new Error('Session expired');
    }

    return response;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your network connection.');
    }
    throw err;
  }
}

export const apiClient = {
  get: (endpoint: string, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, body?: any, options = {}) => request(endpoint, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  delete: (endpoint: string, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
  patch: (endpoint: string, body?: any, options = {}) => request(endpoint, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  upload: (endpoint: string, formData: FormData, options: any = {}) => request(endpoint, { timeout: 300000, ...options, method: 'POST', body: formData, headers: { 'Content-Type': 'multipart/form-data' } }),
};
