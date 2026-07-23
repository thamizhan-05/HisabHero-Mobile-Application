// DOMException Polyfill for Hermes React Native
if (typeof globalThis.DOMException === 'undefined') {
  class DOMExceptionPolyfill extends Error {
    constructor(message = '', name = 'Error') {
      super(message);
      this.name = name;
      this.message = message;
      if ((Error as any).captureStackTrace) {
        (Error as any).captureStackTrace(this, DOMExceptionPolyfill);
      }
    }
  }
  globalThis.DOMException = DOMExceptionPolyfill as any;
  if (typeof global !== 'undefined') {
    (global as any).DOMException = DOMExceptionPolyfill;
  }
}

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { WelcomeScreen } from './src/components/WelcomeScreen';
import { LoginScreen } from './src/components/LoginScreen';
import { AppNavigator } from './src/components/AppNavigator';
import { SettingsModal } from './src/components/SettingsModal';
import { setGlobalLogoutCallback, setGlobalApiUrl } from './src/lib/apiClient';
import { DEFAULT_API_URL, loadSavedApiBaseUrl } from './src/lib/apiConfig';

const logoImg = require('./assets/logo.png');

type ActiveScreen = 'welcome' | 'login' | 'main';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('welcome');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_URL);
  
  // Settings modal visibility for the login screen
  const [loginSettingsVisible, setLoginSettingsVisible] = useState(false);

  // Setup the global API client logout interceptor redirection
  const triggerLogoutRedirect = async () => {
    setActiveScreen('login');
    setAuthToken(null);
    setUser(null);
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setGlobalLogoutCallback(triggerLogoutRedirect);
  }, []);

  // Load token, user profile, and configured API URL on startup
  const bootstrapApp = async () => {
    try {
      const storedUrl = await AsyncStorage.getItem('apiBaseUrl');
      if (storedUrl) {
        setApiBaseUrl(storedUrl);
        setGlobalApiUrl(storedUrl);
      } else {
        setGlobalApiUrl(DEFAULT_API_URL);
      }

      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');

      if (token && userData) {
        setAuthToken(token);
        setUser(JSON.parse(userData));
        setActiveScreen('main');
      } else {
        setActiveScreen('welcome');
      }
    } catch (err) {
      console.error('Failed to load bootstrap data from AsyncStorage:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrapApp();
  }, []);

  const handleLoginSuccess = (token: string, userData: any) => {
    setAuthToken(token);
    setUser(userData);
    setActiveScreen('main');
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setAuthToken(null);
      setUser(null);
      setActiveScreen('login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApiUrl = (newUrl: string) => {
    setApiBaseUrl(newUrl);
    setGlobalApiUrl(newUrl);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.splashContent}>
          <Image source={logoImg} style={styles.splashLogo} resizeMode="contain" />
          <Text style={styles.splashTitle}>HisabHero</Text>
          <Text style={styles.splashSubtitle}>Intelligent Business Ledger</Text>
        </View>
        <ActivityIndicator size="small" color="#4f8cff" style={{ marginTop: 24 }} />
      </View>
    );
  }

  // Route to correct screen
  switch (activeScreen) {
    case 'welcome':
      return (
        <WelcomeScreen
          onGetStarted={() => setActiveScreen('login')}
        />
      );
    case 'login':
      return (
        <View style={{ flex: 1 }}>
          <LoginScreen
            apiBaseUrl={apiBaseUrl}
            onLoginSuccess={handleLoginSuccess}
            onOpenSettings={() => setLoginSettingsVisible(true)}
          />
          <SettingsModal
            visible={loginSettingsVisible}
            onClose={() => setLoginSettingsVisible(false)}
            apiBaseUrl={apiBaseUrl}
            onSave={handleUpdateApiUrl}
          />
        </View>
      );
    case 'main':
      return (
        <AppNavigator
          authToken={authToken}
          user={user}
          apiBaseUrl={apiBaseUrl}
          onLogout={handleLogout}
          onUpdateApiUrl={handleUpdateApiUrl}
        />
      );
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#06111f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  splashTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  splashSubtitle: {
    color: '#8fc0ff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.5,
  },
});
