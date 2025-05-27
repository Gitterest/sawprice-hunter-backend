const express = require("express");
const router = express.Router();
const { scrapeFacebookMarketplace, scrapeOfferUp, scrapeMercari } = require("../scraper");

router.get("/all", async (req, res) => {
  try {
    const results = await Promise.all([
      scrapeFacebookMarketplace(),
      scrapeOfferUp(),
      scrapeMercari()
    ]);
    res.json({ facebook: results[0], offerup: results[1], mercari: results[2] });
  } catch (error) {
    console.error("❌ Scraping error:", error);
    res.status(500).json({ error: "Scraping failed." });
  }
});

module.exports = router;
