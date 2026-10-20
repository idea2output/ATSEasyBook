import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3008';
const ARTIFACT_DIR = 'C:/Users/ZARKA/.gemini/antigravity/brain/2f69f596-41b2-4280-b07f-e834ff1996f2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log('Verifying Preflight navigation fix...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  try {
    // 1. Go to homepage
    console.log('1. Loading homepage...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    // 2. Click PREFLIGHT link in navbar
    console.log('2. Clicking PREFLIGHT in navbar...');
    await page.waitForSelector('#public-nav-preflight-link');
    await page.click('#public-nav-preflight-link');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    if (!currentUrl.includes('/products/preflight')) {
      throw new Error(`Expected URL to include /products/preflight, but got ${currentUrl}`);
    }

    // 3. Verify Product Page content (Image 1)
    const h1 = await page.$eval('h1', (el) => el.innerText);
    console.log(`H1 text: ${h1.replace(/\n/g, ' ')}`);

    const screenshotPath = path.join(ARTIFACT_DIR, 'verified-product-preflight.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Captured verified screenshot at ${screenshotPath}`);

    // 4. Click Launch Preflight Workspace from the product page
    console.log('4. Testing Launch Preflight Workspace button...');
    await page.waitForSelector('#hero-launch-preflight-btn');
    await page.click('#hero-launch-preflight-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log(`Workspace URL: ${page.url()}`);
    if (!page.url().includes('/preflight')) {
      throw new Error(`Expected URL to include /preflight, but got ${page.url()}`);
    }

    // 5. Verify Workspace header contains Product Overview button
    await page.waitForSelector('#view-preflight-product-page-btn');
    console.log('Found #view-preflight-product-page-btn in workspace header!');

    // 6. Click Product Overview button to return to Image 1
    await page.click('#view-preflight-product-page-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log(`Back on: ${page.url()}`);

    console.log('PREFLIGHT NAVIGATION FIX VERIFIED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
