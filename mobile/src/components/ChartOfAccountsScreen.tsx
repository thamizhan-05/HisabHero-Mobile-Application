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
import { useTheme } from '../theme/themeSystem';
import { useTranslation } from '../theme/i18n';

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
  const { theme, accentHex } = useTheme();
  const { t } = useTranslation();
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

  const handleCreateJournalEntry = async () => {
    const amt = parseFloat(jeAmount);
    if (!jeDesc || !debitAccId || !creditAccId || isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Please fill all journal entry fields correctly.');
      return;
    }
    if (debitAccId === creditAccId) {
      Alert.alert('Error', 'Debit and Credit accounts cannot be the same.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/api/accounting/journal-entries', {
        description: jeDesc,
        debitAccountId: debitAccId,
        creditAccountId: creditAccId,
        amount: amt,
      });
      if (res.ok) {
        Alert.alert('Success', 'Journal entry posted.');
        setAddJournalVisible(false);
        setJeDesc('');
        setJeAmount('');
        loadData();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to post journal entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Sub navigation bar */}
      <View style={[styles.subTabNav, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[styles.subTabItem, activeSubTab === 'accounts' && { backgroundColor: accentHex }]}
          onPress={() => setActiveSubTab('accounts')}
        >
          <BookOpenIcon color={activeSubTab === 'accounts' ? '#fff' : theme.textMuted} size={14} />
          <Text style={[styles.subTabText, { color: activeSubTab === 'accounts' ? '#fff' : theme.textSecondary }]}>{t('accounts')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabItem, activeSubTab === 'trialBalance' && { backgroundColor: accentHex }]}
          onPress={() => setActiveSubTab('trialBalance')}
        >
          <ScaleIcon color={activeSubTab === 'trialBalance' ? '#fff' : theme.textMuted} size={14} />
          <Text style={[styles.subTabText, { color: activeSubTab === 'trialBalance' ? '#fff' : theme.textSecondary }]}>Trial Balance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabItem, activeSubTab === 'statements' && { backgroundColor: accentHex }]}
          onPress={() => setActiveSubTab('statements')}
        >
          <FileSpreadsheetIcon color={activeSubTab === 'statements' ? '#fff' : theme.textMuted} size={14} />
          <Text style={[styles.subTabText, { color: activeSubTab === 'statements' ? '#fff' : theme.textSecondary }]}>{t('statements')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabItem, activeSubTab === 'journal' && { backgroundColor: accentHex }]}
          onPress={() => setActiveSubTab('journal')}
        >
          <LayersIcon color={activeSubTab === 'journal' ? '#fff' : theme.textMuted} size={14} />
          <Text style={[styles.subTabText, { color: activeSubTab === 'journal' ? '#fff' : theme.textSecondary }]}>Journal</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={accentHex} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {activeSubTab === 'accounts' && (
            <>
              <View style={styles.headerRow}>
                <Text style={[styles.title, { color: theme.text }]}>{t('accounts')}</Text>
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: accentHex }]} onPress={() => setAddAccountVisible(true)}>
                  <PlusIcon color="#fff" size={16} />
                  <Text style={styles.addBtnText}>{t('add_contact')}</Text>
                </TouchableOpacity>
              </View>

              {accounts.map((acc) => (
                <View key={acc._id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.codeTag}>{acc.code}</Text>
                    <Text style={[styles.accName, { color: theme.text }]}>{acc.name}</Text>
                    <View style={styles.typeBadge}>
                      <Text style={[styles.typeBadgeText, { color: accentHex }]}>{acc.type}</Text>
                    </View>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={[styles.subType, { color: theme.textSecondary }]}>{acc.subType}</Text>
                    <Text style={[styles.balance, { color: theme.text }]}>₹{(acc.balance || 0).toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {activeSubTab === 'trialBalance' && trialBalance && (
            <>
              <View style={styles.headerRow}>
                <Text style={[styles.title, { color: theme.text }]}>Trial Balance</Text>
                <View style={[styles.balancedBadge, trialBalance.isBalanced ? styles.badgeGreen : styles.badgeRed]}>
                  <Text style={styles.badgeText}>
                    {trialBalance.isBalanced ? 'BALANCED ✅' : 'UNBALANCED ⚠️'}
                  </Text>
                </View>
              </View>

              <View style={[styles.tbHeader, { backgroundColor: theme.card }]}>
                <Text style={[styles.tbCol, { color: theme.textSecondary }]}>Account</Text>
                <Text style={[styles.tbCol, { color: theme.textSecondary, textAlign: 'right' }]}>Debit (₹)</Text>
                <Text style={[styles.tbCol, { color: theme.textSecondary, textAlign: 'right' }]}>Credit (₹)</Text>
              </View>

              {(trialBalance.rows || []).map((row: any, idx: number) => (
                <View key={idx} style={[styles.tbRow, { borderColor: theme.cardBorder }]}>
                  <Text style={[styles.tbCell, { color: theme.text }]}>{row.code} - {row.name}</Text>
                  <Text style={[styles.tbCell, { color: theme.text, textAlign: 'right' }]}>{row.debit > 0 ? row.debit.toLocaleString('en-IN') : '-'}</Text>
                  <Text style={[styles.tbCell, { color: theme.text, textAlign: 'right' }]}>{row.credit > 0 ? row.credit.toLocaleString('en-IN') : '-'}</Text>
                </View>
              ))}

              <View style={[styles.tbFooter, { backgroundColor: theme.card }]}>
                <Text style={[styles.tbFooterText, { color: theme.text }]}>Total</Text>
                <Text style={[styles.tbFooterText, { color: theme.text, textAlign: 'right' }]}>₹{(trialBalance.totalDebit || 0).toLocaleString('en-IN')}</Text>
                <Text style={[styles.tbFooterText, { color: theme.text, textAlign: 'right' }]}>₹{(trialBalance.totalCredit || 0).toLocaleString('en-IN')}</Text>
              </View>
            </>
          )}

          {activeSubTab === 'statements' && statements && (
            <>
              {/* Income Statement */}
              <Text style={[styles.sectionTitle, { color: accentHex }]}>Income Statement (P&L)</Text>
              <View style={[styles.statementCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('total_income')}</Text>
                  <Text style={[styles.statVal, { color: theme.text }]}>₹{(statements.incomeStatement?.revenue || 0).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('total_expense')}</Text>
                  <Text style={[styles.statVal, { color: theme.text }]}>₹{(statements.incomeStatement?.expenses || 0).toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.statRow}>
                  <Text style={[styles.statLabelBold, { color: theme.text }]}>{t('net_profit')}</Text>
                  <Text style={[styles.statValBold, { color: accentHex }]}>₹{(statements.incomeStatement?.netIncome || 0).toLocaleString('en-IN')}</Text>
                </View>
              </View>

              {/* Balance Sheet */}
              <Text style={[styles.sectionTitle, { color: accentHex, marginTop: 16 }]}>Balance Sheet</Text>
              <View style={[styles.statementCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Assets</Text>
                  <Text style={[styles.statVal, { color: theme.text }]}>₹{(statements.balanceSheet?.assets || 0).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Liabilities</Text>
                  <Text style={[styles.statVal, { color: theme.text }]}>₹{(statements.balanceSheet?.liabilities || 0).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Equity</Text>
                  <Text style={[styles.statVal, { color: theme.text }]}>₹{(statements.balanceSheet?.equity || 0).toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </>
          )}

          {activeSubTab === 'journal' && (
            <>
              <View style={styles.headerRow}>
                <Text style={[styles.title, { color: theme.text }]}>General Journal</Text>
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: accentHex }]} onPress={() => setAddJournalVisible(true)}>
                  <PlusIcon color="#fff" size={16} />
                  <Text style={styles.addBtnText}>New Journal Entry</Text>
                </TouchableOpacity>
              </View>

              {journalEntries.map((je) => (
                <View key={je._id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.accName, { color: theme.text }]}>{je.description}</Text>
                    <Text style={[styles.dateText, { color: theme.textSecondary }]}>{je.date?.split('T')[0]}</Text>
                  </View>
                  <View style={[styles.linesCol, { borderColor: theme.cardBorder }]}>
                    {(je.lines || []).map((line: any, idx: number) => (
                      <View key={idx} style={styles.lineRow}>
                        <Text style={[styles.lineAcc, { color: theme.textSecondary }]}>{line.debit > 0 ? `Debit: Account #${line.accountId}` : `Credit: Account #${line.accountId}`}</Text>
                        <Text style={[styles.lineVal, { color: theme.text }]}>₹{(line.debit || line.credit).toLocaleString('en-IN')}</Text>
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
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Create General Ledger Account</Text>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Account Code</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.cardBorder, color: theme.text }]} placeholder="e.g. 1010" placeholderTextColor={theme.textMuted} value={accCode} onChangeText={setAccCode} />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Account Name</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.cardBorder, color: theme.text }]} placeholder="e.g. HDFC Checking Account" placeholderTextColor={theme.textMuted} value={accName} onChangeText={setAccName} />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Account Type</Text>
            <View style={styles.typeSelector}>
              {(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] as const).map((tType) => (
                <TouchableOpacity
                  key={tType}
                  style={[styles.typeChip, { backgroundColor: accType === tType ? accentHex : theme.bg, borderColor: theme.cardBorder }]}
                  onPress={() => setAccType(tType)}
                >
                  <Text style={[styles.typeChipText, { color: accType === tType ? '#fff' : theme.textSecondary }]}>{tType}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accentHex }]} onPress={handleCreateAccount}>
              <Text style={styles.saveBtnText}>Save Account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddAccountVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Journal Entry Modal */}
      <Modal visible={addJournalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Post Journal Entry</Text>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Description</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.cardBorder, color: theme.text }]} placeholder="e.g. Monthly rent payment" placeholderTextColor={theme.textMuted} value={jeDesc} onChangeText={setJeDesc} />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Debit Account</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accPicker}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc._id}
                  style={[styles.accChip, { backgroundColor: debitAccId === acc._id ? accentHex : theme.bg, borderColor: theme.cardBorder }]}
                  onPress={() => setDebitAccId(acc._id)}
                >
                  <Text style={[styles.accChipText, { color: debitAccId === acc._id ? '#fff' : theme.textSecondary }]}>{acc.code} - {acc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Credit Account</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accPicker}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc._id}
                  style={[styles.accChip, { backgroundColor: creditAccId === acc._id ? accentHex : theme.bg, borderColor: theme.cardBorder }]}
                  onPress={() => setCreditAccId(acc._id)}
                >
                  <Text style={[styles.accChipText, { color: creditAccId === acc._id ? '#fff' : theme.textSecondary }]}>{acc.code} - {acc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Amount (₹)</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.cardBorder, color: theme.text }]} placeholder="0.00" placeholderTextColor={theme.textMuted} keyboardType="numeric" value={jeAmount} onChangeText={setJeAmount} />

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accentHex }]} onPress={handleCreateJournalEntry}>
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
  container: { flex: 1 },
  subTabNav: { flexDirection: 'row', padding: 6, gap: 4, borderBottomWidth: 1 },
  subTabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 6, gap: 4 },
  subTabActive: {},
  subTabText: { fontSize: 11, fontWeight: '700' },
  subTabTextActive: { color: '#ffffff' },
  scrollContent: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, gap: 4 },
  addBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  card: { borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codeTag: { backgroundColor: '#15345f', color: '#4f8cff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 11, fontWeight: '700' },
  accName: { fontSize: 14, fontWeight: '700', flex: 1 },
  typeBadge: { backgroundColor: 'rgba(79,140,255,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  subType: { fontSize: 12 },
  balance: { fontSize: 14, fontWeight: '800' },
  tbHeader: { flexDirection: 'row', padding: 10, borderRadius: 6, marginBottom: 4 },
  tbCol: { fontSize: 12, fontWeight: '700', flex: 1 },
  tbRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1 },
  tbCell: { fontSize: 12, flex: 1 },
  tbFooter: { flexDirection: 'row', padding: 10, borderRadius: 6, marginTop: 8 },
  tbFooterText: { fontSize: 12, fontWeight: '800', flex: 1 },
  balancedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeGreen: { backgroundColor: 'rgba(46,204,113,0.2)' },
  badgeRed: { backgroundColor: 'rgba(255,107,107,0.2)' },
  badgeText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  statementCard: { borderRadius: 10, padding: 14, borderWidth: 1 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  statLabel: { fontSize: 13 },
  statVal: { fontSize: 13, fontWeight: '700' },
  statLabelBold: { fontSize: 14, fontWeight: '800' },
  statValBold: { fontSize: 15, fontWeight: '800' },
  divider: { height: 1, marginVertical: 8 },
  dateText: { fontSize: 11 },
  linesCol: { marginTop: 8, borderTopWidth: 1, paddingTop: 6 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  lineAcc: { fontSize: 12 },
  lineVal: { fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 16 },
  modalCard: { borderRadius: 12, padding: 16, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  label: { fontSize: 12, marginTop: 10, marginBottom: 4 },
  input: { padding: 10, borderRadius: 6, borderWidth: 1 },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 },
  typeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
  typeChipActive: {},
  typeChipText: { fontSize: 12, fontWeight: '600' },
  typeChipTextActive: { color: '#ffffff' },
  accPicker: { flexDirection: 'row', gap: 6, marginVertical: 4 },
  accChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, marginRight: 6 },
  accChipText: { fontSize: 11 },
  saveBtn: { paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#ffffff', fontWeight: '800' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  cancelBtnText: { color: '#ff6b6b', fontWeight: '700' },
});
