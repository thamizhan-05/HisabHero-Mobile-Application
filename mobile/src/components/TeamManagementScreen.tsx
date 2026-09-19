import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  Users,
  UserCheck,
  Shield,
  Copy,
  Share2,
  Key,
  UserPlus,
  ChevronRight,
  ShieldAlert,
  Clock,
  ChevronLeft,
} from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';
import { useTheme } from '../theme/themeSystem';
import { useTranslation } from '../theme/i18n';
import { PermissionsMatrixModal } from './PermissionsMatrixModal';
import { JoinRequestsScreen } from './JoinRequestsScreen';

const ChevronLeftIcon = ChevronLeft as any;
const UsersIcon = Users as any;
const UserCheckIcon = UserCheck as any;
const ShieldIcon = Shield as any;
const CopyIcon = Copy as any;
const Share2Icon = Share2 as any;
const KeyIcon = Key as any;
const UserPlusIcon = UserPlus as any;
const ChevronRightIcon = ChevronRight as any;
const ShieldAlertIcon = ShieldAlert as any;

type TeamManagementScreenProps = {
  activeWorkspaceId?: string;
  activeWorkspaceName?: string;
  activeWorkspaceRole?: string;
  onBack?: () => void;
};

export function TeamManagementScreen({
  activeWorkspaceId = 'personal',
  activeWorkspaceName = 'Personal Workspace',
  activeWorkspaceRole = 'owner',
  onBack,
}: TeamManagementScreenProps) {
  const { theme, accentHex } = useTheme();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState<string>('HERO-WS-SELVA1');
  const [members, setMembers] = useState<any[]>([]);
  const [permissionsModalVisible, setPermissionsModalVisible] = useState(false);
  const [joinRequestsVisible, setJoinRequestsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      // 1. Fetch current workspace details for Join Code
      const resWs = await apiClient.get('/workspaces');
      if (resWs.ok) {
        const data = await resWs.json();
        const list = data.workspaces || (Array.isArray(data) ? data : []);
        const current = list.find((w: any) => w.id === activeWorkspaceId || w._id === activeWorkspaceId) || list[0];
        if (current && (current.joinCode || current.join_code)) {
          setJoinCode(current.joinCode || current.join_code);
        }
      }

      // 2. Fetch members list
      const resMembers = await apiClient.get(`/workspaces/${activeWorkspaceId}/members`).catch(() => null);
      if (resMembers && resMembers.ok) {
        const mData = await resMembers.json();
        setMembers(mData.members || mData || []);
      } else {
        // Fallback default member view
        setMembers([
          {
            id: 'mem_1',
            fullName: 'Workspace Owner',
            email: 'owner@hisabhero.com',
            role: 'owner',
            status: 'Active',
            joinedAt: new Date().toISOString().split('T')[0],
          }
        ]);
      }
    } catch (e) {
      console.warn('Failed to load team data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [activeWorkspaceId]);

  const handleCopyJoinCode = async () => {
    await Clipboard.setStringAsync(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('Copied 📋', `Join code "${joinCode}" copied to clipboard! Share this code with team members to let them join.`);
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Join my workspace "${activeWorkspaceName}" on HisabHero with Join Code: ${joinCode}\nDownload HisabHero: https://hisabhero.com`,
      });
    } catch (e) {
      // silent
    }
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return '#f59e0b';
      case 'manager':
        return '#38bdf8';
      case 'accountant':
        return '#10b981';
      case 'employee':
        return '#a855f7';
      default:
        return '#94a3b8';
    }
  };

  if (joinRequestsVisible) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setJoinRequestsVisible(false)} style={styles.backBtn}>
            <Text style={{ color: accentHex, fontWeight: '700' }}>← Back to Team</Text>
          </TouchableOpacity>
        </View>
        <JoinRequestsScreen activeWorkspaceId={activeWorkspaceId} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, alignSelf: 'flex-start' }}
        >
          <ChevronLeftIcon color={accentHex} size={20} />
          <Text style={{ color: accentHex, fontSize: 14, fontWeight: '700', marginLeft: 4 }}>Back</Text>
        </TouchableOpacity>
      )}
      {/* Header Banner */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
            <UsersIcon color="#38bdf8" size={26} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>Team Management & Roles</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Assign roles (Owner, Manager, Accountant, Employee, Viewer) and share join codes.
            </Text>
          </View>
        </View>

        {/* Workspace Join Code Box */}
        <View style={[styles.codeBox, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
          <View style={styles.codeLabelRow}>
            <KeyIcon color={accentHex} size={14} />
            <Text style={[styles.codeLabel, { color: theme.textSecondary }]}>WORKSPACE JOIN CODE</Text>
          </View>
          <Text style={[styles.codeValue, { color: accentHex }]}>{joinCode}</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: accentHex }]} onPress={handleCopyJoinCode}>
              <CopyIcon color="#ffffff" size={14} />
              <Text style={styles.actionBtnText}>{copied ? 'Copied!' : 'Copy Code'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtnOutline, { borderColor: theme.cardBorder }]} onPress={handleShareCode}>
              <Share2Icon color={theme.text} size={14} />
              <Text style={[styles.actionBtnTextOutline, { color: theme.text }]}>Share Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinksRow}>
          <TouchableOpacity
            style={[styles.quickLink, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}
            onPress={() => setPermissionsModalVisible(true)}
          >
            <ShieldIcon color="#10b981" size={18} />
            <Text style={[styles.quickLinkText, { color: theme.text }]}>Role Permissions Matrix</Text>
            <ChevronRightIcon color={theme.textSecondary} size={16} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickLink, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}
            onPress={() => setJoinRequestsVisible(true)}
          >
            <UserCheckIcon color="#38bdf8" size={18} />
            <Text style={[styles.quickLinkText, { color: theme.text }]}>Pending Join Requests</Text>
            <ChevronRightIcon color={theme.textSecondary} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Members List */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Active Team Roster</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Users currently authorized to access financial ledgers in this workspace.
        </Text>

        {loading ? (
          <ActivityIndicator color={accentHex} size="large" style={{ marginVertical: 24 }} />
        ) : members.length === 0 ? (
          <View style={styles.emptyBox}>
            <UsersIcon color={theme.textSecondary} size={32} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No team members enrolled yet.</Text>
          </View>
        ) : (
          members.map((m, idx) => {
            const roleColor = getRoleColor(m.role);
            return (
              <View key={m.id || m._id || idx} style={[styles.memberRow, { borderBottomColor: theme.cardBorder }]}>
                <View style={[styles.avatarBox, { backgroundColor: roleColor + '25' }]}>
                  <Text style={[styles.avatarText, { color: roleColor }]}>
                    {(m.fullName || m.name || m.email || 'U')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.memberName, { color: theme.text }]}>{m.fullName || m.name || 'Member'}</Text>
                  <Text style={[styles.memberEmail, { color: theme.textSecondary }]} numberOfLines={1}>{m.email || 'N/A'}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: roleColor + '20', borderColor: roleColor + '50' }]}>
                  <Text style={[styles.roleText, { color: roleColor }]}>{(m.role || 'Member').toUpperCase()}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      <PermissionsMatrixModal visible={permissionsModalVisible} onClose={() => setPermissionsModalVisible(false)} activeWorkspaceId={activeWorkspaceId} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  backBtn: {
    padding: 8,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  codeBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  codeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  codeValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    marginVertical: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnTextOutline: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickLinksRow: {
    gap: 8,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  quickLinkText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 11,
    marginBottom: 14,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
  },
  memberName: {
    fontSize: 13,
    fontWeight: '700',
  },
  memberEmail: {
    fontSize: 11,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
  },
});
