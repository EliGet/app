const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

// ===== 1. require Follow =====
if (!src.includes("require('../models/Follow')")) {
    const m = src.match(/const FriendRequest = require\('\.\.\/models\/FriendRequest'\);/);
    if (m) {
        src = src.replace(m[0], m[0] + "\nconst Follow = require('../models/Follow');");
        console.log('OK: Follow required');
    }
}

// ===== 2. getMutualFollows helper — add before "router.get('/'" =====
if (!src.includes('async function getMutualFollows')) {
    const marker = "// ===== CHAT LIST (with search) =====";
    if (!src.includes(marker)) {
        console.log('WARN: chat list marker not found — trying alternative');
    } else {
        const helper = `// Get users who mutually follow me (both directions)
async function getMutualFollows(me) {
    const iFollow = await Follow.find({ follower: me }).select('following');
    const myFollowing = iFollow.map(f => f.following);
    if (myFollowing.length === 0) return [];
    const followMe = await Follow.find({
        following: me,
        follower: { $in: myFollowing }
    }).select('follower');
    return followMe.map(f => f.follower);
}

// ===== CHAT LIST (with search) =====`;
        src = src.replace(marker, helper);
        console.log('OK: getMutualFollows helper added');
    }
}

// ===== 3. Chat list — replace friend query with mutual follows =====
const listOld = `        const acceptedRequests = await FriendRequest.find({
            status: 'accepted',
            $or: [{ from: me }, { to: me }]
        });
        const acceptedUsers = acceptedRequests.map(r => r.from === me ? r.to : r.from);

        // Filter blocked users both directions
        const myBlocks = await Block.find({ blocker: me }).select('blocked');
        const theirBlocks = await Block.find({ blocked: me }).select('blocker');
        const blockedSet = new Set([
            ...myBlocks.map(b => b.blocked),
            ...theirBlocks.map(b => b.blocker)
        ]);
        const visibleUsers = acceptedUsers.filter(u => !blockedSet.has(u));`;

const listNew = `        // Mutual follows = chat-able users
        const mutualUsers = await getMutualFollows(me);

        // Filter blocked users both directions
        const myBlocks = await Block.find({ blocker: me }).select('blocked');
        const theirBlocks = await Block.find({ blocked: me }).select('blocker');
        const blockedSet = new Set([
            ...myBlocks.map(b => b.blocked),
            ...theirBlocks.map(b => b.blocker)
        ]);
        const visibleUsers = mutualUsers.filter(u => !blockedSet.has(u));`;

if (src.includes(listOld)) {
    src = src.replace(listOld, function() { return listNew; });
    console.log('OK: chat list uses mutual follows');
} else {
    console.log('WARN: chat list pattern not found');
}

// ===== 4. Chat room GET — add mutual check =====
const roomGetOld = `        const me = req.session.user;
        const withUser = req.params.withUser;
        const chatId = getChatId(me, withUser);

        // Block check
        const blockEither = await Block.findOne({
            $or: [
                { blocker: me, blocked: withUser },
                { blocker: withUser, blocked: me }
            ]
        });
        if (blockEither) return res.redirect('/chat');`;

const roomGetNew = `        const me = req.session.user;
        const withUser = req.params.withUser;
        const chatId = getChatId(me, withUser);

        // Block check
        const blockEither = await Block.findOne({
            $or: [
                { blocker: me, blocked: withUser },
                { blocker: withUser, blocked: me }
            ]
        });
        if (blockEither) return res.redirect('/chat');

        // Mutual follow check
        const iFollowThem = await Follow.findOne({ follower: me, following: withUser });
        const theyFollowMe = await Follow.findOne({ follower: withUser, following: me });
        if (!iFollowThem || !theyFollowMe) return res.redirect('/chat');`;

if (src.includes(roomGetOld)) {
    src = src.replace(roomGetOld, function() { return roomGetNew; });
    console.log('OK: chat room GET mutual check');
} else {
    console.log('WARN: chat room GET pattern not found');
}

// ===== 5. Chat room POST — add mutual check =====
const roomPostOld = `router.post('/:withUser', async (req, res) => {
    try {
        const me = req.session.user;
        const withUser = req.params.withUser;`;

const roomPostNew = `router.post('/:withUser', async (req, res) => {
    try {
        const me = req.session.user;
        const withUser = req.params.withUser;

        // Mutual follow check
        const iFollowThem = await Follow.findOne({ follower: me, following: withUser });
        const theyFollowMe = await Follow.findOne({ follower: withUser, following: me });
        if (!iFollowThem || !theyFollowMe) return res.redirect('/chat');`;

if (src.includes(roomPostOld)) {
    src = src.replace(roomPostOld, function() { return roomPostNew; });
    console.log('OK: chat room POST mutual check');
} else {
    console.log('WARN: chat room POST pattern not found');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/chat.js', src);
console.log('DONE');
