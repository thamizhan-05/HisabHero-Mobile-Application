import fs from 'fs';
import { processPDFOrImageWithAI } from '../backend/services/documentIntelligenceService.js';

async function verifyDoc(filePath, expectedBank, expectedCount) {
  const buf = fs.readFileSync(filePath);
  const result = await processPDFOrImageWithAI(buf, 'application/pdf', filePath.split('/').pop());
  console.log(`\n========================================`);
  console.log(`Document: ${filePath.split('/').pop()} (${expectedBank})`);
  console.log(`Parser Used: ${result.parserUsed}`);
  console.log(`Extracted: ${result.extracted.length} transactions (Expected ~${expectedCount})`);
  if (result.extracted.length > 0) {
    console.log(`First Txn: ${result.extracted[0].date} | ${result.extracted[0].merchantName} | ${result.extracted[0].type.toUpperCase()} ₹${result.extracted[0].amount} | Bal: ₹${result.extracted[0].balance}`);
    console.log(`Last Txn:  ${result.extracted[result.extracted.length - 1].date} | ${result.extracted[result.extracted.length - 1].merchantName} | ${result.extracted[result.extracted.length - 1].type.toUpperCase()} ₹${result.extracted[result.extracted.length - 1].amount} | Bal: ₹${result.extracted[result.extracted.length - 1].balance}`);
  }
  return result;
}

async function run() {
  console.log('=== VERIFYING END-TO-END DOCUMENT INTELLIGENCE INGESTION ===');

  await verifyDoc(
    'C:/Users/selva/.gemini/antigravity-ide/brain/64c3eaa5-8d25-4e0e-9d1c-66b534946f0c/.user_uploaded/media_1789801821166.pdf',
    'ICICI Bank',
    11
  );

  await verifyDoc(
    'C:/Users/selva/.gemini/antigravity-ide/brain/64c3eaa5-8d25-4e0e-9d1c-66b534946f0c/.user_uploaded/media_1789802108834.pdf',
    'Indian Overseas Bank',
    25
  );

  await verifyDoc(
    'C:/Users/selva/.gemini/antigravity-ide/brain/64c3eaa5-8d25-4e0e-9d1c-66b534946f0c/.user_uploaded/media_1789802252442.pdf',
    'Indian Bank',
    30
  );
}

run().catch(console.error);
