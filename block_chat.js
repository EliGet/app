const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

// 1. require Block at top
if (!src.includes("require('../models/Block')")) {
    const m = src.match(/const Message = require\('\.\.\/models\/Message'\);/);
    if (!m) { console.log('ERROR: Message require not found'); process.exit(1); }
    src = src.replace(m[0], m[0] + "\nconst Block = require('../models/Block');");
    console.log('OK: Block required');
}

// 2. Chat list — filter out blocked users
const chatListOld = `        const acceptedUsers = acceptedRequests.map(r => r.from === me ? r.to : r.from);`;
const chatListNew = `        const acceptedUsers = acceptedRequests.map(r => r.from === me ? r.to : r.from);

        // Filter blocked users both directions
        const myBlocks = await Block.find({ blocker: me }).select('blocked');
        const theirBlocks = await Block.find({ blocked: me }).select('blocker');
        const blockedSet = new Set([
            ...myBlocks.map(b => b.blocked),
            ...theirBlocks.map(b => b.blocker)
        ]);
        const visibleUsers = acceptedUsers.filter(u => !blockedSet.has(u));`;

if (src.includes(chatListOld)) {
    src = src.replace(chatListOld, function() { return chatListNew; });
    // Update loop to use visibleUsers instead of acceptedUsers
    src = src.replace('for (const otherUsername of acceptedUsers) {', 'for (const otherUsername of visibleUsers) {');
    console.log('OK: chat list filters blocked');
} else {
    console.log('WARN: chat list pattern not found');
}

// 3. Chat room — block check (redirect if blocked)
const chatRoomOld = `        const me = req.session.user;
        const withUser = req.params.withUser;
        const chatId = getChatId(me, withUser);

        const otherUser = await User.findOne({ username: withUser });`;

const chatRoomNew = `        const me = req.session.user;
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

        const otherUser = await User.findOne({ username: withUser });`;

if (src.includes(chatRoomOld)) {
    src = src.replace(chatRoomOld, function() { return chatRoomNew; });
    console.log('OK: chat room block check');
} else {
    console.log('WARN: chat room pattern not found');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/chat.js', src);
console.log('DONE');
