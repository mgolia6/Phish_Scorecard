import React, { useState } from 'react';
import { useApi } from '../useApi';
import { RELISTEN, formatDate } from '../utils';

export function ShowCard({ show, phreezerScore, scoreColor, cardAccent, hasReview, reviews, reviewExpanded, setExpandedReview, onFavorite, onRateShow }) {
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
        const sets = {};
        ratingsList.forEach(r => {
          const k = r.set_number || '1';
          if (!sets[k]) sets[k] = [];
          sets[k].push(r);
        });
        const setAvgs = {};
        Object.entries(sets).forEach(([k, songs]) => {
          const rated = songs.filter(s => s.rating);
          setAvgs[k] = rated.length ? (rated.reduce((sum, s) => sum + parseFloat(s.rating), 0) / rated.length).toFixed(2) : null;
        });
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

  // Parse date for compact display
  const dateParts = show.show_date ? show.show_date.split('-') : [];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const compactMonth = dateParts[1] ? months[parseInt(dateParts[1]) - 1] : '';
  const compactDay = dateParts[2] ? parseInt(dateParts[2]) : '';
  const compactYear = dateParts[0] || '';

  return (
    <div style={{ marginBottom: 5 }}>
      {/* ── COMPACT ROW — always visible, tap to expand ── */}
      <div
        onClick={handleExpand}
        style={{
          background: `linear-gradient(135deg, var(--bg-panel), ${phreezerScore >= 4.7 ? 'rgba(255,102,0,0.04)' : 'rgba(0,0,0,0)'})`,
          border: '1px solid var(--border)',
          borderLeft: `3px solid ${cardAccent}`,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
        }}
      >
        {/* Date — big on left */}
        <div style={{ flexShrink: 0, minWidth: 52 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>
            {compactMonth} {compactDay}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', color: 'var(--text-muted)', letterSpacing: '2px', marginTop: 3 }}>
            {compactYear}
          </div>
        </div>

        {/* Venue + city */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {show.venue}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {show.city}{show.state ? `, ${show.state}` : ''}
          </div>
          {/* Phriend chips */}
          {show.companions && show.companions.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
              {show.companions.slice(0, 3).map(c => (
                <span key={c.user_id} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--cyan)', padding: '1px 5px', border: '1px solid rgba(0,224,208,0.25)', background: 'rgba(0,224,208,0.04)' }}>{c.username}</span>
              ))}
              {show.companions.length > 3 && (
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.32rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>+{show.companions.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Right: play + score + icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {/* Review icon */}
          {hasReview && (
            <button
              onClick={() => setExpandedReview(reviewExpanded ? null : show.show_date)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1, color: reviewExpanded ? 'var(--orange)' : 'rgba(255,102,0,0.3)' }}
              title="My review"
            >✎</button>
          )}
          {/* Fav */}
          <button
            onClick={onFavorite}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1, color: show.favorited ? 'var(--orange)' : 'rgba(51,255,51,0.15)', filter: show.favorited ? 'drop-shadow(0 0 4px rgba(255,102,0,0.6))' : 'none' }}
            title={show.favorited ? 'Unfavorite' : 'Favorite'}
          >{show.favorited ? '★' : '☆'}</button>
          {/* Play */}
          <a
            href={`https://phish.in/${show.show_date}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(0,224,208,0.38)', background: 'rgba(0,224,208,0.05)', color: 'var(--cyan)', fontSize: '0.58rem', textDecoration: 'none', paddingLeft: 2 }}
            title="Stream on Phish.in"
          >▶</a>
          {/* Score */}
          <div style={{ textAlign: 'right', minWidth: 32 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: phreezerScore != null ? '1.1rem' : '0.7rem', fontWeight: 900, color: phreezerScore != null ? scoreColor : 'var(--text-muted)', textShadow: phreezerScore != null ? `0 0 10px ${scoreColor}66` : 'none', lineHeight: 1 }}>
              {phreezerScore != null ? phreezerScore : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Review text inline */}
      {hasReview && reviewExpanded && (
        <div style={{ margin: '0 0 0 0', padding: '8px 14px 10px', background: 'var(--bg-elevated)', borderLeft: `3px solid ${cardAccent}`, borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.6 }}>
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
        <div style={{ borderTop: '1px solid rgba(51,255,51,0.08)', background: 'var(--bg-elevated)', borderLeft: `3px solid ${cardAccent}` }}>
          {loadingCard ? (
            <div style={{ padding: '14px', fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center' }}>LOADING...</div>
          ) : cardData ? (
            <div style={{ padding: '12px 14px' }}>
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
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: col, letterSpacing: 1, lineHeight: 1 }}>{v || '—'}</div>
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

              {/* Notes */}
              {cardData.ratingsList.some(r => r.notes) && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--bg)', border: '1px solid rgba(51,255,51,0.1)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.6 }}>
                  {cardData.ratingsList.filter(r => r.notes).slice(0,3).map((r, i) => (
                    <div key={i} style={{ marginBottom: i < 2 ? 6 : 0 }}>
                      <span style={{ color: 'rgba(51,255,51,0.35)', fontSize: '0.6rem' }}>{r.song_name}: </span>"{r.notes}"
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '14px', fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center' }}>NO RATINGS YET</div>
          )}

          {/* Action bar */}
          <div style={{ display: 'flex', borderTop: '1px solid rgba(51,255,51,0.08)', gap: 0 }}>
            <button
              onClick={() => onRateShow(show.show_date)}
              style={{ flex: 1, padding: '10px 8px', background: 'transparent', border: 'none', borderRight: '1px solid rgba(51,255,51,0.08)', color: phreezerScore != null ? 'var(--cyan)' : 'var(--text-label)', fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '2px', cursor: 'pointer' }}
            >
              {phreezerScore != null ? '◈ RE-RATE' : '◈ RATE'}
            </button>
            <a href={`https://phish.net/setlists/?d=${show.show_date}`} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, padding: '10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(51,255,51,0.08)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.46rem', letterSpacing: '2px', textDecoration: 'none' }}>
              PHISH.NET
            </a>
            <a href={`${RELISTEN}/${show.show_date?.replace(/-/g,'/')}`} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, padding: '10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.46rem', letterSpacing: '2px', textDecoration: 'none' }}>
              RELISTEN
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
