import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  FileText,
  DollarSign,
  Briefcase,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';
import { useTheme } from '../theme/themeSystem';
import { useTranslation } from '../theme/i18n';
import { AppCard, BadgePill, EmptyStateWidget } from './uiComponents';

const CalendarHeaderIcon = CalendarIcon as any;
const PlusIcon = Plus as any;
const ClockIcon = Clock as any;
const FileTextIcon = FileText as any;
const DollarSignIcon = DollarSign as any;
const BriefcaseIcon = Briefcase as any;
const CheckCircleIcon = CheckCircle as any;
const AlertCircleIcon = AlertCircle as any;
const ChevronLeftIcon = ChevronLeft as any;
const ChevronRightIcon = ChevronRight as any;
const FilterIcon = Filter as any;

type ViewMode = 'agenda' | 'month' | 'week';
type EventFilter = 'all' | 'invoice_due' | 'bill_due' | 'payroll_due' | 'project_deadline' | 'custom';

type BusinessCalendarScreenProps = {
  activeWorkspaceId: string;
  activeWorkspaceRole: string;
};

export function BusinessCalendarScreen({ activeWorkspaceId, activeWorkspaceRole }: BusinessCalendarScreenProps) {
  const { theme, accentHex } = useTheme();
  const { t } = useTranslation();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('agenda');
  const [activeFilter, setActiveFilter] = useState<EventFilter>('all');

  // Event Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [eventType, setEventType] = useState<string>('custom');
  const [startDateStr, setStartDateStr] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/calendar/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Failed to fetch calendar events:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeWorkspaceId]);

  const handleCreateEvent = async () => {
    if (!title.trim() || !startDateStr) {
      Alert.alert('Required', 'Please enter an event title and start date.');
      return;
    }

    try {
      const res = await apiClient.post('/calendar/events', {
        title: title.trim(),
        description,
        startDate: startDateStr,
        eventType,
        amount: parseFloat(amount) || 0,
        reminderMinutesBefore: 1440,
      });

      if (res.ok) {
        setModalVisible(false);
        setTitle('');
        setDescription('');
        setAmount('');
        fetchEvents();
      } else {
        const errData = await res.json().catch(() => ({}));
        Alert.alert('Error', errData.error || 'Failed to create calendar event.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save event');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (id.startsWith('inv-') || id.startsWith('bill-') || id.startsWith('pay-') || id.startsWith('proj-')) {
      Alert.alert('System Event', 'System generated events are linked to real records and cannot be deleted from the calendar.');
      return;
    }

    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await apiClient.delete(`/calendar/events/${id}`);
            if (res.ok) fetchEvents();
          } catch (e) {}
        },
      },
    ]);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'invoice_due':
        return <FileTextIcon color="#4f8cff" size={18} />;
      case 'bill_due':
        return <DollarSignIcon color="#ef4444" size={18} />;
      case 'payroll_due':
        return <BriefcaseIcon color="#10b981" size={18} />;
      case 'project_deadline':
        return <ClockIcon color="#a855f7" size={18} />;
      default:
        return <CalendarHeaderIcon color={accentHex} size={18} />;
    }
  };

  const filteredEvents = events.filter((e) => {
    if (activeFilter === 'all') return true;
    return e.eventType === activeFilter;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* View Switcher Bar */}
      <View style={[styles.controlBar, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.tabGroup}>
          {(['agenda', 'month', 'week'] as ViewMode[]).map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.tabBtn, viewMode === v && { backgroundColor: accentHex }]}
              onPress={() => setViewMode(v)}
            >
              <Text style={[styles.tabBtnText, { color: viewMode === v ? '#fff' : theme.textSecondary }]}>
                {v.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.addBtn, { backgroundColor: accentHex }]} onPress={() => setModalVisible(true)}>
          <PlusIcon color="#fff" size={16} />
          <Text style={styles.addBtnText}>Add Event</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
        {[
          { key: 'all', label: 'All Events' },
          { key: 'invoice_due', label: 'Invoices' },
          { key: 'bill_due', label: 'Bills' },
          { key: 'payroll_due', label: 'Payroll' },
          { key: 'project_deadline', label: 'Projects' },
          { key: 'custom', label: 'Custom' },
        ].map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, { backgroundColor: isActive ? `${accentHex}25` : theme.card, borderColor: isActive ? accentHex : theme.cardBorder }]}
              onPress={() => setActiveFilter(f.key as EventFilter)}
            >
              <Text style={[styles.chipText, { color: isActive ? accentHex : theme.textSecondary }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Main List Area */}
      {loading && events.length === 0 ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={accentHex} size="large" />
        </View>
      ) : filteredEvents.length === 0 ? (
        <EmptyStateWidget
          icon={<CalendarHeaderIcon color={accentHex} size={24} />}
          title="No Calendar Events"
          description="Upcoming invoice due dates, bill payments, payroll, and project deadlines will appear here automatically."
          actionLabel="+ Add Custom Event"
          onAction={() => setModalVisible(true)}
          style={{ margin: 16 }}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredEvents.map((item) => {
            const dateStr = item.startDate ? new Date(item.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD';
            return (
              <AppCard key={item._id} style={styles.eventCard} onPress={() => handleDeleteEvent(item._id)}>
                <View style={styles.eventRow}>
                  <View style={[styles.iconBg, { backgroundColor: `${accentHex}15` }]}>{getEventIcon(item.eventType)}</View>

                  <View style={styles.eventMeta}>
                    <Text style={[styles.eventTitle, { color: theme.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.eventSub, { color: theme.textSecondary }]} numberOfLines={1}>
                      📅 {dateStr} {item.description ? `• ${item.description}` : ''}
                    </Text>
                  </View>

                  {item.amount > 0 && (
                    <View style={styles.amountCol}>
                      <Text style={[styles.eventAmount, { color: theme.text }]}>₹{item.amount.toLocaleString('en-IN')}</Text>
                      <BadgePill
                        label={item.status.toUpperCase()}
                        variant={item.status === 'completed' ? 'success' : item.status === 'overdue' ? 'error' : 'warning'}
                      />
                    </View>
                  )}
                </View>
              </AppCard>
            );
          })}
        </ScrollView>
      )}

      {/* Add Event Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Business Event</Text>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Title</Text>
            <TextInput style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]} value={title} onChangeText={setTitle} placeholder="Event title..." placeholderTextColor={theme.textMuted} />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Date (YYYY-MM-DD)</Text>
            <TextInput style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]} value={startDateStr} onChangeText={setStartDateStr} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textMuted} />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Amount (Optional)</Text>
            <TextInput style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="₹0" placeholderTextColor={theme.textMuted} />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.bg }]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: theme.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: accentHex }]} onPress={handleCreateEvent}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>Save Event</Text>
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
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
  },
  tabGroup: { flexDirection: 'row', gap: 4 },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  tabBtnText: { fontSize: 11, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  filterScroll: { maxHeight: 44, marginVertical: 6 },
  filterContainer: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  chipText: { fontSize: 11, fontWeight: '700' },
  listContent: { padding: 16, gap: 10 },
  eventCard: { padding: 14 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  eventMeta: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '800' },
  eventSub: { fontSize: 11, marginTop: 2 },
  amountCol: { alignItems: 'flex-end', gap: 4 },
  eventAmount: { fontSize: 14, fontWeight: '800' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 20, borderRadius: 20, borderWidth: 1, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  input: { height: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  modalBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
