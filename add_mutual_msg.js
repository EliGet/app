const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// Find the follow creation block
const oldFollow = `        } else {
            await Follow.create({ follower: me, following: target });
            following = true;
            // Create notification
            await Notification.create({
                recipient: target,
                actor: me,
                type: 'follow',
                ref_id: ''
            });
        }`;

const newFollow = `        } else {
            await Follow.create({ follower: me, following: target });
            following = true;
            // Create notification
            await Notification.create({
                recipient: target,
                actor: me,
                type: 'follow',
                ref_id: ''
            });

            // Check for mutual follow → send system message
            const reverseFollow = await Follow.findOne({ follower: target, following: me });
            if (reverseFollow) {
                const Message = require('./models/Message');
                const users = [me.toLowerCase(), target.toLowerCase()].sort();
                const chatId = users[0] + '_' + users[1];
                const existingSys = await Message.findOne({ chat_id: chatId, from: 'system' });
                if (!existingSys) {
                    await Message.create({
                        chat_id: chatId,
                        from: 'system',
                        body: 'You are now friends. Say hi!',
                        read: false
                    });
                }
            }
        }`;

if (src.includes(oldFollow)) {
    src = src.replace(oldFollow, function() { return newFollow; });
    console.log('OK: mutual follow system message added');
} else {
    console.log('WARN: follow block not found');
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('server.js', src);
console.log('DONE');
