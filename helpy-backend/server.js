require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { initPool } = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve static frontend (Зассан хэсэг 1: Шууд тухайн хавтсаасаа унших)
app.use(express.static(__dirname));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api', require('./routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// SPA fallback (Зассан хэсэг 2 ба 3: '*' тэмдэг болон index.html-ийн замыг зассан)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Start ───────────────────────────────────────────────────────────────────
async function start() {
  try {
    await initPool();
    app.listen(PORT, () => {
      console.log(`🚀 Helpy Invoice Server: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Server start error:', err.message);
    process.exit(1);
  }
}

start();