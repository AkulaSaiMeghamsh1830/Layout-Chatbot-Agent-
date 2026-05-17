require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const chatRoute = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' })); // Layout JSON can be large

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/chat', chatRoute);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', model: 'llama-3.3-70b-versatile (Groq)', timestamp: new Date().toISOString() });
});

// ── Serve React frontend (production build) ──────────────────────────────────
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Layout Agent Backend running on http://localhost:${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/api/health`);
  console.log(`   Chat:    POST http://localhost:${PORT}/api/chat\n`);
});
