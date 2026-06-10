import React, { useState, useEffect } from 'react';
import { FullPageLoader } from './FullPageLoader';
import { KPICards } from './KPICards';
import { OTDCard } from './OTDCard';
import { ShowCard } from './ShowCard';
import { formatDate } from '../utils';

function OTDCarousel({ attended, ratedShows, onRateShow, api }) {
  const [idx, setIdx] = React.useState(0);
  const [otdShows, setOtdShows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [dragX, setDragX] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const touchStartX = React.useRef(null);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  React.useEffect(() => {
    fetch('/api/shows/on-this-day')
      .then(r => r.json())
      .then(data => {
        const attendedDates = new Set((attended || []).map(s => s.show_date));
        const ratedMap = {};
        (ratedShows || []).forEach(s => { ratedMap[s.show_date] = s; });
        const merged = (data.shows || []).map(s => ({
          ...s,
          attended: attendedDates.has(s.show_date),
          phreezer_avg: ratedMap[s.show_date]?.phreezer_avg || null,
        }));
        merged.sort((a, b) => {
          const aVal = (a.attended || a.phreezer_avg) ? 1 : 0;
          const bVal = (b.attended || b.phreezer_avg) ? 1 : 0;
          if (bVal !== aVal) return bVal - aVal;
          return a.show_date.localeCompare(b.show_date);
        });
        setOtdShows(merged);
      })
      .catch(() => setOtdShows([]))
      .finally(() => setLoading(false));
  }, []);

  const getCardStyle = (show) => {
    const isRated = !!show.phreezer_avg;
    const isAttended = show.attended;
    return {
      border: isRated ? '1px solid rgba(255,140,0,0.5)' : isAttended ? '1px solid rgba(51,255,51,0.5)' : '1px solid rgba(0,224,208,0.3)',
      borderLeft: isRated ? '3px solid var(--orange)' : isAttended ? '3px solid var(--green)' : '3px solid var(--cyan)',
      boxShadow: isRated ? '0 0 18px rgba(255,140,0,0.12)' : isAttended ? '0 0 18px rgba(51,255,51,0.12)' : 'none',
      // Alternating tint so adjacent cards feel distinct
      background: isRated
        ? 'linear-gradient(135deg, rgba(255,140,0,0.06) 0%, rgba(5,18,5,0.98) 100%)'
        : isAttended
          ? 'linear-gradient(135deg, rgba(51,255,51,0.06) 0%, rgba(5,18,5,0.98) 100%)'
          : undefined, // OTDCard will apply its own based on cardTint
    };
  };

  const getCardTint = (i) =>
    i % 2 === 0
      ? 'linear-gradient(135deg, rgba(0,224,208,0.07) 0%, rgba(5,18,5,0.98) 100%)'
      : 'linear-gradient(135deg, rgba(255,140,0,0.04) 0%, rgba(5,18,5,0.98) 100%)';

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setDragging(true);
    setDragX(0);
  };
  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if ((idx === 0 && dx > 0) || (idx === otdShows.length - 1 && dx < 0)) {
      setDragX(dx * 0.15); // rubber-band at edges
    } else {
      setDragX(dx);
    }
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    setDragging(false);
    setDragX(0);
    if (Math.abs(dx) < 35) return;
    if (dx < 0) setIdx(i => Math.min(otdShows.length - 1, i + 1));
    else setIdx(i => Math.max(0, i - 1));
  };

  if (loading) return (
    <div style={{ margin: '10px', padding: '20px 16px', border: '1px solid rgba(0,224,208,0.2)', borderLeft: '3px solid var(--cyan)', background: 'rgba(0,224,208,0.03)' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', color: 'rgba(0,224,208,0.4)', letterSpacing: '2px', textAlign: 'center' }}>LOADING ON THIS DAY...</div>
    </div>
  );

  if (!otdShows.length) return (
    <div style={{ margin: '10px', padding: '20px 16px', border: '1px solid rgba(0,224,208,0.2)', borderLeft: '3px solid var(--cyan)', background: 'rgba(0,224,208,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cyan)', opacity: 0.4 }} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'rgba(0,224,208,0.4)', letterSpacing: '3px' }}>ON THIS DAY</span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Phish didn't play today's date in any year.</div>
    </div>
  );

  const show = otdShows[idx];
  const isAttended = show.attended;
  const isRated = !!show.phreezer_avg;

  return (
    <div style={{ margin: '10px' }}>
      {/* Dots */}
      {otdShows.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
          {otdShows.map((s, i) => {
            const activeDotColor = s.phreezer_avg ? 'var(--orange)' : s.attended ? 'var(--green)' : 'var(--cyan)';
            const inactiveDotColor = s.phreezer_avg ? 'rgba(255,140,0,0.3)' : s.attended ? 'rgba(51,255,51,0.3)' : 'rgba(0,224,208,0.2)';
            return (
              <div key={i} onClick={() => { setDragX(0); setIdx(i); }} style={{
                width: i === idx ? 18 : 6, height: 6,
                background: i === idx ? activeDotColor : inactiveDotColor,
                borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s',
              }} />
            );
          })}
        </div>
      )}

      {/* Badge row */}
      {(isAttended || isRated) && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 6, paddingLeft: 2 }}>
          {isRated && <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', letterSpacing: '2px', color: 'var(--orange)', border: '1px solid rgba(255,140,0,0.5)', padding: '2px 8px' }}>◈ PHROZEN</span>}
          {isAttended && <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', letterSpacing: '2px', color: 'var(--green)', border: '1px solid rgba(51,255,51,0.5)', padding: '2px 8px' }}>✓ I WAS THERE</span>}
        </div>
      )}

      {/* Viewport — clips the full track */}
      <div
        style={{ overflow: 'hidden', position: 'relative' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Full track — all cards side by side, translate by idx */}
        <div style={{
          display: 'flex',
          width: `${otdShows.length * 100}%`,
          transform: `translateX(calc(${-idx * (100 / otdShows.length)}% + ${dragX / otdShows.length}px))`,
          transition: dragging ? 'none' : 'transform 0.32s cubic-bezier(0.2, 0, 0, 1)',
          willChange: 'transform',
        }}>
          {otdShows.map((s, i) => {
            const [sy, sm, sd] = s.show_date.split('-');
            const sFullDate = `${months[parseInt(sm)-1]} ${parseInt(sd)}, ${sy}`;
            const sYearsAgo = new Date().getFullYear() - parseInt(sy);
            const sScoreColor = s.phreezer_avg >= 4.7 ? 'var(--orange)' : s.phreezer_avg ? 'var(--cyan)' : 'rgba(51,255,51,0.4)';
            const sStyle = getCardStyle(s);
            const sTint = s.phreezer_avg || s.attended ? sStyle.background : getCardTint(i);
            return (
              <div key={s.show_date} style={{ width: `${100 / otdShows.length}%`, flexShrink: 0 }}>
                <OTDCard
                  otdShow={s}
                  fullDate={sFullDate}
                  yearsAgo={sYearsAgo}
                  scoreColor={sScoreColor}
                  onRateShow={onRateShow}
                  api={api}
                  cardBorder={sStyle.border}
                  cardBorderLeft={sStyle.borderLeft}
                  cardGlow={sStyle.boxShadow}
                  cardBackground={sTint}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Counter */}
      {otdShows.length > 1 && (
        <div style={{ textAlign: 'center', marginTop: 6, fontFamily: 'var(--font-display)', fontSize: '0.42rem', color: 'rgba(0,224,208,0.4)', letterSpacing: '2px' }}>
          {idx + 1} / {otdShows.length} SHOWS
        </div>
      )}
    </div>
  );
}

export function MyShowsTab({ api, showMessage, showError, onRateShow, openImportOnMount, onDeepPhreeze, kpiRefreshKey }) {
  const [shows, setShows] = useState([]);
  const [attended, setAttended] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => { loadData(); }, [kpiRefreshKey]);

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

  const filteredShows = attended.filter(show => {
    if (filterBy === 'has_review') return Array.isArray(show.reviews) && show.reviews.length > 0;
    if (filterBy === 'has_phreezer') return show.phreezer_avg != null;
    if (filterBy === 'no_phreezer') return show.phreezer_avg == null;
    if (filterBy === 'favorites') return show.favorited;
    return true;
  });

  const displayShows = [...filteredShows].sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.show_date) - new Date(a.show_date);
    if (sortBy === 'date_asc') return new Date(a.show_date) - new Date(b.show_date);
    if (sortBy === 'phreezer_desc') return (b.phreezer_avg ?? -1) - (a.phreezer_avg ?? -1);
    if (sortBy === 'no_phreezer') return (a.phreezer_avg != null ? 1 : -1) - (b.phreezer_avg != null ? 1 : -1);
    return 0;
  });

  return (
    <div>
      {/* Import success modal */}
      {importResult && (() => {
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
                {isReviews ? 'YOUR VOICE IS IN THE PHREEZER' : `${count} SHOWS. FROZEN IN TIME.`}
              </div>
              <button className="import-modal-dismiss" onClick={() => setImportResult(null)}>[ TAP TO DISMISS ]</button>
            </div>
          </div>
        );
      })()}

      {/* ── SECTION A: QUICK STATS + KPIs — IMPORT button lives here ── */}
      <KPICards api={api} onDeepPhreeze={onDeepPhreeze} onImport={() => setShowImport(v => !v)} refreshKey={kpiRefreshKey} />

      {/* Import panel */}
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

      {/* ── SECTION B: ON THIS DAY ── */}
      <OTDCarousel attended={attended} ratedShows={shows} onRateShow={onRateShow} api={api} />

      {/* ── SECTION C: MY SHOWS ── */}
      <div style={{ padding: '10px' }}>
        {/* ◈ MY SHOWS label */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.54rem', letterSpacing: '3px', color: 'var(--green)', textShadow: '0 0 8px rgba(51,255,51,0.3)', marginBottom: 10 }}>◈ MY SHOWS</div>

        {/* Filter + Sort — combined, scrollable row */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {[['all','ALL'],['has_review','REVIEWED'],['has_phreezer','PHROZEN'],['favorites','★ FAV']].map(([k,l]) => (
            <button key={k} onClick={() => setFilterBy(k)} style={{
              flexShrink: 0,
              padding: '9px 14px',
              border: `1px solid ${filterBy === k ? 'var(--orange)' : 'rgba(0,224,208,0.3)'}`,
              background: filterBy === k ? 'rgba(255,102,0,0.1)' : 'transparent',
              color: filterBy === k ? 'var(--orange)' : 'rgba(0,224,208,0.65)',
              fontFamily: 'var(--font-display)', fontSize: '0.58rem', letterSpacing: '1.5px', cursor: 'pointer',
              boxShadow: filterBy === k ? '0 0 8px rgba(255,102,0,0.25)' : 'none',
              whiteSpace: 'nowrap',
            }}>{l}</button>
          ))}
        </div>

        {/* Sort row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--border)' }}>

          {[['date_desc','DATE ↓'],['date_asc','DATE ↑'],['phreezer_desc','SCORE'],['no_phreezer','UNRATED']].map(([k,l]) => (
            <button key={k} onClick={() => setSortBy(k)} style={{
              flexShrink: 0,
              padding: '7px 12px',
              border: `1px solid ${sortBy === k ? 'var(--cyan)' : 'rgba(0,224,208,0.3)'}`,
              background: sortBy === k ? 'rgba(0,224,208,0.08)' : 'transparent',
              color: sortBy === k ? 'var(--cyan)' : 'rgba(0,224,208,0.65)',
              fontFamily: 'var(--font-display)', fontSize: '0.52rem', letterSpacing: '1.5px', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>{l}</button>
          ))}
        </div>

        {/* Show list */}
        {!displayShows.length ? (
          <div className="empty-state">NO ATTENDED SHOWS — IMPORT FROM PHISH.NET ABOVE</div>
        ) : displayShows.map(show => {
          const reviewExpanded = expandedReview === show.show_date;
          const reviews = show.reviews || [];
          const hasReview = reviews.length > 0;
          const phreezerScore = show.phreezer_avg ?? show.overall_rating ?? null;
          const scoreColor = phreezerScore >= 4.7 ? 'var(--orange)' : phreezerScore != null ? 'var(--cyan)' : 'var(--text-muted)';
          const cardAccent = phreezerScore >= 4.7 ? 'var(--orange)' : phreezerScore != null ? 'var(--cyan)' : 'rgba(51,255,51,0.25)';

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
              onFavorite={() => setAttended(ss => ss.map(s2 => s2.show_date === show.show_date ? { ...s2, favorited: !s2.favorited } : s2))}
              onRateShow={onRateShow}
            />
          );
        })}
      </div>
    </div>
  );
}





