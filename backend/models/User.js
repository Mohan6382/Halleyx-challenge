const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String }, // optional — not used for Google OAuth users
  googleId: { type: String },      // Google subject ID for OAuth users
  avatar: { type: String },        // Google profile picture
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
