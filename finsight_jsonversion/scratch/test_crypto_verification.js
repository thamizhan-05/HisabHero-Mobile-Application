import nacl from 'tweetnacl';

function toHex(arr) {
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, (i + 1) * 2), 16);
  }
  return bytes;
}

function stringToUint8Array(str) {
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i) & 0xff;
  }
  return arr;
}

// Generate key pair
const keyPair = nacl.sign.keyPair();
const publicKey = toHex(keyPair.publicKey);
const privateKey = toHex(keyPair.secretKey);

console.log('Generated Public Key:', publicKey);
console.log('Generated Private Key:', privateKey);

// Sign a transaction payload
const payload = { amount: 1500.50, description: 'Coffee Buy', date: '2026-07-23', type: 'expense' };
const dataString = `${payload.amount}:${payload.description}:${payload.date}:${payload.type}`;
const dataBytes = stringToUint8Array(dataString);

const secretKeyBytes = fromHex(privateKey);
const signatureBytes = nacl.sign.detached(dataBytes, secretKeyBytes);
const signature = toHex(signatureBytes);

console.log('Data to sign:', dataString);
console.log('Generated Signature:', signature);

// Verify signature
const verifyPubKeyBytes = fromHex(publicKey);
const verifySigBytes = fromHex(signature);
const isValid = nacl.sign.detached.verify(dataBytes, verifySigBytes, verifyPubKeyBytes);

console.log('Signature is valid:', isValid);
if (isValid) {
  console.log('SUCCESS: Cryptographic verification works!');
} else {
  console.error('ERROR: Cryptographic verification failed.');
  process.exit(1);
}
