const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// 1. require
if (!src.includes("require('./lib/linkify')")) {
    const m = src.match(/const path = require\('path'\);/);
    if (!m) { console.log('ERROR: path require not found'); process.exit(1); }
    src = src.replace(m[0], m[0] + "\nconst { linkify } = require('./lib/linkify');");
    console.log('OK: require added');
} else {
    console.log('WARN: require already present');
}

// 2. Post body
const oldBody = '<div class="post-content">${p.body}</div>';
if (src.includes(oldBody)) {
    src = src.split(oldBody).join('<div class="post-content">${linkify(p.body)}</div>');
    console.log('OK: post body linkified');
} else {
    console.log('WARN: post body pattern not found');
}

// 3. Bios (two places — same pattern)
const oldBio = 'bioHtml = `<p class="pp-bio">${user.bio}</p>`;';
const parts = src.split(oldBio);
if (parts.length > 1) {
    src = parts.join('bioHtml = `<p class="pp-bio">${linkify(user.bio)}</p>`;');
    console.log('OK: ' + (parts.length - 1) + ' bio(s) linkified');
} else {
    console.log('WARN: bio pattern not found');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('server.js', src);
console.log('DONE server.js');
