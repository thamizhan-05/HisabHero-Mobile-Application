import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Sparkles, TrendingUp, AlertTriangle, Package, DollarSign, ArrowRight } from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';
import { useTheme } from '../theme/themeSystem';
import { AppCard, BadgePill, EmptyStateWidget, SectionHeader } from './uiComponents';

const SparklesIcon = Sparkles as any;
const TrendingUpIcon = TrendingUp as any;
const AlertTriangleIcon = AlertTriangle as any;
const PackageIcon = Package as any;
const DollarSignIcon = DollarSign as any;
const ArrowRightIcon = ArrowRight as any;

import { runMonteCarloInsolvencyForecast } from '../services/predictiveEngine';
import { ShieldCheck, Cpu } from 'lucide-react-native';

const CpuIcon = Cpu as any;
const ShieldCheckIcon = ShieldCheck as any;

type HeroInsightsScreenProps = {
  activeWorkspaceId: string;
  onNavigateToScreen: (screen: string) => void;
};

export function HeroInsightsScreen({ activeWorkspaceId, onNavigateToScreen }: HeroInsightsScreenProps) {
  const { theme, accentHex } = useTheme();
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [monteCarloForecast, setMonteCarloForecast] = useState<any>(null);

  const fetchInsightsAndRunForecast = async () => {
    setLoading(true);
    try {
      const [insightsRes, txRes, invRes] = await Promise.all([
        apiClient.get('/insights'),
        apiClient.get('/transactions'),
        apiClient.get('/invoices').catch(() => ({ ok: false, json: async () => [] }))
      ]);

      if (insightsRes.ok) {
        const data = await insightsRes.json();
        setInsights(Array.isArray(data) ? data : []);
      }

      let txs: any[] = [];
      if (txRes.ok) {
        const txData = await txRes.json();
        txs = Array.isArray(txData) ? txData : (txData.transactions || []);
      }

      let invoices: any[] = [];
      if (invRes.ok) {
        const invData = await invRes.json();
        invoices = Array.isArray(invData) ? invData : [];
      }

      const totalInflow = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const totalOutflow = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const currentCashBalance = Math.max(0, totalInflow - totalOutflow);

      const pendingReceivables = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (Number(i.totalAmount || i.amount) || 0), 0);
      const pendingPayables = txs.filter(t => t.status === 'pending' && t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      if (txs.length > 0) {
        const forecast = runMonteCarloInsolvencyForecast(
          currentCashBalance,
          txs.slice(0, 30),
          pendingReceivables,
          pendingPayables,
          30
        );
        setMonteCarloForecast(forecast);
      } else {
        setMonteCarloForecast(null);
      }
    } catch (e) {
      console.warn('Failed to fetch hero insights:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsightsAndRunForecast();
  }, [activeWorkspaceId]);

  const getSeverityVariant = (severity: string) => {
    if (severity === 'critical') return 'error';
    if (severity === 'warning') return 'warning';
    return 'primary';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Header */}
        <View style={[styles.bannerCard, { backgroundColor: `${accentHex}15`, borderColor: `${accentHex}40` }]}>
          <View style={styles.bannerRow}>
            <SparklesIcon color={accentHex} size={28} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: theme.text }]}>HERO INSIGHTS</Text>
              <Text style={[styles.bannerSub, { color: theme.textSecondary }]}>
                Proactive intelligence calculated from actual financial transactions & database records.
              </Text>
            </View>
          </View>
        </View>

        {/* 🧠 PATENT MODULE 3: Edge Monte Carlo Cash Flow Insolvency Forecast */}
        {monteCarloForecast && (
          <AppCard style={{ marginBottom: 16 }} bordered glow={monteCarloForecast.riskCategory === 'CRITICAL'}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CpuIcon color={accentHex} size={18} />
                <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text }}>Monte Carlo Cash Flow Forecast (30 Days)</Text>
              </View>
              <BadgePill label={`${monteCarloForecast.insolvencyRiskPercent}% Insolvency Risk`} variant={monteCarloForecast.riskCategory === 'CRITICAL' ? 'error' : 'success'} />
            </View>
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 10, lineHeight: 18 }}>
              Edge AI ran 1,000 statistical Monte Carlo simulations analyzing velocity & pending invoice maturities.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, backgroundColor: theme.bg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.cardBorder }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: '700' }}>WORST-CASE 10TH PERCENTILE</Text>
                <Text style={{ fontSize: 15, fontWeight: '900', color: theme.text, marginTop: 2 }}>₹{monteCarloForecast.expectedMinBalance.toLocaleString('en-IN')}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: '700' }}>MEDIAN EXPECTED END BALANCE</Text>
                <Text style={{ fontSize: 15, fontWeight: '900', color: accentHex, marginTop: 2 }}>₹{monteCarloForecast.expectedMedianBalance.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </AppCard>
        )}

        <SectionHeader title="Proactive Business Recommendations" subtitle="Real-time automated analytics" />

        {loading && insights.length === 0 ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={accentHex} size="large" />
          </View>
        ) : insights.length === 0 ? (
          <EmptyStateWidget
            icon={<SparklesIcon color={accentHex} size={24} />}
            title="All Clear!"
            description="No critical warnings or anomalies detected. Your business financials are running smoothly."
          />
        ) : (
          insights.map((item, idx) => (
            <AppCard key={item.insightKey || idx} style={styles.insightCard} bordered glow={item.severity === 'critical'}>
              <View style={styles.cardHeader}>
                <BadgePill label={item.severity.toUpperCase()} variant={getSeverityVariant(item.severity)} />
                {item.supportingMetric && <Text style={[styles.metricText, { color: theme.text }]}>{item.supportingMetric}</Text>}
              </View>

              <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.explanation, { color: theme.textSecondary }]}>{item.explanation}</Text>

              {item.recommendedAction && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: accentHex }]}
                  onPress={() => item.targetScreen && onNavigateToScreen(item.targetScreen)}
                >
                  <Text style={styles.actionBtnText}>{item.recommendedAction}</Text>
                  <ArrowRightIcon color="#fff" size={14} />
                </TouchableOpacity>
              )}
            </AppCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  bannerCard: { padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 8 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  bannerSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  insightCard: { padding: 16, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricText: { fontSize: 14, fontWeight: '800' },
  title: { fontSize: 16, fontWeight: '800' },
  explanation: { fontSize: 13, lineHeight: 18 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginTop: 6 },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  centerLoading: { padding: 40, alignItems: 'center' },
});
