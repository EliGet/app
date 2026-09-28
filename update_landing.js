const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');

const oldBlock = `                <div class="landing-hero">
                    <h1 class="elget-wordmark elget-wordmark-lg" style="margin-bottom: 10px;">EliGet</h1>
                    <p class="landing-tagline">Text-only, anti-addiction network.</p>
                    <p class="landing-sub">No algorithms. No videos. Just pure thoughts.</p>
                </div>

                <div class="landing-features">
                    <div class="landing-card">
                        <div class="landing-card-icon">\${icons.chat}</div>
                        <h3>Chat</h3>
                        <p>Direct text messaging with friends.</p>
                    </div>
                    <div class="landing-card">
                        <div class="landing-card-icon">\${icons.feed}</div>
                        <h3>Feed</h3>
                        <p>Read posts, share your thoughts.</p>
                    </div>
                    <div class="landing-card">
                        <div class="landing-card-icon">\${icons.plus}</div>
                        <h3>Post</h3>
                        <p>Write your mind, no images or videos.</p>
                    </div>
                    <div class="landing-card">
                        <div class="landing-card-icon">\${icons.profile}</div>
                        <h3>No Algorithm</h3>
                        <p>No dopamine loops, just clean text.</p>
                    </div>
                </div>

                <div class="landing-cta">
                    <a href="/auth/login" class="landing-btn-primary">Login</a>
                    <a href="/auth/signup" class="landing-btn-secondary">Create Account</a>
                </div>

                <div class="landing-footer">
                    <a href="/feed">\${icons.feed} Browse Feed without Account</a>
                </div>`;

const newBlock = `                <div class="landing-hero">
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

if (!src.includes(oldBlock)) { console.log('ERROR: landing block not found'); process.exit(1); }
src = src.replace(oldBlock, newBlock);
fs.writeFileSync('server.js', src);
console.log('OK: landing page replaced');
