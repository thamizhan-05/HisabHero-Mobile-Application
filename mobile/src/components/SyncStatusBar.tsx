import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CheckCircle, RefreshCw, AlertTriangle, WifiOff } from 'lucide-react-native';
import { offlineManager, PendingMutation } from '../lib/offlineManager';
import { useTheme } from '../theme/themeSystem';

const CheckCircleIcon = CheckCircle as any;
const RefreshCwIcon = RefreshCw as any;
const AlertTriangleIcon = AlertTriangle as any;
const WifiOffIcon = WifiOff as any;

export function SyncStatusBar() {
  const { theme } = useTheme();
  const [queue, setQueue] = useState<PendingMutation[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const checkQueueStatus = async () => {
    const items = await offlineManager.getQueue();
    setQueue(items);
  };

  useEffect(() => {
    checkQueueStatus();
    const interval = setInterval(checkQueueStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (queue.length === 0 || syncing) return;
    setSyncing(true);
    setStatusMessage('Syncing with MongoDB...');
    try {
      const result = await offlineManager.processQueue();
      await checkQueueStatus();
      if (result.failed === 0) {
        setStatusMessage('✓ All pending changes synced!');
      } else {
        setStatusMessage(`Synced ${result.synced}, ${result.failed} failed.`);
      }
    } catch (e) {
      setStatusMessage('Sync failed. Please check network connection.');
    } finally {
      setSyncing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  if (queue.length === 0 && !statusMessage) return null;

  const hasFailed = queue.some((q) => q.status === 'failed');

  return (
    <View style={[styles.container, { backgroundColor: hasFailed ? '#ef4444' : queue.length > 0 ? '#f59e0b' : '#10b981' }]}>
      <View style={styles.row}>
        {syncing ? (
          <ActivityIndicator color="#ffffff" size="small" style={{ marginRight: 6 }} />
        ) : hasFailed ? (
          <AlertTriangleIcon color="#ffffff" size={14} style={{ marginRight: 6 }} />
        ) : queue.length > 0 ? (
          <RefreshCwIcon color="#ffffff" size={14} style={{ marginRight: 6 }} />
        ) : (
          <CheckCircleIcon color="#ffffff" size={14} style={{ marginRight: 6 }} />
        )}

        <Text style={styles.statusText}>
          {statusMessage ||
            (queue.length > 0
              ? `⏳ Waiting for sync (${queue.length} pending operation${queue.length > 1 ? 's' : ''})`
              : '✓ Synced')}
        </Text>

        {queue.length > 0 && !syncing && (
          <TouchableOpacity style={styles.syncBtn} onPress={handleManualSync}>
            <Text style={styles.syncBtnText}>Sync Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  syncBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 10,
  },
  syncBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
});
