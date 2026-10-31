const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit, devices } = require('playwright');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'test-results', 'mobile-motion');
const requestedEngine = process.env.BROWSER_ENGINE;
assert.ok(!requestedEngine || ['chromium', 'webkit'].includes(requestedEngine),
  'BROWSER_ENGINE must be chromium or webkit');
const engines = requestedEngine ? [requestedEngine] : ['webkit', 'chromium'];
const iphones = Object.keys(devices).filter((name) => {
  const number = name.match(/^iPhone (\d+)/);
  return number && Number(number[1]) >= 13 && !name.includes('landscape');
});
const androids = ['Galaxy S24', 'Galaxy A55', 'Pixel 9', 'Pixel 10 Pro XL'];
fs.mkdirSync(output, { recursive: true });

async function settle(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function scroll(page, selector) {
  await page.locator(selector).evaluate((el) => {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: 'instant' });
  });
  await settle(page);
}
async function open(browser, name, reduced = false) {
  assert.ok(devices[name], `Install a current Playwright version with the ${name} profile`);
  const { defaultBrowserType, ...device } = devices[name];
  const context = await browser.newContext({ ...device, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const errors = [];
  // Source config has no receiver. Block every non-local request as well.
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== 'http://invitation.test') return route.abort();
    const filename = path.join(root, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname));
    if (fs.existsSync(filename) && fs.statSync(filename).isFile()) return route.fulfill({ path: filename });
    return route.fulfill({ status: 404, body: 'Not found' });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://invitation.test/');
  await page.locator('html.teddy-ready').waitFor();
  await page.locator('#floating-teddy img').evaluate((image) => image.decode());
  await settle(page);
  return { page, context, errors };
}
async function assertPosition(page, label) {
  const state = await page.locator('#floating-teddy').evaluate((teddy) => {
    const rect = teddy.getBoundingClientRect();
    const height = window.visualViewport ? window.visualViewport.height : innerHeight;
    return {
      fixed: getComputedStyle(document.getElementById('teddy-stage')).position,
      inView: rect.left < innerWidth && rect.right > 0 && rect.top < height && rect.bottom > 0,
      overflow: document.documentElement.scrollWidth > innerWidth,
      receivesTouches: getComputedStyle(teddy).pointerEvents !== 'none'
    };
  });
  assert.equal(state.fixed, 'fixed', `${label}: stage follows the viewport`);
  assert.equal(state.inView, true, `${label}: teddy stays within the viewport while content can obscure it`);
  assert.equal(state.overflow, false, `${label}: no horizontal page overflow`);
  assert.equal(state.receivesTouches, false, `${label}: teddy does not block the form`);
}

(async () => {
  for (const engine of engines) {
    const browser = await ({ chromium, webkit })[engine].launch({ headless: true, timeout: 15000,
      ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
    let profiles = 0;
    try {
      for (const name of engine === 'webkit' ? iphones : androids) {
        const { page, context, errors } = await open(browser, name);
        try {
          const initial = await page.locator('#floating-teddy').evaluate((el) => el.style.transform);
          await scroll(page, '#celebrate');
          assert.notEqual(await page.locator('#floating-teddy').evaluate((el) => el.style.transform), initial,
            `${name}: teddy moves when scrolling`);
          await assertPosition(page, name);
          const portrait = page.viewportSize();
          const scene = await page.locator('.hero-scene').boundingBox();
          const caption = await page.locator('.art-caption').boundingBox();
          assert.ok(caption.y >= scene.y + scene.height, `${name}: caption stays below the floral artwork`);
          const centers = [];
          for (const progress of [.5, 2 / 3]) {
            await page.evaluate((value) => window.scrollTo({
              top: (document.documentElement.scrollHeight - innerHeight) * value, behavior: 'instant'
            }), progress);
            await settle(page);
            centers.push(await page.locator('#floating-teddy').evaluate((el) => {
              const rect = el.getBoundingClientRect(); return rect.left + rect.width / 2;
            }));
          }
          assert.ok(centers[0] < portrait.width * .4 && centers[1] > portrait.width * .6,
            `${name}: teddy travels from the left side to the right`);
          // A shorter visible screen represents expanded browser chrome.
          await page.setViewportSize({ width: portrait.width, height: portrait.height - 120 });
          await settle(page);
          await assertPosition(page, `${name}, shorter viewport`);
          await page.setViewportSize({ width: portrait.height, height: portrait.width });
          await scroll(page, '#rsvp');
          await assertPosition(page, `${name}, landscape`);
          await page.setViewportSize(portrait);
          await scroll(page, '#venue');
          if (['iPhone 13', 'Galaxy S24'].includes(name)) {
            await page.screenshot({ path: path.join(output, `${engine}-${name.replaceAll(' ', '-')}.png`) });
          }
          assert.deepEqual(errors, [], `${name}: no page errors`);
          profiles++;
          console.log(`PASS ${engine}: ${name} (portrait, landscape, shorter viewport)`);
        } finally { await context.close(); }
      }
      const { page, context, errors } = await open(browser, engine === 'webkit' ? 'iPhone 13' : 'Galaxy S24', true);
      try {
        const initial = await page.locator('#floating-teddy').evaluate((el) => el.style.transform);
        assert.equal(await page.locator('#floating-teddy img').evaluate((el) => getComputedStyle(el).animationName), 'none');
        await scroll(page, '#celebrate');
        assert.equal(await page.locator('#floating-teddy').evaluate((el) => el.style.transform), initial);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await settle(page);
        await scroll(page, '#celebrate');
        await assertPosition(page, `${engine}: device motion enabled`);
        assert.notEqual(await page.locator('#floating-teddy').evaluate((el) => el.style.transform), initial);
        assert.equal(await page.locator('#floating-teddy img').evaluate((el) => getComputedStyle(el).animationName), 'teddy-bob');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await settle(page);
        assert.equal(await page.locator('body').evaluate((el) => el.classList.contains('motion-reduced')), true);
        assert.deepEqual(errors, []);
      } finally { await context.close(); }
      console.log(`${engine}: ${profiles} emulated device profiles passed, plus Reduce Motion preference changes.`);
    } finally { await browser.close(); }
  }
  console.log('Engine/device emulation only; physical devices and OS power-saving modes need a device check. No live RSVP requests were made.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
