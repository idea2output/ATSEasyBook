import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\ZARKA\\.gemini\\antigravity\\brain\\2f69f596-41b2-4280-b07f-e834ff1996f2';
const BASE_URL = 'http://localhost:3008';

async function main() {
  console.log('=== Verifying True Palagio & Similar High-Contrast Display Fonts ===\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();

  console.log('[1] Loading Home Page at 1920x1080 viewport...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });

  // 1. Wait for web fonts to load
  await page.evaluateHandle('document.fonts.ready');

  // 2. Capture True Palagio (Default Active)
  const typographyInfo = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const line1 = h1?.children[0];
    const line2 = h1?.children[1];
    return {
      line1Text: line1?.textContent?.trim(),
      line1FontFamily: line1 ? window.getComputedStyle(line1).fontFamily : null,
      line2Text: line2?.textContent?.trim(),
      line2FontFamily: line2 ? window.getComputedStyle(line2).fontFamily : null,
    };
  });
  console.log('  -> Default Active Typography:', typographyInfo);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'phase11_4-true-palagio-hero.png'),
    clip: { x: 0, y: 0, width: 1920, height: 1080 },
  });
  console.log('  -> Captured: phase11_4-true-palagio-hero.png');

  // 3. Test Tenor Sans (Closest High-Contrast Fashion Sans Alternative)
  console.log('\n[2] Testing Tenor Sans (Similar High-Contrast Fashion Sans)...');
  const tenorBtn = await page.$('#font-pairing-tenor-manrope');
  if (tenorBtn) {
    await tenorBtn.click();
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'phase11_4-tenor-sans-hero.png'),
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
    });
    console.log('  -> Captured: phase11_4-tenor-sans-hero.png');
  }

  // 4. Test Syne (Sculptural Display Sans Alternative)
  console.log('\n[3] Testing Syne (Sculptural Modern Display Sans)...');
  const syneBtn = await page.$('#font-pairing-syne-inter');
  if (syneBtn) {
    await syneBtn.click();
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'phase11_4-syne-hero.png'),
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
    });
    console.log('  -> Captured: phase11_4-syne-hero.png');
  }

  // 5. Reset to True Palagio + Inter
  const palagioBtn = await page.$('#font-pairing-palagio-sans');
  if (palagioBtn) {
    await palagioBtn.click();
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log('\n=== ALL PALAGIO & SIMILAR FONT VERIFICATIONS COMPLETED! ===\n');
  await browser.close();
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
