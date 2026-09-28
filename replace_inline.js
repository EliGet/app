const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');

const startMarker = "<script>\n            window.addEventListener('error', function(e) {";
const endMarker = "        </script>\n        </body></html>";
const start = src.indexOf(startMarker);
const end = src.indexOf(endMarker);
if (start === -1) { console.log('ERROR: script start not found'); process.exit(1); }
if (end === -1) { console.log('ERROR: script end not found'); process.exit(1); }

const newScript = `<script src="/user-search.js"></script>\n`;
src = src.slice(0, start) + newScript + src.slice(end + '        </script>\n'.length);

fs.writeFileSync('routes/chat.js', src);
console.log('OK: inline script replaced with external reference');
