// routes/employees.js
const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user?.role === 'admin';

// Upload setup
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'employee-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Invalid file type'));
  }
});

router.get('/', auth, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' });

  const db = req.app.get('db');
  const rows = await db.all(
    'SELECT id, name, email, phone, role, description, specialization, photo_path FROM employees'
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
    'SELECT id, name, email, phone, role, description, specialization, photo_path FROM employees WHERE id = ?',
    [id]
  );
  if (!row) return res.status(404).json({ error: 'Not found' });

  res.json(row);
});

// admin dodaje pracownika
router.post('/', auth, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' });

  const db = req.app.get('db');
  const { name, email, password, phone, description, specialization, photo_path } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email/password' });
  }

  const hash = await bcrypt.hash(password, 10);

  try {
    const result = await db.run(
      `INSERT INTO employees (name, email, password_hash, phone, role, description, specialization, photo_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name || '',
        email,
        hash,
        phone || null,
        'sales',
        description || null,
        specialization || null,
        photo_path || null
      ]
    );

    const employee = await db.get(
      'SELECT id, name, email, phone, role, description, specialization, photo_path FROM employees WHERE id = ?',
      [result.lastID]
    );
    res.status(201).json(employee);
  } catch {
    res.status(400).json({ error: 'Email already used' });
  }
});

// admin edytuje pracownika lub pracownik edytuje siebie
router.put('/:id', auth, async (req, res) => {
  const db = req.app.get('db');
  const id = Number(req.params.id);
  
  // pracownik może edytować tylko siebie, admin może edytować każdego
  if (!isAdmin(req) && req.user.id !== id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const existing = await db.get('SELECT * FROM employees WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const {
    name,
    email,
    description,
    specialization,
    phone,
    photo_path,
    currentPassword,
    newPassword,
    confirmNewPassword
  } = req.body;

  let password_hash = existing.password_hash;

  if (newPassword || confirmNewPassword || currentPassword) {
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required' });
    }
    if (!newPassword || !confirmNewPassword) {
      return res.status(400).json({ error: 'Please enter the new password twice' });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    const ok = await bcrypt.compare(currentPassword, existing.password_hash);
    if (!ok) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    password_hash = await bcrypt.hash(newPassword, 10);
  }

  try {
    await db.run(
      `UPDATE employees
       SET name=?, email=?, phone=?, description=?, specialization=?, photo_path=?, password_hash=?
       WHERE id=?`,
      [
        name ?? existing.name,
        email ?? existing.email,
        phone ?? existing.phone,
        description ?? existing.description,
        specialization ?? existing.specialization,
        photo_path ?? existing.photo_path,
        password_hash,
        id
      ]
    );

    const employee = await db.get(
      'SELECT id, name, email, phone, role, description, specialization, photo_path FROM employees WHERE id = ?',
      [id]
    );
    res.json(employee);
  } catch {
    res.status(400).json({ error: 'Email already used' });
  }
});

// Upload zdjęcia pracownika
router.post('/:id/upload-photo', auth, upload.single('photo'), async (req, res) => {
  const db = req.app.get('db');
  const id = Number(req.params.id);
  
  // pracownik może wgrać tylko swoje zdjęcie, admin może wgrać każdemu
  if (!isAdmin(req) && req.user.id !== id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const photo_path = `/uploads/${req.file.filename}`;

  try {
    await db.run(
      'UPDATE employees SET photo_path = ? WHERE id = ?',
      [photo_path, id]
    );

    const employee = await db.get(
      'SELECT id, name, email, phone, role, description, specialization, photo_path FROM employees WHERE id = ?',
      [id]
    );
    res.json({ message: 'Photo uploaded', employee });
  } catch {
    res.status(400).json({ error: 'Failed to update photo' });
  }
});

module.exports = router;