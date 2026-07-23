import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Brain,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';

const TrendingUpIcon = TrendingUp as any;
const TrendingDownIcon = TrendingDown as any;
const BrainIcon = Brain as any;
const HelpCircleIcon = HelpCircle as any;
const AlertTriangleIcon = AlertTriangle as any;
const RefreshCwIcon = RefreshCw as any;

type AiForecastScreenProps = {
  apiBaseUrl: string;
  authToken: string | null;
  activeWorkspaceId?: string;
};

export function AiForecastScreen({
  apiBaseUrl,
  authToken,
  activeWorkspaceId = 'personal',
}: AiForecastScreenProps) {
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<any | null>(null);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/ai/forecast');
      if (res.ok) {
        setForecast(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch AI forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [activeWorkspaceId]);

  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View style={styles.aiBadge}>
            <BrainIcon color="#4f8cff" size={16} style={{ marginRight: 4 }} />
            <Text style={styles.aiBadgeText}>AI-Powered Financial intelligence</Text>
          </View>
          <TouchableOpacity onPress={fetchForecast} style={styles.refreshBtn}>
            <RefreshCwIcon color="#8fc0ff" size={16} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color="#4f8cff" size="large" />
            <Text style={styles.loadingText}>Running predictive algorithms...</Text>
          </View>
        ) : forecast ? (
          <>
            {/* Confidence Card */}
            <View style={styles.confidenceCard}>
              <View style={styles.confidenceHeader}>
                <Text style={styles.confidenceTitle}>Forecast Confidence</Text>
                <Text style={[styles.confidenceValue, { color: forecast.confidenceScore >= 75 ? '#2ecc71' : '#f39c12' }]}>
                  {forecast.confidenceScore}%
                </Text>
              </View>
              <Text style={styles.confidenceReason}>{forecast.confidenceReason}</Text>
            </View>

            {/* Projections */}
            <Text style={styles.sectionTitle}>3-Month Cash Flow Projections</Text>
            <View style={styles.forecastContainer}>
              {forecast.forecast?.map((item: any, idx: number) => {
                const isNetFlowPositive = item.estimatedNetFlow >= 0;
                return (
                  <View key={idx} style={styles.forecastRowCard}>
                    <View style={styles.monthHeader}>
                      <Text style={styles.monthName}>{item.month}</Text>
                      <View style={[styles.netBadge, isNetFlowPositive ? styles.netBadgePositive : styles.netBadgeNegative]}>
                        <Text style={[styles.netBadgeText, isNetFlowPositive ? styles.colorGreen : styles.colorRed]}>
                          {isNetFlowPositive ? '+' : ''}₹{item.estimatedNetFlow.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.forecastGrid}>
                      <View style={styles.forecastCell}>
                        <View style={styles.labelRow}>
                          <TrendingUpIcon color="#2ecc71" size={12} style={{ marginRight: 4 }} />
                          <Text style={styles.cellLabel}>Est. Income</Text>
                        </View>
                        <Text style={styles.cellVal}>₹{item.estimatedIncome.toLocaleString('en-IN')}</Text>
                      </View>

                      <View style={styles.forecastCell}>
                        <View style={styles.labelRow}>
                          <TrendingDownIcon color="#ff6b6b" size={12} style={{ marginRight: 4 }} />
                          <Text style={styles.cellLabel}>Est. Expenses</Text>
                        </View>
                        <Text style={styles.cellVal}>₹{item.estimatedExpenses.toLocaleString('en-IN')}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Analysis & Factors */}
            <Text style={styles.sectionTitle}>Key Trend Drivers</Text>
            <View style={styles.driversCard}>
              {forecast.factors?.map((factor: string, i: number) => (
                <View key={i} style={styles.factorRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.factorText}>{factor}</Text>
                </View>
              ))}
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimerBox}>
              <AlertTriangleIcon color="#f39c12" size={16} style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.disclaimerText}>{forecast.disclaimer}</Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No historical data available to generate predictions.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#06111f',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 140, 255, 0.1)',
    borderColor: '#4f8cff',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  aiBadgeText: {
    color: '#4f8cff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#0b1d38',
  },
  centerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    color: '#8fc0ff',
    fontSize: 12,
    marginTop: 12,
  },
  confidenceCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 16,
    marginBottom: 24,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  confidenceTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  confidenceValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  confidenceReason: {
    color: '#a6bedf',
    fontSize: 11,
    lineHeight: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  forecastContainer: {
    gap: 12,
    marginBottom: 24,
  },
  forecastRowCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#06111f',
    paddingBottom: 10,
    marginBottom: 12,
  },
  monthName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  netBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  netBadgePositive: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
  },
  netBadgeNegative: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  netBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  forecastGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  forecastCell: {
    flex: 1,
    backgroundColor: '#06111f',
    borderRadius: 12,
    padding: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cellLabel: {
    color: '#a6bedf',
    fontSize: 10,
  },
  cellVal: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  driversCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 16,
    gap: 10,
    marginBottom: 24,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#4f8cff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 6,
    marginTop: -2,
  },
  factorText: {
    color: '#ffffff',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(243, 156, 18, 0.05)',
    borderColor: 'rgba(243, 156, 18, 0.2)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  disclaimerText: {
    color: '#f39c12',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#a6bedf',
    fontSize: 13,
    textAlign: 'center',
  },
  colorGreen: {
    color: '#2ecc71',
  },
  colorRed: {
    color: '#ff6b6b',
  },
});
