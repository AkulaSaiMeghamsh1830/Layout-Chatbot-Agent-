const { GoogleGenAI } = require('@google/genai');

const RETRY_DELAYS = [15000, 30000, 60000]; // 15s, 30s, 60s

function isRateLimit(err) {
  const msg = err?.message || '';
  return msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls Gemini with the system prompt, conversation history, and new user message.
 * Auto-retries up to 3 times on rate-limit errors with exponential backoff.
 * Returns parsed JSON response from the LLM.
 */
async function callLLM(systemPrompt, history, userMessage) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

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
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text.trim();
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      return JSON.parse(cleaned);

    } catch (err) {
      lastErr = err;
      if (isRateLimit(err) && attempt < RETRY_DELAYS.length) {
        const wait = RETRY_DELAYS[attempt];
        console.warn(`[LLM] Rate limit hit — retrying in ${wait / 1000}s (attempt ${attempt + 1}/${RETRY_DELAYS.length})`);
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

module.exports = { callLLM };
