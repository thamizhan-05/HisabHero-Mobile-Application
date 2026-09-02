import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function testSmartGemini() {
  const sampleGPay = `Google Pay Statement
Period: 01/02/2026 - 28/02/2026
User: Selva Thevar

02 Feb 2026
Paid to Swiggy
₹450.00
Completed • UPI transaction ID: 605912345678

05 Feb 2026
Received from Sharma Ji
₹12,000.00
Completed • UPI transaction ID: 605987654321

10 Feb 2026
Paid to Zepto
₹320.00
Completed • UPI transaction ID: 605911223344

15 Feb 2026
Paid to Airtel Broadband
₹1,179.00
Completed • UPI transaction ID: 605999887766

20 Feb 2026
Received from Client Retainer
₹45,000.00
Completed • UPI transaction ID: 605944556677`;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `You are an expert Document Intelligence Assistant specializing in Indian financial statements, mandi receipts, UPI slips, bills, and invoices.
Analyze this document text:

${sampleGPay}

Extract all transaction records, receipt details, and financial entries.
Multilingual prompt engineering:
- Standardize dates to YYYY-MM-DD format.
- Identify income vs expense accurately.
- Categorize each transaction (Food & Dining, Rent & Utilities, Groceries, Technology, Consulting & Sales, Salary, Transportation, Other).

Return strictly JSON:
{
  "documentType": "bank_statement",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Narration or merchant",
      "merchantName": "Merchant Name",
      "category": "Food & Dining",
      "type": "expense",
      "amount": 450.00,
      "referenceNumber": "605912345678"
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  console.log('Gemini Extraction Result:\n', response.text);
}
testSmartGemini();
