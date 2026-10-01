const fs = require('fs');

// ============ server.js ============
let srv = fs.readFileSync('server.js', 'utf8');

// Find "const postImagesMap = {" and its matching "};"
const marker = 'const postImagesMap = {';
const start = srv.indexOf(marker);
if (start === -1) { console.log('WARN: server.js postImagesMap not found (already replaced?)'); }
else {
    // Find the closing "};" at column 0
    const after = srv.indexOf('\n};', start);
    if (after === -1) { console.log('ERROR: server.js closing not found'); process.exit(1); }
    const end = after + 3; // include "\n};"
    
    const replacement = `const { images: postImagesMap } = require('./lib/svg-library');`;
    srv = srv.slice(0, start) + replacement + srv.slice(end);
    console.log('OK: server.js postImagesMap → library');
}
fs.writeFileSync('server.js', srv);

// ============ routes/post.js ============
let pst = fs.readFileSync('routes/post.js', 'utf8');

// 1. postImages
let m1 = pst.indexOf('const postImages = {');
if (m1 === -1) { console.log('WARN: postImages not found'); }
else {
    let after = pst.indexOf('\n};', m1);
    if (after === -1) { console.log('ERROR: postImages close not found'); process.exit(1); }
    pst = pst.slice(0, m1) + `const { images: postImages, labels: imageLabels } = require('../lib/svg-library');` + pst.slice(after + 3);
    console.log('OK: postImages + imageLabels replaced');
}

// 2. Remove the standalone imageLabels block if still present (since we merged into one line)
m1 = pst.indexOf('const imageLabels = {');
if (m1 !== -1) {
    let after = pst.indexOf('\n};', m1);
    if (after !== -1) {
        pst = pst.slice(0, m1) + pst.slice(after + 3);
        console.log('OK: standalone imageLabels removed');
    }
}

// 3. Fix module.exports
pst = pst.replace(
    `module.exports.postImages = postImages;`,
    `module.exports.postImages = postImages;\nmodule.exports.imageLabels = imageLabels;`
);
console.log('OK: module.exports updated');

fs.writeFileSync('routes/post.js', pst);

console.log('DONE');
