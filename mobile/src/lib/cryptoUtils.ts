import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import nacl from 'tweetnacl';

const PRIVATE_KEY_STORE_KEY = 'hisabhero_private_key';
const PUBLIC_KEY_STORE_KEY = 'hisabhero_public_key';

// Helper to convert Uint8Array to Hex string
export function toHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper to convert Hex string to Uint8Array
export function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, (i + 1) * 2), 16);
  }
  return bytes;
}

// Helper to convert UTF-8 string to Uint8Array
export function stringToUint8Array(str: string): Uint8Array {
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i) & 0xff;
  }
  return arr;
}

// Generate Ed25519 keypair
export function generateKeyPair() {
  const keyPair = nacl.sign.keyPair();
  return {
    publicKey: toHex(keyPair.publicKey),
    privateKey: toHex(keyPair.secretKey)
  };
}

// Load or lazily initialize the secure cryptographic keys
export async function getOrGenerateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  let privateKey = await SecureStore.getItemAsync(PRIVATE_KEY_STORE_KEY);
  let publicKey = await SecureStore.getItemAsync(PUBLIC_KEY_STORE_KEY);

  if (!privateKey || !publicKey) {
    const pair = generateKeyPair();
    await SecureStore.setItemAsync(PRIVATE_KEY_STORE_KEY, pair.privateKey);
    await SecureStore.setItemAsync(PUBLIC_KEY_STORE_KEY, pair.publicKey);
    return pair;
  }

  return { publicKey, privateKey };
}

// Prompt biometrics, then cryptographically sign the transaction
export async function signTransactionPayload(
  payload: { amount: number; description: string; date: string; type: string }
): Promise<{ signature: string; publicKey: string } | null> {
  // Check biometrics availability
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (hasHardware && isEnrolled) {
    const authResult = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm biometrics to cryptographically sign this transaction',
      fallbackLabel: 'Use Device Passcode',
    });

    if (!authResult.success) {
      throw new Error('Biometric authentication failed. Transaction security signing aborted.');
    }
  }

  // Load keypair
  const { publicKey, privateKey } = await getOrGenerateKeyPair();

  // Create deterministic string payload: amount:description:date:type
  const dataString = `${payload.amount}:${payload.description}:${payload.date}:${payload.type}`;
  const dataBytes = stringToUint8Array(dataString);

  // Sign using Ed25519
  const secretKeyBytes = fromHex(privateKey);
  const signatureBytes = nacl.sign.detached(dataBytes, secretKeyBytes);

  return {
    signature: toHex(signatureBytes),
    publicKey
  };
}
