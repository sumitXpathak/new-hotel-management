import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { addDays, localISO, money, nightsLabel } from '../lib';
import { Field, Modal, useToast } from './ui';

export default function NewBooking({ onClose, onDone }) {
  const notify = useToast();
  const [guests, setGuests] = useState(null);
  const [form, setForm] = useState({ guest: '', checkIn: localISO(), checkOut: addDays(localISO(), 1), adults: 1 });
  const [rooms, setRooms] = useState(null);
  const [room, setRoom] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/guests')
      .then((g) => { setGuests(g); if (g[0]) setForm((f) => ({ ...f, guest: g[0]._id })); })
      .catch((e) => { setGuests([]); setError(e.message); });
  }, []);

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setRooms(null); setRoom(''); setError(''); };
  const nights = Math.max(Math.round((new Date(form.checkOut) - new Date(form.checkIn)) / 864e5), 0);

  const findRooms = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const free = await api(`/rooms/available?checkIn=${form.checkIn}&checkOut=${form.checkOut}`);
      const fit = free.filter((r) => r.capacity >= Number(form.adults));
      setRooms(fit);
      setRoom(fit[0]?._id || '');
      if (!fit.length) setError('No rooms are free for those dates and guests.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const book = async () => {
    setError(''); setBusy(true);
    try {
      await api('/bookings', 'POST', { ...form, room, adults: Number(form.adults) });
      notify('Booking created.');
      onDone();
      onClose();
    } catch (err) { setError(err.message); setBusy(false); }
  };

  const picked = rooms?.find((r) => r._id === room);

  return (
    <Modal title="New booking" onClose={onClose}>
      {guests === null ? <p className="muted">Loading guests…</p> : guests.length === 0 && !error ? (
        <p className="muted">Add a guest first, then come back to create the booking. <Link to="/guests" onClick={onClose}>Go to guests</Link></p>
      ) : (
        <form onSubmit={findRooms}>
          <Field label="Guest">
            <select value={form.guest} onChange={set('guest')} required>
              {guests.map((g) => <option key={g._id} value={g._id}>{g.name} ({g.phone})</option>)}
            </select>
          </Field>
          <div className="two">
            <Field label="Check-in"><input type="date" value={form.checkIn} onChange={set('checkIn')} required /></Field>
            <Field label="Check-out"><input type="date" value={form.checkOut} min={addDays(form.checkIn, 1)} onChange={set('checkOut')} required /></Field>
          </div>
          <Field label="Adults"><input type="number" min="1" value={form.adults} onChange={set('adults')} required /></Field>

          {rooms && rooms.length > 0 && (
            <div className="room-options" role="radiogroup" aria-label="Available rooms">
              {rooms.map((r) => (
                <label key={r._id} className={`room-opt ${room === r._id ? 'on' : ''}`}>
                  <input type="radio" name="room" checked={room === r._id} onChange={() => setRoom(r._id)} />
                  <span><b>Room {r.number}</b> · {r.type} · sleeps {r.capacity}</span>
                  <span>{money(r.pricePerNight)}/night</span>
                </label>
              ))}
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="modal-foot">
            {picked && <span className="muted">{nightsLabel(nights)} · <b>{money(nights * picked.pricePerNight)}</b></span>}
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            {picked
              ? <button type="button" className="btn primary" disabled={busy} onClick={book}>Book room {picked.number}</button>
              : <button type="submit" className="btn primary" disabled={busy}>Find rooms</button>}
          </div>
        </form>
      )}
    </Modal>
  );
}
