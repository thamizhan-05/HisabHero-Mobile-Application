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
  const [activeSubTab, setActiveSubTab] = useState<'statement' | 'forecast'>('statement');
  const stats = cashflowData.stats || [];
  const monthlyData = cashflowData.monthlyData || [];

  const getStatVal = (label: string) => {
    const s = stats.find((x) => x.label.toLowerCase() === label.toLowerCase());
    return s ? s.value : '₹0';
  };

  const getStatPositive = (label: string) => {
    const s = stats.find((x) => x.label.toLowerCase() === label.toLowerCase());
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
    <View style={styles.screenContainer}>
      {/* Subtab navigation */}
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'statement' && styles.subTabActive]}
          onPress={() => setActiveSubTab('statement')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'statement' && styles.subTabTextActive]}>
            Cash Statement
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'forecast' && styles.subTabActive]}
          onPress={() => setActiveSubTab('forecast')}
        >
          <BrainIcon color={activeSubTab === 'forecast' ? '#4f8cff' : '#8fc0ff'} size={16} style={{ marginRight: 6 }} />
          <Text style={[styles.subTabText, activeSubTab === 'forecast' && styles.subTabTextActive]}>
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
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          {loading && stats.length === 0 ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator color="#4f8cff" size="large" />
              <Text style={styles.loadingText}>Fetching cash flow records...</Text>
            </View>
          ) : (
            <>
              {/* Summary Stats cards */}
              <View style={styles.statsContainer}>
                <View style={[styles.statCard, styles.borderGreen]}>
                  <View style={styles.statHeader}>
                    <Text style={styles.statLabel}>Total Inflows</Text>
                    <TrendingUpIcon color="#2ecc71" size={16} />
                  </View>
                  <Text style={styles.statValue}>{getStatVal('Total Inflow')}</Text>
                  <Text style={styles.statDesc}>All cash receipts</Text>
                </View>

                <View style={[styles.statCard, styles.borderRed]}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Total Outflows</Text>
                <TrendingDownIcon color="#ff6b6b" size={16} />
              </View>
              <Text style={styles.statValue}>{getStatVal('Total Outflow')}</Text>
              <Text style={styles.statDesc}>All cash payments</Text>
            </View>

            <View style={[styles.statCard, getStatPositive('Net Cash Flow') ? styles.borderGreen : styles.borderRed]}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Net Cash Flow</Text>
                <DollarSignIcon color={getStatPositive('Net Cash Flow') ? '#2ecc71' : '#ff6b6b'} size={16} />
              </View>
              <Text style={[styles.statValue, getStatPositive('Net Cash Flow') ? styles.colorGreen : styles.colorRed]}>
                {getStatVal('Net Cash Flow')}
              </Text>
              <Text style={styles.statDesc}>Surplus / Deficit</Text>
            </View>
          </View>

          {/* Double Bar Chart */}
          {renderDoubleBarChart()}

          {/* Monthly Table Overview */}
          <Text style={styles.sectionTitle}>Monthly Cashflow Breakdown</Text>
          {monthlyData.length > 0 ? (
            <View style={styles.tableCard}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, styles.flexLeft]}>Month</Text>
                <Text style={styles.th}>Inflow</Text>
                <Text style={styles.th}>Outflow</Text>
                <Text style={[styles.th, styles.flexRight]}>Net Change</Text>
              </View>

              {monthlyData.map((row, index) => {
                const net = (row.inflow || 0) - (row.outflow || 0);
                const isNetPositive = net >= 0;
                return (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.td, styles.flexLeft, styles.bold]}>{row.month}</Text>
                    <Text style={[styles.td, styles.colorGreen]}>₹{row.inflow?.toLocaleString('en-IN')}</Text>
                    <Text style={[styles.td, styles.colorRed]}>₹{row.outflow?.toLocaleString('en-IN')}</Text>
                    <Text style={[styles.td, styles.flexRight, isNetPositive ? styles.colorGreen : styles.colorRed]}>
                      {isNetPositive ? '+' : '-'}₹{Math.abs(net).toLocaleString('en-IN')}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyTable}>
              <Text style={styles.emptyText}>No monthly logs found.</Text>
            </View>
          )}
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
  statsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  borderGreen: {
    borderColor: 'rgba(46, 204, 113, 0.2)',
  },
  borderRed: {
    borderColor: 'rgba(231, 76, 60, 0.2)',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: '#a6bedf',
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statDesc: {
    color: '#8fc0ff',
    fontSize: 11,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 14,
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
    marginBottom: 20,
  },
  emptyChart: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyText: {
    color: '#a6bedf',
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
    backgroundColor: '#06111f',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barInflow: {
    width: '100%',
    backgroundColor: '#2ecc71',
    borderRadius: 4,
  },
  barOutflow: {
    width: '100%',
    backgroundColor: '#ff6b6b',
    borderRadius: 4,
  },
  chartLabel: {
    color: '#a6bedf',
    fontSize: 10,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#06111f',
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
    backgroundColor: '#2ecc71',
  },
  bgOutflow: {
    backgroundColor: '#ff6b6b',
  },
  legendText: {
    color: '#a6bedf',
    fontSize: 11,
    fontWeight: '500',
  },
  tableCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#15345f',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  th: {
    flex: 1,
    color: '#ffffff',
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
    borderBottomColor: '#06111f',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  td: {
    flex: 1,
    color: '#c3d6f3',
    fontSize: 12,
    textAlign: 'center',
  },
  bold: {
    fontWeight: '700',
    color: '#ffffff',
  },
  colorGreen: {
    color: '#2ecc71',
  },
  colorRed: {
    color: '#ff6b6b',
  },
  emptyTable: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 30,
    alignItems: 'center',
  },
  screenContainer: {
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
    color: '#ffffff',
    fontSize: 7,
    marginBottom: 4,
  },
  barInner: {
    width: 8,
    borderRadius: 4,
  },
  barLabel: {
    color: '#a6bedf',
    fontSize: 9,
    fontWeight: '600',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#06111f',
    paddingTop: 12,
  },
});
