const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'appointments.db'), (err) => {
  if (err) console.error('Database connection failed', err);
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patient_id TEXT,
      doctor TEXT,
      date TEXT
    )
  `);
});

module.exports = db;