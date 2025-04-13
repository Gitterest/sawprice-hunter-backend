const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const launchOptions = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
};

async function scrapeFacebook(query) {
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
    );
    const url = `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(query)}`;
    console.log("🌐 Facebook URL:", url);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    await page.waitForSelector('[role="article"]', { timeout: 10000 });

    const results = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[role="article"]'));
      return items.map((el) => {
        const title = el.innerText || "";
        const priceMatch = title.match(/\$\d[\d,\.]*/);
        const price = priceMatch ? priceMatch[0] : "";
        const image = el.querySelector("img")?.src || "";
        const link = el.querySelector("a")?.href || "";
        return { title, price, image, link, source: "Facebook Marketplace" };
      });
    });

    console.log("✅ Facebook scraped:", results.length);
    return results;
  } catch (err) {
    console.error("❌ Facebook scrape error:", err.message);
    return [];
  } finally {
    await browser.close();
  }
}

async function scrapeOfferUp(query) {
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
    );
    const url = `https://offerup.com/search/?q=${encodeURIComponent(query)}`;
    console.log("🌐 OfferUp URL:", url);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    await page.waitForSelector("a[href*='/item/detail/']", { timeout: 10000 });

    const results = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("a[href*='/item/detail/']"));
      return items.map((el) => {
        const title = el.querySelector("h2")?.innerText || "";
        const priceMatch = el.innerText.match(/\$\d[\d,\.]*/);
        const price = priceMatch ? priceMatch[0] : "";
        const image = el.querySelector("img")?.src || "";
        const link = "https://offerup.com" + el.getAttribute("href");
        return { title, price, image, link, source: "OfferUp" };
      });
    });

    console.log("✅ OfferUp scraped:", results.length);
    return results;
  } catch (err) {
    console.error("❌ OfferUp scrape error:", err.message);
    return [];
  } finally {
    await browser.close();
  }
}

async function scrapeMercari(query) {
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
    );
    const url = `https://www.mercari.com/search/?keyword=${encodeURIComponent(query)}`;
    console.log("🌐 Mercari URL:", url);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    await page.waitForSelector('li[data-testid="item-cell"]', { timeout: 10000 });

    const results = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('li[data-testid="item-cell"]'));
      return cards.map((card) => {
        const title = card.querySelector("p")?.innerText || "";
        const priceMatch = card.innerText.match(/\$\d[\d,\.]*/);
        const price = priceMatch ? priceMatch[0] : "";
        const image = card.querySelector("img")?.src || "";
        const linkPath = card.querySelector("a")?.href || "";
        return { title, price, image, link: linkPath, source: "Mercari" };
      });
    });

    console.log("✅ Mercari scraped:", results.length);
    return results;
  } catch (err) {
    console.error("❌ Mercari scrape error:", err.message);
    return [];
  } finally {
    await browser.close();
  }
}

async function scrapePrices(query) {
  console.log("🟡 Scraping for:", query);
  const allResults = await Promise.allSettled([
    scrapeFacebook(query),
    scrapeOfferUp(query),
    scrapeMercari(query),
  ]);

  const results = allResults
    .filter((res) => res.status === "fulfilled")
    .flatMap((res) => res.value || []);

  console.log(`📦 Total results: ${results.length}`);
  return results;
}

module.exports = { scrapePrices };
