import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BIOMETRIC_ENABLED_KEY = '@hisabhero_biometric_lock_enabled';

export const biometricService = {
  /**
   * Check if device hardware supports biometric authentication (Fingerprint, Face ID, Iris)
   */
  async isBiometricAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch {
      return false;
    }
  },

  /**
   * Get supported biometric types (e.g. FINGERPRINT, FACIAL_RECOGNITION)
   */
  async getSupportedBiometrics(): Promise<string[]> {
    if (Platform.OS === 'web') return [];
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return types.map(t => {
        if (t === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) return 'Face ID';
        if (t === LocalAuthentication.AuthenticationType.FINGERPRINT) return 'Fingerprint';
        if (t === LocalAuthentication.AuthenticationType.IRIS) return 'Iris';
        return 'Biometric';
      });
    } catch {
      return ['Biometric'];
    }
  },

  /**
   * Check if user has enabled biometric lock in HisabHero settings
   */
  async isBiometricLockEnabled(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },

  /**
   * Toggle biometric lock setting
   */
  async setBiometricLockEnabled(enabled: boolean): Promise<boolean> {
    try {
      if (enabled) {
        // Prompt authentication first to verify ownership before enabling
        const auth = await this.authenticateUser('Confirm your biometric identity to enable App Lock');
        if (!auth.success) return false;
      }
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Prompt biometric authentication prompt
   */
  async authenticateUser(promptMessage = 'Verify identity to unlock HisabHero'): Promise<{ success: boolean; error?: string }> {
    if (Platform.OS === 'web') return { success: true };
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use Device PIN / Password',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false
      });
      return { success: result.success, error: result.success ? undefined : result.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
};
