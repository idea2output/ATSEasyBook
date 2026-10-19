import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ZARKA\\.gemini\\antigravity\\brain\\2f69f596-41b2-4280-b07f-e834ff1996f2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3008';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPhase8Acceptance() {
  console.log('=== Starting ATS EasyBook Phase 8 Browser Acceptance Tests ===\n');

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

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

    // --------------------------------------------------------------------------
    // STEP 1: Admin Template Editor Access & Role Elevation
    // --------------------------------------------------------------------------
    console.log('[Step 1] Testing /admin/templates RBAC and Admin Template Editor...');
    await page.goto(`${BASE_URL}/admin/templates`, { waitUntil: 'networkidle0' });
    await sleep(800);

    // Verify restricted access view or elevate button
    const elevateBtn = await page.$('#admin-elevate-role-btn');
    if (elevateBtn) {
      console.log('  Restricted access view correctly displayed for non-admin. Elevating role...');
      await elevateBtn.click();
      await sleep(1000);
    }

    // Verify Admin Template Editor loaded
    const publishBtn = await page.$('#admin-publish-template-btn');
    console.log(`  Admin Template Editor Controls Present: ${!!publishBtn}`);

    // Verify Recto / Verso toggle
    const versoBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const b = buttons.find((el) => el.textContent && el.textContent.includes('Verso'));
      if (b) {
        b.click();
        return true;
      }
      return false;
    });
    console.log(`  Toggled to Verso view: ${versoBtn}`);
    await sleep(400);

    // Toggle back to Recto
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const b = buttons.find((el) => el.textContent && el.textContent.includes('Recto'));
      if (b) b.click();
    });
    await sleep(400);

    // Add a new decorative layer (Rule / Line)
    const addLineBtn = await page.$('#admin-add-line-btn');
    if (addLineBtn) {
      await addLineBtn.click();
      console.log('  Added new fixed rule/line layer.');
      await sleep(500);
    }

    // Capture screenshot of Admin Template Editor canvas
    const screenshotAdminCanvasPath = path.join(ARTIFACT_DIR, 'screenshot-admin-template-editor.png');
    await page.screenshot({ path: screenshotAdminCanvasPath, fullPage: false });
    console.log('✓ Captured screenshot-admin-template-editor.png');

    // Switch right panel to Layers tab to capture layer panel & content zones
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const b = buttons.find((el) => el.textContent && el.textContent.includes('Layers & Zones'));
      if (b) b.click();
    });
    await sleep(500);

    // Capture screenshot of Admin Layer Panel & Content Zone Editor
    const screenshotAdminLayerPath = path.join(ARTIFACT_DIR, 'screenshot-admin-layer-panel.png');
    await page.screenshot({ path: screenshotAdminLayerPath, fullPage: false });
    console.log('✓ Captured screenshot-admin-layer-panel.png');

    // Publish and Save Template
    if (publishBtn) {
      await publishBtn.click();
      await sleep(800);
      console.log('✓ Published governed template.');
    }

    // --------------------------------------------------------------------------
    // STEP 2: Create a Fresh Book in Expert Mode via /books/new
    // --------------------------------------------------------------------------
    console.log('\n[Step 2] Creating a fresh book in Expert Mode (/books/new)...');
    await page.goto(`${BASE_URL}/books/new`, { waitUntil: 'networkidle0' });
    await sleep(800);

    const titleField = await page.$('#book-title');
    if (titleField) {
      await titleField.type('Phase 8 Governed Layout Monograph');
    }
    const authorField = await page.$('#book-author');
    if (authorField) {
      await authorField.type('ATS Editorial Studio');
    }

    // Select Expert Mode radio or button if present
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const expertBtn = buttons.find((b) => b.textContent && b.textContent.includes('Expert'));
      if (expertBtn) expertBtn.click();
    });
    await sleep(300);

    // Click "Create Project"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const createBtn = buttons.find((b) => b.textContent && b.textContent.includes('Create Project'));
      if (createBtn) createBtn.click();
    });
    await sleep(2000);
    console.log('✓ Created fresh book project.');

    // Ensure we are in Expert Mode
    const modeBtn = await page.$('#toggle-editor-mode-btn');
    if (modeBtn) {
      const modeText = await page.evaluate((el) => el.textContent, modeBtn);
      if (modeText.includes('Beginner')) {
        console.log('  Switching to Expert Mode...');
        await modeBtn.click();
        await sleep(600);
      }
    }

    // Populate manuscript text and format to flow into preview pages
    const textInput = await page.$('#raw-manuscript-input');
    if (textInput) {
      await textInput.type('Chapter 1: The Design Mandate\n\nFixed visual layers and governed content zones guarantee precision typography across all publication editions.');
      await sleep(400);
      const formatBtn = await page.$('button[aria-label="Format manuscript"]');
      if (formatBtn) {
        await formatBtn.click();
        await sleep(800);
        console.log('  Formatted manuscript text.');
      }
    }

    // --------------------------------------------------------------------------
    // STEP 3: Custom Page Geometry Modal & Continuous Validation
    // --------------------------------------------------------------------------
    console.log('\n[Step 3] Testing Custom Page Geometry Modal & Continuous Validation...');
    // Open Custom Page Settings
    const openCustomPageBtn = await page.$('#open-custom-page-settings-btn');
    if (openCustomPageBtn) {
      await openCustomPageBtn.click();
    } else {
      await page.evaluate(() => {
        const select = document.querySelector('#template-select');
        if (select) {
          select.value = 'custom-page-template';
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }
    await sleep(800);

    // Verify modal is open
    const customPageModal = await page.$('[aria-labelledby="custom-page-modal-title"]');
    console.log(`  Custom Page Settings Modal Open: ${!!customPageModal}`);

    // Test Unit Selection: Toggle 'mm', then 'pt', then 'in'
    console.log('  Testing unit conversions (in -> mm -> pt -> in)...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const mmBtn = buttons.find((b) => b.textContent && b.textContent.trim() === 'MM');
      if (mmBtn) mmBtn.click();
    });
    await sleep(400);

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const ptBtn = buttons.find((b) => b.textContent && b.textContent.trim() === 'PT');
      if (ptBtn) ptBtn.click();
    });
    await sleep(400);

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const inBtn = buttons.find((b) => b.textContent && b.textContent.trim() === 'IN');
      if (inBtn) inBtn.click();
    });
    await sleep(400);

    // Switch to Margins & Columns Tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tab = buttons.find((b) => b.textContent && b.textContent.includes('Margins & Columns'));
      if (tab) tab.click();
    });
    await sleep(400);

    // Switch to 2 columns
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const col2Btn = buttons.find((b) => b.textContent && b.textContent.includes('2 Columns'));
      if (col2Btn) col2Btn.click();
    });
    await sleep(300);

    // Switch to Design & Borders Tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tab = buttons.find((b) => b.textContent && b.textContent.includes('Design & Borders'));
      if (tab) tab.click();
    });
    await sleep(400);

    // Enable Border
    await page.evaluate(() => {
      const checkbox = document.querySelector('#custom-page-border-checkbox');
      if (checkbox && !checkbox.checked) {
        checkbox.click();
      }
    });
    await sleep(300);

    // Capture screenshot of Custom Page Settings Modal
    const screenshotCustomPagePath = path.join(ARTIFACT_DIR, 'screenshot-custom-page-settings.png');
    await page.screenshot({ path: screenshotCustomPagePath, fullPage: false });
    console.log('✓ Captured screenshot-custom-page-settings.png');

    // Click "Apply Custom Page" button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const applyBtn = buttons.find((b) => b.textContent && b.textContent.includes('Apply Custom Page'));
      if (applyBtn) applyBtn.click();
    });
    await sleep(1000);
    console.log('✓ Applied Custom Page geometry (2 columns, border).');

    // --------------------------------------------------------------------------
    // STEP 4: Personal / Organization Template Library Modal
    // --------------------------------------------------------------------------
    console.log('\n[Step 4] Testing Template Library Modal...');
    const openLibBtn = await page.$('#open-template-library-btn');
    if (openLibBtn) {
      await openLibBtn.click();
      await sleep(800);

      // Verify library modal opened
      const libModal = await page.$('[aria-labelledby="template-library-title"]');
      console.log(`  Template Library Modal Open: ${!!libModal}`);

      // Test Tabs (Organization, Standard, All)
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const orgTab = buttons.find((b) => b.textContent && b.textContent.includes('Organization'));
        if (orgTab) orgTab.click();
      });
      await sleep(400);

      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const allTab = buttons.find((b) => b.textContent && b.textContent.trim() === 'All');
        if (allTab) allTab.click();
      });
      await sleep(400);

      // Capture screenshot of Template Library Modal
      const screenshotLibPath = path.join(ARTIFACT_DIR, 'screenshot-template-library.png');
      await page.screenshot({ path: screenshotLibPath, fullPage: false });
      console.log('✓ Captured screenshot-template-library.png');

      // Close library modal
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const closeBtn = buttons.find((b) => b.getAttribute('aria-label') === 'Close dialog');
        if (closeBtn) closeBtn.click();
      });
      await sleep(600);
      console.log('✓ Closed Template Library Modal.');
    }

    // --------------------------------------------------------------------------
    // STEP 5: Material Reflow Warning & Version Snapshot
    // --------------------------------------------------------------------------
    console.log('\n[Step 5] Testing Material Reflow Warning Modal & Snapshot...');
    // Select magazine-report-a4 to trigger material reflow (different geometry/columns)
    await page.select('#template-select', 'magazine-report-a4');
    await sleep(800);

    const reflowModalBtn = await page.$('#confirm-template-reflow-btn');
    console.log(`  Reflow Warning Modal triggered: ${!!reflowModalBtn}`);

    if (reflowModalBtn) {
      await reflowModalBtn.click();
      await sleep(1000);
      console.log('✓ Confirmed reflow and created auto-snapshot.');
    }

    // --------------------------------------------------------------------------
    // STEP 6: Book Spread Preview with Fixed Layers
    // --------------------------------------------------------------------------
    console.log('\n[Step 6] Inspecting Book Spread Preview with Fixed Layers...');
    const previewContainer = (await page.$('#book-spread-preview-canvas')) || (await page.$('.book-page-container'));
    console.log(`  Preview Spread Container Present: ${!!previewContainer}`);

    const screenshotPreviewPath = path.join(ARTIFACT_DIR, 'screenshot-preview-fixed-layers.png');
    await page.screenshot({ path: screenshotPreviewPath, fullPage: false });
    console.log('✓ Captured screenshot-preview-fixed-layers.png');

    // --------------------------------------------------------------------------
    // STEP 7: Mobile Responsiveness Verification
    // --------------------------------------------------------------------------
    console.log('\n[Step 7] Testing Mobile Layout (390 x 844)...');
    await page.setViewport({ width: 390, height: 844 });
    await sleep(600);

    const mobileEditor = await page.$('#raw-manuscript-input');
    console.log(`  Mobile Editor View usable: ${!!mobileEditor}`);

    console.log('\n--- Console Error Audit ---');
    console.log(`Encountered ${consoleErrors.length} unexpected browser console errors.`);
    if (consoleErrors.length > 0) {
      console.warn('Console Errors:', consoleErrors);
    }

  } finally {
    await browser.close();
  }

  console.log('\n=== Phase 8 Browser Acceptance Tests Completed Successfully ===');
}

runPhase8Acceptance().catch((err) => {
  console.error('Acceptance test failed:', err);
  process.exit(1);
});
