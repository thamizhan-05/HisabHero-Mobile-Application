import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X, CheckCircle, AlertTriangle, Users, UserPlus, Trash2, Shield, User } from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';

const XIcon = X as any;
const CheckCircleIcon = CheckCircle as any;
const AlertTriangleIcon = AlertTriangle as any;
const UsersIcon = Users as any;
const UserPlusIcon = UserPlus as any;
const Trash2Icon = Trash2 as any;
const ShieldIcon = Shield as any;
const UserIcon = User as any;

type SettingsModalProps = {
  visible: boolean;
  onClose: () => void;
  apiBaseUrl: string;
  onSave: (newUrl: string) => void;
  activeWorkspaceId?: string;
  activeWorkspaceRole?: string;
};

type ViewType = 'server' | 'team';

export function SettingsModal({ 
  visible, 
  onClose, 
  apiBaseUrl, 
  onSave, 
  activeWorkspaceId, 
  activeWorkspaceRole 
}: SettingsModalProps) {
  const [activeView, setActiveView] = useState<ViewType>('server');
  const [url, setUrl] = useState(apiBaseUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Team Management States
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'partner' | 'accountant' | 'manager' | 'employee' | 'viewer'>('viewer');
  const [inviting, setInviting] = useState(false);

  // Sync state when visible changes
  useEffect(() => {
    if (visible) {
      setUrl(apiBaseUrl);
      setTestResult(null);
      setActiveView('server');
      if (activeWorkspaceId !== 'personal') {
        fetchMembers();
      }
    }
  }, [visible, apiBaseUrl, activeWorkspaceId]);

  const fetchMembers = async () => {
    if (activeWorkspaceId === 'personal') return;
    setLoadingMembers(true);
    try {
      const res = await apiClient.get(`/businesses/${activeWorkspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch workspace members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Required Field', 'Please enter an email address.');
      return;
    }

    setInviting(true);
    try {
      const res = await apiClient.post(`/businesses/${activeWorkspaceId}/invitations`, {
        invitedEmail: inviteEmail.trim(),
        role: inviteRole
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', `Invitation sent to ${inviteEmail}!`);
        setInviteEmail('');
        setInviteRole('viewer');
      } else {
        Alert.alert('Error', data.error || 'Failed to send invitation.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Server connection timed out.');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this workspace?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiClient.delete(`/businesses/${activeWorkspaceId}/members/${memberId}`);
              if (res.ok) {
                Alert.alert('Removed', `${memberName} has been removed.`);
                fetchMembers();
              } else {
                const data = await res.json();
                Alert.alert('Error', data.error || 'Failed to remove member.');
              }
            } catch (err) {
              console.error(err);
            }
          }
        }
      ]
    );
  };

  const handleChangeRole = async (memberId: string, currentRole: string) => {
    const roles: Array<'owner' | 'partner' | 'accountant' | 'manager' | 'employee' | 'viewer'> = [
      'owner', 'partner', 'accountant', 'manager', 'employee', 'viewer'
    ];
    
    Alert.alert(
      'Change Role',
      'Select a new role for this member:',
      roles.map(r => ({
        text: r.toUpperCase(),
        style: r === currentRole ? 'cancel' : 'default',
        onPress: async () => {
          if (r === currentRole) return;
          try {
            const res = await apiClient.patch(`/businesses/${activeWorkspaceId}/members/${memberId}/role`, { role: r });
            if (res.ok) {
              Alert.alert('Updated', 'Member role updated successfully.');
              fetchMembers();
            } else {
              const data = await res.json();
              Alert.alert('Error', data.error || 'Failed to update role.');
            }
          } catch (err) {
            console.error(err);
          }
        }
      })),
      { cancelable: true }
    );
  };

  const testConnection = async () => {
    if (!url) {
      setTestResult({ success: false, message: 'Server URL cannot be empty.' });
      return;
    }

    setTesting(true);
    setTestResult(null);
    Keyboard.dismiss();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const testEndpoint = url.endsWith('/') ? `${url}health` : `${url}/health`;

      const res = await fetch(testEndpoint, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        setTestResult({ success: true, message: 'Connected successfully to backend!' });
      } else {
        setTestResult({ success: false, message: `Server returned status: ${res.status}` });
      }
    } catch (err: any) {
      console.error(err);
      setTestResult({ 
        success: false, 
        message: 'Could not connect. Verify URL and make sure your server is running.' 
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!url) return;
    
    let sanitizedUrl = url.trim();
    if (sanitizedUrl.endsWith('/')) {
      sanitizedUrl = sanitizedUrl.slice(0, -1);
    }

    try {
      await AsyncStorage.setItem('apiBaseUrl', sanitizedUrl);
      onSave(sanitizedUrl);
      onClose();
    } catch (err) {
      console.error('Failed to save API URL:', err);
    }
  };

  const isOwner = activeWorkspaceRole === 'owner';

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            {/* Tab Header */}
            <View style={styles.tabHeader}>
              <TouchableOpacity
                style={[styles.tabBtn, activeView === 'server' && styles.tabBtnActive]}
                onPress={() => setActiveView('server')}
              >
                <Text style={[styles.tabBtnText, activeView === 'server' && styles.tabBtnTextActive]}>
                  Server
                </Text>
              </TouchableOpacity>
              
              {activeWorkspaceId !== 'personal' && (
                <TouchableOpacity
                  style={[styles.tabBtn, activeView === 'team' && styles.tabBtnActive]}
                  onPress={() => setActiveView('team')}
                >
                  <Text style={[styles.tabBtnText, activeView === 'team' && styles.tabBtnTextActive]}>
                    Team Members
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <XIcon color="#a6bedf" size={20} />
              </TouchableOpacity>
            </View>

            {/* SERVER SETTINGS VIEW */}
            {activeView === 'server' && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.title}>Server Connection Settings</Text>
                <Text style={styles.label}>Backend API URL</Text>
                <Text style={styles.helperText}>
                  Set the URL to connect to the HisabHero server (e.g. https://hisabhero-backend.onrender.com/api or your cloud API endpoint).
                </Text>

                <TextInput
                  style={styles.input}
                  value={url}
                  onChangeText={(text) => {
                    setUrl(text);
                    setTestResult(null);
                  }}
                  placeholder="https://hisabhero-backend.onrender.com/api"
                  placeholderTextColor="#5f88b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {testResult && (
                  <View style={[styles.resultBox, testResult.success ? styles.resultSuccess : styles.resultFailed]}>
                    {testResult.success ? (
                      <CheckCircleIcon color="#8fff8f" size={18} style={styles.resultIcon} />
                    ) : (
                      <AlertTriangleIcon color="#ff8f8f" size={18} style={styles.resultIcon} />
                    )}
                    <Text style={[styles.resultText, testResult.success ? styles.textSuccess : styles.textFailed]}>
                      {testResult.message}
                    </Text>
                  </View>
                )}

                <View style={styles.actionContainer}>
                  <TouchableOpacity style={[styles.btn, styles.testBtn]} onPress={testConnection} disabled={testing}>
                    {testing ? <ActivityIndicator color="#4f8cff" size="small" /> : <Text style={styles.testBtnText}>Test Connection</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>Save Settings</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* TEAM MEMBERS VIEW */}
            {activeView === 'team' && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400, marginTop: 10 }}>
                <Text style={styles.title}>Manage Team & Roles</Text>
                
                {loadingMembers ? (
                  <ActivityIndicator color="#4f8cff" size="small" style={{ marginVertical: 20 }} />
                ) : (
                  <View style={{ marginBottom: 15 }}>
                    {members.map(m => (
                      <View key={m.id} style={styles.memberCard}>
                        <View style={styles.memberInfo}>
                          <UserIcon color="#8fc0ff" size={18} style={{ marginRight: 10 }} />
                          <View>
                            <Text style={styles.memberName}>{m.fullName}</Text>
                            <Text style={styles.memberEmail}>{m.email}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.memberMeta}>
                          <TouchableOpacity
                            style={[styles.roleBadge, isOwner && styles.roleBadgeClickable]}
                            disabled={!isOwner}
                            onPress={() => handleChangeRole(m.id, m.role)}
                          >
                            <ShieldIcon color="#4f8cff" size={12} style={{ marginRight: 4 }} />
                            <Text style={styles.roleText}>{m.role.toUpperCase()}</Text>
                          </TouchableOpacity>
                          
                          {isOwner && m.role !== 'owner' && (
                            <TouchableOpacity
                              style={styles.deleteMemberBtn}
                              onPress={() => handleRemoveMember(m.id, m.fullName)}
                            >
                              <Trash2Icon color="#ff8f8f" size={16} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Invite section */}
                {isOwner && (
                  <View style={styles.inviteSection}>
                    <Text style={styles.inviteHeader}>Invite New Team Member</Text>
                    
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="partner@example.com"
                      placeholderTextColor="#5f88b8"
                      value={inviteEmail}
                      onChangeText={setInviteEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />

                    <Text style={styles.label}>Assign Role</Text>
                    <View style={styles.roleSelection}>
                      {['partner', 'accountant', 'employee'].map(r => {
                        const isSel = inviteRole === r;
                        return (
                          <TouchableOpacity
                            key={r}
                            style={[styles.roleSelectBtn, isSel && styles.roleSelectBtnActive]}
                            onPress={() => setInviteRole(r as any)}
                          >
                            <Text style={[styles.roleSelectText, isSel && styles.roleSelectTextActive]}>
                              {r.toUpperCase()}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      style={styles.inviteBtn}
                      onPress={handleSendInvite}
                      disabled={inviting}
                    >
                      {inviting ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <UserPlusIcon color="#ffffff" size={18} style={{ marginRight: 8 }} />
                          <Text style={styles.inviteBtnText}>Send Invitation Link</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 8, 16, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#0b1d38',
    borderRadius: 24,
    width: '100%',
    maxWidth: 420,
    padding: 24,
    borderWidth: 1,
    borderColor: '#15345f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#15345f',
    paddingBottom: 10,
    marginBottom: 15,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#1c4f9d',
  },
  tabBtnText: {
    color: '#8fc0ff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },
  closeBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8fc0ff',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 11,
    color: '#a6bedf',
    lineHeight: 16,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 14,
    paddingHorizontal: 16,
    height: 46,
    marginBottom: 14,
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  resultSuccess: {
    backgroundColor: '#0b2b15',
    borderColor: '#155f24',
  },
  resultFailed: {
    backgroundColor: '#380b0b',
    borderColor: '#5f1515',
  },
  resultIcon: {
    marginRight: 10,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  resultText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  textSuccess: {
    color: '#8fff8f',
  },
  textFailed: {
    color: '#ff8f8f',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtn: {
    borderWidth: 1,
    borderColor: '#15345f',
  },
  testBtnText: {
    color: '#4f8cff',
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#4f8cff',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  memberEmail: {
    fontSize: 11,
    color: '#8fc0ff',
    marginTop: 2,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13243f',
    borderWidth: 1,
    borderColor: '#1e3860',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  roleBadgeClickable: {
    borderColor: '#4f8cff',
  },
  roleText: {
    color: '#4f8cff',
    fontSize: 9,
    fontWeight: '700',
  },
  deleteMemberBtn: {
    padding: 4,
  },
  inviteSection: {
    marginTop: 15,
    borderTopWidth: 1,
    borderColor: '#15345f',
    paddingTop: 15,
  },
  inviteHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  roleSelection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },
  roleSelectBtn: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleSelectBtnActive: {
    backgroundColor: '#1c4f9d',
    borderColor: '#4f8cff',
  },
  roleSelectText: {
    color: '#8fc0ff',
    fontSize: 10,
    fontWeight: '600',
  },
  roleSelectTextActive: {
    color: '#ffffff',
  },
  inviteBtn: {
    backgroundColor: '#4f8cff',
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
