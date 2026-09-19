import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ViewStyle,
  TextStyle,
  StyleProp,
  TextInput,
  Image,
} from 'react-native';
import { useTheme } from '../theme/themeSystem';


// ─── 1. APP CARD ────────────────────────────────────────────────────────────
export interface AppCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'flat' | 'elevated' | 'subtle';
  padding?: number;
  bordered?: boolean;
  glow?: boolean;
}

export function AppCard({ children, style, onPress, variant = 'elevated', padding = 16, bordered = true, glow = false }: AppCardProps) {
  const { theme, accentHex } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const cardBg = variant === 'subtle' ? (theme.subtleCard || theme.cardHeader) : theme.card;
  const shadowStyle = variant === 'elevated' ? {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  } : {};

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: bordered ? theme.cardBorder : 'transparent',
          padding,
        },
        glow ? { borderColor: theme.primary, borderWidth: 1.5 } : null,
        shadowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {content}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return content;
}

// ─── 2. APP BUTTON ──────────────────────────────────────────────────────────
export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}: AppButtonProps) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 24,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
    }).start();
  };

  let bg = theme.primary;
  let textColor = '#ffffff';
  let borderWidth = 0;
  let borderColor = 'transparent';

  if (variant === 'secondary') {
    bg = theme.badgeBg;
    textColor = theme.primary;
  } else if (variant === 'outline') {
    bg = 'transparent';
    textColor = theme.text;
    borderWidth = 1.5;
    borderColor = theme.cardBorder;
  } else if (variant === 'danger') {
    bg = theme.error;
    textColor = '#ffffff';
  } else if (variant === 'ghost') {
    bg = 'transparent';
    textColor = theme.textSecondary;
  }

  let height = 48;
  let paddingHorizontal = 20;
  let fontSize = 15;

  if (size === 'small') {
    height = 36;
    paddingHorizontal = 14;
    fontSize = 13;
  } else if (size === 'large') {
    height = 54;
    paddingHorizontal = 24;
    fontSize = 16;
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.button,
          {
            backgroundColor: bg,
            height,
            paddingHorizontal,
            borderWidth,
            borderColor,
            opacity: disabled ? 0.6 : 1,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <View style={styles.btnRow}>
            {icon ? <View style={{ marginRight: 8 }}>{icon}</View> : null}
            <Text style={[styles.btnText, { color: textColor, fontSize }, textStyle]}>
              {title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── 3. STAT WIDGET ─────────────────────────────────────────────────────────
export interface StatWidgetProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendType?: string;
  trendPositive?: boolean;
  badgeText?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accentColor?: string;
}

export function StatWidget({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendType,
  trendPositive = true,
  badgeText,
  style,
  onPress,
  accentColor,
}: StatWidgetProps) {
  const { theme, accentHex } = useTheme();
  const activeAccent = accentColor || accentHex;
  const isPositive = trendType ? (trendType === 'positive' || trendType === 'up') : trendPositive;

  return (
    <AppCard onPress={onPress} style={style}>
      <View style={styles.statHeader}>
        <Text style={[styles.statTitle, { color: theme.textSecondary }]} numberOfLines={1}>
          {title}
        </Text>
        {icon ? (
          <View style={[styles.statIconBox, { backgroundColor: `${activeAccent}15` }]}>
            {icon}
          </View>
        ) : null}
      </View>

      <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>

      {subtitle || trend || badgeText ? (
        <View style={styles.statFooter}>
          {trend ? (
            <View style={styles.trendRow}>
              <Text
                style={[
                  styles.trendText,
                  { color: isPositive ? theme.success : theme.error },
                ]}
              >
                {isPositive ? '↑ ' : '↓ '}
                {trend}
              </Text>
            </View>
          ) : null}

          {subtitle ? (
            <Text style={[styles.statSubtitle, { color: theme.textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}

          {badgeText ? (
            <BadgePill text={badgeText} variant={isPositive ? 'success' : 'warning'} />
          ) : null}
        </View>
      ) : null}
    </AppCard>
  );
}

// ─── 4. BADGE PILL ──────────────────────────────────────────────────────────
export interface BadgePillProps {
  text?: string;
  label?: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
  style?: StyleProp<ViewStyle>;
}

export function BadgePill({ text, label, variant = 'info', style }: BadgePillProps) {
  const { theme } = useTheme();
  const displayText = text || label || '';

  let bg = theme.badgeBg;
  let color = theme.primary;

  if (variant === 'success') {
    bg = 'rgba(5, 150, 105, 0.12)';
    color = theme.success;
  } else if (variant === 'warning') {
    bg = 'rgba(217, 119, 6, 0.12)';
    color = theme.warning;
  } else if (variant === 'error') {
    bg = 'rgba(220, 38, 38, 0.12)';
    color = theme.error;
  } else if (variant === 'neutral') {
    bg = theme.subtleCard || '#f1f5f9';
    color = theme.textSecondary;
  } else if (variant === 'primary') {
    bg = theme.badgeBg;
    color = theme.primary;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.badgeText, { color }]}>{displayText}</Text>
    </View>
  );
}

// ─── 5. EMPTY STATE WIDGET ─────────────────────────────────────────────────
export interface EmptyStateWidgetProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionTitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyStateWidget({
  icon,
  title,
  description,
  actionTitle,
  actionLabel,
  onAction,
  style,
}: EmptyStateWidgetProps) {
  const { theme } = useTheme();
  const btnLabel = actionTitle || actionLabel;

  return (
    <View style={[styles.emptyContainer, style]}>
      {icon ? <View style={styles.emptyIconBox}>{icon}</View> : null}
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>{description}</Text>
      {btnLabel && onAction ? (
        <AppButton
          title={btnLabel}
          onPress={onAction}
          variant="secondary"
          size="small"
          style={{ marginTop: 16 }}
        />
      ) : null}
    </View>
  );
}

// ─── 6. SECTION HEADER ──────────────────────────────────────────────────────
export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionTitle?: string;
  actionText?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({ title, subtitle, actionTitle, actionText, onAction, style }: SectionHeaderProps) {
  const { theme } = useTheme();
  const btnText = actionTitle || actionText;

  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      {btnText && onAction ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={[styles.sectionActionText, { color: theme.primary }]}>{btnText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ─── 7. SKELETON CARD ───────────────────────────────────────────────────────
export function SkeletonCard({ height = 100, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.skeleton,
        {
          height,
          backgroundColor: theme.skeletonBg || 'rgba(0,0,0,0.06)',
          borderColor: theme.cardBorder,
        },
        style,
      ]}
    />
  );
}

// ─── 8. ACHIEVEMENT BADGE WIDGET ────────────────────────────────────────────
export function AchievementBadgeWidget({
  title,
  subtitle,
  icon,
  badge,
  points,
  style,
}: {
  title?: string;
  subtitle?: string;
  icon?: string;
  badge?: string;
  points?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme, accentHex } = useTheme();
  return (
    <View style={[styles.badgeContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }, style]}>
      <Text style={[styles.badgeTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.badgeSubtitle, { color: accentHex }]}>
        {icon ? `${icon} ` : ''}{subtitle || (badge ? `${badge} • ${points} pts` : '')}
      </Text>
    </View>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  statFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statSubtitle: {
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconBox: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  skeleton: {
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
    marginBottom: 12,
  },
  badgeContainer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  badgeSubtitle: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
});

// ─── 9. DESKTOP DATA TABLE ──────────────────────────────────────────────────
export interface DataTableColumn<T> {
  key: string;
  title: string;
  flex?: number;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  loading?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display in this table.',
  loading = false,
}: DataTableProps<T>) {
  const { theme, accentHex } = useTheme();

  if (loading) {
    return <SkeletonCard height={180} />;
  }

  if (!data || data.length === 0) {
    return <EmptyStateWidget title={emptyTitle} description={emptyDescription} icon="📊" />;
  }

  return (
    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: theme.cardBorder, overflow: 'hidden', backgroundColor: theme.card }}>

      {/* Header Row */}
      <View style={{ flexDirection: 'row', backgroundColor: theme.cardHeader || theme.bg, borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingVertical: 12, paddingHorizontal: 16 }}>
        {columns.map((col) => (
          <View
            key={col.key}
            style={{
              flex: col.flex || 1,
              width: col.width as any,
              alignItems: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {col.title}
            </Text>
          </View>
        ))}
      </View>

      {/* Rows */}
      {data.map((item, idx) => (
        <View
          key={keyExtractor(item, idx)}
          style={{
            flexDirection: 'row',
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderBottomWidth: idx === data.length - 1 ? 0 : 1,
            borderBottomColor: theme.cardBorder,
            alignItems: 'center',
            backgroundColor: idx % 2 === 0 ? theme.card : (theme.subtleCard || theme.card),
          }}
        >
          {columns.map((col) => (
            <View
              key={col.key}
              style={{
                flex: col.flex || 1,
                width: col.width as any,
                alignItems: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
              }}
            >
              {col.render ? (
                col.render(item, idx)
              ) : (
                <Text style={{ fontSize: 14, color: theme.text, fontWeight: '500' }}>
                  {(item as any)[col.key] !== undefined ? String((item as any)[col.key]) : '—'}
                </Text>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── 10. HERO INSIGHTS WIDGET ───────────────────────────────────────────────
export interface HeroInsightsWidgetProps {
  title?: string;
  insights: string[];
  style?: StyleProp<ViewStyle>;
}

export function HeroInsightsWidget({ title = 'Hero Insight', insights, style }: HeroInsightsWidgetProps) {
  const { theme, accentHex } = useTheme();

  if (!insights || insights.length === 0) return null;

  return (
    <View
      style={[
        {
          backgroundColor: accentHex + '12',
          borderColor: accentHex + '35',
          borderWidth: 1,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Text style={{ fontSize: 16 }}>💡</Text>
        <Text style={{ fontSize: 15, fontWeight: '800', color: accentHex, letterSpacing: -0.2 }}>
          {title}
        </Text>
      </View>
      {insights.map((insight, idx) => (
        <Text key={idx} style={{ fontSize: 13, color: theme.text, lineHeight: 18, marginTop: idx > 0 ? 6 : 0, fontWeight: '500' }}>
          • {insight}
        </Text>
      ))}
    </View>
  );
}

// ─── 11. DESKTOP HEADER BAR ─────────────────────────────────────────────────
export interface DesktopHeaderBarProps {
  userName: string;
  userEmail: string;
  workspaceName: string;
  workspaceRole: string;
  onOpenWorkspaceSwitcher: () => void;
  onOpenSettings: () => void;
  searchQuery: string;
  onSearchChange: (text: string) => void;
}

export function DesktopHeaderBar({
  userName,
  userEmail,
  workspaceName,
  workspaceRole,
  onOpenWorkspaceSwitcher,
  onOpenSettings,
  searchQuery,
  onSearchChange,
}: DesktopHeaderBarProps) {
  const { theme, accentHex } = useTheme();

  return (
    <View
      style={{
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        backgroundColor: theme.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.cardBorder,
        zIndex: 50,
      }}
    >
      {/* Left: Workspace Switcher */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.cardBorder }}
          onPress={onOpenWorkspaceSwitcher}
          activeOpacity={0.7}
        >
          <View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>{workspaceName}</Text>
            <Text style={{ fontSize: 10, color: theme.textSecondary, textTransform: 'uppercase' }}>{workspaceRole}</Text>
          </View>
          <Text style={{ fontSize: 12, color: theme.textSecondary }}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Center: Search */}
      <View style={{ flex: 1, maxWidth: 420, marginHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bg, borderRadius: 10, borderWidth: 1, borderColor: theme.cardBorder, paddingHorizontal: 12, height: 38 }}>
          <Text style={{ marginRight: 8, fontSize: 14, color: theme.textMuted }}>🔍</Text>
          <TextInput
            style={{ flex: 1, fontSize: 13, color: theme.text, outlineStyle: 'none' } as any}
            placeholder="Search transactions, invoices, items..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </View>
      </View>

      {/* Right: Notifications & Profile */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <TouchableOpacity style={{ padding: 8 }} onPress={onOpenSettings}>
          <Text style={{ fontSize: 16 }}>🔔</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ padding: 8 }} onPress={onOpenSettings}>
          <Text style={{ fontSize: 16 }}>⚙️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 8 }}
          onPress={onOpenSettings}
        >
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: accentHex + '25', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: accentHex }}>{(userName || 'U').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ display: 'flex' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>{userName}</Text>
            <Text style={{ fontSize: 11, color: theme.textSecondary }}>{userEmail}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

