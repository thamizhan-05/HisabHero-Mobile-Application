import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
} from 'react-native';
import { Send, Sparkles, User } from 'lucide-react-native';

import { apiClient } from '../lib/apiClient';
import { useTheme } from '../theme/themeSystem';
import { parseVoiceFinancialPrompt } from '../services/voiceBookkeeperService';
import { useTranslation } from '../theme/i18n';

const SendIcon = Send as any;
const SparklesIcon = Sparkles as any;
const UserIcon = User as any;

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

type AiChatScreenProps = {
  apiBaseUrl: string;
  authToken: string | null;
  financialContext: any;
};

export function AiChatScreen({ apiBaseUrl, authToken, financialContext }: AiChatScreenProps) {
  const { theme, accentHex } = useTheme();
  const { t, language } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: t('ai_welcome') || "Hello! I'm HisabHero AI, your dedicated financial assistant. Ask me questions like:\n\n• What is my current cash runway?\n• How is my business financial health?\n• What are my top expense categories?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessageText = inputText.trim();
    setInputText('');
    Keyboard.dismiss();

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userMessageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build context package for AI
      const ctx = {
        stats: financialContext.stats || [],
        revenueExpense: financialContext.runway || [],
        runway: financialContext.runway || [],
        runwayMonths: financialContext.runwayMonths || 0,
        alerts: financialContext.alerts || [],
        expenses: financialContext.expenses || [],
      };

      const res = await apiClient.post('/ai/chat', {
        message: userMessageText,
        language: language,
        context: ctx,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to connect to AI');
      }

      // Add bot message
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply || "I didn't receive a reply. Could you try asking again?",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: `⚠️ Error: ${err.message || 'Unable to fetch response. Make sure GEMINI_API_KEY is configured in the backend.'}`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Simple formatting helper inside chat bubbles
  const renderMessageText = (text: string, isBot: boolean) => {
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      let content = line.trim();
      let style: any = isBot ? [styles.botText, { color: theme.text }] : [styles.userText, { color: '#ffffff' }];
      let isBullet = false;

      if (!content) return <View key={lIdx} style={{ height: 6 }} />;

      if (content.startsWith('•') || content.startsWith('*') || content.startsWith('-')) {
        content = content.replace(/^[•*\-]\s*/, '').trim();
        isBullet = true;
      }

      const parts = content.split('**');
      const formattedLine = parts.map((part, pIdx) => {
        const isBold = pIdx % 2 === 1;
        return (
          <Text key={pIdx} style={isBold ? styles.bold : null}>
            {part}
          </Text>
        );
      });

      return (
        <View key={lIdx} style={[styles.textLine, isBullet && (styles as any).bulletLine]}>
          {isBullet && <Text style={styles.bulletDot}>•</Text>}
          <Text style={style}>{formattedLine}</Text>
        </View>
      );
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={{ flex: 1 }}>
          {/* Header info */}
          <View style={[styles.chatHeader, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.chatHeaderTitle, { color: theme.text }]}>HisabHero</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '600' }}>AI CFO Assistant</Text>
            </View>
            <View style={[styles.activeCtxBadge, { backgroundColor: '#0284c718', borderColor: '#0284c740' }]}>
              <SparklesIcon color="#38bdf8" size={11} style={{ marginRight: 4 }} />
              <Text style={styles.activeCtxBadgeText}>Active Financial Context</Text>
            </View>
          </View>

          {/* Message List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const isBot = item.sender === 'bot';
              return (
                <View style={[styles.messageRow, isBot ? styles.rowLeft : styles.rowRight]}>
                  <View style={[styles.bubble, isBot ? [styles.bubbleBot, { backgroundColor: theme.card, borderColor: theme.cardBorder }] : [styles.bubbleUser, { backgroundColor: '#1e293b', borderColor: '#334155' }]]}>
                    {renderMessageText(item.text, isBot)}
                    <Text style={[styles.timestamp, { color: theme.textMuted }]}>
                      {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListFooterComponent={
              loading ? (
                <View style={styles.typingIndicatorRow}>
                  <View style={[styles.typingBubble, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <ActivityIndicator size="small" color="#38bdf8" />
                  </View>
                </View>
              ) : null
            }
          />

          {/* Suggested Prompts Chips */}
          <View style={{ paddingVertical: 6 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              {[
                "Analyze Tax Savings",
                "Vendor Price Spikes",
                "Generate P&L Report",
                "How is my cash runway looking?",
                "Show monthly budget health"
              ].map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  style={[styles.promptChip, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={() => {
                    setInputText(prompt);
                  }}
                >
                  <Text style={[styles.promptChipText, { color: theme.text }]}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Glowing Input Bar */}
          <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: '#38bdf840' }]}>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: 'transparent' }]}
              placeholder={t('ai_input_placeholder') || 'Ask AI CFO anything...'}
              placeholderTextColor={theme.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline={false}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: '#06b6d4' }, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || loading}
            >
              <SendIcon color="#ffffff" size={17} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  activeCtxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  activeCtxBadgeText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
    alignItems: 'flex-end',
  },
  rowLeft: {
    alignSelf: 'flex-start',
  },
  rowRight: {
    alignSelf: 'flex-end',
  },
  avatarBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  userAvatarBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginBottom: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleBot: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  botText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  textLine: {
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bulletDot: {
    fontSize: 14,
    marginRight: 6,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeBot: {},
  timeUser: {},
  typingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  typingBubble: {
    borderWidth: 1,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  promptChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  promptChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 100,
    fontSize: 14,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
