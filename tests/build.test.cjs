const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const endpoint = 'https://script.google.com/macros/s/test-build-receiver/exec';

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kilkilat-build-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  // Minimal public assets let these tests exercise configuration without using
  // personal artwork or reading the real local .env file.
  const files = ['index.html', '.nojekyll', 'css/invitation.css', 'js/site-config.js',
    'js/invitation-core.js', 'js/invitation.js', 'img/invitation/heart.svg',
    'img/invitation/teddy.webp', 'img/invitation/florals.webp', 'img/magnolia-hall-parking-map-v1.webp',
    'img/invitation/memories/couple-6929.webp', 'img/invitation/memories/aruni-heart.webp',
    'img/invitation/memories/newspaper-6845.webp', 'scripts/build.cjs'];
  for (const file of files) {
    const destination = path.join(directory, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, ['js/site-config.js', 'scripts/build.cjs'].includes(file)
      ? fs.readFileSync(path.join(root, file)) : 'test asset');
  }
  return {
    directory,
    run(env = {}) {
      return spawnSync(process.execPath, ['scripts/build.cjs'], { cwd: directory, encoding: 'utf8',
        env: { ...process.env, GITHUB_ACTIONS: '', RSVP_ENDPOINT: '', ...env } });
    },
    config() {
      return vm.runInNewContext(fs.readFileSync(path.join(directory, '_site/js/site-config.js'), 'utf8') + '\nwindow.INVITATION_CONFIG', { window: {} });
    }
  };
}

test('Actions refuses to publish without its receiver secret, even if a local .env exists', (t) => {
  const build = fixture(t);
  fs.writeFileSync(path.join(build.directory, '.env'), 'RSVP_ENDPOINT=' + endpoint);
  const result = build.run({ GITHUB_ACTIONS: 'true' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /RSVP_ENDPOINT/);
  assert.ok(!fs.existsSync(path.join(build.directory, '_site')));
});

test('Actions inserts the receiver into the published config without changing the source', (t) => {
  const build = fixture(t);
  const result = build.run({ GITHUB_ACTIONS: 'true', RSVP_ENDPOINT: endpoint });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(build.config().rsvpEndpoint, endpoint);
  assert.match(fs.readFileSync(path.join(build.directory, 'js/site-config.js'), 'utf8'), /rsvpEndpoint: ''/);
  assert.doesNotMatch(result.stdout + result.stderr, /test-build-receiver/);
});

test('a disconnected local preview can still build with no receiver', (t) => {
  const build = fixture(t);
  const result = build.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(build.config().rsvpEndpoint, '');
});

test('Actions permits a configured official Google Form instead of Apps Script', (t) => {
  const build = fixture(t);
  const file = path.join(build.directory, 'js/site-config.js');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace("googleFormUrl: ''", "googleFormUrl: 'https://forms.gle/test-rsvp-form'"));
  const result = build.run({ GITHUB_ACTIONS: 'true' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(build.config().googleFormUrl, 'https://forms.gle/test-rsvp-form');
});
