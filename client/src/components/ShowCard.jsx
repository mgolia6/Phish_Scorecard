import React, { useState } from 'react';
import { useApi } from '../useApi';
import { RELISTEN, formatDate } from '../utils';

const stripBBCode = (text) => {
  if (!text) return '';
  return text
    .replace(/\[url=[^\]]*\]/gi, '')
    .replace(/\[\/url\]/gi, '')
    .replace(/\[b\]/gi, '').replace(/\[\/b\]/gi, '')
    .replace(/\[i\]/gi, '').replace(/\[\/i\]/gi, '')
    .replace(/\[quote[^\]]*\]/gi, '').replace(/\[\/quote\]/gi, '')
    .replace(/\[[^\]]*\]/g, '')
    .trim();
};

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
    <div style={{
      marginBottom: 6,
      border: '1px solid var(--border)',
      borderLeft: phreezerScore != null ? '3px solid var(--cyan)' : hasReview ? '3px solid var(--orange)' : '3px solid var(--border)',
      boxShadow: phreezerScore != null && hasReview ? 'inset 3px 0 0 0 var(--orange)' : 'none',
      background: 'var(--bg-panel)',
    }}>

      {/* ── MAIN ROW ── */}
      <div style={{ padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Date */}
        <div style={{ flexShrink: 0, minWidth: 44, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.66rem', color: 'var(--text-muted)', letterSpacing: '2px', lineHeight: 1 }}>{compactMonth}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900, color: '#fff', lineHeight: 1, margin: '2px 0' }}>{compactDay}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.66rem', color: 'var(--text-muted)', letterSpacing: '2px', lineHeight: 1 }}>{compactYear}</div>
        </div>

        {/* Venue + city */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', WebkitTextDecoration: 'none', textDecoration: 'none' }}>
            {show.venue}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--cyan)', marginTop: 2, WebkitTextDecoration: 'none', textDecoration: 'none' }}>
            {show.city}{show.state ? `, ${show.state}` : ''}
          </div>
          {show.companions && show.companions.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
              {show.companions.slice(0, 3).map(c => (
                <span key={c.user_id} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--cyan)', padding: '1px 5px', border: '1px solid rgba(var(--cyan-rgb),0.25)' }}>{c.username}</span>
              ))}
              {show.companions.length > 3 && (
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--text-muted)' }}>+{show.companions.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <a href={`https://phish.in/${show.show_date}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(var(--cyan-rgb),0.4)', background: 'rgba(var(--cyan-rgb),0.06)', color: 'var(--cyan)', fontSize: '0.7rem', textDecoration: 'none', paddingLeft: 2 }}>▶</a>
          <div style={{ textAlign: 'right', minWidth: 40 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: phreezerScore != null ? '1.3rem' : '0.85rem', fontWeight: 900, color: phreezerScore != null ? scoreColor : 'var(--text-muted)', textShadow: phreezerScore != null ? `0 0 10px ${scoreColor}66` : 'none', lineHeight: 1 }}>
              {phreezerScore != null ? phreezerScore : '—'}
            </div>
          </div>
          <button onClick={handleExpand}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer', padding: '4px', lineHeight: 1 }}>
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>



      {/* Expanded detail panel */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(var(--green-rgb),0.08)', padding: '14px', background: 'var(--bg-elevated)' }}>
          {phreezerScore == null ? (
            /* ── Placeholder for unrated shows ── */
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', color: 'rgba(var(--green-rgb),0.3)', letterSpacing: '2px', marginBottom: 8 }}>
                NOT RATED YET
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Rate this show to see set scores,<br/>top songs, and your notes here.
              </div>
            </div>
          ) : loadingCard ? (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '12px 0' }}>LOADING...</div>
          ) : cardData ? (
            <>
              {/* Set scores */}
              {Object.keys(cardData.setAvgs).filter(k => !['S','s'].includes(k)).length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-evenly', marginBottom: 16 }}>
                  {Object.entries(cardData.setAvgs)
                    .filter(([k]) => !['S','s'].includes(k))
                    .map(([k, v]) => {
                      const setColors = { '1': 'var(--cyan)', '2': 'var(--orange)', 'e': 'var(--green)', 'E': 'var(--green)', 'e2': 'var(--green)' };
                      const col = setColors[k] || 'var(--cyan)';
                      return (
                        <div key={k} style={{ textAlign: 'center' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900, color: col, letterSpacing: 1, lineHeight: 1, textShadow: `0 0 10px ${col}66` }}>{v || '—'}</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', color: col, opacity: 0.7, letterSpacing: '2px', marginTop: 5 }}>{setLabel(k)}</div>
                        </div>
                      );
                    })}
                </div>
              )}
              {/* Top songs */}
              {cardData.topSongs.length > 0 && (
                <>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 10 }}>TOP RATED SONGS</div>
                  {cardData.topSongs.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < cardData.topSongs.length - 1 ? '1px solid rgba(var(--green-rgb),0.06)' : 'none' }}>
                      <a href={`https://phish.in/${show.show_date}`} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: '1px solid rgba(var(--cyan-bright-rgb),0.35)', background: 'rgba(var(--cyan-bright-rgb),0.05)', color: 'var(--cyan)', fontSize: '0.62rem', textDecoration: 'none', flexShrink: 0 }}>▶</a>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--white)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.song_name}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--orange)', letterSpacing: '1px', flexShrink: 0 }}>{parseFloat(s.rating).toFixed(1)}</span>
                    </div>
                  ))}
                </>
              )}
              {/* Notes */}
              {cardData.ratingsList.some(r => r.notes) && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg)', border: '1px solid rgba(var(--green-rgb),0.1)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.6 }}>
                  {cardData.ratingsList.filter(r => r.notes).slice(0,3).map((r, i) => (
                    <div key={i} style={{ marginBottom: i < 2 ? 6 : 0 }}>
                      <span style={{ color: 'rgba(var(--green-rgb),0.4)', fontSize: '0.65rem' }}>{r.song_name}: </span>"{r.notes}"
                    </div>
                  ))}
                </div>
              )}
              {/* My Review — deduped, bbcode stripped */}
              {hasReview && (() => {
                const seen = new Set();
                const unique = reviews.filter(r => {
                  const key = (r.review_text || '').slice(0, 80);
                  if (seen.has(key)) return false;
                  seen.add(key); return true;
                });
                return unique.length > 0 ? (
                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(var(--orange-rgb),0.04)', border: '1px solid rgba(var(--orange-rgb),0.2)', borderLeft: '2px solid var(--orange)' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--orange)', letterSpacing: '2px', marginBottom: 8 }}>MY REVIEW</div>
                    {unique.map((rev, i) => (
                      <div key={rev.review_id || i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.7, marginBottom: i < unique.length - 1 ? 10 : 0 }}>
                        "{stripBBCode(rev.review_text)}"
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}
            </>
          ) : null}
        </div>
      )}

      {/* ── ACTION BAR — always visible ── */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(var(--green-rgb),0.08)' }}>
        <button onClick={onFavorite}
          style={{ padding: '11px 14px', background: show.favorited ? 'rgba(var(--orange-rgb),0.08)' : 'transparent', border: 'none', borderRight: '1px solid rgba(var(--green-rgb),0.08)', color: show.favorited ? 'var(--orange)' : 'rgba(var(--ink-rgb),0.4)', fontSize: '1.2rem', lineHeight: 1, cursor: 'pointer', filter: show.favorited ? 'drop-shadow(0 0 6px rgba(var(--orange-rgb),0.7))' : 'none', flexShrink: 0 }}>
          {show.favorited ? '★' : '☆'}
        </button>
        <button onClick={() => onRateShow(show.show_date)}
          style={{ flex: 1, padding: '11px 8px', background: 'transparent', border: 'none', borderRight: '1px solid rgba(var(--green-rgb),0.08)', color: phreezerScore != null ? 'var(--cyan)' : 'var(--green)', fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '2px', cursor: 'pointer' }}>
          {phreezerScore != null ? '◈ RE-RATE' : '◈ RATE'}
        </button>

        <a href={`https://phish.net/setlists/?d=${show.show_date}`} target="_blank" rel="noopener noreferrer"
          style={{ flex: 1, padding: '11px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(var(--green-rgb),0.08)', color: 'rgba(var(--cyan-rgb),0.7)', fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '2px', textDecoration: 'none' }}>
          PHISH.NET
        </a>
        <a href={`${RELISTEN}/${show.show_date?.replace(/-/g,'/')}`} target="_blank" rel="noopener noreferrer"
          style={{ flex: 1, padding: '11px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '2px', textDecoration: 'none' }}>
          RELISTEN
        </a>
      </div>
    </div>
  );
}






