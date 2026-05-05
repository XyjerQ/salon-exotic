// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const auth = require('../middleware/auth');
const SECRET = process.env.JWT_SECRET || 'changeme';

const isAdmin = (req) => req.user?.role === 'admin';

router.post('/register', auth, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' });

  const db = req.app.get('db');
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const hash = await bcrypt.hash(password, 10);

  try {
    const result = await db.run(
      'INSERT INTO employees (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name || '', email, hash, 'sales']
    );
    const user = { id: result.lastID, name, email, role: 'sales' };
    const token = jwt.sign(user, SECRET);
    res.json({ user, token });
  } catch (e) {
    res.status(400).json({ error: 'Email already used' });
  }
});

router.post('/login', async (req, res) => {
  const db = req.app.get('db');
  const { email, password } = req.body;
  const row = await db.get('SELECT * FROM employees WHERE email = ?', [email]);
  if (!row) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const user = { id: row.id, name: row.name, email: row.email, role: row.role };
  const token = jwt.sign(user, SECRET);
  res.json({ user, token });
});

module.exports = router;