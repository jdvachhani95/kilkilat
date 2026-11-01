const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
const envPath = path.join(root, '.env');
const actionsBuild = process.env.GITHUB_ACTIONS === 'true';
// Existing shell/Actions environment values take priority over the local file.
if (!actionsBuild && fs.existsSync(envPath)) process.loadEnvFile(envPath);
const endpoint = (process.env.RSVP_ENDPOINT || '').trim();
if (endpoint && !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint)) {
  throw new Error('RSVP_ENDPOINT must be a Google Apps Script web app URL ending in /exec.');
}
const sourceConfig = fs.readFileSync(path.join(root, 'js/site-config.js'), 'utf8');
const publicSettings = vm.runInNewContext(sourceConfig + '\nwindow.INVITATION_CONFIG', { window: {} });
const officialFormReady = /^https:\/\/(forms\.gle\/|docs\.google\.com\/forms\/)/.test(publicSettings.googleFormUrl);
if (actionsBuild && !endpoint && !officialFormReady) {
  throw new Error('RSVP_ENDPOINT is missing. Configure the Actions repository secret before publishing, or set an official Google Form URL. In Settings > Pages, select GitHub Actions as the source.');
}
const files = [
  'index.html', '.nojekyll', 'css/invitation.css', 'js/site-config.js',
  'js/invitation-core.js', 'js/invitation.js', 'img/invitation/heart.svg',
  'img/invitation/teddy.webp', 'img/invitation/florals.webp', 'img/magnolia-hall-parking-map-v1.webp',
  'img/invitation/memories/couple-6929.webp', 'img/invitation/memories/aruni-heart.webp',
  'img/invitation/memories/newspaper-6845.webp'
];
fs.rmSync(output, { recursive: true, force: true });
for (const file of files) {
  const destination = path.join(output, file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(root, file), destination);
}
if (endpoint) {
  const configPath = path.join(output, 'js/site-config.js');
  const source = fs.readFileSync(configPath, 'utf8');
  const placeholder = "rsvpEndpoint: ''";
  if (!source.includes(placeholder)) {
    throw new Error('Leave rsvpEndpoint empty in js/site-config.js when using RSVP_ENDPOINT.');
  }
  // The browser needs this public URL; the repo secret keeps it out of source history.
  fs.writeFileSync(configPath, source.replace(placeholder,
    () => 'rsvpEndpoint: ' + JSON.stringify(endpoint)));
}
console.log(`Built ${files.length} public files in _site/.`);
