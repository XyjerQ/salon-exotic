// routes/contact.js
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const db = req.app.get('db');
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : null;
  const subject = typeof req.body.subject === 'string' ? req.body.subject.trim() : 'General Inquiry';
  const vehicleName = typeof req.body.vehicle_name === 'string' ? req.body.vehicle_name.trim() : null;
  const vehicleVin = typeof req.body.vehicle_vin === 'string' ? req.body.vehicle_vin.trim() : null;

  if (name.length < 2 || name.length > 120) {
    return res.status(400).json({ error: 'Name must be between 2 and 120 characters' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  if (message.length < 10 || message.length > 5000) {
    return res.status(400).json({ error: 'Message must be between 10 and 5000 characters' });
  }
  if (subject.length < 2 || subject.length > 120) {
    return res.status(400).json({ error: 'Subject must be between 2 and 120 characters' });
  }

  try {
    const result = await db.run(
      'INSERT INTO contacts (name, email, phone, subject, vehicle_name, vehicle_vin, message) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, subject, vehicleName, vehicleVin, message]
    );
    res.status(201).json({ ok: true, id: result.lastID });
  } catch (err) {
    console.error('Contact form save failed:', err);
    res.status(500).json({ error: 'Unable to save contact request' });
  }
});

module.exports = router;