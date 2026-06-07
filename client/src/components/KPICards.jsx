import React, { useState, useEffect } from 'react';
import { FullPageLoader } from './FullPageLoader';
import { formatDate } from '../utils';

// ── FONT SYSTEM ──────────────────────────────────────────
// KPI value (big number):   2rem, Orbitron 900
// Card label (what it is):  0.62rem, Orbitron, muted
// Section title:            0.58rem, Orbitron, colored + glow
// Body text (progress lbl): 0.54rem, Orbitron
// Meta / source / hint:     0.5rem, mono, dimmed
// ─────────────────────────────────────────────────────────

const SHOW_KPIS = [
  { lbl: 'SHOWS',     col: 'var(--cyan)',   tipTitle: 'SHOWS ATTENDED', tip: 'Shows you\'ve been to',    source: '↗ phish.net' },
  { lbl: 'PHROZEN',   col: 'var(--orange)', tipTitle: 'PHROZEN',        tip: 'Shows you\'ve rated',      source: '↗ Phreezer'  },
  { lbl: 'AVG SCORE', col: 'var(--green)',  tipTitle: 'AVG SCORE',      tip: 'Your avg show rating',     source: '↗ Phreezer'  },
  { lbl: 'REVIEWED',  col: 'var(--cyan)',   tipTitle: 'REVIEWED',       tip: 'Shows with a review',      source: '↗ phish.net' },
];

const BADGE_LABELS = {
  century:    '100 CLUB',
  fifty:      '50 CLUB',
  quarter:    '25 CLUB',
  ten:        '10+ SHOWS',
  rated_100:  'HALL OF PHAME',
  rated_50:   'DEEP CUTS',
  rated_25:   'SCHOLAR',
  rated_10:   'SCHOOLED',
  rated_1:    '1ST FREEZE',
  critic:     'CRITIC',
  reviewer:   'REVIEWER',
  streak_30:  'ON FIRE',
  streak_7:   'WEEKLY',
};

const flipStyle = `
  .kpi-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.45s cubic-bezier(0.4, 0.2, 0.2, 1);
  }
  .kpi-card-inner.flipped { transform: rotateY(180deg); }
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
  .kpi-face-back { transform: rotateY(180deg); }
`;

function KPICard({ val, lbl, col, tip, tipTitle, source, isLast, flipped, onFlip }) {
  return (
    <div onClick={onFlip} style={{
      borderRight: isLast ? 'none' : '1px solid var(--border)',
      cursor: 'pointer',
      perspective: '600px',
      height: 96,
      position: 'relative',
      userSelect: 'none',
    }}>
      <div className={`kpi-card-inner${flipped ? ' flipped' : ''}`}>
        {/* FRONT */}
        <div className="kpi-face" style={{ padding: '12px 6px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: col, lineHeight: 1, textShadow: '0 0 16px currentColor' }}>
            {val}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'var(--text-muted)', letterSpacing: '2px', marginTop: 8 }}>
            {lbl}
          </div>
        </div>
        {/* BACK */}
        <div className="kpi-face kpi-face-back" style={{ background: 'var(--bg-elevated)', padding: '10px 8px', gap: 6 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', fontWeight: 700, color: col, letterSpacing: '1.5px', textShadow: '0 0 10px currentColor', textAlign: 'center' }}>
            {tipTitle}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.54rem', color: 'var(--white)', lineHeight: 1.5, textAlign: 'center', letterSpacing: '0.5px' }}>
            {tip}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: col, opacity: 0.65, textAlign: 'center', marginTop: 2 }}>
            {source}
          </div>
        </div>
      </div>
    </div>
  );
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

  const rated    = kpi.shows_rated || 0;
  const attended = kpi.shows_attended || 0;
  const streakPct = Math.min((kpi.login_streak || 0) / 30 * 100, 100);

  const cardData = [
    { ...SHOW_KPIS[0], val: attended },
    { ...SHOW_KPIS[1], val: rated },
    { ...SHOW_KPIS[2], val: kpi.avg_score ?? '—' },
    { ...SHOW_KPIS[3], val: kpi.shows_with_reviews },
  ];

  return (
    <div>
      <style>{flipStyle}</style>

      {/* ── KPI GRID ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderTop: '2px solid rgba(0,224,208,0.3)',
      }}>
        {cardData.map(({ val, lbl, col, tip, tipTitle, source }, i) => (
          <KPICard
            key={lbl} val={val} lbl={lbl} col={col}
            tip={tip} tipTitle={tipTitle} source={source}
            isLast={i === cardData.length - 1}
            flipped={flippedIndex === i}
            onFlip={() => setFlippedIndex(prev => prev === i ? null : i)}
          />
        ))}
      </div>

      {/* ── TAP HINT ── */}
      <div style={{
        background: 'var(--bg-panel)',
        padding: '6px 0',
        textAlign: 'center',
        border: '1px solid var(--border)',
        borderTop: 'none',
        marginBottom: 10,
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'rgba(0,224,208,0.75)', letterSpacing: '2.5px', fontWeight: 700 }}>
          ↕ TAP ANY STAT TO FLIP
        </span>
      </div>

      {/* ── QUICK PHREEZE ── */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderBottom: '2px solid rgba(255,102,0,0.25)' }}>

        {/* Section header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255,102,0,0.2)',
          background: 'rgba(255,102,0,0.04)',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '3px', fontWeight: 700, background: 'linear-gradient(90deg, #FF8C00 0%, #FFD700 40%, #FF6600 70%, #FF8C00 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 0 8px rgba(255,140,0,0.7)) drop-shadow(0 0 2px rgba(255,215,0,0.4))' }}>
            ◈ QUICK PHREEZE
          </span>
          <button onClick={onImport} style={{
            padding: '7px 14px', fontFamily: 'var(--font-display)', fontSize: '0.5rem',
            letterSpacing: '2px', border: '1px solid rgba(255,140,0,0.5)',
            background: 'transparent', cursor: 'pointer',
            background: 'linear-gradient(90deg, #FF8C00 0%, #FFD700 40%, #FF6600 70%, #FF8C00 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            filter: 'drop-shadow(0 0 5px rgba(255,140,0,0.5))',
          }}>↓ IMPORT</button>
        </div>

        <div style={{ padding: '12px 14px' }}>
          {/* Progress bars */}
          {(() => {
            const milestones = [5, 10, 25, 50, 100, 150, 200, 300, 500];
            const nextMilestone = (val) => milestones.find(m => m > val) || milestones[milestones.length - 1];
            const rows = [
              { lbl: 'SHOWS RATED',    val: rated,                  col: 'var(--orange)' },
              { lbl: 'SHOWS REVIEWED', val: kpi.shows_with_reviews, col: 'var(--cyan)'   },
              ...(kpi.login_streak > 1 ? [{ lbl: 'LOGIN STREAK', val: kpi.login_streak, col: 'var(--green)', isStreak: true }] : []),
            ];
            return rows.map(({ lbl, val, col, isStreak }) => {
              let fillPct, display, sub;
              if (isStreak) {
                const streakMilestones = [3, 7, 14, 30, 60, 100];
                const next = streakMilestones.find(m => m > val) || 100;
                fillPct = Math.min((val / next) * 100, 100);
                display = `⚡ ${val} DAYS`;
                sub = val >= 100 ? 'MAX STREAK' : `${next - val} TO ${next}`;
              } else {
                const next = nextMilestone(val);
                fillPct = Math.min((val / next) * 100, 100);
                display = `${val}`;
                sub = val >= next ? 'MILESTONE HIT' : `${next - val} TO ${next}`;
              }
              return (
                <div key={lbl} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: 'var(--font-display)', fontSize: '0.54rem', letterSpacing: '1.5px', color: 'var(--text-label)', marginBottom: 6 }}>
                    <span>{lbl}</span>
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ color: col, fontSize: '0.7rem' }}>{display}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.46rem' }}>{sub}</span>
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(51,255,51,0.08)' }}>
                    <div style={{ width: `${fillPct}%`, height: '100%', background: col, boxShadow: `0 0 6px ${col}`, transition: 'width 0.6s' }} />
                  </div>
                </div>
              );
            });
          })()}

          {/* Badges */}
          {kpi.badges && kpi.badges.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4, paddingTop: 12, borderTop: '1px solid rgba(51,255,51,0.08)' }}>
              {kpi.badges.map(b => (
                <div key={b.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px',
                  border: '1px solid rgba(51,255,51,0.25)',
                  background: 'rgba(51,255,51,0.04)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.52rem',
                  color: 'var(--green)',
                  letterSpacing: '1.5px',
                  whiteSpace: 'nowrap',
                }}>
                  <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>{b.glyph}</span>
                  {BADGE_LABELS[b.id] || b.label}
                </div>
              ))}
            </div>
          )}

          {/* Top stats */}
          {(kpi.top_song || kpi.top_venue || kpi.first_show) && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(51,255,51,0.08)', borderLeft: '3px solid var(--orange)', paddingLeft: 12 }}>
              {[
                kpi.top_song   ? ['TOP RATED SONG', kpi.top_song.song_name,     `(${kpi.top_song.avg})`,     'var(--orange)'] : null,
                kpi.top_venue  ? ['TOP VENUE',       kpi.top_venue.venue,        `(${kpi.top_venue.shows}x)`, 'var(--cyan)']   : null,
                kpi.first_show ? ['FIRST SHOW',      formatDate(kpi.first_show), '',                          'var(--cyan)']   : null,
              ].filter(Boolean).map(([l, v, s, col], i, arr) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'var(--text-label)', letterSpacing: '1.5px', flexShrink: 0 }}>{l}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: 'var(--white)', textAlign: 'right', marginLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v} <span style={{ color: col, fontSize: '0.76rem' }}>{s}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Deep Phreeze */}
          <div
            onClick={() => onDeepPhreeze && onDeepPhreeze()}
            style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(0,224,208,0.1)', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '0.52rem', letterSpacing: '2.5px', fontWeight: 700, color: 'rgba(0,224,208,0.75)', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(0,224,208,0.3)' }}
          >
            ❄ DIVE INTO DEEP PHREEZE ▶
          </div>
        </div>
      </div>
    </div>
  );
}



