



const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const fileUpload = require("express-fileupload");
const PDFDocument = require("pdfkit");

const Player = require("./player");
const Team = require("./team");
const formBalancedTeams = require("./teamLogic");

const app = express();

const PORT = process.env.PORT || 4000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/chess";
const ADMIN_PASS = process.env.ADMIN_PASS || "secret123";
const buildPath = path.join(__dirname, "build");

app.use(cors());
app.use(express.json());
app.use(fileUpload());

function moveFile(file, targetPath) {
  return new Promise((resolve, reject) => {
    file.mv(targetPath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

app.post("/api/login", (req, res) => {
  const { password } = req.body || {};

  if (password === ADMIN_PASS) {
    return res.json({ ok: true, token: "admin-logged-in" });
  }

  res.status(401).json({ ok: false, message: "Fout wachtwoord" });
});

app.get("/api/health", async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({ status: "ok", mongo: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", mongo: "disconnected" });
  }
});

app.get("/api/players", async (req, res) => {
  try {
    const players = await Player.find().sort({ rating: -1, name: 1 }).lean();
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: "Kon spelers niet ophalen" });
  }
});

app.post("/api/player", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const country = String(req.body.country || "").trim().toUpperCase();
    const rating = Number(req.body.rating);

    if (!name) {
      return res.status(400).json({ message: "Naam is verplicht" });
    }

    if (!["NL", "BE", "DE"].includes(country)) {
      return res.status(400).json({ message: "Land moet NL, BE of DE zijn" });
    }

    if (Number.isNaN(rating)) {
      return res.status(400).json({ message: "Rating moet een getal zijn" });
    }

    const player = await Player.create({ name, country, rating });
    res.json(player);
  } catch (err) {
    res.status(500).json({ message: "Kon speler niet opslaan" });
  }
});

app.delete("/api/player/:id", async (req, res) => {
  try {
    await Player.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Kon speler niet verwijderen" });
  }
});

app.post("/api/teams", async (req, res) => {
  try {
    const players = await Player.find().lean();

    if (players.length < 3) {
      return res.status(400).json({ message: "Minstens 3 spelers nodig" });
    }

    const teams = formBalancedTeams(players);

    await Team.deleteMany({});
    await Team.insertMany(teams);

    res.json({ teams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kon teams niet genereren" });
  }
});

app.get("/api/public-teams", async (req, res) => {
  try {
    const teams = await Team.find().sort({ name: 1 }).lean();
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ message: "Kon teams niet ophalen" });
  }
});

app.post("/api/upload-csv", async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: "Geen CSV-bestand ontvangen" });
    }

    const replaceAll =
      req.body.replaceAll === true || req.body.replaceAll === "true";

    const file = req.files.file;
    const tempPath = path.join(__dirname, "temp-upload.csv");
    const rows = [];

    await moveFile(file, tempPath);

    await new Promise((resolve, reject) => {
      fs.createReadStream(tempPath)
        .pipe(csv())
        .on("data", (row) => {
  const name = String(row.name || row.Name || "").trim();
  const rating = Number(String(row.rating || row.Rating || "").trim());
  const country = String(row.country || row.Country || "").trim().toUpperCase();

  if (!name) return;
  if (Number.isNaN(rating)) return;
  if (!["NL", "BE", "DE"].includes(country)) return;

  rows.push({ name, rating, country });
})

        .on("end", resolve)
        .on("error", reject);
    });

    try {
      fs.unlinkSync(tempPath);
    } catch (_) {}

    if (replaceAll) {
      await Player.deleteMany({});
      await Team.deleteMany({});
    }

    if (rows.length === 0) {
      return res.status(400).json({ message: "Geen geldige rijen in CSV" });
    }

    await Player.insertMany(rows);
    res.json({ ok: true, imported: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "CSV upload mislukt" });
  }
});

app.get("/api/export-teams", async (req, res) => {
  try {
    const teams = await Team.find().lean();

    let output = "team,player,country,rating,avg\n";

    for (const team of teams) {
      for (const player of team.players) {
        output += [
          csvCell(team.name),
          csvCell(player.name),
          csvCell(player.country),
          csvCell(player.rating),
          csvCell(Number(team.avg).toFixed(1))
        ].join(",") + "\n";
      }
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=teams.csv");
    res.send(output);
  } catch (err) {
    res.status(500).json({ message: "CSV export mislukt" });
  }
});

app.get("/api/export-pdf", async (req, res) => {
  try {
    const teams = await Team.find().lean();

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=teams.pdf");

    doc.pipe(res);

    doc.fontSize(20).text("Chess Teams");
    doc.moveDown();

    teams.forEach((team) => {
      doc.fontSize(15).text(`${team.name}  |  Gemiddelde: ${Number(team.avg).toFixed(1)}`);
      doc.moveDown(0.3);

      team.players.forEach((player) => {
        doc.fontSize(11).text(`- ${player.name} (${player.country}) - ${player.rating}`);
      });

      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: "PDF export mislukt" });
  }
});

if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));

  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API draait. React build map niet gevonden.");
  });
}

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:");
    console.error(err.message);
  });
