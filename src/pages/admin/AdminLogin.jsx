import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth.jsx';
import { isConfigured } from '../../lib/supabase.js';

const OWNER_EMAIL_HINT = import.meta.env.VITE_OWNER_EMAIL || '';

export default function AdminLogin() {
  const { isOwner, loading, signIn } = useAuth();
  const [email, setEmail] = useState(OWNER_EMAIL_HINT);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Owner sign in — Sehatalay';
  }, []);

  if (!loading && isOwner) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const result = await signIn(email.trim(), password);
    setBusy(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="container page narrow">
      <form className="card login-card" onSubmit={submit}>
        <h1 className="page-title">Owner sign in</h1>
        <p className="muted">
          This area is restricted to the Sehatalay owner. Access is verified by the database on
          every request.
        </p>

        {!isConfigured ? (
          <div className="notice notice-warn" role="alert">
            Supabase is not configured yet. See the README.
          </div>
        ) : null}

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error ? (
          <div className="notice notice-error" role="alert">
            {error}
          </div>
        ) : null}

        <button type="submit" className="btn btn-primary" disabled={busy || !isConfigured}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
