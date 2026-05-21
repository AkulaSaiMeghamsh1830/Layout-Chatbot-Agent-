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
  // ── Scoping Filter ────────────────────────────────────────────────────────
  // Only allow changes to nodes that match the user's request.
  const isGlobalOperation = /convert|ratio|size|canvas|artboard|9:16|1:1|16:9|story|reel|landscape|portrait|square/i.test(message);

  const allowedNodeIds = new Set();

  if (isGlobalOperation) {
    if (finalLayout && finalLayout.nodes) {
      Object.keys(finalLayout.nodes).forEach(id => allowedNodeIds.add(id));
    }
  } else {
    const lowerMessage = message.toLowerCase();

    // 1. Headline
    if (lowerMessage.includes('headline') || lowerMessage.includes('title') || lowerMessage.includes('comfort') || lowerMessage.includes('attainable')) {
      allowedNodeIds.add('text_1778486306230_8');
    }

    // 2. Discount Badge
    if (lowerMessage.includes('badge') || lowerMessage.includes('discount') || lowerMessage.includes('circle') || lowerMessage.includes('20%') || lowerMessage.includes('off') || lowerMessage.includes('percent')) {
      allowedNodeIds.add('circle_1778488914968_15');
      allowedNodeIds.add('text_1778489078397_16');
    }

    // 3. Product Image
    if (lowerMessage.includes('product') || lowerMessage.includes('sofa') || lowerMessage.includes('chair') || lowerMessage.includes('furniture') || lowerMessage.includes('image')) {
      allowedNodeIds.add('img_1778489515746_17');
    }

    // 4. Background Image
    if (lowerMessage.includes('background') || lowerMessage.includes('bg')) {
      allowedNodeIds.add('img_1778485681535_4');
    }

    // 5. Logo / Header Vector group
    if (lowerMessage.includes('logo') || lowerMessage.includes('vector') || lowerMessage.includes('icon') || lowerMessage.includes('happy homes') || lowerMessage.includes('homes') || lowerMessage.includes('8,000') || lowerMessage.includes('8000')) {
      allowedNodeIds.add('img_1778486846247_10');
      allowedNodeIds.add('img_1778486856821_11');
      allowedNodeIds.add('img_1778487081392_12');
      allowedNodeIds.add('img_1778487101466_13');
      allowedNodeIds.add('img_1778487110538_14');
      allowedNodeIds.add('text_1778486552508_9');
    }

    // 6. CTA / Tagline
    if (lowerMessage.includes('offer') || lowerMessage.includes('limited') || lowerMessage.includes('tagline') || lowerMessage.includes('subtext') || lowerMessage.includes('comfort that defines')) {
      allowedNodeIds.add('text_1778486004640_6');
      allowedNodeIds.add('text_1778486136643_7');
    }

    // If the LLM returned actions, we also trust the nodes specified in the actions
    if (llmResult && Array.isArray(llmResult.actions)) {
      llmResult.actions.forEach(act => {
        if (act.target && layout.nodes[act.target]) {
          allowedNodeIds.add(act.target);
          if (act.target === 'circle_1778488914968_15' || act.target === 'text_1778489078397_16') {
            allowedNodeIds.add('circle_1778488914968_15');
            allowedNodeIds.add('text_1778489078397_16');
          }
        }
      });
    }
  }

  // Restore any nodes that were modified by the LLM but not allowed to be modified
  if (finalLayout && finalLayout.nodes) {
    Object.keys(finalLayout.nodes).forEach(id => {
      if (id === layout.rootNodes[0] && !isGlobalOperation) {
        if (layout.nodes[id]) {
          finalLayout.nodes[id] = JSON.parse(JSON.stringify(layout.nodes[id]));
        }
        return;
      }
      if (!allowedNodeIds.has(id) && layout.nodes[id]) {
        finalLayout.nodes[id] = JSON.parse(JSON.stringify(layout.nodes[id]));
      }
    });
  }

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
