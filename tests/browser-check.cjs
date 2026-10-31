const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require('playwright');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'test-results');
const fakeEndpoint = 'https://script.google.com/macros/s/test-receiver/exec';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const engine = process.env.BROWSER_ENGINE || 'chromium';
  assert.ok(['chromium', 'webkit'].includes(engine), 'BROWSER_ENGINE must be chromium or webkit');
  const browser = await ({ chromium, webkit })[engine].launch({ headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
  let checks = 0;
  const errors = [];
  async function makeContext(options = {}, endpoint = false, closed = false) {
    const context = await browser.newContext(options);
    await context.addInitScript(({ closed }) => {
      Date.now = () => Date.parse(closed ? '2026-11-16T16:00:00Z' : '2026-10-27T16:00:00Z');
    }, { closed });
    await context.route('http://invitation.test/**', async (route) => {
      const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
      const file = path.join(root, pathname === '/' ? 'index.html' : pathname);
      if (endpoint && pathname === '/js/site-config.js') {
        await route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(file, 'utf8')
          .replace("rsvpEndpoint: ''", `rsvpEndpoint: '${fakeEndpoint}'`) });
      } else if (fs.existsSync(file) && fs.statSync(file).isFile()) await route.fulfill({ path: file });
      else await route.fulfill({ status: 404, body: 'Not found' });
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://invitation.test/');
    await page.locator('#hero-title').waitFor();
    return { context, page };
  }
  async function scrollTo(page, selector) {
    await page.locator(selector).evaluate((el) => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: 'instant' }));
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }
  async function screenshot(page, name) {
    await page.locator('img').evaluateAll(async (images) => {
      await Promise.all(images.filter((image) => image.getAttribute('src')).map(async (image) => {
        image.loading = 'eager'; try { await image.decode(); } catch (_) { /* Checked separately. */ }
      }));
    });
    for (const selector of ['#little-surprise', '#celebrate', '#venue', '#rsvp']) await scrollTo(page, selector);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: path.join(output, name), fullPage: true, animations: 'disabled' });
  }
  try {
    const mobile = await makeContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = mobile.page;
    assert.equal(await page.title(), 'Aruni & Jaydeep · We’re having a baby!');
    assert.equal(await page.locator('#submit-rsvp').isDisabled(), true);
    assert.equal(await page.locator('#maps-link').getAttribute('href'), 'https://maps.app.goo.gl/ggcyZocf3u9xvAgi6');
    checks += 3;
    const initialPose = await page.locator('#floating-teddy').evaluate((el) => el.style.transform);
    await scrollTo(page, '#celebrate');
    const travelPose = await page.locator('#floating-teddy').evaluate((el) => el.style.transform);
    assert.notEqual(initialPose, travelPose);
    assert.equal(await page.locator('#floating-teddy').evaluate((el) => getComputedStyle(el).pointerEvents), 'none');
    async function teddyCenterAt(progress) {
      await page.evaluate((value) => window.scrollTo({
        top: (document.documentElement.scrollHeight - innerHeight) * value, behavior: 'instant'
      }), progress);
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      return page.locator('#floating-teddy').evaluate((el) => {
        const rect = el.getBoundingClientRect(); return rect.left + rect.width / 2;
      });
    }
    assert.ok(await teddyCenterAt(.5) < 390 * .4, 'teddy crosses to the left');
    assert.ok(await teddyCenterAt(2 / 3) > 390 * .6, 'teddy returns to the right');
    checks += 4;
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `no overflow at ${width}px`);
      checks++;
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await scrollTo(page, '#little-surprise');
    await page.locator('#reveal-date').click();
    assert.equal(await page.locator('#scratch-card').evaluate((el) => el.classList.contains('is-revealed')), true);
    assert.equal(await page.locator('#due-date').textContent(), 'See you in February!');
    await page.reload();
    assert.equal(await page.locator('#scratch-card').evaluate((el) => el.classList.contains('is-revealed')), true);
    checks += 3;
    await scrollTo(page, '#venue');
    await page.locator('#open-map').click();
    assert.equal(await page.locator('#map-dialog').evaluate((el) => el.open), true);
    await page.locator('#map-zoom-in').click();
    assert.equal(await page.locator('#map-zoom-label').textContent(), '150%');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#map-dialog').evaluate((el) => el.open), false);
    assert.equal(await page.locator('body').evaluate((el) => el.classList.contains('modal-open')), false);
    checks += 4;
    await scrollTo(page, '#rsvp');
    await page.getByRole('button', { name: 'One more adult' }).click();
    await page.getByRole('button', { name: 'One more child' }).click();
    assert.equal(await page.locator('#adults').inputValue(), '2');
    assert.equal(await page.locator('#children').inputValue(), '1');
    checks += 2;
    await screenshot(page, 'mobile.png');

    const desktop = await makeContext({ viewport: { width: 1440, height: 1000 } });
    await screenshot(desktop.page, 'desktop.png');
    const brokenImages = await desktop.page.locator('img[src]').evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src));
    assert.deepEqual(brokenImages, []); checks++;

    const scratch = await makeContext({ viewport: { width: 390, height: 844 } });
    await scrollTo(scratch.page, '#little-surprise');
    const rect = await scratch.page.locator('#scratch-canvas').boundingBox();
    await scratch.page.mouse.move(rect.x + 10, rect.y + 15);
    await scratch.page.mouse.down();
    for (let y = 15; y < rect.height - 10; y += 25) {
      await scratch.page.mouse.move(rect.x + rect.width - 10, rect.y + y, { steps: 8 });
      await scratch.page.mouse.move(rect.x + 10, rect.y + y + 12, { steps: 8 });
    }
    await scratch.page.mouse.up();
    assert.equal(await scratch.page.locator('#scratch-card').evaluate((el) => el.classList.contains('is-revealed')), true); checks++;

    const reduced = await makeContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const reducedBefore = await reduced.page.locator('#floating-teddy').evaluate((el) => el.style.transform);
    await scrollTo(reduced.page, '#rsvp');
    assert.equal(await reduced.page.locator('#floating-teddy').evaluate((el) => el.style.transform), reducedBefore);
    assert.equal(await reduced.page.locator('#floating-teddy img').evaluate((el) => getComputedStyle(el).animationName), 'none');
    checks += 2;

    const live = await makeContext({ viewport: { width: 390, height: 844 } }, true);
    const requests = [];
    await live.page.route(fakeEndpoint, async (route) => {
      const data = Object.fromEntries(new URLSearchParams(route.request().postData()));
      requests.push(data);
      if (requests.length === 1) return route.abort('failed');
      await route.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true, requestId: data.requestId }) });
    });
    await scrollTo(live.page, '#rsvp');
    await live.page.locator('#submit-rsvp').click();
    assert.equal(await live.page.locator('#guest-name').getAttribute('aria-invalid'), 'true');
    await live.page.locator('#guest-name').fill('Test Family');
    await live.page.locator('#guest-email').fill('family@example.com');
    await live.page.locator('#adults').fill('2');
    await live.page.locator('#children').fill('1');
    await live.page.locator('#submit-rsvp').click();
    await live.page.locator('#form-status').filter({ hasText: 'couldn’t confirm' }).waitFor();
    assert.equal(await live.page.locator('#rsvp-success').isVisible(), false);
    await live.page.evaluate(() => { Date.now = () => Date.parse('2026-11-16T05:00:20Z'); });
    await live.page.locator('#submit-rsvp').click();
    await live.page.locator('#rsvp-success').waitFor();
    assert.equal(requests.length, 2);
    assert.equal(requests[0].requestId, requests[1].requestId);
    assert.equal(requests[1].adults, '2');
    assert.equal(requests[1].children, '1');
    assert.match(await live.page.locator('#rsvp-receipt').textContent(), /3 guests/);
    checks += 7;

    const closed = await makeContext({ viewport: { width: 390, height: 844 } }, true, true);
    assert.equal(await closed.page.locator('#submit-rsvp').isDisabled(), true);
    assert.match(await closed.page.locator('#form-availability').textContent(), /date has passed/);
    checks += 2;
    const downloadPromise = desktop.page.waitForEvent('download');
    await desktop.page.locator('#add-to-calendar').click();
    const download = await downloadPromise;
    const calendar = fs.readFileSync(await download.path(), 'utf8');
    assert.match(calendar, /DTSTART:20261129T150000Z/);
    assert.doesNotMatch(calendar, /DTEND/);
    checks += 2;
    assert.deepEqual(errors, []);
    console.log(`${checks} browser assertions passed. Phone and desktop screenshots: test-results/. No live RSVP endpoint was contacted.`);
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
