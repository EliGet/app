const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

// 1. Typing Map remove
const mapBlock = `

// In-memory typing state — { [chatId]: { [username]: timestamp } }
const typingMap = new Map();
const TYPING_TTL = 4000;
`;
if (src.includes(mapBlock)) {
    src = src.replace(mapBlock, '');
    console.log('OK: typing Map removed');
}

// 2. Typing routes remove
const routesStart = "// ===== TYPING SIGNAL (POST) =====";
const routesEnd = "router.get('/notifications'";
const rs = src.indexOf(routesStart);
const re = src.indexOf(routesEnd);
if (rs !== -1 && re !== -1 && rs < re) {
    src = src.slice(0, rs) + src.slice(re);
    console.log('OK: typing routes removed');
}

// 3. Typing indicator HTML remove
const indicatorHtml = `                <div class="typing-indicator" id="typingIndicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-text">typing</span>
                </div>
`;
if (src.includes(indicatorHtml)) {
    src = src.replace(indicatorHtml, '');
    console.log('OK: indicator HTML removed');
}

// 4. JS typing block remove
const jsStart = `                // ===== Typing indicator =====`;
const jsEnd = `                setInterval(() => {
                    if (!isTyping) {
                        fetch(window.location.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })`;
const js = src.indexOf(jsStart);
const je = src.indexOf(jsEnd);
if (js !== -1 && je !== -1 && js < je) {
    src = src.slice(0, js) + src.slice(je);
    console.log('OK: typing JS removed');
}

// 5. Change auto-refresh 5000 → 1000
src = src.replace(
    `                }, 5000);`,
    `                }, 1000);`
);
console.log('OK: refresh interval → 1000ms');

// 6. Remove id="chatForm" and id="chatInput" (cosmetic, no harm — but cleaner)
src = src.replace(
    `<form class="chat-form" action="/chat/\${withUser}" method="POST" id="chatForm">`,
    `<form class="chat-form" action="/chat/\${withUser}" method="POST">`
);
src = src.replace(
    `<input type="text" name="body" required placeholder="Type a message..." autocomplete="off" id="chatInput">`,
    `<input type="text" name="body" required placeholder="Type a message..." autocomplete="off">`
);
console.log('OK: form ids cleaned');

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/chat.js', src);
console.log('DONE');
