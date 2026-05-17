/**
 * Validates that a layout JSON has the required shape.
 * Throws descriptive errors so the UI can display them clearly.
 */
function validateLayout(layout) {
  if (!layout || typeof layout !== 'object') {
    throw new Error('Layout must be a non-null object.');
  }

  if (!Array.isArray(layout.rootNodes) || layout.rootNodes.length === 0) {
    throw new Error('Layout must have a non-empty "rootNodes" array.');
  }

  if (!layout.nodes || typeof layout.nodes !== 'object') {
    throw new Error('Layout must have a "nodes" object.');
  }

  for (const rootId of layout.rootNodes) {
    if (!layout.nodes[rootId]) {
      throw new Error(`Root node "${rootId}" referenced in rootNodes but not found in nodes.`);
    }
  }

  // Validate each node has required coordinate fields
  for (const [id, node] of Object.entries(layout.nodes)) {
    if (node.type !== 'artboard') {
      const requiredFields = ['x', 'y', 'width', 'height', 'nx', 'ny', 'nw', 'nh'];
      for (const field of requiredFields) {
        if (typeof node[field] !== 'number') {
          throw new Error(
            `Node "${id}" is missing or has invalid field "${field}" (expected number, got ${typeof node[field]}).`
          );
        }
      }
    }
  }

  return true;
}

/**
 * Validates the LLM response structure.
 */
function validateLLMResponse(response) {
  if (!response || typeof response !== 'object') {
    throw new Error('LLM response is not an object.');
  }

  if (typeof response.assistantMessage !== 'string') {
    throw new Error('LLM response missing "assistantMessage" string field.');
  }

  if (!response.updatedLayout || typeof response.updatedLayout !== 'object') {
    throw new Error('LLM response missing "updatedLayout" object field.');
  }

  // Validate the embedded layout
  validateLayout(response.updatedLayout);

  return true;
}

module.exports = { validateLayout, validateLLMResponse };
