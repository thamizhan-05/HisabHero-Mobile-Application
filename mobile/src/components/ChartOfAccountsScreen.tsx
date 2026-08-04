import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  BookOpen,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Scale,
  FileSpreadsheet,
  CheckCircle,
  Plus,
  X,
  Layers,
} from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';

const BookOpenIcon = BookOpen as any;
const PlusCircleIcon = PlusCircle as any;
const TrendingUpIcon = TrendingUp as any;
const TrendingDownIcon = TrendingDown as any;
const ScaleIcon = Scale as any;
const FileSpreadsheetIcon = FileSpreadsheet as any;
const CheckCircleIcon = CheckCircle as any;
const PlusIcon = Plus as any;
const XIcon = X as any;
const LayersIcon = Layers as any;

export function ChartOfAccountsScreen() {
  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'trialBalance' | 'statements' | 'journal'>('accounts');
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [statements, setStatements] = useState<any>(null);

  // New Account Modal State
  const [addAccountVisible, setAddAccountVisible] = useState(false);
  const [accCode, setAccCode] = useState('');
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense'>('Asset');

  // New Journal Entry Modal State
  const [addJournalVisible, setAddJournalVisible] = useState(false);
  const [jeDesc, setJeDesc] = useState('');
  const [debitAccId, setDebitAccId] = useState('');
  const [creditAccId, setCreditAccId] = useState('');
  const [jeAmount, setJeAmount] = useState('');

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'accounts') {
        const res = await apiClient.get('/api/accounting/chart-of-accounts');
        if (res.ok) setAccounts(await res.json());
      } else if (activeSubTab === 'trialBalance') {
        const res = await apiClient.get('/api/accounting/trial-balance');
        if (res.ok) setTrialBalance(await res.json());
      } else if (activeSubTab === 'statements') {
        const res = await apiClient.get('/api/accounting/financial-statements');
        if (res.ok) setStatements(await res.json());
      } else if (activeSubTab === 'journal') {
        const res = await apiClient.get('/api/accounting/journal-entries');
        if (res.ok) setJournalEntries(await res.json());
      }
    } catch (e) {
      console.warn('Failed to load accounting data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!accCode || !accName) {
      Alert.alert('Error', 'Account code and name are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/api/accounting/chart-of-accounts', {
        code: accCode,
        name: accName,
        type: accType,
      });
      if (res.ok) {
        Alert.alert('Success', 'Account created successfully.');
        setAddAccountVisible(false);
        setAccCode('');
        setAccName('');
        loadData();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostJournal = async () => {
    const amt = parseFloat(jeAmount);
    if (!jeDesc || !debitAccId || !creditAccId || isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Please fill all debit/credit fields with a valid amount.');
      return;
    }
    setLoading(true);
    try {
      const debitAcc = accounts.find((a) => a._id === debitAccId);
      const creditAcc = accounts.find((a) => a._id === creditAccId);

      const res = await apiClient.post('/api/accounting/journal-entries', {
        description: jeDesc,
        lines: [
          { accountId: debitAccId, accountCode: debitAcc?.code, accountName: debitAcc?.name, debit: amt, credit: 0 },
          { accountId: creditAccId, accountCode: creditAcc?.code, accountName: creditAcc?.name, debit: 0, credit: amt },
        ],
      });
      if (res.ok) {
        Alert.alert('Posted', 'Double-entry journal posted successfully.');
        setAddJournalVisible(false);
        setJeDesc('');
        setJeAmount('');
        loadData();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to post journal entry.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to post journal entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Sub navigation bar */}
      <View style={styles.subTabNav}>
        <TouchableOpacity
          style={[styles.subTabItem, activeSubTab === 'accounts' && styles.subTabActive]}
          onPress={() => setActiveSubTab('accounts')}
        >
          <BookOpenIcon color={activeSubTab === 'accounts' ? '#fff' : '#5f88b8'} size={14} />
          <Text style={[styles.subTabText, activeSubTab === 'accounts' && styles.subTabTextActive]}>Accounts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabItem, activeSubTab === 'trialBalance' && styles.subTabActive]}
          onPress={() => setActiveSubTab('trialBalance')}
        >
          <ScaleIcon color={activeSubTab === 'trialBalance' ? '#fff' : '#5f88b8'} size={14} />
          <Text style={[styles.subTabText, activeSubTab === 'trialBalance' && styles.subTabTextActive]}>Trial Balance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabItem, activeSubTab === 'statements' && styles.subTabActive]}
          onPress={() => setActiveSubTab('statements')}
        >
          <FileSpreadsheetIcon color={activeSubTab === 'statements' ? '#fff' : '#5f88b8'} size={14} />
          <Text style={[styles.subTabText, activeSubTab === 'statements' && styles.subTabTextActive]}>Statements</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabItem, activeSubTab === 'journal' && styles.subTabActive]}
          onPress={() => setActiveSubTab('journal')}
        >
          <LayersIcon color={activeSubTab === 'journal' ? '#fff' : '#5f88b8'} size={14} />
          <Text style={[styles.subTabText, activeSubTab === 'journal' && styles.subTabTextActive]}>Journal</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f8cff" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {activeSubTab === 'accounts' && (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.title}>Chart of Accounts</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setAddAccountVisible(true)}>
                  <PlusIcon color="#fff" size={16} />
                  <Text style={styles.addBtnText}>Add Account</Text>
                </TouchableOpacity>
              </View>

              {accounts.map((acc) => (
                <View key={acc._id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.codeTag}>{acc.code}</Text>
                    <Text style={styles.accName}>{acc.name}</Text>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{acc.type}</Text>
                    </View>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.subType}>{acc.subType}</Text>
                    <Text style={styles.balance}>₹{(acc.balance || 0).toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {activeSubTab === 'trialBalance' && trialBalance && (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.title}>Trial Balance</Text>
                <View style={[styles.balancedBadge, trialBalance.isBalanced ? styles.badgeGreen : styles.badgeRed]}>
                  <Text style={styles.badgeText}>{trialBalance.isBalanced ? 'BALANCED ✅' : 'UNBALANCED ❌'}</Text>
                </View>
              </View>

              <View style={styles.tbHeader}>
                <Text style={[styles.tbCol, { flex: 2 }]}>Account</Text>
                <Text style={[styles.tbCol, { textAlign: 'right' }]}>Debit (₹)</Text>
                <Text style={[styles.tbCol, { textAlign: 'right' }]}>Credit (₹)</Text>
              </View>

              {trialBalance.report?.map((row: any) => (
                <View key={row.id} style={styles.tbRow}>
                  <Text style={[styles.tbCell, { flex: 2 }]}>{row.code} - {row.name}</Text>
                  <Text style={[styles.tbCell, { textAlign: 'right', color: '#2ecc71' }]}>{row.debit > 0 ? `₹${row.debit.toLocaleString('en-IN')}` : '-'}</Text>
                  <Text style={[styles.tbCell, { textAlign: 'right', color: '#ff6b6b' }]}>{row.credit > 0 ? `₹${row.credit.toLocaleString('en-IN')}` : '-'}</Text>
                </View>
              ))}

              <View style={styles.tbFooter}>
                <Text style={[styles.tbFooterText, { flex: 2 }]}>Total</Text>
                <Text style={[styles.tbFooterText, { textAlign: 'right' }]}>₹{(trialBalance.grandDebit || 0).toLocaleString('en-IN')}</Text>
                <Text style={[styles.tbFooterText, { textAlign: 'right' }]}>₹{(trialBalance.grandCredit || 0).toLocaleString('en-IN')}</Text>
              </View>
            </>
          )}

          {activeSubTab === 'statements' && statements && (
            <>
              <Text style={styles.title}>Financial Statements</Text>

              <Text style={styles.sectionTitle}>Balance Sheet</Text>
              <View style={styles.statementCard}>
                <View style={styles.statRow}><Text style={styles.statLabel}>Total Assets</Text><Text style={styles.statVal}>₹{(statements.balanceSheet?.totalAssets || 0).toLocaleString('en-IN')}</Text></View>
                <View style={styles.statRow}><Text style={styles.statLabel}>Total Liabilities</Text><Text style={styles.statVal}>₹{(statements.balanceSheet?.totalLiabilities || 0).toLocaleString('en-IN')}</Text></View>
                <View style={styles.statRow}><Text style={styles.statLabel}>Total Equity</Text><Text style={styles.statVal}>₹{(statements.balanceSheet?.totalEquity || 0).toLocaleString('en-IN')}</Text></View>
                <View style={styles.divider} />
                <View style={styles.statRow}><Text style={styles.statLabelBold}>Retained Earnings</Text><Text style={styles.statValBold}>₹{(statements.balanceSheet?.retainedEarnings || 0).toLocaleString('en-IN')}</Text></View>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Profit & Loss Statement</Text>
              <View style={styles.statementCard}>
                <View style={styles.statRow}><Text style={styles.statLabel}>Operating Revenue</Text><Text style={[styles.statVal, { color: '#2ecc71' }]}>₹{(statements.profitAndLoss?.totalRevenue || 0).toLocaleString('en-IN')}</Text></View>
                <View style={styles.statRow}><Text style={styles.statLabel}>Operating Expenses</Text><Text style={[styles.statVal, { color: '#ff6b6b' }]}>₹{(statements.profitAndLoss?.totalExpenses || 0).toLocaleString('en-IN')}</Text></View>
                <View style={styles.divider} />
                <View style={styles.statRow}><Text style={styles.statLabelBold}>Net Profit</Text><Text style={styles.statValBold}>₹{(statements.profitAndLoss?.netProfit || 0).toLocaleString('en-IN')}</Text></View>
                <View style={styles.statRow}><Text style={styles.statLabel}>Profit Margin</Text><Text style={styles.statVal}>{statements.profitAndLoss?.profitMargin || 0}%</Text></View>
              </View>
            </>
          )}

          {activeSubTab === 'journal' && (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.title}>General Journal</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setAddJournalVisible(true)}>
                  <PlusIcon color="#fff" size={16} />
                  <Text style={styles.addBtnText}>New Journal Entry</Text>
                </TouchableOpacity>
              </View>

              {journalEntries.map((je) => (
                <View key={je._id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.codeTag}>{je.entryNumber}</Text>
                    <Text style={styles.accName}>{je.description}</Text>
                    <Text style={styles.dateText}>{new Date(je.date).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.linesCol}>
                    {je.lines?.map((l: any, idx: number) => (
                      <View key={idx} style={styles.lineRow}>
                        <Text style={styles.lineAcc}>{l.accountCode || ''} {l.accountName || 'Account'}</Text>
                        <Text style={styles.lineVal}>{l.debit > 0 ? `DR ₹${l.debit}` : `CR ₹${l.credit}`}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Add Account Modal */}
      <Modal visible={addAccountVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Account</Text>

            <Text style={styles.label}>Account Code</Text>
            <TextInput style={styles.input} value={accCode} onChangeText={setAccCode} placeholder="e.g. 1050" placeholderTextColor="#5f88b8" />

            <Text style={styles.label}>Account Name</Text>
            <TextInput style={styles.input} value={accName} onChangeText={setAccName} placeholder="e.g. HDFC Checking Account" placeholderTextColor="#5f88b8" />

            <Text style={styles.label}>Account Type</Text>
            <View style={styles.typeSelector}>
              {(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, accType === t && styles.typeChipActive]}
                  onPress={() => setAccType(t)}
                >
                  <Text style={[styles.typeChipText, accType === t && styles.typeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateAccount}>
              <Text style={styles.saveBtnText}>Save Account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddAccountVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Post Journal Modal */}
      <Modal visible={addJournalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Journal Entry</Text>

            <Text style={styles.label}>Description</Text>
            <TextInput style={styles.input} value={jeDesc} onChangeText={setJeDesc} placeholder="e.g. Rent Payment for Office" placeholderTextColor="#5f88b8" />

            <Text style={styles.label}>Debit Account</Text>
            <ScrollView horizontal style={styles.accPicker}>
              {accounts.map((a) => (
                <TouchableOpacity
                  key={a._id}
                  style={[styles.accChip, debitAccId === a._id && styles.typeChipActive]}
                  onPress={() => setDebitAccId(a._id)}
                >
                  <Text style={[styles.accChipText, debitAccId === a._id && styles.typeChipTextActive]}>{a.code} {a.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Credit Account</Text>
            <ScrollView horizontal style={styles.accPicker}>
              {accounts.map((a) => (
                <TouchableOpacity
                  key={a._id}
                  style={[styles.accChip, creditAccId === a._id && styles.typeChipActive]}
                  onPress={() => setCreditAccId(a._id)}
                >
                  <Text style={[styles.accChipText, creditAccId === a._id && styles.typeChipTextActive]}>{a.code} {a.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput style={styles.input} value={jeAmount} onChangeText={setJeAmount} keyboardType="numeric" placeholder="e.g. 25000" placeholderTextColor="#5f88b8" />

            <TouchableOpacity style={styles.saveBtn} onPress={handlePostJournal}>
              <Text style={styles.saveBtnText}>Post Journal Entry</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddJournalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111f' },
  subTabNav: { flexDirection: 'row', backgroundColor: '#0b1d38', padding: 6, gap: 4 },
  subTabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 6, gap: 4 },
  subTabActive: { backgroundColor: '#4f8cff' },
  subTabText: { color: '#5f88b8', fontSize: 11, fontWeight: '700' },
  subTabTextActive: { color: '#ffffff' },
  scrollContent: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f8cff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, gap: 4 },
  addBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: '#0b1d38', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#15345f' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codeTag: { backgroundColor: '#15345f', color: '#4f8cff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 11, fontWeight: '700' },
  accName: { color: '#ffffff', fontSize: 14, fontWeight: '700', flex: 1 },
  typeBadge: { backgroundColor: 'rgba(79,140,255,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  typeBadgeText: { color: '#4f8cff', fontSize: 10, fontWeight: '700' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  subType: { color: '#5f88b8', fontSize: 12 },
  balance: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  tbHeader: { flexDirection: 'row', backgroundColor: '#0b1d38', padding: 10, borderRadius: 6, marginBottom: 4 },
  tbCol: { color: '#5f88b8', fontSize: 12, fontWeight: '700', flex: 1 },
  tbRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderColor: '#15345f' },
  tbCell: { color: '#ffffff', fontSize: 12, flex: 1 },
  tbFooter: { flexDirection: 'row', backgroundColor: '#0b1d38', padding: 10, borderRadius: 6, marginTop: 8 },
  tbFooterText: { color: '#ffffff', fontSize: 12, fontWeight: '800', flex: 1 },
  balancedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeGreen: { backgroundColor: 'rgba(46,204,113,0.2)' },
  badgeRed: { backgroundColor: 'rgba(255,107,107,0.2)' },
  badgeText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  sectionTitle: { color: '#8fc0ff', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  statementCard: { backgroundColor: '#0b1d38', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#15345f' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  statLabel: { color: '#5f88b8', fontSize: 13 },
  statVal: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  statLabelBold: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  statValBold: { color: '#4f8cff', fontSize: 15, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#15345f', marginVertical: 8 },
  dateText: { color: '#5f88b8', fontSize: 11 },
  linesCol: { marginTop: 8, borderTopWidth: 1, borderColor: '#15345f', paddingTop: 6 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  lineAcc: { color: '#8fc0ff', fontSize: 12 },
  lineVal: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#07162c', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#15345f' },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', marginBottom: 12 },
  label: { color: '#8fc0ff', fontSize: 12, marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: '#0b1d38', color: '#ffffff', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#15345f' },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 },
  typeChip: { backgroundColor: '#0b1d38', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#15345f' },
  typeChipActive: { backgroundColor: '#4f8cff', borderColor: '#4f8cff' },
  typeChipText: { color: '#5f88b8', fontSize: 12, fontWeight: '600' },
  typeChipTextActive: { color: '#ffffff' },
  accPicker: { flexDirection: 'row', gap: 6, marginVertical: 4 },
  accChip: { backgroundColor: '#0b1d38', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#15345f', marginRight: 6 },
  accChipText: { color: '#5f88b8', fontSize: 11 },
  saveBtn: { backgroundColor: '#4f8cff', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#ffffff', fontWeight: '800' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  cancelBtnText: { color: '#ff6b6b', fontWeight: '700' },
});
