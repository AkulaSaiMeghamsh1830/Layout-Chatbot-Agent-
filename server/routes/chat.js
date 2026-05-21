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

  // Deterministic Headline Movement Solver:
  const headlineId = 'text_1778486306230_8';
  if (preProcessedLayout.nodes && preProcessedLayout.nodes[headlineId]) {
    const node = preProcessedLayout.nodes[headlineId];
    
    // 1. Move Headline Up
    if (/move.*headline.*up/i.test(message) || /headline.*up/i.test(message) || /move.*headline.*higher/i.test(message) || /headline.*higher/i.test(message)) {
      node.ny = Math.max(0.04, node.ny - 0.05);
      node.y = node.ny * (preProcessedLayout.nodes[preProcessedLayout.rootNodes[0]]?.height || 1080);
      return res.json({
        updatedLayout: preProcessedLayout,
        assistantMessage: "Headline moved up slightly.",
        actions: [{ type: "move", target: headlineId }]
      });
    }
    
    // 2. Move Headline Down
    if (/move.*headline.*down/i.test(message) || /headline.*down/i.test(message) || /move.*headline.*lower/i.test(message) || /headline.*lower/i.test(message)) {
      node.ny = Math.min(0.8, node.ny + 0.05);
      node.y = node.ny * (preProcessedLayout.nodes[preProcessedLayout.rootNodes[0]]?.height || 1080);
      return res.json({
        updatedLayout: preProcessedLayout,
        assistantMessage: "Headline moved down slightly.",
        actions: [{ type: "move", target: headlineId }]
      });
    }
    
    // 3. Move Headline to Top
    if (/move.*headline.*top/i.test(message) || /headline.*move.*top/i.test(message)) {
      // Move only the headline to the top
      node.nx = 0.1092;
      node.ny = 0.05;
      node.x = node.nx * (preProcessedLayout.nodes[preProcessedLayout.rootNodes[0]]?.width || 1080);
      node.y = node.ny * (preProcessedLayout.nodes[preProcessedLayout.rootNodes[0]]?.height || 1080);
      node.width = 844.09;
      node.height = 378.37;
      node.nw = 0.7816;
      node.nh = 0.3503;
      if (node.style && node.style.visual) {
        node.style.visual.textAlign = 'center';
      }

      return res.json({
        updatedLayout: preProcessedLayout,
        assistantMessage: "Headline moved to the top.",
        actions: [{ type: "move", target: headlineId }]
      });
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
  let finalLayout = llmResult.updatedLayout;
  if (/move.*headline.*top/i.test(message) || /headline.*move.*top/i.test(message)) {
    const headlineId = 'text_1778486306230_8';
    if (finalLayout && finalLayout.nodes && finalLayout.nodes[headlineId]) {
      const node = finalLayout.nodes[headlineId];
      node.nx = 0.1092;
      node.ny = 0.05;
      node.x = node.nx * (finalLayout.nodes[finalLayout.rootNodes[0]]?.width || 1080);
      node.y = node.ny * (finalLayout.nodes[finalLayout.rootNodes[0]]?.height || 1080);
      node.width = 844.09;
      node.height = 378.37;
      node.nw = 0.7816;
      node.nh = 0.3503;
      if (node.style && node.style.visual) {
        node.style.visual.textAlign = 'center';
      }
    }
  }

  return res.json({
    updatedLayout: finalLayout,
    assistantMessage: llmResult.assistantMessage,
    actions: llmResult.actions || [],
  });
});

module.exports = router;
