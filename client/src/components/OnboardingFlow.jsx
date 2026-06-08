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

export function ProfileSetupModal({ api, onComplete }) {
  const [phishnetUsername, setPhishnetUsername] = useState('');
  const [confirmedHandle, setConfirmedHandle] = useState(false);
  const [favoriteSong, setFavoriteSong] = useState('');
  const [favoriteVenue, setFavoriteVenue] = useState('');
  const [favoriteShowDate, setFavoriteShowDate] = useState('');
  const [favoriteShowLabel, setFavoriteShowLabel] = useState('');
  const [songs, setSongs] = useState([]);
  const [venues, setVenues] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importCount, setImportCount] = useState(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState('import');

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

  const S = {
    field: { marginBottom: 18 },
    label: { fontFamily: 'var(--font-display)', fontSize: '0.46rem', letterSpacing: '2.5px', color: 'var(--text-label)', marginBottom: 8, display: 'block' },
    hint: { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 5 },
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 850 }}>
      <div className="modal" style={{ maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>

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
                placeholder="e.g. your_username"
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
            <button className="btn-primary" style={{ width: '100%', padding: '14px', marginBottom: 10 }} onClick={() => setStep('import')}>
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
              <button style={{ flex: 1, padding: '13px' }} onClick={onComplete}>SKIP FOR NOW</button>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
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

