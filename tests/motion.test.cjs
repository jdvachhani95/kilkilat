const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../js/invitation-core.js');

// Run the real page controller against browser event surfaces. Layout and
// rendering are covered separately by the Chromium/WebKit device checks.
function page({ reduced = false, legacy = false } = {}) {
  const root = path.resolve(__dirname, '..');
  const frames = [];
  const events = () => {
    const listeners = new Map();
    return {
      addEventListener(name, fn) {
        if (!listeners.has(name)) listeners.set(name, []);
        listeners.get(name).push(fn);
      },
      dispatch(name) { (listeners.get(name) || []).forEach((fn) => fn()); }
    };
  };
  function element() {
    const classes = new Set();
    const attrs = new Map();
    return {
      ...events(), style: {}, value: '', hidden: false, textContent: '',
      classList: {
        add: (name) => classes.add(name),
        remove: (name) => classes.delete(name),
        contains: (name) => classes.has(name),
        toggle(name, on) { if (on) classes.add(name); else classes.delete(name); }
      },
      setAttribute: (name, value) => attrs.set(name, value),
      getAttribute: (name) => attrs.get(name),
      removeAttribute: (name) => attrs.delete(name),
      querySelectorAll: () => [],
      getContext: () => null
    };
  }
  const ids = Object.fromEntries([...fs.readFileSync(path.join(root, 'index.html'), 'utf8')
    .matchAll(/\bid="([^"]+)"/g)].map((match) => [match[1], element()]));
  ids.adults.value = '1'; ids.children.value = '0';
  ids['rsvp-success'].hidden = true;
  ids.welcome.offsetHeight = 1100;
  const preference = { ...events(), matches: reduced };
  if (legacy) {
    const listen = preference.addEventListener;
    preference.addListener = (fn) => listen('legacy-change', fn);
    preference.addEventListener = undefined;
  }
  const viewport = { ...events(), width: 390, height: 760, offsetTop: 0, offsetLeft: 0, scale: 1 };
  const window = { ...events(), innerWidth: 390, innerHeight: 844, scrollY: 0,
    visualViewport: viewport, InvitationCore: core, matchMedia: () => preference };
  const art = { getBoundingClientRect: () => ({ top: 690 - window.scrollY }) };
  const covers = [];
  const document = { ...events(), body: element(), documentElement: { ...element(), scrollHeight: 6400 },
    getElementById: (id) => ids[id], querySelectorAll: (selector) => selector === '[data-teddy-cover]' ? covers : [],
    querySelector: (selector) => selector === '.hero-art' ? art : element() };
  const context = vm.createContext({ window, document,
    localStorage: { getItem: () => null, setItem() {} },
    requestAnimationFrame: (fn) => frames.push(fn), setInterval() {}, setTimeout() {} });
  vm.runInContext(fs.readFileSync(path.join(root, 'js/site-config.js'), 'utf8'), context);
  const flush = () => { while (frames.length) frames.shift()(); };
  const start = () => { vm.runInContext(fs.readFileSync(path.join(root, 'js/invitation.js'), 'utf8'), context); flush(); };
  return { start, flush, ids, window, viewport, preference, document, covers };
}

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
