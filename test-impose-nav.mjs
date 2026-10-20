import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\ZARKA\\.gemini\\antigravity\\brain\\2f69f596-41b2-4280-b07f-e834ff1996f2';
const BASE_URL = 'http://localhost:3008';

async function main() {
  console.log('=== Starting Impose Navigation & Page Acceptance Test ===\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1080'],
    defaultViewport: { width: 1600, height: 1080 },
  });

  const page = await browser.newPage();

  console.log('[1] Navigating to Home Page http://localhost:3008...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });

  // 1. Verify Impose navbar item
  const imposeNavLink = await page.$('#public-nav-impose-link');
  if (!imposeNavLink) {
    throw new Error('Could not find #public-nav-impose-link in navbar');
  }

  const imposeNavText = await page.evaluate((el) => el.textContent.trim(), imposeNavLink);
  console.log('  -> Navbar link text:', imposeNavText);
  if (imposeNavText !== 'Impose') {
    throw new Error(`Expected navbar text to be "Impose", got "${imposeNavText}"`);
  }

  const navHref = await page.evaluate((el) => el.getAttribute('href'), imposeNavLink);
  console.log('  -> Navbar link href:', navHref);
  if (navHref !== '/products/impose') {
    throw new Error(`Expected navbar href to be "/products/impose", got "${navHref}"`);
  }

  // 2. Click the Impose navbar link
  console.log('\n[2] Clicking Impose in navbar...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    imposeNavLink.click(),
  ]);

  const currentUrl = page.url();
  console.log('  -> Navigated to URL:', currentUrl);
  if (!currentUrl.includes('/products/impose')) {
    throw new Error(`Expected URL to contain "/products/impose", got "${currentUrl}"`);
  }

  // 3. Verify elements on /products/impose
  const h1Text = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim());
  console.log('  -> Page H1:', h1Text);

  // Take screenshot of independent Impose marketing page
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'phase11_3-impose-independent-page.png'),
    fullPage: false,
  });
  console.log('  -> Captured screenshot: phase11_3-impose-independent-page.png');

  // 4. Click Launch ATS Impose button
  console.log('\n[3] Clicking "Launch ATS Impose" on the independent page...');
  const launchBtn = await page.$('#hero-launch-impose-direct-btn');
  if (!launchBtn) {
    throw new Error('Could not find #hero-launch-impose-direct-btn');
  }

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    launchBtn.click(),
  ]);

  const imposeUrl = page.url();
  console.log('  -> Workspace URL after launch:', imposeUrl);
  if (!imposeUrl.toLowerCase().includes('/impose')) {
    throw new Error(`Expected workspace URL to contain "/impose", got "${imposeUrl}"`);
  }

  // Wait for canvas or platform header
  await page.waitForSelector('header, canvas, .canvas-container', { timeout: 10000 });
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'phase11_3-launched-from-independent-page.png'),
    fullPage: false,
  });
  console.log('  -> Captured screenshot: phase11_3-launched-from-independent-page.png');

  // 5. Verify /dashboard uses "ATS Impose"
  console.log('\n[4] Navigating to /dashboard...');
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
  const dashboardBtnText = await page.evaluate(() =>
    document.querySelector('#dashboard-imposition-btn')?.textContent?.trim()
  );
  console.log('  -> Dashboard button text:', dashboardBtnText);
  if (!dashboardBtnText.includes('Impose') || dashboardBtnText.includes('Imposition')) {
    throw new Error(`Expected dashboard button to say "ATS Impose", got "${dashboardBtnText}"`);
  }

  // 6. Check Home page cards
  console.log('\n[5] Navigating to /#products to verify cards...');
  await page.goto(`${BASE_URL}/#products`, { waitUntil: 'networkidle2' });
  const cardTitle = await page.evaluate(() =>
    document.querySelector('#products h3:nth-of-type(1)')?.textContent?.trim()
  );
  const card3Text = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#products h3'));
    return cards.map((c) => c.textContent.trim());
  });
  console.log('  -> Product card titles on home page:', card3Text);
  if (!card3Text.includes('ATS Impose')) {
    throw new Error(`Expected "ATS Impose" in product cards, got: ${JSON.stringify(card3Text)}`);
  }

  console.log('\n=== ALL VERIFICATIONS PASSED CLEANLY! ===\n');
  await browser.close();
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
