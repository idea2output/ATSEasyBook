import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ZARKA\\.gemini\\antigravity\\brain\\2f69f596-41b2-4280-b07f-e834ff1996f2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3008';

async function runPhase3Acceptance() {
  console.log('--- Starting Phase 3 Browser Acceptance Verification ---');
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
        if (!text.includes('favicon.ico')) {
          console.error('[BROWSER ERROR]', text);
          consoleErrors.push(text);
        }
      }
    });
    page.on('pageerror', (err) => {
      console.error('[BROWSER UNCAUGHT]', err.toString());
      consoleErrors.push(err.toString());
    });

    // 1. Dashboard: Load Sample Novel
    console.log('\n--- 1. Dashboard & Sample Novel Loading ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });

    await page.waitForFunction(() => document.body.innerText.includes('Load Sample Novel'), { timeout: 10000 });
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Load Sample Novel')
      );
      if (!btn) throw new Error('Load Sample Novel button not found');
      btn.click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.body.innerText.includes('Manuscript Editor'), { timeout: 15000 });
    console.log('✓ Navigated to book editor for sample novel at', page.url());

    // 2. Set Author Name
    console.log('\n--- 2. Setting Author Name ---');
    await page.waitForSelector('#book-author-input', { timeout: 5000 });
    await page.evaluate(() => {
      const input = document.querySelector('#book-author-input');
      if (input) {
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, 'Amjad Vance');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    console.log('✓ Author name set to "Amjad Vance"');

    // 3. Switch between all 6 templates & verify rendering
    console.log('\n--- 3. Testing 6 Book Templates & Two-Column Layout ---');
    await page.waitForSelector('#template-select', { timeout: 5000 });

    // A. Digest Novel 5.5 x 8.5
    await page.select('#template-select', 'digest-novel-5.5x8.5');
    await new Promise((r) => setTimeout(r, 600));
    console.log('✓ Switched to Digest Novel (5.5 × 8.5)');

    // B. Standard Paperback 6 x 9
    await page.select('#template-select', 'standard-paperback-6x9');
    await new Promise((r) => setTimeout(r, 600));
    console.log('✓ Switched to Standard Paperback (6 × 9)');

    // C. Nonfiction 6 x 9
    await page.select('#template-select', 'nonfiction-6x9');
    await new Promise((r) => setTimeout(r, 600));
    console.log('✓ Switched to Nonfiction (6 × 9)');

    // D. Illustrated Book 8 x 10
    await page.select('#template-select', 'illustrated-book-8x10');
    await new Promise((r) => setTimeout(r, 600));
    console.log('✓ Switched to Illustrated Book (8 × 10)');

    // Screenshot of template selection
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'screenshot-template-selection.png'),
    });
    console.log('✓ Saved screenshot-template-selection.png');

    // E. Magazine/Report A4 (Two columns)
    await page.select('#template-select', 'magazine-report-a4');
    await new Promise((r) => setTimeout(r, 800));

    // Verify 2-column DOM structure exists
    const hasTwoColumns = await page.evaluate(() => {
      const colGrids = document.querySelectorAll('.grid-cols-2');
      return colGrids.length > 0;
    });
    if (!hasTwoColumns) {
      throw new Error('Magazine/Report A4 did not render two-column grid in preview');
    }
    console.log('✓ Verified A4 Magazine two-column grid layout');

    // Screenshot of two-column layout
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'screenshot-two-column.png'),
    });
    console.log('✓ Saved screenshot-two-column.png');

    // Switch back to Classic Novel 6x9
    await page.select('#template-select', 'classic-novel-6x9');
    await new Promise((r) => setTimeout(r, 600));

    // 4. Test Typography Panel
    console.log('\n--- 4. Testing Typography Controls ---');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
      const typoTab = tabs.find((t) => t.textContent.includes('Typography'));
      if (!typoTab) throw new Error('Typography tab button not found');
      typoTab.click();
    });

    await page.waitForSelector('#chapter-opening-select', { timeout: 5000 });
    console.log('✓ Typography & Layout Settings panel loaded');

    // Enable Recto-Only chapter opening
    await page.select('#chapter-opening-select', 'recto-only');
    await new Promise((r) => setTimeout(r, 600));
    console.log('✓ Set chapter opening to recto-only in Typography panel');

    // Screenshot of Typography panel
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'screenshot-typography-panel.png'),
    });
    console.log('✓ Saved screenshot-typography-panel.png');

    // 5. Test Preflight Panel & Warnings Acknowledgment
    console.log('\n--- 5. Testing Print Preflight Panel ---');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
      const pfTab = tabs.find((t) => t.textContent.includes('Preflight'));
      if (!pfTab) throw new Error('Preflight tab button not found');
      pfTab.click();
    });

    await page.waitForFunction(() => document.body.innerText.includes('Preflight'), { timeout: 5000 });
    console.log('✓ Preflight panel opened and active');

    // Inspect preflight issues
    const issuesText = await page.evaluate(() => {
      const issues = Array.from(document.querySelectorAll('[class*="rounded-xl border"]')).map(el => el.innerText);
      const topBtnText = document.querySelector('#open-pdf-export-btn')?.innerText;
      return { issues, topBtnText, body: document.body.innerText.slice(0, 500) };
    });
    console.log('Preflight status:', issuesText.topBtnText);

    // Acknowledge warnings if present
    const ackChk = await page.$('#acknowledge-warnings-checkbox');
    if (ackChk) {
      await ackChk.click();
      await new Promise((r) => setTimeout(r, 600));
      console.log('✓ Clicked acknowledge warnings checkbox with real click');
    } else {
      console.log('Notice: No #acknowledge-warnings-checkbox found on page');
    }

    // Screenshot of Preflight panel
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'screenshot-preflight-panel.png'),
    });
    console.log('✓ Saved screenshot-preflight-panel.png');

    // 6. Test PDF Export Modal & Generation Flow
    console.log('\n--- 6. Testing PDF Export Flow ---');
    const topExportText = await page.evaluate(() => document.querySelector('#open-pdf-export-btn')?.innerText);
    console.log('Top Export Button text right before click:', topExportText);

    const exportBtn = await page.$('#open-pdf-export-btn');
    if (exportBtn) {
      await exportBtn.click();
    } else {
      throw new Error('#open-pdf-export-btn not found');
    }

    await page.waitForSelector('#pdf-export-title', { timeout: 5000 });
    console.log('✓ PDF Export modal opened');

    // Screenshot of Export Flow Modal
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'screenshot-export-flow.png'),
    });
    console.log('✓ Saved screenshot-export-flow.png');

    // Trigger PDF Export from the modal
    const startExportBtn = await page.$('#start-pdf-export-btn');
    if (!startExportBtn) throw new Error('#start-pdf-export-btn not found');
    await startExportBtn.click();

    await page.waitForFunction(
      () => document.body.innerText.includes('PDF Export Completed Successfully!') || document.body.innerText.includes('Exporting...'),
      { timeout: 15000 }
    );
    await page.waitForFunction(
      () => document.body.innerText.includes('PDF Export Completed Successfully!'),
      { timeout: 15000 }
    );
    console.log('✓ PDF Export completed successfully in browser modal');

    // Close modal
    const closeBtn = await page.$('#close-pdf-export-modal-btn');
    if (closeBtn) await closeBtn.click();
    await new Promise((r) => setTimeout(r, 400));

    // Verify Console Errors
    console.log('\n--- 7. Console Error Verification ---');
    console.log(`Total console errors detected: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      throw new Error(`Unexpected browser console errors encountered: ${consoleErrors.join('; ')}`);
    }
    console.log('✓ Zero console errors throughout execution');

    await browser.close();
    console.log('\n======================================================');
    console.log('✅ ALL PHASE 3 ACCEPTANCE CHECKS PASSED SUCCESSFULLY');
    console.log('======================================================');
  } catch (err) {
    console.error('Acceptance test failed:', err);
    await browser.close();
    process.exit(1);
  }
}

runPhase3Acceptance();
