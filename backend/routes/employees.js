// routes/employees.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user?.role === 'admin';

router.get('/', auth, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' });

  const db = req.app.get('db');
  const rows = await db.all(
    'SELECT id, name, email, role, description, specialization FROM employees'
  );
  res.json(rows);
});

router.get('/:id', auth, async (req, res) => {
  const db = req.app.get('db');
  const id = Number(req.params.id);

  // admin widzi każdego, pracownik tylko siebie
  if (!isAdmin(req) && req.user.id !== id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const row = await db.get(
    'SELECT id, name, email, role, description, specialization FROM employees WHERE id = ?',
    [id]
  );
  if (!row) return res.status(404).json({ error: 'Not found' });

  res.json(row);
});

// admin dodaje pracownika
router.post('/', auth, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' });

  const db = req.app.get('db');
  const { name, email, password, description, specialization } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email/password' });
  }

  const hash = await bcrypt.hash(password, 10);

  try {
    const result = await db.run(
      `INSERT INTO employees (name, email, password_hash, role, description, specialization)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name || '',
        email,
        hash,
        'sales',
        description || null,
        specialization || null
      ]
    );

    const employee = await db.get(
      'SELECT id, name, email, role, description, specialization FROM employees WHERE id = ?',
      [result.lastID]
    );
    res.status(201).json(employee);
  } catch {
    res.status(400).json({ error: 'Email already used' });
  }
});

// admin edytuje pracownika
router.put('/:id', auth, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' });

  const db = req.app.get('db');
  const id = Number(req.params.id);
  const existing = await db.get('SELECT * FROM employees WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { name, email, description, specialization, password } = req.body;

  let password_hash = existing.password_hash;
  if (password) password_hash = await bcrypt.hash(password, 10);

  try {
    await db.run(
      `UPDATE employees
       SET name=?, email=?, role=?, description=?, specialization=?, password_hash=?
       WHERE id=?`,
      [
        name ?? existing.name,
        email ?? existing.email,
        existing.role,
        description ?? existing.description,
        specialization ?? existing.specialization,
        password_hash,
        id
      ]
    );

    const employee = await db.get(
      'SELECT id, name, email, role, description, specialization FROM employees WHERE id = ?',
      [id]
    );
    res.json(employee);
  } catch {
    res.status(400).json({ error: 'Email already used' });
  }
});

module.exports = router;