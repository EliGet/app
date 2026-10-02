const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipient: { type: String, required: true, index: true },
    actor: { type: String, required: true },
    type: {
        type: String,
        enum: ['follow', 'mention', 'friend_accepted'],
        required: true
    },
    ref_id: { type: String, default: '' },
    seen: { type: Boolean, default: false, index: true },
    created_at: { type: Date, default: Date.now, index: true }
});

NotificationSchema.index({ recipient: 1, seen: 1, created_at: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
