const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
require("dotenv").config();

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS Setup (Allow frontend domain)
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// ✅ MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ Missing MONGO_URI in .env");
  process.exit(1);
}

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1);
});

// ✅ Mongoose Schemas
const SearchSchema = new mongoose.Schema({
  query: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const AlertSchema = new mongoose.Schema({
  query: { type: String, required: true },
  targetPrice: { type: Number, required: true },
  email: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Search = mongoose.model("Search", SearchSchema);
const Alert = mongoose.model("Alert", AlertSchema);

// ✅ Import Scrapers
const {
  scrapeFacebookMarketplace,
  scrapeOfferUp,
  scrapeMercari,
} = require("./scraper");

// ✅ Main API Route
app.get("/api/prices", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Search query is required" });

  try {
    await new Search({ query }).save();

    const results = await Promise.allSettled([
      scrapeFacebookMarketplace(query),
      scrapeOfferUp(query),
      scrapeMercari(query),
    ]);

    const combinedResults = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value);

    if (combinedResults.length === 0) {
      return res.status(404).json({ error: "No results found" });
    }

    console.log("🧪 Combined Results:", combinedResults.length);
    res.json(combinedResults);
  } catch (err) {
    console.error("🔥 Scraping error:", err.message || err);
    res.status(500).json({ error: "Failed to scrape listings" });
  }
});

// ✅ Root route
app.get("/", (req, res) => {
  res.status(200).send("✅ Sawprice Hunter backend is running");
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is live at http://localhost:${PORT}`);
});
