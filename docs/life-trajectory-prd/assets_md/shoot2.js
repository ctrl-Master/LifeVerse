const { chromium } = require('playwright');
const { pathToFileURL } = require('url');

(async () => {
  const url = pathToFileURL('D:/Users/user/Desktop/数智化资料库/人生推演/人生推测演示程序/life-trajectory-prd/life-trajectory-prd.html').href;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  // stabilize: hide animated bg to avoid fl::: just screenshot elements
  const dir = 'D:/Users/user/Desktop/数智化资料库/人生推演/人生推测演示程序/life-trajectory-prd/assets_md';

  async function shot(sel, name, wait) {
    try {
      if (wait) await page.waitForTimeout(wait);
      const el = await page.$(sel);
      if (!el) { console.log('SKIP (no elem)', name, sel); return; }
      await el.screenshot({ path: `${dir}/${name}.png` });
      console.log('OK', name);
    } catch (e) { console.log('FAIL', name, e.message); }
  }

  // 1. Hero
  await shot('#hero', 'shot-hero', 300);
  // 2. Worldview (sec-0) includes audio spec card
  await shot('#sec-0', 'shot-worldview', 300);
  // 3. Module 1 nebula: click inject then capture
  try {
    await page.click('#nebulaInject');
    await page.waitForTimeout(1800);
    // click a gravity chip to show injection
    await page.click('.grav-chip[data-k="age"]');
    await page.waitForTimeout(400);
    await shot('.nebula-stage', 'shot-nebula', 200);
  } catch (e) { console.log('FAIL nebula', e.message); }
  // 4. Module 3 twin: click a reso-pill to show resonance beam
  try {
    await page.click('.reso-pill[data-pair="0"]');
    await page.waitForTimeout(900);
    await shot('.twin-stage', 'shot-twin', 200);
  } catch (e) { console.log('FAIL twin', e.message); }
  // 5. Module 5 probe: move slider + split
  try {
    await page.$eval('#sl_probe', el => { el.value = 2033; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(500);
    await shot('.probe-stage', 'shot-probe', 200);
    await page.click('#btnSplit');
    await page.waitForTimeout(600);
    await shot('#splitWrap', 'shot-split', 200);
  } catch (e) { console.log('FAIL probe', e.message); }
  // 6. Module 8 starmap: trigger spouse scene (high-resistance parents -> echo waves)
  try {
    await page.click('.starmap-toolbar .dynasty-tab[data-scene="spouse"]');
    await page.waitForTimeout(2600);
    await shot('.starmap-stage', 'shot-echo', 200);
  } catch (e) { console.log('FAIL echo', e.message); }
  // 7. retire module
  await shot('#mod-7', 'shot-retire', 300);

  console.log('CONSOLE ERRORS:', errors.length);
  errors.slice(0, 10).forEach(e => console.log('  -', e));
  await browser.close();
})();
