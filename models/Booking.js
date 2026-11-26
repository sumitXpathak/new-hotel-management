const { Schema, model } = require('mongoose');

const bookingSchema = new Schema(
  {
    guest: { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    adults: { type: Number, default: 1, min: 1 },
    nights: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['booked', 'checked-in', 'checked-out', 'cancelled'],
      default: 'booked',
    },
  },
  { timestamps: true }
);

bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });

module.exports = model('Booking', bookingSchema);
