const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const scraperRoutes = require("./routes/scraper.routes");

require("dotenv").config();

const app = express();
puppeteer.use(StealthPlugin());

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
app.use(express.json());
app.use("/api/scraper", scraperRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
