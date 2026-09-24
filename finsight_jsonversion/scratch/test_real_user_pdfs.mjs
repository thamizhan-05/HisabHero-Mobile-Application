import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import {
  parseSbiStatement,
  parseIciciStatement,
  parseIobStatement,
  parseIndianBankStatement
} from './prototype_parsers.mjs';

async function testPdf(file, parserFn, name) {
  const buf = fs.readFileSync(file);
  const u8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  const parser = new PDFParse(u8);
  const res = await parser.getText();
  const text = typeof res === 'string' ? res : res.text;
  const txns = parserFn(text);
  console.log(`=== ${name} Real PDF Test ===`);
  console.log(`Parsed ${txns.length} transactions from ${file.split('/').pop()}`);
  if (txns.length > 0) {
    console.log('Sample txn 1:', txns[0]);
    console.log('Sample txn Last:', txns[txns.length - 1]);
  } else {
    console.log('Text preview (first 300 chars):', text.slice(0, 300));
  }
}

async function run() {
  await testPdf('C:/Users/selva/.gemini/antigravity-ide/brain/64c3eaa5-8d25-4e0e-9d1c-66b534946f0c/.user_uploaded/media_1789801821166.pdf', parseIciciStatement, 'ICICI');
  await testPdf('C:/Users/selva/.gemini/antigravity-ide/brain/64c3eaa5-8d25-4e0e-9d1c-66b534946f0c/.user_uploaded/media_1789802108834.pdf', parseIobStatement, 'IOB');
  await testPdf('C:/Users/selva/.gemini/antigravity-ide/brain/64c3eaa5-8d25-4e0e-9d1c-66b534946f0c/.user_uploaded/media_1789802252442.pdf', parseIndianBankStatement, 'Indian Bank');
}

run().catch(console.error);
