import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();
import * as ImagePicker from 'expo-image-picker';
import {
  Settings,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ShieldCheck,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Calendar,
  Phone,
  Camera,
  Briefcase,
  Building2,
} from 'lucide-react-native';
import { useTheme } from '../theme/themeSystem';
import { useTranslation } from '../theme/i18n';
import { OtpVerificationModal } from './OtpVerificationModal';

const logoImg = require('../../assets/logo_transparent.png');

const SettingsIcon = Settings as any;
const EyeIcon = Eye as any;
const EyeOffIcon = EyeOff as any;
const LockIcon = Lock as any;
const MailIcon = Mail as any;
const UserIcon = User as any;
const ShieldCheckIcon = ShieldCheck as any;
const KeyRoundIcon = KeyRound as any;
const CheckCircleIcon = CheckCircle as any;
const AlertCircleIcon = AlertCircle as any;
const SparklesIcon = Sparkles as any;
const CalendarIcon = Calendar as any;
const PhoneIcon = Phone as any;
const CameraIcon = Camera as any;
const BriefcaseIcon = Briefcase as any;
const Building2Icon = Building2 as any;

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_CONFIGURED =
  GOOGLE_WEB_CLIENT_ID !== '' &&
  GOOGLE_WEB_CLIENT_ID !== 'REPLACE_WITH_WEB_CLIENT_ID';

type AuthMode = 'login' | 'signup' | 'forgotPassword' | 'resetPassword' | 'verifyEmail';

type LoginScreenProps = {
  apiBaseUrl: string;
  onLoginSuccess: (token: string, user: any) => void;
  onOpenSettings: () => void;
  initialMode?: 'login' | 'signup';
};

export function LoginScreen({ apiBaseUrl, onLoginSuccess, onOpenSettings, initialMode = 'login' }: LoginScreenProps) {
  const { theme, accentHex } = useTheme();
  const { t } = useTranslation();
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);

  useEffect(() => {
    setAuthMode(initialMode);
  }, [initialMode]);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [workspaceChoice, setWorkspaceChoice] = useState<'personal' | 'business'>('personal');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('Retail & Services');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpModalVisible, setOtpModalVisible] = useState(false);

  // ─── AMBIENT & TRANSITION ANIMATIONS (MATCHING WEBSITE AUTH.HTML) ───
  const orbScale = useRef(new Animated.Value(1)).current;
  const orbOpacity = useRef(new Animated.Value(0.2)).current;
  const cardFadeAnim = useRef(new Animated.Value(1)).current;
  const tabSlideAnim = useRef(new Animated.Value(initialMode === 'signup' ? 1 : 0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orbScale, { toValue: 1.22, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(orbOpacity, { toValue: 0.38, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(orbScale, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(orbOpacity, { toValue: 0.2, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);


  // ML Passport Photo Quality Validator
  const handlePickPassportPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permissions are required to upload a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        // ML Passport Aspect Ratio & Framing Check
        if (asset.width && asset.height) {
          const ratio = asset.width / asset.height;
          if (ratio > 1.35) {
            Alert.alert('Photo Quality Warning 📸', 'Please upload a clear passport-style photo with your face clearly visible.');
            return;
          }
        }
        const photoUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setProfilePhoto(photoUri);
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to select photo: ' + e.message);
    }
  };

  // Pre-warm backend connection
  useEffect(() => {
    const prewarmServer = async () => {
      try {
        await fetch(`${apiBaseUrl}/health`, { method: 'GET' });
        console.log('[LoginScreen] Server pre-warm ping sent successfully.');
      } catch (e) {
        console.warn('[LoginScreen] Pre-warm ping skipped.');
      }
    };
    prewarmServer();
  }, [apiBaseUrl]);

  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 15000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return response;
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Please check your network connection or backend server URL.');
      }
      throw err;
    }
  };

  // Password strength helper
  const getPasswordStrength = () => {
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    return { hasMinLength, hasUpper, hasNumber, hasSymbol };
  };

  // ─── LOGIN ──────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg('Connecting securely...');
    try {
      const res = await fetchWithTimeout(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { data = { error: text || 'Server returned invalid response.' }; }
      
      if (!res.ok) {
        if (data.requiresVerification || data.error?.includes('verify')) {
          setAuthMode('verifyEmail');
          throw new Error('Please verify your email before logging in. Enter the OTP code sent to your inbox.');
        }
        throw new Error(data.error || data.message || `Login failed (${res.status})`);
      }
      if (data.token && data.user) {
        const targetWsId = data.user.activeWorkspace?._id || data.user.activeWorkspace?.id || data.user.businessWorkspaces?.[0]?._id || data.user.personalWorkspaces?.[0]?._id || 'personal';
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        await AsyncStorage.setItem('activeWorkspaceId', targetWsId);
        onLoginSuccess(data.token, data.user);
      } else {
        throw new Error('Invalid response structure from server.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection error. Please try again.');
    } finally {
      setLoading(false);
      setStatusMsg(null);
    }
  };

  // ─── SIGNUP (PERSONAL ACCOUNT ONLY) ─────────────────────────────────────────
  const handleSignup = async () => {

    const cleanEmail = email.trim().toLowerCase();
    if (!fullName.trim() || !cleanEmail || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setStatusMsg('Creating account & sending OTP...');

    try {
      const res = await fetchWithTimeout(`${apiBaseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: cleanEmail,
          password,
          workspaceChoice,
          businessName: workspaceChoice === 'business' ? (businessName.trim() || `${fullName.trim()}'s Business`) : undefined,
          industry: workspaceChoice === 'business' ? industry : undefined,
          dateOfBirth,
          profilePhoto,
        }),
      });

      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { data = { error: text || 'Invalid server response.' }; }

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Registration failed.');
      }

      setAuthMode('verifyEmail');
      setResendCooldown(60);
      Alert.alert(
        'Verify Your Email ✉️',
        data.message || `A 6-digit verification code has been sent to ${cleanEmail}.`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
      setStatusMsg(null);
    }
  };

  // ─── VERIFY EMAIL OTP ───────────────────────────────────────────────────────
  const handleVerifyEmail = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!verificationCode.trim() || verificationCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg('Verifying OTP code...');
    try {
      const res = await fetchWithTimeout(`${apiBaseUrl}/auth/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: verificationCode.trim() }),
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { data = { error: text || 'Server returned invalid response.' }; }

      if (!res.ok) throw new Error(data.error || data.message || 'Verification code is invalid or expired.');

      Alert.alert('✅ Email Verified!', 'Welcome to HisabHero.');
      if (data.token && data.user) {
        const initialWsId = data.user.activeWorkspace?._id || (data.user.personalWorkspaces?.[0]?._id) || (data.user.businessWorkspaces?.[0]?._id) || 'personal';
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        await AsyncStorage.setItem('activeWorkspaceId', initialWsId);
        onLoginSuccess(data.token, data.user);
      } else {
        setAuthMode('login');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
      setStatusMsg(null);
    }
  };

  // ─── RESEND EMAIL OTP ───────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchWithTimeout(`${apiBaseUrl}/auth/resend-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendCooldown(60);
        Alert.alert('Code Resent 📧', data.message || `A new verification code has been sent to ${cleanEmail}.`);
      } else {
        throw new Error(data.error || data.message || 'Resend failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Resend failed.');
    } finally {
      setLoading(false);
    }
  };


  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchWithTimeout(`${apiBaseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Request failed.');
      Alert.alert('Code Dispatched 📧', data.message || 'A password reset code was sent to your email.');
      setAuthMode('resetPassword');
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to complete request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!verificationCode || !newPassword || !confirmPassword) {
      setErrorMsg('Please fill in all reset fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: verificationCode.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Reset failed.');
      Alert.alert('Success 🔑', data.message || 'Password has been reset! Log in with your new credentials.');
      setPassword('');
      setAuthMode('login');
    } catch (err: any) {
      setErrorMsg(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();
  const switchMode = (mode: AuthMode) => {
    setErrorMsg(null);
    if (mode === 'signup') {
      Animated.spring(tabSlideAnim, { toValue: 1, friction: 6, tension: 70, useNativeDriver: false }).start();
    } else if (mode === 'login') {
      Animated.spring(tabSlideAnim, { toValue: 0, friction: 6, tension: 70, useNativeDriver: false }).start();
    }
    Animated.sequence([
      Animated.timing(cardFadeAnim, { toValue: 0.4, duration: 80, useNativeDriver: true }),
      Animated.timing(cardFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setAuthMode(mode);
  };

  const tabIndicatorTranslate = tabSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 168],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* ─── AMBIENT GLOWING ORBS (MATCHING WEBSITE AUTH.HTML) ─── */}
      <Animated.View
        style={[
          styles.ambientOrbTop,
          {
            backgroundColor: (accentHex || '#10b981') + '25',
            opacity: orbOpacity,
            transform: [{ scale: orbScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ambientOrbBottom,
          {
            backgroundColor: (accentHex || '#10b981') + '20',
            opacity: orbOpacity,
            transform: [{ scale: orbScale }],
          },
        ]}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoCard, { borderColor: (accentHex || '#10b981') + '80', shadowColor: accentHex || '#10b981' }]}>
              <Image source={logoImg} style={styles.logoImage} resizeMode="contain" fadeDuration={0} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              Hisab<Text style={{ color: accentHex || '#10b981' }}>Hero</Text>
            </Text>
            {authMode === 'login' && (
              <>
                <Text style={[styles.headline, { color: theme.text }]}>Welcome Back</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Sign in to your financial &amp; ERP dashboard.</Text>
              </>
            )}
            {authMode === 'signup' && (
              <>
                <Text style={[styles.headline, { color: theme.text }]}>Create Your Account</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Join HisabHero to manage your Personal and Business workspaces seamlessly.</Text>
              </>
            )}
            {authMode === 'verifyEmail' && (
              <>
                <Text style={[styles.headline, { color: theme.text }]}>Verify your Email</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Enter the 6-digit OTP sent to your inbox.</Text>
              </>
            )}
            {authMode === 'forgotPassword' && (
              <>
                <Text style={[styles.headline, { color: theme.text }]}>Forgot Password?</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Enter your email to receive a password reset code.</Text>
              </>
            )}
            {authMode === 'resetPassword' && (
              <>
                <Text style={[styles.headline, { color: theme.text }]}>Reset Password</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Set a new secure password for your account.</Text>
              </>
            )}
          </View>

          {/* Sliding Segmented Tab Switcher (Sign In vs Create Account) */}
          {(authMode === 'login' || authMode === 'signup') && (
            <View style={[styles.segmentContainer, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder }]}>
              <Animated.View
                style={[
                  styles.segmentPill,
                  {
                    backgroundColor: accentHex || '#10b981',
                    transform: [{ translateX: tabIndicatorTranslate }],
                  },
                ]}
              />
              <TouchableOpacity
                style={styles.segmentBtn}
                onPress={() => switchMode('login')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    authMode === 'login' ? { color: '#ffffff', fontWeight: '800' } : { color: theme.textSecondary },
                  ]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.segmentBtn}
                onPress={() => switchMode('signup')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    authMode === 'signup' ? { color: '#ffffff', fontWeight: '800' } : { color: theme.textSecondary },
                  ]}
                >
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Form Card */}
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: (accentHex || '#10b981') + '60',
                shadowColor: accentHex || '#10b981',
                opacity: cardFadeAnim,
              },
            ]}
          >
            {errorMsg != null && (
              <View style={styles.errorBox}>
                <AlertCircleIcon color="#ff8f8f" size={16} style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {statusMsg != null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d2644', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <ActivityIndicator size="small" color="#4a90d9" style={{ marginRight: 10 }} />
                <Text style={{ color: '#a6c8f0', fontSize: 13, flex: 1 }}>{statusMsg}</Text>
              </View>
            )}

            {/* LOGIN FORM */}
            {authMode === 'login' && (
              <>
                <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <MailIcon color={theme.textMuted} size={18} style={styles.inputIcon} />
                  <TextInput placeholder="Email Address" placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.text }]} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                </View>
                <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <LockIcon color={theme.textMuted} size={18} style={styles.inputIcon} />
                  <TextInput placeholder="Password" placeholderTextColor={theme.textMuted} secureTextEntry={!showPassword} style={[styles.input, { color: theme.text }]} value={password} onChangeText={setPassword} autoCapitalize="none" autoCorrect={false} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    {showPassword ? <EyeOffIcon color={theme.textMuted} size={18} /> : <EyeIcon color={theme.textMuted} size={18} />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotBtn} onPress={() => switchMode('forgotPassword')}>
                  <Text style={[styles.forgotText, { color: accentHex }]}>Forgot password?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: accentHex }, loading && styles.submitBtnDisabled]} onPress={handleLogin} disabled={loading}>
                  {loading ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.submitBtnText}>Sign In</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.toggleBtn} onPress={() => switchMode('signup')}>
                  <Text style={[styles.toggleText, { color: theme.textSecondary }]}>Don't have an account? Create Account</Text>
                </TouchableOpacity>
              </>
            )}

            {/* SIGN UP FORM (PERSONAL ACCOUNT ONLY) */}
            {authMode === 'signup' && (
              <>
                {/* Passport Profile Photo Upload */}
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <TouchableOpacity onPress={handlePickPassportPhoto} style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: accentHex + '20', borderWidth: 2, borderColor: accentHex, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                    {profilePhoto ? (
                      <Image source={{ uri: profilePhoto }} style={{ width: 80, height: 80, borderRadius: 40 }} />
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <CameraIcon color={accentHex} size={26} />
                        <Text style={{ color: accentHex, fontSize: 10, marginTop: 2, fontWeight: '700' }}>PHOTO</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 6, fontWeight: '600' }}>
                    {profilePhoto ? 'Passport Photo Selected ✓' : 'Upload Passport-Style Photo (ML Validated)'}
                  </Text>
                </View>

                <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <UserIcon color={theme.textMuted} size={18} style={styles.inputIcon} />
                  <TextInput placeholder="Full Name *" placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.text }]} value={fullName} onChangeText={setFullName} autoCapitalize="words" />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <CalendarIcon color={theme.textMuted} size={18} style={styles.inputIcon} />
                  <TextInput placeholder="Date of Birth (DD/MM/YYYY) *" placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.text }]} value={dateOfBirth} onChangeText={setDateOfBirth} keyboardType="numbers-and-punctuation" />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <MailIcon color={theme.textMuted} size={18} style={styles.inputIcon} />
                  <TextInput placeholder="Email Address *" placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.text }]} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                </View>


                <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <LockIcon color={theme.textMuted} size={18} style={styles.inputIcon} />
                  <TextInput placeholder="Password *" placeholderTextColor={theme.textMuted} secureTextEntry={!showPassword} style={[styles.input, { color: theme.text }]} value={password} onChangeText={setPassword} autoCapitalize="none" autoCorrect={false} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    {showPassword ? <EyeOffIcon color={theme.textMuted} size={18} /> : <EyeIcon color={theme.textMuted} size={18} />}
                  </TouchableOpacity>
                </View>

                <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <LockIcon color={theme.textMuted} size={18} style={styles.inputIcon} />
                  <TextInput placeholder="Confirm Password *" placeholderTextColor={theme.textMuted} secureTextEntry={!showConfirmPassword} style={[styles.input, { color: theme.text }]} value={confirmPassword} onChangeText={setConfirmPassword} autoCapitalize="none" autoCorrect={false} />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                    {showConfirmPassword ? <EyeOffIcon color={theme.textMuted} size={18} /> : <EyeIcon color={theme.textMuted} size={18} />}
                  </TouchableOpacity>
                </View>

                {password.length > 0 && (
                  <View style={styles.strengthContainer}>
                    {[
                      { ok: strength.hasMinLength, label: 'At least 8 characters' },
                      { ok: strength.hasUpper, label: 'One uppercase letter' },
                      { ok: strength.hasNumber, label: 'One number' },
                      { ok: strength.hasSymbol, label: 'One special character' },
                    ].map(({ ok, label }) => (
                      <View key={label} style={styles.strengthRow}>
                        <CheckCircleIcon color={ok ? '#2ecc71' : '#5f88b8'} size={12} style={{ marginRight: 6 }} />
                        <Text style={[styles.strengthText, ok && styles.strengthActive]}>{label}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* CREATE YOUR HISABHERO WORKSPACE CHOICE */}
                <View style={{ marginTop: 8, marginBottom: 16 }}>
                  <Text style={{ color: theme.text, fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                    Create Your HisabHero Workspace
                  </Text>

                  {/* Option 1: Personal Workspace */}
                  <TouchableOpacity
                    onPress={() => setWorkspaceChoice('personal')}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: workspaceChoice === 'personal' ? accentHex : theme.cardBorder,
                      backgroundColor: workspaceChoice === 'personal' ? (accentHex + '15') : theme.inputBg,
                      marginBottom: 10
                    }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: workspaceChoice === 'personal' ? accentHex : theme.cardBorder, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <UserIcon color="#ffffff" size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13 }}>PERSONAL WORKSPACE</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                        Manage your personal finances, expenses, savings and financial goals.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Option 2: Business Workspace */}
                  <TouchableOpacity
                    onPress={() => setWorkspaceChoice('business')}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: workspaceChoice === 'business' ? accentHex : theme.cardBorder,
                      backgroundColor: workspaceChoice === 'business' ? (accentHex + '15') : theme.inputBg
                    }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: workspaceChoice === 'business' ? accentHex : theme.cardBorder, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <BriefcaseIcon color="#ffffff" size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13 }}>BUSINESS WORKSPACE</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                        Manage your business finances, invoices, inventory, payroll and team.
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Conditional Business Details */}
                {workspaceChoice === 'business' && (
                  <>
                    <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                      <Building2Icon color={theme.textMuted} size={18} style={styles.inputIcon} />
                      <TextInput
                        placeholder="Company / Business Name *"
                        placeholderTextColor={theme.textMuted}
                        style={[styles.input, { color: theme.text }]}
                        value={businessName}
                        onChangeText={setBusinessName}
                        autoCapitalize="words"
                      />
                    </View>
                    <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                      <BriefcaseIcon color={theme.textMuted} size={18} style={styles.inputIcon} />
                      <TextInput
                        placeholder="Industry (e.g. Retail, Consulting, IT)"
                        placeholderTextColor={theme.textMuted}
                        style={[styles.input, { color: theme.text }]}
                        value={industry}
                        onChangeText={setIndustry}
                      />
                    </View>
                  </>
                )}

                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: accentHex }, loading && styles.submitBtnDisabled]} onPress={handleSignup} disabled={loading}>
                  {loading ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.submitBtnText}>Create Account</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.toggleBtn} onPress={() => switchMode('login')}>
                  <Text style={[styles.toggleText, { color: theme.textSecondary }]}>Already have an account? Sign In</Text>
                </TouchableOpacity>
              </>
            )}

            {/* VERIFY EMAIL */}
            {authMode === 'verifyEmail' && (
              <>
                <Text style={[styles.otpHelperText, { color: theme.textSecondary, textAlign: 'center', marginBottom: 16 }]}>
                  We've sent a verification code to:{'\n'}
                  <Text style={{ fontWeight: '700', color: theme.text }}>{email}</Text>
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <ShieldCheckIcon color={theme.textMuted} size={18} style={styles.inputIcon} />
                  <TextInput
                    placeholder="[ _ _ _ _ _ _ ]"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    style={[styles.input, { color: theme.text, letterSpacing: 6, fontWeight: '800', fontSize: 20 }]}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    maxLength={6}
                    autoFocus
                  />
                </View>
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: accentHex }, loading && styles.submitBtnDisabled]} onPress={handleVerifyEmail} disabled={loading}>
                  {loading ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.submitBtnText}>Verify Email</Text>}
                </TouchableOpacity>

                <View style={{ marginTop: 14, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 6 }}>Didn't receive the code?</Text>
                  {resendCooldown > 0 ? (
                    <Text style={{ fontSize: 13, color: theme.textSecondary, fontWeight: '600' }}>
                      Resend available in {resendCooldown} seconds
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                      <Text style={{ fontSize: 13, color: accentHex, fontWeight: '700' }}>Resend code</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity style={styles.toggleBtn} onPress={() => switchMode('login')}>
                  <Text style={[styles.toggleText, { color: theme.textSecondary }]}>Back to Login</Text>
                </TouchableOpacity>
              </>
            )}


            {/* FORGOT PASSWORD */}
            {authMode === 'forgotPassword' && (
              <>
                <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <MailIcon color={theme.textMuted} size={18} style={styles.inputIcon} />
                  <TextInput placeholder="Email Address" placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.text }]} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                </View>
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: accentHex }, loading && styles.submitBtnDisabled]} onPress={handleForgotPassword} disabled={loading}>
                  {loading ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.submitBtnText}>Send Reset Code</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.toggleBtn} onPress={() => switchMode('login')}>
                  <Text style={[styles.toggleText, { color: theme.textSecondary }]}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            )}

            {/* RESET PASSWORD */}
            {authMode === 'resetPassword' && (
              <>
                <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <KeyRoundIcon color={theme.textMuted} size={18} style={styles.inputIcon} />
                  <TextInput placeholder="6-digit Reset Code" placeholderTextColor={theme.textMuted} keyboardType="numeric" style={[styles.input, { color: theme.text }]} value={verificationCode} onChangeText={setVerificationCode} maxLength={6} />
                </View>
                <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <LockIcon color={theme.textMuted} size={18} style={styles.inputIcon} />
                  <TextInput placeholder="New Password" placeholderTextColor={theme.textMuted} secureTextEntry={!showPassword} style={[styles.input, { color: theme.text }]} value={newPassword} onChangeText={setNewPassword} autoCapitalize="none" autoCorrect={false} />
                </View>
                <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <LockIcon color={theme.textMuted} size={18} style={styles.inputIcon} />
                  <TextInput placeholder="Confirm New Password" placeholderTextColor={theme.textMuted} secureTextEntry={!showConfirmPassword} style={[styles.input, { color: theme.text }]} value={confirmPassword} onChangeText={setConfirmPassword} autoCapitalize="none" autoCorrect={false} />
                </View>
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: accentHex }, loading && styles.submitBtnDisabled]} onPress={handleResetPassword} disabled={loading}>
                  {loading ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.submitBtnText}>Reset Password</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.toggleBtn} onPress={() => switchMode('login')}>
                  <Text style={[styles.toggleText, { color: theme.textSecondary }]}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Animated Glowing 6-box OTP Verification Modal */}
      <OtpVerificationModal
        visible={otpModalVisible || authMode === 'verifyEmail'}
        email={email}
        onClose={() => {
          setOtpModalVisible(false);
          if (authMode === 'verifyEmail') setAuthMode('login');
        }}
        onSuccess={async (token, user) => {
          setOtpModalVisible(false);
          const initialWsId = user.activeWorkspace?._id || user.personalWorkspaces?.[0]?._id || 'personal';
          await AsyncStorage.setItem('token', token);
          await AsyncStorage.setItem('user', JSON.stringify(user));
          await AsyncStorage.setItem('activeWorkspaceId', initialWsId);
          onLoginSuccess(token, user);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative', overflow: 'hidden' },
  ambientOrbTop: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -50,
    left: -40,
    shadowColor: '#10b981',
    shadowOpacity: 0.5,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  ambientOrbBottom: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    bottom: -60,
    right: -50,
    shadowColor: '#10b981',
    shadowOpacity: 0.4,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  scrollContainer: { paddingHorizontal: 24, paddingVertical: 28, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 18 },
  logoCard: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: '#0a192f',
    borderWidth: 2,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  logoFallback: {
    position: 'absolute',
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a192f',
  },
  logoImage: { width: 84, height: 84, borderRadius: 22 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: 0.5 },
  headline: { fontSize: 18, fontWeight: '800', marginTop: 10, marginBottom: 4 },
  subtitle: { fontSize: 13, textAlign: 'center', paddingHorizontal: 16 },
  
  // Segmented Pill Tabs
  segmentContainer: {
    width: '100%',
    maxWidth: 340,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    padding: 2,
    marginBottom: 20,
  },
  segmentPill: {
    position: 'absolute',
    width: 166,
    height: 40,
    borderRadius: 20,
    top: 2,
    left: 2,
    shadowColor: '#10b981',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  segmentBtn: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  segmentBtnText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 22,
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b1414', borderColor: '#7f1d1d', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: '#ff8f8f', fontSize: 12, fontWeight: '600', flex: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, height: 48, paddingHorizontal: 14, marginBottom: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14 },
  eyeBtn: { padding: 4 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 16 },
  forgotText: { fontSize: 12, fontWeight: '700' },
  submitBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 14,
    shadowColor: '#10b981',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },
  toggleBtn: { alignItems: 'center', paddingVertical: 8 },
  toggleText: { fontSize: 13, fontWeight: '600' },
  strengthContainer: { marginBottom: 14, paddingLeft: 4 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  strengthText: { fontSize: 11, color: '#5f88b8' },
  strengthActive: { color: '#2ecc71', fontWeight: '700' },
  infoBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 14 },
  infoBadgeText: { fontSize: 11, lineHeight: 15, flex: 1, fontWeight: '600' },
  otpHelperText: { fontSize: 13, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
});
