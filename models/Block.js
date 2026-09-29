const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema({
    blocker: { type: String, required: true, index: true },
    blocked: { type: String, required: true, index: true },
    created_at: { type: Date, default: Date.now }
});

BlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

module.exports = mongoose.model('Block', BlockSchema);
