import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BarChart3, TrendingUp, TrendingDown, Percent, Calendar } from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';
import { useTheme } from '../theme/themeSystem';
import { AppCard, StatWidget, SectionHeader, EmptyStateWidget } from './uiComponents';

const BarChart3Icon = BarChart3 as any;
const TrendingUpIcon = TrendingUp as any;
const TrendingDownIcon = TrendingDown as any;
const PercentIcon = Percent as any;
const CalendarIcon = Calendar as any;

type Timeframe = 'today' | '7d' | '30d' | '3m' | '6m' | '1y';

type AnalyticsCenterScreenProps = {
  activeWorkspaceId: string;
};

export function AnalyticsCenterScreen({ activeWorkspaceId }: AnalyticsCenterScreenProps) {
  const { theme, accentHex } = useTheme();
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const endpoint = activeWorkspaceId === 'personal' ? '/analytics/personal' : '/analytics/business';
      const res = await apiClient.get(`${endpoint}?timeframe=${timeframe}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.warn('Failed to fetch analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [activeWorkspaceId, timeframe]);

  const timeframes: { key: Timeframe; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '3m', label: '3 Months' },
    { key: '6m', label: '6 Months' },
    { key: '1y', label: '1 Year' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Timeframe Filter Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeframeBar} contentContainerStyle={styles.timeframeContainer}>
        {timeframes.map((tf) => {
          const isActive = timeframe === tf.key;
          return (
            <TouchableOpacity
              key={tf.key}
              style={[
                styles.tfChip,
                { backgroundColor: isActive ? accentHex : theme.card, borderColor: isActive ? accentHex : theme.cardBorder },
              ]}
              onPress={() => setTimeframe(tf.key)}
            >
              <Text style={[styles.tfChipText, { color: isActive ? '#ffffff' : theme.textSecondary }]}>{tf.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading && !analytics ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={accentHex} size="large" />
          </View>
        ) : (
          <>
            {/* KPI Overview Grid */}
            <View style={styles.kpiGrid}>
              <StatWidget
                title="Total Revenue"
                value={`₹${(analytics?.totalIncome || 0).toLocaleString('en-IN')}`}
                icon={<TrendingUpIcon color="#10b981" size={18} />}
                trendType="up"
              />
              <StatWidget
                title="Total Expenses"
                value={`₹${(analytics?.totalExpense || 0).toLocaleString('en-IN')}`}
                icon={<TrendingDownIcon color="#ef4444" size={18} />}
                trendType="down"
              />
            </View>

            <View style={styles.kpiGrid}>
              <StatWidget
                title="Net Profit"
                value={`₹${(analytics?.netProfit || 0).toLocaleString('en-IN')}`}
                subtitle={`${analytics?.transactionCount || 0} transactions`}
                trendType={(analytics?.netProfit || 0) >= 0 ? 'up' : 'down'}
              />
              <StatWidget
                title="Net Profit Margin"
                value={`${analytics?.netMargin || 0}%`}
                icon={<PercentIcon color={accentHex} size={18} />}
                trendType={(analytics?.netMargin || 0) >= 0 ? 'up' : 'down'}
              />
            </View>

            {/* Category Breakdown Progress List */}
            <SectionHeader title="Category Breakdown" subtitle="Outflow distribution by category" />

            {(!analytics?.categoryBreakdown || analytics.categoryBreakdown.length === 0) ? (
              <EmptyStateWidget
                icon={<BarChart3Icon color={accentHex} size={24} />}
                title="No Data for Timeframe"
                description="Try selecting a wider timeframe filter or add transactions."
              />
            ) : (
              <AppCard style={styles.breakdownCard}>
                {analytics.categoryBreakdown.map((cat: any, idx: number) => {
                  const percent = analytics.totalExpense > 0 ? Math.round((cat.value / analytics.totalExpense) * 100) : 0;
                  return (
                    <View key={cat.name || idx} style={styles.catRow}>
                      <View style={styles.catMeta}>
                        <Text style={[styles.catName, { color: theme.text }]}>{cat.name}</Text>
                        <Text style={[styles.catVal, { color: theme.textSecondary }]}>₹{cat.value.toLocaleString('en-IN')} ({percent}%)</Text>
                      </View>
                      <View style={[styles.progressBg, { backgroundColor: theme.inputBg }]}>
                        <View style={[styles.progressFill, { width: `${Math.min(100, percent)}%`, backgroundColor: accentHex }]} />
                      </View>
                    </View>
                  );
                })}
              </AppCard>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  timeframeBar: { maxHeight: 50, borderBottomWidth: 1, borderBottomColor: '#ffffff10' },
  timeframeContainer: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  tfChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, borderWidth: 1 },
  tfChipText: { fontSize: 12, fontWeight: '800' },
  scrollContent: { padding: 16, gap: 14 },
  kpiGrid: { flexDirection: 'row', gap: 10 },
  breakdownCard: { padding: 16, gap: 14 },
  catRow: { gap: 6 },
  catMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catName: { fontSize: 13, fontWeight: '700' },
  catVal: { fontSize: 12, fontWeight: '600' },
  progressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  centerLoading: { padding: 40, alignItems: 'center' },
});
