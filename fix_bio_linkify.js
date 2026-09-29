const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// 1. require update
src = src.replace(
    "const { linkify } = require('./lib/linkify');",
    "const { linkify, linkifySimple } = require('./lib/linkify');"
);

// 2. Bio lines — both own + other profile
const oldBio = 'bioHtml = `<p class="pp-bio">${linkify(user.bio)}</p>`;';
const newBio = 'bioHtml = `<p class="pp-bio">${linkifySimple(user.bio)}</p>`;';

const parts = src.split(oldBio);
if (parts.length > 1) {
    src = parts.join(newBio);
    console.log('OK: ' + (parts.length - 1) + ' bio linkify → simple');
} else {
    console.log('WARN: bio pattern not found');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('server.js', src);
console.log('DONE');
