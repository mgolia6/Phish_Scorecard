import React, { useState, useEffect, useRef } from 'react';
import { useApi } from '../useApi';
import { API, PNET, RELISTEN, TODAY, formatDate, formatDuration, filterByQuery } from '../utils';
import { SaveCelebration } from './Celebrations';
import { SongRating, SetScore } from './ScorecardHelpers';
import { InlineAudioPlayer } from './AudioPlayer';
import { ShowSlotMachine } from './ShowSlotMachine';

export function ScorecardTab({ api, showMessage, showError, onAuthRequired, initialShowDate, onShowLoaded, onFeedbackTrigger, onBadgeEarned }) {
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
  const [selectedDow, setSelectedDow] = useState('');
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

  // Sync filtered results whenever filter state changes
  useEffect(() => {
    const hasFilters = selectedEra || selectedYear || selectedMonth || selectedDay || selectedDow !== '';
    if (!hasFilters) {
      if (allShows.length) setResults(allShows.slice(0, 20));
      return;
    }
    if (currentShow) return;
    if (!allShows.length) return; // wait for shows to load

    const ERAS_MAP = {'1.0': ['1983', '1984', '1985', '1986', '1987', '1988', '1989', '1990', '1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000'], '2.0': ['2002', '2003', '2004'], '3.0': ['2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020'], '4.0': ['2021', '2022', '2023', '2024', '2025']};
    const eraYrs = selectedEra ? ERAS_MAP[selectedEra] : null;
    const filtered = allShows.filter(s => {
      const yr = s.showdate?.slice(0,4);
      const mo = s.showdate?.slice(5,7);
      const dy = s.showdate?.slice(8,10);
      const dow = s.showdate ? new Date(s.showdate + 'T12:00:00').getDay() : -1;
      if (eraYrs && !eraYrs.includes(yr)) return false;
      if (selectedYear && yr !== selectedYear) return false;
      if (selectedMonth && mo !== selectedMonth) return false;
      if (selectedDay && dy !== selectedDay.padStart(2,'0')) return false;
      if (selectedDow !== '' && dow !== parseInt(selectedDow)) return false;
      return true;
    });
    setResults(filtered.slice(0, 100));
    // Don't pollute query — only set if no real text search active
    if (!query.trim() || query === '__filter__') setQuery('__filter__');
  }, [selectedEra, selectedYear, selectedMonth, selectedDay, selectedDow, allShows]);
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
        fetch(`${API}/shows/${date}`, { headers: { 'Content-Type': 'application/json', ...(isAuthed ? { Authorization: `Bearer ${localStorage.getItem('phish_token')}` } : {}) } }).then(r => r.json()).then(d => { if (d.error) throw new Error(d.error); return d; }),
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
      const saveRes = await api.post(`/ratings/${currentShow.showdate}`, {
        ratings: ratingsList,
        attendance_type: attendanceType,
        showDetails: { venue: currentShow.venue, city: currentShow.city, state: currentShow.state, country: currentShow.country },
      });
      setSaved(true);
      setCelebrating(true);
      // Fire badge celebrations for real-time earned badges
      if (saveRes?.new_badges?.length && onBadgeEarned) {
        setTimeout(() => onBadgeEarned(saveRes.new_badges), 2800); // after save celebration
      }
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
            border: '1px solid rgba(var(--orange-bright-rgb),0.4)',
            maxWidth: 360, width: '100%',
            padding: '28px 24px',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '3px', color: 'var(--orange)', marginBottom: 8 }}>
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
                    background: 'rgba(var(--orange-bright-rgb),0.04)',
                    border: '1px solid rgba(var(--orange-bright-rgb),0.3)',
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
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(var(--orange-bright-rgb),0.7)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(var(--orange-bright-rgb),0.3)'}
                >
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '2px', color: 'var(--orange)' }}>{opt.label}</span>
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
              value={query === '__filter__' ? '' : query}
              onChange={e => { setQuery(e.target.value); setSelectedEra(''); setSelectedYear(''); setSelectedMonth(''); setSelectedDay(''); setSelectedDow(''); }}
              autoComplete="off" autoCorrect="off" spellCheck="false"
            />
            {showSpinner && <span className="search-spinner">◈</span>}
          </div>

        </div>
        {/* ── DATE FILTERS — DESKTOP ONLY ── */}
        {!currentShow && <div className="desktop-filter-block">
        {(() => {
          const ERAS_MAP = {'1.0': ['1983', '1984', '1985', '1986', '1987', '1988', '1989', '1990', '1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000'], '2.0': ['2002', '2003', '2004'], '3.0': ['2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020'], '4.0': ['2021', '2022', '2023', '2024', '2025']};
          const ALL_YEARS = ['1983', '1984', '1985', '1986', '1987', '1988', '1989', '1990', '1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
          const eraYrs = selectedEra ? ERAS_MAP[selectedEra] : null;
          const loaded = allShows.length > 0;

          const pass = (s, skipEra, skipYr, skipMo, skipDy, skipDow) => {
            const yr=s.showdate?.slice(0,4), mo=s.showdate?.slice(5,7),
                  dy=s.showdate?.slice(8,10),
                  dow=s.showdate ? new Date(s.showdate+'T12:00:00').getDay() : -1;
            if(!skipEra && eraYrs && !eraYrs.includes(yr)) return false;
            if(!skipYr  && selectedYear  && yr!==selectedYear)  return false;
            if(!skipMo  && selectedMonth && mo!==selectedMonth) return false;
            if(!skipDy  && selectedDay   && dy!==selectedDay.padStart(2,'0')) return false;
            if(!skipDow && selectedDow!=='' && dow!==parseInt(selectedDow)) return false;
            return true;
          };

          const pool      = allShows.filter(s=>pass(s));
          const availYrs  = new Set(allShows.filter(s=>pass(s,false,true)).map(s=>s.showdate?.slice(0,4)));
          const availMos  = new Set(allShows.filter(s=>pass(s,false,false,true)).map(s=>s.showdate?.slice(5,7)));
          const availDays = new Set(allShows.filter(s=>pass(s,false,false,false,true)).map(s=>s.showdate?.slice(8,10)));
          const availDows = new Set(allShows.filter(s=>pass(s,false,false,false,false,true)).map(s=>String(new Date((s.showdate||'')+'T12:00:00').getDay())));
          const eraYearsFiltered = eraYrs ? ALL_YEARS.filter(y=>eraYrs.includes(y)) : ALL_YEARS;
          const hasFilters = selectedEra||selectedYear||selectedMonth||selectedDay||selectedDow!=='';

          const clearAll = () => {
            setSelectedEra('');setSelectedYear('');setSelectedMonth('');
            setSelectedDay('');setSelectedDow('');setQuery('');
            setCurrentShow(null);setSongs([]);setResults(allShows.slice(0,20));
          };

          const C = { era:'#ff6600', yr:'#00e0d0', mo:'#33ff33', dy:'#ff6600', dow:'#00e0d0' };
          const btn = (type, active, avail) => ({
            background: active ? `rgba(${type==='yr'||type==='dow'?'0,224,208':type==='mo'?'51,255,51':'255,102,0'},0.14)` : 'rgba(var(--ink-rgb),0.03)',
            border: `1px solid ${active ? C[type] : avail||!loaded ? `rgba(${type==='yr'||type==='dow'?'0,224,208':type==='mo'?'51,255,51':'255,102,0'},0.25)` : 'rgba(var(--ink-rgb),0.08)'}`,
            color: active ? C[type] : avail||!loaded ? 'rgba(var(--ink-rgb),0.7)' : 'rgba(var(--ink-rgb),0.18)',
            fontFamily: 'var(--font-display)', cursor: 'pointer', textAlign: 'center',
            fontSize: '0.66rem', letterSpacing: '0.5px', padding: '5px 2px',
            boxShadow: active ? `0 0 5px ${C[type]}44` : 'none', transition: 'all 0.1s',
          });

          const colLabel = (color, text) => (
            <div style={{ fontFamily:'var(--font-display)', fontSize:'0.56rem', color, letterSpacing:'3px', marginBottom:3 }}>{text}</div>
          );

          const sep = <div style={{ width:1, background:'var(--hairline)', alignSelf:'stretch', flexShrink:0, margin:'0 4px' }} />;

          return (
            <div style={{ marginTop: 8 }}>
              <div style={{ display:'flex', gap:8, alignItems:'start' }}>

                {/* ERA — 2×2 grid */}
                <div style={{ flexShrink:0 }}>
                  {colLabel('rgba(var(--orange-rgb),0.55)','ERA')}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:3 }}>
                    {[{l:'1.0',s:'1983–2000',v:'1.0'},{l:'2.0',s:'2002–2004',v:'2.0'},{l:'3.0',s:'2009–2020',v:'3.0'},{l:'4.0',s:'2021–NOW',v:'4.0'}].map(era => {
                      const active = selectedEra===era.v;
                      return (
                        <button key={era.v} onClick={() => { setSelectedEra(active?'':era.v);setSelectedYear('');setSelectedMonth('');setSelectedDay('');setSelectedDow('');setCurrentShow(null);setSongs([]); }} style={{
                          background: active?'rgba(var(--orange-rgb),0.14)':'rgba(var(--ink-rgb),0.03)',
                          border:`2px solid ${active?'#ff6600':'rgba(var(--ink-rgb),0.1)'}`,
                          color: active?'#ff6600':'rgba(var(--ink-rgb),0.65)',
                          fontFamily:'var(--font-display)', cursor:'pointer',
                          padding:'12px 14px', textAlign:'center',
                          boxShadow:active?'0 0 16px rgba(var(--orange-rgb),0.3)':'none',
                          display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                          transition:'all 0.15s',
                        }}>
                          <span style={{ fontSize:'1.6rem', fontWeight:900, letterSpacing:'2px', lineHeight:1 }}>{era.l}</span>
                          <span style={{ fontSize:'0.56rem', opacity:0.6, letterSpacing:'1px', whiteSpace:'nowrap' }}>{era.s}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {sep}

                {/* YEAR — 10×4 */}
                <div style={{ flexShrink:0 }}>
                  {colLabel('rgba(var(--cyan-rgb),0.55)','YEAR')}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(10,38px)', gap:3 }}>
                    {eraYearsFiltered.map(yr => {
                      const active=selectedYear===yr, avail=availYrs.has(yr);
                      return <button key={yr} onClick={() => { const n=active?'':yr; setSelectedYear(n);setSelectedMonth('');setSelectedDay('');setCurrentShow(null);setSongs([]);setQuery(n||(selectedEra?'__filter__':'')); }} style={{...btn('yr',active,avail)}}>'{yr.slice(2)}</button>;
                    })}
                  </div>
                </div>

                {sep}

                {/* MONTH — 6×2 */}
                <div style={{ flexShrink:0 }}>
                  {colLabel('rgba(var(--green-rgb),0.55)','MONTH')}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(6,38px)', gap:3 }}>
                    {['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'].map((mn,i) => {
                      const p=String(i+1).padStart(2,'0'), active=selectedMonth===p, avail=availMos.has(p);
                      return <button key={mn} onClick={() => { setSelectedMonth(active?'':p);setSelectedDay('');setCurrentShow(null);setSongs([]); }} style={{...btn('mo',active,avail)}}>{mn}</button>;
                    })}
                  </div>
                </div>

                {sep}

                {/* DAY — 8×4 */}
                <div style={{ flexShrink:0 }}>
                  {colLabel('rgba(var(--orange-rgb),0.55)','DAY')}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(8,28px)', gap:3 }}>
                    {Array.from({length:31},(_,i)=>String(i+1)).map(d => {
                      const p=d.padStart(2,'0'), active=selectedDay===d, avail=availDays.has(p);
                      return <button key={d} onClick={() => { setSelectedDay(active?'':d);setCurrentShow(null);setSongs([]); }} style={{...btn('dy',active,avail)}}>{d}</button>;
                    })}
                    <div />
                  </div>
                </div>

                {sep}

                {/* DOW — 4×2 */}
                <div style={{ flexShrink:0 }}>
                  {colLabel('rgba(var(--cyan-rgb),0.55)','DAY OF WEEK')}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,38px)', gap:3 }}>
                    {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((dow,i) => {
                      const active=selectedDow===String(i), avail=availDows.has(String(i));
                      return <button key={dow} onClick={() => { setSelectedDow(active?'':String(i));setCurrentShow(null);setSongs([]); }} style={{...btn('dow',active,avail)}}>{dow}</button>;
                    })}
                    <div />
                  </div>
                </div>

                {/* MATCH COUNT + CLEAR — far right, stacked vertically, readable */}
                {hasFilters && (
                  <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, alignSelf:'stretch', paddingTop:18 }}>
                    <div style={{
                      background:'rgba(var(--orange-rgb),0.08)', border:'1px solid rgba(var(--orange-rgb),0.4)',
                      padding:'14px 10px', textAlign:'center', minWidth:68,
                      boxShadow:'0 0 16px rgba(var(--orange-rgb),0.15)',
                    }}>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', color:'var(--orange)', lineHeight:1, textShadow:'0 0 16px rgba(var(--orange-rgb),0.6)', fontWeight:900 }}>{pool.length}</div>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:'0.56rem', color:'rgba(var(--orange-rgb),0.7)', letterSpacing:'2px', marginTop:5 }}>SHOWS</div>
                    </div>
                    <button onClick={clearAll} style={{
                      background:'transparent', border:'1px solid rgba(255,80,80,0.45)',
                      color:'rgba(255,100,100,0.85)', fontFamily:'var(--font-display)',
                      fontSize:'0.6rem', letterSpacing:'1.5px', padding:'6px 8px',
                      cursor:'pointer', whiteSpace:'nowrap', width:'100%',
                    }}>✕ CLEAR</button>
                  </div>
                )}

              </div>
            </div>
          );
        })()}
        </div>}

        {/* ── DATE FILTERS — MOBILE ONLY ── */}
        {!currentShow && <div className="mobile-filter-block" style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {/* YEAR */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'rgba(var(--cyan-rgb),0.7)', letterSpacing: '2px', marginBottom: 3 }}>YEAR</div>
              <div style={{ position: 'relative' }}>
                <select value={selectedYear} onChange={e => { setSelectedYear(e.target.value); setCurrentShow(null); setSongs([]); }}
                  style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', background: selectedYear ? 'rgba(var(--cyan-rgb),0.1)' : 'rgba(0,0,0,0.4)', border: `1px solid ${selectedYear ? 'rgba(var(--cyan-rgb),0.6)' : 'rgba(var(--cyan-rgb),0.25)'}`, color: selectedYear ? 'var(--cyan)' : 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '1px', padding: '8px 28px 8px 10px', outline: 'none', cursor: 'pointer' }}>
                  <option value="">YEAR</option>
                  {['1983','1984','1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003','2004','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025'].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--cyan)', fontSize: '0.62rem', pointerEvents: 'none' }}>▼</span>
              </div>
            </div>
            {/* MONTH */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'rgba(var(--green-rgb),0.7)', letterSpacing: '2px', marginBottom: 3 }}>MONTH</div>
              <div style={{ position: 'relative' }}>
                <select value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); setCurrentShow(null); setSongs([]); }}
                  style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', background: selectedMonth ? 'rgba(var(--green-rgb),0.1)' : 'rgba(0,0,0,0.4)', border: `1px solid ${selectedMonth ? 'rgba(var(--green-rgb),0.6)' : 'rgba(var(--green-rgb),0.25)'}`, color: selectedMonth ? 'var(--green)' : 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '1px', padding: '8px 28px 8px 10px', outline: 'none', cursor: 'pointer' }}>
                  <option value="">MONTH</option>
                  {[['01','JAN'],['02','FEB'],['03','MAR'],['04','APR'],['05','MAY'],['06','JUN'],['07','JUL'],['08','AUG'],['09','SEP'],['10','OCT'],['11','NOV'],['12','DEC']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--green)', fontSize: '0.62rem', pointerEvents: 'none' }}>▼</span>
              </div>
            </div>
            {/* DAY */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'rgba(var(--orange-rgb),0.7)', letterSpacing: '2px', marginBottom: 3 }}>DAY</div>
              <div style={{ position: 'relative' }}>
                <select value={selectedDay} onChange={e => { setSelectedDay(e.target.value); setCurrentShow(null); setSongs([]); }}
                  style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', background: selectedDay ? 'rgba(var(--orange-rgb),0.1)' : 'rgba(0,0,0,0.4)', border: `1px solid ${selectedDay ? 'rgba(var(--orange-rgb),0.6)' : 'rgba(var(--orange-rgb),0.25)'}`, color: selectedDay ? 'var(--orange)' : 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '1px', padding: '8px 28px 8px 10px', outline: 'none', cursor: 'pointer' }}>
                  <option value="">DAY</option>
                  {Array.from({length:31},(_,i)=>String(i+1).padStart(2,'0')).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--orange)', fontSize: '0.62rem', pointerEvents: 'none' }}>▼</span>
              </div>
            </div>
            {/* DAY OF WEEK */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'rgba(var(--cyan-rgb),0.7)', letterSpacing: '2px', marginBottom: 3 }}>DOW</div>
              <div style={{ position: 'relative' }}>
                <select value={selectedDow} onChange={e => { setSelectedDow(e.target.value); setCurrentShow(null); setSongs([]); }}
                  style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', background: selectedDow !== '' ? 'rgba(var(--cyan-rgb),0.1)' : 'rgba(0,0,0,0.4)', border: `1px solid ${selectedDow !== '' ? 'rgba(var(--cyan-rgb),0.6)' : 'rgba(var(--cyan-rgb),0.25)'}`, color: selectedDow !== '' ? 'var(--cyan)' : 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '1px', padding: '8px 28px 8px 10px', outline: 'none', cursor: 'pointer' }}>
                  <option value="">DOW</option>
                  {[['0','SUN'],['1','MON'],['2','TUE'],['3','WED'],['4','THU'],['5','FRI'],['6','SAT']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--cyan)', fontSize: '0.62rem', pointerEvents: 'none' }}>▼</span>
              </div>
            </div>
          </div>
          {/* Mobile match count + clear */}
          {(selectedYear || selectedMonth || selectedDay || selectedDow !== '') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <div style={{ background: 'rgba(var(--orange-rgb),0.08)', border: '1px solid rgba(var(--orange-rgb),0.4)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--orange)', fontWeight: 900, lineHeight: 1 }}>
                  {(() => {
                    const ERAS_MAP = {'1.0':['1983','1984','1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000'],'2.0':['2002','2003','2004'],'3.0':['2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019','2020'],'4.0':['2021','2022','2023','2024','2025']};
                    const eraYrs = selectedEra ? ERAS_MAP[selectedEra] : null;
                    return allShows.filter(s => {
                      const yr=s.showdate?.slice(0,4), mo=s.showdate?.slice(5,7), dy=s.showdate?.slice(8,10);
                      const dow=s.showdate ? new Date(s.showdate+'T12:00:00').getDay() : -1;
                      if(eraYrs && !eraYrs.includes(yr)) return false;
                      if(selectedYear && yr!==selectedYear) return false;
                      if(selectedMonth && mo!==selectedMonth) return false;
                      if(selectedDay && dy!==selectedDay) return false;
                      if(selectedDow!=='' && dow!==parseInt(selectedDow)) return false;
                      return true;
                    }).length;
                  })()}
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'rgba(var(--orange-rgb),0.7)', letterSpacing: '2px' }}>SHOWS</span>
              </div>
              <button onClick={() => { setSelectedEra(''); setSelectedYear(''); setSelectedMonth(''); setSelectedDay(''); setSelectedDow(''); setQuery(''); setCurrentShow(null); setSongs([]); setResults(allShows.slice(0, 20)); }}
                style={{ background: 'transparent', border: '1px solid rgba(255,80,80,0.45)', color: 'rgba(255,100,100,0.85)', fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '1.5px', padding: '6px 10px', cursor: 'pointer' }}>
                ✕ CLEAR
              </button>
            </div>
          )}
        </div>}

        {!currentShow && (
          <button className="btn-random" onClick={handleRandom} disabled={randomizing || loadingShow} style={{ marginTop: 10, marginBottom: 4 }}>
            {randomizing ? '◈ SUMMONING...' : '⚄ RANDOM SHOW'}
          </button>
        )}
                {!currentShow && !loadingShow && results.length > 0 && (query.trim() || query === '__filter__' || query === '__era__') && (
          <>
            <div className="results-header">
              {(query === '__era__' || query === '__filter__') ? `${results.length} shows match` : `${results.length} result${results.length !== 1 ? 's' : ''}`}
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
            {/* Left: date + venue + meta */}
            <div className="show-masthead-main">
              <div className="show-date-display">{formatDate(currentShow.showdate)}</div>
              <div className="show-venue-display">{currentShow.venue}</div>
              <div className="show-location-display">
                {currentShow.city}{currentShow.state ? `, ${currentShow.state}` : ''}{currentShow.country && currentShow.country !== 'USA' ? `, ${currentShow.country}` : ''}
              </div>
              {currentShow.tour_name && <div className="show-tour">◈ {currentShow.tour_name}</div>}
              {hasAudio && <div className="audio-badge">◉ AUDIO AVAILABLE VIA PHISH.IN</div>}
              <button onClick={handleRandom} disabled={randomizing || loadingShow}
                style={{ marginTop: 12, padding: '8px 14px', border: '1px dashed rgba(var(--cyan-bright-rgb),0.45)', background: 'rgba(var(--cyan-bright-rgb),0.05)', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '2px', textTransform: 'uppercase', cursor: (randomizing || loadingShow) ? 'default' : 'pointer', opacity: (randomizing || loadingShow) ? 0.5 : 1 }}>
                {randomizing ? '◈ SUMMONING...' : '⚄ ANOTHER RANDOM SHOW'}
              </button>
            </div>

            {/* Right: data panel — fills dead space on desktop */}
            <div className="show-masthead-right" style={{ flexDirection: 'column', gap: 10, minWidth: 240 }}>
              {/* Quick stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {[
                  {
                    label: 'PHAN REVIEWS',
                    value: reviewCount > 0 ? reviewCount : '—',
                    color: 'var(--cyan)',
                  },
                  {
                    label: 'PHREEZERS RATED',
                    value: currentShow.rater_count || (overallAvg ? '1+' : '—'),
                    color: 'var(--orange)',
                  },
                  {
                    label: 'PHRIENDS HERE',
                    value: (phriends.tagged?.length || 0) + (phriends.also_attended?.length || 0) || '—',
                    color: 'var(--green)',
                  },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: 'var(--inset)', border: '1px solid var(--hairline)',
                    padding: '10px 8px', textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: stat.color, lineHeight: 1, marginBottom: 4, textShadow: `0 0 12px ${stat.color}` }}>{stat.value}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'rgba(var(--ink-rgb),0.55)', letterSpacing: '1.5px' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Phish.net community rating — hidden pending API access
                   pn_rating not available via Phish.net v5 API; pending inquiry with phish.net */}

              {/* Your score if rated */}
              {overallAvg && (
                <div style={{
                  background: 'rgba(var(--cyan-rgb),0.05)', border: '1px solid rgba(var(--cyan-rgb),0.2)',
                  padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'rgba(var(--cyan-rgb),0.6)', letterSpacing: '2px' }}>YOUR SCORE</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--cyan)', textShadow: '0 0 16px rgba(var(--cyan-rgb),0.5)' }}>{overallAvg}</span>
                </div>
              )}

              {/* Links */}
              <div className="show-masthead-links" style={{ gap: 6 }}>
                <a href={pnetUrl} target="_blank" rel="noopener noreferrer" className="show-link pnet-link" style={{ fontSize: '0.66rem', padding: '7px 10px' }}>{pnetLabel}</a>
                {relistenUrl && (
                  <a href={relistenUrl} target="_blank" rel="noopener noreferrer" className="show-link audio-link" style={{ fontSize: '0.66rem', padding: '7px 10px' }}>STREAM ON RELISTEN</a>
                )}
              </div>
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
              border: '1px solid rgba(var(--cyan-rgb),0.28)',
              background: 'linear-gradient(135deg, rgba(var(--cyan-rgb),0.04), var(--card-deep))',
              marginBottom: 12, padding: 14,
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--cyan)', letterSpacing: '2.5px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                ◈ PHRIENDS AT THIS SHOW
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(var(--cyan-rgb),0.25), transparent)' }} />
              </div>

              {/* Tag input */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  value={phriendInput}
                  onChange={e => setPhriendInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTagPhriend()}
                  placeholder="search phreezer username..."
                  type="text" name="phriend-tag-search" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} inputMode="text" enterKeyHint="search" data-1p-ignore data-lpignore="true" data-form-type="other"
                  style={{ flex: 1, background: 'var(--inset-strong)', border: '1px solid rgba(var(--cyan-rgb),0.35)', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: '7px 10px', outline: 'none' }}
                />
                <button onClick={handleTagPhriend} disabled={phriendLoading || !phriendInput.trim()}
                  style={{ background: 'rgba(var(--cyan-rgb),0.07)', border: '1px solid rgba(var(--cyan-rgb),0.35)', color: 'var(--cyan)', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2px', padding: '7px 12px', cursor: 'pointer', whiteSpace: 'nowrap', opacity: phriendLoading ? 0.5 : 1 }}>
                  {phriendLoading ? '...' : '+ TAG'}
                </button>
              </div>

              {/* Tagged phriends */}
              {phriends.tagged.length > 0 && (
                <div style={{ marginBottom: phriends.also_attended.length ? 10 : 0 }}>
                  {phriends.tagged.map(c => (
                    <div key={c.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', border: '1px solid rgba(var(--cyan-rgb),0.28)', background: 'rgba(var(--cyan-rgb),0.04)', marginBottom: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(var(--cyan-rgb),0.4)', background: 'rgba(var(--cyan-rgb),0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--cyan)', flexShrink: 0 }}>
                        {c.username.slice(0,2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--cyan)' }}>{c.username}</div>
                        {c.their_score != null && (
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--orange)', letterSpacing: '1px', marginTop: 2 }}>★ {c.their_score}</div>
                        )}
                      </div>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '1.5px', padding: '2px 5px', border: '1px solid rgba(var(--cyan-rgb),0.4)', color: 'var(--cyan)', flexShrink: 0 }}>TAGGED</span>
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
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>ALSO ON PHREEZER</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>
                  {phriends.also_attended.map(c => (
                    <div key={c.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', border: '1px solid rgba(var(--green-rgb),0.15)', background: 'rgba(var(--green-rgb),0.02)', marginBottom: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(var(--green-rgb),0.2)', background: 'rgba(var(--green-rgb),0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {c.username.slice(0,2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-label)' }}>{c.username}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 2 }}>attended · not yet tagged</div>
                      </div>
                      <button onClick={() => handleTagPhriendById(c)}
                        style={{ background: 'rgba(var(--green-rgb),0.04)', border: '1px solid rgba(var(--green-rgb),0.2)', color: 'var(--text-label)', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '1.5px', padding: '5px 8px', cursor: 'pointer', flexShrink: 0 }}>
                        + TAG
                      </button>
                    </div>
                  ))}
                </>
              )}

              {phriends.tagged.length === 0 && phriends.also_attended.length === 0 && (
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '10px 0' }}>NO OTHER PHREEZERS AT THIS ONE</div>
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
                              {(() => {
                                const t = (song.transition || '').trim();
                                if (!t || t === ',') return null;
                                return t.includes('->')
                                  ? <span className="song-transition segue-hard">--&gt;</span>
                                  : t.includes('>')
                                  ? <span className="song-transition segue-soft">&gt;</span>
                                  : null;
                              })()}
                            </div>
                            <div className="song-meta">
                              {duration && <span className="song-duration">{duration}</span>}
                              {song.isjam && <span className="badge jam-badge">JAM</span>}
                              {song.isreprise && <span className="badge reprise-badge">REPRISE</span>}
                              {song.footnote && <span className="badge footnote-badge" title={song.footnote}>*</span>}
                            </div>
                          </div>
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
                <div style={{ marginBottom: 16, border: '1px solid rgba(var(--orange-bright-rgb),0.25)', background: 'var(--inset)' }}>
                  <button onClick={() => setVibeExpanded(v => !v)} style={{
                    width: '100%', padding: '10px 14px', background: 'transparent', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '2px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>◈ VIBE CHECK</span>
                      {vibeCheck?.structured?.sentiment && (
                        <span style={{ fontSize: '0.56rem', padding: '2px 7px', border: `1px solid ${{ FIRE: 'var(--orange)', SOLID: 'var(--cyan)', MIXED: 'rgba(var(--green-rgb),0.5)', SLEEPER: 'var(--text-muted)' }[vibeCheck.structured.sentiment] || 'var(--border)'}`, color: `${{ FIRE: 'var(--orange)', SOLID: 'var(--cyan)', MIXED: 'rgba(var(--green-rgb),0.5)', SLEEPER: 'var(--text-muted)' }[vibeCheck.structured.sentiment] || 'var(--text-muted)'}` }}>
                          {vibeCheck.structured.sentiment}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.56rem', color: 'var(--text-muted)' }}>
                      {loadingVibe ? 'GENERATING...' : vibeError ? 'GENERATION FAILED' : `AI · ${vibeCheck?.reviewCount || vibeCheck?.structured?.reviewCount || ''} PHISH.NET REVIEWS`}
                      {vibeExpanded ? ' ▲' : ' ▼'}
                    </span>
                  </button>
                  {vibeExpanded && vibeError && (
                    <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(var(--orange-rgb),0.15)', fontFamily: 'var(--font-display)', fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '1px', lineHeight: 1.8 }}>
                      Could not synthesize reviews for this show.<br/>
                      <span style={{ color: 'rgba(var(--cyan-rgb),0.7)', fontSize: '0.6rem' }}>Reviews are still available below ↓</span>
                    </div>
                  )}
                  {vibeExpanded && !vibeError && vibeCheck?.structured && (
                    <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(var(--orange-bright-rgb),0.15)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--white)', lineHeight: 1.7, marginBottom: 12, borderLeft: '2px solid rgba(var(--orange-bright-rgb),0.4)', paddingLeft: 10 }}>
                        {vibeCheck.structured.overall}
                      </div>
                      {vibeCheck.structured.themes?.map((t, i) => (
                        <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < vibeCheck.structured.themes.length - 1 ? '1px solid rgba(var(--green-rgb),0.07)' : 'none' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--cyan)', letterSpacing: '2.5px', marginBottom: 5 }}>{t.label}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-label)', lineHeight: 1.65 }}>{t.text}</div>
                        </div>
                      ))}
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--text-muted)', letterSpacing: '1.5px', marginTop: 10, borderTop: '1px solid rgba(var(--green-rgb),0.06)', paddingTop: 8 }}>
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








