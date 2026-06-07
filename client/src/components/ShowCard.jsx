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
    if (next && !cardData && phreezerScore != null) {
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
    if (k === 'e' || k === 'E') return 'ENCORE';
    if (k === 'e2') return 'ENCORE 2';
    if (k === 'S' || k === 's') return 'SC';
    return `SET ${k}`;
  };

  const dateParts = show.show_date ? show.show_date.split('-') : [];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const compactMonth = dateParts[1] ? months[parseInt(dateParts[1]) - 1] : '';
  const compactDay = dateParts[2] ? parseInt(dateParts[2]) : '';
  const compactYear = dateParts[0] || '';

  return (
    <div style={{ marginBottom: 6, border: '1px solid var(--border)', borderLeft: `3px solid ${cardAccent}`, background: 'var(--bg-panel)' }}>

      {/* ── MAIN ROW ── */}
      <div style={{ padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Date */}
        <div style={{ flexShrink: 0, minWidth: 58 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>
            {compactMonth} {compactDay}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'var(--text-muted)', letterSpacing: '2px', marginTop: 3 }}>
            {compactYear}
          </div>
        </div>

        {/* Venue + city */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {show.venue}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--cyan)', marginTop: 2 }}>
            {show.city}{show.state ? `, ${show.state}` : ''}
          </div>
          {show.companions && show.companions.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
              {show.companions.slice(0, 3).map(c => (
                <span key={c.user_id} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--cyan)', padding: '1px 5px', border: '1px solid rgba(0,224,208,0.25)' }}>{c.username}</span>
              ))}
              {show.companions.length > 3 && (
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.38rem', color: 'var(--text-muted)' }}>+{show.companions.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {hasReview && (
            <button onClick={() => setExpandedReview(reviewExpanded ? null : show.show_date)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: 0, lineHeight: 1, color: reviewExpanded ? 'var(--orange)' : 'rgba(255,102,0,0.3)' }}
              title="My review">✎</button>
          )}
          <button onClick={onFavorite}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: 0, lineHeight: 1, color: show.favorited ? 'var(--orange)' : 'rgba(51,255,51,0.15)', filter: show.favorited ? 'drop-shadow(0 0 4px rgba(255,102,0,0.6))' : 'none' }}
          >{show.favorited ? '★' : '☆'}</button>
          <a href={`https://phish.in/${show.show_date}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(0,224,208,0.4)', background: 'rgba(0,224,208,0.06)', color: 'var(--cyan)', fontSize: '0.65rem', textDecoration: 'none', paddingLeft: 2 }}>▶</a>
          <div style={{ textAlign: 'right', minWidth: 36 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: phreezerScore != null ? '1.2rem' : '0.85rem', fontWeight: 900, color: phreezerScore != null ? scoreColor : 'var(--text-muted)', textShadow: phreezerScore != null ? `0 0 10px ${scoreColor}66` : 'none', lineHeight: 1 }}>
              {phreezerScore != null ? phreezerScore : '—'}
            </div>
          </div>
          <button onClick={handleExpand}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.65rem', cursor: 'pointer', padding: '4px', lineHeight: 1 }}>
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Review text inline */}
      {hasReview && reviewExpanded && (
        <div style={{ padding: '8px 14px 10px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(51,255,51,0.08)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.6 }}>
          {reviews.map((rev, i) => (
            <div key={rev.review_id || i} style={{ marginBottom: i < reviews.length - 1 ? 8 : 0 }}>
              "{rev.review_text}"
              {rev.posted_date && <div style={{ fontSize: '0.65rem', marginTop: 4 }}>{rev.posted_date}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Expanded detail panel */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(51,255,51,0.08)', padding: '14px', background: 'var(--bg-elevated)' }}>
          {phreezerScore == null ? (
            /* ── Placeholder for unrated shows ── */
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'rgba(51,255,51,0.3)', letterSpacing: '2px', marginBottom: 8 }}>
                NOT RATED YET
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Rate this show to see set scores,<br/>top songs, and your notes here.
              </div>
            </div>
          ) : loadingCard ? (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '12px 0' }}>LOADING...</div>
          ) : cardData ? (
            <>
              {/* Set scores */}
              {Object.keys(cardData.setAvgs).filter(k => !['S','s'].includes(k)).length > 0 && (
                <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                  {Object.entries(cardData.setAvgs)
                    .filter(([k]) => !['S','s'].includes(k))
                    .map(([k, v]) => {
                      const col = v && parseFloat(v) >= 4.5 ? 'var(--orange)' : 'var(--cyan)';
                      return (
                        <div key={k} style={{ textAlign: 'center' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: col, letterSpacing: 1, lineHeight: 1 }}>{v || '—'}</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--text-muted)', letterSpacing: '2px', marginTop: 5 }}>{setLabel(k)}</div>
                        </div>
                      );
                    })}
                </div>
              )}
              {/* Top songs */}
              {cardData.topSongs.length > 0 && (
                <>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 10 }}>TOP RATED SONGS</div>
                  {cardData.topSongs.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < cardData.topSongs.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
                      <a href={`https://phish.in/${show.show_date}`} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: '1px solid rgba(0,255,255,0.35)', background: 'rgba(0,255,255,0.05)', color: 'var(--cyan)', fontSize: '0.55rem', textDecoration: 'none', flexShrink: 0 }}>▶</a>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--white)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.song_name}</span>
                      <span style={{ flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: 'var(--orange)', letterSpacing: '1px' }}>{parseFloat(s.rating).toFixed(1)}</span><span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--orange)' }}>★</span>
                      </span>
                    </div>
                  ))}
                </>
              )}
              {/* Notes */}
              {cardData.ratingsList.some(r => r.notes) && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg)', border: '1px solid rgba(51,255,51,0.1)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.6 }}>
                  {cardData.ratingsList.filter(r => r.notes).slice(0,3).map((r, i) => (
                    <div key={i} style={{ marginBottom: i < 2 ? 6 : 0 }}>
                      <span style={{ color: 'rgba(51,255,51,0.4)', fontSize: '0.65rem' }}>{r.song_name}: </span>"{r.notes}"
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* ── ACTION BAR — always visible ── */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(51,255,51,0.08)' }}>
        <button onClick={() => onRateShow(show.show_date)}
          style={{ flex: 1, padding: '11px 8px', background: 'transparent', border: 'none', borderRight: '1px solid rgba(51,255,51,0.08)', color: phreezerScore != null ? 'var(--cyan)' : 'var(--green)', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2px', cursor: 'pointer' }}>
          {phreezerScore != null ? '◈ RE-RATE' : '◈ RATE'}
        </button>
        <a href={`https://phish.net/setlists/?d=${show.show_date}`} target="_blank" rel="noopener noreferrer"
          style={{ flex: 1, padding: '11px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(51,255,51,0.08)', color: 'rgba(0,224,208,0.7)', fontFamily: 'var(--font-display)', fontSize: '0.52rem', letterSpacing: '2px', textDecoration: 'none' }}>
          PHISH.NET
        </a>
        <a href={`${RELISTEN}/${show.show_date?.replace(/-/g,'/')}`} target="_blank" rel="noopener noreferrer"
          style={{ flex: 1, padding: '11px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.52rem', letterSpacing: '2px', textDecoration: 'none' }}>
          RELISTEN
        </a>
      </div>
    </div>
  );
}



