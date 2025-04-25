// server.js — working base setup
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://chainsaw-price-hunter-production.up.railway.app'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error('❌ Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// ✅ MongoDB connection with mongoose
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/sawprice", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB with Mongoose!"))
.catch(err => console.error("❌ Mongoose connection error:", err));

// ✅ Define Mongoose schemas
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

// ✅ Scraper imports
const {
  scrapeFacebookMarketplace,
  scrapeOfferUp,
  scrapeMercari,
} = require("./scraper");

// ✅ Main API endpoint
app.get("/api/prices", async (req, res) => {
  const { query } = req.query;

  if (!query) return res.status(400).json({ error: "Search query is required" });

  try {
    // Log search
    await new Search({ query }).save();

    const results = await Promise.allSettled([
      scrapeFacebookMarketplace(query),
      scrapeOfferUp(query),
      scrapeMercari(query)
    ]);

    const combined = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => Array.isArray(r.value) ? r.value : []);

    if (combined.length === 0) {
      return res.status(404).json({ error: "No results found" });
    }

    console.log("🧩 Combined results:", combined.slice(0, 2));
    res.json(combined);

  } catch (error) {
    console.error("🔥 Error in /api/prices:", error);
    res.status(500).json({ error: "Failed to scrape listings" });
  }
});

// ✅ Basic ping route
app.get('/', (req, res) => {
  res.status(200).send("✅ Welcome to Sawprice Hunter API");
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
