import React, { useState, useEffect } from 'react';

export function SaveCelebration({ onDone }) {
  const onDoneRef = React.useRef(onDone);
  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current?.(), 2800);
    return () => clearTimeout(t);
  }, []);
  const glyphs = ['★','◈','✦','◉','⬡','⬢','✧','◆'];
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    glyph: glyphs[i % glyphs.length],
    x: Math.random() * 100,
    delay: Math.random() * 0.4,
    dur: 1.2 + Math.random() * 0.8,
    color: i % 3 === 0 ? 'var(--orange)' : i % 3 === 1 ? 'var(--cyan)' : 'var(--green)',
  }));
  return (
    <div className="celebrate-overlay">
      <div className="celebrate-burst">
        {particles.map(p => (
          <span key={p.id} className="celebrate-particle" style={{
            left: `${p.x}%`, color: p.color,
            animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`,
          }}>{p.glyph}</span>
        ))}
      </div>
      <div className="celebrate-msg">
        <span className="celebrate-main">RATINGS LOCKED IN</span>
        <span className="celebrate-sub">◈ DON'T SUCK AT PHISH ◈</span>
      </div>
    </div>
  );
}

// Pool of rotating Phish inside-joke boot lines
// 2 are picked randomly each login — keeps it fresh for returning users
const JOKE_LINES = [
  'INITIATING SIREN LOOPS...........OK',
  'CHILLING THE PHREEZER............OK',
  'EXTRACTING THE JAMS..............OK',
  'READING THE BOOK.................OK',
  'LOCATING THE LIZARDS.............OK',
  'NOTIFYING WILSON.................OK',
  'CONSULTING ICCULUS...............OK',
  'CALCULATING TUBE TIME............OK',
];

function pickJokeLines(count = 2) {
  const shuffled = [...JOKE_LINES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function WelcomeCelebration({ username, onDone }) {
  const onDoneRef = React.useRef(onDone);
  const [visible, setVisible] = useState([]);

  // Pick joke lines once on mount — stable for this render
  const jokeLines = React.useRef(pickJokeLines(2)).current;

  const lines = [
    { text: 'PHREEZER v2.0 — INITIALIZING...', delay: 0 },
    { text: 'LOADING SHOW DATABASE............OK', delay: 600 },
    { text: jokeLines[0], delay: 1200 },
    { text: jokeLines[1], delay: 1800 },
    { text: `IDENTITY CONFIRMED: ${(username || 'PHREEK').toUpperCase()}`, delay: 2600, accent: true },
    { text: "DON'T SUCK AT PHISH.", delay: 3500, big: true },
  ];

  useEffect(() => {
    lines.forEach((l, i) => {
      setTimeout(() => setVisible(v => [...v, i]), l.delay);
    });
    const t = setTimeout(() => onDoneRef.current?.(), 5800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="celebrate-overlay"
      onClick={() => onDoneRef.current?.()}
      style={{ cursor: 'pointer', background: 'rgba(0,0,0,0.97)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 0, padding: '60px 40px', maxWidth: 680, width: '100%',
      }}>
        {/* Snowflake */}
        <img
          src="/assets/phreezer-snowflake.png"
          alt="Phreezer"
          style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 40,
            filter: 'drop-shadow(0 0 20px rgba(0,224,208,0.7))',
            animation: 'spin 4s linear infinite',
          }}
        />
        {/* Boot lines */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {lines.map((line, i) => (
            visible.includes(i) && (
              <div key={i} style={{
                fontFamily: 'var(--font-mono)',
                fontSize: line.big ? '1.6rem' : line.accent ? '1.1rem' : '0.95rem',
                color: line.big ? 'var(--orange)' : line.accent ? 'var(--cyan)' : 'rgba(51,255,51,0.85)',
                letterSpacing: line.big ? '6px' : line.accent ? '4px' : '2px',
                textShadow: line.big
                  ? '0 0 30px rgba(255,102,0,0.7)'
                  : line.accent
                  ? '0 0 20px rgba(0,224,208,0.6)'
                  : '0 0 8px rgba(51,255,51,0.3)',
                animation: 'fadeIn 0.4s ease',
                textAlign: 'center',
                lineHeight: 1.4,
              }}>{line.text}</div>
            )
          ))}
        </div>
        <div style={{ marginTop: 48, fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '3px' }}>
          TAP TO SKIP
        </div>
      </div>
    </div>
  );
}
