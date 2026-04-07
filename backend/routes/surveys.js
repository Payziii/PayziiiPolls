const router = require('express').Router();
const db = require('../db');

// ── GET /api/surveys ──────────────────────────────────────────────────────────
// Список всех опросов (для администратора) или опросы пользователя
router.get('/', async (req, res, next) => {
  try {
    const { creator_id } = req.query;
    let query = `SELECT id, title, description, is_active, starts_at, ends_at,
              max_responses, creator_id, created_at
       FROM surveys`;
    const params = [];

    if (creator_id) {
      query += ` WHERE creator_id = ?`;
      params.push(creator_id);
    }

    query += ` ORDER BY created_at DESC`;

    let surveys = await db.allAsync(query, params);
    
    // Calculate actual active status based on current date and time window
    const now = new Date().toISOString();
    surveys = surveys.map((survey) => ({
      ...survey,
      is_active: survey.is_active === 1 &&
        (!survey.starts_at || survey.starts_at <= now) &&
        (!survey.ends_at || survey.ends_at >= now) ? 1 : 0
    }));
    
    res.json(surveys);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/surveys/active ───────────────────────────────────────────────────
// Только активные опросы (для публичной страницы)
router.get('/active', async (req, res, next) => {
  try {
    const now = new Date().toISOString();
    const surveys = await db.allAsync(
      `SELECT id, title, description, starts_at, ends_at, max_responses, created_at
       FROM surveys
       WHERE is_active = 1
         AND (starts_at IS NULL OR starts_at <= ?)
         AND (ends_at   IS NULL OR ends_at   >= ?)
       ORDER BY created_at DESC`,
      [now, now]
    );
    res.json(surveys);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/surveys/:id ──────────────────────────────────────────────────────
// Получить опрос с вопросами и вариантами ответов
router.get('/:id', async (req, res, next) => {
  try {
    const survey = await db.getAsync(
      'SELECT * FROM surveys WHERE id = ?',
      [req.params.id]
    );
    if (!survey) return res.status(404).json({ error: 'Опрос не найден' });

    // Calculate actual active status based on current date and time window
    const now = new Date();
    const nowIso = now.toISOString();
    
    let availabilityReason = null; // null = available, otherwise explain why not
    
    if (survey.is_active === 0) {
      availabilityReason = 'disabled';
    } else if (survey.starts_at && new Date(survey.starts_at) > now) {
      availabilityReason = 'not_started';
    } else if (survey.ends_at && new Date(survey.ends_at) < now) {
      availabilityReason = 'ended';
    }
    
    const isActuallyActive = availabilityReason === null;
    
    const questions = await db.allAsync(
      'SELECT * FROM questions WHERE survey_id = ? ORDER BY order_num',
      [survey.id]
    );

    for (const q of questions) {
      if (q.type === 'radio' || q.type === 'checkbox') {
        q.options = await db.allAsync(
          'SELECT * FROM options WHERE question_id = ?',
          [q.id]
        );
      } else {
        q.options = [];
      }
    }

    res.json({ 
      ...survey, 
      questions, 
      is_active: isActuallyActive ? 1 : 0,
      availabilityReason 
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/surveys ─────────────────────────────────────────────────────────
// Создать новый опрос
router.post('/', async (req, res, next) => {
  const { title, description, questions = [], starts_at, ends_at, max_responses, creator_id } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Поле title обязательно' });
  }

  try {
    // Вставляем опрос
    const { lastID: surveyId } = await db.runAsync(
      `INSERT INTO surveys (title, description, starts_at, ends_at, max_responses, creator_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title.trim(), description || '', starts_at || null, ends_at || null, max_responses || null, creator_id || 'anonymous']
    );

    // Вставляем вопросы
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text || !q.type) continue;

      const { lastID: qId } = await db.runAsync(
        `INSERT INTO questions (survey_id, text, type, is_required, order_num)
         VALUES (?, ?, ?, ?, ?)`,
        [surveyId, q.text.trim(), q.type, q.is_required ? 1 : 0, i]
      );

      // Вставляем варианты ответов для radio/checkbox
      if ((q.type === 'radio' || q.type === 'checkbox') && Array.isArray(q.options)) {
        for (const opt of q.options) {
          const optText = typeof opt === 'string' ? opt : opt.text;
          if (optText && optText.trim()) {
            await db.runAsync(
              'INSERT INTO options (question_id, text) VALUES (?, ?)',
              [qId, optText.trim()]
            );
          }
        }
      }
    }

    res.status(201).json({ id: surveyId, message: 'Опрос создан' });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/surveys/:id ──────────────────────────────────────────────────────
// Обновить метаданные опроса (без вопросов)
router.put('/:id', async (req, res, next) => {
  const { title, description, is_active, starts_at, ends_at, max_responses } = req.body;

  try {
    const survey = await db.getAsync('SELECT id FROM surveys WHERE id = ?', [req.params.id]);
    if (!survey) return res.status(404).json({ error: 'Опрос не найден' });

    await db.runAsync(
      `UPDATE surveys
       SET title         = COALESCE(?, title),
           description   = COALESCE(?, description),
           is_active     = COALESCE(?, is_active),
           starts_at     = ?,
           ends_at       = ?,
           max_responses = ?
       WHERE id = ?`,
      [
        title || null,
        description !== undefined ? description : null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        starts_at || null,
        ends_at || null,
        max_responses || null,
        req.params.id
      ]
    );

    res.json({ message: 'Опрос обновлён' });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/surveys/:id ───────────────────────────────────────────────────
// Удалить опрос (каскадно удаляет вопросы, варианты, ответы)
router.delete('/:id', async (req, res, next) => {
  try {
    const { changes } = await db.runAsync(
      'DELETE FROM surveys WHERE id = ?',
      [req.params.id]
    );
    if (!changes) return res.status(404).json({ error: 'Опрос не найден' });
    res.json({ message: 'Опрос удалён' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
