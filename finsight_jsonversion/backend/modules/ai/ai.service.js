import { GoogleGenAI } from '@google/genai';
import { config } from '../../config/env.js';
import { generateLocalCfoAnalysis } from '../../services/cfoExpertEngine.js';
import { parseBhashaVoiceIntent } from '../../services/businessOwnerEngine.js';

export async function processAiChat(message, context = {}) {
  // If Gemini key is available, generate smart response with Gemini
  if (config.hasGeminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
      const prompt = `You are Hero Bot, a world-class financial copilot for Indian MSMEs and individuals.
Live user financial context:
${JSON.stringify(context, null, 2)}

User question: "${message}"

Provide a concise, practical, and mathematically accurate financial response with actionable suggestions.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      return {
        reply: response.text,
        source: 'gemini_intelligence'
      };
    } catch (e) {
      console.warn('[AI Service] Gemini fallback to local CFO engine:', e.message);
    }
  }

  // Local rule-based CFO engine fallback
  const fallback = generateLocalCfoAnalysis(context, message);
  return {
    reply: fallback.analysis || fallback.reply || fallback,
    source: 'local_cfo_engine'
  };
}

export function parseVoiceCommand(spokenPrompt) {
  return parseBhashaVoiceIntent(spokenPrompt);
}
