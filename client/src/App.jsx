import React, { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';

const API = '/api';
const PNET = 'https://phish.net';
const RELISTEN = 'https://relisten.net/phish';


// ── FEEDBACK COMPONENTS ──

const PASSIVE_SECTIONS = [
  'Onboarding', 'Scorecard / Rating', 'My Phreezer', 'Deep Phreeze',
  'On This Day', 'Import / phish.net sync', 'Stats & Analytics',
  'Community', 'Account / Profile', 'Other'
];

function FeedbackModal({ type, api, onClose }) {
  const [answers, setAnswers] = useState({});
  const [freeText, setFreeText] = useState('');
  const [section, setSection] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const questions = type === 'post_rating' ? [
    { id: 'q1', text: 'How did rating that show feel?' },
    { id: 'q2', text: 'Is the score you gave it what you actually think of that show, or did the UI push you one way?' },
    { id: 'q3', text: 'What\'s missing from the rating experience that you wish was there?' },
  ] : type === 'week1' ? [
    { id: 'q1', text: 'What\'s the one thing you\'ve actually come back to use more than once?' },
    { id: 'q2', text: 'What did you expect to find that wasn\'t there?' },
    { id: 'q3', text: 'If you told a friend about Phreezer, what would you say it does?' },
  ] : [];

  const isPassive = type === 'passive';
  const title = type === 'post_rating' ? 'HOW DID THAT FEEL?' : type === 'week1' ? 'ONE WEEK IN — REAL TALK' : 'SEND FEEDBACK';

  const canSubmit = isPassive ? (freeText.trim().length > 0 && section) : questions.every(q => answers[q.id]?.trim());

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('phish_token')}` },
        body: JSON.stringify({ trigger_type: type, section: section || null, answers, free_text: freeText || null }),
      });
      setDone(true);
      setTimeout(onClose, 1800);
    } catch (e) {
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const S = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900, padding: '16px' },
    modal: { background: 'var(--bg-elevated)', border: '1px solid rgba(51,255,51,0.2)', padding: '28px 24px', maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' },
    title: { fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '3px', color: 'var(--cyan)', marginBottom: 20 },
    qLabel: { fontFamily: 'var(--font-display)', fontSize: '0.48rem', letterSpacing: '2px', color: 'rgba(51,255,51,0.55)', marginBottom: 8, display: 'block' },
    textarea: { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '10px 12px', resize: 'vertical', minHeight: 72, boxSizing: 'border-box', marginBottom: 18 },
    select: { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '10px 12px', marginBottom: 18, appearance: 'none' },
  };

  if (done) return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>❄</div>
        <div style={S.title}>PHROZEN IN. THANKS.</div>
      </div>
    </div>
  );

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.title}>{title}</div>

        {isPassive && (
          <>
            <label style={S.qLabel}>WHICH SECTION?</label>
            <select style={S.select} value={section} onChange={e => setSection(e.target.value)}>
              <option value="">— SELECT —</option>
              {PASSIVE_SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label style={S.qLabel}>WHAT\'S ON YOUR MIND?</label>
            <textarea style={S.textarea} value={freeText} onChange={e => setFreeText(e.target.value)} placeholder="Tell us what\'s working, broken, or missing..." />
          </>
        )}

        {!isPassive && questions.map((q, idx) => (
          <div key={q.id}>
            <label style={S.qLabel}>{String(idx + 1).padStart(2,'0')} — {q.text}</label>
            <textarea style={S.textarea} value={answers[q.id] || ''} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} placeholder="..." />
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button className="btn-primary" style={{ flex: 1, padding: '12px', opacity: canSubmit ? 1 : 0.4 }} onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? '...' : '◈ SUBMIT'}
          </button>
          <button style={{ padding: '12px 16px', fontSize: '0.55rem' }} onClick={onClose}>SKIP</button>
        </div>
      </div>
    </div>
  );
}

function PassiveFeedbackButton({ api }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: 80, right: 16, zIndex: 500,
          background: 'var(--bg-elevated)', border: '1px solid rgba(51,255,51,0.2)',
          color: 'rgba(51,255,51,0.45)', fontFamily: 'var(--font-display)',
          fontSize: '0.55rem', letterSpacing: '2px', padding: '10px 16px',
          cursor: 'pointer', borderRadius: 0,
        }}
        title="Send feedback"
      >
        ◈ FEEDBACK
      </button>
      {open && <FeedbackModal type="passive" api={api} onClose={() => setOpen(false)} />}
    </>
  );
}

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
    if (!res.ok) throw new Error(`${res.status}: ${data.error || 'Request failed'}`);
    return data;
  }, []);
  return { get: p => request('GET', p), post: (p, b) => request('POST', p, b), delete: (p, b) => request('DELETE', p, b) };
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
    "We're glad glad glad that you've arrived.",
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
        <img src="/assets/phreezer-snowflake.png" alt="Phreezer" className="fullpage-snowflake" />
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
      body: 'Phreezer will always be free. But it takes real time and real overhead to keep it running. If you like what you see, consider keeping the Phreezer stocked. No pressure. No guilt. Just appreciation if the spirit moves you.',
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
            <button className="btn-primary" style={{ width: '100%', padding: '14px', marginBottom: 10 }} onClick={() => { onGoToScorecard(); }}>
              LET'S GO
            </button>
            <a href="https://buymeacoffee.com/mpgink" target="_blank" rel="noopener noreferrer"
              style={{ width: '100%', padding: '12px', display: 'block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box', border: '1px solid rgba(255,102,0,0.3)', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.52rem', letterSpacing: '2px' }}>
              ☕ KEEP THE PHREEZER STOCKED
            </a>
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
  // Flow state
  const [step, setStep] = useState('import'); // 'import' | 'guilt' | 'manual' | 'success'

  const loadOptions = async () => {
    try {
      const data = await api.get('/user/profile-options');
      if (data.songs?.length) setSongs(data.songs);
      if (data.venues?.length) setVenues(data.venues);
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
      await loadOptions();
      setStep('success');
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

  const S = { // shared styles
    field: { marginBottom: 18 },
    label: { fontFamily: 'var(--font-display)', fontSize: '0.46rem', letterSpacing: '2.5px', color: 'var(--text-label)', marginBottom: 8, display: 'block' },
    hint: { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 5 },
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 850 }}>
      <div className="modal" style={{ maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>

        {/* ── STEP: IMPORT ── */}
        {step === 'import' && (
          <>
            <div className="modal-title">SET UP YOUR PROFILE</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(51,255,51,0.5)', letterSpacing: '1px', marginBottom: 24, lineHeight: 1.6 }}>
              Import your history from phish.net to unlock your stats, song dropdowns, and Deep Phreeze.
            </div>

            <div style={S.field}>
              <label style={S.label}>PHISH.NET USERNAME</label>
              <input
                type="text"
                placeholder="e.g. mgolia6"
                value={phishnetUsername}
                className="modal-input"
                onChange={e => { setPhishnetUsername(e.target.value); setConfirmedHandle(false); }}
              />
              {phishnetUsername && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 10, cursor: 'pointer' }} onClick={() => setConfirmedHandle(v => !v)}>
                  <input type="checkbox" checked={confirmedHandle} onChange={e => setConfirmedHandle(e.target.checked)} style={{ flexShrink: 0, marginTop: 3, accentColor: 'var(--orange)', width: 16, height: 16 }} />
                  <span style={{ fontSize: '0.72rem', color: 'rgba(51,255,51,0.75)', letterSpacing: '0.5px', lineHeight: 1.5 }}>I confirm this is my phish.net account</span>
                </div>
              )}
            </div>

            {/* Locked fields — shown dimmed, not editable until import or skip confirmed */}
            <div style={{ opacity: 0.3, pointerEvents: 'none', marginBottom: 20 }}>
              <div style={S.field}>
                <label style={S.label}>FAVORITE SONG</label>
                <div style={{ padding: '10px 12px', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>
                  — import first to unlock —
                </div>
              </div>
              <div style={S.field}>
                <label style={S.label}>FAVORITE VENUE</label>
                <div style={{ padding: '10px 12px', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>
                  — import first to unlock —
                </div>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', padding: '14px', marginBottom: 10, fontSize: '0.65rem', opacity: (!phishnetUsername || !confirmedHandle) ? 0.4 : 1 }}
              onClick={handleImport}
              disabled={importing || !phishnetUsername || !confirmedHandle}
            >
              {importing ? '◈ IMPORTING...' : '↓ IMPORT FROM PHISH.NET'}
            </button>

            <button
              style={{ width: '100%', padding: '11px', background: 'transparent', border: '1px solid rgba(51,255,51,0.15)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.48rem', letterSpacing: '2px', cursor: 'pointer' }}
              onClick={() => setStep('guilt')}
            >
              SKIP IMPORT
            </button>
          </>
        )}

        {/* ── STEP: GUILT ── */}
        {step === 'guilt' && (
          <>
            <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12, filter: 'grayscale(1)', opacity: 0.5 }}>❄</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 900, color: 'rgba(51,255,51,0.3)', letterSpacing: '3px', marginBottom: 16, lineHeight: 1.2 }}>
                DON'T SUCK<br/>AT PHISH.
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
                Your stats will be empty.<br/>
                Your Deep Phreeze will be dark.<br/>
                Your first show will be a mystery.
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'rgba(51,255,51,0.3)', letterSpacing: '2px', marginBottom: 28 }}>
                ARE YOU SURE?
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', padding: '14px', marginBottom: 10 }}
              onClick={() => setStep('import')}
            >
              ◀ GO BACK AND IMPORT
            </button>
            <button
              style={{ width: '100%', padding: '11px', background: 'transparent', border: '1px solid rgba(255,51,51,0.2)', color: 'rgba(255,51,51,0.5)', fontFamily: 'var(--font-display)', fontSize: '0.44rem', letterSpacing: '2px', cursor: 'pointer' }}
              onClick={() => setStep('manual')}
            >
              PROCEED WITHOUT IMPORTING
            </button>
          </>
        )}

        {/* ── STEP: MANUAL (skipped import) ── */}
        {step === 'manual' && (
          <>
            <div className="modal-title">SET UP YOUR PROFILE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'rgba(255,51,51,0.5)', letterSpacing: '1px', marginBottom: 20, lineHeight: 1.6, borderLeft: '2px solid rgba(255,51,51,0.3)', paddingLeft: 10 }}>
              No import — entering manually. You can always import later from your profile.
            </div>

            <div style={S.field}>
              <label style={S.label}>FAVORITE SONG</label>
              <input type="text" placeholder="e.g. Tweezer" value={favoriteSong} className="modal-input" onChange={e => setFavoriteSong(e.target.value)} />
            </div>

            <div style={S.field}>
              <label style={S.label}>FAVORITE VENUE</label>
              <input type="text" placeholder="e.g. Madison Square Garden" value={favoriteVenue} className="modal-input" onChange={e => setFavoriteVenue(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn-primary" style={{ flex: 1, padding: '13px' }} onClick={handleSave} disabled={saving}>
                {saving ? 'SAVING...' : 'SAVE PROFILE'}
              </button>
              <button style={{ flex: 1, padding: '13px' }} onClick={onComplete}>
                SKIP FOR NOW
              </button>
            </div>
          </>
        )}

        {/* ── STEP: SUCCESS (import done) ── */}
        {step === 'success' && (
          <>
            <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
              {/* Celebration */}
              <div style={{ fontSize: '3rem', marginBottom: 10, animation: 'pulse 1s infinite' }}>❄</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 900, color: 'var(--cyan)', letterSpacing: '3px', marginBottom: 8, textShadow: '0 0 30px rgba(0,255,255,0.5)' }}>
                PHROZEN IN.
              </div>
              {importCount && (
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--green)', letterSpacing: '2px', marginBottom: 6 }}>
                  ✓ {importCount.attendance} SHOWS · {importCount.reviews} REVIEWS
                </div>
              )}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
                Your history is locked in.<br/>Now pick your favorites.
              </div>
            </div>

            {/* Favorite song — now unlocked with dropdown */}
            <div style={S.field}>
              <label style={S.label}>FAVORITE SONG</label>
              {songs.length > 0 ? (
                <select value={favoriteSong} onChange={e => setFavoriteSong(e.target.value)} className="era-select" style={{ width: '100%' }}>
                  <option value="">— SELECT A SONG —</option>
                  {songs.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input type="text" placeholder="e.g. Tweezer" value={favoriteSong} className="modal-input" onChange={e => setFavoriteSong(e.target.value)} />
              )}
              {songs.length > 0 && <div style={S.hint}>{songs.length} songs from your ratings</div>}
            </div>

            {/* Favorite venue — unlocked with dropdown */}
            <div style={S.field}>
              <label style={S.label}>FAVORITE VENUE</label>
              {venues.length > 0 ? (
                <select value={favoriteVenue} onChange={e => setFavoriteVenue(e.target.value)} className="era-select" style={{ width: '100%' }}>
                  <option value="">— SELECT A VENUE —</option>
                  {venues.map((v, i) => (
                    <option key={i} value={v.venue}>{v.venue}{v.city ? ` — ${v.city}${v.state ? `, ${v.state}` : ''}` : ''}</option>
                  ))}
                </select>
              ) : (
                <input type="text" placeholder="e.g. Madison Square Garden" value={favoriteVenue} className="modal-input" onChange={e => setFavoriteVenue(e.target.value)} />
              )}
              {venues.length > 0 && <div style={S.hint}>{venues.length} venues from your history</div>}
            </div>

            {favoriteShowDate && (
              <div style={S.field}>
                <label style={S.label}>FIRST SHOW ◈ AUTO-SET</label>
                <div style={{ padding: '10px 12px', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--cyan)', background: 'rgba(0,224,208,0.04)' }}>
                  {favoriteShowLabel}
                </div>
                <div style={S.hint}>Your earliest attended show</div>
              </div>
            )}

            <button className="btn-primary" style={{ width: '100%', padding: '14px', marginTop: 8 }} onClick={handleSave} disabled={saving}>
              {saving ? 'SAVING...' : "LET'S GO ◈"}
            </button>
          </>
        )}

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
    { id: 'my-shows',  label: 'MY SHOWS',  glyph: '◉', section: null, authRequired: true },
    { id: 'my-songs',  label: 'MY SONGS',  glyph: '♪', section: null, authRequired: true },
    { id: 'my-venues', label: 'MY VENUES', glyph: '⌖', section: null, authRequired: true },
    { id: 'my-states', label: 'MY STATES', glyph: '⬡', section: null, authRequired: true },
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
              src="/assets/phreezer-logo.png"
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
            <img src="/assets/phreezer-snowflake.png" alt="Phreezer" className="sidebar-logo-img-collapsed" />
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
              <div className="sidebar-avatar" style={{ fontSize: user.avatar_icon ? '1rem' : undefined }}>{user.avatar_icon || user.username?.[0]?.toUpperCase() || '?'}</div>
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
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    api.get('/user/kpi')
      .then(setKpi)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageLoader text="LOADING STATS..." />;
  if (!kpi) return null;

  const rated = kpi.shows_rated || 0;
  const attended = kpi.shows_attended || 0;
  const ratedMilestones = [10, 25, 50, 100, 250];
  const attendedMilestones = [25, 50, 100, 200, 500];
  const nextRated = ratedMilestones.find(m => m > rated) || ratedMilestones[ratedMilestones.length - 1];
  const nextAttended = attendedMilestones.find(m => m > attended) || attendedMilestones[attendedMilestones.length - 1];
  const ratedPct = Math.min((rated / nextRated) * 100, 100);
  const attendedPct = Math.min((attended / nextAttended) * 100, 100);

  return (
    <div style={{ marginBottom: 10 }}>
      {/* Compact summary row */}
      <div style={{
        width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderBottom: 'none', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 0,
      }}>
        {[
          { val: attended,                  lbl: 'ATT',   col: 'var(--cyan)'   },
          { val: rated,                     lbl: 'RATED', col: 'var(--orange)' },
          { val: kpi.avg_score ?? '—',     lbl: 'AVG',   col: 'var(--green)'  },
          { val: kpi.shows_with_reviews,    lbl: 'REV',   col: 'var(--cyan)'   },
        ].map(({ val, lbl, col }, i) => (
          <div key={lbl} style={{ flex: 1, textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(51,255,51,0.1)' : 'none', padding: '0 4px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: col, lineHeight: 1, letterSpacing: 1 }}>{val}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.36rem', color: 'var(--text-muted)', letterSpacing: '1.5px', marginTop: 3 }}>{lbl}</div>
          </div>
        ))}
        {kpi.login_streak > 1 && (
          <div style={{ paddingLeft: 10, borderLeft: '1px solid rgba(51,255,51,0.1)', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--orange)', lineHeight: 1 }}>⚡{kpi.login_streak}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.34rem', color: 'var(--text-muted)', letterSpacing: '1px', marginTop: 3 }}>STREAK</div>
          </div>
        )}
      </div>

      {/* DIVE DEEP — full-width glowing tab below stats */}
      <button onClick={() => setExpanded(e => !e)} style={{
        width: '100%', cursor: 'pointer',
        background: expanded ? 'rgba(0,224,208,0.08)' : 'rgba(0,224,208,0.04)',
        border: '1px solid rgba(0,224,208,0.35)',
        borderTop: expanded ? '1px solid rgba(0,224,208,0.35)' : 'none',
        padding: '22px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: expanded ? '0 0 10px rgba(0,224,208,0.2)' : '0 0 22px rgba(0,224,208,0.5), inset 0 0 20px rgba(0,224,208,0.06)',
        transition: 'all 0.2s',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--cyan)', letterSpacing: '3px', textShadow: '0 0 14px rgba(0,224,208,0.9)' }}>
          {expanded ? '▲ CLOSE' : '❄ DIVE DEEP'}
        </span>
        {!expanded && (
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'rgba(0,224,208,0.65)', letterSpacing: '2px' }}>
            — TAP FOR FULL STATS
          </span>
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ border: '1px solid var(--border)', borderTop: 'none', padding: '12px 14px', background: 'var(--bg-panel)' }}>
          {(kpi.top_song || kpi.top_venue || kpi.first_show) && (
            <div style={{ borderLeft: '3px solid var(--orange)', paddingLeft: 10, marginBottom: 12 }}>
              {[
                kpi.top_song   ? ['TOP SONG',    kpi.top_song.song_name,     `(${kpi.top_song.avg})`,     'var(--orange)'] : null,
                kpi.top_venue  ? ['MOST VISITED', kpi.top_venue.venue,        `(${kpi.top_venue.shows}x)`, 'var(--cyan)']   : null,
                kpi.first_show ? ['FIRST SHOW',   formatDate(kpi.first_show), '',                          'var(--cyan)']   : null,
              ].filter(Boolean).map(([l, v, s, col], i, arr) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--text-label)', letterSpacing: '2px', flexShrink: 0 }}>{l}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--white)', textAlign: 'right', marginLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v} <span style={{ color: col, fontSize: '0.7rem' }}>{s}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--white)' }}>Shows rated</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--cyan)', letterSpacing: '1px' }}>{rated} / {nextRated}</span>
            </div>
            <div style={{ height: 3, background: 'rgba(51,255,51,0.1)', borderRadius: 2 }}>
              <div style={{ width: `${ratedPct}%`, height: '100%', background: 'var(--cyan)', boxShadow: '0 0 6px rgba(0,255,255,0.5)', borderRadius: 2, transition: 'width 0.6s' }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--white)' }}>Shows attended</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--orange)', letterSpacing: '1px' }}>{attended} / {nextAttended}</span>
            </div>
            <div style={{ height: 3, background: 'rgba(51,255,51,0.1)', borderRadius: 2 }}>
              <div style={{ width: `${attendedPct}%`, height: '100%', background: 'var(--orange)', boxShadow: '0 0 6px rgba(255,140,0,0.5)', borderRadius: 2, transition: 'width 0.6s' }} />
            </div>
          </div>
          {kpi.badges && kpi.badges.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12, paddingTop: 10, borderTop: '1px solid rgba(51,255,51,0.08)' }}>
              {kpi.badges.map(b => (
                <div key={b.id} title={b.desc} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', border: '1px solid rgba(51,255,51,0.22)', background: 'var(--bg-elevated)', fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--green)', letterSpacing: '1.5px' }}>
                  <span style={{ fontSize: '0.8rem' }}>{b.glyph}</span> {b.label}
                </div>
              ))}
            </div>
          )}
          {kpi.last_sync && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(51,255,51,0.08)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Last rated: {kpi.last_sync}</span>
              <a href="https://phish.net" target="_blank" rel="noopener noreferrer" style={{ background: 'transparent', border: '1px solid rgba(0,224,208,0.3)', color: 'var(--cyan)', fontFamily: 'var(--font-display)', fontSize: '0.42rem', letterSpacing: '2px', padding: '3px 8px', textDecoration: 'none' }}>↓ SYNC</a>
            </div>
          )}
        </div>
      )}
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
  const [phriends, setPhriends] = useState({ tagged: [], also_attended: [] });
  const [phriendInput, setPhriendInput] = useState('');
  const [phriendLoading, setPhriendLoading] = useState(false);
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
    setPhriends({ tagged: [], also_attended: [] });
    setPhriendInput('');
    try {
      const [showData, ratingsResp, audioData, phriendData] = await Promise.all([
        api.get(`/shows/${date}`),
        api.get(`/ratings/${date}`).catch(() => ({ ratings: [], attendance_type: null })),
        fetch(`${API}/audio/${date}`).then(r => r.json()).catch(() => ({ tracks: [] })),
        api.get(`/shows/companions?date=${date}`).catch(() => ({ tagged: [], also_attended: [] })),
      ]);
      setSongs(showData.songs || []);
      setCurrentShow(showData);
      setPhriends(phriendData || { tagged: [], also_attended: [] });
      const savedRatings = Array.isArray(ratingsResp) ? ratingsResp : (ratingsResp.ratings || []);
      const savedAttendance = (!Array.isArray(ratingsResp) && ratingsResp.attendance_type) ? ratingsResp.attendance_type : null;
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

  const handleTagPhriend = async () => {
    if (!phriendInput.trim() || !currentShow) return;
    setPhriendLoading(true);
    try {
      const res = await api.post('/shows/companions', { show_date: currentShow.showdate, companion_username: phriendInput.trim() });
      if (res.ok) {
        setPhriends(p => ({
          tagged: [...p.tagged, { user_id: res.companion.user_id, username: res.companion.username, their_score: null }],
          also_attended: p.also_attended.filter(c => c.user_id !== res.companion.user_id),
        }));
        setPhriendInput('');
      }
    } catch (e) { showError(e.message || 'User not found'); }
    finally { setPhriendLoading(false); }
  };

  const handleTagPhriendById = async (companion) => {
    if (!currentShow) return;
    try {
      const res = await api.post('/shows/companions', { show_date: currentShow.showdate, companion_username: companion.username });
      if (res.ok) {
        setPhriends(p => ({
          tagged: [...p.tagged, { user_id: companion.user_id, username: companion.username, their_score: null }],
          also_attended: p.also_attended.filter(c => c.user_id !== companion.user_id),
        }));
      }
    } catch (e) { showError(e.message || 'Could not tag user'); }
  };

  const handleUntagPhriend = async (companionUserId) => {
    if (!currentShow) return;
    try {
      await api.delete('/shows/companions', { show_date: currentShow.showdate, companion_user_id: companionUserId });
      setPhriends(p => ({ ...p, tagged: p.tagged.filter(c => c.user_id !== companionUserId) }));
    } catch (e) { showError('Could not remove tag'); }
  };

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
      // Track rating count for post-rating feedback trigger
      const newCount = parseInt(localStorage.getItem('phreezer_rating_count') || '0') + 1;
      localStorage.setItem('phreezer_rating_count', String(newCount));
      if (newCount === 5) {
        setTimeout(() => setFeedbackModal('post_rating'), 3000);
      }
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

          {/* ── PHRIENDS AT THIS SHOW — when attended, or when phriends already tagged ── */}
          {(attendanceType === 'attended' || phriends.tagged.length > 0) && (
            <div style={{
              border: '1px solid rgba(0,224,208,0.28)',
              background: 'linear-gradient(135deg, rgba(0,224,208,0.04), rgba(5,18,5,0.98))',
              marginBottom: 12, padding: 14,
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--cyan)', letterSpacing: '2.5px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                ◈ PHRIENDS AT THIS SHOW
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(0,224,208,0.25), transparent)' }} />
              </div>

              {/* Tag input */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  value={phriendInput}
                  onChange={e => setPhriendInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTagPhriend()}
                  placeholder="search phreezer username..."
                  style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,224,208,0.35)', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: '7px 10px', outline: 'none' }}
                />
                <button onClick={handleTagPhriend} disabled={phriendLoading || !phriendInput.trim()}
                  style={{ background: 'rgba(0,224,208,0.07)', border: '1px solid rgba(0,224,208,0.35)', color: 'var(--cyan)', fontFamily: 'var(--font-display)', fontSize: '0.38rem', letterSpacing: '2px', padding: '7px 12px', cursor: 'pointer', whiteSpace: 'nowrap', opacity: phriendLoading ? 0.5 : 1 }}>
                  {phriendLoading ? '...' : '+ TAG'}
                </button>
              </div>

              {/* Tagged phriends */}
              {phriends.tagged.length > 0 && (
                <div style={{ marginBottom: phriends.also_attended.length ? 10 : 0 }}>
                  {phriends.tagged.map(c => (
                    <div key={c.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', border: '1px solid rgba(0,224,208,0.28)', background: 'rgba(0,224,208,0.04)', marginBottom: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(0,224,208,0.4)', background: 'rgba(0,224,208,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.48rem', color: 'var(--cyan)', flexShrink: 0 }}>
                        {c.username.slice(0,2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--cyan)' }}>{c.username}</div>
                        {c.their_score != null && (
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', color: 'var(--orange)', letterSpacing: '1px', marginTop: 2 }}>★ {c.their_score}</div>
                        )}
                      </div>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.34rem', letterSpacing: '1.5px', padding: '2px 5px', border: '1px solid rgba(0,224,208,0.4)', color: 'var(--cyan)', flexShrink: 0 }}>TAGGED</span>
                      <button onClick={() => handleUntagPhriend(c.user_id)} style={{ background: 'none', border: 'none', color: 'rgba(255,51,51,0.45)', cursor: 'pointer', fontSize: '0.7rem', padding: '0 2px', flexShrink: 0 }} title="Remove tag">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Auto-detected */}
              {phriends.also_attended.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 10px' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.34rem', letterSpacing: '2px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>ALSO ON PHREEZER</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>
                  {phriends.also_attended.map(c => (
                    <div key={c.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', border: '1px solid rgba(51,255,51,0.15)', background: 'rgba(51,255,51,0.02)', marginBottom: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(51,255,51,0.2)', background: 'rgba(51,255,51,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.48rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {c.username.slice(0,2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-label)' }}>{c.username}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>attended · not yet tagged</div>
                      </div>
                      <button onClick={() => handleTagPhriendById(c)}
                        style={{ background: 'rgba(51,255,51,0.04)', border: '1px solid rgba(51,255,51,0.2)', color: 'var(--text-label)', fontFamily: 'var(--font-display)', fontSize: '0.36rem', letterSpacing: '1.5px', padding: '5px 8px', cursor: 'pointer', flexShrink: 0 }}>
                        + TAG
                      </button>
                    </div>
                  ))}
                </>
              )}

              {phriends.tagged.length === 0 && phriends.also_attended.length === 0 && (
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '10px 0' }}>NO OTHER PHREEZERS AT THIS ONE</div>
              )}
            </div>
          )}

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
                              <span className="song-num-inline">{idx + 1}.</span>
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
// ON THIS DAY CARD — standalone, expandable, AI review synthesis
// ============================================================
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

function OTDCard({ otdShow, fullDate, yearsAgo, scoreColor, onRateShow, api }) {
  const [expanded, setExpanded] = useState(false);
  const [reviews, setReviews] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const fetched = useRef(false);

  const handleExpand = async () => {
    const next = !expanded;
    setExpanded(next);
    if (!next || fetched.current) return;
    fetched.current = true;

    // Fetch reviews from our show endpoint
    setLoadingReviews(true);
    try {
      const data = await api.get(`/shows/${otdShow.show_date}`);
      const items = data?.reviews?.items || [];
      setReviews(items);

      if (items.length > 0) {
        // Build AI summary
        setLoadingAI(true);
        const reviewText = items
          .filter(r => r.review && r.review.trim().length > 20)
          .slice(0, 8)
          .map((r, i) => `Review ${i+1} (${r.author}): "${r.review.trim()}"`)
          .join('\n\n');

        const prompt = `You are summarizing Phish fan reviews of a concert. Be concise, vivid, and capture the collective vibe. Use Phish fan language naturally — jams, teases, exploratory, etc. Do not mention that you're summarizing reviews. Just describe the show as if you were there.

Show: ${fullDate} at ${otdShow.venue}${otdShow.city ? `, ${otdShow.city}` : ''}
${yearsAgo} years ago

Fan reviews:
${reviewText}

Write a 2-3 sentence summary of what made this show memorable. Be specific. No fluff.`;

        const res = await fetch(ANTHROPIC_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        const aiData = await res.json();
        const text = aiData?.content?.[0]?.text || null;
        setAiSummary(text);
      }
    } catch (e) {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
      setLoadingAI(false);
    }
  };

  return (
    <div style={{
      marginBottom: 16,
      background: 'linear-gradient(135deg, rgba(0,224,208,0.07) 0%, rgba(5,18,5,0.98) 100%)',
      border: '1px solid rgba(0,224,208,0.4)',
      borderTop: '2px solid var(--cyan)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Scanline accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px)', pointerEvents: 'none' }} />

      {/* Header — always visible */}
      <div style={{ padding: '14px 16px' }}>
        {/* Label + years ago */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', color: 'var(--cyan)', letterSpacing: '3px' }}>ON THIS DAY</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'rgba(0,224,208,0.5)', letterSpacing: '2px' }}>{yearsAgo} YRS AGO</span>
        </div>

        {/* Date — hero moment */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--white)', letterSpacing: '2px', lineHeight: 1.1, marginBottom: 4 }}>
          {fullDate}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--cyan)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {otdShow.venue}
        </div>
        {otdShow.city && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 10 }}>
            {otdShow.city}{otdShow.state ? `, ${otdShow.state}` : ''}
          </div>
        )}

        {/* Score + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {otdShow.phreezer_avg ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: scoreColor, textShadow: `0 0 18px ${scoreColor}66`, letterSpacing: 1, lineHeight: 1 }}>{otdShow.phreezer_avg}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', color: 'var(--text-muted)', letterSpacing: '1.5px' }}>MY SCORE</span>
              </div>
            ) : (
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'rgba(0,224,208,0.4)', letterSpacing: '2px' }}>NOT YET RATED</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a href={`https://phish.in/${otdShow.show_date}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(0,255,255,0.4)', background: 'rgba(0,255,255,0.06)', color: 'var(--cyan)', fontSize: '0.75rem', textDecoration: 'none', paddingLeft: 2, boxShadow: '0 0 10px rgba(0,224,208,0.2)' }}>▶</a>
            <button onClick={() => onRateShow(otdShow.show_date)}
              style={{ height: 36, padding: '0 12px', border: '1px solid rgba(255,140,0,0.5)', background: 'rgba(255,140,0,0.08)', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.44rem', letterSpacing: '1.5px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 0 10px rgba(255,140,0,0.2)' }}>
              ◈ RATE
            </button>
          </div>
        </div>
      </div>

      {/* Expand toggle */}
      <button onClick={handleExpand} style={{
        width: '100%', padding: '8px 16px', background: 'rgba(0,224,208,0.04)', border: 'none',
        borderTop: '1px solid rgba(0,224,208,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, cursor: 'pointer', color: 'var(--cyan)', fontFamily: 'var(--font-display)', fontSize: '0.42rem', letterSpacing: '2px',
      }}>
        {expanded ? '▲ HIDE VIBE CHECK' : '▼ VIBE CHECK — WHAT DID THE PHANS SAY?'}
      </button>

      {/* Expanded — AI summary + reviews */}
      {expanded && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(0,224,208,0.1)', background: 'rgba(0,0,0,0.3)' }}>
          {loadingReviews ? (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '12px 0' }}>
              PULLING REVIEWS...
            </div>
          ) : reviews && reviews.length > 0 ? (
            <>
              {/* AI summary */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', color: 'var(--orange)', letterSpacing: '2px' }}>◈ THE VIBE</span>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,140,0,0.3), transparent)' }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.36rem', color: 'rgba(255,140,0,0.4)', letterSpacing: '1px' }}>AI SYNTHESIS</span>
                </div>
                {loadingAI ? (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Synthesizing {reviews.length} reviews...
                  </div>
                ) : aiSummary ? (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--white)', lineHeight: 1.65, borderLeft: '2px solid rgba(255,140,0,0.4)', paddingLeft: 10 }}>
                    {aiSummary}
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Could not generate summary.</div>
                )}
              </div>

              {/* Raw reviews */}
              <div style={{ borderTop: '1px solid rgba(51,255,51,0.08)', paddingTop: 12 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 10 }}>
                  PHISH.NET REVIEWS ({reviews.length})
                </div>
                {reviews.slice(0, 3).map((r, i) => (
                  <div key={i} style={{ marginBottom: i < reviews.length - 1 ? 12 : 0, paddingBottom: i < reviews.length - 1 ? 12 : 0, borderBottom: i < reviews.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', color: 'var(--cyan)', letterSpacing: '1px' }}>{r.author}</span>
                      {r.posted && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{r.posted}</span>}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-label)', lineHeight: 1.6, fontStyle: 'italic' }}>
                      "{r.review}"
                    </div>
                  </div>
                ))}
                {reviews.length > 3 && (
                  <a href={`https://phish.net/setlists/?d=${otdShow.show_date}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', marginTop: 10, fontFamily: 'var(--font-display)', fontSize: '0.42rem', color: 'var(--cyan)', letterSpacing: '2px', textDecoration: 'none', opacity: 0.7 }}>
                    + {reviews.length - 3} MORE ON PHISH.NET →
                  </a>
                )}
              </div>
            </>
          ) : reviews && reviews.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '10px 0' }}>
              NO REVIEWS YET FOR THIS SHOW
            </div>
          ) : null}
        </div>
      )}
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
      api.get('/user/companions').catch(() => ({ by_date: {} })),
    ]).then(([ratedShows, attendanceData, companionsData]) => {
      const byDate = companionsData.by_date || {};
      const enriched = ratedShows.map(s => ({ ...s, companions: byDate[s.show_date] || [] }));
      setShows(enriched);
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
    if (filterBy === 'favorites') return show.favorited;
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

      {/* Controls: view tabs + filter + sort in one clean bar */}
      <div style={{ marginBottom: 10 }}>
        {/* View toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {[['attended', `ATTENDED (${attended.length})`], ['rated', `RATED (${shows.length})`]].map(([v, l]) => (
            <button key={v} onClick={() => setActiveView(v)} style={{
              flex: 1, padding: '9px 6px',
              border: `1px solid ${activeView === v ? 'var(--cyan)' : 'rgba(51,255,51,0.2)'}`,
              background: activeView === v ? 'rgba(0,255,255,0.06)' : 'transparent',
              color: activeView === v ? 'var(--cyan)' : 'var(--text-label)',
              fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '2px', cursor: 'pointer',
            }}>{l}</button>
          ))}
          <button onClick={() => setShowImport(!showImport)} style={{
            padding: '9px 12px',
            border: '1px solid rgba(255,102,0,0.45)',
            background: 'transparent', color: 'var(--orange)',
            fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '2px', cursor: 'pointer',
            boxShadow: '0 0 6px rgba(255,102,0,0.15)',
          }}>↓ IMPORT</button>
        </div>
        {/* Filter pills */}
        {activeView === 'attended' && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {[['all','ALL'],['has_review','REVIEWED'],['has_phreezer','RATED'],['no_phreezer','UNRATED'],['favorites','★ FAV']].map(([k,l]) => (
              <button key={k} onClick={() => setFilterBy(k)} style={{
                padding: '6px 10px',
                border: `1px solid ${filterBy === k ? 'var(--cyan)' : 'rgba(51,255,51,0.2)'}`,
                background: filterBy === k ? 'rgba(0,255,255,0.06)' : 'transparent',
                color: filterBy === k ? 'var(--cyan)' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)', fontSize: '0.46rem', letterSpacing: '1.5px', cursor: 'pointer',
              }}>{l}</button>
            ))}
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              marginLeft: 'auto', background: 'var(--bg-elevated)', border: '1px solid rgba(51,255,51,0.2)',
              color: 'var(--text-label)', fontFamily: 'var(--font-display)', fontSize: '0.46rem',
              letterSpacing: '1px', padding: '6px 8px', cursor: 'pointer', outline: 'none',
            }}>
              <option value="date_desc">DATE ↓</option>
              <option value="date_asc">DATE ↑</option>
              <option value="phreezer_desc">SCORE ↓</option>
              <option value="no_phreezer">UNRATED FIRST</option>
            </select>
          </div>
        )}
      </div>

      {/* On This Day — standalone moment */}
      {(() => {
        const today = new Date();
        const todayStr = `${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        const otdShow = attended.find(s => s.show_date && s.show_date.slice(5) === todayStr);
        if (!otdShow) return null;
        const yearsAgo = new Date().getFullYear() - parseInt(otdShow.show_date);
        const scoreColor = otdShow.phreezer_avg >= 4.7 ? 'var(--orange)' : otdShow.phreezer_avg ? 'var(--cyan)' : 'rgba(51,255,51,0.4)';
        const [y, m, day] = otdShow.show_date.split('-');
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const fullDate = `${months[parseInt(m)-1]} ${parseInt(day)}, ${y}`;
        return <OTDCard otdShow={otdShow} fullDate={fullDate} yearsAgo={yearsAgo} scoreColor={scoreColor} onRateShow={onRateShow} api={api} />;
      })()}

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
        const scoreColor = phreezerScore >= 4.7 ? 'var(--orange)' : phreezerScore != null ? 'var(--cyan)' : 'var(--text-muted)';
        const cardAccent = phreezerScore >= 4.7 ? 'var(--orange)' : phreezerScore != null ? 'var(--cyan)' : 'rgba(51,255,51,0.3)';

        return (
          <ShowCard
            key={show.show_date}
            show={show}
            phreezerScore={phreezerScore}
            scoreColor={scoreColor}
            cardAccent={cardAccent}
            hasReview={hasReview}
            reviews={reviews}
            reviewExpanded={reviewExpanded}
            setExpandedReview={setExpandedReview}
            onFavorite={() => setShows(ss => ss.map(s2 => s2.show_date === show.show_date ? { ...s2, favorited: !s2.favorited } : s2))}
            onRateShow={onRateShow}
          />
        );
      })}
    </div>
  );
}

// ============================================================
// SHOW CARD — expandable, with set scores + top songs
// ============================================================
function ShowCard({ show, phreezerScore, scoreColor, cardAccent, hasReview, reviews, reviewExpanded, setExpandedReview, onFavorite, onRateShow }) {
  const [expanded, setExpanded] = useState(false);
  const [cardData, setCardData] = useState(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const api = useApi();

  const handleExpand = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !cardData) {
      setLoadingCard(true);
      try {
        const data = await api.get(`/ratings/${show.show_date}`);
        const ratingsList = Array.isArray(data) ? data : (data.ratings || []);
        // Group by set
        const sets = {};
        ratingsList.forEach(r => {
          const k = r.set_number || '1';
          if (!sets[k]) sets[k] = [];
          sets[k].push(r);
        });
        // Set averages
        const setAvgs = {};
        Object.entries(sets).forEach(([k, songs]) => {
          const rated = songs.filter(s => s.rating);
          setAvgs[k] = rated.length ? (rated.reduce((sum, s) => sum + parseFloat(s.rating), 0) / rated.length).toFixed(2) : null;
        });
        // Top 5 songs by rating
        const topSongs = [...ratingsList]
          .filter(s => s.rating)
          .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
          .slice(0, 5);
        setCardData({ sets, setAvgs, topSongs, ratingsList });
      } catch (e) {}
      finally { setLoadingCard(false); }
    }
  };

  const setLabel = k => {
    if (k === 'e' || k === 'E') return 'ENC';
    if (k === 'e2') return 'E2';
    if (k === 'S' || k === 's') return 'SC';
    return `S${k}`;
  };

  // Set bars — mini visual (I, II, E heights)
  const SetBars = () => {
    if (!cardData?.setAvgs) return null;
    const barSets = Object.entries(cardData.setAvgs)
      .filter(([k]) => !['S','s'].includes(k) && k !== 'e2')
      .slice(0, 3);
    if (!barSets.length) return null;
    return (
      <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 22, marginTop: 6 }}>
        {barSets.map(([k, v]) => {
          const h = v ? Math.max(4, ((parseFloat(v) - 3) / 2) * 20) : 4;
          const col = parseFloat(v) >= 4.7 ? 'var(--orange)' : 'var(--cyan)';
          return (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ width: 16, height: h, background: col, opacity: 0.85, borderRadius: '1px 1px 0 0', boxShadow: `0 0 4px ${col}66` }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.36rem', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{setLabel(k)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        background: `linear-gradient(135deg, var(--bg-panel), ${phreezerScore >= 4.7 ? 'rgba(255,102,0,0.04)' : 'rgba(0,255,255,0.01)'})`,
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${cardAccent}`,
      }}>
        {/* Collapsed main row */}
        <div style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {show.tour_name && (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 3, textTransform: 'uppercase' }}>
                {show.tour_name}
              </div>
            )}
            <div className="show-date-serif show-date-serif-md" style={{ marginBottom: 3 }}>
              {formatDate(show.show_date)}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--white)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {show.venue}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {show.city}{show.state ? `, ${show.state}` : ''}
            </div>
            {/* Phriend chips */}
            {show.companions && show.companions.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.34rem', letterSpacing: '1.5px', color: 'var(--text-muted)' }}>PHRIENDS:</span>
                {show.companions.slice(0, 3).map(c => (
                  <span key={c.user_id} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--cyan)', padding: '1px 6px', border: '1px solid rgba(0,224,208,0.28)', background: 'rgba(0,224,208,0.05)' }}>{c.username}</span>
                ))}
                {show.companions.length > 3 && (
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.34rem', color: 'var(--text-muted)', letterSpacing: '1px', padding: '1px 5px', border: '1px solid var(--border)' }}>+{show.companions.length - 3} MORE</span>
                )}
              </div>
            )}
            {/* Set bars — only visible once data loaded */}
            {cardData && <SetBars />}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {hasReview && (
                <button onClick={() => setExpandedReview(reviewExpanded ? null : show.show_date)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1, color: reviewExpanded ? 'var(--orange)' : 'rgba(255,102,0,0.35)', transition: 'all 0.2s' }}
                  title="My review">✎</button>
              )}
              <button onClick={onFavorite}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1, color: show.favorited ? 'var(--orange)' : 'rgba(51,255,51,0.2)', filter: show.favorited ? 'drop-shadow(0 0 4px rgba(255,102,0,0.7))' : 'none', transition: 'all 0.2s' }}
                title={show.favorited ? 'Unfavorite' : 'Favorite'}
              >{show.favorited ? '★' : '☆'}</button>
              <a href={`https://phish.in/${show.show_date}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(0,255,255,0.38)', background: 'rgba(0,255,255,0.05)', color: 'var(--cyan)', fontSize: '0.6rem', textDecoration: 'none', paddingLeft: 2, boxShadow: '0 0 4px rgba(0,255,255,0.15)' }}
                title="Stream on Phish.in">▶</a>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: scoreColor, textShadow: `0 0 14px ${scoreColor}55`, letterSpacing: 1, lineHeight: 1 }}>
                {phreezerScore != null ? phreezerScore : '—'}
              </div>
              {phreezerScore != null && (
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.38rem', color: 'var(--text-muted)', letterSpacing: '1.5px', marginTop: 3 }}>MY SCORE</div>
              )}
            </div>

            <button onClick={handleExpand}
              style={{ background: 'transparent', border: '1px solid rgba(51,255,51,0.2)', color: 'var(--text-label)', fontFamily: 'var(--font-display)', fontSize: '0.42rem', letterSpacing: '2px', padding: '4px 8px', cursor: 'pointer' }}>
              {expanded ? '▲ LESS' : '▼ MORE'}
            </button>
          </div>
        </div>

        {/* Review text inline */}
        {hasReview && reviewExpanded && (
          <div style={{ margin: '0 14px 10px', padding: '8px 10px', background: 'var(--bg)', border: '1px solid rgba(51,255,51,0.1)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.6 }}>
            {reviews.map((rev, i) => (
              <div key={rev.review_id || i} style={{ marginBottom: i < reviews.length - 1 ? 8 : 0 }}>
                "{rev.review_text}"
                {rev.posted_date && <div style={{ fontSize: '0.6rem', marginTop: 4 }}>{rev.posted_date}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Expanded panel */}
        {expanded && (
          <div style={{ borderTop: '1px solid rgba(51,255,51,0.08)', padding: '12px 14px', background: 'var(--bg-elevated)' }}>
            {loadingCard ? (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '12px 0' }}>LOADING...</div>
            ) : cardData ? (
              <>
                {/* Set scores */}
                {Object.keys(cardData.setAvgs).filter(k => !['S','s'].includes(k)).length > 0 && (
                  <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
                    {Object.entries(cardData.setAvgs)
                      .filter(([k]) => !['S','s'].includes(k))
                      .map(([k, v]) => {
                        const label = k === 'e' || k === 'E' ? 'ENCORE' : k === 'e2' ? 'ENCORE 2' : `SET ${k}`;
                        const col = v && parseFloat(v) >= 4.5 ? 'var(--orange)' : 'var(--cyan)';
                        return (
                          <div key={k} style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: col, textShadow: `0 0 8px ${col}44`, letterSpacing: 1, lineHeight: 1 }}>{v || '—'}</div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', color: 'var(--text-muted)', letterSpacing: '2px', marginTop: 4 }}>{label}</div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Top rated songs */}
                {cardData.topSongs.length > 0 && (
                  <>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 8 }}>TOP RATED SONGS</div>
                    {cardData.topSongs.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < cardData.topSongs.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
                        <a href={`https://phish.in/${show.show_date}`} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, border: '1px solid rgba(0,255,255,0.35)', background: 'rgba(0,255,255,0.05)', color: 'var(--cyan)', fontSize: '0.52rem', textDecoration: 'none', flexShrink: 0 }}>▶</a>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: 'var(--white)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.song_name}</span>
                        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                          {[1,2,3,4,5].map(n => (
                            <span key={n} style={{ fontSize: '0.7rem', color: n <= s.rating ? 'var(--orange)' : 'rgba(51,255,51,0.18)' }}>{n <= s.rating ? '★' : '·'}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Notes from any rated song */}
                {cardData.ratingsList.some(r => r.notes) && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--bg)', border: '1px solid rgba(51,255,51,0.1)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.6 }}>
                    {cardData.ratingsList.filter(r => r.notes).slice(0,3).map((r, i) => (
                      <div key={i} style={{ marginBottom: i < 2 ? 6 : 0 }}>
                        <span style={{ color: 'rgba(51,255,51,0.35)', fontSize: '0.6rem' }}>{r.song_name}: </span>"{r.notes}"
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '12px 0' }}>NO RATINGS YET</div>
            )}
          </div>
        )}

        {/* Action bar */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(51,255,51,0.08)', gap: 0 }}>
          <button onClick={() => onRateShow(show.show_date)}
            style={{ flex: 1, padding: '9px 8px', background: 'transparent', border: 'none', borderRight: '1px solid rgba(51,255,51,0.08)', color: phreezerScore != null ? 'var(--cyan)' : 'var(--text-label)', fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '2px', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => e.target.style.background = 'rgba(0,255,255,0.04)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}>
            {phreezerScore != null ? '◈ RE-RATE' : '◈ RATE'}
          </button>
          <a href={`https://phish.net/setlists/?d=${show.show_date}`} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, padding: '9px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(51,255,51,0.08)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.46rem', letterSpacing: '2px', textDecoration: 'none', transition: 'all 0.15s' }}
            onMouseEnter={e => e.target.style.color = 'var(--green)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
            PHISH.NET
          </a>
          <a href={`${RELISTEN}/${show.show_date?.replace(/-/g,'/')}`} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, padding: '9px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.46rem', letterSpacing: '2px', textDecoration: 'none', transition: 'all 0.15s' }}>
            RELISTEN
          </a>
        </div>
      </div>
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
// COMMUNITY HELPERS
// ============================================================
function CommExpandCard({ name, sub, avg, count, countLabel = 'RATINGS', accent = 'var(--cyan)', children }) {
  const [open, setOpen] = useState(false);
  const scoreColor = parseFloat(avg) >= 4.7 ? 'var(--orange)' : 'var(--cyan)';
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderLeft: `3px solid ${accent}` }}>
        <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--white)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sub}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: scoreColor, textShadow: `0 0 12px ${scoreColor}55`, letterSpacing: 1, lineHeight: 1 }}>{avg}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', color: 'var(--text-muted)', letterSpacing: '1.5px', marginTop: 3 }}>{count} {countLabel}</div>
            </div>
            <button onClick={() => setOpen(o => !o)} style={{ background: 'transparent', border: '1px solid rgba(51,255,51,0.2)', color: 'var(--text-label)', fontFamily: 'var(--font-display)', fontSize: '0.44rem', letterSpacing: '1.5px', padding: '5px 9px', cursor: 'pointer' }}>
              {open ? '▲' : '▼'}
            </button>
          </div>
        </div>
        {open && (
          <div style={{ borderTop: '1px solid rgba(51,255,51,0.07)', padding: '12px 14px', background: 'var(--bg-elevated)' }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

function CommShowRows({ shows, label = 'TOP SHOWS' }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 9 }}>{label}</div>
      {shows.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < shows.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
          <a href={`https://phish.in/${s.show_date}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, border: '1px solid rgba(0,255,255,0.4)', background: 'rgba(0,255,255,0.05)', color: 'var(--cyan)', fontSize: '0.55rem', textDecoration: 'none', flexShrink: 0 }}>▶</a>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-label)', flex: 1 }}>{formatDate(s.show_date)}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.84rem', color: parseFloat(s.avg_score) >= 4.9 ? 'var(--orange)' : 'var(--cyan)', letterSpacing: 1 }}>{s.avg_score}</span>
        </div>
      ))}
    </div>
  );
}

function CommVersionRows({ versions, label = 'TOP VERSIONS' }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 9 }}>{label}</div>
      {versions.map((v, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < versions.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
          <a href={`https://phish.in/${v.show_date}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, border: '1px solid rgba(0,255,255,0.4)', background: 'rgba(0,255,255,0.05)', color: 'var(--cyan)', fontSize: '0.55rem', textDecoration: 'none', flexShrink: 0 }}>▶</a>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--white)' }}>{formatDate(v.show_date)}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{v.venue}{v.city ? `, ${v.city}` : ''}</div>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.84rem', color: parseFloat(v.avg_score) >= 4.9 ? 'var(--orange)' : 'var(--cyan)', letterSpacing: 1, flexShrink: 0 }}>{v.avg_score}</span>
        </div>
      ))}
    </div>
  );
}

function CommSongRows({ songs, label = 'TOP SONGS IN THIS SHOW' }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 9 }}>{label}</div>
      {songs.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < songs.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--white)', flex: 1 }}>{s.song_name}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.84rem', color: parseFloat(s.avg_score) >= 4.9 ? 'var(--orange)' : 'var(--cyan)', letterSpacing: 1 }}>{s.avg_score}</span>
        </div>
      ))}
    </div>
  );
}

function CommStateRows({ states, label = 'STATE RANKINGS' }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 9 }}>{label}</div>
      {states.map((s, i) => (
        <div key={s.state} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < states.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'var(--text-muted)', minWidth: 22 }}>{i + 1}.</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: 'var(--white)', letterSpacing: '2px', marginBottom: 2 }}>{s.state}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)' }}>Top: {s.top_venue} · {s.show_count} shows</div>
          </div>
          <div style={{ width: 50, height: 3, background: 'rgba(51,255,51,0.07)', borderRadius: 2 }}>
            <div style={{ width: `${Math.min(((parseFloat(s.avg_score) - 3) / 2) * 100, 100)}%`, height: '100%', background: i === 0 ? 'var(--orange)' : 'var(--cyan)', borderRadius: 2 }} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: i === 0 ? 'var(--orange)' : 'var(--cyan)', letterSpacing: 1, textAlign: 'right', minWidth: 36 }}>{s.avg_score}</div>
        </div>
      ))}
    </div>
  );
}

function CommKPIGrid({ items }) {
  return (
    <div className="kpi-grid" style={{ marginBottom: 14 }}>
      {items.map((k, i) => (
        <div key={i} className="kpi-card" style={{ borderTopColor: k.color }}>
          <div className="kpi-value" style={{ color: k.color, fontSize: k.small ? '0.72rem' : '1.55rem', lineHeight: 1.2, textAlign: 'center', wordBreak: 'break-word' }}>{k.value}</div>
          <div className="kpi-label">{k.label}</div>
          {k.sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center' }}>{k.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// PHRIEND OVERLAP — community surface (unintentional overlap)
// ============================================================
function PhriendOverlapCommunity({ api }) {
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setLoading(true); setResult(null); setError('');
    try {
      const data = await api.get(`/community/phriend-overlap?username=${encodeURIComponent(searchInput.trim())}`);
      setResult(data);
    } catch (e) { setError(e.message || 'User not found'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 12 }}>
        FIND SHOWS YOU BOTH ATTENDED — INTENTIONAL OR NOT
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="enter phreezer username..."
          style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,140,0,0.35)', color: 'var(--orange)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: '9px 10px', outline: 'none' }}
        />
        <button onClick={handleSearch} disabled={loading}
          style={{ background: 'rgba(255,140,0,0.07)', border: '1px solid rgba(255,140,0,0.35)', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.4rem', letterSpacing: '2px', padding: '9px 14px', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
          {loading ? '...' : 'SEARCH'}
        </button>
      </div>

      {error && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--red)', marginBottom: 10 }}>{error}</div>}

      {result && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: '12px 14px', border: '1px solid rgba(255,140,0,0.25)', background: 'linear-gradient(135deg, rgba(255,140,0,0.05), rgba(5,18,5,0.98))' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(255,140,0,0.45)', background: 'rgba(255,140,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.58rem', color: 'var(--orange)', flexShrink: 0 }}>
              {result.target.username.slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: 'var(--white)' }}>{result.target.username}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {result.total_shared} shared shows · {result.unique_venues} venues · {result.unique_years} years
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
            {[
              { v: result.total_shared, l: 'SHOWS TOGETHER' },
              { v: result.unique_venues, l: 'VENUES' },
              { v: result.unique_years, l: 'YEARS' },
            ].map(({ v, l }) => (
              <div key={l} style={{ textAlign: 'center', padding: '10px 4px', border: '1px solid rgba(255,140,0,0.2)', background: 'rgba(255,140,0,0.04)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--orange)', lineHeight: 1, marginBottom: 4 }}>{v}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.3rem', letterSpacing: '1.5px', color: 'rgba(255,140,0,0.5)' }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.34rem', letterSpacing: '2px', color: 'var(--text-muted)' }}>SHOW</span>
            <div style={{ display: 'flex', gap: 20 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.34rem', letterSpacing: '1.5px', color: 'var(--cyan)' }}>YOU</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.34rem', letterSpacing: '1.5px', color: 'var(--orange)' }}>THEM</span>
            </div>
          </div>

          {result.shows.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', marginBottom: 5 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: 2 }}>
                  {(() => { const [y,m,d]=s.show_date.split('-'); const mn=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']; return `${mn[+m-1]} ${+d}, ${y}`; })()}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-label)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.venue}{s.city ? ` — ${s.city}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', padding: '2px 6px', border: '1px solid rgba(0,224,208,0.3)', color: 'var(--cyan)', minWidth: 30, textAlign: 'center' }}>{s.my_score || '—'}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', padding: '2px 6px', border: '1px solid rgba(255,140,0,0.3)', color: 'var(--orange)', minWidth: 30, textAlign: 'center' }}>{s.their_score || '—'}</span>
              </div>
            </div>
          ))}

          {result.shows.length === 0 && (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '20px 0' }}>NO SHARED SHOWS FOUND</div>
          )}
        </>
      )}

      {!result && !loading && !error && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '24px 0', border: '1px solid var(--border)' }}>
          SEARCH A USERNAME TO SEE SHOWS<br/>
          <span style={{ color: 'rgba(255,140,0,0.4)', marginTop: 6, display: 'block' }}>YOU BOTH ATTENDED</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMMUNITY TAB — all sub-tabs
// ============================================================
function CommunityTab({ api, subTab = "leaderboard" }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [topShows, setTopShows] = useState(null);
  const [topSongs, setTopSongs] = useState(null);
  const [topVenues, setTopVenues] = useState(null);
  const [topStates, setTopStates] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let req;
    if (subTab === 'leaderboard') req = api.get('/community/leaderboard').then(setLeaderboard);
    else if (subTab === 'top-shows')  req = api.get('/community/top-shows').then(setTopShows);
    else if (subTab === 'top-songs')  req = api.get('/community/top-songs').then(setTopSongs);
    else if (subTab === 'top-venues') req = api.get('/community/top-venues').then(setTopVenues);
    else if (subTab === 'top-states') req = api.get('/community/top-states').then(setTopStates);
    if (req) req.catch(() => {}).finally(() => setLoading(false));
    else setLoading(false);
  }, [subTab]);

  if (loading) return <FullPageLoader text="LOADING..." />;

  // ── LEADERBOARD ──────────────────────────────────────────
  if (subTab === 'leaderboard') {
    return (
      <div className="panel">
        <div className="panel-title">LEADERBOARD</div>
        {!leaderboard.length ? (
          <div className="lb-empty">NO DATA YET — RATE SOME SHOWS</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {leaderboard.map(row => (
              <div key={row.username} className={`leaderboard-row ${row.is_me ? 'is-me' : ''}`}
                style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto auto auto', alignItems: 'center', gap: '10px', padding: '11px 14px', borderBottom: '1px solid rgba(51,255,51,0.06)', borderLeft: row.is_me ? '2px solid var(--cyan)' : 'none', background: row.is_me ? 'rgba(0,255,255,0.025)' : 'transparent' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: row.rank === 1 ? 'var(--orange)' : row.rank === 2 ? 'var(--cyan)' : row.rank === 3 ? 'var(--green)' : 'var(--text-muted)' }}>
                  {row.rank === 1 ? '★' : row.rank === 2 ? '◈' : row.rank === 3 ? '◉' : row.rank}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.86rem', color: row.is_me ? 'var(--cyan)' : 'var(--white)' }}>
                  {row.username}{row.is_me && <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.45rem', color: 'var(--cyan)', marginLeft: 6, letterSpacing: '1px', opacity: 0.7 }}> ◈ YOU</span>}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-label)' }}>{row.shows_rated}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', color: 'var(--orange)', letterSpacing: 1 }}>{row.avg_score ?? '—'}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.64rem', color: 'var(--text-label)' }}>{row.login_streak > 1 ? `⚡${row.login_streak}` : '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── TOP SHOWS ─────────────────────────────────────────────
  if (subTab === 'top-shows') {
    const s = topShows?.stats;
    return (
      <div>
        <CommKPIGrid items={[
          { label: 'SHOWS COVERED', value: s?.shows_covered || '—', color: 'var(--cyan)' },
          { label: 'OVERALL AVG', value: s?.overall_avg || '—', color: 'var(--orange)' },
          { label: 'MOST RATED', value: s?.most_rated?.raters ? `${s.most_rated.raters} RATERS` : '—', color: 'var(--green)', small: true },
          { label: 'TOP SHOW', value: s?.most_rated?.show_date ? formatDate(s.most_rated.show_date) : '—', color: 'var(--cyan)', small: true },
        ]} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 9 }}>TOP RATED SHOWS — TAP FOR SONGS</div>
        {(topShows?.shows || []).map((show, i) => (
          <CommExpandCard key={show.show_date} name={formatDate(show.show_date)}
            sub={`${show.venue}${show.city ? ` · ${show.city}` : ''}${show.state ? `, ${show.state}` : ''} · ${show.rater_count} raters`}
            avg={show.avg_score} count={show.rater_count} countLabel="RATERS"
            accent={i === 0 ? 'var(--orange)' : 'var(--cyan)'}>
            <CommSongRows songs={show.top_songs || []} />
            <div style={{ marginTop: 12 }}>
              <a href={`https://phish.in/${show.show_date}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, border: '1px solid rgba(0,255,255,0.4)', background: 'rgba(0,255,255,0.05)', color: 'var(--cyan)', fontSize: '0.65rem', textDecoration: 'none' }}>▶</a>
            </div>
          </CommExpandCard>
        ))}
      </div>
    );
  }

  // ── TOP SONGS ─────────────────────────────────────────────
  if (subTab === 'top-songs') {
    const s = topSongs?.stats;
    return (
      <div>
        <CommKPIGrid items={[
          { label: 'SONGS RATED', value: s?.songs_rated || '—', color: 'var(--cyan)' },
          { label: 'HIGHEST RATED', value: topSongs?.songs?.[0]?.avg_score || '—', color: 'var(--orange)' },
          { label: 'TOTAL RATINGS', value: s?.total_ratings ? `${(s.total_ratings / 1000).toFixed(1)}K` : '—', color: 'var(--green)' },
          { label: 'MOST RATED', value: s?.most_rated?.song_name || '—', color: 'var(--cyan)', small: true },
        ]} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 9 }}>TOP SONGS — TAP FOR TOP VERSIONS</div>
        {(topSongs?.songs || []).map((song, i) => (
          <CommExpandCard key={song.song_name} name={song.song_name}
            sub={`${song.total_ratings} ratings · ${song.unique_raters} raters`}
            avg={song.avg_score} count={song.total_ratings} countLabel="RATINGS"
            accent={i === 0 ? 'var(--orange)' : 'var(--cyan)'}>
            <CommVersionRows versions={song.top_versions || []} />
          </CommExpandCard>
        ))}
      </div>
    );
  }

  // ── TOP VENUES ────────────────────────────────────────────
  if (subTab === 'top-venues') {
    const s = topVenues?.stats;
    // Build state map for heatmap from states array
    const stateMap = {};
    (topVenues?.states || []).forEach(st => { if (st.state) stateMap[st.state] = st.avg_score; });
    return (
      <div>
        <CommKPIGrid items={[
          { label: 'VENUES RATED', value: s?.venues_rated || '—', color: 'var(--cyan)' },
          { label: 'STATES COVERED', value: s?.states_covered || '—', color: 'var(--orange)' },
          { label: 'TOP VENUE AVG', value: topVenues?.venues?.[0]?.avg_score || '—', color: 'var(--green)' },
          { label: 'TOP VENUE', value: topVenues?.venues?.[0]?.venue || '—', color: 'var(--cyan)', small: true },
        ]} />
        <Heatmap data={stateMap} title="COMMUNITY RATINGS BY STATE" />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 9 }}>TOP VENUES — TAP FOR TOP SHOWS</div>
        {(topVenues?.venues || []).map((venue, i) => (
          <CommExpandCard key={venue.venue} name={venue.venue}
            sub={`${venue.city ? `${venue.city}, ` : ''}${venue.state || ''} · ${venue.show_count} shows`}
            avg={venue.avg_score} count={venue.show_count} countLabel="SHOWS"
            accent={i === 0 ? 'var(--orange)' : i === 1 ? 'var(--cyan)' : 'rgba(51,255,51,0.4)'}>
            <CommShowRows shows={venue.top_shows || []} />
          </CommExpandCard>
        ))}
      </div>
    );
  }

  // ── TOP STATES ────────────────────────────────────────────
  if (subTab === 'top-states') {
    const s = topStates?.stats;
    const states = topStates?.states || [];
    const stateMap = {};
    states.forEach(st => { if (st.state) stateMap[st.state] = st.avg_score; });
    return (
      <div>
        <CommKPIGrid items={[
          { label: 'STATES COVERED', value: s?.states_covered || '—', color: 'var(--cyan)' },
          { label: 'TOP STATE', value: s?.top_state?.state || '—', color: 'var(--orange)' },
          { label: 'TOP STATE AVG', value: s?.top_state?.avg_score || '—', color: 'var(--green)' },
          { label: 'BOTTOM STATE', value: s?.bottom_state?.state || '—', color: 'var(--cyan)' },
        ]} />
        <Heatmap data={stateMap} title="COMMUNITY RATINGS BY STATE" />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 9 }}>STATE RANKINGS — TAP TO EXPAND</div>
        {states.map((st, i) => {
          const accent = i === 0 ? 'var(--orange)' : i < 3 ? 'var(--cyan)' : 'rgba(51,255,51,0.4)';
          return (
            <CommExpandCard key={st.state} name={st.state}
              avg={st.avg_score} count={st.show_count} countLabel="SHOWS"
              sub={`${st.show_count} shows · top: ${st.top_venue || '—'}`}
              accent={accent}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 4 }}>TOP VENUE</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--cyan)' }}>{st.top_venue || '—'}</div>
                </div>
                {st.top_show && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 4 }}>HIGHEST RATED SHOW</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <a href={`https://phish.in/${st.top_show.show_date}`} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, border: '1px solid rgba(0,255,255,0.4)', background: 'rgba(0,255,255,0.05)', color: 'var(--cyan)', fontSize: '0.5rem', textDecoration: 'none', flexShrink: 0 }}>▶</a>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--white)' }}>{formatDate(st.top_show.show_date)}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: parseFloat(st.top_show.avg_score) >= 4.7 ? 'var(--orange)' : 'var(--cyan)', letterSpacing: 1 }}>{st.top_show.avg_score}</div>
                    </div>
                  </div>
                )}
              </div>
            </CommExpandCard>
          );
        })}
      </div>
    );
  }

  if (subTab === 'phriend-overlap') {
    return <PhriendOverlapCommunity api={api} />;
  }

  return null;
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
            <div key={u.id} style={{
              marginBottom: 12,
              border: `1px solid ${u.is_admin ? 'rgba(0,224,208,0.35)' : 'var(--border)'}`,
              borderLeft: `3px solid ${u.is_admin ? 'var(--cyan)' : 'rgba(51,255,51,0.3)'}`,
              background: 'var(--bg-panel)',
            }}>
              {/* Header */}
              <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(51,255,51,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--white)' }}>{u.username}</span>
                    {u.is_admin && <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.38rem', letterSpacing: '2px', color: 'var(--cyan)', border: '1px solid rgba(0,224,208,0.4)', padding: '2px 5px' }}>ADMIN</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{u.email}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', color: 'var(--text-muted)', letterSpacing: '1.5px', textAlign: 'right', flexShrink: 0 }}>
                  JOINED<br/>
                  <span style={{ color: 'var(--text-label)' }}>{u.joined}</span>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: '1px solid rgba(51,255,51,0.08)' }}>
                {[
                  { val: u.shows_attended, lbl: 'ATTENDED', col: 'var(--cyan)' },
                  { val: u.shows_rated,    lbl: 'RATED',    col: 'var(--orange)' },
                  { val: u.reviews,        lbl: 'REVIEWS',  col: 'var(--green)' },
                  { val: u.tandc_accepted ? '✓' : '✗', lbl: 'T&C', col: u.tandc_accepted ? 'var(--green)' : 'rgba(51,255,51,0.2)' },
                  { val: u.onboarding_complete ? '✓' : '✗', lbl: 'ONBOARD', col: u.onboarding_complete ? 'var(--green)' : 'rgba(51,255,51,0.2)' },
                ].map(({ val, lbl, col }) => (
                  <div key={lbl} style={{ padding: '10px 4px', textAlign: 'center', borderRight: '1px solid rgba(51,255,51,0.06)' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: col, lineHeight: 1 }}>{val}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.34rem', color: 'var(--text-muted)', letterSpacing: '1.5px', marginTop: 4 }}>{lbl}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 14px' }}>
                <button onClick={() => setConfirming({ userId: u.id, username: u.username, action: 'reset-onboarding' })} disabled={!!working}
                  style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', letterSpacing: '1.5px', padding: '6px 10px', border: '1px solid rgba(0,224,208,0.35)', background: 'transparent', color: 'var(--cyan)', cursor: 'pointer' }}>
                  RESET ONBOARDING
                </button>
                <button onClick={() => doAction(u.id, 'reset-password')} disabled={!!working}
                  style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', letterSpacing: '1.5px', padding: '6px 10px', border: '1px solid rgba(51,255,51,0.3)', background: 'transparent', color: 'var(--text-label)', cursor: 'pointer' }}>
                  {working === `${u.id}-reset-password` ? 'SENDING...' : 'RESET PASSWORD'}
                </button>
                <button onClick={() => setConfirming({ userId: u.id, username: u.username, action: 'clear-data' })} disabled={!!working}
                  style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', letterSpacing: '1.5px', padding: '6px 10px', border: '1px solid rgba(255,102,0,0.4)', background: 'transparent', color: 'var(--orange)', cursor: 'pointer' }}>
                  CLEAR DATA
                </button>
                {!u.is_admin && (
                  <button onClick={() => setConfirming({ userId: u.id, username: u.username, action: 'delete' })} disabled={!!working}
                    style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', letterSpacing: '1.5px', padding: '6px 10px', border: '1px solid rgba(255,51,51,0.4)', background: 'transparent', color: 'var(--red)', cursor: 'pointer' }}>
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
// HEATMAP — reusable state grid (My Venues, My States, Comm)
// ============================================================
const HEATMAP_POS = {
  WA:{r:0,c:0},OR:{r:1,c:0},CA:{r:3,c:0},NV:{r:2,c:1},ID:{r:1,c:1},MT:{r:0,c:2},
  WY:{r:1,c:2},UT:{r:2,c:2},AZ:{r:3,c:2},CO:{r:2,c:3},NM:{r:3,c:3},ND:{r:0,c:3},
  SD:{r:1,c:3},NE:{r:2,c:4},KS:{r:3,c:4},OK:{r:4,c:4},TX:{r:4,c:5},MN:{r:0,c:4},
  IA:{r:1,c:4},MO:{r:2,c:5},AR:{r:3,c:5},LA:{r:4,c:6},WI:{r:0,c:5},IL:{r:1,c:5},
  MS:{r:3,c:6},MI:{r:0,c:6},IN:{r:1,c:6},TN:{r:2,c:6},AL:{r:3,c:7},KY:{r:1,c:7},
  OH:{r:0,c:7},WV:{r:1,c:8},GA:{r:3,c:8},FL:{r:4,c:8},VA:{r:0,c:8},NC:{r:1,c:9},
  SC:{r:2,c:9},MD:{r:0,c:9},DE:{r:0,c:10},NJ:{r:0,c:11},PA:{r:0,c:10},NY:{r:0,c:12},
  CT:{r:1,c:11},RI:{r:1,c:12},MA:{r:0,c:13},VT:{r:1,c:13},NH:{r:0,c:14},ME:{r:0,c:15},
};
const hmColor = s => {
  if (!s) return 'rgba(51,255,51,0.08)';
  const n = parseFloat(s);
  if (n >= 4.7) return 'rgba(255,102,0,0.9)';
  if (n >= 4.4) return 'rgba(255,140,0,0.75)';
  if (n >= 4.1) return 'rgba(0,200,200,0.75)';
  if (n >= 3.8) return 'rgba(0,180,180,0.45)';
  return 'rgba(51,255,51,0.22)';
};
function Heatmap({ data, title }) {
  const [hov, setHov] = useState(null);
  const rows = 5, cols = 16;
  const cells = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const st = Object.entries(HEATMAP_POS).find(([, v]) => v.r === r && v.c === c);
      return st ? { abbr: st[0], score: data[st[0]] || null } : null;
    })
  );
  return (
    <div style={{ marginBottom: 14 }}>
      {title && <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-label)', letterSpacing: '2.5px', marginBottom: 9, textTransform: 'uppercase' }}>{title}</div>}
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'grid', gridTemplateRows: `repeat(${rows},28px)`, gridTemplateColumns: `repeat(${cols},1fr)`, gap: 2, minWidth: 300 }}>
          {cells.flat().map((cell, i) => (
            <div key={i}
              style={{ background: cell ? hmColor(cell.score) : 'transparent', border: cell ? (hov === cell.abbr ? '1px solid var(--cyan)' : '1px solid rgba(51,255,51,0.15)') : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: cell ? 'pointer' : 'default', transition: 'all 0.12s' }}
              onMouseEnter={() => cell && setHov(cell.abbr)}
              onMouseLeave={() => setHov(null)}>
              {cell && <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.38rem', color: '#ffffff', fontWeight: 900, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{cell.abbr}</span>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {[['rgba(255,102,0,0.9)','4.7+'],['rgba(255,140,0,0.75)','4.4+'],['rgba(0,200,200,0.75)','4.1+'],['rgba(0,180,180,0.45)','3.8+'],['rgba(51,255,51,0.22)','<3.8'],['rgba(51,255,51,0.08)','N/A']].map(([col,lbl]) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, background: col, border: '1px solid rgba(255,255,255,0.15)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', color: 'var(--text-label)', letterSpacing: '1px' }}>{lbl}</span>
          </div>
        ))}
      </div>
      {hov && data[hov] && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.54rem', color: 'var(--cyan)', letterSpacing: '2px', marginTop: 7 }}>
          {hov} — AVG {data[hov]}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MY SONGS TAB
// ============================================================
function MySongsTab({ api, showMessage, showError }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/songs').then(setSongs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageLoader text="LOADING YOUR SONGS..." />;

  const totalRatings = songs.reduce((s, r) => s + parseInt(r.total_ratings || 0), 0);
  const perfect5s = songs.filter(s => parseFloat(s.average_rating) === 5).length;
  const overallAvg = songs.length ? (songs.reduce((s, r) => s + parseFloat(r.average_rating || 0), 0) / songs.length).toFixed(2) : '—';

  return (
    <div>
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        {[
          { label: 'SONGS RATED', value: totalRatings, color: 'var(--cyan)' },
          { label: 'UNIQUE SONGS', value: songs.length, color: 'var(--orange)' },
          { label: 'AVG SONG SCORE', value: overallAvg, color: 'var(--green)' },
          { label: 'PERFECT 5s', value: perfect5s, color: 'var(--orange)' },
        ].map((k, i) => (
          <div key={i} className="kpi-card" style={{ borderTopColor: k.color }}>
            <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 9 }}>YOUR TOP SONGS — TAP FOR YOUR VERSIONS</div>
      {!songs.length ? (
        <div className="empty-state">RATE SOME SONGS FIRST</div>
      ) : songs.slice(0, 25).map((s, i) => {
        const accent = i === 0 ? 'var(--orange)' : 'var(--cyan)';
        return (
          <CommExpandCard key={s.song_name} name={s.song_name}
            sub={`${s.total_ratings} versions · avg ${s.average_rating}`}
            avg={s.average_rating} count={s.total_ratings} countLabel="HEARD"
            accent={accent}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 9 }}>YOUR VERSIONS</div>
              {(s.versions || []).map((v, vi) => (
                <div key={vi} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: vi < s.versions.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
                  <a href={`https://phish.in/${v.show_date}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, border: '1px solid rgba(0,255,255,0.4)', background: 'rgba(0,255,255,0.05)', color: 'var(--cyan)', fontSize: '0.55rem', textDecoration: 'none', flexShrink: 0 }}>▶</a>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--white)' }}>{formatDate(v.show_date)}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{v.venue}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    {[1,2,3,4,5].map(n => (
                      <span key={n} style={{ fontSize: '0.7rem', color: n <= parseInt(v.rating) ? 'var(--orange)' : 'rgba(51,255,51,0.18)' }}>{n <= parseInt(v.rating) ? '★' : '·'}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CommExpandCard>
        );
      })}
    </div>
  );
}

// ============================================================
// MY VENUES TAB
// ============================================================
function MyVenuesTab({ api, showMessage, showError }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/venues').then(setVenues).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageLoader text="LOADING YOUR VENUES..." />;

  // Build state map for heatmap
  const stateMap = {};
  venues.forEach(v => {
    const st = v.state;
    if (!st) return;
    if (!stateMap[st] || parseFloat(v.average_rating) > parseFloat(stateMap[st])) {
      stateMap[st] = v.average_rating;
    }
  });

  const totalShows = venues.reduce((s, v) => s + parseInt(v.total_shows || 0), 0);

  return (
    <div>
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        {[
          { label: 'UNIQUE VENUES', value: venues.length, color: 'var(--cyan)' },
          { label: 'STATES VISITED', value: Object.keys(stateMap).length, color: 'var(--orange)' },
          { label: 'TOP VENUE AVG', value: venues[0]?.average_rating || '—', color: 'var(--green)' },
          { label: 'HOME VENUE', value: venues[0]?.venue || '—', color: 'var(--cyan)', small: true },
        ].map((k, i) => (
          <div key={i} className="kpi-card" style={{ borderTopColor: k.color }}>
            <div className="kpi-value" style={{ color: k.color, fontSize: k.small ? '0.72rem' : '1.55rem', lineHeight: 1.2, textAlign: 'center', wordBreak: 'break-word' }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>
      <Heatmap data={stateMap} title="MY RATINGS BY STATE" />
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 9 }}>MY VENUES — TAP FOR TOP SHOWS</div>
      {!venues.length ? (
        <div className="empty-state">RATE SOME SHOWS FIRST</div>
      ) : venues.slice(0, 20).map((v, i) => {
        const accent = i === 0 ? 'var(--orange)' : i === 1 ? 'var(--cyan)' : 'rgba(51,255,51,0.4)';
        return (
          <CommExpandCard key={`${v.venue}-${i}`} name={v.venue}
            sub={`${v.city ? v.city + ', ' : ''}${v.state || ''} · ${v.total_shows} shows`}
            avg={v.average_rating || '—'} count={v.total_shows} countLabel="SHOWS"
            accent={accent}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 9 }}>TOP SHOWS HERE</div>
              {(v.top_shows || []).map((s, si) => (
                <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: si < v.top_shows.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
                  <a href={`https://phish.in/${s.show_date}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, border: '1px solid rgba(0,255,255,0.4)', background: 'rgba(0,255,255,0.05)', color: 'var(--cyan)', fontSize: '0.55rem', textDecoration: 'none', flexShrink: 0 }}>▶</a>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-label)', flex: 1 }}>{formatDate(s.show_date)}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.84rem', color: parseFloat(s.avg_score) >= 4.7 ? 'var(--orange)' : 'var(--cyan)', letterSpacing: 1 }}>{s.avg_score}</span>
                </div>
              ))}
            </div>
          </CommExpandCard>
        );
      })}
    </div>
  );
}

// ============================================================
// MY STATES TAB
// ============================================================
function MyStatesTab({ api, showMessage, showError }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/venues').then(setVenues).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageLoader text="LOADING YOUR STATES..." />;

  // Aggregate by state from venues data
  const byState = {};
  venues.forEach(v => {
    const st = v.state || 'Unknown';
    if (!byState[st]) byState[st] = { state: st, shows: 0, totalRating: 0, ratedShows: 0, topVenue: v.venue };
    byState[st].shows += parseInt(v.total_shows || 0);
    if (v.average_rating) {
      byState[st].totalRating += parseFloat(v.average_rating) * parseInt(v.total_shows || 0);
      byState[st].ratedShows += parseInt(v.total_shows || 0);
    }
    if (parseInt(v.total_shows || 0) > (byState[st].topVenueShows || 0)) {
      byState[st].topVenue = v.venue;
      byState[st].topVenueShows = parseInt(v.total_shows || 0);
    }
  });
  const states = Object.values(byState)
    .map(s => ({ ...s, avg: s.ratedShows > 0 ? (s.totalRating / s.ratedShows).toFixed(2) : null }))
    .sort((a, b) => parseFloat(b.avg || 0) - parseFloat(a.avg || 0));

  const stateMap = {};
  states.forEach(s => { if (s.avg) stateMap[s.state] = s.avg; });

  return (
    <div>
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        {[
          { label: 'STATES VISITED', value: states.length, color: 'var(--cyan)' },
          { label: 'TOP STATE', value: states[0]?.state || '—', color: 'var(--orange)' },
          { label: 'TOP STATE AVG', value: states[0]?.avg || '—', color: 'var(--green)' },
          { label: 'SHOWS IN TOP', value: states[0]?.shows || '—', color: 'var(--cyan)' },
        ].map((k, i) => (
          <div key={i} className="kpi-card" style={{ borderTopColor: k.color }}>
            <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>
      <Heatmap data={stateMap} title="MY RATINGS BY STATE" />
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 9 }}>MY STATES — TAP TO EXPAND</div>
      {!states.length ? (
        <div className="empty-state">RATE SOME SHOWS FIRST</div>
      ) : states.map((s, i) => {
        const accent = i === 0 ? 'var(--orange)' : i < 3 ? 'var(--cyan)' : 'rgba(51,255,51,0.4)';
        return (
          <CommExpandCard key={s.state} name={s.state}
            avg={s.avg || '—'} count={s.shows} countLabel="SHOWS"
            sub={`${s.shows} shows · top: ${s.topVenue}`}
            accent={accent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 4 }}>TOP VENUE IN {s.state}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92rem', color: 'var(--cyan)' }}>{s.topVenue}</div>
              </div>
              {s.avg && (
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 4 }}>YOUR AVG SCORE</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: parseFloat(s.avg) >= 4.7 ? 'var(--orange)' : 'var(--cyan)', textShadow: `0 0 10px ${parseFloat(s.avg) >= 4.7 ? 'rgba(255,102,0,0.5)' : 'rgba(0,255,255,0.5)'}` }}>{s.avg}</div>
                </div>
              )}
            </div>
          </CommExpandCard>
        );
      })}
    </div>
  );
}

// ============================================================
// DEEP PHREEZE TAB
// ============================================================
function DeepPhreezeTab({ api, showMessage, showError }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [toggle, setToggle] = useState('attended'); // 'attended' | 'rated'

  const load = () => {
    setLoading(true);
    api.get('/user/deep-phreeze')
      .then(setData)
      .catch(() => setData({ needs_sync: true }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.post('/user/sync', {});
      setSyncResult(`✓ SYNCED ${res.synced} SHOWS — ${res.total_attended} TOTAL`);
      setData({ needs_sync: false, stats: res.stats, computed_at: new Date().toISOString() });
    } catch (e) {
      setSyncResult(`✗ SYNC FAILED: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // ── PRIMITIVES ──────────────────────────────────────────
  const DP = {
    bg: 'var(--bg-panel)',
    border: 'var(--border)',
    cyan: 'var(--cyan)',
    orange: 'var(--orange)',
    green: 'var(--green)',
    white: 'var(--white)',
    label: 'var(--text-label)',
    muted: 'var(--text-muted)',
    disp: 'var(--font-display)',
    mono: 'var(--font-mono)',
  };

  const SecLabel = ({ children, color = DP.label }) => (
    <div style={{ fontFamily: DP.disp, fontSize: '0.44rem', letterSpacing: '3px', color, padding: '14px 0 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
      {children}
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, rgba(51,255,51,0.15), transparent)` }} />
    </div>
  );

  const HeroStat = ({ label, value, unit, context, sub, color = DP.cyan }) => (
    <div style={{ background: DP.bg, border: `1px solid ${color}44`, borderLeft: `3px solid ${color}`, borderTop: `2px solid ${color}`, padding: '16px', marginBottom: 8, position: 'relative', overflow: 'hidden' }}>
      <div style={{ fontFamily: DP.disp, fontSize: '0.4rem', letterSpacing: '3px', color, opacity: 0.8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
        {label}
      </div>
      <div style={{ fontFamily: DP.disp, fontSize: '2.8rem', fontWeight: 900, color, textShadow: `0 0 30px ${color}55`, letterSpacing: 2, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      {unit && <div style={{ fontFamily: DP.disp, fontSize: '0.44rem', color: DP.label, letterSpacing: '2px', marginBottom: 8 }}>{unit}</div>}
      {context && <div style={{ fontFamily: DP.mono, fontSize: '0.82rem', color: DP.white, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{context}</div>}
      {sub && <div style={{ fontFamily: DP.mono, fontSize: '0.65rem', color: DP.muted }}>{sub}</div>}
    </div>
  );

  const StatRow = ({ items }) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 8, marginBottom: 8 }}>
      {items.map(({ label, value, context, sub, color = DP.orange }) => (
        <div key={label} style={{ background: DP.bg, border: `1px solid ${DP.border}`, borderTop: `2px solid ${color}`, padding: '12px 10px' }}>
          <div style={{ fontFamily: DP.disp, fontSize: '0.36rem', letterSpacing: '2px', color: DP.label, marginBottom: 7 }}>{label}</div>
          <div style={{ fontFamily: DP.disp, fontSize: '1.4rem', fontWeight: 700, color, textShadow: `0 0 14px ${color}44`, letterSpacing: 1, lineHeight: 1, marginBottom: 4 }}>{value}</div>
          {context && <div style={{ fontFamily: DP.mono, fontSize: '0.66rem', color: DP.label, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{context}</div>}
          {sub && <div style={{ fontFamily: DP.mono, fontSize: '0.58rem', color: DP.muted, marginTop: 2 }}>{sub}</div>}
        </div>
      ))}
    </div>
  );

  const ListCard = ({ label, items, renderRow }) => (
    <div style={{ background: DP.bg, border: `1px solid ${DP.border}`, marginBottom: 8 }}>
      <div style={{ padding: '9px 14px', borderBottom: `1px solid rgba(51,255,51,0.08)`, fontFamily: DP.disp, fontSize: '0.42rem', letterSpacing: '2.5px', color: DP.cyan }}>{label}</div>
      {items.length ? items.map((item, i) => (
        <div key={i} style={{ padding: '9px 14px', borderBottom: i < items.length - 1 ? `1px solid rgba(51,255,51,0.06)` : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: DP.disp, fontSize: '0.46rem', color: DP.muted, width: 18, flexShrink: 0 }}>{i+1}.</span>
          {renderRow(item, i)}
        </div>
      )) : (
        <div style={{ padding: '12px 14px', fontFamily: DP.disp, fontSize: '0.44rem', color: DP.muted, letterSpacing: '2px' }}>NOT ENOUGH DATA YET</div>
      )}
    </div>
  );

  const SetGapViz = ({ show }) => {
    if (!show) return null;
    const s1 = parseFloat(show.set1_avg);
    const s2 = parseFloat(show.set2_avg);
    const max = Math.max(s1, s2, 3.5);
    const s1h = Math.max(10, ((s1 - 2) / (max - 2)) * 80);
    const s2h = Math.max(10, ((s2 - 2) / (max - 2)) * 80);
    const up = show.direction === 'up';
    return (
      <div style={{ background: DP.bg, border: `1px solid ${DP.border}`, borderTop: `2px solid ${DP.green}`, padding: 14, marginBottom: 8 }}>
        <div style={{ fontFamily: DP.disp, fontSize: '0.4rem', letterSpacing: '2.5px', color: DP.green, marginBottom: 12, opacity: 0.8 }}>◈ BIGGEST SET SWING</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 90, marginBottom: 10 }}>
          {[['SET I', s1h, DP.cyan, show.set1_avg], ['SET II', s2h, up ? DP.orange : DP.cyan, show.set2_avg]].map(([lbl, h, col, val]) => (
            <div key={lbl} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ fontFamily: DP.disp, fontSize: '0.56rem', color: col, letterSpacing: 1 }}>{val}</div>
              <div style={{ width: '100%', height: `${h}%`, background: col, opacity: 0.75, borderRadius: '2px 2px 0 0', boxShadow: `0 0 8px ${col}44`, transition: 'height 0.6s' }} />
              <div style={{ fontFamily: DP.disp, fontSize: '0.38rem', color: DP.label, letterSpacing: '1px' }}>{lbl}</div>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 20 }}>
            <div style={{ fontFamily: DP.disp, fontSize: '1rem', color: up ? DP.orange : DP.cyan }}>{up ? '↑' : '↓'}</div>
            <div style={{ fontFamily: DP.disp, fontSize: '0.52rem', color: up ? DP.orange : DP.cyan, letterSpacing: 1 }}>+{show.delta}</div>
          </div>
        </div>
        <div style={{ fontFamily: DP.mono, fontSize: '0.78rem', color: DP.white }}>{formatDate(show.date)}</div>
        <div style={{ fontFamily: DP.mono, fontSize: '0.66rem', color: DP.muted }}>{show.venue} · {up ? 'Set II went nuclear' : 'Set I was the moment'}</div>
      </div>
    );
  };

  const CompleteBar = ({ stat }) => {
    if (!stat) return null;
    return (
      <div style={{ background: DP.bg, border: `1px solid ${DP.border}`, borderLeft: `3px solid ${DP.green}`, padding: 14, marginBottom: 8 }}>
        <div style={{ fontFamily: DP.disp, fontSize: '0.4rem', letterSpacing: '2.5px', color: DP.green, marginBottom: 10, opacity: 0.8 }}>◈ MOST COMPLETE SHOW RATED</div>
        <div style={{ fontFamily: DP.mono, fontSize: '0.88rem', color: DP.white, marginBottom: 2 }}>{stat.venue}</div>
        <div style={{ fontFamily: DP.mono, fontSize: '0.68rem', color: DP.muted, marginBottom: 10 }}>{formatDate(stat.date)} · {stat.rated} of {stat.total} songs rated</div>
        <div style={{ height: 8, background: 'rgba(51,255,51,0.08)', borderRadius: 2, marginBottom: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${stat.pct}%`, background: `linear-gradient(90deg, ${DP.green}, rgba(51,255,51,0.6))`, boxShadow: '0 0 8px rgba(51,255,51,0.5)', borderRadius: 2 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: DP.disp, fontSize: '1.2rem', color: DP.green, textShadow: '0 0 12px rgba(51,255,51,0.5)' }}>{stat.pct}%</div>
          <div style={{ fontFamily: DP.disp, fontSize: '0.38rem', color: DP.muted, letterSpacing: '1.5px' }}>{stat.pct === 100 ? 'FULLY PHROZEN' : 'PHROZEN'}</div>
        </div>
      </div>
    );
  };

  // ── RENDER ───────────────────────────────────────────────
  if (loading) return <FullPageLoader text="LOADING DEEP PHREEZE..." />;

  if (!data || data.needs_sync) return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ background: 'var(--bg-panel)', border: '1px solid rgba(0,224,208,0.3)', borderTop: '2px solid var(--cyan)', padding: '24px 16px', marginBottom: 14, textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>❄</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--cyan)', letterSpacing: '3px', marginBottom: 8 }}>DEEP PHREEZE</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
          Your first sync pulls setlist data for all {'\n'}
          your attended shows from phish.net and {'\n'}
          computes your deep stats. Takes ~30 seconds.
        </div>
        <button onClick={handleSync} disabled={syncing} style={{ width: '100%', padding: '14px', background: 'rgba(0,224,208,0.08)', border: '1px solid rgba(0,224,208,0.45)', color: 'var(--cyan)', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2.5px', cursor: syncing ? 'wait' : 'pointer', boxShadow: '0 0 20px rgba(0,224,208,0.15)' }}>
          {syncing ? '◈ SYNCING...' : '❄ RUN DEEP PHREEZE SYNC'}
        </button>
        {syncResult && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: syncResult.startsWith('✓') ? 'var(--green)' : 'var(--red)', marginTop: 12 }}>{syncResult}</div>}
      </div>
    </div>
  );

  const s = data.stats || {};
  const isAttended = toggle === 'attended';

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, rgba(0,224,208,0.06) 0%, transparent 100%)', borderBottom: '1px solid rgba(0,224,208,0.2)', padding: '14px 0 12px', marginBottom: 4 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', letterSpacing: '3px', color: 'var(--cyan)', opacity: 0.7, marginBottom: 4 }}>◈ MY PHREEZER</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 900, color: 'var(--white)', letterSpacing: '3px', marginBottom: 4 }}>
          DEEP <span style={{ color: 'var(--cyan)', textShadow: '0 0 20px rgba(0,255,255,0.5)' }}>PHREEZE</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          Every number a story. {s.total_attended} shows · {s.years_active} years.
        </div>
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 14, border: '1px solid var(--border)' }}>
        {[['attended', `ATTENDED (${s.total_attended || 0})`], ['rated', `RATED (${s.total_rated || 0})`]].map(([k, l]) => (
          <button key={k} onClick={() => setToggle(k)} style={{
            flex: 1, padding: '10px 6px', background: toggle === k ? 'rgba(0,224,208,0.07)' : 'transparent',
            border: 'none', borderBottom: `2px solid ${toggle === k ? 'var(--cyan)' : 'transparent'}`,
            color: toggle === k ? 'var(--cyan)' : 'var(--text-muted)',
            fontFamily: 'var(--font-display)', fontSize: '0.44rem', letterSpacing: '2px', cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      {/* Sync button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button onClick={handleSync} disabled={syncing} style={{ background: 'transparent', border: '1px solid rgba(51,255,51,0.2)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.38rem', letterSpacing: '2px', padding: '5px 10px', cursor: 'pointer' }}>
          {syncing ? '◈ SYNCING...' : '↺ RE-SYNC'}
        </button>
      </div>
      {syncResult && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: syncResult.startsWith('✓') ? 'var(--green)' : 'var(--red)', marginBottom: 10 }}>{syncResult}</div>}

      {isAttended ? (
        /* ── ATTENDED VIEW ── */
        <>
          <SecLabel color="var(--cyan)">❄ LONGEST MOMENTS</SecLabel>
          <HeroStat
            label="LONGEST SHOW YOU ATTENDED"
            value={s.longest_show?.song_count || '—'}
            unit="SONGS IN THE SETLIST"
            context={s.longest_show?.venue}
            sub={s.longest_show ? formatDate(s.longest_show.date) : ''}
            color="var(--cyan)"
          />
          <StatRow items={[
            { label: 'LONGEST SET I', value: s.longest_set1?.count || '—', context: s.longest_set1?.venue, sub: s.longest_set1 ? formatDate(s.longest_set1.date) : '', color: 'var(--cyan)' },
            { label: 'LONGEST SET II', value: s.longest_set2?.count || '—', context: s.longest_set2?.venue, sub: s.longest_set2 ? formatDate(s.longest_set2.date) : '', color: 'var(--orange)' },
          ]} />

          <SecLabel>⚡ ATTENDANCE STREAKS</SecLabel>
          <StatRow items={[
            { label: 'LONGEST RUN', value: `${s.longest_run?.shows || '—'}`, context: 'consecutive shows', sub: s.longest_run?.start ? `starting ${formatDate(s.longest_run.start)}` : '', color: 'var(--orange)' },
            { label: 'LONGEST GAP', value: s.longest_gap?.days ? `${Math.round(s.longest_gap.days / 365 * 10) / 10}y` : '—', context: 'between shows', sub: s.longest_gap?.from ? `${formatDate(s.longest_gap.from)} → ${formatDate(s.longest_gap.to)}` : '', color: 'var(--cyan)' },
          ]} />

          <SecLabel>◉ MOST HEARD (ATTENDED)</SecLabel>
          <ListCard label="SONGS YOU'VE SEEN THE MOST" items={(s.most_heard_attended || []).slice(0, 8)} renderRow={(item, i) => (
            <>
              <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.song}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: i === 0 ? 'var(--orange)' : 'var(--cyan)', letterSpacing: 1, flexShrink: 0 }}>{item.count}x</div>
            </>
          )} />

          <SecLabel>⬡ RAREST SONGS CAUGHT</SecLabel>
          <ListCard label="SONGS YOU'VE ONLY SEEN ONCE" items={(s.rarest_caught || []).slice(0, 6)} renderRow={(item) => (
            <>
              <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.song}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', color: 'var(--text-muted)', letterSpacing: '1px', flexShrink: 0 }}>1x ONLY</div>
            </>
          )} />
        </>
      ) : (
        /* ── RATED VIEW ── */
        <>
          <SecLabel color="var(--orange)">★ EXTREME RATINGS</SecLabel>
          {s.highest_song && (
            <HeroStat
              label="HIGHEST SINGLE SONG RATING"
              value={s.highest_song.rating}
              unit={`${s.perfect_5s} PERFECT 5s IN YOUR HISTORY`}
              context={s.highest_song.song}
              sub={`${formatDate(s.highest_song.date)} · ${s.highest_song.venue}`}
              color="var(--orange)"
            />
          )}
          <StatRow items={[
            { label: 'BEST SHOW', value: s.highest_show?.avg || '—', context: s.highest_show?.venue, sub: s.highest_show ? formatDate(s.highest_show.date) : '', color: 'var(--orange)' },
            { label: 'LOWEST SHOW', value: s.lowest_show?.avg || '—', context: s.lowest_show?.venue, sub: s.lowest_show ? formatDate(s.lowest_show.date) : '', color: 'var(--cyan)' },
          ]} />

          <SecLabel>▦ BIGGEST SET SWING</SecLabel>
          <SetGapViz show={s.biggest_set_gap} />

          <SecLabel>◈ COMPLETIONISM</SecLabel>
          <CompleteBar stat={s.most_complete} />

          <SecLabel>◉ MOST RATED VERSIONS</SecLabel>
          <ListCard label="SONGS YOU'VE RATED THE MOST" items={(s.most_heard_rated || []).slice(0, 8)} renderRow={(item, i) => (
            <>
              <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.song}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', color: i === 0 ? 'var(--orange)' : 'var(--cyan)', letterSpacing: 1, flexShrink: 0 }}>{item.count}x</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.38rem', color: 'var(--text-muted)', letterSpacing: '1px', flexShrink: 0, textAlign: 'right', minWidth: 32 }}>avg {item.avg}</div>
            </>
          )} />
        </>
      )}

      {/* Footer */}
      {data.computed_at && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          Last computed: {new Date(data.computed_at).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MY PHRIENDS TAB
// ============================================================
function MyPhriends({ api, showMessage, showError }) {
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await api.get(`/community/phriend-overlap?username=${encodeURIComponent(searchInput.trim())}`);
      setResult(data);
    } catch (e) { showError(e.message || 'User not found'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '0 0 20px' }}>
      {/* Search bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="enter phreezer username..."
          style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,140,0,0.35)', color: 'var(--orange)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: '9px 10px', outline: 'none' }}
        />
        <button onClick={handleSearch} disabled={loading}
          style={{ background: 'rgba(255,140,0,0.07)', border: '1px solid rgba(255,140,0,0.35)', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.4rem', letterSpacing: '2px', padding: '9px 14px', cursor: 'pointer', opacity: loading ? 0.5 : 1, whiteSpace: 'nowrap' }}>
          {loading ? '...' : 'SEARCH'}
        </button>
      </div>

      {result && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '12px 14px', border: '1px solid rgba(255,140,0,0.25)', background: 'linear-gradient(135deg, rgba(255,140,0,0.05), rgba(5,18,5,0.98))' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,140,0,0.45)', background: 'rgba(255,140,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--orange)', flexShrink: 0 }}>
              {result.target.username.slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--white)' }}>{result.target.username}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {result.total_shared} shows together · {result.unique_venues} venues · {result.unique_years} years
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
            {[
              { v: result.total_shared, l: 'SHOWS TOGETHER' },
              { v: result.unique_venues, l: 'VENUES' },
              { v: result.unique_years, l: 'YEARS' },
            ].map(({ v, l }) => (
              <div key={l} style={{ textAlign: 'center', padding: '10px 4px', border: '1px solid rgba(255,140,0,0.2)', background: 'rgba(255,140,0,0.04)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--orange)', lineHeight: 1, marginBottom: 5 }}>{v}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.32rem', letterSpacing: '1.5px', color: 'rgba(255,140,0,0.5)' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Shared shows list */}
          {result.shows.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: '0 2px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.36rem', letterSpacing: '2px', color: 'var(--text-muted)' }}>SHOW</span>
                <div style={{ display: 'flex', gap: 22 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.36rem', letterSpacing: '1.5px', color: 'var(--cyan)' }}>YOU</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.36rem', letterSpacing: '1.5px', color: 'var(--orange)' }}>THEM</span>
                </div>
              </div>
              {result.shows.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', marginBottom: 5 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: 2 }}>
                      {(() => { const [y,m,d]=s.show_date.split('-'); const mn=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']; return `${mn[+m-1]} ${+d}, ${y}`; })()}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-label)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.venue}{s.city ? ` — ${s.city}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', padding: '2px 6px', border: '1px solid rgba(0,224,208,0.3)', color: 'var(--cyan)', minWidth: 32, textAlign: 'center' }}>
                      {s.my_score || '—'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', padding: '2px 6px', border: '1px solid rgba(255,140,0,0.3)', color: 'var(--orange)', minWidth: 32, textAlign: 'center' }}>
                      {s.their_score || '—'}
                    </span>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '20px 0' }}>NO SHARED SHOWS FOUND</div>
          )}
        </>
      )}

      {!result && !loading && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '24px 0', border: '1px solid var(--border)' }}>
          SEARCH A PHREEZER USERNAME TO SEE<br/>
          <span style={{ color: 'rgba(255,140,0,0.4)', marginTop: 6, display: 'block' }}>SHOWS YOU BOTH ATTENDED</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// BADGES SECTION — used in ProfileModal
// ============================================================
const ALL_BADGES_DEF = [
  { id: 'century',    label: 'CENTURY CLUB',    desc: 'Attended 100 shows',     glyph: '💯', color: 'var(--orange)' },
  { id: 'fifty',      label: 'HALF-CENTURY',    desc: 'Attended 50 shows',      glyph: '★',  color: 'var(--cyan)'   },
  { id: 'quarter',    label: 'QUARTER-CENTURY', desc: 'Attended 25 shows',      glyph: '◉',  color: 'var(--cyan)'   },
  { id: 'ten',        label: 'DOUBLE DIGITS',   desc: 'Attended 10 shows',      glyph: '◈',  color: 'var(--cyan)'   },
  { id: 'rated_100',  label: 'HALL OF PHAME',   desc: 'Rated 100 shows',        glyph: '🏆', color: 'var(--orange)' },
  { id: 'rated_50',   label: 'ARCHIVIST',       desc: 'Rated 50 shows',         glyph: '⬡',  color: 'var(--green)'  },
  { id: 'rated_25',   label: 'PHISH SCHOLAR',   desc: 'Rated 25 shows',         glyph: '▦',  color: 'var(--cyan)'   },
  { id: 'rated_10',   label: 'PHAN OF 10',      desc: 'Rated 10 shows',         glyph: '✦',  color: 'var(--cyan)'   },
  { id: 'rated_1',    label: 'FIRST PHREEZE',   desc: 'Rated your first show',  glyph: '❄',  color: 'var(--cyan)'   },
  { id: 'critic',     label: 'PHISH CRITIC',    desc: 'Imported 10+ reviews',   glyph: '✍',  color: 'var(--green)'  },
  { id: 'reviewer',   label: 'REVIEWER',        desc: 'Imported phish.net reviews', glyph: '✎', color: 'var(--green)' },
  { id: 'streak_30',  label: 'ON FIRE',         desc: '30-day login streak',    glyph: '🔥', color: 'var(--orange)' },
  { id: 'streak_7',   label: 'ON A STREAK',     desc: '7-day login streak',     glyph: '⚡', color: 'var(--orange)' },
];

function BadgesSection({ api }) {
  const [kpi, setKpi] = useState(null);
  useEffect(() => { api.get('/user/kpi').then(setKpi).catch(() => {}); }, []);

  if (!kpi) return <div className="empty-state">LOADING BADGES...</div>;

  const earnedIds = new Set((kpi.badges || []).map(b => b.id));
  const earned = ALL_BADGES_DEF.filter(b => earnedIds.has(b.id));
  const locked = ALL_BADGES_DEF.filter(b => !earnedIds.has(b.id));

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', color: 'var(--text-label)', letterSpacing: '3px', marginBottom: 12 }}>
        {earned.length} OF {ALL_BADGES_DEF.length} EARNED
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {earned.map((b, i) => (
          <div key={i} style={{ background: 'var(--bg-elevated)', border: `1px solid ${b.color}55`, borderTop: `2px solid ${b.color}`, padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, boxShadow: `0 0 16px ${b.color}22` }}>
            <span style={{ fontSize: '1.4rem', filter: `drop-shadow(0 0 6px ${b.color}99)` }}>{b.glyph}</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', color: b.color, letterSpacing: '1.5px', textAlign: 'center' }}>{b.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-label)', textAlign: 'center', lineHeight: 1.4 }}>{b.desc}</div>
          </div>
        ))}
      </div>
      {locked.length > 0 && (
        <>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: 8 }}>LOCKED</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {locked.map((b, i) => (
              <div key={i} style={{ background: 'var(--bg-panel)', border: '1px solid rgba(51,255,51,0.08)', padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.4 }}>
                <span style={{ fontSize: '1.4rem', filter: 'grayscale(1)' }}>{b.glyph}</span>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', color: 'var(--text-label)', letterSpacing: '1.5px', textAlign: 'center' }}>{b.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// PROFILE MODAL — launched from avatar (Phase 1)
// ============================================================
const AVATAR_ICONS = ['❄','◈','⚡','✦','⬡','◉','▦','✎','🔥','🐟','🌀','🎸','💯','★','✍','🏔'];

function ProfileModal({ user, api, onClose, onAvatarChange, onLogout }) {
  const [sec, setSec] = React.useState('info');
  const [profile, setProfile] = React.useState(null);
  const [selectedIcon, setSelectedIcon] = React.useState(user?.avatar_icon || null);
  const [savingIcon, setSavingIcon] = React.useState(false);

  React.useEffect(() => {
    api.get('/user/profile').then(d => {
      setProfile(d);
      if (d.avatar_icon) setSelectedIcon(d.avatar_icon);
    }).catch(() => {});
  }, []);

  const handleSaveIcon = async (icon) => {
    setSelectedIcon(icon);
    setSavingIcon(true);
    try {
      await api.post('/user/profile', {
        phishnet_username: profile?.phishnet_username || null,
        favorite_song: profile?.favorite_song || null,
        favorite_venue: profile?.favorite_venue || null,
        favorite_show_date: profile?.favorite_show_date || null,
        avatar_icon: icon,
      });
      onAvatarChange && onAvatarChange(icon);
    } catch (e) {}
    finally { setSavingIcon(false); }
  };

  return (
    <div className="profile-modal" onClick={onClose}>
      <div className="profile-modal-inner" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="profile-modal-header">
          <div style={{ fontFamily:'var(--font-display)', fontSize:'0.62rem', color:'var(--cyan)', letterSpacing:'3px' }}>◈ PROFILE</div>
          <button onClick={onClose} style={{ background:'transparent', border:'1px solid rgba(51,255,51,0.25)', color:'var(--text-label)', fontFamily:'var(--font-display)', fontSize:'0.52rem', letterSpacing:'2px', padding:'5px 10px', cursor:'pointer' }}>
            ✕ CLOSE
          </button>
        </div>
        {/* Identity hero */}
        <div className="profile-modal-hero">
          <div className="profile-username-label">USERNAME</div>
          <div className="profile-username">{user?.username}</div>
          <div className="profile-email">{user?.email}</div>
        </div>
        {/* Section tabs */}
        <div className="profile-modal-tabs">
          {[['info','INFO'],['badges','BADGES'],['settings','SETTINGS']].map(([k,l]) => (
            <button key={k} onClick={() => setSec(k)}
              className={`profile-modal-tab ${sec === k ? 'active' : ''}`}>{l}</button>
          ))}
        </div>
        {/* Body */}
        <div className="profile-modal-body">
          {sec === 'info' && (
            <div className="panel" style={{ marginBottom: 12 }}>
              <div className="profile-section">
                {[
                  ['PHISH.NET HANDLE', profile?.phishnet_username],
                  ['FAVORITE SONG',    profile?.favorite_song],
                  ['FAVORITE VENUE',   profile?.favorite_venue],
                  ['FIRST SHOW',       profile?.favorite_show_date ? formatDate(profile.favorite_show_date) : null],
                ].map(([label, val]) => (
                  <div key={label} className="profile-field-row">
                    <div className="profile-field-label">{label}</div>
                    <div className="profile-field-val" style={{ color: val ? 'var(--white)' : 'var(--text-muted)', fontSize: val ? '0.92rem' : '0.8rem' }}>
                      {val || (profile ? '—' : '...')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {sec === 'badges' && (
            <BadgesSection api={api} />
          )}
          {sec === 'settings' && (
            <div>
              {/* Avatar icon picker */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-label)', letterSpacing: '2.5px', marginBottom: 10 }}>
                  ◈ CHOOSE YOUR ICON
                  {savingIcon && <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>SAVING...</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
                  {AVATAR_ICONS.map(icon => (
                    <button key={icon} onClick={() => handleSaveIcon(icon)} style={{
                      width: '100%', aspectRatio: '1', border: `2px solid ${selectedIcon === icon ? 'var(--cyan)' : 'rgba(51,255,51,0.15)'}`,
                      background: selectedIcon === icon ? 'rgba(0,224,208,0.12)' : 'var(--bg-elevated)',
                      fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: selectedIcon === icon ? '0 0 12px rgba(0,224,208,0.35)' : 'none',
                      transition: 'all 0.15s',
                    }}>
                      {icon}
                    </button>
                  ))}
                </div>
                {selectedIcon && (
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--cyan)', letterSpacing: '2px', marginTop: 8, textAlign: 'center' }}>
                    ACTIVE: {selectedIcon}
                  </div>
                )}
              </div>
              <div style={{ borderTop: '1px solid rgba(51,255,51,0.08)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="https://buymeacoffee.com/mpgink" target="_blank" rel="noopener noreferrer"
                  className="btn-glow-cyan" style={{ marginBottom: 4 }}>◈ SUPPORT THE PHREEZER</a>
                <button className="btn-glow-red" onClick={() => { onLogout && onLogout(); onClose(); }}>SIGN OUT</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ROOT APP
// ============================================================
export default function App() {
  const [tab, setTab] = useState('scorecard'); // will be overridden on user load
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
  const [feedbackModal, setFeedbackModal] = useState(null); // 'post_rating' | 'week1' | null
  const [rateShowDate, setRateShowDate] = useState(null);
  // Scorecard overlay — replaces tab navigation for rating
  const [scorecardOverlay, setScorecardOverlay] = useState(false);
  const [scorecardOverlayDate, setScorecardOverlayDate] = useState(null);
  const [scorecardOverlayOrigin, setScorecardOverlayOrigin] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
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
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    }).then(async res => {
      if (res.status === 401) {
        localStorage.removeItem('phish_token');
        setUser(null);
        return;
      }
      if (!res.ok) return; // non-401 error — keep token, stay logged in
      const u = await res.json();
      setUser(u);
      setTab(!u.tandc_accepted ? 'scorecard' : 'my-shows');
      if (!u.tandc_accepted) {
        setShowTandC(true);
      } else if (!u.onboarding_complete) {
        // Onboarding was reset — re-trigger T&C → profile setup flow
        setShowTandC(true);
      } else if (!sessionStorage.getItem('phreezer_welcomed')) {
        sessionStorage.setItem('phreezer_welcomed', '1');
        setShowWelcome(true);
      }
      // Week-1 feedback trigger
      if (u.created_at && u.onboarding_complete) {
        const daysSince = (Date.now() - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24);
        const alreadyDone = localStorage.getItem('phreezer_week1_feedback_done');
        if (daysSince >= 7 && !alreadyDone) {
          localStorage.setItem('phreezer_week1_feedback_done', '1');
          setTimeout(() => setFeedbackModal('week1'), 2000);
        }
      }
    }).catch(() => {}); // network failure — keep token
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
    } else if (!u.onboarding_complete) {
      // Returning user who reset onboarding — re-trigger profile setup
      setShowTandC(true);
    } else if (!isNewUser) {
      setShowWelcome(true);
    }
  };

  const handleLogout = () => { localStorage.removeItem('phish_token'); setUser(null); setTab('scorecard'); };
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

  // Open scorecard as overlay — keeps user in their current tab
  const handleRateShow = (showDate) => {
    setScorecardOverlayDate(showDate);
    setScorecardOverlayOrigin(tab);
    setScorecardOverlay(true);
  };

  const closeScorecardOverlay = () => {
    setScorecardOverlay(false);
    setScorecardOverlayDate(null);
    setScorecardOverlayOrigin(null);
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
    setTab('my-shows'); // Go home — My Shows is the landing for returning users
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
      {tab === 'analytics'  && user && <AnalyticsTab  api={api} showMessage={showMessage} showError={showError} />}
      {tab === 'my-songs'      && user && <MySongsTab   api={api} showMessage={showMessage} showError={showError} />}
      {tab === 'my-venues'     && user && <MyVenuesTab  api={api} showMessage={showMessage} showError={showError} />}
      {tab === 'my-states'     && user && <MyStatesTab  api={api} showMessage={showMessage} showError={showError} />}
      {tab === 'my-phriends'      && user && <MyPhriends      api={api} showMessage={showMessage} showError={showError} />}
      {tab === 'my-deep-phreeze'  && user && <DeepPhreezeTab  api={api} showMessage={showMessage} showError={showError} />}
      {tab === 'community'         && <CommunityTab  api={api} subTab="leaderboard" />}
      {tab === 'top-shows'         && <CommunityTab  api={api} subTab="top-shows"   />}
      {tab === 'top-songs'         && <CommunityTab  api={api} subTab="top-songs"   />}
      {tab === 'top-venues'        && <CommunityTab  api={api} subTab="top-venues"  />}
      {tab === 'top-states'        && <CommunityTab  api={api} subTab="top-states"  />}
      {tab === 'phriend-overlap'   && <CommunityTab  api={api} subTab="phriend-overlap" />}
      {tab === 'profile'    && user && <ProfileTab api={api} user={user} />}
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
                  src="/assets/phreezer-logo.png"
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
                  <button
                    className="avatar-btn"
                    onClick={() => setShowProfileModal(true)}
                    aria-label="Profile"
                    style={{ fontSize: user.avatar_icon ? '1.1rem' : undefined }}
                  >
                    {user.avatar_icon || user.username.slice(0,2).toUpperCase()}
                  </button>
                ) : (
                  <><button onClick={() => openAuth('login')}>LOGIN</button><button className="btn-primary" onClick={() => openAuth('signup')}>REGISTER</button></>
                )}
              </div>
            </div>
          </header>
          <nav className="tab-nav">
            {user && <>
              <button className={`tab-btn ${['my-shows','my-songs','my-venues','my-states','my-phriends','my-deep-phreeze','analytics'].includes(tab) ? 'active' : ''}`} onClick={() => setTab('my-shows')}>MY PHREEZER</button>
              <button className={`tab-btn ${['community','leaderboard','top-shows','top-songs','top-venues','top-states','phriend-overlap'].includes(tab) ? 'active' : ''}`} onClick={() => setTab('community')}>COMMUNITY</button>
            </>}
            <button className={`tab-btn ${tab === 'scorecard' ? 'active' : ''}`} onClick={() => setTab('scorecard')}>SCORECARD</button>
          </nav>
          {user && ['my-shows','my-songs','my-venues','my-states','my-phriends','my-deep-phreeze','analytics'].includes(tab) && (
            <div className="sub-tab-nav">
              <button className={`sub-tab-btn ${tab === 'my-shows'  ? 'active' : ''}`} onClick={() => setTab('my-shows')}>MY SHOWS</button>
              <button className={`sub-tab-btn ${tab === 'my-songs'  ? 'active' : ''}`} onClick={() => setTab('my-songs')}>MY SONGS</button>
              <button className={`sub-tab-btn ${tab === 'my-venues' ? 'active' : ''}`} onClick={() => setTab('my-venues')}>MY VENUES</button>
              <button className={`sub-tab-btn ${tab === 'my-states' ? 'active' : ''}`} onClick={() => setTab('my-states')}>MY STATES</button>
              <button className={`sub-tab-btn ${tab === 'my-phriends' ? 'active' : ''}`} onClick={() => setTab('my-phriends')}>MY PHRIENDS</button>
              <button className={`sub-tab-btn ${tab === 'my-deep-phreeze' ? 'active' : ''}`} onClick={() => setTab('my-deep-phreeze')}>DEEP PHREEZE</button>
            </div>
          )}
          {['community','leaderboard','top-shows','top-songs','top-venues','top-states','phriend-overlap'].includes(tab) && (
            <div className="sub-tab-nav">
              <button className={`sub-tab-btn ${tab === 'community'   ? 'active' : ''}`} onClick={() => setTab('community')}>LEADERBOARD</button>
              <button className={`sub-tab-btn ${tab === 'phriend-overlap' ? 'active' : ''}`} onClick={() => setTab('phriend-overlap')}>PHRIEND OVERLAP</button>
              <button className={`sub-tab-btn ${tab === 'top-shows'   ? 'active' : ''}`} onClick={() => setTab('top-shows')}>TOP SHOWS</button>
              <button className={`sub-tab-btn ${tab === 'top-songs'   ? 'active' : ''}`} onClick={() => setTab('top-songs')}>TOP SONGS</button>
              <button className={`sub-tab-btn ${tab === 'top-venues'  ? 'active' : ''}`} onClick={() => setTab('top-venues')}>TOP VENUES</button>
              <button className={`sub-tab-btn ${tab === 'top-states'  ? 'active' : ''}`} onClick={() => setTab('top-states')}>TOP STATES</button>
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
      {/* Scorecard overlay — full screen, preserves tab context */}
      {scorecardOverlay && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'var(--bg)', overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Back bar */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'var(--bg)', borderBottom: '1px solid rgba(51,255,51,0.15)',
            padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <button onClick={closeScorecardOverlay} style={{
              background: 'transparent', border: '1px solid rgba(51,255,51,0.25)',
              color: 'var(--green)', fontFamily: 'var(--font-display)', fontSize: '0.48rem',
              letterSpacing: '2px', padding: '6px 12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>◀ BACK</button>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--text-muted)', letterSpacing: '2px' }}>
              SCORECARD
            </span>
          </div>
          {/* Scorecard content */}
          <div style={{ flex: 1, padding: '12px 12px 100px' }}>
            <ScorecardTab
              api={api}
              showMessage={showMessage}
              showError={showError}
              onAuthRequired={() => openAuth('login')}
              initialShowDate={scorecardOverlayDate}
              onShowLoaded={() => setScorecardOverlayDate(null)}
            />
          </div>
        </div>
      )}

      {showProfileModal && user && <ProfileModal user={user} api={api} onClose={() => setShowProfileModal(false)} onAvatarChange={(icon) => setUser(u => ({ ...u, avatar_icon: icon }))} onLogout={handleLogout} />}

      {feedbackModal && (
        <FeedbackModal type={feedbackModal} api={api} onClose={() => setFeedbackModal(null)} />
      )}
      <PassiveFeedbackButton api={api} />

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
                  setScorecardOverlay(true);
                  setScorecardOverlayOrigin('my-shows');
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
