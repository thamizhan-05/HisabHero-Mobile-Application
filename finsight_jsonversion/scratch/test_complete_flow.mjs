import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import { GoogleGenAI } from '@google/genai';

function bufferToPureUint8Array(buf) {
  if (!buf) return new Uint8Array(0);
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; i++) {
    view[i] = buf[i];
  }
  return view;
}

async function extractTextFromPdfBuffer(fileBuffer) {
  try {
    const pureUint8 = bufferToPureUint8Array(fileBuffer);
    if (pdf && pdf.PDFParse) {
      const parser = new pdf.PDFParse(pureUint8);
      const textResult = await parser.getText();
      return typeof textResult === 'string' ? textResult : (textResult?.text || '');
    } else if (typeof pdf === 'function') {
      const res = await pdf(pureUint8);
      return res?.text || '';
    }
  } catch (err) {
    console.warn('PDF Parse error:', err.message);
  }
  return '';
}

async function parseStatementWithGemini(extractedText, filename) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `You are a world-class Indian Financial Statement & Accounting Document Parser.
Analyze this financial document / statement (${filename || 'statement.pdf'}).

DOCUMENT TEXT:
\"\"\"
${extractedText.slice(0, 80000)}
\"\"\"

Extract EVERY transaction record, debited outflow, credited inflow, UPI payment, invoice item, or bank ledger row.
Rules:
1. Convert all dates to standard YYYY-MM-DD format.
2. Determine exact amount (positive number).
3. If money was debited / paid / transferred out / spent -> type = 'expense'.
4. If money was credited / received / salary / deposit -> type = 'income'.
5. Clean up the description and merchant name (e.g. 'Paid to Swiggy' -> merchant: 'Swiggy', description: 'Paid to Swiggy').
6. Assign realistic Indian category: Food & Dining, Rent & Utilities, Groceries, Technology, Consulting & Sales, Salary, Transportation, Health & Medical, Shopping, Other.

Return strictly raw JSON format without markdown fences:
{
  "documentType": "bank_statement",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Full narration or clean description",
      "merchantName": "Merchant / Party Name",
      "category": "Food & Dining",
      "type": "expense",
      "amount": 450.00,
      "referenceNumber": "UPI/UTR reference if present"
    }
  ]
}`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  return JSON.parse(res.text);
}

// Test with simulated statement text
const sampleText = `State Bank of India Account Statement
Account Number: 30123456789
Period: 01-Feb-2026 to 28-Feb-2026

Date | Narration | Chq/Ref No | Debit | Credit | Balance
01/02/2026 | UPI/605911223344/SWIGGY/swiggy@icici | 605911223344 | 450.00 | | 54,550.00
05/02/2026 | SALARY FEB 2026 / INFOSYS LTD | 998877665544 | | 85,000.00 | 1,39,550.00
10/02/2026 | UPI/605933445566/ZOMATO/zomato@hdfc | 605933445566 | 320.00 | | 1,39,230.00
15/02/2026 | HOUSE RENT TRANSFER TO OWNER | 112233445566 | 22,000.00 | | 1,17,230.00
20/02/2026 | UPI/605955667788/ZEPTO/zepto@axis | 605955667788 | 185.00 | | 1,17,045.00
25/02/2026 | FREELANCE DESIGN CONSULTING | 776655443322 | | 35,000.00 | 1,52,045.00`;

parseStatementWithGemini(sampleText, 'sbi_statement.pdf')
  .then(res => {
    console.log('Parsed Transactions Count:', res.transactions?.length);
    console.log('Sample extracted transactions:', res.transactions);
  })
  .catch(err => console.error('Flow test error:', err));
