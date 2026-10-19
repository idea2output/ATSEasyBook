import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ZARKA\\.gemini\\antigravity\\brain\\2f69f596-41b2-4280-b07f-e834ff1996f2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3008';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPhase6Acceptance() {
  console.log('=== Starting ATS EasyBook Phase 6 Browser Acceptance Tests ===\n');

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

    // ----------------------------------------------------
    // STEP 1: Create a Local Book Before Authentication
    // ----------------------------------------------------
    console.log('[Step 1] Navigate to Dashboard (/) and create local sample book...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await sleep(1000);

    const loadSampleBtn = (await page.$('#load-sample-novel-btn')) || (await page.$('#load-sample-novel-btn-empty'));
    if (loadSampleBtn) {
      console.log('  Creating local sample novel...');
      await loadSampleBtn.click();
      await sleep(2000);
      // Return to dashboard
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
      await sleep(1000);
    }

    // ----------------------------------------------------
    // STEP 2: Authenticate User Account
    // ----------------------------------------------------
    console.log('[Step 2] Open Authentication modal from Navbar and register...');
    const authBtn = (await page.$('#navbar-auth-btn')) || (await page.$('#open-auth-btn'));
    console.log(`  authBtn found: ${!!authBtn}`);
    if (authBtn) {
      await authBtn.click();
      await sleep(800);

      // Switch to Register tab
      const registerTab = (await page.$('#auth-tab-register')) || (await page.$('#tab-auth-signup'));
      console.log(`  registerTab found: ${!!registerTab}`);
      if (registerTab) {
        await registerTab.click();
        await sleep(500);
      }

      // Fill in registration form
      const nameInput = await page.$('#register-name-input');
      const email = `captain_${Date.now()}@polar-archives.org`;
      if (nameInput) await page.type('#register-name-input', 'Captain Arthur Vance');
      await page.type('#register-email-input', email);
      await page.type('#register-org-input', 'Polar Geographic Society');
      await page.type('#register-password-input', 'PolarExpedition2026!');

      const submitRegBtn = await page.$('#register-submit-btn');
      console.log(`  register-submit-btn found: ${!!submitRegBtn}`);
      if (submitRegBtn) {
        await submitRegBtn.click();
        await sleep(2000);
      }
    }

    // Verify user profile button exists in navbar
    const userProfileBtn = (await page.$('#navbar-user-profile-btn')) || (await page.$('#user-profile-btn'));
    console.log(`[Step 2.1] Authenticated user profile button present: ${!!userProfileBtn}`);

    // ----------------------------------------------------
    // STEP 3: Local to Cloud Migration Flow
    // ----------------------------------------------------
    console.log('[Step 3] Testing Local to Cloud Migration flow...');
    const migrateBtn = (await page.$('#navbar-migrate-btn')) || (await page.$('#open-migration-btn'));
    console.log(`  migrateBtn found: ${!!migrateBtn}`);
    if (migrateBtn) {
      await migrateBtn.click();
      await sleep(1000);

      // Capture screenshot of migration modal with scope preview
      const migrationModalShot = path.join(ARTIFACT_DIR, 'screenshot-migration-flow.png');
      await page.screenshot({ path: migrationModalShot, fullPage: false });
      console.log(`Saved screenshot: ${migrationModalShot}`);

      // Confirm migration
      const confirmMigrateBtn = await page.$('#confirm-migration-btn');
      if (confirmMigrateBtn) {
        await confirmMigrateBtn.click();
        await sleep(2500);
      }

      // Close modal if view cloud projects button is shown
      const closeOrViewBtn = await page.$('button[class*="bg-indigo-600"]');
      if (closeOrViewBtn) {
        await closeOrViewBtn.click();
        await sleep(1000);
      }
    }

    // ----------------------------------------------------
    // STEP 4: Open Book Studio & Collaboration Comments
    // ----------------------------------------------------
    console.log('[Step 4] Navigate into Book Studio (/books/[id])...');
    const firstProjectLink = await page.$('a[href^="/books/"]');
    if (firstProjectLink) {
      await firstProjectLink.click();
    } else {
      await page.goto(`${BASE_URL}/books/new`, { waitUntil: 'networkidle2' });
      const createBtn = await page.$('#create-project-submit-btn');
      if (createBtn) await createBtn.click();
    }
    await sleep(2500);

    // Switch to Comments tab
    console.log('[Step 3.1] Switch to Comments tab...');
    const commentsTab = await page.$('#tab-comments');
    if (commentsTab) {
      await commentsTab.click();
      await sleep(600);

      // Write and submit a new anchored comment
      const commentInput = await page.$('#new-comment-textarea');
      if (commentInput) {
        await commentInput.type('Verify latitude and longitude coordinates before final press run.');
        const postCommentBtn = await page.$('#post-comment-btn');
        if (postCommentBtn) {
          await postCommentBtn.click();
          await sleep(800);
        }
      }

      // Capture screenshot of Comments panel with presence
      const commentsShot = path.join(ARTIFACT_DIR, 'screenshot-collaboration-comments.png');
      await page.screenshot({ path: commentsShot, fullPage: false });
      console.log(`Saved screenshot: ${commentsShot}`);
    }

    // ----------------------------------------------------
    // STEP 4: Project Sharing & Role Management Modal
    // ----------------------------------------------------
    console.log('[Step 4] Open Project Sharing & Permissions Modal...');
    const shareBtn = await page.$('#editor-share-team-btn');
    if (shareBtn) {
      await shareBtn.click();
      await sleep(800);

      // Invite an editor
      const emailInput = await page.$('#invite-email-input');
      if (emailInput) {
        await emailInput.type('chief.editor@maritime-press.co.uk');
        const sendInviteBtn = await page.$('#send-invitation-btn');
        if (sendInviteBtn) {
          await sendInviteBtn.click();
          await sleep(800);
        }
      }

      const sharingShot = path.join(ARTIFACT_DIR, 'screenshot-role-management.png');
      await page.screenshot({ path: sharingShot, fullPage: false });
      console.log(`Saved screenshot: ${sharingShot}`);

      // Close modal
      const closeShareBtn = await page.$('#close-sharing-modal-btn');
      if (closeShareBtn) {
        await closeShareBtn.click();
        await sleep(500);
      }
    }

    // ----------------------------------------------------
    // STEP 5: Version History & Comparison Diffs
    // ----------------------------------------------------
    console.log('[Step 5] Switch to Version History tab and capture snapshot...');
    const versionsTab = await page.$('#tab-versions');
    if (versionsTab) {
      await versionsTab.click();
      await sleep(600);

      // Create manual snapshot
      const snapshotBtn = await page.$('#take-manual-snapshot-btn');
      if (snapshotBtn) {
        await snapshotBtn.click();
        await sleep(500);
        const labelInput = await page.$('#snapshot-label-input');
        if (labelInput) {
          await labelInput.type('Editorial Review & Typographic Sign-off');
          const saveSnapshotBtn = await page.$('#confirm-save-snapshot-btn');
          if (saveSnapshotBtn) {
            await saveSnapshotBtn.click();
            await sleep(1000);
          }
        }
      }

      const versionsShot = path.join(ARTIFACT_DIR, 'screenshot-version-history.png');
      await page.screenshot({ path: versionsShot, fullPage: false });
      console.log(`Saved screenshot: ${versionsShot}`);
    }

    // ----------------------------------------------------
    // STEP 6: Background Export Jobs Queue Modal
    // ----------------------------------------------------
    console.log('[Step 6] Open Background Export Jobs Queue Modal...');
    const jobsBtn = await page.$('#editor-export-queue-btn');
    if (jobsBtn) {
      await jobsBtn.click();
      await sleep(800);

      const jobsShot = path.join(ARTIFACT_DIR, 'screenshot-export-jobs.png');
      await page.screenshot({ path: jobsShot, fullPage: false });
      console.log(`Saved screenshot: ${jobsShot}`);

      // Close modal
      const closeJobsBtn = await page.$('#close-jobs-modal-btn');
      if (closeJobsBtn) {
        await closeJobsBtn.click();
        await sleep(500);
      }
    }

    // ----------------------------------------------------
    // STEP 7: Print-on-Demand Specification & Order Simulation
    // ----------------------------------------------------
    console.log('[Step 7] Open Print-on-Demand Modal...');
    const printBtn = await page.$('#editor-print-order-btn');
    if (printBtn) {
      await printBtn.click();
      await sleep(800);

      // Fill in shipping destination
      const nameInput = await page.$('#shipping-name-input');
      if (nameInput) await nameInput.type('Polar Archives Library');
      const streetInput = await page.$('#shipping-street-input');
      if (streetInput) await streetInput.type('10 Admiralty Arch');
      const cityInput = await page.$('#shipping-city-input');
      if (cityInput) await cityInput.type('London');
      const zipInput = await page.$('#shipping-zip-input');
      if (zipInput) await zipInput.type('SW1A 2WH');

      // Click simulate order submission
      const submitOrderBtn = await page.$('#submit-print-order-btn');
      if (submitOrderBtn) {
        await submitOrderBtn.click();
        await sleep(1200);
      }

      const printShot = path.join(ARTIFACT_DIR, 'screenshot-print-provider-order.png');
      await page.screenshot({ path: printShot, fullPage: false });
      console.log(`Saved screenshot: ${printShot}`);

      // Close modal
      const closePrintBtn = await page.$('#close-print-modal-btn');
      if (closePrintBtn) {
        await closePrintBtn.click();
        await sleep(500);
      }
    }

    console.log('\n=== Acceptance Verification Check ===');
    console.log(`Total unexpected console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.error('Errors encountered:', consoleErrors);
    } else {
      console.log('✓ Zero browser console errors encountered.');
    }
  } catch (err) {
    console.error('Acceptance test failed with error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    console.log('=== Phase 6 Acceptance Test Finished ===');
  }
}

runPhase6Acceptance();
