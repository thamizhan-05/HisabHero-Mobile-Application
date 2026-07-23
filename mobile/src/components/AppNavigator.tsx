import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Activity,
  ArrowUpDown,
  PieChart,
  Sparkles,
  Upload,
  LogOut,
  Settings,
  FileText,
  ChevronLeft,
  Package,
  TrendingDown,
} from 'lucide-react-native';

// Import child screens
import { DashboardScreen } from './DashboardScreen';
import { CashFlowScreen } from './CashFlowScreen';
import { ExpensesScreen } from './ExpensesScreen';
import { AiChatScreen } from './AiChatScreen';
import { UploadScreen } from './UploadScreen';
import { InvoicesBillsScreen } from './InvoicesBillsScreen';
import { InventoryScreen } from './InventoryScreen';
import { FixedAssetsScreen } from './FixedAssetsScreen';
import { SettingsModal } from './SettingsModal';
import { WorkspaceModal } from './WorkspaceModal';
import { apiClient } from '../lib/apiClient';

const ActivityIcon = Activity as any;
const ArrowUpDownIcon = ArrowUpDown as any;
const PieChartIcon = PieChart as any;
const SparklesIcon = Sparkles as any;
const UploadIcon = Upload as any;
const LogOutIcon = LogOut as any;
const SettingsIcon = Settings as any;
const FileTextIcon = FileText as any;
const ChevronLeftIcon = ChevronLeft as any;
const PackageIcon = Package as any;
const TrendingDownIcon = TrendingDown as any;

type AppNavigatorProps = {
  authToken: string | null;
  user: any;
  apiBaseUrl: string;
  onLogout: () => void;
  onUpdateApiUrl: (newUrl: string) => void;
};

type TabType = 'dashboard' | 'cashflow' | 'expenses' | 'invoicing' | 'aichat' | 'upload';

export function AppNavigator({
  authToken,
  user,
  apiBaseUrl,
  onLogout,
  onUpdateApiUrl,
}: AppNavigatorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('personal');
  const [activeWorkspaceName, setActiveWorkspaceName] = useState('Personal Finance');
  const [activeWorkspaceRole, setActiveWorkspaceRole] = useState('owner');
  const [workspaceModalVisible, setWorkspaceModalVisible] = useState(false);
  const [subTool, setSubTool] = useState<'upload' | 'inventory' | 'assets' | null>(null);

  // Financial data state
  const [stats, setStats] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cashflowData, setCashflowData] = useState<any>({});
  const [expensesData, setExpensesData] = useState<any>({});
  const [runway, setRunway] = useState<any[]>([]);
  const [runwayMonths, setRunwayMonths] = useState<number>(0);
  const [healthScore, setHealthScore] = useState<number>(0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      // Fetch all endpoints in parallel using central apiClient
      const [
        resStats,
        resTxs,
        resCf,
        resExp,
        resRunway,
        resAlerts,
        resHealth,
        resUploads,
      ] = await Promise.all([
        apiClient.get('/dashboard/stats'),
        apiClient.get('/dashboard/transactions'),
        apiClient.get('/dashboard/cashflow'),
        apiClient.get('/dashboard/expenses'),
        apiClient.get('/dashboard/runway'),
        apiClient.get('/dashboard/alerts'),
        apiClient.get('/dashboard/health'),
        apiClient.get('/uploads'),
      ]);

      const [
        dataStats,
        dataTxs,
        dataCf,
        dataExp,
        dataRunway,
        dataAlerts,
        dataHealth,
        dataUploads,
      ] = await Promise.all([
        resStats.ok ? resStats.json() : [],
        resTxs.ok ? resTxs.json() : [],
        resCf.ok ? resCf.json() : ({} as any),
        resExp.ok ? resExp.json() : ({} as any),
        resRunway.ok ? resRunway.json() : [],
        resAlerts.ok ? resAlerts.json() : [],
        resHealth.ok ? resHealth.json() : { score: 0 },
        resUploads.ok ? resUploads.json() : [],
      ]);

      setStats(dataStats);
      setTransactions(dataTxs);
      setCashflowData(dataCf);
      setExpensesData(dataExp);
      setRunway(dataRunway);
      setAlerts(dataAlerts);
      setHealthScore(dataHealth?.score || 0);
      setUploads(dataUploads);

      const runwayMonthsVal = dataCf?.monthlyData?.length ? Math.min(12, Math.max(0, dataCf.monthlyData.length)) : 0;
      setRunwayMonths(runwayMonthsVal);
    } catch (err) {
      console.error('Error fetching financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const bootstrapWorkspace = async () => {
    try {
      const storedId = await AsyncStorage.getItem('activeWorkspaceId') || 'personal';
      setActiveWorkspaceId(storedId);
      
      if (storedId === 'personal') {
        setActiveWorkspaceName('Personal Finance');
        setActiveWorkspaceRole('owner');
      } else {
        const res = await apiClient.get(`/businesses/${storedId}`);
        if (res.ok) {
          const data = await res.json();
          setActiveWorkspaceName(data.name || 'Business Workspace');
          setActiveWorkspaceRole(data.myRole || 'viewer');
        } else {
          // Reset to personal if workspace is deleted or inaccessible
          await AsyncStorage.setItem('activeWorkspaceId', 'personal');
          setActiveWorkspaceId('personal');
          setActiveWorkspaceName('Personal Finance');
          setActiveWorkspaceRole('owner');
        }
      }
    } catch (e) {
      console.error('Failed to bootstrap workspace:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      await bootstrapWorkspace();
      loadFinancialData();
    };
    init();
  }, [apiBaseUrl, authToken]);

  const handleSwitchWorkspace = (workspaceId: string, name: string, role: string) => {
    setActiveWorkspaceId(workspaceId);
    setActiveWorkspaceName(name);
    setActiveWorkspaceRole(role);
    loadFinancialData();
  };

  const handleLogoutPress = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of HisabHero?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: onLogout,
      },
    ]);
  };

  // Render current active tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardScreen
            stats={stats}
            transactions={transactions}
            runway={runway}
            runwayMonths={runwayMonths}
            healthScore={healthScore}
            alerts={alerts}
            apiBaseUrl={apiBaseUrl}
            authToken={authToken}
            loading={loading}
            onRefreshData={loadFinancialData}
            onOpenWorkspaceSwitcher={() => setWorkspaceModalVisible(true)}
            activeWorkspaceId={activeWorkspaceId}
            activeWorkspaceRole={activeWorkspaceRole}
          />
        );
      case 'cashflow':
        return (
          <CashFlowScreen
            cashflowData={cashflowData}
            loading={loading}
            apiBaseUrl={apiBaseUrl}
            authToken={authToken}
            activeWorkspaceId={activeWorkspaceId}
          />
        );
      case 'expenses':
        return (
          <ExpensesScreen 
            expensesData={expensesData} 
            loading={loading} 
            activeWorkspaceId={activeWorkspaceId}
            activeWorkspaceRole={activeWorkspaceRole}
            onRefreshData={loadFinancialData}
          />
        );
      case 'invoicing':
        return (
          <InvoicesBillsScreen
            activeWorkspaceId={activeWorkspaceId}
            activeWorkspaceRole={activeWorkspaceRole}
            loading={loading}
            onRefreshData={loadFinancialData}
          />
        );
      case 'aichat':
        return (
          <AiChatScreen
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
        );
      case 'upload':
        if (activeWorkspaceId === 'personal') {
          return (
            <UploadScreen
              uploads={uploads}
              apiBaseUrl={apiBaseUrl}
              authToken={authToken}
              loadingHistory={loading}
              onRefreshData={loadFinancialData}
              activeWorkspaceId={activeWorkspaceId}
              activeWorkspaceRole={activeWorkspaceRole}
            />
          );
        }

        if (subTool === 'upload') {
          return (
            <View style={{ flex: 1 }}>
              <TouchableOpacity style={styles.backToolsBtn} onPress={() => setSubTool(null)}>
                <ChevronLeftIcon color="#4f8cff" size={16} style={{ marginRight: 4 }} />
                <Text style={styles.backToolsText}>Back to Tools</Text>
              </TouchableOpacity>
              <UploadScreen
                uploads={uploads}
                apiBaseUrl={apiBaseUrl}
                authToken={authToken}
                loadingHistory={loading}
                onRefreshData={loadFinancialData}
                activeWorkspaceId={activeWorkspaceId}
                activeWorkspaceRole={activeWorkspaceRole}
              />
            </View>
          );
        }

        if (subTool === 'inventory') {
          return (
            <View style={{ flex: 1 }}>
              <TouchableOpacity style={styles.backToolsBtn} onPress={() => setSubTool(null)}>
                <ChevronLeftIcon color="#4f8cff" size={16} style={{ marginRight: 4 }} />
                <Text style={styles.backToolsText}>Back to Tools</Text>
              </TouchableOpacity>
              <InventoryScreen
                apiBaseUrl={apiBaseUrl}
                authToken={authToken}
                activeWorkspaceId={activeWorkspaceId}
                onRefreshData={loadFinancialData}
              />
            </View>
          );
        }

        if (subTool === 'assets') {
          return (
            <View style={{ flex: 1 }}>
              <TouchableOpacity style={styles.backToolsBtn} onPress={() => setSubTool(null)}>
                <ChevronLeftIcon color="#4f8cff" size={16} style={{ marginRight: 4 }} />
                <Text style={styles.backToolsText}>Back to Tools</Text>
              </TouchableOpacity>
              <FixedAssetsScreen
                apiBaseUrl={apiBaseUrl}
                authToken={authToken}
                activeWorkspaceId={activeWorkspaceId}
                onRefreshData={loadFinancialData}
              />
            </View>
          );
        }

        return (
          <ScrollView style={{ flex: 1, backgroundColor: '#06111f' }} contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.toolsTitle}>Business Operations Hub</Text>
            <Text style={styles.toolsSub}>Advanced administrative workflows for {activeWorkspaceName}</Text>

            <View style={styles.toolsGrid}>
              <TouchableOpacity style={styles.toolCard} onPress={() => setSubTool('upload')}>
                <UploadIcon color="#4f8cff" size={28} style={{ marginBottom: 12 }} />
                <Text style={styles.toolCardTitle}>Document Center</Text>
                <Text style={styles.toolCardDesc}>Import bank statements and scan receipts using Gemini AI OCR.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.toolCard} onPress={() => setSubTool('inventory')}>
                <PackageIcon color="#2ecc71" size={28} style={{ marginBottom: 12 }} />
                <Text style={styles.toolCardTitle}>Inventory & Orders</Text>
                <Text style={styles.toolCardDesc}>Monitor stock levels, reorder alerts, and log supplier purchase orders.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.toolCard} onPress={() => setSubTool('assets')}>
                <TrendingDownIcon color="#ff6b6b" size={28} style={{ marginBottom: 12 }} />
                <Text style={styles.toolCardTitle}>Capital Assets</Text>
                <Text style={styles.toolCardDesc}>Register machinery and electronics, and compute Straight-Line depreciation.</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b1d38" />

      {/* Main Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerTitleContainer} 
          onPress={() => setWorkspaceModalVisible(true)}
          activeOpacity={0.7}
        >
          <Image source={require('../../assets/logo.png')} style={styles.headerLogo} resizeMode="contain" />
          <View style={{ flexDirection: 'column' }}>
            <Text style={styles.userName}>{activeWorkspaceName} ▼</Text>
            <Text style={styles.companyName}>{activeWorkspaceId === 'personal' ? 'Personal workspace' : `Role: ${activeWorkspaceRole.toUpperCase()}`}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setSettingsVisible(true)}
          >
            <SettingsIcon color="#8fc0ff" size={20} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerBtn} onPress={handleLogoutPress}>
            <LogOutIcon color="#ff8f8f" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.content}>{renderContent()}</View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'dashboard' && styles.tabItemActive]}
          onPress={() => setActiveTab('dashboard')}
        >
          <ActivityIcon color={activeTab === 'dashboard' ? '#4f8cff' : '#8fc0ff'} size={22} />
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'cashflow' && styles.tabItemActive]}
          onPress={() => setActiveTab('cashflow')}
        >
          <ArrowUpDownIcon color={activeTab === 'cashflow' ? '#4f8cff' : '#8fc0ff'} size={22} />
          <Text style={[styles.tabLabel, activeTab === 'cashflow' && styles.tabLabelActive]}>
            Cash Flow
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'expenses' && styles.tabItemActive]}
          onPress={() => setActiveTab('expenses')}
        >
          <PieChartIcon color={activeTab === 'expenses' ? '#4f8cff' : '#8fc0ff'} size={22} />
          <Text style={[styles.tabLabel, activeTab === 'expenses' && styles.tabLabelActive]}>
            Expenses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'invoicing' && styles.tabItemActive]}
          onPress={() => setActiveTab('invoicing')}
        >
          <FileTextIcon color={activeTab === 'invoicing' ? '#4f8cff' : '#8fc0ff'} size={22} />
          <Text style={[styles.tabLabel, activeTab === 'invoicing' && styles.tabLabelActive]}>
            Invoices
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'aichat' && styles.tabItemActive]}
          onPress={() => setActiveTab('aichat')}
        >
          <SparklesIcon color={activeTab === 'aichat' ? '#4f8cff' : '#8fc0ff'} size={22} />
          <Text style={[styles.tabLabel, activeTab === 'aichat' && styles.tabLabelActive]}>
            AI Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'upload' && styles.tabItemActive]}
          onPress={() => {
            setActiveTab('upload');
            setSubTool(null);
          }}
        >
          <UploadIcon color={activeTab === 'upload' ? '#4f8cff' : '#8fc0ff'} size={22} />
          <Text style={[styles.tabLabel, activeTab === 'upload' && styles.tabLabelActive]}>
            {activeWorkspaceId === 'personal' ? 'Upload' : 'Tools'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Settings Modal */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        apiBaseUrl={apiBaseUrl}
        onSave={onUpdateApiUrl}
        activeWorkspaceId={activeWorkspaceId}
        activeWorkspaceRole={activeWorkspaceRole}
      />

      {/* Workspace Selector Modal */}
      <WorkspaceModal
        visible={workspaceModalVisible}
        onClose={() => setWorkspaceModalVisible(false)}
        activeWorkspaceId={activeWorkspaceId}
        onSwitchWorkspace={handleSwitchWorkspace}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06111f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#0b1d38',
    borderBottomWidth: 1,
    borderColor: '#15345f',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogo: {
    width: 34,
    height: 34,
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  companyName: {
    color: '#8fc0ff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#06111f',
    borderWidth: 1,
    borderColor: '#15345f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 68,
    backgroundColor: '#0b1d38',
    borderTopWidth: 1,
    borderColor: '#15345f',
    paddingBottom: Platform.OS === 'ios' ? 14 : 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    borderTopWidth: 2,
    borderTopColor: '#4f8cff',
    marginTop: -8,
    paddingTop: 6,
  },
  tabLabel: {
    color: '#8fc0ff',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#4f8cff',
    fontWeight: '700',
  },
  backToolsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b1d38',
    height: 40,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#15345f',
  },
  backToolsText: {
    color: '#4f8cff',
    fontSize: 12,
    fontWeight: '700',
  },
  toolsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  toolsSub: {
    color: '#8fc0ff',
    fontSize: 12,
    marginBottom: 20,
  },
  toolsGrid: {
    gap: 16,
  },
  toolCard: {
    backgroundColor: '#0b1d38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15345f',
    padding: 20,
  },
  toolCardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  toolCardDesc: {
    color: '#a6bedf',
    fontSize: 11,
    lineHeight: 16,
  },
});
