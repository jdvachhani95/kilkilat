const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const corePath = path.join(__dirname, '../js/invitation-core.js');
const core = fs.existsSync(corePath) ? require(corePath) : {};
const good = { name: 'Aruni & Jaydeep', email: 'family@example.com', adults: '2', children: '1' };

test('countdown targets Hamilton time and stops at the event without negative values', () => {
  assert.equal(typeof core.countdown, 'function');
  const target = '2026-11-29T10:00:00-05:00';
  assert.deepEqual(core.countdown(target, Date.parse('2026-11-28T14:59:59Z')),
    { days: 1, hours: 0, minutes: 0, seconds: 1, started: false });
  assert.deepEqual(core.countdown(target, Date.parse('2026-11-29T15:00:01Z')),
    { days: 0, hours: 0, minutes: 0, seconds: 0, started: true });
});

test('the RSVP deadline is inclusive of November 15 in Hamilton', () => {
  assert.equal(typeof core.rsvpIsOpen, 'function');
  const deadline = '2026-11-15T23:59:59-05:00';
  assert.equal(core.rsvpIsOpen(deadline, Date.parse('2026-11-16T04:59:59Z')), true);
  assert.equal(core.rsvpIsOpen(deadline, Date.parse('2026-11-16T05:00:00Z')), false);
});

test('an unchanged in-flight RSVP can recover its receipt after the deadline, but new details cannot', () => {
  assert.equal(typeof core.canSubmitRsvp, 'function');
  const deadline = '2026-11-15T23:59:59-05:00';
  const late = Date.parse('2026-11-16T05:00:20Z');
  const attempt = { requestId: 'a'.repeat(36), fingerprint: JSON.stringify(core.validateRsvp(good).value) };
  assert.equal(core.canSubmitRsvp(deadline, good, attempt, late), true);
  assert.equal(core.canSubmitRsvp(deadline, { ...good, adults: '3' }, attempt, late), false);
  assert.equal(core.canSubmitRsvp(deadline, good, null, late), false);
});

test('RSVP keeps adult and child counts separate and normalizes name and email', () => {
  assert.equal(typeof core.validateRsvp, 'function');
  const result = core.validateRsvp({ ...good, name: '  Aruni  ', email: ' FAMILY@example.com ' });
  assert.equal(result.valid, true);
  assert.deepEqual(result.value, { name: 'Aruni', email: 'family@example.com', adults: 2, children: 1 });
});

test('RSVP rejects invalid email, missing name, fractional, negative and excessive counts', () => {
  assert.equal(typeof core.validateRsvp, 'function');
  for (const change of [{ email: 'bad' }, { name: '' }, { adults: '0' }, { adults: '1.5' },
    { adults: '1e2' }, { children: '-1' }, { children: '' }, { children: '99' }]) {
    assert.equal(core.validateRsvp({ ...good, ...change }).valid, false, JSON.stringify(change));
  }
});

test('month-only reveal displays February 2027 without a day or timezone shift', () => {
  assert.equal(typeof core.formatMonth, 'function');
  assert.equal(core.formatMonth('2027-02'), 'February 2027');
});

test('teddy stays at the phone edge after leaving the hero and has finite poses', () => {
  assert.equal(typeof core.teddyPose, 'function');
  for (const width of [320, 390, 768, 1440]) {
    for (const progress of [0, 0.2, 0.5, 1]) {
      const pose = core.teddyPose(progress, { width, height: 844, heroProgress: 1 });
      assert.ok(Number.isFinite(pose.x) && Number.isFinite(pose.y) && Number.isFinite(pose.rotation));
      assert.ok(pose.y >= 0 && pose.y < 844);
      if (width < 600) assert.ok(pose.x >= width - 80, 'phone content area stays clear');
    }
  }
});

test('the phone hero places the teddy below the invitation text', () => {
  assert.ok(core.teddyPose(0, { width: 390, height: 844, heroProgress: 0 }).y >= 490);
  assert.ok(core.teddyPose(0, { width: 320, height: 667, heroProgress: 0 }).y >= 490);
  assert.equal(core.teddyPose(0, { width: 390, height: 844, heroProgress: 0, heroStartY: 640 }).y, 640);
});

function serverContext() {
  const scriptPath = path.join(__dirname, '../apps-script/Code.gs');
  const ctx = vm.createContext({ console });
  if (fs.existsSync(scriptPath)) vm.runInContext(fs.readFileSync(scriptPath, 'utf8'), ctx);
  return ctx;
}

test('Apps Script independently rejects invalid submissions and honeypots', () => {
  const server = serverContext();
  assert.equal(typeof server.validateSubmission_, 'function');
  assert.equal(server.validateSubmission_({ ...good, requestId: 'a'.repeat(36) }).valid, true);
  for (const change of [{ children: '-1' }, { email: 'bad' }, { name: '' }, { company: 'spam' }, { requestId: '' }]) {
    assert.equal(server.validateSubmission_({ ...good, requestId: 'a'.repeat(36), ...change }).valid, false);
  }
});

test('Apps Script treats formula-like names as text before writing to Sheets', () => {
  const server = serverContext();
  assert.equal(typeof server.sheetText_, 'function');
  assert.equal(server.sheetText_('=IMPORTXML("x")'), '\'=IMPORTXML("x")');
  assert.equal(server.sheetText_('+cmd'), '\'+cmd');
  assert.equal(server.sheetText_('Jaydeep & Aruni'), 'Jaydeep & Aruni');
});

function receiptServer({ now = '2026-10-27T16:00:00Z', storageFailure = false } = {}) {
  const server = serverContext();
  const rows = [['Received at', 'Name', 'Email', 'Adults', 'Children', 'Total', 'Request ID']];
  const cache = new Map();
  let releases = 0;
  server.Date = class extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return Date.parse(now); } };
  server.ContentService = { MimeType: { JSON: 'json' }, createTextOutput: (text) => ({ text, setMimeType() { return this; } }) };
  server.LockService = { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => releases++ }) };
  server.PropertiesService = { getScriptProperties: () => ({ getProperty: () => 'test-sheet' }) };
  const sheet = {
    getLastRow: () => rows.length,
    getRange: (row, column) => ({ getValue: () => rows[row - 1][column - 1], createTextFinder: (id) => ({
      matchEntireCell() { return this; }, findNext: () => rows.slice(1).find((value) => value[6] === id) || null
    }) }),
    appendRow: (row) => { if (storageFailure) throw new Error('storage error'); rows.push(row); }
  };
  server.SpreadsheetApp = { openById: () => ({ getSheetByName: () => sheet }), flush: () => {} };
  server.CacheService = { getScriptCache: () => ({ get: (key) => cache.get(key), put: (key, value) => cache.set(key, value) }) };
  server.Utilities = { DigestAlgorithm: { SHA_256: 'sha256' }, computeDigest: (_, text) => [...crypto.createHash('sha256').update(text).digest()] };
  server.console = { error() {} };
  return { server, rows, releases: () => releases };
}

test('Apps Script stores separate counts and returns the same receipt on a network retry', () => {
  const { server, rows, releases } = receiptServer();
  const event = { parameter: { ...good, requestId: 'a'.repeat(36) } };
  const first = JSON.parse(server.doPost(event).text);
  server.Date.now = () => Date.parse('2026-11-16T05:00:20Z');
  const retry = JSON.parse(server.doPost(event).text);
  assert.equal(first.ok, true);
  assert.deepEqual(first, retry);
  assert.equal(rows.length, 2, 'a retry must not append another row');
  assert.equal(rows[1][3], 2);
  assert.equal(rows[1][4], 1);
  assert.equal(rows[1][5], 3);
  assert.equal(releases(), 2);
});

test('Apps Script rejects late responses and keeps stored guest data out of GET responses', () => {
  const { server, rows } = receiptServer({ now: '2026-11-16T05:00:00Z' });
  const response = JSON.parse(server.doPost({ parameter: { ...good, requestId: 'b'.repeat(36) } }).text);
  assert.equal(response.code, 'closed');
  assert.equal(rows.length, 1);
  assert.deepEqual(JSON.parse(server.doGet().text), { ok: true, service: 'baby-shower-rsvp' });
});

test('Apps Script releases its lock and never returns a saved receipt after a storage failure', () => {
  const { server, rows, releases } = receiptServer({ storageFailure: true });
  const response = JSON.parse(server.doPost({ parameter: { ...good, requestId: 'c'.repeat(36) } }).text);
  assert.equal(response.ok, false);
  assert.equal(response.code, 'unavailable');
  assert.equal(rows.length, 1);
  assert.equal(releases(), 1);
});
