import React, { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';

const API = '/api';

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

  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
  };
}

function Message({ messages }) {
  return (
    <div className="messages-container">
      {messages.map(m => (
        <div key={m.id} className={`message ${m.type}`}>{m.text}</div>
      ))}
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
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await api.post('/auth/login', loginForm);
      localStorage.setItem('phish_token', data.token);
      onSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await api.post('/auth/register', signupForm);
      localStorage.setItem('phish_token', data.token);
      onSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">{mode === 'login' ? 'System Access' : 'Create Account'}</div>

        {error && <div className="message error" style={{ marginBottom: 16 }}>{error}</div>}

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="EMAIL" value={loginForm.email}
              onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} required />
            <input type="password" placeholder="PASSWORD" value={loginForm.password}
              onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} required />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'AUTHENTICATING...' : 'LOGIN'}
            </button>
            <div className="modal-switch">
              No account? <button type="button" onClick={() => setMode('signup')}>Register</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <input type="text" placeholder="USERNAME" value={signupForm.username}
              onChange={e => setSignupForm({ ...signupForm, username: e.target.value })} required />
            <input type="email" placeholder="EMAIL" value={signupForm.email}
              onChange={e => setSignupForm({ ...signupForm, email: e.target.value })} required />
            <input type="password" placeholder="PASSWORD" value={signupForm.password}
              onChange={e => setSignupForm({ ...signupForm, password: e.target.value })} required />
            <input type="text" placeholder="FIRST NAME (optional)" value={signupForm.firstName}
              onChange={e => setSignupForm({ ...signupForm, firstName: e.target.value })} />
            <input type="text" placeholder="LAST NAME (optional)" value={signupForm.lastName}
              onChange={e => setSignupForm({ ...signupForm, lastName: e.target.value })} />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
            </button>
            <div className="modal-switch">
              Have an account? <button type="button" onClick={() => setMode('login')}>Login</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ScorecardTab({ api, showMessage, onAuthRequired }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [currentShow, setCurrentShow] = useState(null);
  const [songs, setSongs] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loadingShow, setLoadingShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingRatings, setExistingRatings] = useState({});
  const isAuthed = !!localStorage.getItem('phish_token');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = await api.get(`/shows?q=${encodeURIComponent(query)}`);
      setResults(data);
      if (data.length === 0) showMessage('No shows found', 'info');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSearching(false);
    }
  };

  const selectShow = async (show) => {
    if (!isAuthed) { onAuthRequired(); return; }
    setLoadingShow(true);
    setCurrentShow(show);
    setSongs([]);
    setRatings({});
    setExistingRatings({});
    try {
      const [showData, savedRatings] = await Promise.all([
        api.get(`/shows/${show.showdate}`),
        api.get(`/ratings/${show.showdate}`).catch(() => []),
      ]);
      setSongs(showData.songs || []);

      // Load existing ratings into state
      const rMap = {};
      const existMap = {};
      for (const r of savedRatings) {
        rMap[r.song_name] = { rating: r.rating, notes: r.notes };
        existMap[r.song_name] = true;
      }
      setRatings(rMap);
      setExistingRatings(existMap);
    } catch (err) {
      showMessage('Failed to load show', 'error');
      setCurrentShow(null);
    } finally {
      setLoadingShow(false);
    }
  };

  const updateRating = (songName, field, value) => {
    setRatings(prev => ({
      ...prev,
      [songName]: { ...prev[songName], [field]: value }
    }));
  };

  const submitRatings = async () => {
    setSubmitting(true);
    try {
      const ratingsList = songs
        .filter(s => ratings[s.song]?.rating)
        .map(s => ({
          song: s.song,
          set: s.set,
          rating: parseInt(ratings[s.song].rating),
          notes: ratings[s.song]?.notes || '',
        }));

      if (ratingsList.length === 0) {
        showMessage('Rate at least one song first', 'info');
        return;
      }

      await api.post(`/ratings/${currentShow.showdate}`, {
        ratings: ratingsList,
        showDetails: {
          venue: currentShow.venue,
          city: currentShow.city,
          state: currentShow.state,
          country: currentShow.country,
        },
      });
      showMessage(`Saved ${ratingsList.length} ratings`, 'success');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Group songs by set
  const sets = songs.reduce((acc, song) => {
    const key = song.set || '1';
    if (!acc[key]) acc[key] = [];
    acc[key].push(song);
    return acc;
  }, {});

  const setLabel = (key) => {
    if (key === 'e' || key === 'E') return 'ENCORE';
    if (key === 'e2') return 'ENCORE 2';
    return `SET ${key}`;
  };

  return (
    <div>
      <div className="panel">
        <div className="panel-title">▸ Search Shows</div>
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Date (YYYY-MM-DD), venue, or city..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button type="submit" disabled={searching}>
            {searching ? 'SCANNING...' : 'SEARCH'}
          </button>
        </form>

        {results.length > 0 && (
          <div className="results-list">
            {results.map(show => (
              <div key={show.showid || show.showdate} className="result-item" onClick={() => selectShow(show)}>
                <span className="result-date">{show.showdate}</span>
                <span className="result-venue">{show.venue}</span>
                <span className="result-location">{show.city}{show.state ? `, ${show.state}` : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {loadingShow && <div className="loading">LOADING SETLIST...</div>}

      {currentShow && !loadingShow && (
        <div className="panel">
          <div className="show-header">
            <div className="show-header-field">
              <label>Date</label>
              <span>{currentShow.showdate}</span>
            </div>
            <div className="show-header-field">
              <label>Venue</label>
              <span>{currentShow.venue}</span>
            </div>
            <div className="show-header-field">
              <label>City</label>
              <span>{currentShow.city}{currentShow.state ? `, ${currentShow.state}` : ''}</span>
            </div>
            <div className="show-header-field">
              <label>Country</label>
              <span>{currentShow.country}</span>
            </div>
          </div>

          {songs.length > 0 ? (
            <>
              <div className="panel-title">▸ Setlist & Ratings</div>
              <div className="setlist-container">
                {Object.entries(sets).map(([setKey, setSongs]) => (
                  <div key={setKey}>
                    <div className="set-label">{setLabel(setKey)}</div>
                    {setSongs.map((song, idx) => (
                      <div key={idx} className={`song-row ${ratings[song.song]?.rating ? 'rated' : ''}`}>
                        <span className={`song-name ${song.isjam ? 'jam-chart' : ''}`}>
                          {song.song}
                          {song.transition === '>' ? <span style={{ color: 'var(--orange)', marginLeft: 4 }}>{'>'}</span> : null}
                        </span>
                        <select
                          className="rating-select"
                          value={ratings[song.song]?.rating || ''}
                          onChange={e => updateRating(song.song, 'rating', e.target.value)}
                        >
                          <option value="">—</option>
                          <option value="5">5 ★★★★★</option>
                          <option value="4">4 ★★★★</option>
                          <option value="3">3 ★★★</option>
                          <option value="2">2 ★★</option>
                          <option value="1">1 ★</option>
                        </select>
                        <input
                          className="notes-input"
                          type="text"
                          placeholder="notes..."
                          value={ratings[song.song]?.notes || ''}
                          onChange={e => updateRating(song.song, 'notes', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="submit-row">
                <button className="btn-primary" onClick={submitRatings} disabled={submitting}>
                  {submitting ? 'SAVING...' : 'SAVE RATINGS'}
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">NO SETLIST DATA AVAILABLE</div>
          )}
        </div>
      )}
    </div>
  );
}

function MyShowsTab({ api, showMessage }) {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/user/shows')
      .then(setShows)
      .catch(err => showMessage(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">LOADING YOUR SHOWS...</div>;

  return (
    <div className="panel">
      <div className="panel-title">▸ My Rated Shows ({shows.length})</div>
      {shows.length === 0 ? (
        <div className="empty-state">NO RATED SHOWS YET — GO RATE A SHOW</div>
      ) : (
        shows.map(show => (
          <div key={show.show_date} className="show-card">
            <div className="show-card-date">{show.show_date}</div>
            <div className="show-card-venue">
              {show.venue}
              <small>{show.city}{show.state ? `, ${show.state}` : ''}</small>
            </div>
            <div className="show-card-rating">
              <div className="rating-value">{show.overall_rating ?? '—'}</div>
              <div className="rating-label">{show.rated_count} songs rated</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function AnalyticsTab({ api, showMessage }) {
  const [songs, setSongs] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/songs'),
      api.get('/analytics/venues'),
    ]).then(([s, v]) => {
      setSongs(s);
      setVenues(v);
    }).catch(err => showMessage(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">CRUNCHING NUMBERS...</div>;

  return (
    <div className="analytics-grid">
      <div className="panel">
        <div className="panel-title">▸ Top Rated Songs</div>
        {songs.length === 0 ? (
          <div className="empty-state">NO DATA YET</div>
        ) : songs.slice(0, 20).map((s, i) => (
          <div key={s.song_name} className="stat-row">
            <span className="stat-rank">#{i + 1}</span>
            <span className="stat-name">{s.song_name}</span>
            <span className="stat-score">{s.average_rating}</span>
            <span className="stat-count">({s.total_ratings})</span>
          </div>
        ))}
      </div>
      <div className="panel">
        <div className="panel-title">▸ Top Venues</div>
        {venues.length === 0 ? (
          <div className="empty-state">NO DATA YET</div>
        ) : venues.slice(0, 20).map((v, i) => (
          <div key={`${v.venue}-${i}`} className="stat-row">
            <span className="stat-rank">#{i + 1}</span>
            <span className="stat-name">{v.venue}<br /><small style={{ color: 'rgba(51,255,51,0.4)', fontSize: '0.7rem' }}>{v.city}{v.state ? `, ${v.state}` : ''}</small></span>
            <span className="stat-score">{v.average_rating}</span>
            <span className="stat-count">({v.total_shows} shows)</span>
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
  const api = useApi();

  const showMessage = useCallback((text, type = 'info') => {
    const id = Date.now() + Math.random();
    setMessages(prev => [...prev, { id, text, type }]);
    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 4000);
  }, []);

  // Restore session on load
  useEffect(() => {
    const token = localStorage.getItem('phish_token');
    if (!token) return;
    api.get('/auth/me').then(setUser).catch(() => {
      localStorage.removeItem('phish_token');
    });
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setShowAuth(false);
    showMessage(`Welcome, ${userData.username}`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('phish_token');
    setUser(null);
    setTab('scorecard');
    showMessage('Logged out', 'info');
  };

  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  return (
    <div className="app">
      <Message messages={messages} />

      {/* Marquee */}
      <div className="marquee-bar">
        <span className="marquee-track">
          ◈ DON'T SUCK AT PHISH ◈ RATE EVERY SONG ◈ TRACK YOUR SHOWS ◈ PHISHOW SCORECARD ◈ DON'T SUCK AT PHISH ◈ RATE EVERY SONG ◈ TRACK YOUR SHOWS ◈ PHISHOW SCORECARD ◈ DON'T SUCK AT PHISH ◈ RATE EVERY SONG ◈
        </span>
      </div>

      {/* Header */}
      <header className="app-header">
        <div className="header-title">
          <h1>Phishow Scorecard</h1>
          <span className="tagline">Rate. Track. Relive.</span>
        </div>

        <div className="header-status">
          <div className="status-dot" />
          ONLINE
        </div>

        <div className="header-auth">
          {user ? (
            <>
              <span className="user-badge">◈ {user.username}</span>
              <button className="btn-danger" onClick={handleLogout}>LOGOUT</button>
            </>
          ) : (
            <>
              <button onClick={() => openAuth('login')}>LOGIN</button>
              <button className="btn-primary" onClick={() => openAuth('signup')}>REGISTER</button>
            </>
          )}
        </div>
      </header>

      {/* Tab Nav */}
      <div className="container">
        <nav className="tab-nav">
          <button className={`tab-btn ${tab === 'scorecard' ? 'active' : ''}`} onClick={() => setTab('scorecard')}>
            ▸ Scorecard
          </button>
          {user && (
            <>
              <button className={`tab-btn ${tab === 'my-shows' ? 'active' : ''}`} onClick={() => setTab('my-shows')}>
                ▸ My Shows
              </button>
              <button className={`tab-btn ${tab === 'analytics' ? 'active' : ''}`} onClick={() => setTab('analytics')}>
                ▸ Analytics
              </button>
            </>
          )}
        </nav>

        {tab === 'scorecard' && (
          <ScorecardTab api={api} showMessage={showMessage} onAuthRequired={() => openAuth('login')} />
        )}
        {tab === 'my-shows' && user && (
          <MyShowsTab api={api} showMessage={showMessage} />
        )}
        {tab === 'analytics' && user && (
          <AnalyticsTab api={api} showMessage={showMessage} />
        )}
      </div>

      {showAuth && (
        <AuthModal
          mode={authMode}
          setMode={setAuthMode}
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuth(false)}
        />
      )}
    </div>
  );
}
