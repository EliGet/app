const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// 1. Helper function — insert before getFollowSet
const helperMarker = 'async function getFollowSet(currentUser) {';
if (!src.includes(helperMarker)) { console.log('ERROR: getFollowSet marker not found'); process.exit(1); }

const helper = `async function getBlockSets(currentUser) {
    if (!currentUser) return { iBlocked: new Set(), blockedMe: new Set() };
    const mine = await Block.find({ blocker: currentUser }).select('blocked');
    const theirs = await Block.find({ blocked: currentUser }).select('blocker');
    return {
        iBlocked: new Set(mine.map(b => b.blocked)),
        blockedMe: new Set(theirs.map(b => b.blocker))
    };
}

async function getFollowSet(currentUser) {`;

if (!src.includes('async function getBlockSets')) {
    src = src.replace(helperMarker, helper);
    console.log('OK: getBlockSets helper added');
} else {
    console.log('WARN: helper already present');
}

// 2. Home route — filter posts
const homeFilterOld = `    } else {
        posts = await Post.find().sort({ created_at: -1 }).limit(50);
    }`;
const homeFilterNew = `    } else {
        posts = await Post.find().sort({ created_at: -1 }).limit(50);
    }

    // Filter out blocked users (both directions)
    const { iBlocked: homeIBlocked, blockedMe: homeBlockedMe } = await getBlockSets(me);
    posts = posts.filter(p => !homeIBlocked.has(p.author) && !homeBlockedMe.has(p.author));`;

if (src.includes(homeFilterOld)) {
    src = src.replace(homeFilterOld, function() { return homeFilterNew; });
    console.log('OK: home posts filtered');
} else {
    console.log('WARN: home filter pattern not found');
}

// 3. Following feed filter — the /following route
const followingOld = `        const posts = await Post.find({ author: { $in: followingUsernames } }).sort({ created_at: -1 }).limit(50);

        let html = '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>Following - EliGet</title></head><body>';`;

const followingNew = `        const { iBlocked: fIBlocked, blockedMe: fBlockedMe } = await getBlockSets(me);
        const visibleAuthors = followingUsernames.filter(u => !fIBlocked.has(u) && !fBlockedMe.has(u));
        const posts = await Post.find({ author: { $in: visibleAuthors } }).sort({ created_at: -1 }).limit(50);

        let html = '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>Following - EliGet</title></head><body>';`;

if (src.includes(followingOld)) {
    src = src.replace(followingOld, function() { return followingNew; });
    console.log('OK: following feed filtered');
} else {
    console.log('WARN: following feed pattern not found');
}

// 4. Public feed — filter blocked (if logged in)
const publicFeedOld = `app.get('/feed', async (req, res) => {
    const posts = await Post.find().sort({ created_at: -1 }).limit(50);`;
const publicFeedNew = `app.get('/feed', async (req, res) => {
    let posts = await Post.find().sort({ created_at: -1 }).limit(50);
    if (req.session.user) {
        const { iBlocked, blockedMe } = await getBlockSets(req.session.user);
        posts = posts.filter(p => !iBlocked.has(p.author) && !blockedMe.has(p.author));
    }`;

if (src.includes(publicFeedOld)) {
    src = src.replace(publicFeedOld, function() { return publicFeedNew; });
    console.log('OK: public feed filtered');
} else {
    console.log('WARN: public feed pattern not found');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('server.js', src);
console.log('DONE');
