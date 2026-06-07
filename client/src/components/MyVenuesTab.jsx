import React, { useState, useEffect } from 'react';
import { FullPageLoader } from './FullPageLoader';
import { CommExpandCard } from './CommunityTab';
import { formatDate } from '../utils';

export function MyVenuesTab({ api, showMessage, showError }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/venues').then(setVenues).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageLoader text="LOADING YOUR VENUES..." />;

  const stateMap = {};
  venues.forEach(v => {
    const st = v.state;
    if (!st) return;
    if (!stateMap[st] || parseFloat(v.average_rating) > parseFloat(stateMap[st]))
      stateMap[st] = v.average_rating;
  });

  const totalShows = venues.reduce((s, v) => s + parseInt(v.total_shows || 0), 0);
  const topVenue = venues[0];

  return (
    <div>
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        {[
          { label: 'UNIQUE VENUES', value: venues.length,                          color: 'var(--cyan)'   },
          { label: 'STATES VISITED', value: Object.keys(stateMap).length,          color: 'var(--orange)' },
          { label: 'MOST VISITED',   value: topVenue?.total_shows ? `${topVenue.total_shows}x` : '—', color: 'var(--green)' },
          { label: 'TOP VENUE AVG',  value: topVenue?.average_rating || '—',       color: 'var(--cyan)'   },
        ].map((k, i) => (
          <div key={i} className="kpi-card" style={{ borderTopColor: k.color }}>
            <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>


      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 9 }}>
        ◈ MY VENUES — TAP FOR TOP SHOWS
      </div>

      {!venues.length ? (
        <div className="empty-state">RATE SOME SHOWS FIRST</div>
      ) : venues.slice(0, 20).map((v, i) => {
        const accent = i === 0 ? 'var(--orange)' : i === 1 ? 'var(--cyan)' : 'rgba(51,255,51,0.4)';
        return (
          <CommExpandCard key={`${v.venue}-${i}`}
            name={v.venue}
            sub={`${v.city ? v.city + ', ' : ''}${v.state || ''} · ${v.total_shows} shows`}
            avg={v.average_rating || '—'} count={v.total_shows} countLabel="SHOWS"
            accent={accent}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 9 }}>
                TOP SHOWS HERE
              </div>
              {(v.top_shows || []).map((s, si) => {
                const col = parseFloat(s.avg_score) >= 4.5 ? 'var(--orange)' : 'var(--cyan)';
                return (
                  <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: si < v.top_shows.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
                    <a href={`https://phish.in/${s.show_date}`} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: '1px solid rgba(0,255,255,0.35)', background: 'rgba(0,255,255,0.05)', color: 'var(--cyan)', fontSize: '0.55rem', textDecoration: 'none', flexShrink: 0 }}>▶</a>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--white)', flex: 1 }}>{formatDate(s.show_date)}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: col, letterSpacing: 1 }}>{s.avg_score}</span>
                  </div>
                );
              })}
            </div>
          </CommExpandCard>
        );
      })}
    </div>
  );
}

// ============================================================
// MY STATES TAB
// ============================================================

