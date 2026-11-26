const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { wrap, httpError } = require('../utils');
const { signToken, requireAuth } = require('../middleware/auth');

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

router.post('/signup', wrap(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!name || !email || !password) throw httpError(400, 'Name, email and password are required.');
  if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters.');
  if (await User.exists({ email })) throw httpError(409, 'An account with this email already exists.');

  const isFirst = !(await User.exists({}));
  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: isFirst ? 'admin' : 'receptionist',
  });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

router.post('/login', wrap(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw httpError(401, 'Incorrect email or password.');
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;
