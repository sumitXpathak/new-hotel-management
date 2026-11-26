require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const { requireAuth } = require('./middleware/auth');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hotel_management';

// One shared connection, reused between requests (needed for Vercel serverless)
let connecting;
function connectDB() {
  if (!connecting) {
    connecting = mongoose.connect(URI, { serverSelectionTimeoutMS: 8000 }).catch((err) => {
      connecting = null;
      throw err;
    });
  }
  return connecting;
}

app.use('/api', async (req, res, next) => {
  try { await connectDB(); next(); } catch (err) { next(err); }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api', requireAuth); // everything below needs a logged-in user
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/guests', require('./routes/guests'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/stats', require('./routes/stats'));

app.use((err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message;
  if (err.name === 'ValidationError' || err.name === 'CastError') status = 400;
  if (err.code === 11000) {
    status = 409;
    message = `That ${Object.keys(err.keyPattern || {})[0] || 'value'} already exists.`;
  }
  if (status === 500) console.error(err);
  res.status(status).json({ error: message });
});

module.exports = app;

// Local run: npm start
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  connectDB()
    .then(() => {
      console.log('MongoDB connected');
      app.listen(PORT, () => console.log(`Hotel desk running at http://localhost:${PORT}`));
    })
    .catch((err) => {
      console.error('MongoDB connection failed:', err.message);
      process.exit(1);
    });
}
