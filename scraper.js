const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

// Helper to extract state abbreviation from "City, ST" style strings
const extractState = (text) => {
  const match = text?.match(/,\s*([A-Z]{2})(\s|$)/);
  return match ? match[1].toUpperCase() : '';
};

const scrapeFacebookMarketplace = async (query) => {
  try {
    const url = `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(query)}`;
    const browser = await puppeteer.launch({
         headless: true,
         args: ['--no-sandbox', '--disable-setuid-sandbox'],
         executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined, });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForTimeout(3000);

    const html = await page.content();
    await browser.close();
    const $ = cheerio.load(html);
    const listings = [];

    $("a[href*='/marketplace/item']").each((_, el) => {
      const title = $(el).find("div > div > span").first().text();
      const price = $(el).find("span:contains('$')").first().text();
      const url = `https://www.facebook.com${$(el).attr("href")}`;
      const image = $(el).find("img").attr("src");
      const location = $(el).find("div:contains(',')").last().text();
      const state = extractState(location);

      if (title && price && url) {
        listings.push({ title, price, url, image, location, state, source: 'facebook' });
      }
    });
    return listings;
  } catch (error) {
    console.error("Facebook scrape failed:", error.message);
    return [];
  }
};

const scrapeOfferUp = async (query) => {
  try {
    const url = `https://offerup.com/search/?q=${encodeURIComponent(query)}`;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForTimeout(3000);

    const html = await page.content();
    await browser.close();
    const $ = cheerio.load(html);
    const listings = [];

    $("a[href*='/item/detail']").each((_, el) => {
      const title = $(el).find("h2").text();
      const price = $(el).find("p:contains('$')").first().text();
      const url = `https://offerup.com${$(el).attr("href")}`;
      const image = $(el).find("img").attr("src");
      const location = $(el).find("span:contains(',')").text();
      const state = extractState(location);

      if (title && price && url) {
        listings.push({ title, price, url, image, location, state, source: 'offerup' });
      }
    });
    return listings;
  } catch (error) {
    console.error("OfferUp scrape failed:", error.message);
    return [];
  }
};

const scrapeMercari = async (query) => {
  try {
    const url = `https://www.mercari.com/search/?keyword=${encodeURIComponent(query)}`;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForTimeout(3000);

    const html = await page.content();
    await browser.close();
    const $ = cheerio.load(html);
    const listings = [];

    $("a[href*='/item/']").each((_, el) => {
      const title = $(el).find("p").first().text();
      const price = $(el).find("div:contains('$')").first().text();
      const url = `https://www.mercari.com${$(el).attr("href")}`;
      const image = $(el).find("img").attr("src");
      const location = $(el).find("div:contains(',')").last().text();
      const state = extractState(location);

      if (title && price && url) {
        listings.push({ title, price, url, image, location, state, source: 'mercari' });
      }
    });
    return listings;
  } catch (error) {
    console.error("Mercari scrape failed:", error.message);
    return [];
  }
};

module.exports = {
  scrapeFacebookMarketplace,
  scrapeOfferUp,
  scrapeMercari,
};
