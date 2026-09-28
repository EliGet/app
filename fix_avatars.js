const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

const oldStart = `        let previewHtml = '';
        const demos = [`;
const oldEnd = `        }`;
const sIdx = src.indexOf(oldStart);
if (sIdx === -1) { console.log('ERROR: demo block start not found'); process.exit(1); }
const eIdx = src.indexOf(oldEnd, sIdx);
if (eIdx === -1) { console.log('ERROR: demo block end not found'); process.exit(1); }

const newBlock = `        let previewHtml = '';
        const demos = [
            { name: 'Ayesha Khatun', text: 'The best conversations happen when nobody is trying to win.', likes: 12, time: '2h', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ayesha' },
            { name: 'Tanvir Hasan', text: 'Wrote three pages in my notebook today. No screen, just ink.', likes: 8, time: '5h', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Tanvir' },
            { name: 'Samira Rahman', text: 'Quiet mornings are underrated. So is saying nothing.', likes: 24, time: '1d', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Samira' }
        ];
        for (const d of demos) {
            previewHtml += \`
                <div class="lp-post">
                    <div class="lp-post-head">
                        <div class="lp-post-avatar has-img"><img src="\${d.avatar}" alt=""></div>
                        <span class="lp-post-author">\${d.name}</span>
                    </div>
                    <p class="lp-post-body">\${d.text}</p>
                    <div class="lp-post-meta"><span>\${d.time}</span><span class="lp-post-dot">\u00b7</span><span>\${d.likes} likes</span></div>
                </div>
            \`;
        }`;

src = src.slice(0, sIdx) + newBlock + src.slice(eIdx + oldEnd.length);
if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('server.js', src);
console.log('OK: demo avatars updated to DiceBear');
