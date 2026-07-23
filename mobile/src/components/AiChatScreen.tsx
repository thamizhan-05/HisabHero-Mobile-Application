import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
} from 'react-native';
import { Send, Sparkles, User } from 'lucide-react-native';

import { apiClient } from '../lib/apiClient';

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Hello! I'm HisabHero AI, your dedicated financial assistant. Ask me questions like:\n\n• What is my current cash runway?\n• How is my business financial health?\n• What are my top expense categories?",
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
      let style: any = isBot ? styles.botText : styles.userText;
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
        <View key={lIdx} style={[styles.textLine, isBullet && styles.bulletLine]}>
          {isBullet && <Text style={styles.bulletDot}>•</Text>}
          <Text style={style}>{formattedLine}</Text>
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* Header info */}
            <View style={styles.chatHeader}>
              <SparklesIcon color="#4f8cff" size={18} style={{ marginRight: 8 }} />
              <Text style={styles.chatHeaderTitle}>AI Financial Advisor</Text>
            </View>

            {/* Message List */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isBot = item.sender === 'bot';
                return (
                  <View style={[styles.messageRow, isBot ? styles.rowLeft : styles.rowRight]}>
                    {isBot && (
                      <View style={styles.avatarBox}>
                        <SparklesIcon color="#ffffff" size={14} />
                      </View>
                    )}
                    <View style={[styles.bubble, isBot ? styles.bubbleBot : styles.bubbleUser]}>
                      {renderMessageText(item.text, isBot)}
                      <Text style={[styles.timestamp, isBot ? styles.timeBot : styles.timeUser]}>
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    {!isBot && (
                      <View style={styles.userAvatarBox}>
                        <UserIcon color="#ffffff" size={14} />
                      </View>
                    )}
                  </View>
                );
              }}
              ListFooterComponent={
                loading ? (
                  <View style={styles.typingIndicatorRow}>
                    <View style={styles.avatarBox}>
                      <SparklesIcon color="#ffffff" size={14} />
                    </View>
                    <View style={styles.typingBubble}>
                      <ActivityIndicator size="small" color="#4f8cff" />
                    </View>
                  </View>
                ) : null
              }
            />

            {/* Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask HisabHero AI..."
                placeholderTextColor="#5f88b8"
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim()}
              >
                <SendIcon color="#ffffff" size={18} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06111f',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#15345f',
    backgroundColor: '#0b1d38',
  },
  chatHeaderTitle: {
    color: '#ffffff',
    fontSize: 14,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1c4f9d',
    borderWidth: 1,
    borderColor: '#7fb2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  userAvatarBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4f8cff',
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
    backgroundColor: '#0b1d38',
    borderWidth: 1,
    borderColor: '#15345f',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: '#1c4f9d',
    borderBottomRightRadius: 4,
  },
  botText: {
    color: '#c3d6f3',
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
  bulletLine: {
    flexDirection: 'row',
    paddingLeft: 6,
    alignItems: 'flex-start',
  },
  bulletDot: {
    color: '#4f8cff',
    marginRight: 6,
    fontSize: 14,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: '#ffffff',
  },
  timestamp: {
    fontSize: 9,
    marginTop: 6,
    textAlign: 'right',
  },
  timeBot: {
    color: '#8fc0ff',
  },
  timeUser: {
    color: '#a6bedf',
  },
  typingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  typingBubble: {
    backgroundColor: '#0b1d38',
    borderWidth: 1,
    borderColor: '#15345f',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#15345f',
    backgroundColor: '#0b1d38',
  },
  input: {
    flex: 1,
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    color: '#ffffff',
    fontSize: 14,
    marginRight: 10,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4f8cff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#4f8cff',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
  },
  sendBtnDisabled: {
    backgroundColor: '#2b509d',
    elevation: 0,
    shadowOpacity: 0,
  },
});
