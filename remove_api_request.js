const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

const startMarker = "// ===== SEND FRIEND REQUEST (AJAX) =====";
const endMarker = "router.get('/notifications', async (req, res) => {";

const s = src.indexOf(startMarker);
const e = src.indexOf(endMarker);
if (s === -1) { console.log('ERROR: start marker not found'); process.exit(1); }
if (e === -1) { console.log('ERROR: end marker not found'); process.exit(1); }
if (e <= s) { console.log('ERROR: end before start'); process.exit(1); }

src = src.slice(0, s) + src.slice(e);
console.log('OK: /api/request block removed (' + (e - s) + ' chars)');

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/chat.js', src);
console.log('DONE');
