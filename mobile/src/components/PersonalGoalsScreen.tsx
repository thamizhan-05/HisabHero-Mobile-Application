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
} from 'react-native';
import { Target, Award, Plus, CheckCircle, ShieldCheck, Trophy, Sparkles } from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';
import { useTheme } from '../theme/themeSystem';
import { AppCard, BadgePill, SectionHeader, EmptyStateWidget } from './uiComponents';

const TargetIcon = Target as any;
const AwardIcon = Award as any;
const PlusIcon = Plus as any;
const CheckCircleIcon = CheckCircle as any;
const TrophyIcon = Trophy as any;
const SparklesIcon = Sparkles as any;

type TabMode = 'goals' | 'achievements';

export function PersonalGoalsScreen() {
  const { theme, accentHex } = useTheme();
  const [tabMode, setTabMode] = useState<TabMode>('goals');
  const [goals, setGoals] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Contribution modal state
  const [contributeGoal, setContributeGoal] = useState<any | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [contributing, setContributing] = useState(false);

  // Goal Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('savings');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDateStr, setTargetDateStr] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resGoals, resAch] = await Promise.all([
        apiClient.get('/goals'),
        apiClient.get('/achievements'),
      ]);

      const [dataGoals, dataAch] = await Promise.all([
        resGoals.ok ? resGoals.json() : [],
        resAch.ok ? resAch.json() : [],
      ]);

      setGoals(Array.isArray(dataGoals) ? dataGoals : []);
      setAchievements(Array.isArray(dataAch) ? dataAch : []);
    } catch (e) {
      console.warn('Failed to fetch goals:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateGoal = async () => {
    if (!title.trim() || !targetAmount || !targetDateStr) {
      Alert.alert('Required', 'Please fill in title, target amount, and target date.');
      return;
    }

    try {
      const res = await apiClient.post('/goals', {
        title: title.trim(),
        category,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        targetDate: targetDateStr,
      });

      if (res.ok) {
        setModalVisible(false);
        setTitle('');
        setTargetAmount('');
        setCurrentAmount('');
        fetchData();
      } else {
        const errData = await res.json().catch(() => ({}));
        Alert.alert('Error', errData.error || 'Failed to create goal');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save goal');
    }
  };

  const handleUpdateProgress = async (goalId: string, currentAmt: number, targetAmt: number) => {
    Alert.prompt(
      'Update Progress',
      `Enter new saved amount (Target: ₹${targetAmt.toLocaleString('en-IN')})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (val?: string) => {
            if (!val || isNaN(Number(val))) return;
            try {
              const res = await apiClient.put(`/goals/${goalId}`, {
                currentAmount: Number(val),
              });
              if (res.ok) fetchData();
            } catch (e) {}
          },
        },
      ],
      'plain-text',
      String(currentAmt)
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Tab Switcher */}
      <View style={[styles.tabBar, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[styles.tabBtn, tabMode === 'goals' && { backgroundColor: accentHex }]}
          onPress={() => setTabMode('goals')}
        >
          <TargetIcon color={tabMode === 'goals' ? '#fff' : theme.textSecondary} size={16} />
          <Text style={[styles.tabText, { color: tabMode === 'goals' ? '#fff' : theme.textSecondary }]}>Financial Goals</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, tabMode === 'achievements' && { backgroundColor: accentHex }]}
          onPress={() => setTabMode('achievements')}
        >
          <TrophyIcon color={tabMode === 'achievements' ? '#fff' : theme.textSecondary} size={16} />
          <Text style={[styles.tabText, { color: tabMode === 'achievements' ? '#fff' : theme.textSecondary }]}>Achievements</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {tabMode === 'goals' ? (
          <>
            <SectionHeader
              title="Personal Savings & Fund Goals"
              subtitle="Track your progress towards financial freedom"
              actionText="+ New Goal"
              onAction={() => setModalVisible(true)}
            />

            {loading && goals.length === 0 ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator color={accentHex} size="large" />
              </View>
            ) : goals.length === 0 ? (
              <EmptyStateWidget
                icon={<TargetIcon color={accentHex} size={24} />}
                title="No Financial Goals Set"
                description="Set up savings goals or emergency funds to track your financial growth."
                actionLabel="+ Create First Goal"
                onAction={() => setModalVisible(true)}
              />
            ) : (
              goals.map((g) => {
                const percent = Math.min(100, Math.round(((g.currentAmount || 0) / (g.targetAmount || 1)) * 100));
                const targetDateFormatted = g.targetDate ? new Date(g.targetDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'TBD';

                return (
                  <AppCard key={g._id} style={styles.goalCard}>
                    <View style={styles.goalHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.goalTitle, { color: theme.text }]}>{g.title}</Text>
                        <Text style={[styles.goalSub, { color: theme.textSecondary }]}>Target: {targetDateFormatted}</Text>
                      </View>
                      <BadgePill
                        label={g.status === 'completed' ? 'COMPLETED' : `${percent}%`}
                        variant={g.status === 'completed' ? 'success' : 'primary'}
                      />
                    </View>

                    <View style={styles.amountRow}>
                      <Text style={[styles.currentAmt, { color: theme.text }]}>₹{(g.currentAmount || 0).toLocaleString('en-IN')}</Text>
                      <Text style={[styles.targetAmt, { color: theme.textMuted }]}>/ ₹{(g.targetAmount || 0).toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={[styles.progressBg, { backgroundColor: theme.inputBg }]}>
                      <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: g.status === 'completed' ? '#10b981' : accentHex }]} />
                    </View>

                    {g.status !== 'completed' && (
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                        <TouchableOpacity
                          style={{ backgroundColor: `${accentHex}20`, borderWidth: 1, borderColor: `${accentHex}50`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                          onPress={() => {
                            setContributeGoal(g);
                            setDepositAmount('');
                          }}
                        >
                          <PlusIcon size={12} color={accentHex} style={{ marginRight: 4 }} />
                          <Text style={{ color: accentHex, fontSize: 12, fontWeight: '700' }}>+ Add Deposit</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </AppCard>
                );
              })
            )}
          </>
        ) : (
          <>
            <SectionHeader title="Gamification Achievements" subtitle="Calculated 100% from actual MongoDB history" />

            {achievements.map((ach) => (
              <AppCard key={ach.achievementKey} style={[styles.achCard, !ach.unlocked && { opacity: 0.6 }]}>
                <View style={styles.achRow}>
                  <View style={[styles.trophyBg, { backgroundColor: ach.unlocked ? `${accentHex}20` : '#ffffff10' }]}>
                    <TrophyIcon color={ach.unlocked ? accentHex : theme.textMuted} size={22} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.achTitle, { color: theme.text }]}>{ach.title}</Text>
                    <Text style={[styles.achDesc, { color: theme.textSecondary }]}>{ach.description}</Text>
                  </View>
                  <BadgePill label={ach.unlocked ? 'UNLOCKED' : `${ach.progress}%`} variant={ach.unlocked ? 'success' : 'neutral'} />
                </View>
              </AppCard>
            ))}
          </>
        )}
      </ScrollView>

      {/* Goal Deposit Contribution Modal */}
      <Modal visible={!!contributeGoal} animationType="fade" transparent onRequestClose={() => setContributeGoal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Contribution</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 12 }}>
              Deposit funds into "{contributeGoal?.title}"
            </Text>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Contribution Amount (₹)</Text>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
              value={depositAmount}
              onChangeText={setDepositAmount}
              keyboardType="numeric"
              placeholder="e.g. 5000"
              placeholderTextColor={theme.textMuted}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.bg }]} onPress={() => setContributeGoal(null)}>
                <Text style={{ color: theme.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: accentHex }]}
                disabled={contributing || !depositAmount}
                onPress={async () => {
                  if (!contributeGoal || !depositAmount) return;
                  setContributing(true);
                  try {
                    const res = await apiClient.post(`/dashboard/goals/${contributeGoal._id}/contribute`, {
                      amount: parseFloat(depositAmount),
                    });
                    if (res.ok) {
                      Alert.alert('Contribution Saved! 🎉', `Added ₹${parseFloat(depositAmount).toLocaleString('en-IN')} to "${contributeGoal.title}".`);
                      setContributeGoal(null);
                      setDepositAmount('');
                      fetchData();
                    } else {
                      const data = await res.json().catch(() => ({}));
                      Alert.alert('Error', data.error || 'Failed to save contribution');
                    }
                  } catch (e: any) {
                    Alert.alert('Error', e.message || 'Contribution failed');
                  } finally {
                    setContributing(false);
                  }
                }}
              >
                {contributing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>Confirm Deposit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Goal Creation Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Create Financial Goal</Text>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Goal Title</Text>
            <TextInput style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]} value={title} onChangeText={setTitle} placeholder="e.g. Emergency Fund" placeholderTextColor={theme.textMuted} />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Target Amount (₹)</Text>
            <TextInput style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]} value={targetAmount} onChangeText={setTargetAmount} keyboardType="numeric" placeholder="100000" placeholderTextColor={theme.textMuted} />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Initial Amount Saved (₹)</Text>
            <TextInput style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]} value={currentAmount} onChangeText={setCurrentAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={theme.textMuted} />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.bg }]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: theme.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: accentHex }]} onPress={handleCreateGoal}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>Save Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: 'row', padding: 8, gap: 8, borderBottomWidth: 1 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  tabText: { fontSize: 13, fontWeight: '800' },
  scrollContent: { padding: 16, gap: 12 },
  goalCard: { padding: 16, gap: 10 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalTitle: { fontSize: 16, fontWeight: '800' },
  goalSub: { fontSize: 11, marginTop: 2 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  currentAmt: { fontSize: 22, fontWeight: '900' },
  targetAmt: { fontSize: 13, fontWeight: '600' },
  progressBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', borderRadius: 4 },
  achCard: { padding: 14 },
  achRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trophyBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  achTitle: { fontSize: 15, fontWeight: '800' },
  achDesc: { fontSize: 12, marginTop: 2 },
  centerLoading: { padding: 40, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 20, borderRadius: 20, borderWidth: 1, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  input: { height: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  modalBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
