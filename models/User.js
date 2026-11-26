const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    resetTokenHash: String,
    resetExpires: Date,
    // The first account created becomes the admin; later signups are receptionists.
    role: { type: String, enum: ['admin', 'receptionist'], default: 'receptionist' },
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
