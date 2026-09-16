// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const { init } = require('./db');
const authRoutes = require('./routes/auth');
const carsRoutes = require('./routes/cars');
const employeesRoutes = require('./routes/employees');
const contactRoutes = require('./routes/contact');
const newsletterRoutes = require('./routes/newsletter');
const testDrivesRouter = require('./routes/testDrives');
const messagesRoutes = require('./routes/messages');
const settingsRoutes = require('./routes/settings');
const faqRoutes = require('./routes/faq');
const rolesRoutes = require('./routes/roles');
const transactionHistoryRoutes = require('./routes/transactionHistory');

const app = express();
const PORT = process.env.PORT || 4000;
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './public/uploads');
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'changeme') {
  throw new Error('JWT_SECRET must be set to a strong value in backend/.env');
}

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' }
});

const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again later.' }
});

app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadDir));
app.use('/api/auth/login', loginLimiter);
app.use('/api/test-drives', publicFormLimiter, testDrivesRouter);
app.use('/api/contact', publicFormLimiter, contactRoutes);
app.use('/api/newsletter', publicFormLimiter, newsletterRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/faq', faqRoutes);
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ensure upload dir exists
fs.mkdirSync(uploadDir, { recursive: true });

const frontendPublicDir = path.resolve(__dirname, '../salon-exotic/public');
app.use(express.static(frontendPublicDir));

// init DB and attach to req
init().then(db => {
  app.set('db', db);

  // routers
  app.use('/api/auth', authRoutes);
  app.use('/api/cars', carsRoutes);
  app.use('/api/employees', employeesRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/roles', rolesRoutes);
  app.use('/api/transaction-history', transactionHistoryRoutes);

  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Uploaded file is too large' });
    }
    if (err.message?.includes('images are allowed')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Unhandled API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('DB init error', err);
  process.exit(1);
});