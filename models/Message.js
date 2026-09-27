const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    chat_id: { type: String, required: true, index: true }, // যেমন: "ahad_mohim"
    from: { type: String, required: true },
    body: { type: String, required: true },
    read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
