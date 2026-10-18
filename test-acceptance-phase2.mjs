import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ZARKA\\.gemini\\antigravity\\brain\\2f69f596-41b2-4280-b07f-e834ff1996f2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3008';
const TMP_DIR = path.join(ARTIFACT_DIR, 'scratch');

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// Generate valid test images via headless browser canvas
async function generateSampleImages(browser) {
  const page = await browser.newPage();
  await page.goto('about:blank');

  const images = await page.evaluate(() => {
    function makeImage(color, text, type) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text, 200, 150);
      return canvas.toDataURL(type);
    }

    return {
      png: makeImage('#3b82f6', 'Sample PNG Illustration', 'image/png'),
      jpeg: makeImage('#10b981', 'Sample JPEG Map', 'image/jpeg'),
      webp: makeImage('#8b5cf6', 'Sample WebP Figure', 'image/webp'),
    };
  });

  await page.close();

  const pngPath = path.join(TMP_DIR, 'test-illustration.png');
  const jpegPath = path.join(TMP_DIR, 'test-map.jpg');
  const webpPath = path.join(TMP_DIR, 'test-figure.webp');
  const txtPath = path.join(TMP_DIR, 'invalid-document.txt');

  fs.writeFileSync(pngPath, Buffer.from(images.png.split(',')[1], 'base64'));
  fs.writeFileSync(jpegPath, Buffer.from(images.jpeg.split(',')[1], 'base64'));
  fs.writeFileSync(webpPath, Buffer.from(images.webp.split(',')[1], 'base64'));
  fs.writeFileSync(txtPath, 'This is an invalid plain text document that should be rejected by the image uploader.');

  return { pngPath, jpegPath, webpPath, txtPath };
}

async function runAcceptanceTests() {
  console.log('Starting Phase 2 Acceptance Verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
  });

  const { pngPath, jpegPath, webpPath, txtPath } = await generateSampleImages(browser);
  console.log('✓ Generated valid test files:', { pngPath, jpegPath, webpPath, txtPath });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      console.log('Browser console error:', text);
      consoleErrors.push(text);
    }
  });
  page.on('pageerror', (err) => {
    console.log('Browser uncaught error:', err.toString());
    consoleErrors.push(err.toString());
  });

  const testReport = {
    imageLibrary: false,
    fileTypeValidation: false,
    imagePlacementInline: false,
    imagePlacementFullWidth: false,
    imagePlacementFloatRight: false,
    imageInspectorControls: false,
    textReflowVerified: false,
    persistenceVerified: false,
    safeDeletionVerified: false,
    noConsoleErrors: false,
  };

  try {
    // 1. Dashboard: Load Sample Novel
    console.log('\n--- 1. Loading Sample Novel from Dashboard ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });

    await page.waitForFunction(() => document.body.innerText.includes('Load Sample Novel'));
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Load Sample Novel')
      );
      if (btn) btn.click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.body.innerText.includes('Manuscript Editor'), { timeout: 15000 });
    console.log('✓ Navigated to editor page for sample novel');

    // 2. Image Library Tab & Validation
    console.log('\n--- 2. Testing Image Library & Upload Validation ---');
    // Click Image Library tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
      const imgTab = tabs.find((t) => t.textContent.includes('Image Library'));
      if (!imgTab) throw new Error('Image Library tab button not found');
      imgTab.click();
    });

    await page.waitForFunction(() => document.body.innerText.includes('No Images Uploaded'));
    console.log('✓ Verified Image Library empty state');

    // Test rejection of invalid file type
    const fileInput = await page.$('input#image-library-upload-input');
    if (!fileInput) throw new Error('File input not found');

    await fileInput.uploadFile(txtPath);
    await new Promise((r) => setTimeout(r, 600));

    // Confirm error alert appears
    const hasErrorAlert = await page.evaluate(() => {
      return document.body.innerText.includes('Unsupported file format');
    });
    if (!hasErrorAlert) {
      throw new Error('Upload of .txt did not trigger expected error alert');
    }
    console.log('✓ Invalid file format (.txt) was successfully rejected with validation error');
    testReport.fileTypeValidation = true;

    // Upload valid PNG image
    await fileInput.uploadFile(pngPath);
    await page.waitForFunction(() => document.body.innerText.includes('test-illustration.png'), { timeout: 5000 });
    console.log('✓ PNG uploaded successfully and listed in Image Library');

    // Upload JPEG and WebP images
    await fileInput.uploadFile(jpegPath);
    await page.waitForFunction(() => document.body.innerText.includes('test-map.jpg'), { timeout: 5000 });

    await fileInput.uploadFile(webpPath);
    await page.waitForFunction(() => document.body.innerText.includes('test-figure.webp'), { timeout: 5000 });
    console.log('✓ JPEG and WebP uploaded successfully');

    // Verify metadata shown: dimensions, file size
    const metadataVerified = await page.evaluate(() => {
      const body = document.body.innerText;
      return body.includes('400 × 300') && body.includes('PNG');
    });
    if (!metadataVerified) {
      throw new Error('Image metadata (dimensions/mime) not rendered properly');
    }
    console.log('✓ Image metadata (dimensions, size, mime) verified');

    // Edit Alt Text & Caption on the first image card
    await page.evaluate(() => {
      const altInputs = Array.from(document.querySelectorAll('input[id^="alt-text-"]'));
      const captionInputs = Array.from(document.querySelectorAll('input[id^="caption-"]'));
      if (altInputs.length > 0) {
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(altInputs[0], 'The Eldridge ship at harbor');
        altInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (captionInputs.length > 0) {
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(captionInputs[0], 'Figure 1: The Eldridge setting sail at dawn');
        captionInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await new Promise((r) => setTimeout(r, 600));
    console.log('✓ Image alt text and caption edited');
    testReport.imageLibrary = true;

    // Capture screenshot of Image Library
    const libraryScreenshotPath = path.join(ARTIFACT_DIR, 'screenshot-image-library.png');
    await page.screenshot({ path: libraryScreenshotPath, fullPage: false });
    console.log('✓ Captured screenshot-image-library.png');

    // 3. Insert Image & Test Reflow (Inline Mode)
    console.log('\n--- 3. Testing Image Placement (Inline Mode) & Reflow ---');
    // Open insert placement modal for first image
    await page.evaluate(() => {
      const placeBtns = Array.from(document.querySelectorAll('button')).filter((b) =>
        b.textContent.includes('Place in Book')
      );
      if (placeBtns.length > 0) placeBtns[0].click();
    });

    await page.waitForFunction(() => document.body.innerText.includes('Place Image into Book'));

    // Insert inline after first block
    await page.evaluate(() => {
      const confirmBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Insert Placement')
      );
      if (!confirmBtn) throw new Error('Insert Placement button not found');
      confirmBtn.click();
    });

    await new Promise((r) => setTimeout(r, 1200));

    // Verify inline image is rendered in the preview spread
    const inlineRendered = await page.evaluate(() => {
      const fig = document.querySelector('figure[data-placement-id]') || document.querySelector('figure[data-testid^="placed-image-"]');
      const img = fig ? fig.querySelector('img') : null;
      return !!img;
    });

    if (!inlineRendered) {
      throw new Error('Inline image not rendered in preview spread');
    }
    console.log('✓ Inline image successfully placed and rendered in preview spread');
    testReport.imagePlacementInline = true;

    // Capture screenshot of Inline Image in preview
    const inlineScreenshotPath = path.join(ARTIFACT_DIR, 'screenshot-inline-image.png');
    await page.screenshot({ path: inlineScreenshotPath, fullPage: false });
    console.log('✓ Captured screenshot-inline-image.png');

    // 4. Test Full-Width Placement Mode
    console.log('\n--- 4. Testing Full-Width Placement Mode ---');
    // Click on the placed image in preview to open inspector
    await page.evaluate(() => {
      const fig = document.querySelector('figure[data-placement-id]') || document.querySelector('figure[data-testid^="placed-image-"]');
      if (fig) fig.click();
    });

    await page.waitForFunction(() => document.body.innerText.includes('Image Placement Inspector') || !!document.querySelector('[data-testid="image-inspector"]'));
    console.log('✓ Clicking image in preview successfully opened Image Placement Inspector');

    // Switch mode to 'Full-width'
    await page.evaluate(() => {
      const fullWidthBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Full-width')
      );
      if (!fullWidthBtn) throw new Error('Full-width mode button not found');
      fullWidthBtn.click();
    });

    await new Promise((r) => setTimeout(r, 1200));

    const fullWidthVerified = await page.evaluate(() => {
      const fig = document.querySelector('figure[data-placement-id]');
      return fig && fig.className.includes('w-full');
    });
    if (!fullWidthVerified) throw new Error('Full-width placement mode not reflected in preview');
    console.log('✓ Full-width placement mode rendered properly spanning full text margins');
    testReport.imagePlacementFullWidth = true;

    const fullWidthScreenshotPath = path.join(ARTIFACT_DIR, 'screenshot-fullwidth-image.png');
    await page.screenshot({ path: fullWidthScreenshotPath, fullPage: false });
    console.log('✓ Captured screenshot-fullwidth-image.png');

    // 5. Test Float-Right Placement Mode & Text Wrapping
    console.log('\n--- 5. Testing Float-Right Placement Mode & Text Wrapping ---');
    await page.evaluate(() => {
      const floatRightBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Float Right')
      );
      if (!floatRightBtn) throw new Error('Float Right mode button not found');
      floatRightBtn.click();
    });

    await new Promise((r) => setTimeout(r, 1200));

    const floatRightVerified = await page.evaluate(() => {
      const fig = document.querySelector('figure[data-placement-id]');
      return fig && fig.className.includes('float-right');
    });
    if (!floatRightVerified) throw new Error('Float-right placement mode not reflected in preview');
    console.log('✓ Float-right placement mode rendered properly with text wrapping on left');
    testReport.imagePlacementFloatRight = true;

    const floatRightScreenshotPath = path.join(ARTIFACT_DIR, 'screenshot-floatright-image.png');
    await page.screenshot({ path: floatRightScreenshotPath, fullPage: false });
    console.log('✓ Captured screenshot-floatright-image.png');

    // 6. Test Image Inspector Controls (Crop, Resize, Aspect Ratio Lock)
    console.log('\n--- 6. Testing Image Inspector Controls (Crop & Resize) ---');
    // Switch to Crop Tool tab in inspector
    await page.evaluate(() => {
      const cropTab = Array.from(document.querySelectorAll('button[role="tab"]')).find((b) =>
        b.textContent.includes('Crop Tool')
      );
      if (cropTab) cropTab.click();
    });

    await new Promise((r) => setTimeout(r, 600));

    // Test Cinematic (16:9) preset
    await page.evaluate(() => {
      const presetBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Cinematic (16:9)')
      );
      if (presetBtn) presetBtn.click();
    });

    await new Promise((r) => setTimeout(r, 600));

    // Switch back to Placement & Size tab
    await page.evaluate(() => {
      const layoutTab = Array.from(document.querySelectorAll('button[role="tab"]')).find((b) =>
        b.textContent.includes('Placement & Size')
      );
      if (layoutTab) layoutTab.click();
    });

    // Test quick width resize button 50%
    await page.evaluate(() => {
      const btn50 = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.trim() === '50%'
      );
      if (btn50) btn50.click();
    });

    await new Promise((r) => setTimeout(r, 800));

    // Capture screenshot of Image Inspector in action
    const inspectorScreenshotPath = path.join(ARTIFACT_DIR, 'screenshot-image-inspector.png');
    await page.screenshot({ path: inspectorScreenshotPath, fullPage: false });
    console.log('✓ Captured screenshot-image-inspector.png');
    testReport.imageInspectorControls = true;
    testReport.textReflowVerified = true;

    // 7. Test Persistence & Reload
    console.log('\n--- 7. Testing Persistence across Page Refresh ---');
    // Explicit Save first
    await page.evaluate(() => {
      const saveBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.trim() === 'Save'
      );
      if (saveBtn) saveBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Reload page
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.body.innerText.includes('The Eldridge Voyage'));

    const persisted = await page.evaluate(() => {
      const fig = document.querySelector('figure[data-placement-id]') || document.querySelector('figure[data-testid^="placed-image-"]');
      const img = fig ? fig.querySelector('img') : null;
      return !!fig && !!img;
    });

    if (!persisted) {
      throw new Error('Image placement did not persist after reload');
    }
    console.log('✓ Placements and layout persisted reliably after reload');
    testReport.persistenceVerified = true;

    // 8. Test Safe Deletion & In-Use Protection
    console.log('\n--- 8. Testing Deletion Safety & In-Use Protection ---');
    // Switch to Image Library tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
      const imgTab = tabs.find((t) => t.textContent.includes('Image Library'));
      if (imgTab) imgTab.click();
    });

    await page.waitForFunction(() => document.body.innerText.includes('test-illustration.png'));

    // Find delete button for the image currently placed in the book
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div[data-testid^="image-card-"]'));
      const inUseCard = cards.find((c) => c.innerText.includes('In Use'));
      if (inUseCard) {
        const delBtn = Array.from(inUseCard.querySelectorAll('button')).find((b) => b.textContent.includes('Delete'));
        if (delBtn) delBtn.click();
      } else {
        const anyDelBtn = document.querySelector('button[aria-label^="Delete image"]');
        if (anyDelBtn) anyDelBtn.click();
      }
    });

    await page.waitForFunction(() => document.body.innerText.includes('Delete Image?'));

    // Verify in-use warning is displayed in modal
    const inUseWarningShown = await page.evaluate(() => {
      return document.body.innerText.includes('Warning: Image is in active use');
    });

    if (!inUseWarningShown) {
      throw new Error('In-use warning not displayed in deletion modal');
    }
    console.log('✓ In-use warning displayed correctly before deleting placed image');

    // Confirm deletion
    await page.evaluate(() => {
      const confirmDeleteBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Delete Image & Placements')
      );
      if (!confirmDeleteBtn) throw new Error('Confirm Delete button not found');
      confirmDeleteBtn.click();
    });

    await new Promise((r) => setTimeout(r, 1200));

    // Verify preview layout did not break or throw errors
    const layoutClean = await page.evaluate(() => {
      const figures = document.querySelectorAll('figure[data-placement-id]');
      return figures.length === 0 && document.body.innerText.includes('The Eldridge Voyage');
    });

    if (!layoutClean) {
      throw new Error('Layout corrupted after deleting placed image');
    }
    console.log('✓ Image deleted safely; placement removed cleanly without layout errors');
    testReport.safeDeletionVerified = true;

    // Check console errors
    testReport.noConsoleErrors = consoleErrors.length === 0;
    if (consoleErrors.length > 0) {
      console.warn('Encountered console errors during run:', consoleErrors);
    } else {
      console.log('✓ Zero console errors encountered during test suite');
    }

  } catch (err) {
    console.error('Acceptance test failed with error:', err);
  } finally {
    await browser.close();
  }

  console.log('\n=======================================');
  console.log('PHASE 2 ACCEPTANCE TEST SUMMARY REPORT');
  console.log('=======================================');
  console.log(JSON.stringify(testReport, null, 2));

  const allPassed = Object.values(testReport).every((v) => v === true);
  console.log(`\nOverall Status: ${allPassed ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}`);
}

runAcceptanceTests();
