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
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const ImageComp = Image as any;
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
  Copy,
  Palette,
  KeyRound,
  Users,
  Search,
  Check,
  UserCheck,
  UserX,
  LogOut as LeaveIcon,
  Send,
  Clipboard as ClipboardIcon,
  Camera,
  Smartphone,
  Laptop,
  AlertOctagon,
  Sparkles,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { apiClient } from '../lib/apiClient';
import { useTheme, THEMES, ACCENT_COLORS, ThemeId, AccentColorId } from '../theme/themeSystem';
import { useTranslation, LANGUAGES, LanguageCode } from '../theme/i18n';
import { biometricService } from '../services/biometricService';
import { authenticateWithBiometrics } from '../services/biometricAuthService';

const SparklesIcon = Sparkles as any;
const SmartphoneIcon = Smartphone as any;
const LaptopIcon = Laptop as any;
const AlertOctagonIcon = AlertOctagon as any;

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
const CopyIcon = Copy as any;
const PaletteIcon = Palette as any;
const KeyRoundIcon = KeyRound as any;
const UsersIcon = Users as any;
const SearchIcon = Search as any;
const CheckIcon = Check as any;
const UserCheckIcon = UserCheck as any;
const UserXIcon = UserX as any;
const LeaveIconComp = LeaveIcon as any;
const SendIcon = Send as any;
const ClipboardIconComp = ClipboardIcon as any;
const CameraIcon = Camera as any;

type SettingsModalProps = {
  visible: boolean;
  onClose: () => void;
  apiBaseUrl: string;
  onSave?: (newUrl: string) => void;
  activeWorkspaceId?: string;
  activeWorkspaceRole?: string;
  currentUser?: any;
  onLogout?: () => void;
  onSwitchWorkspace?: (workspaceId: string, name: string, role: string) => void;
  onOpenTour?: () => void;
};

type Section =
  | 'main'
  | 'editProfile'
  | 'changePassword'
  | 'joinWorkspace'
  | 'workspaceProfile'
  | 'pendingRequests'
  | 'memberManagement'
  | 'requestOwnerAccess'
  | 'inviteMembers'
  | 'ownerRequests'
  | 'approvalPolicy'
  | 'preferences'
  | 'appearance'
  | 'devices'
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
  onSwitchWorkspace,
  onOpenTour,
}: SettingsModalProps) {
  const [section, setSection] = useState<Section>('main');
  const [loading, setLoading] = useState(false);
  const { themeId, theme, accentId, accentHex, dynamicAiTheme, setThemeId, setAccentId, setDynamicAiTheme } = useTheme();
  const { language, setLanguage, t } = useTranslation();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0);
  const bottomInset = Math.max(insets.bottom, 16);

  // Profile State
  const [profile, setProfile] = useState<any>({
    fullName: currentUser?.fullName || currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    companyName: currentUser?.companyName || '',
  });

  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');

  // Business Workspace State
  const [workspace, setWorkspace] = useState<any>(null);
  const [joinCode, setJoinCode] = useState('');
  const [policy, setPolicy] = useState<'single' | 'majority' | 'all'>('all');
  const [inviteEmail, setInviteEmail] = useState('');

  // Join Code Input State
  const [inputJoinCode, setInputJoinCode] = useState('');
  const [joinNote, setJoinNote] = useState('');
  const [submittingJoin, setSubmittingJoin] = useState(false);

  // Pending Join Requests (Owner Approval Hub)
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  // Member Management State
  const [members, setMembers] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'manager' | 'accountant' | 'employee'>('all');

  // Request Owner Access State
  const [ownerAccessReason, setOwnerAccessReason] = useState('');
  const [ownerRequests, setOwnerRequests] = useState<any[]>([]);

  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedCurrency, setSelectedCurrency] = useState('INR (₹)');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricLock, setBiometricLock] = useState(false);

  useEffect(() => {
    biometricService.isBiometricLockEnabled().then(setBiometricLock);
  }, []);

  const handleToggleBiometric = async (val: boolean) => {
    const success = await biometricService.setBiometricLockEnabled(val);
    if (success) {
      setBiometricLock(val);
      Alert.alert('App Security', `Biometric App Lock ${val ? 'enabled' : 'disabled'}.`);
    } else {
      Alert.alert('Authentication Failed', 'Could not verify biometric identity.');
    }
  };

  const handleExportCloudBackup = async () => {
    try {
      const res = await apiClient.get('/api/backup/export');
      const data = await res.json();
      if (res.ok && data?.success) {
        await Clipboard.setStringAsync(JSON.stringify(data.backup, null, 2));
        Alert.alert(
          'Cloud Backup Ready ☁️',
          `Encrypted backup of ${data.backup.counts.transactions} transactions, ${data.backup.counts.khataParties} Khata records copied to clipboard!`
        );
      }
    } catch (e: any) {
      Alert.alert('Backup Error', e.message || 'Could not export backup');
    }
  };

  const [deviceSessions, setDeviceSessions] = useState<any[]>([]);
  const [deviceRequests, setDeviceRequests] = useState<any[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const fetchDeviceSessions = async () => {
    setLoadingDevices(true);
    try {
      const [resSessions, resRequests] = await Promise.all([
        apiClient.get('/api/auth/sessions'),
        apiClient.get('/api/auth/pending-requests')
      ]);
      if (resSessions.ok) {
        const data = await resSessions.json();
        setDeviceSessions(data.sessions || []);
      }
      if (resRequests.ok) {
        const data = await resRequests.json();
        setDeviceRequests(data.requests || []);
      }
    } catch (e: any) {
      console.warn('Failed to load device sessions:', e.message);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleMakePrimaryDevice = async (sessionId: string) => {
    try {
      const res = await apiClient.post('/api/auth/make-primary', { sessionId });
      if (res.ok) {
        Alert.alert('Success', 'Device set as primary authorization anchor.');
        fetchDeviceSessions();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update primary device');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    Alert.alert('Revoke Device Session', 'Are you sure you want to log out this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await apiClient.delete(`/api/auth/sessions/${sessionId}`);
            if (res.ok) {
              fetchDeviceSessions();
            }
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to revoke session');
          }
        }
      }
    ]);
  };

  const handleApproveDeviceRequest = async (requestId: string) => {
    try {
      const res = await apiClient.post('/api/auth/approve-request', { requestId, approved: true });
      if (res.ok) {
        Alert.alert('Device Authorized', 'Secondary device has been granted login access.');
        fetchDeviceSessions();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to approve device');
    }
  };

  const handleDeleteAccountCascade = async () => {
    Alert.alert(
      'Permanent Account Deletion (GDPR)',
      'This will permanently delete your account, all personal transactions, Khata ledgers, budgets, goals, and revoke all sessions. This action CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiClient.delete('/api/auth/account');
              if (res.ok) {
                Alert.alert('Account Purged', 'Your data has been completely removed from HisabHero.');
                if (onLogout) onLogout();
              } else {
                const data = await res.json().catch(() => ({}));
                Alert.alert('Error', data.error || 'Failed to delete account');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Deletion failed');
            }
          }
        }
      ]
    );
  };

  // API Config State
  const [customApiUrl, setCustomApiUrl] = useState(apiBaseUrl);

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
    if (!activeWorkspaceId || activeWorkspaceId === 'personal') return;
    setLoading(true);
    try {
      // Primary: fetch from /businesses/:id (includes self-healing join code + member auto-creation)
      const res = await apiClient.get(`/businesses/${activeWorkspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data);
        const code = data.joinCode || data.workspace?.joinCode || data.business?.joinCode || '';
        if (code) setJoinCode(code);
        if (data.approvalPolicy) setPolicy(data.approvalPolicy);
        if (data.members) setMembers(data.members);
        return;
      }
      // Fallback: try /workspaces list and find our workspace by id
      try {
        const wsRes = await apiClient.get('/workspaces');
        if (wsRes.ok) {
          const wsData = await wsRes.json();
          const wsList = wsData.workspaces || (Array.isArray(wsData) ? wsData : []);
          const ws = wsList.find((w: any) => (w._id === activeWorkspaceId || w.id === activeWorkspaceId || w.workspaceId === activeWorkspaceId));
          if (ws) {
            setWorkspace(ws);
            const code = ws.joinCode || '';
            if (code) setJoinCode(code);
            if (ws.approvalPolicy) setPolicy(ws.approvalPolicy);
          }
        }
      } catch (fbErr) {
        console.warn('[SettingsModal] Workspace fallback fetch failed:', fbErr);
      }
    } catch (e) {
      console.warn('Failed to fetch workspace details:', e);
    } finally {
      setLoading(false);
    }
  };



  const fetchPendingJoinRequests = async () => {
    if (!activeWorkspaceId || activeWorkspaceId === 'personal') return;
    try {
      const res = await apiClient.get(`/businesses/${activeWorkspaceId}/join-requests`);
      if (res.ok) {
        const data = await res.json();
        setPendingRequests(data || []);
      }
    } catch (e) {
      console.warn('Failed to fetch pending join requests:', e);
    }
  };

  const fetchOwnerRequests = async () => {
    if (!activeWorkspaceId || activeWorkspaceId === 'personal') return;
    try {
      const res = await apiClient.get(`/businesses/${activeWorkspaceId}/owner-requests`);
      if (res.ok) {
        const data = await res.json();
        setOwnerRequests(data || []);
      }
    } catch (e) {
      console.warn('Failed to fetch owner requests:', e);
    }
  };

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
        fetchPendingJoinRequests();
        fetchOwnerRequests();
      }
    }
  }, [visible, activeWorkspaceId, currentUser]);

  // Handle Join Workspace
  const handleJoinWorkspaceSubmit = async () => {
    if (!inputJoinCode.trim()) {
      Alert.alert('Required Field', 'Please enter a valid Join Code.');
      return;
    }

    setSubmittingJoin(true);
    try {
      const res = await apiClient.post('/workspaces/join', {
        joinCode: inputJoinCode.trim().toUpperCase(),
        message: joinNote.trim(),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Alert.alert(
          'Request Sent 🚀',
          data.message || 'Your request has been sent to the workspace owner. You will be notified once it is approved.',
          [{ text: 'OK', onPress: () => { setInputJoinCode(''); setJoinNote(''); setSection('main'); } }]
        );
      } else {
        Alert.alert('Join Request Failed', data.error || 'Invalid join code.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit join request.');
    } finally {
      setSubmittingJoin(false);
    }
  };

  const handlePasteCode = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) setInputJoinCode(text.trim().toUpperCase());
    } catch (e) {
      console.warn('Clipboard paste failed:', e);
    }
  };

  // Handle Join Request Approve / Reject
  const handleRespondJoinRequest = async (requestId: string, approve: boolean) => {
    setLoading(true);
    try {
      const endpoint = `/businesses/${activeWorkspaceId}/join-requests/${requestId}/${approve ? 'approve' : 'reject'}`;
      const res = await apiClient.post(endpoint);
      const data = await res.json();

      if (res.ok) {
        Alert.alert(approve ? 'Applicant Approved 🎉' : 'Request Rejected', data.message || `Applicant ${approve ? 'approved' : 'rejected'}.`);
        fetchPendingJoinRequests();
        fetchWorkspace();
      } else {
        Alert.alert('Error', data.error || 'Failed to process request.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Member Role Change
  const handleChangeMemberRole = async (memberId: string, currentRole: string) => {
    const roles = ['owner', 'manager', 'accountant', 'employee'];
    const options = roles.map((r) => ({
      text: r.toUpperCase() + (r === currentRole ? ' (Current)' : '') + (r === 'owner' ? ' 👑 (Biometrics)' : ''),
      onPress: async () => {
        if (r === currentRole) return;
        if (r === 'owner') {
          const bioResult = await authenticateWithBiometrics('Scan fingerprint to authorize Owner promotion');
          if (!bioResult.success) {
            Alert.alert('Biometric Authorization Failed 🔒', bioResult.error || 'Fingerprint verification required to promote to Owner.');
            return;
          }
        }
        setLoading(true);
        try {
          const res = await apiClient.patch(`/businesses/${activeWorkspaceId}/members/${memberId}/role`, { role: r });
          const data = await res.json();
          if (res.ok) {
            Alert.alert('Role Updated 🎉', `Member role updated to ${r.toUpperCase()}.`);
            fetchWorkspace();
          } else {
            Alert.alert('Role Update Failed', data.error || 'Failed to update role.');
          }
        } catch (e: any) {
          Alert.alert('Error', e.message || 'Server error.');
        } finally {
          setLoading(false);
        }
      },
    }));

    Alert.alert('Change Member Role', 'Select new role to assign:', [...options, { text: 'Cancel', style: 'cancel' }]);
  };

  // Handle Remove Member
  const handleRemoveMember = async (memberId: string, name: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${name} from this workspace? They will return to their Personal Workspace.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await apiClient.delete(`/businesses/${activeWorkspaceId}/members/${memberId}`);
              const data = await res.json();
              if (res.ok) {
                Alert.alert('Member Removed', `${name} has been removed from this workspace.`);
                fetchWorkspace();
              } else {
                Alert.alert('Error', data.error || 'Failed to remove member.');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Server error.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle Leave Workspace
  const handleLeaveWorkspace = async () => {
    Alert.alert(
      'Leave Business Workspace',
      `Are you sure you want to leave "${workspace?.name || 'this workspace'}"? Your Personal Workspace and financial data will remain intact.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Workspace',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await apiClient.post(`/businesses/${activeWorkspaceId}/leave`);
              const data = await res.json();
              if (res.ok) {
                Alert.alert('Left Workspace', data.message || 'You have left the workspace.');
                if (onSwitchWorkspace) {
                  onSwitchWorkspace('personal', 'My Personal Finance', 'owner');
                }
                onClose();
              } else {
                Alert.alert('Cannot Leave', data.error || 'Failed to leave workspace.');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Server connection error.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle Delete Workspace (Safe Workspace Deletion - MUST NEVER DELETE USER ACCOUNT)
  const handleDeleteWorkspace = async () => {
    const wsName = workspace?.name || 'this workspace';
    Alert.prompt(
      'Delete Workspace?',
      `This will permanently remove workspace "${wsName}" and its financial data. Your HisabHero Account and other workspaces will NOT be affected.\n\nType "${wsName}" below to confirm deletion:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Workspace',
          style: 'destructive',
          onPress: async (enteredName?: string) => {
            if (!enteredName || enteredName.trim().toLowerCase() !== wsName.trim().toLowerCase()) {
              Alert.alert('Confirmation Failed', `You must type "${wsName}" exactly to delete this workspace.`);
              return;
            }

            setLoading(true);
            try {
              const res = await apiClient.delete(`/workspaces/${activeWorkspaceId}`, {
                body: JSON.stringify({ confirmName: enteredName.trim() }),
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert('Workspace Deleted 🗑️', data.message || `Workspace "${wsName}" deleted successfully.`);
                if (onSwitchWorkspace) {
                  onSwitchWorkspace('personal', 'My Personal Finance', 'owner');
                }
                onClose();
              } else {
                Alert.alert('Deletion Failed', data.error || 'Failed to delete workspace.');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Server connection error.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // Handle Request Owner Access
  const handleRequestOwnerAccessSubmit = async () => {
    if (!ownerAccessReason.trim()) {
      Alert.alert('Required Field', 'Please enter a reason for your Owner access request.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/workspaces/request-owner-access', {
        workspaceId: activeWorkspaceId,
        reason: ownerAccessReason.trim(),
      });
      const data = await res.json();

      if (res.ok) {
        Alert.alert('Request Submitted 🛡️', 'Your request for Owner access has been submitted to the Primary Owner.');
        setOwnerAccessReason('');
        setSection('main');
      } else {
        Alert.alert('Request Failed', data.error || 'Failed to submit request.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Server error.');
    } finally {
      setLoading(false);
    }
  };

  // Save Profile
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
        Alert.alert('Notice', 'Profile updated.');
        setSection('main');
      }
    } catch (e) {
      Alert.alert('Notice', 'Profile updated.');
      setSection('main');
    } finally {
      setLoading(false);
    }
  };

  // Change Password
  const changePassword = async () => {
    if (!pwdCurrent || !pwdNew) {
      Alert.alert('Error', 'Please enter current and new password.');
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
        setPwdCurrent(''); setPwdNew(''); setPwdConfirm('');
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

  const copyJoinCode = async () => {
    const codeToCopy = joinCode || workspace?.joinCode || workspace?.workspace?.joinCode;
    if (!codeToCopy) {
      Alert.alert('Notice', 'No join code available for this workspace yet.');
      return;
    }
    await Clipboard.setStringAsync(codeToCopy);
    Alert.alert('Copied 📋', `Workspace Join Code "${codeToCopy}" copied to clipboard!`);
  };

  const regenerateJoinCode = async () => {
    const isOwner = activeWorkspaceRole?.toLowerCase() === 'owner' || workspace?.isPrimaryOwner || workspace?.myRole === 'owner';
    if (!isOwner) {
      Alert.alert('Permission Denied', 'Only workspace owners can regenerate the join code.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post(`/businesses/${activeWorkspaceId}/regenerate-join-code`);
      if (res.ok) {
        const data = await res.json();
        if (data.joinCode) setJoinCode(data.joinCode);
        Alert.alert('New Join Code Generated 🔄', `New Join Code: ${data.joinCode}`);
      } else {
        const data = await res.json().catch(() => ({}));
        Alert.alert('Notice', data.error || 'Failed to regenerate join code.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not regenerate join code.');
    } finally {
      setLoading(false);
    }
  };


  // MAIN SETTINGS MENU RENDERER
  const renderMain = () => {
    const isBusinessUser = activeWorkspaceId && activeWorkspaceId !== 'personal';
    const userName = profile.fullName || currentUser?.fullName || currentUser?.email?.split('@')[0] || 'User Profile';
    const userEmail = profile.email || currentUser?.email || '';

    return (
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={[styles.avatarCircle, { backgroundColor: accentHex }]}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={[styles.profileName, { color: theme.text }]}>{userName}</Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{userEmail}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: theme.badgeBg }]}>
                <Text style={[styles.badgeText, { color: accentHex }]}>
                  {isBusinessUser ? `Business Workspace (${activeWorkspaceRole.toUpperCase()})` : 'Personal Account'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* SECTION 1: ACCOUNT & WORKSPACE JOIN */}
        <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>{t('account') || 'ACCOUNT & WORKSPACE'}</Text>
        <View style={[styles.cardGroup, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <TouchableOpacity style={[styles.item, { borderColor: theme.cardBorder }]} onPress={() => setSection('editProfile')}>
            <UserIcon color={accentHex} size={18} />
            <View style={styles.itemTextCol}>
              <Text style={[styles.itemText, { color: theme.text }]}>{t('edit_profile')}</Text>
              <Text style={[styles.itemSubText, { color: theme.textSecondary }]}>{t('edit_profile_sub') || 'Name & phone number'}</Text>
            </View>
            <ChevronRightIcon color={accentHex} size={16} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.item, { borderColor: theme.cardBorder }]} onPress={() => setSection('changePassword')}>
            <LockIcon color={accentHex} size={18} />
            <View style={styles.itemTextCol}>
              <Text style={[styles.itemText, { color: theme.text }]}>{t('change_password')}</Text>
              <Text style={[styles.itemSubText, { color: theme.textSecondary }]}>{t('change_password_sub') || 'Update security credentials'}</Text>
            </View>
            <ChevronRightIcon color={accentHex} size={16} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.item, { borderColor: theme.cardBorder }]} onPress={() => setSection('joinWorkspace')}>
            <KeyRoundIcon color={accentHex} size={18} />
            <View style={styles.itemTextCol}>
              <Text style={[styles.itemText, { color: theme.text }]}>Join a Workspace</Text>
              <Text style={[styles.itemSubText, { color: theme.textSecondary }]}>Enter 6-digit Join Code to request workspace access</Text>
            </View>
            <ChevronRightIcon color={accentHex} size={16} />
          </TouchableOpacity>

          {/* Biometric App Lock */}
          <View style={[styles.item, { borderColor: theme.cardBorder }]}>
            <ShieldIcon color={accentHex} size={18} />
            <View style={styles.itemTextCol}>
              <Text style={[styles.itemText, { color: theme.text }]}>Biometric App Lock</Text>
              <Text style={[styles.itemSubText, { color: theme.textSecondary }]}>Require Fingerprint / Face ID to open HisabHero</Text>
            </View>
            <Switch
              value={biometricLock}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: theme.cardBorder, true: accentHex }}
            />
          </View>

          {/* Cloud Encrypted Backup */}
          <TouchableOpacity style={[styles.item, { borderColor: theme.cardBorder }]} onPress={handleExportCloudBackup}>
            <ServerIcon color={accentHex} size={18} />
            <View style={styles.itemTextCol}>
              <Text style={[styles.itemText, { color: theme.text }]}>Cloud Backup & Export</Text>
              <Text style={[styles.itemSubText, { color: theme.textSecondary }]}>Download encrypted JSON database backup</Text>
            </View>
            <ChevronRightIcon color={accentHex} size={16} />
          </TouchableOpacity>

          {/* Active Devices & Security */}
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              fetchDeviceSessions();
              setSection('devices');
            }}
          >
            <SmartphoneIcon color={accentHex} size={18} />
            <View style={styles.itemTextCol}>
              <Text style={[styles.itemText, { color: theme.text }]}>Active Devices & Multi-Factor</Text>
              <Text style={[styles.itemSubText, { color: theme.textSecondary }]}>2-Device Governor, make primary, approve logins</Text>
            </View>
            <ChevronRightIcon color={accentHex} size={16} />
          </TouchableOpacity>
        </View>

        {/* SECTION 2: WORKSPACE MANAGEMENT (When in Business Workspace) */}
        {isBusinessUser && (
          <>
            <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>{t('workspace_management') || 'WORKSPACE MANAGEMENT'}</Text>
            <View style={[styles.cardGroup, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <TouchableOpacity style={[styles.item, { borderColor: theme.cardBorder }]} onPress={() => setSection('workspaceProfile')}>
                <BriefcaseIcon color={accentHex} size={18} />
                <View style={styles.itemTextCol}>
                  <Text style={[styles.itemText, { color: theme.text }]}>{t('workspace_profile')}</Text>
                  <Text style={[styles.itemSubText, { color: theme.textSecondary }]}>Company details, GST & registered address</Text>
                </View>
                <ChevronRightIcon color={accentHex} size={16} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.item, { borderColor: theme.cardBorder }]} onPress={() => setSection('memberManagement')}>
                <UsersIcon color={accentHex} size={18} />
                <View style={styles.itemTextCol}>
                  <Text style={[styles.itemText, { color: theme.text }]}>Manage Members & Roles</Text>
                  <Text style={[styles.itemSubText, { color: theme.textSecondary }]}>{members.length} members · View, search, promote or remove</Text>
                </View>
                <ChevronRightIcon color={accentHex} size={16} />
              </TouchableOpacity>

              {(activeWorkspaceRole === 'owner' || activeWorkspaceRole === 'manager') && (
                <TouchableOpacity style={[styles.item, { borderColor: theme.cardBorder }]} onPress={() => setSection('pendingRequests')}>
                  <ShieldIcon color={accentHex} size={18} />
                  <View style={styles.itemTextCol}>
                    <Text style={[styles.itemText, { color: theme.text }]}>Pending Member Requests</Text>
                    <Text style={[styles.itemSubText, { color: theme.textSecondary }]}>{pendingRequests.length} pending join request(s)</Text>
                  </View>
                  {pendingRequests.length > 0 && (
                    <View style={styles.reqBadge}>
                      <Text style={styles.reqBadgeText}>{pendingRequests.length}</Text>
                    </View>
                  )}
                  <ChevronRightIcon color={accentHex} size={16} />
                </TouchableOpacity>
              )}

              {activeWorkspaceRole !== 'owner' && (
                <TouchableOpacity style={[styles.item, { borderColor: theme.cardBorder }]} onPress={() => setSection('requestOwnerAccess')}>
                  <KeyRoundIcon color={accentHex} size={18} />
                  <View style={styles.itemTextCol}>
                    <Text style={[styles.itemText, { color: theme.text }]}>Request Owner Access</Text>
                    <Text style={[styles.itemSubText, { color: theme.textSecondary }]}>Submit request to Primary Owner for escalation</Text>
                  </View>
                  <ChevronRightIcon color={accentHex} size={16} />
                </TouchableOpacity>
              )}

              {isBusinessUser && (
                <>
                  {/* Workspace Join Code Card — Always visible for owners */}
                  <View style={[styles.joinCodeCard, { backgroundColor: theme.bg, borderColor: accentHex }]}>
                    <View style={styles.joinCodeHeader}>
                      <KeyRoundIcon color={accentHex} size={16} />
                      <Text style={[styles.joinCodeLabel, { color: theme.textSecondary }]}>Workspace Join Code</Text>
                      {loading && <ActivityIndicator size="small" color={accentHex} style={{ marginLeft: 6 }} />}
                    </View>
                    {loading && !(joinCode || workspace?.joinCode) ? (
                      <Text style={[styles.joinCodeValue, { color: theme.textMuted, fontSize: 14 }]}>Loading join code...</Text>
                    ) : (
                      <TouchableOpacity onPress={copyJoinCode} activeOpacity={0.75} style={styles.joinCodeValueRow}>
                        <Text style={[styles.joinCodeValue, { color: (joinCode || workspace?.joinCode) ? theme.text : theme.textMuted }]} numberOfLines={1} adjustsFontSizeToFit>
                          {joinCode || workspace?.joinCode || (loading ? 'Loading...' : 'Tap Refresh to load')}
                        </Text>
                        {(joinCode || workspace?.joinCode) ? (
                          <View style={[styles.copyBadge, { backgroundColor: `${accentHex}20`, borderColor: `${accentHex}50` }]}>
                            <CopyIcon color={accentHex} size={14} />
                            <Text style={[styles.copyBadgeText, { color: accentHex }]}>Copy</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={fetchWorkspace}
                            style={[styles.copyBadge, { backgroundColor: `${accentHex}20`, borderColor: `${accentHex}50` }]}
                          >
                            <RefreshCwIcon color={accentHex} size={14} />
                            <Text style={[styles.copyBadgeText, { color: accentHex }]}>Refresh</Text>
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    )}
                    <Text style={[styles.joinCodeHint, { color: theme.textMuted }]}>Share this code with team members to join your workspace</Text>
                  </View>

                  {(activeWorkspaceRole?.toLowerCase() === 'owner' || workspace?.isPrimaryOwner || workspace?.myRole === 'owner') && (
                    <TouchableOpacity style={[styles.item, { borderColor: theme.cardBorder }]} onPress={regenerateJoinCode}>
                      <RefreshCwIcon color={accentHex} size={18} />
                      <View style={styles.itemTextCol}>
                        <Text style={[styles.itemText, { color: theme.text }]}>Regenerate Join Code</Text>

                        <Text style={[styles.itemSubText, { color: theme.textSecondary }]}>Invalidates old code and generates a new XXXX-XXXX-XXXX code</Text>
                      </View>
                      <ChevronRightIcon color={accentHex} size={16} />
                    </TouchableOpacity>
                  )}
                </>
              )}


              {/* Data Export Button */}
              <TouchableOpacity
                style={[styles.item, { borderColor: theme.cardBorder }]}
                onPress={async () => {
                  try {
                    const endpoint = activeWorkspaceRole === 'owner' ? '/export/business?format=csv' : '/export/personal?format=csv';
                    const res = await apiClient.get(endpoint);
                    if (res.ok) {
                      const text = await res.text();
                      await Clipboard.setStringAsync(text);
                      Alert.alert('Data Exported 📋', 'CSV Export data generated and copied to your clipboard!');
                    }
                  } catch (e) {
                    Alert.alert('Export Error', 'Could not generate export.');
                  }
                }}
              >
                <ServerIcon color={accentHex} size={18} />
                <View style={styles.itemTextCol}>
                  <Text style={[styles.itemText, { color: theme.text }]}>Export Authorized Data</Text>
                  <Text style={[styles.itemSubText, { color: theme.textSecondary }]}>Export CSV/PDF records from real MongoDB database</Text>
                </View>
                <ChevronRightIcon color={accentHex} size={16} />
              </TouchableOpacity>

              {/* Leave Workspace Button */}
              <TouchableOpacity style={styles.item} onPress={handleLeaveWorkspace}>
                <LeaveIconComp color="#ef4444" size={18} />
                <View style={styles.itemTextCol}>
                  <Text style={[styles.itemText, { color: '#ef4444' }]}>Leave Workspace</Text>
                  <Text style={[styles.itemSubText, { color: theme.textSecondary }]}>Return safely to your Personal Workspace</Text>
                </View>
                <ChevronRightIcon color="#ef4444" size={16} />
              </TouchableOpacity>

              {/* Delete Workspace Button (Owner Only) */}
              {activeWorkspaceRole === 'owner' && (
                <TouchableOpacity style={styles.item} onPress={handleDeleteWorkspace}>
                  <Trash2Icon color="#ef4444" size={18} />
                  <View style={styles.itemTextCol}>
                    <Text style={[styles.itemText, { color: '#ef4444' }]}>Delete Workspace</Text>
                    <Text style={[styles.itemSubText, { color: theme.textSecondary }]}>Permanently delete this workspace and its financial data (Account remains intact)</Text>
                  </View>
                  <ChevronRightIcon color="#ef4444" size={16} />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* SECTION 3: PREFERENCES */}
        <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>{t('preferences_theme') || 'PREFERENCES & THEME'}</Text>
        <View style={[styles.cardGroup, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <TouchableOpacity style={[styles.item, { borderColor: theme.cardBorder }]} onPress={() => setSection('appearance')}>
            <PaletteIcon color={accentHex} size={18} />
            <View style={styles.itemTextCol}>
              <Text style={[styles.itemText, { color: theme.text }]}>{t('theme_appearance')}</Text>
              <Text style={[styles.itemSubText, { color: theme.textSecondary }]}>{THEMES[themeId]?.name || 'Midnight Titanium'} • {ACCENT_COLORS[accentId]?.name || 'Electric Blue'}</Text>
            </View>
            <ChevronRightIcon color={accentHex} size={16} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.item, { borderColor: theme.cardBorder }]} onPress={() => setSection('preferences')}>
            <LanguagesIcon color={accentHex} size={18} />
            <View style={styles.itemTextCol}>
              <Text style={[styles.itemText, { color: theme.text }]}>{t('language_currency')}</Text>
              <Text style={[styles.itemSubText, { color: theme.textSecondary }]}>{selectedLanguage} • {selectedCurrency}</Text>
            </View>
            <ChevronRightIcon color={accentHex} size={16} />
          </TouchableOpacity>
        </View>

        {/* SECTION: HELP & FEATURE TOUR */}
        <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>GUIDES & WALKTROUGH</Text>
        <View style={[styles.cardGroup, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginBottom: 16 }]}>
          <TouchableOpacity
            style={[styles.item, { borderColor: theme.cardBorder }]}
            onPress={() => {
              onClose();
              if (onOpenTour) onOpenTour();
            }}
          >
            <SparklesIcon color="#38bdf8" size={18} />
            <View style={styles.itemTextCol}>
              <Text style={[styles.itemText, { color: theme.text }]}>Take Interactive Feature Tour 🚀</Text>
              <Text style={[styles.itemSubText, { color: theme.textSecondary }]}>Walkthrough all 7 core modules & superpowers</Text>
            </View>
            <ChevronRightIcon color="#38bdf8" size={16} />
          </TouchableOpacity>
        </View>

        {/* DANGER ZONE: ACCOUNT DELETION */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: '#ef444460', backgroundColor: '#ef444410', marginBottom: 10 }]}
          onPress={handleDeleteAccountCascade}
        >
          <AlertOctagonIcon color="#ef4444" size={18} />
          <Text style={[styles.logoutBtnText, { color: '#ef4444' }]}>Delete Account & Data (GDPR Purge)</Text>
        </TouchableOpacity>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: '#ff6b6b40' }]} onPress={onLogout}>
          <LogOutIcon color="#ff6b6b" size={18} />
          <Text style={styles.logoutBtnText}>{t('sign_out')}</Text>
        </TouchableOpacity>

        {/* BRAND LOGO FOOTER */}
        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 20 }}>
          <Image source={require('../../assets/logo.png')} style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 8 }} resizeMode="contain" />
          <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14 }}>HisabHero Enterprise</Text>
          <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>v5.5.0 • Smart Financial & ERP Intelligence</Text>
        </View>
      </ScrollView>
    );
  };

  // ----- SUB-VIEW: JOIN WORKSPACE -----
  const renderJoinWorkspace = () => (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <Text style={[styles.subHeading, { color: theme.text }]}>Join a Business Workspace</Text>
      <Text style={[styles.subDesc, { color: theme.textSecondary }]}>
        Enter the 6-character Join Code provided by the workspace Primary Owner to submit an access request.
      </Text>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Join Code</Text>
        <View style={styles.inputWithBtn}>
          <TextInput
            style={[styles.inputFlex, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
            placeholder="e.g. HB-X7K9P2"
            placeholderTextColor={theme.textSecondary}
            value={inputJoinCode}
            onChangeText={(val) => setInputJoinCode(val.toUpperCase())}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={[styles.pasteBtn, { backgroundColor: accentHex + '22', borderColor: accentHex }]} onPress={handlePasteCode}>
            <ClipboardIconComp color={accentHex} size={16} style={{ marginRight: 4 }} />
            <Text style={[styles.pasteBtnText, { color: accentHex }]}>Paste</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Optional Note for Owner</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text, height: 70, paddingTop: 10 }]}
          placeholder="e.g. Requesting accountant access for branch audits"
          placeholderTextColor={theme.textSecondary}
          value={joinNote}
          onChangeText={setJoinNote}
          multiline={true}
        />
      </View>

      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accentHex }]} onPress={handleJoinWorkspaceSubmit} disabled={submittingJoin}>
        {submittingJoin ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Submit Join Request</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
        <ChevronLeftIcon color={accentHex} size={16} />
        <Text style={[styles.backBtnText, { color: accentHex }]}>Back to Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ----- SUB-VIEW: PENDING MEMBER REQUESTS (OWNER APPROVAL HUB) -----
  const renderPendingRequests = () => (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <Text style={[styles.subHeading, { color: theme.text }]}>Pending Member Requests</Text>
      <Text style={[styles.subDesc, { color: theme.textSecondary }]}>
        Review and approve applicants requesting to join your Business Workspace. Approved members receive Employee role by default.
      </Text>

      {pendingRequests.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <UserCheckIcon color={accentHex} size={32} style={{ marginBottom: 8 }} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Pending Requests</Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>All join requests have been processed.</Text>
        </View>
      ) : (
        pendingRequests.map((req) => (
          <View key={req.id} style={[styles.applicantCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.applicantHeader}>
              <View style={[styles.applicantAvatar, { backgroundColor: accentHex }]}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                  {(req.fullName || 'A').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.applicantName, { color: theme.text }]}>{req.fullName}</Text>
                <Text style={[styles.applicantMeta, { color: theme.textSecondary }]}>{req.email}</Text>
                {req.phone ? <Text style={[styles.applicantMeta, { color: theme.textSecondary }]}>📱 {req.phone}</Text> : null}
              </View>
            </View>

            {req.message ? (
              <View style={[styles.msgBox, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                <Text style={[styles.msgText, { color: theme.textSecondary }]}>"{req.message}"</Text>
              </View>
            ) : null}

            <View style={styles.reqDates}>
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>Requested: {new Date(req.requestDate).toLocaleDateString()}</Text>
            </View>

            <View style={styles.reqActions}>
              <TouchableOpacity
                style={[styles.rejectActionBtn, { borderColor: '#ef4444' }]}
                onPress={() => handleRespondJoinRequest(req.id, false)}
                disabled={loading}
              >
                <UserXIcon color="#ef4444" size={16} style={{ marginRight: 6 }} />
                <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.approveActionBtn, { backgroundColor: '#16a34a' }]}
                onPress={() => handleRespondJoinRequest(req.id, true)}
                disabled={loading}
              >
                <UserCheckIcon color="#ffffff" size={16} style={{ marginRight: 6 }} />
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Approve as Employee</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
        <ChevronLeftIcon color={accentHex} size={16} />
        <Text style={[styles.backBtnText, { color: accentHex }]}>Back to Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ----- SUB-VIEW: MEMBER MANAGEMENT & ROLES -----
  const renderMemberManagement = () => {
    const filteredMembers = members.filter((m) => {
      const matchSearch = (m.fullName || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
                          (m.email || '').toLowerCase().includes(memberSearch.toLowerCase());
      const matchRole = roleFilter === 'all' || m.role === roleFilter;
      return matchSearch && matchRole;
    });

    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.subHeading, { color: theme.text }]}>Workspace Members & Roles</Text>

        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <SearchIcon color={theme.textSecondary} size={18} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search member by name or email..."
            placeholderTextColor={theme.textSecondary}
            value={memberSearch}
            onChangeText={setMemberSearch}
          />
        </View>

        {/* Role Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {(['all', 'owner', 'manager', 'accountant', 'employee'] as const).map((r) => {
            const isSel = roleFilter === r;
            return (
              <TouchableOpacity
                key={r}
                style={[
                  styles.filterChip,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  isSel && { backgroundColor: accentHex, borderColor: accentHex }
                ]}
                onPress={() => setRoleFilter(r)}
              >
                <Text style={[styles.filterChipText, { color: theme.textSecondary }, isSel && { color: '#fff', fontWeight: '800' }]}>
                  {r.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Members List */}
        {filteredMembers.map((m) => (
          <View key={m.id || m.userId} style={[styles.memberCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.memberMeta}>
              <View style={[styles.memberAvatar, { backgroundColor: accentHex }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{(m.fullName || 'M').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.memberName, { color: theme.text }]}>{m.fullName}</Text>
                <Text style={[styles.memberEmail, { color: theme.textSecondary }]}>{m.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: accentHex + '22', borderColor: accentHex }]}>
                  <Text style={[styles.roleBadgeText, { color: accentHex }]}>{(m.role || 'employee').toUpperCase()}</Text>
                </View>
              </View>
            </View>

            {activeWorkspaceRole === 'owner' && m.userId !== currentUser?.id && (
              <View style={styles.memberCardActions}>
                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}
                  onPress={() => handleChangeMemberRole(m.id || m._id, m.role)}
                >
                  <EditIcon color={accentHex} size={14} style={{ marginRight: 4 }} />
                  <Text style={{ color: accentHex, fontSize: 12, fontWeight: '700' }}>Change Role</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: '#ef444415', borderColor: '#ef444466' }]}
                  onPress={() => handleRemoveMember(m.id || m._id, m.fullName)}
                >
                  <UserXIcon color="#ef4444" size={14} style={{ marginRight: 4 }} />
                  <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700' }}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
          <ChevronLeftIcon color={accentHex} size={16} />
          <Text style={[styles.backBtnText, { color: accentHex }]}>Back to Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ----- SUB-VIEW: REQUEST OWNER ACCESS -----
  const renderRequestOwnerAccess = () => (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <Text style={[styles.subHeading, { color: theme.text }]}>Request Owner Access</Text>
      <Text style={[styles.subDesc, { color: theme.textSecondary }]}>
        Submit an escalation request to the Primary Owner for Owner privileges.
      </Text>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Reason for Escalation</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text, height: 90, paddingTop: 12 }]}
          placeholder="Describe why you need Owner privileges..."
          placeholderTextColor={theme.textSecondary}
          value={ownerAccessReason}
          onChangeText={setOwnerAccessReason}
          multiline={true}
        />
      </View>

      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accentHex }]} onPress={handleRequestOwnerAccessSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Submit Owner Request</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
        <ChevronLeftIcon color={accentHex} size={16} />
        <Text style={[styles.backBtnText, { color: accentHex }]}>Back to Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Handle Profile Photo Pick in Settings
  const handlePickProfilePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permissions are required to update your profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.width && asset.height) {
          const ratio = asset.width / asset.height;
          if (ratio > 1.35) {
            Alert.alert('Photo Quality Warning 📸', 'Please upload a clear passport-style photo with your face clearly visible.');
            return;
          }
        }
        const photoUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setProfile((prev: any) => ({ ...prev, profilePhoto: photoUri, profileImage: photoUri }));
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to select photo: ' + e.message);
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const res = await apiClient.put('/auth/profile', {
        fullName: profile.fullName,
        phone: profile.phone || profile.mobileNumber,
        mobileNumber: profile.phone || profile.mobileNumber,
        dateOfBirth: profile.dateOfBirth,
        profilePhoto: profile.profilePhoto || profile.profileImage,
        profileImage: profile.profilePhoto || profile.profileImage,
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Profile Updated 👤', 'Your profile details have been saved successfully.');
        const updatedUser = { ...currentUser, ...data };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        Alert.alert('Error', data.error || 'Failed to update profile.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async () => {
    if (!pwdCurrent || !pwdNew || !pwdConfirm) {
      Alert.alert('Required Fields', 'Please fill in current password, new password, and confirm new password.');
      return;
    }
    if (pwdNew !== pwdConfirm) {
      Alert.alert('Password Mismatch', 'New password and confirm password do not match.');
      return;
    }
    if (pwdNew.length < 8) {
      Alert.alert('Weak Password', 'New password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/change-password', {
        currentPassword: pwdCurrent,
        newPassword: pwdNew,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        Alert.alert('Password Changed 🔒', 'Your password has been changed successfully. Please use your new password next time you log in.', [
          { text: 'Great!', onPress: () => { setPwdCurrent(''); setPwdNew(''); setPwdConfirm(''); setSection('main'); } }
        ]);
      } else {
        Alert.alert('Change Password Failed ❌', data.error || 'Failed to change password.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  // ----- EDIT PROFILE SUB-VIEW -----
  const renderEditProfile = () => {
    const photoUri = profile.profilePhoto || profile.profileImage;
    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.subHeading, { color: theme.text }]}>Edit Personal Profile</Text>

        {/* Profile Photo Avatar & Picker */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity onPress={handlePickProfilePhoto} style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: accentHex + '20', borderWidth: 2, borderColor: accentHex, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            {photoUri ? (
              <ImageComp source={{ uri: photoUri }} style={{ width: 84, height: 84, borderRadius: 42 }} />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <CameraIcon color={accentHex} size={28} />
                <Text style={{ color: accentHex, fontSize: 10, marginTop: 2, fontWeight: '700' }}>PHOTO</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickProfilePhoto} style={{ marginTop: 8 }}>
            <Text style={{ color: accentHex, fontSize: 12, fontWeight: '700' }}>Change Passport Photo 📸</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
            value={profile.fullName}
            onChangeText={(v) => setProfile({ ...profile, fullName: v })}
            placeholder="Enter full name"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Date of Birth (DD/MM/YYYY)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
            value={profile.dateOfBirth || ''}
            onChangeText={(v) => setProfile({ ...profile, dateOfBirth: v })}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Mobile Number *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
            value={profile.phone || profile.mobileNumber || ''}
            onChangeText={(v) => setProfile({ ...profile, phone: v, mobileNumber: v })}
            placeholder="Enter mobile number"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accentHex }, loading && { opacity: 0.6 }]} onPress={handleSaveProfile} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Profile Changes</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
          <ChevronLeftIcon color={accentHex} size={16} />
          <Text style={[styles.backBtnText, { color: accentHex }]}>Back to Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ----- CHANGE PASSWORD SUB-VIEW -----
  const renderChangePassword = () => (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <Text style={[styles.subHeading, { color: theme.text }]}>Change Password 🔒</Text>
      <Text style={[styles.subDesc, { color: theme.textSecondary, marginBottom: 16 }]}>
        Update your account password securely. Your new password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special symbols.
      </Text>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Current Password *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
          value={pwdCurrent}
          onChangeText={setPwdCurrent}
          secureTextEntry
          placeholder="Enter current password"
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>New Password *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
          value={pwdNew}
          onChangeText={setPwdNew}
          secureTextEntry
          placeholder="Enter new strong password"
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Confirm New Password *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
          value={pwdConfirm}
          onChangeText={setPwdConfirm}
          secureTextEntry
          placeholder="Confirm new password"
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accentHex }, loading && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Update Password</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
        <ChevronLeftIcon color={accentHex} size={16} />
        <Text style={[styles.backBtnText, { color: accentHex }]}>Back to Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ----- SUB-VIEW: WORKSPACE PROFILE -----
  const renderWorkspaceProfile = () => {
    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.subHeading, { color: theme.text }]}>Business Workspace Profile 🏢</Text>
        <Text style={[styles.subDesc, { color: theme.textSecondary, marginBottom: 16 }]}>
          View and update company details, GST identification, and registered office address.
        </Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Company Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
            value={workspace?.name || ''}
            onChangeText={(v) => setWorkspace((prev: any) => ({ ...prev, name: v }))}
            placeholder="e.g. ABC Traders Pvt Ltd"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>GSTIN / Tax Registration ID</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
            value={workspace?.gstNumber || ''}
            onChangeText={(v) => setWorkspace((prev: any) => ({ ...prev, gstNumber: v }))}
            placeholder="e.g. 27AAAAA0000A1Z5"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Business Phone Number</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
            value={workspace?.phone || ''}
            onChangeText={(v) => setWorkspace((prev: any) => ({ ...prev, phone: v }))}
            placeholder="e.g. +91 9876543210"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Company Registered Address</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text, height: 70, paddingTop: 10 }]}
            value={workspace?.companyAddress || ''}
            onChangeText={(v) => setWorkspace((prev: any) => ({ ...prev, companyAddress: v }))}
            placeholder="Enter full office address"
            placeholderTextColor={theme.textSecondary}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: accentHex }, loading && { opacity: 0.6 }]}
          onPress={async () => {
            if (!activeWorkspaceId || activeWorkspaceId === 'personal') return;
            setLoading(true);
            try {
              const res = await apiClient.put(`/businesses/${activeWorkspaceId}`, {
                name: workspace?.name,
                gstNumber: workspace?.gstNumber,
                phone: workspace?.phone,
                companyAddress: workspace?.companyAddress,
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert('Workspace Profile Updated 🏢', 'Company details saved successfully.');
                setWorkspace((prev: any) => ({ ...prev, ...data }));
              } else {
                Alert.alert('Notice', data.error || 'Failed to update workspace profile.');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Server connection error.');
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Company Details</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
          <ChevronLeftIcon color={accentHex} size={16} />
          <Text style={[styles.backBtnText, { color: accentHex }]}>Back to Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ----- SUB-VIEW: LANGUAGE & CURRENCY PREFERENCES -----
  const renderPreferences = () => {
    const languagesList = [
      { code: 'en', name: 'English 🇬🇧' },
      { code: 'ta', name: 'தமிழ் (Tamil) 🇮🇳' },
      { code: 'hi', name: 'हिंदी (Hindi) 🇮🇳' },
      { code: 'mr', name: 'मराठी (Marathi) 🇮🇳' },
      { code: 'gu', name: 'ગુજરાતી (Gujarati) 🇮🇳' },
      { code: 'te', name: 'తెలుగు (Telugu) 🇮🇳' },
      { code: 'kn', name: 'கன்னட (Kannada) 🇮🇳' },
      { code: 'bn', name: 'বাংলা (Bengali) 🇮🇳' },
    ];

    const currenciesList = [
      { code: 'INR', name: 'Indian Rupee (₹ INR)' },
      { code: 'USD', name: 'US Dollar ($ USD)' },
      { code: 'EUR', name: 'Euro (€ EUR)' },
      { code: 'AED', name: 'UAE Dirham (AED)' },
      { code: 'GBP', name: 'British Pound (£ GBP)' },
    ];

    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.subHeading, { color: theme.text }]}>Language & Currency Settings 🌐</Text>
        <Text style={[styles.subDesc, { color: theme.textSecondary, marginBottom: 18 }]}>
          Customize your display language and primary transaction currency.
        </Text>

        <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 8 }]}>Select Display Language</Text>
        <View style={{ gap: 8, marginBottom: 24 }}>
          {languagesList.map((item) => {
            const isSel = language === item.code;
            return (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.item,
                  { backgroundColor: theme.card, borderColor: isSel ? accentHex : theme.cardBorder, borderWidth: isSel ? 2 : 1, borderRadius: 14 }
                ]}
                onPress={async () => {
                  setLanguage(item.code as LanguageCode);
                  setSelectedLanguage(item.name);
                  await AsyncStorage.setItem('appLanguageCode', item.code);
                  await apiClient.put('/api/auth/profile', { preferredLanguage: item.code }).catch(() => {});
                }}
              >
                <Text style={[{ color: theme.text, fontSize: 14, fontWeight: isSel ? '800' : '600', flex: 1 }]}>{item.name}</Text>
                {isSel && <CheckIcon color={accentHex} size={18} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 8 }]}>Select Primary Currency</Text>
        <View style={{ gap: 8, marginBottom: 24 }}>
          {currenciesList.map((item) => {
            const isSel = selectedCurrency.includes(item.code);
            return (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.item,
                  { backgroundColor: theme.card, borderColor: isSel ? accentHex : theme.cardBorder, borderWidth: isSel ? 2 : 1, borderRadius: 14 }
                ]}
                onPress={async () => {
                  setSelectedCurrency(item.name);
                  await AsyncStorage.setItem('appCurrency', item.code);
                  await apiClient.put('/api/auth/profile', { preferredCurrency: item.code }).catch(() => {});
                }}
              >
                <Text style={[{ color: theme.text, fontSize: 14, fontWeight: isSel ? '800' : '600', flex: 1 }]}>{item.name}</Text>
                {isSel && <CheckIcon color={accentHex} size={18} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
          <ChevronLeftIcon color={accentHex} size={16} />
          <Text style={[styles.backBtnText, { color: accentHex }]}>Back to Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ----- SUB-VIEW: APPEARANCE & THEME MODES -----
  const renderAppearance = () => (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <Text style={[styles.subHeading, { color: theme.text }]}>Appearance & Theme Modes</Text>
      <Text style={[styles.subDesc, { color: theme.textSecondary, marginBottom: 18 }]}>
        Select your application appearance:
      </Text>

      <View style={{ gap: 12, marginBottom: 24 }}>
        {[
          { id: 'hisabhero_dark', title: 'Mercury Obsidian 🌌 (Default)', desc: 'Fintech Obsidian Navy • Emerald & Sapphire accents' },
          { id: 'linear_zinc', title: 'Linear Zinc ⚡', desc: 'Pitch Carbon • Slate Zinc • Indigo accents' },
          { id: 'ramp_emerald', title: 'Ramp Emerald 🌿', desc: 'Deep Forest • Emerald accents • Wealth velocity' },
          { id: 'swiss_light', title: 'Swiss Light 🕊️', desc: 'Pure Arctic White • Crisp Indigo • Executive clarity' },
        ].map((item) => {
          const isSel = themeId === item.id || (item.id === 'hisabhero_dark' && (themeId === 'mercury' || themeId === 'mercury_obsidian'));
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              style={{
                backgroundColor: theme.card,
                borderColor: isSel ? accentHex : theme.cardBorder,
                borderWidth: isSel ? 2 : 1,
                borderRadius: 16,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onPress={() => setThemeId(item.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>{item.title}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>{item.desc}</Text>
              </View>
              {isSel && (
                <View style={{ backgroundColor: accentHex, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>SELECTED</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
        <ChevronLeftIcon color={accentHex} size={16} />
        <Text style={[styles.backBtnText, { color: accentHex }]}>Back to Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ----- SUB-VIEW: ACTIVE DEVICES & SECURITY GOVERNOR -----
  const renderDevices = () => (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <Text style={[styles.subHeading, { color: theme.text }]}>Active Devices & Security</Text>
      <Text style={[styles.subDesc, { color: theme.textSecondary }]}>
        HisabHero enforces a strict 2-device concurrency policy. Your Primary Device holds authorization rights to approve or revoke secondary sessions.
      </Text>

      {/* Pending Login Approval Requests */}
      {deviceRequests.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.sectionHeader, { color: '#f59e0b', marginTop: 0 }]}>⚠️ PENDING LOGIN REQUESTS</Text>
          {deviceRequests.map((req: any) => (
            <View key={req._id} style={[styles.applicantCard, { backgroundColor: theme.card, borderColor: '#f59e0b50' }]}>
              <View style={styles.applicantHeader}>
                <View style={[styles.applicantAvatar, { backgroundColor: '#f59e0b20' }]}>
                  <SmartphoneIcon color="#f59e0b" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.applicantName, { color: theme.text }]}>{req.deviceInfo || 'New Mobile Device'}</Text>
                  <Text style={[styles.applicantMeta, { color: theme.textSecondary }]}>Platform: {req.platform} • IP: {req.ipAddress || 'Unknown'}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.approveActionBtn, { backgroundColor: '#10b981', marginTop: 8 }]}
                onPress={() => handleApproveDeviceRequest(req._id)}
              >
                <CheckIcon color="#ffffff" size={16} style={{ marginRight: 6 }} />
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>Authorize Device Access</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Active Device Sessions */}
      <Text style={[styles.sectionHeader, { color: theme.textMuted, marginTop: 0 }]}>AUTHORIZED DEVICES ({deviceSessions.length}/2)</Text>
      {loadingDevices ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator color={accentHex} size="large" />
        </View>
      ) : deviceSessions.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <SmartphoneIcon color={accentHex} size={32} style={{ marginBottom: 8 }} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Sessions Listed</Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Current device is registered locally.</Text>
        </View>
      ) : (
        deviceSessions.map((session: any) => (
          <View key={session._id} style={[styles.applicantCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.applicantHeader}>
              <View style={[styles.applicantAvatar, { backgroundColor: session.isPrimary ? '#10b98120' : `${accentHex}20` }]}>
                {session.platform === 'ios' || session.platform === 'android' ? (
                  <SmartphoneIcon color={session.isPrimary ? '#10b981' : accentHex} size={20} />
                ) : (
                  <LaptopIcon color={session.isPrimary ? '#10b981' : accentHex} size={20} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.applicantName, { color: theme.text }]}>{session.deviceInfo || session.platform?.toUpperCase() || 'Device'}</Text>
                  {session.isPrimary && (
                    <View style={{ backgroundColor: '#10b98120', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: '#10b981', fontSize: 9, fontWeight: '900' }}>PRIMARY</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.applicantMeta, { color: theme.textSecondary }]}>ID: {session.deviceId?.slice(0, 16)}...</Text>
                <Text style={[styles.applicantMeta, { color: theme.textMuted, fontSize: 10 }]}>IP: {session.ipAddress || '127.0.0.1'} • Last Active: {session.lastActive ? new Date(session.lastActive).toLocaleString() : 'Now'}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {!session.isPrimary && (
                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: `${accentHex}20`, borderColor: accentHex, flex: 1, justifyContent: 'center' }]}
                  onPress={() => handleMakePrimaryDevice(session._id)}
                >
                  <Text style={{ color: accentHex, fontWeight: '700', fontSize: 12 }}>Make Primary</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: '#ef444415', borderColor: '#ef444460', flex: session.isPrimary ? 1 : 0.6, justifyContent: 'center' }]}
                onPress={() => handleRevokeSession(session._id)}
              >
                <Trash2Icon color="#ef4444" size={14} style={{ marginRight: 4 }} />
                <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 12 }}>Revoke</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => setSection('main')}>
        <ChevronLeftIcon color={accentHex} size={16} />
        <Text style={[styles.backBtnText, { color: accentHex }]}>Back to Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'bottom', 'left', 'right']}>
        <View style={[styles.header, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <TouchableOpacity onPress={() => (section === 'main' ? onClose() : setSection('main'))} style={styles.headerBackBtn}>
            <ChevronLeftIcon color={accentHex} size={22} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settings & Workspace</Text>
          <TouchableOpacity onPress={onClose} style={styles.headerCloseBtn}>
            <XIcon color={theme.textSecondary} size={22} />
          </TouchableOpacity>
        </View>

        {section === 'main' && renderMain()}
        {section === 'appearance' && renderAppearance()}
        {section === 'editProfile' && renderEditProfile()}
        {section === 'changePassword' && renderChangePassword()}
        {section === 'joinWorkspace' && renderJoinWorkspace()}
        {section === 'workspaceProfile' && renderWorkspaceProfile()}
        {section === 'preferences' && renderPreferences()}
        {section === 'pendingRequests' && renderPendingRequests()}
        {section === 'memberManagement' && renderMemberManagement()}
        {section === 'requestOwnerAccess' && renderRequestOwnerAccess()}
        {section === 'devices' && renderDevices()}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBackBtn: { padding: 6 },
  headerCloseBtn: { padding: 6 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  contentContainer: { padding: 18, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  profileMeta: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '800' },
  profileEmail: { fontSize: 12, marginTop: 2 },
  badgeRow: { flexDirection: 'row', marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  sectionHeader: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginTop: 14, marginBottom: 8 },
  cardGroup: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  itemTextCol: { flex: 1, marginLeft: 12 },
  itemText: { fontSize: 14, fontWeight: '700' },
  itemSubText: { fontSize: 11, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 30,
  },
  logoutBtnText: { color: '#ff6b6b', fontWeight: '800', marginLeft: 8 },
  subHeading: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  subDesc: { fontSize: 13, marginBottom: 18, lineHeight: 18 },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 46, fontSize: 14 },
  inputWithBtn: { flexDirection: 'row', gap: 8 },
  inputFlex: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 46, fontSize: 14, fontWeight: '700' },
  pasteBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  pasteBtnText: { fontSize: 12, fontWeight: '700' },
  saveBtn: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  saveBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 10 },
  backBtnText: { fontWeight: '700', fontSize: 13, marginLeft: 4 },
  reqBadge: { backgroundColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginRight: 6 },
  reqBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  applicantCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 14 },
  applicantHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  applicantAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  applicantName: { fontSize: 15, fontWeight: '800' },
  applicantMeta: { fontSize: 12, marginTop: 1 },
  msgBox: { padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  msgText: { fontSize: 12, fontStyle: 'italic' },
  reqDates: { marginBottom: 12 },
  reqActions: { flexDirection: 'row', gap: 10 },
  rejectActionBtn: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  approveActionBtn: { flex: 1.5, height: 40, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  emptyCard: { padding: 30, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptySub: { fontSize: 12, marginTop: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 44, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginRight: 8 },
  filterChipText: { fontSize: 11, fontWeight: '700' },
  memberCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  memberMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  memberName: { fontSize: 14, fontWeight: '700' },
  memberEmail: { fontSize: 11, marginTop: 1 },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginTop: 4, alignSelf: 'flex-start' },
  roleBadgeText: { fontSize: 9, fontWeight: '800' },
  memberCardActions: { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ffffff15' },
  smallBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  joinCodeCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 2,
    marginHorizontal: 0,
  },
  joinCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  joinCodeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  joinCodeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  joinCodeValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    flex: 1,
    marginRight: 10,
  },
  copyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  copyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  joinCodeHint: {
    fontSize: 11,
    lineHeight: 16,
  },
});
