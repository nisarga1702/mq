const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// The issue is likely missing React. prefixes on hooks or a scope issue.
// Let's ensure all hooks use React. prefix and everything is properly scoped.

const a = h.indexOf('function Multiplayer');
const b = h.indexOf('/* ==================== LEADERBOARD', a);

if (a !== -1 && b !== -1) {
  let code = h.slice(a, b);
  
  // Fix missing React. prefixes
  code = code.replace(/\buseRef\(/g, 'React.useRef(');
  code = code.replace(/\buseState\(/g, 'React.useState(');
  code = code.replace(/\buseEffect\(/g, 'React.useEffect(');
  
  h = h.slice(0, a) + code + h.slice(b);
  fs.writeFileSync('index.html', h);
  console.log('✓ Fixed React hook prefixes in Multiplayer');
} else {
  console.log('ERROR: Multiplayer component not found');
}
