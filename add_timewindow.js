const fs = require('fs');

// ============ server.js ============
let srv = fs.readFileSync('server.js', 'utf8');

// 1. canModifyPost helper — before renderPostCard
if (!srv.includes('function canModifyPost')) {
    const marker = 'async function renderPostCard(p, currentUser, followSet) {';
    if (!srv.includes(marker)) { console.log('ERROR: renderPostCard marker not found'); process.exit(1); }
    const helper = `// 5-minute edit/delete window
const EDIT_WINDOW_MS = 5 * 60 * 1000;
function canModifyPost(createdAt) {
    if (!createdAt) return false;
    return (Date.now() - new Date(createdAt).getTime()) < EDIT_WINDOW_MS;
}

async function renderPostCard(p, currentUser, followSet) {`;
    srv = srv.replace(marker, helper);
    console.log('OK: canModifyPost helper added');
}

// 2. Modify menuHtml condition — only if within window
const oldMenuCond = `    let menuHtml = '';
    if (currentUser && currentUser === p.author) {`;
const newMenuCond = `    let menuHtml = '';
    if (currentUser && currentUser === p.author && canModifyPost(p.created_at)) {`;
if (srv.includes(oldMenuCond)) {
    srv = srv.replace(oldMenuCond, function() { return newMenuCond; });
    console.log('OK: renderPostCard menu conditional');
} else {
    console.log('WARN: menu conditional not found');
}

// 3. Show "Locked" indicator if own post + window expired
const editedMarker = `    const editedLabel = p.edited ? ' <span style="font-size:0.7rem;color:#a0aec0;font-weight:400;">(edited)</span>' : '';`;
const lockedIndicator = `    const editedLabel = p.edited ? ' <span style="font-size:0.7rem;color:#a0aec0;font-weight:400;">(edited)</span>' : '';
    const isLocked = currentUser && currentUser === p.author && !canModifyPost(p.created_at);`;

if (srv.includes(editedMarker) && !srv.includes('const isLocked')) {
    srv = srv.replace(editedMarker, function() { return lockedIndicator; });
    console.log('OK: isLocked var added');
} else if (srv.includes('const isLocked')) {
    console.log('SKIP: isLocked already there');
} else {
    console.log('WARN: editedLabel marker not found');
}

fs.writeFileSync('server.js', srv);

// ============ routes/post.js ============
let pst = fs.readFileSync('routes/post.js', 'utf8');

// Add helper at top
if (!pst.includes('canModifyPost')) {
    const reqMarker = "const Post = require('../models/Post');";
    if (!pst.includes(reqMarker)) { console.log('ERROR: Post require not found'); process.exit(1); }
    const helper = `const Post = require('../models/Post');

const EDIT_WINDOW_MS = 5 * 60 * 1000;
function canModifyPost(createdAt) {
    if (!createdAt) return false;
    return (Date.now() - new Date(createdAt).getTime()) < EDIT_WINDOW_MS;
}`;
    pst = pst.replace(reqMarker, helper);
    console.log('OK: routes/post.js helper added');
}

// Edit GET — check window
const editGetOld = `        const me = req.session.user;
        const post = await Post.findById(req.params.id);
        if (!post || post.author !== me) return res.redirect('/');`;
const editGetNew = `        const me = req.session.user;
        const post = await Post.findById(req.params.id);
        if (!post || post.author !== me) return res.redirect('/');
        if (!canModifyPost(post.created_at)) return res.redirect('/');`;

if (pst.includes(editGetOld)) {
    pst = pst.replace(editGetOld, function() { return editGetNew; });
    console.log('OK: edit GET window check');
} else {
    console.log('WARN: edit GET pattern not found');
}

// Edit POST — check window
const editPostOld = `router.post('/edit/:id', async (req, res) => {
    try {
        const me = req.session.user;
        const post = await Post.findById(req.params.id);
        if (!post || post.author !== me) return res.redirect('/');`;
const editPostNew = `router.post('/edit/:id', async (req, res) => {
    try {
        const me = req.session.user;
        const post = await Post.findById(req.params.id);
        if (!post || post.author !== me) return res.redirect('/');
        if (!canModifyPost(post.created_at)) return res.redirect('/');`;

if (pst.includes(editPostOld)) {
    pst = pst.replace(editPostOld, function() { return editPostNew; });
    console.log('OK: edit POST window check');
} else {
    console.log('WARN: edit POST pattern not found');
}

// Delete POST — check window
const delPostOld = `router.post('/delete/:id', async (req, res) => {
    try {
        const me = req.session.user;
        const post = await Post.findById(req.params.id);
        if (!post || post.author !== me) return res.redirect('/');`;
const delPostNew = `router.post('/delete/:id', async (req, res) => {
    try {
        const me = req.session.user;
        const post = await Post.findById(req.params.id);
        if (!post || post.author !== me) return res.redirect('/');
        if (!canModifyPost(post.created_at)) return res.redirect('/');`;

if (pst.includes(delPostOld)) {
    pst = pst.replace(delPostOld, function() { return delPostNew; });
    console.log('OK: delete POST window check');
} else {
    console.log('WARN: delete POST pattern not found');
}

fs.writeFileSync('routes/post.js', pst);
console.log('DONE');
