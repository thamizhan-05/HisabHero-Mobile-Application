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
import { useTheme } from '../theme/themeSystem';
import { useTranslation } from '../theme/i18n';

const BriefcaseIcon = Briefcase as any;
const PlusIcon = Plus as any;
const TrendingUpIcon = TrendingUp as any;

export function ProjectsScreen() {
  const { theme, accentHex } = useTheme();
  const { t } = useTranslation();
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
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t('projects')}</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: accentHex }]} onPress={() => setAddVisible(true)}>
          <PlusIcon color="#fff" size={16} />
          <Text style={styles.addBtnText}>{t('add_contact')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={accentHex} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {projects.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No projects recorded yet. Tap '+ Add' to start tracking project budgets and profitability.</Text>
          ) : (
            projects.map((p) => {
              const variance = (p.budget || 0) - (p.totalExpenses || 0);
              return (
                <View key={p._id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={styles.cardTop}>
                    <BriefcaseIcon color={accentHex} size={18} />
                    <Text style={[styles.projectName, { color: theme.text }]}>{p.name}</Text>
                    <View style={styles.statusBadge}><Text style={styles.statusText}>{p.status}</Text></View>
                  </View>

                  {p.customerName ? <Text style={[styles.customer, { color: accentHex }]}>Client: {p.customerName}</Text> : null}
                  {p.description ? <Text style={[styles.desc, { color: theme.textSecondary }]}>{p.description}</Text> : null}

                  <View style={[styles.metricsRow, { borderColor: theme.cardBorder }]}>
                    <View style={styles.metric}>
                      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{t('monthly_budgets')}</Text>
                      <Text style={[styles.metricVal, { color: theme.text }]}>₹{(p.budget || 0).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{t('total_expense')}</Text>
                      <Text style={[styles.metricVal, { color: theme.text }]}>₹{(p.totalExpenses || 0).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Variance</Text>
                      <Text style={[styles.metricVal, { color: variance >= 0 ? '#2ecc71' : '#ff6b6b' }]}>₹{variance.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <Modal visible={addVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Create New Project</Text>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Project Name</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.cardBorder, color: theme.text }]} value={name} onChangeText={setName} placeholder="e.g. Website Redesign" placeholderTextColor={theme.textMuted} />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Customer / Client</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.cardBorder, color: theme.text }]} value={customerName} onChangeText={setCustomerName} placeholder="e.g. Acme Corp" placeholderTextColor={theme.textMuted} />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Total Budget (₹)</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.cardBorder, color: theme.text }]} value={budget} onChangeText={setBudget} keyboardType="numeric" placeholder="e.g. 150000" placeholderTextColor={theme.textMuted} />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Project Description</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.cardBorder, color: theme.text }]} value={description} onChangeText={setDescription} placeholder="Brief summary of project scope" placeholderTextColor={theme.textMuted} />

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accentHex }]} onPress={handleCreateProject}>
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
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 4 },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  scroll: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 40 },
  card: { borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  projectName: { fontSize: 15, fontWeight: '700', flex: 1 },
  statusBadge: { backgroundColor: 'rgba(46,204,113,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { color: '#2ecc71', fontSize: 11, fontWeight: '700' },
  customer: { fontSize: 12, marginTop: 4 },
  desc: { fontSize: 12, marginTop: 2 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, borderTopWidth: 1, paddingTop: 10 },
  metric: { alignItems: 'center' },
  metricLabel: { fontSize: 11 },
  metricVal: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 16 },
  modalCard: { borderRadius: 12, padding: 16, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  label: { fontSize: 12, marginTop: 8, marginBottom: 4 },
  input: { padding: 10, borderRadius: 6, borderWidth: 1 },
  saveBtn: { paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#ffffff', fontWeight: '800' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  cancelBtnText: { color: '#ff6b6b', fontWeight: '700' },
});
