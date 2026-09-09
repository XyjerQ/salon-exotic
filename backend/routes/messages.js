const express = require('express');
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/auth');

const router = express.Router();
const requireManager = (req, res, next) => {
  if (!hasPermission(req, 'messages.view') && !hasPermission(req, 'messages.reply')) return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};

const requireReplyPermission = (req, res, next) => {
  if (!hasPermission(req, 'messages.reply')) return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};

const getMailer = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
};

router.get('/', auth, requireManager, async (req, res) => {
  try {
    const messages = await req.app.get('db').all('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json(messages);
  } catch (err) {
    console.error('Messages fetch failed:', err);
    res.status(500).json({ error: 'Unable to load messages' });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  if (!hasPermission(req, 'messages.view')) return res.status(403).json({ error: 'Insufficient permissions' });
  const allowedStatuses = new Set(['new', 'in_progress', 'resolved']);
  const status = typeof req.body.status === 'string' ? req.body.status : '';
  if (!allowedStatuses.has(status)) return res.status(400).json({ error: 'Invalid message status' });

  try {
    const db = req.app.get('db');
    const result = await db.run('UPDATE contacts SET status = ? WHERE id = ?', [status, Number(req.params.id)]);
    if (!result.changes) return res.status(404).json({ error: 'Message not found' });
    res.json({ ok: true, status });
  } catch (err) {
    console.error('Message status update failed:', err);
    res.status(500).json({ error: 'Unable to update message status' });
  }
});

router.put('/:id', auth, requireReplyPermission, async (req, res) => {
  const reply = typeof req.body.reply === 'string' ? req.body.reply.trim() : '';
  if (reply.length < 2 || reply.length > 5000) {
    return res.status(400).json({ error: 'Reply must be between 2 and 5000 characters' });
  }

  const db = req.app.get('db');
  const id = Number(req.params.id);
  const message = await db.get('SELECT * FROM contacts WHERE id = ?', [id]);
  if (!message) return res.status(404).json({ error: 'Message not found' });

  try {
    await db.run(
      `UPDATE contacts SET reply = ?, replied_at = CURRENT_TIMESTAMP, replied_by = ?, status = 'resolved' WHERE id = ?`,
      [reply, req.user.id, id]
    );

    const transporter = getMailer();
    if (!transporter) {
      return res.status(503).json({ error: 'SMTP email is not configured. Reply was saved in the database.' });
    }

    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: message.email,
      subject: `Re: ${message.subject}`,
      text: `Hello ${message.name},\n\n${reply}\n\nBest regards,\nBlackline Salon.`
    });

    res.json({ ok: true, emailSent: true });
  } catch (err) {
    console.error('Message reply failed:', err);
    res.status(500).json({ error: 'Reply was saved, but email could not be sent' });
  }
});

module.exports = router;