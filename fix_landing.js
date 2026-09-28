const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// 1. Real DB post fetch block → demo posts
const realFetchStart = `        const latestPosts = await Post.find().sort({ created_at: -1 }).limit(2);`;
const realFetchEnd = `            previewHtml = '<p class="lp-post-empty">No thoughts shared yet. Be the first.</p>';
        }`;
const sIdx = src.indexOf(realFetchStart);
const eIdx = src.indexOf(realFetchEnd);
if (sIdx === -1 || eIdx === -1) { console.log('ERROR: preview block not found'); process.exit(1); }

const demoBlock = `        let previewHtml = '';
        const demos = [
            { name: 'Ayesha K.', text: 'The best conversations happen when nobody is trying to win.', likes: 12, time: '2h' },
            { name: 'Tanvir H.', text: 'Wrote three pages in my notebook today. No screen, just ink.', likes: 8, time: '5h' },
            { name: 'Samira R.', text: 'Quiet mornings are underrated. So is saying nothing.', likes: 24, time: '1d' }
        ];
        for (const d of demos) {
            const initial = d.name.charAt(0).toUpperCase();
            previewHtml += \`
                <div class="lp-post">
                    <div class="lp-post-head">
                        <div class="lp-post-avatar">\${initial}</div>
                        <span class="lp-post-author">\${d.name}</span>
                    </div>
                    <p class="lp-post-body">\${d.text}</p>
                    <div class="lp-post-meta"><span>\${d.time}</span><span class="lp-post-dot">\u00b7</span><span>\${d.likes} likes</span></div>
                </div>
            \`;
        }`;

src = src.slice(0, sIdx) + demoBlock + src.slice(eIdx + realFetchEnd.length);
console.log('OK: demo posts written');

// 2. Arrow → SVG chevron
const oldArrow1 = `Create Account<span class="lp-arrow">\u2192</span>`;
const newArrow1 = `Create Account<svg class="lp-arrow-svg" viewBox="0 0 24 24" width="18" height="18"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
if (src.includes(oldArrow1)) { src = src.replace(oldArrow1, newArrow1); console.log('OK: primary arrow → SVG'); }

// 3. Guest link — clean text + SVG arrow
const oldGuest = `                    <a href="/feed" class="lp-guest-link">Browse the public feed \u2192</a>`;
const newGuest = `                    <a href="/feed" class="lp-guest-link">Browse the public feed<svg class="lp-arrow-svg" viewBox="0 0 24 24" width="14" height="14"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`;
if (src.includes(oldGuest)) { src = src.replace(oldGuest, newGuest); console.log('OK: guest link → SVG arrow'); }

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('server.js', src);
console.log('DONE');
