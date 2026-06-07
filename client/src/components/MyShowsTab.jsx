import React, { useState, useEffect } from 'react';
import { FullPageLoader } from './FullPageLoader';
import { KPICards } from './KPICards';
import { OTDCard } from './OTDCard';
import { ShowCard } from './ShowCard';
import { formatDate } from '../utils';

export function MyShowsTab({ api, showMessage, showError, onRateShow, openImportOnMount, onDeepPhreeze }) {
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

  useEffect(() => { loadData(); }, []);

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
      <KPICards api={api} onDeepPhreeze={onDeepPhreeze} onImport={() => setShowImport(v => !v)} />

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
        return (
          <div style={{ margin: '10px' }}>
            <OTDCard otdShow={otdShow} fullDate={fullDate} yearsAgo={yearsAgo} scoreColor={scoreColor} onRateShow={onRateShow} api={api} />
          </div>
        );
      })()}

      {/* ── SECTION C: MY SHOWS ── */}
      <div style={{ padding: '10px' }}>
        {/* ◈ MY SHOWS label */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.54rem', letterSpacing: '3px', color: 'var(--green)', textShadow: '0 0 8px rgba(51,255,51,0.3)', marginBottom: 10 }}>◈ MY SHOWS</div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
          {[['all','ALL'],['has_review','REVIEWED'],['has_phreezer','RATED'],['no_phreezer','UNRATED'],['favorites','★ FAV']].map(([k,l]) => (
            <button key={k} onClick={() => setFilterBy(k)} style={{
              padding: '8px 11px',
              border: `1px solid ${filterBy === k ? 'var(--green)' : 'rgba(51,255,51,0.18)'}`,
              background: filterBy === k ? 'rgba(51,255,51,0.06)' : 'transparent',
              color: filterBy === k ? 'var(--green)' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)', fontSize: '0.46rem', letterSpacing: '1.5px', cursor: 'pointer',
              boxShadow: filterBy === k ? '0 0 8px rgba(51,255,51,0.2)' : 'none',
            }}>{l}</button>
          ))}
        </div>

        {/* Sort row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 10, borderBottom: '1px solid var(--border)', marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', letterSpacing: '2px', color: 'var(--text-muted)' }}>SORT:</span>
          {[['date_desc','DATE ↓'],['date_asc','DATE ↑'],['phreezer_desc','SCORE'],['no_phreezer','UNRATED']].map(([k,l]) => (
            <button key={k} onClick={() => setSortBy(k)} style={{
              padding: '5px 10px',
              border: `1px solid ${sortBy === k ? 'var(--green)' : 'rgba(51,255,51,0.18)'}`,
              background: 'transparent',
              color: sortBy === k ? 'var(--green)' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)', fontSize: '0.4rem', letterSpacing: '1.5px', cursor: 'pointer',
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
