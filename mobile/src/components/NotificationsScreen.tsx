import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Bell, Check, CheckCheck, AlertCircle, Briefcase, Users, TrendingUp, Info } from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';
import { useTheme } from '../theme/themeSystem';
import { useTranslation } from '../theme/i18n';

const BellIcon = Bell as any;
const CheckIcon = Check as any;
const CheckCheckIcon = CheckCheck as any;
const AlertCircleIcon = AlertCircle as any;
const BriefcaseIcon = Briefcase as any;
const UsersIcon = Users as any;
const TrendingUpIcon = TrendingUp as any;
const InfoIcon = Info as any;

type Props = {
  activeWorkspaceId?: string;
};

const TYPE_META: Record<string, { color: string; Icon: any }> = {
  approval: { color: '#22c55e', Icon: TrendingUpIcon },
  owner_request: { color: '#a78bfa', Icon: UsersIcon },
  join: { color: '#60a5fa', Icon: BriefcaseIcon },
  announcement: { color: '#f59e0b', Icon: InfoIcon },
  system: { color: '#64748b', Icon: InfoIcon },
};

export function NotificationsScreen({ activeWorkspaceId }: Props) {
  const { theme, accentHex } = useTheme();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [activeWorkspaceId]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
    setLoading(false);
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const res = await apiClient.put('/notifications/read-all', {});
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (e) {}
    setMarkingAll(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={accentHex} size="large" />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>{t('loading') || 'Loading notifications...'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.headerLeft}>
          <BellIcon color={accentHex} size={22} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('notifications_title') || 'Notifications'}</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            disabled={markingAll}
            style={[styles.markAllBtn, { backgroundColor: `${accentHex}18` }]}
            activeOpacity={0.8}
          >
            {markingAll
              ? <ActivityIndicator color={accentHex} size="small" />
              : <><CheckCheckIcon color={accentHex} size={15} /><Text style={[styles.markAllText, { color: accentHex }]}>{t('mark_all_read') || 'Mark all read'}</Text></>
            }
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 16 }}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <BellIcon color={theme.cardBorder} size={48} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('no_notifications') || 'No Notifications'}</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>You're all caught up! Notifications about approvals, joins, and workspace events will appear here.</Text>
          </View>
        ) : notifications.map((notif, i) => {
          const meta = TYPE_META[notif.type] || TYPE_META.system;
          const IconComp = meta.Icon;
          return (
            <View
              key={notif.id || i}
              style={[styles.notifCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, !notif.read && { borderColor: accentHex }]}
            >
              <View style={[styles.notifIconWrap, { backgroundColor: `${meta.color}18` }]}>
                <IconComp color={meta.color} size={20} />
              </View>
              <View style={styles.notifContent}>
                <View style={styles.notifTopRow}>
                  <Text style={[styles.notifTitle, { color: theme.text }]}>{notif.title}</Text>
                  {!notif.read && <View style={[styles.unreadDot, { backgroundColor: accentHex }]} />}
                </View>
                <Text style={[styles.notifMessage, { color: theme.textSecondary }]}>{notif.message}</Text>
                <Text style={[styles.notifTime, { color: theme.textMuted }]}>{formatTime(notif.createdAt)}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06111f',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06111f',
    gap: 16,
  },
  loadingText: {
    color: '#4a7aa0',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: '#e2f0ff',
    fontSize: 20,
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderRadius: 20,
  },
  markAllText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
    gap: 14,
  },
  emptyTitle: {
    color: '#2a4a6a',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#1e3a5f',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  notifCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  notifCardUnread: {
    backgroundColor: 'rgba(96,165,250,0.06)',
    borderColor: 'rgba(96,165,250,0.15)',
  },
  notifIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notifContent: {
    flex: 1,
  },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    color: '#d1e8ff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#60a5fa',
  },
  notifMessage: {
    color: '#6b8aa8',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  notifTime: {
    color: '#334e68',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },
});
