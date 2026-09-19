import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { Shield, Check, X } from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';
import { useTheme } from '../theme/themeSystem';
import { AppCard, BadgePill } from './uiComponents';

const ShieldIcon = Shield as any;
const CheckIcon = Check as any;
const XIcon = X as any;

type PermissionsMatrixModalProps = {
  visible: boolean;
  onClose: () => void;
  activeWorkspaceId: string;
};

const PERMISSION_KEYS = [
  { key: 'view_transactions', label: 'View Transactions' },
  { key: 'add_transactions', label: 'Add Transactions' },
  { key: 'edit_transactions', label: 'Edit Transactions' },
  { key: 'delete_transactions', label: 'Delete Transactions' },
  { key: 'create_invoices', label: 'Create Invoices' },
  { key: 'approve_invoices', label: 'Approve Invoices' },
  { key: 'manage_inventory', label: 'Manage Inventory' },
  { key: 'manage_payroll', label: 'Manage Payroll' },
  { key: 'view_reports', label: 'View Reports' },
  { key: 'export_data', label: 'Export Data' },
];

const ROLES = ['admin', 'accountant', 'employee', 'viewer'];

export function PermissionsMatrixModal({ visible, onClose, activeWorkspaceId }: PermissionsMatrixModalProps) {
  const { theme, accentHex } = useTheme();
  const [matrix, setMatrix] = useState<Record<string, string[]>>({
    admin: PERMISSION_KEYS.map((p) => p.key),
    accountant: ['view_transactions', 'add_transactions', 'create_invoices', 'view_reports', 'export_data'],
    employee: ['view_transactions', 'add_transactions'],
    viewer: ['view_transactions', 'view_reports'],
  });
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<string>('admin');

  useEffect(() => {
    if (visible && activeWorkspaceId) {
      fetchPermissions();
    }
  }, [visible, activeWorkspaceId]);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/businesses/${activeWorkspaceId}/permissions`);
      if (res.ok) {
        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          setMatrix(data);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch permissions:', e);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (role: string, permKey: string) => {
    setMatrix((prev) => {
      const current = prev[role] || [];
      const updated = current.includes(permKey) ? current.filter((k) => k !== permKey) : [...current, permKey];
      return { ...prev, [role]: updated };
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await apiClient.put(`/businesses/${activeWorkspaceId}/permissions`, {
        rolePermissions: matrix,
      });

      if (res.ok) {
        Alert.alert('Permissions Saved', 'Workspace permission matrix updated successfully.');
        onClose();
      } else {
        const errData = await res.json().catch(() => ({}));
        Alert.alert('Error', errData.error || 'Failed to update permission matrix.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Permission Matrix</Text>
            <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Configure granular role access</Text>
          </View>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accentHex }]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        {/* Role Selector Chips */}
        <View style={[styles.roleBar, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {ROLES.map((r) => {
            const isActive = activeRole === r;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.roleChip, { backgroundColor: isActive ? accentHex : theme.bg, borderColor: isActive ? accentHex : theme.cardBorder }]}
                onPress={() => setActiveRole(r)}
              >
                <Text style={[styles.roleChipText, { color: isActive ? '#fff' : theme.textSecondary }]}>{r.toUpperCase()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Permissions List */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {PERMISSION_KEYS.map((p) => {
            const isAllowed = (matrix[activeRole] || []).includes(p.key);
            return (
              <AppCard key={p.key} style={styles.permRow} onPress={() => togglePermission(activeRole, p.key)}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.permLabel, { color: theme.text }]}>{p.label}</Text>
                  <Text style={[styles.permKey, { color: theme.textMuted }]}>{p.key}</Text>
                </View>
                <View style={[styles.toggleBox, { backgroundColor: isAllowed ? '#10b981' : theme.inputBg, borderColor: isAllowed ? '#10b981' : theme.inputBorder }]}>
                  {isAllowed && <CheckIcon color="#fff" size={14} />}
                </View>
              </AppCard>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 12, marginTop: 2 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  roleBar: { flexDirection: 'row', padding: 10, gap: 8, borderBottomWidth: 1 },
  roleChip: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10, borderWidth: 1 },
  roleChipText: { fontSize: 11, fontWeight: '800' },
  scrollContent: { padding: 16, gap: 10 },
  permRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  permLabel: { fontSize: 14, fontWeight: '700' },
  permKey: { fontSize: 11, marginTop: 2 },
  toggleBox: { width: 26, height: 26, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
