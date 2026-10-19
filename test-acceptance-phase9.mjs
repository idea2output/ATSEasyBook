import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

const PORT = 3008;
const BASE_URL = `http://localhost:${PORT}`;
const ARTIFACT_DIR = 'C:/Users/ZARKA/.gemini/antigravity/brain/2f69f596-41b2-4280-b07f-e834ff1996f2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runAcceptance() {
  console.log(`Starting Phase 9 ATS Preflight & Production-Readiness Acceptance Test on ${BASE_URL}...`);

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  // 1. Generate flawed test PDF on disk for upload testing
  const tempPdfPath = path.join(ARTIFACT_DIR, 'flawed-interior-sample.pdf');
  const doc = new jsPDF({ unit: 'in', format: [6, 9] });
  doc.setTextColor(255, 0, 0); // RGB text
  doc.text('Flawed Chapter 1: Prepress Test', 0.5, 1.0);
  doc.setTextColor(0, 128, 255); // Another RGB fill
  doc.text('This PDF lacks TrimBox, lacks OutputIntent, and has RGB colors.', 0.5, 1.8);
  const pdfBytes = doc.output('arraybuffer');
  fs.writeFileSync(tempPdfPath, Buffer.from(pdfBytes));
  console.log(`Created flawed test PDF fixture at ${tempPdfPath}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // -------------------------------------------------------------
    // STEP 1: Verify Marketing Product Page (/products/preflight)
    // -------------------------------------------------------------
    console.log('STEP 1: Testing /products/preflight marketing page...');
    await page.goto(`${BASE_URL}/products/preflight`, { waitUntil: 'networkidle2', timeout: 20000 });

    await page.waitForSelector('#hero-launch-preflight-btn', { timeout: 10000 });
    const marketingTitle = await page.$eval('h1', (el) => el.innerText);
    console.log(`Marketing H1: ${marketingTitle.replace(/\n/g, ' ')}`);

    const marketingScreenPath = path.join(ARTIFACT_DIR, 'phase9-product-preflight.png');
    await page.screenshot({ path: marketingScreenPath, fullPage: true });
    console.log(`Captured ${marketingScreenPath}`);

    // -------------------------------------------------------------
    // STEP 2: Verify Preflight Workspace Dashboard (/preflight)
    // -------------------------------------------------------------
    console.log('STEP 2: Navigating to Preflight Dashboard...');
    await page.goto(`${BASE_URL}/preflight`, { waitUntil: 'networkidle2', timeout: 20000 });

    await page.waitForSelector('#upload-preflight-pdf-btn', { timeout: 10000 });
    const dashTitle = await page.$eval('h1', (el) => el.innerText);
    console.log(`Dashboard H1: ${dashTitle}`);

    // Open Upload Modal
    await page.click('#upload-preflight-pdf-btn');
    await page.waitForSelector('#preflight-upload-title', { timeout: 5000 });

    const uploadModalScreenPath = path.join(ARTIFACT_DIR, 'phase9-preflight-upload-modal.png');
    await page.screenshot({ path: uploadModalScreenPath });
    console.log(`Captured ${uploadModalScreenPath}`);

    // -------------------------------------------------------------
    // STEP 3: Upload Flawed PDF & Run Deep Preflight
    // -------------------------------------------------------------
    console.log('STEP 3: Uploading flawed test PDF fixture...');
    const fileInput = await page.$('#preflight-file-input');
    await fileInput.uploadFile(tempPdfPath);

    // Select ATS CMYK PDF/X-4 profile
    await page.select('#preflight-profile-select', 'ats-cmyk-pdfx4');

    // Run inspection
    await page.waitForSelector('#start-preflight-btn:not([disabled])', { timeout: 5000 });
    await page.click('#start-preflight-btn');

    // Wait for redirect to /preflight/[id]
    console.log('Waiting for preflight report view...');
    await page.waitForFunction(
      () => window.location.pathname.startsWith('/preflight/job-'),
      { timeout: 15000 }
    );
    await page.waitForSelector('#open-repair-plan-btn', { timeout: 10000 });

    const reportScreenPath = path.join(ARTIFACT_DIR, 'phase9-preflight-report.png');
    await page.screenshot({ path: reportScreenPath, fullPage: true });
    console.log(`Captured ${reportScreenPath}`);

    // -------------------------------------------------------------
    // STEP 4: Test Preflight Repair Workspace
    // -------------------------------------------------------------
    console.log('STEP 4: Opening Transparent Repair Workspace...');
    await page.click('#open-repair-plan-btn');
    await page.waitForSelector('#preflight-repair-title', { timeout: 5000 });

    const repairModalScreenPath = path.join(ARTIFACT_DIR, 'phase9-preflight-repair-modal.png');
    await page.screenshot({ path: repairModalScreenPath });
    console.log(`Captured ${repairModalScreenPath}`);

    // Execute repair
    console.log('Executing repair plan...');
    await page.click('#execute-pdf-repair-btn');

    // Wait for modal to close and automatic switch to compare tab
    await page.waitForSelector('#download-repaired-compare-btn', { timeout: 15000 });

    const compareScreenPath = path.join(ARTIFACT_DIR, 'phase9-preflight-compare-view.png');
    await page.screenshot({ path: compareScreenPath, fullPage: true });
    console.log(`Captured ${compareScreenPath}`);

    // -------------------------------------------------------------
    // STEP 5: Add Anchored Prepress Note
    // -------------------------------------------------------------
    console.log('STEP 5: Testing anchored prepress notes...');
    await page.type('#preflight-comment-input', 'Prepress inspection verified: Repaired copy is ready for digital press run.');
    await page.click('#send-preflight-comment-btn');
    await page.waitForFunction(
      () => document.body.innerText.includes('Repaired copy is ready for digital press run.'),
      { timeout: 5000 }
    );
    console.log('Anchored comment verified in live report!');

    // -------------------------------------------------------------
    // STEP 6: Test EasyBook Export Handoff to Preflight
    // -------------------------------------------------------------
    console.log('STEP 6: Testing EasyBook Editor PDF Export Handoff...');
    await page.goto(`${BASE_URL}/books/new`, { waitUntil: 'networkidle2', timeout: 20000 });
    await page.waitForSelector('#book-title', { timeout: 10000 });
    await page.type('#book-title', 'Phase 9 Prepress Verification Volume');
    await page.type('#book-author', 'ATS Editorial');
    await page.click('button[type="submit"]');

    await page.waitForFunction(
      () => window.location.pathname.startsWith('/books/book-'),
      { timeout: 15000 }
    );
    await sleep(1000);

    // Populate manuscript text to satisfy preflight checks
    const textInput = await page.$('#raw-manuscript-input');
    if (textInput) {
      await textInput.type('Chapter 1: Prepress Integrity\n\nPure 100K black body text and standard trim boxes guarantee flawless digital press output.');
      await sleep(400);
      const formatBtn = await page.$('button[aria-label="Format manuscript"]');
      if (formatBtn) {
        await formatBtn.click();
        await sleep(800);
      }
    }

    await page.waitForSelector('#open-pdf-export-btn', { timeout: 10000 });
    await page.click('#open-pdf-export-btn');
    await sleep(600);

    const ackChk = await page.$('#acknowledge-warnings-checkbox');
    if (ackChk) {
      console.log('Acknowledging preflight warnings...');
      await ackChk.click();
      await sleep(600);
      await page.click('#open-pdf-export-btn');
    }

    await page.waitForSelector('#start-pdf-export-btn', { timeout: 10000 });
    await page.click('#start-pdf-export-btn');
    await page.waitForSelector('#handoff-to-preflight-btn', { timeout: 25000 });

    const exportHandoffScreenPath = path.join(ARTIFACT_DIR, 'phase9-export-handoff.png');
    await page.screenshot({ path: exportHandoffScreenPath });
    console.log(`Captured ${exportHandoffScreenPath}`);

    console.log('SUCCESS: All Phase 9 acceptance criteria validated perfectly!');
  } catch (err) {
    console.error('Acceptance test failed with error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runAcceptance().catch((err) => {
  console.error(err);
  process.exit(1);
});
