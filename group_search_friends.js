const fs = require('fs');
let src = fs.readFileSync('routes/group.js', 'utf8');
const before = src;

// 1. Change friend query to mutual follows
const oldQuery = `        const acceptedRequests = await FriendRequest.find({
            status: 'accepted',
            $or: [{ from: me }, { to: me }]
        });
        const friendUsernames = acceptedRequests.map(r => r.from === me ? r.to : r.from);

        let memberItemsHtml = '';
        let hasFriends = false;

        for (const username of friendUsernames) {`;

const newQuery = `        // Get mutual follows for group members
        const Follow = require('../models/Follow');
        const iFollow = await Follow.find({ follower: me }).select('following');
        const myFollowing = iFollow.map(f => f.following);
        let friendUsernames = [];
        if (myFollowing.length > 0) {
            const mutual = await Follow.find({
                following: me,
                follower: { $in: myFollowing }
            }).select('follower');
            friendUsernames = mutual.map(f => f.follower);
        }

        let memberItemsHtml = '';
        let hasFriends = false;

        for (const username of friendUsernames) {`;

if (src.includes(oldQuery)) {
    src = src.replace(oldQuery, function() { return newQuery; });
    console.log('OK: mutual follows for group members');
} else {
    console.log('WARN: friend query pattern not found');
}

// 2. Add search bar before member list
const oldMemberList = `                        <div class="form-group">
                            <label>Select Members</label>
                            <div class="member-list">\${memberItemsHtml}</div>
                        </div>`;

const newMemberList = `                        <div class="form-group">
                            <label>Select Members</label>
                            <input type="text" id="gcSearch" class="gc-search" placeholder="Search members..." autocomplete="off">
                            <div class="member-list" id="gcMemberList">\${memberItemsHtml}</div>
                            <p class="gc-empty" id="gcNoResults" style="display:none;">No matching members.</p>
                        </div>`;

if (src.includes(oldMemberList)) {
    src = src.replace(oldMemberList, function() { return newMemberList; });
    console.log('OK: search bar added');
} else {
    console.log('WARN: member list pattern not found');
}

// 3. Add search JS at end of script block
const oldScript = `            document.getElementById('groupAvatarModal').addEventListener('click', function(e) {
                if (e.target === this) closeGroupAvatarModal();
            });
            </script>`;

const newScript = `            document.getElementById('groupAvatarModal').addEventListener('click', function(e) {
                if (e.target === this) closeGroupAvatarModal();
            });

            // ===== Member search =====
            var gcSearch = document.getElementById('gcSearch');
            var gcList = document.getElementById('gcMemberList');
            var gcEmpty = document.getElementById('gcNoResults');

            if (gcSearch && gcList) {
                gcSearch.addEventListener('input', function() {
                    var q = (gcSearch.value || '').toLowerCase().trim();
                    var items = gcList.querySelectorAll('.gc-member');
                    var visible = 0;
                    items.forEach(function(it) {
                        var text = (it.textContent || '').toLowerCase();
                        if (!q || text.indexOf(q) !== -1) {
                            it.style.display = '';
                            visible++;
                        } else {
                            it.style.display = 'none';
                        }
                    });
                    if (gcEmpty) gcEmpty.style.display = (visible === 0 && q) ? 'block' : 'none';
                });
            }

            // ===== Auto uncheck all on load =====
            document.querySelectorAll('.gc-member input[type="checkbox"]').forEach(function(cb) {
                cb.checked = false;
            });
            </script>`;

if (src.includes(oldScript)) {
    src = src.replace(oldScript, function() { return newScript; });
    console.log('OK: search JS + auto-uncheck added');
} else {
    console.log('WARN: script pattern not found');
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('routes/group.js', src);
console.log('DONE');
