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

// Mobile-friendly rating: tap number 1-5, tap again to clear
function SongRating({ value, onChange }) {
  return (
    <div className="song-rating-row">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          className={`rating-btn ${n <= value ? 'active' : ''} ${n === value ? 'selected' : ''}`}
          onClick={() => onChange(n === value ? 0 : n)}
          aria-label={`Rate ${n}`}
        >{n}</button>
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

// Dopamine save animation
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
            left: `${p.x}%`,
            color: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
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

// Mike Says No — error display
function MikeError({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
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

function AuthModal({ mode, setMode, onSuccess, onClose }) {
  const api = useApi();
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ email: '', username: '', password: '', firstName: '', lastName: '' });
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
      onSuccess(data.user);
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

function ScorecardTab({ api, showMessage, showError, onAuthRequired }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentShow, setCurrentShow] = useState(null);
  const [songs, setSongs] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loadingShow, setLoadingShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [phishnetHandle, setPhishnetHandle] = useState(localStorage.getItem('pnet_handle') || '');
  const [celebrating, setCelebrating] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const isAuthed = !!localStorage.getItem('phish_token');

  // Filter out future shows
  const filterShows = (list) => list.filter(s => s.showdate <= TODAY);

  // Load recent shows on mount
  useEffect(() => {
    api.get('/shows').then(data => {
      setResults(filterShows(data));
    }).catch(() => {});
  }, []);

  // Debounced autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      // Reset to recent shows
      api.get('/shows').then(data => {
        setResults(filterShows(data));
        setDropdownOpen(false);
      }).catch(() => {});
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.get(`/shows?q=${encodeURIComponent(query.trim())}`);
        const filtered = filterShows(data);
        setResults(filtered);
        setDropdownOpen(true);
      } catch (err) {
        showError(err.message);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const selectShow = async (show) => {
    if (!isAuthed) { onAuthRequired(); return; }
    setDropdownOpen(false);
    setQuery(`${formatDate(show.showdate)} — ${show.venue}`);
    setLoadingShow(true);
    setCurrentShow(show);
    setSongs([]);
    setRatings({});
    try {
      const [showData, savedRatings] = await Promise.all([
        api.get(`/shows/${show.showdate}`),
        api.get(`/ratings/${show.showdate}`).catch(() => []),
      ]);
      setSongs(showData.songs || []);
      setCurrentShow(showData);
      const rMap = {};
      for (const r of savedRatings) rMap[r.song_name] = { rating: r.rating, notes: r.notes || '' };
      setRatings(rMap);
    } catch (err) {
      showError('Failed to load show');
      setCurrentShow(null);
    } finally {
      setLoadingShow(false);
    }
  };

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
        showDetails: { venue: currentShow.venue, city: currentShow.city, state: currentShow.state, country: currentShow.country },
      });
      if (phishnetHandle.trim()) localStorage.setItem('pnet_handle', phishnetHandle.trim());
      setCelebrating(true);
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
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

  const relistenUrl = currentShow
    ? `${RELISTEN}/${currentShow.showdate?.replace(/-/g, '/')}`
    : null;

  return (
    <div>
      {celebrating && <SaveCelebration onDone={() => { setCelebrating(false); showMessage(`Saved ${songs.filter(s => ratings[s.song]?.rating).length} ratings`, 'success'); }} />}

      {/* Instructions */}
      <div className="instructions-panel">
        <button className="instructions-toggle" onClick={() => setShowInstructions(!showInstructions)}>
          <span>HOW TO USE PHISHOW SCORECARD</span>
          <span className="toggle-arrow">{showInstructions ? '▲ COLLAPSE' : '▼ EXPAND'}</span>
        </button>
        {showInstructions && (
          <div className="instructions-body">
            <div className="instructions-grid">
              <div>
                <div className="instr-step"><span className="instr-num">01</span><span>Type any date, venue, or city — results appear instantly as you type.</span></div>
                <div className="instr-step"><span className="instr-num">02</span><span>Click a show to load the full setlist live from Phish.net.</span></div>
                <div className="instr-step"><span className="instr-num">03</span><span>Tap 1–5 to rate each song. Tap the same number again to clear.</span></div>
              </div>
              <div>
                <div className="instr-step"><span className="instr-num">04</span><span>Add notes per song. Segues shown between songs.</span></div>
                <div className="instr-step"><span className="instr-num">05</span><span>Click any song name to open its Phish.net history page.</span></div>
                <div className="instr-step"><span className="instr-num">06</span><span>Stream audio on Relisten, read community reviews, track your show history.</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search — autocomplete */}
      <div className="panel">
        <div className="panel-title">SEARCH SHOWS</div>
        <div className="search-autocomplete" ref={searchRef}>
          <div className="search-input-wrap">
            <input
              type="text"
              placeholder="Type date, venue, city, or tour..."
              value={query}
              onChange={e => { setQuery(e.target.value); if (e.target.value.trim()) setDropdownOpen(true); }}
              onFocus={() => { if (results.length) setDropdownOpen(true); }}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            {searching && <span className="search-spinner">◈</span>}
          </div>
          {dropdownOpen && results.length > 0 && (
            <div className="search-dropdown">
              {results.map(show => (
                <div key={show.showid || show.showdate} className="search-dropdown-item" onMouseDown={() => selectShow(show)} onTouchEnd={() => selectShow(show)}>
                  <span className="result-date">{formatDate(show.showdate)}</span>
                  <span className="result-venue">{show.venue}</span>
                  <span className="result-meta">
                    <span className="result-location">{show.city}{show.state ? `, ${show.state}` : ''}</span>
                    {show.tour_name && show.tour_name !== 'Not Part of a Tour' && <span className="result-tour">{show.tour_name}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent shows list — shown when no dropdown */}
        {!dropdownOpen && !currentShow && !loadingShow && results.length > 0 && (
          <>
            <div className="results-header">Recent shows — tap to load</div>
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
          {/* Show Masthead */}
          <div className="show-masthead">
            <div className="show-masthead-main">
              <div className="show-date-display">{formatDate(currentShow.showdate)}</div>
              <div className="show-venue-display">{currentShow.venue}</div>
              <div className="show-location-display">
                {currentShow.city}{currentShow.state ? `, ${currentShow.state}` : ''}{currentShow.country && currentShow.country !== 'USA' ? `, ${currentShow.country}` : ''}
              </div>
              {currentShow.tour_name && <div className="show-tour">◈ {currentShow.tour_name}</div>}
            </div>
            <div className="show-masthead-links">
              <a href={`${PNET}/setlists/${currentShow.permalink || ''}`} target="_blank" rel="noopener noreferrer" className="show-link pnet-link">
                PHISH.NET SETLIST
              </a>
              {relistenUrl && (
                <a href={relistenUrl} target="_blank" rel="noopener noreferrer" className="show-link audio-link">
                  STREAM ON RELISTEN
                </a>
              )}
              {currentShow.reviews?.count > 0 && (
                <a href={`${PNET}/setlists/${currentShow.permalink}#reviews`} target="_blank" rel="noopener noreferrer" className="show-link reviews-link">
                  {currentShow.reviews.count} REVIEWS {currentShow.reviews.avg_score ? `(${currentShow.reviews.avg_score}/5)` : ''}
                </a>
              )}
            </div>
          </div>

          {currentShow.soundcheck && (
            <div className="soundcheck-bar">
              <span className="soundcheck-label">SOUNDCHECK:</span> {currentShow.soundcheck}
            </div>
          )}

          {currentShow.setlist_notes && (
            <div className="setlist-notes" dangerouslySetInnerHTML={{ __html: currentShow.setlist_notes }} />
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
                    {setSongs.map((song, idx) => (
                      <div key={idx} className={`song-row ${ratings[song.song]?.rating ? 'rated' : ''} ${song.isjam ? 'jam' : ''}`}>
                        <span className="song-pos">{song.position || idx + 1}</span>
                        <div className="song-info">
                          <a
                            href={`${PNET}/song/${song.slug || song.song.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')}`}
                            target="_blank" rel="noopener noreferrer"
                            className={`song-name-link ${song.isjam ? 'jam-chart' : ''}`}
                            onClick={e => e.stopPropagation()}
                          >{song.song}</a>
                          {song.isjam && <span className="badge jam-badge">JAM</span>}
                          {song.isreprise && <span className="badge reprise-badge">REPRISE</span>}
                          {song.footnote && <span className="badge footnote-badge" title={song.footnote}>*</span>}
                        </div>
                        <span className="song-transition">
                          {song.transition === '>' ? <span className="segue-soft">&gt;</span>
                            : song.transition === '->' ? <span className="segue-hard">--&gt;</span>
                            : null}
                        </span>
                        <div className="song-row-controls">
                          <SongRating
                            value={parseInt(ratings[song.song]?.rating) || 0}
                            onChange={val => updateRating(song.song, 'rating', val)}
                          />
                          <input
                            className="notes-input"
                            type="text"
                            placeholder="notes..."
                            value={ratings[song.song]?.notes || ''}
                            onChange={e => updateRating(song.song, 'notes', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Score Summary */}
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

              {/* Submit */}
              <div className="submit-section">
                <div className="pnet-handle-row">
                  <span className="pnet-handle-label">PHISH.NET HANDLE:</span>
                  <input
                    type="text" className="pnet-handle-input" placeholder="username (optional)"
                    value={phishnetHandle} onChange={e => setPhishnetHandle(e.target.value)}
                  />
                  {phishnetHandle && (
                    <a href={`${PNET}/users/${phishnetHandle}`} target="_blank" rel="noopener noreferrer" className="pnet-profile-link">VIEW PROFILE</a>
                  )}
                </div>
                <button className="btn-primary btn-submit" onClick={submitRatings} disabled={submitting}>
                  {submitting ? 'SAVING...' : 'SAVE RATINGS'}
                </button>
              </div>

              {/* Community Reviews */}
              {currentShow.reviews?.items?.length > 0 && (
                <div className="reviews-section">
                  <div className="panel-title">PHISH.NET COMMUNITY REVIEWS</div>
                  {currentShow.reviews.items.map((rev, i) => (
                    <div key={i} className="review-item">
                      <div className="review-header">
                        <span className="review-author">{rev.author}</span>
                        {rev.score && <span className="review-score">{rev.score}/5</span>}
                        <span className="review-date">{rev.posted}</span>
                      </div>
                      <div className="review-text" dangerouslySetInnerHTML={{ __html: rev.review?.substring(0, 300) + (rev.review?.length > 300 ? '...' : '') }} />
                    </div>
                  ))}
                  <a href={`${PNET}/setlists/${currentShow.permalink}#reviews`} target="_blank" rel="noopener noreferrer" className="show-link" style={{ marginTop: 8, display: 'inline-block' }}>
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
      </div>
    </div>
  );
}

function MyShowsTab({ api, showMessage, showError }) {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/user/shows').then(setShows).catch(err => showError(err.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">LOADING YOUR SHOWS...</div>;
  return (
    <div className="panel">
      <div className="panel-title">MY RATED SHOWS ({shows.length})</div>
      {!shows.length ? <div className="empty-state">NO RATED SHOWS YET</div> : shows.map(show => (
        <div key={show.show_date} className="show-card">
          <div className="show-card-date"><div className="show-card-datestr">{formatDate(show.show_date)}</div></div>
          <div className="show-card-info">
            <div className="show-card-venue">{show.venue}</div>
            <div className="show-card-loc">{show.city}{show.state ? `, ${show.state}` : ''}</div>
          </div>
          <div className="show-card-links">
            <a href={`${RELISTEN}/${show.show_date?.replace(/-/g,'/')}`} target="_blank" rel="noopener noreferrer" className="show-link-sm audio">RELISTEN</a>
            <a href={`https://phish.net/setlists/phish-${show.show_date}.html`} target="_blank" rel="noopener noreferrer" className="show-link-sm">SETLIST</a>
          </div>
          <div className="show-card-rating">
            <div className="rating-value">{show.overall_rating ?? '-'}</div>
            <div className="rating-label">{show.rated_count} rated</div>
          </div>
        </div>
      ))}
    </div>
  );
}

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

  if (loading) return <div className="loading">CRUNCHING NUMBERS...</div>;
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

export default function App() {
  const [tab, setTab] = useState('scorecard');
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [messages, setMessages] = useState([]);
  const [mikeError, setMikeError] = useState(null);
  const api = useApi();

  const showMessage = useCallback((text, type = 'info') => {
    const id = Date.now() + Math.random();
    setMessages(prev => [...prev, { id, text, type }]);
    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 4000);
  }, []);

  // Mike Says No for errors
  const showError = useCallback((text) => {
    setMikeError(text);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('phish_token');
    if (!token) return;
    api.get('/auth/me').then(setUser).catch(() => localStorage.removeItem('phish_token'));
  }, []);

  const handleAuthSuccess = u => { setUser(u); setShowAuth(false); showMessage(`Welcome back, ${u.username}`, 'success'); };
  const handleLogout = () => { localStorage.removeItem('phish_token'); setUser(null); setTab('scorecard'); };
  const openAuth = (mode = 'login') => { setAuthMode(mode); setShowAuth(true); };

  return (
    <div className="app">
      {mikeError && <MikeError message={mikeError} onClose={() => setMikeError(null)} />}

      <div className="messages-container">
        {messages.map(m => <div key={m.id} className={`message ${m.type}`}>{m.text}</div>)}
      </div>

      <div className="marquee-bar">
        <span className="marquee-track">
          DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp; DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp; DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp; DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp; DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp; DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp;
        </span>
      </div>

      <header className="app-header">
        <div className="header-title">
          <h1>Phishow Scorecard</h1>
          <span className="tagline">Rate. Track. Relive.</span>
        </div>
        <div className="header-status"><div className="status-dot" />ONLINE</div>
        <div className="header-auth">
          {user ? (
            <><span className="user-badge">◈ {user.username}</span><button className="btn-danger" onClick={handleLogout}>LOGOUT</button></>
          ) : (
            <><button onClick={() => openAuth('login')}>LOGIN</button><button className="btn-primary" onClick={() => openAuth('signup')}>REGISTER</button></>
          )}
        </div>
      </header>

      <div className="container">
        <nav className="tab-nav">
          <button className={`tab-btn ${tab === 'scorecard' ? 'active' : ''}`} onClick={() => setTab('scorecard')}>SCORECARD</button>
          {user && <>
            <button className={`tab-btn ${tab === 'my-shows' ? 'active' : ''}`} onClick={() => setTab('my-shows')}>MY SHOWS</button>
            <button className={`tab-btn ${tab === 'analytics' ? 'active' : ''}`} onClick={() => setTab('analytics')}>ANALYTICS</button>
          </>}
        </nav>
        {tab === 'scorecard' && <ScorecardTab api={api} showMessage={showMessage} showError={showError} onAuthRequired={() => openAuth('login')} />}
        {tab === 'my-shows' && user && <MyShowsTab api={api} showMessage={showMessage} showError={showError} />}
        {tab === 'analytics' && user && <AnalyticsTab api={api} showMessage={showMessage} showError={showError} />}
      </div>

      {showAuth && <AuthModal mode={authMode} setMode={setAuthMode} onSuccess={handleAuthSuccess} onClose={() => setShowAuth(false)} />}
    </div>
  );
}
