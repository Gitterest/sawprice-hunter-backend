const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const puppeteer = require("puppeteer-extra"); // Use puppeteer-extra instead of puppeteer
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://rawfabricator:mongodmon@chainsawdb.6izrg.mongodb.net/?retryWrites=true&w=majority";
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

// ✅ Import scrapers
const { scrapeFacebookMarketplace, scrapeOfferUp, scrapeMercari } = require('./scraper');

// ✅ Combined API Route
app.get("/api/prices", async (req, res) => {
  const { query } = req.query;
  
  if (!query) return res.status(400).json({ error: "Search query is required" });

  try {
    // Save search query to MongoDB — DISABLED TEMPORARILY
    // await new Search({ query }).save();

    // Perform scraping using Promise.allSettled to capture partial results if errors occur
    const results = await Promise.allSettled([
      scrapeFacebookMarketplace(query),
      scrapeOfferUp(query),
      scrapeMercari(query)
    ]);

    const combinedResults = results
      .filter(result => result.status === "fulfilled")
      .flatMap(result => result.value.map(item => ({
        ...item,
        source: result.value.source || "Unknown"
      })));

    if (combinedResults.length === 0) {
      console.warn("⚠️ No results found for query:", query);
      return res.status(404).json({ error: "No results found" });
    }

    console.log("🔥 Combined Results:", JSON.stringify(combinedResults, null, 2));
    res.json(combinedResults);
   } catch (error) {
    console.error("🔥 Error during scraping:", error);
    res.status(500).json({ error: "Failed to scrape listings" });
  }
});

// Root route to verify the server is running
app.get('/', (req, res) => {
  res.status(200).send("✅ Welcome to Sawprice Hunter !");
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
