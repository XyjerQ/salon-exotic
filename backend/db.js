const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config();

const dbFile = path.resolve(process.env.DATABASE_FILE || './data/db.sqlite');

async function init() {
  const db = await open({ filename: dbFile, driver: sqlite3.Database });
  return db;
}

module.exports = { init };