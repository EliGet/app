const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
    label: { type: String, required: true },
    count: { type: Number, default: 0 },
    correct: { type: Boolean, default: false }
}, { _id: false });

const StudentPostSchema = new mongoose.Schema({
    author: { type: String, required: true, index: true },
    type: {
        type: String,
        enum: ['question', 'blog', 'notes', 'essay', 'mcq', 'poll'],
        required: true
    },
    subject: { type: String, default: 'General', index: true },
    title: { type: String, default: '', maxlength: 100 },
    body: { type: String, default: '', maxlength: 2000 },
    svgs: { type: [String], default: [] },
    options: { type: [OptionSchema], default: [] },
    votes: { type: mongoose.Schema.Types.Mixed, default: {} },
    helpfulCount: { type: Number, default: 0 },
    helpfulBy: { type: [String], default: [] },
    edited: { type: Boolean, default: false },
    edited_at: { type: Date },
    created_at: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('StudentPost', StudentPostSchema);
