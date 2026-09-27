const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    avatar: { type: String, default: '' },
    creator: { type: String, required: true },
    members: [{ type: String }],
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Group', GroupSchema);
