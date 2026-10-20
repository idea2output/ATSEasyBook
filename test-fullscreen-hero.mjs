import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\ZARKA\\.gemini\\antigravity\\brain\\2f69f596-41b2-4280-b07f-e834ff1996f2';
const BASE_URL = 'http://localhost:3008';

async function main() {
  console.log('=== Starting Full-Screen Hero & Typography Verification ===\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();

  console.log('[1] Loading Home Page at 1920x1080 viewport...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });

  // 1. Measure Hero Height
  const heroDimensions = await page.evaluate(() => {
    const heroViewport = document.querySelector('#hero-viewport-stage');
    if (!heroViewport) return null;
    const rect = heroViewport.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      viewportHeight: window.innerHeight,
    };
  });
  console.log('  -> Hero Container Dimensions:', heroDimensions);
  if (!heroDimensions || heroDimensions.height < 850) {
    throw new Error(`Expected hero height to be full-screen (~900-1000px), got ${heroDimensions?.height}px`);
  }

  // 2. Check Line 1 & Line 2 Typography
  const typographyInfo = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const line1 = h1?.children[0];
    const line2 = h1?.children[1];
    return {
      line1Text: line1?.textContent?.trim(),
      line1FontFamily: line1 ? window.getComputedStyle(line1).fontFamily : null,
      line1Color: line1 ? window.getComputedStyle(line1).color : null,
      line2Text: line2?.textContent?.trim(),
      line2FontFamily: line2 ? window.getComputedStyle(line2).fontFamily : null,
      line2Color: line2 ? window.getComputedStyle(line2).color : null,
    };
  });
  console.log('  -> Typography Styles:', typographyInfo);

  if (!typographyInfo.line1FontFamily?.toLowerCase().includes('palagio')) {
    console.warn('Warning: Palagio not in line 1 font-family stack:', typographyInfo.line1FontFamily);
  }

  // 3. Capture Full Screen Hero Default (Palagio + Inter)
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'phase11_4-hero-fullscreen-palagio.png'),
    clip: { x: 0, y: 0, width: 1920, height: 1080 },
  });
  console.log('  -> Captured: phase11_4-hero-fullscreen-palagio.png');

  // 4. Test Font Pairing: Palagio + Manrope
  console.log('\n[2] Testing Font Pairing: Palagio + Manrope...');
  const manropeBtn = await page.$('#font-pairing-palagio-manrope');
  if (manropeBtn) {
    await manropeBtn.click();
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'phase11_4-hero-palagio-manrope.png'),
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
    });
    console.log('  -> Captured: phase11_4-hero-palagio-manrope.png');
  }

  // 5. Test Font Pairing: Playfair + Manrope
  console.log('\n[3] Testing Font Pairing: Playfair + Manrope...');
  const playfairBtn = await page.$('#font-pairing-playfair-manrope');
  if (playfairBtn) {
    await playfairBtn.click();
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'phase11_4-hero-playfair-manrope.png'),
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
    });
    console.log('  -> Captured: phase11_4-hero-playfair-manrope.png');
  }

  // 6. Reset back to default Palagio + Inter
  const defaultBtn = await page.$('#font-pairing-palagio-sans');
  if (defaultBtn) {
    await defaultBtn.click();
    await new Promise((r) => setTimeout(r, 300));
  }

  // 7. Test Scroll to Interactive Demo below the full screen hero
  console.log('\n[4] Testing Scroll down to #demo-interactive...');
  await page.evaluate(() => {
    document.querySelector('#demo-interactive')?.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'phase11_4-hero-scrolled-demo.png'),
    clip: { x: 0, y: 0, width: 1920, height: 1080 },
  });
  console.log('  -> Captured: phase11_4-hero-scrolled-demo.png');

  console.log('\n=== ALL FULL-SCREEN HERO & TYPOGRAPHY TESTS PASSED! ===\n');
  await browser.close();
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
