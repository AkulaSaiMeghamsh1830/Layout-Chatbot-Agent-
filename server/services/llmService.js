const { GoogleGenAI } = require('@google/genai');
const OpenAI = require('openai');

const RETRY_DELAYS = [15000, 30000, 60000];

function isRateLimit(err) {
  const msg = err?.message || '';
  return msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanJSON(raw) {
  return raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

async function callGemini(systemPrompt, history, userMessage) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const contents = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  let lastErr;
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
        config: { systemInstruction: systemPrompt, temperature: 0.2, responseMimeType: 'application/json' },
      });
      return JSON.parse(cleanJSON(response.text));
    } catch (err) {
      lastErr = err;
      if (isRateLimit(err) && attempt < RETRY_DELAYS.length) {
        console.warn(`[Gemini] Rate limit — retrying in ${RETRY_DELAYS[attempt] / 1000}s`);
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

async function callGroq(systemPrompt, history, userMessage) {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: userMessage },
  ];
  const response = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages,
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });
  return JSON.parse(cleanJSON(response.choices[0].message.content));
}

/**
 * Tries Gemini first. Falls back to Groq automatically if Gemini quota is exhausted.
 */
async function callLLM(systemPrompt, history, userMessage) {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await callGemini(systemPrompt, history, userMessage);
    } catch (err) {
      if (isRateLimit(err) && process.env.GROQ_API_KEY) {
        console.warn('[LLM] Gemini quota exhausted — falling back to Groq');
      } else {
        throw err;
      }
    }
  }
  if (process.env.GROQ_API_KEY) {
    return await callGroq(systemPrompt, history, userMessage);
  }
  throw new Error('No LLM API key configured. Set GEMINI_API_KEY or GROQ_API_KEY in server/.env');
}

module.exports = { callLLM };
