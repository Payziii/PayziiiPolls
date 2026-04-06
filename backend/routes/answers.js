const router = require('express').Router();
const db = require('../db');

// ── POST /api/surveys/:id/answers ─────────────────────────────────────────────
// Сохранить ответы пользователя на опрос
//
// Тело запроса:
// {
//   session_id: "уникальный-токен-сессии",   // обязательно
//   answers: [
//     { question_id: 1, option_id: 3 },        // radio/checkbox — одиночный выбор
//     { question_id: 2, option_ids: [4, 5] },   // checkbox — множественный выбор
//     { question_id: 3, answer_text: "текст" }, // text/scale
//   ]
// }

router.post('/:id/answers', async (req, res, next) => {
  const surveyId = req.params.id;
  const { session_id, answers } = req.body;

  // Валидация входных данных
  if (!session_id || !session_id.trim()) {
    return res.status(400).json({ error: 'Поле session_id обязательно' });
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'Поле answers должно быть непустым массивом' });
  }

  try {
    // Проверяем существование опроса
    const survey = await db.getAsync(
      'SELECT id, is_active, ends_at, max_responses FROM surveys WHERE id = ?',
      [surveyId]
    );
    if (!survey) return res.status(404).json({ error: 'Опрос не найден' });
    if (!survey.is_active) return res.status(403).json({ error: 'Опрос неактивен' });

    // Проверяем не истёк ли срок
    if (survey.ends_at && new Date(survey.ends_at) < new Date()) {
      return res.status(403).json({ error: 'Срок прохождения опроса истёк' });
    }

    // Проверяем лимит ответов
    if (survey.max_responses) {
      const { cnt } = await db.getAsync(
        `SELECT COUNT(DISTINCT session_id) AS cnt FROM answers
         WHERE question_id IN (SELECT id FROM questions WHERE survey_id = ?)`,
        [surveyId]
      );
      if (cnt >= survey.max_responses) {
        return res.status(403).json({ error: 'Достигнут лимит ответов на этот опрос' });
      }
    }

    // Проверяем повторное прохождение
    const alreadyAnswered = await db.getAsync(
      `SELECT 1 FROM answers
       WHERE session_id = ?
         AND question_id IN (SELECT id FROM questions WHERE survey_id = ?)
       LIMIT 1`,
      [session_id.trim(), surveyId]
    );
    if (alreadyAnswered) {
      return res.status(409).json({ error: 'Вы уже проходили этот опрос' });
    }

    // Сохраняем ответы
    for (const ans of answers) {
      const { question_id } = ans;
      if (!question_id) continue;

      // Проверяем, что вопрос принадлежит этому опросу
      const question = await db.getAsync(
        'SELECT id, type FROM questions WHERE id = ? AND survey_id = ?',
        [question_id, surveyId]
      );
      if (!question) continue;

      if (question.type === 'checkbox' && Array.isArray(ans.option_ids)) {
        // Множественный выбор — сохраняем каждый выбранный вариант отдельной записью
        for (const optId of ans.option_ids) {
          await db.runAsync(
            `INSERT INTO answers (question_id, option_id, session_id)
             VALUES (?, ?, ?)`,
            [question_id, optId, session_id.trim()]
          );
        }
      } else if (ans.option_id) {
        // Одиночный выбор (radio)
        await db.runAsync(
          `INSERT INTO answers (question_id, option_id, session_id)
           VALUES (?, ?, ?)`,
          [question_id, ans.option_id, session_id.trim()]
        );
      } else if (ans.answer_text !== undefined) {
        // Текстовый ответ или шкала
        await db.runAsync(
          `INSERT INTO answers (question_id, answer_text, session_id)
           VALUES (?, ?, ?)`,
          [question_id, String(ans.answer_text), session_id.trim()]
        );
      }
    }

    res.status(201).json({ message: 'Ответы сохранены' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
