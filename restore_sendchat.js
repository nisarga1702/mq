const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

const a = h.indexOf('function Multiplayer');
const b = h.indexOf('/* ==================== LEADERBOARD', a);

if (a !== -1 && b !== -1) {
  let code = h.slice(a, b);
  
  // Re-insert sendChat if it's missing
  if (!code.includes('function sendChat')) {
    const insertPoint = code.indexOf('if (view === \'lobby\')');
    const sendChatFunc = `
  function sendChat(e) {
    e.preventDefault(); if(!chatText.trim()) return;
    const msg = { from: user.name, text: chatText, ts: new Date().toLocaleTimeString() };
    if(socketRef.current) socketRef.current.emit('send_message', { roomId, text: chatText });
    setChat(p => [...p, msg]); setChatText('');
  }
`;
    code = code.slice(0, insertPoint) + sendChatFunc + code.slice(insertPoint);
    console.log('✓ Re-inserted missing sendChat function');
  }

  h = h.slice(0, a) + code + h.slice(b);
  fs.writeFileSync('index.html', h);
}
