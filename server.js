// ✅ server.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
require("dotenv").config();
const { scrapeFacebookMarketplace, scrapeOfferUp, scrapeMercari } = require('./scraper');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());

// ✅ MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// ✅ Mongoose models
const Search = mongoose.model("Search", new mongoose.Schema({
  query: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}));

const Alert = mongoose.model("Alert", new mongoose.Schema({
  query: String,
  targetPrice: Number,
  email: String,
  timestamp: { type: Date, default: Date.now }
}));

// ✅ Scraper route
app.get("/api/prices", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Search query is required." });

  try {
    await new Search({ query }).save();

    const results = await Promise.allSettled([
      scrapeFacebookMarketplace(query),
      scrapeOfferUp(query),
      scrapeMercari(query),
    ]);

    const listings = results
      .filter(r => r.status === "fulfilled")
      .flatMap(r => r.value.map(item => ({
        ...item,
        source: item.source || "Marketplace"
      })));

    if (listings.length === 0) {
      return res.status(404).json({ error: "No listings found." });
    }

    console.log("🧾 Listings:", listings);
    res.json(listings);
  } catch (err) {
    console.error("❌ Scraping failed:", err.message);
    res.status(500).json({ error: "Failed to fetch listings." });
  }
});

// ✅ Healthcheck
app.get("/", (req, res) => {
  res.status(200).send("✅ Sawprice Hunter backend is alive!");
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
