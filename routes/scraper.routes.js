const express = require('express');
const router = express.Router();
const {
  scrapeFacebookMarketplace,
  scrapeOfferUp,
  scrapeMercari
} = require('../scraper');

// GET /api/scraper/all — scrape all sources without filters
router.get('/all', async (req, res) => {
  try {
    const results = await Promise.allSettled([
      scrapeFacebookMarketplace(),
      scrapeOfferUp(),
      scrapeMercari()
    ]);

    const listings = [];
    results.forEach(r => {
      if (r.status === 'fulfilled') {
        listings.push(...r.value.listings);
      } else {
        console.error('❌ Scraper error:', r.reason);
      }
    });

    if (!listings.length) {
      return res.status(500).json({ error: 'Scraping failed.' });
    }

    res.json({ listings });
  } catch (error) {
    console.error('❌ Scraping error:', error);
    res.status(500).json({ error: 'Scraping failed.' });
  }
});

// GET /api/scraper/prices — proxy for frontend with required params
router.get('/prices', async (req, res) => {
  const { query, region, city } = req.query;

  if (!query || !region || !city) {
    return res.status(400).json({ error: "Missing query, region, or city" });
  }

  try {
    const results = await Promise.allSettled([
      scrapeFacebookMarketplace(query),
      scrapeOfferUp(query),
      scrapeMercari(query)
    ]);

    const listings = [];
    results.forEach(r => {
      if (r.status === 'fulfilled') {
        listings.push(...r.value.listings);
      } else {
        console.error('❌ Scraper error:', r.reason);
      }
    });

    if (!listings.length) {
      return res.status(500).json({ error: 'Scraping failed.' });
    }

    res.json({ listings });
  } catch (error) {
    console.error('❌ Scraping error:', error);
    res.status(500).json({ error: 'Scraping failed.' });
  }
});

module.exports = router;
