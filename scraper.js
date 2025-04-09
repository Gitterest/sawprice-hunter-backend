const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// 🔍 Facebook Marketplace (✅ Updated with mobile emulation)
async function scrapeFacebookMarketplace(searchQuery) {
  console.log("🧠 Scraping Facebook Marketplace with query:", searchQuery);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // ✅ Use mobile user-agent & viewport to avoid redirect
  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1'
  );
  await page.setViewport({ width: 375, height: 812 });

  const url = `https://m.facebook.com/marketplace/search/?query=${encodeURIComponent(searchQuery)}`;

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(3000);

    const html = await page.content();
    console.log("🧾 Facebook raw HTML:", html.slice(0, 500));

    const results = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll("a[href*='/marketplace/item']").forEach((item) => {
        const title = item.querySelector("strong")?.innerText || item.innerText || "No Title";
        const link = item.href;
        const image = item.querySelector("img")?.src || "";

        if (title && link) {
          items.push({ title, link, image });
        }
      });
      return items;
    });

    await browser.close();
    return results;
  } catch (err) {
    console.error("❌ Facebook scraping error:", err);
    await browser.close();
    return [];
  }
}

// 🔍 OfferUp (Mobile-like Strategy)
async function scrapeOfferUp(searchQuery) {
  console.log('🧠 Scraping OfferUp with query:', searchQuery);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  );

  await page.setJavaScriptEnabled(false); // Avoid JS-blocked content

  const url = `https://offerup.com/search/?q=${encodeURIComponent(searchQuery)}`;

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(3000);

    const html = await page.content();
    console.log("📄 OfferUp raw HTML:", html.slice(0, 500));

    const results = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('a[href^="/item"]').forEach((item) => {
        const title = item.querySelector('h2')?.innerText || item.innerText || "No Title";
        const image = item.querySelector('img')?.src || "";
        const price = item.innerText.match(/\$\d+/)?.[0] || "No Price";
        const link = 'https://offerup.com' + item.getAttribute('href');

        if (title && link) {
          items.push({ title, price, link, image });
        }
      });
      return items;
    });

    await browser.close();
    return results;
  } catch (err) {
    console.error("❌ OfferUp scraping error:", err);
    await browser.close();
    return [];
  }
}

// 🔍 Mercari (✅ Updated using Facebook-style strategy)
async function scrapeMercari(searchQuery) {
  console.log("🧠 Scraping Mercari with query:", searchQuery);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // ✅ Emulate mobile just like Facebook scraper
  await page.setUserAgent(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1"
  );
  await page.setViewport({ width: 375, height: 812 });

  const url = `https://www.mercari.com/search/?keyword=${encodeURIComponent(searchQuery)}`;

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(4000); // Give React time to load

    const html = await page.content();
    console.log("📄 Mercari raw HTML:", html.slice(0, 500));

    const results = await page.evaluate(() => {
      const items = [];

      document.querySelectorAll('[data-testid="ItemCell"]').forEach((item) => {
        const title = item.querySelector('p')?.innerText || "No Title";
        const price = item.querySelector('[data-testid="Price"]')?.innerText || "No Price";
        const link = item.querySelector('a')?.href || "#";
        const image = item.querySelector('img')?.src || "";

        if (title && price && link) {
          items.push({
            title,
            price,
            link,
            image,
          });
        }
      });

      return items;
    });

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
