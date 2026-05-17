/**
 * Layout transformation utility functions.
 * These handle deterministic math operations so the LLM doesn't have to.
 * These are HELPERS — the LLM may also directly return updated coordinates.
 */

/**
 * Deep-clone a layout safely without mutating the original.
 */
function cloneLayout(layout) {
  return JSON.parse(JSON.stringify(layout));
}

/**
 * Resize the artboard and recompute all child node absolute values
 * from their normalized (nx, ny, nw, nh) coordinates.
 *
 * @param {Object} layout - the full layout JSON
 * @param {number} newWidth - target artboard width in px
 * @param {number} newHeight - target artboard height in px
 * @returns {Object} - updated layout (deep copy)
 */
function resizeArtboard(layout, newWidth, newHeight) {
  const updated = cloneLayout(layout);
  const rootId = updated.rootNodes[0];
  const artboard = updated.nodes[rootId];

  artboard.width = newWidth;
  artboard.height = newHeight;

  artboard.children.forEach((childId) => {
    const node = updated.nodes[childId];
    if (!node) return;

    // Recompute absolute from normalized
    node.x = node.nx * newWidth;
    node.y = node.ny * newHeight;
    node.width = node.nw * newWidth;
    node.height = node.nh * newHeight;

    // Scale font size if node has fontSizeRatio
    if (node.fontSizeRatio && node.style?.visual?.fontSize !== undefined) {
      node.style.visual.fontSize = Math.round(node.fontSizeRatio * newHeight);
    }
  });

  return updated;
}

/**
 * Move a node by semantic position string or absolute x/y.
 *
 * @param {Object} layout
 * @param {string} nodeId
 * @param {{ x?: number, y?: number, position?: string }} opts
 * @returns {Object} updated layout
 */
function moveNode(layout, nodeId, opts = {}) {
  const updated = cloneLayout(layout);
  const rootId = updated.rootNodes[0];
  const artboard = updated.nodes[rootId];
  const node = updated.nodes[nodeId];
  if (!node) return updated;

  const AW = artboard.width;
  const AH = artboard.height;

  let newX = node.x;
  let newY = node.y;

  if (opts.position) {
    switch (opts.position) {
      case 'top':
        newY = 40;
        break;
      case 'bottom':
        newY = AH - node.height - 40;
        break;
      case 'center-v':
        newY = (AH - node.height) / 2;
        break;
      case 'center-h':
        newX = (AW - node.width) / 2;
        break;
      case 'center':
        newX = (AW - node.width) / 2;
        newY = (AH - node.height) / 2;
        break;
      case 'left':
        newX = 40;
        break;
      case 'right':
        newX = AW - node.width - 40;
        break;
      default:
        break;
    }
  }

  if (opts.x !== undefined) newX = opts.x;
  if (opts.y !== undefined) newY = opts.y;

  node.x = newX;
  node.y = newY;
  node.nx = newX / AW;
  node.ny = newY / AH;

  return updated;
}

/**
 * Resize a node by scale factor or absolute width/height.
 *
 * @param {Object} layout
 * @param {string} nodeId
 * @param {{ scale?: number, width?: number, height?: number }} opts
 * @returns {Object} updated layout
 */
function resizeNode(layout, nodeId, opts = {}) {
  const updated = cloneLayout(layout);
  const rootId = updated.rootNodes[0];
  const artboard = updated.nodes[rootId];
  const node = updated.nodes[nodeId];
  if (!node) return updated;

  const AW = artboard.width;
  const AH = artboard.height;

  if (opts.scale) {
    node.width = node.width * opts.scale;
    node.height = node.height * opts.scale;
    if (node.style?.visual?.fontSize) {
      node.style.visual.fontSize = Math.round(node.style.visual.fontSize * opts.scale);
    }
  } else {
    if (opts.width !== undefined) node.width = opts.width;
    if (opts.height !== undefined) node.height = opts.height;
  }

  node.nw = node.width / AW;
  node.nh = node.height / AH;

  return updated;
}

/**
 * Map common ratio strings to dimensions.
 */
const ASPECT_RATIOS = {
  '1:1': { width: 1080, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '16:9': { width: 1920, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  'square': { width: 1080, height: 1080 },
  'portrait': { width: 1080, height: 1350 },
  'landscape': { width: 1920, height: 1080 },
  'story': { width: 1080, height: 1920 },
  'reel': { width: 1080, height: 1920 },
};

/**
 * Get artboard dimensions from a ratio string.
 */
function getDimensionsForRatio(ratioString) {
  const lower = ratioString.toLowerCase().trim();
  return ASPECT_RATIOS[lower] || null;
}

module.exports = {
  cloneLayout,
  resizeArtboard,
  moveNode,
  resizeNode,
  getDimensionsForRatio,
  ASPECT_RATIOS,
};
