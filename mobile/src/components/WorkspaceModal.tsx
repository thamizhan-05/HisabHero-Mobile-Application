import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X, Briefcase, Plus, Users, User, Mail, ShieldAlert, Check, CheckCircle2 } from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';

const XIcon = X as any;
const BriefcaseIcon = Briefcase as any;
const PlusIcon = Plus as any;
const UsersIcon = Users as any;
const UserIcon = User as any;
const MailIcon = Mail as any;
const ShieldAlertIcon = ShieldAlert as any;
const CheckIcon = Check as any;
const CheckCircle2Icon = CheckCircle2 as any;

type WorkspaceModalProps = {
  visible: boolean;
  onClose: () => void;
  activeWorkspaceId: string;
  onSwitchWorkspace: (workspaceId: string, name: string, role: string) => void;
};

export function WorkspaceModal({ visible, onClose, activeWorkspaceId, onSwitchWorkspace }: WorkspaceModalProps) {
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  
  // Create Business States
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [businessDesc, setBusinessDesc] = useState('');
  const [currency, setCurrency] = useState('INR');

  const fetchWorkspacesAndInvitations = async () => {
    setLoading(true);
    try {
      const [resBus, resInv] = await Promise.all([
        apiClient.get('/businesses'),
        apiClient.get('/invitations')
      ]);

      if (resBus.ok) {
        const busData = await resBus.json();
        setWorkspaces([
          { id: 'personal', name: 'Personal Finance', role: 'owner' },
          ...busData
        ]);
      }
      
      if (resInv.ok) {
        const invData = await resInv.json();
        setInvitations(invData || []);
      }
    } catch (err) {
      console.error('Failed to load workspace details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchWorkspacesAndInvitations();
      setShowCreateForm(false);
      setBusinessName('');
      setBusinessDesc('');
    }
  }, [visible]);

  const handleCreateBusiness = async () => {
    if (!businessName.trim()) {
      Alert.alert('Required Field', 'Please enter a business name.');
      return;
    }

    setCreating(true);
    try {
      const res = await apiClient.post('/businesses', {
        name: businessName.trim(),
        description: businessDesc.trim(),
        currency
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', `Workspace "${businessName}" created successfully!`);
        setShowCreateForm(false);
        setBusinessName('');
        setBusinessDesc('');
        
        const bId = data.business._id || data.business.id;
        // Automatically switch to the newly created business
        await AsyncStorage.setItem('activeWorkspaceId', bId);
        onSwitchWorkspace(bId, data.business.name, 'owner');
        onClose();
      } else {
        Alert.alert('Error', data.error || 'Failed to create business workspace.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Server error while creating workspace.');
    } finally {
      setCreating(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string, businessName: string) => {
    try {
      const res = await apiClient.post(`/invitations/${invitationId}/accept`);
      const data = await res.json();
      
      if (res.ok) {
        Alert.alert('Joined Workspace', `You have successfully joined "${businessName}"!`);
        await fetchWorkspacesAndInvitations();
        
        // Auto switch to it
        await AsyncStorage.setItem('activeWorkspaceId', data.businessId);
        onSwitchWorkspace(data.businessId, businessName, 'member');
        onClose();
      } else {
        Alert.alert('Error', data.error || 'Failed to accept invitation.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Server connection timed out.');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const res = await apiClient.post(`/invitations/${invitationId}/decline`);
      if (res.ok) {
        Alert.alert('Declined', 'Invitation declined.');
        fetchWorkspacesAndInvitations();
      } else {
        const data = await res.json();
        Alert.alert('Error', data.error || 'Failed to decline.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectWorkspace = async (w: any) => {
    await AsyncStorage.setItem('activeWorkspaceId', w.id);
    onSwitchWorkspace(w.id, w.name, w.role);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <BriefcaseIcon color="#4f8cff" size={22} style={{ marginRight: 8 }} />
              <Text style={styles.title}>Switch Workspace</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <XIcon color="#a6bedf" size={20} />
            </TouchableOpacity>
          </View>

          {loading && workspaces.length === 0 ? (
            <ActivityIndicator color="#4f8cff" size="large" style={{ marginVertical: 30 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Workspaces List */}
              <Text style={styles.sectionTitle}>Your Workspaces</Text>
              {workspaces.map((w) => {
                const isActive = w.id === activeWorkspaceId;
                return (
                  <TouchableOpacity
                    key={w.id}
                    style={[styles.workspaceItem, isActive && styles.workspaceItemActive]}
                    onPress={() => handleSelectWorkspace(w)}
                  >
                    <View style={styles.workspaceInfo}>
                      <BriefcaseIcon color={isActive ? '#ffffff' : '#8fc0ff'} size={18} style={{ marginRight: 10 }} />
                      <View>
                        <Text style={[styles.workspaceName, isActive && styles.workspaceNameActive]}>
                          {w.name}
                        </Text>
                        <Text style={styles.workspaceRole}>
                          Role: {w.role.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    {isActive && <CheckIcon color="#8fff8f" size={18} />}
                  </TouchableOpacity>
                );
              })}

              {/* Pending Invitations Section */}
              {invitations.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  <Text style={[styles.sectionTitle, { color: '#ff8f8f' }]}>
                    Pending Invitations ({invitations.length})
                  </Text>
                  {invitations.map((inv) => (
                    <View key={inv.id} style={styles.invitationCard}>
                      <View style={styles.invHeader}>
                        <ShieldAlertIcon color="#ff8f8f" size={18} style={{ marginRight: 8 }} />
                        <Text style={styles.invTitle}>Invitation to Join</Text>
                      </View>
                      <Text style={styles.invText}>
                        <Text style={styles.bold}>{inv.invitedBy}</Text> invited you to join{' '}
                        <Text style={styles.bold}>{inv.businessName}</Text> as a{' '}
                        <Text style={styles.bold}>{inv.role.toUpperCase()}</Text>.
                      </Text>
                      <View style={styles.invActions}>
                        <TouchableOpacity
                          style={[styles.invBtn, styles.declineBtn]}
                          onPress={() => handleDeclineInvitation(inv.id)}
                        >
                          <Text style={styles.declineText}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.invBtn, styles.acceptBtn]}
                          onPress={() => handleAcceptInvitation(inv.id, inv.businessName)}
                        >
                          <Text style={styles.acceptText}>Accept</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Create Business Workspace Toggle */}
              {!showCreateForm ? (
                <TouchableOpacity
                  style={styles.createToggleBtn}
                  onPress={() => setShowCreateForm(true)}
                >
                  <PlusIcon color="#4f8cff" size={18} style={{ marginRight: 6 }} />
                  <Text style={styles.createToggleText}>Create New Business Workspace</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.createForm}>
                  <Text style={styles.sectionTitle}>New Business details</Text>
                  
                  <Text style={styles.label}>Business Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. ABC Electronics"
                    placeholderTextColor="#5f88b8"
                    value={businessName}
                    onChangeText={setBusinessName}
                  />

                  <Text style={styles.label}>Description (Optional)</Text>
                  <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                    placeholder="e.g. Main branch retail outlet"
                    placeholderTextColor="#5f88b8"
                    value={businessDesc}
                    onChangeText={setBusinessDesc}
                    multiline={true}
                  />

                  <Text style={styles.label}>Currency</Text>
                  <View style={styles.currencySelect}>
                    {['INR (₹)', 'USD ($)', 'EUR (€)'].map((curr) => {
                      const cVal = curr.split(' ')[0];
                      const isSel = currency === cVal;
                      return (
                        <TouchableOpacity
                          key={cVal}
                          style={[styles.currBtn, isSel && styles.currBtnActive]}
                          onPress={() => setCurrency(cVal)}
                        >
                          <Text style={[styles.currBtnText, isSel && styles.currBtnTextActive]}>
                            {curr}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.formActions}>
                    <TouchableOpacity
                      style={[styles.formBtn, styles.cancelBtn]}
                      onPress={() => setShowCreateForm(false)}
                      disabled={creating}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.formBtn, styles.submitBtn]}
                      onPress={handleCreateBusiness}
                      disabled={creating}
                    >
                      {creating ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.submitBtnText}>Create Workspace</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 8, 16, 0.85)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#0b1d38',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#15345f',
    paddingBottom: 15,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  closeBtn: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8fc0ff',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  workspaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  workspaceItemActive: {
    backgroundColor: '#1c4f9d',
    borderColor: '#4f8cff',
  },
  workspaceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workspaceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#a6bedf',
  },
  workspaceNameActive: {
    color: '#ffffff',
  },
  workspaceRole: {
    fontSize: 10,
    color: '#8fc0ff',
    fontWeight: '600',
    marginTop: 2,
  },
  createToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#4f8cff',
    borderRadius: 16,
    height: 52,
    marginTop: 10,
  },
  createToggleText: {
    color: '#4f8cff',
    fontSize: 14,
    fontWeight: '600',
  },
  createForm: {
    marginTop: 20,
    borderTopWidth: 1,
    borderColor: '#15345f',
    paddingTop: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8fc0ff',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 14,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
  },
  currencySelect: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  currBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currBtnActive: {
    backgroundColor: '#4f8cff',
    borderColor: '#4f8cff',
  },
  currBtnText: {
    color: '#8fc0ff',
    fontSize: 12,
    fontWeight: '600',
  },
  currBtnTextActive: {
    color: '#ffffff',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  formBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#1b3453',
  },
  cancelBtnText: {
    color: '#8fc0ff',
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#4f8cff',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  invitationCard: {
    backgroundColor: '#26121b',
    borderWidth: 1,
    borderColor: '#59203a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  invHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  invTitle: {
    color: '#ff8f8f',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  invText: {
    color: '#dfa6c1',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  bold: {
    fontWeight: '700',
    color: '#ffffff',
  },
  invActions: {
    flexDirection: 'row',
    gap: 10,
  },
  invBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    backgroundColor: '#3b1828',
    borderWidth: 1,
    borderColor: '#59203a',
  },
  declineText: {
    color: '#ff8f8f',
    fontSize: 12,
    fontWeight: '600',
  },
  acceptBtn: {
    backgroundColor: '#2e7d32',
  },
  acceptText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
