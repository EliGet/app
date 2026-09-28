const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// 1. Timestamp add to post meta
const oldMeta = `                        <div class="lp-post-meta">\${likeCount} \${likeCount === 1 ? 'like' : 'likes'}</div>`;
const newMeta = `                        <div class="lp-post-meta"><span>\${timeStr}</span><span class="lp-post-dot">\u00b7</span><span>\${likeCount} \${likeCount === 1 ? 'like' : 'likes'}</span></div>`;
if (!src.includes(oldMeta)) { console.log('ERROR: post meta not found'); process.exit(1); }
src = src.replace(oldMeta, newMeta);
console.log('OK: post meta updated');

// 2. timeStr compute — likeCount এর লাইনের আগে
const oldLikeLine = `                const likeCount = (p.likes || []).length;`;
const newLikeLine = `                const likeCount = (p.likes || []).length;
                const diffMs = Date.now() - new Date(p.created_at).getTime();
                const diffMin = Math.floor(diffMs / 60000);
                let timeStr;
                if (diffMin < 1) timeStr = 'just now';
                else if (diffMin < 60) timeStr = diffMin + 'm';
                else if (diffMin < 1440) timeStr = Math.floor(diffMin / 60) + 'h';
                else if (diffMin < 10080) timeStr = Math.floor(diffMin / 1440) + 'd';
                else timeStr = new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });`;
if (!src.includes(oldLikeLine)) { console.log('ERROR: likeCount line not found'); process.exit(1); }
src = src.replace(oldLikeLine, newLikeLine);
console.log('OK: timeStr computed');

// 3. Brand accent dot
const oldBrand = `                    <span class="lp-brand">EliGet</span>`;
const newBrand = `                    <span class="lp-brand">EliGet<span class="lp-brand-dot"></span></span>`;
if (!src.includes(oldBrand)) { console.log('ERROR: brand not found'); process.exit(1); }
src = src.replace(oldBrand, newBrand);
console.log('OK: brand dot added');

// 4. Primary button arrow — class add for accent
const oldArrow = `                    <a href="/auth/signup" class="lp-btn-primary">Create Account <span class="lp-arrow">\u2192</span></a>`;
const newArrow = `                    <a href="/auth/signup" class="lp-btn-primary">Create Account<span class="lp-arrow">\u2192</span></a>`;
if (src.includes(oldArrow)) {
    src = src.replace(oldArrow, newArrow);
    console.log('OK: primary button arrow');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('server.js', src);
console.log('DONE');
