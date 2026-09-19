import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Linking,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { X, Mail, Phone, MessageSquare, Send, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../theme/themeSystem';
import { apiFetch } from '../lib/apiClient';

interface ContactSupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ContactSupportModal({ visible, onClose }: ContactSupportModalProps) {
  const { theme, accentHex } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Missing Fields', 'Please enter your name, email, and message.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiFetch('/public/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || 'Mobile App Inquiry',
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data?.success) {
        setSentSuccess(true);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        Alert.alert('Error', data?.error || 'Failed to submit contact request.');
      }
    } catch {
      Alert.alert('Network Error', 'Could not connect to HisabHero servers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWhatsApp = () => {
    Linking.openURL('https://wa.me/919876543210?text=Hello%20HisabHero%20Support');
  };

  const handleCall = () => {
    Linking.openURL('tel:+919876543210');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@hisabhero.com');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Contact & Support</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X color={theme.text} size={22} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Support Channels Banner */}
          <View style={[styles.supportCard, { backgroundColor: theme.isDark ? '#1e1b4b' : '#f0f4ff', borderColor: accentHex + '30' }]}>
            <Text style={[styles.supportTitle, { color: theme.text }]}>24/7 Financial Support</Text>
            <Text style={[styles.supportSub, { color: theme.textSecondary }]}>
              Our financial engineering team is here around the clock for your business and personal accounting queries.
            </Text>

            <View style={styles.channelButtonsRow}>
              <TouchableOpacity style={[styles.channelBtn, { backgroundColor: '#25D366' }]} onPress={handleOpenWhatsApp}>
                <MessageSquare color="#ffffff" size={16} />
                <Text style={styles.channelBtnText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.channelBtn, { backgroundColor: accentHex }]} onPress={handleEmail}>
                <Mail color="#ffffff" size={16} />
                <Text style={styles.channelBtnText}>Email Support</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.channelBtn, { backgroundColor: '#0f172a' }]} onPress={handleCall}>
                <Phone color="#ffffff" size={16} />
                <Text style={styles.channelBtnText}>Call Us</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Section */}
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.formTitle, { color: theme.text }]}>Send Message to HisabHero Team</Text>

            {sentSuccess ? (
              <View style={styles.successBox}>
                <CheckCircle2 color="#10b981" size={40} style={{ marginBottom: 10 }} />
                <Text style={[styles.successTitle, { color: theme.text }]}>Message Received!</Text>
                <Text style={[styles.successSub, { color: theme.textSecondary }]}>
                  Thank you for reaching out. Our support team will get back to you within 24 hours.
                </Text>
                <TouchableOpacity
                  style={[styles.resetBtn, { backgroundColor: accentHex }]}
                  onPress={() => setSentSuccess(false)}
                >
                  <Text style={styles.resetBtnText}>Send Another Message</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.label, { color: theme.text }]}>Full Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.cardBorder }]}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={setName}
                />

                <Text style={[styles.label, { color: theme.text }]}>Email Address *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.cardBorder }]}
                  placeholder="name@company.com"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />

                <Text style={[styles.label, { color: theme.text }]}>Subject</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.cardBorder }]}
                  placeholder="Accounting query, feedback, or feature request"
                  placeholderTextColor={theme.textSecondary}
                  value={subject}
                  onChangeText={setSubject}
                />

                <Text style={[styles.label, { color: theme.text }]}>Message *</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: theme.bg, color: theme.text, borderColor: theme.cardBorder },
                  ]}
                  placeholder="Describe your inquiry..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={message}
                  onChangeText={setMessage}
                />

                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: accentHex }, loading && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Send color="#ffffff" size={18} style={{ marginRight: 8 }} />
                      <Text style={styles.submitBtnText}>Submit Message</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.footerNote}>
            <ShieldCheck color="#10b981" size={16} style={{ marginRight: 6 }} />
            <Text style={[styles.footerNoteText, { color: theme.textSecondary }]}>
              HisabHero Enterprise Financial Encryption Active
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 20,
  },
  supportCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  supportSub: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  channelButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  channelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  channelBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  formCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 14,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  successSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  resetBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  footerNoteText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
