const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

const oldBlock = `            // Check for mutual follow → send system message
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
            }`;

const newBlock = `            // Check for mutual follow → send system message (only if no prior chat)
            const reverseFollow = await Follow.findOne({ follower: target, following: me });
            if (reverseFollow) {
                const Message = require('./models/Message');
                const users = [me.toLowerCase(), target.toLowerCase()].sort();
                const chatId = users[0] + '_' + users[1];
                const anyExisting = await Message.findOne({ chat_id: chatId });
                if (!anyExisting) {
                    await Message.create({
                        chat_id: chatId,
                        from: 'system',
                        body: 'You are now friends. Say hi!',
                        read: false
                    });
                }
            }`;

if (src.includes(oldBlock)) {
    src = src.replace(oldBlock, function() { return newBlock; });
    console.log('OK: system message skips if chat already exists');
} else {
    console.log('WARN: block not found');
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('server.js', src);
console.log('DONE');
