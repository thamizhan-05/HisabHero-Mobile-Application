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
  Package,
  FileText,
  PlusCircle,
  TrendingDown,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  Clipboard,
  CheckCircle,
} from 'lucide-react-native';
import { apiClient } from '../lib/apiClient';

const PackageIcon = Package as any;
const FileTextIcon = FileText as any;
const PlusCircleIcon = PlusCircle as any;
const TrendingDownIcon = TrendingDown as any;
const ChevronDownIcon = ChevronDown as any;
const RefreshCwIcon = RefreshCw as any;
const AlertTriangleIcon = AlertTriangle as any;
const ClipboardIcon = Clipboard as any;
const CheckCircleIcon = CheckCircle as any;

type InventoryScreenProps = {
  apiBaseUrl: string;
  authToken: string | null;
  activeWorkspaceId?: string;
  onRefreshData?: () => void;
};

export function InventoryScreen({
  apiBaseUrl,
  authToken,
  activeWorkspaceId = 'personal',
  onRefreshData,
}: InventoryScreenProps) {
  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'po'>('stock');
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingPOs, setLoadingPOs] = useState(false);

  // Modal states
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [poModalVisible, setPoModalVisible] = useState(false);
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);

  // New Item form states
  const [newItemName, setNewItemName] = useState('');
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('General');
  const [newItemPurchasePrice, setNewItemPurchasePrice] = useState('');
  const [newItemSellingPrice, setNewItemSellingPrice] = useState('');
  const [newItemStock, setNewItemStock] = useState('0');
  const [newItemReorder, setNewItemReorder] = useState('5');

  // Adjust stock states
  const [selectedAdjustItem, setSelectedAdjustItem] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Adjustment');

  // New PO form states
  const [poNumber, setPoNumber] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [poLines, setPoLines] = useState<any[]>([]);
  const [activePOItemDropdown, setActivePOItemDropdown] = useState<number | null>(null);

  // Receive PO states
  const [selectedReceivePO, setSelectedReceivePO] = useState<any | null>(null);
  const [receiveIncrements, setReceiveIncrements] = useState<Record<string, string>>({});

  const fetchInventory = async () => {
    setLoadingItems(true);
    try {
      const res = await apiClient.get('/inventory');
      if (res.ok) {
        const data = await res.json();
        setInventoryItems(data.items || []);
        setLowStockAlerts(data.lowStockAlerts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    setLoadingPOs(true);
    try {
      const res = await apiClient.get('/purchase-orders');
      if (res.ok) {
        setPurchaseOrders(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPOs(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await apiClient.get('/contacts');
      if (res.ok) {
        const allContacts = await res.json();
        setSuppliers(allContacts.filter((c: any) => c.type === 'supplier'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchPurchaseOrders();
    fetchSuppliers();
  }, [activeWorkspaceId]);

  const handleCreateItem = async () => {
    if (!newItemName || !newItemSku) {
      Alert.alert('Required fields', 'Name and SKU are required');
      return;
    }

    try {
      const res = await apiClient.post('/inventory', {
        name: newItemName,
        sku: newItemSku,
        category: newItemCategory,
        purchasePrice: Number(newItemPurchasePrice) || 0,
        sellingPrice: Number(newItemSellingPrice) || 0,
        stockQuantity: Number(newItemStock) || 0,
        reorderLevel: Number(newItemReorder) || 5,
      });

      if (res.ok) {
        Alert.alert('Success', 'Inventory item registered.');
        setItemModalVisible(false);
        fetchInventory();
        // Clear inputs
        setNewItemName('');
        setNewItemSku('');
        setNewItemCategory('General');
        setNewItemPurchasePrice('');
        setNewItemSellingPrice('');
        setNewItemStock('0');
        setNewItemReorder('5');
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to create item');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedAdjustItem || !adjustQty) return;
    const itemId = selectedAdjustItem.id || selectedAdjustItem._id;
    try {
      const res = await apiClient.patch(`/inventory/${itemId}/adjust`, {
        adjustmentQuantity: Number(adjustQty),
        reason: adjustReason,
      });

      if (res.ok) {
        Alert.alert('Success', 'Stock level adjusted.');
        setAdjustModalVisible(false);
        setAdjustQty('');
        setAdjustReason('Adjustment');
        fetchInventory();
        if (onRefreshData) onRefreshData();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleCreatePO = async () => {
    if (!poNumber || !selectedSupplier || poLines.length === 0) {
      Alert.alert('Incomplete Form', 'Please supply a PO number, Supplier, and at least one item');
      return;
    }

    const items = poLines.map(line => {
      if (!line.item) return null;
      return {
        inventoryItemId: line.item.id || line.item._id,
        name: line.item.name,
        quantity: Number(line.quantity) || 0,
        unitPrice: Number(line.unitPrice) || 0,
      };
    }).filter(Boolean);

    try {
      const res = await apiClient.post('/purchase-orders', {
        poNumber,
        supplierId: selectedSupplier.id || selectedSupplier._id,
        items,
        notes: '',
      });

      if (res.ok) {
        Alert.alert('Success', 'Purchase order created.');
        setPoModalVisible(false);
        fetchPurchaseOrders();
        // Reset states
        setPoNumber('');
        setSelectedSupplier(null);
        setPoLines([]);
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to create purchase order');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleReceivePOItems = async () => {
    if (!selectedReceivePO) return;
    const poId = selectedReceivePO.id || selectedReceivePO._id;

    // Convert increments string inputs to numeric key-value map
    const itemsReceived: Record<string, number> = {};
    Object.entries(receiveIncrements).forEach(([itemId, val]) => {
      const num = Number(val) || 0;
      if (num > 0) itemsReceived[itemId] = num;
    });

    try {
      const res = await apiClient.patch(`/purchase-orders/${poId}/receive`, {
        itemsReceived,
      });

      if (res.ok) {
        Alert.alert('Success', 'Delivery logged. Inventory updated.');
        setReceiveModalVisible(false);
        setReceiveIncrements({});
        fetchPurchaseOrders();
        fetchInventory();
        if (onRefreshData) onRefreshData();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const addPOLine = () => {
    setPoLines([...poLines, { item: null, quantity: '1', unitPrice: '0' }]);
  };

  const removePOLine = (index: number) => {
    setPoLines(poLines.filter((_, i) => i !== index));
  };

  const updatePOLine = (index: number, key: string, val: any) => {
    const updated = [...poLines];
    updated[index] = { ...updated[index], [key]: val };
    if (key === 'item' && val) {
      updated[index].unitPrice = (val.purchasePrice || 0).toString();
    }
    setPoLines(updated);
  };

  return (
    <View style={styles.screenContainer}>
      {/* Subtab selection header */}
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'stock' && styles.subTabActive]}
          onPress={() => setActiveSubTab('stock')}
        >
          <PackageIcon color={activeSubTab === 'stock' ? '#4f8cff' : '#8fc0ff'} size={18} style={{ marginRight: 6 }} />
          <Text style={[styles.subTabText, activeSubTab === 'stock' && styles.subTabTextActive]}>
            Stock Manager
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'po' && styles.subTabActive]}
          onPress={() => setActiveSubTab('po')}
        >
          <ClipboardIcon color={activeSubTab === 'po' ? '#4f8cff' : '#8fc0ff'} size={18} style={{ marginRight: 6 }} />
          <Text style={[styles.subTabText, activeSubTab === 'po' && styles.subTabTextActive]}>
            Purchase Orders
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content scrollable panel */}
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {activeSubTab === 'stock' ? (
          <>
            {/* Low stock alerts warning block */}
            {lowStockAlerts.length > 0 && (
              <View style={styles.alertsContainer}>
                {lowStockAlerts.map((alt, index) => (
                  <View key={index} style={styles.alertItem}>
                    <AlertTriangleIcon color="#f39c12" size={16} style={{ marginRight: 8, marginTop: 2 }} />
                    <Text style={styles.alertText}>{alt.message}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Inventory Products</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity onPress={fetchInventory} style={styles.iconBtn}>
                  <RefreshCwIcon color="#8fc0ff" size={16} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setItemModalVisible(true)} style={styles.addBtn}>
                  <PlusCircleIcon color="#ffffff" size={16} style={{ marginRight: 6 }} />
                  <Text style={styles.addBtnText}>New Product</Text>
                </TouchableOpacity>
              </View>
            </View>

            {loadingItems ? (
              <ActivityIndicator color="#4f8cff" size="large" style={{ marginTop: 24 }} />
            ) : inventoryItems.length === 0 ? (
              <View style={styles.emptyCard}>
                <PackageIcon color="#8fc0ff" size={32} style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>No products registered</Text>
                <Text style={styles.emptySub}>Register products to manage stock & pricing schedules</Text>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {inventoryItems.map(item => {
                  const isLowStock = item.stockQuantity <= item.reorderLevel;
                  return (
                    <View key={item.id || item._id} style={styles.itemCard}>
                      <View style={styles.itemHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemSku}>SKU: {item.sku} • Category: {item.category}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.adjustBtn}
                          onPress={() => {
                            setSelectedAdjustItem(item);
                            setAdjustModalVisible(true);
                          }}
                        >
                          <Text style={styles.adjustBtnText}>Adjust Stock</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.itemMetrics}>
                        <View style={styles.metricCell}>
                          <Text style={styles.metricLabel}>Stock level</Text>
                          <Text style={[styles.metricVal, isLowStock ? styles.colorRed : styles.colorGreen]}>
                            {item.stockQuantity} {isLowStock && '⚠️'}
                          </Text>
                        </View>
                        <View style={styles.metricCell}>
                          <Text style={styles.metricLabel}>Purchase Price</Text>
                          <Text style={styles.metricVal}>₹{item.purchasePrice.toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={styles.metricCell}>
                          <Text style={styles.metricLabel}>Selling Price</Text>
                          <Text style={styles.metricVal}>₹{item.sellingPrice.toLocaleString('en-IN')}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Purchase orders */}
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Supplier Purchase Orders</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity onPress={fetchPurchaseOrders} style={styles.iconBtn}>
                  <RefreshCwIcon color="#8fc0ff" size={16} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPoModalVisible(true)} style={styles.addBtn}>
                  <PlusCircleIcon color="#ffffff" size={16} style={{ marginRight: 6 }} />
                  <Text style={styles.addBtnText}>Create PO</Text>
                </TouchableOpacity>
              </View>
            </View>

            {loadingPOs ? (
              <ActivityIndicator color="#4f8cff" size="large" style={{ marginTop: 24 }} />
            ) : purchaseOrders.length === 0 ? (
              <View style={styles.emptyCard}>
                <ClipboardIcon color="#8fc0ff" size={32} style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>No purchase orders found</Text>
                <Text style={styles.emptySub}>Create orders to stock up your business inventory</Text>
              </View>
            ) : (
              <View style={styles.poList}>
                {purchaseOrders.map(po => {
                  const statusColors: Record<string, string> = {
                    draft: '#a6bedf',
                    sent: '#f39c12',
                    partially_received: '#3498db',
                    received: '#2ecc71',
                    cancelled: '#e74c3c'
                  };
                  return (
                    <View key={po.id || po._id} style={styles.poCard}>
                      <View style={styles.poHeader}>
                        <View>
                          <Text style={styles.poNumber}>{po.poNumber}</Text>
                          <Text style={styles.poDate}>Ordered: {po.orderDate}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColors[po.status] + '15', borderColor: statusColors[po.status] }]}>
                          <Text style={[styles.statusBadgeText, { color: statusColors[po.status] }]}>
                            {po.status.replace('_', ' ').toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.poItemsGrid}>
                        {po.items.map((line: any, lIdx: number) => (
                          <View key={lIdx} style={styles.poItemRow}>
                            <Text style={styles.poItemName} numberOfLines={1}>{line.name}</Text>
                            <Text style={styles.poItemQty}>
                              Qty: {line.receivedQuantity || 0}/{line.quantity}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <View style={styles.poFooter}>
                        <Text style={styles.poTotal}>Total: ₹{po.total.toLocaleString('en-IN')}</Text>
                        {po.status !== 'received' && po.status !== 'cancelled' && (
                          <TouchableOpacity
                            style={styles.receiveBtn}
                            onPress={() => {
                              setSelectedReceivePO(po);
                              const initialIncrements: Record<string, string> = {};
                              po.items.forEach((it: any) => {
                                initialIncrements[it.inventoryItemId] = '0';
                              });
                              setReceiveIncrements(initialIncrements);
                              setReceiveModalVisible(true);
                            }}
                          >
                            <Text style={styles.receiveBtnText}>Log Delivery</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal: New Product Register */}
      <Modal
        visible={itemModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setItemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Register New Product</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <TextInput style={styles.input} placeholder="Product Name" placeholderTextColor="#5f88b8" value={newItemName} onChangeText={setNewItemName} />
              <TextInput style={styles.input} placeholder="SKU Number (Unique)" placeholderTextColor="#5f88b8" value={newItemSku} onChangeText={setNewItemSku} />
              <TextInput style={styles.input} placeholder="Category" placeholderTextColor="#5f88b8" value={newItemCategory} onChangeText={setNewItemCategory} />
              <TextInput style={styles.input} placeholder="Purchase Price (Cost)" placeholderTextColor="#5f88b8" keyboardType="numeric" value={newItemPurchasePrice} onChangeText={setNewItemPurchasePrice} />
              <TextInput style={styles.input} placeholder="Selling Price (MSRP)" placeholderTextColor="#5f88b8" keyboardType="numeric" value={newItemSellingPrice} onChangeText={setNewItemSellingPrice} />
              <TextInput style={styles.input} placeholder="Starting Stock" placeholderTextColor="#5f88b8" keyboardType="numeric" value={newItemStock} onChangeText={setNewItemStock} />
              <TextInput style={styles.input} placeholder="Reorder Alert Threshold" placeholderTextColor="#5f88b8" keyboardType="numeric" value={newItemReorder} onChangeText={setNewItemReorder} />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setItemModalVisible(false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={handleCreateItem}>
                <Text style={styles.btnConfirmText}>Add Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Adjust Stock Levels */}
      <Modal
        visible={adjustModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAdjustModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adjust Stock Level</Text>
            <Text style={styles.modalSub}>{selectedAdjustItem?.name}</Text>
            <Text style={styles.modalSub}>Current Quantity: {selectedAdjustItem?.stockQuantity}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Quantity increment (+ to add, - to subtract)"
              placeholderTextColor="#5f88b8"
              keyboardType="numeric"
              value={adjustQty}
              onChangeText={setAdjustQty}
            />
            <TextInput
              style={styles.input}
              placeholder="Reason for adjustment"
              placeholderTextColor="#5f88b8"
              value={adjustReason}
              onChangeText={setAdjustReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setAdjustModalVisible(false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={handleAdjustStock}>
                <Text style={styles.btnConfirmText}>Adjust</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Create Purchase Order */}
      <Modal
        visible={poModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Purchase Order</Text>
            <ScrollView style={{ maxHeight: 350 }}>
              <TextInput style={styles.input} placeholder="PO Number (e.g. PO-1029)" placeholderTextColor="#5f88b8" value={poNumber} onChangeText={setPoNumber} />
              
              {/* Supplier selector */}
              <TouchableOpacity 
                style={styles.selectorBtn}
                onPress={() => setShowSupplierDropdown(!showSupplierDropdown)}
              >
                <Text style={styles.selectorBtnText}>{selectedSupplier ? selectedSupplier.name : 'Select Supplier...'}</Text>
                <ChevronDownIcon color="#8fc0ff" size={16} />
              </TouchableOpacity>
              
              {showSupplierDropdown && (
                <View style={styles.selectorDropdown}>
                  {suppliers.map(sup => (
                    <TouchableOpacity
                      key={sup.id || sup._id}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setSelectedSupplier(sup);
                        setShowSupplierDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownText}>{sup.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Purchase line items editor */}
              <Text style={styles.sectionHeaderLabel}>Order Items</Text>
              {poLines.map((line, idx) => (
                <View key={idx} style={styles.lineItemBox}>
                  <TouchableOpacity
                    style={styles.selectorBtn}
                    onPress={() => setActivePOItemDropdown(activePOItemDropdown === idx ? null : idx)}
                  >
                    <Text style={styles.selectorBtnText}>{line.item ? line.item.name : 'Select Product...'}</Text>
                    <ChevronDownIcon color="#8fc0ff" size={16} />
                  </TouchableOpacity>

                  {activePOItemDropdown === idx && (
                    <View style={styles.selectorDropdown}>
                      {inventoryItems.map(invIt => (
                        <TouchableOpacity
                          key={invIt.id || invIt._id}
                          style={styles.dropdownOption}
                          onPress={() => {
                            updatePOLine(idx, 'item', invIt);
                            setActivePOItemDropdown(null);
                          }}
                        >
                          <Text style={styles.dropdownText}>{invIt.name} ({invIt.sku})</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <View style={styles.lineGrid}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      placeholder="Qty"
                      placeholderTextColor="#5f88b8"
                      keyboardType="numeric"
                      value={line.quantity}
                      onChangeText={(t) => updatePOLine(idx, 'quantity', t)}
                    />
                    <TextInput
                      style={[styles.input, { flex: 2, marginBottom: 0 }]}
                      placeholder="Price"
                      placeholderTextColor="#5f88b8"
                      keyboardType="numeric"
                      value={line.unitPrice}
                      onChangeText={(t) => updatePOLine(idx, 'unitPrice', t)}
                    />
                    <TouchableOpacity style={styles.removeLineBtn} onPress={() => removePOLine(idx)}>
                      <Text style={styles.removeLineBtnText}>X</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addLineBtn} onPress={addPOLine}>
                <Text style={styles.addLineBtnText}>+ Add Order Item</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setPoModalVisible(false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={handleCreatePO}>
                <Text style={styles.btnConfirmText}>Create PO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Log PO Item Delivery */}
      <Modal
        visible={receiveModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReceiveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Received Delivery</Text>
            <Text style={styles.modalSub}>{selectedReceivePO?.poNumber}</Text>
            <ScrollView style={{ maxHeight: 300, marginBottom: 12 }}>
              {selectedReceivePO?.items.map((line: any) => {
                const maxAllowed = line.quantity - (line.receivedQuantity || 0);
                const currentIncrement = receiveIncrements[line.inventoryItemId] || '0';
                return (
                  <View key={line.inventoryItemId} style={styles.receiveItemRow}>
                    <Text style={styles.receiveItemName}>{line.name}</Text>
                    <Text style={styles.receiveItemRemaining}>
                      Remaining to receive: {maxAllowed} units
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Units received in this delivery"
                      placeholderTextColor="#5f88b8"
                      keyboardType="numeric"
                      value={currentIncrement}
                      onChangeText={(t) => setReceiveIncrements({ ...receiveIncrements, [line.inventoryItemId]: t })}
                    />
                  </View>
                );
              })}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setReceiveModalVisible(false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={handleReceivePOItems}>
                <Text style={styles.btnConfirmText}>Log Received</Text>
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
  alertsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(243,156,18,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(243,156,18,0.2)',
    borderRadius: 12,
    padding: 12,
  },
  alertText: {
    color: '#f39c12',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
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
    gap: 10,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#0b1d38',
    borderWidth: 1,
    borderColor: '#15345f',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f8cff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
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
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#06111f',
    paddingBottom: 10,
    marginBottom: 12,
  },
  itemName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  itemSku: {
    color: '#8fc0ff',
    fontSize: 10,
    marginTop: 2,
  },
  adjustBtn: {
    backgroundColor: 'rgba(79,140,255,0.1)',
    borderWidth: 1,
    borderColor: '#4f8cff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  adjustBtnText: {
    color: '#4f8cff',
    fontSize: 11,
    fontWeight: '700',
  },
  itemMetrics: {
    flexDirection: 'row',
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
  colorGreen: {
    color: '#2ecc71',
  },
  colorRed: {
    color: '#ff6b6b',
  },
  poList: {
    gap: 12,
  },
  poCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 16,
  },
  poHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#06111f',
    paddingBottom: 10,
    marginBottom: 12,
  },
  poNumber: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  poDate: {
    color: '#a6bedf',
    fontSize: 10,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  poItemsGrid: {
    gap: 8,
    marginBottom: 12,
  },
  poItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  poItemName: {
    color: '#ffffff',
    fontSize: 12,
    flex: 1,
    marginRight: 10,
  },
  poItemQty: {
    color: '#8fc0ff',
    fontSize: 11,
    fontWeight: '700',
  },
  poFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#06111f',
    paddingTop: 10,
  },
  poTotal: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  receiveBtn: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  receiveBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
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
  modalSub: {
    fontSize: 12,
    color: '#a6bedf',
    marginBottom: 6,
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
  sectionHeaderLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  lineItemBox: {
    backgroundColor: '#06111f',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },
  lineGrid: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  removeLineBtn: {
    backgroundColor: 'rgba(231,76,96,0.1)',
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeLineBtnText: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  addLineBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4f8cff',
    borderRadius: 12,
    height: 40,
    marginTop: 6,
    marginBottom: 16,
  },
  addLineBtnText: {
    color: '#4f8cff',
    fontSize: 12,
    fontWeight: '700',
  },
  receiveItemRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#06111f',
    paddingVertical: 10,
  },
  receiveItemName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  receiveItemRemaining: {
    color: '#8fc0ff',
    fontSize: 10,
    marginBottom: 8,
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
