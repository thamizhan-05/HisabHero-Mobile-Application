import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = 'hh_biometric_lock_enabled_v1';
const SECURE_TOKEN_KEY = 'hh_secure_auth_token_v1';

export const biometricService = {
  /**
   * Check if device has biometric hardware and enrolled biometrics (Fingerprint / Face ID).
   */
  isAvailable: async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (e) {
      console.warn('Failed to check biometric availability:', e);
      return false;
    }
  },

  /**
   * Get supported biometric types (Fingerprint, Facial Recognition, Iris).
   */
  getTypes: async (): Promise<string[]> => {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const names: string[] = [];
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        names.push('Fingerprint');
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        names.push('Face ID');
      }
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        names.push('Iris');
      }
      return names;
    } catch {
      return ['Biometrics'];
    }
  },

  /**
   * Check if user has enabled Biometric Lock in settings.
   */
  isEnabled: async (): Promise<boolean> => {
    try {
      const val = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },
  isBiometricLockEnabled: async (): Promise<boolean> => {
    return biometricService.isEnabled();
  },

  /**
   * Toggle Biometric Lock preference.
   */
  setEnabled: async (enabled: boolean): Promise<boolean> => {
    try {
      if (enabled) {
        const verified = await biometricService.authenticate('Verify biometric identity to enable App Lock');
        if (!verified) return false;
      }
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
      return true;
    } catch (e) {
      console.warn('Failed to save biometric preference:', e);
      return false;
    }
  },
  setBiometricLockEnabled: async (enabled: boolean): Promise<boolean> => {
    return biometricService.setEnabled(enabled);
  },

  /**
   * Prompt user for Biometric Authentication.
   */
  authenticate: async (promptMessage = 'Unlock HisabHero Financial Intelligence'): Promise<boolean> => {
    try {
      const isAvail = await biometricService.isAvailable();
      if (!isAvail) return true; // If hardware is not available, pass

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false, // Allows device PIN / password fallback if fingerprint fails
        fallbackLabel: 'Use Device Passcode',
      });

      return result.success;
    } catch (err) {
      console.error('Biometric authentication error:', err);
      return false;
    }
  },

  /**
   * Hardware-backed SecureStore Token Helper (AES-256 Android Keystore / iOS Keychain).
   */
  saveSecureToken: async (token: string): Promise<void> => {
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        await SecureStore.setItemAsync(SECURE_TOKEN_KEY, token, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      } else {
        await AsyncStorage.setItem(SECURE_TOKEN_KEY, token);
      }
    } catch (e) {
      await AsyncStorage.setItem(SECURE_TOKEN_KEY, token);
    }
  },

  getSecureToken: async (): Promise<string | null> => {
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        return await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
      }
      return await AsyncStorage.getItem(SECURE_TOKEN_KEY);
    } catch {
      return await AsyncStorage.getItem(SECURE_TOKEN_KEY);
    }
  },

  removeSecureToken: async (): Promise<void> => {
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
      }
      await AsyncStorage.removeItem(SECURE_TOKEN_KEY);
    } catch {
      await AsyncStorage.removeItem(SECURE_TOKEN_KEY);
    }
  }
};
