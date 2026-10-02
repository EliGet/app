const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    reporter: { type: String, required: true, index: true },
    target_type: {
        type: String,
        enum: ['post', 'student_post', 'user', 'chat_message', 'group_message'],
        required: true
    },
    target_id: { type: String, required: true, index: true },
    target_owner: { type: String, default: '' },
    reason: {
        type: String,
        enum: ['spam', 'harassment', 'hate', 'misinformation', 'other'],
        required: true
    },
    note: { type: String, default: '', maxlength: 500 },
    status: { type: String, enum: ['pending', 'reviewed', 'dismissed'], default: 'pending', index: true },
    created_at: { type: Date, default: Date.now, index: true }
});

ReportSchema.index({ reporter: 1, target_type: 1, target_id: 1 }, { unique: true });

module.exports = mongoose.model('Report', ReportSchema);
