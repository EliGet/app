const fs = require('fs');
const { images, labels } = require('./new-svgs.js');

let src = fs.readFileSync('routes/post.js', 'utf8');
const before = src;

// ===== postImages object =====
const piStart = src.indexOf('const postImages = {');
if (piStart === -1) { console.error('ERROR: postImages not found'); process.exit(1); }
const piEnd = src.indexOf('\n};', piStart);
if (piEnd === -1) { console.error('ERROR: postImages end not found'); process.exit(1); }

// Check if already injected
if (src.slice(piStart, piEnd).includes('desert:')) {
    console.log('WARN: SVGs already injected - skipping');
} else {
    let piInsert = '';
    for (const k of Object.keys(images)) {
        piInsert += '    ' + k + ': `' + images[k] + '`,\n';
    }
    src = src.slice(0, piEnd + 1) + piInsert + src.slice(piEnd + 1);
    console.log('OK: postImages added');
}

// ===== imageLabels object (recompute offsets) =====
const ilStart = src.indexOf('const imageLabels = {');
if (ilStart === -1) { console.error('ERROR: imageLabels not found'); process.exit(1); }
const ilEnd = src.indexOf('\n};', ilStart);
if (ilEnd === -1) { console.error('ERROR: imageLabels end not found'); process.exit(1); }

if (src.slice(ilStart, ilEnd).includes('desert:')) {
    console.log('WARN: labels already injected - skipping');
} else {
    let ilInsert = '';
    for (const k of Object.keys(labels)) {
        ilInsert += "    " + k + ": '" + labels[k] + "',\n";
    }
    src = src.slice(0, ilEnd + 1) + ilInsert + src.slice(ilEnd + 1);
    console.log('OK: imageLabels added');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/post.js', src);
console.log('DONE');
