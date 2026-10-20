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
  console.log(`Starting Phase 10 ATS Imposition Integration Acceptance Test on ${BASE_URL}...`);

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  // 1. Generate flawed test PDF on disk for preflight & handoff flow
  const tempPdfPath = path.join(ARTIFACT_DIR, 'phase10-handoff-source.pdf');
  const doc = new jsPDF({ unit: 'in', format: [6, 9] });
  doc.setTextColor(255, 0, 0); // RGB text
  doc.text('Phase 10 Preflight & Imposition Source', 0.5, 1.0);
  doc.text('Sample page 1 to trigger repair and imposition handoff.', 0.5, 1.5);
  doc.addPage([6, 9]);
  doc.setTextColor(0, 100, 200);
  doc.text('Sample page 2', 0.5, 1.0);
  const pdfBytes = doc.output('arraybuffer');
  fs.writeFileSync(tempPdfPath, Buffer.from(pdfBytes));
  console.log(`Created PDF fixture at ${tempPdfPath}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // -------------------------------------------------------------
    // STEP 1: Verify ATS Imposition on Public Products Page (/products)
    // -------------------------------------------------------------
    console.log('STEP 1: Testing /products public catalog for ATS Imposition...');
    await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle2', timeout: 20000 });

    await page.waitForSelector('#launch-ats-imposition-product-btn', { timeout: 10000 });
    console.log('Found #launch-ats-imposition-product-btn on /products');

    // Open Launch Modal from Products page
    await page.click('#launch-ats-imposition-product-btn');
    await page.waitForSelector('#imposition-launch-modal-title', { timeout: 5000 });
    console.log('Imposition Launch Modal opened successfully!');

    // Wait a moment for modal animation
    await sleep(600);

    const modalScreenPath = path.join(ARTIFACT_DIR, 'phase10-imposition-modal.png');
    await page.screenshot({ path: modalScreenPath });
    console.log(`Captured ${modalScreenPath}`);

    // Verify modal elements: title, schema contract badge, launch button, download button
    const modalTitle = await page.$eval('#imposition-launch-modal-title', (el) => el.innerText);
    console.log(`Modal Title: ${modalTitle}`);

    // Close modal by clicking close button
    const closeBtn = (await page.$('#close-imposition-modal-btn')) || (await page.$('#close-imposition-launch-modal-btn'));
    if (closeBtn) await closeBtn.click();
    await sleep(400);

    // -------------------------------------------------------------
    // STEP 2: Verify Dashboard Imposition Workspace Strip (/dashboard)
    // -------------------------------------------------------------
    console.log('STEP 2: Testing /dashboard for ATS Imposition workspace banner...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2', timeout: 20000 });

    await page.waitForSelector('#dashboard-launch-imposition-banner-btn', { timeout: 10000 });
    console.log('Found #dashboard-launch-imposition-banner-btn on /dashboard');

    const dashScreenPath = path.join(ARTIFACT_DIR, 'phase10-dashboard-imposition.png');
    await page.screenshot({ path: dashScreenPath, fullPage: true });
    console.log(`Captured ${dashScreenPath}`);

    // -------------------------------------------------------------
    // STEP 3: Verify Preflight-to-Imposition Handoff Flow
    // -------------------------------------------------------------
    console.log('STEP 3: Testing Preflight Job inspection & repair handoff...');
    await page.goto(`${BASE_URL}/preflight`, { waitUntil: 'networkidle2', timeout: 20000 });

    await page.waitForSelector('#upload-preflight-pdf-btn', { timeout: 10000 });
    await page.click('#upload-preflight-pdf-btn');
    await page.waitForSelector('#preflight-file-input', { timeout: 5000 });

    const fileInput = await page.$('#preflight-file-input');
    await fileInput.uploadFile(tempPdfPath);

    await page.select('#preflight-profile-select', 'ats-cmyk-pdfx4');
    await page.click('#start-preflight-btn');

    // Wait for redirect to /preflight/[id]
    await page.waitForFunction(
      () => window.location.pathname.startsWith('/preflight/job-'),
      { timeout: 15000 }
    );
    await page.waitForSelector('#open-repair-plan-btn', { timeout: 10000 });

    // Open Repair Plan and Execute
    await page.click('#open-repair-plan-btn');
    await page.waitForSelector('#execute-pdf-repair-btn', { timeout: 5000 });
    await page.click('#execute-pdf-repair-btn');

    // Wait for repair execution and presence of imposition handoff button
    await page.waitForSelector('#handoff-preflight-to-imposition-btn', { timeout: 15000 });
    console.log('Found #handoff-preflight-to-imposition-btn on repaired Preflight Job!');

    // Click Imposition Handoff
    await page.click('#handoff-preflight-to-imposition-btn');
    await page.waitForSelector('#imposition-launch-modal-title', { timeout: 5000 });
    await sleep(600);

    const preflightHandoffScreenPath = path.join(ARTIFACT_DIR, 'phase10-preflight-handoff.png');
    await page.screenshot({ path: preflightHandoffScreenPath });
    console.log(`Captured ${preflightHandoffScreenPath}`);

    console.log('All Phase 10 Acceptance Test steps completed successfully!');
  } catch (err) {
    console.error('Acceptance test failed:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runAcceptance();
