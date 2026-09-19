import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import {
  ShieldAlert,
  PlusCircle,
  RefreshCw,
  TrendingDown,
} from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';
import { useTheme } from '../theme/themeSystem';
import { useTranslation } from '../theme/i18n';

const ShieldAlertIcon = ShieldAlert as any;
const PlusCircleIcon = PlusCircle as any;
const RefreshCwIcon = RefreshCw as any;
const TrendingDownIcon = TrendingDown as any;

type FixedAssetsScreenProps = {
  apiBaseUrl: string;
  authToken: string | null;
  activeWorkspaceId?: string;
  onRefreshData?: () => void;
};

const CATEGORIES = ['computers', 'vehicles', 'machinery', 'furniture', 'office', 'other'];

export function FixedAssetsScreen({
  apiBaseUrl,
  authToken,
  activeWorkspaceId = 'personal',
  onRefreshData,
}: FixedAssetsScreenProps) {
  const { theme, accentHex } = useTheme();
  const { t } = useTranslation();
  const [fixedAssets, setFixedAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [depreciating, setDepreciating] = useState(false);

  // Modal form states
  const [modalVisible, setModalVisible] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState('other');
  const [assetCost, setAssetCost] = useState('');
  const [assetDate, setAssetDate] = useState(new Date().toISOString().split('T')[0]);
  const [assetLife, setAssetLife] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const fetchFixedAssets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/fixed-assets');
      if (res.ok) {
        setFixedAssets(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFixedAssets();
  }, []);

  const handleCreateAsset = async () => {
    if (!assetName || !assetCost || !assetLife) {
      Alert.alert('Required Fields Missing', 'Please fill out asset name, purchase cost, and useful life years');
      return;
    }

    try {
      const res = await apiClient.post('/fixed-assets', {
        name: assetName,
        category: assetCategory,
        purchaseCost: Number(assetCost) || 0,
        purchaseDate: assetDate,
        usefulLifeYears: Number(assetLife) || 5,
        salvageValue: 0,
      });

      if (res.ok) {
        Alert.alert('Success', 'Corporate asset registered.');
        setModalVisible(false);
        setAssetName('');
        setAssetCost('');
        setAssetLife('');
        fetchFixedAssets();
        if (onRefreshData) onRefreshData();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to register asset');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDepreciateAssets = async () => {
    Alert.alert(
      'Run Depreciation Routine',
      'This will compute straight-line depreciation for all registered assets and post accumulated depreciation journal entries.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run Depreciation',
          onPress: async () => {
            setDepreciating(true);
            try {
              const res = await apiClient.post('/fixed-assets/depreciate', {});
              if (res.ok) {
                const data = await res.json();
                Alert.alert('Depreciation Complete', `Applied depreciation successfully to ${data.count} assets.`);
                fetchFixedAssets();
                if (onRefreshData) onRefreshData();
              }
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setDepreciating(false);
            }
          }
        }
      ]
    );
  };

  const totalCost = fixedAssets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  const totalValue = fixedAssets.reduce((sum, a) => sum + (a.currentValue || 0), 0);

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCell}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total Asset Cost</Text>
              <Text style={[styles.summaryVal, { color: theme.text }]}>₹{totalCost.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Current Value</Text>
              <Text style={[styles.summaryVal, { color: theme.text }]}>₹{totalValue.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('fixed_assets')}</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={fetchFixedAssets} style={styles.iconBtn}>
              <RefreshCwIcon color={theme.textMuted} size={16} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.depreciateBtn, { backgroundColor: '#e67e22' }, depreciating && styles.btnDisabled]} 
              onPress={handleDepreciateAssets}
              disabled={depreciating}
            >
              {depreciating ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <TrendingDownIcon color="#ffffff" size={14} style={{ marginRight: 6 }} />
                  <Text style={styles.depreciateBtnText}>Depreciate</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.addBtn, { backgroundColor: accentHex }]}>
              <PlusCircleIcon color="#ffffff" size={14} style={{ marginRight: 6 }} />
              <Text style={styles.addBtnText}>{t('add_contact')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={accentHex} size="large" style={{ marginTop: 24 }} />
        ) : fixedAssets.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <ShieldAlertIcon color={theme.textMuted} size={32} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No corporate assets registered</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Register vehicles, machinery, and electronics to calculate depreciation pools</Text>
          </View>
        ) : (
          <View style={styles.assetsList}>
            {fixedAssets.map(asset => {
              return (
                <View key={asset.id || asset._id} style={[styles.assetCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={[styles.assetHeader, { borderBottomColor: theme.cardBorder }]}>
                    <View>
                      <Text style={[styles.assetName, { color: theme.text }]}>{asset.name}</Text>
                      <Text style={[styles.assetMeta, { color: accentHex }]}>
                        Category: {asset.category.toUpperCase()} • Bought: {asset.purchaseDate}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.assetMetrics}>
                    <View style={styles.metricCell}>
                      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Original Cost</Text>
                      <Text style={[styles.metricVal, { color: theme.text }]}>₹{asset.purchaseCost.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.metricCell}>
                      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Current Value</Text>
                      <Text style={[styles.metricVal, { color: '#2ecc71' }]}>
                        ₹{asset.currentValue.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Asset Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Register Corporate Asset</Text>

            <TextInput
              style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.cardBorder, color: theme.text }]}
              placeholder="Asset Name (e.g. MacBook Pro M3)"
              placeholderTextColor={theme.textMuted}
              value={assetName}
              onChangeText={setAssetName}
            />

            <TouchableOpacity 
              style={[styles.selectorBtn, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <Text style={[styles.selectorBtnText, { color: theme.text }]}>Category: {assetCategory.toUpperCase()}</Text>
            </TouchableOpacity>

            {showCategoryDropdown && (
              <View style={[styles.selectorDropdown, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity 
                    key={cat} 
                    style={styles.dropdownOption}
                    onPress={() => {
                      setAssetCategory(cat);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownText, { color: theme.textSecondary }]}>{cat.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TextInput
              style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.cardBorder, color: theme.text }]}
              placeholder="Purchase Cost (₹)"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={assetCost}
              onChangeText={setAssetCost}
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.cardBorder, color: theme.text }]}
              placeholder="Useful Life (Years, e.g. 5)"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={assetLife}
              onChangeText={setAssetLife}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.btn, styles.btnCancel, { borderColor: theme.cardBorder }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btn, styles.btnConfirm, { backgroundColor: accentHex }]}
                onPress={handleCreateAsset}
              >
                <Text style={styles.btnConfirmText}>Register</Text>
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
    backgroundColor: '#06111f',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 16,
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
  },
  summaryCell: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#a6bedf',
    fontSize: 12,
    marginBottom: 4,
  },
  summaryVal: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#0b1d38',
    borderWidth: 1,
    borderColor: '#15345f',
  },
  depreciateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  depreciateBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f8cff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  emptyCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySub: {
    color: '#a6bedf',
    fontSize: 12,
    textAlign: 'center',
  },
  assetsList: {
    gap: 12,
  },
  assetCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 16,
  },
  assetHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#06111f',
    paddingBottom: 10,
    marginBottom: 12,
  },
  assetName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  assetMeta: {
    color: '#8fc0ff',
    fontSize: 10,
    marginTop: 2,
  },
  assetMetrics: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metricCell: {
    flex: 1,
  },
  metricLabel: {
    color: '#a6bedf',
    fontSize: 10,
    marginBottom: 4,
  },
  metricVal: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  assetLifeText: {
    color: '#8fc0ff',
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3,8,16,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#15345f',
    width: '100%',
    maxWidth: 360,
    padding: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#06111f',
    borderColor: '#15345f',
    borderWidth: 1,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 14,
    color: '#ffffff',
    marginBottom: 12,
    fontSize: 13,
  },
  selectorBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#06111f',
    borderColor: '#15345f',
    borderWidth: 1,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  selectorBtnText: {
    color: '#ffffff',
    fontSize: 13,
  },
  selectorDropdown: {
    backgroundColor: '#06111f',
    borderColor: '#15345f',
    borderWidth: 1,
    borderRadius: 12,
    padding: 6,
    marginBottom: 12,
    maxHeight: 150,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownText: {
    color: '#a6bedf',
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    borderWidth: 1,
    borderColor: '#15345f',
  },
  btnCancelText: {
    color: '#a6bedf',
    fontSize: 12,
    fontWeight: '600',
  },
  btnConfirm: {
    backgroundColor: '#4f8cff',
  },
  btnConfirmText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
