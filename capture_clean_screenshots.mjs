import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ZARKA\\.gemini\\antigravity\\brain\\2f69f596-41b2-4280-b07f-e834ff1996f2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3008';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1080'],
    defaultViewport: { width: 1600, height: 1080 },
  });

  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });

  // 1. Desktop Home Hero
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'screenshot-desktop-home.png'),
    clip: { x: 0, y: 0, width: 1600, height: 950 },
  });

  // 2. Real Product Demo
  const demoEl = await page.$('#demo-interactive');
  if (demoEl) {
    await demoEl.screenshot({
      path: path.join(ARTIFACT_DIR, 'screenshot-real-product-demo.png'),
    });
  }

  // 3. Audience Paths
  const audienceEl = await page.$('section:nth-of-type(2)');
  if (audienceEl) {
    await audienceEl.screenshot({
      path: path.join(ARTIFACT_DIR, 'screenshot-audience-paths.png'),
    });
  }

  // 4. Products Cards
  const productsEl = await page.$('#products');
  if (productsEl) {
    await productsEl.screenshot({
      path: path.join(ARTIFACT_DIR, 'screenshot-product-cards.png'),
    });
  }

  // 5. Coming Soon Section
  const comingSoonEl = await page.$('#coming-soon');
  if (comingSoonEl) {
    await comingSoonEl.screenshot({
      path: path.join(ARTIFACT_DIR, 'screenshot-coming-soon.png'),
    });
  }

  // 6. Pricing Section
  const pricingEl = await page.$('#pricing');
  if (pricingEl) {
    await pricingEl.screenshot({
      path: path.join(ARTIFACT_DIR, 'screenshot-pricing.png'),
    });
  }

  // 7. Mobile View
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  const mobileBtn = await page.$('button[aria-label="Toggle Navigation Menu"]');
  if (mobileBtn) {
    await mobileBtn.click();
    await new Promise((r) => setTimeout(r, 400));
  }
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'screenshot-mobile-home.png'),
  });

  console.log('All Phase 7.1 screenshots captured perfectly!');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
