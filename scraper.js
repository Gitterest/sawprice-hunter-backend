const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const defaultLaunchOptions = {
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
};

async function scrapeFacebook(query) {
  try {
    const browser = await puppeteer.launch(defaultLaunchOptions);
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1280, height: 800 });

    const searchUrl = `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(query)}`;
    console.log("🟦 Scraping Facebook:", searchUrl);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    const items = await page.evaluate(() => {
      const listings = Array.from(document.querySelectorAll('[role="article"]'));
      return listings.map(item => {
        const title = item.innerText || '';
        const priceMatch = title.match(/\$\d[\d,.]*/);
        const price = priceMatch ? priceMatch[0] : null;
        const image = item.querySelector('img')?.src || '';
        const link = item.querySelector('a')?.href || '';
        return { title, price, image, link, source: 'Facebook Marketplace' };
      }).filter(i => i.link);
    });

    await browser.close();
    console.log(`✅ Facebook results: ${items.length}`);
    return items;
  } catch (err) {
    console.error("❌ Facebook scrape failed:", err.message);
    return [];
  }
}

async function scrapeOfferUp(query) {
  try {
    const browser = await puppeteer.launch(defaultLaunchOptions);
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1280, height: 800 });

    const url = `https://offerup.com/search/?q=${encodeURIComponent(query)}`;
    console.log("🟩 Scraping OfferUp:", url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const items = await page.evaluate(() => {
      const listings = Array.from(document.querySelectorAll('a[href*="/item/detail/"]'));
      return listings.map(item => {
        const title = item.querySelector('h2')?.innerText || 'No title';
        const price = item.innerText.match(/\$\d[\d,.]*/) || '';
        const image = item.querySelector('img')?.src || '';
        const link = `https://offerup.com${item.getAttribute('href')}`;
        return { title, price: price[0] || '', image, link, source: 'OfferUp' };
      });
    });

    await browser.close();
    console.log(`✅ OfferUp results: ${items.length}`);
    return items;
  } catch (err) {
    console.error("❌ OfferUp scrape failed:", err.message);
    return [];
  }
}

async function scrapeMercari(query) {
  try {
    const browser = await puppeteer.launch(defaultLaunchOptions);
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1280, height: 800 });

    const url = `https://www.mercari.com/search/?keyword=${encodeURIComponent(query)}`;
    console.log("🟪 Scraping Mercari:", url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const items = await page.evaluate(() => {
      const listings = Array.from(document.querySelectorAll('li[data-testid="item-cell"]'));
      return listings.map(item => {
        const title = item.querySelector('p')?.innerText || 'No title';
        const price = item.innerText.match(/\$\d[\d,.]*/) || '';
        const image = item.querySelector('img')?.src || '';
        const link = `https://www.mercari.com${item.querySelector('a')?.getAttribute('href')}`;
        return { title, price: price[0] || '', image, link, source: 'Mercari' };
      });
    });

    await browser.close();
    console.log(`✅ Mercari results: ${items.length}`);
    return items;
  } catch (err) {
    console.error("❌ Mercari scrape failed:", err.message);
    return [];
  }
}

async function scrapePrices(query) {
  console.log("🔍 Starting scrape for:", query);

  const sources = await Promise.allSettled([
    scrapeFacebook(query),
    scrapeOfferUp(query),
    scrapeMercari(query),
  ]);

  const results = sources
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value || []);

  console.log(`📦 Total combined results: ${results.length}`);
  return results;
}

module.exports = { scrapePrices };
