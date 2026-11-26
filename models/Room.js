const { Schema, model } = require('mongoose');

const roomSchema = new Schema(
  {
    number: { type: String, required: true, unique: true, trim: true },
    type: { type: String, enum: ['Single', 'Double', 'Deluxe', 'Suite'], required: true },
    floor: { type: Number, default: 1, min: 0 },
    capacity: { type: Number, default: 2, min: 1 },
    pricePerNight: { type: Number, required: true, min: 0 },
    amenities: [{ type: String, trim: true }],
    // Occupancy is derived from bookings; this only marks rooms taken out of service.
    status: { type: String, enum: ['active', 'maintenance'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = model('Room', roomSchema);
