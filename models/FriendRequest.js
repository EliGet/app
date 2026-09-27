const mongoose = require('mongoose');

const FriendRequestSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    status: { type: String, default: 'pending' }, // pending, accepted, rejected
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FriendRequest', FriendRequestSchema);
