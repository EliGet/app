const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

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

const icons = {
    home: `<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    plus: `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
    chat: `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`,
    profile: `<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
    back: `<svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>`
};

function getBottomNav(active) {
    return `<div class="bottom-nav"><a href="/" class="${active === 'home' ? 'active' : ''}">${icons.home}<span>Home</span></a><a href="/post/create" class="${active === 'post' ? 'active' : ''}">${icons.plus}<span>Post</span></a><a href="/chat" class="${active === 'chat' ? 'active' : ''}">${icons.chat}<span>Chat</span></a><a href="/profile" class="${active === 'profile' ? 'active' : ''}">${icons.profile}<span>Profile</span></a></div>`;
}

// New Post Page (GET)
router.get('/create', (req, res) => {
    const moods = [
        { key: 'happy', label: 'Happy' },
        { key: 'romantic', label: 'Romantic' },
        { key: 'nature', label: 'Nature' },
        { key: 'thoughtful', label: 'Thoughtful' },
        { key: 'excited', label: 'Excited' },
        { key: 'calm', label: 'Calm' },
        { key: 'music', label: 'Music' },
        { key: 'book', label: 'Book' }
    ];

    let moodOptionsHtml = '';
    moods.forEach((m, index) => {
        const isChecked = index === 0 ? 'checked' : '';
        const isSelected = index === 0 ? 'selected' : '';
        moodOptionsHtml += `<label class="mood-option ${isSelected}" onclick="selectMood(this)"><input type="radio" name="mood" value="${m.key}" ${isChecked}>${moodIcons[m.key]}<span>${m.label}</span></label>`;
    });

    res.send(`
        <html><head><link rel="stylesheet" href="/style.css"></head><body>
        <div class="container">
            <header><span class="profile-title">New Post</span><a href="/" class="header-icon" title="Back">${icons.back}</a></header>
            <div class="form-card">
                <form action="/post/create" method="POST">
                    <div class="form-group">
                        <label>Your thoughts (Max 300 characters)</label>
                        <textarea name="body" rows="8" maxlength="300" required placeholder="What's on your mind?"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Choose a Mood</label>
                        <div class="mood-grid">${moodOptionsHtml}</div>
                    </div>
                    <button type="submit" class="btn-full">Post</button>
                </form>
            </div>
        </div>
        ${getBottomNav('post')}
        <script>function selectMood(el){document.querySelectorAll('.mood-option').forEach(o=>o.classList.remove('selected'));el.classList.add('selected');}</script>
        </body></html>
    `);
});

// Create Post (POST)
router.post('/create', async (req, res) => {
    try {
        const { body, mood } = req.body;
        const newPost = new Post({
            author: req.session.user,
            body: body,
            mood: mood || 'happy'
        });
        await newPost.save();
        res.redirect('/');
    } catch (error) {
        console.error('Post create error:', error);
        res.send('Something went wrong. <a href="/post/create">Try again</a>');
    }
});

// Edit Post Page (GET)
router.get('/edit/:id', async (req, res) => {
    try {
        const me = req.session.user;
        const post = await Post.findById(req.params.id);

        if (!post) return res.redirect('/');
        if (post.author !== me) return res.redirect('/');

        const moods = [
            { key: 'happy', label: 'Happy' },
            { key: 'romantic', label: 'Romantic' },
            { key: 'nature', label: 'Nature' },
            { key: 'thoughtful', label: 'Thoughtful' },
            { key: 'excited', label: 'Excited' },
            { key: 'calm', label: 'Calm' },
            { key: 'music', label: 'Music' },
            { key: 'book', label: 'Book' }
        ];

        let moodOptionsHtml = '';
        moods.forEach((m) => {
            const isChecked = post.mood === m.key ? 'checked' : '';
            const isSelected = post.mood === m.key ? 'selected' : '';
            moodOptionsHtml += `<label class="mood-option ${isSelected}" onclick="selectMood(this)"><input type="radio" name="mood" value="${m.key}" ${isChecked}>${moodIcons[m.key]}<span>${m.label}</span></label>`;
        });

        res.send(`
            <html><head><link rel="stylesheet" href="/style.css"></head><body>
            <div class="container">
                <header><span class="profile-title">Edit Post</span><a href="/" class="header-icon" title="Back">${icons.back}</a></header>
                <div class="form-card">
                    <form action="/post/edit/${post._id}" method="POST">
                        <div class="form-group">
                            <label>Your thoughts (Max 300 characters)</label>
                            <textarea name="body" rows="8" maxlength="300" required>${post.body}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Choose a Mood</label>
                            <div class="mood-grid">${moodOptionsHtml}</div>
                        </div>
                        <button type="submit" class="btn-full">Save Changes</button>
                    </form>
                </div>
            </div>
            ${getBottomNav('post')}
            <script>function selectMood(el){document.querySelectorAll('.mood-option').forEach(o=>o.classList.remove('selected'));el.classList.add('selected');}</script>
            </body></html>
        `);
    } catch (error) {
        console.error('Edit page error:', error);
        res.redirect('/');
    }
});

// Update Post (POST)
router.post('/edit/:id', async (req, res) => {
    try {
        const me = req.session.user;
        const post = await Post.findById(req.params.id);

        if (!post || post.author !== me) return res.redirect('/');

        post.body = req.body.body;
        post.mood = req.body.mood || 'happy';
        post.edited = true;
        post.edited_at = new Date();
        await post.save();

        res.redirect('/');
    } catch (error) {
        console.error('Edit error:', error);
        res.redirect('/');
    }
});

// Delete Post (POST)
router.post('/delete/:id', async (req, res) => {
    try {
        const me = req.session.user;
        const post = await Post.findById(req.params.id);

        if (!post || post.author !== me) return res.redirect('/');

        await Post.deleteOne({ _id: req.params.id });
        res.redirect('/');
    } catch (error) {
        console.error('Delete error:', error);
        res.redirect('/');
    }
});

module.exports = router;
