const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
    author: { type: String, required: true },
    body: { type: String, required: true, maxlength: 200 },
    created_at: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
    author: { type: String, required: true },
    body: { type: String, required: true, maxlength: 300 },
    mood: { type: String, default: 'none' },
    image: { type: String, default: 'none' },
    edited: { type: Boolean, default: false },
    edited_at: { type: Date },
    replies: [ReplySchema],
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);
