const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// Find and remove the stray API_BASE line that sits outside <script> tags
const strayPattern = /\r?\nconst API_BASE = "https:\/\/medlearn-api-wjyh\.onrender\.com";\r?\n/;
const match = h.match(strayPattern);
if (match) {
  h = h.replace(strayPattern, '\n');
  console.log('✓ Removed stray API_BASE line');
} else {
  console.log('Not found with regex. Trying manual slice...');
  const idx = h.indexOf('const API_BASE');
  if (idx > -1) {
    // Find start of line and end of line
    const lineStart = h.lastIndexOf('\n', idx);
    const lineEnd = h.indexOf('\n', idx);
    console.log('Manual: removing chars', lineStart, 'to', lineEnd);
    h = h.slice(0, lineStart) + h.slice(lineEnd);
    console.log('✓ Removed via manual slice');
  }
}

// Also ensure the Three.js CDN scripts are inside <head>, not duplicated
const hasTHREE = h.includes('three.min.js');
console.log('Three.js in file:', hasTHREE);

fs.writeFileSync('index.html', h);
console.log('Saved. Verifying...');

// Verify
const h2 = fs.readFileSync('index.html', 'utf8');
const stillBroken = h2.indexOf('const API_BASE') !== -1 &&
  h2.slice(Math.max(0, h2.indexOf('const API_BASE') - 20), h2.indexOf('const API_BASE')).indexOf('<script') === -1;
console.log('Still broken:', stillBroken);
