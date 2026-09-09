const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();
const isAdminOrManager = (req) => ['admin', 'manager'].includes(req.user?.role);

const getFaq = async (db) => {
  const categories = await db.all('SELECT * FROM faq_categories ORDER BY sort_order, id');
  const questions = await db.all('SELECT * FROM faq_questions ORDER BY sort_order, id');
  return categories.map((category) => ({
    id: category.id,
    category: category.name,
    icon: category.icon,
    questions: questions
      .filter((question) => question.category_id === category.id)
      .map((question) => ({ id: question.id, q: question.question, a: question.answer }))
  }));
};

const validateQuestion = (question, answer) => {
  if (typeof question !== 'string' || question.trim().length < 3 || question.trim().length > 500) {
    return 'Question must be between 3 and 500 characters';
  }
  if (typeof answer !== 'string' || answer.trim().length < 3 || answer.trim().length > 5000) {
    return 'Answer must be between 3 and 5000 characters';
  }
  return null;
};

router.get('/', async (req, res) => {
  try {
    res.json(await getFaq(req.app.get('db')));
  } catch (err) {
    console.error('FAQ fetch failed:', err);
    res.status(500).json({ error: 'Unable to load FAQ' });
  }
});

router.post('/categories', auth, async (req, res) => {
  if (!isAdminOrManager(req)) return res.status(403).json({ error: 'Admin or Manager only' });
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const icon = typeof req.body.icon === 'string' ? req.body.icon.trim() : '';
  if (name.length < 2 || name.length > 120) return res.status(400).json({ error: 'Category name must be between 2 and 120 characters' });

  try {
    const result = await req.app.get('db').run(
      'INSERT INTO faq_categories (name, icon, sort_order) VALUES (?, ?, COALESCE((SELECT MAX(sort_order) + 1 FROM faq_categories), 0))',
      [name, icon]
    );
    res.status(201).json({ id: result.lastID, category: name, icon, questions: [] });
  } catch (err) {
    res.status(500).json({ error: 'Unable to create FAQ category' });
  }
});

router.delete('/categories/:id', auth, async (req, res) => {
  if (!isAdminOrManager(req)) return res.status(403).json({ error: 'Admin or Manager only' });
  try {
    const result = await req.app.get('db').run('DELETE FROM faq_categories WHERE id = ?', [Number(req.params.id)]);
    if (!result.changes) return res.status(404).json({ error: 'FAQ category not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('FAQ category delete failed:', err);
    res.status(500).json({ error: 'Unable to delete FAQ category' });
  }
});

router.post('/', auth, async (req, res) => {
  if (!isAdminOrManager(req)) return res.status(403).json({ error: 'Admin or Manager only' });
  const categoryId = Number(req.body.category_id);
  const validationError = validateQuestion(req.body.question, req.body.answer);
  if (!Number.isInteger(categoryId) || categoryId < 1) return res.status(400).json({ error: 'A valid category is required' });
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const db = req.app.get('db');
    const category = await db.get('SELECT id FROM faq_categories WHERE id = ?', [categoryId]);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    const result = await db.run(
      'INSERT INTO faq_questions (category_id, question, answer, sort_order) VALUES (?, ?, ?, COALESCE((SELECT MAX(sort_order) + 1 FROM faq_questions WHERE category_id = ?), 0))',
      [categoryId, req.body.question.trim(), req.body.answer.trim(), categoryId]
    );
    res.status(201).json({ id: result.lastID, category_id: categoryId, q: req.body.question.trim(), a: req.body.answer.trim() });
  } catch (err) {
    res.status(500).json({ error: 'Unable to create FAQ question' });
  }
});

router.put('/:id', auth, async (req, res) => {
  if (!isAdminOrManager(req)) return res.status(403).json({ error: 'Admin or Manager only' });
  const validationError = validateQuestion(req.body.question, req.body.answer);
  if (validationError) return res.status(400).json({ error: validationError });
  try {
    const result = await req.app.get('db').run(
      'UPDATE faq_questions SET question = ?, answer = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [req.body.question.trim(), req.body.answer.trim(), Number(req.params.id)]
    );
    if (!result.changes) return res.status(404).json({ error: 'FAQ question not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Unable to update FAQ question' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  if (!isAdminOrManager(req)) return res.status(403).json({ error: 'Admin or Manager only' });
  try {
    const result = await req.app.get('db').run('DELETE FROM faq_questions WHERE id = ?', [Number(req.params.id)]);
    if (!result.changes) return res.status(404).json({ error: 'FAQ question not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Unable to delete FAQ question' });
  }
});

module.exports = router;