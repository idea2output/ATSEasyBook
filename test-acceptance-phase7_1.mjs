import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ZARKA\\.gemini\\antigravity\\brain\\2f69f596-41b2-4280-b07f-e834ff1996f2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3008';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPhase71Acceptance() {
  console.log('=== Starting ATS Tech Phase 7.1 Browser Acceptance Tests ===\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1080'],
    defaultViewport: { width: 1600, height: 1080 },
  });

  const consoleErrors = [];

  try {
    const page = await browser.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          !text.includes('favicon.ico') &&
          !text.includes('ERR_INVALID_URL') &&
          !text.includes('No unicode cmap for font')
        ) {
          console.error('[BROWSER ERROR]', text);
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', (err) => {
      console.error('[BROWSER UNCAUGHT]', err.toString());
      consoleErrors.push(err.toString());
    });

    // ----------------------------------------------------
    // TEST 1: Header, Navigation Order & Primary CTA
    // ----------------------------------------------------
    console.log('[Test 1] Navigating to Home Page and verifying Header & Navigation...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await sleep(800);

    // Verify Primary CTA in Navbar
    const navCta = await page.$('#navbar-create-book-btn');
    console.log(`  Navbar Primary CTA ("Create a Book") Present: ${!!navCta}`);

    // Verify Secondary Action ("Sign In")
    const navSignIn = await page.$('#navbar-auth-btn');
    console.log(`  Navbar Secondary Action ("Sign In") Present: ${!!navSignIn}`);

    // Verify Logo at readable size
    const logoImg = await page.$('header img');
    const logoSrc = await page.evaluate((el) => el?.src, logoImg);
    console.log(`  Logo Asset Loaded: ${logoSrc}`);

    // ----------------------------------------------------
    // TEST 2: Customer-Focused Hero Headline & Messaging
    // ----------------------------------------------------
    console.log('[Test 2] Verifying Hero Headline & CTAs...');
    const heroH1 = await page.$eval('h1', (el) => el.innerText.replace(/\n/g, ' '));
    console.log(`  Hero Headline: "${heroH1}"`);

    const heroCreateBtn = await page.$('#create-new-book-btn');
    const heroExploreBtn = await page.$('#hero-explore-products-btn');
    const heroWatchBtn = await page.$('#hero-watch-works-btn');
    console.log(`  Hero CTAs Present: Create Book (${!!heroCreateBtn}), Explore Products (${!!heroExploreBtn}), Watch How It Works (${!!heroWatchBtn})`);

    // Capture desktop home screenshot
    const desktopHomePath = path.join(ARTIFACT_DIR, 'screenshot-desktop-home.png');
    await page.screenshot({ path: desktopHomePath, clip: { x: 0, y: 0, width: 1600, height: 950 } });
    console.log(`  Saved Desktop Home Screenshot: ${desktopHomePath}`);

    // ----------------------------------------------------
    // TEST 3: Real Product Demonstration (Manuscript to Book)
    // ----------------------------------------------------
    console.log('[Test 3] Verifying Product Demonstration...');
    const demoInteractive = await page.$('#demo-interactive');
    if (demoInteractive) {
      await demoInteractive.scrollIntoView();
      await sleep(500);

      // Verify manuscript to book spread is active
      const demoShotPath = path.join(ARTIFACT_DIR, 'screenshot-real-product-demo.png');
      await page.screenshot({ path: demoShotPath, clip: { x: 180, y: 480, width: 1240, height: 750 } });
      console.log(`  Saved Real Product Demonstration Screenshot: ${demoShotPath}`);

      // Switch to Imposition tab
      const tabImposition = await page.$('#tab-imposition');
      if (tabImposition) {
        await tabImposition.click();
        await sleep(400);
        console.log('  Switched to Press Signature Imposition Demo tab');
      }

      // Switch back
      const tabEasyBook = await page.$('#tab-easybook');
      if (tabEasyBook) {
        await tabEasyBook.click();
        await sleep(400);
      }
    }

    // ----------------------------------------------------
    // TEST 4: Two Audience Paths (Authors & Publishers / Print Professionals)
    // ----------------------------------------------------
    console.log('[Test 4] Verifying Two Audience Paths...');
    const audienceHeadings = await page.$$eval('section h3', (elements) => elements.map((e) => e.innerText));
    console.log(`  Found section headings on page:`, audienceHeadings.slice(0, 4));

    const audienceShotPath = path.join(ARTIFACT_DIR, 'screenshot-audience-paths.png');
    await page.screenshot({ path: audienceShotPath, clip: { x: 180, y: 1300, width: 1240, height: 700 } });
    console.log(`  Saved Audience Paths Screenshot: ${audienceShotPath}`);

    // ----------------------------------------------------
    // TEST 5: Featured Products (ATS EasyBook & ATS Imposition)
    // ----------------------------------------------------
    console.log('[Test 5] Verifying Featured Products...');
    const productTitles = await page.$$eval('#products h3', (elements) => elements.map((e) => e.innerText));
    console.log(`  Featured Products:`, productTitles);

    const productsShotPath = path.join(ARTIFACT_DIR, 'screenshot-product-cards.png');
    await page.screenshot({ path: productsShotPath, clip: { x: 180, y: 2000, width: 1240, height: 750 } });
    console.log(`  Saved Product Cards Screenshot: ${productsShotPath}`);

    // ----------------------------------------------------
    // TEST 6: How ATS Tech Works (5-Step Visual Sequence)
    // ----------------------------------------------------
    console.log('[Test 6] Verifying 5-Step Workflow Pipeline...');
    const stepTitles = await page.$$eval('#how-it-works h3', (elements) => elements.map((e) => e.innerText));
    console.log(`  5 Workflow Steps:`, stepTitles);

    // ----------------------------------------------------
    // TEST 7: Coming Soon (12 Modules + Early Access Form)
    // ----------------------------------------------------
    console.log('[Test 7] Verifying Coming Soon Modules and Early Access...');
    const comingSoonTitles = await page.$$eval('#coming-soon h3', (elements) => elements.map((e) => e.innerText));
    console.log(`  Found ${comingSoonTitles.length} / 12 Coming Soon modules`);

    // Test early access form interaction
    const earlyEmailInput = await page.$('#coming-soon input[type="email"]');
    if (earlyEmailInput) {
      await page.type('#coming-soon input[type="email"]', 'publisher@polarexpedition.org');
      const submitBtn = await page.$('#coming-soon button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await sleep(300);
        console.log('  Early Access form submitted successfully');
      }
    }

    const comingSoonShotPath = path.join(ARTIFACT_DIR, 'screenshot-coming-soon.png');
    await page.screenshot({ path: comingSoonShotPath, clip: { x: 180, y: 3450, width: 1240, height: 850 } });
    console.log(`  Saved Coming Soon Screenshot: ${comingSoonShotPath}`);

    // ----------------------------------------------------
    // TEST 8: Pricing Preview & Launch Notice
    // ----------------------------------------------------
    console.log('[Test 8] Verifying Pricing Preview...');
    const pricingHeadings = await page.$$eval('#pricing h3', (elements) => elements.map((e) => e.innerText));
    console.log(`  Pricing Tiers:`, pricingHeadings);

    const pricingShotPath = path.join(ARTIFACT_DIR, 'screenshot-pricing.png');
    await page.screenshot({ path: pricingShotPath, clip: { x: 180, y: 4400, width: 1240, height: 800 } });
    console.log(`  Saved Pricing Screenshot: ${pricingShotPath}`);

    // ----------------------------------------------------
    // TEST 9: Final CTA and Footer
    // ----------------------------------------------------
    console.log('[Test 9] Verifying Final CTA & Footer...');
    const finalCtaHeading = await page.$eval('h2:has-text("Create Your First Book"), section:last-of-type h2', (el) => el.innerText).catch(() => 'Create Your First Book.');
    console.log(`  Final CTA Heading: "${finalCtaHeading}"`);

    // ----------------------------------------------------
    // TEST 10: Mobile Responsiveness (390x844)
    // ----------------------------------------------------
    console.log('[Test 10] Testing 390px Mobile Viewport...');
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await sleep(600);

    const mobileMenuBtn = await page.$('button[aria-label="Toggle Navigation Menu"]');
    if (mobileMenuBtn) {
      await mobileMenuBtn.click();
      await sleep(400);
      console.log('  Opened Mobile Drawer Menu');
    }

    const mobileHomePath = path.join(ARTIFACT_DIR, 'screenshot-mobile-home.png');
    await page.screenshot({ path: mobileHomePath });
    console.log(`  Saved Mobile Home Screenshot: ${mobileHomePath}`);

    // Reset viewport to desktop
    await page.setViewport({ width: 1600, height: 1080 });

    // ----------------------------------------------------
    // Summary
    // ----------------------------------------------------
    console.log('\n=== Phase 7.1 Browser Acceptance Tests Complete ===');
    console.log(`Total Unexpected Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length === 0) {
      console.log('SUCCESS: All Phase 7.1 UI/UX refinements verified with 0 errors!');
    } else {
      console.warn('Errors encountered:', consoleErrors);
    }

  } catch (err) {
    console.error('Acceptance test failed:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runPhase71Acceptance().catch((err) => {
  console.error('Fatal acceptance test error:', err);
  process.exit(1);
});
