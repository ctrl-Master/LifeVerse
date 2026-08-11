const { chromium } = require('playwright');
const { pathToFileURL } = require('url');

(async () => {
  const filePath = 'D:/Users/user/Desktop/数智化资料库/人生推演/人生推测演示程序/life-trajectory-prd/life-trajectory-prd.html';
  const fileUrl = pathToFileURL(filePath).href;
  const out = 'D:/Users/user/Desktop/数智化资料库/人生推演/人生推测演示程序/life-trajectory-prd/assets_md';

  const browser = await chromium.launch({ channel: 'msedge', args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(2000); // let star-net draw a few frames

  async function shot(name, locator, opts = {}) {
    try {
      await locator.screenshot({ path: `${out}/${name}.png`, timeout: 20000, ...opts });
      console.log('OK', name);
    } catch (e) {
      console.log('FAIL', name, e.message.split('\n')[0]);
    }
  }

  // 1) Hero (with star-net background visible behind it)
  await shot('shot-hero', page.locator('.hero-wrap'));

  // 2) Disable the fixed background canvas so later captures are stable
  await page.evaluate(() => { const c = document.getElementById('bgStarNet'); if (c) c.style.display = 'none'; });
  await page.waitForTimeout(300);

  // 3) World view
  await shot('shot-worldview', page.locator('#sec-0'));

  // 4) Retirement module (default computed state)
  await shot('shot-retire', page.locator('#mod-7'));

  // 5) Star map: trigger a ripple by clicking canvas center, then capture
  const canvas = page.locator('#starmapCanvas');
  const box = await canvas.boundingBox();
  if (box) { await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); }
  await page.waitForTimeout(550);
  await shot('shot-starmap', page.locator('#mod-8'));

  // 6) AI design section
  await shot('shot-ai', page.locator('#sec-7'));

  // 7) A mid-page section to show overall layout (功能详情 header)
  await shot('shot-functions', page.locator('#sec-6'));

  await browser.close();
  console.log('DONE');
  console.log('errors:', errors.length ? errors.join(' | ') : 'NONE');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
