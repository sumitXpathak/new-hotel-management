import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api';
import BookingActions from '../components/BookingActions';
import NewBooking from '../components/NewBooking';
import { Avatar, Empty, Pill } from '../components/ui';
import { fmtDate, money, nightsLabel, statusLabel } from '../lib';

const FILTERS = ['all', 'booked', 'checked-in', 'checked-out', 'cancelled'];

export default function Bookings() {
  const { query } = useOutletContext();
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => api('/bookings').then(setList).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  if (error) return <Empty>{error}</Empty>;
  if (!list) return <Empty>Loading bookings…</Empty>;

  const count = (f) => (f === 'all' ? list.length : list.filter((b) => b.status === f).length);
  const rows = list
    .filter((b) => filter === 'all' || b.status === filter)
    .filter((b) => !query || [b.guest?.name, b.guest?.phone, b.room?.number, b.room?.type].join(' ').toLowerCase().includes(query));

  return (
    <>
      <div className="page-head">
        <div><h1>Bookings</h1><p className="muted">{list.length} in total</p></div>
        <button className="btn primary" onClick={() => setAdding(true)}>New booking</button>
      </div>

      <div className="filters">
        {FILTERS.map((f) => (
          <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : statusLabel[f]} <span>{count(f)}</span>
          </button>
        ))}
      </div>

      <section className="card flush">
        {rows.length === 0 ? <Empty>{list.length ? 'No bookings match this view.' : 'No bookings yet. Create the first one.'}</Empty> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Guest</th><th>Room</th><th>Dates</th><th>Total</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b._id}>
                    <td><span className="cell-user"><Avatar name={b.guest?.name} />
                      <span><b>{b.guest?.name || 'Removed guest'}</b><small>{b.guest?.phone}</small></span></span></td>
                    <td>{b.room?.number} · {b.room?.type}</td>
                    <td>{fmtDate(b.checkIn)} to {fmtDate(b.checkOut)}<small>{nightsLabel(b.nights)}</small></td>
                    <td>{money(b.totalAmount)}</td>
                    <td><Pill kind={b.status}>{statusLabel[b.status]}</Pill></td>
                    <td><BookingActions booking={b} onDone={load} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {adding && <NewBooking onClose={() => setAdding(false)} onDone={load} />}
    </>
  );
}
