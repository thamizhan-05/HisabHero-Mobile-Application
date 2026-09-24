import fs from 'fs';
import { parsePdfBufferWithNativeRegex } from '../backend/services/pdfParsers.js';

async function testNativeBuffer(file, name) {
  const buf = fs.readFileSync(file);
  const res = await parsePdfBufferWithNativeRegex(buf);
  console.log(`${name} Result:`, res ? `Matched ${res.parser} with ${res.transactions.length} txns` : 'NULL (fallback to Vision)');
  if (res && res.transactions && res.transactions.length > 0) {
    console.log(`  Sample: ${res.transactions[0].date} | ${res.transactions[0].merchantName} | ${res.transactions[0].type.toUpperCase()} ₹${res.transactions[0].amount} | Bal: ₹${res.transactions[0].balance}`);
  }
}

async function run() {
  console.log('=== TESTING REAL PDF BUFFER DISPATCH ===');
  await testNativeBuffer('C:/Users/selva/.gemini/antigravity-ide/brain/64c3eaa5-8d25-4e0e-9d1c-66b534946f0c/.user_uploaded/media_1789801713462.pdf', 'SBI (Scanned)');
  await testNativeBuffer('C:/Users/selva/.gemini/antigravity-ide/brain/64c3eaa5-8d25-4e0e-9d1c-66b534946f0c/.user_uploaded/media_1789801821166.pdf', 'ICICI');
  await testNativeBuffer('C:/Users/selva/.gemini/antigravity-ide/brain/64c3eaa5-8d25-4e0e-9d1c-66b534946f0c/.user_uploaded/media_1789802108834.pdf', 'IOB');
  await testNativeBuffer('C:/Users/selva/.gemini/antigravity-ide/brain/64c3eaa5-8d25-4e0e-9d1c-66b534946f0c/.user_uploaded/media_1789802252442.pdf', 'Indian Bank');
}

run().catch(console.error);
