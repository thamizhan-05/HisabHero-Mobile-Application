import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
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
} from 'lucide-react-native';
import { AddTransactionModal } from './AddTransactionModal';
import { AiReportModal } from './AiReportModal';
import { apiClient } from '../lib/apiClient';

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
}: DashboardScreenProps) {
  const [addTxVisible, setAddTxVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [invitationCount, setInvitationCount] = useState(0);

  // Phase 1 UI States
  const [editTransaction, setEditTransaction] = useState<any | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Phase 2 AR/AP States
  const [arApStats, setArApStats] = useState<any>({
    accountsReceivable: 0,
    overdueReceivable: 0,
    accountsPayable: 0,
    overduePayable: 0
  });

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

  useEffect(() => {
    fetchInvitations();
    fetchBudgetStatus();
    fetchArApStats();
  }, [authToken, loading]);

  const handleRefresh = () => {
    onRefreshData();
    fetchBudgetStatus();
    fetchArApStats();
  };

  const getStatValue = (label: string) => {
    const s = stats.find((x) => x.label.toLowerCase() === label.toLowerCase());
    return s ? s.value : '₹0';
  };

  const getStatPositive = (label: string) => {
    const s = stats.find((x) => x.label.toLowerCase() === label.toLowerCase());
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
        <View style={styles.chartEmpty}>
          <Text style={styles.emptyText}>No financial data available for charts.</Text>
          <Text style={styles.emptySubtext}>Upload a bank statement in the 'Upload' tab.</Text>
        </View>
      );
    }

    // Determine max value to scale chart
    const maxVal = runway.reduce((acc, curr) => {
      return Math.max(acc, curr.balance || 0);
    }, 1000);

    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Cash Balance Trend</Text>
        <Text style={styles.chartSubtitle}>Running account balance by month (past 6 months)</Text>
        
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
      </View>
    );
  };

  const getAlertIcon = (iconName: string, type: string) => {
    const color = type === 'anomaly' ? '#ff6b6b' : type === 'warning' ? '#f39c12' : '#2ecc71';
    if (iconName === 'AlertTriangle') return <AlertTriangleIcon color={color} size={20} />;
    if (iconName === 'Lightbulb') return <LightbulbIcon color={color} size={20} />;
    return <SparklesIcon color={color} size={20} />;
  };

  const getHealthCategory = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: '#2ecc71' };
    if (score >= 50) return { label: 'Good', color: '#3498db' };
    if (score >= 30) return { label: 'Fair', color: '#f1c40f' };
    return { label: 'Poor / Critical', color: '#e74c3c' };
  };

  const healthInfo = getHealthCategory(healthScore);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {invitationCount > 0 && (
        <TouchableOpacity style={styles.inviteBanner} onPress={onOpenWorkspaceSwitcher}>
          <ShieldAlertIcon color="#ff8f8f" size={18} style={{ marginRight: 8 }} />
          <Text style={styles.inviteBannerText}>
            You have {invitationCount} pending workspace invitation{invitationCount > 1 ? 's' : ''}! Tap to review.
          </Text>
        </TouchableOpacity>
      )}
      {activeWorkspaceId !== 'personal' && ['owner', 'partner', 'accountant'].includes(activeWorkspaceRole || '') && (transactions || []).filter(t => t.status === 'pending_approval').length > 0 && (
        <View style={[styles.inviteBanner, { backgroundColor: '#1b2c3f', borderColor: '#2b4d73', marginBottom: 20 }]}>
          <ShieldAlertIcon color="#4f8cff" size={18} style={{ marginRight: 8 }} />
          <Text style={[styles.inviteBannerText, { color: '#8fc0ff' }]}>
            You have {(transactions || []).filter(t => t.status === 'pending_approval').length} pending expense claims waiting for approval!
          </Text>
        </View>
      )}
      {loading && stats.length === 0 ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color="#4f8cff" size="large" />
          <Text style={styles.loadingText}>Fetching financial status...</Text>
        </View>
      ) : (
        <>
          {/* Health Score Circular Gauge & Actions */}
          <View style={styles.healthContainer}>
            <View style={styles.gaugeCard}>
              <Text style={styles.gaugeTitle}>Financial Health Score</Text>
              <View style={styles.gaugeOuter}>
                <View style={[styles.gaugeMask, { borderColor: healthInfo.color }]}>
                  <Text style={[styles.gaugeScore, { color: healthInfo.color }]}>{healthScore}</Text>
                  <Text style={styles.gaugeMax}>/100</Text>
                </View>
              </View>
              <Text style={[styles.gaugeLabel, { color: healthInfo.color }]}>
                {healthInfo.label}
              </Text>
              <Text style={styles.gaugeDesc}>
                Based on net margin, monthly outflow ratios, and runway.
              </Text>
            </View>

            {/* Quick Actions Panel */}
            <View style={styles.actionColumn}>
              <TouchableOpacity
                style={styles.actionBtnAi}
                onPress={() => setReportVisible(true)}
              >
                <SparklesIcon color="#ffffff" size={20} style={styles.actionIcon} />
                <Text style={styles.actionBtnText}>Executive Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnAdd}
                onPress={() => {
                  setEditTransaction(null);
                  setAddTxVisible(true);
                }}
              >
                <PlusIcon color="#ffffff" size={20} style={styles.actionIcon} />
                <Text style={styles.actionBtnText}>Add Entry</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <Text style={styles.sectionTitle}>Key Business Metrics</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.borderGreen]}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Total Revenue</Text>
                <TrendingUpIcon color="#2ecc71" size={16} />
              </View>
              <Text style={styles.statValue}>{getStatValue('Total Revenue')}</Text>
              <Text style={styles.statGrowth}>Inflows recorded</Text>
            </View>

            <View style={[styles.statCard, styles.borderRed]}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Total Expenses</Text>
                <TrendingDownIcon color="#ff6b6b" size={16} />
              </View>
              <Text style={styles.statValue}>{getStatValue('Total Expenses')}</Text>
              <Text style={styles.statGrowth}>Outflows recorded</Text>
            </View>

            <View style={[styles.statCard, getStatPositive('Net Margin') ? styles.borderGreen : styles.borderRed]}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Net Margin</Text>
                <PercentIcon color={getStatPositive('Net Margin') ? '#2ecc71' : '#ff6b6b'} size={16} />
              </View>
              <Text style={styles.statValue}>{getStatValue('Net Margin')}</Text>
              <Text style={styles.statGrowth}>Profit percentage</Text>
            </View>

            <View style={[styles.statCard, runwayMonths > 3 ? styles.borderGreen : runwayMonths > 1 ? styles.borderYellow : styles.borderRed]}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Cash Runway</Text>
                <CalendarIcon color={runwayMonths > 3 ? '#2ecc71' : '#ff6b6b'} size={16} />
              </View>
              <Text style={styles.statValue}>
                {runwayMonths > 0 ? `${runwayMonths} months` : 'N/A'}
              </Text>
              <Text style={styles.statGrowth}>At average burn rate</Text>
            </View>
          </View>

          {/* Budget Progress Indicators */}
          {budgetStatus && budgetStatus.limit > 0 && (
            <View style={styles.budgetCard}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetTitle}>Monthly Budget Status</Text>
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
          <View style={styles.arApCard}>
            <Text style={styles.arApTitle}>Outstanding Invoices & Bills</Text>
            <View style={styles.arApRow}>
              <View style={styles.arApCol}>
                <View style={styles.arApIconBoxBlue}>
                  <TrendingUpIcon color="#4f8cff" size={16} />
                </View>
                <Text style={styles.arApLabel}>Accounts Receivable</Text>
                <Text style={styles.arApValueBlue}>₹{arApStats.accountsReceivable?.toLocaleString('en-IN') || 0}</Text>
                {arApStats.overdueReceivable > 0 && (
                  <Text style={styles.arApOverdue}>Overdue: ₹{arApStats.overdueReceivable?.toLocaleString('en-IN')}</Text>
                )}
              </View>
              <View style={styles.arApDivider} />
              <View style={styles.arApCol}>
                <View style={styles.arApIconBoxRed}>
                  <TrendingDownIcon color="#ff6b6b" size={16} />
                </View>
                <Text style={styles.arApLabel}>Accounts Payable</Text>
                <Text style={styles.arApValueRed}>₹{arApStats.accountsPayable?.toLocaleString('en-IN') || 0}</Text>
                {arApStats.overduePayable > 0 && (
                  <Text style={styles.arApOverdue}>Overdue: ₹{arApStats.overduePayable?.toLocaleString('en-IN')}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Runway Chart */}
          {renderRevenueExpenseChart()}

          {/* AI Financial Alerts */}
          {alerts && alerts.length > 0 && (
            <View style={styles.alertsContainer}>
              <Text style={styles.sectionTitle}>Smart Financial Alerts</Text>
              {alerts.map((alert, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.alertCard,
                    alert.type === 'anomaly' 
                      ? styles.alertAnomaly 
                      : alert.type === 'warning' 
                      ? styles.alertWarning 
                      : styles.alertRecommendation
                  ]}
                >
                  <View style={styles.alertIconWrap}>
                    {getAlertIcon(alert.icon, alert.type)}
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertDesc}>{alert.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Search and Filters */}
          <Text style={styles.sectionTitle}>Filter Transactions</Text>
          <View style={styles.filterCard}>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="🔍 Search description, category, merchant..."
                placeholderTextColor="#8fc0ff"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            <View style={styles.filterOptionsRow}>
              {/* Type Filters */}
              <View style={styles.typeFilterRow}>
                {['all', 'expense', 'income'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.filterTabBtn,
                      typeFilter === t && styles.filterTabBtnActive
                    ]}
                    onPress={() => setTypeFilter(t as any)}
                  >
                    <Text style={[
                      styles.filterTabBtnText,
                      typeFilter === t && styles.filterTabBtnTextActive
                    ]}>
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category Selector tag pills */}
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.catFilterScroll}>
                <TouchableOpacity
                  style={[
                    styles.catFilterPill,
                    categoryFilter === 'all' && styles.catFilterPillActive
                  ]}
                  onPress={() => setCategoryFilter('all')}
                >
                  <Text style={[
                    styles.catFilterPillText,
                    categoryFilter === 'all' && styles.catFilterPillTextActive
                  ]}>
                    All Categories
                  </Text>
                </TouchableOpacity>
                {SUGGESTED_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catFilterPill,
                      categoryFilter === cat && styles.catFilterPillActive
                    ]}
                    onPress={() => setCategoryFilter(cat)}
                  >
                    <Text style={[
                      styles.catFilterPillText,
                      categoryFilter === cat && styles.catFilterPillTextActive
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
              <Text style={styles.sectionTitle}>Transactions Ledger</Text>
              {filteredTransactions.length > 5 && searchQuery === '' && categoryFilter === 'all' && typeFilter === 'all' && (
                <Text style={styles.txCountText}>Showing last 5</Text>
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
                      style={styles.txRow}
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
              <View style={styles.emptyTxs}>
                <Text style={styles.emptyTxsText}>No transactions match filters.</Text>
              </View>
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
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 24,
    alignItems: 'center',
  },
  emptyTxsText: {
    color: '#a6bedf',
    fontSize: 13,
  },
  inviteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b1828',
    borderColor: '#59203a',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  inviteBannerText: {
    color: '#dfa6c1',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  healthContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  gaugeCard: {
    flex: 1.2,
    backgroundColor: '#0b1d38',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 16,
    alignItems: 'center',
  },
  gaugeTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
  gaugeOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#06111f',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gaugeMask: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeScore: {
    fontSize: 26,
    fontWeight: '800',
  },
  gaugeMax: {
    fontSize: 12,
    color: '#a6bedf',
    fontWeight: '500',
    marginTop: 6,
  },
  gaugeLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  gaugeDesc: {
    color: '#a6bedf',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  actionColumn: {
    flex: 1,
    gap: 12,
    justifyContent: 'space-between',
  },
  actionBtnAi: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c4f9d',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2b73dc',
    padding: 12,
  },
  actionBtnAdd: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f8cff',
    borderRadius: 16,
    padding: 12,
  },
  actionIcon: {
    marginRight: 6,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 14,
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#0b1d38',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: '#a6bedf',
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 6,
  },
  statGrowth: {
    color: '#8fc0ff',
    fontSize: 9,
  },
  borderGreen: {
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  borderRed: {
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  borderYellow: {
    borderColor: 'rgba(243, 156, 18, 0.3)',
  },
  // Budget & Progress styles
  budgetCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
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
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  budgetPercentText: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#06111f',
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
    color: '#a6bedf',
    fontSize: 10,
    fontWeight: '500',
  },
  categoryBudgetsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#15345f',
    paddingTop: 12,
  },
  categoryBudgetSub: {
    color: '#8fc0ff',
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
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  catBudgetVal: {
    color: '#a6bedf',
    fontSize: 11,
  },
  catProgressBarBg: {
    height: 4,
    backgroundColor: '#06111f',
    borderRadius: 2,
    overflow: 'hidden',
  },
  catProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Filter & Search styles
  filterCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 14,
    marginBottom: 16,
  },
  searchRow: {
    backgroundColor: '#06111f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#15345f',
    paddingHorizontal: 12,
    height: 40,
    justifyContent: 'center',
    marginBottom: 10,
  },
  searchInput: {
    color: '#ffffff',
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
    borderColor: '#15345f',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06111f',
  },
  filterTabBtnActive: {
    borderColor: '#4f8cff',
    backgroundColor: 'rgba(79, 140, 255, 0.1)',
  },
  filterTabBtnText: {
    color: '#a6bedf',
    fontSize: 10,
    fontWeight: '700',
  },
  filterTabBtnTextActive: {
    color: '#4f8cff',
  },
  catFilterScroll: {
    marginTop: 4,
  },
  catFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#15345f',
    backgroundColor: '#06111f',
    marginRight: 6,
  },
  catFilterPillActive: {
    borderColor: '#4f8cff',
    backgroundColor: 'rgba(79, 140, 255, 0.15)',
  },
  catFilterPillText: {
    color: '#a6bedf',
    fontSize: 10,
    fontWeight: '600',
  },
  catFilterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  txMerchant: {
    color: '#a6bedf',
    fontSize: 10,
    fontWeight: '500',
  },
  txMetaDetails: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  txMetaText: {
    color: '#8fc0ff',
    fontSize: 9,
    fontWeight: '600',
  },
  arApCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 16,
    marginBottom: 20,
  },
  arApTitle: {
    color: '#ffffff',
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
    backgroundColor: '#15345f',
    marginHorizontal: 12,
  },
  arApLabel: {
    color: '#a6bedf',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
  },
  arApValueBlue: {
    color: '#4f8cff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  arApValueRed: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  arApOverdue: {
    color: '#8fc0ff',
    fontSize: 9,
    marginTop: 2,
  },
  arApIconBoxBlue: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(79, 140, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arApIconBoxRed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
