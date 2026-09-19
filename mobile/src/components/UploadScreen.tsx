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
  Platform,
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
  Sparkles,
  ShieldAlert,
  Check,
  X,
  Edit2,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';
import { useTheme } from '../theme/themeSystem';
import { useTranslation } from '../theme/i18n';
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
const SparklesIcon = Sparkles as any;
const ShieldAlertIcon = ShieldAlert as any;
const CheckIcon = Check as any;
const XIcon = X as any;
const Edit2Icon = Edit2 as any;
const ArrowDownRightIcon = ArrowDownRight as any;
const ArrowUpRightIcon = ArrowUpRight as any;

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
  const { theme, accentHex } = useTheme();
  const { t } = useTranslation();
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

  // Document Intelligence Pipeline States
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [activeDocument, setActiveDocument] = useState<any>(null);
  const [processingStep, setProcessingStep] = useState<'uploading' | 'analyzing' | 'extracting' | 'validating' | 'ready'>('uploading');
  const [committing, setCommitting] = useState(false);

  // Document Picker for CSV / PDF / Image Financial Documents
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileAsset = result.assets[0];
      uploadDocumentIntelligence(fileAsset);
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to select document.');
    }
  };

  // Perform Document Intelligence upload & analysis
  const uploadDocumentIntelligence = async (fileAsset: any) => {
    setUploading(true);
    setProcessingStep('uploading');

    try {
      setTimeout(() => setProcessingStep('analyzing'), 600);
      setTimeout(() => setProcessingStep('extracting'), 1400);
      setTimeout(() => setProcessingStep('validating'), 2400);

      const formData = new FormData();
      const fileName = fileAsset.name || fileAsset.fileName || 'statement.pdf';

      if (Platform.OS === 'web') {
        if (fileAsset.file) {
          formData.append('file', fileAsset.file);
        } else if (fileAsset.uri && (fileAsset.uri.startsWith('blob:') || fileAsset.uri.startsWith('data:'))) {
          const blob = await fetch(fileAsset.uri).then((r) => r.blob());
          formData.append('file', blob, fileName);
        } else {
          formData.append('file', {
            uri: fileAsset.uri,
            name: fileName,
            type: fileAsset.mimeType || 'application/pdf',
          } as any);
        }
      } else {
        formData.append('file', {
          uri: fileAsset.uri,
          name: fileName,
          type: fileAsset.mimeType || 'application/octet-stream',
        } as any);
      }

      const res = await apiClient.upload('/upload/intelligence', formData);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Document Intelligence processing failed');
      }

      const rawExtracted = data.document?.extractedTransactions || data.transactions || [];
      const formattedDoc = {
        documentId: data.document?.documentId || data.documentId || `doc_${Date.now()}`,
        fileName: data.document?.fileName || data.fileName || fileName,
        parserUsed: data.document?.parserUsed || data.parserUsed || 'Statement Parser',
        extractedTransactions: rawExtracted.map((t: any, idx: number) => ({
          ...t,
          approved: t.approved !== false && !t.isDuplicate,
          tempId: t.tempId || `tmp_${Date.now()}_${idx}`,
        }))
      };

      setProcessingStep('ready');
      setActiveDocument(formattedDoc);
      setReviewModalVisible(true);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Processing Failed ❌', err.message || 'Server encountered an error during document analysis.');
    } finally {
      setUploading(false);
    }
  };

  // Toggle transaction approval
  const handleToggleRowApprove = (index: number) => {
    if (!activeDocument || !activeDocument.extractedTransactions) return;
    const updated = [...activeDocument.extractedTransactions];
    updated[index].approved = !updated[index].approved;
    setActiveDocument({ ...activeDocument, extractedTransactions: updated });
  };

  // Update transaction field
  const handleUpdateRowField = (index: number, field: string, value: any) => {
    if (!activeDocument || !activeDocument.extractedTransactions) return;
    const updated = [...activeDocument.extractedTransactions];
    updated[index][field] = value;
    updated[index].userEdited = true;
    setActiveDocument({ ...activeDocument, extractedTransactions: updated });
  };

  // Approve all high confidence rows
  const handleApproveHighConfidence = () => {
    if (!activeDocument || !activeDocument.extractedTransactions) return;
    const updated = activeDocument.extractedTransactions.map((t: any) => ({
      ...t,
      approved: (t.confidenceScore === undefined || t.confidenceScore >= 0.85) && !t.isDuplicate
    }));
    setActiveDocument({ ...activeDocument, extractedTransactions: updated });
  };

  // Save Approved Transactions to Ledger
  const handleCommitDocument = async () => {
    if (!activeDocument) return;
    setCommitting(true);
    try {
      const approvedTxs = (activeDocument.extractedTransactions || []).filter((t: any) => t.approved !== false);
      const res = await apiClient.post('/upload/commit', {
        fileName: activeDocument.fileName || 'Uploaded Statement',
        parserUsed: activeDocument.parserUsed || 'Statement Parser',
        transactions: approvedTxs.length > 0 ? approvedTxs : activeDocument.extractedTransactions,
        merchantRules: []
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        Alert.alert(
          'Import Complete 🎉',
          `${data.importedCount || data.count || approvedTxs.length} verified transactions saved to your ledger! Financial dashboards and cash flow metrics have been updated.`
        );
        setReviewModalVisible(false);
        setActiveDocument(null);
        onRefreshData();
      } else {
        Alert.alert('Import Error', data.error || 'Failed to commit transactions.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to connect to backend.');
    } finally {
      setCommitting(false);
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

    uploadDocumentIntelligence(mappingState.fileAsset);
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
      const fileName = selectedImage.fileName || 'receipt.jpg';

      if (Platform.OS === 'web') {
        if (selectedImage.file) {
          formData.append('file', selectedImage.file);
        } else if (selectedImage.uri && (selectedImage.uri.startsWith('blob:') || selectedImage.uri.startsWith('data:'))) {
          const blob = await fetch(selectedImage.uri).then((r) => r.blob());
          formData.append('file', blob, fileName);
        } else {
          formData.append('file', {
            uri: selectedImage.uri,
            name: fileName,
            type: selectedImage.mimeType || 'image/jpeg',
          } as any);
        }
      } else {
        formData.append('file', {
          uri: selectedImage.uri,
          name: fileName,
          type: selectedImage.mimeType || 'image/jpeg',
        } as any);
      }

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
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Segmented Sub Tabs */}
      <View style={[styles.subTabBar, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'statement' && { borderBottomWidth: 2, borderBottomColor: accentHex }]}
          onPress={() => setActiveSubTab('statement')}
        >
          <Text style={[styles.subTabText, { color: activeSubTab === 'statement' ? theme.text : theme.textSecondary }]}>
            Statements Import
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'ocr' && { borderBottomWidth: 2, borderBottomColor: accentHex }]}
          onPress={() => setActiveSubTab('ocr')}
        >
          <Text style={[styles.subTabText, { color: activeSubTab === 'ocr' ? theme.text : theme.textSecondary }]}>
            Receipt OCR
          </Text>
        </TouchableOpacity>

        {activeWorkspaceId !== 'personal' && ['owner', 'partner', 'accountant'].includes(activeWorkspaceRole || '') && (
          <TouchableOpacity
            style={[styles.subTab, activeSubTab === 'reconcile' && { borderBottomWidth: 2, borderBottomColor: accentHex }]}
            onPress={() => setActiveSubTab('reconcile')}
          >
            <Text style={[styles.subTabText, { color: activeSubTab === 'reconcile' ? theme.text : theme.textSecondary }]}>
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
            <View style={[styles.uploadCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Import Statements</Text>
              <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                Upload your bank statements in .csv or .pdf format. PDF statements will be processed automatically using Gemini AI.
              </Text>

              <TouchableOpacity
                style={[styles.uploadBox, { backgroundColor: theme.subtleCard || theme.bg, borderColor: theme.cardBorder }, uploading && styles.uploadBoxDisabled]}
                onPress={handlePickDocument}
                disabled={uploading}
              >
                {uploading ? (
                  <View style={styles.loadingCenter}>
                    <ActivityIndicator color={accentHex} size="large" />
                    <Text style={[styles.uploadProgressText, { color: accentHex }]}>Uploading & parsing file...</Text>
                  </View>
                ) : (
                  <>
                    <UploadCloudIcon color={accentHex} size={48} style={{ marginBottom: 12 }} />
                    <Text style={[styles.uploadBoxText, { color: theme.text }]}>Tap to pick CSV or PDF Statement</Text>
                    <Text style={[styles.uploadBoxSubtext, { color: theme.textMuted }]}>Max size: 10MB</Text>
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
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Import History</Text>
              
              {loadingHistory ? (
                <ActivityIndicator color={accentHex} size="small" style={{ marginTop: 20 }} />
              ) : uploads.length > 0 ? (
                <View style={{ marginBottom: 12 }}>
                  {uploads.map((item) => {
                    const uploadId = item.uploadId || item._id || item.id;
                    const dateStr = item.uploadedAt 
                      ? new Date(item.uploadedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Unknown';

                    return (
                      <View key={uploadId} style={[styles.historyRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                        <View style={[styles.fileIconBox, { backgroundColor: theme.subtleCard || theme.bg }]}>
                          <FileTextIcon color={accentHex} size={18} />
                        </View>

                        <View style={styles.fileDetails}>
                          <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                            {item.filename || 'bank_statement.csv'}
                          </Text>
                          <Text style={[styles.fileMeta, { color: theme.textMuted }]}>
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
                  })}
                </View>
              ) : (
                <View style={[styles.emptyHistory, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <AlertCircleIcon color={theme.textMuted} size={24} style={{ marginBottom: 8 }} />
                  <Text style={[styles.emptyHistoryText, { color: theme.textMuted }]}>No statement imports recorded.</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={styles.ocrContainer}>
            <View style={[styles.reviewCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, padding: 16, marginTop: 0 }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Multilingual Receipt Scanner</Text>
              <Text style={[styles.cardDesc, { color: theme.textSecondary, marginBottom: 16 }]}>
                Scan it. We'll handle the Hisab. 📸✨ Supports English, Hindi (हिन्दी), and Marathi (मराठी) receipts.
              </Text>

              {/* Action Buttons */}
              <View style={styles.photoActions}>
                <TouchableOpacity style={[styles.photoBtn, { backgroundColor: accentHex }]} onPress={handleCaptureReceipt}>
                  <CameraIcon color="#ffffff" size={20} style={{ marginRight: 6 }} />
                  <Text style={styles.photoBtnText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.photoBtn, styles.galleryBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={handlePickReceiptFromLibrary}>
                  <ImageIconComponent color={accentHex} size={20} style={{ marginRight: 6 }} />
                  <Text style={[styles.galleryBtnText, { color: accentHex }]}>Choose Gallery</Text>
                </TouchableOpacity>
              </View>

              {/* Selected Image Preview */}
              {selectedImage && (
                <View style={[styles.previewBox, { backgroundColor: theme.subtleCard || theme.bg, borderColor: theme.cardBorder }]}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} resizeMode="contain" />
                  
                  {!ocrResult && !scanning && (
                    <TouchableOpacity style={[styles.scanBtn, { backgroundColor: accentHex }]} onPress={handleScanReceipt}>
                      <Text style={styles.scanBtnText}>Scan with AI OCR</Text>
                    </TouchableOpacity>
                  )}

                  {scanning && (
                    <View style={styles.scanningOverlay}>
                      <ActivityIndicator color={accentHex} size="small" />
                      <Text style={styles.scanningText}>Analyzing Multilingual Receipt...</Text>
                    </View>
                  )}

                  {errorOcr && (
                    <View style={styles.ocrErrorBox}>
                      <AlertCircleIcon color="#ff6b6b" size={18} />
                      <Text style={styles.ocrErrorText}>{errorOcr}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* OCR Extracted Result Review */}
            {ocrResult && (
              <View style={[styles.reviewCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={[styles.reviewTitle, { color: theme.text }]}>Review Extracted Details</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: accentHex, backgroundColor: accentHex + '18', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    🌐 {ocrResult.detectedLanguage}
                  </Text>
                </View>

                {ocrResult.confidenceScore < 0.75 && (
                  <View style={{ backgroundColor: 'rgba(255,170,0,0.15)', borderWidth: 1, borderColor: 'rgba(255,170,0,0.3)', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={{ color: '#ffbb33', fontSize: 12, fontWeight: '600' }}>
                      ⚠️ Low OCR Confidence: Please carefully verify total amount and merchant name before saving.
                    </Text>
                  </View>
                )}

                <Text style={[styles.reviewSubtitle, { color: theme.textSecondary }]}>Extracted values normalized to standard digits. Edit any field below.</Text>

                <View style={styles.reviewField}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Merchant / Shop Name</Text>
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                    value={ocrResult.description}
                    onChangeText={(t) => setOcrResult({ ...ocrResult, description: t })}
                    placeholder="Merchant name"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>

                <View style={styles.reviewField}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Total Amount (₹)</Text>
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                    value={ocrResult.amount}
                    onChangeText={(t) => setOcrResult({ ...ocrResult, amount: t })}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>

                {ocrResult.gstNumber !== '' && (
                  <View style={styles.reviewField}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>GSTIN / Tax ID</Text>
                    <TextInput
                      style={[styles.fieldInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                      value={ocrResult.gstNumber}
                      onChangeText={(t) => setOcrResult({ ...ocrResult, gstNumber: t })}
                      placeholder="GSTIN"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>
                )}

                <View style={styles.reviewField}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Category</Text>
                  <TouchableOpacity
                    style={[styles.dropdownTrigger, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
                    onPress={() => setCategoryDropdownVisible(!categoryDropdownVisible)}
                  >
                    <Text style={[styles.dropdownValue, { color: theme.text }]}>{ocrResult.category}</Text>
                    <ChevronDownIcon color={theme.textMuted} size={18} />
                  </TouchableOpacity>

                  {categoryDropdownVisible && (
                    <View style={[styles.catDropdownList, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                      {CATEGORIES.map((cat, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.catOption, { borderBottomColor: theme.cardBorder }]}
                          onPress={() => {
                            setOcrResult({ ...ocrResult, category: cat });
                            setCategoryDropdownVisible(false);
                          }}
                        >
                          <Text style={[styles.catOptionText, { color: theme.text }]}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.reviewField}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Date</Text>
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                    value={ocrResult.date}
                    onChangeText={(t) => setOcrResult({ ...ocrResult, date: t })}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textMuted}
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
                    <Text style={styles.saveOcrBtnText}>Confirm & Save to Ledger</Text>
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
            <View style={[styles.mappingCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.mappingTitle, { color: theme.text }]}>Map CSV Columns</Text>
              <Text style={[styles.mappingDesc, { color: theme.textSecondary }]}>
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
                    <View key={field} style={[styles.mappingRow, { borderBottomColor: theme.cardBorder }]}>
                      <View style={styles.mappingFieldLabelCol}>
                        <Text style={[styles.mappingFieldLabel, { color: theme.text }]}>{label}</Text>
                        <Text style={[styles.mappingFieldSub, { color: theme.textMuted }]}>{subLabel}</Text>
                      </View>

                      <TouchableOpacity
                        style={[styles.selectBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
                        onPress={() => setActiveDropdownField(activeDropdownField === field ? null : field)}
                      >
                        <Text style={[styles.selectBoxText, { color: theme.text }]} numberOfLines={1}>
                          {selectedMapping[field] || 'Choose Column...'}
                        </Text>
                        <ChevronDownIcon color={theme.textMuted} size={16} />
                      </TouchableOpacity>

                      {activeDropdownField === field && (
                        <View style={[styles.dropdownOptions, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                          <TouchableOpacity
                            style={[styles.dropdownOption, { borderBottomColor: theme.cardBorder }]}
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
                              style={[styles.dropdownOption, { borderBottomColor: theme.cardBorder }]}
                              onPress={() => {
                                setSelectedMapping({ ...selectedMapping, [field]: h });
                                setActiveDropdownField(null);
                              }}
                            >
                              <Text style={[styles.dropdownOptionText, { color: theme.text }]}>{h}</Text>
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
                  style={[styles.mapBtn, styles.cancelMapBtn, { borderColor: theme.cardBorder }]}
                  onPress={() => {
                    setMappingVisible(false);
                    setMappingState(null);
                  }}
                >
                  <Text style={[styles.cancelMapBtnText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mapBtn, styles.submitMapBtn, { backgroundColor: accentHex }]}
                  onPress={handleSubmitMapping}
                >
                  <Text style={styles.submitMapBtnText}>Confirm Columns</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Document Intelligence Review Modal */}
      {activeDocument && (
        <Modal
          visible={reviewModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setReviewModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: theme.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', padding: 18, borderTopWidth: 2, borderColor: accentHex }}>
              
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View>
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>Document Intelligence Review</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{activeDocument.fileName} · {activeDocument.documentType?.toUpperCase()}</Text>
                </View>
                <TouchableOpacity onPress={() => setReviewModalVisible(false)} style={{ padding: 6, backgroundColor: theme.card, borderRadius: 12 }}>
                  <XIcon color={theme.textSecondary} size={20} />
                </TouchableOpacity>
              </View>

              {/* Summary Stats Grid */}
              <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: theme.cardBorder, marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View>
                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700' }}>TOTAL DETECTED</Text>
                    <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800', marginTop: 2 }}>{activeDocument.summary?.totalCount || 0}</Text>
                  </View>
                  <View>
                    <Text style={{ color: '#2ecc71', fontSize: 11, fontWeight: '700' }}>HIGH CONFIDENCE</Text>
                    <Text style={{ color: '#2ecc71', fontSize: 18, fontWeight: '800', marginTop: 2 }}>{activeDocument.summary?.highConfidenceCount || 0}</Text>
                  </View>
                  <View>
                    <Text style={{ color: '#f39c12', fontSize: 11, fontWeight: '700' }}>NEEDS REVIEW</Text>
                    <Text style={{ color: '#f39c12', fontSize: 18, fontWeight: '800', marginTop: 2 }}>{activeDocument.summary?.reviewCount || 0}</Text>
                  </View>
                  <View>
                    <Text style={{ color: '#e74c3c', fontSize: 11, fontWeight: '700' }}>DUPLICATES</Text>
                    <Text style={{ color: '#e74c3c', fontSize: 18, fontWeight: '800', marginTop: 2 }}>{activeDocument.summary?.duplicateCount || 0}</Text>
                  </View>
                </View>

                <View style={{ borderTopWidth: 1, borderTopColor: theme.cardBorder, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#2ecc71', fontSize: 12, fontWeight: '700' }}>Inflow: ₹{(activeDocument.summary?.inflow || 0).toLocaleString('en-IN')}</Text>
                  <Text style={{ color: '#ff6b6b', fontSize: 12, fontWeight: '700' }}>Outflow: ₹{(activeDocument.summary?.outflow || 0).toLocaleString('en-IN')}</Text>
                  <Text style={{ color: accentHex, fontSize: 12, fontWeight: '800' }}>Net: ₹{(activeDocument.summary?.netCashFlow || 0).toLocaleString('en-IN')}</Text>
                </View>
              </View>

              {/* Action Toolbar */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '800' }}>Extracted Transactions ({activeDocument.extractedTransactions?.filter((t: any) => t.approved !== false).length || 0} approved)</Text>
                <TouchableOpacity onPress={handleApproveHighConfidence} style={{ backgroundColor: accentHex + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: accentHex }}>
                  <Text style={{ color: accentHex, fontSize: 11, fontWeight: '700' }}>Approve High Confidence ✓</Text>
                </TouchableOpacity>
              </View>

              {/* Transactions List */}
              <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                {activeDocument.extractedTransactions?.map((item: any, idx: number) => {
                  const isApproved = item.approved !== false;
                  const isHighConf = item.confidenceScore >= 0.90 && !item.needsReview;
                  return (
                    <View key={item.tempId || idx} style={{ backgroundColor: theme.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: isApproved ? (item.isDuplicate ? '#e74c3c' : theme.cardBorder) : '#444', marginBottom: 10, opacity: isApproved ? 1 : 0.5 }}>
                      
                      {/* Row Top Meta */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <TouchableOpacity onPress={() => handleToggleRowApprove(idx)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: isApproved ? accentHex : 'transparent', borderWidth: 1.5, borderColor: isApproved ? accentHex : theme.textMuted, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                            {isApproved && <CheckIcon color="#fff" size={14} />}
                          </View>
                          <Text style={{ color: theme.text, fontSize: 12, fontWeight: '800' }}>Row #{idx + 1}</Text>
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                          {item.isDuplicate && (
                            <View style={{ backgroundColor: '#e74c3c20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#e74c3c' }}>
                              <Text style={{ color: '#e74c3c', fontSize: 10, fontWeight: '800' }}>Possible Duplicate</Text>
                            </View>
                          )}
                          <View style={{ backgroundColor: isHighConf ? '#2ecc7120' : '#f39c1220', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: isHighConf ? '#2ecc71' : '#f39c12' }}>
                            <Text style={{ color: isHighConf ? '#2ecc71' : '#f39c12', fontSize: 10, fontWeight: '800' }}>
                              {Math.round(item.confidenceScore * 100)}% {isHighConf ? '✓' : '⚠ Review'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Row Inputs */}
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                        <TextInput
                          style={{ flex: 1, backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 8, paddingHorizontal: 10, height: 36, color: theme.text, fontSize: 12 }}
                          value={item.description}
                          onChangeText={(v) => handleUpdateRowField(idx, 'description', v)}
                          placeholder="Description / Merchant"
                          placeholderTextColor={theme.textMuted}
                        />
                        <TextInput
                          style={{ width: 100, backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 8, paddingHorizontal: 10, height: 36, color: item.type === 'income' ? '#2ecc71' : '#ff6b6b', fontSize: 12, fontWeight: '800' }}
                          value={String(item.amount)}
                          onChangeText={(v) => handleUpdateRowField(idx, 'amount', parseFloat(v) || 0)}
                          keyboardType="numeric"
                          placeholder="Amount"
                          placeholderTextColor={theme.textMuted}
                        />
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <TextInput
                          style={{ width: 110, backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 8, paddingHorizontal: 10, height: 32, color: theme.textSecondary, fontSize: 11 }}
                          value={item.date}
                          onChangeText={(v) => handleUpdateRowField(idx, 'date', v)}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={theme.textMuted}
                        />

                        <TouchableOpacity
                          onPress={() => handleUpdateRowField(idx, 'type', item.type === 'income' ? 'expense' : 'income')}
                          style={{ backgroundColor: item.type === 'income' ? '#2ecc7120' : '#ff6b6b20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: item.type === 'income' ? '#2ecc71' : '#ff6b6b' }}
                        >
                          <Text style={{ color: item.type === 'income' ? '#2ecc71' : '#ff6b6b', fontSize: 11, fontWeight: '800' }}>
                            {item.type.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      </View>

                    </View>
                  );
                })}
              </ScrollView>

              {/* Commit Actions */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <TouchableOpacity onPress={() => setReviewModalVisible(false)} style={{ flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: theme.cardBorder, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCommitDocument}
                  disabled={committing}
                  style={{ flex: 2, height: 48, borderRadius: 14, backgroundColor: accentHex, justifyContent: 'center', alignItems: 'center' }}
                >
                  {committing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                      Save Approved to MongoDB ({activeDocument.extractedTransactions?.filter((t: any) => t.approved !== false).length || 0})
                    </Text>
                  )}
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
  },
  subTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 48,
  },
  subTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabActive: {
    borderBottomWidth: 2,
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  subTabTextActive: {
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  uploadCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 16,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadBoxDisabled: {
    opacity: 0.6,
  },
  uploadBoxText: {
    fontSize: 13,
    fontWeight: '700',
  },
  uploadBoxSubtext: {
    fontSize: 11,
    marginTop: 4,
  },
  loadingCenter: {
    alignItems: 'center',
  },
  uploadProgressText: {
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
    borderColor: 'rgba(239,68,68,0.2)',
  },
  clearBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
  historyContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  emptyHistory: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 30,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 13,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  fileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
  },
  fileMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mappingCard: {
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderWidth: 1,
  },
  mappingTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  mappingDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  mappingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    paddingVertical: 12,
    position: 'relative',
    zIndex: 1,
  },
  mappingFieldLabelCol: {
    flex: 0.9,
  },
  mappingFieldLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  mappingFieldSub: {
    fontSize: 10,
    marginTop: 2,
  },
  selectBox: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  selectBoxText: {
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
    borderWidth: 1,
    borderRadius: 10,
    zIndex: 100,
    elevation: 6,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  dropdownOptionTextSkip: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '600',
  },
  dropdownOptionText: {
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
  },
  cancelMapBtnText: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  galleryBtn: {
    borderWidth: 1,
  },
  galleryBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  previewBox: {
    borderWidth: 1,
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginTop: 20,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  reviewSubtitle: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 16,
  },
  reviewField: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  dropdownValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  catDropdownList: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
  },
  catOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  catOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  saveOcrBtn: {
    backgroundColor: '#10b981',
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
