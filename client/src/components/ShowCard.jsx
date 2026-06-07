import React, { useState } from 'react';
import { useApi } from './useApi';
import { RELISTEN, formatDate } from './utils';

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
        // Group by set
        const sets = {};
        ratingsList.forEach(r => {
          const k = r.set_number || '1';
          if (!sets[k]) sets[k] = [];
          sets[k].push(r);
        });
        // Set averages
        const setAvgs = {};
        Object.entries(sets).forEach(([k, songs]) => {
          const rated = songs.filter(s => s.rating);
          setAvgs[k] = rated.length ? (rated.reduce((sum, s) => sum + parseFloat(s.rating), 0) / rated.length).toFixed(2) : null;
        });
        // Top 5 songs by rating
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

  // Set bars — mini visual (I, II, E heights)
  const SetBars = () => {
    if (!cardData?.setAvgs) return null;
    const barSets = Object.entries(cardData.setAvgs)
      .filter(([k]) => !['S','s'].includes(k) && k !== 'e2')
      .slice(0, 3);
    if (!barSets.length) return null;
    return (
      <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 22, marginTop: 6 }}>
        {barSets.map(([k, v]) => {
          const h = v ? Math.max(4, ((parseFloat(v) - 3) / 2) * 20) : 4;
          const col = parseFloat(v) >= 4.7 ? 'var(--orange)' : 'var(--cyan)';
          return (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ width: 16, height: h, background: col, opacity: 0.85, borderRadius: '1px 1px 0 0', boxShadow: `0 0 4px ${col}66` }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.36rem', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{setLabel(k)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        background: `linear-gradient(135deg, var(--bg-panel), ${phreezerScore >= 4.7 ? 'rgba(255,102,0,0.04)' : 'rgba(0,255,255,0.01)'})`,
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${cardAccent}`,
      }}>
        {/* Collapsed main row */}
        <div style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {show.tour_name && (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 3, textTransform: 'uppercase' }}>
                {show.tour_name}
              </div>
            )}
            <div className="show-date-serif show-date-serif-md" style={{ marginBottom: 3 }}>
              {formatDate(show.show_date)}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--white)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {show.venue}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {show.city}{show.state ? `, ${show.state}` : ''}
            </div>
            {/* Phriend chips */}
            {show.companions && show.companions.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.34rem', letterSpacing: '1.5px', color: 'var(--text-muted)' }}>PHRIENDS:</span>
                {show.companions.slice(0, 3).map(c => (
                  <span key={c.user_id} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--cyan)', padding: '1px 6px', border: '1px solid rgba(0,224,208,0.28)', background: 'rgba(0,224,208,0.05)' }}>{c.username}</span>
                ))}
                {show.companions.length > 3 && (
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.34rem', color: 'var(--text-muted)', letterSpacing: '1px', padding: '1px 5px', border: '1px solid var(--border)' }}>+{show.companions.length - 3} MORE</span>
                )}
              </div>
            )}
            {/* Set bars — only visible once data loaded */}
            {cardData && <SetBars />}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {hasReview && (
                <button onClick={() => setExpandedReview(reviewExpanded ? null : show.show_date)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1, color: reviewExpanded ? 'var(--orange)' : 'rgba(255,102,0,0.35)', transition: 'all 0.2s' }}
                  title="My review">✎</button>
              )}
              <button onClick={onFavorite}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1, color: show.favorited ? 'var(--orange)' : 'rgba(51,255,51,0.2)', filter: show.favorited ? 'drop-shadow(0 0 4px rgba(255,102,0,0.7))' : 'none', transition: 'all 0.2s' }}
                title={show.favorited ? 'Unfavorite' : 'Favorite'}
              >{show.favorited ? '★' : '☆'}</button>
              <a href={`https://phish.in/${show.show_date}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(0,255,255,0.38)', background: 'rgba(0,255,255,0.05)', color: 'var(--cyan)', fontSize: '0.6rem', textDecoration: 'none', paddingLeft: 2, boxShadow: '0 0 4px rgba(0,255,255,0.15)' }}
                title="Stream on Phish.in">▶</a>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: scoreColor, textShadow: `0 0 14px ${scoreColor}55`, letterSpacing: 1, lineHeight: 1 }}>
                {phreezerScore != null ? phreezerScore : '—'}
              </div>
              {phreezerScore != null && (
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.38rem', color: 'var(--text-muted)', letterSpacing: '1.5px', marginTop: 3 }}>MY SCORE</div>
              )}
            </div>

            <button onClick={handleExpand}
              style={{ background: 'transparent', border: '1px solid rgba(51,255,51,0.2)', color: 'var(--text-label)', fontFamily: 'var(--font-display)', fontSize: '0.42rem', letterSpacing: '2px', padding: '4px 8px', cursor: 'pointer' }}>
              {expanded ? '▲ LESS' : '▼ MORE'}
            </button>
          </div>
        </div>

        {/* Review text inline */}
        {hasReview && reviewExpanded && (
          <div style={{ margin: '0 14px 10px', padding: '8px 10px', background: 'var(--bg)', border: '1px solid rgba(51,255,51,0.1)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.6 }}>
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
          <div style={{ borderTop: '1px solid rgba(51,255,51,0.08)', padding: '12px 14px', background: 'var(--bg-elevated)' }}>
            {loadingCard ? (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '12px 0' }}>LOADING...</div>
            ) : cardData ? (
              <>
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
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: col, textShadow: `0 0 8px ${col}44`, letterSpacing: 1, lineHeight: 1 }}>{v || '—'}</div>
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

                {/* Notes from any rated song */}
                {cardData.ratingsList.some(r => r.notes) && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--bg)', border: '1px solid rgba(51,255,51,0.1)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.6 }}>
                    {cardData.ratingsList.filter(r => r.notes).slice(0,3).map((r, i) => (
                      <div key={i} style={{ marginBottom: i < 2 ? 6 : 0 }}>
                        <span style={{ color: 'rgba(51,255,51,0.35)', fontSize: '0.6rem' }}>{r.song_name}: </span>"{r.notes}"
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '12px 0' }}>NO RATINGS YET</div>
            )}
          </div>
        )}

        {/* Action bar */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(51,255,51,0.08)', gap: 0 }}>
          <button onClick={() => onRateShow(show.show_date)}
            style={{ flex: 1, padding: '9px 8px', background: 'transparent', border: 'none', borderRight: '1px solid rgba(51,255,51,0.08)', color: phreezerScore != null ? 'var(--cyan)' : 'var(--text-label)', fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '2px', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => e.target.style.background = 'rgba(0,255,255,0.04)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}>
            {phreezerScore != null ? '◈ RE-RATE' : '◈ RATE'}
          </button>
          <a href={`https://phish.net/setlists/?d=${show.show_date}`} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, padding: '9px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(51,255,51,0.08)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.46rem', letterSpacing: '2px', textDecoration: 'none', transition: 'all 0.15s' }}
            onMouseEnter={e => e.target.style.color = 'var(--green)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
            PHISH.NET
          </a>
          <a href={`${RELISTEN}/${show.show_date?.replace(/-/g,'/')}`} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, padding: '9px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.46rem', letterSpacing: '2px', textDecoration: 'none', transition: 'all 0.15s' }}>
            RELISTEN
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ANALYTICS TAB
// ============================================================
