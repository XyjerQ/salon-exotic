// routes/testDrives.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/auth');

const isAdminOrManager = (req) => req.user?.role === 'admin' || req.user?.role === 'manager';

// Pomocnicza funkcja do walidacji daty (czy nie jest z przeszłości)
const isValidFutureDate = (dateString) => {
  if (!dateString) return false;
  const selectedDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  return selectedDate >= today;
};

// Pomocnicza funkcja do walidacji e-maila
const isValidEmail = (email) => {
  if (!email) return true; // Email opcjonalny
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 1. TWORZENIE ZGŁOSZENIA JAZDY PRÓBNEJ (Klient rezerwuje bez wybranego auta -> car_id = null)
router.post('/', async (req, res) => {
  const db = req.app.get('db');
  const { name, phone, email, date } = req.body;

  if (!name || !phone || !date) {
    return res.status(400).json({ error: 'Missing required fields (name, phone, date)' });
  }

  // Walidacja długości imienia i telefonu
  if (name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters long' });
  }
  if (phone.trim().length < 7) {
    return res.status(400).json({ error: 'Please enter a valid phone number' });
  }

  // Walidacja e-maila (jeśli podano)
  if (email && !isValidEmail(email.trim())) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Walidacja daty (czy nie jest w przeszłości)
  if (!isValidFutureDate(date)) {
    return res.status(400).json({ error: 'Test drive date cannot be in the past' });
  }

  try {
    const result = await db.run(
      `INSERT INTO test_drives (customer_name, customer_phone, customer_email, requested_date, car_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        phone.trim(),
        email ? email.trim() : '',
        date,
        null, 
        'pending'
      ]
    );

    // Pobieramy utworzone zgłoszenie wraz z danymi auta (które będą nullami, co obsłuży frontend)
    const newTestDrive = await db.get(`
      SELECT td.*, c.make, c.model, c.year 
      FROM test_drives td
      LEFT JOIN cars c ON td.car_id = c.id
      WHERE td.id = ?
    `, [result.lastID]);

    res.status(201).json(newTestDrive);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while saving test drive' });
  }
});

// 2. POBRANIE LISTY ZGŁOSZEŃ (Dla personelu)
router.get('/', auth, async (req, res) => {
  if (!hasPermission(req, 'test_drives.view')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const db = req.app.get('db');
  try {
    const rows = await db.all(`
      SELECT td.*, c.make, c.model, c.year 
      FROM test_drives td
      LEFT JOIN cars c ON td.car_id = c.id
      ORDER BY td.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. EDYCJA / POTWIERDZENIE ZGŁOSZENIA (Admin / Manager)
router.put('/:id', auth, async (req, res) => {
  if (!hasPermission(req, 'test_drives.manage')) {
    return res.status(403).json({ error: 'Admin or Manager only' });
  }

  const db = req.app.get('db');
  const id = Number(req.params.id);
  const { status, notes, car_id, customer_name, customer_phone, customer_email, requested_date } = req.body;

  const existing = await db.get('SELECT * FROM test_drives WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  // Walidacja wymaganych pól przy edycji (jeśli zostały przesłane)
  const finalName = customer_name !== undefined ? customer_name.trim() : existing.customer_name;
  const finalPhone = customer_phone !== undefined ? customer_phone.trim() : existing.customer_phone;
  const finalEmail = customer_email !== undefined ? customer_email.trim() : existing.customer_email;
  const targetDate = requested_date !== undefined ? requested_date : existing.requested_date;

  if (!finalName || !finalPhone || !targetDate) {
    return res.status(400).json({ error: 'Name, phone and date cannot be empty' });
  }

  if (finalName.length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters long' });
  }

  if (finalPhone.length < 7) {
    return res.status(400).json({ error: 'Please enter a valid phone number' });
  }

  if (finalEmail && !isValidEmail(finalEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Walidacja daty
  if (targetDate && !isValidFutureDate(targetDate)) {
    return res.status(400).json({ error: 'Test drive date cannot be in the past' });
  }

  // Sprawdzenie poprawności przypisywanego samochodu
  if (car_id) {
    const car = await db.get('SELECT * FROM cars WHERE id = ?', [Number(car_id)]);
    if (!car) {
      return res.status(400).json({ error: 'Selected car does not exist' });
    }

    if (car.is_customer_vehicle || car.type === 'customer' || car.owner_type === 'customer') {
      return res.status(400).json({ error: 'Cannot assign a customer vehicle for a test drive!' });
    }
  }

  try {
    await db.run(
      `UPDATE test_drives 
       SET status = ?, notes = ?, car_id = ?, customer_name = ?, customer_phone = ?, customer_email = ?, requested_date = ? 
       WHERE id = ?`,
      [
        status ?? existing.status,
        notes !== undefined ? notes : existing.notes,
        car_id !== undefined ? (car_id ? Number(car_id) : null) : existing.car_id,
        finalName,
        finalPhone,
        finalEmail,
        targetDate,
        id
      ]
    );

    const updated = await db.get(`
      SELECT td.*, c.make, c.model, c.year 
      FROM test_drives td
      LEFT JOIN cars c ON td.car_id = c.id
      WHERE td.id = ?
    `, [id]);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to update test drive' });
  }
});

// 4. USUNIĘCIE ZGŁOSZENIA
router.delete('/:id', auth, async (req, res) => {
  if (!hasPermission(req, 'test_drives.manage')) {
    return res.status(403).json({ error: 'Admin or Manager only' });
  }

  const db = req.app.get('db');
  const id = Number(req.params.id);

  const existing = await db.get('SELECT * FROM test_drives WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  try {
    await db.run('DELETE FROM test_drives WHERE id = ?', [id]);
    res.json({ message: 'Test drive deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete test drive' });
  }
});

module.exports = router;