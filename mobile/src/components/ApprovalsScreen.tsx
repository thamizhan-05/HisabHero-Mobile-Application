import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { ClipboardCheck, CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';

const ClipboardCheckIcon = ClipboardCheck as any;
const CheckCircleIcon = CheckCircle as any;
const XCircleIcon = XCircle as any;
const ClockIcon = Clock as any;
const AlertTriangleIcon = AlertTriangle as any;
const TrendingUpIcon = TrendingUp as any;
const TrendingDownIcon = TrendingDown as any;

type Props = {
  activeWorkspaceId?: string;
  workspaceRole?: string;
  currentUser?: any;
};

export function ApprovalsScreen({ activeWorkspaceId, workspaceRole, currentUser }: Props) {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReasonId, setRejectReasonId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const isEmployee = workspaceRole === 'employee';
  const isOwner = workspaceRole === 'owner';

  useEffect(() => {
    fetchApprovals();
  }, [activeWorkspaceId]);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/approvals/pending', activeWorkspaceId);
      if (res.ok) {
        const data = await res.json();
        setApprovals(Array.isArray(data) ? data : []);
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleRespond = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    setProcessingId(id);
    try {
      const res = await apiClient.post(`/approvals/${id}/respond`, { action, reason }, activeWorkspaceId);
      const d = await res.json();
      if (res.ok) {
        Alert.alert(
          action === 'approve' ? '✅ Approved' : '❌ Rejected',
          d.message || `Transaction ${action}d successfully.`
        );
        setRejectReasonId(null);
        setRejectReason('');
        fetchApprovals();
      } else {
        Alert.alert('Error', d.error || 'Failed to process approval.');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
    setProcessingId(null);
  };

  const getTypeInfo = (requestType: string) => {
    switch (requestType) {
      case 'add_income': return { label: 'Add Income', Icon: TrendingUpIcon, color: '#22c55e' };
      case 'add_expense': return { label: 'Add Expense', Icon: TrendingDownIcon, color: '#ef4444' };
      case 'delete_transaction': return { label: 'Delete Transaction', Icon: XCircleIcon, color: '#f59e0b' };
      case 'update_transaction': return { label: 'Update Transaction', Icon: ClipboardCheckIcon, color: '#60a5fa' };
      default: return { label: requestType, Icon: ClipboardCheckIcon, color: '#60a5fa' };
    }
  };

  const formatAmount = (amount: number) =>
    `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#60a5fa" size="large" />
        <Text style={styles.loadingText}>Loading approvals...</Text>
      </View>
    );
  }

  if (!activeWorkspaceId || activeWorkspaceId === 'personal') {
    return (
      <View style={styles.emptyContainer}>
        <ClipboardCheckIcon color="#1e3a5f" size={52} />
        <Text style={styles.emptyTitle}>Business Workspace Only</Text>
        <Text style={styles.emptySubtitle}>Transaction approvals are available inside Business Workspaces.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ClipboardCheckIcon color="#60a5fa" size={22} />
        <Text style={styles.headerTitle}>Transaction Approvals</Text>
        {approvals.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{approvals.length}</Text>
          </View>
        )}
      </View>

      {isEmployee && (
        <View style={styles.employeeInfo}>
          <AlertTriangleIcon color="#f59e0b" size={15} />
          <Text style={styles.employeeInfoText}>
            As an Employee, your transaction requests must be approved by Owners before they affect the ledger.
          </Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 16 }}
      >
        {approvals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CheckCircleIcon color="#1e3a5f" size={52} />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySubtitle}>
              {isOwner
                ? 'No pending transaction approvals. Requests from employees will appear here.'
                : 'No pending approvals. All your requests have been processed.'}
            </Text>
          </View>
        ) : approvals.map((item, i) => {
          const { label, Icon, color } = getTypeInfo(item.requestType);
          const showReject = rejectReasonId === (item.id || item._id);
          const isProcessing = processingId === (item.id || item._id);
          const approvedCount = (item.approvedBy || []).length;
          const requiredCount = (item.requiredApprovers || []).length;

          return (
            <View key={item.id || i} style={styles.approvalCard}>
              {/* Type badge */}
              <View style={[styles.typeBadge, { backgroundColor: `${color}18` }]}>
                <Icon color={color} size={16} />
                <Text style={[styles.typeLabel, { color }]}>{label}</Text>
              </View>

              {/* Details */}
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Amount</Text>
                <Text style={[styles.detailValue, { color }]}>
                  {formatAmount(item.payload?.amount)}
                </Text>
              </View>
              {item.payload?.description && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Description</Text>
                  <Text style={styles.detailValue}>{item.payload.description}</Text>
                </View>
              )}
              {item.payload?.category && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Category</Text>
                  <Text style={styles.detailValue}>{item.payload.category}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Submitted By</Text>
                <Text style={styles.detailValue}>{item.submittedByName || 'Member'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Submitted At</Text>
                <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
              </View>

              {/* Approval progress bar */}
              {requiredCount > 1 && (
                <View style={styles.progressArea}>
                  <Text style={styles.progressLabel}>
                    Approvals: {approvedCount}/{requiredCount}
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${(approvedCount / requiredCount) * 100}%` }]}
                    />
                  </View>
                </View>
              )}

              {/* Action buttons for Owners */}
              {isOwner && (
                <>
                  {showReject ? (
                    <View style={styles.rejectArea}>
                      <TextInput
                        style={styles.rejectInput}
                        value={rejectReason}
                        onChangeText={setRejectReason}
                        placeholder="Reason for rejection (optional)..."
                        placeholderTextColor="#4a6080"
                        multiline
                      />
                      <View style={styles.rejectBtns}>
                        <TouchableOpacity
                          style={styles.cancelRejectBtn}
                          onPress={() => { setRejectReasonId(null); setRejectReason(''); }}
                        >
                          <Text style={styles.cancelRejectBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.confirmRejectBtn, isProcessing && { opacity: 0.6 }]}
                          onPress={() => handleRespond(item.id || item._id, 'reject', rejectReason)}
                          disabled={isProcessing}
                        >
                          {isProcessing
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.confirmRejectBtnText}>Confirm Reject</Text>
                          }
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn, isProcessing && { opacity: 0.6 }]}
                        onPress={() => handleRespond(item.id || item._id, 'approve')}
                        disabled={isProcessing}
                        activeOpacity={0.8}
                      >
                        {isProcessing
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <><CheckCircleIcon color="#fff" size={16} /><Text style={styles.actionBtnText}>Approve</Text></>
                        }
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() => { setRejectReasonId(item.id || item._id); setRejectReason(''); }}
                        disabled={isProcessing}
                        activeOpacity={0.8}
                      >
                        <XCircleIcon color="#fff" size={16} />
                        <Text style={styles.actionBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111f' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#06111f', gap: 16 },
  loadingText: { color: '#4a7aa0', fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: { color: '#e2f0ff', fontSize: 20, fontWeight: '700', flex: 1 },
  countBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    margin: 16,
    padding: 12,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  employeeInfoText: { color: '#ca8a04', fontSize: 13, lineHeight: 18, flex: 1 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
    gap: 14,
  },
  emptyTitle: { color: '#2a4a6a', fontSize: 18, fontWeight: '700' },
  emptySubtitle: { color: '#1e3a5f', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  approvalCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  typeLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  detailKey: { color: '#4a7aa0', fontSize: 13, fontWeight: '500' },
  detailValue: { color: '#d1e8ff', fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  progressArea: { marginTop: 14 },
  progressLabel: { color: '#4a7aa0', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 3 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  approveBtn: { backgroundColor: '#166534' },
  rejectBtn: { backgroundColor: '#7f1d1d' },
  rejectArea: { marginTop: 14 },
  rejectInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#e2f0ff',
    fontSize: 13,
    padding: 12,
    minHeight: 70,
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  rejectBtns: { flexDirection: 'row', gap: 10 },
  cancelRejectBtn: {
    flex: 1,
    paddingVertical: 11,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelRejectBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  confirmRejectBtn: {
    flex: 1,
    paddingVertical: 11,
    backgroundColor: '#7f1d1d',
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmRejectBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
