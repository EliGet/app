const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

// Insert system check right before "const isMe = m.from === me;"
const oldLine = `            messages.forEach(m => {
                const isMe = m.from === me;
                const dLabel = (function(dt){`;

const newLine = `            messages.forEach(m => {
                if (m.from === 'system') {
                    messagesHtml += '<div class="msg-system"><span>' + escapeXmlSystem(m.body) + '</span></div>';
                    return;
                }
                const isMe = m.from === me;
                const dLabel = (function(dt){`;

if (src.includes(oldLine)) {
    src = src.replace(oldLine, function() { return newLine; });
    console.log('OK: system message render inserted');
} else {
    console.log('ERROR: pattern not found');
    process.exit(1);
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('routes/chat.js', src);
console.log('DONE');
