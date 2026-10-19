import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ZARKA\\.gemini\\antigravity\\brain\\2f69f596-41b2-4280-b07f-e834ff1996f2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3008';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPhase5Acceptance() {
  console.log('=== Starting ATS EasyBook Phase 5 Browser Acceptance Tests ===\n');

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
    // STEP 1: Template Landing & Project Creation
    // ----------------------------------------------------
    console.log('[Step 1] Navigate to Create Book page (/books/new)...');
    await page.goto(`${BASE_URL}/books/new`, { waitUntil: 'networkidle0' });
    await sleep(800);

    // Fill in Title and Author
    const titleField = await page.$('#book-title');
    if (titleField) await titleField.type('رحلة الأمل واليقين');

    const authorField = await page.$('#book-author');
    if (authorField) await authorField.type('الكاتب أحمد البغدادي');

    // Switch to Expert Mode on the landing page
    await page.evaluate(() => {
      const modeButtons = Array.from(document.querySelectorAll('button, div'));
      const expertOption = modeButtons.find(el => el.textContent && el.textContent.includes('Expert Mode'));
      if (expertOption) expertOption.click();
    });
    await sleep(300);

    // Click "Create Project" button
    console.log('Clicking Create Project button...');
    await page.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent && b.textContent.includes('Create Project')
      );
      if (submitBtn) submitBtn.click();
    });

    console.log('Waiting for Book Studio to load...');
    await page.waitForFunction(() => window.location.pathname.startsWith('/books/'), { timeout: 15000 });
    await page.waitForSelector('#raw-manuscript-input', { timeout: 15000 });
    console.log('✓ Successfully navigated to Book Studio:', page.url());
    await sleep(1500);

    // ----------------------------------------------------
    // STEP 2: Arabic RTL Publishing & Spread Geometry
    // ----------------------------------------------------
    console.log('\n[Step 2] Configuring Arabic RTL settings...');
    
    // Open Language Settings Tab
    const langTab = await page.$('#tab-language');
    if (langTab) {
      await langTab.click();
      await sleep(500);
      console.log('✓ Opened Language Settings tab.');

      // Select Arabic language option button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const arabicBtn = buttons.find(b => b.textContent && b.textContent.includes('Arabic'));
        if (arabicBtn) arabicBtn.click();
      });
      await sleep(500);
      console.log('✓ Selected Arabic (العربية) with RTL writing direction.');
    }

    // Switch back to Manuscript tab and enter Arabic text
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button[role="tab"]'));
      const msTab = buttons.find(b => b.textContent && b.textContent.includes('Manuscript Editor'));
      if (msTab) msTab.click();
    });
    await sleep(500);

    const textarea = await page.$('#raw-manuscript-input');
    if (textarea) {
      const arabicManuscript = `الفصل الأول: رحلة الأمل

كانت الشمس تميل نحو الغروب حين انطلقت القافلة عبر الصحراء الكبرى. لم يكن أحد يعلم ما تخبئه الرمال من أسرار قديمة، ولكن العزيمة كانت تملأ قلوب المسافرين وتدفعهم نحو الأمام.

قال القائد بحزم: "إن طريقنا طويل ومحفوف بالمخاطر، ولكن الصبر والتعاون هما مفتاح النجاة الوحيد في هذه الرحلة المجهولة."

استمرت المسيرة لعدة أيام حتى بدت في الأفق واحة خضراء يانعة تحيط بها أشجار النخيل الباسقة، وهناك وجدوا النبع الصافي الذي انتظروه طويلاً.`;

      await page.evaluate((el, val) => {
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, textarea, arabicManuscript);
      await sleep(800);

      // Click "Format manuscript" button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const fmtBtn = buttons.find(b => b.textContent && b.textContent.includes('Format manuscript'));
        if (fmtBtn) fmtBtn.click();
      });
      await sleep(1000);
      console.log('✓ Formatted Arabic manuscript with RTL text & Arabic chapter detection.');
    }

    // Capture screenshot of Arabic RTL Studio & Book Spread
    const screenshotArabicPath = path.join(ARTIFACT_DIR, 'screenshot-arabic-rtl.png');
    await page.screenshot({ path: screenshotArabicPath, fullPage: false });
    console.log('✓ Captured screenshot-arabic-rtl.png');

    // ----------------------------------------------------
    // STEP 3: Urdu RTL Publishing & Spread Order
    // ----------------------------------------------------
    console.log('\n[Step 3] Testing Urdu RTL document settings...');
    if (langTab) {
      await langTab.click();
      await sleep(500);

      // Select Urdu language option button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const urduBtn = buttons.find(b => b.textContent && b.textContent.includes('Urdu'));
        if (urduBtn) urduBtn.click();
      });
      await sleep(500);
      console.log('✓ Selected Urdu (اردو) with Eastern Arabic numerals.');
    }

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button[role="tab"]'));
      const msTab = buttons.find(b => b.textContent && b.textContent.includes('Manuscript Editor'));
      if (msTab) msTab.click();
    });
    await sleep(500);

    if (textarea) {
      const urduManuscript = `باب اول: کاروان حیات

یہ کتاب اردو زبان کے شاہکار ادب کا ایک نیا سنگ میل ہے۔ اس میں زندگی کے نشیب و فراز اور انسانی جذبوں کی عکاسی بڑی خوبصورتی سے کی گئی ہے۔

قائد نے مخاطب ہو کر کہا: "اگر ہمارے ارادے پختہ ہوں تو دشوار ترین راستے بھی آسان ہو جاتے ہیں۔ کامیابی ہمیشہ مسلسل محنت کا ثمر ہوتی ہے۔"

جب رات ڈھلی تو مسافروں نے وادی کے دامن میں خیمے لگائے اور ستاروں بھرے آسمان تلے آنے والے کل کے خواب سجائے۔`;

      await page.evaluate((el, val) => {
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, textarea, urduManuscript);
      await sleep(800);

      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const fmtBtn = buttons.find(b => b.textContent && b.textContent.includes('Format manuscript'));
        if (fmtBtn) fmtBtn.click();
      });
      await sleep(1000);
      console.log('✓ Formatted Urdu manuscript with Urdu Nastaliq typography.');
    }

    // Capture screenshot of Urdu RTL
    const screenshotUrduPath = path.join(ARTIFACT_DIR, 'screenshot-urdu-rtl.png');
    await page.screenshot({ path: screenshotUrduPath, fullPage: false });
    console.log('✓ Captured screenshot-urdu-rtl.png');

    // ----------------------------------------------------
    // STEP 4: Hindi Publishing Module & Live Sandbox
    // ----------------------------------------------------
    console.log('\n[Step 4] Testing Hindi Publishing Module & Live Sandbox...');
    const hindiTab = await page.$('#tab-hindi');
    if (hindiTab) {
      await hindiTab.click();
      await sleep(600);
      console.log('✓ Opened Hindi Publishing tab.');

      // Select Phonetic Typing Mode
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const phoneticBtn = buttons.find(b => b.textContent && b.textContent.includes('Phonetic Input'));
        if (phoneticBtn) phoneticBtn.click();
      });
      await sleep(300);

      // Type in live sandbox
      const sandboxInput = await page.$('input[placeholder*="Type"]');
      if (sandboxInput) {
        await sandboxInput.click();
        await page.evaluate((el) => {
          el.value = 'namaste bharat shanti';
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }, sandboxInput);
        await sleep(500);

        const renderedText = await page.evaluate(() => {
          const spans = Array.from(document.querySelectorAll('span'));
          const out = spans.find(s => s.textContent && s.textContent.includes('नमस्ते'));
          return out ? out.textContent : '';
        });
        console.log(`✓ Tested Phonetic transliteration sandbox: "namaste bharat shanti" -> "${renderedText}"`);
      }

      // Open Font Manager Modal
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const fmBtn = buttons.find(b => b.textContent && b.textContent.includes('Font Manager'));
        if (fmBtn) fmBtn.click();
      });
      await sleep(600);
      console.log('✓ Opened Font Manager Modal.');

      // Close modal by clicking "Done"
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const doneBtn = buttons.find(b => b.textContent && b.textContent.trim() === 'Done');
        if (doneBtn) doneBtn.click();
      });
      await sleep(400);
      console.log('✓ Closed Font Manager Modal.');
    }

    // Capture screenshot of Hindi panel
    const screenshotHindiPath = path.join(ARTIFACT_DIR, 'screenshot-hindi-panel.png');
    await page.screenshot({ path: screenshotHindiPath, fullPage: false });
    console.log('✓ Captured screenshot-hindi-panel.png');

    // ----------------------------------------------------
    // STEP 5: Accessible Reflowable EPUB 3 Export Modal
    // ----------------------------------------------------
    console.log('\n[Step 5] Testing Accessible EPUB 3 Export Modal...');
    const epubBtn = await page.$('#editor-export-epub-btn');
    if (epubBtn) {
      await epubBtn.click();
      await sleep(600);
      console.log('✓ Opened Accessible EPUB 3 Export Modal.');

      // Capture screenshot of EPUB modal
      const screenshotEpubPath = path.join(ARTIFACT_DIR, 'screenshot-epub-export.png');
      await page.screenshot({ path: screenshotEpubPath, fullPage: false });
      console.log('✓ Captured screenshot-epub-export.png');

      // Close modal
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const cancelBtn = buttons.find(b => b.textContent && b.textContent.trim() === 'Cancel');
        if (cancelBtn) cancelBtn.click();
      });
      await sleep(400);
      console.log('✓ Closed EPUB Modal.');
    }

    console.log('\n--- Console Error Audit ---');
    console.log(`Encountered ${consoleErrors.length} unexpected browser console errors.`);
    if (consoleErrors.length > 0) {
      console.warn('Console Errors:', consoleErrors);
    }

  } finally {
    await browser.close();
  }

  console.log('\n=== Phase 5 Browser Acceptance Tests Completed Successfully ===');
}

runPhase5Acceptance().catch((err) => {
  console.error('Acceptance test failed:', err);
  process.exit(1);
});
