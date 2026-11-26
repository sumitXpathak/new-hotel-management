import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import AuthShell from '../components/AuthShell';
import PasswordInput from '../components/PasswordInput';
import { Field } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try { await login(form.email, form.password); } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage today's stays."
      footer={<>New here? <Link to="/signup">Create an account</Link></>}>
      <form onSubmit={submit}>
        <Field label="Email">
          <input type="email" autoComplete="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <PasswordInput autoComplete="current-password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <div className="forgot"><Link to="/forgot-password">Forgot password?</Link></div>
        </Field>
        {error && <p className="form-error">{error}</p>}
        <button className="btn primary block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </AuthShell>
  );
}
