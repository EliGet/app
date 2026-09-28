const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');

const oldLogo = `                    <img src="/favicon.svg" alt="EliGet" class="landing-logo">\n`;
if (!src.includes(oldLogo)) { console.log('ERROR: logo line not found'); process.exit(1); }
src = src.replace(oldLogo, '');
fs.writeFileSync('server.js', src);
console.log('OK: logo removed');
