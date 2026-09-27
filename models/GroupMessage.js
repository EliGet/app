const mongoose = require('mongoose');

const GroupMessageSchema = new mongoose.Schema({
    group_id: { type: String, required: true, index: true },
    from: { type: String, required: true },
    body: { type: String, required: true },
    read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GroupMessage', GroupMessageSchema);
