const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// THREE.CapsuleGeometry might not be available in all versions or environments.
// Let's replace it with THREE.CylinderGeometry for better compatibility.

const oldCap1 = 'new THREE.CapsuleGeometry(0.35, 1.0, 4, 8)';
const newCap1 = 'new THREE.CylinderGeometry(0.35, 0.35, 1.3, 16)'; // Torso fallback

const oldCap2 = 'new THREE.CapsuleGeometry(0.18, 0.5, 4, 8)';
const newCap2 = 'new THREE.CylinderGeometry(0.18, 0.18, 0.7, 16)'; // Avatar body fallback

if (h.includes(oldCap1)) {
  h = h.replace(new RegExp(oldCap1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newCap1);
  console.log('✓ Replaced torso CapsuleGeometry');
}

if (h.includes(oldCap2)) {
  h = h.replace(new RegExp(oldCap2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newCap2);
  console.log('✓ Replaced avatar CapsuleGeometry');
}

fs.writeFileSync('index.html', h);
console.log('Done!');
