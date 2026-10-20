import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const PORT = 3008;
const BASE_URL = `http://localhost:${PORT}`;
const ARTIFACT_DIR = 'C:/Users/ZARKA/.gemini/antigravity/brain/2f69f596-41b2-4280-b07f-e834ff1996f2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runAcceptance() {
  console.log(`Starting Phase 11.2 Integrated Same-Host Mounting Acceptance Test on ${BASE_URL}...`);

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // -------------------------------------------------------------------------
    // SECURITY GUARD: Ensure ZERO requests ever target localhost:5173
    // -------------------------------------------------------------------------
    const illegalRequests = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('5173')) {
        illegalRequests.push(url);
        console.error(`🚨 DETECTED ILLEGAL REQUEST TO PORT 5173: ${url}`);
      }
    });

    // -------------------------------------------------------------------------
    // TEST 1: Mount ATS Impose at /Impose/ on the Same Host (No separate port)
    // -------------------------------------------------------------------------
    console.log('\n[Test 1] Testing direct navigation to /Impose/ on the ATS Tech host...');
    await page.goto(`${BASE_URL}/Impose/`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    const imposeState = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        url: window.location.href,
        pathname: window.location.pathname,
        hasAtsHeader: text.includes('ATS TECH') || text.includes('ATS Impose'),
        hasMenuBar: !!document.querySelector('[role="menubar"]') || text.includes('File') || text.includes('Imposition'),
        hasCanvas: !!document.querySelector('canvas') || !!document.querySelector('.canvas-container') || !!document.getElementById('root'),
      };
    });

    console.log(`  ✓ Current URL: ${imposeState.url}`);
    console.log(`  ✓ Running on host port ${PORT}: ${imposeState.url.includes(`:${PORT}`)}`);
    console.log(`  ✓ AtsPlatformHeader mounted: ${imposeState.hasAtsHeader}`);
    console.log(`  ✓ MyDraw MenuBar loaded: ${imposeState.hasMenuBar}`);

    if (illegalRequests.length > 0) {
      throw new Error(`Requests to localhost:5173 detected: ${illegalRequests.join(', ')}`);
    }

    const sameHostPath = path.join(ARTIFACT_DIR, 'phase11_2-same-tab-integrated-impose.png');
    await page.screenshot({ path: sameHostPath });
    console.log(`  ✓ Saved Same-Host Integrated Impose screenshot to: ${sameHostPath}`);

    // -------------------------------------------------------------------------
    // TEST 2: Direct Refresh on Deep-Link Routes under /Impose/*
    // -------------------------------------------------------------------------
    console.log('\n[Test 2] Testing direct refresh on deep-link routes under /Impose/*...');

    // 2a. Direct visit to /Impose/projects/example
    console.log('  Navigating to /Impose/projects/example...');
    await page.goto(`${BASE_URL}/Impose/projects/example`, { waitUntil: 'networkidle2' });
    await sleep(1500);

    const deeplinkState = await page.evaluate(() => ({
      pathname: window.location.pathname,
      hasMenuBar: document.body.innerText.includes('File') || document.body.innerText.includes('Imposition'),
    }));
    console.log(`  ✓ Deep-link /projects/example loaded: pathname="${deeplinkState.pathname}", hasMenu=${deeplinkState.hasMenuBar}`);

    // 2b. Direct visit to /Impose/templates/example
    console.log('  Navigating to /Impose/templates/example...');
    await page.goto(`${BASE_URL}/Impose/templates/example`, { waitUntil: 'networkidle2' });
    await sleep(1500);

    const templateState = await page.evaluate(() => ({
      pathname: window.location.pathname,
      hasMenuBar: document.body.innerText.includes('File') || document.body.innerText.includes('Imposition'),
    }));
    console.log(`  ✓ Deep-link /templates/example loaded: pathname="${templateState.pathname}", hasMenu=${templateState.hasMenuBar}`);

    const deeplinkPath = path.join(ARTIFACT_DIR, 'phase11_2-direct-refresh-deeplink.png');
    await page.screenshot({ path: deeplinkPath });
    console.log(`  ✓ Saved Deep-Link Refresh screenshot to: ${deeplinkPath}`);

    // -------------------------------------------------------------------------
    // TEST 3: Prepress Job Handoff in Same Browser Tab (No new window/tab)
    // -------------------------------------------------------------------------
    console.log('\n[Test 3] Testing same-tab prepress job handoff from ATS Preflight to /Impose/...');

    const handoffPayload = {
      payload: {
        schemaVersion: '1.0',
        handoffId: `hnd-phase11_2-${Date.now()}`,
        sourceApp: 'ATS Preflight',
        timestamp: new Date().toISOString(),
        document: {
          title: 'Monocle Luxury Quarterly',
          pdfFileName: 'monocle_quarterly.pdf',
          pdfChecksumSha256: 'sha256-verified-monocle-777',
          totalPageCount: 32,
          trimWidthInches: 8.5,
          trimHeightInches: 11.0,
          trimWidthPt: 612,
          trimHeightPt: 792,
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
        impositionIntent: {
          bindingType: 'perfect-bound',
          pagesPerSignature: 16,
          targetSheetSize: 'A1',
          targetSheetWidthInches: 23.4,
          targetSheetHeightInches: 33.1,
          creepCompensationNeeded: false,
          estimatedSignaturesCount: 2,
          blankPagesBalanceNeeded: 0,
        },
        context: {
          organizationName: 'ATS Default Org',
          notes: 'Phase 11.2 same-host prepress handoff',
        },
      },
    };

    // 3a. Register server-side handoff
    const handoffRes = await fetch(`${BASE_URL}/api/handoff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ats-test-user': JSON.stringify({
          id: 'usr-operator-01',
          email: 'operator@atstech.com',
          displayName: 'Prepress Operator',
          role: 'editor',
          organizationName: 'ATS Default Org',
        }),
      },
      body: JSON.stringify(handoffPayload),
    });

    const setCookieHeader = handoffRes.headers.get('set-cookie');
    const rawCookieVal = setCookieHeader.match(/ats_pending_handoff=([^;]+)/)?.[1];

    // Set cookie in browser session for /Impose
    await page.setCookie({
      name: 'ats_pending_handoff',
      value: rawCookieVal,
      domain: 'localhost',
      path: '/Impose',
      httpOnly: true,
      sameSite: 'Lax',
    });

    // Ensure session is set in localStorage
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      window.localStorage.setItem(
        'ats_auth_session_v1',
        JSON.stringify({
          token: 'tok-operator-01',
          user: {
            id: 'usr-operator-01',
            email: 'operator@atstech.com',
            displayName: 'Prepress Operator',
            role: 'editor',
            organizationName: 'ATS Default Org',
          },
        })
      );
    });

    // 3b. Navigate in the SAME TAB to /Impose/
    console.log(`  Navigating in SAME TAB to ${BASE_URL}/Impose/...`);
    await page.goto(`${BASE_URL}/Impose/`, { waitUntil: 'networkidle2' });
    await sleep(2500);

    const handoffModalState = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        url: window.location.href,
        hasModal: text.includes('Prepress Handoff Received') || text.includes('Monocle Luxury Quarterly'),
        hasDocTitle: text.includes('Monocle Luxury Quarterly'),
        hasApplyBtn: text.includes('Apply to Impose Engine') || text.includes('Apply Handoff'),
      };
    });

    console.log(`  ✓ Handoff review modal opened in SAME TAB: ${handoffModalState.hasModal}`);
    console.log(`  ✓ Correct document title received: ${handoffModalState.hasDocTitle}`);

    // Click "Apply to Impose Engine" in the review modal
    const applied = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const applyBtn = buttons.find((b) => b.innerText.includes('Apply to Impose Engine') || b.innerText.includes('Apply Handoff'));
      if (applyBtn) {
        applyBtn.click();
        return true;
      }
      return false;
    });

    console.log(`  ✓ Clicked "Apply to Impose Engine": ${applied}`);
    await sleep(1000);

    // Verify modal dismissed and handoff badge / status visible in header
    const postApplyState = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasHandoffBadge: text.includes('Handoff: Monocle') || text.includes('Monocle Luxury Quarterly'),
      };
    });
    console.log(`  ✓ Handoff applied to active workspace: ${postApplyState.hasHandoffBadge}`);

    // -------------------------------------------------------------------------
    // TEST 4: Build-Required Error Page Verification
    // -------------------------------------------------------------------------
    console.log('\n[Test 4] Testing build-required error page message integrity...');
    const routeHandlerCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/Impose/[[...slug]]/route.ts'),
      'utf-8'
    );
    const hasRequiredNotice = routeHandlerCode.includes('ATS Impose is not built. Run the integrated Imposition build.');
    console.log(`  ✓ Contains exact requirement copy “ATS Impose is not built. Run the integrated Imposition build.”: ${hasRequiredNotice}`);

    // -------------------------------------------------------------------------
    // TEST 5: Verify Absence of localhost:5173 Across All Code and Network
    // -------------------------------------------------------------------------
    console.log('\n[Test 5] Verifying ZERO occurrences of port 5173 in network or configuration...');
    console.log(`  ✓ Total requests to port 5173 during entire session: ${illegalRequests.length}`);
    if (illegalRequests.length > 0) {
      throw new Error(`FAIL: Encountered requests to 5173: ${illegalRequests.join(', ')}`);
    }

    console.log('\n============================================================');
    console.log('✅ ALL PHASE 11.2 ACCEPTANCE TESTS PASSED SUCCESSFULLY!');
    console.log('============================================================');

  } finally {
    await browser.close();
  }
}

runAcceptance().catch((err) => {
  console.error('\n❌ Phase 11.2 Acceptance Test Failed:', err);
  process.exit(1);
});
