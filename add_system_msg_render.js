const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

// In chat room loop, handle m.from === 'system'
const oldLoop = `            messages.forEach(m => {
                const isMe = m.from === me;
                if (isMe) {`;

const newLoop = `            messages.forEach(m => {
                // System message — centered, no bubble
                if (m.from === 'system') {
                    messagesHtml += \`
                        <div class="msg-system">
                            <span>\${escapeXmlSystem(m.body)}</span>
                        </div>
                    \`;
                    return;
                }
                const isMe = m.from === me;
                if (isMe) {`;

if (src.includes(oldLoop)) {
    src = src.replace(oldLoop, function() { return newLoop; });
    console.log('OK: system message render added');
} else {
    console.log('WARN: chat loop pattern not found');
}

// Add helper if not exists
if (!src.includes('function escapeXmlSystem')) {
    const helperMarker = "function getChatId(user1, user2) {";
    if (src.includes(helperMarker)) {
        const helper = `function escapeXmlSystem(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function getChatId(user1, user2) {`;
        src = src.replace(helperMarker, helper);
        console.log('OK: escapeXmlSystem helper added');
    }
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('routes/chat.js', src);
console.log('DONE');
