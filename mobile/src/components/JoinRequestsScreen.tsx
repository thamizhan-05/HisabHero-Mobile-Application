import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Mail,
  Phone,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';
import { useTheme } from '../theme/themeSystem';

const UserCheckIcon = UserCheck as any;
const UserXIcon = UserX as any;
const ClockIcon = Clock as any;
const CheckCircleIcon = CheckCircle as any;
const XCircleIcon = XCircle as any;
const UsersIcon = Users as any;
const MailIcon = Mail as any;
const PhoneIcon = Phone as any;
const MessageSquareIcon = MessageSquare as any;
const RefreshCwIcon = RefreshCw as any;
const ShieldCheckIcon = ShieldCheck as any;

const ROLES = [
  { value: 'admin', label: 'Admin', desc: 'Manage members & approve transactions', color: '#a855f7' },
  { value: 'accountant', label: 'Accountant', desc: 'Manage financials, invoices, payroll', color: '#3b82f6' },
  { value: 'employee', label: 'Employee', desc: 'Submit own expenses (requires approval)', color: '#22c55e' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access to all data', color: '#94a3b8' },
];

type Props = {
  activeWorkspaceId?: string;
  workspaceRole?: string;
};

export function JoinRequestsScreen({ activeWorkspaceId, workspaceRole }: Props) {
  const { theme, accentHex } = useTheme();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending');
  const [approveModalId, setApproveModalId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('employee');
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const isOwnerOrAdmin = ['owner', 'admin'].includes(workspaceRole || '');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/join-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('[JoinRequests] fetch error:', e);
    }
    setLoading(false);
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (activeWorkspaceId && activeWorkspaceId !== 'personal') {
      fetchRequests();
    }
  }, [activeWorkspaceId, fetchRequests]);

  const handleApprove = async () => {
    if (!approveModalId) return;
    setProcessingId(approveModalId);
    setApproveModalId(null);
    try {
      const res = await apiClient.post(`/join-requests/${approveModalId}/respond`, { action: 'approve', role: selectedRole });
      const d = await res.json();
      if (res.ok && d.success) {
        Alert.alert('Approved!', d.message || `Member added as ${selectedRole.toUpperCase()}.`);
        fetchRequests();
      } else {
        Alert.alert('Error', d.error || 'Failed to approve.');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
    setProcessingId(null);
  };

  const handleReject = async () => {
    if (!rejectModalId) return;
    setProcessingId(rejectModalId);
    setRejectModalId(null);
    try {
      const res = await apiClient.post(`/join-requests/${rejectModalId}/respond`, { action: 'reject', reason: rejectReason.trim() });
      const d = await res.json();
      if (res.ok && d.success) {
        Alert.alert('Rejected', d.message || 'Request declined.');
        setRejectReason('');
        fetchRequests();
      } else {
        Alert.alert('Error', d.error || 'Failed to reject.');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
    setProcessingId(null);
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const reviewedRequests = requests.filter(r => r.status !== 'pending');

  if (!activeWorkspaceId || activeWorkspaceId === 'personal') {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.emptyContainer}>
          <UsersIcon color="#1e3a5f" size={52} />
          <Text style={[styles.emptyTitle, { color: theme.textMuted }]}>Business Workspace Only</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>Switch to a Business Workspace to manage join requests.</Text>
        </View>
      </View>
    );
  }

  if (!isOwnerOrAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.emptyContainer}>
          <ShieldCheckIcon color="#1e3a5f" size={52} />
          <Text style={[styles.emptyTitle, { color: theme.textMuted }]}>Access Restricted</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>Only Owners and Admins can manage join requests.</Text>
        </View>
      </View>
    );
  }

  const displayList = activeTab === 'pending' ? pendingRequests : reviewedRequests;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <View style={styles.headerLeft}>
          <UsersIcon color={accentHex} size={22} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Join Requests</Text>
          {pendingRequests.length > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{pendingRequests.length}</Text></View>
          )}
        </View>
        <TouchableOpacity onPress={fetchRequests} style={styles.refreshBtn}>
          <RefreshCwIcon color={accentHex} size={18} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        {(['pending', 'reviewed'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { backgroundColor: accentHex + '22', borderColor: accentHex }]}
            onPress={() => setActiveTab(tab)}
          >
            {tab === 'pending'
              ? <ClockIcon color={activeTab === tab ? accentHex : theme.textMuted} size={13} />
              : <CheckCircleIcon color={activeTab === tab ? accentHex : theme.textMuted} size={13} />}
            <Text style={[styles.tabText, { color: activeTab === tab ? accentHex : theme.textMuted }]}>
              {tab === 'pending' ? `Pending (${pendingRequests.length})` : `Reviewed (${reviewedRequests.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={accentHex} size="large" />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading requests...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {displayList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <CheckCircleIcon color="#1e3a5f" size={48} />
              <Text style={[styles.emptyTitle, { color: theme.textMuted }]}>
                {activeTab === 'pending' ? 'No Pending Requests' : 'No Reviewed Requests'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                {activeTab === 'pending'
                  ? 'When employees submit join requests using your workspace join code, they will appear here.'
                  : 'Approved and rejected requests will appear here.'}
              </Text>
            </View>
          ) : displayList.map((req) => {
            const isProcessing = processingId === req.id;
            const statusColor = req.status === 'approved' ? '#22c55e' : req.status === 'rejected' ? '#ef4444' : '#f59e0b';
            return (
              <View key={req.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={styles.cardHeader}>
                  {req.profileImage
                    ? <Image source={{ uri: req.profileImage }} style={styles.avatar} />
                    : <View style={[styles.avatarPlaceholder, { backgroundColor: accentHex + '22' }]}>
                        <Text style={[styles.avatarInitial, { color: accentHex }]}>{(req.applicantName || 'U')[0].toUpperCase()}</Text>
                      </View>
                  }
                  <View style={styles.cardHeaderInfo}>
                    <Text style={[styles.applicantName, { color: theme.text }]}>{req.applicantName || 'Unknown'}</Text>
                    {req.status !== 'pending' && (
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '44' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{req.status.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                </View>
                {req.applicantEmail ? (
                  <View style={styles.detailRow}>
                    <MailIcon color={theme.textMuted} size={13} />
                    <Text style={[styles.detailText, { color: theme.textSecondary }]}>{req.applicantEmail}</Text>
                  </View>
                ) : null}
                {req.applicantPhone ? (
                  <View style={styles.detailRow}>
                    <PhoneIcon color={theme.textMuted} size={13} />
                    <Text style={[styles.detailText, { color: theme.textSecondary }]}>{req.applicantPhone}</Text>
                  </View>
                ) : null}
                {req.message ? (
                  <View style={[styles.messageBox, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                    <MessageSquareIcon color={theme.textMuted} size={12} style={{ marginRight: 6 }} />
                    <Text style={[styles.messageText, { color: theme.textSecondary }]}>{req.message}</Text>
                  </View>
                ) : null}
                <Text style={[styles.dateText, { color: theme.textMuted }]}>Submitted: {formatDate(req.createdAt)}</Text>
                {req.respondedAt && <Text style={[styles.dateText, { color: theme.textMuted }]}>Reviewed: {formatDate(req.respondedAt)}</Text>}

                {req.status === 'pending' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.approveBtn, isProcessing && { opacity: 0.5 }]}
                      onPress={() => { setApproveModalId(req.id); setSelectedRole('employee'); }}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <ActivityIndicator color="#fff" size="small" /> : <><UserCheckIcon color="#fff" size={15} /><Text style={styles.actionBtnText}>Approve</Text></>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rejectBtn, isProcessing && { opacity: 0.5 }]}
                      onPress={() => { setRejectModalId(req.id); setRejectReason(''); }}
                      disabled={isProcessing}
                    >
                      <UserXIcon color="#fff" size={15} /><Text style={styles.actionBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Approve Modal */}
      <Modal visible={!!approveModalId} transparent animationType="fade" onRequestClose={() => setApproveModalId(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Approve & Assign Role</Text>
            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>Select the role for this member:</Text>
            <View style={styles.roleList}>
              {ROLES.map(r => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.roleOption, { borderColor: theme.cardBorder, backgroundColor: theme.bg }, selectedRole === r.value && { borderColor: r.color, backgroundColor: r.color + '15' }]}
                  onPress={() => setSelectedRole(r.value)}
                >
                  <View style={styles.roleRow}>
                    <View style={[styles.roleIndicator, { backgroundColor: r.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.roleLabel, { color: theme.text }, selectedRole === r.value && { color: r.color }]}>{r.label}</Text>
                      <Text style={[styles.roleDesc, { color: theme.textMuted }]}>{r.desc}</Text>
                    </View>
                    {selectedRole === r.value && <CheckCircleIcon color={r.color} size={18} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancelBtn, { backgroundColor: theme.bg }]} onPress={() => setApproveModalId(null)}>
                <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalApproveBtn]} onPress={handleApprove}>
                <UserCheckIcon color="#fff" size={16} />
                <Text style={{ color: '#fff', fontWeight: '800', marginLeft: 6 }}>Approve as {ROLES.find(r => r.value === selectedRole)?.label}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal visible={!!rejectModalId} transparent animationType="fade" onRequestClose={() => setRejectModalId(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Reject Join Request</Text>
            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>Optionally provide a reason. The applicant will be notified.</Text>
            <TextInput
              style={[styles.rejectInput, { backgroundColor: theme.bg, borderColor: theme.cardBorder, color: theme.text }]}
              placeholder="Reason for rejection (optional)..."
              placeholderTextColor={theme.textMuted}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancelBtn, { backgroundColor: theme.bg }]} onPress={() => setRejectModalId(null)}>
                <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalRejectBtn} onPress={handleReject}>
                <UserXIcon color="#fff" size={16} />
                <Text style={{ color: '#fff', fontWeight: '800', marginLeft: 6 }}>Confirm Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  badge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  refreshBtn: { padding: 8 },
  tabRow: { flexDirection: 'row', margin: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderWidth: 1, borderColor: 'transparent', borderRadius: 10, margin: 3 },
  tabText: { fontSize: 12, fontWeight: '700' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 14 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 18, fontWeight: '800' },
  cardHeaderInfo: { flex: 1 },
  applicantName: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  detailText: { fontSize: 13 },
  messageBox: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 8, marginBottom: 8 },
  messageText: { fontSize: 13, flex: 1, lineHeight: 18, fontStyle: 'italic' },
  dateText: { fontSize: 11, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10, backgroundColor: '#166534' },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10, backgroundColor: '#7f1d1d' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: 20, borderWidth: 1, padding: 22 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  modalSub: { fontSize: 13, marginBottom: 16, lineHeight: 18 },
  roleList: { gap: 8, marginBottom: 20 },
  roleOption: { borderRadius: 12, borderWidth: 1, padding: 12 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  roleIndicator: { width: 10, height: 10, borderRadius: 5 },
  roleLabel: { fontSize: 14, fontWeight: '700' },
  roleDesc: { fontSize: 11, marginTop: 2 },
  rejectInput: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 80, textAlignVertical: 'top', fontSize: 13, marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalApproveBtn: { flex: 2, height: 46, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#166534' },
  modalRejectBtn: { flex: 2, height: 46, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#7f1d1d' },
});
