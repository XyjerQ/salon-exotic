// routes/contact.js
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, message } = req.body;
  console.log('Contact form:', name, email, message);
  res.json({ ok: true });
});

module.exports = router;