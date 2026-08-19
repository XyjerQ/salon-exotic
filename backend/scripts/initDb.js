const { init } = require('../db');

init()
  .then(async (db) => {
    await db.close();
    console.log('Database initialized and seeded successfully');
  })
  .catch((err) => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  });