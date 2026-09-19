import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Sparkles,
  Activity,
  Zap,
  FileText,
  BookOpen,
  ShieldCheck,
  Users,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { useTheme } from '../theme/themeSystem';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface FeatureTourModalProps {
  visible: boolean;
  onClose: () => void;
}

interface TourStep {
  id: string;
  icon: any;
  iconColor: string;
  badge: string;
  title: string;
  headline: string;
  description: string;
  bulletPoints: string[];
}

export function FeatureTourModal({ visible, onClose }: FeatureTourModalProps) {
  const { theme, accentHex } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const steps: TourStep[] = [
    {
      id: 'welcome',
      icon: Sparkles,
      iconColor: '#38bdf8',
      badge: 'WELCOME TO HISABHERO',
      title: 'Smart Financial OS',
      headline: 'Next-Gen Financial Intelligence',
      description:
        'HisabHero empowers modern businesses, freelancers, and individuals with enterprise-grade bookkeeping, AI automation, and forensic security.',
      bulletPoints: [
        'Real-time cash flow & survival runway calculation',
        'Sub-20ms bank statement parsing with 100% precision',
        'Military-grade cryptographic Merkle audit trail',
      ],
    },
    {
      id: 'runway',
      icon: Activity,
      iconColor: '#10b981',
      badge: 'PILLAR 1: LIQUIDITY & HEALTH',
      title: 'Runway & Health Score',
      headline: 'Know Exactly When You Run Out of Cash',
      description:
        'Monitor net burn rate, operating efficiency, and runway horizons. Click "Analyze" anytime to run a 3-pillar diagnostic of your finances.',
      bulletPoints: [
        'Live cash runway projections based on actual burn rate',
        'Health score gauge evaluating margin efficiency & liquidity',
        'Actionable CFO copilot recommendations',
      ],
    },
    {
      id: 'quicklog',
      icon: Zap,
      iconColor: '#f59e0b',
      badge: 'PILLAR 2: ZERO-FRICTION LOGGING',
      title: 'Natural Language Quick Log',
      headline: 'Log Expenses in Human Language',
      description:
        'Skip tedious multi-field forms. Just type or dictate what happened, and HisabHero does the rest in milliseconds.',
      bulletPoints: [
        'Type "Swiggy 450 UPI" or "Client payment 50000 NEFT"',
        'Auto-extracts amount, flow type, category & payment mode',
        'Voice bookkeeper for hands-free audio transaction logging',
      ],
    },
    {
      id: 'documents',
      icon: FileText,
      iconColor: '#8b5cf6',
      badge: 'PILLAR 3: DOCUMENT INTELLIGENCE',
      title: 'Bank Statement Parser',
      headline: 'Upload Any Bank Statement PDF',
      description:
        'Our native parsing engine effortlessly extracts transactions from SBI, ICICI, HDFC, IOB, Indian Bank, and 30+ other institutions.',
      bulletPoints: [
        'Instant table extraction with debit/credit precision',
        'Auto-stitches multi-line UPI narration & handles page breaks',
        'Review & approve workspace ledger sync in 1 tap',
      ],
    },
    {
      id: 'khata',
      icon: BookOpen,
      iconColor: '#ec4899',
      badge: 'PILLAR 4: VYAPAR B2B LEDGER',
      title: 'Customer & Vendor Khata',
      headline: 'Collect Udhar & Track Payables Faster',
      description:
        'Maintain individual party balances for customers and suppliers. Send automated payment reminders to settle accounts on time.',
      bulletPoints: [
        'Send professional WhatsApp payment reminders in 1 click',
        'Dynamic UPI QR codes embedded in ledger statements',
        'Complete debit/credit history with running balances',
      ],
    },
    {
      id: 'merkle',
      icon: ShieldCheck,
      iconColor: '#06b6d4',
      badge: 'PILLAR 5: CRYPTOGRAPHIC SECURITY',
      title: 'Merkle Audit Vault',
      headline: 'Tamper-Proof Financial Ledger',
      description:
        'Every transaction is hashed into a SHA-256 Merkle tree. Any unauthorized ledger tampering or backdating is immediately flagged with forensic proof.',
      bulletPoints: [
        'Export verifiable cryptographic audit certificates',
        'Independent mathematical proof of ledger integrity',
        'Bank-grade AES-256 and PostgreSQL row-level security',
      ],
    },
    {
      id: 'team',
      icon: Users,
      iconColor: '#3b82f6',
      badge: 'PILLAR 6: WORKSPACE COLLABORATION',
      title: 'Team & 12-Char Join Codes',
      headline: 'Invite Your Team & Accountant',
      description:
        'Share your workspace with custom 12-character join codes (e.g. HERO-WS-SELVA1) and granular role-based permissions.',
      bulletPoints: [
        'Roles: Owner, Manager, Accountant, Employee, Viewer',
        'Approve or decline incoming member requests',
        'Switch seamlessly between Personal and Business workspaces',
      ],
    },
  ];

  const animateTransition = (nextIndex: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: nextIndex > currentStep ? -15 : 15, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setCurrentStep(nextIndex);
      slideAnim.setValue(nextIndex > currentStep ? 15 : -15);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      animateTransition(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      animateTransition(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenAppTour_v1', 'true');
      await AsyncStorage.removeItem('showFeatureTourOnLaunch');
    } catch (e) {}
    onClose();
  };

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === steps.length - 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleComplete}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={[styles.badgeContainer, { backgroundColor: `${step.iconColor}20` }]}>
              <Text style={[styles.badgeText, { color: step.iconColor }]}>{step.badge}</Text>
            </View>
            <TouchableOpacity onPress={handleComplete} style={styles.skipBtn} activeOpacity={0.7}>
              <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip Tour</Text>
              <X size={16} color={theme.textSecondary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {/* Animated Slide Content */}
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {/* Big Feature Icon */}
            <View style={[styles.iconCircle, { backgroundColor: `${step.iconColor}15`, borderColor: `${step.iconColor}40` }]}>
              <StepIcon size={38} color={step.iconColor} />
            </View>

            {/* Title & Headline */}
            <Text style={[styles.title, { color: theme.text }]}>{step.title}</Text>
            <Text style={[styles.headline, { color: step.iconColor }]}>{step.headline}</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>{step.description}</Text>

            {/* Feature Highlights */}
            <View style={styles.bulletList}>
              {step.bulletPoints.map((pt, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <CheckCircle2 size={16} color={step.iconColor} style={styles.bulletIcon} />
                  <Text style={[styles.bulletText, { color: theme.text }]}>{pt}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Footer Navigation */}
          <View style={styles.footer}>
            {/* Step Pagination Dots */}
            <View style={styles.dotsContainer}>
              {steps.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => animateTransition(i)}
                  style={[
                    styles.dot,
                    i === currentStep
                      ? [styles.activeDot, { backgroundColor: step.iconColor, width: 22 }]
                      : { backgroundColor: theme.cardBorder },
                  ]}
                />
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonsRow}>
              {currentStep > 0 && (
                <TouchableOpacity
                  onPress={handlePrev}
                  style={[styles.prevBtn, { borderColor: theme.cardBorder }]}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={18} color={theme.text} />
                  <Text style={[styles.prevBtnText, { color: theme.text }]}>Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleNext}
                style={[
                  styles.nextBtn,
                  {
                    backgroundColor: isLast ? '#10b981' : accentHex,
                    flex: currentStep === 0 ? 1 : undefined,
                  },
                ]}
                activeOpacity={0.85}
              >
                <Text style={styles.nextBtnText}>
                  {isLast ? 'Get Started 🚀' : 'Next Feature'}
                </Text>
                {!isLast && <ChevronRight size={18} color="#fff" style={{ marginLeft: 4 }} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: Math.min(width - 32, 420),
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  headline: {
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  bulletList: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletIcon: {
    marginRight: 10,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
    lineHeight: 17,
  },
  footer: {
    gap: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    height: 6,
    borderRadius: 3,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  prevBtnText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
