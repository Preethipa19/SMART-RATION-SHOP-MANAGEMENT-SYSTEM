const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const db = new sqlite3.Database("./warehouse.db");

app.use(cors());
app.use(express.json());

const JWT_SECRET = "your_jwt_secret_key"; // Change this in production

// 📌 Create Tables
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS shops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            contactNumber TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            price REAL NOT NULL,
            quantity INTEGER NOT NULL,
            expiryDate TEXT,
            shopId INTEGER NOT NULL,
            barcode TEXT,
            location TEXT,  
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shopId) REFERENCES shops(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            productId INTEGER,
            shopId INTEGER,
            title TEXT,
            price REAL,
            quantitySold INTEGER,
            totalCost REAL,
            saleDate TEXT,
            customerName TEXT,
            paymentMethod TEXT,
            FOREIGN KEY (productId) REFERENCES products (id),
            FOREIGN KEY (shopId) REFERENCES shops (id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS shop_transfers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fromShopId INTEGER NOT NULL,
            toShopId INTEGER NOT NULL,
            productId INTEGER NOT NULL,
            productName TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unitPrice REAL NOT NULL,
            totalValue REAL NOT NULL,
            notes TEXT,
            transferredBy INTEGER NOT NULL,
            transferDate TEXT DEFAULT CURRENT_TIMESTAMP,
            fromShopLocation TEXT,
            toShopLocation TEXT,
            FOREIGN KEY (fromShopId) REFERENCES shops (id),
            FOREIGN KEY (toShopId) REFERENCES shops (id),
            FOREIGN KEY (productId) REFERENCES products (id),
            FOREIGN KEY (transferredBy) REFERENCES shops (id)
        )
    `);
});

// 🔒 Authentication Middleware
const authenticateShop = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.shop = decoded;
        next();
    } catch (err) {
        res.status(400).json({ error: "Invalid token." });
    }
};

// 🏪 Shop Registration
app.post("/api/shops/register", async (req, res) => {
    const { name, location, email, password, contactNumber } = req.body;
    
    if (!name || !location || !email || !password) {
        return res.status(400).json({ 
            error: "Validation failed",
            details: {
                name: !name ? "Shop name is required" : null,
                location: !location ? "Location is required" : null,
                email: !email ? "Email is required" : null,
                password: !password ? "Password is required" : null
            }
        });
    }

    try {
        db.get("SELECT id FROM shops WHERE email = ?", [email], async (err, shop) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database error" });
            }
            if (shop) return res.status(400).json({ error: "Shop already exists" });

            const hashedPassword = await bcrypt.hash(password, 10);

            db.run(
                "INSERT INTO shops (name, location, email, password, contactNumber) VALUES (?, ?, ?, ?, ?)",
                [name, location, email, hashedPassword, contactNumber],
                function (err) {
                    if (err) {
                        console.error("Database error:", err);
                        return res.status(500).json({ error: "Failed to create shop" });
                    }
                    
                    const token = jwt.sign(
                        { id: this.lastID, name, email },
                        JWT_SECRET,
                        { expiresIn: '24h' }
                    );

                    res.status(201).json({
                        id: this.lastID,
                        name,
                        email,
                        location,
                        contactNumber,
                        token
                    });
                }
            );
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 🔑 Shop Login
app.post("/api/shops/login", async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ 
            error: "Validation failed",
            details: {
                email: !email ? "Email is required" : null,
                password: !password ? "Password is required" : null
            }
        });
    }

    try {
        db.get("SELECT * FROM shops WHERE email = ?", [email], async (err, shop) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database error" });
            }
            if (!shop) return res.status(404).json({ error: "Shop not found" });

            const validPassword = await bcrypt.compare(password, shop.password);
            if (!validPassword) return res.status(400).json({ error: "Invalid password" });

            const token = jwt.sign(
                { id: shop.id, name: shop.name, email: shop.email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                id: shop.id,
                name: shop.name,
                email: shop.email,
                location: shop.location,
                contactNumber: shop.contactNumber,
                token
            });
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 📌 Get All Products (Shop-specific)if
app.get("/api/products", authenticateShop, (req, res) => {
    db.all(
        "SELECT * FROM products WHERE shopId = ? ORDER BY title",
        [req.shop.id],
        (err, rows) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to fetch products" });
            }
            res.json(rows);
        }
    );
});

// 📌 Add a Product (Shop-specific)
// 📌 Add a Product (Shop-specific)
app.post("/api/products", authenticateShop, (req, res) => {
    const { title, price, quantity, expiryDate, barcode } = req.body;
    const shopId = req.shop.id;
    const email = req.shop.email; // Get the email from the JWT payload
    
    // Check if the user is admin
    if (email !== 'admin@example.com') {
        return res.status(403).json({ error: "Access denied. Only admin can add products." });
    }
    
    // Validation
    const errors = {};
    if (!title) errors.title = "Product name is required";
    if (!price || isNaN(price)) errors.price = "Valid price is required";
    if (!quantity || isNaN(quantity)) errors.quantity = "Valid quantity is required";

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ 
            error: "Validation failed",
            details: errors
        });
    }

    // Insert product into database
    db.run(
        "INSERT INTO products (title, price, quantity, expiryDate, shopId, barcode) VALUES (?, ?, ?, ?, ?, ?)",
        [title, parseFloat(price), parseInt(quantity), expiryDate, shopId, barcode],
        function (err) {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to add product" });
            }
            
            // Fetch and return the created product
            db.get(
                "SELECT * FROM products WHERE id = ?",
                [this.lastID],
                (err, product) => {
                    if (err) {
                        console.error("Database error:", err);
                        return res.status(500).json({ error: "Failed to fetch created product" });
                    }
                    res.status(201).json(product);
                }
            );
        }
    );
});


// 📌 Update a Product (Shop-specific)
app.put("/api/products/:id", authenticateShop, (req, res) => {
    const { id } = req.params;
    const { title, price, quantity, expiryDate, barcode } = req.body;
    const shopId = req.shop.id;

    const errors = {};
    if (!title) errors.title = "Product name is required";
    if (!price || isNaN(price)) errors.price = "Valid price is required";
    if (!quantity || isNaN(quantity)) errors.quantity = "Valid quantity is required";
    
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ 
            error: "Validation failed",
            details: errors
        });
    }

    db.get(
        "SELECT id FROM products WHERE id = ? AND shopId = ?",
        [id, shopId],
        (err, product) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database error" });
            }
            if (!product) return res.status(404).json({ error: "Product not found or not owned by your shop" });

            db.run(
                "UPDATE products SET title = ?, price = ?, quantity = ?, expiryDate = ?, barcode = ? WHERE id = ?",
                [title, parseFloat(price), parseInt(quantity), expiryDate, barcode, id],
                function (err) {
                    if (err) {
                        console.error("Database error:", err);
                        return res.status(500).json({ error: "Failed to update product" });
                    }
                    
                    db.get(
                        "SELECT * FROM products WHERE id = ?",
                        [id],
                        (err, updatedProduct) => {
                            if (err) {
                                console.error("Database error:", err);
                                return res.status(500).json({ error: "Failed to fetch updated product" });
                            }
                            res.json(updatedProduct);
                        }
                    );
                }
            );
        }
    );
});

// 📌 Delete a Product (Shop-specific)
app.delete("/api/products/:id", authenticateShop, (req, res) => {
    const { id } = req.params;
    const shopId = req.shop.id;

    db.get(
        "SELECT id FROM products WHERE id = ? AND shopId = ?",
        [id, shopId],
        (err, product) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database error" });
            }
            if (!product) return res.status(404).json({ error: "Product not found or not owned by your shop" });

            db.run(
                "DELETE FROM products WHERE id = ?",
                [id],
                function (err) {
                    if (err) {
                        console.error("Database error:", err);
                        return res.status(500).json({ error: "Failed to delete product" });
                    }
                    res.json({ success: true, message: "Product deleted successfully" });
                }
            );
        }
    );
});

// 📌 Record a Sale (Shop-specific)
app.post("/api/sales", authenticateShop, (req, res) => {
    const { productId, quantitySold, customerName = "Anonymous", paymentMethod = "Cash" } = req.body;
    const shopId = req.shop.id;
    
    const errors = {};
    if (!productId) errors.productId = "Product selection is required";
    if (!quantitySold || isNaN(quantitySold)) errors.quantitySold = "Valid quantity is required";
    
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ 
            error: "Validation failed",
            details: errors
        });
    }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        db.get(
            "SELECT * FROM products WHERE id = ? AND shopId = ?",
            [productId, shopId],
            (err, product) => {
                if (err) {
                    console.error("Database error:", err);
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: "Database error" });
                }

                if (!product) {
                    db.run("ROLLBACK");
                    return res.status(404).json({ error: "Product not found or not owned by your shop" });
                }

                if (product.quantity < quantitySold) {
                    db.run("ROLLBACK");
                    return res.status(400).json({ 
                        error: "Insufficient stock",
                        currentStock: product.quantity
                    });
                }

                const totalCost = product.price * quantitySold;
                const updatedQuantity = product.quantity - quantitySold;
                const saleDate = new Date().toISOString();

                db.run(
                    "UPDATE products SET quantity = ? WHERE id = ?",
                    [updatedQuantity, productId],
                    function(err) {
                        if (err) {
                            console.error("Database error:", err);
                            db.run("ROLLBACK");
                            return res.status(500).json({ error: "Failed to update product stock" });
                        }

                        db.run(
                            `INSERT INTO sales (
                                productId, shopId, title, price, quantitySold, 
                                totalCost, saleDate, customerName, paymentMethod
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                productId, shopId, product.title, product.price, quantitySold,
                                totalCost, saleDate, customerName, paymentMethod
                            ],
                            function(err) {
                                if (err) {
                                    console.error("Database error:", err);
                                    db.run("ROLLBACK");
                                    return res.status(500).json({ error: "Failed to record sale" });
                                }

                                db.run("COMMIT");
                                res.json({
                                    success: true,
                                    saleId: this.lastID,
                                    product: {
                                        id: productId,
                                        newQuantity: updatedQuantity
                                    },
                                    sale: {
                                        id: this.lastID,
                                        productId,
                                        shopId,
                                        title: product.title,
                                        price: product.price,
                                        quantitySold,
                                        totalCost,
                                        saleDate,
                                        customerName,
                                        paymentMethod
                                    }
                                });
                            }
                        );
                    }
                );
            }
        );
    });
});

// 📌 Get Sales History (Shop-specific)
app.get("/api/sales", authenticateShop, (req, res) => {
    const shopId = req.shop.id;
    
    db.all(
        `SELECT sales.*, products.quantity AS remainingStock 
         FROM sales 
         JOIN products ON sales.productId = products.id 
         WHERE sales.shopId = ?
         ORDER BY sales.saleDate DESC`,
        [shopId],
        (err, rows) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to fetch sales history" });
            }
            res.json(rows);
        }
    );
});

// 📌 Get Sales with Shop Information (Shop-specific)
app.get("/api/sales-with-shop", authenticateShop, (req, res) => {
    db.all(
        `SELECT 
            sales.*, 
            products.title AS productTitle,
            shops.name AS shopName
         FROM sales
         JOIN products ON sales.productId = products.id
         JOIN shops ON sales.shopId = shops.id
         WHERE sales.shopId = ?
         ORDER BY sales.saleDate DESC`,
        [req.shop.id],
        (err, rows) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to fetch sales data" });
            }
            res.json(rows);
        }
    );
});

// 📌 Shop-to-Shop Transfer API
app.post("/api/transfers", authenticateShop, async (req, res) => {
    const { fromShopId, toShopId, productId, quantity, notes } = req.body;
    const requestingShopId = req.shop.id;

    if (requestingShopId !== fromShopId) {
        return res.status(403).json({ error: "You can only transfer from your own shop" });
    }

    const errors = {};
    if (!fromShopId) errors.fromShopId = "Source shop is required";
    if (!toShopId) errors.toShopId = "Destination shop is required";
    if (!productId) errors.productId = "Product selection is required";
    if (!quantity || isNaN(quantity)) errors.quantity = "Valid quantity is required";
    
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ 
            error: "Validation failed",
            details: errors
        });
    }

    try {
        await new Promise((resolve, reject) => {
            db.run("BEGIN TRANSACTION", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        const [product, fromShop, toShop] = await Promise.all([
            new Promise((resolve, reject) => {
                db.get(
                    "SELECT * FROM products WHERE id = ? AND shopId = ?",
                    [productId, fromShopId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            }),
            new Promise((resolve, reject) => {
                db.get(
                    "SELECT name, location FROM shops WHERE id = ?",
                    [fromShopId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            }),
            new Promise((resolve, reject) => {
                db.get(
                    "SELECT name, location FROM shops WHERE id = ?",
                    [toShopId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            })
        ]);

        if (!product) {
            await new Promise((resolve) => {
                db.run("ROLLBACK", () => resolve());
            });
            return res.status(404).json({ 
                error: "Product not found in your inventory",
                code: "PRODUCT_NOT_FOUND"
            });
        }

        if (product.quantity < quantity) {
            await new Promise((resolve) => {
                db.run("ROLLBACK", () => resolve());
            });
            return res.status(400).json({ 
                error: `Insufficient stock (${product.quantity} available)`,
                code: "INSUFFICIENT_STOCK",
                currentStock: product.quantity
            });
        }

        await new Promise((resolve, reject) => {
            db.run(
                "UPDATE products SET quantity = quantity - ? WHERE id = ?",
                [quantity, productId],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        const targetProduct = await new Promise((resolve, reject) => {
            db.get(
                "SELECT * FROM products WHERE title = ? AND shopId = ?",
                [product.title, toShopId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (targetProduct) {
            await new Promise((resolve, reject) => {
                db.run(
                    "UPDATE products SET quantity = quantity + ? WHERE id = ?",
                    [quantity, targetProduct.id],
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        } else {
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO products (
                        shopId, title, price, quantity, barcode, expiryDate, location
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [toShopId, product.title, product.price, quantity, 
                     product.barcode, product.expiryDate, toShop.location],
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        const transferResult = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO shop_transfers (
                    fromShopId, toShopId, productId, productName,
                    quantity, unitPrice, totalValue, notes, transferredBy,
                    fromShopLocation, toShopLocation
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    fromShopId, toShopId, productId, product.title,
                    quantity, product.price, product.price * quantity,
                    notes || null, requestingShopId,
                    fromShop.location, toShop.location
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve(this);
                }
            );
        });

        await new Promise((resolve) => {
            db.run("COMMIT", () => resolve());
        });
        
        res.json({
            success: true,
            transferId: transferResult.lastID,
            product: {
                id: productId,
                newQuantity: product.quantity - quantity
            },
            transfer: {
                id: transferResult.lastID,
                fromShopId,
                toShopId,
                productId,
                productName: product.title,
                quantity,
                unitPrice: product.price,
                totalValue: product.price * quantity,
                notes,
                fromShopName: fromShop.name,
                toShopName: toShop.name,
                fromShopLocation: fromShop.location,
                toShopLocation: toShop.location,
                transferDate: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error("Transfer error:", error);
        await new Promise((resolve) => {
            db.run("ROLLBACK", () => resolve());
        });
        res.status(500).json({ 
            error: "Failed to process transfer",
            details: error.message 
        });
    }
});

// 📌 Get Transfer History
app.get("/api/transfers", authenticateShop, (req, res) => {
    const shopId = req.shop.id;
    
    db.all(
        `SELECT 
            t.*,
            s1.name as fromShopName,
            s2.name as toShopName
         FROM shop_transfers t
         JOIN shops s1 ON t.fromShopId = s1.id
         JOIN shops s2 ON t.toShopId = s2.id
         WHERE t.fromShopId = ? OR t.toShopId = ?
         ORDER BY t.transferDate DESC`,
        [shopId, shopId],
        (err, rows) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to fetch transfer history" });
            }
            res.json(rows);
        }
    );
});

// 📌 Get Transfer History with Locations
app.get("/api/transfers-with-locations", authenticateShop, (req, res) => {
    const shopId = req.shop.id;
    
    db.all(
        `SELECT 
            t.*,
            s1.name as fromShopName,
            s1.location as fromShopLocation,
            s2.name as toShopName,
            s2.location as toShopLocation
         FROM shop_transfers t
         JOIN shops s1 ON t.fromShopId = s1.id
         JOIN shops s2 ON t.toShopId = s2.id
         WHERE t.fromShopId = ? OR t.toShopId = ?
         ORDER BY t.transferDate DESC`,
        [shopId, shopId],
        (err, rows) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to fetch transfer history" });
            }
            res.json(rows);
        }
    );
});

// 📌 Get Shops with Location Data
app.get("/api/shops-with-location", authenticateShop, (req, res) => {
    db.all(
        `SELECT id, name, location, contactNumber, email 
         FROM shops 
         WHERE id != ?`,
        [req.shop.id],
        (err, rows) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to fetch shops" });
            }
            res.json(rows);
        }
    );
});

// 📌 Get Dashboard Stats (Shop-specific)
app.get("/api/dashboard", authenticateShop, (req, res) => {
    const shopId = req.shop.id;
    const currentDate = new Date();
    const nextMonthDate = new Date();
    nextMonthDate.setDate(currentDate.getDate() + 30);

    db.get(
        "SELECT COUNT(*) AS totalProducts FROM products WHERE shopId = ?",
        [shopId],
        (err, totalProducts) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to fetch dashboard data" });
            }

            db.get(
                "SELECT COUNT(*) AS lowStock FROM products WHERE quantity <= 5 AND shopId = ?",
                [shopId],
                (err, lowStock) => {
                    if (err) {
                        console.error("Database error:", err);
                        return res.status(500).json({ error: "Failed to fetch dashboard data" });
                    }

                    db.get(
                        "SELECT COUNT(*) AS expiringSoon FROM products WHERE expiryDate <= ? AND shopId = ?",
                        [nextMonthDate.toISOString().split("T")[0], shopId],
                        (err, expiringSoon) => {
                            if (err) {
                                console.error("Database error:", err);
                                return res.status(500).json({ error: "Failed to fetch dashboard data" });
                            }

                            db.get(
                                "SELECT SUM(totalCost) AS totalSales FROM sales WHERE shopId = ?",
                                [shopId],
                                (err, totalSales) => {
                                    if (err) {
                                        console.error("Database error:", err);
                                        return res.status(500).json({ error: "Failed to fetch dashboard data" });
                                    }

                                    res.json({
                                        totalProducts: totalProducts.totalProducts,
                                        lowStock: lowStock.lowStock,
                                        expiringSoon: expiringSoon.expiringSoon,
                                        totalSales: totalSales.totalSales || 0
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

// 📌 Get All Shops
app.get("/api/shops", authenticateShop, (req, res) => {
    db.all(
        "SELECT id, name, location, email, contactNumber FROM shops",
        (err, rows) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to fetch shops" });
            }
            res.json(rows);
        }
    );
});

// 📌 Get All Products (Admin View)
app.get("/api/all-products", authenticateShop, (req, res) => {
    if (req.shop.email !== 'admin@example.com') {
        return res.status(403).json({ error: "Unauthorized access" });
    }

    db.all(
        `SELECT 
            p.*,
            s.name as shopName,
            s.location as shopLocation
         FROM products p
         JOIN shops s ON p.shopId = s.id`,
        (err, rows) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to fetch products" });
            }
            res.json(rows);
        }
    );
});

// 📌 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});