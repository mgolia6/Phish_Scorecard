import React, { useState, useEffect, useRef } from 'react';

const SNOWFLAKES = ['❄','❅','❆'];

const BADGE_CONFIG = {
  phab_phive:  { icon: 'snowflake', glyph: null,  color: 'var(--cyan)',   shadow: 'rgba(0,224,208,0.8)',  sub: 'ONE OF THE FIRST FIVE',   pulse: true },
  early_phreeze:{ icon: 'snowflake', glyph: null,  color: 'var(--cyan)',   shadow: 'rgba(0,224,208,0.7)',  sub: 'FOUNDER — TOP 20',         pulse: false },
  ten:         { icon: 'glyph',     glyph: '◈',   color: 'var(--green)',  shadow: 'rgba(51,255,51,0.8)',  sub: '10 SHOWS ATTENDED',        pulse: false },
  quarter:     { icon: 'glyph',     glyph: '⬡',   color: 'var(--green)',  shadow: 'rgba(51,255,51,0.8)',  sub: '25 SHOWS ATTENDED',        pulse: false },
  fifty:       { icon: 'glyph',     glyph: '⬢',   color: 'var(--green)',  shadow: 'rgba(51,255,51,0.9)',  sub: '50 SHOWS ATTENDED',        pulse: true  },
  century:     { icon: 'emoji',     glyph: '💯',   color: 'var(--orange)', shadow: 'rgba(255,102,0,0.9)',  sub: '100 SHOWS ATTENDED',       pulse: true  },
  rated_1:     { icon: 'glyph',     glyph: '①',   color: 'var(--cyan)',   shadow: 'rgba(0,224,208,0.9)',  sub: 'FIRST SHOW RATED',         pulse: true  },
  rated_10:    { icon: 'glyph',     glyph: '✦',   color: 'var(--cyan)',   shadow: 'rgba(0,224,208,0.8)',  sub: '10 SHOWS RATED',           pulse: false },
  rated_25:    { icon: 'glyph',     glyph: '◆',   color: 'var(--cyan)',   shadow: 'rgba(0,224,208,0.8)',  sub: '25 SHOWS RATED',           pulse: false },
  rated_50:    { icon: 'glyph',     glyph: '◈',   color: 'var(--cyan)',   shadow: 'rgba(0,224,208,0.9)',  sub: '50 SHOWS RATED',           pulse: true  },
  rated_100:   { icon: 'glyph',     glyph: '★',   color: 'var(--orange)', shadow: 'rgba(255,102,0,1)',    sub: '100 SHOWS RATED',          pulse: true  },
  critic:      { icon: 'glyph',     glyph: '✍',   color: 'var(--orange)', shadow: 'rgba(255,102,0,0.8)',  sub: 'PHISH.NET REVIEWER',       pulse: false },
  streak_7:    { icon: 'glyph',     glyph: '⚡',   color: 'var(--green)',  shadow: 'rgba(51,255,51,0.8)',  sub: '7 DAY LOGIN STREAK',       pulse: false },
  streak_30:   { icon: 'glyph',     glyph: '⚡',   color: 'var(--orange)', shadow: 'rgba(255,102,0,1)',    sub: '30 DAY LOGIN STREAK',      pulse: true  },
  first_bug:   { icon: 'emoji',     glyph: '🐛',   color: 'var(--orange)', shadow: 'rgba(255,102,0,0.9)',  sub: 'IT DOES MATTER',           pulse: true  },
};

function Particles({ color }) {
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    glyph: SNOWFLAKES[i % SNOWFLAKES.length],
    left: 3 + Math.random() * 94,
    bottom: Math.random() * 25,
    size: 0.6 + Math.random() * 1,
    delay: Math.random() * 1,
    dur: 1.8 + Math.random() * 1.4,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map(p => (
        <span key={p.id} style={{
          position: 'absolute',
          left: `${p.left}%`,
          bottom: `${p.bottom}%`,
          fontSize: `${p.size}rem`,
          color,
          filter: `drop-shadow(0 0 5px ${color})`,
          animation: `badgeParticleRise ${p.dur}s ${p.delay}s linear forwards`,
          opacity: 0,
        }}>{p.glyph}</span>
      ))}
    </div>
  );
}

function PulseRings({ color, count = 2 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: 120, height: 120,
          borderRadius: '50%',
          border: `1px solid ${color}`,
          opacity: 0,
          animation: `badgePulseRing 1.4s ${i * 0.4}s ease-out forwards`,
        }} />
      ))}
    </>
  );
}

export function BadgeCelebration({ badge, onDone }) {
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  const cfg = BADGE_CONFIG[badge?.badge_key] || BADGE_CONFIG['rated_1'];
  const label = badge?.badge_label || badge?.badge_key?.toUpperCase() || 'ACHIEVEMENT';
  const particleColor = cfg.shadow.replace(/[\d.]+\)$/, '0.9)');

  // Auto-dismiss after 5s
  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current?.(), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @keyframes badgeParticleRise {
          0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(-400px) rotate(540deg) scale(0.4); opacity: 0; }
        }
        @keyframes badgePulseRing {
          0%   { transform: scale(0.6); opacity: 0.7; }
          100% { transform: scale(3.5); opacity: 0; }
        }
        @keyframes badgePopIn {
          0%   { transform: scale(0) rotate(-12deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes badgeFadeUp {
          0%   { transform: translateY(14px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div
        onClick={() => onDoneRef.current?.()}
        style={{
          position: 'fixed', inset: 0, zIndex: 5000,
          background: 'rgba(0,0,0,0.97)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Particles color={particleColor} />
        {cfg.pulse && <PulseRings color={cfg.shadow} count={cfg.color === 'var(--orange)' ? 3 : 2} />}

        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 22, zIndex: 2, textAlign: 'center', padding: '0 32px',
        }}>
          {/* ACHIEVEMENT UNLOCKED tag */}
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '0.35rem',
            letterSpacing: '5px', color: 'rgba(255,255,255,0.18)',
            animation: 'badgeFadeUp 0.3s 0.1s ease forwards', opacity: 0,
          }}>ACHIEVEMENT UNLOCKED</div>

          {/* Badge icon */}
          <div style={{
            animation: 'badgePopIn 0.5s 0.15s cubic-bezier(0.34,1.56,0.64,1) forwards',
            opacity: 0,
          }}>
            {cfg.icon === 'snowflake' ? (
              <img
                src="/assets/phreezer-snowflake.png"
                alt="badge"
                style={{
                  width: 90, height: 90, objectFit: 'contain',
                  filter: `drop-shadow(0 0 28px ${cfg.shadow}) drop-shadow(0 0 8px ${cfg.shadow})`,
                }}
              />
            ) : (
              <span style={{
                fontSize: cfg.icon === 'emoji' ? '4.5rem' : '4rem',
                fontFamily: cfg.icon === 'glyph' ? 'var(--font-mono)' : undefined,
                color: cfg.color,
                filter: `drop-shadow(0 0 30px ${cfg.shadow})`,
                lineHeight: 1,
              }}>{cfg.glyph}</span>
            )}
          </div>

          {/* Badge name */}
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.2rem, 5vw, 1.8rem)',
            letterSpacing: '6px',
            color: cfg.color,
            textShadow: `0 0 40px ${cfg.shadow}`,
            animation: 'badgeFadeUp 0.4s 0.35s ease forwards', opacity: 0,
          }}>{label}</div>

          {/* Sub label */}
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '0.38rem',
            letterSpacing: '4px', color: cfg.color.replace(')', ', 0.45)').replace('var(', 'rgba(').replace('--cyan', '0,224,208').replace('--green', '51,255,51').replace('--orange', '255,102,0'),
            animation: 'badgeFadeUp 0.4s 0.55s ease forwards', opacity: 0,
            marginTop: -8,
          }}>{cfg.sub}</div>
        </div>

        {/* Tap hint */}
        <div style={{
          position: 'absolute', bottom: 32,
          fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
          letterSpacing: '2px', color: 'rgba(51,255,51,0.15)',
          animation: 'badgeFadeUp 0.4s 1.2s ease forwards', opacity: 0,
        }}>TAP TO CONTINUE</div>
      </div>
    </>
  );
}

// Queue manager — shows badges one at a time
export function BadgeQueue({ badges, onAllDone }) {
  const [index, setIndex] = useState(0);

  if (!badges?.length || index >= badges.length) return null;

  const handleDone = () => {
    if (index + 1 >= badges.length) {
      onAllDone?.();
    } else {
      setIndex(i => i + 1);
    }
  };

  return <BadgeCelebration badge={badges[index]} onDone={handleDone} />;
}
