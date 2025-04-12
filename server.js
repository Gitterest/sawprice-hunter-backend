const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const scraper = require("./scraper");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS config using Railway environment variable
const allowedOrigins = [process.env.CORS_ORIGIN];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

app.use(express.json());

// ✅ API endpoint for scraping
app.get("/api/prices", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ econst express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const {
  scrapeFacebookMarketplace,
  scrapeOfferUp,
  scrapeMercari
} = require("./scraper");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS config
const allowedOrigins = [process.env.CORS_ORIGIN];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

app.use(express.json());

// ✅ Combined scraping handler
app.get("/api/prices", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Missing search query." });
  }

  try {
    const [facebookResults, offerUpResults, mercariResults] = await Promise.all([
      scrapeFacebookMarketplace(query),
      scrapeOfferUp(query),
      scrapeMercari(query)
    ]);

    const combined = [
      ...facebookResults.map(item => ({ ...item, source: "Facebook" })),
      ...offerUpResults.map(item => ({ ...item, source: "OfferUp" })),
      ...mercariResults.map(item => ({ ...item, source: "Mercari" })),
    ];

    res.json(combined);
  } catch (error) {
    console.error("Scraping error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ✅ MongoDB + server start
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
