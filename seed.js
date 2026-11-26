require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('./models/Room');
const Guest = require('./models/Guest');
const Booking = require('./models/Booking');

const rooms = [
  { number: '101', type: 'Single', floor: 1, capacity: 1, pricePerNight: 1500, amenities: ['Wi-Fi', 'AC'] },
  { number: '102', type: 'Double', floor: 1, capacity: 2, pricePerNight: 2200, amenities: ['Wi-Fi', 'AC', 'TV'] },
  { number: '103', type: 'Double', floor: 1, capacity: 3, pricePerNight: 2600, amenities: ['Wi-Fi', 'AC', 'TV'] },
  { number: '201', type: 'Deluxe', floor: 2, capacity: 3, pricePerNight: 3800, amenities: ['Wi-Fi', 'AC', 'TV', 'Balcony'] },
  { number: '202', type: 'Deluxe', floor: 2, capacity: 3, pricePerNight: 3800, amenities: ['Wi-Fi', 'AC', 'TV', 'Balcony'] },
  { number: '301', type: 'Suite', floor: 3, capacity: 4, pricePerNight: 7500, amenities: ['Wi-Fi', 'AC', 'TV', 'Mini bar', 'Bathtub'] },
];

const guests = [
  { name: 'Aarav Sharma', phone: '9876543210', email: 'aarav@example.com', idType: 'Aadhaar', idNumber: '1234 5678 9012' },
  { name: 'Priya Verma', phone: '9123456780', email: 'priya@example.com', idType: 'Passport', idNumber: 'N1234567' },
  { name: 'Rohit Singh', phone: '9988776655', idType: 'Driving licence' },
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hotel_management');
  await Promise.all([Room.deleteMany(), Guest.deleteMany(), Booking.deleteMany()]);
  const [r, g] = await Promise.all([Room.insertMany(rooms), Guest.insertMany(guests)]);

  const day = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  await Booking.insertMany([
    { guest: g[0]._id, room: r[1]._id, checkIn: new Date(today - day), checkOut: new Date(+today + 2 * day), adults: 2, nights: 3, totalAmount: 3 * 2200, status: 'checked-in' },
    { guest: g[1]._id, room: r[3]._id, checkIn: today, checkOut: new Date(+today + 2 * day), adults: 2, nights: 2, totalAmount: 2 * 3800, status: 'booked' },
  ]);
  console.log('Seeded 6 rooms, 3 guests, 2 bookings.');
  await mongoose.disconnect();
})();
