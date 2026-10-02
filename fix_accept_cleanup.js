const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

// Accept — add notification cleanup + create friend_accepted for sender
const acceptOld = `router.post('/accept/:id', async (req, res) => {
    try {
        await FriendRequest.updateOne({ _id: req.params.id }, { status: 'accepted' });
        res.redirect('/chat');
    } catch (error) {
        res.redirect('/chat');
    }
});`;

const acceptNew = `router.post('/accept/:id', async (req, res) => {
    try {
        const me = req.session.user;
        const fr = await FriendRequest.findById(req.params.id);
        if (fr && fr.to === me) {
            await FriendRequest.updateOne({ _id: req.params.id }, { status: 'accepted' });
            // Notify sender that request was accepted
            await Notification.create({
                recipient: fr.from,
                actor: me,
                type: 'friend_accepted',
                ref_id: fr._id.toString()
            });
        }
        res.redirect('/chat/notifications');
    } catch (error) {
        console.error('Accept error:', error);
        res.redirect('/chat');
    }
});`;

if (src.includes(acceptOld)) {
    src = src.replace(acceptOld, function() { return acceptNew; });
    console.log('OK: accept route updated');
} else {
    console.log('WARN: accept route pattern not found');
}

// Reject — after reject, notification cleanup happens automatically (bell uses FriendRequest count)
const rejectOld = `router.post('/reject/:id', async (req, res) => {
    try {
        await FriendRequest.updateOne({ _id: req.params.id }, { status: 'rejected' });
        res.redirect('/chat');
    } catch (error) {
        res.redirect('/chat');
    }
});`;

const rejectNew = `router.post('/reject/:id', async (req, res) => {
    try {
        await FriendRequest.deleteOne({ _id: req.params.id });
        res.redirect('/chat/notifications');
    } catch (error) {
        console.error('Reject error:', error);
        res.redirect('/chat');
    }
});`;

if (src.includes(rejectOld)) {
    src = src.replace(rejectOld, function() { return rejectNew; });
    console.log('OK: reject route updated');
} else {
    console.log('WARN: reject route pattern not found');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/chat.js', src);
console.log('DONE');
