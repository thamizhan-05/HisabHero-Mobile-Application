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
  Bell,
  MessageSquare,
  CheckSquare,
  MoreHorizontal,
  Users,
  Shield,
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
import { ChartOfAccountsScreen } from './ChartOfAccountsScreen';
import { ProjectsScreen } from './ProjectsScreen';
import { PayrollScreen } from './PayrollScreen';
import { SettingsModal } from './SettingsModal';
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
const BellIcon = Bell as any;
const MessageSquareIcon = MessageSquare as any;
const CheckSquareIcon = CheckSquare as any;
const MoreHorizontalIcon = MoreHorizontal as any;
const UsersIcon = Users as any;
const ShieldIcon = Shield as any;

type AppNavigatorProps = {
  authToken: string | null;
  user: any;
  apiBaseUrl: string;
  onLogout: () => void;
  onUpdateApiUrl: (newUrl: string) => void;
};

// Personal tabs: simpler, individual finance focus
type PersonalTab = 'dashboard' | 'expenses' | 'cashflow' | 'aichat' | 'upload';

// Business tabs: collaborative, workspace-driven
type BusinessTab = 'dashboard' | 'expenses' | 'invoicing' | 'aichat' | 'more';

export function AppNavigator({
  authToken,
  user,
  apiBaseUrl,
  onLogout,
  onUpdateApiUrl,
}: AppNavigatorProps) {
  // Derive account type from user object
  const accountType = user?.accountType || 'personal';
  const isBusiness = accountType === 'business';
  const businessWorkspace = user?.businessWorkspace || null;

  const [activePersonalTab, setActivePersonalTab] = useState<PersonalTab>('dashboard');
  const [activeBusinessTab, setActiveBusinessTab] = useState<BusinessTab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [subTool, setSubTool] = useState<'upload' | 'inventory' | 'assets' | 'accounts' | 'projects' | 'payroll' | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Workspace context for business accounts
  const activeWorkspaceId = isBusiness && businessWorkspace ? businessWorkspace.id : 'personal';
  const activeWorkspaceRole = isBusiness && businessWorkspace ? businessWorkspace.role : 'owner';
  const activeWorkspaceName = isBusiness && businessWorkspace ? businessWorkspace.name : 'Personal Finance';

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
      const headers: Record<string, string> = {};
      if (isBusiness && activeWorkspaceId !== 'personal') {
        headers['X-Workspace-Id'] = activeWorkspaceId;
      }

      const [
        resStats, resTxs, resCf, resExp, resRunway, resAlerts, resHealth, resUploads,
      ] = await Promise.all([
        apiClient.get('/dashboard/stats', { headers }),
        apiClient.get('/dashboard/transactions', { headers }),
        apiClient.get('/dashboard/cashflow', { headers }),
        apiClient.get('/dashboard/expenses', { headers }),
        apiClient.get('/dashboard/runway', { headers }),
        apiClient.get('/dashboard/alerts', { headers }),
        apiClient.get('/dashboard/health', { headers }),
        apiClient.get('/uploads', { headers }),
      ]);

      const [dataStats, dataTxs, dataCf, dataExp, dataRunway, dataAlerts, dataHealth, dataUploads] = await Promise.all([
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

  const fetchUnreadCount = async () => {
    try {
      const res = await apiClient.get('/notifications/unread-count');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch (e) { /* silent */ }
  };

  useEffect(() => {
    loadFinancialData();
    fetchUnreadCount();
    // Refresh unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [apiBaseUrl, authToken]);

  const handleLogoutPress = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of HisabHero?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: onLogout },
    ]);
  };

  // ─── HEADER ─────────────────────────────────────────────────────────────────
  const renderHeader = () => {
    const headerTitle = isBusiness
      ? (businessWorkspace?.name || 'Business Workspace')
      : `Welcome, ${user?.fullName || 'User'}`;

    const headerSubtitle = isBusiness
      ? `${activeWorkspaceRole.charAt(0).toUpperCase() + activeWorkspaceRole.slice(1)} · ${(businessWorkspace?.employeesCount || 0) + (businessWorkspace?.ownersCount || 0)} members`
      : 'Personal Finance';

    return (
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Image source={require('../../assets/logo.png')} style={styles.headerLogo} resizeMode="contain" />
          <View style={{ flexDirection: 'column', flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>{headerTitle}</Text>
            <Text style={styles.companyName}>{headerSubtitle}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {/* Notification Bell */}
          <TouchableOpacity style={styles.headerBtn} onPress={() => { /* TODO: open notifications */ }}>
            <BellIcon color="#8fc0ff" size={20} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity style={styles.headerBtn} onPress={() => setSettingsVisible(true)}>
            <SettingsIcon color="#8fc0ff" size={20} />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity style={styles.headerBtn} onPress={handleLogoutPress}>
            <LogOutIcon color="#ff8f8f" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── PERSONAL CONTENT RENDERER ──────────────────────────────────────────────
  const renderPersonalContent = () => {
    switch (activePersonalTab) {
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
            onOpenWorkspaceSwitcher={() => {}}
            activeWorkspaceId="personal"
            activeWorkspaceRole="owner"
          />
        );
      case 'expenses':
        return (
          <ExpensesScreen
            expensesData={expensesData}
            loading={loading}
            activeWorkspaceId="personal"
            activeWorkspaceRole="owner"
            onRefreshData={loadFinancialData}
          />
        );
      case 'cashflow':
        return (
          <CashFlowScreen
            cashflowData={cashflowData}
            loading={loading}
            apiBaseUrl={apiBaseUrl}
            authToken={authToken}
            activeWorkspaceId="personal"
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
        return (
          <UploadScreen
            uploads={uploads}
            apiBaseUrl={apiBaseUrl}
            authToken={authToken}
            loadingHistory={loading}
            onRefreshData={loadFinancialData}
            activeWorkspaceId="personal"
            activeWorkspaceRole="owner"
          />
        );
    }
  };

  // ─── BUSINESS CONTENT RENDERER ──────────────────────────────────────────────
  const renderBusinessContent = () => {
    switch (activeBusinessTab) {
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
            onOpenWorkspaceSwitcher={() => {}}
            activeWorkspaceId={activeWorkspaceId}
            activeWorkspaceRole={activeWorkspaceRole}
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
      case 'more':
        // Sub-tools hub for business operations
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

        if (subTool === 'accounts') {
          return (
            <View style={{ flex: 1 }}>
              <TouchableOpacity style={styles.backToolsBtn} onPress={() => setSubTool(null)}>
                <ChevronLeftIcon color="#4f8cff" size={16} style={{ marginRight: 4 }} />
                <Text style={styles.backToolsText}>Back to Tools</Text>
              </TouchableOpacity>
              <ChartOfAccountsScreen />
            </View>
          );
        }

        if (subTool === 'projects') {
          return (
            <View style={{ flex: 1 }}>
              <TouchableOpacity style={styles.backToolsBtn} onPress={() => setSubTool(null)}>
                <ChevronLeftIcon color="#4f8cff" size={16} style={{ marginRight: 4 }} />
                <Text style={styles.backToolsText}>Back to Tools</Text>
              </TouchableOpacity>
              <ProjectsScreen />
            </View>
          );
        }

        if (subTool === 'payroll') {
          return (
            <View style={{ flex: 1 }}>
              <TouchableOpacity style={styles.backToolsBtn} onPress={() => setSubTool(null)}>
                <ChevronLeftIcon color="#4f8cff" size={16} style={{ marginRight: 4 }} />
                <Text style={styles.backToolsText}>Back to Tools</Text>
              </TouchableOpacity>
              <PayrollScreen />
            </View>
          );
        }

        // Default: show the tools grid
        return (
          <ScrollView style={{ flex: 1, backgroundColor: '#06111f' }} contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.toolsTitle}>Business Operations Hub</Text>
            <Text style={styles.toolsSub}>Advanced administrative workflows for {activeWorkspaceName}</Text>

            <View style={styles.toolsGrid}>
              <TouchableOpacity style={styles.toolCard} onPress={() => setSubTool('accounts')}>
                <FileTextIcon color="#4f8cff" size={28} style={{ marginBottom: 12 }} />
                <Text style={styles.toolCardTitle}>Chart of Accounts</Text>
                <Text style={styles.toolCardDesc}>Double-entry General Ledger, Trial Balance & Balance Sheet.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.toolCard} onPress={() => setSubTool('projects')}>
                <ActivityIcon color="#e67e22" size={28} style={{ marginBottom: 12 }} />
                <Text style={styles.toolCardTitle}>Project Accounting</Text>
                <Text style={styles.toolCardDesc}>Track project budgets, expenses, client revenue & variance.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.toolCard} onPress={() => setSubTool('payroll')}>
                <UsersIcon color="#9b59b6" size={28} style={{ marginBottom: 12 }} />
                <Text style={styles.toolCardTitle}>Payroll & Salaries</Text>
                <Text style={styles.toolCardDesc}>Manage employee directory, monthly salary runs & payslips.</Text>
              </TouchableOpacity>

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

  // ─── PERSONAL TAB BAR ────────────────────────────────────────────────────────
  const renderPersonalTabBar = () => (
    <View style={styles.tabBar}>
      {([
        { key: 'dashboard' as PersonalTab, icon: ActivityIcon, label: 'Dashboard' },
        { key: 'expenses' as PersonalTab, icon: PieChartIcon, label: 'Expenses' },
        { key: 'cashflow' as PersonalTab, icon: ArrowUpDownIcon, label: 'Cash Flow' },
        { key: 'aichat' as PersonalTab, icon: SparklesIcon, label: 'AI Chat' },
        { key: 'upload' as PersonalTab, icon: UploadIcon, label: 'Upload' },
      ]).map(tab => {
        const isActive = activePersonalTab === tab.key;
        const Icon = tab.icon;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => setActivePersonalTab(tab.key)}
          >
            <Icon color={isActive ? '#4f8cff' : '#8fc0ff'} size={22} />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ─── BUSINESS TAB BAR ────────────────────────────────────────────────────────
  const renderBusinessTabBar = () => (
    <View style={styles.tabBar}>
      {([
        { key: 'dashboard' as BusinessTab, icon: ActivityIcon, label: 'Dashboard' },
        { key: 'expenses' as BusinessTab, icon: PieChartIcon, label: 'Expenses' },
        { key: 'invoicing' as BusinessTab, icon: FileTextIcon, label: 'Invoices' },
        { key: 'aichat' as BusinessTab, icon: SparklesIcon, label: 'AI Chat' },
        { key: 'more' as BusinessTab, icon: MoreHorizontalIcon, label: 'More' },
      ]).map(tab => {
        const isActive = activeBusinessTab === tab.key;
        const Icon = tab.icon;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => {
              setActiveBusinessTab(tab.key);
              if (tab.key === 'more') setSubTool(null);
            }}
          >
            <Icon color={isActive ? '#4f8cff' : '#8fc0ff'} size={22} />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b1d38" />

      {/* Header — differs for Personal vs Business */}
      {renderHeader()}

      {/* Content Area — completely separate rendering */}
      <View style={styles.content}>
        {isBusiness ? renderBusinessContent() : renderPersonalContent()}
      </View>

      {/* Tab Bar — different tabs per account type */}
      {isBusiness ? renderBusinessTabBar() : renderPersonalTabBar()}

      {/* Settings Modal — role-aware */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        apiBaseUrl={apiBaseUrl}
        onSave={onUpdateApiUrl}
        activeWorkspaceId={activeWorkspaceId}
        activeWorkspaceRole={activeWorkspaceRole}
        currentUser={user}
        onLogout={onLogout}
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
    flex: 1,
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
    gap: 8,
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
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
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
