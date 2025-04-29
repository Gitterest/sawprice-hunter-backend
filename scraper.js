// scraper.js - FINAL STEALTH MOBILE PATCHED VERSION
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const autoScroll = async (page) => {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
};

const waitFor = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

const launchBrowser = async () => {
  return await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=375,812'
    ],
    defaultViewport: {
      width: 375,
      height: 812,
      isMobile: true,
      hasTouch: true
    },
    protocolTimeout: 60000,
    timeout: 60000,
  });
};

const safeGoto = async (page, url) => {
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await waitFor(5000);
  } catch (err) {
    console.warn('🔁 Retry page.goto:', url);
    await waitFor(3000);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await waitFor(5000);
  }
};

const scrapeFacebookMarketplace = async (query, cityState) => {
  const listings = [];
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A5341f Safari/604.1');

  try {
    await safeGoto(page, 'https://www.facebook.com/marketplace/');
    const searchUrl = `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(query)}`;
    await safeGoto(page, searchUrl);

    await page.waitForSelector('div[class*="x1i10hfl"]', { timeout: 60000 });
    await autoScroll(page);

    const data = await page.evaluate((cityState) => {
      const results = [];
      const articles = document.querySelectorAll('div[class*="x1i10hfl"]');
      articles.forEach(article => {
        const title = article.querySelector('span')?.innerText || '';
        const price = article.querySelector('span span')?.innerText || '';
        const url = article.querySelector('a')?.href || '';
        const image = article.querySelector('img')?.src || '';
        const locationText = article.innerText.toLowerCase();

        if (title && price && url && locationText.includes(cityState.toLowerCase())) {
          results.push({
            title,
            price,
            url,
            image,
            location: locationText,
          });
        }
      });
      return results;
    }, cityState);

    listings.push(...data);
  } catch (error) {
    console.error('❌ Facebook Scraper error:', error.message);
  } finally {
    await browser.close();
  }

  return listings;
};

const scrapeOfferUp = async (query, cityState) => {
  const listings = [];
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A5341f Safari/604.1');

  try {
    const offerupUrl = `https://offerup.com/search/?q=${encodeURIComponent(query)}`;
    await safeGoto(page, offerupUrl);
    await page.waitForSelector('a[data-qa-id="post-link"]', { timeout: 60000 });
    await autoScroll(page);

    const data = await page.evaluate(() => {
      const results = [];
      const items = document.querySelectorAll('a[data-qa-id="post-link"]');
      items.forEach(item => {
        const title = item.querySelector('p')?.innerText || '';
        const price = item.querySelector('span')?.innerText || '';
        const url = item.href || '';
        const image = item.querySelector('img')?.src || '';
        const location = item.innerText.toLowerCase();

        if (title && price && url) {
          results.push({
            title,
            price,
            url,
            image,
            location,
          });
        }
      });
      return results;
    });

    listings.push(...data);
  } catch (error) {
    console.error('❌ OfferUp Scraper error:', error.message);
  } finally {
    await browser.close();
  }

  return listings;
};

const scrapeMercari = async (query, cityState) => {
  const listings = [];
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A5341f Safari/604.1');

  try {
    const mercariUrl = `https://www.mercari.com/search/?keyword=${encodeURIComponent(query)}`;
    await safeGoto(page, mercariUrl);
    await page.waitForSelector('li[data-testid="ItemCell"]', { timeout: 60000 });
    await autoScroll(page);

    const data = await page.evaluate((cityState) => {
      const results = [];
      const items = document.querySelectorAll('li[data-testid="ItemCell"]');
      items.forEach(item => {
        const title = item.querySelector('p')?.innerText || '';
        const price = item.querySelector('div[data-testid="ItemPrice"]')?.innerText || '';
        const url = item.querySelector('a')?.href || '';
        const image = item.querySelector('img')?.src || '';
        const location = item.querySelector('div[data-testid="ItemShippingArea"]')?.innerText || '';

        if (title && price && url && location.toLowerCase().includes(cityState.toLowerCase())) {
          results.push({
            title,
            price,
            url: `https://www.mercari.com${url}`,
            image,
            location,
          });
        }
      });
      return results;
    }, cityState);

    listings.push(...data);
  } catch (error) {
    console.error('❌ Mercari Scraper error:', error.message);
  } finally {
    await browser.close();
  }

  return listings;
};

module.exports = {
  scrapeFacebookMarketplace,
  scrapeOfferUp,
  scrapeMercari
};
