import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  DimensionValue,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrendingDown, PieChart, Wallet, Edit3, X, Check, DollarSign, ShieldAlert } from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';
import { useTheme } from '../theme/themeSystem';
import { useTranslation } from '../theme/i18n';

const TrendingDownIcon = TrendingDown as any;
const PieChartIcon = PieChart as any;
const WalletIcon = Wallet as any;
const Edit3Icon = Edit3 as any;
const XIcon = X as any;
const CheckIcon = Check as any;
const DollarSignIcon = DollarSign as any;
const ShieldAlertIcon = ShieldAlert as any;

type ExpensesScreenProps = {
  expensesData: {
    categories?: any[];
    monthlyTrend?: any[];
  };
  loading: boolean;
  activeWorkspaceId?: string;
  activeWorkspaceRole?: string;
  onRefreshData?: () => void;
};

type ExpenseSubTab = 'analysis' | 'budgets' | 'approvals';

const CATEGORIES = ['Monthly Total', 'Rent', 'Payroll', 'Utilities', 'Marketing', 'Travel', 'Office', 'Food', 'Other'];

export function ExpensesScreen({ 
  expensesData, 
  loading,
  activeWorkspaceId = 'personal',
  activeWorkspaceRole = 'owner',
  onRefreshData
}: ExpensesScreenProps) {
  const { theme, accentHex } = useTheme();
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<ExpenseSubTab>('analysis');
  
  // Approvals workflow states
  const [pendingClaims, setPendingClaims] = useState<any[]>([]);
  const [approvedClaims, setApprovedClaims] = useState<any[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [approvalTab, setApprovalTab] = useState<'pending' | 'reimburse'>('pending');
  const categories = expensesData.categories || [];
  const monthlyTrend = expensesData.monthlyTrend || [];

  const totalExpense = categories.reduce((sum, cat) => sum + (cat.value || 0), 0);

  // Budgets state
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [editCategory, setEditCategory] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState('');
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [budgetsLoading, setBudgetsLoading] = useState(false);

  const getBudgetKey = (catName: string) => {
    return catName === 'Monthly Total' ? 'monthly' : catName;
  };

  // Load budgets from backend or AsyncStorage
  const loadBudgets = async () => {
    setBudgetsLoading(true);
    if (!activeWorkspaceId || activeWorkspaceId === 'personal') {
      try {
        const stored = await AsyncStorage.getItem('categoryBudgets');
        if (stored) {
          setBudgets(JSON.parse(stored));
        } else {
          // Set some default budgets for starting users
          const defaultBudgets = {
            'monthly': 300000,
            'Rent': 60000,
            'Payroll': 150000,
            'Marketing': 30000,
            'Utilities': 15000,
            'Travel': 10000,
            'Office': 8000,
            'Food': 5000,
            'Other': 20000,
          };
          await AsyncStorage.setItem('categoryBudgets', JSON.stringify(defaultBudgets));
          setBudgets(defaultBudgets);
        }
      } catch (e) {
        console.error('Failed to load budgets:', e);
      } finally {
        setBudgetsLoading(false);
      }
    } else {
      // Business Workspace budgets
      try {
        const res = await apiClient.get('/dashboard/budget');
        if (res.ok) {
          const data = await res.json();
          const newBudgets: Record<string, number> = {};
          
          if (data.limit > 0) {
            newBudgets['monthly'] = data.limit;
          }
          if (data.categoryStatus) {
            Object.entries(data.categoryStatus).forEach(([k, v]: any) => {
              newBudgets[k] = v.limit;
            });
          }
          setBudgets(newBudgets);
        }
      } catch (err) {
        console.error('Failed to load business budgets:', err);
      } finally {
        setBudgetsLoading(false);
      }
    }
  };

  const fetchApprovals = async () => {
    if (!activeWorkspaceId || activeWorkspaceId === 'personal') return;
    setApprovalsLoading(true);
    try {
      const resPending = await apiClient.get('/dashboard/transactions/approvals');
      if (resPending.ok) {
        setPendingClaims(await resPending.json());
      }
      
      const resAll = await apiClient.get('/dashboard/transactions');
      if (resAll.ok) {
        const list = await resAll.json();
        setApprovedClaims(list.filter((t: any) => t.status === 'approved'));
      }
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setApprovalsLoading(false);
    }
  };

  const handleApprove = async (claimId: string) => {
    try {
      const res = await apiClient.patch(`/dashboard/transactions/${claimId}/approve`);
      if (res.ok) {
        Alert.alert('Approved', 'Expense claim approved successfully.');
        fetchApprovals();
        if (onRefreshData) onRefreshData();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to approve claim.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleReject = async () => {
    if (!rejectionNotes) {
      Alert.alert('Required', 'Please enter rejection comments.');
      return;
    }
    try {
      const res = await apiClient.patch(`/dashboard/transactions/${selectedClaimId}/reject`, {
        notes: rejectionNotes
      });
      if (res.ok) {
        setRejectModalVisible(false);
        setRejectionNotes('');
        Alert.alert('Rejected', 'Expense claim rejected.');
        fetchApprovals();
        if (onRefreshData) onRefreshData();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to reject claim.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleReimburse = async (claimId: string) => {
    try {
      const res = await apiClient.patch(`/dashboard/transactions/${claimId}/reimburse`);
      if (res.ok) {
        Alert.alert('Reimbursed', 'Claim marked as reimbursed.');
        fetchApprovals();
        if (onRefreshData) onRefreshData();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to mark as reimbursed.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  useEffect(() => {
    loadBudgets();
    if (activeSubTab === 'approvals') {
      fetchApprovals();
    }
  }, [activeSubTab, activeWorkspaceId]);

  const openEditBudget = (categoryName: string) => {
    const key = getBudgetKey(categoryName);
    setEditCategory(categoryName);
    setEditLimit(String(budgets[key] || ''));
    setBudgetModalVisible(true);
  };

  const handleSaveBudget = async () => {
    if (!editCategory) return;
    const parsedLimit = parseFloat(editLimit);
    if (isNaN(parsedLimit) || parsedLimit < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid budget limit.');
      return;
    }

    const key = getBudgetKey(editCategory);
    const updatedBudgets = {
      ...budgets,
      [key]: parsedLimit,
    };

    if (!activeWorkspaceId || activeWorkspaceId === 'personal') {
      try {
        await AsyncStorage.setItem('categoryBudgets', JSON.stringify(updatedBudgets));
        setBudgets(updatedBudgets);
        setBudgetModalVisible(false);
        setEditCategory(null);
      } catch (e) {
        Alert.alert('Error', 'Failed to save budget.');
      }
    } else {
      // RBAC validation
      const allowedRoles = ['owner', 'partner', 'accountant'];
      if (!allowedRoles.includes(activeWorkspaceRole || '')) {
        Alert.alert('Permission Denied', 'Only Owners, Partners, and Accountants can modify budgets.');
        return;
      }

      try {
        const res = await apiClient.patch(`/businesses/${activeWorkspaceId}`, {
          budgets: updatedBudgets
        });
        if (res.ok) {
          setBudgets(updatedBudgets);
          setBudgetModalVisible(false);
          setEditCategory(null);
          if (onRefreshData) onRefreshData();
        } else {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to save budgets.');
        }
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to update workspace budgets.');
      }
    }
  };

  // Custom Chart: Monthly Trend
  const renderTrendChart = () => {
    if (monthlyTrend.length === 0) {
      return null;
    }

    const maxTrendVal = monthlyTrend.reduce((acc, curr) => {
      return Math.max(acc, curr.total || 0);
    }, 1000);

    return (
      <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>Monthly Expense Trend</Text>
        <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>Historical spending trend (last 12 months)</Text>

        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          <View style={styles.trendChartWrap}>
            <View style={styles.trendBarsContainer}>
              {monthlyTrend.map((item, index) => {
                const ratio = Math.max(0.04, Math.min(1, (item.total || 0) / maxTrendVal));
                return (
                  <View key={index} style={styles.trendCol}>
                    <Text style={[styles.trendValText, { color: theme.textSecondary }]}>
                      {item.total >= 1000 ? `₹${Math.round(item.total / 1000)}k` : `₹${item.total}`}
                    </Text>
                    <View style={[styles.trendBarOuter, { backgroundColor: theme.bg }]}>
                      <View style={[styles.trendBarInner, { height: `${ratio * 100}%`, backgroundColor: accentHex }]} />
                    </View>
                    <Text style={[styles.trendLabel, { color: theme.textMuted }]}>{item.month}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      {/* Subtab navigation */}
      <View style={[styles.subTabBar, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'analysis' && { backgroundColor: theme.bg, borderColor: accentHex }]}
          onPress={() => setActiveSubTab('analysis')}
        >
          <PieChartIcon color={activeSubTab === 'analysis' ? accentHex : theme.textMuted} size={18} style={{ marginRight: 6 }} />
          <Text style={[styles.subTabText, { color: activeSubTab === 'analysis' ? accentHex : theme.textMuted }]}>
            {t('category_analysis')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'budgets' && { backgroundColor: theme.bg, borderColor: accentHex }]}
          onPress={() => setActiveSubTab('budgets')}
        >
          <WalletIcon color={activeSubTab === 'budgets' ? accentHex : theme.textMuted} size={18} style={{ marginRight: 6 }} />
          <Text style={[styles.subTabText, { color: activeSubTab === 'budgets' ? accentHex : theme.textMuted }]}>
            {t('monthly_budgets')}
          </Text>
        </TouchableOpacity>

        {activeWorkspaceId !== 'personal' && (
          <TouchableOpacity
            style={[styles.subTab, activeSubTab === 'approvals' && { backgroundColor: theme.bg, borderColor: accentHex }]}
            onPress={() => setActiveSubTab('approvals')}
          >
            <CheckIcon color={activeSubTab === 'approvals' ? accentHex : theme.textMuted} size={18} style={{ marginRight: 6 }} />
            <Text style={[styles.subTabText, { color: activeSubTab === 'approvals' ? accentHex : theme.textMuted }]}>
              {t('approvals')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.scrollContent}>
        {loading || budgetsLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={accentHex} size="large" />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Fetching insights...</Text>
          </View>
        ) : activeSubTab === 'analysis' ? (
          <>
            {/* Glowing Donut / Total Outflow Header             {/* Glowing Donut / Total Outflow Header */}
            <View style={[styles.donutOverviewCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.donutRingWrapper}>
                <View style={[styles.donutRingCenter, { backgroundColor: theme.bg }]}>
                  <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: '700' }}>Total Monthly Outflow</Text>
                  <Text style={[styles.donutTotalAmount, { color: theme.text }]}>₹{totalExpense.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              {/* Dynamic Category Legend Pills from Live Transactions */}
              {categories.length > 0 ? (
                <View style={styles.legendGrid}>
                  {categories.slice(0, 4).map((cat, idx) => {
                    const percent = totalExpense > 0 ? Math.round((cat.value / totalExpense) * 100) : 0;
                    const palette = ['#38bdf8', '#10b981', '#8b5cf6', '#f59e0b'];
                    const color = cat.color || palette[idx % palette.length];
                    return (
                      <View key={cat.name || idx} style={[styles.legendPill, { backgroundColor: `${color}15`, borderColor: `${color}40` }]}>
                        <View style={[styles.legendDot, { backgroundColor: color }]} />
                        <Text style={{ color: theme.text, fontSize: 11, fontWeight: '700' }}>{cat.name} {percent}%</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', marginTop: 12 }}>
                  No categorized expenses recorded this month.
                </Text>
              )}
            </View>

            {/* Category breakdown list */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Category Breakdown & Tracking</Text>
            {categories.length > 0 ? (
              <View style={[styles.categoriesCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                {categories.map((cat, index) => {
                  const percent = totalExpense > 0 ? ((cat.value / totalExpense) * 100).toFixed(0) : '0';
                  const barColor = cat.color || `hsl(${index * 55}, 70%, 50%)`;

                  return (
                    <View key={index} style={styles.catRow}>
                      <View style={styles.catInfoRow}>
                        <View style={styles.catLabelGroup}>
                          <View style={[styles.catColorIndicator, { backgroundColor: barColor }]} />
                          <Text style={[styles.catName, { color: theme.text }]}>{cat.name}</Text>
                        </View>
                        <View style={styles.catValGroup}>
                          <Text style={[styles.catValue, { color: theme.text }]}>₹{cat.value.toLocaleString('en-IN')}</Text>
                          <Text style={[styles.catPercent, { color: theme.textMuted }]}>{percent}%</Text>
                        </View>
                      </View>

                      {/* Horizontal Progress Bar */}
                      <View style={[styles.progressBg, { backgroundColor: theme.bg }]}>
                        <View style={[
                          styles.progressFill, 
                          { width: `${percent}%` as DimensionValue, backgroundColor: barColor }
                        ]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.emptyCategories, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <PieChartIcon color={theme.textMuted} size={32} style={{ marginBottom: 10 }} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No categorized expenses found.</Text>
                <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Upload a statement or add transactions manually.</Text>
              </View>
            )}

            {/* Monthly Trend Chart */}
            {renderTrendChart()}
          </>
        ) : activeSubTab === 'budgets' ? (
          /* Monthly Budgets Screen Content with Cohesive Dark Theme */
          <>
            <View style={[styles.budgetHelpBox, { backgroundColor: theme.isDark ? '#0b2038' : '#eff6ff', borderColor: theme.isDark ? '#153e6b' : '#bfdbfe' }]}>
              <Text style={[styles.budgetHelpText, { color: theme.isDark ? '#93c5fd' : '#1e40af' }]}>
                💡 Set monthly budget limits for each category to keep track of spending. We'll warn you if you cross 80% or exceed your caps.
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>Category Budgets & Usage</Text>
            
            <View style={styles.budgetsContainer}>
              {CATEGORIES.map((catName) => {
                const key = getBudgetKey(catName);
                
                // Sum expenses for category or overall monthly
                let currentSpend = 0;
                if (key === 'monthly') {
                  currentSpend = totalExpense;
                } else {
                  currentSpend = categories.find(c => c.name.toLowerCase() === catName.toLowerCase())?.value || 0;
                }

                const budgetLimit = budgets[key] || 0;
                const ratio = budgetLimit > 0 ? (currentSpend / budgetLimit) : 0;
                const percentUsed = Math.round(ratio * 100);

                let statusColor = '#2ecc71'; // green on-track
                let statusBg = 'rgba(46,204,113,0.15)';
                let statusLabel = 'On Track';
                
                if (budgetLimit === 0) {
                  statusColor = theme.textMuted;
                  statusBg = theme.bg;
                  statusLabel = 'Not Set';
                } else if (ratio >= 1.0) {
                  statusColor = '#ff6b6b'; // red exceeded
                  statusBg = 'rgba(255,107,107,0.15)';
                  statusLabel = 'Exceeded';
                } else if (ratio >= 0.8) {
                  statusColor = '#f39c12'; // yellow warning
                  statusBg = 'rgba(243,156,18,0.15)';
                  statusLabel = 'Warning';
                }

                return (
                  <View key={catName} style={[styles.budgetRowCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={styles.budgetHeader}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.budgetCatName, { color: theme.text }]}>{catName}</Text>
                        <Text style={[styles.budgetSpendMeta, { color: theme.textSecondary }]}>
                          Spent: <Text style={[styles.boldText, { color: theme.text }]}>₹{currentSpend.toLocaleString('en-IN')}</Text> of ₹{budgetLimit.toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <View style={styles.rightHeaderWrap}>
                        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                          <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                        </View>

                        <TouchableOpacity style={[styles.editBudgetBtn, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]} onPress={() => openEditBudget(catName)}>
                          <Edit3Icon color={accentHex} size={14} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Progress Fill Bar */}
                    {budgetLimit > 0 && (
                      <View style={[styles.progressBg, { backgroundColor: theme.bg }]}>
                        <View style={[
                          styles.progressFill, 
                          {
                            width: `${Math.min(100, percentUsed)}%` as DimensionValue,
                            backgroundColor: statusColor
                          }
                        ]} />
                      </View>
                    )}

                    {budgetLimit > 0 && (
                      <View style={styles.budgetFooterRow}>
                        <Text style={[styles.budgetPercentText, { color: accentHex }]}>{percentUsed}% used</Text>
                        <Text style={[styles.budgetRemText, { color: theme.text }]}>
                          {ratio >= 1.0 
                            ? `Over by ₹${Math.abs(currentSpend - budgetLimit).toLocaleString('en-IN')}`
                            : `₹${(budgetLimit - currentSpend).toLocaleString('en-IN')} left`}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <>
            {/* Approvals tab content */}
            <View style={styles.approvalHeaderGroup}>
              <View style={styles.toggleGroup}>
                <TouchableOpacity
                  style={[styles.toggleBtn, approvalTab === 'pending' && styles.toggleActive]}
                  onPress={() => setApprovalTab('pending')}
                >
                  <Text style={[styles.toggleText, approvalTab === 'pending' && styles.toggleTextActive]}>
                    Pending ({pendingClaims.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, approvalTab === 'reimburse' && styles.toggleActive]}
                  onPress={() => setApprovalTab('reimburse')}
                >
                  <Text style={[styles.toggleText, approvalTab === 'reimburse' && styles.toggleTextActive]}>
                    Reimbursements ({approvedClaims.length})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {approvalsLoading ? (
              <ActivityIndicator color={accentHex} size="large" style={{ marginTop: 40 }} />
            ) : approvalTab === 'pending' ? (
              pendingClaims.length > 0 ? (
                pendingClaims.map(claim => (
                  <View key={claim.id || claim._id} style={styles.claimCard}>
                    <View style={styles.claimHeader}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.claimDesc}>{claim.description || 'Expense Claim'}</Text>
                        <Text style={styles.claimSub}>Category: {claim.category} • Date: {claim.date}</Text>
                        {claim.merchant ? <Text style={styles.claimSub}>Merchant: {claim.merchant}</Text> : null}
                      </View>
                      <Text style={styles.claimAmount}>₹{claim.amount.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.claimActions}>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => { setSelectedClaimId(claim.id || claim._id); setRejectModalVisible(true); }}>
                        <XIcon color="#ff6b6b" size={14} style={{ marginRight: 4 }} />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(claim.id || claim._id)}>
                        <CheckIcon color="#ffffff" size={14} style={{ marginRight: 4 }} />
                        <Text style={styles.approveBtnText}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyClaims}>
                  <Text style={styles.emptyClaimsText}>No pending expense claims to approve! 🎉</Text>
                </View>
              )
            ) : (
              approvedClaims.length > 0 ? (
                approvedClaims.map(claim => (
                  <View key={claim.id || claim._id} style={styles.claimCard}>
                    <View style={styles.claimHeader}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.claimDesc}>{claim.description || 'Expense Claim'}</Text>
                        <Text style={styles.claimSub}>Category: {claim.category} • Date: {claim.date}</Text>
                      </View>
                      <Text style={styles.claimAmount}>₹{claim.amount.toLocaleString('en-IN')}</Text>
                    </View>
                    <TouchableOpacity style={styles.reimburseBtn} onPress={() => handleReimburse(claim.id || claim._id)}>
                      <DollarSignIcon color="#ffffff" size={14} style={{ marginRight: 4 }} />
                      <Text style={styles.reimburseBtnText}>Mark Reimbursed</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyClaims}>
                  <Text style={styles.emptyClaimsText}>No approved claims waiting for reimbursement.</Text>
                </View>
              )
            )}
          </>
        )}
      </ScrollView>

      {/* Edit Budget Modal */}
      <Modal
        visible={budgetModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setBudgetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Set Budget Limit</Text>
              <TouchableOpacity onPress={() => setBudgetModalVisible(false)} style={styles.modalCloseBtn}>
                <XIcon color={theme.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>Category: <Text style={[styles.boldText, { color: theme.text }]}>{editCategory}</Text></Text>

            <View style={[styles.inputWrap, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.inputPrefix, { color: accentHex }]}>₹</Text>
              <TextInput
                style={[styles.modalInput, { color: theme.text }]}
                value={editLimit}
                onChangeText={setEditLimit}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.textMuted}
                autoFocus={true}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel, { borderColor: theme.cardBorder }]}
                onPress={() => setBudgetModalVisible(false)}
              >
                <Text style={[styles.modalBtnCancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: accentHex }]}
                onPress={handleSaveBudget}
              >
                <CheckIcon color="#ffffff" size={16} style={{ marginRight: 6 }} />
                <Text style={styles.modalBtnSaveText}>Save Limit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Claim Modal */}
      <Modal
        visible={rejectModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Reject Expense Claim</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)} style={styles.modalCloseBtn}>
                <XIcon color={theme.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>Provide rejection comments / feedback:</Text>

            <View style={[styles.inputWrap, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
              <TextInput
                style={[styles.modalInput, { color: theme.text }]}
                value={rejectionNotes}
                onChangeText={setRejectionNotes}
                placeholder="Reason for rejection..."
                placeholderTextColor={theme.textMuted}
                autoFocus={true}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel, { borderColor: theme.cardBorder }]}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={[styles.modalBtnCancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#ff6b6b' }]}
                onPress={handleReject}
              >
                <XIcon color="#ffffff" size={16} style={{ marginRight: 6 }} />
                <Text style={styles.modalBtnSaveText}>Reject Claim</Text>
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
    backgroundColor: '#f8fafc',
  },
  subTabBar: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 6,
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  subTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4f46e5',
  },
  subTabText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  subTabTextActive: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    color: '#64748b',
    fontSize: 15,
    marginTop: 12,
  },
  donutOverviewCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  donutRingWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#38bdf8',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  donutRingCenter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  donutTotalAmount: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
    letterSpacing: -0.3,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  headerLabel: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  headerValue: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  categoriesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 24,
  },
  catRow: {
    marginBottom: 18,
  },
  catInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  catColorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  catName: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  catValGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catValue: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  catPercent: {
    color: '#4f46e5',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 32,
    textAlign: 'center',
  },
  progressBg: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyCategories: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 20,
  },
  chartTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  chartSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 16,
  },
  trendChartWrap: {
    paddingTop: 10,
    minWidth: 400,
  },
  trendBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  trendCol: {
    alignItems: 'center',
    width: 32,
  },
  trendValText: {
    color: '#0f172a',
    fontSize: 8,
    marginBottom: 4,
  },
  trendBarOuter: {
    width: 10,
    height: 70,
    backgroundColor: '#f1f5f9',
    borderRadius: 5,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 6,
  },
  trendBarInner: {
    width: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 5,
  },
  trendLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '600',
  },
  budgetHelpBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  budgetHelpText: {
    color: '#1e40af',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  budgetsContainer: {
    gap: 12,
  },
  budgetRowCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  budgetCatName: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  budgetSpendMeta: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  boldText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  rightHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  editBudgetBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  budgetPercentText: {
    color: '#4f46e5',
    fontSize: 10,
    fontWeight: '600',
  },
  budgetRemText: {
    color: '#0f172a',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    maxWidth: 360,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSub: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 20,
  },
  inputPrefix: {
    color: '#4f46e5',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 6,
  },
  modalInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  modalBtnCancel: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalBtnCancelText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
  },
  modalBtnSave: {
    backgroundColor: '#4f46e5',
  },
  modalBtnSaveText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  approvalHeaderGroup: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 2,
    flex: 1,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: '#4f46e5',
  },
  toggleText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  claimCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 12,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  claimDesc: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  claimSub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  claimAmount: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  claimActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ef4444',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rejectBtnText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  reimburseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    height: 36,
    borderRadius: 8,
    marginTop: 6,
  },
  reimburseBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyClaims: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyClaimsText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
});
