const router = require('express').Router();
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { wrap, httpError } = require('../utils');
const { findBusyRoomIds } = require('./bookings');
const { requireAdmin } = require('../middleware/auth');

router.get('/', wrap(async (req, res) => {
  res.json(await Room.find().sort({ number: 1 }));
}));

// Rooms free for the given dates: /api/rooms/available?checkIn=2026-12-01&checkOut=2026-12-04
router.get('/available', wrap(async (req, res) => {
  const checkIn = new Date(req.query.checkIn);
  const checkOut = new Date(req.query.checkOut);
  if (isNaN(checkIn) || isNaN(checkOut) || checkOut <= checkIn) {
    throw httpError(400, 'Choose valid check-in and check-out dates.');
  }
  const busy = await findBusyRoomIds(checkIn, checkOut);
  res.json(await Room.find({ status: 'active', _id: { $nin: busy } }).sort({ number: 1 }));
}));

router.post('/', wrap(async (req, res) => {
  res.status(201).json(await Room.create(req.body));
}));

router.put('/:id', wrap(async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!room) throw httpError(404, 'Room not found.');
  res.json(room);
}));

router.delete('/:id', requireAdmin, wrap(async (req, res) => {
  const inUse = await Booking.exists({ room: req.params.id, status: { $in: ['booked', 'checked-in'] } });
  if (inUse) throw httpError(409, 'This room has active bookings. Cancel them first.');
  await Room.findByIdAndDelete(req.params.id);
  res.status(204).end();
}));

module.exports = router;
