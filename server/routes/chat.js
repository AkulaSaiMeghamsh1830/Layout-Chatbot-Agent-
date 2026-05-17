const express = require('express');
const router = express.Router();
const { buildSystemPrompt } = require('../prompts/systemPrompt');
const { callLLM } = require('../services/llmService');
const { validateLLMResponse } = require('../utils/jsonValidator');
const { resizeArtboard, getDimensionsForRatio } = require('../services/layoutTransforms');

/**
 * POST /api/chat
 * Body: { message: string, layout: object, history: Array<{role,content}> }
 * Returns: { updatedLayout, assistantMessage, actions }
 */
router.post('/', async (req, res) => {
  const { message, layout, history = [] } = req.body;

  // ── Basic input validation ────────────────────────────────────────────────
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required and must be a string.' });
  }
  if (!layout || typeof layout !== 'object') {
    return res.status(400).json({ error: 'layout is required and must be an object.' });
  }

  // ── Deterministic pre-processing ─────────────────────────────────────────
  // If the request is a simple aspect ratio conversion, handle it with code.
  // Let the LLM handle element repositioning on top of the resized canvas.
  let preProcessedLayout = layout;
  const ratioMatch = message.match(/convert\s+to\s+([\d:]+|story|reel|landscape|portrait|square)/i);
  if (ratioMatch) {
    const dims = getDimensionsForRatio(ratioMatch[1]);
    if (dims) {
      preProcessedLayout = resizeArtboard(layout, dims.width, dims.height);
    }
  }

  // ── Build system prompt ───────────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(preProcessedLayout);

  // ── Call LLM ─────────────────────────────────────────────────────────────
  let llmResult;
  try {
    llmResult = await callLLM(systemPrompt, history, message);
  } catch (err) {
    console.error('[LLM Error]', err.message);
    const isQuota = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('quota');
    if (isQuota) {
      return res.status(429).json({
        error: 'Rate limit reached. Please wait 60 seconds and try again.',
      });
    }
    return res.status(502).json({
      error: 'The AI service failed to respond. Please try again.',
      detail: err.message,
    });
  }

  // ── Validate LLM output ───────────────────────────────────────────────────
  try {
    validateLLMResponse(llmResult);
  } catch (validationErr) {
    console.error('[Validation Error]', validationErr.message);
    console.error('[Raw LLM output]', JSON.stringify(llmResult, null, 2));
    return res.status(422).json({
      error: 'AI returned an invalid layout. Please try rephrasing your instruction.',
      detail: validationErr.message,
    });
  }

  // ── Return to client ──────────────────────────────────────────────────────
  return res.json({
    updatedLayout: llmResult.updatedLayout,
    assistantMessage: llmResult.assistantMessage,
    actions: llmResult.actions || [],
  });
});

module.exports = router;
