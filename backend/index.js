const express = require('express');
const cors    = require('cors');
const path    = require('path');

const surveysRouter = require('./routes/surveys');
const answersRouter = require('./routes/answers');
const statsRouter   = require('./routes/stats');
const errorHandler  = require('./middleware/errorHandler');

// Инициализируем БД при старте
require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Логируем каждый запрос в dev-режиме
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// ── Маршруты API ───────────────────────────────────────────────────────────────
app.use('/api/surveys', surveysRouter);
app.use('/api/surveys', answersRouter);
app.use('/api/surveys', statsRouter);

// ── Статика (клиент Vue в продакшене) ─────────────────────────────────────────
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// ── Обработчик ошибок — ПОСЛЕДНИМ ─────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
  console.log('API доступно по префиксу /api/surveys');
});
