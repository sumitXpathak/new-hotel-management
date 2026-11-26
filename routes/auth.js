const crypto = require('crypto');
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { wrap, httpError } = require('../utils');
const { signToken, requireAuth } = require('../middleware/auth');
const { sendResetEmail } = require('../mailer');

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
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

// Jawab hamesha same aata hai, taaki koi ye na jaan sake ki kaunsa email registered hai
router.post('/forgot', wrap(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = email ? await User.findOne({ email }) : null;
  if (user) {
    const raw = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = sha256(raw);
    user.resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const base = (process.env.APP_URL || `${req.headers['x-forwarded-proto'] || req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    try {
      await sendResetEmail(user.email, `${base}/#/reset-password?token=${raw}`);
    } catch (e) {
      console.error('Reset email failed:', e.message);
    }
  }
  res.json({ message: 'If an account exists for that email, a reset link is on its way.' });
}));

router.post('/reset', wrap(async (req, res) => {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');
  if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters.');
  const user = token && await User.findOne({ resetTokenHash: sha256(token), resetExpires: { $gt: new Date() } });
  if (!user) throw httpError(400, 'This reset link is invalid or has expired. Request a new one.');
  user.passwordHash = await bcrypt.hash(password, 10);
  user.resetTokenHash = undefined;
  user.resetExpires = undefined;
  await user.save();
  res.json({ message: 'Password updated. You can log in now.' });
}));

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;