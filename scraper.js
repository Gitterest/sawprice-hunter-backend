
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const launchOptions = { headless: 'new', args: ['--no-sandbox'] };

async function scrapeFacebookMarketplace() {
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  const listings = [];

  try {
    const url = 'https://www.facebook.com/marketplace/';
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    const articles = await page.$$('[role="article"]');
    for (let card of articles.slice(0, 5)) {
      const title = await card.$eval('span', el => el.innerText).catch(() => '');
      const image = await card.$eval('img', el => el.src).catch(() => '');
      const link = await card.$eval('a', a => a.href).catch(() => '');

      listings.push({ title, image, url: link, source: 'Facebook' });
    }
  } catch (error) {
    console.error('Facebook scraping failed:', error.message);
  } finally {
    await browser.close();
  }

  return { listings };
}

async function scrapeOfferUp() {
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  const listings = [];

  try {
    await page.goto('https://offerup.com/search/?q=chainsaw', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('div.Item', { timeout: 8000 });

    const items = await page.$$('div.Item');
    for (let card of items.slice(0, 5)) {
      const title = await card.$eval('.ItemTitle', el => el.innerText).catch(() => '');
      const price = await card.$eval('.ItemPrice', el => el.innerText).catch(() => '');
      const image = await card.$eval('img', el => el.src).catch(() => '');
      const link = await card.$eval('a', a => 'https://offerup.com' + a.getAttribute('href')).catch(() => '');

      listings.push({ title, price, image, url: link, source: 'OfferUp' });
    }
  } catch (error) {
    console.error('OfferUp scraping failed:', error.message);
  } finally {
    await browser.close();
  }

  return { listings };
}

async function scrapeMercari() {
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  const listings = [];

  try {
    await page.goto('https://www.mercari.com/search/?keyword=chainsaw', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('li[data-testid="item-cell"]', { timeout: 8000 });

    const cards = await page.$$('li[data-testid="item-cell"]');
    for (let card of cards.slice(0, 5)) {
      const title = await card.$eval('[data-testid="item-title"]', el => el.innerText).catch(() => '');
      const price = await card.$eval('[data-testid="item-price"]', el => el.innerText).catch(() => '');
      const image = await card.$eval('img', img => img.src).catch(() => '');
      const link = await card.$eval('a', a => 'https://www.mercari.com' + a.getAttribute('href')).catch(() => '');

      listings.push({ title, price, image, url: link, source: 'Mercari' });
    }
  } catch (error) {
    console.error('Mercari scraping failed:', error.message);
  } finally {
    await browser.close();
  }

  return { listings };
}

module.exports = {
  scrapeFacebookMarketplace,
  scrapeOfferUp,
  scrapeMercari
};
