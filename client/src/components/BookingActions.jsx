import { useState } from 'react';
import { api } from '../api';
import { useToast } from './ui';

export default function BookingActions({ booking: b, onDone }) {
  const notify = useToast();
  const [busy, setBusy] = useState(false);

  const run = async (action) => {
    setBusy(true);
    try {
      await api(`/bookings/${b._id}/${action}`, 'PATCH');
      notify('Booking updated.');
      onDone();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (b.status === 'booked') {
    return (
      <div className="row-actions">
        <button className="btn soft sm" disabled={busy} onClick={() => run('check-in')}>Check in</button>
        <button className="btn ghost sm danger" disabled={busy}
          onClick={() => confirm('Cancel this booking?') && run('cancel')}>Cancel</button>
      </div>
    );
  }
  if (b.status === 'checked-in') {
    return (
      <div className="row-actions">
        <button className="btn soft sm" disabled={busy} onClick={() => run('check-out')}>Check out</button>
      </div>
    );
  }
  return null;
}
