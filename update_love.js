const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');

// ---- 1. renderPostCard-এ like vars add ----
const moodBlock = `    let moodSvg = '';
    if (p.mood && p.mood !== 'none') {
        moodSvg = moodIcons[p.mood] || '';
    }
`;
const newMoodBlock = `    let moodSvg = '';
    if (p.mood && p.mood !== 'none') {
        moodSvg = moodIcons[p.mood] || '';
    }

    const likeCount = (p.likes || []).length;
    const liked = currentUser && (p.likes || []).includes(currentUser);
`;
if (!src.includes(moodBlock)) { console.log('ERROR: mood block not found'); process.exit(1); }
src = src.replace(moodBlock, newMoodBlock);
console.log('OK: like vars added');

// ---- 2. return block-এ love button add ----
const oldReturn = '            <div class="post-content">${p.body}</div>\n            ${imageHtml}\n        </div>\n    `;\n}';
const newReturn = '            <div class="post-content">${p.body}</div>\n            ${imageHtml}\n            <div class="post-love-row">\n                <button type="button" class="post-love-btn ${liked ? \'liked\' : \'\'}" data-post-id="${p._id}" onclick="toggleLove(event, this)">\n                    <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>\n                    <span class="post-love-count">${likeCount}</span>\n                </button>\n            </div>\n        </div>\n    `;\n}';
if (!src.includes(oldReturn)) { console.log('ERROR: return block not found'); process.exit(1); }
src = src.replace(oldReturn, newReturn);
console.log('OK: love button added to card');

// ---- 3. Like route add (renderPostCard-এর পরে) ----
const getDeleteMarker = 'function getDeleteModal() {';
const likeRoute = `// ===== LIKE POST (toggle) =====
app.post('/post/:id/like', isAuthenticated, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.json({ ok: false });
        if (!post.likes) post.likes = [];
        const me = req.session.user;
        const idx = post.likes.indexOf(me);
        if (idx === -1) post.likes.push(me);
        else post.likes.splice(idx, 1);
        await post.save();
        res.json({ ok: true, likes: post.likes.length, liked: post.likes.includes(me) });
    } catch (err) {
        console.error('Like error:', err);
        res.json({ ok: false });
    }
});

function getDeleteModal() {`;
if (!src.includes(getDeleteMarker)) { console.log('ERROR: getDeleteModal marker not found'); process.exit(1); }
src = src.replace(getDeleteMarker, likeRoute);
console.log('OK: like route added');

// ---- 4. Middleware to inject love.js ----
const expressInit = 'const app = express();';
if (!src.includes(expressInit)) { console.log('ERROR: const app = express() not found'); process.exit(1); }
const middleware = `const app = express();

// Inject love.js into every HTML response
app.use((req, res, next) => {
    const _send = res.send.bind(res);
    res.send = function(body) {
        if (typeof body === 'string' && body.includes('</body>') && !body.includes('/love.js')) {
            body = body.replace('</body>', '<script src="/love.js"></script></body>');
        }
        return _send(body);
    };
    next();
});`;
src = src.replace(expressInit, middleware);
console.log('OK: love.js middleware added');

fs.writeFileSync('server.js', src);
console.log('ALL DONE: server.js written');
