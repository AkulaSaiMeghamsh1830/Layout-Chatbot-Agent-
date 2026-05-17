# Approach Notes

## How I Structured the LLM Prompt

The system prompt in `server/prompts/systemPrompt.js` is injected fresh on every request with the **current layout JSON embedded**. This means the LLM always has complete, up-to-date context — no risk of stale state.

The prompt is structured in sections:
1. **Role definition** — sets the LLM's identity as a layout transformation agent
2. **JSON schema explanation** — explains absolute vs. normalized coordinates and the sync rule
3. **Semantic role dictionary** — teaches the LLM to infer "headline", "badge", "product" from node names and content
4. **Transformation rules** — explicit math rules for when to update nx/ny/nw/nh
5. **Output format** — strict JSON schema with `assistantMessage`, `actions[]`, `updatedLayout`
6. **The layout JSON** — appended at the end so the LLM has complete context

Iterating on the prompt is the highest-leverage activity — 80% of quality comes from here.

---

## How I Handle JSON Transformations Safely

**Hybrid approach: code + LLM.**

- **Deterministic operations** (e.g., aspect ratio conversion) are handled by `layoutTransforms.js` using pure math before the LLM is even called. This guarantees correctness for the most common request type.
- **Semantic operations** (move, resize, recolor specific elements) are delegated to the LLM, which is better at reasoning about *which* element to modify.

The LLM output is validated by `jsonValidator.js` which checks:
- `rootNodes` is a non-empty array
- `nodes` is a valid object
- Every root node exists in `nodes`
- Every non-artboard node has valid numeric `x, y, width, height, nx, ny, nw, nh`

If validation fails, we return a `422` with a clear error message — never corrupting the client's layout state.

Deep cloning (`JSON.parse(JSON.stringify(...))`) is used throughout to prevent mutations.

---

## How I Maintain Conversation Context

The frontend tracks `historyRef` (a `useRef`) containing the last N turns. On each request, the last 6 messages (3 turns) are sent to the backend and forwarded to Claude as `messages[]`.

This lets Claude resolve follow-up references:
- "make it smaller" → last-modified element
- "center it" → the element from the prior exchange

The history is capped at 6 to avoid token bloat on long sessions.

---

## Trade-offs & What I'd Improve

| Trade-off | Current | Better with more time |
|---|---|---|
| LLM reliance | LLM updates all coordinates | Hybrid: LLM returns action specs, code executes them |
| Token cost | Full layout embedded every request | Delta-only updates + layout ID system |
| Validation depth | Structural checks only | Schema-validate every coordinate is in [0,1] range |
| Follow-up tracking | Conversation history only | Track `lastModifiedNodeId` in state for hard reference |
| Error recovery | Return 422, show message | Auto-retry with simplified instruction |
| Preview | Wireframe with real images | HTML Canvas renderer with exact font metrics |
| Streaming | Full response wait | Stream the `assistantMessage` while layout computes |

---

## Key Engineering Decisions

- **Never mutate the input layout** — always deep-clone before transforms
- **Client owns layout state** — server is stateless, layout travels with every request
- **Validate before updating state** — invalid LLM output never reaches `setLayout()`
- **Strip code fences** — LLMs sometimes wrap JSON in \`\`\`json blocks despite instructions
