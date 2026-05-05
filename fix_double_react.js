const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// Fix the duplicated React. prefix caused by aggressive regex replacement
h = h.replace(/React\.React\./g, 'React.');

fs.writeFileSync('index.html', h);
console.log('✓ Fixed duplicated React. prefix');
