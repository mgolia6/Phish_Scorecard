import React, { useState, useEffect, useRef } from 'react';
import { useApi } from '../useApi';
import { API, PNET, RELISTEN, TODAY, formatDate, formatDuration, filterByQuery } from '../utils';
import { SaveCelebration } from './Celebrations';
import { SongRating, SetScore } from './ScorecardHelpers';
import { InlineAudioPlayer } from './AudioPlayer';
import { ShowSlotMachine } from './ShowSlotMachine';

export function ScorecardTab({ api, showMessage, showError, onAuthRequired, initialShowDate, onShowLoaded, onFeedbackTrigger }) {
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
  const [attendancePrompt, setAttendancePrompt] = useState(false); // modal visible
  const [pendingRating, setPendingRating] = useState(null); // { key, field, value }
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedEra, setSelectedEra] = useState('');
  const [phriends, setPhriends] = useState({ tagged: [], also_attended: [] });
  const [phriendInput, setPhriendInput] = useState('');
  const [phriendLoading, setPhriendLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [vibeCheck, setVibeCheck] = useState(null);
  const [vibeExpanded, setVibeExpanded] = useState(false);
  const [loadingVibe, setLoadingVibe] = useState(false);
  const [vibeError, setVibeError] = useState(false);
  const [activeAudio, setActiveAudio] = useState(null); // posKey of currently open player
  const [slotTargetDate, setSlotTargetDate] = useState(null);
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

    if (!query.trim() && !selectedYear && !selectedMonth && !selectedDay && !selectedEra) {
      setResults(allShows.slice(0, 20));
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
    // Allow unauthenticated users to browse setlists — gate on rating actions only
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
        isAuthed ? api.get(`/ratings/${date}`).catch(() => ({ ratings: [], attendance_type: null })) : Promise.resolve({ ratings: [], attendance_type: null }),
        fetch(`${API}/audio/${date}`).then(r => r.json()).catch(() => ({ tracks: [] })),
        isAuthed ? api.get(`/shows/companions?date=${date}`).catch(() => ({ tagged: [], also_attended: [] })) : Promise.resolve({ tagged: [], also_attended: [] }),
      ]);
      // Annotate songs with globalIdx and posKey to handle sandwiched/reprised songs
      const annotated = (showData.songs || []).map((s, globalIdx) => ({
        ...s,
        globalIdx,
        posKey: `pos_${globalIdx}`,
      }));
      setSongs(annotated);
      setCurrentShow(showData);
      // Fetch vibe check (cached or generate)
      if (showData.reviews?.count > 0) {
        setLoadingVibe(true);
        setVibeError(false);
        fetch(`/api/ai/summarize?showDate=${date}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.structured) { setVibeCheck(data); setLoadingVibe(false); }
            else if (showData.reviews?.items?.length) {
              // Not cached — generate
              const reviewsWithText = showData.reviews.items.filter(r => r.review && r.review.trim().length > 20);
              if (reviewsWithText.length) {
                fetch('/api/ai/summarize', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ reviews: reviewsWithText, showDate: date, venue: showData.venue, city: showData.city }),
                }).then(r => r.json()).then(d => {
                  if (d?.structured) setVibeCheck(d);
                  else setVibeError(true);
                }).catch(() => setVibeError(true))
                  .finally(() => setLoadingVibe(false));
              } else {
                setVibeError(true);
                setLoadingVibe(false);
              }
            } else {
              setLoadingVibe(false);
            }
          })
          .catch(() => { setVibeError(true); setLoadingVibe(false); });
      }
      setPhriends(phriendData || { tagged: [], also_attended: [] });
      const savedRatings = Array.isArray(ratingsResp) ? ratingsResp : (ratingsResp.ratings || []);
      const savedAttendance = (!Array.isArray(ratingsResp) && ratingsResp.attendance_type) ? ratingsResp.attendance_type : null;
      setAttendanceType(savedAttendance);
      const rMap = {};
      for (const r of savedRatings) {
        // Key by position if available, fall back to song_name for legacy ratings
        const key = r.song_position != null ? `pos_${r.song_position}` : r.song_name;
        rMap[key] = { rating: r.rating, notes: r.notes || '', song_name: r.song_name, song_position: r.song_position };
      }
      setRatings(rMap);
      const aMap = {};
      for (const t of (audioData.tracks || [])) {
        const key = t.title?.toLowerCase().trim();
        if (key) aMap[key] = t;
      }
      setAudioTracks(aMap);
    } catch (err) {
      showError(err.message || 'Failed to load show');
      setCurrentShow(null);
      setSongs([]);
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
    setSlotTargetDate(null);
    setCurrentShow(null);
    setSongs([]);
    try {
      const res = await fetch(`${API}/random-show`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.showdate) {
        setSlotTargetDate(data.showdate);
        setQuery('');
        setResults([]);
        // Delay actual load until slot animation completes (~2.4s)
        setTimeout(async () => {
          await loadShow(data.showdate);
          setSlotTargetDate(null);
          setRandomizing(false);
        }, 2400);
      } else {
        showError(data.error || 'Random show returned no date.');
        setRandomizing(false);
      }
    } catch (err) {
      showError(`Random show: ${err.message}`);
      setRandomizing(false);
    }
  };

  const getAudioForSong = (songName) => audioTracks[songName?.toLowerCase().trim()] || null;

  const updateRating = (songName, field, value) => {
    // Gate behind auth — unauthenticated users get login prompt
    if (!isAuthed) {
      onAuthRequired();
      return;
    }
    // If user taps a star and hasn't declared attendance, intercept and prompt
    if (field === 'rating' && !attendanceType) {
      setPendingRating({ key: songName, field, value });
      setAttendancePrompt(true);
      return;
    }
    setRatings(prev => ({ ...prev, [songName]: { ...prev[songName], [field]: value } }));
  };

  const handleAttendancePick = (type) => {
    setAttendanceType(type);
    setAttendancePrompt(false);
    if (pendingRating) {
      setRatings(prev => ({ ...prev, [pendingRating.key]: { ...prev[pendingRating.key], [pendingRating.field]: pendingRating.value } }));
      setPendingRating(null);
    }
  };

  const submitRatings = async () => {
    setSubmitting(true);
    try {
      const ratingsList = songs.filter(s => ratings[s.posKey || s.song]?.rating).map(s => ({
        song: s.song, set: s.set,
        position: s.globalIdx,
        rating: parseInt(ratings[s.posKey || s.song].rating),
        notes: ratings[s.posKey || s.song]?.notes || '',
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
        setTimeout(() => onFeedbackTrigger && onFeedbackTrigger('post_rating'), 3000);
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

  const totalRated = songs.filter(s => ratings[s.posKey || s.song]?.rating);
  const overallAvg = totalRated.length
    ? (totalRated.reduce((sum, s) => sum + parseInt(ratings[s.posKey || s.song]?.rating || 0), 0) / totalRated.length).toFixed(2)
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
      {/* ── ATTENDANCE PROMPT MODAL ── */}
      {attendancePrompt && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 24px',
        }}>
          <div style={{
            background: '#0d0d0d',
            border: '1px solid rgba(255,140,0,0.4)',
            maxWidth: 360, width: '100%',
            padding: '28px 24px',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', letterSpacing: '3px', color: 'var(--orange)', marginBottom: 8 }}>
              BEFORE YOU RATE
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--white)', lineHeight: 1.7, marginBottom: 22 }}>
              How did you experience this show?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { value: 'attended', label: '🎸 I WAS THERE', sub: 'Attended in person' },
                { value: 'webcast', label: '📺 WATCHED WEBCAST', sub: 'Caught the live stream' },
                { value: 'listened', label: '🎧 HEARD THE RECORDING', sub: 'Listened after the fact' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleAttendancePick(opt.value)}
                  style={{
                    background: 'rgba(255,140,0,0.04)',
                    border: '1px solid rgba(255,140,0,0.3)',
                    color: 'var(--white)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,140,0,0.7)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,140,0,0.3)'}
                >
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', letterSpacing: '2px', color: 'var(--orange)' }}>{opt.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {celebrating && <SaveCelebration onDone={() => {
        setCelebrating(false);
        showMessage(`Saved ${songs.filter(s => ratings[s.posKey || s.song]?.rating).length} ratings`, 'success');
      }} />}

      {!initialShowDate && <div className="instructions-panel">
        <button className="instructions-toggle" onClick={() => setShowInstructions(!showInstructions)}>
          <span>HOW TO USE PHREEZER</span>
          <span className="toggle-arrow">{showInstructions ? '▲ COLLAPSE' : '▼ EXPAND'}</span>
        </button>
        {showInstructions && (
          <div className="instructions-body">
            <div className="instructions-grid">
              <div>
                <div className="instr-step"><span className="instr-num">01</span><span>Search for any Phish show by date, venue, city, or year. Or hit RANDOM SHOW and let fate decide.</span></div>
                <div className="instr-step"><span className="instr-num">02</span><span>Rate each song 1–5 stars. Your ratings roll up into a show score that lives in your Phreezer.</span></div>
                 <div className="instr-step"><span className="instr-num">03</span><span>▶ PLAY streams the show from Phish.in. Listen back and rate as you go, or rate from memory — your call.</span></div>
              </div>
              <div>
                <div className="instr-step"><span className="instr-num">04</span><span>Mark whether you attended, watched the webcast, or listened after. Tracked separately from your ratings.</span></div>
                <div className="instr-step"><span className="instr-num">05</span><span>VIBE CHECK pulls an AI read of what the Phish.net community said about the show.</span></div>
                <div className="instr-step"><span className="instr-num">06</span><span>Everything stacks in MY PHREEZER — shows, songs, venues, stats, and Deep Phreeze analytics update automatically.</span></div>
              </div>
            </div>
          </div>
        )}
      </div>}

      {!initialShowDate && <div className="panel">
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

        </div>
        {/* ── DATE FILTERS — stacked, all independent ── */}
        {(() => {
          // Compute filtered pool from all active filters (independent — any combo works)
          const eraYears = selectedEra ? {'1.0': ['1983', '1984', '1985', '1986', '1987', '1988', '1989', '1990', '1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000'], '2.0': ['2002', '2003', '2004'], '3.0': ['2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020'], '4.0': ['2021', '2022', '2023', '2024', '2025']}[selectedEra] || [] : null;
          const filteredPool = allShows.filter(s => {
            const yr = s.showdate?.slice(0,4);
            const mo = s.showdate?.slice(5,7);
            const dy = s.showdate?.slice(8,10);
            if (eraYears && !eraYears.includes(yr)) return false;
            if (selectedYear && yr !== selectedYear) return false;
            if (selectedMonth && mo !== selectedMonth) return false;
            if (selectedDay && dy !== selectedDay.padStart(2,'0')) return false;
            return true;
          });
          // Years available given era filter
          const availableYears = eraYears
            ? ['1983', '1984', '1985', '1986', '1987', '1988', '1989', '1990', '1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'].filter(y => eraYears.includes(y))
            : ['1983', '1984', '1985', '1986', '1987', '1988', '1989', '1990', '1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
          // Months available given year+era
          const yearPool = allShows.filter(s => {
            const yr = s.showdate?.slice(0,4);
            if (eraYears && !eraYears.includes(yr)) return false;
            if (selectedYear && yr !== selectedYear) return false;
            return true;
          });
          const availableMonths = new Set(yearPool.map(s => s.showdate?.slice(5,7)));
          // Days available given year+month+era
          const monthPool = yearPool.filter(s => !selectedMonth || s.showdate?.slice(5,7) === selectedMonth);
          const availableDays = new Set(monthPool.map(s => s.showdate?.slice(8,10)));

          const hasFilters = selectedEra || selectedYear || selectedMonth || selectedDay;

          const clearAll = () => {
            setSelectedEra(''); setSelectedYear(''); setSelectedMonth(''); setSelectedDay('');
            setQuery(''); setCurrentShow(null); setResults(allShows.slice(0,20));
          };

          // Apply filters to results whenever they change
          if (hasFilters && !currentShow) {
            const q = query.trim();
            if (!q || q === '__era__' || /^\d{4}/.test(q)) {
              // Sync results to filtered pool
              setTimeout(() => setResults(filteredPool.slice(0, 100)), 0);
            }
          }

          return (
            <div style={{ marginTop: 14, marginBottom: 4 }}>

              {/* Header row with CLEAR */}
              {hasFilters && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', color: 'var(--cyan)', letterSpacing: '2px' }}>
                    {filteredPool.length} SHOWS MATCH
                  </div>
                  <button onClick={clearAll} style={{
                    background: 'transparent', border: '1px solid rgba(255,51,51,0.4)',
                    color: 'rgba(255,51,51,0.7)', fontFamily: 'var(--font-display)',
                    fontSize: '0.5rem', letterSpacing: '2px', padding: '4px 10px', cursor: 'pointer',
                  }}>✕ CLEAR</button>
                </div>
              )}

              {/* ROW 1: ERAS */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '3px', marginBottom: 6 }}>ERA</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { label: '1.0', sub: '1983–2000', value: '1.0' },
                    { label: '2.0', sub: '2002–2004', value: '2.0' },
                    { label: '3.0', sub: '2009–2020', value: '3.0' },
                    { label: '4.0', sub: '2021–NOW',  value: '4.0' },
                  ].map(era => {
                    const active = selectedEra === era.value;
                    return (
                      <button key={era.value} onClick={() => {
                        setSelectedEra(active ? '' : era.value);
                        setSelectedYear(''); setSelectedMonth(''); setSelectedDay('');
                        setCurrentShow(null);
                      }} style={{
                        background: active ? 'rgba(255,102,0,0.12)' : 'transparent',
                        border: `1px solid ${active ? 'rgba(255,102,0,0.6)' : 'rgba(255,255,255,0.1)'}`,
                        color: active ? 'var(--orange)' : 'rgba(255,255,255,0.45)',
                        fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '2px',
                        padding: '8px 18px', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center',
                      }}>
                        <span>{era.label}</span>
                        <span style={{ fontSize: '0.48rem', opacity: 0.6 }}>{era.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ROW 2: YEARS — 8 cols, filtered by era */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '3px', marginBottom: 6 }}>YEAR</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, auto)', gap: 5, justifyContent: 'start' }}>
                  {availableYears.map(yr => {
                    const active = selectedYear === yr;
                    return (
                      <button key={yr} onClick={() => {
                        setSelectedYear(active ? '' : yr);
                        setSelectedMonth(''); setSelectedDay(''); setCurrentShow(null);
                        if (!active) setQuery(yr); else setQuery(selectedEra ? '__era__' : '');
                      }} style={{
                        background: active ? 'rgba(0,224,208,0.15)' : 'transparent',
                        border: `1px solid ${active ? 'rgba(0,224,208,0.6)' : 'rgba(255,255,255,0.1)'}`,
                        color: active ? 'var(--cyan)' : 'rgba(255,255,255,0.4)',
                        fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '1px',
                        padding: '8px 12px', cursor: 'pointer', minWidth: 52, textAlign: 'center',
                      }}>'{yr.slice(2)}</button>
                    );
                  })}
                </div>
              </div>

              {/* ROW 3: MONTH + DAY side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, alignItems: 'start' }}>

                {/* MONTH — 4x3 grid */}
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '3px', marginBottom: 6 }}>MONTH</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 5 }}>
                    {['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'].map((mn, i) => {
                      const padded = String(i+1).padStart(2,'0');
                      const available = availableMonths.has(padded);
                      const active = selectedMonth === padded;
                      return (
                        <button key={mn} onClick={() => {
                          if (!available) return;
                          setSelectedMonth(active ? '' : padded);
                          setSelectedDay(''); setCurrentShow(null);
                        }} style={{
                          background: active ? 'rgba(51,255,51,0.12)' : 'transparent',
                          border: `1px solid ${active ? 'rgba(51,255,51,0.6)' : available ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
                          color: active ? 'var(--green)' : available ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.12)',
                          fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '1.5px',
                          padding: '8px 10px', cursor: available ? 'pointer' : 'default', textAlign: 'center',
                        }}>{mn}</button>
                      );
                    })}
                  </div>
                </div>

                {/* DAY — 8x4 grid (1-31) */}
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '3px', marginBottom: 6 }}>DAY</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, auto)', gap: 5, justifyContent: 'start' }}>
                    {Array.from({length:31},(_,i)=>String(i+1)).map(d => {
                      const padded = d.padStart(2,'0');
                      const available = availableDays.has(padded);
                      const active = selectedDay === d;
                      return (
                        <button key={d} onClick={() => {
                          if (!available) return;
                          setSelectedDay(active ? '' : d);
                          setCurrentShow(null);
                        }} style={{
                          background: active ? 'rgba(255,102,0,0.12)' : 'transparent',
                          border: `1px solid ${active ? 'rgba(255,102,0,0.6)' : available ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
                          color: active ? 'var(--orange)' : available ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)',
                          fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '0.5px',
                          padding: '7px 8px', cursor: available ? 'pointer' : 'default',
                          minWidth: 36, textAlign: 'center',
                        }}>{d}</button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        <button className="btn-random" onClick={handleRandom} disabled={randomizing || loadingShow} style={{ marginTop: 14, marginBottom: 4 }}>
          {randomizing ? '◈ SUMMONING...' : '⚄ RANDOM SHOW'}
        </button>
                {!currentShow && !loadingShow && results.length > 0 && (
          <>
            <div className="results-header">
              {query === '__era__' ? `${results.length} shows in this era` : query.trim() ? `${results.length} result${results.length !== 1 ? 's' : ''}` : 'Recent shows — tap to load'}
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
      </div>}

      {loadingShow && <div className="loading">LOADING SETLIST FROM PHISH.NET...</div>}

      {!loadingShow && !currentShow && (
        <ShowSlotMachine
          onRandomClick={handleRandom}
          randomizing={randomizing}
          targetDate={slotTargetDate}
        />
      )}

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
                        <div key={idx} className={`song-row ${ratings[song.posKey || song.song]?.rating ? 'rated' : ''} ${song.isjam ? 'jam' : ''}`}>
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
                              <button
                                className={`song-play-inline${activeAudio === (song.posKey || song.song) ? ' active' : ''}`}
                                title="Play on Phish.in"
                                onClick={e => {
                                  e.stopPropagation();
                                  setActiveAudio(prev =>
                                    prev === (song.posKey || song.song) ? null : (song.posKey || song.song)
                                  );
                                }}
                              >▶</button>
                            ) : null}
                            {duration && <span className="song-duration-inline">{duration}</span>}
                            {song.isjam && <span className="badge jam-badge song-badges-inline">JAM</span>}
                            {song.isreprise && <span className="badge reprise-badge song-badges-inline">REPRISE</span>}
                            <span className="spacer" />
                            <SongRating value={parseInt(ratings[song.posKey || song.song]?.rating) || 0} onChange={val => updateRating(song.posKey || song.song, 'rating', val)} />
                          </div>
                          {ratings[song.posKey || song.song]?.notesOpen ? (
                            <div className="song-notes-expanded">
                              <textarea
                                className="notes-input"
                                placeholder="Add a note..."
                                value={ratings[song.posKey || song.song]?.notes || ''}
                                autoFocus
                                rows={3}
                                onChange={e => {
                                  updateRating(song.posKey || song.song, 'notes', e.target.value);
                                  e.target.style.height = 'auto';
                                  e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                onBlur={() => { if (!ratings[song.posKey || song.song]?.notes) updateRating(song.posKey || song.song, 'notesOpen', false); }}
                              />
                              <button
                                className="notes-collapse-btn"
                                onClick={() => updateRating(song.posKey || song.song, 'notesOpen', false)}
                              >▲ COLLAPSE</button>
                            </div>
                          ) : (
                            <button className="song-notes-toggle" onClick={() => updateRating(song.posKey || song.song, 'notesOpen', true)}>
                              {ratings[song.posKey || song.song]?.notes
                                ? <span className="song-notes-preview">✎ {ratings[song.posKey || song.song].notes}</span>
                                : <span className="song-notes-add">+ NOTE</span>}
                            </button>
                          )}
                          {activeAudio === (song.posKey || song.song) && audio?.mp3_url && (
                            <InlineAudioPlayer
                              track={audio}
                              onClose={() => setActiveAudio(null)}
                            />
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
                  onClick={() => { if (!isAuthed) { onAuthRequired(); return; } submitRatings(); }} disabled={submitting || saved}
                >
                  {submitting ? 'SAVING...' : saved ? '✓ RATINGS SAVED' : 'SAVE RATINGS'}
                </button>
              </div>

              {/* ── VIBE CHECK ── */}
              {(vibeCheck?.structured || loadingVibe || vibeError) && (
                <div style={{ marginBottom: 16, border: '1px solid rgba(255,140,0,0.25)', background: 'rgba(0,0,0,0.3)' }}>
                  <button onClick={() => setVibeExpanded(v => !v)} style={{
                    width: '100%', padding: '10px 14px', background: 'transparent', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.48rem', letterSpacing: '2px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>◈ VIBE CHECK</span>
                      {vibeCheck?.structured?.sentiment && (
                        <span style={{ fontSize: '0.4rem', padding: '2px 7px', border: `1px solid ${{ FIRE: 'var(--orange)', SOLID: 'var(--cyan)', MIXED: 'rgba(51,255,51,0.5)', SLEEPER: 'var(--text-muted)' }[vibeCheck.structured.sentiment] || 'var(--border)'}`, color: `${{ FIRE: 'var(--orange)', SOLID: 'var(--cyan)', MIXED: 'rgba(51,255,51,0.5)', SLEEPER: 'var(--text-muted)' }[vibeCheck.structured.sentiment] || 'var(--text-muted)'}` }}>
                          {vibeCheck.structured.sentiment}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.38rem', color: 'var(--text-muted)' }}>
                      {loadingVibe ? 'GENERATING...' : vibeError ? 'GENERATION FAILED' : `AI · ${vibeCheck?.reviewCount || vibeCheck?.structured?.reviewCount || ''} PHISH.NET REVIEWS`}
                      {vibeExpanded ? ' ▲' : ' ▼'}
                    </span>
                  </button>
                  {vibeExpanded && vibeError && (
                    <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,102,0,0.15)', fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'var(--text-muted)', letterSpacing: '1px', lineHeight: 1.8 }}>
                      Could not synthesize reviews for this show.<br/>
                      <span style={{ color: 'rgba(0,224,208,0.5)', fontSize: '0.48rem' }}>Reviews are still available below ↓</span>
                    </div>
                  )}
                  {vibeExpanded && !vibeError && vibeCheck?.structured && (
                    <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,140,0,0.15)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--white)', lineHeight: 1.7, marginBottom: 12, borderLeft: '2px solid rgba(255,140,0,0.4)', paddingLeft: 10 }}>
                        {vibeCheck.structured.overall}
                      </div>
                      {vibeCheck.structured.themes?.map((t, i) => (
                        <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < vibeCheck.structured.themes.length - 1 ? '1px solid rgba(51,255,51,0.07)' : 'none' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--cyan)', letterSpacing: '2.5px', marginBottom: 5 }}>{t.label}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-label)', lineHeight: 1.65 }}>{t.text}</div>
                        </div>
                      ))}
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.36rem', color: 'var(--text-muted)', letterSpacing: '1.5px', marginTop: 10, borderTop: '1px solid rgba(51,255,51,0.06)', paddingTop: 8 }}>
                        AI SYNTHESIS OF {vibeCheck.structured.reviewCount} PHISH.NET REVIEWS · {vibeCheck.cached ? 'CACHED' : 'JUST GENERATED'}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                      <div className="review-text" dangerouslySetInnerHTML={{ __html: rev.review }} />
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








