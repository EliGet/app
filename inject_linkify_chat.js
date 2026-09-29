const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

// 1. require
if (!src.includes("require('../lib/linkify')")) {
    const m = src.match(/const express = require\('express'\);/);
    if (!m) { console.log('ERROR: express require not found'); process.exit(1); }
    src = src.replace(m[0], m[0] + "\nconst { linkify } = require('../lib/linkify');");
    console.log('OK: require added');
} else {
    console.log('WARN: require already present');
}

// 2. Sent bubble
const oldSent = '<div class="msg-bubble msg-sent-bubble">${m.body}${tick}</div>';
if (src.includes(oldSent)) {
    src = src.split(oldSent).join('<div class="msg-bubble msg-sent-bubble">${linkify(m.body)}${tick}</div>');
    console.log('OK: sent bubble');
} else {
    console.log('WARN: sent bubble pattern not found');
}

// 3. Received bubble
const oldRecv = '<div class="msg-bubble msg-received-bubble">${m.body}</div>';
if (src.includes(oldRecv)) {
    src = src.split(oldRecv).join('<div class="msg-bubble msg-received-bubble">${linkify(m.body)}</div>');
    console.log('OK: received bubble');
} else {
    console.log('WARN: received bubble pattern not found');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/chat.js', src);
console.log('DONE chat.js');
