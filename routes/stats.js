const router = require('express').Router();
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Guest = require('../models/Guest');
const { wrap } = require('../utils');

const DAY = 24 * 60 * 60 * 1000;

router.get('/', wrap(async (req, res) => {
  // The browser sends its local date (?date=YYYY-MM-DD) so "today" matches the receptionist's day.
  const start = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '')
    ? new Date(req.query.date + 'T00:00:00.000Z')
    : new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');
  const end = new Date(+start + DAY);
  const weekStart = new Date(+start - 6 * DAY);

  const [rooms, maintenance, guests, occupiedRooms, arrivals, departures, revenue, weekBookings] = await Promise.all([
    Room.countDocuments(),
    Room.countDocuments({ status: 'maintenance' }),
    Guest.countDocuments(),
    Booking.distinct('room', { status: 'checked-in' }),
    Booking.countDocuments({ status: 'booked', checkIn: { $gte: start, $lt: end } }),
    Booking.countDocuments({ status: 'checked-in', checkOut: { $gte: start, $lt: end } }),
    Booking.aggregate([
      { $match: { status: 'checked-out' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Booking.find({ status: { $ne: 'cancelled' }, checkIn: { $gte: weekStart, $lt: end } }).select('checkIn totalAmount'),
  ]);

  const occupied = occupiedRooms.length;
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(+weekStart + i * DAY).toISOString().slice(0, 10);
    const items = weekBookings.filter((b) => b.checkIn.toISOString().slice(0, 10) === date);
    return { date, bookings: items.length, revenue: items.reduce((sum, b) => sum + b.totalAmount, 0) };
  });

  res.json({
    rooms, maintenance, guests, occupied, arrivals, departures,
    revenue: revenue[0]?.total || 0,
    roomStatus: { available: Math.max(rooms - maintenance - occupied, 0), occupied, maintenance },
    week,
  });
}));

module.exports = router;
