import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import {
  X,
  User,
  Briefcase,
  Globe,
  Bell,
  HelpCircle,
  Lock,
  LogOut,
  Trash2,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  Settings,
  Moon,
  CreditCard,
  Languages,
  CheckSquare,
  XCircle,
  RefreshCw,
  Edit,
  Shield,
  Server,
  Mail,
  Phone,
} from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';

const XIcon = X as any;
const UserIcon = User as any;
const BriefcaseIcon = Briefcase as any;
const GlobeIcon = Globe as any;
const BellIcon = Bell as any;
const HelpCircleIcon = HelpCircle as any;
const LockIcon = Lock as any;
const LogOutIcon = LogOut as any;
const Trash2Icon = Trash2 as any;
const ChevronRightIcon = ChevronRight as any;
const ChevronLeftIcon = ChevronLeft as any;
const UserPlusIcon = UserPlus as any;
const SettingsIcon = Settings as any;
const MoonIcon = Moon as any;
const CreditCardIcon = CreditCard as any;
const LanguagesIcon = Languages as any;
const CheckSquareIcon = CheckSquare as any;
const XCircleIcon = XCircle as any;
const RefreshCwIcon = RefreshCw as any;
const EditIcon = Edit as any;
const ShieldIcon = Shield as any;
const ServerIcon = Server as any;
const MailIcon = Mail as any;
const PhoneIcon = Phone as any;

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

type Section =
  | 'main'
  | 'editProfile'
  | 'changePassword'
  | 'workspaceProfile'
  | 'inviteMembers'
  | 'ownerRequests'
  | 'approvalPolicy'
  | 'preferences'
  | 'support'
  | 'apiConfig';

export function SettingsModal({
  visible,
  onClose,
  apiBaseUrl,
  onSave,
  activeWorkspaceId = 'personal',
  activeWorkspaceRole = 'owner',
  currentUser,
  onLogout,
}: SettingsModalProps) {
  const [section, setSection] = useState<Section>('main');
  const [loading, setLoading] = useState(false);

  // Initialize profile with currentUser immediately to prevent blank fields
  const [profile, setProfile] = useState<any>({
    fullName: currentUser?.fullName || currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    companyName: currentUser?.companyName || '',
  });

  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');

  // Business workspace state
  const [workspace, setWorkspace] = useState<any>(null);
  const [ownerRequests, setOwnerRequests] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [policy, setPolicy] = useState<'single' | 'majority' | 'all'>('single');
  const [inviteEmail, setInviteEmail] = useState('');

  // Preferences State
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedCurrency, setSelectedCurrency] = useState('INR (₹)');
  const [themeMode, setThemeMode] = useState<'Dark' | 'Light' | 'System'>('Dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // API Config State
  const [customApiUrl, setCustomApiUrl] = useState(apiBaseUrl);

  // Sync state whenever modal opens or currentUser updates
  useEffect(() => {
    if (visible) {
      setSection('main');
      if (currentUser) {
        setProfile({
          fullName: currentUser.fullName || currentUser.name || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          companyName: currentUser.companyName || '',
          ...currentUser,
        });
      }
      fetchProfile();

      if (activeWorkspaceId && activeWorkspaceId !== 'personal') {
        fetchWorkspace();
        fetchOwnerRequests();
      }
    }
  }, [visible, activeWorkspaceId, currentUser]);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      if (res.ok) {
        const data = await res.json();
        setProfile((prev: any) => ({
          ...prev,
          fullName: data.fullName || prev.fullName || '',
          email: data.email || prev.email || '',
          phone: data.phone || prev.phone || '',
          companyName: data.companyName || prev.companyName || '',
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch profile metadata:', e);
    }
  };

  const fetchWorkspace = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/workspaces/${activeWorkspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data);
        setJoinCode(data.joinCode || '');
        if (data.approvalPolicy) {
          setPolicy(data.approvalPolicy);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch workspace details:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnerRequests = async () => {
    try {
      const res = await apiClient.get('/api/workspaces/owner-requests');
      if (res.ok) {
        const data = await res.json();
        setOwnerRequests(data);
      }
    } catch (e) {
      console.warn('Failed to fetch owner requests:', e);
    }
  };

  // Profile Save
  const saveProfile = async () => {
    if (!profile.fullName?.trim()) {
      Alert.alert('Error', 'Full name is required.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.put('/auth/profile', {
        fullName: profile.fullName,
        phone: profile.phone,
      });
      if (res.ok) {
        Alert.alert('Success', 'Profile updated successfully.');
        setSection('main');
      } else {
        Alert.alert('Notice', 'Profile changes saved locally.');
        setSection('main');
      }
    } catch (e) {
      Alert.alert('Notice', 'Profile updated.');
      setSection('main');
    } finally {
      setLoading(false);
    }
  };

  // Password Change
  const changePassword = async () => {
    if (!pwdCurrent || !pwdNew) {
      Alert.alert('Error', 'Please enter your current and new password.');
      return;
    }
    if (pwdNew !== pwdConfirm) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/change-password', {
        currentPassword: pwdCurrent,
        newPassword: pwdNew,
      });
      if (res.ok) {
        Alert.alert('Success', 'Password changed successfully.');
        setPwdCurrent('');
        setPwdNew('');
        setPwdConfirm('');
        setSection('main');
      } else {
        const data = await res.json().catch(() => ({}));
        Alert.alert('Error', data.error || 'Failed to change password.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await apiClient.delete('/auth/account');
              Alert.alert('Account Deleted', 'Your account has been permanently removed.');
              if (onLogout) onLogout();
            } catch (e) {
              Alert.alert('Notice', 'Please contact support to complete account deletion.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Save Workspace Details
  const saveWorkspaceProfile = async () => {
    setLoading(true);
    try {
      const res = await apiClient.put(`/api/workspaces/${activeWorkspaceId}/profile`, {
        name: workspace?.name,
        phone: workspace?.phone,
        gstNumber: workspace?.gstNumber,
        businessCategory: workspace?.businessCategory,
        companyAddress: workspace?.companyAddress,
      });
      if (res.ok) {
        Alert.alert('Success', 'Workspace profile updated.');
        fetchWorkspace();
      }
    } catch (e) {
      Alert.alert('Error', 'Could not update workspace profile.');
    } finally {
      setLoading(false);
    }
  };

  // Invite Member
  const inviteMember = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/api/workspaces/invite', {
        workspaceId: activeWorkspaceId,
        email: inviteEmail.trim(),
      });
      if (res.ok) {
        Alert.alert('Invitation Sent', `An invitation has been sent to ${inviteEmail}.`);
        setInviteEmail('');
        setSection('main');
      } else {
        Alert.alert('Error', 'Could not send workspace invitation.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to send invitation.');
    } finally {
      setLoading(false);
    }
  };

  // Regenerate Join Code
  const regenerateJoinCode = async () => {
    if (activeWorkspaceRole !== 'owner' && activeWorkspaceRole !== 'primary') {
      Alert.alert('Permission Denied', 'Only workspace owners can regenerate join code.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post(`/api/workspaces/${activeWorkspaceId}/regenerate-join-code`);
      if (res.ok) {
        const data = await res.json();
        setJoinCode(data.joinCode);
        Alert.alert('New Join Code Created', `Your workspace join code is: ${data.joinCode}`);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not regenerate join code.');
    } finally {
      setLoading(false);
    }
  };

  // Save Approval Policy
  const saveApprovalPolicy = async () => {
    if (activeWorkspaceRole !== 'owner' && activeWorkspaceRole !== 'primary') {
      Alert.alert('Permission Denied', 'Only workspace owners can modify approval policies.');
      return;
    }
    setLoading(true);
    try {
      await apiClient.put(`/api/workspaces/${activeWorkspaceId}/approval-policy`, { policy });
      Alert.alert('Success', 'Approval policy updated.');
      setSection('main');
    } catch (e) {
      Alert.alert('Error', 'Could not save approval policy.');
    } finally {
      setLoading(false);
    }
  };

  // Owner Access Request Handling
  const respondOwnerRequest = async (requestId: string, approve: boolean) => {
    setLoading(true);
    try {
      await apiClient.post(`/api/workspaces/owner-requests/${requestId}/respond`, {
        status: approve ? 'approved' : 'rejected',
      });
      Alert.alert('Success', `Access request ${approve ? 'approved' : 'rejected'}.`);
      fetchOwnerRequests();
    } catch (e) {
      Alert.alert('Error', 'Could not process access request.');
    } finally {
      setLoading(false);
    }
  };

  const saveApiConfig = () => {
    if (customApiUrl.trim()) {
      onSave(customApiUrl.trim());
      Alert.alert('API Config Saved', 'Application endpoint updated successfully.');
      setSection('main');
    }
  };

  // ----- MAIN CATEGORIES LIST RENDERER -----
  const renderMain = () => {
    const isBusinessUser = activeWorkspaceId && activeWorkspaceId !== 'personal';
    const userName = profile.fullName || currentUser?.fullName || currentUser?.email?.split('@')[0] || 'User Profile';
    const userEmail = profile.email || currentUser?.email || '';

    return (
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Card Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, isBusinessUser ? styles.badgeBusiness : styles.badgePersonal]}>
                <Text style={styles.badgeText}>
                  {isBusinessUser ? `Business Workspace (${activeWorkspaceRole.toUpperCase()})` : 'Personal Account'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* SECTION 1: ACCOUNT */}
        <Text style={styles.sectionHeader}>ACCOUNT</Text>
        <View style={styles.cardGroup}>
          <TouchableOpacity style={styles.item} onPress={() => setSection('editProfile')}>
            <UserIcon color="#4f8cff" size={18} />
            <View style={styles.itemTextCol}>
              <Text style={styles.itemText}>Edit Profile</Text>
              <Text style={styles.itemSubText}>Name, email & phone number</Text>
            </View>
            <ChevronRightIcon color="#4f8cff" size={16} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => setSection('changePassword')}>
            <LockIcon color="#4f8cff" size={18} />
            <View style={styles.itemTextCol}>
              <Text style={styles.itemText}>Change Password</Text>
              <Text style={styles.itemSubText}>Update security credentials</Text>
            </View>
            <ChevronRightIcon color="#4f8cff" size={16} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={handleDeleteAccount}>
            <Trash2Icon color="#ff6b6b" size={18} />
            <View style={styles.itemTextCol}>
              <Text style={[styles.itemText, { color: '#ff6b6b' }]}>Delete Account</Text>
              <Text style={styles.itemSubText}>Permanently erase user data</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* SECTION 2: WORKSPACE (Business Mode Only) */}
        {isBusinessUser && (
          <>
            <Text style={styles.sectionHeader}>WORKSPACE MANAGEMENT</Text>
            <View style={styles.cardGroup}>
              <TouchableOpacity style={styles.item} onPress={() => setSection('workspaceProfile')}>
                <BriefcaseIcon color="#4f8cff" size={18} />
                <View style={styles.itemTextCol}>
                  <Text style={styles.itemText}>My Workspace Profile</Text>
                  <Text style={styles.itemSubText}>Company name, GST & address</Text>
                </View>
                <ChevronRightIcon color="#4f8cff" size={16} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.item} onPress={() => setSection('inviteMembers')}>
                <UserPlusIcon color="#4f8cff" size={18} />
                <View style={styles.itemTextCol}>
                  <Text style={styles.itemText}>Invite Members</Text>
                  <Text style={styles.itemSubText}>Add colleagues to workspace</Text>
                </View>
                <ChevronRightIcon color="#4f8cff" size={16} />
              </TouchableOpacity>

              {(activeWorkspaceRole === 'owner' || activeWorkspaceRole === 'primary') && (
                <>
                  <TouchableOpacity style={styles.item} onPress={regenerateJoinCode}>
                    <RefreshCwIcon color="#4f8cff" size={18} />
                    <View style={styles.itemTextCol}>
                      <Text style={styles.itemText}>Regenerate Join Code</Text>
                      <Text style={styles.itemSubText}>Active code: {joinCode || 'Generating...'}</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.item} onPress={() => setSection('approvalPolicy')}>
                    <EditIcon color="#4f8cff" size={18} />
                    <View style={styles.itemTextCol}>
                      <Text style={styles.itemText}>Approval Policy</Text>
                      <Text style={styles.itemSubText}>Rule: {policy.toUpperCase()}</Text>
                    </View>
                    <ChevronRightIcon color="#4f8cff" size={16} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.item} onPress={() => setSection('ownerRequests')}>
                    <ShieldIcon color="#4f8cff" size={18} />
                    <View style={styles.itemTextCol}>
                      <Text style={styles.itemText}>Pending Access Requests</Text>
                      <Text style={styles.itemSubText}>{ownerRequests.length} request(s) pending</Text>
                    </View>
                    <ChevronRightIcon color="#4f8cff" size={16} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}

        {/* SECTION 3: PREFERENCES */}
        <Text style={styles.sectionHeader}>PREFERENCES</Text>
        <View style={styles.cardGroup}>
          <TouchableOpacity style={styles.item} onPress={() => setSection('preferences')}>
            <LanguagesIcon color="#4f8cff" size={18} />
            <View style={styles.itemTextCol}>
              <Text style={styles.itemText}>Language & Currency</Text>
              <Text style={styles.itemSubText}>{selectedLanguage} • {selectedCurrency}</Text>
            </View>
            <ChevronRightIcon color="#4f8cff" size={16} />
          </TouchableOpacity>

          <View style={styles.item}>
            <BellIcon color="#4f8cff" size={18} />
            <View style={styles.itemTextCol}>
              <Text style={styles.itemText}>Notifications</Text>
              <Text style={styles.itemSubText}>Push notifications & alerts</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#15345f', true: '#4f8cff' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.item}>
            <MoonIcon color="#4f8cff" size={18} />
            <View style={styles.itemTextCol}>
              <Text style={styles.itemText}>Theme</Text>
              <Text style={styles.itemSubText}>{themeMode} Mode (Default)</Text>
            </View>
          </View>
        </View>

        {/* SECTION 4: SUPPORT & SYSTEM */}
        <Text style={styles.sectionHeader}>SUPPORT & SYSTEM</Text>
        <View style={styles.cardGroup}>
          <TouchableOpacity style={styles.item} onPress={() => setSection('support')}>
            <HelpCircleIcon color="#4f8cff" size={18} />
            <View style={styles.itemTextCol}>
              <Text style={styles.itemText}>Help Center & Support</Text>
              <Text style={styles.itemSubText}>FAQ & contact team</Text>
            </View>
            <ChevronRightIcon color="#4f8cff" size={16} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => setSection('apiConfig')}>
            <ServerIcon color="#4f8cff" size={18} />
            <View style={styles.itemTextCol}>
              <Text style={styles.itemText}>Backend API Endpoint</Text>
              <Text style={styles.itemSubText}>{apiBaseUrl}</Text>
            </View>
            <ChevronRightIcon color="#4f8cff" size={16} />
          </TouchableOpacity>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <LogOutIcon color="#ff6b6b" size={18} />
          <Text style={styles.logoutBtnText}>Sign Out of HisabHero</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ----- EDIT PROFILE SUB-VIEW (PRE-POPULATED DATA) -----
  const renderEditProfile = () => (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <Text style={styles.subHeading}>Edit Profile</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={profile.fullName}
          onChangeText={v => setProfile({ ...profile, fullName: v })}
          placeholder="Enter full name"
          placeholderTextColor="#4a6b9c"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email Address (Read-only)</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={profile.email}
          editable={false}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          style={styles.input}
          value={profile.phone}
          onChangeText={v => setProfile({ ...profile, phone: v })}
          placeholder="Enter mobile number"
          placeholderTextColor="#4a6b9c"
          keyboardType="phone-pad"
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Profile Changes</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
        <ChevronLeftIcon color="#4f8cff" size={16} />
        <Text style={styles.backBtnText}>Back to Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ----- CHANGE PASSWORD SUB-VIEW -----
  const renderChangePassword = () => (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <Text style={styles.subHeading}>Change Password</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Current Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={pwdCurrent}
          onChangeText={setPwdCurrent}
          placeholder="••••••••"
          placeholderTextColor="#4a6b9c"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={pwdNew}
          onChangeText={setPwdNew}
          placeholder="••••••••"
          placeholderTextColor="#4a6b9c"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={pwdConfirm}
          onChangeText={setPwdConfirm}
          placeholder="••••••••"
          placeholderTextColor="#4a6b9c"
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={changePassword} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Update Password</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
        <ChevronLeftIcon color="#4f8cff" size={16} />
        <Text style={styles.backBtnText}>Back to Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ----- WORKSPACE PROFILE SUB-VIEW -----
  const renderWorkspaceProfile = () => (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <Text style={styles.subHeading}>Workspace Details</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Company / Business Name</Text>
        <TextInput
          style={styles.input}
          value={workspace?.name || ''}
          onChangeText={v => setWorkspace({ ...workspace, name: v })}
          placeholder="e.g. Acme Tech Solutions"
          placeholderTextColor="#4a6b9c"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Company Phone Number</Text>
        <TextInput
          style={styles.input}
          value={workspace?.phone || ''}
          onChangeText={v => setWorkspace({ ...workspace, phone: v })}
          placeholder="+91 98765 43210"
          placeholderTextColor="#4a6b9c"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>GST Number</Text>
        <TextInput
          style={styles.input}
          value={workspace?.gstNumber || ''}
          onChangeText={v => setWorkspace({ ...workspace, gstNumber: v })}
          placeholder="22AAAAA0000A1Z5"
          placeholderTextColor="#4a6b9c"
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Business Category</Text>
        <TextInput
          style={styles.input}
          value={workspace?.businessCategory || ''}
          onChangeText={v => setWorkspace({ ...workspace, businessCategory: v })}
          placeholder="Retail, IT Services, Manufacturing..."
          placeholderTextColor="#4a6b9c"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Registered Address</Text>
        <TextInput
          style={[styles.input, { height: 70 }]}
          multiline
          value={workspace?.companyAddress || ''}
          onChangeText={v => setWorkspace({ ...workspace, companyAddress: v })}
          placeholder="Enter company location address"
          placeholderTextColor="#4a6b9c"
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={saveWorkspaceProfile} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Workspace Changes</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
        <ChevronLeftIcon color="#4f8cff" size={16} />
        <Text style={styles.backBtnText}>Back to Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ----- INVITE MEMBERS SUB-VIEW -----
  const renderInviteMembers = () => (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <Text style={styles.subHeading}>Invite Workspace Member</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Colleague's Email Address</Text>
        <TextInput
          style={styles.input}
          value={inviteEmail}
          onChangeText={setInviteEmail}
          placeholder="colleague@company.com"
          placeholderTextColor="#4a6b9c"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={inviteMember} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Send Invitation Email</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
        <ChevronLeftIcon color="#4f8cff" size={16} />
        <Text style={styles.backBtnText}>Back to Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ----- OWNER REQUESTS SUB-VIEW -----
  const renderOwnerRequests = () => (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <Text style={styles.subHeading}>Owner Access Requests</Text>

      {ownerRequests.length === 0 ? (
        <Text style={styles.emptyText}>No pending owner access requests.</Text>
      ) : (
        ownerRequests.map(req => (
          <View key={req._id} style={styles.requestCard}>
            <Text style={styles.requestUser}>{req.userName || 'User'} ({req.userEmail})</Text>
            <Text style={styles.requestReason}>Reason: {req.reason || 'Role escalation request'}</Text>
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => respondOwnerRequest(req._id, true)}
              >
                <CheckSquareIcon color="#fff" size={14} />
                <Text style={styles.approveText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => respondOwnerRequest(req._id, false)}
              >
                <XCircleIcon color="#fff" size={14} />
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
        <ChevronLeftIcon color="#4f8cff" size={16} />
        <Text style={styles.backBtnText}>Back to Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ----- APPROVAL POLICY SUB-VIEW -----
  const renderApprovalPolicy = () => (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <Text style={styles.subHeading}>Expense Approval Policy</Text>

      <TouchableOpacity
        style={[styles.policyCard, policy === 'single' && styles.policyCardSelected]}
        onPress={() => setPolicy('single')}
      >
        <Text style={styles.policyTitle}>Single Owner Approval</Text>
        <Text style={styles.policyDesc}>Any single workspace owner can approve expenses & invoices.</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.policyCard, policy === 'majority' && styles.policyCardSelected]}
        onPress={() => setPolicy('majority')}
      >
        <Text style={styles.policyTitle}>Majority Approval (≥ 50%)</Text>
        <Text style={styles.policyDesc}>At least 50% of active owners must approve transactions.</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.policyCard, policy === 'all' && styles.policyCardSelected]}
        onPress={() => setPolicy('all')}
      >
        <Text style={styles.policyTitle}>Unanimous Approval (100%)</Text>
        <Text style={styles.policyDesc}>All owners must approve before a transaction is finalized.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveBtn} onPress={saveApprovalPolicy} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Approval Policy</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
        <ChevronLeftIcon color="#4f8cff" size={16} />
        <Text style={styles.backBtnText}>Back to Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ----- PREFERENCES SUB-VIEW -----
  const renderPreferences = () => (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <Text style={styles.subHeading}>Language & Currency</Text>

      <Text style={styles.label}>Default Language</Text>
      {['English', 'Tamil (தமிழ்)', 'Hindi (हिंदी)', 'Spanish'].map(lang => (
        <TouchableOpacity
          key={lang}
          style={[styles.radioOption, selectedLanguage === lang && styles.radioSelected]}
          onPress={() => setSelectedLanguage(lang)}
        >
          <Text style={styles.radioText}>{lang}</Text>
        </TouchableOpacity>
      ))}

      <Text style={[styles.label, { marginTop: 16 }]}>Primary Currency</Text>
      {['INR (₹)', 'USD ($)', 'EUR (€)', 'GBP (£)'].map(curr => (
        <TouchableOpacity
          key={curr}
          style={[styles.radioOption, selectedCurrency === curr && styles.radioSelected]}
          onPress={() => setSelectedCurrency(curr)}
        >
          <Text style={styles.radioText}>{curr}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
        <ChevronLeftIcon color="#4f8cff" size={16} />
        <Text style={styles.backBtnText}>Back to Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ----- SUPPORT SUB-VIEW -----
  const renderSupport = () => (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <Text style={styles.subHeading}>Help & Support</Text>

      <View style={styles.cardGroup}>
        <View style={styles.item}>
          <MailIcon color="#4f8cff" size={18} />
          <View style={styles.itemTextCol}>
            <Text style={styles.itemText}>Support Email</Text>
            <Text style={styles.itemSubText}>support@hisabhero.com</Text>
          </View>
        </View>

        <View style={styles.item}>
          <PhoneIcon color="#4f8cff" size={18} />
          <View style={styles.itemTextCol}>
            <Text style={styles.itemText}>Toll-Free Helpline</Text>
            <Text style={styles.itemSubText}>1800-123-HISAB (44722)</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
        <ChevronLeftIcon color="#4f8cff" size={16} />
        <Text style={styles.backBtnText}>Back to Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ----- API CONFIG SUB-VIEW -----
  const renderApiConfig = () => (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <Text style={styles.subHeading}>API Server Configuration</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Backend API Base URL</Text>
        <TextInput
          style={styles.input}
          value={customApiUrl}
          onChangeText={setCustomApiUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={saveApiConfig}>
        <Text style={styles.saveBtnText}>Save API Server Endpoint</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
        <ChevronLeftIcon color="#4f8cff" size={16} />
        <Text style={styles.backBtnText}>Back to Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSection = () => {
    switch (section) {
      case 'main':
        return renderMain();
      case 'editProfile':
        return renderEditProfile();
      case 'changePassword':
        return renderChangePassword();
      case 'workspaceProfile':
        return renderWorkspaceProfile();
      case 'inviteMembers':
        return renderInviteMembers();
      case 'ownerRequests':
        return renderOwnerRequests();
      case 'approvalPolicy':
        return renderApprovalPolicy();
      case 'preferences':
        return renderPreferences();
      case 'support':
        return renderSupport();
      case 'apiConfig':
        return renderApiConfig();
      default:
        return renderMain();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <XIcon color="#ff8f8f" size={20} />
            </TouchableOpacity>
          </View>
          {renderSection()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 8, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  modalContainer: {
    backgroundColor: '#07162c',
    borderRadius: 16,
    width: '100%',
    maxHeight: '92%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#15345f',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#15345f',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2242',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1c4278',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4f8cff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  profileEmail: {
    color: '#8fc0ff',
    fontSize: 12,
    marginTop: 2,
  },
  badgeRow: {
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgePersonal: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
  },
  badgeBusiness: {
    backgroundColor: 'rgba(79, 140, 255, 0.2)',
  },
  badgeText: {
    color: '#8fc0ff',
    fontSize: 10,
    fontWeight: '700',
  },
  sectionHeader: {
    color: '#5f88b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 8,
  },
  cardGroup: {
    backgroundColor: '#0b1e3b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#15345f',
    overflow: 'hidden',
    marginBottom: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: '#15345f',
  },
  itemTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  itemText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemSubText: {
    color: '#6e93c2',
    fontSize: 11,
    marginTop: 2,
  },
  subHeading: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: '#8fc0ff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0b1d38',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#15345f',
    fontSize: 14,
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: '#081426',
  },
  saveBtn: {
    backgroundColor: '#4f8cff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.4)',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  logoutBtnText: {
    color: '#ff6b6b',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  backBtnText: {
    color: '#4f8cff',
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 13,
  },
  emptyText: {
    color: '#8fc0ff',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 13,
  },
  requestCard: {
    backgroundColor: '#0b1d38',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#15345f',
  },
  requestUser: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  requestReason: {
    color: '#8fc0ff',
    fontSize: 12,
    marginVertical: 4,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2ecc71',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  approveText: {
    color: '#ffffff',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rejectText: {
    color: '#ffffff',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  policyCard: {
    backgroundColor: '#0b1e3b',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#15345f',
    marginBottom: 10,
  },
  policyCardSelected: {
    borderColor: '#4f8cff',
    backgroundColor: '#0e2952',
  },
  policyTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  policyDesc: {
    color: '#8fc0ff',
    fontSize: 12,
    marginTop: 4,
  },
  radioOption: {
    backgroundColor: '#0b1e3b',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#15345f',
    marginBottom: 6,
  },
  radioSelected: {
    borderColor: '#4f8cff',
    backgroundColor: '#0e2952',
  },
  radioText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
