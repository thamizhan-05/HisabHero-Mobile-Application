import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated
} from 'react-native';
import { Mic, MicOff, Sparkles, CheckCircle, X, ArrowRight, Volume2 } from 'lucide-react-native';
import { useTheme } from '../theme/themeSystem';
import { apiClient } from '../lib/apiClient';

interface VoiceCommandModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SAMPLE_COMMANDS = [
  'Paid ₹3,500 for petrol today',
  'Aaj ₹25,000 client A se mil gaya',
  'Office internet and wifi bill ₹1,499',
  'Team dinner and food ₹4,200',
  'Software cloud subscription ₹8,500'
];

export const VoiceCommandModal: React.FC<VoiceCommandModalProps> = ({ visible, onClose, onSuccess }) => {
  const { theme } = useTheme();
  const [spokenText, setSpokenText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastLogged, setLastLogged] = useState<{ message: string; parsed: any } | null>(null);

  const handleSubmit = async (textToSubmit?: string) => {
    const text = (textToSubmit || spokenText).trim();
    if (!text) {
      Alert.alert('Prompt Required', 'Please speak or enter a voice command.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/api/ai/voice-expense', { spokenText: text });
      const data = await res.json();
      if (res.ok && data?.success) {
        setLastLogged({
          message: data.message,
          parsed: data.parsed
        });
        setSpokenText('');
        if (onSuccess) onSuccess();
      } else {
        Alert.alert('Error', data?.error || 'Failed to process voice command.');
      }
    } catch (err: any) {
      Alert.alert('Processing Error', err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      // Simulate listening transcription with a realistic voice prompt
      setTimeout(() => {
        const randomSample = SAMPLE_COMMANDS[Math.floor(Math.random() * SAMPLE_COMMANDS.length)];
        setSpokenText(randomSample);
        setIsListening(false);
      }, 1800);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: '#10b98140' }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>HisabHero AI Voice Bookkeeper</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.bg }]}>
              <X size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Recognized Text Display Card */}
          {spokenText ? (
            <View style={[styles.recognizedCard, { backgroundColor: '#064e3b25', borderColor: '#10b98160' }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '700' }}>Recognized:</Text>
                <Text style={[styles.recognizedText, { color: theme.text }]}>{spokenText}</Text>
              </View>
              <CheckCircle size={20} color="#10b981" />
            </View>
          ) : null}

          {/* Central Pulsating Microphone Wave Orb */}
          <View style={styles.micContainer}>
            <Text style={[styles.micListeningHeader, { color: theme.textSecondary }]}>
              {isListening ? 'Listening...' : 'Tap to Speak'}
            </Text>
            <Text style={[styles.micPromptSub, { color: theme.textMuted }]}>
              Say something like:{'\n'}"Spent ₹2,400 on fuel today"
            </Text>

            <TouchableOpacity
              onPress={handleToggleListening}
              activeOpacity={0.85}
              style={[
                styles.micOrbWrapper,
                {
                  borderColor: isListening ? '#10b981' : '#10b98150',
                  shadowColor: '#10b981',
                }
              ]}
            >
              <View style={[styles.micOrbInner, { backgroundColor: isListening ? '#059669' : '#10b981' }]}>
                {isListening ? <MicOff size={38} color="#ffffff" /> : <Mic size={38} color="#ffffff" />}
              </View>
            </TouchableOpacity>
          </View>

          {/* Parsed Entity Tags (if logged or recognized) */}
          {lastLogged?.parsed ? (
            <View style={styles.tagsContainer}>
              <View style={[styles.tagPill, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                <Text style={styles.tagLabel}>Category:</Text>
                <Text style={[styles.tagVal, { color: theme.text }]}>{lastLogged.parsed.category || 'General'}</Text>
              </View>
              <View style={[styles.tagPill, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                <Text style={styles.tagLabel}>Amount:</Text>
                <Text style={[styles.tagVal, { color: '#10b981' }]}>₹{lastLogged.parsed.amount}</Text>
              </View>
              <View style={[styles.tagPill, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                <Text style={styles.tagLabel}>Type:</Text>
                <Text style={[styles.tagVal, { color: theme.text }]}>{lastLogged.parsed.type || 'Expense'}</Text>
              </View>
            </View>
          ) : null}

          {/* Action Button: Confirm & Save */}
          <TouchableOpacity
            onPress={() => handleSubmit()}
            disabled={loading || !spokenText.trim()}
            style={[
              styles.confirmBtn,
              {
                backgroundColor: spokenText.trim() ? '#10b981' : theme.bg,
                borderColor: spokenText.trim() ? '#10b981' : theme.cardBorder,
              }
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text
                style={[
                  styles.confirmBtnText,
                  { color: spokenText.trim() ? '#ffffff' : theme.textMuted }
                ]}
              >
                Confirm & Save Transaction
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recognizedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  recognizedText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  micContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  micListeningHeader: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  micPromptSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  micOrbWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 16,
  },
  micOrbInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tagPill: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  tagLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  tagVal: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  confirmBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#10b981',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
