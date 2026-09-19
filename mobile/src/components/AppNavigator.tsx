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
  useWindowDimensions,
  AppState,
  AppStateStatus,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  ChevronDown,
  Briefcase,
  Lock,
  Fingerprint,
  Search,
  Eye,
  EyeOff,
} from 'lucide-react-native';

const SearchIcon = Search as any;
const EyeIcon = Eye as any;
const EyeOffIcon = EyeOff as any;

import { authenticateWithBiometrics } from '../services/biometricAuthService';

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
import { WorkspaceModal } from './WorkspaceModal';
import { SyncStatusBar } from './SyncStatusBar';
import { BusinessCalendarScreen } from './BusinessCalendarScreen';
import { HeroInsightsScreen } from './HeroInsightsScreen';
import { AnalyticsCenterScreen } from './AnalyticsCenterScreen';
import { PersonalGoalsScreen } from './PersonalGoalsScreen';
import { AuditLogsScreen } from './AuditLogsScreen';
import { PermissionsMatrixModal } from './PermissionsMatrixModal';
import { KhataLedgerScreen } from './KhataLedgerScreen';
import { SubscriptionsScreen } from './SubscriptionsScreen';
import { ExecutiveReportsScreen } from './ExecutiveReportsScreen';
import { MerkleLedgerScreen } from './MerkleLedgerScreen';
import { TeamManagementScreen } from './TeamManagementScreen';
import { FeatureTourModal } from './FeatureTourModal';
import { apiClient } from '../lib/apiClient';
import { useTheme } from '../theme/themeSystem';
import { useTranslation } from '../theme/i18n';

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
const ChevronDownIcon = ChevronDown as any;
const BriefcaseHeaderIcon = Briefcase as any;

type AppNavigatorProps = {
  authToken: string | null;
  user: any;
  apiBaseUrl: string;
  onLogout: () => void;
  onUpdateApiUrl: (newUrl: string) => void;
};

type PersonalTab = 'dashboard' | 'expenses' | 'cashflow' | 'aichat' | 'upload';
type BusinessTab = 'dashboard' | 'expenses' | 'invoicing' | 'aichat' | 'more';
type SubTool = 'inventory' | 'payroll' | 'accounts' | 'projects' | 'assets' | 'calendar' | 'insights' | 'analytics' | 'goals' | 'auditlogs' | 'khata' | 'subscriptions' | 'reports' | 'merkle' | 'team' | null;

import { DesktopHeaderBar } from './uiComponents';

export function AppNavigator({
  authToken,
  user,
  apiBaseUrl,
  onLogout,
  onUpdateApiUrl,
}: AppNavigatorProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [activePersonalTab, setActivePersonalTab] = useState<PersonalTab>('dashboard');
  const [activeBusinessTab, setActiveBusinessTab] = useState<BusinessTab>('dashboard');
  const [subTool, setSubTool] = useState<SubTool>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('personal');

  const [activeWorkspaceName, setActiveWorkspaceName] = useState<string>('My Personal Finance');
  const [activeWorkspaceRole, setActiveWorkspaceRole] = useState<string>('owner');

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [workspaceModalVisible, setWorkspaceModalVisible] = useState(false);
  const [permissionsModalVisible, setPermissionsModalVisible] = useState(false);
  const [tourVisible, setTourVisible] = useState(false);

  useEffect(() => {
    async function checkFeatureTour() {
      try {
        const forceTour = await AsyncStorage.getItem('showFeatureTourOnLaunch');
        const hasSeen = await AsyncStorage.getItem('hasSeenAppTour_v1');
        if (forceTour === 'true' || !hasSeen) {
          setTourVisible(true);
        }
      } catch (e) {}
    }
    checkFeatureTour();
  }, []);

  const [stats, setStats] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [runway, setRunway] = useState<any[]>([]);
  const [runwayMonths, setRunwayMonths] = useState<number>(0);
  const [healthScore, setHealthScore] = useState<number>(0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isPrivacyLocked, setIsPrivacyLocked] = useState(false);
  const [isStealthMode, setIsStealthMode] = useState(false);
  const [spotlightVisible, setSpotlightVisible] = useState(false);
  const [mobileSpotlightQuery, setMobileSpotlightQuery] = useState('');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'inactive' || nextAppState === 'background') {
        setIsPrivacyLocked(true);
      }
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const handleUnlockPrivacy = async () => {
    const res = await authenticateWithBiometrics('Unlock HisabHero Financial Workspace');
    if (res.success) {
      setIsPrivacyLocked(false);
    } else {
      Alert.alert('Authentication Failed', res.error || 'Biometric verification required to access records.');
    }
  };

  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 12 : 0);
  const bottomInset = insets.bottom;

  const { theme, setAccentId, dynamicAiTheme, accentHex } = useTheme();
  const { t } = useTranslation();

  const isBusinessView = activeWorkspaceId !== 'personal';

  useEffect(() => {
    const initWorkspace = async () => {
      try {
        const storedId = await AsyncStorage.getItem('activeWorkspaceId');
        const res = await apiClient.get('/workspaces');
        if (res.ok) {
          const data = await res.json();
          const list: any[] = data.workspaces || (Array.isArray(data) ? data : []);
          if (list.length > 0) {
            const matching = list.find((w: any) => (w.id === storedId || w._id === storedId || w.workspaceId === storedId));
            const selected = matching || list.find((w: any) => w.isDefault) || list[0];
            const targetId = selected.id || selected._id || 'personal';
            const targetName = selected.name || selected.workspaceName || 'Personal Finance';
            const targetRole = selected.role || 'owner';

            setActiveWorkspaceId(targetId);
            setActiveWorkspaceName(targetName);
            setActiveWorkspaceRole(targetRole);
            await AsyncStorage.setItem('activeWorkspaceId', targetId);
            return;
          }
        }

        if (storedId) {
          setActiveWorkspaceId(storedId);
        }
      } catch (e) {
        console.error('Failed to initialize active workspace:', e);
      }
    };
    initWorkspace();
  }, [authToken]);

  const handleSwitchWorkspace = async (workspaceId: string, name: string, role: string) => {
    setActiveWorkspaceId(workspaceId);
    setActiveWorkspaceName(name);
    setActiveWorkspaceRole(role);
    setSubTool(null);
    try {
      await AsyncStorage.setItem('activeWorkspaceId', workspaceId);
    } catch (e) {
      console.warn('Failed to save active workspace to storage:', e);
    }
    if (workspaceId === 'personal' || name.toLowerCase().includes('personal')) {
      setActivePersonalTab('dashboard');
    } else {
      setActiveBusinessTab('dashboard');
    }
  };

  const loadFinancialData = async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const [resStats, resTxs, resRunway, resExpenses, resAlerts, resUploads, resHealth] = await Promise.all([
        apiClient.get('/dashboard/stats'),
        apiClient.get('/dashboard/transactions'),
        apiClient.get('/dashboard/runway'),
        apiClient.get('/dashboard/expenses'),
        apiClient.get('/dashboard/alerts'),
        apiClient.get('/uploads'),
        apiClient.get('/dashboard/health'),
      ]);

      const dataStats = resStats.ok ? await resStats.json() : null;
      const dataTxs = resTxs.ok ? await resTxs.json() : [];
      const dataRunway = resRunway.ok ? await resRunway.json() : [];
      const dataExpenses = resExpenses.ok ? await resExpenses.json() : [];
      const dataAlerts = resAlerts.ok ? await resAlerts.json() : [];
      const dataUploads = resUploads.ok ? await resUploads.json() : [];
      const dataHealth = resHealth.ok ? await resHealth.json() : null;

      setStats(Array.isArray(dataStats) ? dataStats : []);
      setTransactions(Array.isArray(dataTxs) ? dataTxs : []);
      setExpensesData(Array.isArray(dataExpenses) ? dataExpenses : []);
      setRunway(Array.isArray(dataRunway) ? dataRunway : []);
      const fetchedRunwayMonths = (Array.isArray(dataTxs) && dataTxs.length > 0) ? ((dataHealth as any)?.runwayMonths || dataRunway.length || 0) : 0;
      setRunwayMonths(fetchedRunwayMonths);
      const calculatedHealthScore = (Array.isArray(dataTxs) && dataTxs.length > 0 && typeof (dataHealth as any)?.score === 'number') ? (dataHealth as any).score : 0;
      setHealthScore(calculatedHealthScore);
      setAlerts(Array.isArray(dataAlerts) ? dataAlerts : []);
      setUploads(Array.isArray(dataUploads) ? dataUploads : []);

      if (dynamicAiTheme) {
        if (fetchedRunwayMonths >= 6) setAccentId('emerald');
        else if (fetchedRunwayMonths >= 3) setAccentId('blue');
        else if (fetchedRunwayMonths >= 1) setAccentId('orange');
        else setAccentId('red');
      }
    } catch (err) {
      console.warn('Failed to load financial data:', err);
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
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [apiBaseUrl, authToken, activeWorkspaceId]);

  const handleLogoutPress = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of HisabHero?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: onLogout },
    ]);
  };

  // ─── HEADER (MOBILE) ────────────────────────────────────────────────────────
  const renderHeader = () => {
    const isPersonal = activeWorkspaceId === 'personal' || activeWorkspaceName.toLowerCase().includes('personal');
    const headerTitle = activeWorkspaceName || (isPersonal ? 'Personal Finance' : 'Business Workspace');
    const headerSubtitle = isPersonal
      ? 'Personal Finance'
      : `Business Workspace • ${activeWorkspaceRole.toUpperCase()}`;

    return (
      <View style={[styles.header, { backgroundColor: theme.card, borderColor: theme.cardBorder, paddingTop: topInset + 4, paddingBottom: 10 }]}>
        <TouchableOpacity
          style={styles.headerTitleContainer}
          onPress={() => setWorkspaceModalVisible(true)}
          activeOpacity={0.7}
        >
          <Image source={require('../../assets/logo_transparent.png')} style={styles.headerLogo} resizeMode="contain" />
          <View style={{ flexDirection: 'column', flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>{headerTitle}</Text>
              <ChevronDownIcon color={accentHex} size={16} />
            </View>
            <Text style={[styles.companyName, { color: theme.textSecondary }]}>{headerSubtitle}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setIsStealthMode(!isStealthMode)}>
            {isStealthMode ? <EyeOffIcon color="#f59e0b" size={18} /> : <EyeIcon color={accentHex} size={18} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setSpotlightVisible(true)}>
            <SearchIcon color={accentHex} size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setWorkspaceModalVisible(true)}>
            <BriefcaseHeaderIcon color={accentHex} size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setSettingsVisible(true)}>
            <SettingsIcon color={accentHex} size={18} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── DESKTOP SIDEBAR ───────────────────────────────────────────────────────
  const renderDesktopSidebar = () => {
    const isPersonal = activeWorkspaceId === 'personal';

    const navItems = isBusinessView
      ? [
          { key: 'dashboard', label: t('dashboard') || 'Dashboard', icon: ActivityIcon },
          { key: 'expenses', label: t('expenses') || 'Expenses', icon: PieChartIcon },
          { key: 'invoicing', label: t('invoices') || 'Invoices & Bills', icon: FileTextIcon },
          { key: 'aichat', label: t('ai_chat') || 'AI Chat', icon: SparklesIcon },
          { key: 'more', label: t('more') || 'More ERP Tools', icon: MoreHorizontalIcon },
        ]
      : [
          { key: 'dashboard', label: t('dashboard') || 'Dashboard', icon: ActivityIcon },
          { key: 'expenses', label: t('expenses') || 'Expenses', icon: PieChartIcon },
          { key: 'cashflow', label: t('cashflow') || 'Cash Flow', icon: ArrowUpDownIcon },
          { key: 'aichat', label: t('ai_chat') || 'AI Chat', icon: SparklesIcon },
          { key: 'upload', label: t('document_centre') || 'Documents', icon: UploadIcon },
        ];


    const activeNavKey = isBusinessView ? (subTool || activeBusinessTab) : activePersonalTab;

    return (
      <View style={[styles.desktopSidebar, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <TouchableOpacity style={styles.brandHeader} onPress={() => setWorkspaceModalVisible(true)}>
          <Image source={require('../../assets/logo.png')} style={{ width: 36, height: 36, borderRadius: 8, marginRight: 10 }} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.brandTitle, { color: theme.text }]}>HISABHERO</Text>
            <Text style={[styles.brandSub, { color: theme.textSecondary }]}>v4.0.0 Unified System</Text>
          </View>
        </TouchableOpacity>


        <TouchableOpacity style={[styles.sidebarWsCard, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]} onPress={() => setWorkspaceModalVisible(true)}>
          <BriefcaseHeaderIcon color={accentHex} size={18} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.sidebarWsName, { color: theme.text }]} numberOfLines={1}>
              {isPersonal ? `${user?.fullName || 'Personal'}'s Workspace` : activeWorkspaceName}
            </Text>
            <Text style={[styles.sidebarWsRole, { color: theme.textSecondary }]}>
              {isPersonal ? 'Default Personal Account' : `Role: ${activeWorkspaceRole.toUpperCase()}`}
            </Text>
          </View>
          <ChevronDownIcon color={theme.textSecondary} size={16} />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginTop: 12 }}>
          <Text style={[styles.sidebarSectionTitle, { color: theme.textMuted }]}>
            {isBusinessView ? 'BUSINESS SUITE' : 'PERSONAL FINANCE'}
          </Text>
          {navItems.map((item) => {
            const isActive = activeNavKey === item.key;
            const IconComponent = item.icon;

            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.sidebarNavItem,
                  isActive && { backgroundColor: `${accentHex}18`, borderColor: accentHex },
                ]}
                onPress={() => {
                  if (isBusinessView) {
                    if (['dashboard', 'expenses', 'invoicing', 'aichat'].includes(item.key)) {
                      setActiveBusinessTab(item.key as BusinessTab);
                      setSubTool(null);
                    } else {
                      setActiveBusinessTab('more');
                      setSubTool(item.key as SubTool);
                    }
                  } else {
                    setActivePersonalTab(item.key as PersonalTab);
                  }
                }}
              >
                <IconComponent color={isActive ? accentHex : theme.textSecondary} size={18} style={{ marginRight: 10 }} />
                <Text style={[styles.sidebarNavLabel, { color: isActive ? accentHex : theme.text }, isActive && { fontWeight: '800' }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <Text style={[styles.sidebarSectionTitle, { color: theme.textMuted, marginTop: 18 }]}>
            ERP & SECURITY SUITE
          </Text>
          {[
            { key: 'merkle', label: 'Merkle Audit Ledger', icon: ShieldIcon },
            { key: 'team', label: 'Team & Join Codes', icon: UsersIcon },
            { key: 'khata', label: 'Khata Book Ledger', icon: UsersIcon },
            { key: 'subscriptions', label: 'Subscriptions & SaaS', icon: ActivityIcon },
            { key: 'reports', label: 'Executive P&L Reports', icon: FileTextIcon },
            { key: 'inventory', label: 'Inventory & Stock', icon: PackageIcon },
            { key: 'payroll', label: 'Payroll Slips', icon: UsersIcon },
            { key: 'assets', label: 'Fixed Assets', icon: TrendingDownIcon },
            { key: 'calendar', label: 'Business Calendar', icon: ActivityIcon },
            { key: 'auditlogs', label: 'Audit Logs Vault', icon: ShieldIcon },
          ].map((item) => {
            const isActive = subTool === item.key;
            const IconComp = item.icon;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.sidebarNavItem,
                  isActive && { backgroundColor: `${accentHex}18`, borderColor: accentHex },
                ]}
                onPress={() => {
                  setSubTool(item.key as SubTool);
                }}
              >
                <IconComp color={isActive ? accentHex : theme.textSecondary} size={16} style={{ marginRight: 10 }} />
                <Text style={[styles.sidebarNavLabel, { color: isActive ? accentHex : theme.text, fontSize: 12 }, isActive && { fontWeight: '800' }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={[styles.sidebarFooter, { borderColor: theme.cardBorder }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={[styles.avatar, { backgroundColor: accentHex + '25' }]}>
              <Text style={[styles.avatarText, { color: accentHex }]}>{(user?.fullName || 'U').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.footerName, { color: theme.text }]} numberOfLines={1}>{user?.fullName || 'User'}</Text>
              <Text style={[styles.footerEmail, { color: theme.textSecondary }]} numberOfLines={1}>{user?.email || 'authenticated'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.footerActionBtn} onPress={() => setSettingsVisible(true)}>
            <SettingsIcon color={theme.textSecondary} size={18} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── PERSONAL CONTENT RENDERER ──────────────────────────────────────────────
  const renderPersonalContent = () => {
    if (subTool) {
      return renderBusinessContent();
    }

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
            onOpenWorkspaceSwitcher={() => setWorkspaceModalVisible(true)}
            activeWorkspaceId="personal"
            activeWorkspaceRole="owner"
            onNavigateToTool={(tool) => setSubTool(tool as any)}
            isStealthMode={isStealthMode}
            onOpenTour={() => setTourVisible(true)}
          />
        );
      case 'expenses':
        return (
          <ExpensesScreen
            expensesData={{ categories: expensesData, monthlyTrend: [] }}
            loading={loading}
            activeWorkspaceId="personal"
            activeWorkspaceRole="owner"
            onRefreshData={loadFinancialData}
          />
        );
      case 'cashflow':
        return (
          <CashFlowScreen
            cashflowData={{ monthlyData: runway, stats: [] }}
            loading={loading}
            apiBaseUrl={apiBaseUrl}
            authToken={authToken}
            activeWorkspaceId="personal"
          />
        );
      case 'aichat':
        return <AiChatScreen apiBaseUrl={apiBaseUrl} authToken={authToken} financialContext={stats} />;
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
    if (subTool === 'merkle') {
      return (
        <MerkleLedgerScreen
          activeWorkspaceId={activeWorkspaceId}
          activeWorkspaceName={activeWorkspaceName}
          onBack={() => setSubTool(null)}
        />
      );
    }
    if (subTool === 'team') {
      return (
        <TeamManagementScreen
          activeWorkspaceId={activeWorkspaceId}
          activeWorkspaceName={activeWorkspaceName}
          activeWorkspaceRole={activeWorkspaceRole}
          onBack={() => setSubTool(null)}
        />
      );
    }
    if (subTool === 'inventory') {
      return (
        <InventoryScreen
          apiBaseUrl={apiBaseUrl}
          authToken={authToken}
          activeWorkspaceId={activeWorkspaceId}
          onRefreshData={loadFinancialData}
        />
      );
    }
    if (subTool === 'payroll') {
      return <PayrollScreen />;
    }
    if (subTool === 'accounts') {
      return <ChartOfAccountsScreen />;
    }
    if (subTool === 'projects') {
      return <ProjectsScreen />;
    }
    if (subTool === 'assets') {
      return (
        <FixedAssetsScreen
          apiBaseUrl={apiBaseUrl}
          authToken={authToken}
          activeWorkspaceId={activeWorkspaceId}
          onRefreshData={loadFinancialData}
        />
      );
    }
    if (subTool === 'calendar') {
      return <BusinessCalendarScreen activeWorkspaceId={activeWorkspaceId} activeWorkspaceRole={activeWorkspaceRole} />;
    }
    if (subTool === 'insights') {
      return <HeroInsightsScreen activeWorkspaceId={activeWorkspaceId} onNavigateToScreen={(screen) => setSubTool(screen as any)} />;
    }
    if (subTool === 'analytics') {
      return <AnalyticsCenterScreen activeWorkspaceId={activeWorkspaceId} />;
    }
    if (subTool === 'auditlogs') {
      return <AuditLogsScreen activeWorkspaceId={activeWorkspaceId} />;
    }
    if (subTool === 'khata') {
      return <KhataLedgerScreen />;
    }
    if (subTool === 'subscriptions') {
      return <SubscriptionsScreen />;
    }
    if (subTool === 'reports') {
      return <ExecutiveReportsScreen />;
    }

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
            onOpenWorkspaceSwitcher={() => setWorkspaceModalVisible(true)}
            activeWorkspaceId={activeWorkspaceId}
            activeWorkspaceRole={activeWorkspaceRole}
            onNavigateToTool={(tool) => setSubTool(tool as any)}
            isStealthMode={isStealthMode}
            onOpenTour={() => setTourVisible(true)}
          />
        );
      case 'expenses':
        return (
          <ExpensesScreen
            expensesData={{ categories: expensesData, monthlyTrend: [] }}
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
        return <AiChatScreen apiBaseUrl={apiBaseUrl} authToken={authToken} financialContext={stats} />;
      case 'more':
        return (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
            <Text style={[styles.moreHeader, { color: theme.text }]}>Enterprise ERP Modules</Text>
            <Text style={[styles.moreSubHeader, { color: theme.textSecondary }]}>Full suite of financial, ledger, compliance & operational tools.</Text>

            <View style={styles.grid}>
              <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.card, borderColor: '#10b98140' }]} onPress={() => setSubTool('merkle')}>
                <ShieldIcon color="#10b981" size={26} style={{ marginBottom: 10 }} />
                <Text style={[styles.toolCardTitle, { color: theme.text }]}>Merkle Audit Ledger</Text>
                <Text style={[styles.toolCardDesc, { color: theme.textSecondary }]}>SHA-256 cryptographic chain proofs & tamper integrity verification.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.card, borderColor: '#38bdf840' }]} onPress={() => setSubTool('team')}>
                <UsersIcon color="#38bdf8" size={26} style={{ marginBottom: 10 }} />
                <Text style={[styles.toolCardTitle, { color: theme.text }]}>Team & Join Codes</Text>
                <Text style={[styles.toolCardDesc, { color: theme.textSecondary }]}>12-char workspace join code, member roster & RBAC matrix.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.card, borderColor: '#10b98140' }]} onPress={() => setSubTool('khata')}>
                <UsersIcon color="#10b981" size={26} style={{ marginBottom: 10 }} />
                <Text style={[styles.toolCardTitle, { color: theme.text }]}>Khata Book Ledger</Text>
                <Text style={[styles.toolCardDesc, { color: theme.textSecondary }]}>Customer & Vendor debit/credit balances & WhatsApp reminders.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.card, borderColor: '#8b5cf640' }]} onPress={() => setSubTool('subscriptions')}>
                <ActivityIcon color="#8b5cf6" size={26} style={{ marginBottom: 10 }} />
                <Text style={[styles.toolCardTitle, { color: theme.text }]}>Recurring Subscriptions</Text>
                <Text style={[styles.toolCardDesc, { color: theme.textSecondary }]}>SaaS tools, utilities, rent schedules & burn rate analytics.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.card, borderColor: '#38bdf840' }]} onPress={() => setSubTool('reports')}>
                <FileTextIcon color="#38bdf8" size={26} style={{ marginBottom: 10 }} />
                <Text style={[styles.toolCardTitle, { color: theme.text }]}>Executive P&L Reports</Text>
                <Text style={[styles.toolCardDesc, { color: theme.textSecondary }]}>P&L statements, multi-currency FX & AI tax optimization.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.card, borderColor: '#f59e0b40' }]} onPress={() => setSubTool('inventory')}>
                <PackageIcon color="#f59e0b" size={26} style={{ marginBottom: 10 }} />
                <Text style={[styles.toolCardTitle, { color: theme.text }]}>Inventory & Stock</Text>
                <Text style={[styles.toolCardDesc, { color: theme.textSecondary }]}>Products, SKU levels, reorder alerts & valuations.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.card, borderColor: '#06b6d440' }]} onPress={() => setSubTool('payroll')}>
                <UsersIcon color="#06b6d4" size={26} style={{ marginBottom: 10 }} />
                <Text style={[styles.toolCardTitle, { color: theme.text }]}>Payroll Slips</Text>
                <Text style={[styles.toolCardDesc, { color: theme.textSecondary }]}>Employee profiles, salary slips & payout history.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.card, borderColor: '#f43f5e40' }]} onPress={() => setSubTool('assets')}>
                <TrendingDownIcon color="#f43f5e" size={26} style={{ marginBottom: 10 }} />
                <Text style={[styles.toolCardTitle, { color: theme.text }]}>Fixed Assets & Depreciation</Text>
                <Text style={[styles.toolCardDesc, { color: theme.textSecondary }]}>Asset registry & Straight-Line depreciation engine.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.card, borderColor: '#22c55e40' }]} onPress={() => setSubTool('calendar')}>
                <ActivityIcon color="#22c55e" size={26} style={{ marginBottom: 10 }} />
                <Text style={[styles.toolCardTitle, { color: theme.text }]}>Business Calendar</Text>
                <Text style={[styles.toolCardDesc, { color: theme.textSecondary }]}>GST deadlines, payroll dates & custom milestones.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.card, borderColor: '#64748b40' }]} onPress={() => setSubTool('auditlogs')}>
                <ShieldIcon color="#64748b" size={26} style={{ marginBottom: 10 }} />
                <Text style={[styles.toolCardTitle, { color: theme.text }]}>Audit Logs Vault</Text>
                <Text style={[styles.toolCardDesc, { color: theme.textSecondary }]}>Merkle-tree chained immutable security audit logs.</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );
    }
  };

  // ─── TAB BARS (MOBILE) ───────────────────────────────────────────────────────
  const renderPersonalTabBar = () => (
    <View style={[styles.tabBar, { backgroundColor: theme.tabBarBg, borderColor: theme.tabBarBorder, paddingBottom: Math.max(bottomInset, 8), height: 60 + Math.max(bottomInset, 8) }]}>
      {([
        { key: 'dashboard' as PersonalTab, icon: ActivityIcon, label: t('dashboard') },
        { key: 'expenses' as PersonalTab, icon: PieChartIcon, label: t('expenses') },
        { key: 'cashflow' as PersonalTab, icon: ArrowUpDownIcon, label: t('cashflow') },
        { key: 'aichat' as PersonalTab, icon: SparklesIcon, label: t('ai_chat') },
        { key: 'upload' as PersonalTab, icon: UploadIcon, label: t('document_centre') },
      ]).map(tab => {
        const isActive = activePersonalTab === tab.key;
        const Icon = tab.icon;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            activeOpacity={0.7}
            onPress={() => setActivePersonalTab(tab.key)}
          >
            <View style={[styles.tabIconWrapper, isActive && { backgroundColor: `${accentHex}20` }]}>
              <Icon color={isActive ? accentHex : theme.textMuted} size={20} />
            </View>
            <Text style={[styles.tabLabel, { color: isActive ? accentHex : theme.textMuted, fontWeight: isActive ? '800' : '500' }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderBusinessTabBar = () => (
    <View style={[styles.tabBar, { backgroundColor: theme.tabBarBg, borderColor: theme.tabBarBorder, paddingBottom: Math.max(bottomInset, 8), height: 60 + Math.max(bottomInset, 8) }]}>
      {([
        { key: 'dashboard' as BusinessTab, icon: ActivityIcon, label: t('dashboard') },
        { key: 'expenses' as BusinessTab, icon: PieChartIcon, label: t('expenses') },
        { key: 'invoicing' as BusinessTab, icon: FileTextIcon, label: t('invoices') },
        { key: 'aichat' as BusinessTab, icon: SparklesIcon, label: t('ai_chat') },
        { key: 'more' as BusinessTab, icon: MoreHorizontalIcon, label: t('more') },
      ]).map(tab => {
        const isActive = activeBusinessTab === tab.key;
        const Icon = tab.icon;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            activeOpacity={0.7}
            onPress={() => {
              setActiveBusinessTab(tab.key);
              if (tab.key === 'more') setSubTool(null);
            }}
          >
            <View style={[styles.tabIconWrapper, isActive && { backgroundColor: `${accentHex}20` }]}>
              <Icon color={isActive ? accentHex : theme.textMuted} size={20} />
            </View>
            <Text style={[styles.tabLabel, { color: isActive ? accentHex : theme.textMuted, fontWeight: isActive ? '800' : '500' }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (isDesktop) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg, flexDirection: 'row' }]}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.card} />

        {/* Desktop Sidebar */}
        {renderDesktopSidebar()}

        {/* Main Content Area */}
        <View style={{ flex: 1, flexDirection: 'column' }}>
          {/* Top Desktop Header Bar */}
          <DesktopHeaderBar
            userName={user?.fullName || 'User'}
            userEmail={user?.email || 'authenticated'}
            workspaceName={isBusinessView ? activeWorkspaceName : `${user?.fullName || 'Personal'}'s Workspace`}
            workspaceRole={isBusinessView ? activeWorkspaceRole : 'owner'}
            onOpenWorkspaceSwitcher={() => setWorkspaceModalVisible(true)}
            onOpenSettings={() => setSettingsVisible(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />


          {/* Screen Content */}
          <View style={styles.content}>
            {isBusinessView ? renderBusinessContent() : renderPersonalContent()}
          </View>
        </View>

        {/* Workspace Modal */}
        <WorkspaceModal visible={workspaceModalVisible} onClose={() => setWorkspaceModalVisible(false)} activeWorkspaceId={activeWorkspaceId} onSwitchWorkspace={handleSwitchWorkspace} />

        {/* Settings Modal */}
        <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} apiBaseUrl={apiBaseUrl} onSave={onUpdateApiUrl} activeWorkspaceId={activeWorkspaceId} activeWorkspaceRole={activeWorkspaceRole} currentUser={user} onLogout={onLogout} onSwitchWorkspace={handleSwitchWorkspace} />

        {/* Permissions Matrix Modal */}
        <PermissionsMatrixModal visible={permissionsModalVisible} onClose={() => setPermissionsModalVisible(false)} activeWorkspaceId={activeWorkspaceId} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.card} />

      {/* Header — Workspace Switcher Header */}
      {renderHeader()}

      {/* Sync Status Bar */}
      <SyncStatusBar />

      {/* Content Area — switches between Personal & Business Views */}
      <View style={styles.content}>
        {isBusinessView ? renderBusinessContent() : renderPersonalContent()}
      </View>

      {/* Tab Bar */}
      {isBusinessView ? renderBusinessTabBar() : renderPersonalTabBar()}

      {/* Workspace Modal */}
      <WorkspaceModal visible={workspaceModalVisible} onClose={() => setWorkspaceModalVisible(false)} activeWorkspaceId={activeWorkspaceId} onSwitchWorkspace={handleSwitchWorkspace} />

      {/* Settings Modal */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        apiBaseUrl={apiBaseUrl}
        onSave={onUpdateApiUrl}
        activeWorkspaceId={activeWorkspaceId}
        activeWorkspaceRole={activeWorkspaceRole}
        currentUser={user}
        onLogout={onLogout}
        onSwitchWorkspace={handleSwitchWorkspace}
        onOpenTour={() => setTourVisible(true)}
      />

      {/* Permissions Matrix Modal */}
      <PermissionsMatrixModal visible={permissionsModalVisible} onClose={() => setPermissionsModalVisible(false)} activeWorkspaceId={activeWorkspaceId} />

      {/* 🚀 Interactive Feature Tour Guide Modal */}
      <FeatureTourModal visible={tourVisible} onClose={() => setTourVisible(false)} />

      {/* 🔍 Mobile Spotlight Omni-Search Modal */}
      <Modal visible={spotlightVisible} transparent animationType="fade" onRequestClose={() => setSpotlightVisible(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-start', paddingTop: 80, paddingHorizontal: 16 }} activeOpacity={1} onPress={() => setSpotlightVisible(false)}>
          <View style={{ backgroundColor: theme.card, borderRadius: 20, borderWidth: 1, borderColor: theme.cardBorder, padding: 16, maxHeight: 440 }} onStartShouldSetResponder={() => true}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, borderWidth: 1, borderColor: theme.cardBorder }}>
              <SearchIcon color={accentHex} size={18} style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, color: theme.text, fontSize: 15, fontWeight: '600' }}
                placeholder="Search tools, invoices, or commands..."
                placeholderTextColor={theme.textMuted}
                autoFocus
                value={mobileSpotlightQuery}
                onChangeText={setMobileSpotlightQuery}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { id: 'add', label: '+ Quick Add Transaction', icon: '💳', run: () => { setSpotlightVisible(false); setSubTool(null); if (isBusinessView) setActiveBusinessTab('dashboard'); else setActivePersonalTab('dashboard'); } },
                { id: 'merkle', label: '🔒 Merkle Audit Ledger & SHA-256 Proof', icon: '🔒', run: () => { setSpotlightVisible(false); setSubTool('merkle'); } },
                { id: 'team', label: '👥 Team Management & 12-char Join Codes', icon: '👥', run: () => { setSpotlightVisible(false); setSubTool('team'); } },
                { id: 'inv', label: '🧾 Invoices & GST Bills', icon: '🧾', run: () => { setSpotlightVisible(false); setSubTool(null); setActiveBusinessTab('invoicing'); } },
                { id: 'khata', label: '📒 Khata Customer Ledger', icon: '📒', run: () => { setSpotlightVisible(false); setSubTool('khata'); } },
                { id: 'subs', label: '🔄 Recurring Subscriptions & Burn', icon: '🔄', run: () => { setSpotlightVisible(false); setSubTool('subscriptions'); } },
                { id: 'reports', label: '📊 Executive Financial P&L Reports', icon: '📊', run: () => { setSpotlightVisible(false); setSubTool('reports'); } },
                { id: 'inventory', label: '📦 Inventory & Stock Valuations', icon: '📦', run: () => { setSpotlightVisible(false); setSubTool('inventory'); } },
                { id: 'runway', label: '📈 Cash Flow Runway & Sandbox', icon: '📈', run: () => { setSpotlightVisible(false); setSubTool(null); if (isBusinessView) setActiveBusinessTab('dashboard'); else setActivePersonalTab('cashflow'); } },
                { id: 'copilot', label: '🤖 Ask Grounded AI Copilot', icon: '🤖', run: () => { setSpotlightVisible(false); setSubTool(null); if (isBusinessView) setActiveBusinessTab('aichat'); else setActivePersonalTab('aichat'); } },
                { id: 'backup', label: '⚙️ Encrypted Backup & Settings', icon: '⚙️', run: () => { setSpotlightVisible(false); setSettingsVisible(true); } },
              ].filter(item => !mobileSpotlightQuery || item.label.toLowerCase().includes(mobileSpotlightQuery.toLowerCase())).map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={item.run}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4, backgroundColor: theme.bg }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{item.label}</Text>
                  </View>
                  <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700' }}>OPEN →</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 🔒 Background Privacy Mask & Biometric Counter Shield */}
      {isPrivacyLocked && (
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#06111f', zIndex: 99999, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `${accentHex}20`, borderWidth: 2, borderColor: accentHex, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Lock color={accentHex} size={36} />
          </View>
          <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>
            Financial Data Protected
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginBottom: 32, maxWidth: 280, lineHeight: 18 }}>
            HisabHero is locked for privacy and billing counter security. Authenticate to resume session.
          </Text>
          <TouchableOpacity
            onPress={handleUnlockPrivacy}
            style={{ backgroundColor: accentHex, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, shadowColor: accentHex, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}
          >
            <Fingerprint color="#ffffff" size={20} />
            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '800' }}>Unlock with Biometrics</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111f' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  headerLogo: { width: 32, height: 32, marginRight: 10 },
  userName: { fontSize: 15, fontWeight: '800' },
  companyName: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerBtn: { padding: 8, borderRadius: 10 },
  content: { flex: 1 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, paddingHorizontal: 6, paddingTop: 6 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIconWrapper: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 2 },
  tabLabel: { fontSize: 10 },
  moreHeader: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  moreSubHeader: { fontSize: 13, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  toolCard: { width: '48%', borderRadius: 18, borderWidth: 1, padding: 16 },
  toolCardTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  toolCardDesc: { fontSize: 11, lineHeight: 15 },

  // Desktop Sidebar Styles
  desktopSidebar: { width: 260, borderRightWidth: 1, padding: 16, flexDirection: 'column' },
  brandHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  sidebarLogo: { width: 36, height: 36 },
  brandTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  brandSub: { fontSize: 10, fontWeight: '600' },
  sidebarWsCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 10, marginBottom: 8 },
  sidebarWsName: { fontSize: 13, fontWeight: '800' },
  sidebarWsRole: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  sidebarSectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 8, marginTop: 10, textTransform: 'uppercase' },
  sidebarNavItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginBottom: 4, borderWidth: 1, borderColor: 'transparent' },
  sidebarNavLabel: { fontSize: 13, fontWeight: '600' },
  sidebarFooter: { flexDirection: 'row', alignItems: 'center', paddingTop: 14, borderTopWidth: 1, marginTop: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '800' },
  footerName: { fontSize: 12, fontWeight: '800' },
  footerEmail: { fontSize: 10 },
  footerActionBtn: { padding: 6, borderRadius: 8 },
  desktopTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 56, borderBottomWidth: 1 },
  topBarTitle: { fontSize: 16, fontWeight: '800' },
  topBarBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 36, borderRadius: 10, borderWidth: 1 },
});
