const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// The line is: var AB_SEED = '\${safeSeed}';   (escaped, not evaluated)
// Should be:   var AB_SEED = '${safeSeed}';   (evaluated server-side)
const old = "var AB_SEED = '\\${safeSeed}';";
const neu = "var AB_SEED = '${safeSeed}';";

if (src.includes(old)) {
    src = src.split(old).join(neu);
    console.log('OK: AB_SEED escape fixed');
} else {
    console.log('WARN: pattern not found — checking alternative');
    // Try with double escaping
    const old2 = "var AB_SEED = '\\\\${safeSeed}';";
    if (src.includes(old2)) {
        src = src.split(old2).join(neu);
        console.log('OK: (alt) fixed');
    }
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('server.js', src);
console.log('DONE');
