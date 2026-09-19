import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoClipboard from 'expo-clipboard';
import {
  X,
  Briefcase,
  Plus,
  User,
  Check,
  KeyRound,
  Clipboard as ClipboardIcon,
  Send,
  Building2,
  Info,
  Sparkles,
} from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';
import { useTheme } from '../theme/themeSystem';
import { useTranslation } from '../theme/i18n';

const XIcon = X as any;
const BriefcaseIcon = Briefcase as any;
const PlusIcon = Plus as any;
const UserIcon = User as any;
const CheckIcon = Check as any;
const KeyRoundIcon = KeyRound as any;
const ClipboardIconComp = ClipboardIcon as any;
const SendIcon = Send as any;
const Building2Icon = Building2 as any;
const InfoIcon = Info as any;
const SparklesIcon = Sparkles as any;

type WorkspaceModalProps = {
  visible: boolean;
  onClose: () => void;
  activeWorkspaceId: string;
  onSwitchWorkspace: (workspaceId: string, name: string, role: string) => void;
};

export function WorkspaceModal({ visible, onClose, activeWorkspaceId, onSwitchWorkspace }: WorkspaceModalProps) {
  const { theme, accentHex } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>([]);

  // Sub-Form toggles
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showCreateBusinessForm, setShowCreateBusinessForm] = useState(false);
  const [showCreatePersonalForm, setShowCreatePersonalForm] = useState(false);

  // Join Code Form
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [joining, setJoining] = useState(false);

  // Create Personal Form
  const [personalName, setPersonalName] = useState('');
  const [personalDesc, setPersonalDesc] = useState('');
  const [creatingPersonal, setCreatingPersonal] = useState(false);

  // Create Business Form
  const [businessName, setBusinessName] = useState('');
  const [businessDesc, setBusinessDesc] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('India');
  const [currency, setCurrency] = useState('INR');
  const [phone, setPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [creatingBusiness, setCreatingBusiness] = useState(false);

  // Business Created Success State
  const [createdBusiness, setCreatedBusiness] = useState<{id: string; name: string; joinCode: string} | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/workspaces');
      if (res.ok) {
        const data = await res.json();
        const wsList = data.workspaces || (Array.isArray(data) ? data : []);
        setWorkspaces(wsList);
      } else {
        const resBus = await apiClient.get('/businesses');
        if (resBus.ok) {
          const busData = await resBus.json();
          setWorkspaces([
            { id: 'personal', name: 'My Personal Finance', isPersonal: true, isDefault: true, role: 'owner', type: 'personal' },
            ...(Array.isArray(busData) ? busData : (busData.workspaces || [])),
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to load workspace list:', err);
      setWorkspaces([{ id: 'personal', name: 'My Personal Finance', isPersonal: true, isDefault: true, role: 'owner', type: 'personal' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchWorkspaces();
      setShowCreateBusinessForm(false);
      setShowCreatePersonalForm(false);
      setShowJoinForm(false);
      setJoinCodeInput('');
      setJoinMessage('');
      setPersonalName('');
      setBusinessName('');
      setCreatedBusiness(null);
      setCodeCopied(false);
    }
  }, [visible]);

  // Handle Join Workspace using Code — creates PENDING request, does NOT grant immediate access
  const handleJoinWorkspace = async () => {
    if (!joinCodeInput.trim()) {
      Alert.alert('Required Field', 'Please enter a valid workspace join code (e.g. ABCD-EFGH-IJKL).');
      return;
    }

    setJoining(true);
    try {
      const res = await apiClient.post('/workspaces/join', {
        joinCode: joinCodeInput.trim().toUpperCase(),
        message: joinMessage.trim(),
      });

      const data = await res.json();
      if ((res.ok || res.status === 201) && data.success) {
        Alert.alert(
          '🚀 Join Request Sent!',
          data.message || `Your request has been sent to the workspace owner for review.\n\nYou will receive a notification once the owner approves or declines your request.\n\nIMPORTANT: You do NOT have access yet — access is granted only after Owner approval.`,
          [{ text: 'Got it!', onPress: () => { setShowJoinForm(false); setJoinCodeInput(''); setJoinMessage(''); } }]
        );
      } else {
        Alert.alert('Request Failed', data.error || 'Invalid join code or failed to submit join request. Please check the code and try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Server error while submitting join request.');
    } finally {
      setJoining(false);
    }
  };


  const handlePasteCode = async () => {
    try {
      const text = await ExpoClipboard.getStringAsync();
      if (text) {
        setJoinCodeInput(text.trim().toUpperCase());
      }
    } catch (e) {
      console.warn('Clipboard paste error:', e);
    }
  };

  // Handle Create Personal Workspace
  const handleCreatePersonalWorkspace = async () => {
    if (!personalName.trim()) {
      Alert.alert('Required Field', 'Please enter a name for your Personal Workspace.');
      return;
    }

    setCreatingPersonal(true);
    try {
      const res = await apiClient.post('/workspaces/personal', {
        name: personalName.trim(),
        description: personalDesc.trim(),
        currency,
      });

      const data = await res.json();
      if (res.ok) {
        const w = data.workspace || data;
        const wId = w._id || w.id;
        Alert.alert('Personal Workspace Created 👤', `Workspace "${personalName}" created successfully!`);
        setShowCreatePersonalForm(false);
        setPersonalName('');
        setPersonalDesc('');

        await AsyncStorage.setItem('activeWorkspaceId', wId);
        onSwitchWorkspace(wId, w.name || personalName, 'owner');
        onClose();
      } else {
        Alert.alert('Error', data.error || 'Failed to create personal workspace.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Server error while creating personal workspace.');
    } finally {
      setCreatingPersonal(false);
    }
  };

  // Handle Create Business Workspace
  const handleCreateBusinessWorkspace = async () => {
    if (!businessName.trim()) {
      Alert.alert('Required Field', 'Please enter a business name.');
      return;
    }

    setCreatingBusiness(true);
    try {
      const payload = {
        name: businessName.trim(),
        description: businessDesc.trim(),
        businessType: businessType.trim(),
        industry: industry.trim(),
        country: country.trim(),
        currency,
        phone: phone.trim(),
        gstNumber: gstNumber.trim(),
        companyAddress: companyAddress.trim(),
      };

      let res = await apiClient.post('/workspaces/business', payload);
      if (res.status === 404) {
        console.log('[WorkspaceModal] /workspaces/business 404, trying fallback /businesses');
        res = await apiClient.post('/businesses', payload);
      }
      if (res.status === 404) {
        console.log('[WorkspaceModal] /businesses 404, trying fallback /workspaces');
        res = await apiClient.post('/workspaces', { ...payload, type: 'business' });
      }

      const data = await res.json();
      if (res.ok) {
        const b = data.workspace || data.business || data;
        const bId = b._id || b.id;
        const code = data.joinCode || b.joinCode || 'HH-GENERATED';

        // Show success state inline (not just Alert) so the join code is clearly visible
        setShowCreateBusinessForm(false);
        setCreatedBusiness({ id: bId, name: b.name || businessName, joinCode: code });
        setBusinessName('');

        // Switch to the new workspace automatically
        await AsyncStorage.setItem('activeWorkspaceId', bId);
        onSwitchWorkspace(bId, b.name || businessName, 'owner');
        fetchWorkspaces(); // Refresh workspace list
      } else {
        if (data.error && (data.error.includes('E11000') || data.error.includes('joinCode'))) {
          try {
            const wsRes = await apiClient.get('/workspaces');
            if (wsRes.ok) {
              const wsList = await wsRes.json();
              const newlyCreated = (wsList || []).find((w: any) => w.name && w.name.trim().toLowerCase() === businessName.trim().toLowerCase());
              if (newlyCreated) {
                const bId = newlyCreated._id || newlyCreated.id;
                const code = newlyCreated.joinCode || 'HH-GENERATED';
                setShowCreateBusinessForm(false);
                setCreatedBusiness({ id: bId, name: newlyCreated.name || businessName, joinCode: code });
                setBusinessName('');
                await AsyncStorage.setItem('activeWorkspaceId', bId);
                onSwitchWorkspace(bId, newlyCreated.name || businessName, 'owner');
                fetchWorkspaces();
                return;
              }
            }
          } catch (wsErr) {
            console.warn('[WorkspaceModal] Recovery check failed:', wsErr);
          }
        }
        Alert.alert('Error', data.error || 'Failed to create business workspace.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Server error while creating business workspace.');
    } finally {
      setCreatingBusiness(false);
    }
  };

  const handleSelectWorkspace = async (w: any) => {
    const targetId = w.id || w._id || 'personal';
    await AsyncStorage.setItem('activeWorkspaceId', targetId);
    onSwitchWorkspace(targetId, w.name, w.role || 'owner');
    onClose();
  };

  const personalWorkspaces = workspaces.filter(w => w.isPersonal || w.type === 'personal' || w.id === 'personal');
  const businessWorkspaces = workspaces.filter(w => !w.isPersonal && w.type !== 'personal' && w.id !== 'personal');

  // On web, React Native Modal creates an invisible blocking overlay.
  // We render a cross-platform overlay instead.
  if (!visible) return null;

  const modalContent = (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
      {/* Backdrop: tapping it closes the modal */}
      <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, paddingBottom: Math.max(insets.bottom, 22) }]}>
          {/* Modal Header */}
          <View style={[styles.header, { borderColor: theme.cardBorder }]}>
            <View style={styles.headerTitle}>
              <BriefcaseIcon color={accentHex} size={22} style={{ marginRight: 8 }} />
              <Text style={[styles.title, { color: theme.text }]}>Workspace Switcher</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <XIcon color={theme.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          {loading && workspaces.length === 0 ? (
            <ActivityIndicator color={accentHex} size="large" style={{ marginVertical: 30 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* PERSONAL WORKSPACES SECTION */}
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Personal Workspaces</Text>
              {personalWorkspaces.map((w) => {
                const targetId = w.id || w._id || 'personal';
                const isActive = targetId === activeWorkspaceId;
                const isDefault = w.isDefault || targetId === 'personal';

                return (
                  <TouchableOpacity
                    key={targetId}
                    style={[
                      styles.workspaceItem,
                      { backgroundColor: theme.bg, borderColor: theme.cardBorder },
                      isActive && { backgroundColor: accentHex + '22', borderColor: accentHex },
                    ]}
                    onPress={() => handleSelectWorkspace(w)}
                  >
                    <View style={styles.workspaceInfo}>
                      <UserIcon color={isActive ? accentHex : '#38bdf8'} size={20} style={{ marginRight: 12 }} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.workspaceName, { color: theme.text }, isActive && { color: accentHex, fontWeight: '800' }]}>
                            {w.name}
                          </Text>
                          {isDefault && (
                            <View style={[styles.badge, { backgroundColor: '#38bdf822', borderColor: '#38bdf866' }]}>
                              <Text style={[styles.badgeText, { color: '#38bdf8' }]}>Default</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.workspaceRole, { color: theme.textSecondary }]}>Private Personal Finance</Text>
                      </View>
                    </View>
                    {isActive && <CheckIcon color={accentHex} size={20} />}
                  </TouchableOpacity>
                );
              })}

              {/* BUSINESS WORKSPACES SECTION */}
              <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 14 }]}>Business Workspaces</Text>
              {businessWorkspaces.length === 0 ? (
                <View style={[styles.emptyBusCard, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.emptyBusText, { color: theme.textMuted }]}>No Business Workspaces yet.</Text>
                </View>
              ) : (
                businessWorkspaces.map((w) => {
                  const targetId = w.id || w._id;
                  const isActive = targetId === activeWorkspaceId;
                  const isOwner = (w.role || '').toLowerCase() === 'owner';

                  return (
                    <View key={targetId}>
                      <TouchableOpacity
                        style={[
                          styles.workspaceItem,
                          { backgroundColor: theme.bg, borderColor: theme.cardBorder },
                          isActive && { backgroundColor: accentHex + '22', borderColor: accentHex },
                        ]}
                        onPress={() => handleSelectWorkspace(w)}
                      >
                        <View style={styles.workspaceInfo}>
                          <Building2Icon color={isActive ? accentHex : '#a855f7'} size={20} style={{ marginRight: 12 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.workspaceName, { color: theme.text }, isActive && { color: accentHex, fontWeight: '800' }]}>
                              {w.name}
                            </Text>
                            <Text style={[styles.workspaceRole, { color: theme.textSecondary }]}>
                              Role: {(w.role || 'employee').toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        {isActive && <CheckIcon color={accentHex} size={20} />}
                      </TouchableOpacity>

                      {/* Show copyable join code for owners */}
                      {isOwner && w.joinCode && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 8, borderWidth: 1, borderColor: '#10b98133', paddingHorizontal: 10, paddingVertical: 6, marginTop: -4, marginBottom: 6 }}>
                          <KeyRoundIcon color="#10b981" size={12} style={{ marginRight: 6 }} />
                          <Text style={{ flex: 1, color: '#047857', fontSize: 13, fontWeight: '800', letterSpacing: 1.5, fontFamily: 'monospace' }}>
                            {w.joinCode}
                          </Text>
                          <TouchableOpacity
                            onPress={async () => {
                              try {
                                await ExpoClipboard.setStringAsync(w.joinCode);
                                Alert.alert('✅ Copied!', `Join Code "${w.joinCode}" copied to clipboard. Share this with your team.`);
                              } catch (e) {}
                            }}
                            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}
                          >
                            <ClipboardIconComp color="#fff" size={11} style={{ marginRight: 3 }} />
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 10 }}>Copy Code</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              )}

              {/* ✅ BUSINESS WORKSPACE CREATED SUCCESS CARD */}
              {createdBusiness && (
                <View style={{ backgroundColor: '#f0fdf4', borderRadius: 14, borderWidth: 1.5, borderColor: '#10b981', padding: 18, marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <SparklesIcon color="#10b981" size={20} style={{ marginRight: 8 }} />
                    <Text style={{ color: '#065f46', fontSize: 15, fontWeight: '800' }}>Business Workspace Created! 🎉</Text>
                  </View>
                  <Text style={{ color: '#065f46', fontSize: 13, marginBottom: 4, fontWeight: '600' }}>
                    {createdBusiness.name}
                  </Text>
                  <Text style={{ color: '#047857', fontSize: 12, marginBottom: 12 }}>
                    You are now the Owner. Share the Join Code below with your team members.
                  </Text>

                  {/* Join Code Display */}
                  <Text style={{ color: '#047857', fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Workspace Join Code
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1.5, borderColor: '#10b981', paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 }}>
                    <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: '#047857', letterSpacing: 3, fontFamily: 'monospace' }}>
                      {createdBusiness.joinCode}
                    </Text>
                    <TouchableOpacity
                      onPress={async () => {
                        try {
                          await ExpoClipboard.setStringAsync(createdBusiness.joinCode);
                          setCodeCopied(true);
                          setTimeout(() => setCodeCopied(false), 3000);
                        } catch (e) {}
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: codeCopied ? '#10b981' : accentHex, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 }}
                    >
                      {codeCopied
                        ? <CheckIcon color="#fff" size={14} style={{ marginRight: 4 }} />
                        : <ClipboardIconComp color="#fff" size={14} style={{ marginRight: 4 }} />
                      }
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{codeCopied ? 'Copied!' : 'Copy'}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: '#6ee7b7', fontSize: 10, textAlign: 'center' }}>
                    Tap Copy, then send this code to your team — they will use it to request access.
                  </Text>

                  <TouchableOpacity
                    onPress={() => { setCreatedBusiness(null); onClose(); }}
                    style={{ marginTop: 12, backgroundColor: '#10b981', borderRadius: 10, paddingVertical: 11, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Enter Workspace →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ACTION BUTTONS */}
              <View style={styles.actionGrid}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: theme.bg, borderColor: theme.cardBorder },
                    showCreatePersonalForm && { borderColor: accentHex, backgroundColor: accentHex + '15' },
                  ]}
                  onPress={() => {
                    setShowCreatePersonalForm(!showCreatePersonalForm);
                    setShowCreateBusinessForm(false);
                    setShowJoinForm(false);
                  }}
                >
                  <PlusIcon color="#38bdf8" size={16} style={{ marginRight: 6 }} />
                  <Text style={[styles.actionBtnText, { color: theme.text }]}>+ Personal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: theme.bg, borderColor: theme.cardBorder },
                    showCreateBusinessForm && { borderColor: accentHex, backgroundColor: accentHex + '15' },
                  ]}
                  onPress={() => {
                    setShowCreateBusinessForm(!showCreateBusinessForm);
                    setShowCreatePersonalForm(false);
                    setShowJoinForm(false);
                  }}
                >
                  <PlusIcon color="#a855f7" size={16} style={{ marginRight: 6 }} />
                  <Text style={[styles.actionBtnText, { color: theme.text }]}>+ Business</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: theme.bg, borderColor: theme.cardBorder },
                    showJoinForm && { borderColor: accentHex, backgroundColor: accentHex + '15' },
                  ]}
                  onPress={() => {
                    setShowJoinForm(!showJoinForm);
                    setShowCreateBusinessForm(false);
                    setShowCreatePersonalForm(false);
                  }}
                >
                  <KeyRoundIcon color={accentHex} size={16} style={{ marginRight: 6 }} />
                  <Text style={[styles.actionBtnText, { color: theme.text }]}>Join Code</Text>
                </TouchableOpacity>
              </View>

              {/* SUBFORM 1: Create Additional Personal Workspace */}
              {showCreatePersonalForm && (
                <View style={[styles.subFormCard, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.formTitle, { color: theme.text }]}>Create Personal Workspace</Text>
                  <Text style={[styles.formSub, { color: theme.textSecondary }]}>
                    Separate personal finance buckets (e.g. Family Budget, Travel Expenses).
                  </Text>

                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Workspace Name *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
                    placeholder="e.g. Family Finance"
                    placeholderTextColor={theme.textSecondary}
                    value={personalName}
                    onChangeText={setPersonalName}
                  />

                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Description (Optional)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
                    placeholder="e.g. Monthly household bills and savings"
                    placeholderTextColor={theme.textSecondary}
                    value={personalDesc}
                    onChangeText={setPersonalDesc}
                  />

                  <View style={styles.formActions}>
                    <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.card }]} onPress={() => setShowCreatePersonalForm(false)}>
                      <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: accentHex }]} onPress={handleCreatePersonalWorkspace} disabled={creatingPersonal}>
                      {creatingPersonal ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Create Personal Workspace</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* SUBFORM 2: Create Business Workspace */}
              {showCreateBusinessForm && (
                <View style={[styles.subFormCard, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.formTitle, { color: theme.text }]}>Create Business Workspace</Text>
                  <Text style={[styles.formSub, { color: theme.textSecondary }]}>
                    Enterprise multi-user workspace for company financials, invoicing, and team operations.
                  </Text>

                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Business Name *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
                    placeholder="e.g. ABC Traders Pvt. Ltd."
                    placeholderTextColor={theme.textSecondary}
                    value={businessName}
                    onChangeText={setBusinessName}
                  />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Industry</Text>
                      <TextInput style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]} placeholder="Retail / Tech" placeholderTextColor={theme.textSecondary} value={industry} onChangeText={setIndustry} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>GSTIN / Tax ID</Text>
                      <TextInput style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]} placeholder="27AAAAA0000A1Z5" placeholderTextColor={theme.textSecondary} value={gstNumber} onChangeText={setGstNumber} />
                    </View>
                  </View>

                  <View style={styles.formActions}>
                    <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.card }]} onPress={() => setShowCreateBusinessForm(false)}>
                      <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: accentHex }]} onPress={handleCreateBusinessWorkspace} disabled={creatingBusiness}>
                      {creatingBusiness ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Create Business Workspace</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* SUBFORM 3: Join Business Workspace */}
              {showJoinForm && (
                <View style={[styles.subFormCard, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.formTitle, { color: theme.text }]}>Join a Business Workspace</Text>
                  <Text style={[styles.formSub, { color: theme.textSecondary }]}>
                    Enter the Join Code provided by the Business Workspace Owner (e.g. ABCD-EFGH-IJKL).
                  </Text>

                  {/* Approval required notice */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: accentHex + '15', borderRadius: 10, borderWidth: 1, borderColor: accentHex + '33', padding: 10, marginBottom: 8 }}>
                    <InfoIcon color={accentHex} size={14} style={{ marginRight: 6, marginTop: 1 }} />
                    <Text style={{ color: theme.textSecondary, fontSize: 11, flex: 1, lineHeight: 16, fontWeight: '600' }}>
                      Your request requires Owner approval. You will NOT get immediate access — the Owner must approve your request first.
                    </Text>
                  </View>

                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Join Code *</Text>
                  <View style={styles.inputWithBtn}>
                    <TextInput
                      style={[styles.inputFlex, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
                      placeholder="XXXX-XXXX-XXXX"
                      placeholderTextColor={theme.textSecondary}
                      value={joinCodeInput}
                      onChangeText={(val) => setJoinCodeInput(val.toUpperCase())}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity style={[styles.pasteBtn, { backgroundColor: accentHex + '22', borderColor: accentHex }]} onPress={handlePasteCode}>
                      <ClipboardIconComp color={accentHex} size={16} style={{ marginRight: 4 }} />
                      <Text style={[styles.pasteBtnText, { color: accentHex }]}>Paste</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Message to Owner (Optional)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text, height: 50, paddingTop: 8 }]}
                    placeholder="e.g. Hi, I am the new accountant. Please approve my access."
                    placeholderTextColor={theme.textSecondary}
                    value={joinMessage}
                    onChangeText={setJoinMessage}
                    multiline={true}
                  />

                  <View style={styles.formActions}>
                    <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.card }]} onPress={() => setShowJoinForm(false)}>
                      <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: accentHex }]} onPress={handleJoinWorkspace} disabled={joining}>
                      {joining ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Send Join Request</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
  );

  // On native platforms, use <Modal> for proper layering and hardware back-button support.
  // On web, render inline as a fixed-position absolute overlay.
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { zIndex: 9999, elevation: 999 },
        ]}
        // @ts-ignore - web only prop
        pointerEvents="auto"
      >
        {modalContent}
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      {modalContent}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(3, 8, 16, 0.85)', justifyContent: 'flex-end' },
  card: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 22, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, paddingBottom: 14 },
  headerTitle: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
  closeBtn: { padding: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  emptyBusCard: { padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', marginBottom: 8 },
  emptyBusText: { fontSize: 12, fontWeight: '600' },
  workspaceItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  workspaceInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  workspaceName: { fontSize: 15, fontWeight: '700' },
  workspaceRole: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  actionGrid: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 12, borderWidth: 1 },
  actionBtnText: { fontSize: 12, fontWeight: '800' },
  subFormCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginTop: 4, marginBottom: 16, gap: 4 },
  formTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  formSub: { fontSize: 12, marginBottom: 10, lineHeight: 16 },
  fieldLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 44, fontSize: 13 },
  inputWithBtn: { flexDirection: 'row', gap: 8 },
  inputFlex: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 44, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  pasteBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  pasteBtnText: { fontSize: 12, fontWeight: '700' },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  submitBtn: { flex: 2, height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
