import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { TrendingUp, TrendingDown, DollarSign, Brain } from 'lucide-react-native';
import { AiForecastScreen } from './AiForecastScreen';
import { useTheme } from '../theme/themeSystem';
import { useTranslation } from '../theme/i18n';

const TrendingUpIcon = TrendingUp as any;
const TrendingDownIcon = TrendingDown as any;
const DollarSignIcon = DollarSign as any;
const BrainIcon = Brain as any;

type CashFlowScreenProps = {
  cashflowData: {
    monthlyData?: any[];
    stats?: any[];
  };
  loading: boolean;
  apiBaseUrl: string;
  authToken: string | null;
  activeWorkspaceId?: string;
};

export function CashFlowScreen({ 
  cashflowData, 
  loading,
  apiBaseUrl,
  authToken,
  activeWorkspaceId
}: CashFlowScreenProps) {
  const { theme, accentHex } = useTheme();
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<'statement' | 'forecast'>('statement');
  const stats = (cashflowData && Array.isArray(cashflowData.stats)) ? cashflowData.stats : [];
  const monthlyData = (cashflowData && Array.isArray(cashflowData.monthlyData)) ? cashflowData.monthlyData : [];

  const getStatVal = (label: string) => {
    if (!Array.isArray(stats)) return '₹0';
    const s = stats.find((x) => x && x.label && x.label.toLowerCase() === label.toLowerCase());
    return s ? s.value : '₹0';
  };

  const getStatPositive = (label: string) => {
    if (!Array.isArray(stats)) return true;
    const s = stats.find((x) => x && x.label && x.label.toLowerCase() === label.toLowerCase());
    return s ? s.positive : true;
  };

  // Render comparative bars
  const renderDoubleBarChart = () => {
    if (monthlyData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No monthly cashflow data recorded yet.</Text>
        </View>
      );
    }

    const maxVal = monthlyData.reduce((acc, curr) => {
      return Math.max(acc, curr.inflow || 0, curr.outflow || 0);
    }, 1000);

    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Inflow vs Outflow Trend</Text>
        <Text style={styles.chartSubtitle}>Comparison of monthly money movement</Text>
        
        <View style={styles.barsContainer}>
          {monthlyData.map((row, index) => {
            const inflowRatio = (row.inflow || 0) / maxVal;
            const outflowRatio = (row.outflow || 0) / maxVal;

            return (
              <View key={index} style={styles.barGroup}>
                <View style={styles.doubleBarOuter}>
                  {/* Inflow bar */}
                  <View style={styles.barCol}>
                    <Text style={styles.barValText}>
                      {(row.inflow || 0) >= 1000 ? `₹${Math.round((row.inflow || 0) / 1000)}k` : `₹${row.inflow || 0}`}
                    </Text>
                    <View style={[styles.barInner, styles.bgInflow, { height: `${inflowRatio * 70}%` }]} />
                  </View>
                  
                  {/* Outflow bar */}
                  <View style={styles.barCol}>
                    <Text style={styles.barValText}>
                      {(row.outflow || 0) >= 1000 ? `₹${Math.round((row.outflow || 0) / 1000)}k` : `₹${row.outflow || 0}`}
                    </Text>
                    <View style={[styles.barInner, styles.bgOutflow, { height: `${outflowRatio * 70}%` }]} />
                  </View>
                </View>
                <Text style={styles.barLabel}>{row.month}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.bgInflow]} />
            <Text style={styles.legendText}>Inflow (Revenue)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.bgOutflow]} />
            <Text style={styles.legendText}>Outflow (Expense)</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      {/* Subtab navigation */}
      <View style={[styles.subTabBar, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'statement' && { backgroundColor: theme.bg, borderColor: accentHex }]}
          onPress={() => setActiveSubTab('statement')}
        >
          <DollarSignIcon color={activeSubTab === 'statement' ? accentHex : theme.textMuted} size={16} style={{ marginRight: 6 }} />
          <Text style={[styles.subTabText, { color: activeSubTab === 'statement' ? accentHex : theme.textMuted }]}>
            {t('statements')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'forecast' && { backgroundColor: theme.bg, borderColor: accentHex }]}
          onPress={() => setActiveSubTab('forecast')}
        >
          <BrainIcon color={activeSubTab === 'forecast' ? accentHex : theme.textMuted} size={16} style={{ marginRight: 6 }} />
          <Text style={[styles.subTabText, { color: activeSubTab === 'forecast' ? accentHex : theme.textMuted }]}>
            AI Forecasting
          </Text>
        </TouchableOpacity>
      </View>

      {activeSubTab === 'forecast' ? (
        <AiForecastScreen
          apiBaseUrl={apiBaseUrl}
          authToken={authToken}
          activeWorkspaceId={activeWorkspaceId}
        />
      ) : (
        <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.scrollContent}>
          {loading && stats.length === 0 ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator color={accentHex} size="large" />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Fetching cash flow records...</Text>
            </View>
          ) : (
            <>
              {/* Header Title & Runway Status */}
              <View style={styles.cashflowHeaderRow}>
                <Text style={[styles.mainTitle, { color: theme.text }]}>Cash Flow Management</Text>
                <View style={[styles.runwayBadge, { backgroundColor: '#10b98115', borderColor: '#10b98150' }]}>
                  <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '800' }}>Runway: 12.4 Months (Safe)</Text>
                </View>
              </View>

              {/* 🚨 30-DAY PREDICTIVE CASH CRUNCH EARLY WARNING RADAR */}
              <View style={[styles.radarCard, { backgroundColor: theme.card, borderColor: '#f8717150' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 16 }}>🚨</Text>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#f87171' }}>30-Day Cash Crunch Radar</Text>
                  </View>
                  <View style={[styles.radarBadge, { backgroundColor: '#ef444420', borderColor: '#ef444450' }]}>
                    <Text style={{ color: '#fca5a5', fontSize: 10, fontWeight: '800' }}>GAP DETECTED (DAY 18)</Text>
                  </View>
                </View>

                <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 12, lineHeight: 16 }}>
                  Projected liquidity deficit of ₹65,000 on Day 18 due to advance tax commitments.
                </Text>

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  <View style={[styles.radarMetric, { backgroundColor: theme.bg }]}>
                    <Text style={{ fontSize: 10, color: theme.textSecondary }}>Days to Crunch</Text>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#ef4444' }}>18 Days</Text>
                  </View>
                  <View style={[styles.radarMetric, { backgroundColor: theme.bg }]}>
                    <Text style={{ fontSize: 10, color: theme.textSecondary }}>Max Deficit</Text>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#f59e0b' }}>₹65,000</Text>
                  </View>
                  <View style={[styles.radarMetric, { backgroundColor: theme.bg }]}>
                    <Text style={{ fontSize: 10, color: theme.textSecondary }}>Runway Buffer</Text>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#10b981' }}>Safe (45d)</Text>
                  </View>
                </View>

                <View style={[styles.radarActionBox, { backgroundColor: theme.bg }]}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#f87171', marginBottom: 4 }}>⚡ AI MITIGATION ACTIONS:</Text>
                  <Text style={{ fontSize: 11, color: theme.textSecondary, lineHeight: 15 }}>
                    • Collect ₹85,000 overdue from Khata parties via WhatsApp UPI.
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.textSecondary, lineHeight: 15 }}>
                    • Run 48h clearance on 2 dead-stock items to release ₹1.78 Lakhs.
                  </Text>
                </View>
              </View>

              {/* Summary Stats cards */}
              <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: '#38bdf840' }]}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Opening Balance</Text>
                  <Text style={[styles.statValue, { color: '#38bdf8' }]}>₹8,50,000</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: '#10b98140' }]}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Net Monthly Inflow</Text>
                  <Text style={[styles.statValue, { color: '#10b981' }]}>+₹3,30,000</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: '#f59e0b40' }]}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Burn Rate</Text>
                  <Text style={[styles.statValue, { color: '#f59e0b' }]}>₹85,000/mo</Text>
                </View>
              </View>

              {/* Double Bar Chart */}
              {renderDoubleBarChart()}

              {/* 30-Day and 60-Day Projected Cash Cards */}
              <View style={styles.projectionRow}>
                <View style={[styles.projectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.projectionLabel, { color: theme.textSecondary }]}>30-Day Projected:</Text>
                  <Text style={[styles.projectionVal, { color: theme.text }]}>₹11,80,000</Text>
                </View>
                <View style={[styles.projectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.projectionLabel, { color: theme.textSecondary }]}>60-Day Projected:</Text>
                  <Text style={[styles.projectionVal, { color: theme.text }]}>₹15,10,000</Text>
                </View>
              </View>
        </>
      )}
    </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  statsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  borderGreen: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  cashflowHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  runwayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  projectionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  projectionCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectionLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  projectionVal: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  borderRed: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statDesc: {
    color: '#94a3b8',
    fontSize: 11,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 24,
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
    marginBottom: 20,
  },
  emptyChart: {
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
    color: '#64748b',
    fontSize: 13,
  },
  chartContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  barsRow: {
    flexDirection: 'row',
    gap: 4,
    height: 90,
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  barOuter: {
    width: 8,
    height: '100%',
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barInflow: {
    width: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  barOutflow: {
    width: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  chartLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  bgInflow: {
    backgroundColor: '#10b981',
  },
  bgOutflow: {
    backgroundColor: '#ef4444',
  },
  legendText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  th: {
    flex: 1,
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  flexLeft: {
    textAlign: 'left',
    flex: 0.8,
  },
  flexRight: {
    textAlign: 'right',
    flex: 1.2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  td: {
    flex: 1,
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
  },
  bold: {
    fontWeight: '700',
    color: '#0f172a',
  },
  colorGreen: {
    color: '#10b981',
  },
  colorRed: {
    color: '#ef4444',
  },
  emptyTable: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 30,
    alignItems: 'center',
  },
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
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 16,
  },
  barGroup: {
    alignItems: 'center',
    width: 48,
  },
  doubleBarOuter: {
    flexDirection: 'row',
    gap: 4,
    height: 90,
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  barCol: {
    alignItems: 'center',
  },
  barValText: {
    color: '#0f172a',
    fontSize: 7,
    marginBottom: 4,
  },
  barInner: {
    width: 8,
    borderRadius: 4,
  },
  barLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '600',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  radarCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
  radarBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  radarMetric: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  radarActionBox: {
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
});
