import React, { useState, useEffect } from 'react';
import { FullPageLoader } from './FullPageLoader';
import { CommExpandCard } from './CommunityTab';
import { formatDate } from '../utils';

export function MySongsTab({ api, showMessage, showError }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/songs').then(setSongs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageLoader text="LOADING YOUR SONGS..." />;

  const totalRatings = songs.reduce((s, r) => s + parseInt(r.total_ratings || 0), 0);
  const perfect5s = songs.filter(s => parseFloat(s.average_rating) === 5).length;
  const overallAvg = songs.length ? (songs.reduce((s, r) => s + parseFloat(r.average_rating || 0), 0) / songs.length).toFixed(2) : '—';

  return (
    <div>
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        {[
          { label: 'SONGS RATED', value: totalRatings, color: 'var(--cyan)' },
          { label: 'UNIQUE SONGS', value: songs.length, color: 'var(--orange)' },
          { label: 'AVG SONG SCORE', value: overallAvg, color: 'var(--green)' },
          { label: 'PERFECT 5s', value: perfect5s, color: 'var(--orange)' },
        ].map((k, i) => (
          <div key={i} className="kpi-card" style={{ borderTopColor: k.color }}>
            <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 9 }}>YOUR TOP SONGS — TAP FOR YOUR VERSIONS</div>
      {!songs.length ? (
        <div className="empty-state">RATE SOME SONGS FIRST</div>
      ) : songs.slice(0, 25).map((s, i) => {
        const accent = i === 0 ? 'var(--orange)' : 'var(--cyan)';
        return (
          <CommExpandCard key={s.song_name} name={s.song_name}
            sub={`${s.total_ratings} versions · avg ${s.average_rating}`}
            avg={s.average_rating} count={s.total_ratings} countLabel="HEARD"
            accent={accent}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 9 }}>YOUR VERSIONS</div>
              {(s.versions || []).map((v, vi) => (
                <div key={vi} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: vi < s.versions.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
                  <a href={`https://phish.in/${v.show_date}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, border: '1px solid rgba(0,255,255,0.4)', background: 'rgba(0,255,255,0.05)', color: 'var(--cyan)', fontSize: '0.62rem', textDecoration: 'none', flexShrink: 0 }}>▶</a>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--white)' }}>{formatDate(v.show_date)}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{v.venue}</div>
                  </div>
                  <span style={{ flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: 'var(--orange)', letterSpacing: '1px' }}>{parseFloat(v.rating).toFixed(1)}</span>
                  </span>
                </div>
              ))}
            </div>
          </CommExpandCard>
        );
      })}
    </div>
  );
}

// ============================================================
// MY VENUES TAB
// ============================================================


