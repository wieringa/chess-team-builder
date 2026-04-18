console.log("server.js begint nu...");

const express = require("express"); const mongoose = require("mongoose"); const cors = require("cors"); const path = require("path");

const app = express(); app.use(cors()); app.use(express.json());

// Connect to database mongoose.connect(process.env.MONGO_URL || "mongodb://localhost/chess");

// Health check app.get("/api/health", (req, res) => { res.json({ status: "ok" }); });

// Serve React build app.use(express.static(path.join(__dirname, "build")));

app.get("/*", (req, res) => { res.sendFile(path.join(__dirname, "build", "index.html")); });

// Start server app.listen(4000, () => { console.log("Server running on port 4000"); });

console.log("server.js is gestart!");