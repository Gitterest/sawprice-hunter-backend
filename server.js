// server.js - Sawprice Hunter Backend
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { scrapeFacebookMarketplace, scrapeOfferUp, scrapeMercari } = require("./scraper");

require("dotenv").config();

// Initialize Express app
const app = express();

// Configure Puppeteer
puppeteer.use(StealthPlugin());

// CORS setup
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

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Mongoose model for saving search history
const searchSchema = new mongoose.Schema({
  query: String,
  city: String,
  region: String,
  timestamp: { type: Date, default: Date.now },
});
const Search = mongoose.model("Search", searchSchema);

// API Route - Scrape prices
app.get("/api/prices", async (req, res) => {
  const { query, city, region } = req.query;
  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  try {
    // Log the search
    await new Search({ query, city, region }).save();

    // Build location string (e.g. "South Bend IN" or default to "US")
    const cityState = city && region ? `${city} ${region}` : (region || "US");

    // Perform concurrent scrapes
    const results = await Promise.allSettled([
      scrapeFacebookMarketplace(query, cityState),
      scrapeOfferUp(query, cityState),
      scrapeMercari(query, cityState),
    ]);

    // Combine successful results
    let combinedResults = results
      .filter(r => r.status === "fulfilled")
      .flatMap(r => r.value);

    // Extract US state codes from location string if missing
    const extractState = text => {
      const match = text?.match(/,\s*([A-Z]{2})(\s|$)/);
      return match ? match[1].toUpperCase() : '';
    };
    combinedResults = combinedResults.map(item => {
      if (!item.state && item.location) {
        item.state = extractState(item.location);
      }
      return item;
    });

    // Filter by region if provided
    if (region) {
      combinedResults = combinedResults.filter(item =>
        item.state && item.state.toUpperCase() === region.toUpperCase()
      );
    }

    // No matches handling
    if (combinedResults.length === 0) {
      return res.status(404).json({ error: "No results found" });
    }

    console.log(`🧪 Final Results: ${combinedResults.length}`);
    return res.json(combinedResults);
  } catch (err) {
    console.error("🔥 Scraping error:", err.message || err);
    return res.status(500).json({ error: "Failed to scrape listings" });
  }
});

// Root route for sanity check
app.get("/", (req, res) => {
  res.status(200).send("✅ Welcome to Sawprice Hunter API");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
