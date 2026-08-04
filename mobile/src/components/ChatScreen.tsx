import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Send, MessageSquare, Users, Lock, Hash } from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';

const SendIcon = Send as any;
const MessageSquareIcon = MessageSquare as any;
const UsersIcon = Users as any;
const LockIcon = Lock as any;
const HashIcon = Hash as any;

type Props = {
  activeWorkspaceId?: string;
  workspaceRole?: string;
  currentUser?: any;
  workspaceMembers?: any[];
};

type ChatMode = 'workspace' | 'personal';

export function ChatScreen({ activeWorkspaceId, workspaceRole, currentUser, workspaceMembers = [] }: Props) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [chatMode, setChatMode] = useState<ChatMode>('workspace');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const scrollRef = useRef<ScrollView>(null);

  const isEmployee = workspaceRole === 'employee';

  useEffect(() => {
    if (activeWorkspaceId && activeWorkspaceId !== 'personal') {
      fetchMessages();
    } else {
      setLoading(false);
    }
  }, [activeWorkspaceId, chatMode, selectedUser]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const receiverId = chatMode === 'personal' && selectedUser ? selectedUser.userId : null;
      const url = `/chat/messages${receiverId ? `?receiverId=${receiverId}` : ''}`;
      const res = await apiClient.get(url, activeWorkspaceId);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const receiverId = chatMode === 'personal' && selectedUser ? selectedUser.userId : null;
    try {
      const res = await apiClient.post('/chat/messages', {
        message: text.trim(),
        receiverId: receiverId || null,
      }, activeWorkspaceId);
      const d = await res.json();
      if (res.ok) {
        setText('');
        setMessages(prev => [...prev, d]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
      } else if (d.code === 'EMPLOYEE_CHAT_RESTRICTED') {
        Alert.alert('Not Allowed', "You don't have permission to start this conversation.");
      } else {
        Alert.alert('Error', d.error || 'Failed to send message.');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
    setSending(false);
  };

  const handleSelectUser = (member: any) => {
    if (isEmployee && member.role === 'employee') {
      Alert.alert(
        'Not Allowed',
        "You don't have permission to start this conversation."
      );
      return;
    }
    setSelectedUser(member);
    setChatMode('personal');
    setMessages([]);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const myId = currentUser?.id || currentUser?._id;

  if (!activeWorkspaceId || activeWorkspaceId === 'personal') {
    return (
      <View style={styles.emptyContainer}>
        <MessageSquareIcon color="#1e3a5f" size={52} />
        <Text style={styles.emptyTitle}>Business Workspace Only</Text>
        <Text style={styles.emptySubtitle}>Chat is available inside Business Workspaces.</Text>
      </View>
    );
  }

  const otherMembers = workspaceMembers.filter(m => m.userId !== myId);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.chatTabs}>
          <TouchableOpacity
            style={[styles.chatTab, chatMode === 'workspace' && styles.chatTabActive]}
            onPress={() => { setChatMode('workspace'); setSelectedUser(null); }}
            activeOpacity={0.8}
          >
            <HashIcon color={chatMode === 'workspace' ? '#60a5fa' : '#4a6080'} size={15} />
            <Text style={[styles.chatTabText, chatMode === 'workspace' && styles.chatTabTextActive]}>
              Workspace
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chatTab, chatMode === 'personal' && styles.chatTabActive]}
            onPress={() => setChatMode('personal')}
            activeOpacity={0.8}
          >
            <UsersIcon color={chatMode === 'personal' ? '#60a5fa' : '#4a6080'} size={15} />
            <Text style={[styles.chatTabText, chatMode === 'personal' && styles.chatTabTextActive]}>
              Direct
            </Text>
          </TouchableOpacity>
        </View>
        {chatMode === 'personal' && selectedUser && (
          <Text style={styles.selectedUserLabel}>→ {selectedUser.fullName || selectedUser.email}</Text>
        )}
      </View>

      {/* Member list for DM selection */}
      {chatMode === 'personal' && !selectedUser && (
        <ScrollView style={styles.memberList} showsVerticalScrollIndicator={false}>
          <Text style={styles.memberListHeader}>Select a member to message:</Text>
          {otherMembers.map((m, i) => {
            const canChat = !(isEmployee && m.role === 'employee');
            return (
              <TouchableOpacity
                key={i}
                style={[styles.memberItem, !canChat && styles.memberItemDisabled]}
                onPress={() => handleSelectUser(m)}
                activeOpacity={0.8}
              >
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{(m.fullName || m.email || 'U')[0].toUpperCase()}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{m.fullName || m.email}</Text>
                  <Text style={styles.memberRole}>{m.role?.toUpperCase()}</Text>
                </View>
                {!canChat && (
                  <View style={styles.restrictedBadge}>
                    <LockIcon color="#f59e0b" size={12} />
                    <Text style={styles.restrictedText}>Restricted</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          {otherMembers.length === 0 && (
            <Text style={styles.noMembersText}>No other members in this workspace.</Text>
          )}
        </ScrollView>
      )}

      {/* Messages */}
      {(chatMode === 'workspace' || (chatMode === 'personal' && selectedUser)) && (
        <>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#60a5fa" size="large" />
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.messagesList}
              contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 && (
                <View style={styles.emptyMessages}>
                  <MessageSquareIcon color="#1e3a5f" size={36} />
                  <Text style={styles.emptyMessagesText}>
                    {chatMode === 'workspace'
                      ? 'Start the workspace conversation! Say hello 👋'
                      : `Start a conversation with ${selectedUser?.fullName || 'this member'}`
                    }
                  </Text>
                </View>
              )}
              {messages.map((msg, i) => {
                const isMine = msg.senderId === myId;
                const showDate = i === 0 || formatDate(messages[i - 1]?.createdAt) !== formatDate(msg.createdAt);
                return (
                  <React.Fragment key={msg.id || i}>
                    {showDate && (
                      <View style={styles.dateLabel}>
                        <Text style={styles.dateLabelText}>{formatDate(msg.createdAt)}</Text>
                      </View>
                    )}
                    <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.theirBubble]}>
                      {!isMine && (
                        <Text style={styles.senderName}>{msg.senderName || 'Member'}</Text>
                      )}
                      <Text style={[styles.messageText, isMine && styles.myMessageText]}>
                        {msg.message}
                      </Text>
                      <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
                        {formatTime(msg.createdAt)}
                      </Text>
                    </View>
                  </React.Fragment>
                );
              })}
            </ScrollView>
          )}

          {/* Input area */}
          <View style={styles.inputArea}>
            <TextInput
              style={styles.textInput}
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor="#2a4a6a"
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
              activeOpacity={0.8}
            >
              {sending
                ? <ActivityIndicator color="#fff" size="small" />
                : <SendIcon color="#fff" size={18} />
              }
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111f' },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  chatTabs: { flexDirection: 'row', gap: 10 },
  chatTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chatTabActive: { backgroundColor: 'rgba(96,165,250,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)' },
  chatTabText: { color: '#4a6080', fontSize: 13, fontWeight: '600' },
  chatTabTextActive: { color: '#60a5fa' },
  selectedUserLabel: { color: '#60a5fa', fontSize: 12, marginTop: 8, fontWeight: '600' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messagesList: { flex: 1 },
  emptyMessages: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyMessagesText: { color: '#1e3a5f', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  dateLabel: { alignItems: 'center', marginVertical: 12 },
  dateLabelText: { color: '#2a4a6a', fontSize: 11, fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  messageBubble: {
    maxWidth: '80%',
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#1d4ed8', borderBottomRightRadius: 4 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.07)', borderBottomLeftRadius: 4 },
  senderName: { color: '#60a5fa', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  messageText: { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
  myMessageText: { color: '#e2f0ff' },
  messageTime: { color: '#2a4a6a', fontSize: 10, marginTop: 4, textAlign: 'right' },
  myMessageTime: { color: 'rgba(255,255,255,0.4)' },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0a1929',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    color: '#e2f0ff',
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#0f2040' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#06111f', paddingHorizontal: 30, gap: 14 },
  emptyTitle: { color: '#2a4a6a', fontSize: 18, fontWeight: '700' },
  emptySubtitle: { color: '#1e3a5f', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  memberList: { flex: 1, paddingHorizontal: 16 },
  memberListHeader: { color: '#4a7aa0', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16, marginBottom: 10 },
  memberItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, marginBottom: 8 },
  memberItemDisabled: { opacity: 0.5 },
  memberAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1d4ed8', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  memberAvatarText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  memberInfo: { flex: 1 },
  memberName: { color: '#d1e8ff', fontSize: 14, fontWeight: '600' },
  memberRole: { color: '#4a7aa0', fontSize: 11, marginTop: 2, fontWeight: '500' },
  restrictedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,158,11,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  restrictedText: { color: '#f59e0b', fontSize: 10, fontWeight: '600' },
  noMembersText: { color: '#2a4a6a', fontSize: 14, textAlign: 'center', marginTop: 30 },
});
