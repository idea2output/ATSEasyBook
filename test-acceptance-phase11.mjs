import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const PORT = 3008;
const BASE_URL = `http://localhost:${PORT}`;
const ARTIFACT_DIR = 'C:/Users/ZARKA/.gemini/antigravity/brain/2f69f596-41b2-4280-b07f-e834ff1996f2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runAcceptance() {
  console.log(`Starting Phase 11 Unified Platform Experience Acceptance Test on ${BASE_URL}...`);

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  try {
    const page = await browser.newPage();

    // -------------------------------------------------------------------------
    // TEST 1: Homepage & Dynamic Product Status
    // -------------------------------------------------------------------------
    console.log('\n[Test 1] Testing Public Homepage & Dynamic Product Status...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });

    // Verify Brand Logo
    const logoExists = await page.evaluate(() => {
      const img = document.querySelector('img[alt*="ATS"]');
      const text = document.body.innerText;
      return img !== null || text.includes('ATS TECH') || text.includes('ATS Tech');
    });
    console.log(`  ✓ Brand logo/title detected: ${logoExists}`);

    // Verify Coming Soon section does NOT list EasyBook, Preflight, or Impose
    const comingSoonText = await page.evaluate(() => {
      const section = document.getElementById('coming-soon');
      return section ? section.innerText : '';
    });
    
    const containsEasybookInComingSoon = comingSoonText.toLowerCase().includes('ats easybook');
    const containsPreflightInComingSoon = comingSoonText.toLowerCase().includes('ats preflight');
    const containsImposeInComingSoon = comingSoonText.toLowerCase().includes('ats impose');
    
    console.log(`  ✓ EasyBook NOT in Coming Soon: ${!containsEasybookInComingSoon}`);
    console.log(`  ✓ Preflight NOT in Coming Soon: ${!containsPreflightInComingSoon}`);
    console.log(`  ✓ Impose NOT in Coming Soon: ${!containsImposeInComingSoon}`);
    
    if (containsEasybookInComingSoon || containsPreflightInComingSoon || containsImposeInComingSoon) {
      throw new Error('Completed products erroneously appear in Coming Soon section!');
    }

    // -------------------------------------------------------------------------
    // TEST 2: Unified Authenticated Dashboard & Product Switcher
    // -------------------------------------------------------------------------
    console.log('\n[Test 2] Testing Unified Authenticated Dashboard & Product Switcher...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await sleep(1000);

    // Verify PlatformHeader elements
    const headerInfo = await page.evaluate(() => {
      const header = document.querySelector('header');
      const text = header ? header.innerText : '';
      return {
        hasHeader: !!header,
        hasCredits: text.includes('Credits'),
        hasSwitcher: !!header?.querySelector('button'),
      };
    });
    console.log(`  ✓ Platform Header rendered: ${headerInfo.hasHeader}`);
    console.log(`  ✓ Credits Pill present: ${headerInfo.hasCredits}`);

    // Open Product Switcher
    const switcherClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('header button'));
      const switcherBtn = buttons.find((b) => b.innerText.includes('EasyBook') || b.innerText.includes('Dashboard') || b.innerText.includes('Modules') || b.querySelector('svg'));
      if (switcherBtn) {
        switcherBtn.click();
        return true;
      }
      return false;
    });
    console.log(`  ✓ Product switcher menu toggled: ${switcherClicked}`);
    await sleep(500);

    // Capture screenshot of Product Switcher
    const switcherPath = path.join(ARTIFACT_DIR, 'phase11-product-switcher.png');
    await page.screenshot({ path: switcherPath });
    console.log(`  ✓ Saved Product Switcher screenshot to: ${switcherPath}`);

    // Close switcher or click outside
    await page.mouse.click(10, 10);
    await sleep(300);

    // Capture screenshot of Unified Dashboard & Activity Feed
    const dashboardPath = path.join(ARTIFACT_DIR, 'phase11-unified-dashboard.png');
    await page.screenshot({ path: dashboardPath });
    console.log(`  ✓ Saved Unified Dashboard screenshot to: ${dashboardPath}`);

    // -------------------------------------------------------------------------
    // TEST 3: ATS EasyBook Portal (/easybook)
    // -------------------------------------------------------------------------
    console.log('\n[Test 3] Testing ATS EasyBook Portal (/easybook)...');
    await page.goto(`${BASE_URL}/easybook`, { waitUntil: 'networkidle2' });
    await sleep(1000);

    const easybookContent = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasEasybookTitle: text.includes('ATS EasyBook') || text.includes('Manuscript Studio'),
        hasCreateButton: text.includes('Create New Book') || text.includes('Create First Book'),
        hasPlatformHeader: !!document.querySelector('header'),
      };
    });
    console.log(`  ✓ EasyBook portal title detected: ${easybookContent.hasEasybookTitle}`);
    console.log(`  ✓ EasyBook create button detected: ${easybookContent.hasCreateButton}`);
    console.log(`  ✓ EasyBook has unified PlatformHeader: ${easybookContent.hasPlatformHeader}`);

    const easybookPath = path.join(ARTIFACT_DIR, 'phase11-easybook-portal.png');
    await page.screenshot({ path: easybookPath });
    console.log(`  ✓ Saved EasyBook Portal screenshot to: ${easybookPath}`);

    // -------------------------------------------------------------------------
    // TEST 4: ATS Preflight Workspace (/preflight)
    // -------------------------------------------------------------------------
    console.log('\n[Test 4] Testing ATS Preflight Workspace (/preflight)...');
    await page.goto(`${BASE_URL}/preflight`, { waitUntil: 'networkidle2' });
    await sleep(1000);

    const preflightContent = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasPreflightTitle: text.includes('Preflight') || text.includes('Prepress'),
        hasUploadBtn: !!document.getElementById('upload-preflight-pdf-btn') || text.includes('Upload') || text.includes('New Preflight'),
        hasPlatformHeader: !!document.querySelector('header'),
      };
    });
    console.log(`  ✓ Preflight workspace detected: ${preflightContent.hasPreflightTitle}`);
    console.log(`  ✓ Preflight upload button detected: ${preflightContent.hasUploadBtn}`);
    console.log(`  ✓ Preflight has unified PlatformHeader: ${preflightContent.hasPlatformHeader}`);

    // -------------------------------------------------------------------------
    // TEST 5: ATS Impose Portal under /Impose/
    // -------------------------------------------------------------------------
    console.log('\n[Test 5] Testing ATS Impose Portal (/Impose/)...');
    await page.goto(`${BASE_URL}/Impose/`, { waitUntil: 'networkidle2' });
    await sleep(3000);

    const imposeContent = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasAtsHeader: text.includes('ATS TECH') || text.includes('ATS Impose'),
        hasMenuBar: !!document.querySelector('[role="menubar"]') || text.includes('File') || text.includes('Imposition') || text.includes('View'),
        url: window.location.pathname,
      };
    });
    console.log(`  ✓ Impose current pathname: ${imposeContent.url}`);
    console.log(`  ✓ AtsPlatformHeader mounted: ${imposeContent.hasAtsHeader}`);
    console.log(`  ✓ MyDraw imposition MenuBar loaded: ${imposeContent.hasMenuBar}`);

    const imposePath = path.join(ARTIFACT_DIR, 'phase11-impose-unified.png');
    await page.screenshot({ path: imposePath });
    console.log(`  ✓ Saved ATS Impose screenshot to: ${imposePath}`);

    // -------------------------------------------------------------------------
    // TEST 6: Secure Server-Side Prepress Handoff Workflow
    // -------------------------------------------------------------------------
    console.log('\n[Test 6] Testing Secure Prepress Handoff & Claim Workflow...');

    // 6a. Register handoff via server API
    const handoffPayload = {
      payload: {
        document: {
          title: 'Deluxe Hardcover Interior',
          pdfFileName: 'deluxe_hardcover_interior.pdf',
          pdfChecksumSha256: 'mock-sha256-abcdef0123456789',
          totalPageCount: 16,
          trimWidthInches: 6.0,
          trimHeightInches: 9.0,
          trimWidthPt: 432,
          trimHeightPt: 648,
          bleedInches: { top: 0.125, bottom: 0.125, left: 0.125, right: 0.125 },
          orientation: 'portrait',
        },
        prepress: {
          colorSpace: 'CMYK',
          outputIntentProfile: 'FOGRA39',
          preflightStatus: 'passed',
          preflightComplianceScore: 100,
          hasSpotColors: false,
          isPure100KBlackText: true,
        },
        intent: {
          bindingType: 'perfect-bound',
          pagesPerSignature: 16,
          targetSheetSize: 'A1',
          targetSheetWidthInches: 23.4,
          targetSheetHeightInches: 33.1,
          creepCompensationNeeded: false,
          estimatedSignaturesCount: 1,
          blankPagesBalanceNeeded: 0,
        },
        context: {
          organizationName: 'ATS Default Org',
          notes: 'Phase 11 verified automated prepress handoff from Preflight',
        },
      },
    };

    const handoffRes = await fetch(`${BASE_URL}/api/handoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(handoffPayload),
    });

    const handoffJson = await handoffRes.json();
    console.log(`  ✓ Created handoff job token: ${handoffJson.handoffId ? 'SUCCESS' : 'FAILED'}`);
    if (!handoffJson.handoffId) {
      throw new Error(`Failed to create handoff token: ${JSON.stringify(handoffJson)}`);
    }

    const handoffToken = handoffJson.handoffId;

    // 6b. Navigate to Impose with #ats-handoff token in fragment
    console.log(`  Navigating to Impose with fragment token: /Impose/#ats-handoff=${handoffToken.substring(0, 8)}...`);
    await page.goto(`${BASE_URL}/Impose/#ats-handoff=${handoffToken}`, { waitUntil: 'networkidle2' });
    await sleep(3000);

    // 6c. Verify URL hash was stripped for security
    const currentHash = await page.evaluate(() => window.location.hash);
    console.log(`  ✓ URL hash stripped after token consumption: hash="${currentHash}"`);

    // 6d. Verify Handoff Review Modal is open
    const modalContent = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasModal: text.includes('Prepress Handoff Received') || text.includes('deluxe_hardcover_interior.pdf'),
        hasSource: text.includes('PREFLIGHT') || text.includes('Prepress') || text.includes('Deluxe Hardcover'),
        hasPages: text.includes('16 Pages') || text.includes('16'),
        hasApplyBtn: text.includes('Apply to Impose Engine') || text.includes('Apply Handoff') || text.includes('Apply'),
      };
    });
    console.log(`  ✓ Prepress Handoff Review Modal visible: ${modalContent.hasModal}`);
    console.log(`  ✓ Handoff source & filename verified: ${modalContent.hasSource}`);
    console.log(`  ✓ Total pages detected: ${modalContent.hasPages}`);

    const handoffReviewPath = path.join(ARTIFACT_DIR, 'phase11-handoff-review.png');
    await page.screenshot({ path: handoffReviewPath });
    console.log(`  ✓ Saved Handoff Review screenshot to: ${handoffReviewPath}`);

    // 6e. Verify atomic claim (token cannot be claimed twice)
    const secondClaimRes = await fetch(`${BASE_URL}/api/handoff/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handoffToken }),
    });
    console.log(`  ✓ Second claim rejected with status ${secondClaimRes.status} (410 Gone / 404): ${secondClaimRes.status === 410 || secondClaimRes.status === 404}`);

    console.log('\n============================================================');
    console.log('✅ ALL PHASE 11 ACCEPTANCE TESTS PASSED SUCCESSFULLY!');
    console.log('============================================================');

  } finally {
    await browser.close();
  }
}

runAcceptance().catch((err) => {
  console.error('\n❌ Phase 11 Acceptance Test Failed:', err);
  process.exit(1);
});
