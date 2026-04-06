const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'survey.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Ошибка подключения к БД:', err.message);
    process.exit(1);
  }
  console.log('Подключение к SQLite установлено:', DB_PATH);
});

// Включаем поддержку внешних ключей
db.run('PRAGMA foreign_keys = ON');
db.run('PRAGMA journal_mode = WAL');

// Создаём таблицы если не существуют
const initSQL = `
  CREATE TABLE IF NOT EXISTS surveys (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT    NOT NULL,
    description   TEXT    DEFAULT '',
    is_active     INTEGER DEFAULT 1,
    starts_at     TEXT    DEFAULT NULL,
    ends_at       TEXT    DEFAULT NULL,
    max_responses INTEGER DEFAULT NULL,
    created_at    TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS questions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    survey_id   INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    text        TEXT    NOT NULL,
    type        TEXT    NOT NULL CHECK(type IN ('radio','checkbox','text','scale')),
    is_required INTEGER DEFAULT 1,
    order_num   INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS options (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    text        TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS answers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_id   INTEGER DEFAULT NULL REFERENCES options(id) ON DELETE SET NULL,
    answer_text TEXT    DEFAULT NULL,
    session_id  TEXT    NOT NULL,
    answered_at TEXT    DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_questions_survey  ON questions(survey_id);
  CREATE INDEX IF NOT EXISTS idx_options_question  ON options(question_id);
  CREATE INDEX IF NOT EXISTS idx_answers_question  ON answers(question_id);
  CREATE INDEX IF NOT EXISTS idx_answers_session   ON answers(session_id);
`;

// sqlite3 не поддерживает exec с несколькими операторами через run,
// поэтому выполняем каждый оператор отдельно
db.serialize(() => {
  initSQL.split(';').forEach(sql => {
    const trimmed = sql.trim();
    if (trimmed) {
      db.run(trimmed + ';', (err) => {
        if (err) console.error('Ошибка инициализации БД:', err.message, '\nSQL:', trimmed);
      });
    }
  });
  console.log('Таблицы БД инициализированы');
});

// Вспомогательные промисы-обёртки над callback API sqlite3

/** Вернуть одну строку */
db.getAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });

/** Вернуть все строки */
db.allAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

/** Выполнить INSERT / UPDATE / DELETE, вернуть { lastID, changes } */
db.runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

module.exports = db;
