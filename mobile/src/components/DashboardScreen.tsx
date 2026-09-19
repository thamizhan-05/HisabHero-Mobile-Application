import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import {
  Sparkles,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Percent,
  Calendar,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  Mic,
  Users,
  Repeat,
  FileSpreadsheet,
  Activity,
  BarChart3,
  Layers,
  Sliders,
  Edit2,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
  Lock,
  Fingerprint,
  ShieldCheck,
} from 'lucide-react-native';
import { AddTransactionModal } from './AddTransactionModal';
import { AiReportModal } from './AiReportModal';
import { VoiceCommandModal } from './VoiceCommandModal';
import { AchievementBadgeWidget, HeroInsightsWidget, DataTable, EmptyStateWidget, AppButton } from './uiComponents';

import { apiClient } from '../lib/apiClient';
import { useTheme } from '../theme/themeSystem';
import { useTranslation } from '../theme/i18n';
import { authenticateWithBiometrics } from '../services/biometricAuthService';
import {
  calculate3TierHealthScore,
  calculateSafeDailySpend,
  calculateDualRunwayWithSandbox,
  calculateMoMVariance,
  safeRound,
  formatCurrencyINR
} from '../lib/financialEngine';

const ImageComp = Image as any;

// Cast icons as any to bypass React Native / SVG element TypeScript mismatch
const SparklesIcon = Sparkles as any;
const PlusIcon = Plus as any;
const Trash2Icon = Trash2 as any;
const TrendingUpIcon = TrendingUp as any;
const TrendingDownIcon = TrendingDown as any;
const PercentIcon = Percent as any;
const CalendarIcon = Calendar as any;
const AlertTriangleIcon = AlertTriangle as any;
const LightbulbIcon = Lightbulb as any;
const ShieldAlertIcon = ShieldAlert as any;

type DashboardScreenProps = {
  stats: any[];
  transactions: any[];
  runway: any[];
  runwayMonths: number;
  healthScore: number;
  alerts: any[];
  apiBaseUrl: string;
  authToken: string | null;
  loading: boolean;
  onRefreshData: () => void;
  onOpenWorkspaceSwitcher: () => void;
  activeWorkspaceId?: string;
  activeWorkspaceRole?: string;
  user?: any;
  onNavigateToTool?: (tool: string) => void;
  isStealthMode?: boolean;
};

const SUGGESTED_CATEGORIES = [
  'Rent', 'Payroll', 'Utilities', 'Marketing', 'Sales', 'Consulting', 'Software', 'Travel', 'Office', 'Other'
];

export function DashboardScreen({
  stats,
  transactions,
  runway,
  runwayMonths,
  healthScore,
  alerts,
  apiBaseUrl,
  authToken,
  loading,
  onRefreshData,
  onOpenWorkspaceSwitcher,
  activeWorkspaceId = 'personal',
  activeWorkspaceRole = 'owner',
  user,
  onNavigateToTool,
  isStealthMode = false,
}: DashboardScreenProps) {
  const { theme, accentHex } = useTheme();
  const { t } = useTranslation();
  const [addTxVisible, setAddTxVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [chartAnalysisVisible, setChartAnalysisVisible] = useState(false);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [invitationCount, setInvitationCount] = useState(0);

  // Phase 1 UI States
  const [editTransaction, setEditTransaction] = useState<any | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Dynamic Workspace Preset (Executive, Analyst, Operations)
  const [dashboardPreset, setDashboardPreset] = useState<'executive' | 'analyst' | 'operations'>('executive');

  // Inline Opening Balance state
  const [editingOpeningBal, setEditingOpeningBal] = useState(false);
  const [openingBalInput, setOpeningBalInput] = useState('');
  const [savingOpeningBal, setSavingOpeningBal] = useState(false);

  // What-If Simulation Sandbox State
  const [showSandbox, setShowSandbox] = useState(false);
  const [simInflow, setSimInflow] = useState('');
  const [simOutflow, setSimOutflow] = useState('');
  const [simBalance, setSimBalance] = useState('');
  const [excludeSubscriptions, setExcludeSubscriptions] = useState(false);

  // NLP Quick Log & Health Modal States
  const [nlpInput, setNlpInput] = useState('');
  const [nlpProcessing, setNlpProcessing] = useState(false);
  const [healthModalVisible, setHealthModalVisible] = useState(false);

  const handleNlpQuickLog = async () => {
    const raw = nlpInput.trim();
    if (!raw) return;

    setNlpProcessing(true);
    try {
      // 1. Extract amount
      const numMatch = raw.match(/(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
      const amountStr = numMatch ? numMatch[1].replace(/,/g, '') : null;
      const amount = amountStr ? parseFloat(amountStr) : 0;

      if (!amount || isNaN(amount) || amount <= 0) {
        Alert.alert('Amount Missing', 'Please include an amount, e.g. "Paid ₹450 for lunch via UPI"');
        setNlpProcessing(false);
        return;
      }

      // 2. Extract type
      const lower = raw.toLowerCase();
      const isIncome = lower.includes('received') || lower.includes('got') || lower.includes('earned') || lower.includes('income') || lower.includes('sale') || lower.includes('client paid');
      const type = isIncome ? 'income' : 'expense';

      // 3. Extract payment method
      let paymentMethod = 'UPI';
      if (lower.includes('cash')) paymentMethod = 'Cash';
      else if (lower.includes('card') || lower.includes('credit') || lower.includes('debit')) paymentMethod = 'Card';
      else if (lower.includes('bank') || lower.includes('neft') || lower.includes('rtgs') || lower.includes('imps') || lower.includes('wire')) paymentMethod = 'Bank Transfer';

      // 4. Extract Category
      let category = isIncome ? 'Product Sales' : 'General & Admin';
      if (lower.includes('lunch') || lower.includes('dinner') || lower.includes('food') || lower.includes('swiggy') || lower.includes('zomato') || lower.includes('tea') || lower.includes('coffee') || lower.includes('snacks')) {
        category = 'Food & Dining';
      } else if (lower.includes('uber') || lower.includes('ola') || lower.includes('flight') || lower.includes('travel') || lower.includes('cab') || lower.includes('petrol') || lower.includes('fuel')) {
        category = 'Travel & Logistics';
      } else if (lower.includes('aws') || lower.includes('software') || lower.includes('saas') || lower.includes('domain') || lower.includes('subscription') || lower.includes('tool')) {
        category = 'Software & Subscriptions';
      } else if (lower.includes('rent') || lower.includes('office') || lower.includes('workspace')) {
        category = 'Rent & Facilities';
      } else if (lower.includes('salary') || lower.includes('payroll') || lower.includes('stipend')) {
        category = 'Salaries & Wages';
      } else if (lower.includes('retainer') || lower.includes('consulting') || lower.includes('project')) {
        category = 'Client Retainer';
      }

      const payload = {
        description: raw,
        amount,
        type,
        category,
        paymentMethod,
        date: new Date().toISOString().split('T')[0],
      };

      const res = await apiClient.post('/transactions', payload);
      if (res.ok) {
        Alert.alert(
          '⚡ Transaction Logged',
          `Successfully recorded ${type.toUpperCase()} of ₹${amount.toLocaleString('en-IN')} [${category}] via ${paymentMethod}.`
        );
        setNlpInput('');
        handleRefresh();
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to log transaction.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not process quick transaction.');
    } finally {
      setNlpProcessing(false);
    }
  };
  
  // Phase 2 AR/AP States
  const [arApStats, setArApStats] = useState<any>({
    accountsReceivable: 0,
    overdueReceivable: 0,
    accountsPayable: 0,
    overduePayable: 0
  });

  const handleSaveOpeningBalance = async () => {
    const parsed = parseFloat(openingBalInput);
    if (isNaN(parsed) || parsed < 0) {
      Alert.alert('Invalid Balance', 'Please enter a valid starting cash balance.');
      return;
    }
    setSavingOpeningBal(true);
    try {
      const res = await apiClient.put(`/workspaces/${activeWorkspaceId}/settings`, { openingBalance: parsed });
      if (res.ok) {
        Alert.alert('Balance Saved', `Opening cash account balance updated to ₹${parsed.toLocaleString('en-IN')}`);
        setEditingOpeningBal(false);
        onRefreshData();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update opening balance.');
    } finally {
      setSavingOpeningBal(false);
    }
  };

  // Month-over-Month Variance Engine ("What Changed?")
  const momVariance = useMemo(() => {
    const monthMap: Record<string, { inflow: number; outflow: number }> = {};
    (transactions || []).forEach(t => {
      const m = (t.date || '').slice(0, 7);
      if (!m) return;
      if (!monthMap[m]) monthMap[m] = { inflow: 0, outflow: 0 };
      if (t.type === 'income') monthMap[m].inflow += Number(t.amount || 0);
      else monthMap[m].outflow += Number(t.amount || 0);
    });
    const months = Object.keys(monthMap).sort();
    const curr = months[months.length - 1] ? monthMap[months[months.length - 1]] : { inflow: 0, outflow: 0 };
    const prev = months[months.length - 2] ? monthMap[months[months.length - 2]] : { inflow: 0, outflow: 0 };
    return calculateMoMVariance(curr.inflow, curr.outflow, prev.inflow, prev.outflow);
  }, [transactions]);

  // Safe Daily Spend & Emergency Buffer
  const safeDailySpendData = useMemo(() => {
    const totalInflow = (transactions || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalOutflow = (transactions || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
    const currentBalance = Math.max(0, totalInflow - totalOutflow);
    return calculateSafeDailySpend({
      currentBalance,
      categoryBudgets: { Food: 15000, Utilities: 8000, Travel: 5000 },
      categorySpending: budgetStatus?.categoryStatus ? Object.fromEntries(Object.entries(budgetStatus.categoryStatus).map(([k, v]: any) => [k, v.used])) : {}
    });
  }, [transactions, budgetStatus]);

  // What-If Simulation Projections
  const sandboxRunwayResult = useMemo(() => {
    const totalInflow = (transactions || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalOutflow = (transactions || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
    const currentBalance = Math.max(0, totalInflow - totalOutflow);
    const monthlyBurn = totalOutflow > 0 ? (totalOutflow / 3) : 10000;
    const monthlyInflow = totalInflow > 0 ? (totalInflow / 3) : 0;

    return calculateDualRunwayWithSandbox({
      currentBalance,
      monthlyOutflow: monthlyBurn,
      monthlyInflow,
      subscriptionCost: 2500,
      overrides: showSandbox ? {
        simulatedBalance: simBalance ? parseFloat(simBalance) : undefined,
        simulatedInflow: simInflow ? parseFloat(simInflow) : undefined,
        simulatedOutflow: simOutflow ? parseFloat(simOutflow) : undefined,
        excludeSubscriptions
      } : null
    });
  }, [transactions, showSandbox, simBalance, simInflow, simOutflow, excludeSubscriptions]);

  const fetchInvitations = async () => {
    if (!authToken) return;
    try {
      const res = await apiClient.get('/invitations');
      if (res.ok) {
        const list = await res.json();
        const pending = list.filter((x: any) => x.status === 'pending');
        setInvitationCount(pending.length);
      }
    } catch (err) {
      console.error('Failed to load invitations count:', err);
    }
  };

  const fetchBudgetStatus = async () => {
    if (!authToken) return;
    try {
      const res = await apiClient.get('/dashboard/budget');
      if (res.ok) {
        const data = await res.json();
        setBudgetStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch budget status:', err);
    }
  };

  const fetchArApStats = async () => {
    if (!authToken) return;
    try {
      const res = await apiClient.get('/dashboard/ar-ap');
      if (res.ok) {
        const data = await res.json();
        setArApStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch AR/AP stats:', err);
    }
  };

  const fetchAutoAuditor = async () => {
    try {
      const res = await apiClient.get('/api/ai/auto-auditor');
      if (res.ok) {
        const data = await res.json();
        if (data?.success) {
          setAnomalies(data.anomalies || []);
        }
      }
    } catch (err) {
      // quiet fallback
    }
  };

  const [pendingHighValueTxs, setPendingHighValueTxs] = useState<any[]>([]);
  const [approvingHighValueId, setApprovingHighValueId] = useState<string | null>(null);

  const fetchHighValuePending = async () => {
    if (!authToken || activeWorkspaceRole !== 'owner') return;
    try {
      const res = await apiClient.get('/dashboard/high-value-pending');
      if (res.ok) {
        const data = await res.json();
        setPendingHighValueTxs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      // quiet fallback
    }
  };

  const handleApproveHighValueWithBiometrics = async (txId: string, amount: number, description: string) => {
    const authRes = await authenticateWithBiometrics(`Authorize high-value disbursement of ₹${amount.toLocaleString('en-IN')}`);
    if (!authRes.success) {
      Alert.alert('Authorization Cancelled', authRes.error || 'Biometric authorization required to release high-value funds.');
      return;
    }

    setApprovingHighValueId(txId);
    try {
      const res = await apiClient.post(`/dashboard/transactions/${txId}/approve-high-value`, {});
      if (res.ok) {
        Alert.alert('Outflow Approved', `Disbursement of ₹${amount.toLocaleString('en-IN')} ("${description}") approved and released to ledger.`);
        fetchHighValuePending();
        onRefreshData();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Approval failed.');
    } finally {
      setApprovingHighValueId(null);
    }
  };

  useEffect(() => {
    fetchInvitations();
    fetchBudgetStatus();
    fetchArApStats();
    fetchAutoAuditor();
    fetchHighValuePending();
  }, [authToken, loading, activeWorkspaceRole]);

  const handleRefresh = () => {
    onRefreshData();
    fetchBudgetStatus();
    fetchArApStats();
    fetchAutoAuditor();
    fetchHighValuePending();
  };

  const handleSeedSampleData = async () => {
    try {
      const demoTxs = [
        { description: 'SaaS Client Annual Enterprise Retainer', amount: 85000, type: 'income', category: 'Client Retainer', date: new Date().toISOString().split('T')[0] },
        { description: 'Q3 Product Sales & Direct Inflow', amount: 165000, type: 'income', category: 'Product Sales', date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0] },
        { description: 'Corporate Office Lease & Workspace Rent', amount: 35000, type: 'expense', category: 'Rent & Facilities', date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0] },
        { description: 'Core Engineering & Design Team Payroll', amount: 65000, type: 'expense', category: 'Salaries & Wages', date: new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0] },
        { description: 'AWS Cloud Hosting & Distributed Compute', amount: 14200, type: 'expense', category: 'Software & SaaS', date: new Date(Date.now() - 86400000 * 8).toISOString().split('T')[0] },
        { description: 'Workstation Laptops & Monitors (Croma)', amount: 42500, type: 'expense', category: 'Equipment', date: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0] },
      ];

      for (const tx of demoTxs) {
        await apiClient.post('/api/transactions', tx);
      }
      Alert.alert('✨ Sample Data Seeded', 'Realistic financial records have been populated into your workspace.');
      handleRefresh();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not seed sample records.');
    }
  };

  const getStatValue = (label: string) => {
    if (!Array.isArray(stats)) return '₹0';
    const s = stats.find((x) => x && x.label && x.label.toLowerCase() === label.toLowerCase());
    return s ? s.value : '₹0';
  };

  const getStatPositive = (label: string) => {
    if (!Array.isArray(stats)) return true;
    const s = stats.find((x) => x && x.label && x.label.toLowerCase() === label.toLowerCase());
    return s ? s.positive : true;
  };

  const handleDeleteTx = async (txId: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(txId);
            try {
              const res = await apiClient.delete(`/dashboard/transactions/${txId}`);
              if (!res.ok) throw new Error('Failed to delete transaction');
              handleRefresh();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete transaction.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  // Filter transaction list
  const filteredTransactions = (transactions || []).filter((tx: any) => {
    // Type check
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    
    // Category check
    if (categoryFilter !== 'all' && (tx.category || '').toLowerCase() !== categoryFilter.toLowerCase()) return false;
    
    // Search query check
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const descMatch = (tx.description || '').toLowerCase().includes(q);
      const catMatch = (tx.category || '').toLowerCase().includes(q);
      const merchantMatch = (tx.merchant || '').toLowerCase().includes(q);
      const methodMatch = (tx.paymentMethod || '').toLowerCase().includes(q);
      if (!descMatch && !catMatch && !merchantMatch && !methodMatch) return false;
    }
    
    return true;
  });

  // Custom Chart Rendering
  const renderRevenueExpenseChart = () => {
    if (!runway || runway.length === 0) {
      return (
        <View style={[styles.chartEmpty, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.emptyText, { color: theme.text }]}>{t('no_chart_data') || 'No financial data available for charts.'}</Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>{t('upload_statement_prompt') || "Upload a bank statement in the 'Upload' tab."}</Text>
        </View>
      );
    }

    // Determine max value to scale chart
    const maxVal = runway.reduce((acc, curr) => {
      return Math.max(acc, curr.balance || 0);
    }, 1000);

    return (
      <TouchableOpacity 
        activeOpacity={0.85} 
        onPress={() => setChartAnalysisVisible(true)}
        style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={[styles.chartTitle, { color: theme.text }]}>Cash Balance Trend 🔍</Text>
            <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>Running account balance by month (Tap for deep-dive)</Text>
          </View>
          <View style={{ backgroundColor: `${accentHex}20`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ color: accentHex, fontSize: 10, fontWeight: '700' }}>DETAILS</Text>
          </View>
        </View>
        
        <View style={styles.chartWrapper}>
          <View style={styles.barsContainer}>
            {runway.map((item, index) => {
              const ratio = Math.max(0.05, Math.min(1, (item.balance || 0) / maxVal));
              const percentHeight = `${ratio * 100}%`;
              return (
                <View key={index} style={styles.chartCol}>
                  <View style={styles.barOuter}>
                    <View style={[styles.barInner, { height: percentHeight as any }]} />
                  </View>
                  <Text style={styles.chartLabel}>{item.month}</Text>
                  <Text style={styles.chartValText}>
                    {item.balance >= 100000 
                      ? `₹${(item.balance / 1000).toFixed(0)}k` 
                      : `₹${item.balance}`}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getAlertIcon = (iconName: string, type: string) => {
    const color = type === 'anomaly' ? '#ff6b6b' : type === 'warning' ? '#f39c12' : '#2ecc71';
    if (iconName === 'AlertTriangle') return <AlertTriangleIcon color={color} size={20} />;
    if (iconName === 'Lightbulb') return <LightbulbIcon color={color} size={20} />;
    return <SparklesIcon color={color} size={20} />;
  };

  const getHealthCategory = (score: number) => {
    if (score === 0 || !transactions || transactions.length === 0) return { label: 'No Data Yet', color: '#71717a' };
    if (score >= 80) return { label: 'Excellent', color: '#2ecc71' };
    if (score >= 50) return { label: 'Good', color: '#3498db' };
    if (score >= 30) return { label: 'Fair', color: '#f1c40f' };
    return { label: 'Poor / Critical', color: '#e74c3c' };
  };

  const healthInfo = getHealthCategory(healthScore);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.scrollContent}>
      {invitationCount > 0 && (
        <TouchableOpacity style={styles.inviteBanner} onPress={onOpenWorkspaceSwitcher}>
          <ShieldAlertIcon color="#ff8f8f" size={18} style={{ marginRight: 8 }} />
          <Text style={styles.inviteBannerText}>
            You have {invitationCount} pending workspace invitation{invitationCount > 1 ? 's' : ''}! Tap to review.
          </Text>
        </TouchableOpacity>
      )}
      {activeWorkspaceId !== 'personal' && ['owner', 'partner', 'accountant'].includes(activeWorkspaceRole || '') && (transactions || []).filter(t => t.status === 'pending_approval').length > 0 && (
        <View style={[styles.inviteBanner, { backgroundColor: `${accentHex}15`, borderColor: `${accentHex}35`, marginBottom: 20 }]}>
          <ShieldAlertIcon color={accentHex} size={18} style={{ marginRight: 8 }} />
          <Text style={[styles.inviteBannerText, { color: accentHex }]}>
            You have {(transactions || []).filter(t => t.status === 'pending_approval').length} pending expense claims waiting for approval!
          </Text>
        </View>
      )}
      {loading && stats.length === 0 ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={accentHex} size="large" />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Fetching financial status...</Text>
        </View>
      ) : (
        <>
          {/* Greeting Banner with User Profile Avatar */}
          <View style={[styles.greetingBanner, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {(() => {
              const hour = new Date().getHours();
              const prefix = hour >= 5 && hour < 12 ? 'Good morning' : hour >= 12 && hour < 17 ? 'Good afternoon' : 'Good evening';
              const rawName = user?.fullName || user?.name || (user?.email ? user.email.split('@')[0].split('+')[0] : 'Hero');
              const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
              const avatarUri = user?.profilePhoto || user?.profileImage;
              return (
                <>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.greetingTitle, { color: theme.text }]}>
                      {`${prefix}, ${name} 👋`}
                    </Text>
                  </View>
                  {avatarUri ? (
                    <ImageComp source={{ uri: avatarUri }} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: accentHex }} />
                  ) : (
                    <View style={[styles.mascotBadge, { backgroundColor: `${accentHex}20`, borderColor: `${accentHex}40` }]}>
                      <SparklesIcon color={accentHex} size={22} />
                    </View>
                  )}
                </>
              );
            })()}
          </View>

          {/* ⚡ Natural Language Quick Log Bar (Website Parity Feature) */}
          <View style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 16, padding: 8, paddingHorizontal: 12, marginBottom: 14, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: `${accentHex}20`, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              <SparklesIcon color={accentHex} size={16} />
            </View>
            <TextInput
              style={{ flex: 1, color: theme.text, fontSize: 13, fontWeight: '600', paddingVertical: 4 }}
              placeholder='Quick Log: "Paid ₹450 for lunch via UPI" or "Received ₹50000 retainer"'
              placeholderTextColor={theme.textMuted}
              value={nlpInput}
              onChangeText={setNlpInput}
              onSubmitEditing={handleNlpQuickLog}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={handleNlpQuickLog}
              disabled={nlpProcessing || !nlpInput.trim()}
              style={{ backgroundColor: nlpInput.trim() ? accentHex : `${accentHex}40`, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              {nlpProcessing ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800' }}>LOG</Text>
                  <ArrowUpRight color="#ffffff" size={14} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Dynamic Workspace Presets (Section 10.1: Executive, Analyst, Operations) */}
          <View style={{ flexDirection: 'row', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 14, padding: 4, marginBottom: 14 }}>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: dashboardPreset === 'executive' ? accentHex : 'transparent' }}
              onPress={() => setDashboardPreset('executive')}
            >
              <Text style={{ color: dashboardPreset === 'executive' ? '#ffffff' : theme.textSecondary, fontSize: 12, fontWeight: '700' }}>Executive</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: dashboardPreset === 'analyst' ? accentHex : 'transparent' }}
              onPress={() => setDashboardPreset('analyst')}
            >
              <Text style={{ color: dashboardPreset === 'analyst' ? '#ffffff' : theme.textSecondary, fontSize: 12, fontWeight: '700' }}>Analyst</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: dashboardPreset === 'operations' ? accentHex : 'transparent' }}
              onPress={() => setDashboardPreset('operations')}
            >
              <Text style={{ color: dashboardPreset === 'operations' ? '#ffffff' : theme.textSecondary, fontSize: 12, fontWeight: '700' }}>Operations</Text>
            </TouchableOpacity>
          </View>

          {/* 🛡️ Dual-Signatory Maker-Checker High-Value Outflow Gate (Business Mode) */}
          {pendingHighValueTxs.length > 0 && (
            <View style={{ backgroundColor: '#f59e0b15', borderWidth: 1.5, borderColor: '#f59e0b', borderRadius: 16, padding: 14, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ShieldCheck color="#f59e0b" size={18} style={{ marginRight: 6 }} />
                  <Text style={{ color: '#f59e0b', fontWeight: '800', fontSize: 13 }}>
                    🛡️ Maker-Checker: {pendingHighValueTxs.length} Outflow{pendingHighValueTxs.length > 1 ? 's' : ''} Pending Release
                  </Text>
                </View>
                <View style={{ backgroundColor: '#f59e0b30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ color: '#f59e0b', fontSize: 10, fontWeight: '800' }}>OWNER GATE</Text>
                </View>
              </View>
              
              <Text style={{ color: theme.textSecondary, fontSize: 11, marginBottom: 10 }}>
                Disbursements $\ge$ ₹50,000 recorded by team members require primary owner biometric approval before ledger release:
              </Text>

              {pendingHighValueTxs.map((ptx) => (
                <View key={ptx._id || ptx.id} style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 12, padding: 10, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{ptx.description}</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{ptx.date} • {ptx.category}</Text>
                    <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '900', marginTop: 2 }}>₹{Number(ptx.amount || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleApproveHighValueWithBiometrics(ptx._id || ptx.id, ptx.amount, ptx.description)}
                    disabled={approvingHighValueId === (ptx._id || ptx.id)}
                    style={{ backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  >
                    {approvingHighValueId === (ptx._id || ptx.id) ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Fingerprint color="#fff" size={14} />
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>Authorize</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Inline Starting Balance Editor */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 14, padding: 12, marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>Cash Account Starting Balance</Text>
              {editingOpeningBal ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
                  <TextInput
                    style={{ backgroundColor: theme.bg, borderWidth: 1, borderColor: accentHex, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, color: theme.text, fontSize: 14, fontWeight: '700', width: 130 }}
                    placeholder="0.00"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    value={openingBalInput}
                    onChangeText={setOpeningBalInput}
                  />
                  <TouchableOpacity
                    onPress={handleSaveOpeningBalance}
                    disabled={savingOpeningBal}
                    style={{ backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                  >
                    {savingOpeningBal ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Save</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEditingOpeningBal(false)}
                    style={{ paddingHorizontal: 8, paddingVertical: 6 }}
                  >
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginTop: 2 }}>
                  {formatCurrencyINR(Number(user?.activeWorkspace?.openingBalance || 0))}
                </Text>
              )}
            </View>
            {!editingOpeningBal && (
              <TouchableOpacity
                onPress={() => {
                  setOpeningBalInput(String(user?.activeWorkspace?.openingBalance || '0'));
                  setEditingOpeningBal(true);
                }}
                style={{ backgroundColor: `${accentHex}15`, borderWidth: 1, borderColor: `${accentHex}30`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
              >
                <Text style={{ color: accentHex, fontSize: 12, fontWeight: '700' }}>Edit Balance</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Safe Daily Spend & Emergency Buffer Card (Personal Mode) */}
          {activeWorkspaceId === 'personal' && (
            <View style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 16, padding: 14, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Compass color="#38bdf8" size={16} style={{ marginRight: 6 }} />
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>Safe Daily Spend</Text>
                </View>
                <View style={{ backgroundColor: '#38bdf820', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: '700' }}>{safeDailySpendData.remainingDays} Days Left</Text>
                </View>
              </View>
              <Text style={{ color: '#38bdf8', fontSize: 24, fontWeight: '900' }}>
                {formatCurrencyINR(safeDailySpendData.safeDailySpend)}
                <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '500' }}> / day</Text>
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}>
                Ring-fenced committed budget pool: {formatCurrencyINR(safeDailySpendData.remainingCommitted)}. Discretionary cash: {formatCurrencyINR(safeDailySpendData.discretionaryPool)}.
              </Text>
            </View>
          )}

          {/* What Changed? MoM Variance Card */}
          <View style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 16, padding: 14, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14 }}>📊 What Changed? (MoM Variance)</Text>
              <Text style={{ color: theme.textMuted, fontSize: 11 }}>vs. Previous Month</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: theme.cardBorder }}>
                <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>Revenue Shift</Text>
                <Text style={{ color: momVariance.isRevenueUp ? '#10b981' : '#ef4444', fontWeight: '800', fontSize: 13, marginTop: 2 }}>
                  {momVariance.isRevenueUp ? '+' : ''}{momVariance.revenuePct}%
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2 }}>
                  {momVariance.isRevenueUp ? '+' : ''}{formatCurrencyINR(momVariance.revenueDelta)}
                </Text>
              </View>

              <View style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: theme.cardBorder }}>
                <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>Outflows Shift</Text>
                <Text style={{ color: momVariance.isExpenseDown ? '#10b981' : '#ef4444', fontWeight: '800', fontSize: 13, marginTop: 2 }}>
                  {momVariance.outflowPct > 0 ? (momVariance.isExpenseDown ? '-' : '+') : ''}{momVariance.outflowPct}%
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2 }}>
                  {formatCurrencyINR(momVariance.outflowDelta)}
                </Text>
              </View>

              <View style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: theme.cardBorder }}>
                <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>Margin Shift</Text>
                <Text style={{ color: momVariance.marginDelta >= 0 ? '#10b981' : '#ef4444', fontWeight: '800', fontSize: 13, marginTop: 2 }}>
                  {momVariance.marginDelta >= 0 ? '+' : ''}{momVariance.marginDelta}%
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2 }}>pts change</Text>
              </View>
            </View>
          </View>

          {/* Data-Driven Hero Insights Banner */}

          {(() => {
            const computedInsights: string[] = [];
            if (transactions && transactions.length > 0) {
              const recentExps = transactions.filter(t => t.type === 'expense');
              const recentIncs = transactions.filter(t => t.type === 'income');
              if (recentExps.length > 0) {
                const totalExp = recentExps.reduce((acc, t) => acc + (t.amount || 0), 0);
                computedInsights.push(`Recorded ${recentExps.length} recent expenses totaling ₹${totalExp.toLocaleString('en-IN')}.`);
              }
              if (recentIncs.length > 0) {
                const totalInc = recentIncs.reduce((acc, t) => acc + (t.amount || 0), 0);
                computedInsights.push(`Recorded ${recentIncs.length} income entries totaling ₹${totalInc.toLocaleString('en-IN')}.`);
              }
            }
            if (runwayMonths > 0) {
              computedInsights.push(`Your calculated cash runway is currently ${runwayMonths.toFixed(1)} months.`);
            }
            if (computedInsights.length === 0) {
              computedInsights.push('Your financial story starts here. Add your first transaction to unlock automated insights.');
            }
            return <HeroInsightsWidget title="Hero Financial Insights" insights={computedInsights} style={{ marginTop: 12, marginBottom: 12 }} />;
          })()}

          {/* Achievement Badges Row (Gamification) */}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesScroll}>
            <AchievementBadgeWidget icon="🏆" title="Budget Master" subtitle="On track" style={{ marginRight: 8 }} />
            <AchievementBadgeWidget icon="💰" title="Savings Hero" subtitle="Saved" style={{ marginRight: 8 }} />
            <AchievementBadgeWidget icon="📊" title="Expense Tracker" subtitle="Active" style={{ marginRight: 8 }} />
            <AchievementBadgeWidget icon="🔥" title="Savings Streak" subtitle="12 Days" style={{ marginRight: 8 }} />
          </ScrollView>

          {/* Health Score Circular Gauge & Actions */}
          <View style={styles.healthContainer}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setHealthModalVisible(true)}
              style={[styles.gaugeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
                <Text style={[styles.gaugeTitle, { color: theme.textSecondary, marginBottom: 0 }]}>{t('financial_health_score') || 'Health Score'}</Text>
                <View style={{ backgroundColor: `${accentHex}20`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ color: accentHex, fontSize: 10, fontWeight: '800' }}>ANALYZE ↗</Text>
                </View>
              </View>
              <View style={styles.gaugeOuter}>
                <View style={[styles.gaugeMask, { borderColor: healthInfo.color, backgroundColor: theme.card }]}>
                  <Text style={[styles.gaugeScore, { color: healthInfo.color }]}>{healthScore}</Text>
                  <Text style={[styles.gaugeMax, { color: theme.textMuted }]}>/100</Text>
                </View>
              </View>
              <Text style={[styles.gaugeLabel, { color: healthInfo.color }]}>
                {healthInfo.label}
              </Text>
              <Text style={[styles.gaugeDesc, { color: theme.textSecondary }]}>
                Tap to inspect 3-tier margin, opex & runway metrics.
              </Text>
            </TouchableOpacity>

            {/* Quick Actions Panel */}
            <View style={styles.actionColumn}>
              <TouchableOpacity
                style={[styles.actionBtnAi, { backgroundColor: '#10b981' }]}
                onPress={() => setVoiceModalVisible(true)}
              >
                <Mic color="#ffffff" size={18} style={styles.actionIcon} />
                <Text style={styles.actionBtnText}>Voice Bookkeeper</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtnAi, { backgroundColor: accentHex }]}
                onPress={() => setReportVisible(true)}
              >
                <SparklesIcon color="#ffffff" size={18} style={styles.actionIcon} />
                <Text style={styles.actionBtnText}>Executive Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtnAdd, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={() => {
                  setEditTransaction(null);
                  setAddTxVisible(true);
                }}
              >
                <PlusIcon color={theme.text} size={18} style={styles.actionIcon} />
                <Text style={[styles.actionBtnText, { color: theme.text }]}>{t('add_transaction')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* AI Auto-Auditor Anomaly Alert Banner */}
          {anomalies.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef444415', borderWidth: 1, borderColor: '#ef444440', borderRadius: 16, padding: 14, marginBottom: 14 }}>
              <ShieldAlertIcon color="#ef4444" size={22} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '700' }}>
                  AI Auto-Auditor Alert ({anomalies.length} Flagged)
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {anomalies[0].description}
                </Text>
              </View>
            </View>
          )}

          {/* Enterprise Module Quick Tiles */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            <TouchableOpacity
              onPress={() => onNavigateToTool?.('khata')}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder, paddingVertical: 10, borderRadius: 12 }}
            >
              <Users color="#10b981" size={15} style={{ marginRight: 6 }} />
              <Text style={{ color: theme.text, fontSize: 11, fontWeight: '700' }}>Khata Book</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onNavigateToTool?.('subscriptions')}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder, paddingVertical: 10, borderRadius: 12 }}
            >
              <Repeat color="#6366f1" size={15} style={{ marginRight: 6 }} />
              <Text style={{ color: theme.text, fontSize: 11, fontWeight: '700' }}>Subscriptions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onNavigateToTool?.('reports')}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder, paddingVertical: 10, borderRadius: 12 }}
            >
              <FileSpreadsheet color="#8b5cf6" size={15} style={{ marginRight: 6 }} />
              <Text style={{ color: theme.text, fontSize: 11, fontWeight: '700' }}>P&L Reports</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Stats Grid */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('key_business_metrics') || 'Key Business Metrics'}</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]} numberOfLines={1}>{t('total_income')}</Text>
                <TrendingUpIcon color="#2ecc71" size={16} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{getStatValue('Total Revenue')}</Text>
              <Text style={[styles.statGrowth, { color: theme.textMuted }]}>Inflows recorded</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]} numberOfLines={1}>{t('total_expense')}</Text>
                <TrendingDownIcon color="#ff6b6b" size={16} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{getStatValue('Total Expenses')}</Text>
              <Text style={[styles.statGrowth, { color: theme.textMuted }]}>Outflows recorded</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]} numberOfLines={1}>{t('net_profit')}</Text>
                <PercentIcon color={getStatPositive('Net Margin') ? '#2ecc71' : '#ff6b6b'} size={16} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{getStatValue('Net Margin')}</Text>
              <Text style={[styles.statGrowth, { color: theme.textMuted }]}>Profit percentage</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]} numberOfLines={1}>{t('cash_runway')}</Text>
                <CalendarIcon color={runwayMonths > 3 ? '#2ecc71' : '#ff6b6b'} size={16} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {runwayMonths > 0 ? `${runwayMonths} ${t('months')}` : 'N/A'}
              </Text>
              <Text style={[styles.statGrowth, { color: theme.textMuted }]}>At average burn rate</Text>
            </View>
          </View>

          {/* Budget Progress Indicators */}
          {budgetStatus && budgetStatus.limit > 0 && (
            <View style={[styles.budgetCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.budgetHeader}>
                <Text style={[styles.budgetTitle, { color: theme.text }]}>{t('monthly_budgets')}</Text>
                <Text style={[
                  styles.budgetPercentText, 
                  budgetStatus.percent >= 100 ? styles.colorRed : budgetStatus.percent >= 80 ? styles.colorOrange : styles.colorGreen
                ]}>
                  {budgetStatus.percent}% Used
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBg}>
                <View style={[
                  styles.progressBarFill, 
                  { 
                    width: `${Math.min(100, budgetStatus.percent)}%`,
                    backgroundColor: budgetStatus.percent >= 100 ? '#ff6b6b' : budgetStatus.percent >= 80 ? '#f39c12' : '#2ecc71'
                  }
                ]} />
              </View>

              <View style={styles.budgetMeta}>
                <Text style={styles.budgetMetaText}>Limit: ₹{budgetStatus.limit.toLocaleString('en-IN')}</Text>
                <Text style={styles.budgetMetaText}>Spent: ₹{budgetStatus.used.toLocaleString('en-IN')}</Text>
                <Text style={styles.budgetMetaText}>Remaining: ₹{budgetStatus.remaining.toLocaleString('en-IN')}</Text>
              </View>

              {/* Category specific budgets */}
              {Object.keys(budgetStatus.categoryStatus || {}).length > 0 && (
                <View style={styles.categoryBudgetsContainer}>
                  <Text style={styles.categoryBudgetSub}>Category Budgets</Text>
                  {Object.entries(budgetStatus.categoryStatus).map(([cat, status]: any) => (
                    <View key={cat} style={styles.catBudgetRow}>
                      <View style={styles.catBudgetHeader}>
                        <Text style={styles.catBudgetName}>{cat}</Text>
                        <Text style={styles.catBudgetVal}>₹{status.used.toLocaleString('en-IN')} / ₹{status.limit.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.catProgressBarBg}>
                        <View style={[
                          styles.catProgressBarFill, 
                          { 
                            width: `${Math.min(100, status.percent)}%`,
                            backgroundColor: status.percent >= 100 ? '#ff6b6b' : status.percent >= 80 ? '#f39c12' : '#2ecc71'
                          }
                        ]} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* AR & AP Summary Card */}
          <View style={[styles.arApCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.arApTitle, { color: theme.text }]}>{t('outstanding_invoices_bills') || 'Outstanding Invoices & Bills'}</Text>
            <View style={styles.arApRow}>
              <View style={styles.arApCol}>
                <View style={styles.arApIconBoxBlue}>
                  <TrendingUpIcon color="#4f8cff" size={16} />
                </View>
                <Text style={[styles.arApLabel, { color: theme.textSecondary }]}>{t('accounts_receivable') || 'Accounts Receivable'}</Text>
                <Text style={styles.arApValueBlue}>₹{arApStats.accountsReceivable?.toLocaleString('en-IN') || 0}</Text>
                {arApStats.overdueReceivable > 0 && (
                  <Text style={styles.arApOverdue}>{t('overdue')}: ₹{arApStats.overdueReceivable?.toLocaleString('en-IN')}</Text>
                )}
              </View>
              <View style={[styles.arApDivider, { backgroundColor: theme.cardBorder }]} />
              <View style={styles.arApCol}>
                <View style={styles.arApIconBoxRed}>
                  <TrendingDownIcon color="#ff6b6b" size={16} />
                </View>
                <Text style={[styles.arApLabel, { color: theme.textSecondary }]}>{t('accounts_payable') || 'Accounts Payable'}</Text>
                <Text style={styles.arApValueRed}>₹{arApStats.accountsPayable?.toLocaleString('en-IN') || 0}</Text>
                {arApStats.overduePayable > 0 && (
                  <Text style={styles.arApOverdue}>{t('overdue')}: ₹{arApStats.overduePayable?.toLocaleString('en-IN')}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Runway Chart */}
          {renderRevenueExpenseChart()}

          {/* What-If Simulation Sandbox (Section 8.3) */}
          <View style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 16, padding: 14, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Sliders color={accentHex} size={16} style={{ marginRight: 6 }} />
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>What-If Runway Simulation Sandbox</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSandbox(!showSandbox)}
                style={{ backgroundColor: `${accentHex}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}
              >
                <Text style={{ color: accentHex, fontSize: 11, fontWeight: '700' }}>{showSandbox ? 'Hide Controls' : 'Simulate'}</Text>
              </TouchableOpacity>
            </View>

            {showSandbox && (
              <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: theme.cardBorder, paddingTop: 10 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 11, marginBottom: 6 }}>Adjust simulated parameters to test survival runway:</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.textMuted, fontSize: 10 }}>Simulated Monthly Inflow</Text>
                    <TextInput
                      style={{ backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 8, padding: 6, color: theme.text, fontSize: 12, marginTop: 2 }}
                      placeholder="e.g. 50000"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      value={simInflow}
                      onChangeText={setSimInflow}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.textMuted, fontSize: 10 }}>Simulated Monthly Outflow</Text>
                    <TextInput
                      style={{ backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 8, padding: 6, color: theme.text, fontSize: 12, marginTop: 2 }}
                      placeholder="e.g. 35000"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      value={simOutflow}
                      onChangeText={setSimOutflow}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.bg, padding: 10, borderRadius: 10, marginTop: 4 }}>
                  <View>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 12 }}>Simulated Standard Runway</Text>
                    <Text style={{ color: '#10b981', fontWeight: '900', fontSize: 16 }}>{sandboxRunwayResult.standardRunwayMonths} Months</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Worst-Case (Zero Rev)</Text>
                    <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 14 }}>{sandboxRunwayResult.worstCaseRunwayMonths} Mos</Text>
                  </View>
                </View>

                {/* 6 Future Trajectory Forecast Points */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                  {sandboxRunwayResult.projections.map((p: any) => (
                    <View key={p.label} style={{ backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 8, padding: 8, marginRight: 6, alignItems: 'center', minWidth: 65 }}>
                      <Text style={{ color: accentHex, fontSize: 10, fontWeight: '700' }}>{p.label}</Text>
                      <Text style={{ color: theme.text, fontSize: 11, fontWeight: '700', marginTop: 2 }}>{formatCurrencyINR(p.standardBalance)}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* AI Financial Alerts */}
          {alerts && alerts.length > 0 && (
            <View style={styles.alertsContainer}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('smart_alerts') || 'Smart Financial Alerts'}</Text>
              {alerts.map((alert, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.alertCard,
                    { backgroundColor: theme.card, borderColor: theme.cardBorder }
                  ]}
                >
                  <View style={styles.alertIconWrap}>
                    {getAlertIcon(alert.icon, alert.type)}
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={[styles.alertTitle, { color: theme.text }]}>{alert.title}</Text>
                    <Text style={[styles.alertDesc, { color: theme.textSecondary }]}>{alert.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Search and Filters */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('filter_transactions') || 'Filter Transactions'}</Text>
          <View style={[styles.filterCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.searchRow, { backgroundColor: theme.bg, borderColor: theme.cardBorder, borderWidth: 1, borderRadius: 12, overflow: 'hidden' }]}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: 'transparent', color: theme.text, height: 42, paddingHorizontal: 12, borderWidth: 0 }]}
                placeholder={`🔍 ${t('search_placeholder') || 'Search description, category, merchant...'}`}
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                underlineColorAndroid="transparent"
              />
            </View>
            
            <View style={styles.filterOptionsRow}>
              {/* Type Filters */}
              <View style={styles.typeFilterRow}>
                {['all', 'expense', 'income'].map((tKey) => (
                  <TouchableOpacity
                    key={tKey}
                    style={[
                      styles.filterTabBtn,
                      { backgroundColor: typeFilter === tKey ? accentHex : theme.bg, borderColor: theme.cardBorder }
                    ]}
                    onPress={() => setTypeFilter(tKey as any)}
                  >
                    <Text style={[
                      styles.filterTabBtnText,
                      { color: typeFilter === tKey ? '#ffffff' : theme.textSecondary }
                    ]}>
                      {tKey === 'all' ? t('all') : tKey === 'expense' ? t('expenses') : t('total_income')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category Selector tag pills */}
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.catFilterScroll}>
                <TouchableOpacity
                  style={[
                    styles.catFilterPill,
                    { backgroundColor: categoryFilter === 'all' ? accentHex : theme.bg, borderColor: theme.cardBorder }
                  ]}
                  onPress={() => setCategoryFilter('all')}
                >
                  <Text style={[
                    styles.catFilterPillText,
                    { color: categoryFilter === 'all' ? '#ffffff' : theme.textSecondary }
                  ]}>
                    {t('all_categories') || 'All Categories'}
                  </Text>
                </TouchableOpacity>
                {SUGGESTED_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catFilterPill,
                      { backgroundColor: categoryFilter === cat ? accentHex : theme.bg, borderColor: theme.cardBorder }
                    ]}
                    onPress={() => setCategoryFilter(cat)}
                  >
                    <Text style={[
                      styles.catFilterPillText,
                      { color: categoryFilter === cat ? '#ffffff' : theme.textSecondary }
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Recent Transactions Table */}
          <View style={styles.transactionsContainer}>
            <View style={styles.txHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('recent_transactions')}</Text>
              {filteredTransactions.length > 5 && searchQuery === '' && categoryFilter === 'all' && typeFilter === 'all' && (
                <Text style={[styles.txCountText, { color: theme.textMuted }]}>Showing last 5</Text>
              )}
            </View>

            {filteredTransactions.length > 0 ? (
              <View style={styles.txList}>
                {(searchQuery !== '' || categoryFilter !== 'all' || typeFilter !== 'all' 
                  ? filteredTransactions 
                  : filteredTransactions.slice(0, 5)
                ).map((tx) => {
                  const txId = tx._id || tx.id;
                  const isExpense = tx.type === 'expense';
                  return (
                    <TouchableOpacity 
                      key={txId} 
                      style={[styles.txRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                      onPress={() => {
                        setEditTransaction(tx);
                        setAddTxVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.txIconBox}>
                        <Text style={styles.txIconText}>
                          {isExpense ? '💸' : '💰'}
                        </Text>
                      </View>
                      
                      <View style={styles.txDetails}>
                        <Text style={styles.txDesc} numberOfLines={1}>
                          {tx.description || 'Transaction'}
                        </Text>
                        <View style={styles.txSubDetails}>
                          <Text style={styles.txCategory}>{tx.category || 'Other'}</Text>
                          {tx.merchant ? (
                            <>
                              <Text style={styles.txDot}>•</Text>
                              <Text style={styles.txMerchant}>{tx.merchant}</Text>
                            </>
                          ) : null}
                          <Text style={styles.txDot}>•</Text>
                          <Text style={styles.txDate}>{tx.date}</Text>
                          {tx.status && (
                            <>
                              <Text style={styles.txDot}>•</Text>
                              <Text style={[
                                styles.txDate,
                                tx.status === 'approved' ? styles.colorGreen :
                                tx.status === 'pending_approval' ? styles.colorOrange :
                                tx.status === 'rejected' ? styles.colorRed :
                                styles.colorBlue
                              ]}>
                                {tx.status === 'pending_approval' ? 'PENDING' : tx.status.toUpperCase()}
                              </Text>
                            </>
                          )}
                        </View>
                        {tx.paymentMethod || (tx.taxAmount > 0) ? (
                          <View style={styles.txMetaDetails}>
                            {tx.paymentMethod ? (
                              <Text style={styles.txMetaText}>💳 {tx.paymentMethod}</Text>
                            ) : null}
                            {tx.taxAmount > 0 ? (
                              <Text style={styles.txMetaText}>📝 Tax: ₹{tx.taxAmount}</Text>
                            ) : null}
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.txAmountCol}>
                        <Text style={[styles.txAmountText, isExpense ? styles.colorRed : styles.colorGreen]}>
                          {isExpense ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.txDeleteBtn}
                        onPress={() => handleDeleteTx(txId)}
                        disabled={deletingId === txId}
                      >
                        {deletingId === txId ? (
                          <ActivityIndicator color="#ff6b6b" size="small" />
                        ) : (
                          <Trash2Icon color="#ff6b6b" size={16} />
                        )}
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <EmptyStateWidget
                icon={<Text style={{ fontSize: 36 }}>📊</Text>}
                title="No Transactions Recorded"
                description="Track your business revenue, operating burn, and invoices in one secure workspace."
                actionTitle="+ Add Transaction"
                onAction={() => setAddTxVisible(true)}
                style={{ paddingVertical: 28 }}
              />
            )}
          </View>
        </>
      )}

      {/* Manual Entry Transaction Modal */}
      <AddTransactionModal
        visible={addTxVisible}
        onClose={() => {
          setAddTxVisible(false);
          setEditTransaction(null);
        }}
        onAddSuccess={handleRefresh}
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
        editTransaction={editTransaction}
      />

      {/* AI Executive Report Modal */}
      <AiReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
        financialContext={{
          stats,
          runway,
          runwayMonths,
          alerts,
          healthScore,
          expenses: transactions.filter((t) => t.type === 'expense'),
        }}
      />

      {/* AI Voice Command Expense Modal */}
      <VoiceCommandModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onSuccess={handleRefresh}
      />

      {/* Interactive Financial & Chart Analysis Modal */}
      <Modal
        visible={chartAnalysisVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setChartAnalysisVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%', borderWidth: 1, borderColor: theme.cardBorder }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>🔍 Expense & Cash Analysis</Text>
              <TouchableOpacity onPress={() => setChartAnalysisVisible(false)} style={{ padding: 6 }}>
                <Text style={{ fontSize: 18, color: theme.textSecondary, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Category Breakdown */}
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 10 }}>Spending by Category</Text>
              {(() => {
                const expenses = (transactions || []).filter(t => t.type === 'expense');
                if (expenses.length === 0) {
                  return (
                    <View style={{ padding: 16, backgroundColor: theme.bg, borderRadius: 12, marginBottom: 16 }}>
                      <Text style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 13 }}>No expenses recorded in this workspace yet.</Text>
                    </View>
                  );
                }
                const catTotals: Record<string, number> = {};
                let totalExp = 0;
                expenses.forEach(e => {
                  const c = e.category || 'General';
                  const a = Number(e.amount || 0);
                  catTotals[c] = (catTotals[c] || 0) + a;
                  totalExp += a;
                });
                return (
                  <View style={{ gap: 8, marginBottom: 20 }}>
                    {Object.entries(catTotals).map(([cat, amt]) => {
                      const pct = totalExp > 0 ? ((amt / totalExp) * 100).toFixed(1) : '0';
                      return (
                        <View key={cat} style={{ backgroundColor: theme.bg, padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }}>
                          <View>
                            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{cat}</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{pct}% of total spending</Text>
                          </View>
                          <Text style={{ color: '#ff6b6b', fontWeight: '800', fontSize: 15 }}>-₹{amt.toLocaleString('en-IN')}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })()}

              {/* Recent Itemized Expense List */}
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 10 }}>Itemized Expense History</Text>
              {(() => {
                const expenses = (transactions || []).filter(t => t.type === 'expense');
                if (expenses.length === 0) {
                  return null;
                }
                return (
                  <View style={{ gap: 8, marginBottom: 20 }}>
                    {expenses.slice(0, 8).map((e, idx) => (
                      <View key={idx} style={{ backgroundColor: theme.bg, padding: 10, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>{e.description || 'Expense'}</Text>
                          <Text style={{ color: theme.textMuted, fontSize: 11 }}>{e.date ? new Date(e.date).toLocaleDateString() : 'Recent'} • {e.category || 'General'}</Text>
                        </View>
                        <Text style={{ color: '#ff6b6b', fontWeight: '700', fontSize: 14 }}>-₹{Number(e.amount || 0).toLocaleString('en-IN')}</Text>
                      </View>
                    ))}
                  </View>
                );
              })()}

              <TouchableOpacity
                onPress={() => setChartAnalysisVisible(false)}
                style={{ backgroundColor: accentHex, padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 10, marginBottom: 20 }}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Close Analysis</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🩺 Interactive Financial Health Breakdown Modal */}
      <Modal visible={healthModalVisible} transparent animationType="slide" onRequestClose={() => setHealthModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 24, borderWidth: 1, borderColor: theme.cardBorder, padding: 20, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900' }}>3-Tier Financial Health Engine</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Deterministic enterprise health diagnostics</Text>
              </View>
              <TouchableOpacity onPress={() => setHealthModalVisible(false)} style={{ padding: 6 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 18, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Overall Score Badge */}
              <View style={{ alignItems: 'center', paddingVertical: 18, backgroundColor: theme.bg, borderRadius: 18, borderWidth: 1, borderColor: theme.cardBorder, marginBottom: 16 }}>
                <View style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 4, borderColor: healthInfo.color, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Text style={{ color: healthInfo.color, fontSize: 28, fontWeight: '900' }}>{healthScore}</Text>
                </View>
                <Text style={{ color: healthInfo.color, fontSize: 16, fontWeight: '800' }}>{healthInfo.label.toUpperCase()}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4, textAlign: 'center', paddingHorizontal: 16 }}>
                  Composite score evaluated from Net Margin, Cash Runway Coverage, and Opex Burn Efficiency.
                </Text>
              </View>

              {/* 3 Pillars */}
              <View style={{ gap: 10, marginBottom: 16 }}>
                {/* Pillar 1: Net Margin */}
                <View style={{ backgroundColor: theme.bg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.cardBorder }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: '800' }}>Pillar 1: Net Margin Efficiency</Text>
                    <Text style={{ color: momVariance.marginDelta >= 0 ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: '800' }}>
                      {momVariance.marginDelta >= 0 ? 'Healthy' : 'Compressing'}
                    </Text>
                  </View>
                  <Text style={{ color: theme.textSecondary, fontSize: 11, lineHeight: 16 }}>
                    Measures the percentage of top-line revenue retained after operating outflows and vendor payouts.
                  </Text>
                </View>

                {/* Pillar 2: Cash Runway Coverage */}
                <View style={{ backgroundColor: theme.bg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.cardBorder }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: '800' }}>Pillar 2: Runway Survival Horizon</Text>
                    <Text style={{ color: runwayMonths >= 6 ? '#10b981' : runwayMonths >= 3 ? '#f59e0b' : '#ef4444', fontSize: 12, fontWeight: '800' }}>
                      {runwayMonths > 0 ? `${runwayMonths.toFixed(1)} Months` : 'Active'}
                    </Text>
                  </View>
                  <Text style={{ color: theme.textSecondary, fontSize: 11, lineHeight: 16 }}>
                    How long operations can sustain under zero net inflow based on current monthly burn velocity.
                  </Text>
                </View>

                {/* Pillar 3: Opex Burn Ratio */}
                <View style={{ backgroundColor: theme.bg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.cardBorder }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: '800' }}>Pillar 3: Outflow-to-Inflow Ratio</Text>
                    <Text style={{ color: '#38bdf8', fontSize: 12, fontWeight: '800' }}>
                      {momVariance.outflowPct > 0 ? `${momVariance.outflowPct}% trend` : 'Balanced'}
                    </Text>
                  </View>
                  <Text style={{ color: theme.textSecondary, fontSize: 11, lineHeight: 16 }}>
                    Evaluating fixed vs discretionary spending to prevent sudden cash crunches and optimize liquidity.
                  </Text>
                </View>
              </View>

              {/* Actionable Recommendations */}
              <View style={{ backgroundColor: `${accentHex}15`, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: `${accentHex}30`, marginBottom: 16 }}>
                <Text style={{ color: accentHex, fontSize: 12, fontWeight: '800', marginBottom: 6 }}>⚡ STRATEGIC RECOMMENDATIONS</Text>
                <Text style={{ color: theme.text, fontSize: 12, lineHeight: 18, marginBottom: 4 }}>• Reconcile pending invoices and speed up customer debtor cycles via Khata Book WhatsApp reminders.</Text>
                <Text style={{ color: theme.text, fontSize: 12, lineHeight: 18, marginBottom: 4 }}>• Audit redundant SaaS tools and subscriptions under the Subscriptions module to reduce recurring leakage.</Text>
                <Text style={{ color: theme.text, fontSize: 12, lineHeight: 18 }}>• Maintain a minimum 3-month operating reserve buffer before committing to long-term capital equipment expenditures.</Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setHealthModalVisible(false)}
              style={{ backgroundColor: accentHex, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 }}
            >
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>Close Diagnostics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06111f',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  centerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    color: '#8fc0ff',
    fontSize: 15,
    marginTop: 12,
  },
  chartEmpty: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  chartCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 16,
    marginBottom: 24,
  },
  chartTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  chartSubtitle: {
    color: '#a6bedf',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 16,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#8fc0ff',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  chartWrapper: {
    height: 140,
    justifyContent: 'flex-end',
    paddingTop: 10,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  barOuter: {
    width: 14,
    height: 90,
    backgroundColor: '#06111f',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 6,
  },
  barInner: {
    width: '100%',
    backgroundColor: '#4f8cff',
    borderRadius: 7,
  },
  chartLabel: {
    color: '#a6bedf',
    fontSize: 9,
    fontWeight: '600',
  },
  chartValText: {
    color: '#ffffff',
    fontSize: 8,
    marginTop: 2,
  },
  alertsContainer: {
    marginBottom: 24,
  },
  alertCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  alertAnomaly: {
    backgroundColor: 'rgba(231, 76, 60, 0.05)',
    borderColor: 'rgba(231, 76, 60, 0.2)',
  },
  alertWarning: {
    backgroundColor: 'rgba(243, 156, 18, 0.05)',
    borderColor: 'rgba(243, 156, 18, 0.2)',
  },
  alertRecommendation: {
    backgroundColor: 'rgba(46, 204, 113, 0.05)',
    borderColor: 'rgba(46, 204, 113, 0.2)',
  },
  alertIconWrap: {
    marginRight: 12,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  alertDesc: {
    color: '#c3d6f3',
    fontSize: 12,
    lineHeight: 18,
  },
  transactionsContainer: {
    marginBottom: 20,
  },
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txCountText: {
    color: '#a6bedf',
    fontSize: 12,
    marginBottom: 14,
  },
  txList: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 8,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#06111f',
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#06111f',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txIconText: {
    fontSize: 16,
  },
  txDetails: {
    flex: 1.5,
    marginRight: 8,
  },
  txDesc: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  txSubDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  txCategory: {
    color: '#8fc0ff',
    fontSize: 10,
    fontWeight: '500',
  },
  txDot: {
    color: '#a6bedf',
    fontSize: 8,
    marginHorizontal: 4,
  },
  txDate: {
    color: '#a6bedf',
    fontSize: 10,
  },
  txAmountCol: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 8,
  },
  txAmountText: {
    fontSize: 13,
    fontWeight: '700',
  },
  txDeleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  colorGreen: {
    color: '#2ecc71',
  },
  colorRed: {
    color: '#ff6b6b',
  },
  colorOrange: {
    color: '#f39c12',
  },
  colorBlue: {
    color: '#4f8cff',
  },
  emptyTxs: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    alignItems: 'center',
  },
  emptyTxsText: {
    color: '#64748b',
    fontSize: 13,
  },
  inviteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  inviteBannerText: {
    color: '#e11d48',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  healthContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  gaugeCard: {
    flex: 1.15,
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  gaugeTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  gaugeOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#06111f',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 3.5,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    shadowColor: '#10b981',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  gaugeMask: {
    width: 82,
    height: 82,
    borderRadius: 41,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeScore: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  gaugeMax: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 6,
  },
  gaugeLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  gaugeDesc: {
    color: '#64748b',
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 13,
  },
  actionColumn: {
    flex: 1,
    gap: 8,
    justifyContent: 'space-between',
  },
  actionBtnAi: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnAdd: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  actionIcon: {
    marginRight: 6,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    marginTop: 6,
    letterSpacing: -0.2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    width: '48%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    marginRight: 4,
  },
  statValue: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 6,
  },
  statGrowth: {
    color: '#64748b',
    fontSize: 9,
  },
  borderGreen: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  borderRed: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  borderYellow: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  // Budget & Progress styles
  budgetCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 24,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  budgetTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  budgetPercentText: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetMetaText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '500',
  },
  categoryBudgetsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  categoryBudgetSub: {
    color: '#4f46e5',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  catBudgetRow: {
    marginBottom: 10,
  },
  catBudgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catBudgetName: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  catBudgetVal: {
    color: '#64748b',
    fontSize: 11,
  },
  catProgressBarBg: {
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  catProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Filter & Search styles
  filterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 16,
  },
  searchRow: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 40,
    justifyContent: 'center',
    marginBottom: 10,
  },
  searchInput: {
    color: '#0f172a',
    fontSize: 13,
    height: '100%',
  },
  filterOptionsRow: {
    flexDirection: 'column',
    gap: 8,
  },
  typeFilterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterTabBtn: {
    flex: 1,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  filterTabBtnActive: {
    borderColor: '#4f46e5',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  filterTabBtnText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  filterTabBtnTextActive: {
    color: '#4f46e5',
  },
  catFilterScroll: {
    marginTop: 4,
  },
  catFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginRight: 6,
  },
  catFilterPillActive: {
    borderColor: '#4f46e5',
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
  },
  catFilterPillText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  catFilterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  txMerchant: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '500',
  },
  txMetaDetails: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  txMetaText: {
    color: '#4f46e5',
    fontSize: 9,
    fontWeight: '600',
  },
  arApCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 20,
  },
  arApTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  arApRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arApCol: {
    flex: 1,
    alignItems: 'center',
  },
  arApDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },
  arApLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
  },
  arApValueBlue: {
    color: '#4f46e5',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  arApValueRed: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  arApOverdue: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 2,
  },
  arApIconBoxBlue: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arApIconBoxRed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  greetingSub: {
    fontSize: 12,
    marginTop: 2,
  },
  mascotBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  badgesScroll: {
    paddingBottom: 12,
  },
});
