const express = require('express');
const db = require('../db');

const router = express.Router();

// Get all products
router.get('/', (req, res) => {
  db.all(`SELECT * FROM products`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add new product
router.post('/add', (req, res) => {
  if (!req.session.user || req.session.user.email !== 'admin@example.com') {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }

  const { title, image, price, quantity, expiry_date, product_count } = req.body;

  db.run(`INSERT INTO products (title, image, price, quantity, expiry_date, product_count) 
          VALUES (?, ?, ?, ?, ?, ?)`,
    [title, image, price, quantity, expiry_date, product_count],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: 'Product added successfully', id: this.lastID });
    }
  );
});

// Update product stock
router.put('/update/:id', (req, res) => {
  if (!req.session.user || req.session.user.email !== 'admin@example.com') {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }

  const { quantity, product_count } = req.body;
  const { id } = req.params;

  db.run(`UPDATE products SET quantity = ?, product_count = ? WHERE id = ?`,
    [quantity, product_count, id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: 'Product updated successfully' });
    }
  );
});

module.exports = router;
