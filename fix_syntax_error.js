const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// The issue is that \n in the JavaScript strings was written as literal newlines.
// We need to escape them so they stay as \n in the JS source.

const a = h.indexOf('function Learning');
const b = h.indexOf('/* ==================== NOTIFICATION', a);

if (a !== -1 && b !== -1) {
  let learningBlock = h.slice(a, b);
  
  // Fix the multiline strings in mnemonic fields
  // We look for patterns like mnemonic:'... \n ...' and change to mnemonic:'... \\n ...'
  // Or more simply, we use backticks for the mnemonic field if it contains a newline.
  
  learningBlock = learningBlock.replace(/mnemonic:'([^']*)'/g, (match, p1) => {
    // If it contains a literal newline, use backticks or escape it
    if (p1.includes('\n')) {
      return "mnemonic:`" + p1 + "`";
    }
    return match;
  });

  h = h.slice(0, a) + learningBlock + h.slice(b);
  fs.writeFileSync('index.html', h);
  console.log('✓ Fixed Learning component multiline strings');
} else {
  console.log('Error: Could not find Learning component for fixing');
}
