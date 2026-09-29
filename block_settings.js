const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// Find settings route — insert blocked users section before "Danger zone"
const dangerMarker = `            <section class="st-section st-danger-section">`;
if (!src.includes(dangerMarker)) { console.log('ERROR: danger zone marker not found'); process.exit(1); }

// Compute blocked data before res.send
const computeMarker = `    const canAddMore = accountsData.length < 2;`;
if (!src.includes(computeMarker)) { console.log('ERROR: canAddMore marker not found'); process.exit(1); }

const computeBlocked = `    const canAddMore = accountsData.length < 2;

    // Blocked users
    const myBlocks = await Block.find({ blocker: req.session.user });
    const blockedData = [];
    for (const b of myBlocks) {
        const u = await User.findOne({ username: b.blocked });
        if (!u) continue;
        const dn = u.full_name || u.username;
        blockedData.push({
            username: b.blocked,
            displayName: dn,
            initial: dn.charAt(0).toUpperCase(),
            avatar: u.avatar || ''
        });
    }

    let blockedHtml = '';
    if (blockedData.length === 0) {
        blockedHtml = '<div class="st-empty">You have not blocked anyone.</div>';
    } else {
        for (const b of blockedData) {
            const avatarInner = b.avatar ? \`<img src="\${b.avatar}" alt="">\` : b.initial;
            blockedHtml += \`
                <div class="st-blocked-item">
                    <div class="st-account-avatar">\${avatarInner}</div>
                    <div class="st-account-info">
                        <div class="st-account-name">\${b.displayName}</div>
                        <div class="st-account-username">@\${b.username}</div>
                    </div>
                    <form action="/settings/unblock" method="POST" style="margin:0;">
                        <input type="hidden" name="username" value="\${b.username}">
                        <button type="submit" class="st-unblock-btn">Unblock</button>
                    </form>
                </div>
            \`;
        }
    }`;

src = src.replace(computeMarker, computeBlocked);
console.log('OK: blocked data computed');

// Insert blocked section before danger zone
const blockedSection = `            <section class="st-section">
                <h2 class="st-section-label">Blocked users</h2>
                <div class="st-card">
                    \${blockedHtml}
                </div>
            </section>

            <section class="st-section st-danger-section">`;

src = src.replace(dangerMarker, blockedSection);
console.log('OK: blocked section added to settings');

// Add unblock route
const marker404 = '// ===== 404 HANDLER =====';
const idx = src.indexOf(marker404);
if (idx === -1) { console.log('ERROR: 404 marker not found'); process.exit(1); }

const unblockRoute = `// ===== UNBLOCK FROM SETTINGS =====
app.post('/settings/unblock', isAuthenticated, async (req, res) => {
    const target = req.body.username;
    if (!target) return res.redirect('/settings');
    await Block.deleteOne({ blocker: req.session.user, blocked: target });
    res.redirect('/settings');
});

`;

src = src.slice(0, idx) + unblockRoute + src.slice(idx);
console.log('OK: unblock route added');

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('server.js', src);
console.log('DONE');
