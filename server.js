const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const scraper = require("./scraper");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Allowed front-end origins
const allowedOrigins = [
  "https://chainsaw-price-hunter-production.up.railway.app",
  "http://localhost:3000" // Optional: enable local dev testing
];

// ✅ CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl or Postman) or from whitelisted domains
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("❌ Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware to parse incoming JSON
app.use(express.json());

// ✅ API Route: Search chainsaw prices
app.get("/api/prices", async (req, res) => {
  const { query } = req.query;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing or invalid search query." });
  }

  try {
    const results = await scraper(query);
    if (!results || results.length === 0) {
      return res.status(404).json({ message: "No chainsaws found." });
    }
    res.json(results);
  } catch (error) {
    console.error("❌ Scraping error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ✅ Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () =>
      console.log(`🚀 Server is running on port ${PORT}`)
    );
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
  });
