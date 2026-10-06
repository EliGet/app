const express = require('express');
const router = express.Router();
const StudentPost = require('../models/StudentPost');
const User = require('../models/User');
const svgLib = require('../lib/svg-library');

const icons = {
    home: `<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    students: `<svg viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>`,
    plus: `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
    chat: `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`,
    profile: `<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
    back: `<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`
};

const SUBJECTS = ['Bangla','English','Math','Physics','Chemistry','Biology','ICT','History','General'];

const TYPES = [
    { key: 'question', label: 'Question', desc: 'Ask a question' },
    { key: 'blog', label: 'Blog', desc: 'Personal writing' },
    { key: 'notes', label: 'Notes', desc: 'Study notes' },
    { key: 'essay', label: 'Essay', desc: 'Long-form writing' },
    { key: 'mcq', label: 'MCQ', desc: 'Multiple choice' },
    { key: 'poll', label: 'Poll', desc: 'Opinion voting' }
];

const TYPE_LABELS = {
    question: 'Question', blog: 'Blog', notes: 'Notes',
    essay: 'Essay', mcq: 'MCQ', poll: 'Poll'
};

function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h';
    const d = Math.floor(h / 24);
    if (d < 7) return d + 'd';
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getBottomNav(active) {
    return `<div class="bottom-nav">
        <a href="/" class="${active === 'home' ? 'active' : ''}">${icons.home}<span>Home</span></a>
        <a href="/students" class="${active === 'students' ? 'active' : ''}">${icons.students}<span>Students</span></a>
        <a href="/post/create" class="${active === 'post' ? 'active' : ''}">${icons.plus}<span>Post</span></a>
        <a href="/chat" class="${active === 'chat' ? 'active' : ''}">${icons.chat}<span>Chat</span></a>
        <a href="/profile" class="${active === 'profile' ? 'active' : ''}">${icons.profile}<span>Profile</span></a>
    </div>`;
}

// FEED
router.get('/', async (req, res) => {
    try {
        const me = req.session.user;
        const filter = req.query.filter || 'all';
        const subject = req.query.subject || 'all';
        const q = (req.query.q || '').trim();

        const query = {};
        if (filter === 'questions') query.type = 'question';
        else if (filter === 'mcq') query.type = 'mcq';
        else if (filter === 'polls') query.type = 'poll';
        else if (filter === 'notes') query.type = 'notes';
        else if (filter === 'blogs') query.type = { $in: ['blog', 'essay'] };
        if (subject !== 'all') query.subject = subject;
        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { body: { $regex: q, $options: 'i' } }
            ];
        }

        const posts = await StudentPost.find(query).sort({ created_at: -1 }).limit(50);

        let feedHtml = '';
        if (posts.length === 0) {
            feedHtml = `<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3z"/></svg>
                <h3>Nothing here yet</h3>
                <p>Be the first to share a question, note, or blog.</p>
                <a href="/students/new">Write something</a>
            </div>`;
        } else {
            for (const p of posts) {
                const author = await User.findOne({ username: p.author });
                const dn = author ? (author.full_name || author.username) : p.author;
                const initial = dn.charAt(0).toUpperCase();
                const av = author && author.avatar ? `<img src="${author.avatar}" alt="">` : initial;
                const preview = p.body ? (p.body.length > 180 ? p.body.slice(0, 180) + '…' : p.body) : '';
                const voteCount = Object.keys(p.votes || {}).length;
                const voteMeta = (p.type === 'mcq' || p.type === 'poll')
                    ? ` <span class="sp-meta-dot">·</span> <span>${voteCount} vote${voteCount === 1 ? '' : 's'}</span>`
                    : '';
                const typeClass = 'sp-type-' + p.type;

                feedHtml += `
                    <a href="/students/${p._id}" class="sp-card">
                        <div class="sp-card-head">
                            <div class="sp-avatar">${av}</div>
                            <div class="sp-author-info">
                                <div class="sp-author-name">${escapeHtml(dn)}</div>
                                <div class="sp-card-meta"><span>${timeAgo(p.created_at)}</span>${voteMeta}</div>
                            </div>
                            <span class="sp-type-badge ${typeClass}">${TYPE_LABELS[p.type] || p.type}</span>
                        </div>
                        ${p.title ? `<h3 class="sp-card-title">${escapeHtml(p.title)}</h3>` : ''}
                        ${(p.svgs && p.svgs.length && svgLib.images[p.svgs[0]]) ? `<div class="sp-card-svg">${svgLib.images[p.svgs[0]]}</div>` : ''}
                        ${preview ? `<p class="sp-card-preview">${escapeHtml(preview)}</p>` : ''}
                        <div class="sp-card-footer">
                            <span class="sp-subject-chip">${escapeHtml(p.subject)}</span>
                            ${p.helpfulCount > 0 ? `<span class="sp-helpful-count">${p.helpfulCount} helpful</span>` : ''}
                        </div>
                    </a>
                `;
            }
        }

        const filters = [
            { k: 'all', l: 'All' },
            { k: 'questions', l: 'Questions' },
            { k: 'mcq', l: 'MCQ' },
            { k: 'polls', l: 'Polls' },
            { k: 'notes', l: 'Notes' },
            { k: 'blogs', l: 'Blogs' }
        ];
        let filterChips = '';
        for (const f of filters) {
            const url = `/students?filter=${f.k}${subject !== 'all' ? '&subject=' + encodeURIComponent(subject) : ''}${q ? '&q=' + encodeURIComponent(q) : ''}`;
            filterChips += `<a href="${url}" class="sp-chip ${filter === f.k ? 'active' : ''}">${f.l}</a>`;
        }

        res.send(`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
            <title>Students - EliGet</title>
            </head><body>
            <div class="container">
                <header class="feed-header">
                    <h1 class="feed-title">Students</h1>
                    <a href="/students/new" class="header-icon" title="New">${icons.plus}</a>
                </header>

                <form action="/students" method="GET" class="sp-search-form">
                    ${filter !== 'all' ? `<input type="hidden" name="filter" value="${filter}">` : ''}
                    <input type="text" name="q" value="${escapeHtml(q)}" placeholder="Search students..." class="sp-search-input">
                </form>

                <div class="sp-chips">${filterChips}</div>

                <div class="sp-feed">${feedHtml}</div>
            </div>
            ${getBottomNav('students')}
            </body></html>
        `);
    } catch (err) {
        console.error('Students feed error:', err);
        res.redirect('/');
    }
});

// SVG LIBRARY API (JSON for modal picker)
router.get('/api/svgs', (req, res) => {
    const { images, labels, categories } = require('../lib/svg-library');
    res.json({ images: images, labels: labels, categories: categories });
});

// NEW POST PAGE
router.get('/new', async (req, res) => {
    let typeOptionsHtml = '';
    for (const t of TYPES) {
        typeOptionsHtml += `<label class="sp-type-option"><input type="radio" name="type" value="${t.key}" required><span class="sp-type-label">${t.label}</span><span class="sp-type-desc">${t.desc}</span></label>`;
    }
    let subjectOptionsHtml = '';
    for (const s of SUBJECTS) {
        subjectOptionsHtml += `<option value="${s}">${s}</option>`;
    }

    res.send(`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <title>New Post - Students - EliGet</title>
        </head><body>
        <div class="container">
            <header class="feed-header">
                <a href="/students" class="header-icon" title="Back">${icons.back}</a>
                <h1 class="feed-title" style="margin-left:10px;">New Post</h1>
            </header>

            <form action="/students/create" method="POST" class="sp-form">
                <div class="form-group">
                    <label class="sp-label">Type</label>
                    <div class="sp-type-grid">${typeOptionsHtml}</div>
                </div>

                <div class="form-group">
                    <label class="sp-label">Subject</label>
                    <select name="subject" class="sp-select">${subjectOptionsHtml}</select>
                </div>

                <div class="form-group">
                    <label class="sp-label">Title (optional)</label>
                    <input type="text" name="title" maxlength="100" placeholder="Short title" class="sp-input">
                </div>

                <div class="form-group">
                    <label class="sp-label">Body</label>
                    <textarea name="body" rows="8" maxlength="2000" placeholder="Write here..." class="sp-textarea"></textarea>
                </div>

                <div class="form-group">
                    <label class="sp-label">Decoration SVG (optional)</label>
                    <input type="hidden" name="svg" id="svgInput" value="none">
                    <div id="svgPreview" class="sp-svg-preview" style="display:none;">
                        <div class="sp-svg-preview-icon" id="svgPreviewIcon"></div>
                        <div class="sp-svg-preview-info">
                            <div class="sp-svg-preview-label" id="svgPreviewLabel">SVG</div>
                            <button type="button" class="sp-svg-remove" onclick="clearSvg()">Remove</button>
                        </div>
                    </div>
                    <button type="button" class="sp-svg-attach" onclick="openSvgModal()">
                        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                        <span id="svgAttachLabel">Attach SVG</span>
                    </button>
                </div>

                <div class="form-group" id="optionsBlock" style="display:none;">
                    <label class="sp-label">Options (2-6)</label>
                    <div id="optionsList">
                        <input type="text" name="opt1" maxlength="80" placeholder="Option 1" class="sp-input sp-opt">
                        <input type="text" name="opt2" maxlength="80" placeholder="Option 2" class="sp-input sp-opt">
                        <input type="text" name="opt3" maxlength="80" placeholder="Option 3 (optional)" class="sp-input sp-opt">
                        <input type="text" name="opt4" maxlength="80" placeholder="Option 4 (optional)" class="sp-input sp-opt">
                        <input type="text" name="opt5" maxlength="80" placeholder="Option 5 (optional)" class="sp-input sp-opt">
                        <input type="text" name="opt6" maxlength="80" placeholder="Option 6 (optional)" class="sp-input sp-opt">
                    </div>
                </div>

                <button type="submit" class="btn-full">Post</button>
            </form>
        </div>
        ${getBottomNav('students')}

        <div class="sp-svg-modal" id="svgModal">
            <div class="sp-svg-modal-inner">
                <div class="sp-svg-modal-head">
                    <span class="sp-svg-modal-title">Choose a decoration</span>
                    <button type="button" class="sp-svg-modal-close" onclick="closeSvgModal()" aria-label="Close">
                        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
                    </button>
                </div>
                <div class="sp-svg-modal-search">
                    <input type="text" id="svgSearch" class="sp-search-input" placeholder="Search SVG..." autocomplete="off">
                </div>
                <div class="sp-chips sp-svg-modal-tabs" id="svgTabs"></div>
                <div class="sp-svg-modal-grid" id="svgGrid"></div>
                <div class="sp-svg-modal-empty" id="svgEmpty" style="display:none;">No SVG found.</div>
            </div>
        </div>

        <script>
            var typeRadios = document.querySelectorAll('input[name="type"]');
            var optionsBlock = document.getElementById('optionsBlock');
            function updateOptionsVisibility() {
                var sel = document.querySelector('input[name="type"]:checked');
                var v = sel ? sel.value : '';
                optionsBlock.style.display = (v === 'mcq' || v === 'poll') ? 'block' : 'none';
            }
            typeRadios.forEach(function(r) { r.addEventListener('change', updateOptionsVisibility); });
            updateOptionsVisibility();

            var svgLibrary = null;
            var svgActiveCat = 'all';

            function openSvgModal() {
                var modal = document.getElementById('svgModal');
                modal.classList.add('open');
                document.body.style.overflow = 'hidden';
                if (!svgLibrary) {
                    fetch('/students/api/svgs', { credentials: 'same-origin' })
                        .then(function(r) { return r.json(); })
                        .then(function(data) {
                            svgLibrary = data;
                            renderSvgTabs();
                            renderSvgGrid();
                        })
                        .catch(function() {
                            document.getElementById('svgGrid').innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#94a3b8;padding:20px;">Could not load library.</p>';
                        });
                }
            }

            function closeSvgModal() {
                document.getElementById('svgModal').classList.remove('open');
                document.body.style.overflow = '';
            }

            function renderSvgTabs() {
                var tabs = document.getElementById('svgTabs');
                var html = '<button type="button" class="lib-tab active" data-cat="all" onclick="pickSvgCat(this)">All</button>';
                Object.keys(svgLibrary.categories).forEach(function(cat) {
                    html += '<button type="button" class="lib-tab" data-cat="' + cat + '" onclick="pickSvgCat(this)">' + cat + '</button>';
                });
                tabs.innerHTML = html;
            }

            function pickSvgCat(btn) {
                var cat = btn.getAttribute('data-cat') || 'all';
                svgActiveCat = cat;
                document.querySelectorAll('#svgTabs .lib-tab').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                var si = document.getElementById('svgSearch');
                if (si) si.value = '';
                renderSvgGrid();
            }

            function renderSvgGrid() {
                if (!svgLibrary) return;
                var q = (document.getElementById('svgSearch').value || '').toLowerCase().trim();
                var grid = document.getElementById('svgGrid');
                var empty = document.getElementById('svgEmpty');
                var items = [];

                Object.keys(svgLibrary.categories).forEach(function(cat) {
                    if (svgActiveCat !== 'all' && cat !== svgActiveCat) return;
                    svgLibrary.categories[cat].forEach(function(key) {
                        var label = svgLibrary.labels[key] || key;
                        if (q && label.toLowerCase().indexOf(q) === -1 && key.toLowerCase().indexOf(q) === -1) return;
                        items.push({ key: key, label: label, svg: svgLibrary.images[key] });
                    });
                });

                if (items.length === 0) {
                    grid.innerHTML = '';
                    empty.style.display = 'block';
                    return;
                }
                empty.style.display = 'none';

                var html = '';
                items.forEach(function(it) {
                    html += '<button type="button" class="sp-svg-tile" data-key="' + it.key + '" onclick="pickSvgFromTile(this)">'
                        + '<div class="sp-svg-tile-icon">' + it.svg + '</div>'
                        + '<span class="sp-svg-tile-label">' + it.label + '</span>'
                        + '</button>';
                });
                grid.innerHTML = html;
            }

            function pickSvgFromTile(btn) {
                var key = btn.getAttribute('data-key');
                if (key) pickSvg(key);
            }

            function pickSvg(key) {
                if (!svgLibrary) return;
                document.getElementById('svgInput').value = key;
                document.getElementById('svgPreviewIcon').innerHTML = svgLibrary.images[key];
                document.getElementById('svgPreviewLabel').textContent = svgLibrary.labels[key] || key;
                document.getElementById('svgPreview').style.display = 'flex';
                document.getElementById('svgAttachLabel').textContent = 'Change SVG';
                closeSvgModal();
            }

            function clearSvg() {
                document.getElementById('svgInput').value = 'none';
                document.getElementById('svgPreview').style.display = 'none';
                document.getElementById('svgAttachLabel').textContent = 'Attach SVG';
            }

            var searchInput = document.getElementById('svgSearch');
            if (searchInput) searchInput.addEventListener('input', renderSvgGrid);

            var svgModalEl = document.getElementById('svgModal');
            if (svgModalEl) {
                svgModalEl.addEventListener('click', function(e) {
                    if (e.target === this) closeSvgModal();
                });
            }
        </script>
        </body></html>
    `);
});

// CREATE POST
router.post('/create', async (req, res) => {
    try {
        const me = req.session.user;
        const type = req.body.type;
        const subject = req.body.subject;
        const title = req.body.title || '';
        const body = req.body.body || '';

        if (!['question','blog','notes','essay','mcq','poll'].includes(type)) {
            return res.redirect('/students/new');
        }

        const options = [];
        if (type === 'mcq' || type === 'poll') {
            for (let i = 1; i <= 6; i++) {
                const v = (req.body['opt' + i] || '').trim();
                if (v) options.push({ label: v, count: 0, correct: false });
            }
            if (options.length < 2) return res.redirect('/students/new');
        } else {
            if (!body.trim()) return res.redirect('/students/new');
        }

        await StudentPost.create({
            author: me,
            type: type,
            subject: SUBJECTS.includes(subject) ? subject : 'General',
            title: String(title).slice(0, 100),
            body: String(body).slice(0, 2000),
            svgs: (function() {
                var k = (req.body.svg || 'none').trim();
                return (k && k !== 'none') ? [k] : [];
            })(),
            options: options,
            votes: {},
            helpfulCount: 0,
            helpfulBy: []
        });

        res.redirect('/students');
    } catch (err) {
        console.error('Create student post error:', err);
        res.redirect('/students/new');
    }
});

// POST DETAIL
router.get('/:id', async (req, res) => {
    try {
        const me = req.session.user;
        const post = await StudentPost.findById(req.params.id);
        if (!post) return res.redirect('/students');

        const author = await User.findOne({ username: post.author });
        const dn = author ? (author.full_name || author.username) : post.author;
        const initial = dn.charAt(0).toUpperCase();
        const av = author && author.avatar ? `<img src="${author.avatar}" alt="">` : initial;

        let bodyHtml = '';
        if (post.body) {
            bodyHtml = `<div class="sp-detail-body">${escapeHtml(post.body).replace(/\n/g, '<br>')}</div>`;
        }

        let optionsHtml = '';
        if (post.type === 'mcq' || post.type === 'poll') {
            const votes = post.votes || {};
            const myVote = votes[me];
            const totalVotes = Object.keys(votes).length;
            const hasVoted = typeof myVote === 'number';

            optionsHtml += '<div class="sp-options">';
            post.options.forEach((opt, i) => {
                const count = opt.count || 0;
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                const isMyPick = hasVoted && myVote === i;
                const correctClass = hasVoted && opt.correct ? ' correct' : '';
                const myClass = isMyPick ? ' my-pick' : '';
                optionsHtml += `
                    <button type="button" class="sp-option${myClass}${correctClass}" onclick="voteOption('${post._id}', ${i})">
                        <span class="sp-option-label">${escapeHtml(opt.label)}</span>
                        ${hasVoted ? `<span class="sp-option-bar"><span class="sp-option-fill" style="width:${pct}%"></span></span><span class="sp-option-pct">${pct}%</span>` : ''}
                    </button>
                `;
            });
            optionsHtml += '</div>';
            optionsHtml += `<p class="sp-total-votes">${totalVotes} vote${totalVotes === 1 ? '' : 's'}</p>`;
        }

        const isHelpfulType = ['question','blog','notes','essay'].includes(post.type);
        const alreadyHelpful = (post.helpfulBy || []).includes(me);
        const helpfulBtn = isHelpfulType ? `
            <button type="button" class="sp-helpful-btn ${alreadyHelpful ? 'active' : ''}" data-id="${post._id}" onclick="toggleHelpful(this)">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg>
                <span class="sp-helpful-text">${post.helpfulCount || 0} helpful</span>
            </button>
        ` : '';

        const isOwner = post.author === me;
        const ownerActions = isOwner ? `
            <form action="/students/${post._id}/delete" method="POST" onsubmit="return confirm('Delete this post?')" style="margin:0;">
                <button type="submit" class="sp-delete-btn">
                    <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
                    Delete
                </button>
            </form>
        ` : '';

        res.send(`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <title>${escapeHtml(post.title || 'Post')} - Students - EliGet</title>
            </head><body>
            <div class="container">
                <header class="feed-header">
                    <a href="/students" class="header-icon" title="Back">${icons.back}</a>
                    <h1 class="feed-title" style="margin-left:10px;">${TYPE_LABELS[post.type] || 'Post'}</h1>
                    ${ownerActions}
                </header>

                <div class="sp-detail">
                    <div class="sp-detail-head">
                        <div class="sp-avatar">${av}</div>
                        <div>
                            <div class="sp-author-name">${escapeHtml(dn)}</div>
                            <div class="sp-card-meta"><span>${timeAgo(post.created_at)}</span> <span class="sp-meta-dot">·</span> <span class="sp-subject-chip-inline">${escapeHtml(post.subject)}</span></div>
                        </div>
                    </div>
                    ${post.title ? `<h2 class="sp-detail-title">${escapeHtml(post.title)}</h2>` : ''}
                    ${(post.svgs && post.svgs.length && svgLib.images[post.svgs[0]]) ? `<div class="sp-detail-svg">${svgLib.images[post.svgs[0]]}</div>` : ''}
                    ${bodyHtml}
                    ${optionsHtml}
                    <div class="sp-detail-actions">
                        ${helpfulBtn}
                    </div>
                </div>
            </div>
            ${getBottomNav('students')}
            <script>
                function voteOption(postId, index) {
                    fetch('/students/' + postId + '/vote', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify({ optionIndex: index })
                    })
                    .then(function(r) { return r.json(); })
                    .then(function(data) {
                        if (data.ok) { location.reload(); }
                        else { alert('Could not vote. Try again.'); }
                    });
                }
                function toggleHelpful(btn) {
                    var postId = btn.getAttribute('data-id');
                    fetch('/students/' + postId + '/helpful', {
                        method: 'POST',
                        credentials: 'same-origin'
                    })
                    .then(function(r) { return r.json(); })
                    .then(function(data) {
                        if (data.ok) {
                            btn.classList.toggle('active', data.helpful);
                            var t = btn.querySelector('.sp-helpful-text');
                            if (t) t.textContent = data.count + ' helpful';
                        }
                    });
                }
            </script>
            </body></html>
        `);
    } catch (err) {
        console.error('Student post detail error:', err);
        res.redirect('/students');
    }
});

// VOTE
router.post('/:id/vote', async (req, res) => {
    try {
        const me = req.session.user;
        const post = await StudentPost.findById(req.params.id);
        if (!post) return res.json({ ok: false });
        if (post.type !== 'mcq' && post.type !== 'poll') return res.json({ ok: false });
        if (post.author === me) return res.json({ ok: false, reason: 'own' });

        const idx = parseInt(req.body.optionIndex, 10);
        if (isNaN(idx) || idx < 0 || idx >= post.options.length) return res.json({ ok: false });

        if (!post.votes) post.votes = {};
        const prev = post.votes[me];

        if (typeof prev === 'number') {
            if (prev === idx) {
                if (post.options[prev]) post.options[prev].count = Math.max(0, (post.options[prev].count || 0) - 1);
                delete post.votes[me];
            } else {
                if (post.options[prev]) post.options[prev].count = Math.max(0, (post.options[prev].count || 0) - 1);
                post.options[idx].count = (post.options[idx].count || 0) + 1;
                post.votes[me] = idx;
            }
        } else {
            post.options[idx].count = (post.options[idx].count || 0) + 1;
            post.votes[me] = idx;
        }
        post.markModified('votes');
        post.markModified('options');
        await post.save();
        res.json({ ok: true });
    } catch (err) {
        console.error('Vote error:', err);
        res.json({ ok: false });
    }
});

// HELPFUL
router.post('/:id/helpful', async (req, res) => {
    try {
        const me = req.session.user;
        const post = await StudentPost.findById(req.params.id);
        if (!post) return res.json({ ok: false });
        if (!['question','blog','notes','essay'].includes(post.type)) return res.json({ ok: false });

        if (!post.helpfulBy) post.helpfulBy = [];
        const idx = post.helpfulBy.indexOf(me);
        if (idx === -1) {
            post.helpfulBy.push(me);
        } else {
            post.helpfulBy.splice(idx, 1);
        }
        post.helpfulCount = post.helpfulBy.length;
        await post.save();
        res.json({ ok: true, helpful: idx === -1, count: post.helpfulCount });
    } catch (err) {
        res.json({ ok: false });
    }
});

// DELETE
router.post('/:id/delete', async (req, res) => {
    try {
        const me = req.session.user;
        const post = await StudentPost.findById(req.params.id);
        if (!post || post.author !== me) return res.redirect('/students');
        await StudentPost.deleteOne({ _id: post._id });
        res.redirect('/students');
    } catch (err) {
        res.redirect('/students');
    }
});

module.exports = router;
