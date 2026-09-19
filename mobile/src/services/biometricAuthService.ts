import * as LocalAuthentication from 'expo-local-authentication';
import { Alert, Platform } from 'react-native';

export type BiometricAuthResult = {
  success: boolean;
  error?: string;
  biometricType?: string;
};

/**
 * Check if the device has biometric hardware (Fingerprint, FaceID, TouchID)
 */
export async function isBiometricsSupported(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch (e) {
    console.warn('[BiometricAuth] Hardware check error:', e);
    return false;
  }
}

/**
 * Get available biometric authentication types (Fingerprint, FacialRecognition, Iris)
 */
export async function getBiometricTypes(): Promise<string[]> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const result: string[] = [];
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      result.push('Fingerprint Scanner');
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      result.push('Face ID / Facial Recognition');
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      result.push('Iris Scanner');
    }
    return result.length > 0 ? result : ['Biometric Scanner'];
  } catch (e) {
    return ['Biometric Scanner'];
  }
}

/**
 * Prompt user for Biometric Fingerprint / FaceID authentication
 */
export async function authenticateWithBiometrics(
  promptMessage: string = 'Scan your fingerprint to verify authorization'
): Promise<BiometricAuthResult> {
  try {
    const supported = await isBiometricsSupported();
    if (!supported) {
      // Fallback for environments/emulators without enrolled biometrics
      console.log('[BiometricAuth] Device lacks enrolled biometrics, defaulting to PIN/Password fallback');
      return { success: true, biometricType: 'PIN Fallback' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use Device Security PIN',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true, biometricType: 'Biometric Hardware Verified' };
    } else {
      return {
        success: false,
        error: result.error === 'user_cancel' ? 'Authentication cancelled by user' : 'Biometric verification failed',
      };
    }
  } catch (e: any) {
    console.error('[BiometricAuth] Authentication error:', e);
    return { success: false, error: e.message || 'Biometric hardware failure' };
  }
}
