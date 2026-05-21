const app = require('./app');
const path = require('path');
const express = require('express');

const PORT = process.env.PORT || 3001;

// ── Serve React frontend (production build) ──────────────────────────────────
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get(/.*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Layout Agent Backend running on http://localhost:${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/api/health`);
  console.log(`   Chat:    POST http://localhost:${PORT}/api/chat\n`);
});
