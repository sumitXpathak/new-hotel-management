const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { httpError } = require('../utils');

function secret() {
  const s = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev-only-secret-change-me' : null);
  if (!s) throw httpError(500, 'JWT_SECRET is not set on the server.');
  return s;
}

exports.signToken = (user) => jwt.sign({ id: user._id }, secret(), { expiresIn: '7d' });

exports.requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw httpError(401, 'Please log in.');
    let payload;
    try {
      payload = jwt.verify(token, secret());
    } catch (e) {
      if (e.status) throw e;
      throw httpError(401, 'Your session has expired. Log in again.');
    }
    const user = await User.findById(payload.id);
    if (!user) throw httpError(401, 'Account not found.');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

exports.requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return next(httpError(403, 'Only an admin can do this.'));
  next();
};
