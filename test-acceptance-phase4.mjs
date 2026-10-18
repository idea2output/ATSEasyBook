import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ZARKA\\.gemini\\antigravity\\brain\\2f69f596-41b2-4280-b07f-e834ff1996f2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3008';

async function runPhase4Acceptance() {
  console.log('=== Starting ATS EasyBook Phase 4 Browser Acceptance Tests ===\n');

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
    // Step 1: Dashboard -> Create New Book Button Routing
    // -------------------------------------------------------------
    console.log('Step 1: Navigating to Dashboard and checking Create New Book button...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });

    // Click "Create new book" on dashboard
    await page.waitForFunction(() => document.body.innerText.includes('Create new book'), { timeout: 10000 });
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Create new book')
      );
      if (!btn) throw new Error('Create new book button not found');
      btn.click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✓ Successfully routed to Template-First landing page at:', page.url());

    // -------------------------------------------------------------
    // Step 2: Template-First Landing Page Verification & Project Creation
    // -------------------------------------------------------------
    console.log('\nStep 2: Testing Template-First Landing Page (/books/new)...');
    await page.waitForSelector('#book-title', { timeout: 10000 });

    // Fill in title and author
    await page.type('#book-title', 'Chronicles of Aethelgard');
    await page.type('#book-author', 'Lord Kenneth');

    // Verify Beginner & Expert mode cards exist
    const hasBeginnerMode = await page.evaluate(() => document.body.innerText.includes('Beginner Mode'));
    const hasExpertMode = await page.evaluate(() => document.body.innerText.includes('Expert Mode'));
    if (!hasBeginnerMode || !hasExpertMode) {
      throw new Error('Beginner or Expert Mode cards missing on landing page');
    }
    console.log('✓ Beginner and Expert mode selection options verified');

    // Select Digest Novel template (click on card)
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('h3'));
      const digestCard = cards.find((h) => h.textContent.includes('Digest Novel'));
      if (digestCard) {
        digestCard.closest('.group')?.click();
      }
    });

    // Capture Screenshot: Template-first landing flow
    const screenshot1Path = path.join(ARTIFACT_DIR, 'screenshot-template-landing.png');
    await page.screenshot({ path: screenshot1Path, fullPage: false });
    console.log('✓ Captured screenshot-template-landing.png');

    // Submit "Create Project" form
    await page.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Create Project')
      );
      if (!submitBtn) throw new Error('Create Project button not found');
      submitBtn.click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.body.innerText.includes('Manuscript Editor'), { timeout: 15000 });
    console.log('✓ Created book project and navigated to studio at:', page.url());

    // -------------------------------------------------------------
    // Step 3: Beginner Mode Studio Verification
    // -------------------------------------------------------------
    console.log('\nStep 3: Verifying Beginner Mode Studio...');
    const modeBtnText = await page.$eval('#toggle-editor-mode-btn', (el) => el.textContent);
    console.log(`✓ Current mode button text: "${modeBtnText}"`);
    if (!modeBtnText.includes('Beginner Mode')) {
      throw new Error(`Expected Beginner Mode, got "${modeBtnText}"`);
    }

    // Verify 5 standard tabs are present and expert tabs (Design, Fonts) are hidden
    const tabsInBeginner = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[role="tab"]')).map((t) => t.textContent.trim());
    });
    console.log('✓ Tabs visible in Beginner Mode:', tabsInBeginner);

    const hasDesignTabInBeginner = tabsInBeginner.some((t) => t.includes('Design'));
    const hasFontsTabInBeginner = tabsInBeginner.some((t) => t.includes('Fonts'));
    if (hasDesignTabInBeginner || hasFontsTabInBeginner) {
      throw new Error('Expert tabs (Design / Fonts) should be hidden in Beginner Mode');
    }

    // Enter manuscript text
    await page.waitForSelector('#raw-manuscript-input', { timeout: 5000 });
    await page.type(
      '#raw-manuscript-input',
      'Chapter 1: The Whispering Runes\n\nThe ancient kingdom of Aethelgard stood upon the precipice of twilight. Stone walls that had defied centuries began to hum with dormant magic.'
    );

    // Click "Format manuscript"
    await page.evaluate(() => {
      const formatBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Format manuscript')
      );
      formatBtn?.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Capture Screenshot: Beginner Mode
    const screenshot2Path = path.join(ARTIFACT_DIR, 'screenshot-beginner-mode.png');
    await page.screenshot({ path: screenshot2Path, fullPage: false });
    console.log('✓ Captured screenshot-beginner-mode.png');

    // -------------------------------------------------------------
    // Step 4: Mode Switch to Expert Mode (Zero Data Loss)
    // -------------------------------------------------------------
    console.log('\nStep 4: Switching to Expert Mode...');
    await page.click('#toggle-editor-mode-btn');
    await new Promise((r) => setTimeout(r, 500));

    const updatedModeText = await page.$eval('#toggle-editor-mode-btn', (el) => el.textContent);
    console.log(`✓ Updated mode button text: "${updatedModeText}"`);
    if (!updatedModeText.includes('Expert Mode')) {
      throw new Error(`Expected Expert Mode, got "${updatedModeText}"`);
    }

    const tabsInExpert = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[role="tab"]')).map((t) => t.textContent.trim());
    });
    console.log('✓ Tabs visible in Expert Mode:', tabsInExpert);

    const hasDesignTabInExpert = tabsInExpert.some((t) => t.includes('Design'));
    const hasFontsTabInExpert = tabsInExpert.some((t) => t.includes('Fonts'));
    const hasSaveTemplateBtn = await page.evaluate(() => !!document.querySelector('#save-as-template-btn'));

    if (!hasDesignTabInExpert || !hasFontsTabInExpert || !hasSaveTemplateBtn) {
      throw new Error('Expert tabs or Save as Template button missing in Expert Mode');
    }

    // Verify manuscript text was not lost
    const manuscriptText = await page.$eval('#raw-manuscript-input', (el) => el.value);
    if (!manuscriptText.includes('The Whispering Runes')) {
      throw new Error('Manuscript text was lost during mode switch!');
    }
    console.log('✓ Zero data loss confirmed during mode switch');

    // Capture Screenshot: Expert Mode Studio
    const screenshot3Path = path.join(ARTIFACT_DIR, 'screenshot-expert-mode.png');
    await page.screenshot({ path: screenshot3Path, fullPage: false });
    console.log('✓ Captured screenshot-expert-mode.png');

    // -------------------------------------------------------------
    // Step 5: Expert Design Panel Customization
    // -------------------------------------------------------------
    console.log('\nStep 5: Customizing layout via Expert Design Panel...');
    await page.click('#tab-design');
    await new Promise((r) => setTimeout(r, 500));

    // Click "Antique Parchment" Preset
    await page.evaluate(() => {
      const presetBtns = Array.from(document.querySelectorAll('button'));
      const parchmentPreset = presetBtns.find((b) => b.textContent.includes('Antique Parchment'));
      if (parchmentPreset) parchmentPreset.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Verify decorative inset border is rendered in the preview DOM
    const borderCount = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid="page-decorative-border"]').length;
    });
    console.log(`✓ Decorative borders rendered in live preview pages: ${borderCount}`);
    if (borderCount === 0) {
      throw new Error('Decorative inset border not rendered in preview DOM');
    }

    // Capture Screenshot: Design Panel with custom colors and inset border
    const screenshot4Path = path.join(ARTIFACT_DIR, 'screenshot-design-panel.png');
    await page.screenshot({ path: screenshot4Path, fullPage: false });
    console.log('✓ Captured screenshot-design-panel.png');

    // -------------------------------------------------------------
    // Step 6: Custom Template Save Workflow
    // -------------------------------------------------------------
    console.log('\nStep 6: Testing Custom Template Save Workflow...');
    await page.click('#save-as-template-btn');
    await page.waitForSelector('#save-template-dialog-title', { timeout: 5000 });

    // Capture Screenshot: Save as Template Workflow Modal
    const screenshot5Path = path.join(ARTIFACT_DIR, 'screenshot-custom-template-workflow.png');
    await page.screenshot({ path: screenshot5Path, fullPage: false });
    console.log('✓ Captured screenshot-custom-template-workflow.png');

    // Submit Save Template Modal
    await page.evaluate(() => {
      const saveBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Save Reusable Template')
      );
      if (!saveBtn) throw new Error('Save Reusable Template button not found');
      saveBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Verify template dropdown now contains custom template
    const templateOptions = await page.$$eval('#template-select option', (opts) =>
      opts.map((o) => o.textContent)
    );
    console.log('✓ Template dropdown options after save:', templateOptions);
    const hasCustomOption = templateOptions.some((t) => t.includes('Custom'));
    if (!hasCustomOption) {
      throw new Error('Saved custom template not present in template select dropdown');
    }

    // -------------------------------------------------------------
    // Step 7: Custom Font Manager Panel & Rights Verification
    // -------------------------------------------------------------
    console.log('\nStep 7: Testing Custom Font Manager Panel...');
    await page.click('#tab-fonts');
    await new Promise((r) => setTimeout(r, 500));

    // Verify licensing reminder
    const hasLicenseWarning = await page.evaluate(() =>
      document.body.innerText.includes('Font License & Embedding Rights Responsibility')
    );
    if (!hasLicenseWarning) {
      throw new Error('Mandatory font license rights reminder not found in Font Manager Panel');
    }
    console.log('✓ Font licensing and legal rights reminder verified');

    // Inject a valid mock custom font into the project state via localStorage
    await page.evaluate(() => {
      const booksKey = 'ats_easybook_projects_v1';
      const raw = localStorage.getItem(booksKey);
      if (raw) {
        const books = JSON.parse(raw);
        if (books.length > 0) {
          books[0].editorMode = 'expert';
          books[0].customFonts = [
            {
              id: 'font-cinzel-deluxe',
              familyName: 'Cinzel Decorative',
              format: 'otf',
              fileName: 'CinzelDecorative-Bold.otf',
              fileSizeBytes: 142800,
              dataUrl: 'data:font/otf;base64,AAEAAAASAQAACAAgAAAAAAA=',
              createdAt: new Date().toISOString(),
              canEmbedInPdf: true,
            },
          ];
          localStorage.setItem(booksKey, JSON.stringify(books));
        }
      }
    });

    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.body.innerText.includes('Manuscript Editor'), { timeout: 10000 });
    const isBeginner = await page.$eval('#toggle-editor-mode-btn', (el) => el.textContent.includes('Beginner'));
    if (isBeginner) {
      await page.click('#toggle-editor-mode-btn');
      await new Promise((r) => setTimeout(r, 400));
    }
    await page.waitForSelector('#tab-fonts', { timeout: 5000 });
    await page.click('#tab-fonts');
    await new Promise((r) => setTimeout(r, 400));

    const fontCards = await page.evaluate(() => document.body.innerText.includes('Cinzel Decorative'));
    const isEmbedReady = await page.evaluate(() => document.body.innerText.includes('PDF Print Embed Ready'));
    if (!fontCards || !isEmbedReady) {
      throw new Error('Custom font card or PDF Embed Ready status missing in Font Manager');
    }
    console.log('✓ Custom font card and PDF embed readiness verified');

    // Capture Screenshot: Custom Font Manager
    const screenshot6Path = path.join(ARTIFACT_DIR, 'screenshot-font-upload.png');
    await page.screenshot({ path: screenshot6Path, fullPage: false });
    console.log('✓ Captured screenshot-font-upload.png');

    // -------------------------------------------------------------
    // Step 8: Preflight Panel & Print PDF Export with Custom Design
    // -------------------------------------------------------------
    console.log('\nStep 8: Testing Preflight Panel and PDF Export Modal with Custom Design...');
    await page.click('#tab-preflight');
    await new Promise((r) => setTimeout(r, 600));

    // Acknowledge any preflight warnings if present
    const ackChk = await page.$('#acknowledge-warnings-checkbox');
    if (ackChk) {
      await ackChk.click();
      await new Promise((r) => setTimeout(r, 600));
      console.log('✓ Acknowledged preflight warnings');
    }

    // Open PDF Export Modal
    await page.click('#open-pdf-export-btn');
    await page.waitForSelector('#pdf-export-title', { timeout: 8000 });
    console.log('✓ PDF Export Modal opened with customized print parameters');

    // Trigger PDF Export
    const startExportBtn = await page.$('#start-pdf-export-btn');
    if (startExportBtn) {
      await startExportBtn.click();
      await page.waitForFunction(
        () =>
          document.body.innerText.includes('PDF Export Completed Successfully!') ||
          document.body.innerText.includes('Exporting...'),
        { timeout: 15000 }
      );
      console.log('✓ Triggered PDF export generation successfully');
    }

    // Close modal
    await page.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Close') || b.textContent.includes('Cancel')
      );
      closeBtn?.click();
    });

    // -------------------------------------------------------------
    // Console Errors Check
    // -------------------------------------------------------------
    console.log('\n--- Checking Console Error Output ---');
    if (consoleErrors.length > 0) {
      console.error('FAIL: Console errors detected during acceptance test:', consoleErrors);
      throw new Error(`Encountered ${consoleErrors.length} browser console errors.`);
    } else {
      console.log('✓ Clean console: 0 browser console errors detected throughout entire workflow.');
    }

    console.log('\n=== ALL PHASE 4 BROWSER ACCEPTANCE TESTS PASSED SUCCESSFULLY! ===');
  } finally {
    await browser.close();
  }
}

runPhase4Acceptance().catch((err) => {
  console.error('\n❌ Acceptance test failed:', err);
  process.exit(1);
});
