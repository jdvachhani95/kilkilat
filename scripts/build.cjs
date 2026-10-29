const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
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
console.log(`Built ${files.length} public files in _site/.`);
