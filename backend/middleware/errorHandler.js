/**
 * Централизованный обработчик ошибок Express.
 * Подключается последним через app.use(errorHandler).
 */
function errorHandler(err, req, res, next) {  // eslint-disable-line no-unused-vars
  console.error('[ERROR]', err.message);

  // Ошибки валидации SQLite (нарушение ограничений)
  if (err.message && err.message.includes('SQLITE_CONSTRAINT')) {
    return res.status(400).json({ error: 'Нарушение ограничений базы данных', detail: err.message });
  }

  const status = err.status || 500;
  const message = err.message || 'Внутренняя ошибка сервера';
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
