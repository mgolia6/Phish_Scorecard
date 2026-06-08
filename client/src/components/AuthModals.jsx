import React, { useState } from 'react';
import { useApi } from '../useApi';

export function TandCModal({ onAccept }) {
  const [scrolled, setScrolled] = React.useState(false);
  const bodyRef = React.useRef(null);

  const handleScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setScrolled(true);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 900 }}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-title">BEFORE YOU STEP INTO THE PHREEZER...</div>
        <div className="tandc-body" ref={bodyRef} onScroll={handleScroll}>
          <div className="tandc-section">
            <div className="tandc-heading">◈ WITH GRATITUDE</div>
            <p>Phreezer is an independent fan tool. We are not affiliated with Phish, Phish.net, the Mockingbird Foundation, or Phish.in — but we are deeply indebted to them. To the record keepers, statisticians, archivists, and volunteers who have spent decades maintaining the continuity of this community: this wouldn't exist without your work.</p>
            <p style={{ marginTop: 10 }}>We're equally indebted to you — the fans who celebrate, commiserate, defend, and cherish this band and the live music experience it represents.</p>
          </div>
          <div className="tandc-section">
            <div className="tandc-heading">◈ YOUR DATA</div>
            <p>Your ratings and reviews belong to you. We don't sell them, share them, or do anything sketchy with them. You can delete your account anytime.</p>
          </div>
          <div className="tandc-section">
            <div className="tandc-heading">◈ GROUND RULES</div>
            <p>Don't be a jerk. Don't suck at Phish. Or at least try not to.</p>
          </div>
        </div>
        {!scrolled && (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', color: 'rgba(51,255,51,0.35)', letterSpacing: '2px', textAlign: 'center', padding: '10px 0 4px', animation: 'blink 1.5s step-end infinite' }}>
            ▼ SCROLL TO CONTINUE
          </div>
        )}
        <button
          className="btn-primary"
          style={{ width: '100%', marginTop: 12, padding: '14px', opacity: scrolled ? 1 : 0.25, cursor: scrolled ? 'pointer' : 'not-allowed', transition: 'opacity 0.3s' }}
          onClick={scrolled ? onAccept : undefined}
          disabled={!scrolled}
        >
          STEP INTO THE PHREEZER
        </button>
      </div>
    </div>
  );
}

// ── MIKE SAID NO — unverified email block screen ──────────────────────────────
function MikeSaidNo({ email, onResent, onBack }) {
  const api = useApi();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [err, setErr] = useState('');

  const handleResend = async () => {
    setResending(true); setErr('');
    try {
      await api.post('/auth/verify-email', { email });
      setResent(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 900 }}>
      <div className="modal" style={{ maxWidth: 460, textAlign: 'center' }}>

        {/* Big fish art */}
        <div style={{ fontSize: '3.5rem', marginBottom: 16, lineHeight: 1 }}>🐟</div>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          fontWeight: 900,
          letterSpacing: '4px',
          color: 'var(--orange)',
          textShadow: '0 0 20px rgba(255,102,0,0.6)',
          marginBottom: 8,
        }}>
          MIKE SAID NO.
        </div>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.58rem',
          letterSpacing: '2px',
          color: 'var(--text-label)',
          marginBottom: 20,
          lineHeight: 1.8,
        }}>
          UNAUTHORIZED. BACKSTAGE ACCESS DENIED.<br />
          VERIFY YOUR EMAIL TO GET IN.
        </div>

        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'rgba(0,224,208,0.6)',
          background: 'rgba(0,224,208,0.06)',
          border: '1px solid rgba(0,224,208,0.15)',
          padding: '10px 16px',
          marginBottom: 24,
          wordBreak: 'break-all',
        }}>
          {email}
        </div>

        {err && (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', color: '#ff4444', marginBottom: 12, letterSpacing: '1px' }}>
            {err}
          </div>
        )}

        {resent ? (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.58rem', color: 'var(--green)', letterSpacing: '2px', marginBottom: 16 }}>
            ✓ NEW LINK SENT — CHECK YOUR INBOX
          </div>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              width: '100%',
              padding: '13px',
              fontFamily: 'var(--font-display)',
              fontSize: '0.6rem',
              letterSpacing: '2.5px',
              background: 'var(--orange)',
              color: '#000',
              border: 'none',
              cursor: resending ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              marginBottom: 10,
              opacity: resending ? 0.6 : 1,
            }}
          >
            {resending ? 'SENDING...' : '↺ RESEND VERIFICATION EMAIL'}
          </button>
        )}

        <button
          onClick={onBack}
          style={{
            width: '100%',
            padding: '11px',
            fontFamily: 'var(--font-display)',
            fontSize: '0.55rem',
            letterSpacing: '2px',
            background: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
          }}
        >
          ← BACK TO LOGIN
        </button>
      </div>
    </div>
  );
}

// ── CHECK YOUR EMAIL — post-registration screen ───────────────────────────────
function CheckYourEmail({ email, onBack }) {
  const api = useApi();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [err, setErr] = useState('');

  const handleResend = async () => {
    setResending(true); setErr('');
    try {
      await api.post('/auth/verify-email', { email });
      setResent(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 900 }}>
      <div className="modal" style={{ maxWidth: 460, textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>📬</div>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.9rem',
          fontWeight: 900,
          letterSpacing: '4px',
          color: 'var(--cyan)',
          textShadow: '0 0 16px rgba(0,224,208,0.5)',
          marginBottom: 8,
        }}>
          CHECK YOUR EMAIL
        </div>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.58rem',
          letterSpacing: '1.5px',
          color: 'var(--text-label)',
          marginBottom: 20,
          lineHeight: 1.9,
        }}>
          ACCOUNT CREATED.<br />
          VERIFY YOUR EMAIL TO STEP INTO THE PHREEZER.
        </div>

        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'rgba(0,224,208,0.6)',
          background: 'rgba(0,224,208,0.06)',
          border: '1px solid rgba(0,224,208,0.15)',
          padding: '10px 16px',
          marginBottom: 24,
          wordBreak: 'break-all',
        }}>
          {email}
        </div>

        {err && (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', color: '#ff4444', marginBottom: 12, letterSpacing: '1px' }}>
            {err}
          </div>
        )}

        {resent ? (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.58rem', color: 'var(--green)', letterSpacing: '2px', marginBottom: 16 }}>
            ✓ NEW LINK SENT
          </div>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              width: '100%',
              padding: '11px',
              fontFamily: 'var(--font-display)',
              fontSize: '0.55rem',
              letterSpacing: '2px',
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              cursor: resending ? 'not-allowed' : 'pointer',
              marginBottom: 10,
              opacity: resending ? 0.6 : 1,
            }}
          >
            {resending ? 'SENDING...' : '↺ RESEND EMAIL'}
          </button>
        )}

        <button
          onClick={onBack}
          style={{
            width: '100%',
            padding: '11px',
            fontFamily: 'var(--font-display)',
            fontSize: '0.55rem',
            letterSpacing: '2px',
            background: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
          }}
        >
          ← BACK TO LOGIN
        </button>
      </div>
    </div>
  );
}

// ── MAIN AUTH MODAL ───────────────────────────────────────────────────────────
export function AuthModal({ mode, setMode, onSuccess, onClose }) {
  const api = useApi();
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ email: '', username: '', password: '', firstName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [screen, setScreen] = useState('form'); // 'form' | 'check_email' | 'mike_said_no'
  const [pendingEmail, setPendingEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const data = await api.post('/auth/login', loginForm);
      localStorage.setItem('phish_token', data.token);
      onSuccess(data.user);
    } catch (err) {
      if (err.message.includes('EMAIL_NOT_VERIFIED')) {
        setPendingEmail(loginForm.email);
        setScreen('mike_said_no');
      } else {
        setError(err.message);
      }
    } finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const data = await api.post('/auth/register', signupForm);
      if (data.needs_verification) {
        setPendingEmail(data.email);
        setScreen('check_email');
      } else {
        // Fallback: shouldn't happen but handle gracefully
        localStorage.setItem('phish_token', data.token);
        onSuccess(data.user, true);
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  if (screen === 'mike_said_no') {
    return <MikeSaidNo email={pendingEmail} onBack={() => setScreen('form')} />;
  }

  if (screen === 'check_email') {
    return <CheckYourEmail email={pendingEmail} onBack={() => { setScreen('form'); setMode('login'); }} />;
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>X</button>
        <div className="modal-title">{mode === 'login' ? 'SYSTEM ACCESS' : 'CREATE ACCOUNT'}</div>
        {error && <div className="message error" style={{ marginBottom: 16 }}>{error}</div>}
        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="EMAIL" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} required />
            <input type="password" placeholder="PASSWORD" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} required />
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'AUTHENTICATING...' : 'LOGIN'}</button>
            <div className="modal-switch">No account? <button type="button" onClick={() => setMode('signup')}>Register</button></div>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <input type="text" placeholder="USERNAME" value={signupForm.username} onChange={e => setSignupForm({ ...signupForm, username: e.target.value })} required />
            <input type="email" placeholder="EMAIL" value={signupForm.email} onChange={e => setSignupForm({ ...signupForm, email: e.target.value })} required />
            <input type="password" placeholder="PASSWORD" value={signupForm.password} onChange={e => setSignupForm({ ...signupForm, password: e.target.value })} required />
            <input type="text" placeholder="FIRST NAME (optional)" value={signupForm.firstName} onChange={e => setSignupForm({ ...signupForm, firstName: e.target.value })} />
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'CREATING...' : 'CREATE ACCOUNT'}</button>
            <div className="modal-switch">Have an account? <button type="button" onClick={() => setMode('login')}>Login</button></div>
          </form>
        )}
      </div>
    </div>
  );
}


