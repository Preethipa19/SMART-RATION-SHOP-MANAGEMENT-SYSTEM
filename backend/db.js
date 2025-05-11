const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./warehouse.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to SQLite database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        image TEXT,
        price REAL,
        quantity INTEGER,
        expiry_date TEXT,
        product_count INTEGER
    )`);
});

module.exports = db;
