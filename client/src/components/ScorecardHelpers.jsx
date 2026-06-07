import React from 'react';

export function SongRating({ value, onChange }) {
  return (
    <div className="song-rating-row">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          className={`rating-btn ${n <= value ? 'active' : ''} ${n === value ? 'selected' : ''}`}
          onClick={() => onChange(n === value ? 0 : n)}
          aria-label={`Rate ${n} stars`}
        >{n <= value ? '★' : '☆'}</button>
      ))}
    </div>
  );
}

export function SetScore({ label, songs, ratings }) {
  const rated = songs.filter(s => ratings[s.posKey || s.song]?.rating);
  if (!rated.length) return null;
  const avg = rated.reduce((sum, s) => sum + parseInt(ratings[s.posKey || s.song].rating), 0) / rated.length;
  const pct = (avg / 5) * 100;
  return (
    <div className="set-score">
      <span className="set-score-label">{label}</span>
      <div className="set-score-bar"><div className="set-score-fill" style={{ width: `${pct}%` }} /></div>
      <span className="set-score-val">{avg.toFixed(2)}</span>
      <span className="set-score-count">({rated.length})</span>
    </div>
  );
}
