import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle, ActivityIndicator, View } from 'react-native';
import { useTheme } from '../theme/themeSystem';

export type AppButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
}: AppButtonProps) {
  const { theme, accentHex } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          bg: theme.isDark ? '#ffffff15' : '#0000000d',
          border: theme.cardBorder,
          text: theme.text,
          glow: 'transparent',
        };
      case 'outline':
        return {
          bg: 'transparent',
          border: accentHex,
          text: accentHex,
          glow: 'transparent',
        };
      case 'danger':
        return {
          bg: theme.error,
          border: theme.error,
          text: '#ffffff',
          glow: `${theme.error}40`,
        };
      case 'primary':
      default:
        return {
          bg: accentHex,
          border: accentHex,
          text: '#ffffff',
          glow: `${accentHex}40`,
        };
    }
  };

  const v = getVariantStyles();

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled ? (theme.isDark ? '#ffffff10' : '#00000010') : v.bg,
          borderColor: disabled ? 'transparent' : v.border,
          shadowColor: v.glow,
        },
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            style={[
              styles.buttonText,
              { color: disabled ? theme.textMuted : v.text },
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

