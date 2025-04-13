const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const defaultLaunchOptions = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
};

async function scrapeFacebook(query) {
  try {
    const browser = await puppeteer.launch(defaultLaunchOptions);
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 800 });

    const url = `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(query)}`;
    console.log("🔵 Scraping Facebook:", url);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const items = await page.evaluate(() => {
      try {
        const cards = Array.from(document.querySelectorAll('[role="article"]'));
        return cards.map((card) => {
          const title = card.innerText || 'Untitled';
          const priceMatch = title.match(/\$\d[\d,.]*/);
          const price = priceMatch ? priceMatch[0] : '';
          const image = card.querySelector('img')?.src || '';
          const link = card.querySelector('a')?.href || '';
          return { title, price, image, link, source: "Facebook Marketplace" };
        });
      } catch (err) {
        console.error("❌ Facebook evaluate error:", err.message);
        return [];
      }
    });

    await browser.close();
    console.log(`✅ Facebook scraped ${items.length} items`);
    return items;
  } catch (err) {
    console.error("❌ Facebook failed:", err.message);
    return [];
  }
}

async function scrapeOfferUp(query) {
  try {
    const browser = await puppeteer.launch(defaultLaunchOptions);
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 800 });

    const url = `https://offerup.com/search/?q=${encodeURIComponent(query)}`;
    console.log("🟢 Scraping OfferUp:", url);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const items = await page.evaluate(() => {
      try {
        const elements = Array.from(document.querySelectorAll("a[href*='/item/detail/']"));
        return elements.map((el) => {
          const title = el.querySelector("h2")?.innerText || "No title";
          const priceMatch = el.innerText.match(/\$\d[\d,.]*/);
          const price = priceMatch ? priceMatch[0] : "";
          const image = el.querySelector("img")?.src || "";
          const link = "https://offerup.com" + el.getAttribute("href");
          return { title, price, image, link, source: "OfferUp" };
        });
      } catch (err) {
        console.error("❌ OfferUp evaluate error:", err.message);
        return [];
      }
    });

    await browser.close();
    console.log(`✅ OfferUp scraped ${items.length} items`);
    return items;
  } catch (err) {
    console.error("❌ OfferUp failed:", err.message);
    return [];
  }
}

async function scrapeMercari(query) {
  try {
    const browser = await puppeteer.launch(defaultLaunchOptions);
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 800 });

    const url = `https://www.mercari.com/search/?keyword=${encodeURIComponent(query)}`;
    console.log("🟣 Scraping Mercari:", url);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const items = await page.evaluate(() => {
      try {
        const cards = Array.from(document.querySelectorAll('li[data-testid="item-cell"]'));
        return cards.map((card) => {
          const title = card.querySelector("p")?.innerText || "No title";
          const priceMatch = card.innerText.match(/\$\d[\d,.]*/);
          const price = priceMatch ? priceMatch[0] : "";
          const image = card.querySelector("img")?.src || "";
          const linkPath = card.querySelector("a")?.getAttribute("href") || "";
          const link = `https://www.mercari.com${linkPath}`;
          return { title, price, image, link, source: "Mercari" };
        });
      } catch (err) {
        console.error("❌ Mercari evaluate error:", err.message);
        return [];
      }
    });

    await browser.close();
    console.log(`✅ Mercari scraped ${items.length} items`);
    return items;
  } catch (err) {
    console.error("❌ Mercari failed:", err.message);
    return [];
  }
}

async function scrapePrices(query) {
  console.log("🔍 Scraping initiated for:", query);

  const results = await Promise.allSettled([
    scrapeFacebook(query),
    scrapeOfferUp(query),
    scrapeMercari(query),
  ]);

  const final = results
    .filter(r => r.status === "fulfilled")
    .flatMap(r => r.value || []);

  console.log(`📦 Total results combined: ${final.length}`);
  return final;
}

module.exports = { scrapePrices };
