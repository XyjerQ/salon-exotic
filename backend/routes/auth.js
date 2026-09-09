// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const auth = require('../middleware/auth');
const SECRET = process.env.JWT_SECRET;

const isAdmin = (req) => req.user?.role === 'admin';

async function getUserWithPermissions(db, employee) {
  const role = await db.get('SELECT id, name FROM roles WHERE id = ?', [employee.role_id]);
  const permissions = role
    ? await db.all(
        `SELECT p.key FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         WHERE rp.role_id = ?`,
        [role.id]
      )
    : [];
  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: role?.name || employee.role,
    role_id: role?.id || null,
    permissions: permissions.map((permission) => permission.key)
  };
}

router.post('/register', auth, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' });

  const db = req.app.get('db');
  const { name, email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || password.length < 8) {
    return res.status(400).json({ error: 'Email and a password of at least 8 characters are required' });
  }
  const hash = await bcrypt.hash(password, 10);

  try {
    const result = await db.run(
      'INSERT INTO employees (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [typeof name === 'string' ? name.trim() : '', email.trim().toLowerCase(), hash, 'sales']
    );
    await db.run('UPDATE employees SET role_id = (SELECT id FROM roles WHERE name = ?) WHERE id = ?', ['sales', result.lastID]);
    const user = await getUserWithPermissions(db, await db.get('SELECT * FROM employees WHERE id = ?', [result.lastID]));
    const token = jwt.sign(user, SECRET, { expiresIn: '8h' });
    res.json({ user, token });
  } catch (e) {
    res.status(400).json({ error: 'Email already used' });
  }
});

router.post('/login', async (req, res) => {
  const db = req.app.get('db');
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const row = await db.get('SELECT * FROM employees WHERE email = ?', [email.trim().toLowerCase()]);
  if (!row) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const user = await getUserWithPermissions(db, row);
  const token = jwt.sign(user, SECRET, { expiresIn: '8h' });
  res.json({ user, token });
});

module.exports = router;