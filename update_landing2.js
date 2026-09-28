const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');

const oldBlock = `                <div class="landing-hero">
                    <h1 class="elget-wordmark elget-wordmark-lg">EliGet</h1>
                    <p class="landing-tagline">Text-only network.</p>
                    <p class="landing-sub">No algorithms. No videos.<br>Just pure thoughts.</p>
                </div>

                <div class="landing-cta">
                    <a href="/auth/signup" class="landing-btn-primary">Create Account</a>
                    <a href="/auth/login" class="landing-btn-link">Already have an account? Login</a>
                </div>

                <div class="landing-pills">
                    <span class="landing-pill">\${icons.chat}<span>Chat</span></span>
                    <span class="landing-pill">\${icons.feed}<span>Feed</span></span>
                    <span class="landing-pill">\${icons.plus}<span>Post</span></span>
                </div>

                <div class="landing-footer">
                    <a href="/feed" class="landing-btn-tertiary">Browse Feed \u2192</a>
                </div>`;

const newBlock = `                <div class="landing-hero">
                    <img src="/favicon.svg" alt="EliGet" class="landing-logo">
                    <h1 class="elget-wordmark elget-wordmark-lg">EliGet</h1>
                    <p class="landing-tagline">Text-only network.</p>
                    <p class="landing-sub">No algorithms. No videos.<br>Just pure thoughts.</p>
                </div>

                <div class="landing-cta-2">
                    <a href="/auth/signup" class="landing-btn-primary">Create Account</a>
                    <a href="/auth/login" class="landing-btn-secondary">Login</a>
                </div>

                <div class="landing-divider">
                    <span>Chat \u00b7 Feed \u00b7 Post</span>
                </div>

                <div class="landing-footer">
                    <a href="/feed" class="landing-btn-tertiary">Browse Feed without account \u2192</a>
                </div>`;

if (!src.includes(oldBlock)) { console.log('ERROR: landing block v2 not found'); process.exit(1); }
src = src.replace(oldBlock, newBlock);
fs.writeFileSync('server.js', src);
console.log('OK: landing page v3 written');
