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
import { Users, Plus, DollarSign, FileText, CheckCircle2 } from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';

const UsersIcon = Users as any;
const PlusIcon = Plus as any;

export function PayrollScreen() {
  const [loading, setLoading] = useState(false);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [addVisible, setAddVisible] = useState(false);

  // Single Record Entry State
  const [month, setMonth] = useState('2026-08');
  const [empName, setEmpName] = useState('');
  const [designation, setDesignation] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [allowances, setAllowances] = useState('');
  const [deductions, setDeductions] = useState('');

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/payroll');
      if (res.ok) setPayrolls(await res.json());
    } catch (e) {
      console.warn('Failed to fetch payroll:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayroll = async () => {
    const basic = parseFloat(basicSalary);
    if (!empName.trim() || isNaN(basic) || basic <= 0) {
      Alert.alert('Error', 'Please enter employee name and a valid basic salary.');
      return;
    }
    setLoading(true);
    try {
      const record = {
        employeeName: empName.trim(),
        designation: designation.trim() || 'Staff',
        basicSalary: basic,
        allowances: parseFloat(allowances) || 0,
        deductions: parseFloat(deductions) || 0,
        paymentStatus: 'Paid',
      };
      const res = await apiClient.post('/api/payroll', {
        month,
        records: [record],
      });
      if (res.ok) {
        Alert.alert('Payroll Processed', `Salary record for ${empName} added successfully.`);
        setAddVisible(false);
        setEmpName('');
        setDesignation('');
        setBasicSalary('');
        setAllowances('');
        setDeductions('');
        fetchPayroll();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to process payroll.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payroll & Employee Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddVisible(true)}>
          <PlusIcon color="#fff" size={16} />
          <Text style={styles.addBtnText}>Run Payroll</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4f8cff" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {payrolls.length === 0 ? (
            <Text style={styles.emptyText}>No payroll runs processed yet. Tap 'Run Payroll' to issue monthly salaries and generate payslips.</Text>
          ) : (
            payrolls.map((p) => (
              <View key={p._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <UsersIcon color="#4f8cff" size={18} />
                  <Text style={styles.monthTitle}>Payroll Month: {p.month}</Text>
                  <View style={styles.statusBadge}><Text style={styles.statusText}>{p.status}</Text></View>
                </View>

                <Text style={styles.totalAmount}>Total Disbursement: ₹{(p.totalAmount || 0).toLocaleString('en-IN')}</Text>

                <View style={styles.recordsList}>
                  {p.records?.map((r: any, idx: number) => (
                    <View key={idx} style={styles.recordRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.empName}>{r.employeeName}</Text>
                        <Text style={styles.designation}>{r.designation || 'Employee'}</Text>
                      </View>
                      <Text style={styles.netSalary}>₹{(r.netSalary || 0).toLocaleString('en-IN')}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Add Salary Modal */}
      <Modal visible={addVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Run Salary Disbursement</Text>

            <Text style={styles.label}>Payroll Month (YYYY-MM)</Text>
            <TextInput style={styles.input} value={month} onChangeText={setMonth} placeholder="2026-08" placeholderTextColor="#5f88b8" />

            <Text style={styles.label}>Employee Name</Text>
            <TextInput style={styles.input} value={empName} onChangeText={setEmpName} placeholder="e.g. Rahul Sharma" placeholderTextColor="#5f88b8" />

            <Text style={styles.label}>Designation</Text>
            <TextInput style={styles.input} value={designation} onChangeText={setDesignation} placeholder="e.g. Senior Developer" placeholderTextColor="#5f88b8" />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Basic Salary (₹)</Text>
                <TextInput style={styles.input} value={basicSalary} onChangeText={setBasicSalary} keyboardType="numeric" placeholder="45000" placeholderTextColor="#5f88b8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Allowances (₹)</Text>
                <TextInput style={styles.input} value={allowances} onChangeText={setAllowances} keyboardType="numeric" placeholder="5000" placeholderTextColor="#5f88b8" />
              </View>
            </View>

            <Text style={styles.label}>Deductions / PF (₹)</Text>
            <TextInput style={styles.input} value={deductions} onChangeText={setDeductions} keyboardType="numeric" placeholder="2000" placeholderTextColor="#5f88b8" />

            <TouchableOpacity style={styles.saveBtn} onPress={handleProcessPayroll}>
              <Text style={styles.saveBtnText}>Disburse Salary & Issue Payslip</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddVisible(false)}>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#15345f' },
  title: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f8cff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 4 },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  scroll: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#5f88b8', textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#0b1d38', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#15345f' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700', flex: 1 },
  statusBadge: { backgroundColor: 'rgba(46,204,113,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { color: '#2ecc71', fontSize: 11, fontWeight: '700' },
  totalAmount: { color: '#4f8cff', fontSize: 14, fontWeight: '800', marginTop: 8 },
  recordsList: { marginTop: 10, borderTopWidth: 1, borderColor: '#15345f', paddingTop: 8 },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  empName: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  designation: { color: '#5f88b8', fontSize: 11 },
  netSalary: { color: '#2ecc71', fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#07162c', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#15345f' },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', marginBottom: 12 },
  label: { color: '#8fc0ff', fontSize: 12, marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: '#0b1d38', color: '#ffffff', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#15345f' },
  row: { flexDirection: 'row', gap: 10 },
  saveBtn: { backgroundColor: '#4f8cff', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#ffffff', fontWeight: '800' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  cancelBtnText: { color: '#ff6b6b', fontWeight: '700' },
});
