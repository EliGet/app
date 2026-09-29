const fs = require('fs');
let src = fs.readFileSync('routes/group.js', 'utf8');
const before = src;

// 1. header-এর group title-কে link করো members page-এ
const oldHeader = `                <header>
                    <a href="/chat" class="header-icon" title="Back">\${icons.back}</a>
                    <span class="profile-title" style="flex:1;">\${displayTitle}</span>
                </header>`;
const newHeader = `                <header>
                    <a href="/chat" class="header-icon" title="Back">\${icons.back}</a>
                    <a href="/group/\${group._id}/members" class="group-header-link" title="View members">
                        <span class="profile-title" style="flex:1;">\${displayTitle}</span>
                    </a>
                </header>`;
if (!src.includes(oldHeader)) { console.log('ERROR: group header not found'); process.exit(1); }
src = src.replace(oldHeader, function() { return newHeader; });
console.log('OK: header linked to members');

// 2. routes insert (POST /:id route-এর আগে)
const postMarker = "router.post('/:id',";
const idx = src.indexOf(postMarker);
if (idx === -1) { console.log('ERROR: POST /:id marker not found'); process.exit(1); }

const newRoutes = `// ===== GROUP MEMBERS LIST =====
router.get('/:id/members', async (req, res) => {
    try {
        const me = req.session.user;
        const group = await Group.findById(req.params.id);
        if (!group || !group.members.includes(me)) return res.redirect('/chat');

        const isCreator = group.creator === me;
        const memberData = [];
        for (const un of group.members) {
            const u = await User.findOne({ username: un });
            if (!u) continue;
            const dn = u.full_name || u.username;
            memberData.push({
                username: un,
                displayName: dn,
                initial: dn.charAt(0).toUpperCase(),
                avatar: u.avatar || '',
                isCreator: un === group.creator,
                isMe: un === me
            });
        }

        // Sort: creator first, then alphabetical
        memberData.sort((a, b) => {
            if (a.isCreator) return -1;
            if (b.isCreator) return 1;
            return a.displayName.localeCompare(b.displayName);
        });

        let membersHtml = '';
        for (const m of memberData) {
            const avatarInner = m.avatar ? \`<img src="\${m.avatar}" alt="">\` : m.initial;
            const roleBadge = m.isCreator ? '<span class="gm-role">Creator</span>' : '';
            const meBadge = m.isMe ? '<span class="gm-me">You</span>' : '';

            let removeBtn = '';
            if (isCreator && !m.isMe && !m.isCreator) {
                removeBtn = \`
                    <form action="/group/\${group._id}/remove-member" method="POST" style="margin:0;" onsubmit="return confirm('Remove \${m.displayName.replace(/'/g, "\\\\'")} from group?')">
                        <input type="hidden" name="username" value="\${m.username}">
                        <button type="submit" class="gm-remove" title="Remove">
                            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
                        </button>
                    </form>
                \`;
            }

            membersHtml += \`
                <div class="gm-item">
                    <div class="gm-avatar">\${avatarInner}</div>
                    <div class="gm-info">
                        <div class="gm-name">\${m.displayName} \${roleBadge} \${meBadge}</div>
                        <div class="gm-username">@\${m.username}</div>
                    </div>
                    \${removeBtn}
                </div>
            \`;
        }

        res.send(\`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
            <title>\${group.name} · Members - EliGet</title>
            </head><body class="st-body">
            <div class="st-wrap">
                <header class="st-topbar">
                    <a href="/group/\${group._id}" class="st-back" title="Back">
                        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>
                    </a>
                    <span class="st-title">Members</span>
                    <span class="st-spacer"></span>
                </header>

                <section class="st-section">
                    <h2 class="st-section-label">\${group.name} · \${group.members.length} \${group.members.length === 1 ? 'member' : 'members'}</h2>
                    <div class="st-card gm-card">
                        \${membersHtml}
                    </div>
                </section>

                <section class="st-section">
                    <a href="/group/\${group._id}/add-member" class="gm-add-btn">
                        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                        Add member
                    </a>
                </section>
            </div>
            </body></html>
        \`);
    } catch (err) {
        console.error('Group members error:', err);
        res.redirect('/chat');
    }
});

// ===== ADD MEMBER PAGE =====
router.get('/:id/add-member', async (req, res) => {
    try {
        const me = req.session.user;
        const group = await Group.findById(req.params.id);
        if (!group || !group.members.includes(me)) return res.redirect('/chat');

        const FriendRequest = require('../models/FriendRequest');
        const accepted = await FriendRequest.find({
            status: 'accepted',
            $or: [{ from: me }, { to: me }]
        });
        const friendUsernames = accepted.map(r => r.from === me ? r.to : r.from);

        // Filter out already-members
        const candidates = [];
        for (const un of friendUsernames) {
            if (group.members.includes(un)) continue;
            const u = await User.findOne({ username: un });
            if (!u) continue;
            const dn = u.full_name || u.username;
            candidates.push({
                username: un,
                displayName: dn,
                initial: dn.charAt(0).toUpperCase(),
                avatar: u.avatar || ''
            });
        }

        let listHtml = '';
        if (candidates.length === 0) {
            listHtml = \`<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                <h3>No friends to add</h3>
                <p>All your friends are already in this group.</p>
            </div>\`;
        } else {
            for (const c of candidates) {
                const avatarInner = c.avatar ? \`<img src="\${c.avatar}" alt="">\` : c.initial;
                listHtml += \`
                    <label class="gm-item gm-selectable">
                        <input type="checkbox" name="members" value="\${c.username}" class="gm-check">
                        <div class="gm-avatar">\${avatarInner}</div>
                        <div class="gm-info">
                            <div class="gm-name">\${c.displayName}</div>
                            <div class="gm-username">@\${c.username}</div>
                        </div>
                    </label>
                \`;
            }
        }

        res.send(\`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
            <title>Add members - EliGet</title>
            </head><body class="st-body">
            <div class="st-wrap">
                <header class="st-topbar">
                    <a href="/group/\${group._id}/members" class="st-back" title="Back">
                        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>
                    </a>
                    <span class="st-title">Add members</span>
                    <span class="st-spacer"></span>
                </header>

                <section class="st-section">
                    <h2 class="st-section-label">Add to \${group.name}</h2>
                    \${candidates.length > 0 ? \`
                        <form action="/group/\${group._id}/add-member" method="POST" id="addMemberForm">
                            <div class="st-card gm-card gm-select-list">\${listHtml}</div>
                            <button type="submit" class="gm-save-btn" id="gmSaveBtn" disabled>
                                Add <span id="gmCount">0</span> member(s)
                            </button>
                        </form>
                    \` : \`<div class="st-card gm-card">\${listHtml}</div>\`}
                </section>
            </div>
            <script>
                var checks = document.querySelectorAll('.gm-check');
                var btn = document.getElementById('gmSaveBtn');
                var countEl = document.getElementById('gmCount');
                function updateCount() {
                    var n = document.querySelectorAll('.gm-check:checked').length;
                    if (countEl) countEl.textContent = n;
                    if (btn) btn.disabled = n === 0;
                }
                checks.forEach(function(c) { c.addEventListener('change', updateCount); });
            </script>
            </body></html>
        \`);
    } catch (err) {
        console.error('Add member page error:', err);
        res.redirect('/chat');
    }
});

// ===== ADD MEMBER POST =====
router.post('/:id/add-member', async (req, res) => {
    try {
        const me = req.session.user;
        const group = await Group.findById(req.params.id);
        if (!group || !group.members.includes(me)) return res.redirect('/chat');

        let toAdd = req.body.members || [];
        if (!Array.isArray(toAdd)) toAdd = [toAdd];

        // Verify each is a friend of me
        const FriendRequest = require('../models/FriendRequest');
        const accepted = await FriendRequest.find({
            status: 'accepted',
            $or: [{ from: me }, { to: me }]
        });
        const friendSet = new Set(accepted.map(r => r.from === me ? r.to : r.from));

        const valid = toAdd.filter(un => friendSet.has(un) && !group.members.includes(un));
        if (valid.length > 0) {
            group.members.push(...valid);
            await group.save();
        }

        res.redirect('/group/' + group._id + '/members');
    } catch (err) {
        console.error('Add member error:', err);
        res.redirect('/chat');
    }
});

// ===== REMOVE MEMBER (creator only) =====
router.post('/:id/remove-member', async (req, res) => {
    try {
        const me = req.session.user;
        const group = await Group.findById(req.params.id);
        if (!group || group.creator !== me) return res.redirect('/chat');

        const target = req.body.username;
        if (!target || target === group.creator) return res.redirect('/group/' + group._id + '/members');

        group.members = group.members.filter(u => u !== target);
        await group.save();

        res.redirect('/group/' + group._id + '/members');
    } catch (err) {
        console.error('Remove member error:', err);
        res.redirect('/chat');
    }
});

`;

src = src.slice(0, idx) + newRoutes + src.slice(idx);
fs.writeFileSync('routes/group.js', src);
console.log('DONE: routes added');
