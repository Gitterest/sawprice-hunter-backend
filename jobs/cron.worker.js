const mongoose = require("mongoose");
const { scrapeFacebookMarketplace, scrapeOfferUp, scrapeMercari } = require("../scraper");

require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Mongo connected");
  } catch (err) {
    console.error("❌ Mongo connect error:", err);
    process.exit(1);
  }
};

const runJob = async () => {
  await connectDB();
  console.log("🧹 Running scraper job...");

  const facebookData = await scrapeFacebookMarketplace();
  const offerupData = await scrapeOfferUp();
  const mercariData = await scrapeMercari();

  // TODO: Cache results in Mongo collection, e.g., `Listings`
  console.log("✅ Scraper job complete.");
  process.exit(0);
};

runJob();
