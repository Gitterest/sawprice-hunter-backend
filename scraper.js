// 📦 scraper.js - Full production-ready version for Railway backend

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');

puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// 🔍 Scrape Facebook Marketplace with cookie support
async function scrapeFacebookMarketplace(searchQuery) {
  console.log("🧠 Scraping Facebook Marketplace with query:", searchQuery);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  try {
    const cookiesPath = path.resolve(__dirname, 'fb-session', 'cookies.json');
    try {
      const cookiesString = await fs.readFile(cookiesPath);
      const cookies = JSON.parse(cookiesString);
      await page.setCookie(...cookies);
      console.log("🍪 Loaded Facebook cookies");
    } catch (err) {
      console.warn("⚠️ No cookies found, scraping anonymously");
    }

    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1'
    );
    await page.setViewport({ width: 375, height: 812 });

    const url = `https://m.facebook.com/marketplace/search/?query=${encodeURIComponent(searchQuery)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(3000);

    const results = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll("a[href*='/marketplace/item']").forEach((item) => {
        const title = item.querySelector("strong")?.innerText || item.innerText || "No Title";
        const link = item.href;
        const image = item.querySelector("img")?.src || "";
        if (title && link) items.push({ title, link, image });
      });
      return items;
    });

    const newCookies = await page.cookies();
    await fs.mkdir(path.dirname(cookiesPath), { recursive: true });
    await fs.writeFile(cookiesPath, JSON.stringify(newCookies, null, 2));

    console.log("📈 Facebook scrape success:", results.length, "items");
    await browser.close();
    return results;

  } catch (err) {
    console.error("❌ Facebook scraping error:", err);
    await browser.close();
    return [];
  }
}

// 🔍 Scrape OfferUp
async function scrapeOfferUp(searchQuery) {
  console.log("🧠 Scraping OfferUp with query:", searchQuery);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );

    await page.setJavaScriptEnabled(false);

    const url = `https://offerup.com/search/?q=${encodeURIComponent(searchQuery)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(3000);

    const results = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('a[href^="/item"]').forEach((item) => {
        const title = item.querySelector('h2')?.innerText || item.innerText || "No Title";
        const image = item.querySelector('img')?.src || "";
        const price = item.innerText.match(/\$\d+/)?.[0] || "No Price";
        const link = 'https://offerup.com' + item.getAttribute('href');
        if (title && link) items.push({ title, price, link, image });
      });
      return items;
    });

    console.log("📈 OfferUp scrape success:", results.length, "items");
    await browser.close();
    return results;

  } catch (err) {
    console.error("❌ OfferUp scraping error:", err);
    await browser.close();
    return [];
  }
}

// 🔍 Scrape Mercari
async function scrapeMercari(searchQuery) {
  console.log("🧠 Scraping Mercari with query:", searchQuery);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1"
    );
    await page.setViewport({ width: 375, height: 812 });

    const url = `https://www.mercari.com/search/?keyword=${encodeURIComponent(searchQuery)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(4000);

    const results = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('[data-testid="ItemCell"]').forEach((item) => {
        const title = item.querySelector('p')?.innerText || "No Title";
        const price = item.querySelector('[data-testid="Price"]')?.innerText || "No Price";
        const link = item.querySelector('a')?.href || "#";
        const image = item.querySelector('img')?.src || "";
        if (title && price && link) items.push({ title, price, link, image });
      });
      return items;
    });

    console.log("📈 Mercari scrape success:", results.length, "items");
    await browser.close();
    return results;

  } catch (err) {
    console.error("❌ Mercari scraping error:", err);
    await browser.close();
    return [];
  }
}

// ✅ Export all scrapers
module.exports = {
  scrapeFacebookMarketplace,
  scrapeOfferUp,
  scrapeMercari,
};
