import React, { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';

const API = '/api';
const PNET = 'https://phish.net';
const RELISTEN = 'https://relisten.net/phish';

function useApi() {
  const getToken = () => localStorage.getItem('phish_token');
  const request = useCallback(async (method, path, body = null) => {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }, []);
  return { get: p => request('GET', p), post: (p, b) => request('POST', p, b) };
}

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m)-1]} ${parseInt(day)}, ${y}`;
}

function formatDuration(secs) {
  if (!secs) return null;
  const total = secs > 3600 ? Math.round(secs / 1000) : Math.round(secs);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function SongRating({ value, onChange }) {
  return (
    <div className="song-rating-row">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          className={`rating-btn ${n <= value ? 'active' : ''} ${n === value ? 'selected' : ''}`}
          onClick={() => onChange(n === value ? 0 : n)}
          aria-label={`Rate ${n} stars`}
        >{n <= value ? '★' : '☆'}</button>
      ))}
    </div>
  );
}

function SetScore({ label, songs, ratings }) {
  const rated = songs.filter(s => ratings[s.song]?.rating);
  if (!rated.length) return null;
  const avg = rated.reduce((sum, s) => sum + parseInt(ratings[s.song].rating), 0) / rated.length;
  const pct = (avg / 5) * 100;
  return (
    <div className="set-score">
      <span className="set-score-label">{label}</span>
      <div className="set-score-bar"><div className="set-score-fill" style={{ width: `${pct}%` }} /></div>
      <span className="set-score-val">{avg.toFixed(2)}</span>
      <span className="set-score-count">({rated.length})</span>
    </div>
  );
}

function SaveCelebration({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  const glyphs = ['★','◈','✦','◉','⬡','⬢','✧','◆'];
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    glyph: glyphs[i % glyphs.length],
    x: Math.random() * 100,
    delay: Math.random() * 0.4,
    dur: 1.2 + Math.random() * 0.8,
    color: i % 3 === 0 ? 'var(--orange)' : i % 3 === 1 ? 'var(--cyan)' : 'var(--green)',
  }));
  return (
    <div className="celebrate-overlay">
      <div className="celebrate-burst">
        {particles.map(p => (
          <span key={p.id} className="celebrate-particle" style={{
            left: `${p.x}%`, color: p.color,
            animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`,
          }}>{p.glyph}</span>
        ))}
      </div>
      <div className="celebrate-msg">
        <span className="celebrate-main">RATINGS LOCKED IN</span>
        <span className="celebrate-sub">◈ DON'T SUCK AT PHISH ◈</span>
      </div>
    </div>
  );
}


function WelcomeCelebration({ username, onDone }) {
  const lyrics = [
    "We're glad, glad, glad that you've arrived!",
    "Glad glad glad that you've arrived.",
    "Welcome. This is our farmhouse. We have cluster flies, alas.",
    "You're already there.",
    "It took me a long time to get back on the train.",
    "The long night's over and the sun's coming up.",
    "I'm going down to the central part of town.",
    "This is what space smells like.",
    "We're all in this together and we love to take a bath.",
    "Flipping backward through the doors and through the windows.",
  ];
  const lyric = lyrics[Math.floor(Math.random() * lyrics.length)];

  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  const glyphs = ['★','◈','✦','◉','⬡','❄','✧','◆'];
  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    glyph: glyphs[i % glyphs.length],
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    dur: 1.4 + Math.random() * 0.8,
    color: i % 3 === 0 ? 'var(--orange)' : i % 3 === 1 ? 'var(--cyan)' : 'var(--green)',
  }));

  return (
    <div className="celebrate-overlay" style={{ cursor: 'pointer' }} onClick={onDone}>
      <div className="celebrate-burst">
        {particles.map(p => (
          <span key={p.id} className="celebrate-particle" style={{
            left: `${p.x}%`, color: p.color,
            animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`,
          }}>{p.glyph}</span>
        ))}
      </div>
      <div className="celebrate-msg">
        <span className="celebrate-main" style={{ fontSize: '1.4rem', letterSpacing: '3px' }}>
          {username ? `WELCOME BACK, ${username.toUpperCase()}` : 'WELCOME BACK'}
        </span>
        <span className="celebrate-sub" style={{ fontSize: '0.82rem', fontStyle: 'italic', letterSpacing: '2px', maxWidth: 320, textAlign: 'center', lineHeight: 1.5 }}>
          "{lyric}"
        </span>
        <span style={{ fontSize: '0.55rem', color: 'rgba(51,255,51,0.3)', letterSpacing: '2px', marginTop: 16 }}>
          TAP TO DISMISS
        </span>
      </div>
    </div>
  );
}

function FullPageLoader({ text }) {
  return (
    <div className="fullpage-loader">
      <div className="fullpage-loader-inner">
        <div className="fullpage-snowflake">❄</div>
        <div className="fullpage-loader-text">{text || 'LOADING...'}</div>
      </div>
    </div>
  );
}

function MikeError({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="mike-error" onClick={onClose}>
      <div className="mike-error-inner">
        <div className="mike-no">MIKE SAYS NO</div>
        <div className="mike-msg">{message}</div>
        <div className="mike-sub">[ TAP TO DISMISS ]</div>
      </div>
    </div>
  );
}

// ============================================================
// T&C MODAL — fires once per user, stores acceptance in localStorage
// ============================================================
function TandCModal({ onAccept }) {
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

// ============================================================
// ONBOARDING FLOW — new user welcome, multi-step
// ============================================================
function OnboardingFlow({ user, onComplete, onStartImport, onGoToScorecard }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      glyph: '❄',
      title: 'WELCOME TO PHREEZER',
      sub: `Hey ${user?.firstName || user?.username || 'there'}.`,
      body: 'Phreezer is your personal Phish show archive. Rate every song. Track every show. Relive every night.',
      cta: 'WHAT DOES IT DO?',
    },
    {
      glyph: '◈',
      title: 'RATE SHOWS',
      sub: 'Song by song.',
      body: 'Find any Phish show going back to 1983. Rate each song 1–5. Phreezer calculates your set scores and overall show score automatically.',
      cta: 'WHAT ELSE?',
    },
    {
      glyph: '◉',
      title: 'TRACK YOUR HISTORY',
      sub: 'Every show you\'ve attended.',
      body: 'Import your attendance and reviews straight from phish.net. Your whole history, frozen in the Phreezer.',
      cta: 'SOUNDS GOOD',
    },
    {
      glyph: '▦',
      title: 'SEE YOUR ANALYTICS',
      sub: 'What does your taste say about you?',
      body: 'Top rated songs. Best venues. Your average score across every show you\'ve rated. The data doesn\'t lie.',
      cta: 'ONE MORE THING',
    },
    {
      glyph: '◈',
      title: 'KEEP IT GOING',
      sub: 'If the spirit moves you.',
      body: 'Phreezer will always be free. But it takes real time and real overhead to keep it running. If you like what you see, consider buying a coffee. No pressure. No guilt. Just appreciation if the spirit moves you.',
      cta: null,
      bmc: true,
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="modal-overlay" style={{ zIndex: 800 }}>
      <div className="onboarding-modal">
        <div className="onboarding-glyph">{current.glyph}</div>
        <div className="onboarding-title">{current.title}</div>
        <div className="onboarding-sub">{current.sub}</div>
        <div className="onboarding-body">{current.body}</div>
        <div className="onboarding-progress">
          {steps.map((_, i) => (
            <div key={i} className={`onboarding-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
          ))}
        </div>
        {isLast ? (
          <div className="onboarding-actions" style={{ flexDirection: 'column' }}>
            <a href="https://buymeacoffee.com/mpgink" target="_blank" rel="noopener noreferrer"
              className="btn-primary"
              style={{ width: '100%', padding: '14px', marginBottom: 10, display: 'block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>
              ☕ BUY A COFFEE
            </a>
            <button style={{ width: '100%', padding: '12px' }} onClick={() => { onGoToScorecard(); }}>
              LET'S GO
            </button>
          </div>
        ) : (
          <button className="btn-primary" style={{ width: '100%', padding: '12px' }} onClick={() => setStep(s => s + 1)}>
            {current.cta}
          </button>
        )}
        <button className="onboarding-skip" onClick={onComplete}>SKIP INTRO</button>
      </div>
    </div>
  );
}

// ============================================================
// PROFILE SETUP MODAL — fires after T&C, before onboarding
// ============================================================
function ProfileSetupModal({ api, onComplete }) {
  const [phishnetUsername, setPhishnetUsername] = useState('');
  const [confirmedHandle, setConfirmedHandle] = useState(false);
  const [favoriteSong, setFavoriteSong] = useState('');
  const [favoriteVenue, setFavoriteVenue] = useState('');
  const [favoriteShowDate, setFavoriteShowDate] = useState('');
  const [favoriteShowLabel, setFavoriteShowLabel] = useState('');
  const [songs, setSongs] = useState([]);
  const [venues, setVenues] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importCount, setImportCount] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load existing data on mount — user may already have rated songs / attended shows
  const loadOptions = async () => {
    try {
      const data = await api.get('/user/profile-options');
      if (data.songs?.length) setSongs(data.songs);
      if (data.venues?.length) setVenues(data.venues);
      // Auto-set favorite show to first attended show (chronologically oldest)
      if (data.shows?.length) {
        const first = [...data.shows].sort((a, b) => a.show_date.localeCompare(b.show_date))[0];
        if (first) {
          setFavoriteShowDate(first.show_date);
          const [y, m, day] = first.show_date.split('-');
          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          setFavoriteShowLabel(`${months[parseInt(m)-1]} ${parseInt(day)}, ${y} — ${first.venue}${first.city ? `, ${first.city}` : ''}`);
        }
      }
    } catch (e) {}
  };

  useEffect(() => { loadOptions(); }, []);

  const handleImport = async () => {
    if (!phishnetUsername.trim() || !confirmedHandle) return;
    setImporting(true);
    try {
      const [attRes, revRes] = await Promise.all([
        api.post('/import/phishnet', { phishnet_username: phishnetUsername.trim() }).catch(() => ({ imported: 0 })),
        api.post('/import/phishnet-reviews', { phishnet_username: phishnetUsername.trim() }).catch(() => ({ imported: 0 })),
      ]);
      setImportCount({ attendance: attRes.imported || 0, reviews: revRes.imported || 0 });
      setImportDone(true);
      await loadOptions(); // reload dropdowns immediately after import
    } catch (e) {}
    finally { setImporting(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/user/profile', {
        phishnet_username: phishnetUsername || null,
        favorite_song: favoriteSong || null,
        favorite_venue: favoriteVenue || null,
        favorite_show_date: favoriteShowDate || null,
      });
    } catch (e) {}
    onComplete();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 850 }}>
      <div className="modal" style={{ maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-title">SET UP YOUR PROFILE</div>
        <div style={{ fontSize: '0.7rem', color: 'rgba(51,255,51,0.5)', letterSpacing: '1px', marginBottom: 24, lineHeight: 1.6 }}>
          All optional. Skip anything you don't want to fill in.
        </div>

        {/* Phish.net handle + import */}
        <div className="profile-setup-field">
          <label className="profile-setup-label">PHISH.NET USERNAME</label>
          <input
            type="text"
            placeholder="e.g. mgolia6"
            value={phishnetUsername}
            onChange={e => { setPhishnetUsername(e.target.value); setConfirmedHandle(false); setImportDone(false); setImportCount(null); }}
          />
          {phishnetUsername && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 10, cursor: 'pointer' }} onClick={() => setConfirmedHandle(v => !v)}>
              <input type="checkbox" checked={confirmedHandle} onChange={e => setConfirmedHandle(e.target.checked)} style={{ flexShrink: 0, marginTop: 3, accentColor: 'var(--orange)', width: 16, height: 16 }} />
              <span style={{ fontSize: '0.72rem', color: 'rgba(51,255,51,0.75)', letterSpacing: '0.5px', lineHeight: 1.5, flex: 1, minWidth: 0 }}>I confirm this is my phish.net account</span>
            </div>
          )}
          {phishnetUsername && confirmedHandle && !importDone && (
            <button
              className="btn-primary"
              style={{ width: '100%', padding: '11px', marginTop: 10, fontSize: '0.65rem' }}
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? '◈ IMPORTING...' : '↓ IMPORT ATTENDANCE + REVIEWS'}
            </button>
          )}
          {importDone && importCount && (
            <div style={{ marginTop: 8, fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--cyan)', letterSpacing: '2px', lineHeight: 1.8 }}>
              ✓ {importCount.attendance} SHOWS · {importCount.reviews} REVIEWS IMPORTED
            </div>
          )}
        </div>

        {/* Favorite song */}
        <div className="profile-setup-field">
          <label className="profile-setup-label">FAVORITE SONG</label>
          {songs.length > 0 ? (
            <select value={favoriteSong} onChange={e => setFavoriteSong(e.target.value)} className="era-select" style={{ width: '100%' }}>
              <option value="">— SELECT A SONG —</option>
              {songs.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <input
              type="text"
              placeholder="e.g. Tweezer"
              value={favoriteSong}
              onChange={e => setFavoriteSong(e.target.value)}
            />
          )}
          {songs.length > 0 && (
            <div className="profile-setup-hint">{songs.length} songs from your ratings</div>
          )}
        </div>

        {/* Favorite venue */}
        <div className="profile-setup-field">
          <label className="profile-setup-label">FAVORITE VENUE</label>
          {venues.length > 0 ? (
            <select value={favoriteVenue} onChange={e => setFavoriteVenue(e.target.value)} className="era-select" style={{ width: '100%' }}>
              <option value="">— SELECT A VENUE —</option>
              {venues.map((v, i) => (
                <option key={i} value={v.venue}>{v.venue}{v.city ? ` — ${v.city}${v.state ? `, ${v.state}` : ''}` : ''}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="e.g. Madison Square Garden"
              value={favoriteVenue}
              onChange={e => setFavoriteVenue(e.target.value)}
            />
          )}
          <div className="profile-setup-hint">
            {venues.length === 0 ? 'Import attendance and this becomes a dropdown' : `${venues.length} venues from your history`}
          </div>
        </div>

        {/* Favorite show — auto-set to first attended, display only */}
        {favoriteShowDate && (
          <div className="profile-setup-field">
            <label className="profile-setup-label">FIRST SHOW ◈ AUTO-SET</label>
            <div style={{ padding: '10px 12px', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--cyan)', background: 'rgba(0,224,208,0.04)' }}>
              {favoriteShowLabel}
            </div>
            <div className="profile-setup-hint">Your earliest attended show — saved as your first show</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn-primary" style={{ flex: 1, padding: '13px' }} onClick={handleSave} disabled={saving}>
            {saving ? 'SAVING...' : 'SAVE PROFILE'}
          </button>
          <button style={{ flex: 1, padding: '13px' }} onClick={onComplete}>
            SKIP FOR NOW
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthModal({ mode, setMode, onSuccess, onClose }) {
  const api = useApi();
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ email: '', username: '', password: '', firstName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const data = await api.post('/auth/login', loginForm);
      localStorage.setItem('phish_token', data.token);
      onSuccess(data.user);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const data = await api.post('/auth/register', signupForm);
      localStorage.setItem('phish_token', data.token);
      onSuccess(data.user, true); // true = new user
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

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

const TODAY = new Date().toISOString().split('T')[0];

function filterByQuery(shows, q) {
  if (!q) return shows;
  const isYearOnly = /^\d{4}$/.test(q.trim());
  const isYearMonth = /^\d{4}-\d{2}$/.test(q.trim());
  if (isYearOnly || isYearMonth) {
    return shows.filter(s => s.showdate?.startsWith(q.trim()));
  }
  const query = q.toLowerCase();
  return shows.filter(s =>
    s.showdate?.includes(q) ||
    s.venue?.toLowerCase().includes(query) ||
    s.city?.toLowerCase().includes(query) ||
    s.state?.toLowerCase().includes(query) ||
    s.tour_name?.toLowerCase().includes(query)
  );
}

// ============================================================
// SIDEBAR COMPONENT (desktop only)
// ============================================================
function Sidebar({ tab, setTab, user, onLogin, onLogout, expanded, setExpanded }) {
  const navItems = [
    { id: 'scorecard', label: 'SCORECARD', glyph: '◈', section: 'MY PHISH' },
    { id: 'my-shows', label: 'MY SHOWS', glyph: '◉', section: null, authRequired: true },
    { id: 'analytics', label: 'ANALYTICS', glyph: '▦', section: null, authRequired: true },
    { id: 'community', label: 'LEADERBOARD', glyph: '★', section: 'COMMUNITY' },
  ];

  const comingSoon = [
    { id: 'songs', label: 'SONG RANKINGS', glyph: '♫', section: null },
    { id: 'venues', label: 'VENUE RANKINGS', glyph: '⬡', section: null },
    { id: 'links', label: 'NOTABLE LINKS', glyph: '⌬', section: 'LINKS' },
  ];

  return (
    <div className="sidebar-wrapper">
      <aside className={`sidebar ${expanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>

        <div className="sidebar-logo">
          {expanded ? (
            <img
              src="/assets/phreezer-logo.svg"
              alt="The Phreezer"
              className="sidebar-logo-img-expanded"
              onClick={() => {
                if (!user?.is_admin) return;
                const now = Date.now();
                if (!window._logoTaps) window._logoTaps = [];
                window._logoTaps = window._logoTaps.filter(t => now - t < 800);
                window._logoTaps.push(now);
                if (window._logoTaps.length >= 3) { window._logoTaps = []; setTab('admin'); }
              }}
              style={{ cursor: user?.is_admin ? 'pointer' : 'default' }}
            />
          ) : (
            <img src="/assets/phreezer-snowflake.svg" alt="Phreezer" className="sidebar-logo-img-collapsed" />
          )}
        </div>

      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          const disabled = (item.authRequired && !user) || (item.adminOnly && !user?.is_admin);
          if (item.adminOnly && !user?.is_admin) return null;
          return (
            <React.Fragment key={item.id}>
              {item.section && expanded && (
                <div className="sidebar-section-label">{item.section}</div>
              )}
              {item.section && !expanded && i > 0 && (
                <div className="sidebar-divider" />
              )}
              <button
                className={`sidebar-nav-btn ${tab === item.id ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && setTab(item.id)}
                title={item.label}
                disabled={disabled}
              >
                <span className="sidebar-nav-glyph">{item.glyph}</span>
                {expanded && <span className="sidebar-nav-label">{item.label}</span>}
              </button>
            </React.Fragment>
          );
        })}

        <div className="sidebar-divider" style={{ margin: '8px 0' }} />
        {comingSoon.map((item) => (
          <React.Fragment key={item.id}>
            {item.section && expanded && (
              <div className="sidebar-section-label">{item.section}</div>
            )}
            <button
              className="sidebar-nav-btn sidebar-nav-soon"
              title={`${item.label} — Coming Soon`}
              disabled
            >
              <span className="sidebar-nav-glyph">{item.glyph}</span>
              {expanded && (
                <span className="sidebar-nav-label">
                  {item.label}
                  <span className="soon-badge">SOON</span>
                </span>
              )}
            </button>
          </React.Fragment>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <>
            <div className={`sidebar-user ${expanded ? '' : 'sidebar-user-collapsed'}`}>
              <div className="sidebar-avatar">{user.username?.[0]?.toUpperCase() || '?'}</div>
              {expanded && <span className="sidebar-username">{user.username}</span>}
            </div>
            {expanded && (
              <a
                href="https://buymeacoffee.com/mpgink"
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-nav-btn"
                style={{ textDecoration: 'none', color: 'var(--orange)', borderColor: 'rgba(255,102,0,0.3)', marginBottom: 4 }}
                title="Buy Me a Coffee"
              >
                <span className="sidebar-nav-glyph">☕</span>
                <span className="sidebar-nav-label">BUY A COFFEE</span>
              </a>
            )}
            <button
              className="sidebar-nav-btn sidebar-logout"
              onClick={onLogout}
              title="Logout"
            >
              <span className="sidebar-nav-glyph">⏻</span>
              {expanded && <span className="sidebar-nav-label">LOGOUT</span>}
            </button>
          </>
        ) : (
          <>
            <button className="sidebar-nav-btn" onClick={() => onLogin('login')} title="Login">
              <span className="sidebar-nav-glyph">→</span>
              {expanded && <span className="sidebar-nav-label">LOGIN</span>}
            </button>
            <button className="sidebar-nav-btn sidebar-register" onClick={() => onLogin('signup')} title="Register">
              <span className="sidebar-nav-glyph">+</span>
              {expanded && <span className="sidebar-nav-label">REGISTER</span>}
            </button>
          </>
        )}
      </div>
      </aside>

      <button
        className="sidebar-tab"
        onClick={() => setExpanded(e => !e)}
        title={expanded ? 'Collapse' : 'Expand'}
      >
        {expanded ? '◀' : '▶'}
      </button>
    </div>
  );
}

// ============================================================
// KPI CARDS
// ============================================================
function KPICards({ api }) {
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/user/kpi')
      .then(setKpi)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="kpi-row kpi-loading">LOADING STATS...</div>;
  if (!kpi) return null;

  const cards = [
    { label: 'SHOWS ATTENDED', value: kpi.shows_attended, color: 'cyan' },
    { label: 'SHOWS RATED', value: kpi.shows_rated, color: 'orange' },
    { label: 'AVG SCORE', value: kpi.avg_score ?? '—', color: 'green' },
    { label: 'REVIEWS', value: kpi.shows_with_reviews, color: 'cyan' },
  ];

  return (
    <div className="kpi-section">
      <div className="kpi-row">
        {cards.map(c => (
          <div key={c.label} className="kpi-card">
            <div className={`kpi-value kpi-${c.color}`}>{c.value}</div>
            <div className="kpi-label">{c.label}</div>
          </div>
        ))}
      </div>
      {kpi.login_streak > 1 && (
        <div className="kpi-streak">
          ⚡ {kpi.login_streak}-DAY LOGIN STREAK
        </div>
      )}
      {kpi.top_song && (
        <div className="kpi-highlights">
          <span className="kpi-highlight-item">
            <span className="kpi-hl-label">TOP SONG</span>
            <span className="kpi-hl-val">{kpi.top_song.song_name} <span className="kpi-hl-score">({kpi.top_song.avg})</span></span>
          </span>
          {kpi.top_venue && (
            <span className="kpi-highlight-item">
              <span className="kpi-hl-label">MOST VISITED</span>
              <span className="kpi-hl-val">{kpi.top_venue.venue} <span className="kpi-hl-score">({kpi.top_venue.shows}x)</span></span>
            </span>
          )}
        </div>
      )}
      {kpi.badges && kpi.badges.length > 0 && (
        <div className="badges-row">
          {kpi.badges.map(b => (
            <div key={b.id} className="badge-chip">
              <span>{b.glyph}</span>
              <span>{b.label}</span>
              <div className="badge-tooltip">{b.desc}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
        <a
          href="https://buymeacoffee.com/mpgink"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', color: 'rgba(255,102,0,0.5)', letterSpacing: '2px', textDecoration: 'none' }}
        >
          ☕ KEEP PHREEZER RUNNING — BUY A COFFEE
        </a>
      </div>
    </div>
  );
}

// ============================================================
// SCORECARD TAB
// ============================================================
function ScorecardTab({ api, showMessage, showError, onAuthRequired, initialShowDate, onShowLoaded }) {
  const [query, setQuery] = useState('');
  const [allShows, setAllShows] = useState([]);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [currentShow, setCurrentShow] = useState(null);
  const [songs, setSongs] = useState([]);
  const [ratings, setRatings] = useState({});
  const [audioTracks, setAudioTracks] = useState({});
  const [loadingShow, setLoadingShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [randomizing, setRandomizing] = useState(false);
  const [attendanceType, setAttendanceType] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const debounceRef = useRef(null);
  const spinnerTimerRef = useRef(null);
  const isAuthed = !!localStorage.getItem('phish_token');
  const initialLoadDone = useRef(false);

  const filterShows = (list) => list.filter(s => s.showdate <= TODAY);

  useEffect(() => {
    api.get('/shows?limit=2000').then(data => {
      const filtered = filterShows(data);
      setAllShows(filtered);
      setResults(filtered.slice(0, 20));
    }).catch(() => {});
  }, []);

  // Load a specific show if navigated from My Shows
  useEffect(() => {
    if (initialShowDate && !initialLoadDone.current) {
      initialLoadDone.current = true;
      loadShow(initialShowDate);
      if (onShowLoaded) onShowLoaded();
    }
  }, [initialShowDate]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current);
    setShowSpinner(false);

    if (!query.trim()) {
      setResults(allShows.slice(0, 20));
      if (!selectedYear) { setSelectedYear(''); setSelectedMonth(''); }
      return;
    }
    if (query.trim().length < 2) { setResults([]); return; }

    const isYearOnly = /^\d{4}$/.test(query.trim());
    if (isYearOnly && allShows.length > 0) {
      setResults(filterByQuery(allShows, query.trim()).slice(0, 100));
      return;
    }

    debounceRef.current = setTimeout(async () => {
      spinnerTimerRef.current = setTimeout(() => setShowSpinner(true), 300);
      setSearching(true);
      try {
        const data = await api.get(`/shows?q=${encodeURIComponent(query.trim())}`);
        const filtered = filterShows(data);
        setResults(filterByQuery(filtered, query.trim()).slice(0, 50));
      } catch (err) { showError(err.message); }
      finally {
        setSearching(false);
        setShowSpinner(false);
        if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current);
      }
    }, 400);
    return () => { clearTimeout(debounceRef.current); clearTimeout(spinnerTimerRef.current); };
  }, [query, allShows]);

  const loadShow = async (date) => {
    if (!isAuthed) { onAuthRequired(); return; }
    setLoadingShow(true);
    setCurrentShow(null);
    setSongs([]);
    setRatings({});
    setAudioTracks({});
    setSaved(false);
    try {
      const [showData, ratingsResp, audioData] = await Promise.all([
        api.get(`/shows/${date}`),
        api.get(`/ratings/${date}`).catch(() => ({ ratings: [], attendance_type: null })),
        fetch(`${API}/audio/${date}`).then(r => r.json()).catch(() => ({ tracks: [] })),
      ]);
      setSongs(showData.songs || []);
      setCurrentShow(showData);
      const savedRatings = Array.isArray(ratingsResp) ? ratingsResp : (ratingsResp.ratings || []);
      const savedAttendance = (!Array.isArray(ratingsResp) && ratingsResp.attendance_type) ? ratingsResp.attendance_type : 'listened';
      setAttendanceType(savedAttendance);
      const rMap = {};
      for (const r of savedRatings) rMap[r.song_name] = { rating: r.rating, notes: r.notes || '' };
      setRatings(rMap);
      const aMap = {};
      for (const t of (audioData.tracks || [])) {
        const key = t.title?.toLowerCase().trim();
        if (key) aMap[key] = t;
      }
      setAudioTracks(aMap);
    } catch (err) {
      showError('Failed to load show');
      setCurrentShow(null);
    } finally {
      setLoadingShow(false);
    }
  };

  const selectShow = (show) => { setQuery(''); setResults([]); loadShow(show.showdate); };

  const handleYearBtn = (yr) => {
    const isActive = query === yr;
    if (isActive) { setQuery(''); setCurrentShow(null); }
    else { setQuery(yr); setCurrentShow(null); }
  };

  const handleRandom = async () => {
    setRandomizing(true);
    try {
      const res = await fetch(`${API}/random-show`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.showdate) { setQuery(''); setResults([]); await loadShow(data.showdate); }
      else showError(data.error || `Random show returned no date.`);
    } catch (err) { showError(`Random show: ${err.message}`); }
    finally { setRandomizing(false); }
  };

  const getAudioForSong = (songName) => audioTracks[songName?.toLowerCase().trim()] || null;
  const updateRating = (songName, field, value) =>
    setRatings(prev => ({ ...prev, [songName]: { ...prev[songName], [field]: value } }));

  const submitRatings = async () => {
    setSubmitting(true);
    try {
      const ratingsList = songs.filter(s => ratings[s.song]?.rating).map(s => ({
        song: s.song, set: s.set,
        rating: parseInt(ratings[s.song].rating),
        notes: ratings[s.song]?.notes || '',
      }));
      if (!ratingsList.length) { showMessage('Rate at least one song first', 'info'); setSubmitting(false); return; }
      await api.post(`/ratings/${currentShow.showdate}`, {
        ratings: ratingsList,
        attendance_type: attendanceType,
        showDetails: { venue: currentShow.venue, city: currentShow.city, state: currentShow.state, country: currentShow.country },
      });
      setSaved(true);
      setCelebrating(true);
    } catch (err) { showError(err.message); }
    finally { setSubmitting(false); }
  };

  const sets = songs.reduce((acc, song) => {
    const key = song.set || '1';
    if (!acc[key]) acc[key] = [];
    acc[key].push(song);
    return acc;
  }, {});

  const setLabel = k => {
    if (k === 'e' || k === 'E') return 'ENCORE';
    if (k === 'e2') return 'ENCORE 2';
    if (k === 'S' || k === 's') return 'SOUNDCHECK';
    return `SET ${k}`;
  };

  const totalRated = songs.filter(s => ratings[s.song]?.rating);
  const overallAvg = totalRated.length
    ? (totalRated.reduce((sum, s) => sum + parseInt(ratings[s.song].rating), 0) / totalRated.length).toFixed(2)
    : null;

  const hasAudio = Object.keys(audioTracks).length > 0;
  const relistenUrl = currentShow ? `${RELISTEN}/${currentShow.showdate?.replace(/-/g, '/')}` : null;
  const pnetUrl = currentShow?.permalink || `${PNET}/setlists/`;
  const reviewCount = currentShow?.reviews?.count || 0;
  const pnetLabel = reviewCount > 0
    ? `PHISH.NET SETLIST + REVIEWS (${reviewCount})`
    : 'PHISH.NET SETLIST';

  return (
    <div>
      {celebrating && <SaveCelebration onDone={() => {
        setCelebrating(false);
        showMessage(`Saved ${songs.filter(s => ratings[s.song]?.rating).length} ratings`, 'success');
      }} />}

      <div className="instructions-panel">
        <button className="instructions-toggle" onClick={() => setShowInstructions(!showInstructions)}>
          <span>HOW TO USE PHREEZER</span>
          <span className="toggle-arrow">{showInstructions ? '▲ COLLAPSE' : '▼ EXPAND'}</span>
        </button>
        {showInstructions && (
          <div className="instructions-body">
            <div className="instructions-grid">
              <div>
                <div className="instr-step"><span className="instr-num">01</span><span>Search by date, venue, city, or year. Or let RANDOM SHOW decide your fate.</span></div>
                <div className="instr-step"><span className="instr-num">02</span><span>Rate each song 1–5. 1 means they tried. 5 means you were there in spirit even if you weren't.</span></div>
                <div className="instr-step"><span className="instr-num">03</span><span>▶ PLAY streams the song from Phish.in. Rate while you listen. That's the move.</span></div>
              </div>
              <div>
                <div className="instr-step"><span className="instr-num">04</span><span>Tap a song name to pull up its full Phish.net history. Every version, every year.</span></div>
                <div className="instr-step"><span className="instr-num">05</span><span>Save ratings. They stack up in My Shows, Analytics, and the Leaderboard.</span></div>
                <div className="instr-step"><span className="instr-num">06</span><span>Don't suck at Phish. Or at least try not to.</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-title">SEARCH SHOWS</div>
        <div className="search-wrap">
          <div className="search-input-wrap">
            <input
              type="text"
              placeholder="Venue, city, year (1997), or tour name..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off" autoCorrect="off" spellCheck="false"
            />
            {showSpinner && <span className="search-spinner">◈</span>}
          </div>
          <button className="btn-random" onClick={handleRandom} disabled={randomizing || loadingShow}>
            {randomizing ? '◈ SUMMONING...' : '⚄ RANDOM SHOW'}
          </button>
        </div>
        <div className="era-filter-dropdowns">
          <select
            className="era-select"
            value={selectedYear}
            onChange={e => {
              setSelectedYear(e.target.value);
              setSelectedMonth('');
              if (e.target.value) {
                setQuery(e.target.value);
                setCurrentShow(null);
              } else {
                setQuery('');
              }
            }}
          >
            <option value="">ALL YEARS</option>
            {[...Array(new Date().getFullYear() - 1983 + 1)].map((_, i) => {
              const yr = String(new Date().getFullYear() - i);
              if (['2005','2006','2007'].includes(yr)) return null;
              return <option key={yr} value={yr}>{yr}</option>;
            })}
          </select>
          <select
            className="era-select"
            value={selectedMonth}
            disabled={!selectedYear}
            onChange={e => {
              setSelectedMonth(e.target.value);
              if (e.target.value && selectedYear) {
                setQuery(`${selectedYear}-${e.target.value}`);
              } else {
                setQuery(selectedYear);
              }
              setCurrentShow(null);
            }}
          >
            <option value="">ALL MONTHS</option>
            {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
              <option key={m} value={m}>{['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][i]}</option>
            ))}
          </select>
        </div>
        {!currentShow && !loadingShow && results.length > 0 && (
          <>
            <div className="results-header">
              {query.trim() ? `${results.length} result${results.length !== 1 ? 's' : ''}` : 'Recent shows — tap to load'}
            </div>
            <div className="results-list">
              {results.map(show => (
                <div key={show.showid || show.showdate} className="result-item" onClick={() => selectShow(show)}>
                  <span className="result-date">{formatDate(show.showdate)}</span>
                  <span className="result-venue">{show.venue}</span>
                  <span className="result-meta">
                    <span className="result-location">{show.city}{show.state ? `, ${show.state}` : ''}</span>
                    {show.tour_name && show.tour_name !== 'Not Part of a Tour' && <span className="result-tour">{show.tour_name}</span>}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {loadingShow && <div className="loading">LOADING SETLIST FROM PHISH.NET...</div>}

      {currentShow && !loadingShow && (
        <div className="panel">
          <div className="show-masthead">
            <div className="show-masthead-main">
              <div className="show-date-display">{formatDate(currentShow.showdate)}</div>
              <div className="show-venue-display">{currentShow.venue}</div>
              <div className="show-location-display">
                {currentShow.city}{currentShow.state ? `, ${currentShow.state}` : ''}{currentShow.country && currentShow.country !== 'USA' ? `, ${currentShow.country}` : ''}
              </div>
              {currentShow.tour_name && <div className="show-tour">◈ {currentShow.tour_name}</div>}
              {hasAudio && <div className="audio-badge">◉ AUDIO AVAILABLE VIA PHISH.IN</div>}
            </div>
            <div className="show-masthead-links">
              <a href={pnetUrl} target="_blank" rel="noopener noreferrer" className="show-link pnet-link">{pnetLabel}</a>
              {relistenUrl && (
                <a href={relistenUrl} target="_blank" rel="noopener noreferrer" className="show-link audio-link">STREAM ON RELISTEN</a>
              )}
            </div>
          </div>

          <div className="attendance-row" style={{ marginBottom: 12 }}>
            <span className="attendance-label">HOW DID YOU EXPERIENCE THIS SHOW?</span>
            <div className="attendance-options">
              {[
                { value: 'attended', label: '🎸 ATTENDED', desc: 'I was there' },
                { value: 'webcast', label: '📺 WEBCAST', desc: 'Watched live stream' },
                { value: 'listened', label: '🎧 LISTENED', desc: 'Heard recording' },
              ].map(opt => (
                <button key={opt.value} type="button"
                  className={`attendance-btn ${attendanceType === opt.value ? 'active' : ''}`}
                  onClick={() => setAttendanceType(opt.value)} title={opt.desc}>{opt.label}</button>
              ))}
            </div>
          </div>

          {currentShow.soundcheck && (
            <div className="soundcheck-bar">
              <span className="soundcheck-label">SOUNDCHECK:</span> {currentShow.soundcheck}
            </div>
          )}
          {currentShow.setlist_notes && (
            <div className="notes-collapsible">
              <button className="notes-toggle" onClick={() => setShowNotes(n => !n)}>
                <span>SHOW NOTES</span>
                <span>{showNotes ? '▲ HIDE' : '▼ EXPAND'}</span>
              </button>
              {showNotes && <div className="setlist-notes" dangerouslySetInnerHTML={{ __html: currentShow.setlist_notes }} />}
            </div>
          )}

          {songs.length > 0 ? (
            <>
              <div className="panel-title" style={{ marginTop: 24 }}>SETLIST & RATINGS</div>
              <div className="setlist-container">
                {Object.entries(sets).map(([setKey, setSongs]) => (
                  <div key={setKey} className="set-block">
                    <div className="set-header-row">
                      <span className="set-label">{setLabel(setKey)}</span>
                      <span className="set-song-count">{setSongs.length} songs</span>
                    </div>
                    {setSongs.map((song, idx) => {
                      const audio = getAudioForSong(song.song);
                      const duration = formatDuration(audio?.duration);
                      return (
                        <div key={idx} className={`song-row ${ratings[song.song]?.rating ? 'rated' : ''} ${song.isjam ? 'jam' : ''}`}>
                          <div className="song-info">
                            <div className="song-name-with-num">
                              <span className="song-num-inline">{song.position || idx + 1}.</span>
                              <a
                                href={`${PNET}/song/${song.slug || song.song.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')}`}
                                target="_blank" rel="noopener noreferrer"
                                className={`song-name-link ${song.isjam ? 'jam-chart' : ''}`}
                                onClick={e => e.stopPropagation()}
                              >{song.song}</a>
                            </div>
                            <div className="song-meta">
                              {duration && <span className="song-duration">{duration}</span>}
                              {song.isjam && <span className="badge jam-badge">JAM</span>}
                              {song.isreprise && <span className="badge reprise-badge">REPRISE</span>}
                              {song.footnote && <span className="badge footnote-badge" title={song.footnote}>*</span>}
                            </div>
                          </div>
                          <span className="song-transition">
                            {song.transition === '>' ? <span className="segue-soft">&gt;</span>
                              : song.transition === '->' ? <span className="segue-hard">--&gt;</span>
                              : null}
                          </span>
                          <div className="song-row-controls">
                            {audio?.mp3_url ? (
                              <a href={audio.mp3_url} target="_blank" rel="noopener noreferrer"
                                className="song-play-inline" title={`Stream on Phish.in`}
                                onClick={e => e.stopPropagation()}>▶</a>
                            ) : (
                              <span style={{ width: 32, display: 'inline-block', flexShrink: 0 }} />
                            )}
                            <SongRating value={parseInt(ratings[song.song]?.rating) || 0} onChange={val => updateRating(song.song, 'rating', val)} />
                          </div>
                          {ratings[song.song]?.notesOpen ? (
                            <div className="song-notes-expanded">
                              <input className="notes-input" type="text" placeholder="Add a note..."
                                value={ratings[song.song]?.notes || ''}
                                autoFocus
                                onChange={e => updateRating(song.song, 'notes', e.target.value)}
                                onBlur={() => { if (!ratings[song.song]?.notes) updateRating(song.song, 'notesOpen', false); }}
                              />
                            </div>
                          ) : (
                            <button className="song-notes-toggle" onClick={() => updateRating(song.song, 'notesOpen', true)}>
                              {ratings[song.song]?.notes
                                ? <span className="song-notes-preview">✎ {ratings[song.song].notes}</span>
                                : <span className="song-notes-add">+ NOTE</span>}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="score-summary">
                <div className="panel-title">SHOW SCORE</div>
                {Object.entries(sets).filter(([k]) => k !== 'S' && k !== 's').map(([setKey, setSongs]) => (
                  <SetScore key={setKey} label={setLabel(setKey)} songs={setSongs} ratings={ratings} />
                ))}
                {overallAvg && (
                  <div className="overall-score">
                    <span className="overall-label">OVERALL</span>
                    <span className="overall-val">{overallAvg}</span>
                    <span className="overall-stars">{'★'.repeat(Math.round(parseFloat(overallAvg)))}{'☆'.repeat(5 - Math.round(parseFloat(overallAvg)))}</span>
                  </div>
                )}
              </div>

              <div className="submit-section">
                <button
                  className={`btn-primary btn-submit ${saved ? 'btn-saved' : ''}`}
                  onClick={submitRatings} disabled={submitting || saved}
                >
                  {submitting ? 'SAVING...' : saved ? '✓ RATINGS SAVED' : 'SAVE RATINGS'}
                </button>
              </div>

              {currentShow.reviews?.items?.length > 0 && (
                <div className="reviews-section">
                  <div className="panel-title">PHISH.NET COMMUNITY REVIEWS</div>
                  {(currentShow.reviews.items || []).filter(rev => rev.review && rev.review.trim()).map((rev, i) => (
                    <div key={i} className="review-item">
                      <div className="review-header">
                        <span className="review-author">{rev.author}</span>
                        {rev.score > 0 && (
                          <span className="review-score" title="Community upvotes">▲ {rev.score}</span>
                        )}
                        <span className="review-date">{rev.posted}</span>
                      </div>
                      <div className="review-text" dangerouslySetInnerHTML={{ __html: rev.review?.substring(0, 300) + (rev.review?.length > 300 ? '...' : '') }} />
                    </div>
                  ))}
                  <a href={`${pnetUrl}#reviews`} target="_blank" rel="noopener noreferrer" className="show-link" style={{ marginTop: 8, display: 'inline-block' }}>
                    ALL {currentShow.reviews.count} REVIEWS ON PHISH.NET
                  </a>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">NO SETLIST DATA AVAILABLE</div>
          )}
        </div>
      )}

      <div className="pnet-attribution">
        Setlist data by <a href="https://phish.net" target="_blank" rel="noopener noreferrer">Phish.net</a> — a project of the <a href="https://mbird.org" target="_blank" rel="noopener noreferrer">Mockingbird Foundation</a>
        {' · '}Audio via <a href="https://phish.in" target="_blank" rel="noopener noreferrer">Phish.in</a>
      </div>
    </div>
  );
}

// ============================================================
// MY SHOWS TAB
// ============================================================
function MyShowsTab({ api, showMessage, showError, onRateShow, openImportOnMount }) {
  const [shows, setShows] = useState([]);
  const [attended, setAttended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('attended');
  const [importing, setImporting] = useState(false);
  const [phishnetUser, setPhishnetUser] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importType, setImportType] = useState('attendance');
  const [expandedReview, setExpandedReview] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [sortBy, setSortBy] = useState('date_desc');
  const [filterBy, setFilterBy] = useState('all');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/user/shows').catch(() => []),
      api.get('/user/attendance').catch(() => ({ shows: [] })),
    ]).then(([ratedShows, attendanceData]) => {
      setShows(ratedShows);
      setAttended(attendanceData.shows || []);
    }).catch(err => showError(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  // Auto-open import panel if flagged from onboarding
  useEffect(() => {
    if (openImportOnMount) setShowImport(true);
  }, [openImportOnMount]);

  const handleImport = async () => {
    if (!phishnetUser.trim()) return;
    setImporting(true);
    try {
      const endpoint = importType === 'reviews' ? '/import/phishnet-reviews' : '/import/phishnet';
      const result = await api.post(endpoint, { phishnet_username: phishnetUser.trim() });
      setImportResult({ type: importType, ...result });
      setShowImport(false);
      loadData();
    } catch (err) {
      showError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <FullPageLoader text="LOADING YOUR SHOWS..." />;

  const rawShows = activeView === 'attended' ? attended : shows;

  const filteredShows = rawShows.filter(show => {
    if (activeView !== 'attended') return true;
    if (filterBy === 'has_review') return Array.isArray(show.reviews) && show.reviews.length > 0;
    if (filterBy === 'has_phreezer') return show.phreezer_avg != null;
    if (filterBy === 'no_phreezer') return show.phreezer_avg == null;
    return true;
  });

  const displayShows = [...filteredShows].sort((a, b) => {
    if (activeView !== 'attended') return 0;
    if (sortBy === 'date_desc') return new Date(b.show_date) - new Date(a.show_date);
    if (sortBy === 'date_asc') return new Date(a.show_date) - new Date(b.show_date);
    if (sortBy === 'phreezer_desc') return (b.phreezer_avg ?? -1) - (a.phreezer_avg ?? -1);
    if (sortBy === 'phishnet_desc') return (b.phishnet_score ?? -1) - (a.phishnet_score ?? -1);
    if (sortBy === 'no_phreezer') return (a.phreezer_avg != null ? 1 : -1) - (b.phreezer_avg != null ? 1 : -1);
    return 0;
  });

  const ImportSuccessModal = () => {
    if (!importResult) return null;
    const isReviews = importResult.type === 'reviews';
    const count = importResult.imported || 0;
    const total = importResult.total || 0;
    return (
      <div className="import-modal-overlay" onClick={() => setImportResult(null)}>
        <div className="import-modal" onClick={e => e.stopPropagation()}>
          <div className="import-modal-icon">{isReviews ? '✍' : '◉'}</div>
          <div className="import-modal-count">{count}</div>
          <div className="import-modal-label">{isReviews ? 'REVIEWS IMPORTED' : 'SHOWS IMPORTED'}</div>
          {total > count && <div className="import-modal-sub">{total - count} already existed — updated</div>}
          <div className="import-modal-tagline">
            {isReviews ? 'YOUR VOICE IS IN THE PHRЕЕZER' : `${count} SHOWS. FROZEN IN TIME.`}
          </div>
          <button className="import-modal-dismiss" onClick={() => setImportResult(null)}>
            [ TAP TO DISMISS ]
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="panel">
      <ImportSuccessModal />

      {/* KPI Cards */}
      <KPICards api={api} />

      <div className="my-shows-header">
        <div className="my-shows-tabs">
          <button className={`my-shows-tab-btn ${activeView === 'attended' ? 'active' : ''}`} onClick={() => setActiveView('attended')}>
            ATTENDED ({attended.length})
          </button>
          <button className={`my-shows-tab-btn ${activeView === 'rated' ? 'active' : ''}`} onClick={() => setActiveView('rated')}>
            RATED ({shows.length})
          </button>
        </div>
        <button className="import-btn" onClick={() => setShowImport(!showImport)}>
          ↓ IMPORT
        </button>
      </div>

      {activeView === 'attended' && (
        <div className="shows-controls">
          <div className="shows-filter-row">
            <button className={`filter-pill ${filterBy === 'all' ? 'active' : ''}`} onClick={() => setFilterBy('all')}>ALL</button>
            <button className={`filter-pill ${filterBy === 'has_review' ? 'active' : ''}`} onClick={() => setFilterBy('has_review')}>REVIEWED</button>
            <button className={`filter-pill ${filterBy === 'has_phreezer' ? 'active' : ''}`} onClick={() => setFilterBy('has_phreezer')}>RATED</button>
            <button className={`filter-pill ${filterBy === 'no_phreezer' ? 'active' : ''}`} onClick={() => setFilterBy('no_phreezer')}>UNRATED</button>
          </div>
          <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="date_desc">DATE ↓</option>
            <option value="date_asc">DATE ↑</option>
            <option value="phreezer_desc">PHREEZER ↓</option>
            <option value="phishnet_desc">PHISH.NET ↓</option>
            <option value="no_phreezer">UNRATED FIRST</option>
          </select>
        </div>
      )}

      {showImport && (
        <div className="import-panel">
          <div className="import-type-row">
            <button className={`import-type-btn ${importType === 'attendance' ? 'active' : ''}`} onClick={() => setImportType('attendance')}>ATTENDANCE</button>
            <button className={`import-type-btn ${importType === 'reviews' ? 'active' : ''}`} onClick={() => setImportType('reviews')}>REVIEWS + SCORES</button>
          </div>
          <div className="import-label">PHISH.NET USERNAME</div>
          <div className="import-row">
            <input
              className="import-input"
              placeholder="e.g. mgolia6"
              value={phishnetUser}
              onChange={e => setPhishnetUser(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleImport()}
            />
            <button className="btn-primary import-go" onClick={handleImport} disabled={importing}>
              {importing ? 'IMPORTING...' : 'IMPORT'}
            </button>
          </div>
          <div className="import-hint">
            {importType === 'attendance' ? 'Imports all shows marked "I Was There" on phish.net' : 'Imports your written reviews and scores from phish.net'}
          </div>
        </div>
      )}

      {!displayShows.length ? (
        <div className="empty-state">
          {activeView === 'attended' ? 'NO ATTENDED SHOWS — IMPORT FROM PHISH.NET ABOVE' : 'NO RATED SHOWS YET'}
        </div>
      ) : displayShows.map(show => {
        const reviewExpanded = expandedReview === show.show_date;
        const reviews = show.reviews || [];
        const hasReview = reviews.length > 0;
        const phreezerScore = show.phreezer_avg ?? show.overall_rating ?? null;
        return (
          <div key={show.show_date} className="show-card">
            <div className="show-card-top">
              <div className="show-card-left">
                <div className="show-card-datestr">{formatDate(show.show_date)}</div>
                <div className="show-card-venue">{show.venue}</div>
                <div className="show-card-loc">{show.city}{show.state ? `, ${show.state}` : ''}</div>
              </div>
              <div className="show-scores-col">
                <div className="show-score-row">
                  <span className="show-score-label">PHREEZER</span>
                  <span className="show-score-val cyan">{phreezerScore != null ? phreezerScore : '—'}</span>
                </div>
                {hasReview && (
                  <div className="show-score-row">
                    <span className="show-score-label">MY REVIEW</span>
                    <span className="show-score-val orange">✎</span>
                  </div>
                )}
              </div>
            </div>
            <div className="show-card-bottom">
              <div className="show-card-links">
                <button
                  className="show-link-sm rate-btn"
                  onClick={() => onRateShow(show.show_date)}
                  title="Rate this show in Scorecard"
                >
                  {phreezerScore != null ? '◈ RE-RATE' : '◈ RATE'}
                </button>
                <a href={`${RELISTEN}/${show.show_date?.replace(/-/g,'/')}`} target="_blank" rel="noopener noreferrer" className="show-link-sm audio">▶ RELISTEN</a>
                <a href={`https://phish.net/setlists/?d=${show.show_date}`} target="_blank" rel="noopener noreferrer" className="show-link-sm">PHISH.NET</a>
                <a href={`https://phish.in/${show.show_date}`} target="_blank" rel="noopener noreferrer" className="show-link-sm">PHISH.IN</a>
                {hasReview && (
                  <button className="show-link-sm review-toggle" onClick={() => setExpandedReview(reviewExpanded ? null : show.show_date)}>
                    {reviewExpanded ? '▲ MY REVIEW' : '▼ MY REVIEW'}
                  </button>
                )}
                <a
                  href={`https://phish.net/setlists/?d=${show.show_date}#addreview`}
                  target="_blank" rel="noopener noreferrer"
                  className="show-link-sm"
                  title="Write a review on Phish.net"
                >✎ REVIEW ON .NET</a>
              </div>
            </div>
            {reviewExpanded && hasReview && (
              <div className="show-review-expanded">
                {reviews.map((rev, i) => (
                  <div key={rev.review_id || i} className={`review-entry ${i > 0 ? 'review-entry-divider' : ''}`}>
                    {reviews.length > 1 && <div className="review-entry-num">REVIEW {i + 1} OF {reviews.length}</div>}
                    <div className="show-review-text">{rev.review_text}</div>
                    {rev.posted_date && <div className="show-review-date">Posted {rev.posted_date}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// ANALYTICS TAB
// ============================================================
function AnalyticsTab({ api, showMessage, showError }) {
  const [songs, setSongs] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/analytics/songs'), api.get('/analytics/venues')])
      .then(([s, v]) => { setSongs(s); setVenues(v); })
      .catch(err => showError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageLoader text="CRUNCHING NUMBERS..." />;
  return (
    <div className="analytics-grid">
      <div className="panel">
        <div className="panel-title">TOP RATED SONGS</div>
        {!songs.length ? <div className="empty-state">NO DATA YET</div> : songs.slice(0, 20).map((s, i) => (
          <div key={s.song_name} className="stat-row">
            <span className="stat-rank">#{i+1}</span>
            <a href={`https://phish.net/song/${s.song_name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')}`} target="_blank" rel="noopener noreferrer" className="stat-name-link">{s.song_name}</a>
            <span className="stat-score">{s.average_rating}</span>
            <span className="stat-count">({s.total_ratings})</span>
          </div>
        ))}
      </div>
      <div className="panel">
        <div className="panel-title">TOP VENUES</div>
        {!venues.length ? <div className="empty-state">NO DATA YET</div> : venues.slice(0, 20).map((v, i) => (
          <div key={`${v.venue}-${i}`} className="stat-row">
            <span className="stat-rank">#{i+1}</span>
            <div className="stat-name">
              <div>{v.venue}</div>
              <div style={{ color: 'rgba(51,255,51,0.4)', fontSize: '0.7rem' }}>{v.city}{v.state ? `, ${v.state}` : ''} · {v.total_shows} shows</div>
            </div>
            <span className="stat-score">{v.average_rating}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// PROFILE TAB
// ============================================================
function ProfileTab({ api, user }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState({ songs: [], venues: [] });

  useEffect(() => {
    Promise.all([
      api.get('/user/profile'),
      api.get('/user/profile-options'),
    ]).then(([p, o]) => {
      setProfile(p);
      setForm(p);
      setOptions(o);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/user/profile', form);
      setProfile(form);
      setEditing(false);
    } catch (e) {}
    finally { setSaving(false); }
  };

  if (!profile) return <FullPageLoader text="LOADING PROFILE..." />;

  const fields = [
    { key: 'phishnet_username', label: 'PHISH.NET HANDLE' },
    { key: 'favorite_song', label: 'FAVORITE SONG' },
    { key: 'favorite_venue', label: 'FAVORITE VENUE' },
    { key: 'favorite_show_date', label: 'FIRST SHOW' },
  ];

  return (
    <div className="panel">
      <div className="panel-title">PROFILE</div>

      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--cyan)', letterSpacing: '2px' }}>
          {user.username}
        </div>
        <div style={{ fontSize: '0.65rem', color: 'rgba(51,255,51,0.35)', marginTop: 4, letterSpacing: '1px' }}>
          {user.email}
        </div>
      </div>

      {!editing ? (
        <>
          {fields.map(f => (
            <div key={f.key} className="profile-field-row">
              <div className="profile-field-label">{f.label}</div>
              {profile[f.key]
                ? <div className="profile-field-val">{profile[f.key]}</div>
                : <div className="profile-field-empty">not set</div>
              }
            </div>
          ))}
          <button className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: 8 }} onClick={() => setEditing(true)}>
            ✎ EDIT PROFILE
          </button>
        </>
      ) : (
        <>
          {fields.map(f => (
            <div key={f.key} className="profile-field-row">
              <label className="profile-field-label">{f.label}</label>
              {f.key === 'favorite_song' && options.songs.length > 0 ? (
                <select className="era-select" style={{ width: '100%' }} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}>
                  <option value="">— SELECT —</option>
                  {options.songs.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : f.key === 'favorite_venue' && options.venues.length > 0 ? (
                <select className="era-select" style={{ width: '100%' }} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}>
                  <option value="">— SELECT —</option>
                  {options.venues.map((v, i) => <option key={i} value={v.venue}>{v.venue}{v.city ? ` — ${v.city}` : ''}</option>)}
                </select>
              ) : (
                <input type="text" value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.label.toLowerCase()} />
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button className="btn-primary" style={{ flex: 1, padding: '12px' }} onClick={handleSave} disabled={saving}>
              {saving ? 'SAVING...' : 'SAVE'}
            </button>
            <button style={{ flex: 1, padding: '12px' }} onClick={() => { setEditing(false); setForm(profile); }}>
              CANCEL
            </button>
          </div>
        </>
      )}

      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <a href="https://buymeacoffee.com/mpgink" target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--orange)', letterSpacing: '2px', textDecoration: 'none', padding: '12px', border: '1px solid rgba(255,102,0,0.3)' }}>
          ☕ BUY A COFFEE — KEEP PHREEZER RUNNING
        </a>
      </div>
    </div>
  );
}

// ============================================================
// COMMUNITY TAB — Leaderboard
// ============================================================
function CommunityTab({ api }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/community/leaderboard')
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageLoader text="LOADING LEADERBOARD..." />;

  return (
    <div className="panel">
      <div className="panel-title">LEADERBOARD</div>
      {!rows.length ? (
        <div className="lb-empty">NO DATA YET — RATE SOME SHOWS</div>
      ) : (
        <>
          <div className="leaderboard-header-row">
            <div className="lb-col-label">#</div>
            <div className="lb-col-label">USER</div>
            <div className="lb-col-label">ATTENDED</div>
            <div className="lb-col-label">RATED</div>
            <div className="lb-col-label">AVG</div>
            <div className="lb-col-label lb-streak-col">STREAK</div>
          </div>
          {rows.map(row => (
            <div key={row.username} className={`leaderboard-row ${row.is_me ? 'is-me' : ''}`}>
              <div className={`lb-rank ${row.rank <= 3 ? 'top3' : ''}`}>
                {row.rank === 1 ? '★' : row.rank === 2 ? '◈' : row.rank === 3 ? '◉' : `#${row.rank}`}
              </div>
              <div className="lb-username">
                {row.username}
                {row.is_me && <span className="lb-me-tag">YOU</span>}
              </div>
              <div className="lb-val cyan">{row.shows_attended}</div>
              <div className="lb-val orange">{row.shows_rated}</div>
              <div className="lb-val green">{row.avg_score ?? '—'}</div>
              <div className="lb-val lb-streak-col">{row.login_streak > 1 ? `⚡${row.login_streak}` : '—'}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}


// ============================================================
// ADMIN TAB
// ============================================================
function AdminTab({ api, showMessage, showError }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null); // { userId, action }
  const [working, setWorking] = useState(null);
  const [migrationResult, setMigrationResult] = useState(null); // { results: [...] }

  const loadUsers = () => {
    setLoading(true);
    api.get('/admin/users')
      .then(setUsers)
      .catch(err => showError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const doAction = async (userId, action, method = 'POST') => {
    setWorking(`${userId}-${action}`);
    try {
      if (method === 'DELETE') {
        await api.post(`/admin/user?id=${userId}&_method=DELETE`, {});
        // Actually use fetch directly for DELETE
        const token = localStorage.getItem('phish_token');
        const res = await fetch(`/api/admin/user?id=${userId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        const token = localStorage.getItem('phish_token');
        const res = await fetch(`/api/admin/user?id=${userId}&action=${action}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (action === 'reset-password') {
          // email sent — confirm modal handles feedback
        } else if (action === 'reset-onboarding') {
          loadUsers();
        } else if (action === 'clear-data') {
          loadUsers();
        }
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setWorking(null);
      setConfirming(null);
    }
  };

  const runMigrations = async () => {
    setWorking('migrate');
    try {
      const token = localStorage.getItem('phish_token');
      const res = await fetch('/api/admin/migrate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setMigrationResult(data);
      loadUsers();
    } catch (err) {
      setMigrationResult({ error: err.message });
    } finally {
      setWorking(null);
    }
  };

  if (loading) return <FullPageLoader text="LOADING USERS..." />;

  return (
    <div>
      {/* Migration result modal */}
      {migrationResult && (
        <div className="modal-overlay" style={{ zIndex: 700 }}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-title" style={{ color: migrationResult.error ? 'var(--red)' : 'var(--cyan)' }}>
              {migrationResult.error ? 'MIGRATION ERROR' : 'MIGRATIONS COMPLETE'}
            </div>
            {migrationResult.error ? (
              <p style={{ color: 'var(--red)', fontSize: '0.8rem', marginBottom: 20 }}>{migrationResult.error}</p>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'rgba(51,255,51,0.4)', letterSpacing: '2px' }}>
                    {migrationResult.results?.filter(r => r.status === 'ok').length} OK
                    {migrationResult.results?.filter(r => r.status === 'error').length > 0 &&
                      ` · ${migrationResult.results.filter(r => r.status === 'error').length} FAILED`}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '50vh', overflowY: 'auto', marginBottom: 20 }}>
                  {migrationResult.results?.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: r.status === 'ok' ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-display)', fontSize: '0.7rem', flexShrink: 0 }}>
                        {r.status === 'ok' ? '✓' : '✗'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: r.status === 'ok' ? 'rgba(51,255,51,0.7)' : 'var(--red)' }}>
                        {r.migration}
                      </span>
                      {r.error && (
                        <span style={{ fontSize: '0.6rem', color: 'var(--red)', opacity: 0.7 }}>{r.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            <button className="btn-primary" style={{ width: '100%', padding: '13px' }} onClick={() => setMigrationResult(null)}>
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Confirm overlay */}
      {confirming && (
        <div className="modal-overlay" style={{ zIndex: 600 }}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-title" style={{ color: 'var(--red)' }}>CONFIRM</div>
            {confirming.action === 'delete' && (
              <p style={{ fontSize: '0.85rem', color: 'rgba(51,255,51,0.8)', marginBottom: 24, lineHeight: 1.6 }}>
                Delete <strong style={{ color: 'var(--red)' }}>{confirming.username}</strong>? This removes all their data permanently. Cannot be undone.
              </p>
            )}
            {confirming.action === 'clear-data' && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: '0.85rem', color: 'rgba(51,255,51,0.8)', lineHeight: 1.6, marginBottom: 12 }}>
                  Clear all show data for <strong style={{ color: 'var(--orange)' }}>{confirming.username}</strong>?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px', background: 'rgba(255,102,0,0.05)', border: '1px solid rgba(255,102,0,0.2)' }}>
                  {['All ratings', 'All attendance records', 'All imported reviews', 'KPI / streak data'].map(item => (
                    <div key={item} style={{ display: 'flex', gap: 8, fontSize: '0.75rem', color: 'rgba(255,102,0,0.8)' }}>
                      <span>✗</span><span>{item}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.7rem', color: 'rgba(51,255,51,0.4)', marginTop: 10 }}>Account and login are preserved.</p>
              </div>
            )}
            {confirming.action === 'reset-onboarding' && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: '0.85rem', color: 'rgba(51,255,51,0.8)', lineHeight: 1.6, marginBottom: 12 }}>
                  Reset onboarding for <strong style={{ color: 'var(--cyan)' }}>{confirming.username}</strong>?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px', background: 'rgba(0,224,208,0.04)', border: '1px solid rgba(0,224,208,0.15)' }}>
                  {['T&C acceptance cleared', 'Onboarding complete flag cleared', 'Profile setup will re-fire on next login'].map(item => (
                    <div key={item} style={{ display: 'flex', gap: 8, fontSize: '0.75rem', color: 'rgba(0,224,208,0.7)' }}>
                      <span>↺</span><span>{item}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.7rem', color: 'rgba(51,255,51,0.4)', marginTop: 10 }}>Show data and ratings are not affected.</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-primary"
                style={{ flex: 1, borderColor: confirming.action === 'delete' ? 'var(--red)' : 'var(--orange)', color: confirming.action === 'delete' ? 'var(--red)' : 'var(--orange)' }}
                onClick={() => {
                  if (confirming.action === 'delete') doAction(confirming.userId, null, 'DELETE');
                  else doAction(confirming.userId, confirming.action);
                }}
                disabled={!!working}
              >
                {working ? '◈ WORKING...' : 'CONFIRM'}
              </button>
              <button style={{ flex: 1 }} onClick={() => setConfirming(null)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-title">ADMIN</div>

        {/* DB controls */}
        <div className="admin-controls">
          <button
            className="admin-action-btn"
            onClick={runMigrations}
            disabled={working === 'migrate'}
            style={{ borderColor: 'var(--cyan)', color: 'var(--cyan)' }}
          >
            {working === 'migrate' ? 'RUNNING...' : '⚙ RUN MIGRATIONS'}
          </button>
        </div>

        {/* User count */}
        <div className="admin-stat-bar">
          <span>{users.length} REGISTERED USER{users.length !== 1 ? 'S' : ''}</span>
        </div>

        {/* User cards — mobile-first card layout */}
        <div className="admin-user-list">
          {users.map(u => (
            <div key={u.id} className={`admin-user-card ${u.is_admin ? 'admin-user-card-admin' : ''}`}>
              <div className="admin-user-header">
                <div className="admin-user-identity">
                  <span className="admin-user-name">{u.username}</span>
                  {u.is_admin && <span className="admin-badge">ADMIN</span>}
                </div>
                <div className="admin-user-meta">
                  <span className="admin-user-email">{u.email}</span>
                  <span className="admin-user-joined">Joined {u.joined}</span>
                </div>
              </div>

              <div className="admin-user-stats">
                <div className="admin-stat-item">
                  <span className="admin-stat-val cyan">{u.shows_attended}</span>
                  <span className="admin-stat-lbl">ATTENDED</span>
                </div>
                <div className="admin-stat-item">
                  <span className="admin-stat-val orange">{u.shows_rated}</span>
                  <span className="admin-stat-lbl">RATED</span>
                </div>
                <div className="admin-stat-item">
                  <span className="admin-stat-val green">{u.reviews}</span>
                  <span className="admin-stat-lbl">REVIEWS</span>
                </div>
                <div className="admin-stat-item">
                  <span className="admin-stat-val" style={{ color: u.tandc_accepted ? 'var(--green)' : 'rgba(51,255,51,0.25)' }}>
                    {u.tandc_accepted ? '✓' : '✗'}
                  </span>
                  <span className="admin-stat-lbl">T&C</span>
                </div>
                <div className="admin-stat-item">
                  <span className="admin-stat-val" style={{ color: u.onboarding_complete ? 'var(--green)' : 'rgba(51,255,51,0.25)' }}>
                    {u.onboarding_complete ? '✓' : '✗'}
                  </span>
                  <span className="admin-stat-lbl">ONBOARD</span>
                </div>
              </div>

              <div className="admin-user-actions">
                <button
                  className="admin-action-btn"
                  onClick={() => setConfirming({ userId: u.id, username: u.username, action: 'reset-onboarding' })}
                  disabled={!!working}
                >
                  RESET ONBOARDING
                </button>
                <button
                  className="admin-action-btn"
                  onClick={() => doAction(u.id, 'reset-password')}
                  disabled={!!working}
                >
                  {working === `${u.id}-reset-password` ? 'SENDING...' : 'RESET PASSWORD'}
                </button>
                <button
                  className="admin-action-btn"
                  style={{ borderColor: 'rgba(255,102,0,0.5)', color: 'var(--orange)' }}
                  onClick={() => setConfirming({ userId: u.id, username: u.username, action: 'clear-data' })}
                  disabled={!!working}
                >
                  CLEAR DATA
                </button>
                {!u.is_admin && (
                  <button
                    className="admin-action-btn"
                    style={{ borderColor: 'rgba(255,51,51,0.5)', color: 'var(--red)' }}
                    onClick={() => setConfirming({ userId: u.id, username: u.username, action: 'delete' })}
                    disabled={!!working}
                  >
                    DELETE USER
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ROOT APP
// ============================================================
export default function App() {
  const [tab, setTab] = useState('scorecard');
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [messages, setMessages] = useState([]);
  const [mikeError, setMikeError] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [showTandC, setShowTandC] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [pendingImportOnMyShows, setPendingImportOnMyShows] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showFirstShowPrompt, setShowFirstShowPrompt] = useState(false);
  const [rateShowDate, setRateShowDate] = useState(null); // set when navigating from My Shows to Scorecard
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(132);
  const stickyHeaderRef = useRef(null);
  const api = useApi();

  const showMessage = useCallback((text, type = 'info') => {
    const id = Date.now() + Math.random();
    setMessages(prev => [...prev, { id, text, type }]);
    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 4000);
  }, []);

  const showError = useCallback((text) => setMikeError(text), []);

  useEffect(() => {
    const token = localStorage.getItem('phish_token');
    if (!token) return;
    api.get('/auth/me').then(u => {
      setUser(u);
      if (!u.tandc_accepted) {
        setShowTandC(true);
      } else if (!sessionStorage.getItem('phreezer_welcomed')) {
        sessionStorage.setItem('phreezer_welcomed', '1');
        setShowWelcome(true);
      }
    }).catch(() => localStorage.removeItem('phish_token'));
  }, []);

  const handleTandCAccept = async () => {
    setShowTandC(false);
    try {
      await api.post('/auth/accept?field=tandc', {});
      setUser(u => ({ ...u, tandc_accepted: true }));
    } catch (e) {}
    // Show profile setup for new users (onboarding is queued after)
    if (!user?.onboarding_complete) {
      setShowProfileSetup(true);
    }
  };

  const handleAuthSuccess = (u, isNewUser = false) => {
    setUser(u);
    setShowAuth(false);
    if (!u.tandc_accepted) {
      setShowTandC(true);
      if (isNewUser) {
        setTimeout(() => setShowOnboarding(true), 100);
      }
    } else if (isNewUser && !u.onboarding_complete) {
      setShowOnboarding(true);
    } else if (!isNewUser) {
      setShowWelcome(true);
    }
  };

  const handleLogout = () => { localStorage.removeItem('phish_token'); setUser(null); setTab('scorecard'); setAvatarOpen(false); };
  const openAuth = (mode = 'login') => { setAuthMode(mode); setShowAuth(true); };

  // Measure sticky header height dynamically
  useEffect(() => {
    const el = stickyHeaderRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setHeaderHeight(el.offsetHeight);
    });
    ro.observe(el);
    setHeaderHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // Navigate from My Shows → Scorecard with a specific show pre-loaded
  const handleRateShow = (showDate) => {
    setRateShowDate(showDate);
    setTab('scorecard');
  };

  // After onboarding, navigate to My Shows with import panel open
  const handleProfileSetupComplete = () => {
    setShowProfileSetup(false);
    if (!user?.onboarding_complete) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingImport = async () => {
    setShowOnboarding(false);
    try {
      await api.post('/auth/accept?field=onboarding', {});
      setUser(u => ({ ...u, onboarding_complete: true }));
    } catch (e) {}
    setPendingImportOnMyShows(true);
    setTimeout(() => setTab('my-shows'), 100);
  };

  const handleOnboardingScorecard = async () => {
    setShowOnboarding(false);
    try {
      await api.post('/auth/accept?field=onboarding', {});
      setUser(u => ({ ...u, onboarding_complete: true }));
    } catch (e) {}
    setTab('scorecard');
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    try {
      await api.post('/auth/accept?field=onboarding', {});
      setUser(u => ({ ...u, onboarding_complete: true }));
    } catch (e) {}
    setShowFirstShowPrompt(true);
  };

  const renderMain = (isMobile = false) => (
    <>
      {tab === 'scorecard' && (
        <ScorecardTab
          api={api}
          showMessage={showMessage}
          showError={showError}
          onAuthRequired={() => openAuth('login')}
          initialShowDate={rateShowDate}
          onShowLoaded={() => setRateShowDate(null)}
        />
      )}
      {tab === 'my-shows' && user && (
        <MyShowsTab
          api={api}
          showMessage={showMessage}
          showError={showError}
          onRateShow={handleRateShow}
          openImportOnMount={pendingImportOnMyShows}
        />
      )}
      {tab === 'analytics' && user && <AnalyticsTab api={api} showMessage={showMessage} showError={showError} />}
      {tab === 'community' && <CommunityTab api={api} />}
      {tab === 'profile' && user && <ProfileTab api={api} user={user} />}
      {tab === 'admin' && user?.is_admin && <AdminTab api={api} showMessage={showMessage} showError={showError} />}
    </>
  );

  return (
    <div className="app-shell">
      {mikeError && <MikeError message={mikeError} onClose={() => setMikeError(null)} />}
      <div className="messages-container">
        {messages.map(m => <div key={m.id} className={`message ${m.type}`}>{m.text}</div>)}
      </div>

      {/* Welcome back celebration */}
      {showWelcome && !showTandC && !showOnboarding && (
        <WelcomeCelebration username={user?.username} onDone={() => setShowWelcome(false)} />
      )}

      {/* T&C fires first */}
      {showTandC && !showOnboarding && <TandCModal onAccept={handleTandCAccept} />}

      {/* Profile setup fires after T&C for new users */}
      {showProfileSetup && !showTandC && !showOnboarding && (
        <ProfileSetupModal api={api} onComplete={handleProfileSetupComplete} />
      )}

      {/* Onboarding fires after T&C for new users */}
      {showOnboarding && !showTandC && !showProfileSetup && (
        <OnboardingFlow
          user={user}
          onComplete={handleOnboardingComplete}
          onStartImport={handleOnboardingImport}
          onGoToScorecard={handleOnboardingScorecard}
        />
      )}

      {/* DESKTOP LAYOUT: sidebar + main */}
      <div className="desktop-layout">
        <Sidebar
          tab={tab}
          setTab={setTab}
          user={user}
          onLogin={openAuth}
          onLogout={handleLogout}
          expanded={sidebarExpanded}
          setExpanded={setSidebarExpanded}
        />
        <div className="main-area">
          <div className="marquee-bar">
            <span className="marquee-track">
              DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp; DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp; DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp; DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp;
            </span>
          </div>
          <div className="container">
            {renderMain()}
          </div>
        </div>
      </div>

      {/* MOBILE LAYOUT: original header + tabs */}
      <div className="mobile-layout">
        <div className="mobile-sticky-header" ref={stickyHeaderRef}>
          <div className="marquee-bar">
            <span className="marquee-track">
              DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp; DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp; DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp;
            </span>
          </div>
          <header className="app-header">
            <div className="header-left">
              <div className="header-title">
                <img
                  src="/assets/phreezer-logo.svg"
                  alt="The Phreezer"
                  className="mobile-header-logo"
                  onClick={() => {
                    if (!user?.is_admin) return;
                    const now = Date.now();
                    if (!window._logoTaps) window._logoTaps = [];
                    window._logoTaps = window._logoTaps.filter(t => now - t < 800);
                    window._logoTaps.push(now);
                    if (window._logoTaps.length >= 3) {
                      window._logoTaps = [];
                      setTab('admin');
                    }
                  }}
                  style={{ cursor: user?.is_admin ? 'pointer' : 'default' }}
                />
              </div>
            </div>
            <div className="header-right">
              <div className="header-auth">
                {user ? (
                  <div className="avatar-wrap">
                    <button
                      className="avatar-btn"
                      onClick={() => setAvatarOpen(o => !o)}
                      aria-label="Account menu"
                    >
                      {user.username.slice(0,2).toUpperCase()}
                    </button>
                    {avatarOpen && (
                      <>
                        <div className="avatar-backdrop" onClick={() => setAvatarOpen(false)} />
                        <div className="avatar-menu">
                          <div className="avatar-menu-user">◈ {user.username}</div>
                          <button className="avatar-menu-item" onClick={() => { setTab('profile'); setAvatarOpen(false); }}>PROFILE</button>
                          <button className="avatar-menu-item avatar-menu-signout" onClick={handleLogout}>SIGN OUT</button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <><button onClick={() => openAuth('login')}>LOGIN</button><button className="btn-primary" onClick={() => openAuth('signup')}>REGISTER</button></>
                )}
              </div>
            </div>
          </header>
          <nav className="tab-nav">
            <button className={`tab-btn ${tab === 'scorecard' ? 'active' : ''}`} onClick={() => setTab('scorecard')}>SCORECARD</button>
            {user && <>
              <button className={`tab-btn ${['my-shows','analytics'].includes(tab) ? 'active' : ''}`} onClick={() => setTab('my-shows')}>MY PHREEZER</button>
              <button className={`tab-btn ${['community','leaderboard'].includes(tab) ? 'active' : ''}`} onClick={() => setTab('community')}>COMMUNITY</button>
              <button className={`tab-btn ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>PROFILE</button>
            </>}
          </nav>
          {user && ['my-shows','analytics'].includes(tab) && (
            <div className="sub-tab-nav">
              <button className={`sub-tab-btn ${tab === 'my-shows' ? 'active' : ''}`} onClick={() => setTab('my-shows')}>MY SHOWS</button>
              <button className={`sub-tab-btn ${tab === 'analytics' ? 'active' : ''}`} onClick={() => setTab('analytics')}>ANALYTICS</button>
            </div>
          )}
          {user && ['community','leaderboard'].includes(tab) && (
            <div className="sub-tab-nav">
              <button className={`sub-tab-btn ${tab === 'community' ? 'active' : ''}`} onClick={() => setTab('community')}>LEADERBOARD</button>
            </div>
          )}
        </div>
        <div className="mobile-scroll-body" style={{ paddingTop: headerHeight }}>
          <div className="container">
            {renderMain(true)}
          </div>
        </div>
      </div>

      {showAuth && <AuthModal mode={authMode} setMode={setAuthMode} onSuccess={handleAuthSuccess} onClose={() => setShowAuth(false)} />}

      {showFirstShowPrompt && (
        <div className="modal-overlay" style={{ zIndex: 750 }}>
          <div className="modal" style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>❄</div>
            <div className="modal-title" style={{ fontSize: '1rem', letterSpacing: '3px' }}>LET'S GO BACKWARDS</div>
            <p style={{ fontSize: '0.78rem', color: 'rgba(51,255,51,0.65)', lineHeight: 1.7, margin: '16px 0 24px', letterSpacing: '0.5px' }}>
              Take a trip down memory lane. Rate the first show you ever attended — then keep going backwards down the number line.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '13px' }}
                onClick={() => {
                  setShowFirstShowPrompt(false);
                  setTab('scorecard');
                }}
              >
                ◈ RATE MY FIRST SHOW
              </button>
              <button style={{ width: '100%', padding: '11px', fontSize: '0.6rem' }} onClick={() => setShowFirstShowPrompt(false)}>
                MAYBE LATER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
