import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import {
  Repeat,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle,
  X,
  CreditCard
} from 'lucide-react-native';
import { useTheme } from '../theme/themeSystem';
import { apiClient } from '../lib/apiClient';

interface Subscription {
  _id: string;
  name: string;
  vendorName: string;
  category: string;
  amount: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  nextBillingDate: string;
  status: string;
}

export const SubscriptionsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Add Subscription Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [category, setCategory] = useState('Software & SaaS');
  const [saving, setSaving] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/subscriptions');
      if (res.ok) {
        const data = await res.json();
        if (data?.success) {
          setSubscriptions(data.subscriptions || []);
          setMonthlyTotal(data.monthlyTotal || 0);
        }
      }
    } catch (err: any) {
      console.warn('[Subscriptions Fetch Error]', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleAddSubscription = async () => {
    if (!name.trim() || !amount || isNaN(Number(amount))) {
      Alert.alert('Invalid Input', 'Please enter subscription name and valid amount.');
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.post('/api/subscriptions', {
        name: name.trim(),
        vendorName: vendorName.trim() || name.trim(),
        category,
        amount: Number(amount),
        billingCycle
      });
      const data = await res.json();

      if (res.ok && data?.success) {
        setModalVisible(false);
        setName('');
        setVendorName('');
        setAmount('');
        fetchSubscriptions();
      } else {
        Alert.alert('Error', data?.error || 'Failed to add subscription');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add subscription');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubscription = (id: string, subName: string) => {
    Alert.alert('Cancel Subscription', `Are you sure you want to remove "${subName}"?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/api/subscriptions/${id}`);
            fetchSubscriptions();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        }
      }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Monthly Burn Banner */}
      <View style={[styles.burnCard, { backgroundColor: theme.primary, shadowColor: theme.primary }]}>
        <View style={styles.burnHeader}>
          <Repeat size={20} color="#fff" />
          <Text style={styles.burnTag}>RECURRING BILLS & SUBSCRIPTIONS</Text>
        </View>
        <Text style={styles.burnAmount}>₹{monthlyTotal.toLocaleString('en-IN')}</Text>
        <Text style={styles.burnSub}>Total Projected Monthly Spend Across {subscriptions.length} Subscriptions</Text>
      </View>

      {/* Subscriptions List */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : subscriptions.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Repeat size={40} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Recurring Subscriptions</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
              Track AWS, Google Workspace, Slack, Office Rent, and vendor retainers in one central place.
            </Text>
          </View>
        ) : (
          subscriptions.map(sub => (
            <View
              key={sub._id}
              style={[styles.subCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            >
              <View style={styles.subTopRow}>
                <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
                  <CreditCard size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.subName, { color: theme.text }]}>{sub.name}</Text>
                  <Text style={[styles.subCategory, { color: theme.textMuted }]}>{sub.category} • {sub.vendorName}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.subAmount, { color: theme.text }]}>₹{sub.amount.toLocaleString('en-IN')}</Text>
                  <Text style={[styles.subCycle, { color: theme.primary }]}>/{sub.billingCycle}</Text>
                </View>
              </View>

              <View style={[styles.subFooter, { borderTopColor: theme.cardBorder }]}>
                <View style={styles.dateBadge}>
                  <Calendar size={13} color={theme.textMuted} style={{ marginRight: 5 }} />
                  <Text style={[styles.dateText, { color: theme.textMuted }]}>
                    Next due: {new Date(sub.nextBillingDate).toLocaleDateString()}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleDeleteSubscription(sub._id, sub.name)}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={16} color={theme.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Subscription FAB */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={[styles.fab, { backgroundColor: theme.primary }]}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add Subscription Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add Recurring Bill / SaaS</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="Subscription Name (e.g. AWS Hosting / Slack Pro)"
              placeholderTextColor={theme.textMuted}
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={[styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="Vendor Name (e.g. Amazon Web Services)"
              placeholderTextColor={theme.textMuted}
              value={vendorName}
              onChangeText={setVendorName}
            />

            <TextInput
              style={[styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text, fontSize: 18, fontWeight: '700' }]}
              placeholder="Amount (₹)"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <View style={styles.cycleRow}>
              {(['monthly', 'quarterly', 'yearly'] as const).map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setBillingCycle(c)}
                  style={[
                    styles.cycleBtn,
                    billingCycle === c && { backgroundColor: theme.primary }
                  ]}
                >
                  <Text style={{ color: billingCycle === c ? '#fff' : theme.textSecondary, fontWeight: '600', textTransform: 'capitalize' }}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleAddSubscription}
              disabled={saving}
              style={[styles.submitBtn, { backgroundColor: theme.primary }]}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save Subscription</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  burnCard: {
    padding: 20,
    borderRadius: 22,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5
  },
  burnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  burnTag: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginLeft: 8
  },
  burnAmount: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800'
  },
  burnSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 4
  },
  listContainer: {
    paddingBottom: 80
  },
  subCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12
  },
  subTopRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center'
  },
  subName: {
    fontSize: 15,
    fontWeight: '700'
  },
  subCategory: {
    fontSize: 12,
    marginTop: 2
  },
  subAmount: {
    fontSize: 16,
    fontWeight: '800'
  },
  subCycle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2
  },
  subFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dateText: {
    fontSize: 11
  },
  deleteBtn: {
    padding: 6
  },
  emptyBox: {
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 20
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end'
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  formInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12
  },
  cycleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  cycleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(150,150,150,0.1)'
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700'
  }
});
