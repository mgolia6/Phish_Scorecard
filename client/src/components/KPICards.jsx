import React, { useState, useEffect } from 'react';
import { FullPageLoader } from './FullPageLoader';
import { formatDate } from '../utils';

const SHOW_KPIS = [
  {
    lbl: 'SHOWS',
    col: 'var(--cyan)',
    tipTitle: 'ATTENDED',
    tip: 'Shows you\'ve been to',
    source: '↗ phish.net',
  },
  {
    lbl: 'PHROZEN',
    col: 'var(--orange)',
    tipTitle: 'PHROZEN',
    tip: 'Shows you\'ve rated',
    source: '↗ Phreezer',
  },
  {
    lbl: 'AVG SCORE',
    col: 'var(--green)',
    tipTitle: 'AVG SCORE',
    tip: 'Your avg show rating',
    source: '↗ Phreezer',
  },
  {
    lbl: 'REVIEWED',
    col: 'var(--cyan)',
    tipTitle: 'REVIEWED',
    tip: 'Shows with a review',
    source: '↗ phish.net',
  },
];

const flipStyle = `
  .kpi-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.45s cubic-bezier(0.4, 0.2, 0.2, 1);
  }
  .kpi-card-inner.flipped {
    transform: rotateY(180deg);
  }
  .kpi-face {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }
  .kpi-face-back {
    transform: rotateY(180deg);
  }
`;

function KPICard({ val, lbl, col, tip, tipTitle, source, isLast, flipped, onFlip }) {
  return (
    <div
      onClick={onFlip}
      style={{
        borderRight: isLast ? 'none' : '1px solid var(--border)',
        cursor: 'pointer',
        perspective: '600px',
        height: 88,
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <div className={`kpi-card-inner${flipped ? ' flipped' : ''}`}>
        {/* FRONT */}
        <div className="kpi-face" style={{ padding: '14px 6px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: col, lineHeight: 1, textShadow: '0 0 16px currentColor' }}>
            {val}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', color: 'var(--text-muted)', letterSpacing: '2px', marginTop: 6 }}>
            {lbl}
          </div>
        </div>
        {/* BACK */}
        <div className="kpi-face kpi-face-back" style={{ background: 'var(--bg-elevated)', padding: '10px 8px', gap: 5 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', fontWeight: 700, color: col, letterSpacing: '2px', textShadow: '0 0 10px currentColor', textAlign: 'center' }}>
            {tipTitle}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--white)', lineHeight: 1.5, textAlign: 'center' }}>
            {tip}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.46rem', color: col, opacity: 0.6, textAlign: 'center', marginTop: 2 }}>
            {source}
          </div>
        </div>
      </div>
    </div>
  );
}

// Short badge labels
function badgeLabel(b) {
  const map = {
    'century_club': '100 CLUB',
    'first_freeze': '1ST FREEZE',
    'phish_critic': 'CRITIC',
    'streak_7': '7-DAY STREAK',
    'streak_30': '30-DAY STREAK',
  };
  return map[b.id] || b.label?.toUpperCase() || b.id?.toUpperCase();
}

export function KPICards({ api, onDeepPhreeze, onImport, refreshKey }) {
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flippedIndex, setFlippedIndex] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/user/kpi')
      .then(setKpi)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <FullPageLoader text="LOADING STATS..." />;
  if (!kpi) return null;

  const rated = kpi.shows_rated || 0;
  const attended = kpi.shows_attended || 0;
  const streakMax = 30;
  const streakPct = Math.min((kpi.login_streak || 0) / streakMax * 100, 100);

  const cardData = [
    { ...SHOW_KPIS[0], val: attended },
    { ...SHOW_KPIS[1], val: rated },
    { ...SHOW_KPIS[2], val: kpi.avg_score ?? '—' },
    { ...SHOW_KPIS[3], val: kpi.shows_with_reviews },
  ];

  return (
    <div>
      <style>{flipStyle}</style>

      {/* ── KPI GRID — no header, just data ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderTop: '2px solid rgba(0,224,208,0.25)',
      }}>
        {cardData.map(({ val, lbl, col, tip, tipTitle, source }, i) => (
          <KPICard
            key={lbl}
            val={val} lbl={lbl} col={col}
            tip={tip} tipTitle={tipTitle} source={source}
            isLast={i === cardData.length - 1}
            flipped={flippedIndex === i}
            onFlip={() => setFlippedIndex(prev => prev === i ? null : i)}
          />
        ))}
      </div>

      {/* ── TAP HINT ── */}
      <div style={{ background: 'var(--bg-panel)', padding: '4px 0', textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', color: 'rgba(0,224,208,0.45)', letterSpacing: '2px' }}>
          ↕ TAP TO FLIP
        </span>
      </div>

      {/* ── QUICK PHREEZE ── */}
      <div style={{ background: 'var(--bg-elevated)', padding: '12px 14px', borderBottom: '2px solid rgba(255,102,0,0.15)', marginTop: 10 }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '3px', color: 'var(--orange)', textShadow: '0 0 10px rgba(255,102,0,0.5)' }}>◈ QUICK PHREEZE</span>
          <button
            onClick={onImport}
            style={{ padding: '6px 12px', fontFamily: 'var(--font-display)', fontSize: '0.44rem', letterSpacing: '2px', border: '1px solid rgba(255,102,0,0.5)', color: 'var(--orange)', background: 'transparent', cursor: 'pointer' }}
          >↓ IMPORT</button>
        </div>

        {/* Progress bars */}
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

        {/* Badges — compact single row */}
        {kpi.badges && kpi.badges.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(51,255,51,0.08)' }}>
            {kpi.badges.map(b => (
              <div key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', border: '1px solid rgba(51,255,51,0.22)', background: 'var(--bg-elevated)', fontFamily: 'var(--font-display)', fontSize: '0.42rem', color: 'var(--green)', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '0.7rem' }}>{b.glyph}</span>{badgeLabel(b)}
              </div>
            ))}
          </div>
        )}

        {/* Top stats */}
        {(kpi.top_song || kpi.top_venue || kpi.first_show) && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(51,255,51,0.08)', borderLeft: '3px solid var(--orange)', paddingLeft: 10 }}>
            {[
              kpi.top_song   ? ['TOP RATED SONG', kpi.top_song.song_name,     `(${kpi.top_song.avg})`,     'var(--orange)'] : null,
              kpi.top_venue  ? ['TOP VENUE',       kpi.top_venue.venue,        `(${kpi.top_venue.shows}x)`, 'var(--cyan)']   : null,
              kpi.first_show ? ['FIRST FREEZE',    formatDate(kpi.first_show), '',                          'var(--cyan)']   : null,
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
