import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import {
  UploadCloud,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  RefreshCw,
  PlusCircle,
  HelpCircle,
} from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';
import * as DocumentPicker from 'expo-document-picker';

const UploadCloudIcon = UploadCloud as any;
const CheckCircleIcon = CheckCircle as any;
const XCircleIcon = XCircle as any;
const AlertTriangleIcon = AlertTriangle as any;
const ChevronDownIcon = ChevronDown as any;
const RefreshCwIcon = RefreshCw as any;
const PlusCircleIcon = PlusCircle as any;
const HelpCircleIcon = HelpCircle as any;

type BankReconciliationScreenProps = {
  apiBaseUrl: string;
  authToken: string | null;
  activeWorkspaceId?: string;
  onRefreshData?: () => void;
};

const CATEGORIES = ['Rent', 'Payroll', 'Utilities', 'Marketing', 'Sales', 'Consulting', 'Software', 'Travel', 'Office', 'Other'];

export function BankReconciliationScreen({
  apiBaseUrl,
  authToken,
  activeWorkspaceId = 'personal',
  onRefreshData,
}: BankReconciliationScreenProps) {
  const [bankTransactions, setBankTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [mappingVisible, setMappingVisible] = useState(false);
  const [mappingState, setMappingState] = useState<{
    headers: string[];
    detectedMapping: Record<string, string>;
    fileAsset: any;
  } | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<Record<string, string>>({});
  const [activeDropdownField, setActiveDropdownField] = useState<string | null>(null);

  // Manual create state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Other');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const fetchBankTransactions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/bank-transactions?status=unmatched');
      if (res.ok) {
        setBankTransactions(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch bank transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankTransactions();
    setSelectedTx(null);
    setMatches([]);
  }, [activeWorkspaceId]);

  const loadMatches = async (txId: string) => {
    setLoadingMatches(true);
    try {
      const res = await apiClient.get(`/bank-transactions/${txId}/matches`);
      if (res.ok) {
        setMatches(await res.json());
      }
    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleSelectTx = (tx: any) => {
    setSelectedTx(tx);
    loadMatches(tx.id || tx._id);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileAsset = result.assets[0];
      uploadFile(fileAsset);
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to select bank statement.');
    }
  };

  const uploadFile = async (fileAsset: any, mappingParams?: Record<string, string>) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: fileAsset.uri,
        name: fileAsset.name,
        type: fileAsset.mimeType || 'text/csv',
      } as any);

      let endpoint = '/bank-transactions/import';
      if (mappingParams) {
        const queryParams = new URLSearchParams();
        queryParams.append('mappingConfirmed', 'true');
        Object.entries(mappingParams).forEach(([k, v]) => {
          if (v) queryParams.append(k, v);
        });
        endpoint += `?${queryParams.toString()}`;
      }

      const res = await apiClient.upload(endpoint, formData);
      const data = await res.json().catch(() => ({}));

      if (res.status === 422 && data.needsMapping) {
        setMappingState({
          headers: data.headers || [],
          detectedMapping: data.detectedMapping || {},
          fileAsset,
        });
        const initialMapping: Record<string, string> = {};
        const fields = ['date', 'description', 'category', 'amount', 'type', 'debit', 'credit'];
        fields.forEach(f => {
          initialMapping[f] = data.detectedMapping?.[f] || '';
        });
        setSelectedMapping(initialMapping);
        setMappingVisible(true);
        setUploading(false);
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Statement upload failed');

      Alert.alert('Import Complete', `Successfully imported ${data.count} bank statement entries.`);
      setMappingVisible(false);
      setMappingState(null);
      fetchBankTransactions();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      Alert.alert('Upload Error', err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitMapping = () => {
    if (!mappingState) return;
    if (!selectedMapping.date) {
      Alert.alert('Required Field', 'Please map the Date field.');
      return;
    }
    if (!selectedMapping.amount && !selectedMapping.credit && !selectedMapping.debit) {
      Alert.alert('Required Field', 'Please map either Amount, or Credit & Debit columns.');
      return;
    }
    uploadFile(mappingState.fileAsset, selectedMapping);
  };

  const handleConfirmMatch = async (ledgerId: string) => {
    if (!selectedTx) return;
    const txId = selectedTx.id || selectedTx._id;
    try {
      const res = await apiClient.post(`/bank-transactions/${txId}/reconcile`, {
        ledgerTransactionId: ledgerId
      });
      if (res.ok) {
        Alert.alert('Matched', 'Transaction reconciled successfully.');
        setSelectedTx(null);
        setMatches([]);
        fetchBankTransactions();
        if (onRefreshData) onRefreshData();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to reconcile.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleCreateAndReconcile = async () => {
    if (!selectedTx) return;
    const txId = selectedTx.id || selectedTx._id;
    try {
      const res = await apiClient.post(`/bank-transactions/${txId}/create-and-reconcile`, {
        category: selectedCategory
      });
      if (res.ok) {
        Alert.alert('Reconciled', 'Created ledger transaction and matched.');
        setCreateModalVisible(false);
        setSelectedTx(null);
        setMatches([]);
        fetchBankTransactions();
        if (onRefreshData) onRefreshData();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to reconcile.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleIgnore = async () => {
    if (!selectedTx) return;
    const txId = selectedTx.id || selectedTx._id;
    try {
      const res = await apiClient.post(`/bank-transactions/${txId}/ignore`);
      if (res.ok) {
        Alert.alert('Ignored', 'Bank statement transaction ignored.');
        setSelectedTx(null);
        setMatches([]);
        fetchBankTransactions();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Upload Statement Card */}
        <View style={styles.uploadCard}>
          <Text style={styles.uploadTitle}>Import Bank Statement</Text>
          <Text style={styles.uploadSub}>Upload your monthly statement to reconcile with your HisabHero records</Text>
          
          <TouchableOpacity 
            style={styles.uploadBtn} 
            onPress={handlePickDocument}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <UploadCloudIcon color="#ffffff" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.uploadBtnText}>Choose CSV Statement</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Unreconciled Bank Transactions</Text>
          <TouchableOpacity onPress={fetchBankTransactions} style={styles.refreshBtn}>
            <RefreshCwIcon color="#8fc0ff" size={16} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#4f8cff" size="large" style={{ marginTop: 24 }} />
        ) : bankTransactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <CheckCircleIcon color="#2ecc71" size={32} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>All caught up! 🎉</Text>
            <Text style={styles.emptySub}>No unreconciled bank transactions found.</Text>
          </View>
        ) : (
          <View style={styles.layoutContainer}>
            {/* Unmatched list */}
            <View style={styles.listContainer}>
              {bankTransactions.map(tx => {
                const isSelected = selectedTx && (selectedTx.id || selectedTx._id) === (tx.id || tx._id);
                const isCredit = tx.type === 'credit';
                return (
                  <TouchableOpacity
                    key={tx.id || tx._id}
                    style={[styles.txCard, isSelected && styles.txCardSelected]}
                    onPress={() => handleSelectTx(tx)}
                  >
                    <View style={styles.txHeader}>
                      <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                      <Text style={[styles.txAmount, isCredit ? styles.colorGreen : styles.colorRed]}>
                        {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Text style={styles.txMeta}>Date: {tx.date} • Suggestion: {tx.aiSuggestedCategory}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Split reconciliation window */}
            {selectedTx && (
              <View style={styles.matchingPane}>
                <Text style={styles.paneTitle}>Reconcile Transaction</Text>
                <View style={styles.selectedDetailsCard}>
                  <Text style={styles.detailsDesc}>{selectedTx.description}</Text>
                  <Text style={styles.detailsSub}>Date: {selectedTx.date} • Amount: ₹{selectedTx.amount.toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.matchesHeader}>
                  <Text style={styles.matchesTitle}>Potential Matches</Text>
                </View>

                {loadingMatches ? (
                  <ActivityIndicator color="#4f8cff" size="small" style={{ marginVertical: 12 }} />
                ) : matches.length > 0 ? (
                  matches.map(m => (
                    <View key={m.transaction.id} style={styles.matchRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.matchDesc}>{m.transaction.description}</Text>
                        <Text style={styles.matchSub}>
                          Date: {m.transaction.date} • Category: {m.transaction.category} 
                          {m.matchType === 'exact' ? ' • Exact Match ✅' : ' • Close Match ⚠️'}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.confirmMatchBtn}
                        onPress={() => handleConfirmMatch(m.transaction.id)}
                      >
                        <Text style={styles.confirmMatchBtnText}>Match</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <View style={styles.noMatchCard}>
                    <AlertTriangleIcon color="#f39c12" size={18} style={{ marginRight: 6 }} />
                    <Text style={styles.noMatchText}>No matching ledger entries found.</Text>
                  </View>
                )}

                <View style={styles.paneActions}>
                  <TouchableOpacity style={styles.ignoreBtn} onPress={handleIgnore}>
                    <XCircleIcon color="#ff6b6b" size={14} style={{ marginRight: 4 }} />
                    <Text style={styles.ignoreBtnText}>Ignore</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.createBtn}
                    onPress={() => {
                      setSelectedCategory(selectedTx.aiSuggestedCategory || 'Other');
                      setCreateModalVisible(true);
                    }}
                  >
                    <PlusCircleIcon color="#ffffff" size={14} style={{ marginRight: 4 }} />
                    <Text style={styles.createBtnText}>Create Ledger Entry</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* CSV Column Mapping Modal */}
      <Modal
        visible={mappingVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMappingVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Map CSV Columns</Text>
            <Text style={styles.modalSub}>Select which columns correspond to the transaction fields:</Text>
            
            <ScrollView style={{ maxHeight: 300, marginBottom: 12 }}>
              {mappingState && ['date', 'description', 'amount'].map(field => {
                const mappedVal = selectedMapping[field] || '';
                return (
                  <View key={field} style={styles.mappingRow}>
                    <Text style={styles.mappingField}>{field.toUpperCase()}:</Text>
                    <TouchableOpacity 
                      style={styles.dropdownBtn}
                      onPress={() => setActiveDropdownField(activeDropdownField === field ? null : field)}
                    >
                      <Text style={styles.dropdownBtnText}>{mappedVal || 'Select Column...'}</Text>
                      <ChevronDownIcon color="#8fc0ff" size={16} />
                    </TouchableOpacity>
                    
                    {activeDropdownField === field && (
                      <View style={styles.dropdownList}>
                        {mappingState.headers.map(h => (
                          <TouchableOpacity
                            key={h}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setSelectedMapping({ ...selectedMapping, [field]: h });
                              setActiveDropdownField(null);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{h}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setMappingVisible(false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={handleSubmitMapping}>
                <Text style={styles.btnConfirmText}>Confirm & Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Ledger entry modal */}
      <Modal
        visible={createModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <Text style={styles.modalSub}>Choose a ledger category for this transaction entry:</Text>
            
            <TouchableOpacity 
              style={styles.categorySelector}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <Text style={styles.categorySelectorText}>{selectedCategory}</Text>
              <ChevronDownIcon color="#4f8cff" size={18} />
            </TouchableOpacity>

            {showCategoryDropdown && (
              <ScrollView style={styles.categoryScroll}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={styles.categoryItem}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text style={styles.categoryItemText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={handleCreateAndReconcile}>
                <Text style={styles.btnConfirmText}>Create & Match</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#06111f',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  uploadCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  uploadTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  uploadSub: {
    color: '#8fc0ff',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  uploadBtn: {
    backgroundColor: '#4f8cff',
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  uploadBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#0b1d38',
  },
  emptyCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    color: '#a6bedf',
    fontSize: 12,
    marginTop: 4,
  },
  layoutContainer: {
    gap: 16,
  },
  listContainer: {
    gap: 10,
  },
  txCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 14,
  },
  txCardSelected: {
    borderColor: '#4f8cff',
    backgroundColor: 'rgba(79, 140, 255, 0.05)',
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txDesc: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  txMeta: {
    color: '#8fc0ff',
    fontSize: 10,
    marginTop: 6,
  },
  matchingPane: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4f8cff',
    padding: 16,
    marginTop: 10,
  },
  paneTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  selectedDetailsCard: {
    backgroundColor: '#06111f',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  detailsDesc: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  detailsSub: {
    color: '#a6bedf',
    fontSize: 11,
    marginTop: 4,
  },
  matchesHeader: {
    borderTopWidth: 1,
    borderTopColor: '#15345f',
    paddingTop: 12,
    marginBottom: 10,
  },
  matchesTitle: {
    color: '#8fc0ff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(46, 204, 113, 0.05)',
    borderColor: 'rgba(46, 204, 113, 0.2)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  matchDesc: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  matchSub: {
    color: '#a6bedf',
    fontSize: 10,
    marginTop: 2,
  },
  confirmMatchBtn: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  confirmMatchBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  noMatchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 156, 18, 0.05)',
    borderColor: 'rgba(243, 156, 18, 0.2)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  noMatchText: {
    color: '#f39c12',
    fontSize: 11,
  },
  paneActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 6,
  },
  ignoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ff6b6b',
    borderRadius: 10,
    height: 38,
    flex: 1,
  },
  ignoreBtnText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '700',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f8cff',
    borderRadius: 10,
    height: 38,
    flex: 2,
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  colorGreen: {
    color: '#2ecc71',
  },
  colorRed: {
    color: '#ff6b6b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3,8,16,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#15345f',
    width: '100%',
    maxWidth: 360,
    padding: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 12,
    color: '#a6bedf',
    marginBottom: 16,
    lineHeight: 18,
  },
  mappingRow: {
    marginBottom: 12,
  },
  mappingField: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#06111f',
    borderColor: '#15345f',
    borderWidth: 1,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
  },
  dropdownBtnText: {
    color: '#ffffff',
    fontSize: 12,
  },
  dropdownList: {
    backgroundColor: '#06111f',
    borderColor: '#15345f',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    padding: 4,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    color: '#a6bedf',
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    borderWidth: 1,
    borderColor: '#15345f',
  },
  btnCancelText: {
    color: '#a6bedf',
    fontSize: 12,
    fontWeight: '600',
  },
  btnConfirm: {
    backgroundColor: '#4f8cff',
  },
  btnConfirmText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#06111f',
    borderColor: '#15345f',
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categorySelectorText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryScroll: {
    maxHeight: 200,
    backgroundColor: '#06111f',
    borderColor: '#15345f',
    borderWidth: 1,
    borderRadius: 12,
    padding: 6,
    marginBottom: 16,
  },
  categoryItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  categoryItemText: {
    color: '#a6bedf',
    fontSize: 13,
  },
});
