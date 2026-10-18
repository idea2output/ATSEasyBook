import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ZARKA\\.gemini\\antigravity\\brain\\2f69f596-41b2-4280-b07f-e834ff1996f2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3008';

async function runPhase41Acceptance() {
  console.log('=== Starting ATS EasyBook Phase 4.1 Browser Acceptance Tests ===\n');

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

    // -------------------------------------------------------------
    // Step 1: Open /books/new and create project
    // -------------------------------------------------------------
    console.log('1. Navigating to /books/new to create project...');
    await page.goto(`${BASE_URL}/books/new`, { waitUntil: 'networkidle0' });

    await page.waitForSelector('#book-title', { timeout: 10000 });
    await page.type('#book-title', 'CMYK Prepress Edition');
    await page.type('#book-author', 'Master Typographer');

    // Submit "Create Project"
    await page.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Create Project')
      );
      if (!submitBtn) throw new Error('Create Project button not found');
      submitBtn.click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.body.innerText.includes('Manuscript Editor'), { timeout: 15000 });
    console.log('   Arrived at Studio URL:', page.url());

    // Ensure Expert Mode is active via toggle button
    const modeBtn = await page.$('#toggle-editor-mode-btn');
    if (modeBtn) {
      const text = await page.evaluate((el) => el.textContent, modeBtn);
      if (text.includes('Beginner Mode')) {
        console.log('   Switching to Expert Mode...');
        await modeBtn.click();
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    // Type manuscript text to populate preview pages
    console.log('   Adding manuscript content to generate pages...');
    await page.waitForSelector('#raw-manuscript-input');
    await page.type('#raw-manuscript-input', 'Chapter 1: The Voyage to Ultima Thule\n\nThe salt-crusted deck creaked under the weight of eighteen seasoned sailors. Above, the canvas strained in the arctic wind.\n\nA second paragraph describing the charting of the northern passage and navigation instruments.');
    await page.evaluate(() => {
      const formatBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('Format manuscript'));
      if (formatBtn) formatBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // -------------------------------------------------------------
    // Step 2: Verify "Color (CMYK)" tab in Expert Mode
    // -------------------------------------------------------------
    console.log('2. Verifying Expert Color (CMYK) tab...');
    await page.waitForSelector('#tab-color', { visible: true, timeout: 5000 });
    await page.click('#tab-color');
    await page.waitForSelector('[data-testid="color-management-panel"]', { visible: true, timeout: 5000 });

    // Verify FOGRA39 default is present
    const panelText = await page.$eval('[data-testid="color-management-panel"]', (el) => el.textContent);
    if (!panelText.includes('FOGRA39') || !panelText.includes('Standard Text Black (C0 M0 Y0 K100)')) {
      throw new Error('Color management panel missing FOGRA39 or 100K Black options!');
    }
    console.log('   Color Management Panel verified successfully with FOGRA39 and 100K Text Black.');

    // Screenshot 1: Color Management Panel
    const colorPanelScreenshot = path.join(ARTIFACT_DIR, 'screenshot-cmyk-color-panel.png');
    await page.screenshot({ path: colorPanelScreenshot });
    console.log('   Saved screenshot:', colorPanelScreenshot);

    // -------------------------------------------------------------
    // Step 3: Switch Profiles and Overprint Controls
    // -------------------------------------------------------------
    console.log('3. Testing Profile Selection and Overprint Toggles...');
    // Click FOGRA51
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('[data-testid="color-management-panel"] button'));
      const f51Btn = buttons.find((b) => b.textContent?.includes('FOGRA51'));
      if (f51Btn) f51Btn.click();
    });
    await new Promise((r) => setTimeout(r, 300));

    // Verify overprint toggles are checked
    const isTextOverprintChecked = await page.$eval(
      '#overprint-black-text-toggle',
      (el) => el.checked
    );
    const isRulesOverprintChecked = await page.$eval(
      '#overprint-black-rules-toggle',
      (el) => el.checked
    );
    if (!isTextOverprintChecked || !isRulesOverprintChecked) {
      throw new Error('Default overprint toggles should be checked!');
    }
    console.log('   Overprint 100K Black Text and Rules verified checked by default.');

    // -------------------------------------------------------------
    // Step 4: Verify Screen Preview Label
    // -------------------------------------------------------------
    console.log('4. Verifying Screen Preview (sRGB) indicator...');
    const bodyContent = await page.evaluate(() => document.body.innerText);
    if (!bodyContent.includes('Screen Preview (sRGB)')) {
      throw new Error('Missing Screen Preview (sRGB) badge in preview!');
    }
    console.log('   Verified Screen Preview (sRGB) label in preview toolbar.');

    // Screenshot 2: Screen Preview
    const previewScreenshot = path.join(ARTIFACT_DIR, 'screenshot-screen-preview-cmyk.png');
    await page.screenshot({ path: previewScreenshot });
    console.log('   Saved screenshot:', previewScreenshot);

    // -------------------------------------------------------------
    // Step 5: Export Modal CMYK Verification
    // -------------------------------------------------------------
    console.log('5. Triggering Export Dialog to verify CMYK specs...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const exportBtn = buttons.find((b) => b.textContent?.includes('Export') || b.textContent?.includes('Print'));
      if (exportBtn) exportBtn.click();
    });

    await page.waitForSelector('#pdf-export-title', { visible: true, timeout: 5000 });
    const modalText = await page.$eval('[role="dialog"]', (el) => el.textContent);
    if (!modalText.includes('CMYK Output Profile') || !modalText.includes('100K Pure Black • Overprint Active')) {
      throw new Error('Export dialog spec card missing CMYK Output Profile or 100K Overprint indicator!');
    }
    console.log('   Verified Export Dialog spec card displays CMYK Profile and 100K Overprint Active.');

    // Screenshot 3: Export Dialog
    const exportModalScreenshot = path.join(ARTIFACT_DIR, 'screenshot-cmyk-export-dialog.png');
    await page.screenshot({ path: exportModalScreenshot });
    console.log('   Saved screenshot:', exportModalScreenshot);

    // Close modal
    await page.click('#close-pdf-export-modal-btn');
    await new Promise((r) => setTimeout(r, 300));

    // -------------------------------------------------------------
    // Step 6: Verify Console Errors
    // -------------------------------------------------------------
    console.log('\n6. Checking Browser Console Errors...');
    if (consoleErrors.length > 0) {
      throw new Error(`Encountered ${consoleErrors.length} browser console errors:\n` + consoleErrors.join('\n'));
    }
    console.log('   SUCCESS: Zero browser console errors recorded!');

    console.log('\n=== All Phase 4.1 Browser Acceptance Tests Passed! ===\n');
  } finally {
    await browser.close();
  }
}

runPhase41Acceptance().catch((err) => {
  console.error('\nFAILED Phase 4.1 Acceptance Test:', err);
  process.exit(1);
});
