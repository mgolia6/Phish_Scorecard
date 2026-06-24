import React, { useState, useEffect } from 'react';
import { FullPageLoader } from './FullPageLoader';
import { CommExpandCard } from './CommunityTab';
import { Heatmap } from './Heatmap';

export function MyStatesTab({ api, showMessage, showError }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/venues').then(setVenues).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageLoader text="LOADING YOUR STATES..." />;

  const byState = {};
  venues.forEach(v => {
    const st = v.state || 'Unknown';
    if (!byState[st]) byState[st] = { state: st, shows: 0, totalRating: 0, ratedShows: 0, topVenue: v.venue, topVenueShows: 0 };
    byState[st].shows += parseInt(v.total_shows || 0);
    if (v.average_rating) {
      byState[st].totalRating += parseFloat(v.average_rating) * parseInt(v.total_shows || 0);
      byState[st].ratedShows += parseInt(v.total_shows || 0);
    }
    if (parseInt(v.total_shows || 0) > byState[st].topVenueShows) {
      byState[st].topVenue = v.venue;
      byState[st].topVenueShows = parseInt(v.total_shows || 0);
    }
  });

  const states = Object.values(byState)
    .map(s => ({ ...s, avg: s.ratedShows > 0 ? (s.totalRating / s.ratedShows).toFixed(2) : null }))
    .sort((a, b) => parseFloat(b.avg || 0) - parseFloat(a.avg || 0));

  const stateMap = {};
  states.forEach(s => { if (s.avg) stateMap[s.state] = s.avg; });

  const top = states[0];

  return (
    <div>
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        {[
          { label: 'STATES VISITED', value: states.length,       color: 'var(--cyan)'   },
          { label: 'TOP STATE',      value: top?.state || '—',   color: 'var(--orange)' },
          { label: 'TOP STATE AVG',  value: top?.avg   || '—',   color: 'var(--green)'  },
          { label: 'SHOWS IN TOP',   value: top?.shows || '—',   color: 'var(--cyan)'   },
        ].map((k, i) => (
          <div key={i} className="kpi-card" style={{ borderTopColor: k.color }}>
            <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <Heatmap data={stateMap} title="MY RATINGS BY STATE" />

      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 9 }}>
        ◈ MY STATES — TAP FOR DETAILS
      </div>

      {!states.length ? (
        <div className="empty-state">RATE SOME SHOWS FIRST</div>
      ) : states.map((s, i) => {
        const accent = i === 0 ? 'var(--orange)' : i < 3 ? 'var(--cyan)' : 'rgba(51,255,51,0.4)';
        const scoreCol = s.avg && parseFloat(s.avg) >= 4.5 ? 'var(--orange)' : 'var(--cyan)';
        return (
          <CommExpandCard key={s.state}
            name={s.state}
            sub={`${s.shows} shows · top: ${s.topVenue}`}
            avg={s.avg || '—'} count={s.shows} countLabel="SHOWS"
            accent={accent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 5 }}>
                  TOP VENUE IN {s.state}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92rem', color: 'var(--white)' }}>{s.topVenue}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.topVenueShows} shows here</div>
              </div>
              {s.avg && (
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 5 }}>
                    YOUR AVG SCORE IN {s.state}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 900, color: scoreCol, textShadow: `0 0 12px ${scoreCol}66` }}>{s.avg}</div>
                </div>
              )}
            </div>
          </CommExpandCard>
        );
      })}
    </div>
  );
}

// ============================================================
// DEEP PHREEZE TAB
// ============================================================

