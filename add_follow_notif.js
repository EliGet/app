const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// require Notification
if (!src.includes("require('./models/Notification')")) {
    const m = src.match(/const Block = require\('\.\/models\/Block'\);/);
    if (m) {
        src = src.replace(m[0], m[0] + "\nconst Notification = require('./models/Notification');");
        console.log('OK: Notification required');
    }
}

// Modify follow route — create notification on follow
const oldFollow = `        const existing = await Follow.findOne({ follower: me, following: target });
        let following;
        if (existing) {
            await Follow.deleteOne({ _id: existing._id });
            following = false;
        } else {
            await Follow.create({ follower: me, following: target });
            following = true;
        }
        const count = await Follow.countDocuments({ following: target });
        res.json({ ok: true, following: following, count: count });`;

const newFollow = `        const existing = await Follow.findOne({ follower: me, following: target });
        let following;
        if (existing) {
            await Follow.deleteOne({ _id: existing._id });
            following = false;
            // Remove associated notification
            await Notification.deleteMany({ recipient: target, actor: me, type: 'follow' });
        } else {
            await Follow.create({ follower: me, following: target });
            following = true;
            // Create notification
            await Notification.create({
                recipient: target,
                actor: me,
                type: 'follow',
                ref_id: ''
            });
        }
        const count = await Follow.countDocuments({ following: target });
        res.json({ ok: true, following: following, count: count });`;

if (src.includes(oldFollow)) {
    src = src.replace(oldFollow, function() { return newFollow; });
    console.log('OK: follow route notif');
} else {
    console.log('WARN: follow route pattern not found');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('server.js', src);
console.log('DONE');
