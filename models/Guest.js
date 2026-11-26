const { Schema, model } = require('mongoose');

const guestSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    idType: { type: String, enum: ['Aadhaar', 'Passport', 'Driving licence', 'Voter ID'], default: 'Aadhaar' },
    idNumber: { type: String, trim: true },
    address: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = model('Guest', guestSchema);
