// server.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const mysql = require("mysql");
require("dotenv").config();

// 1) PORT deklaráció legfelül
const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

// 2) Adatbázis kapcsolat beállítása
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "kicksify",
  port: process.env.DB_PORT || 3306
});

// 3) Adatbázis kapcsolódás kezelése
db.connect(err => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to MySQL Database");
});

// ============ API végpontok ============

// Cipők képeinek kiszolgálása (images mappa) – statikus
app.use("/images", express.static(path.join(__dirname, "images")));

// Összes cipő lekérése
app.get("/api/cipok", (req, res) => {
  let query = "SELECT * FROM cipok";
  if (req.query.marka) {
    query += " WHERE marka = " + mysql.escape(req.query.marka);
  }
  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ API hiba:", err);
      return res.status(500).json({ error: "Hiba az adatbázis lekérdezésekor" });
    }
    // Képek URL-jének hozzáadása
    const updatedResults = results.map(cipo => ({
      ...cipo,
      image: `http://localhost:${PORT}/images/${cipo.kep}`
    }));
    res.json(updatedResults);
  });
});

// Egy adott cipő lekérése
app.get("/api/cipok/:id", (req, res) => {
  const cipoId = req.params.id;
  const query = "SELECT * FROM cipok WHERE cipo_id = ?";
  db.query(query, [cipoId], (err, results) => {
    if (err) {
      console.error("❌ Adatbázis hiba:", err);
      return res.status(500).json({ error: "Adatbázis hiba" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Nincs ilyen termék" });
    }
    const cipo = {
      ...results[0],
      image: `http://localhost:${PORT}/images/${results[0].kep}`
    };
    res.json(cipo);
  });
});

// Kosárba adás
app.post("/api/kosar", (req, res) => {
  const { felhasznalo_id, cipo_id, meret, darabszam, egysegar } = req.body;
  console.log("➡️ /api/kosar hívás:", req.body);
  if (!felhasznalo_id || !cipo_id || !meret || !darabszam || !egysegar) {
    return res.status(400).json({ error: "Hiányzó adatok" });
  }
  const query = "INSERT INTO kosar (felhasznalo_id, cipo_id, meret, darabszam, egysegar) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [felhasznalo_id, cipo_id, meret, darabszam, egysegar], (err, result) => {
    if (err) {
      console.error("❌ Kosár hiba:", err);
      return res.status(500).json({ error: "Hiba a kosárba adáskor" });
    }
    res.json({ success: true, message: "Termék hozzáadva a kosárhoz" });
  });
});

// Bejelentkezés
app.post("/api/felhasznalok/login", (req, res) => {
  console.log("➡️ /api/felhasznalok/login hívás:", req.body);
  const { email, jelszo_hash } = req.body;
  if (!email || !jelszo_hash) {
    return res.status(400).json({ error: "Hiányzó adatok" });
  }
  const query = "SELECT * FROM felhasznalok WHERE email = ? LIMIT 1";
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error("❌ Adatbázis hiba a bejelentkezéskor:", err);
      return res.status(500).json({ error: "Adatbázis hiba" });
    }
    if (results.length === 0) {
      return res.status(401).json({ error: "Hibás email vagy jelszó" });
    }
    const user = results[0];
    // Egyszerű összehasonlítás – éles rendszerben használj bcrypt-et!
    if (jelszo_hash !== user.jelszo_hash) {
      return res.status(401).json({ error: "Hibás email vagy jelszó" });
    }
    res.json({ success: true, user });
  });
});

// Regisztráció (felhasznalonev mezővel)
app.post("/api/felhasznalok", (req, res) => {
  console.log("➡️ /api/felhasznalok (REG) hívás:", req.body);
  const { vezeteknev, keresztnev, felhasznalonev, email, jelszo_hash } = req.body;
  if (!vezeteknev || !keresztnev || !felhasznalonev || !email || !jelszo_hash) {
    return res.status(400).json({ error: "Hiányzó adatok" });
  }
  const sql = "INSERT INTO felhasznalok (vezeteknev, keresztnev, felhasznalonev, email, jelszo_hash) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [vezeteknev, keresztnev, felhasznalonev, email, jelszo_hash], (err, result) => {
    if (err) {
      console.error("❌ Regisztrációs hiba:", err);
      return res.status(500).json({ success: false, error: err });
    }
    res.json({ success: true, userId: result.insertId });
  });
});

// PUT végpont a profil szerkesztéséhez
app.put("/api/felhasznalok/:id", (req, res) => {
  const userId = req.params.id;
  const { vezeteknev, keresztnev, felhasznalonev, email } = req.body;
  if (!vezeteknev || !keresztnev || !felhasznalonev || !email) {
    return res.status(400).json({ error: "Hiányzó adatok" });
  }
  const query = "UPDATE felhasznalok SET vezeteknev = ?, keresztnev = ?, felhasznalonev = ?, email = ? WHERE felhasznalo_id = ?";
  db.query(query, [vezeteknev, keresztnev, felhasznalonev, email, userId], (err, result) => {
    if (err) {
      console.error("❌ Profil frissítési hiba:", err);
      return res.status(500).json({ success: false, error: err });
    }
    res.json({ success: true, message: "Profil frissítve" });
  });
});

// ============ Statikus kiszolgálás és wildcard ============

// Statikus front-end fájlok kiszolgálása
app.use(express.static(path.join(__dirname, "../kicksify_frontend")));

// Minden egyéb GET kérésre az index.html visszaküldése
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../kicksify_frontend/index.html"));
});

// Szerver indítása
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
