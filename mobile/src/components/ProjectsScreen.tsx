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
import { Briefcase, Plus, TrendingUp, DollarSign, Calendar, CheckCircle2 } from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';

const BriefcaseIcon = Briefcase as any;
const PlusIcon = Plus as any;
const TrendingUpIcon = TrendingUp as any;

export function ProjectsScreen() {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [addVisible, setAddVisible] = useState(false);
  const [name, setName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/projects');
      if (res.ok) setProjects(await res.json());
    } catch (e) {
      console.warn('Failed to fetch projects:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Project name is required.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/api/projects', {
        name,
        customerName,
        budget: parseFloat(budget) || 0,
        description,
      });
      if (res.ok) {
        Alert.alert('Success', 'Project created successfully.');
        setAddVisible(false);
        setName('');
        setCustomerName('');
        setBudget('');
        setDescription('');
        fetchProjects();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Project Accounting</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddVisible(true)}>
          <PlusIcon color="#fff" size={16} />
          <Text style={styles.addBtnText}>New Project</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4f8cff" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {projects.length === 0 ? (
            <Text style={styles.emptyText}>No projects recorded yet. Tap 'New Project' to start tracking project budgets and profitability.</Text>
          ) : (
            projects.map((p) => {
              const variance = (p.budget || 0) - (p.totalExpenses || 0);
              return (
                <View key={p._id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <BriefcaseIcon color="#4f8cff" size={18} />
                    <Text style={styles.projectName}>{p.name}</Text>
                    <View style={styles.statusBadge}><Text style={styles.statusText}>{p.status}</Text></View>
                  </View>

                  {p.customerName ? <Text style={styles.customer}>Client: {p.customerName}</Text> : null}
                  {p.description ? <Text style={styles.desc}>{p.description}</Text> : null}

                  <View style={styles.metricsRow}>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Budget</Text>
                      <Text style={styles.metricVal}>₹{(p.budget || 0).toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Actual Spent</Text>
                      <Text style={[styles.metricVal, { color: '#ff6b6b' }]}>₹{(p.totalExpenses || 0).toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Variance</Text>
                      <Text style={[styles.metricVal, { color: variance >= 0 ? '#2ecc71' : '#ff6b6b' }]}>
                        ₹{variance.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Add Project Modal */}
      <Modal visible={addVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create New Project</Text>

            <Text style={styles.label}>Project Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Website Redesign" placeholderTextColor="#5f88b8" />

            <Text style={styles.label}>Customer / Client</Text>
            <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="e.g. Acme Corp" placeholderTextColor="#5f88b8" />

            <Text style={styles.label}>Total Budget (₹)</Text>
            <TextInput style={styles.input} value={budget} onChangeText={setBudget} keyboardType="numeric" placeholder="e.g. 150000" placeholderTextColor="#5f88b8" />

            <Text style={styles.label}>Project Description</Text>
            <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Brief summary of project scope" placeholderTextColor="#5f88b8" />

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateProject}>
              <Text style={styles.saveBtnText}>Save Project</Text>
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
  title: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f8cff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 4 },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  scroll: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#5f88b8', textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#0b1d38', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#15345f' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  projectName: { color: '#ffffff', fontSize: 15, fontWeight: '700', flex: 1 },
  statusBadge: { backgroundColor: 'rgba(46,204,113,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { color: '#2ecc71', fontSize: 11, fontWeight: '700' },
  customer: { color: '#4f8cff', fontSize: 12, marginTop: 4 },
  desc: { color: '#5f88b8', fontSize: 12, marginTop: 2 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, borderTopWidth: 1, borderColor: '#15345f', paddingTop: 10 },
  metric: { alignItems: 'center' },
  metricLabel: { color: '#5f88b8', fontSize: 11 },
  metricVal: { color: '#ffffff', fontSize: 13, fontWeight: '800', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#07162c', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#15345f' },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', marginBottom: 12 },
  label: { color: '#8fc0ff', fontSize: 12, marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: '#0b1d38', color: '#ffffff', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#15345f' },
  saveBtn: { backgroundColor: '#4f8cff', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#ffffff', fontWeight: '800' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  cancelBtnText: { color: '#ff6b6b', fontWeight: '700' },
});
