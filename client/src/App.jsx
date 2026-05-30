import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [currentTab, setCurrentTab] = useState('scorecard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ email: '', username: '', password: '', firstName: '', lastName: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentShow, setCurrentShow] = useState(null);
  const [setlist, setSetlist] = useState([]);
  const [ratings, setRatings] = useState({});
  const [messages, setMessages] = useState([]);
  const [userShows, setUserShows] = useState([]);
  const [analytics, setAnalytics] = useState({ songs: [], venues: [] });

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    }
  }, []);

  // API helper
  const api = axios.create({
    baseURL: '/api',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Show message
  const showMessage = (text, type = 'info') => {
    const id = Date.now();
    setMessages(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== id));
    }, 5000);
  };

  // Auth functions
  const verifyToken = async (token) => {
    try {
      const response = await axios.get('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/login', loginForm);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      setShowAuthModal(false);
      showMessage('Logged in successfully!', 'success');
    } catch (error) {
      showMessage(error.response?.data?.error || 'Login failed', 'error');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/register', signupForm);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      setShowAuthModal(false);
      showMessage('Account created successfully!', 'success');
    } catch (error) {
      showMessage(error.response?.data?.error || 'Signup failed', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    showMessage('Logged out', 'success');
  };

  // Show search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await axios.get(`/api/shows/search?q=${searchQuery}`);
      setSearchResults(response.data);
      showMessage(`Found ${response.data.length} shows`, 'success');
    } catch (error) {
      showMessage('Search failed', 'error');
    }
  };

  // Select show
  const selectShow = async (show) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      setCurrentShow(show);
      const response = await axios.get(`/api/shows/${show.showdate}`);
      const setlistData = response.data.setlist || [];
      setSetlist(setlistData);
      setRatings({});
      showMessage('Show loaded!', 'success');
    } catch (error) {
      showMessage('Failed to load setlist', 'error');
    }
  };

  // Submit ratings
  const submitRatings = async () => {
    if (!currentShow) return;

    try {
      const ratingsList = [];
      Object.entries(ratings).forEach(([key, value]) => {
        if (value) {
          const [idx, field] = key.split('-');
          ratingsList.push({ index: idx, [field]: value });
        }
      });

      await api.post(`/api/ratings/${currentShow.showdate}`, {
        ratings: ratingsList,
        showDetails: {
          venue: currentShow.venue,
          city: currentShow.city,
          state: currentShow.state,
          country: currentShow.country
        }
      });

      showMessage('Ratings submitted!', 'success');
      setRatings({});
    } catch (error) {
      showMessage('Failed to submit ratings', 'error');
    }
  };

  // Load user shows
  const loadUserShows = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await api.get('/api/user/shows');
      setUserShows(response.data);
    } catch (error) {
      showMessage('Failed to load shows', 'error');
    }
  };

  // Load analytics
  const loadAnalytics = async () => {
    try {
      const [songsRes, venuesRes] = await Promise.all([
        axios.get('/api/analytics/songs'),
        axios.get('/api/analytics/venues')
      ]);
      setAnalytics({ songs: songsRes.data, venues: venuesRes.data });
    } catch (error) {
      showMessage('Failed to load analytics', 'error');
    }
  };

  // Render auth modal
  const renderAuthModal = () => {
    if (!showAuthModal) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <button className="close-btn" onClick={() => setShowAuthModal(false)}>×</button>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin}>
              <h2>Login</h2>
              <input
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
              <button type="submit">Login</button>
              <p>
                Don't have an account?{' '}
                <button type="button" onClick={() => setAuthMode('signup')}>
                  Sign Up
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <h2>Sign Up</h2>
              <input
                type="text"
                placeholder="First Name"
                value={signupForm.firstName}
                onChange={e => setSignupForm({ ...signupForm, firstName: e.target.value })}
              />
              <input
                type="text"
                placeholder="Last Name"
                value={signupForm.lastName}
                onChange={e => setSignupForm({ ...signupForm, lastName: e.target.value })}
              />
              <input
                type="text"
                placeholder="Username"
                value={signupForm.username}
                onChange={e => setSignupForm({ ...signupForm, username: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={signupForm.email}
                onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={signupForm.password}
                onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                required
              />
              <button type="submit">Sign Up</button>
              <p>
                Already have an account?{' '}
                <button type="button" onClick={() => setAuthMode('login')}>
                  Login
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <header>
        <h1>Phishow Scorecard</h1>
        <span className="version">v2.0</span>
        <div className="header-right">
          {isAuthenticated ? (
            <div>
              <span>Welcome, {user?.username}!</span>
              <button onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <button onClick={() => { setShowAuthModal(true); setAuthMode('login'); }}>Login</button>
          )}
        </div>
      </header>

      <div className="container">
        {/* Messages */}
        <div className="messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.type}`}>
              {msg.text}
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <nav className="tab-navigation">
          <button
            className={`tab-btn ${currentTab === 'scorecard' ? 'active' : ''}`}
            onClick={() => setCurrentTab('scorecard')}
          >
            Scorecard
          </button>
          {isAuthenticated && (
            <>
              <button
                className={`tab-btn ${currentTab === 'my-shows' ? 'active' : ''}`}
                onClick={() => { setCurrentTab('my-shows'); loadUserShows(); }}
              >
                My Shows
              </button>
              <button
                className={`tab-btn ${currentTab === 'analytics' ? 'active' : ''}`}
                onClick={() => { setCurrentTab('analytics'); loadAnalytics(); }}
              >
                Analytics
              </button>
            </>
          )}
        </nav>

        {/* Scorecard Tab */}
        {currentTab === 'scorecard' && (
          <section className="section">
            <h2>🎵 Rate a Show</h2>
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search by date (YYYY-MM-DD) or venue..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button type="submit">Search</button>
            </form>

            {searchResults.length > 0 && (
              <div className="results">
                {searchResults.map(show => (
                  <div
                    key={show.showdate}
                    className="result-item"
                    onClick={() => selectShow(show)}
                  >
                    <strong>{show.showdate}</strong> - {show.venue}
                    <br />
                    <small>{show.city}, {show.state}</small>
                  </div>
                ))}
              </div>
            )}

            {currentShow && (
              <>
                <div className="show-details">
                  <h3>{currentShow.showdate}</h3>
                  <p><strong>Venue:</strong> {currentShow.venue}</p>
                  <p><strong>Location:</strong> {currentShow.city}, {currentShow.state}</p>
                </div>

                {setlist.length > 0 && (
                  <div className="setlist">
                    <h3>Setlist & Ratings</h3>
                    {setlist.map((song, idx) => (
                      <div key={idx} className="song">
                        <span className="song-name">{song.song}</span>
                        <select
                          className="rating-input"
                          onChange={e => setRatings({ ...ratings, [`${idx}-rating`]: e.target.value })}
                        >
                          <option value="">Rate</option>
                          <option value="5">5 ⭐</option>
                          <option value="4">4</option>
                          <option value="3">3</option>
                          <option value="2">2</option>
                          <option value="1">1</option>
                        </select>
                      </div>
                    ))}
                    <button onClick={submitRatings}>Submit Ratings</button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* My Shows Tab */}
        {currentTab === 'my-shows' && (
          <section className="section">
            <h2>📊 My Rated Shows</h2>
            {userShows.length > 0 ? (
              <div className="list">
                {userShows.map(show => (
                  <div key={show.show_date} className="list-item">
                    <strong>{show.show_date}</strong> - {show.venue}
                    <br />
                    <small>Rating: {show.overall_rating?.toFixed(2)} | Songs: {show.song_count}</small>
                  </div>
                ))}
              </div>
            ) : (
              <p>No rated shows yet</p>
            )}
          </section>
        )}

        {/* Analytics Tab */}
        {currentTab === 'analytics' && (
          <section className="section">
            <h2>📈 Analytics</h2>
            <div className="stats">
              <h3>Top Rated Songs</h3>
              {analytics.songs.slice(0, 10).map(song => (
                <div key={song.song_name} className="stat-row">
                  <span>{song.song_name}</span>
                  <strong>{song.average_rating?.toFixed(2)} ⭐</strong>
                </div>
              ))}
            </div>
            <div className="stats">
              <h3>Top Venues</h3>
              {analytics.venues.slice(0, 10).map(venue => (
                <div key={venue.venue} className="stat-row">
                  <span>{venue.venue}, {venue.city}</span>
                  <strong>{venue.average_rating?.toFixed(2)} ⭐</strong>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {renderAuthModal()}
    </div>
  );
}

export default App;
