import React, { useState, useEffect } from 'react';

export function OnboardingFlow({ user, onComplete, onStartImport, onGoToScorecard }) {
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
              style={{ width: '100%', padding: '12px', display: 'block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box', border: '1px solid rgba(var(--orange-rgb),0.3)', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '2px' }}>
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

export function ProfileSetupModal({ api, onComplete }) {
  // ── state ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState('handle');        // 'handle' | 'importing' | 'questions'
  const [phishnetUsername, setPhishnetUsername] = useState('');
  const [confirmedHandle, setConfirmedHandle] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importCount, setImportCount] = useState(null);
  const [importError, setImportError] = useState('');

  // profile question state
  const [favoriteSong, setFavoriteSong] = useState('');
  const [favoriteVenue, setFavoriteVenue] = useState('');
  const [favoriteShowDate, setFavoriteShowDate] = useState('');
  const [favoriteShowLabel, setFavoriteShowLabel] = useState('');
  const [songs, setSongs] = useState([]);
  const [venues, setVenues] = useState([]);
  const [saving, setSaving] = useState(false);

  const S = {
    label: { fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '2.5px', color: 'var(--text-label)', marginBottom: 8, display: 'block' },
    hint: { fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 5 },
    field: { marginBottom: 18 },
  };

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

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!phishnetUsername.trim() || !confirmedHandle) return;
    setImporting(true);
    setImportError('');
    try {
      const [attRes, revRes] = await Promise.all([
        api.post('/import/phishnet', { phishnet_username: phishnetUsername.trim() }).catch(() => ({ imported: 0 })),
        api.post('/import/phishnet-reviews', { phishnet_username: phishnetUsername.trim() }).catch(() => ({ imported: 0 })),
      ]);
      setImportCount({ attendance: attRes.imported || 0, reviews: revRes.imported || 0 });
      await loadOptions();
      setStep('questions');
    } catch (e) {
      setImportError('Import failed. Check your username and try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleSkip = async () => {
    await loadOptions();
    setStep('questions');
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

  // ── STEP: handle ───────────────────────────────────────────────────────────
  if (step === 'handle') {
    return (
      <div className="modal-overlay" style={{ zIndex: 850 }}>
        <div className="modal" style={{ maxWidth: 480 }}>
          <div className="modal-title">SET UP YOUR PROFILE</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'rgba(var(--green-rgb),0.5)', marginBottom: 24, lineHeight: 1.6 }}>
            Import your history from phish.net to unlock your stats and Deep Phreeze.
          </div>

          {/* phish.net input */}
          <div style={S.field}>
            <label style={S.label}>PHISH.NET USERNAME</label>
            <input
              type="text"
              placeholder="e.g. your_username"
              value={phishnetUsername}
              className="modal-input"
              onChange={e => { setPhishnetUsername(e.target.value); setConfirmedHandle(false); }}
            />
            <div style={S.hint}>Optional — unlocks your full history, stats, and Deep Phreeze.</div>
          </div>

          {/* confirm checkbox — only shows when username entered */}
          {phishnetUsername.trim() && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20, cursor: 'pointer' }}
              onClick={() => setConfirmedHandle(v => !v)}>
              <input type="checkbox" checked={confirmedHandle} onChange={e => setConfirmedHandle(e.target.checked)}
                style={{ flexShrink: 0, marginTop: 3, accentColor: 'var(--orange)', width: 16, height: 16 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(var(--green-rgb),0.75)', lineHeight: 1.5 }}>
                I confirm this is my phish.net account
              </span>
            </div>
          )}

          {/* import button — only shows when username + confirmed */}
          {phishnetUsername.trim() && confirmedHandle && (
            <button
              className="btn-primary"
              style={{ width: '100%', padding: '14px', marginBottom: 12 }}
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? '◈ IMPORTING...' : '↓ IMPORT FROM PHISH.NET'}
            </button>
          )}

          {importError && (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', color: '#ff4444', marginBottom: 12, letterSpacing: '1px' }}>
              {importError}
            </div>
          )}

          {/* OR divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 12px' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(var(--green-rgb),0.08)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'rgba(var(--green-rgb),0.25)', letterSpacing: '2px' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(var(--green-rgb),0.08)' }} />
          </div>

          {/* skip */}
          <button
            style={{ width: '100%', padding: '13px', background: 'transparent', border: '1px solid rgba(var(--green-rgb),0.2)', color: 'rgba(var(--green-rgb),0.5)', fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '2px', cursor: 'pointer' }}
            onClick={handleSkip}
          >
            I DON'T HAVE A PHISH.NET ACCOUNT
          </button>
        </div>
      </div>
    );
  }

  // ── STEP: questions ─────────────────────────────────────────────────────────
  if (step === 'questions') {
    return (
      <div className="modal-overlay" style={{ zIndex: 850 }}>
        <div className="modal" style={{ maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>

          {/* import success banner */}
          {importCount && (
            <div style={{ textAlign: 'center', marginBottom: 24, padding: '16px', border: '1px solid rgba(var(--cyan-rgb),0.2)', background: 'rgba(var(--cyan-rgb),0.04)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 900, color: 'var(--cyan)', letterSpacing: '3px', marginBottom: 6, textShadow: '0 0 20px rgba(var(--cyan-rgb),0.4)' }}>
                PHROZEN IN.
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.66rem', color: 'var(--green)', letterSpacing: '2px' }}>
                ✓ {importCount.attendance} SHOWS · {importCount.reviews} REVIEWS
              </div>
            </div>
          )}

          <div className="modal-title">A FEW QUICK QUESTIONS</div>

          {/* favorite song */}
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
          </div>

          {/* favorite venue */}
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
          </div>

          {/* first show — auto-set if imported */}
          {favoriteShowDate && (
            <div style={S.field}>
              <label style={S.label}>FIRST SHOW ◈ AUTO-SET</label>
              <div style={{ padding: '10px 12px', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--cyan)', background: 'rgba(var(--cyan-rgb),0.04)' }}>
                {favoriteShowLabel}
              </div>
              <div style={S.hint}>Your earliest attended show</div>
            </div>
          )}

          <button className="btn-primary" style={{ width: '100%', padding: '14px', marginBottom: 10, marginTop: 8 }} onClick={handleSave} disabled={saving}>
            {saving ? 'SAVING...' : "LET'S GO ◈"}
          </button>

          <button
            style={{ width: '100%', padding: '11px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '2px', cursor: 'pointer' }}
            onClick={onComplete}
          >
            SKIP FOR NOW
          </button>

        </div>
      </div>
    );
  }

  return null;
}
