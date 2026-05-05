const fs = require('fs');
const path = require('path');
const indexPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// ── 1. Replace the old MEDICAL_CURRICULUM + Learning component ───────────────
const oldLearningStart = '/* ==================== MEDICAL CURRICULUM DATA ==================== */';
const oldLearningEnd   = '/* ==================== NOTIFICATION COMPONENT ==================== */';

const si = html.indexOf(oldLearningStart);
const ei = html.indexOf(oldLearningEnd);
if (si !== -1 && ei !== -1) {
  html = html.slice(0, si) + ML_FRONTEND_CODE + html.slice(ei);
}

// ── 2. Replace Quiz component with ML-powered version ────────────────────────
const oldQuizStart = '/* ==================== QUIZ ==================== */';
const oldQuizEnd   = '/* ==================== MULTIPLAYER ==================== */';
const qi = html.indexOf(oldQuizStart);
const qe = html.indexOf(oldQuizEnd);
if (qi !== -1 && qe !== -1) {
  html = html.slice(0, qi) + ML_QUIZ_CODE + html.slice(qe);
}

fs.writeFileSync(indexPath, html);
console.log('Patched Quiz + Learning with ML integration!');

const ML_QUIZ_CODE = ``;
const ML_FRONTEND_CODE = ``;
