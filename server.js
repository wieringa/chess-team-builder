require("dotenv").config();

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const fileUpload = require("express-fileupload");
const PDFDocument = require("pdfkit");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");

const Player = require("./player");
const Team = require("./team");
const formBalancedTeams = require("./teamLogic");

const app = express();

const PORT = process.env.PORT || 4000;

const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL) throw new Error("MONGO_URL not set");

const ADMIN_PASS = process.env.ADMIN_PASS;
if (!ADMIN_PASS) throw new Error("ADMIN_PASS not set");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET not set");

app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://wieringa.github.io"
  ]
}));
app.use(express.json());

app.use(fileUpload({
  limits: { fileSize: 2 * 1024 * 1024 },
  abortOnLimit: true
}));

// =====================
// AUTH MIDDLEWARE
// =====================
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, message: "Geen token" });
  }

  const token = header.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ ok: false, message: "Ongeldige token" });
  }
}

// =====================
// LOGIN
// =====================
app.post("/api/login", (req, res) => {
  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({ ok: false, message: "Wachtwoord ontbreekt" });
  }

  if (password !== ADMIN_PASS) {
    return res.status(401).json({ ok: false, message: "Fout wachtwoord" });
  }

  const token = jwt.sign(
    { role: "admin" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ ok: true, token });
});

// =====================
// HEALTH
// =====================
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// =====================
// PLAYERS
// =====================
app.get("/api/players", async (req, res) => {
  const players = await Player.find();
  res.json(players);
});

app.post("/api/player", requireAuth, async (req, res) => {
  const player = new Player(req.body);
  await player.save();
  res.json(player);
});

app.delete("/api/player/:id", requireAuth, async (req, res) => {
  await Player.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// =====================
// TEAMS
// =====================
app.post("/api/teams", requireAuth, async (req, res) => {
  const players = await Player.find();
  const teams = formBalancedTeams(players);

  await Team.deleteMany();
  await Team.insertMany(teams);

  res.json(teams);
});

app.get("/api/public-teams", async (req, res) => {
  const teams = await Team.find();
  res.json(teams);
});

// =====================
// CSV UPLOAD
// =====================
app.post("/api/upload-csv", requireAuth, async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ message: "Geen bestand" });
  }

  const file = req.files.file;
  const tempPath = path.join(__dirname, "temp.csv");

  await file.mv(tempPath);

  const players = [];

  fs.createReadStream(tempPath)
    .pipe(csv())
    .on("data", (row) => {
      players.push(row);
    })
    .on("end", async () => {
      await Player.deleteMany();
      await Player.insertMany(players);

      fs.unlinkSync(tempPath);
      res.json({ ok: true, count: players.length });
    });
});

// =====================
// EXPORT CSV
// =====================
app.get("/api/export-teams", requireAuth, async (req, res) => {
  const teams = await Team.find();

  let csvData = "Team,Player\n";

  teams.forEach(team => {
    team.players.forEach(p => {
      csvData += `${team.name},${p.name}\n`;
    });
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=teams.csv");
  res.send(csvData);
});

// =====================
// EXPORT PDF
// =====================
app.get("/api/export-pdf", requireAuth, async (req, res) => {
  const teams = await Team.find();

  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=teams.pdf");

  doc.pipe(res);

  teams.forEach(team => {
    doc.fontSize(16).text(team.name);
    team.players.forEach(p => {
      doc.fontSize(12).text(`- ${p.name}`);
    });
    doc.moveDown();
  });

  doc.end();
});

// =====================
// START SERVER
// =====================
mongoose.connect(MONGO_URL)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error(err);
  });