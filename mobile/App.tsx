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

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Image, Animated, Easing, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sparkles, ShieldCheck } from 'lucide-react-native';

import { ErrorBoundary } from './src/components/ErrorBoundary';
import { WelcomeScreen } from './src/components/WelcomeScreen';
import { LoginScreen } from './src/components/LoginScreen';
import { AppNavigator } from './src/components/AppNavigator';
import { setGlobalLogoutCallback, setGlobalApiUrl } from './src/lib/apiClient';
import { DEFAULT_API_URL, loadSavedApiBaseUrl } from './src/lib/apiConfig';
import { ThemeProvider, useTheme } from './src/theme/themeSystem';
import { biometricService } from './src/lib/biometrics';
import { notificationService } from './src/lib/notificationService';
import { LanguageProvider } from './src/theme/i18n';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const logoImg = require('./assets/logo_transparent.png');

function AnimatedSplashScreen() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const dotAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Breathing scale animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glowing aura pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.85,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.35,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.loadingContainer}>
      {/* Background Glowing Ambient Orb */}
      <Animated.View
        style={[
          styles.splashAmbientOrb,
          {
            opacity: glowAnim,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      <View style={styles.splashContent}>
        {/* Animated Glowing Official HisabHero Logo Wrapper */}
        <Animated.View
          style={[
            styles.splashLogoWrapper,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Image
            source={logoImg}
            style={styles.splashLogo}
            resizeMode="contain"
            fadeDuration={0}
          />
        </Animated.View>

        <Text style={styles.splashTitle}>
          Hisab<Text style={{ color: '#10b981' }}>Hero</Text>
        </Text>
        <Text style={styles.splashSubtitle}>Next-Gen AI Accounting & ERP Intelligence</Text>

        <View style={styles.splashBadge}>
          <Animated.View style={[styles.splashPulseDot, { opacity: dotAnim }]} />
          <Text style={styles.splashBadgeText}>INITIALIZING SECURE ENGINE</Text>
        </View>
      </View>

      <ActivityIndicator size="small" color="#10b981" style={{ marginTop: 36 }} />
    </View>
  );
}

type ActiveScreen = 'welcome' | 'login' | 'main';

function AppContent({ renderScreen }: { renderScreen: () => React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['bottom', 'left', 'right']}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} backgroundColor={theme.bg} translucent />
      {renderScreen()}
    </SafeAreaView>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('welcome');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_URL);
  const [isBiometricLocked, setIsBiometricLocked] = useState(false);

  // Setup global logout callback interceptor
  const triggerLogoutRedirect = async () => {
    setActiveScreen('login');
    setAuthInitialMode('login');
    setAuthToken(null);
    setUser(null);
    setIsBiometricLocked(false);
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('activeWorkspaceId');
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
      const activeUrl = await loadSavedApiBaseUrl();
      setApiBaseUrl(activeUrl);
      setGlobalApiUrl(activeUrl);

      // Pre-warm backend connection in background
      fetch(`${activeUrl}/health`).catch(() => {});

      // Setup push notifications
      notificationService.requestPermissions().then((granted) => {
        if (granted) notificationService.scheduleDailyDigest();
      }).catch(() => {});

      let token = await AsyncStorage.getItem('token');
      let userData = await AsyncStorage.getItem('user');

      // Fallback for Web browsers reading token directly from localStorage
      if (!token && typeof window !== 'undefined' && window.localStorage) {
        token = window.localStorage.getItem('token') || window.localStorage.getItem('hh_token');
        const lsUser = window.localStorage.getItem('user');
        if (lsUser) userData = lsUser;
      }

      if (token) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          
          const verifyRes = await fetch(`${activeUrl}/auth/verify`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            if (verifyData.valid && verifyData.user) {
              const serverUser = verifyData.user;
              setAuthToken(token);
              setUser(serverUser);
              await AsyncStorage.setItem('token', token);
              await AsyncStorage.setItem('user', JSON.stringify(serverUser));

              const storedWsId = await AsyncStorage.getItem('activeWorkspaceId');
              const allWs = serverUser.workspaces || [
                ...(serverUser.personalWorkspaces || []),
                ...(serverUser.businessWorkspaces || [])
              ];
              const isValidStored = allWs.some((w: any) => (w._id === storedWsId || w.id === storedWsId));

              if (!isValidStored) {
                const defaultId = serverUser.activeWorkspace?._id || serverUser.activeWorkspace?.id || serverUser.businessWorkspaces?.[0]?._id || serverUser.personalWorkspaces?.[0]?._id || 'personal';
                await AsyncStorage.setItem('activeWorkspaceId', defaultId);
              }

              // Check Biometric Lock
              const isBioEnabled = await biometricService.isBiometricLockEnabled();
              if (isBioEnabled) {
                const bioSuccess = await biometricService.authenticate();
                if (!bioSuccess) {
                  setIsBiometricLocked(true);
                }
              }

              setActiveScreen('main');
              return;
            }
          }

          if (verifyRes.status === 401) {
            console.warn('[Bootstrap] Session token revoked or expired (401). Clearing credentials.');
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('activeWorkspaceId');
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.removeItem('token');
              window.localStorage.removeItem('hh_token');
              window.localStorage.removeItem('user');
              window.localStorage.removeItem('hh_active_ws');
            }
            setAuthToken(null);
            setUser(null);
            setActiveScreen('welcome');
            return;
          }

          // Fallback to Dashboard when token is present
          const cachedUser = userData ? (typeof userData === 'string' ? JSON.parse(userData) : userData) : {};
          setAuthToken(token);
          setUser(cachedUser);
          setActiveScreen('main');
          return;
        } catch (verifyErr) {
          console.warn('[Bootstrap] Session verification endpoint unreachable, falling back to main dashboard:', verifyErr);
          const cachedUser = userData ? (typeof userData === 'string' ? JSON.parse(userData) : userData) : {};
          setAuthToken(token);
          setUser(cachedUser);
          setActiveScreen('main');
          return;
        }
      } else {
        setActiveScreen('welcome');
      }
    } catch (err) {
      console.error('Failed to load bootstrap data from AsyncStorage:', err);
      setActiveScreen('welcome');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrapApp();
  }, []);

  const handleLoginSuccess = async (token: string, userData: any) => {
    setAuthToken(token);
    setUser(userData);
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      const targetWsId = userData.activeWorkspace?._id || userData.activeWorkspace?.id || userData.businessWorkspaces?.[0]?._id || userData.personalWorkspaces?.[0]?._id || 'personal';
      await AsyncStorage.setItem('activeWorkspaceId', targetWsId);
    } catch (e) {
      console.error('Error storing login session:', e);
    }
    setActiveScreen('main');
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('activeWorkspaceId');
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('hh_token');
        window.localStorage.removeItem('user');
        window.localStorage.removeItem('hh_active_ws');
      }
      setAuthToken(null);
      setUser(null);
      setAuthInitialMode('login');
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
    return <AnimatedSplashScreen />;
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'welcome':
        return (
          <WelcomeScreen
            onSignIn={() => {
              setAuthInitialMode('login');
              setActiveScreen('login');
            }}
            onSignUp={() => {
              setAuthInitialMode('signup');
              setActiveScreen('login');
            }}
          />
        );
      case 'login':
        return (
          <LoginScreen
            initialMode={authInitialMode}
            apiBaseUrl={apiBaseUrl}
            onLoginSuccess={handleLoginSuccess}
            onOpenSettings={() => {}}
          />
        );
      case 'main':
        if (isBiometricLocked) {
          return (
            <View style={[styles.loadingContainer, { backgroundColor: '#06111f' }]}>
              <View style={styles.splashAmbientOrb} />
              <View style={styles.biometricLockCard}>
                <View style={styles.biometricIconCircle}>
                  <ShieldCheck color="#10b981" size={48} />
                </View>
                <Text style={styles.biometricTitle}>HisabHero App Lock</Text>
                <Text style={styles.biometricSubtitle}>
                  Biometric protection is active. Authenticate with your Fingerprint or Face ID to access your accounts.
                </Text>
                <TouchableOpacity
                  style={styles.biometricUnlockBtn}
                  onPress={async () => {
                    const success = await biometricService.authenticate();
                    if (success) {
                      setIsBiometricLocked(false);
                    }
                  }}
                >
                  <Text style={styles.biometricUnlockBtnText}>Unlock with Biometrics</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }

        if (!authToken || !user) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={{ color: '#ffffff', marginTop: 16, fontSize: 14, fontWeight: '700' }}>
                Setting up your Personal Workspace...
              </Text>
            </View>
          );
        }
        return (
          <AppNavigator
            authToken={authToken}
            user={user}
            apiBaseUrl={apiBaseUrl}
            onLogout={handleLogout}
            onUpdateApiUrl={handleUpdateApiUrl}
          />
        );
      default:
        return (
          <WelcomeScreen
            onSignIn={() => {
              setAuthInitialMode('login');
              setActiveScreen('login');
            }}
            onSignUp={() => {
              setAuthInitialMode('signup');
              setActiveScreen('login');
            }}
          />
        );
    }
  };

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <LanguageProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <AppContent renderScreen={renderScreen} />
          </ErrorBoundary>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#06111f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  splashAmbientOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    top: '30%',
    left: '50%',
    marginLeft: -160,
    marginTop: -160,
    shadowColor: '#10b981',
    shadowOpacity: 0.6,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  splashLogoWrapper: {
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: '#0a192f',
    borderWidth: 2,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.6,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    marginBottom: 22,
    overflow: 'hidden',
  },
  splashLogo: {
    width: 76,
    height: 76,
  },
  splashTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  splashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 20,
  },
  splashPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  splashBadgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  biometricLockCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0a192f',
    borderWidth: 1,
    borderColor: '#15345f',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  biometricIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  biometricTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  biometricSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  biometricUnlockBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  biometricUnlockBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
