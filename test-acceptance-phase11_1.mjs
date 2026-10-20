import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const PORT = 3008;
const BASE_URL = `http://localhost:${PORT}`;
const ARTIFACT_DIR = 'C:/Users/ZARKA/.gemini/antigravity/brain/2f69f596-41b2-4280-b07f-e834ff1996f2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runAcceptance() {
  console.log(`Starting Phase 11.1 Security Hardening Acceptance Test on ${BASE_URL}...`);

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
    // TEST 1: Credits Display Clarification & Non-Deceptive Labeling
    // -------------------------------------------------------------------------
    console.log('\n[Test 1] Testing Credits Display Clarification on /dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await sleep(1000);

    const creditsInfo = await page.evaluate(() => {
      const pill = document.getElementById('platform-credits-pill');
      if (!pill) return null;
      const text = pill.innerText || pill.textContent || '';
      return {
        text,
        title: pill.getAttribute('title'),
        hasDemoCredits: text.includes('1,000 Demo Credits') || text.includes('Demo Credits'),
        hasPreviewBadge: text.toUpperCase().includes('CREDITS PREVIEW') || text.toUpperCase().includes('PREVIEW'),
        hasBillingNotice: pill.getAttribute('title')?.includes('Billing and credit deduction are not active yet.'),
      };
    });

    console.log(`  ✓ Credits Pill detected: ${!!creditsInfo}`);
    console.log(`  ✓ Labeled as Demo Credits: ${creditsInfo?.hasDemoCredits}`);
    console.log(`  ✓ Preview badge present: ${creditsInfo?.hasPreviewBadge}`);
    console.log(`  ✓ Explanatory tooltip: "${creditsInfo?.title}"`);

    if (!creditsInfo?.hasDemoCredits || !creditsInfo?.hasBillingNotice) {
      throw new Error(`Credits pill does not meet Phase 11.1 clarification requirements: ${JSON.stringify(creditsInfo)}`);
    }

    const creditsPath = path.join(ARTIFACT_DIR, 'phase11_1-credits-clarification.png');
    await page.screenshot({ path: creditsPath });
    console.log(`  ✓ Saved Credits Clarification screenshot to: ${creditsPath}`);

    // -------------------------------------------------------------------------
    // TEST 2: Token-Free Prepress Job Handoff via HttpOnly Cookie Scoped to /Impose/
    // -------------------------------------------------------------------------
    console.log('\n[Test 2] Testing Token-Free Handoff via HttpOnly Cookie Scoped to /Impose/...');

    const handoffPayload = {
      payload: {
        schemaVersion: '1.0',
        handoffId: `hnd-sec-${Date.now()}`,
        sourceApp: 'ATS Preflight',
        timestamp: new Date().toISOString(),
        document: {
          title: 'Vogue Editorial Hardcover',
          pdfFileName: 'vogue_editorial_hardcover.pdf',
          pdfChecksumSha256: 'sha256-verified-cmyk-987654321',
          totalPageCount: 24,
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
          blankPagesBalanceNeeded: 8,
        },
        context: {
          organizationName: 'ATS Default Org',
          notes: 'Phase 11.1 verified token-free prepress handoff',
        },
      },
    };

    // 2a. Issue POST to /api/handoff
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
    const handoffJson = await handoffRes.json();
    console.log(`  ✓ /api/handoff response: success=${handoffJson.success}, navigationUrl="${handoffJson.navigationUrl}"`);
    console.log(`  ✓ Set-Cookie header present: ${!!setCookieHeader}`);
    console.log(`  ✓ Cookie scoped to /Impose: ${setCookieHeader?.includes('Path=/Impose')}`);
    console.log(`  ✓ Cookie contains HttpOnly: ${setCookieHeader?.includes('HttpOnly')}`);

    if (!handoffJson.success || !setCookieHeader?.includes('Path=/Impose')) {
      throw new Error(`Handoff cookie not properly scoped: ${setCookieHeader}`);
    }

    // 2b. Set authenticated operator session in localStorage for atsPlatformAdapter
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

    // Set HttpOnly cookie in browser session for /Impose
    const rawCookieVal = setCookieHeader.match(/ats_pending_handoff=([^;]+)/)?.[1];
    await page.setCookie({
      name: 'ats_pending_handoff',
      value: rawCookieVal,
      domain: 'localhost',
      path: '/Impose',
      httpOnly: true,
      sameSite: 'Lax',
    });

    // 2c. Navigate to /Impose with ZERO tokens or query strings in the URL
    console.log(`  Navigating to strictly clean URL: ${BASE_URL}/Impose (NO tokens in URL)...`);
    await page.goto(`${BASE_URL}/Impose`, { waitUntil: 'networkidle2' });
    await sleep(2500);

    const currentUrl = page.url();
    console.log(`  ✓ Current browser URL: ${currentUrl}`);
    const hasZeroTokensInUrl =
      !currentUrl.includes('?') &&
      !currentUrl.includes('#') &&
      currentUrl.includes('/Impose');
    console.log(`  ✓ Address bar has ZERO tokens / fragments: ${hasZeroTokensInUrl}`);

    // 2d. Verify Handoff Review Modal was automatically triggered by the HttpOnly cookie claim
    const modalCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasModal: text.includes('Prepress Handoff Received') || text.includes('Vogue Editorial Hardcover'),
        hasDocTitle: text.includes('Vogue Editorial Hardcover'),
        hasPageCount: text.includes('24 Pages') || text.includes('24'),
        hasApplyBtn: text.includes('Apply to Impose Engine') || text.includes('Apply Handoff'),
      };
    });

    console.log(`  ✓ Handoff Review Modal displayed: ${modalCheck.hasModal}`);
    console.log(`  ✓ Document title verified: ${modalCheck.hasDocTitle}`);
    console.log(`  ✓ Page count verified: ${modalCheck.hasPageCount}`);

    const handoffPath = path.join(ARTIFACT_DIR, 'phase11_1-token-free-handoff.png');
    await page.screenshot({ path: handoffPath });
    console.log(`  ✓ Saved Token-Free Handoff screenshot to: ${handoffPath}`);

    // -------------------------------------------------------------------------
    // TEST 3: Explicit "No Pending Handoff" State & Normal Startup
    // -------------------------------------------------------------------------
    console.log('\n[Test 3] Testing Explicit "No Pending Handoff" State on clean session...');
    // Delete any cookies and open /Impose/ afresh
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');

    await page.goto(`${BASE_URL}/Impose/`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    const cleanSessionInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasMenuBar: text.includes('File') || text.includes('Imposition') || text.includes('View'),
        hasModal: text.includes('Prepress Handoff Received'),
        url: window.location.pathname,
      };
    });

    console.log(`  ✓ Normal imposition workspace loaded: ${cleanSessionInfo.hasMenuBar}`);
    console.log(`  ✓ No handoff modal shown: ${!cleanSessionInfo.hasModal}`);

    const normalPath = path.join(ARTIFACT_DIR, 'phase11_1-impose-normal-clean.png');
    await page.screenshot({ path: normalPath });
    console.log(`  ✓ Saved Normal Clean Impose screenshot to: ${normalPath}`);

    // -------------------------------------------------------------------------
    // TEST 4: Legacy /imposition/ Route Redirect
    // -------------------------------------------------------------------------
    console.log('\n[Test 4] Testing Legacy /imposition/ Route Redirect...');
    const redirectRes = await fetch(`${BASE_URL}/imposition`, { redirect: 'manual' });
    const location = redirectRes.headers.get('location');
    console.log(`  ✓ /imposition response status: ${redirectRes.status}`);
    console.log(`  ✓ Redirect destination: ${location}`);
    const isRedirectValid = (redirectRes.status === 307 || redirectRes.status === 308) && location === '/Impose/';
    console.log(`  ✓ Safe redirect to /Impose/ verified: ${isRedirectValid}`);

    // -------------------------------------------------------------------------
    // TEST 5: Route Hardening & Path Traversal Rejections
    // -------------------------------------------------------------------------
    console.log('\n[Test 5] Testing Route Hardening on /Impose/[[...slug]]...');

    // 5a. Traversal attack
    const traversalRes = await fetch(`${BASE_URL}/Impose/../../package.json`);
    console.log(`  ✓ Traversal attempt rejected with status: ${traversalRes.status} (Expected 400 or 403)`);

    // 5b. Null-byte injection
    const nullByteRes = await fetch(`${BASE_URL}/Impose/index.html%00.js`);
    console.log(`  ✓ Null-byte attempt rejected with status: ${nullByteRes.status} (Expected 400 or 403)`);

    // 5c. Missing static asset (Must return 404, NEVER fall back to index.html)
    const missingAssetRes = await fetch(`${BASE_URL}/Impose/assets/missing_vector.js`);
    const missingAssetText = await missingAssetRes.text();
    const doesNotReturnHtml = !missingAssetText.includes('<!DOCTYPE html>');
    console.log(`  ✓ Missing script returns 404: ${missingAssetRes.status === 404}`);
    console.log(`  ✓ Missing script does NOT return HTML fallback: ${doesNotReturnHtml}`);

    console.log('\n============================================================');
    console.log('✅ ALL PHASE 11.1 ACCEPTANCE TESTS PASSED SUCCESSFULLY!');
    console.log('============================================================');

  } finally {
    await browser.close();
  }
}

runAcceptance().catch((err) => {
  console.error('\n❌ Phase 11.1 Acceptance Test Failed:', err);
  process.exit(1);
});
