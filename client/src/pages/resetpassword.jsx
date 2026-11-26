import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import AuthShell from '../components/AuthShell';
import PasswordInput from '../components/PasswordInput';
import { Field } from '../components/ui';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('The two passwords do not match.');
    setError(''); setBusy(true);
    try {
      await api('/auth/reset', 'POST', { token, password: form.password });
      setDone(true);
    } catch (err) { setError(err.message); }
    setBusy(false);
  };

  return (
    <AuthShell title="Choose a new password" subtitle="Pick something you have not used before."
      footer={<Link to="/login">Back to log in</Link>}>
      {done ? (
        <>
          <p className="ok-msg">Password updated. You can log in now.</p>
          <Link className="btn primary block" to="/login">Go to log in</Link>
        </>
      ) : !token ? (
        <p className="form-error">This link is incomplete. <Link to="/forgot-password">Request a new one</Link>.</p>
      ) : (
        <form onSubmit={submit}>
          <Field label="New password">
            <PasswordInput autoComplete="new-password" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput autoComplete="new-password" required value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          </Field>
          {error && <p className="form-error">{error} {error.includes('expired') && <Link to="/forgot-password">Request a new link</Link>}</p>}
          <button className="btn primary block" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
        </form>
      )}
    </AuthShell>
  );
}