const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs/promises');
require('dotenv').config();
const { ensureSeedData, ensureCarSchemaExtras } = require('./seed');

const dbFile = path.resolve(process.env.DATABASE_FILE || './data/db.sqlite');
const sqlFile = path.resolve(__dirname, './migrations/init.sql');

async function init() {
  await fs.mkdir(path.dirname(dbFile), { recursive: true });

  const db = await open({ filename: dbFile, driver: sqlite3.Database });
  await db.exec('PRAGMA foreign_keys = ON;');
  const sql = await fs.readFile(sqlFile, 'utf8');
  await db.exec(sql);
  const contactColumns = await db.all('PRAGMA table_info(contacts)');
  const existingContactColumns = new Set(contactColumns.map(column => column.name));
  const contactColumnMigrations = [
    ['subject', "ALTER TABLE contacts ADD COLUMN subject TEXT NOT NULL DEFAULT 'General Inquiry'"],
    ['reply', 'ALTER TABLE contacts ADD COLUMN reply TEXT'],
    ['replied_at', 'ALTER TABLE contacts ADD COLUMN replied_at DATETIME'],
    ['replied_by', 'ALTER TABLE contacts ADD COLUMN replied_by INTEGER']
  ];
  for (const [column, migration] of contactColumnMigrations) {
    if (!existingContactColumns.has(column)) await db.exec(migration);
  }
  await ensureCarSchemaExtras(db);
  await ensureSeedData(db);
  return db;
}

module.exports = { init };