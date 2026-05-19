const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(
  './db/appointments.db'
);

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId TEXT,
      doctor TEXT,
      date TEXT
    )
  `);

});

module.exports = db;