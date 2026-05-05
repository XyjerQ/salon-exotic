const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const auth = require('../middleware/auth');

const uploadDir = path.resolve(process.env.UPLOAD_DIR || './public/uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

const isAdmin = (req) => req.user?.role === 'admin';
const canManageCars = (req) => req.user?.role === 'admin' || req.user?.role === 'sales';

router.get('/', async (req, res) => {
  const db = req.app.get('db');
  const { q, advisor_id, minPrice, maxPrice, featured } = req.query;
  let sql = 'SELECT * FROM cars WHERE 1=1';
  const params = [];

  if (q) {
    sql += ' AND (make LIKE ? OR model LIKE ? OR description LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (advisor_id) {
    sql += ' AND advisor_id = ?';
    params.push(advisor_id);
  }
  if (minPrice) {
    sql += ' AND price >= ?';
    params.push(minPrice);
  }
  if (maxPrice) {
    sql += ' AND price <= ?';
    params.push(maxPrice);
  }
  if (featured) {
    sql += ' AND featured = ?';
    params.push(featured === 'true' || featured === '1' ? 1 : 0);
  }

  const rows = await db.all(sql, params);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const db = req.app.get('db');
  const car = await db.get('SELECT * FROM cars WHERE id = ?', [req.params.id]);
  if (!car) return res.status(404).json({ error: 'Not found' });
  res.json(car);
});

router.post('/', auth, upload.single('image'), async (req, res) => {
  if (!canManageCars(req)) {
    return res.status(403).json({ error: 'Only sales/admin can manage cars' });
  }

  const db = req.app.get('db');
  const { make, model, year, price, description, featured } = req.body;
  const image_path = req.file ? `/uploads/${path.basename(req.file.path)}` : null;

  // Pracownik zawsze dostaje siebie jako advisor.
  // Admin może wskazać advisor_id ręcznie.
  const advisor_id = isAdmin(req)
    ? (req.body.advisor_id ?? req.user.id)
    : req.user.id;

  // Tylko admin może ustawić featured
  const isFeatured = isAdmin(req) && featured ? 1 : 0;

  const result = await db.run(
    'INSERT INTO cars (make, model, year, price, description, image_path, advisor_id, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [make, model, year, price, description, image_path, advisor_id, isFeatured]
  );

  const car = await db.get('SELECT * FROM cars WHERE id = ?', [result.lastID]);
  res.status(201).json(car);
});

router.put('/:id', auth, upload.single('image'), async (req, res) => {
  if (!canManageCars(req)) {
    return res.status(403).json({ error: 'Only sales/admin can manage cars' });
  }

  const db = req.app.get('db');
  const existing = await db.get('SELECT * FROM cars WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  // sales może edytować tylko swoje auto
  if (!isAdmin(req) && existing.advisor_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { make, model, year, price, description, featured } = req.body;
  const image_path = req.file ? `/uploads/${path.basename(req.file.path)}` : null;

  // sales nie może przepinać advisora; admin może
  const advisor_id = isAdmin(req)
    ? (req.body.advisor_id ?? existing.advisor_id)
    : existing.advisor_id;

  // Tylko admin może zmieniać featured
  const isFeatured = isAdmin(req) && featured !== undefined ? (featured ? 1 : 0) : existing.featured;

  await db.run(
    'UPDATE cars SET make=?, model=?, year=?, price=?, description=?, image_path=COALESCE(?, image_path), advisor_id=?, featured=? WHERE id=?',
    [
      make ?? existing.make,
      model ?? existing.model,
      year ?? existing.year,
      price ?? existing.price,
      description ?? existing.description,
      image_path,
      advisor_id,
      isFeatured,
      req.params.id
    ]
  );

  const car = await db.get('SELECT * FROM cars WHERE id = ?', [req.params.id]);
  res.json(car);
});

router.delete('/:id', auth, async (req, res) => {
  if (!canManageCars(req)) {
    return res.status(403).json({ error: 'Only sales/admin can manage cars' });
  }

  const db = req.app.get('db');
  const existing = await db.get('SELECT * FROM cars WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  // sales może usuwać tylko swoje auto
  if (!isAdmin(req) && existing.advisor_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await db.run('DELETE FROM cars WHERE id = ?', [req.params.id]);
  res.status(204).end();
});

module.exports = router;