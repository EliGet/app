const mongoose = require('mongoose');

const FollowSchema = new mongoose.Schema({
    follower: { type: String, required: true, index: true },
    following: { type: String, required: true, index: true },
    created_at: { type: Date, default: Date.now }
});

// Compound unique — prevent duplicate follow
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

module.exports = mongoose.model('Follow', FollowSchema);
