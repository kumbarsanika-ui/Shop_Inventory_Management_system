import { useState } from 'react';
import { ArrowRight, Boxes, CircleAlert, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try { await login({ email, password }); }
    catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  return <main className="login-page">
    <section className="login-aside">
      <div className="brand brand-light"><span className="brand-mark"><Boxes size={19} /></span><span>stockroom<span className="brand-period">.</span></span></div>
      <div className="login-aside-copy"><div className="eyebrow eyebrow-light">INVENTORY, IN GOOD ORDER</div><h1>Know what<br />moves your<br /><span>business.</span></h1><p>A clear view of every product, supplier and stock movement, in one calm workspace.</p></div>
      <div className="login-annotation"><span className="annotation-line" />Built for the people behind the shelves</div>
    </section>
    <section className="login-main">
      <div className="login-panel"><div className="login-mobile-brand"><Boxes size={19} /> stockroom<span>.</span></div>
        <div className="login-overline"><LockKeyhole size={15} /> SECURE WORKSPACE</div><h2>Welcome back</h2><p className="login-description">Sign in to manage your inventory.</p>
        <form onSubmit={submit} className="form-stack">
          {error && <div role="alert" className="form-error"><CircleAlert size={16} />{error}</div>}
          <label className="field-label" htmlFor="email">Work email</label>
          <input id="email" className="text-input" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
          <div className="password-label"><label className="field-label" htmlFor="password">Password</label><button className="text-action" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={14} /> : <Eye size={14} />}{showPassword ? 'Hide' : 'Show'}</button></div>
          <div className="password-wrap"><input id="password" className="text-input" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /><LockKeyhole size={16} /></div>
          <button className="primary-button login-submit" disabled={busy}>{busy ? 'Signing in…' : <>Sign in <ArrowRight size={17} /></>}</button>
        </form>
        <div className="login-footnote"><span className="status-light" />Protected with role-based access</div>
      </div>
      <div className="login-copyright">STOCKROOM INVENTORY · 2026</div>
    </section>
  </main>;
}
