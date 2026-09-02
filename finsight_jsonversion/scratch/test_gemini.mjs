import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function testPdfGemini() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // Create a dummy 1-page PDF buffer with text
    const sampleText = `Date,Description,Amount,Status
01/02/2026,Swiggy Food Delivery,450.00,Debited
05/02/2026,Salary Credit,75000.00,Credited
10/02/2026,Electricity Bill,2400.00,Debited`;

    // Test text prompt with extracted PDF text or inlineData
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          text: `You are an expert Indian statement parser. Extract all transactions from this document text:\n\n${sampleText}\n\nReturn JSON: { "documentType": "bank_statement", "transactions": [ { "date": "YYYY-MM-DD", "description": "...", "amount": 100, "type": "income"|"expense", "category": "..." } ] }`
        }
      ],
      config: { responseMimeType: 'application/json' }
    });
    console.log('Gemini Text Parsing Output:', response.text);
  } catch (err) {
    console.error('Gemini Test Error:', err);
  }
}
testPdfGemini();
