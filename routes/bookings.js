const router = require('express').Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Guest = require('../models/Guest');
const { wrap, httpError } = require('../utils');

const DAY = 24 * 60 * 60 * 1000;

// A stay [checkIn, checkOut) overlaps another when each starts before the other ends.
async function findBusyRoomIds(checkIn, checkOut, ignoreBookingId) {
  const filter = {
    status: { $in: ['booked', 'checked-in'] },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };
  if (ignoreBookingId) filter._id = { $ne: ignoreBookingId };
  return Booking.distinct('room', filter);
}

router.get('/', wrap(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  res.json(
    await Booking.find(filter).populate('guest', 'name phone').populate('room', 'number type').sort({ checkIn: -1 })
  );
}));

router.post('/', wrap(async (req, res) => {
  const { guest, room, adults } = req.body;
  const checkIn = new Date(req.body.checkIn);
  const checkOut = new Date(req.body.checkOut);
  if (isNaN(checkIn) || isNaN(checkOut) || checkOut <= checkIn) {
    throw httpError(400, 'Check-out must be after check-in.');
  }

  const [roomDoc, guestDoc] = await Promise.all([Room.findById(room), Guest.findById(guest)]);
  if (!roomDoc) throw httpError(404, 'Room not found.');
  if (!guestDoc) throw httpError(404, 'Guest not found.');
  if (roomDoc.status !== 'active') throw httpError(409, `Room ${roomDoc.number} is under maintenance.`);
  if (adults > roomDoc.capacity) throw httpError(400, `Room ${roomDoc.number} sleeps ${roomDoc.capacity}.`);

  const busy = await findBusyRoomIds(checkIn, checkOut);
  if (busy.some((id) => id.equals(roomDoc._id))) {
    throw httpError(409, `Room ${roomDoc.number} is already booked for those dates.`);
  }

  const nights = Math.round((checkOut - checkIn) / DAY);
  const booking = await Booking.create({
    guest, room, checkIn, checkOut, adults,
    nights,
    totalAmount: nights * roomDoc.pricePerNight,
  });
  res.status(201).json(booking);
}));

// Only valid status transitions are allowed
const transitions = {
  'check-in': { from: ['booked'], to: 'checked-in' },
  'check-out': { from: ['checked-in'], to: 'checked-out' },
  cancel: { from: ['booked'], to: 'cancelled' },
};

router.patch('/:id/:action', wrap(async (req, res) => {
  const rule = transitions[req.params.action];
  if (!rule) throw httpError(404, 'Unknown action.');
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw httpError(404, 'Booking not found.');
  if (!rule.from.includes(booking.status)) {
    throw httpError(409, `Cannot ${req.params.action.replace('-', ' ')} a ${booking.status} booking.`);
  }
  booking.status = rule.to;
  await booking.save();
  res.json(booking);
}));

module.exports = router;
module.exports.findBusyRoomIds = findBusyRoomIds;
