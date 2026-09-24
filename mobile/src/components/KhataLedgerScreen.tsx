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
  Alert,
  Linking
} from 'react-native';
import {
  Users,
  UserPlus,
  ArrowUpRight,
  ArrowDownLeft,
  Share2,
  Phone,
  Search,
  Plus,
  CheckCircle,
  X,
  MessageSquare
} from 'lucide-react-native';
import { useTheme } from '../theme/themeSystem';
import { apiClient } from '../lib/apiClient';
import { UpiPaymentQrModal } from './UpiPaymentQrModal';

interface Party {
  _id: string;
  partyName: string;
  partyType: 'customer' | 'vendor';
  phone?: string;
  email?: string;
  netBalance: number;
  updatedAt: string;
  entries?: any[];
}

export const KhataLedgerScreen: React.FC = () => {
  const { theme } = useTheme();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'customer' | 'vendor'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // UPI Payment Modal State
  const [upiParty, setUpiParty] = useState<Party | null>(null);

  // Add Party Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyType, setNewPartyType] = useState<'customer' | 'vendor'>('customer');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyBalance, setNewPartyBalance] = useState('');
  const [savingParty, setSavingParty] = useState(false);

  // Add Entry Modal State
  const [entryModalVisible, setEntryModalVisible] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [entryType, setEntryType] = useState<'credit' | 'debit'>('credit');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryNote, setEntryNote] = useState('');
  const [savingEntry, setSavingEntry] = useState(false);

  // ⚖️ Tier 1: Section 138 NI Act Cheque Bounce State
  const [chequeBounceModalVisible, setChequeBounceModalVisible] = useState(false);
  const [chequeDebtorName, setChequeDebtorName] = useState('Sunil Mehta');
  const [chequeDebtorPhone, setChequeDebtorPhone] = useState('+91 98290 12345');
  const [chequeNumber, setChequeNumber] = useState('CHQ-849201');
  const [chequeAmount, setChequeAmount] = useState('85000');
  const [chequeBank, setChequeBank] = useState('State Bank of India');
  const [chequeNoticeData, setChequeNoticeData] = useState<any | null>(null);
  const [generatingNotice, setGeneratingNotice] = useState(false);

  const fetchKhataData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/khata');
      if (res.ok) {
        const data = await res.json();
        if (data?.success) {
          setParties(data.parties || []);
        }
      }
    } catch (err: any) {
      console.warn('[Khata Fetch Error]', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKhataData();
  }, []);

  const handleGenerateChequeNotice = async () => {
    setGeneratingNotice(true);
    try {
      const res = await apiClient.post('/api/business/cheque-bounce-notice', {
        debtorName: chequeDebtorName,
        debtorPhone: chequeDebtorPhone,
        chequeNumber,
        chequeAmount: Number(chequeAmount) || 85000,
        bankName: chequeBank,
        dishonourDate: new Date().toISOString().split('T')[0],
        dishonourReason: 'Funds Insufficient (Code 01)'
      });
      if (res.ok) {
        const data = await res.json();
        setChequeNoticeData(data);
      }
    } catch (err: any) {
      Alert.alert('Notice Error', err.message || 'Could not generate statutory legal notice.');
    } finally {
      setGeneratingNotice(false);
    }
  };

  const handleSendNoticeWa = () => {
    const text = chequeNoticeData?.whatsAppNotice || 'Statutory Demand Notice under Section 138 NI Act';
    const cleanPhone = chequeDebtorPhone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not launch WhatsApp.'));
  };

  const handleCreateParty = async () => {
    if (!newPartyName.trim()) {
      Alert.alert('Name Required', 'Please enter customer or vendor name.');
      return;
    }

    setSavingParty(true);
    try {
      const res = await apiClient.post('/api/khata', {
        partyName: newPartyName.trim(),
        partyType: newPartyType,
        phone: newPartyPhone.trim(),
        initialBalance: Number(newPartyBalance) || 0
      });
      const data = await res.json();

      if (res.ok && data?.success) {
        setAddModalVisible(false);
        setNewPartyName('');
        setNewPartyPhone('');
        setNewPartyBalance('');
        fetchKhataData();
      } else {
        Alert.alert('Error', data?.error || 'Failed to add party');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add party');
    } finally {
      setSavingParty(false);
    }
  };

  const handleAddEntry = async () => {
    if (!selectedParty || !entryAmount || isNaN(Number(entryAmount))) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    setSavingEntry(true);
    try {
      const res = await apiClient.post(`/api/khata/${selectedParty._id}/entry`, {
        type: entryType,
        amount: Number(entryAmount),
        note: entryNote.trim()
      });
      const data = await res.json();

      if (res.ok && data?.success) {
        setEntryModalVisible(false);
        setEntryAmount('');
        setEntryNote('');
        fetchKhataData();
      } else {
        Alert.alert('Error', data?.error || 'Failed to save entry');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save entry');
    } finally {
      setSavingEntry(false);
    }
  };

  const handleSendReminder = async (party: Party) => {
    setUpiParty(party);
  };

  const filteredParties = parties.filter(p => {
    if (activeFilter !== 'all' && p.partyType !== activeFilter) return false;
    if (searchQuery.trim() && !p.partyName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalReceivable = parties.filter(p => p.netBalance > 0).reduce((s, p) => s + p.netBalance, 0);
  const totalPayable = parties.filter(p => p.netBalance < 0).reduce((s, p) => s + Math.abs(p.netBalance), 0);

  const customerCount = parties.filter(p => p.partyType === 'customer').length;
  const vendorCount = parties.filter(p => p.partyType === 'vendor').length;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={[styles.mainTitle, { color: theme.text }]}>Khata Book Ledger</Text>
        <TouchableOpacity
          onPress={() => setAddModalVisible(true)}
          style={[styles.addPartyHeaderBtn, { backgroundColor: '#10b981' }]}
        >
          <Plus size={16} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.addPartyHeaderText}>Add Party</Text>
        </TouchableOpacity>
      </View>

      {/* Top Balance Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCardReceive, { backgroundColor: '#064e3b', borderColor: '#10b98160' }]}>
          <Text style={styles.summaryCardLabel}>You'll Receive</Text>
          <Text style={styles.summaryCardAmount}>₹{totalReceivable.toLocaleString('en-IN')}</Text>
          <Text style={styles.summaryCardSub}>(from {customerCount} Customers)</Text>
        </View>

        <View style={[styles.summaryCardPay, { backgroundColor: '#7f1d1d', borderColor: '#ef444460' }]}>
          <Text style={styles.summaryCardLabel}>You'll Pay</Text>
          <Text style={styles.summaryCardAmount}>₹{totalPayable.toLocaleString('en-IN')}</Text>
          <Text style={styles.summaryCardSub}>(to {vendorCount} Vendors)</Text>
        </View>
      </View>

      {/* Filter Tabs & Search Bar */}
      <View style={styles.controlsSection}>
        <View style={styles.tabBar}>
          {(['all', 'customer', 'vendor'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveFilter(tab)}
              style={[
                styles.tabItem,
                activeFilter === tab && { backgroundColor: theme.card, borderColor: '#10b981', borderWidth: 1.5 }
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeFilter === tab ? '#10b981' : theme.textSecondary, fontWeight: activeFilter === tab ? '800' : '600' }
                ]}
              >
                {tab === 'all' ? 'All' : tab === 'customer' ? 'Customers' : 'Vendors'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Search size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search customer or vendor name..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Party List */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
        ) : filteredParties.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Users size={40} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Khata Records Found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
              Add your customers and vendors to track credit & debit ledger statements.
            </Text>
          </View>
        ) : (
          filteredParties.map(party => {
            const isReceivable = party.netBalance >= 0;
            return (
              <View
                key={party._id}
                style={[styles.partyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              >
                <View style={styles.partyInfoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.partyName, { color: theme.text }]}>{party.partyName}</Text>
                    <Text style={[styles.outstandingLabel, { color: theme.textSecondary }]}>
                      Outstanding Balance
                    </Text>
                  </View>

                  <Text style={[styles.balanceAmount, { color: isReceivable ? '#10b981' : '#ef4444' }]}>
                    ₹{Math.abs(party.netBalance).toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* WhatsApp & UPI Quick Reminder Trigger */}
                <TouchableOpacity
                  onPress={() => handleSendReminder(party)}
                  style={[styles.whatsAppReminderBtn, { backgroundColor: theme.bg, borderColor: '#10b98150' }]}
                >
                  <MessageSquare size={16} color="#10b981" style={{ marginRight: 8 }} />
                  <Text style={[styles.whatsAppReminderText, { color: '#ffffff' }]}>Send UPI Link</Text>
                </TouchableOpacity>

                {/* Entry Log Actions */}
                <View style={styles.entryActionsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedParty(party);
                      setEntryType('credit');
                      setEntryModalVisible(true);
                    }}
                    style={[styles.entrySubBtn, { backgroundColor: '#10b98115' }]}
                  >
                    <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '700' }}>+ Give Credit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedParty(party);
                      setEntryType('debit');
                      setEntryModalVisible(true);
                    }}
                    style={[styles.entrySubBtn, { backgroundColor: '#ef444415' }]}
                  >
                    <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>- Receive Debit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Floating Add Party FAB */}
      <TouchableOpacity
        onPress={() => setAddModalVisible(true)}
        style={[styles.fab, { backgroundColor: '#10b981' }]}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      {/* Modal: Add New Party */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Khata Party</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                onPress={() => setNewPartyType('customer')}
                style={[
                  styles.typeSelectorBtn,
                  newPartyType === 'customer' && { backgroundColor: '#10b981' }
                ]}
              >
                <Text style={{ color: newPartyType === 'customer' ? '#fff' : theme.textSecondary, fontWeight: '600' }}>
                  Customer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNewPartyType('vendor')}
                style={[
                  styles.typeSelectorBtn,
                  newPartyType === 'vendor' && { backgroundColor: '#ef4444' }
                ]}
              >
                <Text style={{ color: newPartyType === 'vendor' ? '#fff' : theme.textSecondary, fontWeight: '600' }}>
                  Vendor
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              placeholder="Party Name (e.g. Sharma Electronics)"
              placeholderTextColor={theme.textMuted}
              value={newPartyName}
              onChangeText={setNewPartyName}
            />

            <TextInput
              style={[styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              placeholder="Phone Number (for WhatsApp Reminders)"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
              value={newPartyPhone}
              onChangeText={setNewPartyPhone}
            />

            <TextInput
              style={[styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              placeholder="Opening Balance (₹) (Optional)"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={newPartyBalance}
              onChangeText={setNewPartyBalance}
            />

            <TouchableOpacity
              onPress={handleCreateParty}
              disabled={savingParty}
              style={[styles.submitBtn, { backgroundColor: '#10b981' }]}
            >
              {savingParty ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.submitBtnText}>Save Party to Khata</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Add Khata Entry */}
      <Modal visible={entryModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {entryType === 'credit' ? '+ Give Credit (You will receive)' : '- Record Payment (Received money)'}
              </Text>
              <TouchableOpacity onPress={() => setEntryModalVisible(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 12 }}>
              Party: <Text style={{ color: theme.text, fontWeight: '700' }}>{selectedParty?.partyName}</Text>
            </Text>

            <TextInput
              style={[styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              placeholder="Amount (₹)"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={entryAmount}
              onChangeText={setEntryAmount}
            />

            <TextInput
              style={[styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              placeholder="Description / Bill # (Optional)"
              placeholderTextColor={theme.textMuted}
              value={entryNote}
              onChangeText={setEntryNote}
            />

            <TouchableOpacity
              onPress={handleAddEntry}
              disabled={savingEntry}
              style={[styles.submitBtn, { backgroundColor: entryType === 'credit' ? '#ef4444' : '#10b981' }]}
            >
              {savingEntry ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.submitBtnText}>
                  {entryType === 'credit' ? 'Confirm: Gave Credit' : 'Confirm: Payment Received'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dynamic UPI Payment QR Modal */}
      {upiParty && (
        <UpiPaymentQrModal
          visible={!!upiParty}
          onClose={() => setUpiParty(null)}
          title="Collect Khata Payment"
          amount={Math.abs(upiParty.netBalance) || 0}
          customerName={upiParty.partyName}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 4,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  addPartyHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  addPartyHeaderText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  summaryContainer: {
    gap: 10,
    marginBottom: 16,
  },
  summaryCardReceive: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#10b981',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryCardPay: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#ef4444',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryCardLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  summaryCardAmount: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  summaryCardSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  controlsSection: {
    marginBottom: 14
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  tabText: {
    fontSize: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    height: 42
  },
  searchInput: {
    flex: 1,
    fontSize: 13
  },
  listContainer: {
    paddingBottom: 80
  },
  partyCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12
  },
  partyInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  partyName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  outstandingLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  whatsAppReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  whatsAppReminderText: {
    fontSize: 13,
    fontWeight: '800',
  },
  entryActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  entrySubBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 10,
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
    width: 54,
    height: 54,
    borderRadius: 27,
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
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14
  },
  typeSelectorBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(150,150,150,0.1)'
  },
  formInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700'
  }
});
