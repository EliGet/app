const fs = require('fs');
const OLD_BACK = "    back: `<svg viewBox=\"0 0 24 24\"><path d=\"M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z\"/></svg>`,";
const NEW_BACK = "    back: `<svg viewBox=\"0 0 24 24\"><path d=\"M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z\"/></svg>`,";

function replaceOrFail(src, oldStr, newStr, label) {
    if (!src.includes(oldStr)) { console.log('ERROR: not found - ' + label); process.exit(1); }
    return src.replace(oldStr, newStr);
}

// ============ server.js ============
let svr = fs.readFileSync('server.js', 'utf8');
svr = replaceOrFail(svr, OLD_BACK, NEW_BACK, 'server.js back icon');

// Choose Avatar (multi-line)
svr = replaceOrFail(svr,
`            <header>
                <span class="profile-title">Choose Avatar</span>
                <a href="/profile" class="header-icon" title="Back">\${icons.back}</a>
            </header>`,
`            <header>
                <a href="/profile" class="header-icon" title="Back">\${icons.back}</a>
                <span class="profile-title" style="flex:1;">Choose Avatar</span>
            </header>`,
'Choose Avatar header');

// Badge Library (multi-line)
svr = replaceOrFail(svr,
`            <header>
                <span class="profile-title">Badge Library</span>
                <a href="/profile" class="header-icon" title="Back">\${icons.back}</a>
            </header>`,
`            <header>
                <a href="/profile" class="header-icon" title="Back">\${icons.back}</a>
                <span class="profile-title" style="flex:1;">Badge Library</span>
            </header>`,
'Badge Library header');

// Edit Bio (multi-line)
svr = replaceOrFail(svr,
`            <header>
                <span class="profile-title">Edit Bio</span>
                <a href="/profile" class="header-icon" title="Back">\${icons.back}</a>
            </header>`,
`            <header>
                <a href="/profile" class="header-icon" title="Back">\${icons.back}</a>
                <span class="profile-title" style="flex:1;">Edit Bio</span>
            </header>`,
'Edit Bio header');

// Public profile (multi-line, slightly indented)
svr = replaceOrFail(svr,
`                <header>
                    <span class="profile-title">Profile</span>
                    <a href="/" class="header-icon" title="Back">\${icons.back}</a>
                </header>`,
`                <header>
                    <a href="/" class="header-icon" title="Back">\${icons.back}</a>
                    <span class="profile-title" style="flex:1;">Profile</span>
                </header>`,
'Public profile header');

// Settings (single line)
svr = replaceOrFail(svr,
`            <header><span class="settings-page-title">Settings</span><a href="/profile" class="header-icon" title="Back">\${icons.back}</a></header>`,
`            <header><a href="/profile" class="header-icon" title="Back">\${icons.back}</a><span class="settings-page-title" style="flex:1;">Settings</span></header>`,
'Settings header');

fs.writeFileSync('server.js', svr);
console.log('OK: server.js all headers fixed');

// ============ routes/post.js ============
let pst = fs.readFileSync('routes/post.js', 'utf8');
pst = replaceOrFail(pst, OLD_BACK, NEW_BACK, 'post.js back icon');

// New Post (single line)
pst = replaceOrFail(pst,
`            <header><span class="profile-title">New Post</span><a href="/" class="header-icon" title="Back">\${icons.back}</a></header>`,
`            <header><a href="/" class="header-icon" title="Back">\${icons.back}</a><span class="profile-title" style="flex:1;">New Post</span></header>`,
'New Post header');

// SVG Library (multi-line)
pst = replaceOrFail(pst,
`            <header>
                <span class="profile-title">SVG Library</span>
                <a href="/post/create\${currentImage !== 'none' ? '?image=' + currentImage : ''}" class="header-icon" title="Back">\${icons.back}</a>
            </header>`,
`            <header>
                <a href="/post/create\${currentImage !== 'none' ? '?image=' + currentImage : ''}" class="header-icon" title="Back">\${icons.back}</a>
                <span class="profile-title" style="flex:1;">SVG Library</span>
            </header>`,
'SVG Library header');

// Edit Post (single line)
pst = replaceOrFail(pst,
`                <header><span class="profile-title">Edit Post</span><a href="/" class="header-icon" title="Back">\${icons.back}</a></header>`,
`                <header><a href="/" class="header-icon" title="Back">\${icons.back}</a><span class="profile-title" style="flex:1;">Edit Post</span></header>`,
'Edit Post header');

fs.writeFileSync('routes/post.js', pst);
console.log('OK: post.js all headers fixed');

// ============ routes/group.js ============
let grp = fs.readFileSync('routes/group.js', 'utf8');
grp = replaceOrFail(grp,
`                <header>
                    <span class="profile-title">New Group</span>
                    <a href="/chat" class="header-icon" title="Back">\${icons.back}</a>
                </header>`,
`                <header>
                    <a href="/chat" class="header-icon" title="Back">\${icons.back}</a>
                    <span class="profile-title" style="flex:1;">New Group</span>
                </header>`,
'New Group header');
fs.writeFileSync('routes/group.js', grp);
console.log('OK: group.js header fixed');

// ============ routes/chat.js ============
let cht = fs.readFileSync('routes/chat.js', 'utf8');

// Add Friends
cht = replaceOrFail(cht,
`                <header>
                    <span class="profile-title">Add Friends</span>
                    <a href="/chat" class="header-icon" title="Back">\${icons.back}</a>
                </header>`,
`                <header>
                    <a href="/chat" class="header-icon" title="Back">\${icons.back}</a>
                    <span class="profile-title" style="flex:1;">Add Friends</span>
                </header>`,
'Add Friends header');

// Notifications
cht = replaceOrFail(cht,
`                <header>
                    <span class="profile-title">Notifications</span>
                    <a href="/chat" class="header-icon" title="Back">\${icons.back}</a>
                </header>`,
`                <header>
                    <a href="/chat" class="header-icon" title="Back">\${icons.back}</a>
                    <span class="profile-title" style="flex:1;">Notifications</span>
                </header>`,
'Notifications header');

fs.writeFileSync('routes/chat.js', cht);
console.log('OK: chat.js headers fixed');

console.log('ALL DONE');
