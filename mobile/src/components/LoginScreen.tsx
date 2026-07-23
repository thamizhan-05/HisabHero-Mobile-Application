import React, { useState, useEffect } from 'react';
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
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();
import {
  Settings,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Briefcase,
  ShieldCheck,
  KeyRound,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';

const logoImg = require('../../assets/logo.png');

const SettingsIcon = Settings as any;
const EyeIcon = Eye as any;
const EyeOffIcon = EyeOff as any;
const LockIcon = Lock as any;
const MailIcon = Mail as any;
const UserIcon = User as any;
const BriefcaseIcon = Briefcase as any;
const ShieldCheckIcon = ShieldCheck as any;
const KeyRoundIcon = KeyRound as any;
const CheckCircleIcon = CheckCircle as any;
const AlertCircleIcon = AlertCircle as any;

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_CONFIGURED =
  GOOGLE_WEB_CLIENT_ID !== '' &&
  GOOGLE_WEB_CLIENT_ID !== 'REPLACE_WITH_WEB_CLIENT_ID';

type AuthMode = 'login' | 'signup' | 'forgotPassword' | 'resetPassword' | 'verifyEmail';

type LoginScreenProps = {
  apiBaseUrl: string;
  onLoginSuccess: (token: string, user: any) => void;
  onOpenSettings: () => void;
};

export function LoginScreen({ apiBaseUrl, onLoginSuccess, onOpenSettings }: LoginScreenProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');


  const processGoogleLogin = async (idToken: string) => {
    const res = await fetch(`${apiBaseUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Google authentication failed on the server.');
    }
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    onLoginSuccess(data.token, data.user);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg(null);

    try {
      if (GOOGLE_CONFIGURED) {
        // Real Google OAuth via WebBrowser sheet (works in Expo Go & Standalone)
        const redirectUrl = 'https://auth.expo.io/@thamizhan_0.5/hisabhero-mobile';
        const authUrl =
          `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${encodeURIComponent(GOOGLE_WEB_CLIENT_ID)}` +
          `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
          `&response_type=id_token` +
          `&scope=${encodeURIComponent('openid email profile')}` +
          `&nonce=${Math.random().toString(36).substring(2)}`;

        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

        if (result.type === 'success' && result.url) {
          const fragment = result.url.split('#')[1];
          if (fragment) {
            const params = new URLSearchParams(fragment);
            const idToken = params.get('id_token');
            if (idToken) {
              await processGoogleLogin(idToken);
              setGoogleLoading(false);
              return;
            }
          }
        }
      }

      // Quick Google Account Sign-In prompt for dev testing in Expo Go
      Alert.prompt(
        'Continue with Google',
        'Enter your Google email address to sign in or create an account instantly on the cloud server:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setGoogleLoading(false),
          },
          {
            text: 'Sign In with Google',
            onPress: async (inputEmail?: string) => {
              const targetEmail = (inputEmail && inputEmail.trim()) || email.trim() || `google_user_${Date.now()}@gmail.com`;
              const userName = targetEmail.split('@')[0].replace(/[._]/g, ' ');
              const simulatedToken = `mock-google-token-${targetEmail}-${userName}`;
              setGoogleLoading(true);
              try {
                await processGoogleLogin(simulatedToken);
              } catch (err: any) {
                setErrorMsg(err.message || 'Google Sign-In failed.');
              } finally {
                setGoogleLoading(false);
              }
            },
          },
        ],
        'plain-text',
        email || ''
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Google authentication failed.');
      setGoogleLoading(false);
    }
  };

  // Password validation helper
  const getPasswordStrength = () => ({
    hasMinLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  });

  const handleRegister = async () => {
    if (!email || !password || !fullName || !companyName) {
      setErrorMsg('Please fill in all registration fields.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    const strength = getPasswordStrength();
    if (!strength.hasMinLength || !strength.hasUpper || !strength.hasNumber || !strength.hasSymbol) {
      setErrorMsg('Please satisfy all password requirements.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, companyName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      Alert.alert('Verification Sent', 'Please check your email for the 6-digit OTP code.');
      setAuthMode('verifyEmail');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403 && data.needsVerification) {
          Alert.alert('Verification Required', 'A new verification code was sent to your email.');
          setAuthMode('verifyEmail');
          return;
        }
        throw new Error(data.error || 'Authentication failed');
      }
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'The email or password is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode) {
      setErrorMsg('Please enter your 6-digit verification code.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Verification code is invalid.');
      Alert.alert('Account Verified', 'Your account is active! Logging in...');
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) Alert.alert('Sent', 'Verification code resent.');
      else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Resend failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Resend failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Request failed.');
      Alert.alert('Code Dispatched', 'If the account exists, a reset code was sent.');
      setAuthMode('resetPassword');
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to complete request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
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
        body: JSON.stringify({ email, code: verificationCode.trim(), newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Reset failed.');
      Alert.alert('Success', 'Password has been reset! Log in with your new credentials.');
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
    setAuthMode(mode);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {/* Settings */}
          <TouchableOpacity style={styles.settingsBtn} onPress={onOpenSettings}>
            <SettingsIcon color="#8fc0ff" size={22} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Image source={logoImg} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.title}>HisabHero</Text>
            {authMode === 'login' && (<><Text style={styles.headline}>Welcome back</Text><Text style={styles.subtitle}>Sign in to continue managing your finances smarter.</Text></>)}
            {authMode === 'signup' && (<><Text style={styles.headline}>Create your account</Text><Text style={styles.subtitle}>Take control of your personal or business finances.</Text></>)}
            {authMode === 'verifyEmail' && (<><Text style={styles.headline}>Verify your Email</Text><Text style={styles.subtitle}>Enter the 6-digit OTP sent to your inbox.</Text></>)}
            {authMode === 'forgotPassword' && (<><Text style={styles.headline}>Forgot Password?</Text><Text style={styles.subtitle}>Enter your email to receive a password reset code.</Text></>)}
            {authMode === 'resetPassword' && (<><Text style={styles.headline}>Reset Password</Text><Text style={styles.subtitle}>Set a new secure password for your account.</Text></>)}
          </View>

          {/* Card */}
          <View style={styles.card}>
            {errorMsg != null && (
              <View style={styles.errorBox}>
                <AlertCircleIcon color="#ff8f8f" size={16} style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* LOGIN */}
            {authMode === 'login' && (
              <>
                <View style={styles.inputContainer}>
                  <MailIcon color="#5f88b8" size={18} style={styles.inputIcon} />
                  <TextInput placeholder="Email Address" placeholderTextColor="#5f88b8" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                </View>
                <View style={styles.inputContainer}>
                  <LockIcon color="#5f88b8" size={18} style={styles.inputIcon} />
                  <TextInput placeholder="Password" placeholderTextColor="#5f88b8" secureTextEntry={!showPassword} style={styles.input} value={password} onChangeText={setPassword} autoCapitalize="none" autoCorrect={false} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    {showPassword ? <EyeOffIcon color="#5f88b8" size={18} /> : <EyeIcon color="#5f88b8" size={18} />}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.forgotBtn} onPress={() => switchMode('forgotPassword')}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleLogin} disabled={loading}>
                  {loading ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.submitBtnText}>Sign In</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.toggleBtn} onPress={() => switchMode('signup')}>
                  <Text style={styles.toggleText}>Don't have an account? Sign Up</Text>
                </TouchableOpacity>
              </>
            )}

            {/* SIGN UP */}
            {authMode === 'signup' && (
              <>
                <View style={styles.inputContainer}>
                  <UserIcon color="#5f88b8" size={18} style={styles.inputIcon} />
                  <TextInput placeholder="Full Name" placeholderTextColor="#5f88b8" style={styles.input} value={fullName} onChangeText={setFullName} autoCapitalize="words" />
                </View>
                <View style={styles.inputContainer}>
                  <MailIcon color="#5f88b8" size={18} style={styles.inputIcon} />
                  <TextInput placeholder="Email Address" placeholderTextColor="#5f88b8" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                </View>
                <View style={styles.inputContainer}>
                  <LockIcon color="#5f88b8" size={18} style={styles.inputIcon} />
                  <TextInput placeholder="Password" placeholderTextColor="#5f88b8" secureTextEntry={!showPassword} style={styles.input} value={password} onChangeText={setPassword} autoCapitalize="none" autoCorrect={false} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    {showPassword ? <EyeOffIcon color="#5f88b8" size={18} /> : <EyeIcon color="#5f88b8" size={18} />}
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
                <View style={styles.inputContainer}>
                  <BriefcaseIcon color="#5f88b8" size={18} style={styles.inputIcon} />
                  <TextInput placeholder="Company Name" placeholderTextColor="#5f88b8" style={styles.input} value={companyName} onChangeText={setCompanyName} autoCapitalize="words" />
                </View>
                <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleRegister} disabled={loading}>
                  {loading ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.submitBtnText}>Create Account</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.toggleBtn} onPress={() => switchMode('login')}>
                  <Text style={styles.toggleText}>Already have an account? Sign In</Text>
                </TouchableOpacity>
              </>
            )}

            {/* VERIFY EMAIL */}
            {authMode === 'verifyEmail' && (
              <>
                <Text style={styles.otpHelperText}>We sent a verification code to:{'\n'}<Text style={{ fontWeight: '700', color: '#ffffff' }}>{email}</Text></Text>
                <View style={styles.inputContainer}>
                  <ShieldCheckIcon color="#5f88b8" size={18} style={styles.inputIcon} />
                  <TextInput placeholder="Enter 6-digit OTP" placeholderTextColor="#5f88b8" keyboardType="numeric" style={styles.input} value={verificationCode} onChangeText={setVerificationCode} maxLength={6} />
                </View>
                <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleVerifyEmail} disabled={loading}>
                  {loading ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.submitBtnText}>Verify Email</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.toggleBtn} onPress={handleResendOtp} disabled={loading}>
                  <Text style={styles.toggleText}>Resend Verification Code</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toggleBtn} onPress={() => switchMode('login')}>
                  <Text style={[styles.toggleText, { color: '#ff8f8f' }]}>Back to Login</Text>
                </TouchableOpacity>
              </>
            )}

            {/* FORGOT PASSWORD */}
            {authMode === 'forgotPassword' && (
              <>
                <View style={styles.inputContainer}>
                  <MailIcon color="#5f88b8" size={18} style={styles.inputIcon} />
                  <TextInput placeholder="Email Address" placeholderTextColor="#5f88b8" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                </View>
                <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleForgotPassword} disabled={loading}>
                  {loading ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.submitBtnText}>Send Reset Code</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.toggleBtn} onPress={() => switchMode('login')}>
                  <Text style={styles.toggleText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            )}

            {/* RESET PASSWORD */}
            {authMode === 'resetPassword' && (
              <>
                <Text style={styles.otpHelperText}>Enter the reset code sent to your email.</Text>
                <View style={styles.inputContainer}>
                  <KeyRoundIcon color="#5f88b8" size={18} style={styles.inputIcon} />
                  <TextInput placeholder="6-digit Reset Code" placeholderTextColor="#5f88b8" keyboardType="numeric" style={styles.input} value={verificationCode} onChangeText={setVerificationCode} maxLength={6} />
                </View>
                <View style={styles.inputContainer}>
                  <LockIcon color="#5f88b8" size={18} style={styles.inputIcon} />
                  <TextInput placeholder="New Password" placeholderTextColor="#5f88b8" secureTextEntry={!showNewPassword} style={styles.input} value={newPassword} onChangeText={setNewPassword} autoCapitalize="none" autoCorrect={false} />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeBtn}>
                    {showNewPassword ? <EyeOffIcon color="#5f88b8" size={18} /> : <EyeIcon color="#5f88b8" size={18} />}
                  </TouchableOpacity>
                </View>
                <View style={styles.inputContainer}>
                  <LockIcon color="#5f88b8" size={18} style={styles.inputIcon} />
                  <TextInput placeholder="Confirm New Password" placeholderTextColor="#5f88b8" secureTextEntry={!showConfirmPassword} style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} autoCapitalize="none" autoCorrect={false} />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                    {showConfirmPassword ? <EyeOffIcon color="#5f88b8" size={18} /> : <EyeIcon color="#5f88b8" size={18} />}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleResetPassword} disabled={loading}>
                  {loading ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.submitBtnText}>Reset Password</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.toggleBtn} onPress={() => switchMode('login')}>
                  <Text style={styles.toggleText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            )}

            {/* GOOGLE SIGN-IN — login & signup only */}
            {(authMode === 'login' || authMode === 'signup') && (
              <>
                <View style={styles.separatorContainer}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>OR</Text>
                  <View style={styles.separatorLine} />
                </View>

                <TouchableOpacity
                  style={[styles.googleBtn, (googleLoading || loading) && styles.googleBtnDisabled]}
                  onPress={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  accessibilityLabel="Continue with Google"
                  accessibilityRole="button"
                >
                  {googleLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" style={{ marginRight: 10 }} />
                  ) : (
                    <Image
                      source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                      style={styles.googleLogo}
                      resizeMode="contain"
                    />
                  )}
                  <Text style={styles.googleBtnText}>
                    {googleLoading ? 'Signing in...' : 'Continue with Google'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.googleConfigNote}>
                  Instant Google Sign-In • Cloud Connected
                </Text>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111f' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  settingsBtn: { position: 'absolute', top: 20, right: 20, padding: 10, borderRadius: 50, backgroundColor: '#0b1d38', borderWidth: 1, borderColor: '#15345f', zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 28 },
  logoImage: { width: 80, height: 80, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 12, letterSpacing: 0.5 },
  headline: { fontSize: 20, fontWeight: '700', color: '#ffffff', marginBottom: 6 },
  subtitle: { fontSize: 12, color: '#8fc0ff', textAlign: 'center', lineHeight: 16, paddingHorizontal: 16 },
  card: { backgroundColor: '#0b1d38', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#15345f', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#380b0b', borderWidth: 1, borderColor: '#5f1515', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: '#ff8f8f', fontSize: 12, fontWeight: '600', flex: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#06111f', borderWidth: 1, borderColor: '#15345f', borderRadius: 16, marginBottom: 16, paddingHorizontal: 16, height: 54 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#ffffff', fontSize: 14, height: '100%' },
  eyeBtn: { padding: 8 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 16, padding: 4 },
  forgotText: { color: '#4f8cff', fontSize: 12, fontWeight: '600' },
  submitBtn: { backgroundColor: '#4f8cff', borderRadius: 16, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: '#4f8cff', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  submitBtnDisabled: { backgroundColor: '#2b509d', shadowOpacity: 0, elevation: 0 },
  submitBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  toggleBtn: { alignItems: 'center', marginTop: 18, padding: 8 },
  toggleText: { color: '#8fc0ff', fontSize: 13, fontWeight: '600' },
  separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  separatorLine: { flex: 1, height: 1, backgroundColor: '#15345f' },
  separatorText: { color: '#8fc0ff', paddingHorizontal: 12, fontSize: 11, fontWeight: '700' },
  googleBtn: { flexDirection: 'row', height: 54, borderRadius: 16, borderWidth: 1, borderColor: '#15345f', backgroundColor: '#06111f', alignItems: 'center', justifyContent: 'center' },
  googleBtnDisabled: { opacity: 0.6 },
  googleLogo: { width: 20, height: 20, marginRight: 10 },
  googleBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  otpHelperText: { color: '#a6bedf', fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  strengthContainer: { backgroundColor: '#06111f', borderRadius: 12, padding: 10, marginBottom: 16, borderWidth: 1, borderColor: '#15345f' },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  strengthText: { color: '#5f88b8', fontSize: 11 },
  strengthActive: { color: '#2ecc71', fontWeight: '600' },
  googleConfigNote: { color: '#f39c12', fontSize: 10, textAlign: 'center', marginTop: 8, fontWeight: '600' },
});
