# Haveli: hotel management system

Node.js, Express and MongoDB (Mongoose) backend with a React (Vite) front desk.

## Features
- Login and signup (JWT). The first account becomes admin, later ones are receptionists.
- Dashboard: occupancy, arrivals, departures, revenue, weekly bookings chart, room status ring
- Bookings: date-based availability check, no double booking, check in, check out, cancel
- Rooms: status board (available, occupied, maintenance), add, edit, delete (admin only)
- Guests: add, edit, delete, search from the top bar

## Run it
1. `npm install`
2. Copy `.env.example` to `.env` and set `MONGODB_URI` and `JWT_SECRET`.
3. Optional sample data: `npm run seed`
4. `npm start`, then open http://localhost:3000 and create an account.

The React app is already built into `public/`. To change the UI:
```
cd client
npm install
npm run dev      # http://localhost:5173 (proxies /api to port 3000)
npm run build    # writes the new build into ../public
```

## Deploy on Vercel
Set these in Project > Settings > Environment Variables, then redeploy:
- `MONGODB_URI` (Atlas string, no port number, no < > around the password)
- `JWT_SECRET` (any long random text)

Commit the `public/` folder, since Vercel serves the built UI from there.

## Structure
```
server.js        app + MongoDB connection (also exported for Vercel)
middleware/      JWT auth
models/          User, Room, Guest, Booking
routes/          auth, rooms, guests, bookings, stats
client/          React source (Vite)
public/          built React app
```
