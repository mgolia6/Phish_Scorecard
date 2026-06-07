import React, { useState, useEffect } from 'react';
import { FullPageLoader } from './FullPageLoader';
import { formatDate } from '../utils';

export function KPICards({ api, onDeepPhreeze, onImport }) {
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/user/kpi')
      .then(setKpi)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageLoader text="LOADING STATS..." />;
  if (!kpi) return null;

  const rated = kpi.shows_rated || 0;
  const attended = kpi.shows_attended || 0;
  const streakMax = 30;
  const streakPct = Math.min((kpi.login_streak || 0) / streakMax * 100, 100);

  return (
    <div>
      {/* ── QUICK STATS HEADER + IMPORT ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-panel)', padding: '10px 14px', borderBottom: '1px solid rgba(255,102,0,0.2)' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', letterSpacing: '3px', color: 'var(--orange)', textShadow: '0 0 10px rgba(255,102,0,0.5)' }}>◈ QUICK STATS</span>
        <button
          onClick={onImport}
          style={{ padding: '7px 14px', fontFamily: 'var(--font-display)', fontSize: '0.48rem', letterSpacing: '2px', border: '1px solid rgba(255,102,0,0.5)', color: 'var(--orange)', background: 'transparent', cursor: 'pointer', boxShadow: '0 0 10px rgba(255,102,0,0.2)' }}
        >↓ IMPORT</button>
      </div>

      {/* ── KPI ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}>
        {[
          { val: attended,               lbl: 'ATT',   col: 'var(--cyan)'   },
          { val: rated,                  lbl: 'RATED', col: 'var(--orange)' },
          { val: kpi.avg_score ?? '—',  lbl: 'AVG',   col: 'var(--green)'  },
          { val: kpi.shows_with_reviews, lbl: 'REV',   col: 'var(--cyan)'   },
        ].map(({ val, lbl, col }, i) => (
          <div key={lbl} style={{ padding: '18px 6px', textAlign: 'center', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: col, lineHeight: 1, textShadow: '0 0 16px currentColor' }}>{val}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.38rem', color: 'var(--text-muted)', letterSpacing: '2px', marginTop: 5 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* ── PROGRESS + STATS ── */}
      <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderBottom: '2px solid rgba(255,102,0,0.15)' }}>
        {[
          { lbl: 'SHOWS RATED',    val: rated,                  total: attended, col: 'var(--orange)' },
          { lbl: 'SHOWS REVIEWED', val: kpi.shows_with_reviews, total: attended, col: 'var(--cyan)'   },
          ...(kpi.login_streak > 1 ? [{ lbl: 'LOGIN STREAK', val: `⚡ ${kpi.login_streak} DAYS`, pct: streakPct, col: 'var(--green)' }] : []),
        ].map(({ lbl, val, total, pct, col }) => {
          const fillPct = pct !== undefined ? pct : Math.min((val / Math.max(total, 1)) * 100, 100);
          const display = pct !== undefined ? val : `${val} / ${total}`;
          return (
            <div key={lbl} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)', fontSize: '0.42rem', letterSpacing: '1.5px', color: 'var(--text-label)', marginBottom: 5 }}>
                <span>{lbl}</span>
                <span style={{ color: col }}>{display}</span>
              </div>
              <div style={{ height: 4, background: 'rgba(51,255,51,0.08)' }}>
                <div style={{ width: `${fillPct}%`, height: '100%', background: col, boxShadow: `0 0 6px ${col}`, transition: 'width 0.6s' }} />
              </div>
            </div>
          );
        })}

        {/* Badges */}
        {kpi.badges && kpi.badges.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(51,255,51,0.08)' }}>
            {kpi.badges.map(b => (
              <div key={b.id} title={b.desc} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', border: '1px solid rgba(51,255,51,0.22)', background: 'var(--bg-elevated)', fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--green)', letterSpacing: '1.5px' }}>
                <span style={{ fontSize: '0.8rem' }}>{b.glyph}</span> {b.label}
              </div>
            ))}
          </div>
        )}

        {/* Top stats */}
        {(kpi.top_song || kpi.top_venue || kpi.first_show) && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(51,255,51,0.08)', borderLeft: '3px solid var(--orange)', paddingLeft: 10 }}>
            {[
              kpi.top_song   ? ['TOP SONG',    kpi.top_song.song_name,     `(${kpi.top_song.avg})`,     'var(--orange)'] : null,
              kpi.top_venue  ? ['MOST VISITED', kpi.top_venue.venue,        `(${kpi.top_venue.shows}x)`, 'var(--cyan)']   : null,
              kpi.first_show ? ['FIRST SHOW',   formatDate(kpi.first_show), '',                          'var(--cyan)']   : null,
            ].filter(Boolean).map(([l, v, s, col], i, arr) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--text-label)', letterSpacing: '2px', flexShrink: 0 }}>{l}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--white)', textAlign: 'right', marginLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {v} <span style={{ color: col, fontSize: '0.7rem' }}>{s}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Deep Phreeze link */}
        <div
          style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(0,224,208,0.1)', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '0.44rem', letterSpacing: '3px', color: 'rgba(0,224,208,0.5)', cursor: 'pointer' }}
          onClick={() => onDeepPhreeze && onDeepPhreeze()}
        >
          ❄ DIVE INTO DEEP PHREEZE ▶
        </div>
      </div>
    </div>
  );
}
