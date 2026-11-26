import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, DoorClosed, DoorOpen, IndianRupee } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api';
import { useAuth } from '../auth';
import BookingActions from '../components/BookingActions';
import NewBooking from '../components/NewBooking';
import { Avatar, Empty, Pill } from '../components/ui';
import { fmtDate, localISO, money, nightsLabel, statusLabel } from '../lib';

const COLORS = { available: '#C4B5FD', occupied: '#7C3AED', maintenance: '#F59E0B' };

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('arrivals');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const [stats, bookings] = await Promise.all([api('/stats?date=' + localISO()), api('/bookings')]);
      setData({ stats, bookings });
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (error) return <Empty>{error}</Empty>;
  if (!data) return <Empty>Loading today's desk…</Empty>;

  const { stats: s, bookings } = data;
  const today = localISO();
  const arrivals = bookings.filter((b) => b.status === 'booked' && b.checkIn.slice(0, 10) <= today);
  const departures = bookings.filter((b) => b.status === 'checked-in' && b.checkOut.slice(0, 10) <= today);
  const list = tab === 'arrivals' ? arrivals : departures;
  const inService = s.rooms - s.maintenance;
  const rate = inService ? Math.round((s.occupied / inService) * 100) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const pie = [
    { name: 'Available', key: 'available', value: s.roomStatus.available },
    { name: 'Occupied', key: 'occupied', value: s.roomStatus.occupied },
    { name: 'Maintenance', key: 'maintenance', value: s.roomStatus.maintenance },
  ];
  const week = s.week.map((d) => ({
    ...d,
    label: new Date(d.date + 'T00:00:00Z').toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' }),
  }));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{greeting}, {user.name.split(' ')[0]}</h1>
          <p className="muted">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button className="btn primary" onClick={() => setAdding(true)}>New booking</button>
      </div>

      <div className="grid-4">
        <Stat icon={BedDouble} tone="purple" value={`${s.occupied}/${inService}`} label="Rooms occupied" />
        <Stat icon={DoorOpen} tone="green" value={s.arrivals} label="Arriving today" />
        <Stat icon={DoorClosed} tone="amber" value={s.departures} label="Leaving today" />
        <Stat icon={IndianRupee} tone="pink" value={money(s.revenue)} label="Revenue from completed stays" />
      </div>

      <div className="two-col">
        <section className="card">
          <div className="card-head"><h3>Bookings this week</h3><span className="muted">by check-in day</span></div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={week} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#ECE8F5" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#8B87A0', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#8B87A0', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#F4EFFE' }}
                  formatter={(v, n) => (n === 'bookings' ? [v, 'Bookings'] : [money(v), 'Value'])}
                  contentStyle={{ borderRadius: 12, border: '1px solid #ECE8F5' }} />
                <Bar dataKey="bookings" fill="#7C3AED" radius={[8, 8, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h3>Room status</h3></div>
          <div className="donut">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" innerRadius="68%" outerRadius="92%" paddingAngle={2} stroke="none">
                  {pie.map((p) => <Cell key={p.key} fill={COLORS[p.key]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-mid"><b>{rate}%</b><span>occupied</span></div>
          </div>
          <ul className="legend">
            {pie.map((p) => (
              <li key={p.key}><i style={{ background: COLORS[p.key] }} />{p.name}<b>{p.value}</b></li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <h3>Today's desk</h3>
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'arrivals'} className={tab === 'arrivals' ? 'on' : ''} onClick={() => setTab('arrivals')}>Arrivals ({arrivals.length})</button>
            <button role="tab" aria-selected={tab === 'departures'} className={tab === 'departures' ? 'on' : ''} onClick={() => setTab('departures')}>Departures ({departures.length})</button>
          </div>
        </div>
        {list.length === 0 ? (
          <Empty>{tab === 'arrivals' ? 'No arrivals waiting to check in.' : 'No one is due to check out.'}</Empty>
        ) : (
          <ul className="desk-list">
            {list.map((b) => (
              <li key={b._id}>
                <Avatar name={b.guest?.name} />
                <div className="grow">
                  <b>{b.guest?.name || 'Removed guest'}</b>
                  <span className="muted">Room {b.room?.number} · {b.room?.type} · {fmtDate(b.checkIn)} to {fmtDate(b.checkOut)}</span>
                </div>
                <BookingActions booking={b} onDone={load} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="card-head"><h3>Recent bookings</h3><Link to="/bookings">View all</Link></div>
        {bookings.length === 0 ? <Empty>No bookings yet. Create the first one.</Empty> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Guest</th><th>Room</th><th>Dates</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {bookings.slice(0, 6).map((b) => (
                  <tr key={b._id}>
                    <td><span className="cell-user"><Avatar name={b.guest?.name} />{b.guest?.name || 'Removed guest'}</span></td>
                    <td>{b.room?.number} · {b.room?.type}</td>
                    <td>{fmtDate(b.checkIn)} to {fmtDate(b.checkOut)} ({nightsLabel(b.nights)})</td>
                    <td>{money(b.totalAmount)}</td>
                    <td><Pill kind={b.status}>{statusLabel[b.status]}</Pill></td>
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

function Stat({ icon: Icon, tone, value, label }) {
  return (
    <div className="stat">
      <span className={`stat-ico ${tone}`}><Icon size={20} /></span>
      <div><b>{value}</b><span>{label}</span></div>
    </div>
  );
}
