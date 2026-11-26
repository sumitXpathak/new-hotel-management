const router = require('express').Router();
const Guest = require('../models/Guest');
const Booking = require('../models/Booking');
const { wrap, httpError } = require('../utils');

router.get('/', wrap(async (req, res) => {
  const q = (req.query.q || '').trim();
  const filter = q
    ? { $or: [{ name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, { phone: q }] }
    : {};
  res.json(await Guest.find(filter).sort({ name: 1 }));
}));

router.post('/', wrap(async (req, res) => {
  res.status(201).json(await Guest.create(req.body));
}));

router.put('/:id', wrap(async (req, res) => {
  const guest = await Guest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!guest) throw httpError(404, 'Guest not found.');
  res.json(guest);
}));

router.delete('/:id', wrap(async (req, res) => {
  const inUse = await Booking.exists({ guest: req.params.id, status: { $in: ['booked', 'checked-in'] } });
  if (inUse) throw httpError(409, 'This guest has active bookings.');
  await Guest.findByIdAndDelete(req.params.id);
  res.status(204).end();
}));

module.exports = router;
