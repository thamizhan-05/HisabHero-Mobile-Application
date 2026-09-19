import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Globe,
  CheckCircle2,
  X,
  Lock,
} from 'lucide-react-native';
import { useTheme } from '../theme/themeSystem';
import { useTranslation, LANGUAGES } from '../theme/i18n';
import { ContactSupportModal } from './ContactSupportModal';

const logoImg = require('../../assets/logo_transparent.png');

export function WelcomeScreen({ onSignIn, onSignUp }: { onSignIn: () => void; onSignUp: () => void }) {
  const { theme, accentHex } = useTheme();
  const { t, language, setLanguage } = useTranslation();

  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);

  // Animated Entrance Sequence (Starts with full visibility so logo is never hidden)
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(15)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(contentFade, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(contentSlide, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ctaFade, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(ctaSlide, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      {/* ─── TOP BAR (LANGUAGE + SUPPORT) ─── */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />

        <View style={styles.topBarRight}>
          {/* Language Picker Button */}
          <TouchableOpacity
            style={[styles.langBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => setLangModalVisible(true)}
            activeOpacity={0.75}
          >
            <Globe color={accentHex} size={13} style={{ marginRight: 6 }} />
            <Text style={[styles.langBtnText, { color: theme.text }]}>
              {LANGUAGES.find((l) => l.code === language)?.native || 'EN'}
            </Text>
          </TouchableOpacity>

          {/* Support Button */}
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => setContactModalVisible(true)}
            activeOpacity={0.75}
          >
            <HelpCircle color={theme.textSecondary} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── CENTERED CONTENT CONTAINER ─── */}
      <View style={styles.centerContainer}>
        
        {/* BRAND LOGO WITH BACKGROUND */}
        <Animated.View
          style={[
            styles.brandSection,
            {
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={[styles.logoCard, { borderColor: (accentHex || '#10b981') + '80', shadowColor: accentHex || '#10b981' }]}>
            <Image
              source={logoImg}
              style={styles.logoImage}
              resizeMode="contain"
              fadeDuration={0}
            />
          </View>
          
          <Text style={[styles.brandTitle, { color: theme.text }]}>
            Hisab<Text style={{ color: accentHex || '#10b981' }}>Hero</Text>
          </Text>
        </Animated.View>

        {/* SINGLE CLEAN TAGLINE */}
        <Animated.View
          style={[
            styles.taglineSection,
            {
              opacity: contentFade,
              transform: [{ translateY: contentSlide }],
            },
          ]}
        >
          <Text style={[styles.brandTagline, { color: theme.textSecondary }]}>
            Smart Financial &amp; ERP Intelligence for Businesses and Individuals
          </Text>
        </Animated.View>

        {/* ─── ACTION BUTTONS (CREATE ACCOUNT & SIGN IN) ─── */}
        <Animated.View
          style={[
            styles.ctaSection,
            {
              opacity: ctaFade,
              transform: [{ translateY: ctaSlide }],
            },
          ]}
        >
          {/* Primary Action: Create Account */}
          <TouchableOpacity
            style={[styles.primaryCtaBtn, { backgroundColor: accentHex }]}
            onPress={onSignUp}
            activeOpacity={0.88}
          >
            <Sparkles color="#ffffff" size={17} style={{ marginRight: 8 }} />
            <Text style={styles.primaryCtaText}>Create Account</Text>
            <ArrowRight color="#ffffff" size={18} style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          {/* Secondary Action: Sign In */}
          <TouchableOpacity
            style={[styles.secondaryCtaBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={onSignIn}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryCtaText, { color: theme.text }]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </Animated.View>

      </View>

      {/* ─── FOOTER SECURITY BADGE ─── */}
      <View style={styles.footerWrap}>
        <View style={styles.securityBadge}>
          <ShieldCheck color="#10b981" size={13} style={{ marginRight: 6 }} />
          <Text style={[styles.securityText, { color: theme.textMuted }]}>
            Bank-Grade 256-Bit SSL • Merkle Audit Vault
          </Text>
        </View>
      </View>

      {/* ─── LANGUAGE SWITCHER MODAL ─── */}
      <Modal visible={langModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.langModalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Globe color={accentHex} size={18} style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Select Language</Text>
              </View>
              <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                <X color={theme.textSecondary} size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {LANGUAGES.map((item) => {
                const isSelected = language === item.code;
                return (
                  <TouchableOpacity
                    key={item.code}
                    style={[
                      styles.langOption,
                      isSelected && { backgroundColor: accentHex + '18', borderColor: accentHex },
                    ]}
                    onPress={() => {
                      setLanguage(item.code);
                      setLangModalVisible(false);
                    }}
                  >
                    <View>
                      <Text style={[styles.langNative, { color: theme.text }]}>{item.native}</Text>
                      <Text style={[styles.langName, { color: theme.textSecondary }]}>{item.name}</Text>
                    </View>
                    {isSelected && <CheckCircle2 color={accentHex} size={18} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── CONTACT SUPPORT MODAL ─── */}
      <ContactSupportModal
        visible={contactModalVisible}
        onClose={() => setContactModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 14,
    paddingBottom: 8,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoCard: {
    width: 110,
    height: 110,
    borderRadius: 26,
    backgroundColor: '#0a192f',
    borderWidth: 2,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  logoFallback: {
    position: 'absolute',
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a192f',
  },
  logoImage: {
    width: 110,
    height: 110,
    borderRadius: 26,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  taglineSection: {
    marginBottom: 36,
    maxWidth: 320,
  },
  brandTagline: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    textAlign: 'center',
  },
  ctaSection: {
    width: '100%',
    maxWidth: 340,
    gap: 12,
  },
  primaryCtaBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  primaryCtaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  secondaryCtaBtn: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaText: {
    fontSize: 15,
    fontWeight: '700',
  },
  footerWrap: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  langModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 6,
  },
  langNative: {
    fontSize: 15,
    fontWeight: '700',
  },
  langName: {
    fontSize: 11,
    marginTop: 2,
  },
});
