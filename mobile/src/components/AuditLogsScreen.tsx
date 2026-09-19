import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { ShieldCheck, User, Clock, FileText } from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';
import { useTheme } from '../theme/themeSystem';
import { AppCard, BadgePill, SectionHeader, EmptyStateWidget } from './uiComponents';

const ShieldCheckIcon = ShieldCheck as any;
const UserIcon = User as any;
const ClockIcon = Clock as any;
const FileTextIcon = FileText as any;

type AuditLogsScreenProps = {
  activeWorkspaceId: string;
};

export function AuditLogsScreen({ activeWorkspaceId }: AuditLogsScreenProps) {
  const { theme, accentHex } = useTheme();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Failed to fetch audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeWorkspaceId]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Business Activity Audit Trail" subtitle="Immutable log of workspace actions & approvals" />

        {loading && logs.length === 0 ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={accentHex} size="large" />
          </View>
        ) : logs.length === 0 ? (
          <EmptyStateWidget
            icon={<ShieldCheckIcon color={accentHex} size={24} />}
            title="No Activity Logs"
            description="Business actions like transaction approvals, member role updates, and settings changes will appear here."
          />
        ) : (
          logs.map((log) => {
            const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : 'N/A';
            return (
              <AppCard key={log._id || log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <BadgePill label={(log.action || 'ACTION').toUpperCase()} variant="primary" />
                  <Text style={[styles.dateText, { color: theme.textMuted }]}>{dateStr}</Text>
                </View>
                <Text style={[styles.logText, { color: theme.text }]}>
                  {log.userEmail || log.userId || 'User'} performed <Text style={{ fontWeight: '800', color: accentHex }}>{log.action}</Text>
                </Text>
                {log.details && (
                  <Text style={[styles.detailsText, { color: theme.textSecondary }]}>
                    Details: {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                  </Text>
                )}
              </AppCard>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },
  logCard: { padding: 14, gap: 6 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 11, fontWeight: '600' },
  logText: { fontSize: 13, lineHeight: 18 },
  detailsText: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 },
  centerLoading: { padding: 40, alignItems: 'center' },
});
