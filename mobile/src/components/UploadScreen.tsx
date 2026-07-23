import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import {
  UploadCloud,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Camera,
  Image as ImageIcon,
} from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

const UploadCloudIcon = UploadCloud as any;
const FileTextIcon = FileText as any;
const Trash2Icon = Trash2 as any;
const AlertCircleIcon = AlertCircle as any;
const CheckCircleIcon = CheckCircle as any;
const ChevronDownIcon = ChevronDown as any;
const CameraIcon = Camera as any;
const ImageIconComponent = ImageIcon as any;

import { BankReconciliationScreen } from './BankReconciliationScreen';

type UploadScreenProps = {
  uploads: any[];
  apiBaseUrl: string;
  authToken: string | null;
  loadingHistory: boolean;
  onRefreshData: () => void;
  activeWorkspaceId?: string;
  activeWorkspaceRole?: string;
};

type SubTabType = 'statement' | 'ocr' | 'reconcile';

export function UploadScreen({
  uploads,
  apiBaseUrl,
  authToken,
  loadingHistory,
  onRefreshData,
  activeWorkspaceId = 'personal',
  activeWorkspaceRole = 'owner',
}: UploadScreenProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('statement');
  
  // Statement Upload States
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  // CSV mapping overlay states
  const [mappingVisible, setMappingVisible] = useState(false);
  const [mappingState, setMappingState] = useState<{
    headers: string[];
    detectedMapping: Record<string, string>;
    fileAsset: any;
  } | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<Record<string, string>>({});
  const [activeDropdownField, setActiveDropdownField] = useState<string | null>(null);

  // Receipt OCR States
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [errorOcr, setErrorOcr] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const [savingOcr, setSavingOcr] = useState(false);

  // Categories list
  const CATEGORIES = ['Rent', 'Payroll', 'Utilities', 'Marketing', 'Travel', 'Office', 'Food', 'Other'];
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);

  // Document Picker for CSV / PDF Statements
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileAsset = result.assets[0];
      
      // Basic validation (No size limit restriction as requested)

      uploadFile(fileAsset);
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to select document.');
    }
  };

  // Perform statement upload
  const uploadFile = async (fileAsset: any, mappingParams?: Record<string, string>) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: fileAsset.uri,
        name: fileAsset.name,
        type: fileAsset.mimeType || (fileAsset.name.endsWith('.pdf') ? 'application/pdf' : 'text/csv'),
      } as any);

      let endpoint = '/upload';
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

      // CSV Column Mapping Required (HTTP 422)
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

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      Alert.alert(
        'Upload Success',
        `Imported ${data.imported} rows successfully${data.skipped > 0 ? `, ${data.skipped} skipped` : ''}.`
      );
      
      setMappingVisible(false);
      setMappingState(null);
      onRefreshData();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Upload Error', err.message || 'Server encountered an error during upload.');
    } finally {
      setUploading(false);
    }
  };

  // Submit CSV mapping details
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

  // Delete statement import
  const handleDeleteUpload = async (uploadId: string) => {
    Alert.alert(
      'Delete Upload',
      'This will delete all transactions associated with this file. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(uploadId);
            try {
              const res = await apiClient.delete(`/upload/${uploadId}`);
              if (!res.ok) throw new Error('Failed to delete upload');
              onRefreshData();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete upload.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  // Wipe database data
  const handleClearAll = async () => {
    Alert.alert(
      'Clear All Data',
      'This will wipe out ALL uploaded files and transactions. This cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setClearingAll(true);
            try {
              const res = await apiClient.delete('/upload');
              if (!res.ok) throw new Error('Failed to delete data');
              onRefreshData();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to clear database.');
            } finally {
              setClearingAll(false);
            }
          },
        },
      ]
    );
  };

  // Camera Receipt Capture
  const handleCaptureReceipt = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Camera permission is required to capture receipt images.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7, // Compress image to reduce upload size
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
      setOcrResult(null);
      setErrorOcr(null);
    }
  };

  // Image Library Picker
  const handlePickReceiptFromLibrary = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Gallery permission is required to select receipt images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
      setOcrResult(null);
      setErrorOcr(null);
    }
  };

  // Upload image to backend receipt OCR parser
  const handleScanReceipt = async () => {
    if (!selectedImage) return;

    setScanning(true);
    setErrorOcr(null);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedImage.uri,
        name: selectedImage.fileName || 'receipt.jpg',
        type: selectedImage.mimeType || 'image/jpeg',
      } as any);

      const res = await apiClient.upload('/upload/receipt', formData);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to scan receipt image.');
      }

      setOcrResult({
        date: data.date || new Date().toISOString().split('T')[0],
        description: data.description || '',
        category: data.category || 'Other',
        amount: String(data.amount || ''),
        type: data.type || 'expense',
      });
    } catch (err: any) {
      console.error(err);
      setErrorOcr(err.message || 'AI OCR parsing failed. Please verify connection.');
    } finally {
      setScanning(false);
    }
  };

  // Save the reviewed OCR details
  const handleSaveOcrTransaction = async () => {
    if (!ocrResult) return;

    const parsedAmount = parseFloat(ocrResult.amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please specify a positive numeric total amount.');
      return;
    }

    setSavingOcr(true);
    try {
      const res = await apiClient.post('/dashboard/transactions', {
        date: ocrResult.date,
        description: ocrResult.description || ocrResult.category,
        category: ocrResult.category,
        amount: parsedAmount,
        type: ocrResult.type,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to record transaction');
      }

      Alert.alert('Success', 'Receipt transaction saved successfully!');
      setSelectedImage(null);
      setOcrResult(null);
      onRefreshData();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to record transaction.');
    } finally {
      setSavingOcr(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Segmented Sub Tabs */}
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'statement' && styles.subTabActive]}
          onPress={() => setActiveSubTab('statement')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'statement' && styles.subTabTextActive]}>
            Statements Import
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'ocr' && styles.subTabActive]}
          onPress={() => setActiveSubTab('ocr')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'ocr' && styles.subTabTextActive]}>
            Receipt OCR
          </Text>
        </TouchableOpacity>

        {activeWorkspaceId !== 'personal' && ['owner', 'partner', 'accountant'].includes(activeWorkspaceRole || '') && (
          <TouchableOpacity
            style={[styles.subTab, activeSubTab === 'reconcile' && styles.subTabActive]}
            onPress={() => setActiveSubTab('reconcile')}
          >
            <Text style={[styles.subTabText, activeSubTab === 'reconcile' && styles.subTabTextActive]}>
              Reconciliation
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {activeSubTab === 'reconcile' ? (
        <BankReconciliationScreen
          apiBaseUrl={apiBaseUrl}
          authToken={authToken}
          activeWorkspaceId={activeWorkspaceId}
          onRefreshData={onRefreshData}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeSubTab === 'statement' ? (
          <>
            {/* Import Statement */}
            <View style={styles.uploadCard}>
              <Text style={styles.cardTitle}>Import Statements</Text>
              <Text style={styles.cardDesc}>
                Upload your bank statements in .csv or .pdf format. PDF statements will be processed automatically using Gemini AI.
              </Text>

              <TouchableOpacity
                style={[styles.uploadBox, uploading && styles.uploadBoxDisabled]}
                onPress={handlePickDocument}
                disabled={uploading}
              >
                {uploading ? (
                  <View style={styles.loadingCenter}>
                    <ActivityIndicator color="#4f8cff" size="large" />
                    <Text style={styles.uploadProgressText}>Uploading & parsing file...</Text>
                  </View>
                ) : (
                  <>
                    <UploadCloudIcon color="#4f8cff" size={48} style={{ marginBottom: 12 }} />
                    <Text style={styles.uploadBoxText}>Tap to pick CSV or PDF Statement</Text>
                    <Text style={styles.uploadBoxSubtext}>Max size: 10MB</Text>
                  </>
                )}
              </TouchableOpacity>

              {uploads.length > 0 && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={handleClearAll}
                  disabled={clearingAll}
                >
                  {clearingAll ? (
                    <ActivityIndicator color="#ff6b6b" size="small" />
                  ) : (
                    <>
                      <Trash2Icon color="#ff6b6b" size={16} style={{ marginRight: 6 }} />
                      <Text style={styles.clearBtnText}>Clear All Data</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* History List */}
            <View style={styles.historyContainer}>
              <Text style={styles.sectionTitle}>Import History</Text>
              
              {loadingHistory ? (
                <ActivityIndicator color="#4f8cff" size="small" style={{ marginTop: 20 }} />
              ) : uploads.length > 0 ? (
                <View style={{ height: 300 }}>
                  <FlatList
                    data={uploads}
                    keyExtractor={(item) => item._id || item.id}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                      const uploadId = item.uploadId;
                      const dateStr = item.uploadedAt 
                        ? new Date(item.uploadedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Unknown';

                      return (
                        <View style={styles.historyRow}>
                          <View style={styles.fileIconBox}>
                            <FileTextIcon color="#4f8cff" size={18} />
                          </View>

                          <View style={styles.fileDetails}>
                            <Text style={styles.fileName} numberOfLines={1}>
                              {item.filename || 'bank_statement.csv'}
                            </Text>
                            <Text style={styles.fileMeta}>
                              {item.rowCount} rows · {dateStr}
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleDeleteUpload(uploadId)}
                            disabled={deletingId === uploadId}
                          >
                            {deletingId === uploadId ? (
                              <ActivityIndicator size="small" color="#ff6b6b" />
                            ) : (
                              <Trash2Icon color="#ff8f8f" size={16} />
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                    }}
                  />
                </View>
              ) : (
                <View style={styles.emptyHistory}>
                  <AlertCircleIcon color="#a6bedf" size={24} style={{ marginBottom: 8 }} />
                  <Text style={styles.emptyHistoryText}>No statement imports recorded.</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          /* Receipt Scanner Sub Tab */
          <View style={styles.ocrContainer}>
            <View style={styles.uploadCard}>
              <Text style={styles.cardTitle}>Receipt OCR Scanner</Text>
              <Text style={styles.cardDesc}>
                Take a picture of your business purchase receipt. Gemini AI will analyze, categorize, and extract transaction details.
              </Text>

              {/* Photo Options */}
              <View style={styles.photoActions}>
                <TouchableOpacity style={styles.photoBtn} onPress={handleCaptureReceipt}>
                  <CameraIcon color="#ffffff" size={20} style={{ marginRight: 8 }} />
                  <Text style={styles.photoBtnText}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.photoBtn, styles.galleryBtn]} onPress={handlePickReceiptFromLibrary}>
                  <ImageIconComponent color="#4f8cff" size={20} style={{ marginRight: 8 }} />
                  <Text style={styles.galleryBtnText}>Gallery</Text>
                </TouchableOpacity>
              </View>

              {/* Image Preview Box */}
              {selectedImage && (
                <View style={styles.previewBox}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                  
                  {!ocrResult && !scanning && (
                    <TouchableOpacity style={styles.scanBtn} onPress={handleScanReceipt}>
                      <Text style={styles.scanBtnText}>Scan with Gemini AI</Text>
                    </TouchableOpacity>
                  )}

                  {scanning && (
                    <View style={styles.scanningOverlay}>
                      <ActivityIndicator color="#4f8cff" size="large" />
                      <Text style={styles.scanningText}>Gemini AI is reading receipt...</Text>
                    </View>
                  )}

                  {errorOcr && (
                    <View style={styles.ocrErrorBox}>
                      <AlertCircleIcon color="#ff6b6b" size={16} style={{ marginRight: 6 }} />
                      <Text style={styles.ocrErrorText}>{errorOcr}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* OCR Extracted Result Review */}
            {ocrResult && (
              <View style={styles.reviewCard}>
                <Text style={styles.reviewTitle}>Review Extracted Data</Text>
                <Text style={styles.reviewSubtitle}>Verify details before saving to ledger.</Text>

                <View style={styles.reviewField}>
                  <Text style={styles.fieldLabel}>Merchant / Vendor</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={ocrResult.description}
                    onChangeText={(t) => setOcrResult({ ...ocrResult, description: t })}
                    placeholder="Merchant name"
                    placeholderTextColor="#5f88b8"
                  />
                </View>

                <View style={styles.reviewField}>
                  <Text style={styles.fieldLabel}>Amount (₹)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={ocrResult.amount}
                    onChangeText={(t) => setOcrResult({ ...ocrResult, amount: t })}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#5f88b8"
                  />
                </View>

                <View style={styles.reviewField}>
                  <Text style={styles.fieldLabel}>Category</Text>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setCategoryDropdownVisible(!categoryDropdownVisible)}
                  >
                    <Text style={styles.dropdownValue}>{ocrResult.category}</Text>
                    <ChevronDownIcon color="#a6bedf" size={18} />
                  </TouchableOpacity>

                  {categoryDropdownVisible && (
                    <View style={styles.catDropdownList}>
                      {CATEGORIES.map((cat, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.catOption}
                          onPress={() => {
                            setOcrResult({ ...ocrResult, category: cat });
                            setCategoryDropdownVisible(false);
                          }}
                        >
                          <Text style={styles.catOptionText}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.reviewField}>
                  <Text style={styles.fieldLabel}>Date</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={ocrResult.date}
                    onChangeText={(t) => setOcrResult({ ...ocrResult, date: t })}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#5f88b8"
                  />
                </View>

                {/* Confirm Save Actions */}
                <TouchableOpacity
                  style={[styles.saveOcrBtn, savingOcr && styles.saveOcrBtnDisabled]}
                  onPress={handleSaveOcrTransaction}
                  disabled={savingOcr}
                >
                  {savingOcr ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.saveOcrBtnText}>Confirm & Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      )}

      {/* CSV Mapping Modal */}
      {mappingState && (
        <Modal
          visible={mappingVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setMappingVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.mappingCard}>
              <Text style={styles.mappingTitle}>Map CSV Columns</Text>
              <Text style={styles.mappingDesc}>
                We couldn't auto-detect your CSV format. Please match our fields with your CSV columns:
              </Text>

              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {['date', 'description', 'category', 'amount', 'type', 'debit', 'credit'].map((field) => {
                  const label = field.charAt(0).toUpperCase() + field.slice(1);
                  const subLabel = field === 'debit' || field === 'credit' 
                    ? '(Optional - splits columns)' 
                    : field === 'category' || field === 'type' || field === 'description'
                    ? '(Optional - has fallbacks)'
                    : '(Required)';

                  return (
                    <View key={field} style={styles.mappingRow}>
                      <View style={styles.mappingFieldLabelCol}>
                        <Text style={styles.mappingFieldLabel}>{label}</Text>
                        <Text style={styles.mappingFieldSub}>{subLabel}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.selectBox}
                        onPress={() => setActiveDropdownField(activeDropdownField === field ? null : field)}
                      >
                        <Text style={styles.selectBoxText} numberOfLines={1}>
                          {selectedMapping[field] || 'Choose Column...'}
                        </Text>
                        <ChevronDownIcon color="#a6bedf" size={16} />
                      </TouchableOpacity>

                      {activeDropdownField === field && (
                        <View style={styles.dropdownOptions}>
                          <TouchableOpacity
                            style={styles.dropdownOption}
                            onPress={() => {
                              setSelectedMapping({ ...selectedMapping, [field]: '' });
                              setActiveDropdownField(null);
                            }}
                          >
                            <Text style={styles.dropdownOptionTextSkip}>[ Skip field ]</Text>
                          </TouchableOpacity>

                          {mappingState.headers.map((h, hIdx) => (
                            <TouchableOpacity
                              key={hIdx}
                              style={styles.dropdownOption}
                              onPress={() => {
                                setSelectedMapping({ ...selectedMapping, [field]: h });
                                setActiveDropdownField(null);
                              }}
                            >
                              <Text style={styles.dropdownOptionText}>{h}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.mappingActions}>
                <TouchableOpacity
                  style={[styles.mapBtn, styles.cancelMapBtn]}
                  onPress={() => {
                    setMappingVisible(false);
                    setMappingState(null);
                  }}
                >
                  <Text style={styles.cancelMapBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mapBtn, styles.submitMapBtn]}
                  onPress={handleSubmitMapping}
                >
                  <Text style={styles.submitMapBtnText}>Confirm Columns</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06111f',
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#0b1d38',
    borderBottomWidth: 1,
    borderBottomColor: '#15345f',
    height: 48,
  },
  subTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4f8cff',
  },
  subTabText: {
    color: '#8fc0ff',
    fontSize: 13,
    fontWeight: '600',
  },
  subTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  uploadCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  cardDesc: {
    fontSize: 12,
    color: '#a6bedf',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 16,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: '#15345f',
    borderStyle: 'dashed',
    borderRadius: 14,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06111f',
    marginBottom: 16,
  },
  uploadBoxDisabled: {
    opacity: 0.6,
  },
  uploadBoxText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  uploadBoxSubtext: {
    color: '#8fc0ff',
    fontSize: 11,
    marginTop: 4,
  },
  loadingCenter: {
    alignItems: 'center',
  },
  uploadProgressText: {
    color: '#8fc0ff',
    fontSize: 12,
    marginTop: 10,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.2)',
  },
  clearBtnText: {
    color: '#ff6b6b',
    fontSize: 13,
    fontWeight: '700',
  },
  historyContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  emptyHistory: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 30,
    alignItems: 'center',
  },
  emptyHistoryText: {
    color: '#a6bedf',
    fontSize: 13,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b1d38',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#15345f',
  },
  fileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#06111f',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  fileMeta: {
    color: '#8fc0ff',
    fontSize: 11,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3,8,16,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mappingCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderWidth: 1,
    borderColor: '#15345f',
  },
  mappingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  mappingDesc: {
    fontSize: 12,
    color: '#a6bedf',
    lineHeight: 18,
    marginBottom: 16,
  },
  mappingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#06111f',
    paddingVertical: 12,
    position: 'relative',
    zIndex: 1,
  },
  mappingFieldLabelCol: {
    flex: 0.9,
  },
  mappingFieldLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  mappingFieldSub: {
    color: '#8fc0ff',
    fontSize: 10,
    marginTop: 2,
  },
  selectBox: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  selectBoxText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    marginRight: 6,
  },
  dropdownOptions: {
    position: 'absolute',
    top: 50,
    right: 0,
    width: 180,
    maxHeight: 180,
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#4f8cff',
    borderRadius: 10,
    zIndex: 100,
    elevation: 6,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#15345f',
  },
  dropdownOptionTextSkip: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '600',
  },
  dropdownOptionText: {
    color: '#c3d6f3',
    fontSize: 12,
    fontWeight: '500',
  },
  mappingActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  mapBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelMapBtn: {
    borderWidth: 1,
    borderColor: '#15345f',
  },
  cancelMapBtnText: {
    color: '#a6bedf',
    fontSize: 14,
    fontWeight: '600',
  },
  submitMapBtn: {
    backgroundColor: '#4f8cff',
  },
  submitMapBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  ocrContainer: {
    width: '100%',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#4f8cff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  galleryBtn: {
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
  },
  galleryBtnText: {
    color: '#4f8cff',
    fontWeight: '700',
    fontSize: 14,
  },
  previewBox: {
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    backgroundColor: '#000000',
    resizeMode: 'contain',
  },
  scanBtn: {
    backgroundColor: '#4f8cff',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  scanBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 17, 31, 0.85)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  scanningText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  ocrErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#380b0b',
    borderColor: '#5f1515',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    width: '100%',
  },
  ocrErrorText: {
    color: '#ff8f8f',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  reviewCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 20,
    marginTop: 20,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  reviewSubtitle: {
    fontSize: 11,
    color: '#a6bedf',
    marginTop: 2,
    marginBottom: 16,
  },
  reviewField: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#8fc0ff',
    fontWeight: '600',
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
    borderRadius: 10,
    color: '#ffffff',
    fontSize: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  dropdownValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  catDropdownList: {
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
  },
  catOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#15345f',
  },
  catOptionText: {
    color: '#c3d6f3',
    fontSize: 13,
    fontWeight: '500',
  },
  saveOcrBtn: {
    backgroundColor: '#2ecc71',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  saveOcrBtnDisabled: {
    opacity: 0.6,
  },
  saveOcrBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
