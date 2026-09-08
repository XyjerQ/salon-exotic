const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

router.post('/', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!isValidEmail(email) || email.length > 254) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  const db = req.app.get('db');

  try {
    await db.run(
      `INSERT INTO newsletter_subscribers (email, active) VALUES (?, 1)
       ON CONFLICT(email) DO UPDATE SET active = 1`,
      [email]
    );

    let emailSent = false;
    const transporter = createTransporter();

    if (transporter) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'You are on the Salon Exotic list',
        text: 'Thanks for subscribing to Salon Exotic updates. We will let you know about new arrivals and drive events.',
        html: '<p>Thanks for subscribing to Salon Exotic updates.</p><p>We will let you know about new arrivals and drive events.</p>'
      });
      emailSent = true;
    }

    res.status(201).json({ ok: true, emailSent });
  } catch (err) {
    console.error('Newsletter subscription failed:', err);
    res.status(500).json({ error: 'Unable to subscribe right now' });
  }
});

module.exports = router;