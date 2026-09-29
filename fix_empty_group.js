const fs = require('fs');
let src = fs.readFileSync('routes/group.js', 'utf8');
const before = src;

const old1 = `            messagesHtml = '<p style="text-align:center; color:#a0aec0; padding: 20px;">No messages yet. Start the conversation!</p>';`;
const new1 = `            messagesHtml = \`<div class="empty-state empty-compact">
                <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                <h3>No messages yet</h3>
                <p>Start the conversation with your group.</p>
            </div>\`;`;
if (src.includes(old1)) { src = src.replace(old1, function(){return new1;}); console.log('OK: group chat'); }
else { console.log('WARN: group chat empty not found'); }

if (src === before) { console.log('ERROR: nothing changed in group.js'); process.exit(1); }
fs.writeFileSync('routes/group.js', src);
console.log('DONE group.js');
