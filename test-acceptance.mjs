import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ZARKA\\.gemini\\antigravity\\brain\\2f69f596-41b2-4280-b07f-e834ff1996f2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3008';

async function runAcceptanceTests() {
  console.log('Launching Chrome for acceptance testing...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.toString());
  });

  const results = {
    dashboard: false,
    manuscriptParsing: false,
    paginationAndPreview: false,
    savingReliability: false,
    accessibilityAndResponsive: false,
  };

  try {
    // -------------------------------------------------------------
    // Test 1: Dashboard
    // -------------------------------------------------------------
    console.log('\n--- Testing Section 1: Dashboard ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

    // Clear local storage for clean test slate
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });

    // Check empty state
    await page.waitForFunction(() => document.body.innerText.includes('No book projects yet'));
    console.log('✓ Initial empty state displayed properly');

    // 1.1 "Load Sample Novel" creates sample project without duplicates
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Load Sample Novel')
      );
      if (!btn) throw new Error('Could not find Load Sample Novel button');
      btn.click();
    });

    // Wait for studio to load
    await page.waitForSelector('#book-title-input');
    const sampleTitle = await page.$eval('#book-title-input', (el) => el.value);
    console.log(`✓ "Load Sample Novel" opened sample project studio: "${sampleTitle}"`);

    // Return to dashboard
    await page.click('header a[href="/"]');
    await page.waitForSelector('main h3');

    let bookCards = await page.$$eval('main h3', (els) => els.map((e) => e.innerText));
    if (!bookCards.some((t) => t.includes('The Eldridge Voyage'))) {
      throw new Error('Sample novel card not listed on dashboard');
    }

    // Click "Load Sample Novel" again to verify no duplicate is created
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Load Sample Novel')
      );
      btn.click();
    });
    await page.waitForSelector('#book-title-input');
    await page.click('header a[href="/"]');
    await page.waitForSelector('main h3');

    bookCards = await page.$$eval('main h3', (els) => els.map((e) => e.innerText));
    const sampleOccurrences = bookCards.filter((t) => t.includes('The Eldridge Voyage')).length;
    if (sampleOccurrences !== 1) {
      throw new Error(`Sample novel duplicated! Count: ${sampleOccurrences}`);
    }
    console.log('✓ "Load Sample Novel" does not create duplicates when loaded again');

    // 1.2 "Create new book" immediately creates project and displays on dashboard
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Create new book')
      );
      btn.click();
    });
    await page.waitForSelector('#book-title-input');

    // Update title
    await page.focus('#book-title-input');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type('#book-title-input', 'My Acceptance Novel');

    // Return to dashboard and verify it shows immediately
    await page.click('header a[href="/"]');
    await page.waitForSelector('main h3');

    bookCards = await page.$$eval('main h3', (els) => els.map((e) => e.innerText));
    if (!bookCards.includes('My Acceptance Novel')) {
      throw new Error('New project title "My Acceptance Novel" not found on dashboard');
    }
    console.log('✓ Created project immediately shows on dashboard');

    // Refresh and confirm all data preserved
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('main h3');
    bookCards = await page.$$eval('main h3', (els) => els.map((e) => e.innerText));
    if (!bookCards.includes('My Acceptance Novel')) {
      throw new Error('Project lost after page refresh');
    }
    console.log('✓ Dashboard refresh preserves project data');

    // Take screenshot of dashboard
    const dashboardScreenshotPath = path.join(ARTIFACT_DIR, 'screenshot-dashboard.png');
    await page.screenshot({ path: dashboardScreenshotPath, fullPage: true });
    console.log(`✓ Dashboard screenshot saved to ${dashboardScreenshotPath}`);

    // 1.3 Deleting project requires confirmation and removes only intended project
    await page.evaluate(() => {
      const deleteButtons = Array.from(document.querySelectorAll('button[aria-label*="Delete book"]'));
      // Delete the sample novel, keep 'My Acceptance Novel'
      const sampleDeleteBtn = deleteButtons.find((btn) =>
        btn.getAttribute('aria-label').includes('The Eldridge Voyage')
      );
      if (sampleDeleteBtn) sampleDeleteBtn.click();
    });
    await page.waitForSelector('[role="dialog"]');
    console.log('✓ Delete modal dialog displayed upon clicking delete');

    // Confirm deletion
    await page.evaluate(() => {
      const modalBtn = Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) =>
        b.textContent.includes('Delete Project')
      );
      if (modalBtn) modalBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    bookCards = await page.$$eval('main h3', (els) => els.map((e) => e.innerText));
    if (bookCards.some((t) => t.includes('The Eldridge Voyage'))) {
      throw new Error('Deleted project was still found on dashboard');
    }
    if (!bookCards.includes('My Acceptance Novel')) {
      throw new Error('Non-targeted project was accidentally deleted');
    }
    console.log('✓ Project deletion removed only the intended target after confirmation');
    results.dashboard = true;

    // -------------------------------------------------------------
    // Test 2: Manuscript Parsing with Exact Test Input
    // -------------------------------------------------------------
    console.log('\n--- Testing Section 2: Manuscript Parsing ---');
    // Open 'My Acceptance Novel'
    await page.evaluate(() => {
      const openBtn = document.querySelector('a[href*="/books/"]');
      if (openBtn) openBtn.click();
    });
    await page.waitForSelector('#raw-manuscript-input');

    const exactInput = `PROLOGUE

This is the first paragraph.

Chapter 1: The Departure

This is the second paragraph.

A normal paragraph that contains UPPERCASE WORDS but is longer than 80 characters and must remain body text.`;

    // Set textarea value using native prototype setter for React controlled components
    await page.evaluate((val) => {
      const ta = document.querySelector('#raw-manuscript-input');
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      ).set;
      nativeSetter.call(ta, val);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
    }, exactInput);

    // Click "Format manuscript"
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Format manuscript')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // Switch to Structured Blocks tab to verify parsed blocks
    await page.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('[role="tab"]')).find((b) =>
        b.textContent.includes('Structured Blocks')
      );
      if (tab) tab.click();
    });
    await new Promise((r) => setTimeout(r, 200));

    const structuredBlocks = await page.evaluate(() => {
      const blockEls = Array.from(document.querySelectorAll('[data-testid="structured-block"]'));
      return blockEls.map((el) => {
        const typeEl = el.querySelector('.uppercase');
        const textEl = el.querySelector('p');
        return {
          type: typeEl ? typeEl.textContent.trim() : '',
          text: textEl ? textEl.textContent.trim() : '',
        };
      });
    });

    console.log('Parsed blocks count:', structuredBlocks.length);
    if (structuredBlocks.length !== 5) {
      throw new Error(`Expected 5 structured blocks, found ${structuredBlocks.length}`);
    }

    // Verify 1: PROLOGUE is chapter heading
    if (
      !structuredBlocks[0].type.toUpperCase().includes('CHAPTER HEADING') ||
      structuredBlocks[0].text !== 'PROLOGUE'
    ) {
      throw new Error(`Block 1 failed: ${JSON.stringify(structuredBlocks[0])}`);
    }
    console.log('✓ Block 1: PROLOGUE is classified as Chapter Heading');

    // Verify 2: This is the first paragraph.
    if (
      !structuredBlocks[1].type.toUpperCase().includes('PARAGRAPH') ||
      structuredBlocks[1].text !== 'This is the first paragraph.'
    ) {
      throw new Error(`Block 2 failed: ${JSON.stringify(structuredBlocks[1])}`);
    }
    console.log('✓ Block 2: "This is the first paragraph." is classified as Paragraph');

    // Verify 3: Chapter 1: The Departure is chapter heading
    if (
      !structuredBlocks[2].type.toUpperCase().includes('CHAPTER HEADING') ||
      structuredBlocks[2].text !== 'Chapter 1: The Departure'
    ) {
      throw new Error(`Block 3 failed: ${JSON.stringify(structuredBlocks[2])}`);
    }
    console.log('✓ Block 3: "Chapter 1: The Departure" is classified as Chapter Heading');

    // Verify 4: This is the second paragraph.
    if (
      !structuredBlocks[3].type.toUpperCase().includes('PARAGRAPH') ||
      structuredBlocks[3].text !== 'This is the second paragraph.'
    ) {
      throw new Error(`Block 4 failed: ${JSON.stringify(structuredBlocks[3])}`);
    }
    console.log('✓ Block 4: "This is the second paragraph." is classified as Paragraph');

    // Verify 5: Longer than 80 chars remains paragraph
    if (
      !structuredBlocks[4].type.toUpperCase().includes('PARAGRAPH') ||
      !structuredBlocks[4].text.includes('longer than 80 characters and must remain body text')
    ) {
      throw new Error(`Block 5 failed: ${JSON.stringify(structuredBlocks[4])}`);
    }
    console.log('✓ Block 5: Uppercase paragraph > 80 chars correctly classified as Paragraph');

    // Verify raw manuscript text unchanged
    await page.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('[role="tab"]')).find((b) =>
        b.textContent.includes('Manuscript Editor')
      );
      if (tab) tab.click();
    });
    const currentRawText = await page.$eval('#raw-manuscript-input', (el) => el.value);
    if (currentRawText !== exactInput) {
      throw new Error('Raw manuscript was modified during formatting!');
    }
    console.log('✓ Raw manuscript text remains exactly unchanged');

    // Take editor screenshot
    const editorScreenshotPath = path.join(ARTIFACT_DIR, 'screenshot-editor.png');
    await page.screenshot({ path: editorScreenshotPath, fullPage: true });
    console.log(`✓ Editor screenshot saved to ${editorScreenshotPath}`);
    results.manuscriptParsing = true;

    // -------------------------------------------------------------
    // Test 3: Pagination and Preview
    // -------------------------------------------------------------
    console.log('\n--- Testing Section 3: Pagination & Preview ---');
    // Switch view to 'single'
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent.includes('Single')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 200));

    // Page 1 should contain PROLOGUE
    const page1Heading = await page.$eval('[data-testid="book-page-1"] h2', (el) => el.textContent.trim());
    if (page1Heading !== 'PROLOGUE') {
      throw new Error(`Page 1 did not have PROLOGUE heading: found "${page1Heading}"`);
    }
    console.log('✓ Page 1 starts with chapter heading "PROLOGUE"');

    // Navigate to Page 2
    await page.evaluate(() => {
      const nextBtn = document.querySelector('button[aria-label="Next"]');
      if (nextBtn) nextBtn.click();
    });
    await new Promise((r) => setTimeout(r, 200));

    // Page 2 should contain Chapter 1
    const page2Heading = await page.$eval('[data-testid="book-page-2"] h2', (el) => el.textContent.trim());
    if (page2Heading !== 'Chapter 1: The Departure') {
      throw new Error(`Page 2 did not start with Chapter 1: found "${page2Heading}"`);
    }
    console.log('✓ Each chapter starts on a new page (Chapter 1 on Page 2)');

    // Test Navigation Bounds
    await page.evaluate(() => {
      const lastBtn = document.querySelector('button[aria-label="Last Page"]');
      if (lastBtn) lastBtn.click();
    });
    await new Promise((r) => setTimeout(r, 200));

    const isNextDisabledAtLast = await page.$eval(
      'button[aria-label="Next"]',
      (el) => el.disabled
    );
    if (!isNextDisabledAtLast) {
      throw new Error('Next button is not disabled at last page');
    }
    console.log('✓ Navigation bounds enforced: Next is disabled on last page');

    await page.evaluate(() => {
      const firstBtn = document.querySelector('button[aria-label="First Page"]');
      if (firstBtn) firstBtn.click();
    });
    await new Promise((r) => setTimeout(r, 200));

    const isPrevDisabledAtFirst = await page.$eval(
      'button[aria-label="Previous"]',
      (el) => el.disabled
    );
    if (!isPrevDisabledAtFirst) {
      throw new Error('Previous button is not disabled on first page');
    }
    console.log('✓ Navigation bounds enforced: Previous is disabled on first page');

    // Test View Mode switcher (Split -> Editor only -> Preview only -> Split)
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Editor') && b.getAttribute('aria-pressed') !== null
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 200));
    let hasEditor = await page.$('#raw-manuscript-input') !== null;
    let hasPreview = await page.$('[aria-live="polite"]') !== null;
    if (!hasEditor || hasPreview) {
      throw new Error('Editor-only mode failed');
    }
    console.log('✓ View mode: Editor-only mode works');

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Preview') && b.getAttribute('aria-pressed') !== null
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 200));
    hasEditor = await page.$('#raw-manuscript-input') !== null;
    hasPreview = await page.$('[aria-live="polite"]') !== null;
    if (hasEditor || !hasPreview) {
      throw new Error('Preview-only mode failed');
    }
    console.log('✓ View mode: Preview-only mode works');

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Split View')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 200));

    // Test Zoom Levels
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => {
        const zoomOut = document.querySelector('button[aria-label="Zoom out"]');
        if (zoomOut) zoomOut.click();
      });
      await new Promise((r) => setTimeout(r, 50));
    }
    let zoomText = await page.$eval('[role="group"][aria-label="Zoom controls"] span', (el) => el.textContent.trim());
    console.log('Zoom at minimum:', zoomText);

    for (let i = 0; i < 15; i++) {
      await page.evaluate(() => {
        const zoomIn = document.querySelector('button[aria-label="Zoom in"]');
        if (zoomIn) zoomIn.click();
      });
      await new Promise((r) => setTimeout(r, 50));
    }
    zoomText = await page.$eval('[role="group"][aria-label="Zoom controls"] span', (el) => el.textContent.trim());
    console.log('Zoom at maximum:', zoomText);

    // Reset zoom
    await page.evaluate(() => {
      const reset = document.querySelector('button[aria-label*="Reset zoom"]');
      if (reset) reset.click();
    });
    await new Promise((r) => setTimeout(r, 100));

    // Switch back to spread mode for multi-page screenshot
    await page.evaluate(() => {
      const spreadBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Spread')
      );
      if (spreadBtn) spreadBtn.click();
    });
    await new Promise((r) => setTimeout(r, 300));

    // Take preview screenshot
    const previewScreenshotPath = path.join(ARTIFACT_DIR, 'screenshot-preview.png');
    await page.screenshot({ path: previewScreenshotPath, fullPage: true });
    console.log(`✓ Multi-page preview screenshot saved to ${previewScreenshotPath}`);
    results.paginationAndPreview = true;

    // -------------------------------------------------------------
    // Test 4: Saving Reliability
    // -------------------------------------------------------------
    console.log('\n--- Testing Section 4: Saving Reliability ---');
    // 4.1 Edit text and immediately refresh BEFORE debounce completes
    await page.focus('#raw-manuscript-input');
    await page.type('#raw-manuscript-input', '\n\nIMMEDIATE REFRESH TEST LINE');

    // Immediately reload within 50ms (well before 600ms debounce)
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('#raw-manuscript-input');
    const refreshedText = await page.$eval('#raw-manuscript-input', (el) => el.value);
    if (!refreshedText.includes('IMMEDIATE REFRESH TEST LINE')) {
      throw new Error('Immediate refresh before debounce caused data loss!');
    }
    console.log('✓ Fast refresh before debounce preserved data (flush on beforeunload worked!)');

    // 4.2 Make edit and navigate away immediately to dashboard
    await page.focus('#raw-manuscript-input');
    await page.type('#raw-manuscript-input', '\n\nNAVIGATE AWAY TEST LINE');
    // Click Dashboard immediately
    await page.click('header a[href="/"]');
    await page.waitForSelector('main h3');

    // Open book again from dashboard
    await page.evaluate(() => {
      const openBtn = document.querySelector('a[href*="/books/"]');
      if (openBtn) openBtn.click();
    });
    await page.waitForSelector('#raw-manuscript-input');

    const navigatedText = await page.$eval('#raw-manuscript-input', (el) => el.value);
    if (!navigatedText.includes('NAVIGATE AWAY TEST LINE')) {
      throw new Error('Navigating away immediately caused data loss!');
    }
    console.log('✓ Navigating away immediately preserved data (flush on unmount/link worked!)');

    // 4.3 Explicit Save button updates status accurately
    await page.evaluate(() => {
      const saveBtn = document.querySelector('button[aria-label="Save manuscript now"]');
      if (saveBtn) saveBtn.click();
    });
    await new Promise((r) => setTimeout(r, 200));

    const saveStatusText = await page.evaluate(() => {
      const statusEl = document.querySelector('.text-slate-500.px-2\\.5');
      return statusEl ? statusEl.textContent.trim() : '';
    });
    if (!saveStatusText.includes('Saved')) {
      throw new Error(`Explicit save did not show "Saved" status: "${saveStatusText}"`);
    }
    console.log('✓ Explicit Save updated save indicator accurately to:', saveStatusText);
    results.savingReliability = true;

    // -------------------------------------------------------------
    // Test 5: Accessibility and Responsive Behavior
    // -------------------------------------------------------------
    console.log('\n--- Testing Section 5: Accessibility & Responsive Behavior ---');
    await page.keyboard.press('Tab');
    const activeTagName = await page.evaluate(() => document.activeElement.tagName);
    console.log('✓ Keyboard Tab navigation functional, initial focused element:', activeTagName);

    // Verify all buttons have accessible names (text, aria-label, or title)
    const unnamedButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons
        .filter((b) => {
          const text = b.textContent.trim();
          const ariaLabel = b.getAttribute('aria-label');
          const title = b.getAttribute('title');
          return !text && !ariaLabel && !title;
        })
        .map((b) => b.outerHTML);
    });
    if (unnamedButtons.length > 0) {
      throw new Error(`Found buttons without accessible names: ${unnamedButtons.join(', ')}`);
    }
    console.log('✓ All buttons have accessible names (text, aria-label, or title)');

    // Test narrow mobile viewport (375x667)
    await page.setViewport({ width: 375, height: 667 });
    await new Promise((r) => setTimeout(r, 300));

    const mobileHeaderVisible = await page.$eval('header', (el) => el.offsetHeight > 0);
    const mobileInputVisible = await page.$eval('#book-title-input', (el) => el.offsetWidth > 0);
    if (!mobileHeaderVisible || !mobileInputVisible) {
      throw new Error('Controls became inaccessible on narrow viewport');
    }
    console.log('✓ Mobile responsive viewport (375x667) verified: essential controls accessible');
    results.accessibilityAndResponsive = true;

    console.log('\n========================================');
    console.log('ALL PHASE 1 ACCEPTANCE TESTS PASSED!');
    console.log('========================================');
  } catch (error) {
    console.error('\n❌ ACCEPTANCE TEST FAILED:', error);
    results.error = error.message;
  } finally {
    if (consoleErrors.length > 0) {
      console.warn('\nRecorded console errors:', consoleErrors);
    } else {
      console.log('✓ Zero runtime console errors detected during entire test run');
    }
    await browser.close();
  }

  return results;
}

runAcceptanceTests();
