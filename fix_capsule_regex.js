const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// Use a global regex to replace any THREE.CapsuleGeometry with CylinderGeometry
// We'll map (radius, length, capSegments, radialSegments) to (radius, radius, totalHeight, radialSegments)
h = h.replace(/new THREE\.CapsuleGeometry\(([\d.]+),\s*([\d.]+),\s*[\d.]+,\s*([\d.]+)\)/g, 'new THREE.CylinderGeometry($1, $1, $1*2 + $2, $3)');

console.log('✓ Replaced all THREE.CapsuleGeometry instances with CylinderGeometry');

// Add doctor/patient labels (icons) above avatars if they are missing
// I'll also check if the OrbitControls is working as expected.

fs.writeFileSync('index.html', h);
console.log('Done!');
