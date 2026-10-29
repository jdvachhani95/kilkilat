/* Run setup() once, then deploy as a web app: execute as you; access anyone.
 * See docs/SETUP.md. The Sheet stays private; this endpoint only accepts RSVPs.
 */
var RSVP_DEADLINE = '2026-11-15T23:59:59-05:00';

function setup() {
  var properties = PropertiesService.getScriptProperties();
  var id = properties.getProperty('RSVP_SHEET_ID');
  if (id) { console.log(SpreadsheetApp.openById(id).getUrl()); return; }
  var spreadsheet = SpreadsheetApp.create('Jaydeep & Aruni — Baby shower RSVPs');
  var sheet = spreadsheet.getSheets()[0];
  sheet.setName('RSVPs');
  sheet.appendRow(['Received at', 'Name', 'Email', 'Adults', 'Children', 'Total', 'Request ID']);
  sheet.setFrozenRows(1);
  sheet.getRange('B:C').setNumberFormat('@');
  sheet.getRange('G:G').setNumberFormat('@');
  properties.setProperty('RSVP_SHEET_ID', spreadsheet.getId());
  console.log('Private RSVP Sheet: ' + spreadsheet.getUrl());
}

function validateSubmission_(input) {
  input = input || {};
  var name = typeof input.name === 'string' ? input.name.trim().replace(/\s+/g, ' ') : '';
  var email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  var errors = {};
  if (!name || name.length > 100) errors.name = 'Please enter your name (up to 100 characters).';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address.';
  ['adults', 'children'].forEach(function (key) {
    var raw = String(input[key] == null ? '' : input[key]);
    var min = key === 'adults' ? 1 : 0;
    if (!/^\d+$/.test(raw) || Number(raw) < min || Number(raw) > 20) errors[key] = 'Please check the number of ' + key + '.';
  });
  if (!/^[a-zA-Z0-9_-]{16,100}$/.test(input.requestId || '')) errors.requestId = 'Please refresh the invitation and try again.';
  if (input.company) errors.company = 'We could not accept this response.';
  return { valid: Object.keys(errors).length === 0, errors: errors,
    value: { name: name, email: email, adults: Number(input.adults), children: Number(input.children), requestId: input.requestId } };
}

function sheetText_(value) {
  return /^[=+@\-\t\r\n]/.test(value) ? "'" + value : value;
}

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_({ ok: true, service: 'baby-shower-rsvp' });
}

function doPost(event) {
  var checked = validateSubmission_(event && event.parameter);
  if (!checked.valid) return json_({ ok: false, code: 'validation', errors: checked.errors });
  var data = checked.value;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return json_({ ok: false, code: 'busy' });
  try {
    var id = PropertiesService.getScriptProperties().getProperty('RSVP_SHEET_ID');
    if (!id) return json_({ ok: false, code: 'unavailable' });
    var sheet = SpreadsheetApp.openById(id).getSheetByName('RSVPs');
    if (!sheet || sheet.getRange(1, 1).getValue() !== 'Received at') return json_({ ok: false, code: 'unavailable' });
    var lastRow = sheet.getLastRow();
    // A lost network response can be safely retried without appending twice.
    if (lastRow > 1 && sheet.getRange(2, 7, lastRow - 1, 1)
      .createTextFinder(data.requestId).matchEntireCell(true).findNext()) {
      return json_({ ok: true, requestId: data.requestId });
    }
    if (Date.now() > Date.parse(RSVP_DEADLINE)) return json_({ ok: false, code: 'closed' });
    var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, data.email)
      .map(function (b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
    var cache = CacheService.getScriptCache();
    var key = 'rsvp:' + hash;
    var attempts = Number(cache.get(key) || 0);
    if (attempts >= 5) return json_({ ok: false, code: 'rate_limit' });
    sheet.appendRow([new Date(), sheetText_(data.name), sheetText_(data.email),
      data.adults, data.children, data.adults + data.children, data.requestId]);
    SpreadsheetApp.flush();
    cache.put(key, String(attempts + 1), 900);
    return json_({ ok: true, requestId: data.requestId });
  } catch (error) {
    console.error('RSVP storage failed; check the Sheet configuration in the script editor.');
    return json_({ ok: false, code: 'unavailable' });
  } finally {
    lock.releaseLock();
  }
}
