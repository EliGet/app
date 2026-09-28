const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');

const startMarker = `    } else {
        res.send(\`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">`;
const endMarker = `            </body></html>
        \`);
    }
});`;

const start = src.indexOf(startMarker);
const end = src.indexOf(endMarker);
if (start === -1) { console.log('ERROR: start marker not found'); process.exit(1); }
if (end === -1) { console.log('ERROR: end marker not found'); process.exit(1); }
if (end <= start) { console.log('ERROR: end before start'); process.exit(1); }

const newBlock = `    } else {
        const latestPosts = await Post.find().sort({ created_at: -1 }).limit(2);
        let previewHtml = '';
        if (latestPosts.length > 0) {
            for (const p of latestPosts) {
                const author = await User.findOne({ username: p.author });
                const dn = author ? (author.full_name || author.username) : p.author;
                const initial = dn.charAt(0).toUpperCase();
                const av = author && author.avatar ? \`<img src="\${author.avatar}" alt="">\` : initial;
                const likeCount = (p.likes || []).length;
                const bodyText = p.body.length > 140 ? p.body.slice(0, 140) + '\\u2026' : p.body;
                previewHtml += \`
                    <div class="lp-post">
                        <div class="lp-post-head">
                            <div class="lp-post-avatar">\${av}</div>
                            <span class="lp-post-author">\${dn}</span>
                        </div>
                        <p class="lp-post-body">\${bodyText}</p>
                        <div class="lp-post-meta">\${likeCount} \${likeCount === 1 ? 'like' : 'likes'}</div>
                    </div>
                \`;
            }
        } else {
            previewHtml = '<p class="lp-post-empty">No thoughts shared yet. Be the first.</p>';
        }

        res.send(\`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
            <title>EliGet</title>
            </head><body class="lp-body">
            <div class="lp-wrap">

                <nav class="lp-nav">
                    <span class="lp-brand">EliGet</span>
                    <div class="lp-nav-links">
                        <a href="#features">Features</a>
                        <a href="/auth/login">Login</a>
                    </div>
                </nav>

                <section class="lp-hero">
                    <h1 class="lp-headline">A social network<br>for people who think.</h1>
                    <p class="lp-sub">Text-only. No algorithms. No videos.<br>Just pure thoughts.</p>
                </section>

                <div class="lp-cta">
                    <a href="/auth/signup" class="lp-btn-primary">Create Account <span class="lp-arrow">\\u2192</span></a>
                    <a href="/auth/login" class="lp-btn-secondary">Login</a>
                </div>

                <section class="lp-features" id="features">
                    <h2 class="lp-features-title">Built around conversation</h2>
                    <div class="lp-feature-grid">
                        <div class="lp-feature">
                            <div class="lp-feature-label">Text-first</div>
                            <div class="lp-feature-text">Share ideas</div>
                        </div>
                        <div class="lp-feature">
                            <div class="lp-feature-label">Real-time</div>
                            <div class="lp-feature-text">Chat</div>
                        </div>
                        <div class="lp-feature">
                            <div class="lp-feature-label">Simple Feed</div>
                            <div class="lp-feature-text">No noise</div>
                        </div>
                    </div>
                </section>

                <section class="lp-preview">
                    <h2 class="lp-preview-title">Latest thoughts</h2>
                    \${previewHtml}
                </section>

                <div class="lp-guest">
                    <span class="lp-guest-text">Not ready to join?</span>
                    <a href="/feed" class="lp-guest-link">Browse the public feed \\u2192</a>
                </div>

            </div>
            </body></html>
        \`);
    }
});`;

src = src.slice(0, start) + newBlock + src.slice(end + endMarker.length);
fs.writeFileSync('server.js', src);
console.log('OK: landing page fully redesigned');
