import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Check, Mail, Sparkles, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../theme/themeSystem';
import { apiClient } from '../lib/apiClient';

interface OtpVerificationModalProps {
  visible: boolean;
  email: string;
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
}

const LEN = 6;
const DEMO_CODE = '656527';

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  visible,
  email,
  onClose,
  onSuccess,
}) => {
  const { theme, accentHex } = useTheme();
  const primaryColor = accentHex || '#10b981';

  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<'idle' | 'typing' | 'verifying' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);

  const inputRef = useRef<TextInput>(null);
  const timers = useRef<any[]>([]);

  // Box animation values
  const boxScales = useRef(Array.from({ length: LEN }, () => new Animated.Value(1))).current;
  const boxGlows = useRef(Array.from({ length: LEN }, () => new Animated.Value(0))).current;
  const checkScale = useRef(new Animated.Value(0.4)).current;
  const checkPulse = useRef(new Animated.Value(0.6)).current;
  const checkPulseOpacity = useRef(new Animated.Value(0.7)).current;
  const ambientGlowAnim = useRef(new Animated.Value(0)).current;

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const t = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      clearTimers();
      setCode('');
      setPhase('idle');
      setErrorMsg(null);
      setResendCooldown(60);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
    return clearTimers;
  }, [visible]);

  // Resend Countdown
  useEffect(() => {
    let interval: any;
    if (visible && resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible, resendCooldown]);

  // ─── AUTO DEMO MODE LOOP ───
  useEffect(() => {
    if (mode !== 'auto' || !visible) return;

    const run = () => {
      setPhase('idle');
      setCode('');
      let clock = 450;

      for (let i = 0; i < LEN; i++) {
        t(() => {
          setPhase('typing');
          const nextDigits = DEMO_CODE.slice(0, i + 1);
          setCode(nextDigits);
          // Scale pop
          Animated.sequence([
            Animated.timing(boxScales[i], { toValue: 1.15, duration: 120, useNativeDriver: true }),
            Animated.timing(boxScales[i], { toValue: 1, duration: 140, useNativeDriver: true }),
          ]).start();
        }, clock);
        clock += 360;
      }

      // Verifying sweep
      clock += 300;
      t(() => {
        setPhase('verifying');
        boxGlows.forEach((anim, i) => {
          setTimeout(() => {
            Animated.sequence([
              Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }),
              Animated.timing(anim, { toValue: 0.4, duration: 250, useNativeDriver: false }),
            ]).start();
          }, i * 90);
        });
      }, clock);

      // Success Checkmark
      clock += 900;
      t(() => {
        setPhase('success');
        triggerSuccessAnimations();
      }, clock);

      // Hold & Loop
      clock += 2400;
      t(run, clock);
    };

    run();
    return clearTimers;
  }, [mode, visible]);

  // ─── MANUAL VERIFICATION HANDLER ───
  const handleDigitsInput = (text: string) => {
    if (mode !== 'manual' || phase === 'verifying' || phase === 'success') return;
    const digits = text.replace(/\D/g, '').slice(0, LEN);
    setCode(digits);
    setPhase('typing');
    setErrorMsg(null);

    // Animate the just-typed box
    if (digits.length > 0) {
      const idx = digits.length - 1;
      Animated.sequence([
        Animated.timing(boxScales[idx], { toValue: 1.15, duration: 100, useNativeDriver: true }),
        Animated.timing(boxScales[idx], { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    }

    if (digits.length === LEN) {
      submitVerification(digits);
    }
  };

  const submitVerification = async (enteredCode: string) => {
    setPhase('verifying');

    // Sweep glowing pulse across boxes
    boxGlows.forEach((anim, i) => {
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0.5, duration: 200, useNativeDriver: false }),
        ]).start();
      }, i * 70);
    });

    try {
      const res = await apiClient.post('/api/auth/verify-code', {
        email: email.trim().toLowerCase(),
        code: enteredCode,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setPhase('success');
        triggerSuccessAnimations();

        setTimeout(() => {
          onSuccess(data.token, data.user);
          onClose();
        }, 1400);
      } else {
        setPhase('idle');
        setErrorMsg(data?.error || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      setPhase('idle');
      setErrorMsg('Network error connecting to verification service.');
    }
  };

  const triggerSuccessAnimations = () => {
    Animated.timing(ambientGlowAnim, { toValue: 1, duration: 600, useNativeDriver: false }).start();
    Animated.spring(checkScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
    Animated.parallel([
      Animated.timing(checkPulse, { toValue: 1.8, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(checkPulseOpacity, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      setResendCooldown(60);
      await apiClient.post('/api/auth/resend-code', { email: email.trim().toLowerCase() });
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg('Failed to resend code.');
    }
  };

  const verified = phase === 'success';
  const activeIndex = phase !== 'verifying' && !verified && code.length < LEN ? code.length : -1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: '#0f172a',
              borderColor: verified ? '#10b98180' : 'rgba(255,255,255,0.1)',
            },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={{ color: '#94a3b8', fontSize: 16, fontWeight: '700' }}>✕</Text>
          </TouchableOpacity>

          {/* Ambient Top Glow */}
          <Animated.View
            style={[
              styles.ambientGlow,
              {
                opacity: ambientGlowAnim,
              },
            ]}
          />

          {/* Heading */}
          <View style={styles.headingBox}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>{verified ? '✨' : '📬'}</Text>
            <Text style={[styles.title, { color: verified ? '#34d399' : '#f8fafc' }]}>
              {verified ? 'Verified successfully' : "Let's verify your email"}
            </Text>
            <Text style={styles.subtitle}>
              {verified
                ? 'Welcome to HisabHero! Initializing your workspace...'
                : `We've sent a 6-digit code to ${email || 'your email'}.\nType the code — it auto-verifies once complete.`}
            </Text>
          </View>

          {/* Body: 6 OTP Boxes OR Checkmark */}
          {!verified ? (
            <View style={styles.bodySlot}>
              {/* Hidden Real Input */}
              <TextInput
                ref={inputRef}
                style={styles.hiddenInput}
                value={code}
                onChangeText={handleDigitsInput}
                keyboardType="numeric"
                maxLength={LEN}
                autoFocus
              />

              {/* 6 Glowing OTP Boxes */}
              <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={styles.boxesRow}>
                {Array.from({ length: LEN }).map((_, i) => {
                  const digit = code[i];
                  const isFilled = i < code.length;
                  const isActive = i === activeIndex && mode === 'manual';
                  const isVerifying = phase === 'verifying';

                  return (
                    <Animated.View
                      key={i}
                      style={[
                        styles.otpBox,
                        {
                          transform: [{ scale: boxScales[i] }],
                          borderColor: isVerifying
                            ? '#34d399'
                            : isActive
                            ? primaryColor
                            : isFilled
                            ? '#38bdf8'
                            : 'rgba(255,255,255,0.12)',
                          backgroundColor: isActive ? '#0d1a29' : '#080d1a',
                          shadowColor: isVerifying ? '#34d399' : isActive ? primaryColor : 'transparent',
                          shadowOpacity: isVerifying || isActive ? 0.4 : 0,
                          shadowRadius: 10,
                          elevation: isActive ? 6 : 0,
                        },
                      ]}
                    >
                      {isFilled ? (
                        <Text style={[styles.digitText, { color: '#38bdf8' }]}>{digit}</Text>
                      ) : isActive ? (
                        <View style={[styles.caret, { backgroundColor: primaryColor }]} />
                      ) : null}
                    </Animated.View>
                  );
                })}
              </TouchableOpacity>

              {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

              {/* Manual vs Auto Demo Switcher */}
              <View style={styles.modeSwitcher}>
                <TouchableOpacity
                  onPress={() => {
                    setMode('manual');
                    clearTimers();
                    setCode('');
                    setPhase('idle');
                    inputRef.current?.focus();
                  }}
                  style={[styles.modeBtn, mode === 'manual' && { backgroundColor: primaryColor }]}
                >
                  <Text style={[styles.modeBtnText, mode === 'manual' && { color: '#ffffff', fontWeight: '800' }]}>
                    Manual
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setMode('auto');
                    clearTimers();
                    setCode('');
                  }}
                  style={[styles.modeBtn, mode === 'auto' && { backgroundColor: primaryColor }]}
                >
                  <Text style={[styles.modeBtnText, mode === 'auto' && { color: '#ffffff', fontWeight: '800' }]}>
                    Auto Demo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.successSlot}>
              <Animated.View
                style={[
                  styles.checkPulseRing,
                  {
                    transform: [{ scale: checkPulse }],
                    opacity: checkPulseOpacity,
                  },
                ]}
              />
              <Animated.View style={[styles.checkBox, { transform: [{ scale: checkScale }] }]}>
                <Check color="#34d399" size={38} strokeWidth={4} />
              </Animated.View>
            </View>
          )}

          {/* Footer Resend */}
          <View style={styles.footer}>
            <Text style={{ color: '#64748b', fontSize: 12 }}>Didn't receive the code?</Text>
            {resendCooldown > 0 ? (
              <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700' }}>Resend in {resendCooldown}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={{ color: primaryColor, fontSize: 12, fontWeight: '800' }}>Resend Code</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  ambientGlow: {
    position: 'absolute',
    top: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  headingBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  bodySlot: {
    width: '100%',
    alignItems: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  otpBox: {
    width: 44,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitText: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  caret: {
    width: 2,
    height: 22,
    borderRadius: 1,
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 3,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
  },
  modeBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  successSlot: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
    position: 'relative',
  },
  checkPulseRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#10b981',
  },
  checkBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
});
