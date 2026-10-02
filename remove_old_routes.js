const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

// Remove /api/request block
const apiStart = "// ===== SEND FRIEND REQUEST (AJAX) =====";
const apiEnd = "// ===== NOTIFICATIONS =====";
const as1 = src.indexOf(apiStart);
const ae1 = src.indexOf(apiEnd);
if (as1 !== -1 && ae1 !== -1 && as1 < ae1) {
    src = src.slice(0, as1) + src.slice(ae1);
    console.log('OK: /api/request removed');
} else {
    console.log('WARN: /api/request block not found');
}

// Remove ACCEPT + REJECT block
const accStart = "// ===== ACCEPT REQUEST =====";
const accEnd = "// ===== CHAT ROOM =====";
const as2 = src.indexOf(accStart);
let ae2 = src.indexOf(accEnd);
if (ae2 === -1) {
    // fallback: search for "router.get('/:withUser'" or "// ===== 404"
    ae2 = src.indexOf("router.get('/:withUser'");
    if (ae2 !== -1) {
        // walk back to find the comment marker
        const commentIdx = src.lastIndexOf('// ===== ', ae2 - 1);
        if (commentIdx !== -1) ae2 = commentIdx;
    }
}
if (as2 !== -1 && ae2 !== -1 && as2 < ae2) {
    src = src.slice(0, as2) + src.slice(ae2);
    console.log('OK: accept/reject removed');
} else {
    console.log('WARN: accept/reject block not found (as2=' + as2 + ', ae2=' + ae2 + ')');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/chat.js', src);
console.log('DONE');
