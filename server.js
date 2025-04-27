// server.js - FINAL GOD TIER VERSION
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { scrapeFacebookMarketplace, scrapeOfferUp, scrapeMercari } = require("./scraper");

require("dotenv").config();

// Initialize Express app
const app = express();

// Setup Puppeteer with Stealth
puppeteer.use(StealthPlugin());

// Setup CORS properly for credentials
const allowedOrigins = [
  "http://localhost:3000",
  "https://chainsaw-price-hunter-production.up.railway.app"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("❌ Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Setup basic model
const searchSchema = new mongoose.Schema({
  query: String,
  city: String,
  state: String,
  timestamp: { type: Date, default: Date.now },
});

const Search = mongoose.model("Search", searchSchema);

// API Route - Scrape prices
app.get("/api/prices", async (req, res) => {
  const { query, city, state } = req.query;
  if (!query) return res.status(400).json({ error: "Search query is required" });

  try {
    await new Search({ query, city, state }).save();

    const cityState = city && state ? `${city} ${state}` : (state || "US");

    const results = await Promise.allSettled([
      scrapeFacebookMarketplace(query, cityState),
      scrapeOfferUp(query, cityState),
      scrapeMercari(query, cityState),
    ]);

    let combinedResults = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value);

    const extractState = (text) => {
      const match = text?.match(/,\s*([A-Z]{2})(\s|$)/);
      return match ? match[1].toUpperCase() : '';
    };

    combinedResults = combinedResults.map(item => {
      if (!item.state && item.location) {
        item.state = extractState(item.location);
      }
      return item;
    });

    if (state) {
      combinedResults = combinedResults.filter(item =>
        item.state && item.state.toUpperCase() === state.toUpperCase()
      );
    }

    if (combinedResults.length === 0) {
      return res.status(404).json({ error: "No results found" });
    }

    console.log("🧪 Final Results:", combinedResults.length);
    res.json(combinedResults);
  } catch (err) {
    console.error("🔥 Scraping error:", err.message || err);
    res.status(500).json({ error: "Failed to scrape listings" });
  }
});

// Root route
app.get("/", (req, res) => {
  res.status(200).send("✅ Welcome to Sawprice Hunter!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
