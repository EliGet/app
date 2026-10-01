const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

// 1. Typing Map
const reqMarker = "const GroupMessage = require('../models/GroupMessage');";
if (!src.includes(reqMarker)) { console.log('ERROR: GroupMessage require not found'); process.exit(1); }

if (!src.includes('const typingMap = new Map();')) {
    src = src.replace(reqMarker, reqMarker + `

// In-memory typing state — { [chatId]: { [username]: timestamp } }
const typingMap = new Map();
const TYPING_TTL = 4000;
`);
    console.log('OK: typing Map added');
}

// 2. Typing routes
const notifMarker = "router.get('/notifications'";
const idx = src.indexOf(notifMarker);
if (idx === -1) { console.log('ERROR: notifications marker not found'); process.exit(1); }

const typingRoutes = `// ===== TYPING SIGNAL (POST) =====
router.post('/typing/:withUser', async (req, res) => {
    try {
        const me = req.session.user;
        const withUser = req.params.withUser;
        if (!me || !withUser || me === withUser) return res.json({ ok: false });

        const chatId = getChatId(me, withUser);
        if (!typingMap.has(chatId)) typingMap.set(chatId, {});
        typingMap.get(chatId)[me] = Date.now();
        res.json({ ok: true });
    } catch (err) {
        res.json({ ok: false });
    }
});

// ===== TYPING STATUS (GET) =====
router.get('/typing-status/:withUser', async (req, res) => {
    try {
        const me = req.session.user;
        const withUser = req.params.withUser;
        if (!me || !withUser) return res.json({ typing: false });

        const chatId = getChatId(me, withUser);
        const entries = typingMap.get(chatId) || {};
        const theirTime = entries[withUser] || 0;
        const now = Date.now();
        const isTyping = (now - theirTime) < TYPING_TTL;
        res.json({ typing: isTyping });
    } catch (err) {
        res.json({ typing: false });
    }
});

`;

src = src.slice(0, idx) + typingRoutes + src.slice(idx);
console.log('OK: typing routes added');

// 3. HTML — add typing indicator + ids on form/input
const oldForm = `                <form class="chat-form" action="/chat/\${withUser}" method="POST">
                    <input type="text" name="body" required placeholder="Type a message..." autocomplete="off">
                    <button type="submit" title="Send">\${icons.send}</button>
                </form>`;

const newForm = `                <div class="typing-indicator" id="typingIndicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-text">typing</span>
                </div>
                <form class="chat-form" action="/chat/\${withUser}" method="POST" id="chatForm">
                    <input type="text" name="body" required placeholder="Type a message..." autocomplete="off" id="chatInput">
                    <button type="submit" title="Send">\${icons.send}</button>
                </form>`;

if (!src.includes(oldForm)) { console.log('WARN: chat form pattern not found'); }
else {
    src = src.replace(oldForm, function() { return newForm; });
    console.log('OK: typing indicator HTML added');
}

// 4. JS — insert typing signal block BEFORE the existing auto-refresh setInterval
const oldScriptMarker = `                setInterval(() => {
                    if (!isTyping) {
                        fetch(window.location.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })`;

// Note: In the file the string contains \${withUser} literal (backtick-escaped in the original code)
// but our outer template literal here will resolve \${withUser} → we need to escape as \\\${withUser}
const typingJs = `                // ===== Typing indicator =====
                var withUser = '\\\${withUser}';
                var typingIndicator = document.getElementById('typingIndicator');
                var chatInput = document.getElementById('chatInput');
                var lastTypingSent = 0;

                if (chatInput) {
                    chatInput.addEventListener('input', function() {
                        var now = Date.now();
                        if (now - lastTypingSent < 1500) return;
                        lastTypingSent = now;
                        fetch('/chat/typing/' + encodeURIComponent(withUser), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'same-origin'
                        }).catch(function(){});
                    });
                }

                setInterval(function() {
                    fetch('/chat/typing-status/' + encodeURIComponent(withUser), { credentials: 'same-origin' })
                        .then(function(r) { return r.json(); })
                        .then(function(data) {
                            if (typingIndicator) {
                                typingIndicator.classList.toggle('visible', !!(data && data.typing));
                            }
                        })
                        .catch(function(){});
                }, 2000);

                setInterval(() => {
                    if (!isTyping) {
                        fetch(window.location.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })`;

if (!src.includes(oldScriptMarker)) { console.log('WARN: script marker not found'); }
else {
    src = src.replace(oldScriptMarker, function() { return typingJs; });
    console.log('OK: typing JS added');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/chat.js', src);
console.log('DONE');
