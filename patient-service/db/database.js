const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./db/patients.db', (err) => {
  if (err) {
    console.log(err.message);
  } else {
    console.log("Patient DB connected");

    db.run(`
      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        age INTEGER
      )
    `);
  }
});

module.exports = db;