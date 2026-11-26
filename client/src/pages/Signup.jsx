import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import AuthShell from '../components/AuthShell';
import PasswordInput from '../components/PasswordInput';
import { Field } from '../components/ui';

export default function Signup() {
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('The two passwords do not match.');
    setError(''); setBusy(true);
    try { await signup(form.name, form.email, form.password); } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <AuthShell title="Create your account" subtitle="The first account becomes the admin."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}>
      <form onSubmit={submit}>
        <Field label="Full name"><input autoComplete="name" required value={form.name} onChange={set('name')} /></Field>
        <Field label="Email"><input type="email" autoComplete="email" required value={form.email} onChange={set('email')} /></Field>
        <Field label="Password"><PasswordInput autoComplete="new-password" required value={form.password} onChange={set('password')} /></Field>
        <Field label="Confirm password"><PasswordInput autoComplete="new-password" required value={form.confirm} onChange={set('confirm')} /></Field>
        {error && <p className="form-error">{error}</p>}
        <button className="btn primary block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthShell>
  );
}
