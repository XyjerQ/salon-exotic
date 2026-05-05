// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const { init } = require('./db');
const authRoutes = require('./routes/auth');
const carsRoutes = require('./routes/cars');
const employeesRoutes = require('./routes/employees');
const contactRoutes = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 4000;
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './public/uploads');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

// ensure upload dir exists
fs.mkdirSync(uploadDir, { recursive: true });

// init DB and attach to req
init().then(db => {
  app.set('db', db);

  // routers
  app.use('/api/auth', authRoutes);
  app.use('/api/cars', carsRoutes);
  app.use('/api/employees', employeesRoutes);
  app.use('/api/contact', contactRoutes);

  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('DB init error', err);
  process.exit(1);
});