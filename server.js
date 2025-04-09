const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'https://chainsaw-price-hunter-production.up.railway.app'
}));

app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);

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

const { scrapeFacebookMarketplace, scrapeOfferUp, scrapeMercari } = require('./scraper');

app.get("/api/prices", async (req, res) => {
  const { query } = req.query;

  if (!query) return res.status(400).json({ error: "Search query is required" });

  try {
    // Save search to DB if needed
    // await new Search({ query }).save();

    const results = await Promise.allSettled([
      scrapeFacebookMarketplace(query),
      scrapeOfferUp(query),
      scrapeMercari(query)
    ]);

    console.log("🧪 Scrape Results Raw:", JSON.stringify(results, null, 2));

    const combinedResults = results
      .filter(result => result.status === "fulfilled")
      .flatMap((result, index) => {
        const sourceMap = ['Facebook Marketplace', 'OfferUp', 'Mercari'];
        return result.value.map(item => ({
          ...item,
          source: sourceMap[index]
        }));
      });

    if (combinedResults.length === 0) {
      return res.status(404).json({ error: "No results found" });
    }

    res.json(combinedResults);
  } catch (error) {
    console.error("🔥 Error during scraping:", error);
    res.status(500).json({ error: "Failed to scrape listings" });
  }
});

app.get('/', (req, res) => {
  res.status(200).send("✅ Welcome to Sawprice Hunter API");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
