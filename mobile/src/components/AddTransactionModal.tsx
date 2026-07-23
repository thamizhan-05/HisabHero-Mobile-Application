import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { X, TrendingDown, TrendingUp, Calendar, Tag, FileText, ShoppingBag, CreditCard, Percent } from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';

const XIcon = X as any;
const TrendingDownIcon = TrendingDown as any;
const TrendingUpIcon = TrendingUp as any;
const CalendarIcon = Calendar as any;
const TagIcon = Tag as any;
const FileTextIcon = FileText as any;
const ShoppingBagIcon = ShoppingBag as any;
const CreditCardIcon = CreditCard as any;
const PercentIcon = Percent as any;

type AddTransactionModalProps = {
  visible: boolean;
  onClose: () => void;
  onAddSuccess: () => void;
  apiBaseUrl: string;
  authToken: string | null;
  editTransaction?: any | null; // Optional prop to switch into EDIT mode
};

const TODAY = new Date().toISOString().split('T')[0];

const SUGGESTED_CATEGORIES = [
  'Rent', 'Payroll', 'Utilities', 'Marketing', 'Sales', 'Consulting', 'Software', 'Travel', 'Office', 'Other'
];

export function AddTransactionModal({ 
  visible, 
  onClose, 
  onAddSuccess, 
  apiBaseUrl, 
  authToken,
  editTransaction = null
}: AddTransactionModalProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [date, setDate] = useState(TODAY);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when visible or editTransaction changes
  useEffect(() => {
    if (visible) {
      if (editTransaction) {
        setType(editTransaction.type || 'expense');
        setDate(editTransaction.date || TODAY);
        setDescription(editTransaction.description || '');
        setCategory(editTransaction.category || '');
        setAmount(String(editTransaction.amount || ''));
        setMerchant(editTransaction.merchant || '');
        setPaymentMethod(editTransaction.paymentMethod || '');
        setTaxAmount(String(editTransaction.taxAmount || '0'));
      } else {
        resetForm();
      }
      setErrorMsg(null);
    }
  }, [visible, editTransaction]);

  const resetForm = () => {
    setType('expense');
    setDate(TODAY);
    setDescription('');
    setCategory('');
    setAmount('');
    setMerchant('');
    setPaymentMethod('');
    setTaxAmount('');
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMsg('Please enter an amount greater than 0.');
      return;
    }
    if (!category) {
      setErrorMsg('Please specify a category.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        date,
        description: description || category || 'Transaction',
        category: category || 'Other',
        amount: parsedAmount,
        type,
        merchant: merchant.trim(),
        paymentMethod: paymentMethod.trim(),
        taxAmount: parseFloat(taxAmount || '0'),
      };

      let res;
      if (editTransaction) {
        const txId = editTransaction._id || editTransaction.id;
        res = await apiClient.patch(`/dashboard/transactions/${txId}`, payload);
      } else {
        res = await apiClient.post('/dashboard/transactions', payload);
      }
      
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to record transaction');
      }

      onAddSuccess();
      handleClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Server error. Failed to save transaction.');
    } finally {
      setLoading(false);
    }
  };

  const isEdit = !!editTransaction;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>{isEdit ? 'Edit Entry' : 'Add Transaction'}</Text>
                  <Text style={styles.subtitle}>{isEdit ? 'Modify recorded financial details' : 'Record a new financial entry'}</Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <XIcon color="#a6bedf" size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
                {errorMsg && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                )}

                {/* Type Selection Toggle */}
                <Text style={styles.sectionLabel}>Transaction Type</Text>
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      type === 'expense' && styles.expenseActive
                    ]}
                    onPress={() => setType('expense')}
                  >
                    <TrendingDownIcon color={type === 'expense' ? '#ff6b6b' : '#a6bedf'} size={18} style={styles.toggleIcon} />
                    <Text style={[styles.toggleBtnText, type === 'expense' && styles.expenseTextActive]}>
                      Expense
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      type === 'income' && styles.incomeActive
                    ]}
                    onPress={() => setType('income')}
                  >
                    <TrendingUpIcon color={type === 'income' ? '#2ecc71' : '#a6bedf'} size={18} style={styles.toggleIcon} />
                    <Text style={[styles.toggleBtnText, type === 'income' && styles.incomeTextActive]}>
                      Income
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Amount input */}
                <Text style={styles.sectionLabel}>Amount (INR)</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor="#5f88b8"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                  />
                </View>

                {/* Merchant / Payee input */}
                <Text style={styles.sectionLabel}>Merchant / Payee</Text>
                <View style={styles.inputContainerRow}>
                  <ShoppingBagIcon color="#5f88b8" size={18} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Amazon, Landlord, Supplier LLC"
                    placeholderTextColor="#5f88b8"
                    value={merchant}
                    onChangeText={setMerchant}
                  />
                </View>

                {/* Category input */}
                <Text style={styles.sectionLabel}>Category</Text>
                <View style={styles.inputContainerRow}>
                  <TagIcon color="#5f88b8" size={18} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter category (e.g. Rent)"
                    placeholderTextColor="#5f88b8"
                    value={category}
                    onChangeText={setCategory}
                  />
                </View>

                {/* Suggested categories tags */}
                <View style={styles.tagWrap}>
                  {SUGGESTED_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.tagBtn,
                        category.toLowerCase() === cat.toLowerCase() && styles.tagBtnActive
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[
                        styles.tagText,
                        category.toLowerCase() === cat.toLowerCase() && styles.tagTextActive
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Description */}
                <Text style={styles.sectionLabel}>Description / Notes</Text>
                <View style={styles.inputContainerRow}>
                  <FileTextIcon color="#5f88b8" size={18} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter description (narration)"
                    placeholderTextColor="#5f88b8"
                    value={description}
                    onChangeText={setDescription}
                  />
                </View>

                {/* Payment Method */}
                <Text style={styles.sectionLabel}>Payment Method</Text>
                <View style={styles.inputContainerRow}>
                  <CreditCardIcon color="#5f88b8" size={18} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Cash, UPI, Card, Net Banking"
                    placeholderTextColor="#5f88b8"
                    value={paymentMethod}
                    onChangeText={setPaymentMethod}
                  />
                </View>

                {/* Tax Amount */}
                <Text style={styles.sectionLabel}>Tax Amount (INR)</Text>
                <View style={styles.inputContainerRow}>
                  <PercentIcon color="#5f88b8" size={18} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="0.00"
                    placeholderTextColor="#5f88b8"
                    keyboardType="numeric"
                    value={taxAmount}
                    onChangeText={setTaxAmount}
                  />
                </View>

                {/* Date */}
                <Text style={styles.sectionLabel}>Date (YYYY-MM-DD)</Text>
                <View style={styles.inputContainerRow}>
                  <CalendarIcon color="#5f88b8" size={18} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#5f88b8"
                    value={date}
                    onChangeText={setDate}
                  />
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>

              {/* Submit btn */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isEdit ? 'Save Changes' : (type === 'income' ? '💰 Add Revenue' : '💸 Record Expense')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 8, 16, 0.85)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  card: {
    backgroundColor: '#0b1d38',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#15345f',
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#a6bedf',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  form: {
    maxHeight: 380,
  },
  errorBox: {
    backgroundColor: '#380b0b',
    borderColor: '#5f1515',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff8f8f',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8fc0ff',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#15345f',
    backgroundColor: 'transparent',
  },
  toggleIcon: {
    marginRight: 6,
  },
  toggleBtnText: {
    color: '#a6bedf',
    fontSize: 14,
    fontWeight: '600',
  },
  expenseActive: {
    borderColor: '#ff6b6b',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  expenseTextActive: {
    color: '#ff6b6b',
  },
  incomeActive: {
    borderColor: '#2ecc71',
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
  },
  incomeTextActive: {
    color: '#2ecc71',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
    borderRadius: 16,
    marginBottom: 14,
    paddingHorizontal: 16,
    height: 60,
  },
  currencyPrefix: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4f8cff',
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    height: '100%',
  },
  inputContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
    borderRadius: 14,
    marginBottom: 14,
    paddingHorizontal: 16,
    height: 52,
  },
  fieldIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    height: '100%',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
  },
  tagBtnActive: {
    backgroundColor: '#4f8cff',
    borderColor: '#4f8cff',
  },
  tagText: {
    color: '#a6bedf',
    fontSize: 12,
    fontWeight: '500',
  },
  tagTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#4f8cff',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#4f8cff',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#2b509d',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
