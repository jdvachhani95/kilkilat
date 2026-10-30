const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
const envPath = path.join(root, '.env');
// Existing shell/Actions environment values take priority over the local file.
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);
const endpoint = (process.env.RSVP_ENDPOINT || '').trim();
if (endpoint && !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint)) {
  throw new Error('RSVP_ENDPOINT must be a Google Apps Script web app URL ending in /exec.');
}
const files = [
  'index.html', '.nojekyll', 'css/invitation.css', 'js/site-config.js',
  'js/invitation-core.js', 'js/invitation.js', 'img/invitation/heart.svg',
  'img/invitation/teddy.webp', 'img/invitation/florals.webp', 'img/magnolia-hall-parking-map-v1.webp'
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
