const express = require('express');
const { linkifyChat } = require('../lib/linkify');
const errorPage = require('../errorPage');
const router = express.Router();
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');

const singleTick = `<span class="msg-tick sent"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>`;
const doubleTick = `<span class="msg-tick seen"><svg viewBox="0 0 24 24"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/></svg></span>`;

const icons = {
    home: `<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    students: `<svg viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>`,
    plus: `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
    chat: `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`,
    profile: `<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
    back: `<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`,
    group: `<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
    send: `<svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:#fff"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`
};

function getBottomNav(active) {
    return `<div class="bottom-nav"><a href="/" class="${active === 'home' ? 'active' : ''}">${icons.home}<span>Home</span></a><a href="/post/create" class="${active === 'post' ? 'active' : ''}">${icons.plus}<span>Post</span></a><a href="/chat" class="${active === 'chat' ? 'active' : ''}">${icons.chat}<span>Chat</span></a><a href="/profile" class="${active === 'profile' ? 'active' : ''}">${icons.profile}<span>Profile</span></a></div>`;
}

// ===== CREATE GROUP PAGE =====
router.get('/create', async (req, res) => {
    try {
        const me = req.session.user;

        // Get friends (accepted requests)
        // Get mutual follows for group members
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

        for (const username of friendUsernames) {
            const u = await User.findOne({ username });
            if (!u) continue;

            hasFriends = true;
            const displayName = u.full_name || u.username;
            const initial = displayName.charAt(0).toUpperCase();
            const avatarUrl = u.avatar ? `<img src="${u.avatar}" alt="Avatar">` : initial;

            memberItemsHtml += `
                <label class="gc-member">
                    <input type="checkbox" name="members" value="${u.username}">
                    <div class="gc-member-check">
                        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>
                    </div>
                    <div class="gc-member-avatar">${avatarUrl}</div>
                    <div class="gc-member-info">
                        <div class="gc-member-name">${displayName}</div>
                        <div class="gc-member-username">@${u.username}</div>
                    </div>
                </label>
            `;
        }

        if (!hasFriends) {
            memberItemsHtml = '<p class="gc-empty">No one to add yet. Follow people first — mutual follows can be group members.</p>';
        }


        res.send(`
            <html><head><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.svg"></head><body>
            <div class="container">
                <header>
                    <a href="/chat" class="header-icon" title="Back">${icons.back}</a>
                    <span class="profile-title" style="flex:1;">New Group</span>
                </header>
                <div class="form-card">
                    <form action="/group/create" method="POST">
                        <div class="form-group">
                            <label>Group Name</label>
                            <input type="text" name="group_name" required placeholder="e.g., Tech Talk" ${!hasFriends ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label>Group Avatar</label>
                            <input type="hidden" name="avatar_url" id="groupAvatarUrl" value="">
                            <div id="groupAvatarPreview" class="group-avatar-preview" style="display:none;">
                                <div class="group-avatar-preview-icon" id="groupAvatarPreviewIcon"></div>
                                <button type="button" class="group-avatar-change" onclick="openGroupAvatarModal()">Change</button>
                            </div>
                            <button type="button" class="group-avatar-build" id="groupAvatarBuild" onclick="openGroupAvatarModal()">
                                <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                                Build avatar
                            </button>
                        </div>
                        <div class="form-group">
                            <label>Select Members</label>
                            <input type="text" id="gcSearch" class="gc-search" placeholder="Search members..." autocomplete="off">
                            <div class="member-list" id="gcMemberList">${memberItemsHtml}</div>
                            <p class="gc-empty" id="gcNoResults" style="display:none;">No matching members.</p>
                        </div>
                        <button type="submit" class="btn-full" ${!hasFriends ? 'disabled' : ''}>Create Group</button>
                    </form>
                </div>
            </div>

            <div class="sp-svg-modal ga-modal" id="groupAvatarModal">
                <div class="sp-svg-modal-inner ga-modal-inner">
                    <div class="ga-head">
                        <button type="button" class="ga-head-btn" onclick="closeGroupAvatarModal()" aria-label="Close">
                            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
                        </button>
                        <span class="ga-head-title">Avatar</span>
                        <button type="button" class="ga-head-btn" onclick="gaShuffle()" aria-label="Shuffle">
                            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-8 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/></svg>
                        </button>
                    </div>

                    <div class="ga-preview">
                        <div class="ga-preview-frame">
                            <img id="gaPreviewImg" src="" alt="Group avatar">
                        </div>
                    </div>

                    <div class="ga-controls" id="gaControls"></div>

                    <div class="ga-actions">
                        <button type="button" class="ga-btn-reset" onclick="gaReset()">Reset</button>
                        <button type="button" class="ga-btn-save" onclick="gaSave()">Save avatar</button>
                    </div>
                </div>
            </div>

            ${getBottomNav('chat')}
            <script>
            var GA_STATE = {
                seed: 'Group',
                bg: 'b6e3f4',
                skinColor: 'edb98a',
                top: 'shortFlat',
                hairColor: 'a55728',
                eyes: 'happy',
                mouth: 'smile',
                eyebrows: 'default',
                accessories: '',
                facialHair: '',
                clothing: 'hoodie',
                clothesColor: '5199e4'
            };

            var GA_OPTIONS = {
                bg: [
                    { v: 'b6e3f4' }, { v: 'c0aede' }, { v: 'd1d4f9' }, { v: 'ffd5dc' },
                    { v: 'ffdfbf' }, { v: 'a8e6cf' }, { v: 'fddb92' }, { v: 'a0c4ff' },
                    { v: 'bdb2ff' }, { v: 'ffc6ff' }, { v: 'ffffff' }, { v: '1e293b' }
                ],
                skinColor: [
                    { v: 'ffdbb4' }, { v: 'edb98a' }, { v: 'd08b5b' },
                    { v: 'ae5d29' }, { v: '614335' }, { v: 'f8d25c' }
                ],
                hairColor: [
                    { v: 'a55728' }, { v: '2c1b18' }, { v: 'b58143' },
                    { v: 'd6b370' }, { v: '724133' }, { v: '4a312c' }
                ],
                top: [
                    { v: 'shortFlat', l: 'Short' },
                    { v: 'shortRound', l: 'Round' },
                    { v: 'theCaesar', l: 'Caesar' },
                    { v: 'bob', l: 'Bob' },
                    { v: 'bun', l: 'Bun' },
                    { v: 'curly', l: 'Curly' },
                    { v: 'fro', l: 'Fro' },
                    { v: 'hat', l: 'Hat' },
                    { v: 'winterHat1', l: 'Winter' },
                    { v: 'hijab', l: 'Hijab' }
                ],
                accessories: [
                    { v: '', l: 'None' },
                    { v: 'round', l: 'Round' },
                    { v: 'prescription02', l: 'Classic' },
                    { v: 'wayfarers', l: 'Wayfarer' },
                    { v: 'sunglasses', l: 'Sunglasses' }
                ],
                facialHair: [
                    { v: '', l: 'None' },
                    { v: 'beardMedium', l: 'Medium' },
                    { v: 'beardMajestic', l: 'Majestic' },
                    { v: 'moustacheFancy', l: 'Fancy' }
                ],
                clothing: [
                    { v: 'hoodie', l: 'Hoodie' },
                    { v: 'blazerAndShirt', l: 'Blazer' },
                    { v: 'shirtCrewNeck', l: 'Crew' },
                    { v: 'shirtVNeck', l: 'V-Neck' }
                ],
                clothesColor: [
                    { v: '262e33' }, { v: '65c9ff' }, { v: '5199e4' },
                    { v: '25557c' }, { v: 'ff5c5c' }, { v: 'a7ffc4' }
                ],
                eyes: [
                    { v: 'default', l: 'Normal' },
                    { v: 'happy', l: 'Happy' },
                    { v: 'wink', l: 'Wink' },
                    { v: 'squint', l: 'Squint' },
                    { v: 'surprised', l: 'Surprised' }
                ],
                mouth: [
                    { v: 'default', l: 'Normal' },
                    { v: 'smile', l: 'Smile' },
                    { v: 'twinkle', l: 'Twinkle' },
                    { v: 'serious', l: 'Serious' }
                ],
                eyebrows: [
                    { v: 'default', l: 'Normal' },
                    { v: 'raised', l: 'Raised' },
                    { v: 'angry', l: 'Angry' },
                    { v: 'concerned', l: 'Concerned' }
                ]
            };

            function gaComposeUrl() {
                var s = GA_STATE;
                var parts = ['seed=' + encodeURIComponent(s.seed)];
                parts.push('backgroundColor=' + s.bg);
                parts.push('skinColor=' + s.skinColor);
                parts.push('top=' + s.top);
                parts.push('hairColor=' + s.hairColor);
                parts.push('eyes=' + s.eyes);
                parts.push('mouth=' + s.mouth);
                parts.push('eyebrows=' + s.eyebrows);
                parts.push('clothing=' + s.clothing);
                parts.push('clothesColor=' + s.clothesColor);
                if (s.accessories) {
                    parts.push('accessories=' + s.accessories);
                    parts.push('accessoriesColor=262e33');
                    parts.push('accessoriesProbability=100');
                } else {
                    parts.push('accessoriesProbability=0');
                }
                if (s.facialHair) {
                    parts.push('facialHair=' + s.facialHair);
                    parts.push('facialHairColor=' + s.hairColor);
                    parts.push('facialHairProbability=100');
                } else {
                    parts.push('facialHairProbability=0');
                }
                return 'https://api.dicebear.com/7.x/avataaars/svg?' + parts.join('&');
            }

            function gaUpdatePreview() {
                var img = document.getElementById('gaPreviewImg');
                if (img) img.src = gaComposeUrl();
            }

            function gaRenderControls() {
                var box = document.getElementById('gaControls');
                var html = '';
                function colorGroup(label, key, opts) {
                    var h = '<div class="ab-group"><div class="ab-group-label">' + label + '</div><div class="ab-colors">';
                    opts.forEach(function(o) {
                        var active = GA_STATE[key] === o.v ? ' active' : '';
                        h += '<button type="button" class="ab-color' + active + '" style="background:#' + o.v + '" data-key="' + key + '" data-val="' + o.v + '" onclick="gaPick(this)"></button>';
                    });
                    h += '</div></div>';
                    return h;
                }
                function pillGroup(label, key, opts) {
                    var h = '<div class="ab-group"><div class="ab-group-label">' + label + '</div><div class="ab-pills">';
                    opts.forEach(function(o) {
                        var active = GA_STATE[key] === o.v ? ' active' : '';
                        h += '<button type="button" class="ab-pill' + active + '" data-key="' + key + '" data-val="' + o.v + '" onclick="gaPick(this)">' + o.l + '</button>';
                    });
                    h += '</div></div>';
                    return h;
                }
                html += colorGroup('Background', 'bg', GA_OPTIONS.bg);
                html += colorGroup('Skin', 'skinColor', GA_OPTIONS.skinColor);
                html += pillGroup('Hair', 'top', GA_OPTIONS.top);
                html += colorGroup('Hair color', 'hairColor', GA_OPTIONS.hairColor);
                html += pillGroup('Glasses', 'accessories', GA_OPTIONS.accessories);
                html += pillGroup('Beard', 'facialHair', GA_OPTIONS.facialHair);
                html += pillGroup('Dress', 'clothing', GA_OPTIONS.clothing);
                html += colorGroup('Dress color', 'clothesColor', GA_OPTIONS.clothesColor);
                html += pillGroup('Eyes', 'eyes', GA_OPTIONS.eyes);
                html += pillGroup('Mouth', 'mouth', GA_OPTIONS.mouth);
                html += pillGroup('Eyebrows', 'eyebrows', GA_OPTIONS.eyebrows);
                box.innerHTML = html;
            }

            function gaPick(btn) {
                var key = btn.getAttribute('data-key');
                var val = btn.getAttribute('data-val');
                GA_STATE[key] = val;
                var parent = btn.parentNode;
                parent.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                gaUpdatePreview();
            }

            function gaShuffle() {
                function pick(arr) { return arr[Math.floor(Math.random() * arr.length)].v; }
                GA_STATE.seed = 'g' + Math.random().toString(36).slice(2, 8);
                GA_STATE.bg = pick(GA_OPTIONS.bg);
                GA_STATE.skinColor = pick(GA_OPTIONS.skinColor);
                GA_STATE.top = pick(GA_OPTIONS.top);
                GA_STATE.hairColor = pick(GA_OPTIONS.hairColor);
                GA_STATE.eyes = pick(GA_OPTIONS.eyes);
                GA_STATE.mouth = pick(GA_OPTIONS.mouth);
                GA_STATE.eyebrows = pick(GA_OPTIONS.eyebrows);
                GA_STATE.accessories = pick(GA_OPTIONS.accessories);
                GA_STATE.facialHair = pick(GA_OPTIONS.facialHair);
                GA_STATE.clothing = pick(GA_OPTIONS.clothing);
                GA_STATE.clothesColor = pick(GA_OPTIONS.clothesColor);
                gaRenderControls();
                gaUpdatePreview();
            }

            function gaReset() {
                GA_STATE.seed = 'Group';
                GA_STATE.bg = 'b6e3f4';
                GA_STATE.skinColor = 'edb98a';
                GA_STATE.top = 'shortFlat';
                GA_STATE.hairColor = 'a55728';
                GA_STATE.eyes = 'happy';
                GA_STATE.mouth = 'smile';
                GA_STATE.eyebrows = 'default';
                GA_STATE.accessories = '';
                GA_STATE.facialHair = '';
                GA_STATE.clothing = 'hoodie';
                GA_STATE.clothesColor = '5199e4';
                gaRenderControls();
                gaUpdatePreview();
            }

            function openGroupAvatarModal() {
                document.getElementById('groupAvatarModal').classList.add('open');
                document.body.style.overflow = 'hidden';
                gaRenderControls();
                gaUpdatePreview();
            }

            function closeGroupAvatarModal() {
                document.getElementById('groupAvatarModal').classList.remove('open');
                document.body.style.overflow = '';
            }

            function gaSave() {
                var url = gaComposeUrl();
                document.getElementById('groupAvatarUrl').value = url;
                document.getElementById('groupAvatarPreviewIcon').innerHTML = '<img src="' + url + '" alt="">';
                document.getElementById('groupAvatarPreview').style.display = 'flex';
                document.getElementById('groupAvatarBuild').style.display = 'none';
                closeGroupAvatarModal();
            }

            document.getElementById('groupAvatarModal').addEventListener('click', function(e) {
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
            </script>
            </body></html>
        `);
    } catch (error) {
        console.error('Group create page error:', error);
        res.status(500).send(errorPage(500, 'Something went wrong', 'An unexpected error occurred. Please try again.', '/', 'Back to home'));
    }
});

// ===== CREATE GROUP POST =====
router.post('/create', async (req, res) => {
    try {
        const me = req.session.user;
        let { group_name, members, avatar_url } = req.body;
        if (!members) members = [];
        if (!Array.isArray(members)) members = [members];
        members.push(me);

        const newGroup = new Group({
            name: group_name,
            avatar: avatar_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=Group',
            creator: me,
            members: members
        });
        await newGroup.save();

        res.redirect(`/group/${newGroup._id}`);
    } catch (error) {
        console.error('Group create error:', error);
        res.status(500).send(errorPage(500, 'Something went wrong', 'An unexpected error occurred. Please try again.', '/group/create', 'Back to create group'));
    }
});

// ===== GROUP CHAT ROOM =====
router.get('/:id', async (req, res) => {
    try {
        const me = req.session.user;
        const groupId = req.params.id;

        const group = await Group.findById(groupId);
        if (!group || !group.members.includes(me)) {
            return res.redirect('/chat');
        }

        // Mark received messages as read
        await GroupMessage.updateMany(
            { group_id: groupId, from: { $ne: me }, read: false },
            { read: true }
        );

        const messages = await GroupMessage.find({ group_id: groupId }).sort({ created_at: 1 });

        let messagesHtml = '';
        if (messages.length === 0) {
            messagesHtml = '<p style="text-align:center; color:#a0aec0; padding: 20px;">No messages yet. Start the conversation!</p>';
        } else {
            let lastSender = null;
            let lastDay = null;
            for (const m of messages) {
                const isMe = m.from === me;
                const dLabel = (function(dt){
                    const now = new Date();
                    const d = new Date(dt);
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                    const diff = Math.floor((today - msgDay) / 86400000);
                    if (diff === 0) return 'Today';
                    if (diff === 1) return 'Yesterday';
                    if (diff < 7) return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
                    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                })(m.created_at);
                if (dLabel !== lastDay) {
                    messagesHtml += '<div class="msg-day-divider"><span>' + dLabel + '</span></div>';
                    lastDay = dLabel;
                    lastSender = null;
                }
                const senderUser = await User.findOne({ username: m.from });
                const senderName = senderUser ? (senderUser.full_name || senderUser.username) : m.from;
                const initial = senderName.charAt(0).toUpperCase();
                const avatarUrl = senderUser && senderUser.avatar ? `<img src="${senderUser.avatar}" alt="Avatar">` : initial;

                if (isMe) {
                    const tick = m.read ? doubleTick : singleTick;
                    messagesHtml += `
                        <div class="msg-row sent">
                            <div class="msg-content">
                                <div class="msg-bubble msg-sent-bubble">${linkifyChat(m.body)}${tick}</div>
                            </div>
                        </div>
                    `;
                } else {
                    const showLabel = (m.from !== lastSender);
                    const labelHtml = showLabel ? `<div class="msg-sender-name">${senderName}</div>` : '';
                    messagesHtml += `
                        <div class="msg-row received ${showLabel ? 'has-label' : 'no-label'}">
                            <div class="msg-content">
                                ${labelHtml}
                                <div class="msg-bubble msg-received-bubble">${linkifyChat(m.body)}</div>
                            </div>
                        </div>
                    `;
                }
                lastSender = m.from;
            }
        }

        const groupAvatarUrl = group.avatar ? `<img src="${group.avatar}" alt="Group Avatar" style="width:32px;height:32px;border-radius:50%;margin-right:10px;">` : '';
        const displayTitle = `<span style="display:flex; align-items:center;">${groupAvatarUrl} ${group.name}<span class="group-member-count">${group.members.length} members</span></span>`;

        res.send(`
            <html><head><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.svg"></head><body>
            <div class="container">
                <header>
                    <a href="/chat" class="header-icon" title="Back">${icons.back}</a>
                    <a href="/group/${group._id}/members" class="group-header-link" title="View members">
                        <span class="profile-title" style="flex:1;">${displayTitle}</span>
                    </a>
                </header>
                <div class="chat-container" id="chatContainer">${messagesHtml}</div>
                <form class="chat-form" action="/group/${group._id}" method="POST">
                    <input type="text" name="body" required placeholder="Type a message..." autocomplete="off">
                    <button type="submit" title="Send">${icons.send}</button>
                </form>
            </div>
            <script>
                const chatBox = document.getElementById('chatContainer');
                if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
                window.scrollTo(0, document.body.scrollHeight);

                let isTyping = false;
                const inputField = document.querySelector('.chat-form input');
                if (inputField) {
                    inputField.addEventListener('focus', () => { isTyping = true; });
                    inputField.addEventListener('blur', () => { isTyping = false; });
                    inputField.addEventListener('input', () => {
                        isTyping = true;
                        clearTimeout(window._typingTimer);
                        window._typingTimer = setTimeout(() => { isTyping = false; }, 3000);
                    });
                }

                setInterval(() => {
                    if (!isTyping) {
                        fetch(window.location.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                            .then(r => r.text())
                            .then(html => {
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(html, 'text/html');
                                const newBox = doc.getElementById('chatContainer');
                                const oldBox = document.getElementById('chatContainer');
                                if (newBox && oldBox && newBox.innerHTML !== oldBox.innerHTML) {
                                    oldBox.innerHTML = newBox.innerHTML;
                                    oldBox.scrollTop = oldBox.scrollHeight;
                                }
                            })
                            .catch(() => {});
                    }
                }, 5000);
            </script>
            </body></html>
        `);
    } catch (error) {
        console.error('Group room error:', error);
        res.redirect('/chat');
    }
});

// ===== SEND GROUP MESSAGE =====
// ===== GROUP MEMBERS LIST =====
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
            const avatarInner = m.avatar ? `<img src="${m.avatar}" alt="">` : m.initial;
            const roleBadge = m.isCreator ? '<span class="gm-role">Creator</span>' : '';
            const meBadge = m.isMe ? '<span class="gm-me">You</span>' : '';

            let removeBtn = '';
            if (isCreator && !m.isMe && !m.isCreator) {
                removeBtn = `
                    <form action="/group/${group._id}/remove-member" method="POST" style="margin:0;" onsubmit="return confirm('Remove ${m.displayName.replace(/'/g, "\\'")} from group?')">
                        <input type="hidden" name="username" value="${m.username}">
                        <button type="submit" class="gm-remove" title="Remove">
                            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
                        </button>
                    </form>
                `;
            }

            membersHtml += `
                <div class="gm-item">
                    <div class="gm-avatar">${avatarInner}</div>
                    <div class="gm-info">
                        <div class="gm-name">${m.displayName} ${roleBadge} ${meBadge}</div>
                        <div class="gm-username">@${m.username}</div>
                    </div>
                    ${removeBtn}
                </div>
            `;
        }

        res.send(`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
            <title>${group.name} · Members - EliGet</title>
            </head><body class="st-body">
            <div class="st-wrap">
                <header class="st-topbar">
                    <a href="/group/${group._id}" class="st-back" title="Back">
                        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>
                    </a>
                    <span class="st-title">Members</span>
                    <span class="st-spacer"></span>
                </header>

                <section class="st-section">
                    <h2 class="st-section-label">${group.name} · ${group.members.length} ${group.members.length === 1 ? 'member' : 'members'}</h2>
                    <div class="st-card gm-card">
                        ${membersHtml}
                    </div>
                </section>

                <section class="st-section">
                    <a href="/group/${group._id}/add-member" class="gm-add-btn">
                        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                        Add member
                    </a>
                </section>
            </div>
            </body></html>
        `);
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
            listHtml = `<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                <h3>No friends to add</h3>
                <p>All your friends are already in this group.</p>
            </div>`;
        } else {
            for (const c of candidates) {
                const avatarInner = c.avatar ? `<img src="${c.avatar}" alt="">` : c.initial;
                listHtml += `
                    <label class="gm-item gm-selectable">
                        <input type="checkbox" name="members" value="${c.username}" class="gm-check">
                        <div class="gm-avatar">${avatarInner}</div>
                        <div class="gm-info">
                            <div class="gm-name">${c.displayName}</div>
                            <div class="gm-username">@${c.username}</div>
                        </div>
                    </label>
                `;
            }
        }

        res.send(`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
            <title>Add members - EliGet</title>
            </head><body class="st-body">
            <div class="st-wrap">
                <header class="st-topbar">
                    <a href="/group/${group._id}/members" class="st-back" title="Back">
                        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>
                    </a>
                    <span class="st-title">Add members</span>
                    <span class="st-spacer"></span>
                </header>

                <section class="st-section">
                    <h2 class="st-section-label">Add to ${group.name}</h2>
                    ${candidates.length > 0 ? `
                        <form action="/group/${group._id}/add-member" method="POST" id="addMemberForm">
                            <div class="st-card gm-card gm-select-list">${listHtml}</div>
                            <button type="submit" class="gm-save-btn" id="gmSaveBtn" disabled>
                                Add <span id="gmCount">0</span> member(s)
                            </button>
                        </form>
                    ` : `<div class="st-card gm-card">${listHtml}</div>`}
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
        `);
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

router.post('/:id', async (req, res) => {
    try {
        const me = req.session.user;
        const groupId = req.params.id;

        await GroupMessage.create({
            group_id: groupId,
            from: me,
            body: req.body.body,
            read: false
        });

        res.redirect(`/group/${groupId}`);
    } catch (error) {
        console.error('Group message error:', error);
        res.redirect('/chat');
    }
});

module.exports = router;
