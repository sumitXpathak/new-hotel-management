import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '../api';
import { Avatar, Empty, Field, Modal, useToast } from '../components/ui';

const ID_TYPES = ['Aadhaar', 'Passport', 'Driving licence', 'Voter ID'];

export default function Guests() {
  const { query } = useOutletContext();
  const notify = useToast();
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | guest

  const load = useCallback(() => api('/guests').then(setList).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  if (error) return <Empty>{error}</Empty>;
  if (!list) return <Empty>Loading guests…</Empty>;

  const rows = list.filter((g) => !query || [g.name, g.phone, g.email].join(' ').toLowerCase().includes(query));

  const remove = async (g) => {
    if (!confirm(`Delete ${g.name}?`)) return;
    try { await api('/guests/' + g._id, 'DELETE'); notify('Guest deleted.'); load(); } catch (e) { notify(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Guests</h1><p className="muted">{list.length} guests</p></div>
        <button className="btn primary" onClick={() => setEditing('new')}>Add guest</button>
      </div>

      <section className="card flush">
        {rows.length === 0 ? <Empty>{list.length ? 'No guests match your search.' : 'No guests yet. Add a guest to start a booking.'}</Empty> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Guest</th><th>Phone</th><th>Email</th><th>ID</th><th></th></tr></thead>
              <tbody>
                {rows.map((g) => (
                  <tr key={g._id}>
                    <td><span className="cell-user"><Avatar name={g.name} /><b>{g.name}</b></span></td>
                    <td>{g.phone}</td>
                    <td>{g.email || '–'}</td>
                    <td>{g.idType}{g.idNumber ? <small>{g.idNumber}</small> : null}</td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" onClick={() => setEditing(g)} aria-label={`Edit ${g.name}`}><Pencil size={16} /></button>
                        <button className="icon-btn danger" onClick={() => remove(g)} aria-label={`Delete ${g.name}`}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && <GuestForm guest={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onDone={load} />}
    </>
  );
}

function GuestForm({ guest, onClose, onDone }) {
  const notify = useToast();
  const [f, setF] = useState({
    name: guest?.name ?? '', phone: guest?.phone ?? '', email: guest?.email ?? '',
    idType: guest?.idType ?? 'Aadhaar', idNumber: guest?.idNumber ?? '', address: guest?.address ?? '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await api(guest ? '/guests/' + guest._id : '/guests', guest ? 'PUT' : 'POST', f);
      notify(guest ? 'Guest updated.' : 'Guest added.');
      onDone(); onClose();
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <Modal title={guest ? `Edit ${guest.name}` : 'Add guest'} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Full name"><input required value={f.name} onChange={set('name')} /></Field>
        <div className="two">
          <Field label="Phone"><input required value={f.phone} onChange={set('phone')} /></Field>
          <Field label="Email"><input type="email" value={f.email} onChange={set('email')} /></Field>
        </div>
        <div className="two">
          <Field label="ID type"><select value={f.idType} onChange={set('idType')}>{ID_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="ID number"><input value={f.idNumber} onChange={set('idNumber')} /></Field>
        </div>
        <Field label="Address"><input value={f.address} onChange={set('address')} /></Field>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={busy}>Save guest</button>
        </div>
      </form>
    </Modal>
  );
}
