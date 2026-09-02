import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function testMultimodal() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  // Test inlineData format
  const sampleBase64 = Buffer.from('PDF test').toString('base64');
  
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'text/plain',
            data: sampleBase64
          }
        },
        'Extract information from this file in JSON format.'
      ],
      config: { responseMimeType: 'application/json' }
    });
    console.log('Gemini Multimodal Succeeded! Response:', res.text);
  } catch (err) {
    console.error('Gemini Multimodal Error:', err);
  }
}
testMultimodal();
