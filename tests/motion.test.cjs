const test = require('node:test');
const assert = require('node:assert/strict');
const { page } = require('./helpers/invitation-page.cjs');

test('legacy Safari motion listeners do not prevent teddy scrolling', () => {
  const browser = page({ legacy: true });
  assert.doesNotThrow(browser.start);
  const before = browser.ids['floating-teddy'].style.transform;
  browser.window.scrollY = 1400;
  browser.window.dispatch('scroll'); browser.flush();
  assert.notEqual(browser.ids['floating-teddy'].style.transform, before);
  browser.preference.matches = true;
  browser.preference.dispatch('legacy-change'); browser.flush();
  assert.equal(browser.document.body.classList.contains('motion-reduced'), true);
});

test('Reduce Motion keeps the teddy still and follows changes to the device preference', () => {
  const browser = page({ reduced: true }); browser.start();
  const teddy = browser.ids['floating-teddy'];
  const before = teddy.style.transform;
  browser.window.scrollY = 1400;
  browser.window.dispatch('scroll'); browser.flush();
  assert.equal(teddy.style.transform, before);
  browser.preference.matches = false;
  browser.preference.dispatch('change'); browser.flush();
  assert.notEqual(teddy.style.transform, before);
  assert.equal(browser.document.body.classList.contains('motion-reduced'), false);
  browser.preference.matches = true;
  browser.preference.dispatch('change'); browser.flush();
  const paused = teddy.style.transform;
  browser.window.scrollY = 2200;
  browser.window.dispatch('scroll'); browser.flush();
  assert.equal(teddy.style.transform, paused);
});

test('mobile toolbar resize refreshes teddy position without a window scroll', () => {
  const browser = page(); browser.start();
  browser.window.scrollY = 1400;
  browser.window.dispatch('scroll'); browser.flush();
  const before = browser.ids['floating-teddy'].style.transform;
  browser.viewport.height = 610;
  browser.viewport.dispatch('resize'); browser.flush();
  assert.notEqual(browser.ids['floating-teddy'].style.transform, before);
});

test('returning from another page refreshes the restored scroll position', () => {
  const browser = page(); browser.start();
  const before = browser.ids['floating-teddy'].style.transform;
  browser.window.scrollY = 2000;
  browser.window.dispatch('pageshow'); browser.flush();
  assert.notEqual(browser.ids['floating-teddy'].style.transform, before);
});

test('scrolling past foreground content hides the teddy and reveals it again', () => {
  const browser = page();
  let covering = true;
  browser.covers.push({ getBoundingClientRect: () => ({ left: 0, right: 390,
    top: covering ? 0 : -2000, bottom: covering ? 844 : -1000 }) });
  browser.start();
  browser.window.scrollY = 1400;
  browser.window.dispatch('scroll'); browser.flush();
  assert.equal(Number(browser.ids['floating-teddy'].style.opacity), 0);
  covering = false;
  browser.window.scrollY = 1450;
  browser.window.dispatch('scroll'); browser.flush();
  const opacity = Number(browser.ids['floating-teddy'].style.opacity);
  assert.ok(opacity > .2 && opacity < .6);
});
