const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    full_name: { type: String, required: true },
    password_hash: { type: String, required: true },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 150 },
    badges: [{ type: String }],
    recovery_codes: [{
        hash: String,
        used: { type: Boolean, default: false }
    }],
    status: { type: String, default: 'active' },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
