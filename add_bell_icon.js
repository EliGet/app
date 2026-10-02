const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

if (!src.includes('bell: `<svg')) {
    const m = src.match(/(\n\s*search: `<svg[^\n]*`,\n)/);
    if (!m) { console.log('ERROR: search icon not found'); process.exit(1); }
    const bellIcon = "    bell: `<svg viewBox=\"0 0 24 24\"><path d=\"M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z\"/></svg>`,\n";
    src = src.replace(m[0], m[0] + bellIcon);
    console.log('OK: bell icon added to server.js');
} else {
    console.log('SKIP: bell already present');
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('server.js', src);
console.log('DONE');
