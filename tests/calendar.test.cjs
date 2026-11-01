const test = require('node:test');
const assert = require('node:assert/strict');
const { page } = require('./helpers/invitation-page.cjs');

function rsvp(fetch) {
  const browser = page({
    config: { rsvpDeadline: '2099-11-15T23:59:59-05:00',
      rsvpEndpoint: 'https://script.google.com/macros/s/test-receiver/exec' }, fetch
  });
  browser.start();
  browser.ids['guest-name'].value = 'Test Family';
  browser.ids['guest-email'].value = 'family@example.com';
  return browser;
}

test('confirmed RSVP offers a calendar download with the event time, full address and directions', async () => {
  const browser = rsvp(async (_, options) => ({ ok: true,
    json: async () => ({ ok: true, requestId: options.body.get('requestId') }) }));
  assert.ok(browser.ids['rsvp-add-to-calendar'], 'confirmation needs its own calendar button');
  assert.equal(browser.ids['rsvp-success'].hidden, true);
  await browser.ids['rsvp-form'].dispatch('submit', { preventDefault() {} });
  assert.equal(browser.ids['rsvp-success'].hidden, false);
  await browser.ids['rsvp-add-to-calendar'].dispatch('click');
  assert.equal(browser.downloads.length, 1);
  const download = browser.downloads[0];
  assert.equal(download.filename, 'Aruni-and-Jaydeep-baby-shower.ics');
  assert.equal(download.blob.type, 'text/calendar;charset=utf-8');
  const calendar = await download.blob.text();
  assert.match(calendar, /DTSTART:20261129T150000Z\r\n/);
  assert.match(calendar, /SUMMARY:Aruni & Jaydeep — Baby shower & gender reveal\r\n/);
  assert.match(calendar, /LOCATION:Magnolia Hall\\, 115 Hunter Street West\\, Hamilton\\, Ontario\r\n/);
  assert.match(calendar, /City Hall Parking/);
  assert.match(calendar, /URL:https:\/\/maps\.app\.goo\.gl\/ggcyZocf3u9xvAgi6\r\n/);
  assert.doesNotMatch(calendar, /DTEND|Test Family|family@example\.com/);
  await browser.ids['add-to-calendar'].dispatch('click');
  const original = await browser.downloads[1].blob.text();
  assert.equal(original.match(/UID:.+/)[0], calendar.match(/UID:.+/)[0]);
  assert.equal(original.match(/DTSTART:.+/)[0], calendar.match(/DTSTART:.+/)[0]);
});

test('unconfirmed RSVP keeps the confirmation and its calendar option hidden', async () => {
  const browser = rsvp(async () => ({ ok: true,
    json: async () => ({ ok: true, requestId: 'unmatched-receipt' }) }));
  assert.ok(browser.ids['rsvp-add-to-calendar'], 'confirmation needs its own calendar button');
  await browser.ids['rsvp-form'].dispatch('submit', { preventDefault() {} });
  assert.equal(browser.ids['rsvp-success'].hidden, true);
  assert.equal(browser.downloads.length, 0);
});
