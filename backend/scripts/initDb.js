const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const dbFile = path.resolve(process.env.DATABASE_FILE || path.join(__dirname, '../data/db.sqlite'));
const sqlFile = path.resolve(__dirname, '../migrations/init.sql');

// Upewnij się, że katalog na DB istnieje
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const sql = fs.readFileSync(sqlFile, 'utf8');

const db = new sqlite3.Database(dbFile, err => {
  if (err) {
    console.error('Błąd otwarcia DB:', err);
    process.exit(1);
  }
  db.exec(sql, execErr => {
    if (execErr) {
      console.error('Błąd wykonania migracji:', execErr);
      process.exit(1);
    }
    console.log('Migracje wykonane pomyślnie — plik DB:', dbFile);
    db.close();
  });
});