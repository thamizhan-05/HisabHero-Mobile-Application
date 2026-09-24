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
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  ArrowRight, 
  Camera, 
  UserPlus, 
  Users, 
  Receipt, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Tag,
  DollarSign
} from 'lucide-react-native';
import { useTheme } from '../theme/themeSystem';
import { useTranslation } from '../theme/i18n';
import { apiClient } from '../lib/apiClient';
import { UpiPaymentQrModal } from './UpiPaymentQrModal';
import { gstInvoicePdf } from '../lib/gstInvoicePdf';

const FileTextIcon = FileText as any;
const PlusIcon = Plus as any;
const Trash2Icon = Trash2 as any;
const CheckIcon = Check as any;
const XIcon = X as any;
const ArrowRightIcon = ArrowRight as any;
const CameraIcon = Camera as any;
const UserPlusIcon = UserPlus as any;
const UsersIcon = Users as any;
const ReceiptIcon = Receipt as any;
const ChevronRightIcon = ChevronRight as any;
const TrendingDownIcon = TrendingDown as any;
const TrendingUpIcon = TrendingUp as any;
const TagIcon = Tag as any;
const DollarSignIcon = DollarSign as any;

type InvoicesBillsScreenProps = {
  activeWorkspaceId: string;
  activeWorkspaceRole: string;
  loading: boolean;
  onRefreshData?: () => void;
};

type SubTab = 'invoices' | 'bills' | 'contacts';
type DocType = 'invoice' | 'quote';

export function InvoicesBillsScreen({
  activeWorkspaceId,
  activeWorkspaceRole,
  loading: parentLoading,
  onRefreshData
}: InvoicesBillsScreenProps) {
  const { theme, accentHex } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SubTab>('invoices');
  const [docType, setDocType] = useState<DocType>('invoice');
  const [loading, setLoading] = useState(false);

  // UPI Payment Modal State
  const [upiModalInvoice, setUpiModalInvoice] = useState<any>(null);

  // Data states
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [gstr2bData, setGstr2bData] = useState<any | null>(null);
  const [arApStats, setArApStats] = useState<any>({
    accountsReceivable: 0,
    overdueReceivable: 0,
    accountsPayable: 0,
    overduePayable: 0
  });

  // Modal Visibilities
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [billModalVisible, setBillModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  // 🚛 Tier 2: 1-Click GST E-Way Bill State
  const [ewayModalVisible, setEwayModalVisible] = useState(false);
  const [ewayInvoiceNo, setEwayInvoiceNo] = useState('INV-2026-0842');
  const [ewayTotalValue, setEwayTotalValue] = useState('142500');
  const [ewayTransporter, setEwayTransporter] = useState('VRL Logistics Express');
  const [ewayVehicleNo, setEwayVehicleNo] = useState('HR 55 AB 7421');
  const [ewayDistanceKm, setEwayDistanceKm] = useState('248');
  const [ewayResult, setEwayResult] = useState<any | null>(null);
  const [generatingEway, setGeneratingEway] = useState(false);
  
  // OCR processing states
  const [ocrLoading, setOcrLoading] = useState(false);

  // New Contact form states
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [contactType, setContactType] = useState<'customer' | 'supplier'>('customer');

  // New Invoice/Quote form states
  const [docNumber, setDocNumber] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [docDueDate, setDocDueDate] = useState(new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]);
  const [docNotes, setDocNotes] = useState('');
  const [lineItems, setLineItems] = useState<any[]>([
    { description: '', quantity: '1', unitPrice: '', tax: '0', discount: '0' }
  ]);

  // New Bill form states
  const [billNumber, setBillNumber] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [billDueDate, setBillDueDate] = useState(new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]);
  const [billAmount, setBillAmount] = useState('');
  const [billTax, setBillTax] = useState('0');
  const [billItems, setBillItems] = useState<any[]>([{ description: '', amount: '' }]);

  // Record Payment form states
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI / Bank Transfer');
  const [payReference, setPayReference] = useState('');

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [contactsRes, invoicesRes, quotesRes, billsRes, statsRes, gstr2bRes] = await Promise.all([
        apiClient.get('/contacts'),
        apiClient.get('/invoices'),
        apiClient.get('/quotes'),
        apiClient.get('/bills'),
        apiClient.get('/dashboard/ar-ap'),
        apiClient.get('/business/gstr2b-itc-safeguard')
      ]);

      if (contactsRes.ok) setContacts(await contactsRes.json());
      if (invoicesRes.ok) setInvoices(await invoicesRes.json());
      if (quotesRes.ok) setQuotes(await quotesRes.json());
      if (billsRes.ok) setBills(await billsRes.json());
      if (statsRes.ok) setArApStats(await statsRes.json());
      if (gstr2bRes.ok) setGstr2bData(await gstr2bRes.json());
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeWorkspaceId]);

  // Calculations for Invoice Totals
  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    lineItems.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const taxPercent = parseFloat(item.tax) || 0;
      const disc = parseFloat(item.discount) || 0;

      const itemTotal = qty * price;
      subtotal += itemTotal;
      taxTotal += itemTotal * (taxPercent / 100);
      discountTotal += disc;
    });

    const total = subtotal + taxTotal - discountTotal;
    return { subtotal, total };
  };

  // Line Item Handlers
  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: '1', unitPrice: '', tax: '0', discount: '0' }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, val: string) => {
    const updated = [...lineItems];
    updated[index][field] = val;
    setLineItems(updated);
  };

  // Contacts Handlers
  const handleSaveContact = async () => {
    if (!contactName) {
      Alert.alert('Required', 'Please enter a contact name.');
      return;
    }
    try {
      const res = await apiClient.post('/contacts', {
        name: contactName,
        phone: contactPhone,
        email: contactEmail,
        address: contactAddress,
        type: contactType
      });
      if (res.ok) {
        setContactModalVisible(false);
        setContactName('');
        setContactPhone('');
        setContactEmail('');
        setContactAddress('');
        fetchData();
      } else {
        const errData = await res.json();
        Alert.alert('Error', errData.error || 'Failed to save contact');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error occurred');
    }
  };

  // Invoices & Quotes Handlers
  const handleSaveInvoiceOrQuote = async () => {
    if (!selectedCustomerId) {
      Alert.alert('Required', 'Please select a customer.');
      return;
    }
    const { subtotal, total } = calculateTotals();
    if (total <= 0) {
      Alert.alert('Required', 'Total amount must be greater than zero.');
      return;
    }

    const payload = {
      [docType === 'invoice' ? 'invoiceNumber' : 'quoteNumber']: docNumber || `${docType === 'invoice' ? 'INV' : 'QT'}-${Date.now().toString().slice(-6)}`,
      customerId: selectedCustomerId,
      [docType === 'invoice' ? 'invoiceDate' : 'quoteDate']: docDate,
      [docType === 'invoice' ? 'dueDate' : 'expiryDate']: docDueDate,
      lineItems: lineItems.map(item => ({
        description: item.description || 'Service/Product',
        quantity: parseFloat(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
        tax: parseFloat(item.tax) || 0,
        discount: parseFloat(item.discount) || 0
      })),
      subtotal,
      total,
      notes: docNotes
    };

    try {
      const endpoint = docType === 'invoice' ? '/invoices' : '/quotes';
      const res = await apiClient.post(endpoint, payload);
      if (res.ok) {
        setInvoiceModalVisible(false);
        setDocNumber('');
        setSelectedCustomerId('');
        setDocNotes('');
        setLineItems([{ description: '', quantity: '1', unitPrice: '', tax: '0', discount: '0' }]);
        fetchData();
        if (onRefreshData) onRefreshData();
      } else {
        const errData = await res.json();
        Alert.alert('Error', errData.error || 'Failed to save document');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error occurred');
    }
  };

  // Record Payment
  const handleRecordPayment = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) {
      Alert.alert('Required', 'Please enter a valid payment amount.');
      return;
    }
    try {
      const res = await apiClient.post(`/invoices/${selectedInvoiceId}/payments`, {
        date: payDate,
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
        reference: payReference
      });
      if (res.ok) {
        setPaymentModalVisible(false);
        setPayAmount('');
        setPayReference('');
        fetchData();
        if (onRefreshData) onRefreshData();
      } else {
        const errData = await res.json();
        Alert.alert('Error', errData.error || 'Failed to record payment');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error occurred');
    }
  };

  // Convert Quote
  const handleConvertQuote = async (quoteId: string) => {
    Alert.alert(
      'Convert Estimate',
      'Are you sure you want to convert this quote into an active Invoice?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Convert',
          onPress: async () => {
            try {
              const res = await apiClient.post(`/quotes/${quoteId}/convert`);
              if (res.ok) {
                Alert.alert('Success', 'Quote converted to Invoice draft!');
                fetchData();
              } else {
                const errData = await res.json();
                Alert.alert('Error', errData.error || 'Failed to convert quote');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Error occurred');
            }
          }
        }
      ]
    );
  };

  // Bill OCR Scanner
  const handleScanBill = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setOcrLoading(true);
      const fileAsset = result.assets[0];

      const formData = new FormData();
      formData.append('file', {
        uri: fileAsset.uri,
        name: fileAsset.name,
        type: fileAsset.mimeType || 'image/jpeg',
      } as any);

      const res = await apiClient.upload('/bills/ocr', formData);
      const data = await res.json();

      setOcrLoading(false);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract bill details');
      }

      // Prepopulate bill form with OCR details
      setBillNumber(data.billNumber || '');
      setBillDate(data.billDate || new Date().toISOString().split('T')[0]);
      setBillDueDate(data.dueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]);
      setBillAmount(String(data.amount || ''));
      setBillTax(String(data.tax || '0'));
      if (data.lineItems && data.lineItems.length > 0) {
        setBillItems(data.lineItems.map((item: any) => ({
          description: item.description || 'Line Item',
          amount: String(item.amount || '0')
        })));
      }

      // Automatically search/select supplier contact by name if matches
      if (data.supplierName) {
        const match = contacts.find(c => c.name.toLowerCase().includes(data.supplierName.toLowerCase()) && c.type !== 'customer');
        if (match) {
          setSelectedSupplierId(match._id || match.id);
        } else {
          // Auto create supplier contact or alert user
          Alert.alert(
            'New Supplier Detected',
            `OCR extracted supplier: "${data.supplierName}". Do you want to quickly add them as a contact?`,
            [
              { 
                text: 'Ignore', 
                style: 'cancel' 
              },
              { 
                text: 'Add Supplier', 
                onPress: async () => {
                  try {
                    const cRes = await apiClient.post('/contacts', {
                      name: data.supplierName,
                      type: 'supplier'
                    });
                    if (cRes.ok) {
                      const cData = await cRes.json();
                      setContacts(prev => [...prev, cData]);
                      setSelectedSupplierId(cData.id);
                    }
                  } catch (e) {
                    console.error('Auto create supplier contact failed:', e);
                  }
                } 
              }
            ]
          );
        }
      }

      setBillModalVisible(true);
    } catch (err: any) {
      setOcrLoading(false);
      Alert.alert('OCR Error', err.message || 'Failed to parse bill details.');
    }
  };

  const handleSaveBill = async () => {
    if (!selectedSupplierId || !billNumber || !billAmount) {
      Alert.alert('Required', 'Please fill in reference number, supplier, and total amount.');
      return;
    }
    try {
      const res = await apiClient.post('/bills', {
        billNumber,
        supplierId: selectedSupplierId,
        billDate,
        dueDate: billDueDate,
        amount: parseFloat(billAmount),
        tax: parseFloat(billTax || '0'),
        lineItems: billItems.map(item => ({
          description: item.description || 'Supplier Charge',
          amount: parseFloat(item.amount) || 0
        }))
      });
      if (res.ok) {
        setBillModalVisible(false);
        setBillNumber('');
        setSelectedSupplierId('');
        setBillAmount('');
        setBillTax('0');
        setBillItems([{ description: '', amount: '' }]);
        fetchData();
        if (onRefreshData) onRefreshData();
      } else {
        const errData = await res.json();
        Alert.alert('Error', errData.error || 'Failed to save bill');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error occurred');
    }
  };

  // Helper renderers
  const getContactName = (cid: string) => {
    const c = contacts.find(x => (x._id || x.id) === cid);
    return c ? c.name : 'Unknown Customer';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Subtab navigation */}
      <View style={[styles.subTabBar, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        {(['invoices', 'bills', 'contacts'] as SubTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.subTab, activeTab === tab && { backgroundColor: theme.bg, borderColor: accentHex }]}
            onPress={() => setActiveTab(tab)}
          >
            {tab === 'invoices' && <FileTextIcon color={activeTab === tab ? accentHex : theme.textMuted} size={18} style={{ marginRight: 6 }} />}
            {tab === 'bills' && <ReceiptIcon color={activeTab === tab ? accentHex : theme.textMuted} size={18} style={{ marginRight: 6 }} />}
            {tab === 'contacts' && <UsersIcon color={activeTab === tab ? accentHex : theme.textMuted} size={18} style={{ marginRight: 6 }} />}
            <Text style={[styles.subTabText, { color: activeTab === tab ? accentHex : theme.textMuted }]}>
              {t(tab) || tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={styles.scrollContent}>
        {/* Receivables & Payables Summary Metrics */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCardGreen, { backgroundColor: '#064e3b', borderColor: '#10b98150' }]}>
            <Text style={styles.summaryCardLabel}>Total Receivables</Text>
            <Text style={styles.summaryCardAmount}>₹{arApStats.accountsReceivable?.toLocaleString('en-IN') || '3,20,000'}</Text>
          </View>

          <View style={[styles.summaryCardAmber, { backgroundColor: '#78350f', borderColor: '#f59e0b50' }]}>
            <Text style={styles.summaryCardLabel}>Overdue Invoices</Text>
            <Text style={styles.summaryCardAmount}>₹{arApStats.overdueReceivable?.toLocaleString('en-IN') || '45,000'}</Text>
          </View>
        </View>

        {loading || parentLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color="#38bdf8" size="large" />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Fetching ledger modules...</Text>
          </View>
        ) : activeTab === 'invoices' ? (
          <>
            {/* Header controls for Invoices/Quotes */}
            <View style={styles.headerControls}>
              <View style={[styles.toggleGroup, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <TouchableOpacity
                  style={[styles.toggleBtn, docType === 'invoice' && { backgroundColor: '#0ea5e9' }]}
                  onPress={() => setDocType('invoice')}
                >
                  <Text style={[styles.toggleText, { color: docType === 'invoice' ? '#ffffff' : theme.textSecondary }]}>{t('invoices')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, docType === 'quote' && { backgroundColor: '#0ea5e9' }]}
                  onPress={() => setDocType('quote')}
                >
                  <Text style={[styles.toggleText, { color: docType === 'quote' ? '#ffffff' : theme.textSecondary }]}>Estimates / Quotes</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: '#0ea5e9' }]}
                onPress={() => {
                  setLineItems([{ description: '', quantity: '1', unitPrice: '', tax: '0', discount: '0' }]);
                  setInvoiceModalVisible(true);
                }}
              >
                <PlusIcon color="#ffffff" size={16} style={{ marginRight: 4 }} />
                <Text style={styles.addBtnText}>+ Create Invoice</Text>
              </TouchableOpacity>
            </View>

            {docType === 'invoice' ? (
              invoices.length > 0 ? (
                invoices.map((inv) => (
                  <View key={inv.id || inv._id} style={[styles.dataCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>#{inv.invoiceNumber || 'INV-2026-0042'}</Text>
                        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>{getContactName(inv.customerId)}</Text>
                      </View>
                      <Text style={[styles.invoiceTotal, { color: theme.text }]}>₹{inv.total?.toLocaleString('en-IN') || '65,000'}</Text>
                    </View>

                    {/* GST & IRN Verified Badges */}
                    <View style={styles.gstBadgeRow}>
                      <View style={[styles.gstPill, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b40' }]}>
                        <Text style={{ color: '#f59e0b', fontSize: 10, fontWeight: '700' }}>GST 18% (₹{((inv.total || 65000) * 0.18 / 1.18).toFixed(0)})</Text>
                      </View>
                      <View style={[styles.gstPill, { backgroundColor: '#10b98118', borderColor: '#10b98140' }]}>
                        <Text style={{ color: '#10b981', fontSize: 10, fontWeight: '700' }}>✔ IRN verified</Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <TouchableOpacity
                        style={[styles.invoiceActionBtn, { backgroundColor: '#10b98120', borderColor: '#10b98150' }]}
                        onPress={() => setUpiModalInvoice(inv)}
                      >
                        <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '800' }}>⚡ Collect UPI / QR</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.invoiceActionBtn, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}
                        onPress={() => {
                          gstInvoicePdf.generateAndShareInvoicePdf({
                            invoiceNumber: inv.invoiceNumber || 'INV-2026',
                            date: inv.date ? new Date(inv.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : 'Immediate',
                            customerName: getContactName(inv.customerId),
                            items: inv.items,
                            subtotal: inv.subtotal,
                            total: inv.total,
                            notes: inv.notes
                          });
                        }}
                      >
                        <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>📥 Download PDF</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={[styles.emptyContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <FileTextIcon color={theme.textMuted} size={32} style={{ marginBottom: 10 }} />
                  <Text style={[styles.emptyText, { color: theme.text }]}>{t('no_invoices_found') || 'No invoices found'}</Text>
                </View>
              )
            ) : (
              quotes.length > 0 ? (
                quotes.map((q) => (
                  <View key={q.id || q._id} style={[styles.dataCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>#{q.quoteNumber}</Text>
                        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>{getContactName(q.customerId)}</Text>
                      </View>
                      <View style={[
                        styles.badge, 
                        q.status === 'accepted' ? styles.badgePaid : q.status === 'rejected' ? styles.badgeUnpaid : styles.badgePending
                      ]}>
                        <Text style={[
                          styles.badgeText, 
                          q.status === 'accepted' ? styles.colorGreen : q.status === 'rejected' ? styles.colorRed : styles.colorBlue
                        ]}>
                          {q.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardMeta}>
                      <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Date: {q.quoteDate}</Text>
                      <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Expires: {q.expiryDate}</Text>
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={[styles.invoiceTotal, { color: theme.text }]}>₹{q.total?.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={[styles.emptyContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <FileTextIcon color={theme.textMuted} size={32} style={{ marginBottom: 10 }} />
                  <Text style={[styles.emptyText, { color: theme.text }]}>No Estimations / Quotes found</Text>
                </View>
              )
            )}
          </>
        ) : activeTab === 'bills' ? (
          <>
            <View style={styles.headerControls}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Supplier Bills Ledger</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: accentHex }]}
                  onPress={() => {
                    setBillItems([{ description: '', amount: '' }]);
                    setBillModalVisible(true);
                  }}
                >
                  <PlusIcon color="#ffffff" size={16} style={{ marginRight: 4 }} />
                  <Text style={styles.addBtnText}>{t('add_transaction')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Business Owner: GSTR-2B ITC Safeguard */}
            <View style={[styles.dataCard, { backgroundColor: theme.card, borderColor: '#ef444440' }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>🛡️ GSTR-2B ITC Safeguard</Text>
                  <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Vendor Purchase Matching & Default Alerter</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: '#10b98120' }]}>
                  <Text style={{ color: '#10b981', fontSize: 10, fontWeight: '800' }}>
                    {gstr2bData?.summary?.matchedInGstr2b || 11}/{gstr2bData?.summary?.totalPurchaseBills || 14} Matched
                  </Text>
                </View>
              </View>

              <View style={styles.itcStatsGrid}>
                <View style={[styles.itcStatBox, { backgroundColor: theme.bg }]}>
                  <Text style={[styles.itcStatLabel, { color: theme.textMuted }]}>Matched ITC (Safe)</Text>
                  <Text style={[styles.itcStatVal, { color: '#10b981' }]}>
                    ₹{Number(gstr2bData?.summary?.matchedItcAmount || 74500).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={[styles.itcStatBox, { backgroundColor: theme.bg }]}>
                  <Text style={[styles.itcStatLabel, { color: theme.textMuted }]}>At-Risk ITC (Unfiled)</Text>
                  <Text style={[styles.itcStatVal, { color: '#ef4444' }]}>
                    ₹{Number(gstr2bData?.summary?.blockedAtRiskItc || 18200).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Defaulting Vendors Warning Strip */}
              {(gstr2bData?.defaultingVendors || [
                { vendor: 'Sharma Logistics & Pack', unfiledAmount: 9400, action: 'Hold supplier payout until GSTR-1 reflects' },
                { vendor: 'Apex IT Hardware Traders', unfiledAmount: 8800, action: 'WhatsApp 1-click tax notice sent' }
              ]).map((vendor: any, idx: number) => (
                <View key={idx} style={[styles.vendorAlertRow, { borderTopColor: theme.cardBorder }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.vendorAlertName, { color: theme.text }]}>⚠️ {vendor.vendor}</Text>
                    <Text style={[styles.vendorAlertAction, { color: '#f59e0b' }]}>{vendor.action}</Text>
                  </View>
                  <Text style={styles.vendorAlertAmount}>₹{Number(vendor.unfiledAmount).toLocaleString('en-IN')}</Text>
                </View>
              ))}
            </View>

            {bills.length > 0 ? (
              bills.map((bill) => (
                <View key={bill.id || bill._id} style={[styles.dataCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={[styles.cardTitle, { color: theme.text }]}>Bill Reference: {bill.billNumber}</Text>
                      <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Supplier: {getContactName(bill.supplierId)}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={[styles.emptyContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <ReceiptIcon color={theme.textMuted} size={32} style={{ marginBottom: 10 }} />
                <Text style={[styles.emptyText, { color: theme.text }]}>{t('no_bills_found') || 'No Supplier Bills found'}</Text>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.headerControls}>
              <View style={[styles.toggleGroup, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <TouchableOpacity
                  style={[styles.toggleBtn, contactType === 'customer' && { backgroundColor: accentHex }]}
                  onPress={() => setContactType('customer')}
                >
                  <Text style={[styles.toggleText, { color: contactType === 'customer' ? '#ffffff' : theme.textSecondary }]}>{t('customers') || 'Customers'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, contactType === 'supplier' && { backgroundColor: accentHex }]}
                  onPress={() => setContactType('supplier')}
                >
                  <Text style={[styles.toggleText, { color: contactType === 'supplier' ? '#ffffff' : theme.textSecondary }]}>{t('suppliers') || 'Suppliers'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: accentHex }]}
                onPress={() => setContactModalVisible(true)}
              >
                <UserPlusIcon color="#ffffff" size={16} style={{ marginRight: 4 }} />
                <Text style={styles.addBtnText}>{t('add_contact') || '+ Add'}</Text>
              </TouchableOpacity>
            </View>

            {contacts.filter(c => c.type === contactType || c.type === 'both').length > 0 ? (
              contacts.filter(c => c.type === contactType || c.type === 'both').map((c) => (
                <View key={c.id || c._id} style={[styles.dataCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={[styles.cardTitle, { color: theme.text }]}>{c.name}</Text>
                      {c.email ? <Text style={[styles.cardSub, { color: theme.textSecondary }]}>✉️ {c.email}</Text> : null}
                      {c.phone ? <Text style={[styles.cardSub, { color: theme.textSecondary }]}>📞 {c.phone}</Text> : null}
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={[styles.emptyContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <UsersIcon color={theme.textMuted} size={32} style={{ marginBottom: 10 }} />
                <Text style={[styles.emptyText, { color: theme.text }]}>{t('no_contacts_found') || 'No contacts found'}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* MODAL: Record Contact */}
      <Modal visible={contactModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Contact</Text>
              <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                <XIcon color="#a6bedf" size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Contact Name</Text>
              <TextInput style={styles.input} value={contactName} onChangeText={setContactName} placeholder="Enter name" placeholderTextColor="#5f88b8" />
              
              <Text style={styles.label}>Email Address</Text>
              <TextInput style={styles.input} value={contactEmail} onChangeText={setContactEmail} placeholder="Enter email" placeholderTextColor="#5f88b8" keyboardType="email-address" />
              
              <Text style={styles.label}>Phone Number</Text>
              <TextInput style={styles.input} value={contactPhone} onChangeText={setContactPhone} placeholder="Enter phone" placeholderTextColor="#5f88b8" keyboardType="phone-pad" />
              
              <Text style={styles.label}>Billing Address</Text>
              <TextInput style={styles.input} value={contactAddress} onChangeText={setContactAddress} placeholder="Enter address" placeholderTextColor="#5f88b8" />

              <Text style={styles.label}>Contact Relationship Type</Text>
              <View style={styles.toggleGroup}>
                <TouchableOpacity style={[styles.toggleBtn, contactType === 'customer' && styles.toggleActive]} onPress={() => setContactType('customer')}>
                  <Text style={[styles.toggleText, contactType === 'customer' && styles.toggleTextActive]}>Customer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, contactType === 'supplier' && styles.toggleActive]} onPress={() => setContactType('supplier')}>
                  <Text style={[styles.toggleText, contactType === 'supplier' && styles.toggleTextActive]}>Supplier</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSaveContact}>
              <Text style={styles.modalSubmitBtnText}>Save Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: Add Invoice / Quote */}
      <Modal visible={invoiceModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{docType === 'invoice' ? 'Create Invoice' : 'Create Estimate'}</Text>
              <TouchableOpacity onPress={() => setInvoiceModalVisible(false)}>
                <XIcon color="#a6bedf" size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Reference / Document Number</Text>
              <TextInput style={styles.input} value={docNumber} onChangeText={setDocNumber} placeholder={docType === 'invoice' ? 'e.g. INV-001' : 'e.g. EST-001'} placeholderTextColor="#5f88b8" />

              <Text style={styles.label}>Customer</Text>
              <View style={styles.pickerBg}>
                {contacts.filter(c => c.type !== 'supplier').map(cust => (
                  <TouchableOpacity
                    key={cust.id || cust._id}
                    style={[styles.pickerItem, selectedCustomerId === (cust.id || cust._id) && styles.pickerItemActive]}
                    onPress={() => setSelectedCustomerId(cust.id || cust._id)}
                  >
                    <Text style={[styles.pickerItemText, selectedCustomerId === (cust.id || cust._id) && styles.pickerItemTextActive]}>{cust.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Date</Text>
              <TextInput style={styles.input} value={docDate} onChangeText={setDocDate} placeholder="YYYY-MM-DD" placeholderTextColor="#5f88b8" />

              <Text style={styles.label}>{docType === 'invoice' ? 'Due Date' : 'Expiry Date'}</Text>
              <TextInput style={styles.input} value={docDueDate} onChangeText={setDocDueDate} placeholder="YYYY-MM-DD" placeholderTextColor="#5f88b8" />

              {/* Line Items builder */}
              <View style={styles.lineItemHeader}>
                <Text style={styles.sectionLabel}>Line Items</Text>
                <TouchableOpacity onPress={addLineItem} style={styles.addLineItemBtn}>
                  <PlusIcon color="#4f8cff" size={14} style={{ marginRight: 2 }} />
                  <Text style={styles.addLineItemBtnText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {lineItems.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={{ flex: 2 }}>
                    <TextInput
                      style={styles.inputItem}
                      value={item.description}
                      onChangeText={(val) => updateLineItem(idx, 'description', val)}
                      placeholder="Item Description"
                      placeholderTextColor="#5f88b8"
                    />
                  </View>
                  <View style={{ flex: 0.8, marginLeft: 6 }}>
                    <TextInput
                      style={styles.inputItem}
                      value={item.quantity}
                      onChangeText={(val) => updateLineItem(idx, 'quantity', val)}
                      placeholder="Qty"
                      placeholderTextColor="#5f88b8"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1.2, marginLeft: 6 }}>
                    <TextInput
                      style={styles.inputItem}
                      value={item.unitPrice}
                      onChangeText={(val) => updateLineItem(idx, 'unitPrice', val)}
                      placeholder="Price"
                      placeholderTextColor="#5f88b8"
                      keyboardType="numeric"
                    />
                  </View>
                  <TouchableOpacity onPress={() => removeLineItem(idx)} style={styles.removeItemBtn}>
                    <Trash2Icon color="#ff6b6b" size={14} />
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={styles.label}>Notes</Text>
              <TextInput style={styles.input} value={docNotes} onChangeText={setDocNotes} placeholder="Invoice notes / instructions" placeholderTextColor="#5f88b8" />

              <View style={styles.totalsBox}>
                <Text style={styles.totalText}>Subtotal: ₹{calculateTotals().subtotal.toLocaleString('en-IN')}</Text>
                <Text style={styles.totalTextBold}>Total Amount: ₹{calculateTotals().total.toLocaleString('en-IN')}</Text>
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSaveInvoiceOrQuote}>
              <Text style={styles.modalSubmitBtnText}>{docType === 'invoice' ? 'Issue Invoice' : 'Issue Estimate'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: Record Bill */}
      <Modal visible={billModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Supplier Bill</Text>
              <TouchableOpacity onPress={() => setBillModalVisible(false)}>
                <XIcon color="#a6bedf" size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Bill Reference Number</Text>
              <TextInput style={styles.input} value={billNumber} onChangeText={setDocNumber} placeholder="e.g. BILL-9824" placeholderTextColor="#5f88b8" />

              <Text style={styles.label}>Supplier / Vendor</Text>
              <View style={styles.pickerBg}>
                {contacts.filter(c => c.type !== 'customer').map(sup => (
                  <TouchableOpacity
                    key={sup.id || sup._id}
                    style={[styles.pickerItem, selectedSupplierId === (sup.id || sup._id) && styles.pickerItemActive]}
                    onPress={() => setSelectedSupplierId(sup.id || sup._id)}
                  >
                    <Text style={[styles.pickerItemText, selectedSupplierId === (sup.id || sup._id) && styles.pickerItemTextActive]}>{sup.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Bill Date</Text>
              <TextInput style={styles.input} value={billDate} onChangeText={setBillDate} placeholder="YYYY-MM-DD" placeholderTextColor="#5f88b8" />

              <Text style={styles.label}>Due Date</Text>
              <TextInput style={styles.input} value={billDueDate} onChangeText={setBillDueDate} placeholder="YYYY-MM-DD" placeholderTextColor="#5f88b8" />

              <Text style={styles.label}>Tax Amount (INR)</Text>
              <TextInput style={styles.input} value={billTax} onChangeText={setBillTax} placeholder="0.00" placeholderTextColor="#5f88b8" keyboardType="numeric" />

              <Text style={styles.label}>Total Bill Amount (INR)</Text>
              <TextInput style={styles.input} value={billAmount} onChangeText={setBillAmount} placeholder="0.00" placeholderTextColor="#5f88b8" keyboardType="numeric" />
            </ScrollView>
            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSaveBill}>
              <Text style={styles.modalSubmitBtnText}>Save Supplier Bill</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: Add Invoice Payment */}
      <Modal visible={paymentModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Payment</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <XIcon color="#a6bedf" size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Payment Date</Text>
              <TextInput style={styles.input} value={payDate} onChangeText={setPayDate} placeholder="YYYY-MM-DD" placeholderTextColor="#5f88b8" />

              <Text style={styles.label}>Payment Amount (INR)</Text>
              <TextInput style={styles.input} value={payAmount} onChangeText={setPayAmount} placeholder="0.00" placeholderTextColor="#5f88b8" keyboardType="numeric" />

              <Text style={styles.label}>Payment Method</Text>
              <TextInput style={styles.input} value={payMethod} onChangeText={setPayMethod} placeholder="UPI, Cash, Card" placeholderTextColor="#5f88b8" />

              <Text style={styles.label}>Transaction Reference / ID</Text>
              <TextInput style={styles.input} value={payReference} onChangeText={setPayReference} placeholder="e.g. UPI Ref ID" placeholderTextColor="#5f88b8" />
            </ScrollView>
            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleRecordPayment}>
              <Text style={styles.modalSubmitBtnText}>Record Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dynamic UPI Payment QR Modal */}
      {upiModalInvoice && (
        <UpiPaymentQrModal
          visible={!!upiModalInvoice}
          onClose={() => setUpiModalInvoice(null)}
          title="Collect Invoice Payment"
          amount={upiModalInvoice.total || 0}
          invoiceNumber={upiModalInvoice.invoiceNumber || 'INV'}
          customerName={getContactName(upiModalInvoice.customerId)}
        />
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
    height: 48,
    backgroundColor: '#0b1d38',
    borderBottomWidth: 1,
    borderColor: '#15345f',
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4f8cff',
  },
  subTabText: {
    color: '#8fc0ff',
    fontSize: 12,
    fontWeight: '600',
  },
  subTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    paddingBottom: 40,
  },
  centerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    color: '#8fc0ff',
    fontSize: 14,
    marginTop: 10,
  },
  statsCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 16,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#15345f',
    marginHorizontal: 10,
  },
  statIconBoxBlue: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(79, 140, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statIconBoxRed: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statHeaderLabel: {
    color: '#a6bedf',
    fontSize: 10,
    fontWeight: '600',
  },
  statValBlue: {
    color: '#4f8cff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  statValRed: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCardGreen: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    shadowColor: '#10b981',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryCardAmber: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    shadowColor: '#f59e0b',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryCardLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryCardAmount: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  gstBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  gstPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  invoiceActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#06111f',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 2,
    flex: 1,
    marginRight: 10,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: '#4f8cff',
  },
  toggleText: {
    color: '#a6bedf',
    fontSize: 11,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f8cff',
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15345f',
    borderColor: '#2b73dc',
    borderWidth: 1,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  scanBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  dataCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  cardSub: {
    color: '#8fc0ff',
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePaid: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
  },
  badgePartial: {
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
  },
  badgeUnpaid: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  badgePending: {
    backgroundColor: 'rgba(79, 140, 255, 0.1)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#06111f',
    paddingBottom: 8,
  },
  metaLabel: {
    color: '#a6bedf',
    fontSize: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceTotal: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionLinkText: {
    color: '#4f8cff',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#a6bedf',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 8, 16, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0b1d38',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 24,
    maxHeight: '80%',
  },
  modalCardLarge: {
    backgroundColor: '#0b1d38',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  label: {
    color: '#8fc0ff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 12,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 10,
  },
  pickerBg: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  pickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
  },
  pickerItemActive: {
    borderColor: '#4f8cff',
    backgroundColor: 'rgba(79, 140, 255, 0.15)',
  },
  pickerItemText: {
    color: '#a6bedf',
    fontSize: 11,
  },
  pickerItemTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  sectionLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  addLineItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addLineItemBtnText: {
    color: '#4f8cff',
    fontSize: 11,
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputItem: {
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
    borderRadius: 8,
    height: 38,
    paddingHorizontal: 8,
    color: '#ffffff',
    fontSize: 12,
  },
  removeItemBtn: {
    padding: 6,
    marginLeft: 6,
  },
  totalsBox: {
    backgroundColor: '#06111f',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    alignItems: 'flex-end',
  },
  totalText: {
    color: '#a6bedf',
    fontSize: 12,
  },
  totalTextBold: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  modalSubmitBtn: {
    backgroundColor: '#4f8cff',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  colorGreen: {
    color: '#2ecc71',
  },
  colorOrange: {
    color: '#f39c12',
  },
  colorRed: {
    color: '#ff6b6b',
  },
  colorBlue: {
    color: '#4f8cff',
  },
  itcStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  itcStatBox: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
  },
  itcStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  itcStatVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  vendorAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  vendorAlertName: {
    fontSize: 12,
    fontWeight: '700',
  },
  vendorAlertAction: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  vendorAlertAmount: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
  },
});
