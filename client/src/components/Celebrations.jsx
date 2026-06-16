import React, { useEffect } from 'react';

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

export function WelcomeCelebration({ username, onDone }) {
  const onDoneRef = React.useRef(onDone);
  const [visible, setVisible] = React.useState([]);

  const lines = [
    { text: 'PHREEZER v2.0 — INITIALIZING...', delay: 0 },
    { text: 'LOADING SHOW DATABASE............OK', delay: 350 },
    { text: 'AUTHENTICATING SESSION...........OK', delay: 700 },
    { text: `IDENTITY CONFIRMED: ${(username || 'PHREEK').toUpperCase()}`, delay: 1100, accent: true },
    { text: "DON'T SUCK AT PHISH.", delay: 1700, big: true },
  ];

  useEffect(() => {
    lines.forEach((l, i) => {
      setTimeout(() => setVisible(v => [...v, i]), l.delay);
    });
    const t = setTimeout(() => onDoneRef.current?.(), 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="celebrate-overlay"
      style={{ cursor: 'pointer', background: 'rgba(0,0,0,0.97)', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '0 10vw' }}
      onClick={() => onDoneRef.current?.()}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.38rem', letterSpacing: '3px', color: 'rgba(0,224,208,0.4)', marginBottom: 24 }}>
        PHREEZER SYSTEMS
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{
          fontFamily: l.big ? 'var(--font-display)' : 'var(--font-mono)',
          fontSize: l.big ? '1.2rem' : '0.72rem',
          color: l.big ? 'var(--orange)' : l.accent ? 'var(--cyan)' : 'rgba(51,255,51,0.55)',
          letterSpacing: l.big ? '4px' : '1px',
          marginBottom: l.big ? 0 : 8,
          marginTop: l.big ? 20 : 0,
          textShadow: l.big ? '0 0 20px rgba(255,102,0,0.6)' : 'none',
          opacity: visible.includes(i) ? 1 : 0,
          transition: 'opacity 0.3s ease',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {!l.big && (
            <span style={{ color: 'rgba(51,255,51,0.25)', flexShrink: 0 }}>›</span>
          )}
          {l.text}
          {i === visible[visible.length - 1] && !l.big && (
            <span style={{ animation: 'blink 1s step-end infinite' }}>▌</span>
          )}
        </div>
      ))}
      <div style={{ marginTop: 36, fontFamily: 'var(--font-display)', fontSize: '0.3rem', color: 'rgba(255,255,255,0.12)', letterSpacing: '2px' }}>
        TAP TO SKIP
      </div>
    </div>
  );
}) {
  const onDoneRef = React.useRef(onDone);
  const lyrics = [
    "We're glad, glad, glad that you've arrived!",
    "We're glad glad glad that you've arrived.",
    "Welcome. This is our farmhouse. We have cluster flies, alas.",
    "You're already there.",
    "It took me a long time to get back on the train.",
    "The long night's over and the sun's coming up.",
    "I'm going down to the central part of town.",
    "This is what space smells like.",
    "We're all in this together and we love to take a bath.",
    "Flipping backward through the doors and through the windows.",
  ];
  const lyric = lyrics[Math.floor(Math.random() * lyrics.length)];

  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current?.(), 3200);
    return () => clearTimeout(t);
  }, []);

  const glyphs = ['★','◈','✦','◉','⬡','❄','✧','◆'];
  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    glyph: glyphs[i % glyphs.length],
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    dur: 1.4 + Math.random() * 0.8,
    color: i % 3 === 0 ? 'var(--orange)' : i % 3 === 1 ? 'var(--cyan)' : 'var(--green)',
  }));

  return (
    <div className="celebrate-overlay" style={{ cursor: 'pointer' }} onClick={() => onDoneRef.current?.()}>
      <div className="celebrate-burst">
        {particles.map(p => (
          <span key={p.id} className="celebrate-particle" style={{
            left: `${p.x}%`, color: p.color,
            animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`,
          }}>{p.glyph}</span>
        ))}
      </div>
      <div className="celebrate-msg">
        <span className="celebrate-main" style={{ fontSize: '1.4rem', letterSpacing: '3px' }}>
          {username ? `WELCOME BACK, ${username.toUpperCase()}` : 'WELCOME BACK'}
        </span>
        <span className="celebrate-sub" style={{ fontSize: '0.82rem', fontStyle: 'italic', letterSpacing: '2px', maxWidth: 320, textAlign: 'center', lineHeight: 1.5 }}>
          "{lyric}"
        </span>
        <span style={{ fontSize: '0.55rem', color: 'rgba(51,255,51,0.3)', letterSpacing: '2px', marginTop: 16 }}>
          TAP TO DISMISS
        </span>
      </div>
    </div>
  );
}

