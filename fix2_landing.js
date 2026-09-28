const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// 1. Demo post block replace
const oldStart = `        let previewHtml = '';
        const demos = [`;
const oldEnd = `        }`;
const sIdx = src.indexOf(oldStart);
if (sIdx === -1) { console.log('ERROR: demo block start not found'); process.exit(1); }
const eIdx = src.indexOf(oldEnd, sIdx);
if (eIdx === -1) { console.log('ERROR: demo block end not found'); process.exit(1); }

const newBlock = `        let previewHtml = '';
        const demos = [
            { name: 'Ayesha Khatun', text: 'The best conversations happen when nobody is trying to win.', likes: 12, time: '2h', svg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#fef3c7"/><circle cx="50" cy="42" r="18" fill="#92400e"/><path d="M20 90c0-16 13-26 30-26s30 10 30 26z" fill="#92400e"/><circle cx="44" cy="42" r="2.5" fill="#fff"/><circle cx="56" cy="42" r="2.5" fill="#fff"/></svg>' },
            { name: 'Tanvir Hasan', text: 'Wrote three pages in my notebook today. No screen, just ink.', likes: 8, time: '5h' },
            { name: 'Samira Rahman', text: 'Quiet mornings are underrated. So is saying nothing.', likes: 24, time: '1d' }
        ];
        for (const d of demos) {
            const initial = d.name.charAt(0).toUpperCase();
            const avatarInner = d.svg ? d.svg : initial;
            previewHtml += \`
                <div class="lp-post">
                    <div class="lp-post-head">
                        <div class="lp-post-avatar \${d.svg ? 'has-svg' : ''}">\${avatarInner}</div>
                        <span class="lp-post-author">\${d.name}</span>
                    </div>
                    <p class="lp-post-body">\${d.text}</p>
                    <div class="lp-post-meta"><span>\${d.time}</span><span class="lp-post-dot">\u00b7</span><span>\${d.likes} likes</span></div>
                </div>
            \`;
        }`;

src = src.slice(0, sIdx) + newBlock + src.slice(eIdx + oldEnd.length);
console.log('OK: demo block updated');

// 2. Arrow SVG → bold version (stroke-width 2.8)
src = src.replace(/<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2\.2" stroke-linecap="round" stroke-linejoin="round"\/>/g, '<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>');
console.log('OK: arrow bold');

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('server.js', src);
console.log('DONE');
