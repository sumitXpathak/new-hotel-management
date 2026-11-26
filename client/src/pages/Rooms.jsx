import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Empty, Field, Modal, Pill, useToast } from '../components/ui';
import { money } from '../lib';

const TYPES = ['Single', 'Double', 'Deluxe', 'Suite'];
const STATE_LABEL = { available: 'Available', occupied: 'Occupied', maintenance: 'Maintenance' };

export default function Rooms() {
  const { query } = useOutletContext();
  const { user } = useAuth();
  const notify = useToast();
  const [rooms, setRooms] = useState(null);
  const [occupied, setOccupied] = useState(new Set());
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null); // null | 'new' | room

  const load = useCallback(async () => {
    try {
      const [r, inHouse] = await Promise.all([api('/rooms'), api('/bookings?status=checked-in')]);
      setRooms(r);
      setOccupied(new Set(inHouse.map((b) => b.room?._id)));
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (error) return <Empty>{error}</Empty>;
  if (!rooms) return <Empty>Loading rooms…</Empty>;

  const stateOf = (r) => (r.status === 'maintenance' ? 'maintenance' : occupied.has(r._id) ? 'occupied' : 'available');
  const count = (f) => (f === 'all' ? rooms.length : rooms.filter((r) => stateOf(r) === f).length);
  const shown = rooms
    .filter((r) => filter === 'all' || stateOf(r) === filter)
    .filter((r) => !query || [r.number, r.type, ...r.amenities].join(' ').toLowerCase().includes(query));

  const remove = async (r) => {
    if (!confirm(`Delete room ${r.number}?`)) return;
    try { await api('/rooms/' + r._id, 'DELETE'); notify('Room deleted.'); load(); } catch (e) { notify(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Rooms</h1><p className="muted">{rooms.length} rooms</p></div>
        {user.role === 'admin' && (
          <button className="btn primary" onClick={() => setEditing('new')}>Add room</button>
        )}
      </div>

      <div className="filters">
        {['all', 'available', 'occupied', 'maintenance'].map((f) => (
          <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : STATE_LABEL[f]} <span>{count(f)}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? <section className="card"><Empty>{rooms.length ? 'No rooms match this view.' : 'No rooms yet. Add your first room.'}</Empty></section> : (
        <div className="room-grid">
          {shown.map((r) => (
            <article key={r._id} className="room-card">
              <div className={`room-tile t-${r.type}`}>
                <span className="room-no">{r.number}</span>
                <Pill kind={stateOf(r)}>{STATE_LABEL[stateOf(r)]}</Pill>
              </div>
              <div className="room-body">
                <div className="room-top"><b>{r.type}</b><span>{money(r.pricePerNight)}<small>/night</small></span></div>
                <p className="muted">Floor {r.floor} · sleeps {r.capacity}</p>
                <div className="chips">{r.amenities.map((a) => <span key={a}>{a}</span>)}</div>
                <div className="room-actions">
                  {user.role === 'admin' && (
                    <button className="btn soft sm" onClick={() => setEditing(r)}><Pencil size={14} /> Edit</button>
                  )}
                  {user.role === 'admin' && (
                    <button className="btn ghost sm danger" onClick={() => remove(r)}><Trash2 size={14} /> Delete</button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && <RoomForm room={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onDone={load} />}
    </>
  );
}

function RoomForm({ room, onClose, onDone }) {
  const notify = useToast();
  const [f, setF] = useState({
    number: room?.number ?? '', type: room?.type ?? 'Single', floor: room?.floor ?? 1, capacity: room?.capacity ?? 2,
    pricePerNight: room?.pricePerNight ?? '', amenities: room?.amenities.join(', ') ?? '', status: room?.status ?? 'active',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    const body = {
      ...f,
      floor: Number(f.floor), capacity: Number(f.capacity), pricePerNight: Number(f.pricePerNight),
      amenities: f.amenities.split(',').map((a) => a.trim()).filter(Boolean),
    };
    try {
      await api(room ? '/rooms/' + room._id : '/rooms', room ? 'PUT' : 'POST', body);
      notify(room ? 'Room updated.' : 'Room added.');
      onDone(); onClose();
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <Modal title={room ? `Edit room ${room.number}` : 'Add room'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="two">
          <Field label="Room number"><input required value={f.number} onChange={set('number')} /></Field>
          <Field label="Type"><select value={f.type} onChange={set('type')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        </div>
        <div className="two">
          <Field label="Floor"><input type="number" min="0" value={f.floor} onChange={set('floor')} /></Field>
          <Field label="Sleeps"><input type="number" min="1" value={f.capacity} onChange={set('capacity')} /></Field>
        </div>
        <Field label="Price per night (₹)"><input type="number" min="0" required value={f.pricePerNight} onChange={set('pricePerNight')} /></Field>
        <Field label="Amenities (comma separated)"><input value={f.amenities} onChange={set('amenities')} placeholder="Wi-Fi, AC, TV" /></Field>
        <Field label="Status">
          <select value={f.status} onChange={set('status')}>
            <option value="active">In service</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </Field>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={busy}>Save room</button>
        </div>
      </form>
    </Modal>
  );
}
