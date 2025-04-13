const express = require("express");
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

// ✅ CORS setup using environment variable
const allowedOrigins = [process.env.CORS_ORIGIN];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());

// ✅ Scraper API Route with isolated error handling
app.get("/api/prices", async (req, res) => {
  const { query } = req.query;
  console.log("📥 Received query:", query);

  if (!query) {
    return res.status(400).json({ error: "Missing search query." });
  }

  const results = [];

  // Helper to wrap each scraper in a try/catch
  const safeScrape = async (label, fn) => {
    try {
      console.log(`🔍 Scraping: ${label}`);
      const data = await fn(query);
      console.log(`✅ Success: ${label} (${data.length})`);
      return data.map(item => ({ ...item, source: label }));
    } catch (err) {
      console.error(`❌ ${label} failed:`, err.message);
      return [];
    }
  };

  try {
    const [facebook, offerup, mercari] = await Promise.all([
      safeScrape("Facebook", scrapeFacebookMarketplace),
      safeScrape("OfferUp", scrapeOfferUp),
      safeScrape("Mercari", scrapeMercari),
    ]);

    results.push(...facebook, ...offerup, ...mercari);

    console.log("🎯 Returning results:", results.length);
    res.status(200).json(results);
  } catch (fatal) {
    console.error("🔥 Fatal error in route:", fatal.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ MongoDB connection and server boot
if (!process.env.MONGODB_URI) {
  console.error("❌ Missing MONGODB_URI in .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
