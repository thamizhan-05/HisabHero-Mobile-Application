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
  }, [activeWorkspaceId]);

  const handleRegisterAsset = async () => {
    if (!assetName || !assetCost || !assetLife || !assetDate) {
      Alert.alert('Required Fields', 'Please complete all required fields.');
      return;
    }

    try {
      const res = await apiClient.post('/fixed-assets', {
        name: assetName,
        category: assetCategory,
        purchaseCost: Number(assetCost),
        purchaseDate: assetDate,
        usefulLife: Number(assetLife),
      });

      if (res.ok) {
        Alert.alert('Success', 'Capital asset registered.');
        setModalVisible(false);
        fetchFixedAssets();
        // Clear input values
        setAssetName('');
        setAssetCategory('other');
        setAssetCost('');
        setAssetLife('');
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to register asset');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDepreciateAssets = async () => {
    if (fixedAssets.length === 0) {
      Alert.alert('No Assets', 'Register assets first to perform depreciation.');
      return;
    }

    Alert.alert(
      'Depreciate Assets',
      'This will calculate and log the straight-line annual depreciation for all registered fixed assets. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Depreciate',
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
    <View style={styles.screenContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Total Asset Cost</Text>
              <Text style={styles.summaryVal}>₹{totalCost.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Current Value</Text>
              <Text style={styles.summaryVal}>₹{totalValue.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Asset Registry</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={fetchFixedAssets} style={styles.iconBtn}>
              <RefreshCwIcon color="#8fc0ff" size={16} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.depreciateBtn, depreciating && styles.btnDisabled]} 
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
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
              <PlusCircleIcon color="#ffffff" size={14} style={{ marginRight: 6 }} />
              <Text style={styles.addBtnText}>Add Asset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color="#4f8cff" size="large" style={{ marginTop: 24 }} />
        ) : fixedAssets.length === 0 ? (
          <View style={styles.emptyCard}>
            <ShieldAlertIcon color="#8fc0ff" size={32} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No corporate assets registered</Text>
            <Text style={styles.emptySub}>Register vehicles, machinery, and electronics to calculate depreciation pools</Text>
          </View>
        ) : (
          <View style={styles.assetsList}>
            {fixedAssets.map(asset => {
              const depPercentage = asset.purchaseCost > 0 
                ? Math.round(((asset.accumulatedDepreciation || 0) / asset.purchaseCost) * 100)
                : 0;
              return (
                <View key={asset.id || asset._id} style={styles.assetCard}>
                  <View style={styles.assetHeader}>
                    <View>
                      <Text style={styles.assetName}>{asset.name}</Text>
                      <Text style={styles.assetMeta}>
                        Category: {asset.category.toUpperCase()} • Bought: {asset.purchaseDate}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.assetMetrics}>
                    <View style={styles.metricCell}>
                      <Text style={styles.metricLabel}>Original Cost</Text>
                      <Text style={styles.metricVal}>₹{asset.purchaseCost.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.metricCell}>
                      <Text style={styles.metricLabel}>Current Value</Text>
                      <Text style={[styles.metricVal, { color: '#2ecc71' }]}>
                        ₹{asset.currentValue.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.metricCell}>
                      <Text style={styles.metricLabel}>Depreciated</Text>
                      <Text style={[styles.metricVal, { color: '#ff6b6b' }]}>
                        {depPercentage}%
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.assetLifeText}>Useful Life: {asset.usefulLife} Years</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal: Add Fixed Asset */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Register Corporate Asset</Text>
            <ScrollView style={{ maxHeight: 350 }}>
              <TextInput style={styles.input} placeholder="Asset Name (e.g. Server Rack)" placeholderTextColor="#5f88b8" value={assetName} onChangeText={setAssetName} />
              
              {/* Category selector */}
              <TouchableOpacity 
                style={styles.selectorBtn}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <Text style={styles.selectorBtnText}>Category: {assetCategory.toUpperCase()}</Text>
                <RefreshCwIcon color="#8fc0ff" size={12} />
              </TouchableOpacity>

              {showCategoryDropdown && (
                <View style={styles.selectorDropdown}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setAssetCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownText}>{cat.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TextInput style={styles.input} placeholder="Purchase Cost (INR)" placeholderTextColor="#5f88b8" keyboardType="numeric" value={assetCost} onChangeText={setAssetCost} />
              <TextInput style={styles.input} placeholder="Useful Life (Years)" placeholderTextColor="#5f88b8" keyboardType="numeric" value={assetLife} onChangeText={setAssetLife} />
              <TextInput style={styles.input} placeholder="Purchase Date (YYYY-MM-DD)" placeholderTextColor="#5f88b8" value={assetDate} onChangeText={setAssetDate} />
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={handleRegisterAsset}>
                <Text style={styles.btnConfirmText}>Add Asset</Text>
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
