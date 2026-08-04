import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Switch,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  X, User, Briefcase, Globe, Bell, HelpCircle, MessageCircle,
  Shield, Lock, LogOut, Trash2, ChevronRight, Users, UserPlus,
  Copy, Settings, Moon, CreditCard, Languages,
} from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';

const XIcon = X as any;
const UserIcon = User as any;
const BriefcaseIcon = Briefcase as any;
const GlobeIcon = Globe as any;
const BellIcon = Bell as any;
const HelpCircleIcon = HelpCircle as any;
const MessageCircleIcon = MessageCircle as any;
const ShieldIcon = Shield as any;
const LockIcon = Lock as any;
const LogOutIcon = LogOut as any;
const Trash2Icon = Trash2 as any;
const ChevronRightIcon = ChevronRight as any;
const UsersIcon = Users as any;
const UserPlusIcon = UserPlus as any;
const CopyIcon = Copy as any;
const SettingsIcon = Settings as any;
const MoonIcon = Moon as any;
const CreditCardIcon = CreditCard as any;
const LanguagesIcon = Languages as any;

type SettingsModalProps = {
  visible: boolean;
  onClose: () => void;
  apiBaseUrl: string;
  onSave: (newUrl: string) => void;
  activeWorkspaceId?: string;
  activeWorkspaceRole?: string;
  currentUser?: any;
  onLogout?: () => void;
};

type Section = 'main' | 'editProfile' | 'changePassword' | 'workspace' | 'inviteMembers' | 'ownerRequests';

export function SettingsModal({
  visible,
  onClose,
  apiBaseUrl,
  onSave,
  activeWorkspaceId,
  activeWorkspaceRole,
  currentUser,
  onLogout,
}: SettingsModalProps) {
  const [section, setSection] = useState<Section>('main');

  // Profile edit
  const [profile, setProfile] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Change password
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  // Workspace
  const [workspaceInfo, setWorkspaceInfo] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingWS, setLoadingWS] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joiningWS, setJoiningWS] = useState(false);

  // Invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Owner requests
  const [ownerRequests, setOwnerRequests] = useState<any[]>([]);
  const [ownerRequestReason, setOwnerRequestReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    if (visible) {
      setSection('main');
      fetchProfile();
      if (activeWorkspaceId && activeWorkspaceId !== 'personal') {
        fetchWorkspaceInfo();
      }
    }
  }, [visible, activeWorkspaceId]);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (e) {}
  };

  const fetchWorkspaceInfo = async () => {
    setLoadingWS(true);
    try {
      const [wsRes, membersRes, reqRes] = await Promise.all([
        apiClient.get(`/businesses/${activeWorkspaceId}`),
        apiClient.get(`/businesses/${activeWorkspaceId}`),
        apiClient.get('/workspaces/owner-requests', activeWorkspaceId),
      ]);
      if (wsRes.ok) {
        const d = await wsRes.json();
        setWorkspaceInfo(d);
        setMembers(d.members || []);
      }
      if (reqRes.ok) {
        const rd = await reqRes.json();
        setOwnerRequests(Array.isArray(rd) ? rd : []);
      }
    } catch (e) {}
    setLoadingWS(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await apiClient.put('/auth/profile', {
        fullName: profile.fullName,
        phone: profile.phone,
        companyName: profile.companyName,
        businessOwnerName: profile.businessOwnerName,
        gstNumber: profile.gstNumber,
        businessCategory: profile.businessCategory,
        companyAddress: profile.companyAddress,
      });
      if (res.ok) {
        Alert.alert('✅ Profile Updated', 'Your profile has been saved successfully.');
        setSection('main');
      } else {
        const d = await res.json();
        Alert.alert('Error', d.error || 'Failed to update profile.');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      Alert.alert('Required', 'All password fields are required.');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    if (newPwd.length < 8) {
      Alert.alert('Too Short', 'New password must be at least 8 characters.');
      return;
    }
    setPwdSaving(true);
    try {
      const res = await apiClient.post('/auth/change-password', {
        currentPassword: currentPwd,
        newPassword: newPwd,
      });
      const d = await res.json();
      if (res.ok) {
        Alert.alert('✅ Password Changed', 'Your password has been updated.');
        setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
        setSection('main');
      } else {
        Alert.alert('Error', d.error || 'Failed to change password.');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
    setPwdSaving(false);
  };

  const handleJoinWorkspace = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Required', 'Please enter a workspace join code.');
      return;
    }
    setJoiningWS(true);
    try {
      const res = await apiClient.post('/workspaces/join', { joinCode: joinCode.trim().toUpperCase() });
      const d = await res.json();
      if (res.ok) {
        Alert.alert('🎉 Joined!', `Successfully joined ${d.workspace?.name || 'workspace'} as Employee.`);
        setJoinCode('');
      } else {
        Alert.alert('Error', d.error || 'Invalid join code.');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
    setJoiningWS(false);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Required', 'Please enter an email address.');
      return;
    }
    setInviting(true);
    try {
      const res = await apiClient.post(`/businesses/${activeWorkspaceId}/invitations`, {
        invitedEmail: inviteEmail.trim(),
        role: 'employee',
      });
      const d = await res.json();
      if (res.ok) {
        Alert.alert('✅ Invitation Sent', `Invitation sent to ${inviteEmail}.`);
        setInviteEmail('');
      } else {
        Alert.alert('Error', d.error || 'Failed to send invitation.');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
    setInviting(false);
  };

  const handleRequestOwnerAccess = async () => {
    if (!ownerRequestReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for your owner access request.');
      return;
    }
    setSubmittingRequest(true);
    try {
      const res = await apiClient.post('/workspaces/request-owner', {
        reason: ownerRequestReason.trim(),
      }, activeWorkspaceId);
      const d = await res.json();
      if (res.ok) {
        Alert.alert('✅ Request Sent', 'Your owner access request has been sent to the Primary Owner.');
        setOwnerRequestReason('');
      } else {
        Alert.alert('Error', d.error || 'Failed to submit request.');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
    setSubmittingRequest(false);
  };

  const handleRespondOwnerRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await apiClient.post(
        `/workspaces/owner-requests/${requestId}/respond`,
        { status },
        activeWorkspaceId
      );
      const d = await res.json();
      if (res.ok) {
        Alert.alert('✅ Done', `Request ${status}.`);
        fetchWorkspaceInfo();
      } else {
        Alert.alert('Error', d.error || 'Failed to process request.');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiClient.delete('/auth/account');
              if (res.ok) {
                Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                onLogout?.();
              } else {
                const d = await res.json();
                Alert.alert('Error', d.error || 'Failed to delete account.');
              }
            } catch (e) {
              Alert.alert('Error', 'Network error. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          onLogout?.();
          onClose();
        }
      },
    ]);
  };

  const isOwner = activeWorkspaceRole === 'owner';
  const isBusiness = activeWorkspaceId && activeWorkspaceId !== 'personal';

  const goBack = () => setSection('main');

  const renderSettingRow = (
    icon: React.ReactNode,
    label: string,
    onPress: () => void,
    destructive = false,
    subtitle?: string
  ) => (
    <TouchableOpacity key={label} style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.settingIcon, destructive && styles.settingIconDestructive]}>
        {icon}
      </View>
      <View style={styles.settingTextArea}>
        <Text style={[styles.settingLabel, destructive && styles.settingLabelDestructive]}>{label}</Text>
        {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
      </View>
      <ChevronRightIcon color={destructive ? '#ef4444' : '#4a6080'} size={16} />
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string, onBack: () => void) => (
    <View style={styles.sectionHeader}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  // ── MAIN SETTINGS VIEW ──────────────────────────────────
  const renderMain = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* ACCOUNT SECTION */}
      <View style={styles.group}>
        <Text style={styles.groupHeader}>Account</Text>
        {renderSettingRow(<UserIcon color="#60a5fa" size={18} />, 'Edit Profile', () => setSection('editProfile'), false, profile.email || '')}
        {renderSettingRow(<LockIcon color="#60a5fa" size={18} />, 'Change Password', () => setSection('changePassword'))}
        {renderSettingRow(<Trash2Icon color="#ef4444" size={18} />, 'Delete Account', handleDeleteAccount, true)}
      </View>

      {/* WORKSPACE SECTION */}
      <View style={styles.group}>
        <Text style={styles.groupHeader}>Workspace</Text>
        {isBusiness ? (
          <>
            {renderSettingRow(
              <BriefcaseIcon color="#a78bfa" size={18} />,
              'My Workspace',
              () => setSection('workspace'),
              false,
              workspaceInfo?.name || '...'
            )}
            {isOwner && renderSettingRow(
              <UserPlusIcon color="#a78bfa" size={18} />,
              'Invite Members',
              () => setSection('inviteMembers')
            )}
            {renderSettingRow(
              <UsersIcon color="#a78bfa" size={18} />,
              'Owner Requests',
              () => setSection('ownerRequests'),
              false,
              ownerRequests.filter(r => r.status === 'pending').length > 0 ?
                `${ownerRequests.filter(r => r.status === 'pending').length} pending` : 'View requests'
            )}
          </>
        ) : (
          renderSettingRow(
            <BriefcaseIcon color="#a78bfa" size={18} />,
            'Join a Workspace',
            () => setSection('workspace'),
            false,
            'Enter a join code'
          )
        )}
      </View>

      {/* PREFERENCES SECTION */}
      <View style={styles.group}>
        <Text style={styles.groupHeader}>Preferences</Text>
        {renderSettingRow(<LanguagesIcon color="#34d399" size={18} />, 'Language', () => Alert.alert('Coming Soon', 'Language selection will be available in an upcoming update.'))}
        {renderSettingRow(<CreditCardIcon color="#34d399" size={18} />, 'Currency', () => Alert.alert('Coming Soon', 'Multi-currency support is coming soon.'))}
        {renderSettingRow(<MoonIcon color="#34d399" size={18} />, 'Theme', () => Alert.alert('Coming Soon', 'Theme preferences are coming in the next update.'))}
        {renderSettingRow(<BellIcon color="#34d399" size={18} />, 'Notifications', () => Alert.alert('Coming Soon', 'Notification settings will be available soon.'))}
      </View>

      {/* SUPPORT SECTION */}
      <View style={styles.group}>
        <Text style={styles.groupHeader}>Support</Text>
        {renderSettingRow(<HelpCircleIcon color="#f59e0b" size={18} />, 'Help Center', () => Alert.alert('Help Center', 'For support, email us at support@hisabhero.com'))}
        {renderSettingRow(<MessageCircleIcon color="#f59e0b" size={18} />, 'Contact Support', () => Alert.alert('Contact Support', 'Email: support@hisabhero.com'))}
        {renderSettingRow(<ShieldIcon color="#f59e0b" size={18} />, 'Privacy Policy', () => Alert.alert('Privacy Policy', 'Visit hisabhero.com/privacy for our full Privacy Policy.'))}
        {renderSettingRow(<GlobeIcon color="#f59e0b" size={18} />, 'Terms & Conditions', () => Alert.alert('Terms', 'Visit hisabhero.com/terms for Terms & Conditions.'))}
        {renderSettingRow(<SettingsIcon color="#f59e0b" size={18} />, 'About HisabHero', () => Alert.alert('HisabHero', 'Version 2.0.0\nBuild: Enterprise\nYour Smart AI Finance Partner.'))}
      </View>

      {/* SECURITY SECTION */}
      <View style={styles.group}>
        <Text style={styles.groupHeader}>Security</Text>
        {renderSettingRow(<LogOutIcon color="#ef4444" size={18} />, 'Logout', handleLogout, true)}
      </View>
    </ScrollView>
  );

  // ── EDIT PROFILE VIEW ──────────────────────────────────
  const renderEditProfile = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {renderSectionHeader('Edit Profile', goBack)}
      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>Full Name</Text>
        <TextInput
          style={styles.fieldInput}
          value={profile.fullName || ''}
          onChangeText={v => setProfile({ ...profile, fullName: v })}
          placeholderTextColor="#4a6080"
          placeholder="Your full name"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>Phone Number</Text>
        <TextInput
          style={styles.fieldInput}
          value={profile.phone || ''}
          onChangeText={v => setProfile({ ...profile, phone: v })}
          keyboardType="phone-pad"
          placeholderTextColor="#4a6080"
          placeholder="+91 XXXXXXXXXX"
        />
      </View>
      {profile.accountType === 'business' && (
        <>
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Company Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={profile.companyName || ''}
              onChangeText={v => setProfile({ ...profile, companyName: v })}
              placeholderTextColor="#4a6080"
              placeholder="Company name"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>GST Number</Text>
            <TextInput
              style={styles.fieldInput}
              value={profile.gstNumber || ''}
              onChangeText={v => setProfile({ ...profile, gstNumber: v })}
              placeholderTextColor="#4a6080"
              placeholder="GSTIN (optional)"
              autoCapitalize="characters"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Business Category</Text>
            <TextInput
              style={styles.fieldInput}
              value={profile.businessCategory || ''}
              onChangeText={v => setProfile({ ...profile, businessCategory: v })}
              placeholderTextColor="#4a6080"
              placeholder="e.g. Retail, Manufacturing"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Company Address</Text>
            <TextInput
              style={[styles.fieldInput, { height: 80 }]}
              value={profile.companyAddress || ''}
              onChangeText={v => setProfile({ ...profile, companyAddress: v })}
              placeholderTextColor="#4a6080"
              placeholder="Full company address"
              multiline
            />
          </View>
        </>
      )}
      <TouchableOpacity
        style={[styles.actionBtn, saving && styles.actionBtnDisabled]}
        onPress={handleSaveProfile}
        disabled={saving}
        activeOpacity={0.8}
      >
        {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionBtnText}>Save Changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  );

  // ── CHANGE PASSWORD VIEW ──────────────────────────────────
  const renderChangePassword = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {renderSectionHeader('Change Password', goBack)}
      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>Current Password</Text>
        <TextInput
          style={styles.fieldInput}
          value={currentPwd}
          onChangeText={setCurrentPwd}
          secureTextEntry
          placeholderTextColor="#4a6080"
          placeholder="Enter current password"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>New Password</Text>
        <TextInput
          style={styles.fieldInput}
          value={newPwd}
          onChangeText={setNewPwd}
          secureTextEntry
          placeholderTextColor="#4a6080"
          placeholder="At least 8 characters"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>Confirm New Password</Text>
        <TextInput
          style={styles.fieldInput}
          value={confirmPwd}
          onChangeText={setConfirmPwd}
          secureTextEntry
          placeholderTextColor="#4a6080"
          placeholder="Repeat new password"
        />
      </View>
      <TouchableOpacity
        style={[styles.actionBtn, pwdSaving && styles.actionBtnDisabled]}
        onPress={handleChangePassword}
        disabled={pwdSaving}
        activeOpacity={0.8}
      >
        {pwdSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionBtnText}>Change Password</Text>}
      </TouchableOpacity>
    </ScrollView>
  );

  // ── WORKSPACE VIEW ──────────────────────────────────
  const renderWorkspace = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {renderSectionHeader(isBusiness ? 'My Workspace' : 'Join Workspace', goBack)}

      {!isBusiness && (
        <>
          <Text style={styles.infoText}>Enter a workspace join code to join a team as an Employee.</Text>
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Join Code</Text>
            <TextInput
              style={styles.fieldInput}
              value={joinCode}
              onChangeText={v => setJoinCode(v.toUpperCase())}
              placeholderTextColor="#4a6080"
              placeholder="e.g. HH-A8F9KQ"
              autoCapitalize="characters"
            />
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, joiningWS && styles.actionBtnDisabled]}
            onPress={handleJoinWorkspace}
            disabled={joiningWS}
            activeOpacity={0.8}
          >
            {joiningWS ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionBtnText}>Join Workspace</Text>}
          </TouchableOpacity>
        </>
      )}

      {isBusiness && workspaceInfo && (
        <>
          <View style={styles.wsBadge}>
            <Text style={styles.wsBadgeName}>{workspaceInfo.name}</Text>
            <Text style={styles.wsBadgeRole}>Your Role: {activeWorkspaceRole?.toUpperCase()}</Text>
          </View>

          {isOwner && workspaceInfo.joinCode ? (
            <View style={styles.joinCodeCard}>
              <Text style={styles.joinCodeLabel}>Workspace Join Code</Text>
              <Text style={styles.joinCodeValue}>{workspaceInfo.joinCode}</Text>
              <Text style={styles.joinCodeHint}>Share this code with people you want to invite. They join as Employee by default.</Text>
            </View>
          ) : null}

          {!isOwner && (
            <>
              <Text style={[styles.fieldLabel, { marginTop: 20, marginBottom: 8 }]}>Request Owner Access</Text>
              <Text style={styles.infoText}>Provide a reason why you need Owner privileges in this workspace.</Text>
              <View style={styles.formGroup}>
                <TextInput
                  style={[styles.fieldInput, { height: 80 }]}
                  value={ownerRequestReason}
                  onChangeText={setOwnerRequestReason}
                  placeholderTextColor="#4a6080"
                  placeholder="Explain why you need owner access..."
                  multiline
                />
              </View>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#7c3aed' }, submittingRequest && styles.actionBtnDisabled]}
                onPress={handleRequestOwnerAccess}
                disabled={submittingRequest}
                activeOpacity={0.8}
              >
                {submittingRequest
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.actionBtnText}>Submit Owner Request</Text>
                }
              </TouchableOpacity>
            </>
          )}

          <Text style={[styles.fieldLabel, { marginTop: 24, marginBottom: 12 }]}>Members ({members.length})</Text>
          {loadingWS ? (
            <ActivityIndicator color="#60a5fa" />
          ) : members.map((m: any, i: number) => (
            <View key={i} style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{(m.fullName || m.email || 'U')[0].toUpperCase()}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{m.fullName || m.email}</Text>
                <Text style={styles.memberRole}>{m.role?.toUpperCase() || 'MEMBER'}</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );

  // ── INVITE MEMBERS VIEW ──────────────────────────────────
  const renderInviteMembers = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {renderSectionHeader('Invite Members', goBack)}
      <Text style={styles.infoText}>Invite people to your workspace by email. They will join as Employee by default.</Text>
      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>Email Address</Text>
        <TextInput
          style={styles.fieldInput}
          value={inviteEmail}
          onChangeText={setInviteEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#4a6080"
          placeholder="colleague@example.com"
        />
      </View>
      <TouchableOpacity
        style={[styles.actionBtn, inviting && styles.actionBtnDisabled]}
        onPress={handleSendInvite}
        disabled={inviting}
        activeOpacity={0.8}
      >
        {inviting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionBtnText}>Send Invitation</Text>}
      </TouchableOpacity>

      {workspaceInfo?.joinCode ? (
        <View style={styles.joinCodeCard}>
          <Text style={styles.joinCodeLabel}>Or share the Join Code</Text>
          <Text style={styles.joinCodeValue}>{workspaceInfo.joinCode}</Text>
          <Text style={styles.joinCodeHint}>Members can join instantly by entering this code in Settings → Join Workspace.</Text>
        </View>
      ) : null}
    </ScrollView>
  );

  // ── OWNER REQUESTS VIEW ──────────────────────────────────
  const renderOwnerRequests = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {renderSectionHeader('Owner Requests', goBack)}
      {ownerRequests.length === 0 ? (
        <Text style={styles.emptyText}>No owner access requests at this time.</Text>
      ) : ownerRequests.map((req: any, i: number) => (
        <View key={i} style={styles.requestCard}>
          <Text style={styles.requestName}>{req.userName}</Text>
          <Text style={styles.requestEmail}>{req.userEmail}</Text>
          <Text style={styles.requestReason}>"{req.reason}"</Text>
          <View style={[styles.statusBadge, {
            backgroundColor: req.status === 'pending' ? '#1d4ed8' : req.status === 'approved' ? '#166534' : '#7f1d1d'
          }]}>
            <Text style={styles.statusBadgeText}>{req.status.toUpperCase()}</Text>
          </View>
          {req.status === 'pending' && isOwner && (
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={[styles.requestBtn, { backgroundColor: '#166534' }]}
                onPress={() => handleRespondOwnerRequest(req.id || req._id, 'approved')}
              >
                <Text style={styles.requestBtnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.requestBtn, { backgroundColor: '#7f1d1d' }]}
                onPress={() => handleRespondOwnerRequest(req.id || req._id, 'rejected')}
              >
                <Text style={styles.requestBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <XIcon color="#a6bedf" size={20} />
            </TouchableOpacity>
          </View>

          {section === 'main' && renderMain()}
          {section === 'editProfile' && renderEditProfile()}
          {section === 'changePassword' && renderChangePassword()}
          {section === 'workspace' && renderWorkspace()}
          {section === 'inviteMembers' && renderInviteMembers()}
          {section === 'ownerRequests' && renderOwnerRequests()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#0d1f35',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    padding: 20,
    paddingBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  cardTitle: {
    color: '#e2f0ff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
  },
  group: {
    marginBottom: 20,
  },
  groupHeader: {
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    marginBottom: 6,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingIconDestructive: {
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  settingTextArea: {
    flex: 1,
  },
  settingLabel: {
    color: '#d1e8ff',
    fontSize: 15,
    fontWeight: '500',
  },
  settingLabelDestructive: {
    color: '#f87171',
  },
  settingSubtitle: {
    color: '#4a6080',
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    marginRight: 12,
  },
  backBtnText: {
    color: '#60a5fa',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#e2f0ff',
    fontSize: 16,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: '#7a9dbf',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  fieldInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#e2f0ff',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  actionBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  infoText: {
    color: '#4a7aa0',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  wsBadge: {
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  wsBadgeName: {
    color: '#c4b5fd',
    fontSize: 17,
    fontWeight: '700',
  },
  wsBadgeRole: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  joinCodeCard: {
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  joinCodeLabel: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  joinCodeValue: {
    color: '#e0e7ff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 8,
  },
  joinCodeHint: {
    color: '#4a5568',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: '#d1e8ff',
    fontSize: 14,
    fontWeight: '600',
  },
  memberRole: {
    color: '#4a7aa0',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  requestCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  requestName: {
    color: '#e2f0ff',
    fontSize: 15,
    fontWeight: '700',
  },
  requestEmail: {
    color: '#4a7aa0',
    fontSize: 12,
    marginTop: 2,
  },
  requestReason: {
    color: '#94a3b8',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  requestBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    color: '#4a6080',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
  },
});
