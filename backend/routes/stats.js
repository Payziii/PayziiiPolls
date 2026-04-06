const router = require('express').Router();
const db = require('../db');

// ── GET /api/surveys/:id/stats ────────────────────────────────────────────────
// Получить агрегированную статистику ответов по опросу
router.get('/:id/stats', async (req, res, next) => {
  try {
    const survey = await db.getAsync('SELECT * FROM surveys WHERE id = ?', [req.params.id]);
    if (!survey) return res.status(404).json({ error: 'Опрос не найден' });

    // Общее число уникальных участников
    const { respondents } = await db.getAsync(
      `SELECT COUNT(DISTINCT session_id) AS respondents
       FROM answers
       WHERE question_id IN (SELECT id FROM questions WHERE survey_id = ?)`,
      [req.params.id]
    ) || { respondents: 0 };

    const questions = await db.allAsync(
      'SELECT * FROM questions WHERE survey_id = ? ORDER BY order_num',
      [req.params.id]
    ) || [];

    const stats = [];

    for (const q of questions) {
      const questionStat = {
        id:          q.id,
        text:        q.text,
        type:        q.type,
        is_required: q.is_required,
        total:       0,
        data:        [],
      };

      if (q.type === 'radio' || q.type === 'checkbox') {
        // Подсчёт по вариантам ответов
        const options = await db.allAsync(
          'SELECT * FROM options WHERE question_id = ?',
          [q.id]
        );

        const counts = await db.allAsync(
          `SELECT option_id, COUNT(*) AS cnt
           FROM answers
           WHERE question_id = ? AND option_id IS NOT NULL
           GROUP BY option_id`,
          [q.id]
        );

        const countMap = {};
        counts.forEach(c => { countMap[c.option_id] = c.cnt; });

        const total = counts.reduce((sum, c) => sum + c.cnt, 0);
        questionStat.total = total;

        questionStat.data = options.map(o => ({
          option_id:   o.id,
          option_text: o.text,
          count:       countMap[o.id] || 0,
          percent:     total > 0 ? Math.round(((countMap[o.id] || 0) / total) * 100) : 0,
        }));

      } else if (q.type === 'scale') {
        // Числовая шкала (NPS 0–10)
        const rows = await db.allAsync(
          `SELECT answer_text, COUNT(*) AS cnt
           FROM answers
           WHERE question_id = ? AND answer_text IS NOT NULL
           GROUP BY answer_text`,
          [q.id]
        );

        const total = rows.reduce((sum, r) => sum + r.cnt, 0);
        questionStat.total = total;

        // Распределение по значениям
        questionStat.data = rows.map(r => ({
          value:   parseInt(r.answer_text, 10),
          count:   r.cnt,
          percent: total > 0 ? Math.round((r.cnt / total) * 100) : 0,
        })).sort((a, b) => a.value - b.value);

        // Средний балл
        if (total > 0) {
          const sumVal = rows.reduce((s, r) => s + parseInt(r.answer_text, 10) * r.cnt, 0);
          questionStat.average = Math.round((sumVal / total) * 10) / 10;
        }

        // NPS-расчёт: промоутеры 9–10, нейтралы 7–8, критики 0–6
        if (total > 0) {
          const promoters  = rows.filter(r => parseInt(r.answer_text) >= 9).reduce((s, r) => s + r.cnt, 0);
          const detractors = rows.filter(r => parseInt(r.answer_text) <= 6).reduce((s, r) => s + r.cnt, 0);
          questionStat.nps = Math.round(((promoters - detractors) / total) * 100);
          questionStat.nps_breakdown = {
            promoters:  { count: promoters,  percent: Math.round((promoters  / total) * 100) },
            neutrals:   { count: total - promoters - detractors, percent: Math.round(((total - promoters - detractors) / total) * 100) },
            detractors: { count: detractors, percent: Math.round((detractors / total) * 100) },
          };
        }

      } else if (q.type === 'text') {
        // Текстовые ответы — возвращаем массив
        const rows = await db.allAsync(
          `SELECT answer_text, answered_at
           FROM answers
           WHERE question_id = ? AND answer_text IS NOT NULL
           ORDER BY answered_at DESC`,
          [q.id]
        );
        questionStat.total = rows.length;
        questionStat.data  = rows;
      }

      stats.push(questionStat);
    }

    res.json({
      survey:       { id: survey.id, title: survey.title, description: survey.description },
      respondents:  respondents || 0,
      questions:    stats,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/surveys/:id/export ───────────────────────────────────────────────
// Экспорт всех ответов в CSV
router.get('/:id/export', async (req, res, next) => {
  try {
    const survey = await db.getAsync('SELECT * FROM surveys WHERE id = ?', [req.params.id]);
    if (!survey) return res.status(404).json({ error: 'Опрос не найден' });

    const rows = await db.allAsync(
      `SELECT
         a.session_id,
         a.answered_at,
         q.text       AS question_text,
         q.type       AS question_type,
         o.text       AS option_text,
         a.answer_text
       FROM answers a
       JOIN questions q ON q.id = a.question_id
       LEFT JOIN options o ON o.id = a.option_id
       WHERE q.survey_id = ?
       ORDER BY a.session_id, q.order_num, a.id`,
      [req.params.id]
    );

    // Строим CSV вручную (без внешних зависимостей)
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = ['session_id', 'answered_at', 'question_text', 'question_type', 'answer'];
    const lines = [headers.join(',')];

    for (const row of rows) {
      const answer = row.option_text || row.answer_text || '';
      lines.push([
        escapeCSV(row.session_id),
        escapeCSV(row.answered_at),
        escapeCSV(row.question_text),
        escapeCSV(row.question_type),
        escapeCSV(answer),
      ].join(','));
    }

    // BOM для корректного открытия в Excel
    const csv = '\uFEFF' + lines.join('\r\n');
    const filename = `survey_${survey.id}_export.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
