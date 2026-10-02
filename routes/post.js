const express = require('express');
const errorPage = require('../errorPage');
const router = express.Router();
const Post = require('../models/Post');

const EDIT_WINDOW_MS = 5 * 60 * 1000;
function canModifyPost(createdAt) {
    if (!createdAt) return false;
    return (Date.now() - new Date(createdAt).getTime()) < EDIT_WINDOW_MS;
}

const moodIcons = {
    happy: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>`,
    romantic: `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
    nature: `<svg viewBox="0 0 24 24"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>`,
    thoughtful: `<svg viewBox="0 0 24 24"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>`,
    excited: `<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
    calm: `<svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm-3.5-7c.83 0 1.5-.67 1.5-1.5S9.33 9 8.5 9 7 9.67 7 10.5 7.67 12 8.5 12zm7 0c.83 0 1.5-.67 1.5-1.5S16.33 9 15.5 9 14 9.67 14 10.5s.67 1.5 1.5 1.5zM12 17.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>`,
    music: `<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`,
    book: `<svg viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>`
};

// ===== 16 OBJECT SVG SCENES =====
const { images: postImages, labels: imageLabels } = require('../lib/svg-library');



const icons = {
    home: `<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    students: `<svg viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>`,
    plus: `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
    chat: `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`,
    profile: `<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
    back: `<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`,
    image: `<svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>`,
    close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`
};

function getBottomNav(active) {
    return `<div class="bottom-nav"><a href="/" class="${active === 'home' ? 'active' : ''}">${icons.home}<span>Home</span></a><a href="/post/create" class="${active === 'post' ? 'active' : ''}">${icons.plus}<span>Post</span></a><a href="/chat" class="${active === 'chat' ? 'active' : ''}">${icons.chat}<span>Chat</span></a><a href="/profile" class="${active === 'profile' ? 'active' : ''}">${icons.profile}<span>Profile</span></a></div>`;
}

// ===== NEW POST PAGE =====
router.get('/create', (req, res) => {
    const selectedImage = req.query.image || 'none';
    let attachPreview = '';
    if (selectedImage !== 'none' && postImages[selectedImage]) {
        attachPreview = `
            <div class="attached-preview">
                <div class="attached-preview-icon">${postImages[selectedImage]}</div>
                <div class="attached-preview-info">
                    <div class="attached-preview-label">${imageLabels[selectedImage]}</div>
                    <a href="/post/create" class="attached-preview-remove">Remove</a>
                </div>
            </div>
        `;
    }

    res.send(`
        <html><head><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.svg"></head><body>
        <div class="container">
            <header><a href="/" class="header-icon" title="Back">${icons.back}</a><span class="profile-title" style="flex:1;">New Post</span></header>
            <div class="form-card">
                <form action="/post/create" method="POST">
                    <div class="form-group">
                        <label>Your thoughts (Max 300 characters)</label>
                        <textarea name="body" rows="6" maxlength="300" required placeholder="What's on your mind?"></textarea>
                    </div>
                    <input type="hidden" name="post_image" value="${selectedImage}">

                    <div class="form-group">
                        <label>Attach an Icon</label>
                        ${attachPreview}
                        <a href="/post/svg-library?current=${selectedImage}" class="attach-svg-btn">
                            ${icons.image}
                            <span>${selectedImage === 'none' ? 'Attach SVG' : 'Change SVG'}</span>
                        </a>
                    </div>

                    <button type="submit" class="btn-full">Post</button>
                </form>
            </div>
        </div>
        ${getBottomNav('post')}
        </body></html>
    `);
});

// ===== SVG LIBRARY PAGE =====
router.get('/svg-library', (req, res) => {
    const currentImage = req.query.current || 'none';
    const fromEdit = req.query.from === 'edit' ? 'edit' : 'create';
    const postId = req.query.postId || '';

    const { images: postImages, labels: imageLabels, categories } = require('../lib/svg-library');

    const baseUrl = (key) => {
        if (fromEdit === 'edit') {
            return `/post/edit/${postId}?image=${key}`;
        }
        return `/post/create?image=${key}`;
    };

    let libraryHtml = '';
    // None option first
    libraryHtml += `
        <a href="${baseUrl('none')}" class="library-item ${currentImage === 'none' ? 'library-selected' : ''}" data-name="none">
            <div class="library-icon none-icon">${icons.close}</div>
            <span class="library-label">None</span>
        </a>
    `;

    // Group by category
    Object.keys(categories).forEach(cat => {
        const keys = categories[cat];
        libraryHtml += `<h3 class="library-cat-title" data-cat="${cat}">${cat}</h3>`;
        keys.forEach(key => {
            if (!postImages[key]) return;
            const selected = currentImage === key ? 'library-selected' : '';
            const name = (imageLabels[key] || key).toLowerCase();
            libraryHtml += `
                <a href="${baseUrl(key)}" class="library-item ${selected}" data-name="${name}" data-cat="${cat}">
                    <div class="library-icon">${postImages[key]}</div>
                    <span class="library-label">${imageLabels[key] || key}</span>
                </a>
            `;
        });
    });

    // Category tabs
    let catTabsHtml = `<button type="button" class="lib-tab active" onclick="libFilter('all', this)">All</button>`;
    Object.keys(categories).forEach(cat => {
        catTabsHtml += `<button type="button" class="lib-tab" onclick="libFilter('${cat}', this)">${cat}</button>`;
    });

    const backUrl = fromEdit === 'edit' ? `/post/edit/${postId}` : `/post/create${currentImage !== 'none' ? '?image=' + currentImage : ''}`;

    res.send(`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
        <title>SVG Library - EliGet</title>
        </head><body>
        <div class="container">
            <header class="feed-header">
                <a href="${backUrl}" class="header-icon" title="Back">${icons.back}</a>
                <h1 class="feed-title" style="margin-left:10px;">SVG Library</h1>
            </header>

            <form class="sp-search-form" onsubmit="return false;">
                <input type="text" id="libSearch" class="sp-search-input" placeholder="Search by name..." autocomplete="off">
            </form>

            <div class="sp-chips lib-tabs">${catTabsHtml}</div>

            <div class="library-grid" id="libraryGrid">${libraryHtml}</div>
            <p class="lib-empty" id="libEmpty" style="display:none;">No SVG found.</p>
        </div>
        <script>
            var activeCat = 'all';
            var libSearch = document.getElementById('libSearch');
            var items = document.querySelectorAll('.library-item');
            var catTitles = document.querySelectorAll('.library-cat-title');
            var libEmpty = document.getElementById('libEmpty');

            function applyFilter() {
                var q = (libSearch.value || '').toLowerCase().trim();
                var visible = 0;
                items.forEach(function(it) {
                    var name = it.getAttribute('data-name') || '';
                    var cat = it.getAttribute('data-cat') || '';
                    var catOk = (activeCat === 'all') || (cat === activeCat) || (name === 'none' && activeCat === 'all');
                    var searchOk = !q || name.indexOf(q) !== -1;
                    if (catOk && searchOk) {
                        it.style.display = '';
                        if (name !== 'none') visible++;
                    } else {
                        it.style.display = 'none';
                    }
                });
                // Show/hide category titles
                catTitles.forEach(function(t) {
                    var tCat = t.getAttribute('data-cat');
                    if (activeCat === 'all' && !q) t.style.display = '';
                    else t.style.display = 'none';
                });
                libEmpty.style.display = (visible === 0 && q) ? 'block' : 'none';
            }

            function libFilter(cat, btn) {
                activeCat = cat;
                document.querySelectorAll('.lib-tab').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                applyFilter();
            }

            if (libSearch) libSearch.addEventListener('input', applyFilter);
        </script>
        </body></html>
    `);
});

// ===== NEW POST PAGE =====
router.get('/create', (req, res) => {
    const selectedImage = req.query.image || 'none';
    let attachPreview = '';
    if (selectedImage !== 'none' && postImages[selectedImage]) {
        attachPreview = `
            <div class="attached-preview">
                <div class="attached-preview-icon">${postImages[selectedImage]}</div>
                <div class="attached-preview-info">
                    <div class="attached-preview-label">${imageLabels[selectedImage]}</div>
                    <a href="/post/create" class="attached-preview-remove">Remove</a>
                </div>
            </div>
        `;
    }

    res.send(`
        <html><head><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.svg"></head><body>
        <div class="container">
            <header><a href="/" class="header-icon" title="Back">${icons.back}</a><span class="profile-title" style="flex:1;">New Post</span></header>
            <div class="form-card">
                <form action="/post/create" method="POST">
                    <div class="form-group">
                        <label>Your thoughts (Max 300 characters)</label>
                        <textarea name="body" rows="6" maxlength="300" required placeholder="What's on your mind?"></textarea>
                    </div>
                    <input type="hidden" name="post_image" value="${selectedImage}">

                    <div class="form-group">
                        <label>Attach an Icon</label>
                        ${attachPreview}
                        <a href="/post/svg-library?current=${selectedImage}" class="attach-svg-btn">
                            ${icons.image}
                            <span>${selectedImage === 'none' ? 'Attach SVG' : 'Change SVG'}</span>
                        </a>
                    </div>

                    <button type="submit" class="btn-full">Post</button>
                </form>
            </div>
        </div>
        ${getBottomNav('post')}
        </body></html>
    `);
});

// ===== SVG LIBRARY PAGE =====
router.get('/svg-library', (req, res) => {
    const currentImage = req.query.current || 'none';
    const fromEdit = req.query.from === 'edit' ? 'edit' : 'create';
    const postId = req.query.postId || '';

    let libraryHtml = '';
    
    // None option first
    libraryHtml += `
        <a href="/post/create${fromEdit === 'edit' ? '?image=none&from=edit&postId=' + postId : '?image=none'}" class="library-item ${currentImage === 'none' ? 'library-selected' : ''}">
            <div class="library-icon none-icon">${icons.close}</div>
            <span class="library-label">None</span>
        </a>
    `;

    Object.keys(postImages).forEach(key => {
        const selected = currentImage === key ? 'library-selected' : '';
        const linkUrl = fromEdit === 'edit' 
            ? `/post/edit/${postId}?image=${key}` 
            : `/post/create?image=${key}`;
        libraryHtml += `
            <a href="${linkUrl}" class="library-item ${selected}">
                <div class="library-icon">${postImages[key]}</div>
                <span class="library-label">${imageLabels[key]}</span>
            </a>
        `;
    });

    res.send(`
        <html><head><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.svg"></head><body>
        <div class="container">
            <header>
                <a href="/post/create${currentImage !== 'none' ? '?image=' + currentImage : ''}" class="header-icon" title="Back">${icons.back}</a>
                <span class="profile-title" style="flex:1;">SVG Library</span>
            </header>
            <p style="color: #718096; font-size: 0.9rem; margin-bottom: 15px; text-align: center;">Pick an SVG to attach to your post</p>
            <div class="library-grid">
                ${libraryHtml}
            </div>
        </div>
        ${getBottomNav('post')}
        </body></html>
    `);
});

// ===== CREATE POST =====
router.post('/create', async (req, res) => {
    try {
        const { body, mood, post_image } = req.body;
        const newPost = new Post({
            author: req.session.user,
            body: body,
            mood: mood || 'none',
            image: post_image || 'none'
        });
        await newPost.save();
        res.redirect('/');
    } catch (error) {
        console.error('Post create error:', error);
        res.status(500).send(errorPage(500, 'Something went wrong', 'An unexpected error occurred. Please try again.', '/post/create', 'Back to create post'));
    }
});

// ===== EDIT POST PAGE =====
router.get('/edit/:id', async (req, res) => {
    try {
        const me = req.session.user;
        const post = await Post.findById(req.params.id);
        if (!post || post.author !== me) return res.redirect('/');
        if (!canModifyPost(post.created_at)) return res.redirect('/');

        // If image is selected from library, use query param; otherwise use post.image
        const selectedImage = req.query.image || post.image || 'none';

        let attachPreview = '';
        if (selectedImage !== 'none' && postImages[selectedImage]) {
            attachPreview = `
                <div class="attached-preview">
                    <div class="attached-preview-icon">${postImages[selectedImage]}</div>
                    <div class="attached-preview-info">
                        <div class="attached-preview-label">${imageLabels[selectedImage]}</div>
                        <a href="/post/edit/${post._id}?image=none" class="attached-preview-remove">Remove</a>
                    </div>
                </div>
            `;
        }

        res.send(`
            <html><head><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.svg"></head><body>
            <div class="container">
                <header><a href="/" class="header-icon" title="Back">${icons.back}</a><span class="profile-title" style="flex:1;">Edit Post</span></header>
                <div class="form-card">
                    <form action="/post/edit/${post._id}" method="POST">
                        <div class="form-group">
                            <label>Your thoughts (Max 300 characters)</label>
                            <textarea name="body" rows="6" maxlength="300" required>${post.body}</textarea>
                        </div>

                        <input type="hidden" name="post_image" value="${selectedImage}">

                        <div class="form-group">
                            <label>Attach an Icon</label>
                            ${attachPreview}
                            <a href="/post/svg-library?current=${selectedImage}&from=edit&postId=${post._id}" class="attach-svg-btn">
                                ${icons.image}
                                <span>${selectedImage === 'none' ? 'Attach SVG' : 'Change SVG'}</span>
                            </a>
                        </div>

                        <button type="submit" class="btn-full">Save Changes</button>
                    </form>
                </div>
            </div>
            ${getBottomNav('post')}
            </body></html>
        `);
    } catch (error) {
        console.error('Edit page error:', error);
        res.redirect('/');
    }
});

// ===== UPDATE POST =====
router.post('/edit/:id', async (req, res) => {
    try {
        const me = req.session.user;
        const post = await Post.findById(req.params.id);
        if (!post || post.author !== me) return res.redirect('/');
        if (!canModifyPost(post.created_at)) return res.redirect('/');

        post.body = req.body.body;
        post.mood = req.body.mood || 'none';
        post.image = req.body.post_image || 'none';
        post.edited = true;
        post.edited_at = new Date();
        await post.save();

        res.redirect('/');
    } catch (error) {
        console.error('Edit error:', error);
        res.redirect('/');
    }
});

// ===== DELETE POST =====
router.post('/delete/:id', async (req, res) => {
    try {
        const me = req.session.user;
        const post = await Post.findById(req.params.id);
        if (!post || post.author !== me) return res.redirect('/');
        if (!canModifyPost(post.created_at)) return res.redirect('/');

        await Post.deleteOne({ _id: req.params.id });
        res.redirect('/');
    } catch (error) {
        console.error('Delete error:', error);
        res.redirect('/');
    }
});

module.exports = router;
module.exports.postImages = postImages;
module.exports.imageLabels = imageLabels;
