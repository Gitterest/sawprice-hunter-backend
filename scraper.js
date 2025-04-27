// scraper.js - GOD TIER VERSION
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');

puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise(res => setTimeout(res, ms));

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

const scrapeFacebookMarketplace = async (query, cityState) => {
  const listings = [];
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/113.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  try {
    await page.goto('https://www.facebook.com/marketplace/', { waitUntil: 'networkidle2', timeout: 90000 });
    const searchUrl = `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 90000 });
    await autoScroll(page);
    await page.waitForSelector('[role="article"]', { timeout: 90000 });

    const data = await page.evaluate((cityState) => {
      const results = [];
      const articles = document.querySelectorAll('[role="article"]');
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
    console.error('❌ Facebook Scraper error:', error);
  } finally {
    await browser.close();
  }

  return listings;
};

const scrapeOfferUp = async (query, cityState) => {
  const listings = [];
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/113.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  try {
    const offerupUrl = `https://offerup.com/search/?q=${encodeURIComponent(query)}&location=${encodeURIComponent(cityState)}`;
    await page.goto(offerupUrl, { waitUntil: 'networkidle2', timeout: 90000 });
    await autoScroll(page);

    const data = await page.evaluate(() => {
      const results = [];
      const items = document.querySelectorAll('li[data-testid="item-tile"]');
      items.forEach(item => {
        const title = item.querySelector('p[data-testid="item-title"]')?.innerText || '';
        const price = item.querySelector('span[data-testid="item-price"]')?.innerText || '';
        const url = item.querySelector('a')?.href || '';
        const image = item.querySelector('img')?.src || '';
        const location = item.querySelector('p[data-testid="item-location"]')?.innerText || '';

        if (title && price && url) {
          results.push({
            title,
            price,
            url: `https://offerup.com${url}`,
            image,
            location,
          });
        }
      });
      return results;
    });

    listings.push(...data);
  } catch (error) {
    console.error('❌ OfferUp Scraper error:', error);
  } finally {
    await browser.close();
  }

  return listings;
};

const scrapeMercari = async (query, cityState) => {
  const listings = [];
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/113.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  try {
    const mercariUrl = `https://www.mercari.com/search/?keyword=${encodeURIComponent(query)}`;
    await page.goto(mercariUrl, { waitUntil: 'networkidle2', timeout: 90000 });
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
    console.error('❌ Mercari Scraper error:', error);
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