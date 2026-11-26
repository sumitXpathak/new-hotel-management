import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import AuthShell from '../components/AuthShell';
import { Field } from '../components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await api('/auth/forgot', 'POST', { email });
      setSent(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Forgot password?" subtitle="Enter your email and we will send you a reset link."
      footer={<Link to="/login">Back to log in</Link>}>
      {sent ? (
        <p className="ok-msg">{sent} The link works for 1 hour.</p>
      ) : (
        <form onSubmit={submit}>
          <Field label="Email">
            <input type="email" autoComplete="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </Field>
          {error && <p className="form-error">{error}</p>}
          <button className="btn primary block" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
