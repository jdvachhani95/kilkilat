const test = require('node:test');
const assert = require('node:assert/strict');
const { page } = require('./helpers/invitation-page.cjs');
const endpoint = 'https://script.google.com/macros/s/test-receiver/exec';
const open = { rsvpDeadline: '2099-11-15T23:59:59-05:00' };

function guest(browser) {
  browser.ids['guest-name'].value = 'Test Family';
  browser.ids['guest-email'].value = 'family@example.com';
}

test('missing receiver offers WhatsApp contact instead of promising a future RSVP form', () => {
  const browser = page({ config: open }); browser.start();
  assert.equal(browser.ids['submit-rsvp'].disabled, true);
  assert.equal(browser.ids['form-availability'].hidden, false);
  assert.equal(browser.ids['form-availability'].textContent, 'Having trouble sending your RSVP? Message Aruni or Jaydeep on WhatsApp and we’ll help you out.');
  assert.doesNotMatch(browser.ids['form-availability'].textContent, /ready soon|check back|November 15/);
});

test('working form hides the WhatsApp fallback', () => {
  const browser = page({ config: { ...open, rsvpEndpoint: endpoint } }); browser.start();
  assert.equal(browser.ids['submit-rsvp'].disabled, false);
  assert.equal(browser.ids['form-availability'].hidden, true);
  assert.doesNotMatch(browser.ids['form-availability'].textContent, /WhatsApp/);
});

test('a failed submission keeps the missing-URL fallback hidden without showing a saved receipt', async () => {
  const browser = page({ config: { ...open, rsvpEndpoint: endpoint },
    fetch: async () => { throw new Error('simulated connection failure'); } });
  browser.start(); guest(browser);
  await browser.ids['rsvp-form'].dispatch('submit', { preventDefault() {} });
  assert.doesNotMatch(browser.ids['form-status'].textContent, /WhatsApp/);
  assert.equal(browser.ids['form-availability'].hidden, true);
  assert.equal(browser.ids['rsvp-success'].hidden, true);
  assert.equal(browser.ids['submit-rsvp'].disabled, false);
});

test('a confirmed server receipt hides the WhatsApp fallback', async () => {
  const browser = page({ config: { ...open, rsvpEndpoint: endpoint },
    fetch: async (_, options) => ({ ok: true, json: async () => ({ ok: true, requestId: options.body.get('requestId') }) }) });
  browser.start(); guest(browser);
  await browser.ids['rsvp-form'].dispatch('submit', { preventDefault() {} });
  assert.equal(browser.ids['rsvp-success'].hidden, false);
  assert.equal(browser.ids['form-availability'].hidden, true);
});

test('a server rejection keeps the missing-URL fallback hidden without confirming the RSVP', async () => {
  const browser = page({ config: { ...open, rsvpEndpoint: endpoint },
    fetch: async () => ({ ok: true, json: async () => ({ ok: false, code: 'unavailable' }) }) });
  browser.start(); guest(browser);
  await browser.ids['rsvp-form'].dispatch('submit', { preventDefault() {} });
  assert.equal(browser.ids['rsvp-success'].hidden, true);
  assert.equal(browser.ids['form-availability'].hidden, true);
  assert.doesNotMatch(browser.ids['form-availability'].textContent, /WhatsApp/);
});

test('a closed RSVP date shows deadline guidance without the missing-URL fallback', () => {
  const browser = page({ config: { rsvpDeadline: '2000-11-15T23:59:59-05:00', rsvpEndpoint: endpoint } }); browser.start();
  assert.equal(browser.ids['submit-rsvp'].disabled, true);
  assert.match(browser.ids['form-availability'].textContent, /date has passed/);
  assert.doesNotMatch(browser.ids['form-availability'].textContent, /WhatsApp/);
});

test('an official Google Form alternative hides the WhatsApp fallback', () => {
  const browser = page({ config: { ...open, googleFormUrl: 'https://forms.gle/test-rsvp-form' } }); browser.start();
  assert.equal(browser.ids['google-form-link'].hidden, false);
  assert.equal(browser.ids['rsvp-form'].hidden, true);
  assert.equal(browser.ids['form-availability'].hidden, true);
  assert.doesNotMatch(browser.ids['form-availability'].textContent, /WhatsApp/);
});
