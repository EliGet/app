const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

// Replace "mark as seen" with "delete after render"
const oldMark = `        // Mark all as seen
        await Notification.updateMany({ recipient: me, seen: false }, { $set: { seen: true } });`;

const newMark = `        // Delete follow/accepted notifications after user views them
        await Notification.deleteMany({
            recipient: me,
            type: { $in: ['follow', 'friend_accepted'] }
        });`;

if (src.includes(oldMark)) {
    src = src.replace(oldMark, function() { return newMark; });
    console.log('OK: notifications auto-delete on view');
} else {
    console.log('WARN: mark seen pattern not found');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/chat.js', src);
console.log('DONE');
