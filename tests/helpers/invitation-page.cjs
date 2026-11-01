const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../../js/invitation-core.js');

// Run the real page controller against browser event surfaces. Layout and
// rendering are covered separately by the Chromium/WebKit device checks.
function page({ reduced = false, legacy = false, config = {}, fetch: fetchResponse } = {}) {
  const root = path.resolve(__dirname, '../..');
  const frames = [];
  const events = () => {
    const listeners = new Map();
    return {
      addEventListener(name, fn) {
        if (!listeners.has(name)) listeners.set(name, []);
        listeners.get(name).push(fn);
      },
      dispatch(name, event) { return Promise.all((listeners.get(name) || []).map((fn) => fn(event))); }
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
      querySelector: () => element(),
      focus() {},
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
    requestAnimationFrame: (fn) => frames.push(fn), setInterval() {}, setTimeout() {}, clearTimeout() {},
    URLSearchParams, AbortController, fetch: fetchResponse,
    FormData: class {
      *[Symbol.iterator]() {
        for (const [name, id] of Object.entries({ name: 'guest-name', email: 'guest-email', adults: 'adults', children: 'children', company: 'company' })) {
          yield [name, ids[id].value];
        }
      }
    } });
  vm.runInContext(fs.readFileSync(path.join(root, 'js/site-config.js'), 'utf8'), context);
  window.INVITATION_CONFIG = { ...window.INVITATION_CONFIG, ...config };
  const flush = () => { while (frames.length) frames.shift()(); };
  const start = () => { vm.runInContext(fs.readFileSync(path.join(root, 'js/invitation.js'), 'utf8'), context); flush(); };
  return { start, flush, ids, window, viewport, preference, document, covers };
}

module.exports = { page };
