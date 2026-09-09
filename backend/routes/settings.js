const express = require('express');
const auth = require('../middleware/auth');
const { DEFAULT_SITE_SETTINGS } = require('../seed');

const router = express.Router();
const editableKeys = Object.keys(DEFAULT_SITE_SETTINGS);

const isAdminOrManager = (req) => ['admin', 'manager'].includes(req.user?.role);

router.get('/', async (req, res) => {
  try {
    const rows = await req.app.get('db').all('SELECT key, value FROM site_settings');
    const settings = { ...DEFAULT_SITE_SETTINGS };
    rows.forEach(({ key, value }) => {
      if (editableKeys.includes(key)) settings[key] = value || '';
    });
    res.json(settings);
  } catch (err) {
    console.error('Site settings fetch failed:', err);
    res.status(500).json({ error: 'Unable to load site settings' });
  }
});

router.put('/', auth, async (req, res) => {
  if (!isAdminOrManager(req)) return res.status(403).json({ error: 'Admin or Manager only' });

  const updates = {};
  for (const key of editableKeys) {
    if (typeof req.body[key] === 'string') {
      const value = req.body[key].trim();
      if (value.length > 500) return res.status(400).json({ error: `${key} is too long` });
      if (key.endsWith('_url') && value) {
        try {
          const url = new URL(value);
          if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
        } catch {
          return res.status(400).json({ error: `${key} must be a valid http(s) URL` });
        }
      }
      updates[key] = value;
    }
  }

  try {
    const db = req.app.get('db');
    for (const [key, value] of Object.entries(updates)) {
      await db.run(
        `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        [key, value]
      );
    }
    const rows = await db.all('SELECT key, value FROM site_settings');
    const settings = { ...DEFAULT_SITE_SETTINGS };
    rows.forEach(({ key, value }) => {
      if (editableKeys.includes(key)) settings[key] = value || '';
    });
    res.json(settings);
  } catch (err) {
    console.error('Site settings save failed:', err);
    res.status(500).json({ error: 'Unable to save site settings' });
  }
});

module.exports = router;