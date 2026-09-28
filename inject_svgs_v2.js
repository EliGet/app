const fs = require('fs');
const { images, labels } = require('./new-svgs.js');

let src = fs.readFileSync('routes/post.js', 'utf8');
const before = src;

// ===== postImages =====
const piMarker = 'const postImages = {';
const piStart = src.indexOf(piMarker);
if (piStart === -1) { console.error('ERROR: postImages not found'); process.exit(1); }
const piEnd = src.indexOf('\n};', piStart);
if (piEnd === -1) { console.error('ERROR: postImages end not found'); process.exit(1); }

const piBodyStart = piStart + piMarker.length;
const existing = src.slice(piBodyStart, piEnd);

if (existing.includes('desert:')) {
    console.log('WARN: postImages already injected');
} else {
    let extra = '';
    for (const k of Object.keys(images)) {
        extra += ',\n    ' + k + ': `' + images[k] + '`';
    }
    src = src.slice(0, piBodyStart) + existing + extra + src.slice(piEnd);
    console.log('OK: postImages injected');
}

// ===== imageLabels =====
const ilMarker = 'const imageLabels = {';
const ilStart = src.indexOf(ilMarker);
if (ilStart === -1) { console.error('ERROR: imageLabels not found'); process.exit(1); }
const ilEnd = src.indexOf('\n};', ilStart);
if (ilEnd === -1) { console.error('ERROR: imageLabels end not found'); process.exit(1); }

const ilBodyStart = ilStart + ilMarker.length;
const existingIl = src.slice(ilBodyStart, ilEnd);

if (existingIl.includes('desert:')) {
    console.log('WARN: imageLabels already injected');
} else {
    let extraIl = '';
    for (const k of Object.keys(labels)) {
        extraIl += ",\n    " + k + ": '" + labels[k] + "'";
    }
    src = src.slice(0, ilBodyStart) + existingIl + extraIl + src.slice(ilEnd);
    console.log('OK: imageLabels injected');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/post.js', src);
console.log('DONE');
