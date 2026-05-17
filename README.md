# Layout Agent

> An AI-powered design layout transformation system. Modify design layouts using plain English — powered by Gemini (Google).

---

## What it does

Layout Agent lets you talk to your design canvas. Send natural language instructions like *"Convert to 9:16"*, *"Move the headline to the top"*, or *"Make the discount badge bigger"* — and watch the layout JSON and wireframe preview update in real time.

---

## Prerequisites

- **Node.js v18+**
- **npm v9+**
- A **Google Gemini API key** → [aistudio.google.com](https://aistudio.google.com)

---

## Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd layout-agent

# 2. Set up the backend
cd server
cp .env .env.local          # or just edit .env directly
# → Set GEMINI_API_KEY=your_key_here in .env
npm install
npm start                   # runs on http://localhost:3001

# 3. Set up the frontend (new terminal)
cd ../client
npm install
npm run dev                 # runs on http://localhost:5173
```

---

## Example Prompts to Try

| Instruction | What it does |
|---|---|
| `"Convert to 9:16"` | Resize artboard to 1080×1920, reflow all elements |
| `"Move the headline to the top"` | Repositions the main title text |
| `"Make the discount badge bigger"` | Scales up the circle + 20% OFF text |
| `"Change the badge color to coral"` | Recolors the yellow offer circle |
| `"Center the product image"` | Horizontally centers Product.png |
| `"Make the headline font smaller"` | Reduces fontSize on the largest text |
| `"make it bigger"` (follow-up) | Uses conversation context — resizes last target |

---

## Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | React + Vite | Fast dev server, component model |
| Styling | Vanilla CSS | Full control, zero dependencies |
| Backend | Node.js + Express | Handles LLM calls securely |
| LLM | Google Gemini 2.5 Flash | Natural language reasoning |
| HTTP client | Axios | Simple, reliable |
| State | React useState + useRef | Chat history + layout state |

---

## Project Structure

```
layout-agent/
├── server/
│   ├── index.js                  # Express entry
│   ├── routes/chat.js            # POST /api/chat
│   ├── prompts/systemPrompt.js   # LLM system prompt builder
│   ├── services/
│   │   ├── llmService.js         # Gemini API call
│   │   └── layoutTransforms.js   # Deterministic math helpers
│   └── utils/jsonValidator.js    # Output validation
└── client/
    └── src/
        ├── App.jsx               # Main layout (2-column)
        ├── App.css               # Premium dark design system
        ├── data/initialLayout.json
        ├── hooks/useLayoutAgent.js
        └── components/
            ├── ChatWindow.jsx
            ├── ChatInput.jsx
            ├── WireframePreview.jsx
            └── JsonViewer.jsx
```
