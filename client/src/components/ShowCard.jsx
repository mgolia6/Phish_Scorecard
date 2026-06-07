import React from 'react';
import { RELISTEN, formatDate } from '../utils';

export function ShowCard({ show, phreezerScore, scoreColor, cardAccent, hasReview, reviews, reviewExpanded, setExpandedReview, onFavorite, onRateShow }) {
  const dateParts = show.show_date ? show.show_date.split('-') : [];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const compactMonth = dateParts[1] ? months[parseInt(dateParts[1]) - 1] : '';
  const compactDay = dateParts[2] ? parseInt(dateParts[2]) : '';
  const compactYear = dateParts[0] || '';

  return (
    <div style={{ marginBottom: 6, border: '1px solid var(--border)', borderLeft: `3px solid ${cardAccent}`, background: 'var(--bg-panel)' }}>

      {/* ── MAIN ROW ── */}
      <div style={{ padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Date — left */}
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

        {/* Right — icons + score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {hasReview && (
            <button
              onClick={() => setExpandedReview(reviewExpanded ? null : show.show_date)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: 0, lineHeight: 1, color: reviewExpanded ? 'var(--orange)' : 'rgba(255,102,0,0.3)' }}
              title="My review"
            >✎</button>
          )}
          <button
            onClick={onFavorite}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: 0, lineHeight: 1, color: show.favorited ? 'var(--orange)' : 'rgba(51,255,51,0.15)', filter: show.favorited ? 'drop-shadow(0 0 4px rgba(255,102,0,0.6))' : 'none' }}
          >{show.favorited ? '★' : '☆'}</button>
          <a
            href={`https://phish.in/${show.show_date}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(0,224,208,0.4)', background: 'rgba(0,224,208,0.06)', color: 'var(--cyan)', fontSize: '0.65rem', textDecoration: 'none', paddingLeft: 2 }}
          >▶</a>
          <div style={{ textAlign: 'right', minWidth: 36 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: phreezerScore != null ? '1.2rem' : '0.85rem', fontWeight: 900, color: phreezerScore != null ? scoreColor : 'var(--text-muted)', textShadow: phreezerScore != null ? `0 0 10px ${scoreColor}66` : 'none', lineHeight: 1 }}>
              {phreezerScore != null ? phreezerScore : '—'}
            </div>
          </div>
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

      {/* ── ACTION BAR — always visible ── */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(51,255,51,0.08)' }}>
        <button
          onClick={() => onRateShow(show.show_date)}
          style={{ flex: 1, padding: '11px 8px', background: 'transparent', border: 'none', borderRight: '1px solid rgba(51,255,51,0.08)', color: phreezerScore != null ? 'var(--cyan)' : 'var(--green)', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2px', cursor: 'pointer' }}
        >
          {phreezerScore != null ? '◈ RE-RATE' : '◈ RATE'}
        </button>
        <a href={`https://phish.net/setlists/?d=${show.show_date}`} target="_blank" rel="noopener noreferrer"
          style={{ flex: 1, padding: '11px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(51,255,51,0.08)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.52rem', letterSpacing: '2px', textDecoration: 'none' }}>
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
