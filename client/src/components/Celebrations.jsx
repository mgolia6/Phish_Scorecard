import React, { useState, useEffect, useRef } from 'react';

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

// Pool of rotating Phish inside-joke boot lines (one picked per session)
const JOKE_LINES = [
  'INITIATING SIREN LOOPS...........',
  'CHILLING THE PHREEZER............',
  'EXTRACTING THE JAMS..............',
  'READING THE BOOK.................',
  'LOCATING THE LIZARDS.............',
  'NOTIFYING WILSON.................',
  'CONSULTING ICCULUS...............',
  'CALCULATING TUBE TIME............',
];

function pickJokeLine() {
  return JOKE_LINES[Math.floor(Math.random() * JOKE_LINES.length)];
}

// Typewriter hook — types out text char by char at given speed
function useTypewriter(lines, charDelay = 38, lineGap = 320) {
  const [completedLines, setCompletedLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChars, setCurrentChars] = useState(0);
  const [done, setDone] = useState(false);
  const rafRef = useRef(null);
  const lastTickRef = useRef(null);

  useEffect(() => {
    if (currentLine >= lines.length) { setDone(true); return; }

    const line = lines[currentLine];
    const totalChars = line.text.length;

    if (currentChars < totalChars) {
      const tick = () => {
        const now = Date.now();
        if (!lastTickRef.current) lastTickRef.current = now;
        const elapsed = now - lastTickRef.current;
        if (elapsed >= charDelay) {
          lastTickRef.current = now;
          setCurrentChars(c => c + 1);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    } else {
      const t = setTimeout(() => {
        setCompletedLines(prev => [...prev, line]);
        setCurrentLine(l => l + 1);
        setCurrentChars(0);
        lastTickRef.current = null;
      }, line.pauseAfter !== undefined ? line.pauseAfter : lineGap);
      return () => clearTimeout(t);
    }
  }, [currentLine, currentChars, lines]);

  const currentText = currentLine < lines.length
    ? lines[currentLine].text.slice(0, currentChars)
    : null;

  return { completedLines, currentLine, currentText, done };
}

export function WelcomeCelebration({ username, onDone }) {
  const onDoneRef = useRef(onDone);
  const jokeLine = useRef(pickJokeLine()).current;

  // Boot sequence:
  // 1. INITIALIZING — cursor sits 900ms before next line starts
  // 2. One joke line — cursor sits 700ms after completion
  // 3. OK — just two chars, then pause 600ms
  // 4. IDENTITY CONFIRMED
  // 5. DON'T SUCK
  // 6. AT PHISH.
  const lines = [
    { text: 'PHREEZER v2.0 — INITIALIZING...', pauseAfter: 900 },
    { text: jokeLine,                          pauseAfter: 700 },
    { text: 'OK',                              pauseAfter: 600, ok: true },
    { text: `IDENTITY CONFIRMED: ${(username || 'PHREEK').toUpperCase()}`, pauseAfter: 500, accent: true },
    { text: "DON'T SUCK",                      pauseAfter: 180, big: true },
    { text: 'AT PHISH.',                       pauseAfter: 9999, big: true },
  ];

  const { completedLines, currentLine, currentText } = useTypewriter(lines, 36, 300);

  const [melting, setMelting] = useState(false);
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    if (currentLine >= lines.length - 1 && currentText === lines[lines.length - 1]?.text) {
      // Snowflake melts/drips first, then the screen glitches out.
      const tMelt = setTimeout(() => setMelting(true), 80);
      const t1 = setTimeout(() => setGlitching(true), 760);
      const t2 = setTimeout(() => onDoneRef.current?.(), 2160);
      return () => { clearTimeout(tMelt); clearTimeout(t1); clearTimeout(t2); };
    }
  }, [currentLine, currentText]);

  const renderLine = (text, meta, key, isTyping = false) => {
    const isBig = meta?.big;
    const isAccent = meta?.accent;
    const isOk = meta?.ok;
    return (
      <div key={key} style={{
        fontFamily: isBig ? 'var(--font-display)' : 'var(--font-mono)',
        fontSize: isBig
          ? 'clamp(1.1rem, 4.5vw, 1.8rem)'
          : isAccent
          ? 'clamp(0.82rem, 2.8vw, 1.15rem)'
          : 'clamp(0.7rem, 2.4vw, 1rem)',
        color: isBig ? 'var(--orange)' : isAccent ? 'var(--cyan)' : isOk ? 'var(--green)' : 'rgba(51,255,51,0.85)',
        letterSpacing: isBig ? '8px' : isAccent ? '5px' : '3px',
        textShadow: isBig
          ? '0 0 40px rgba(255,102,0,0.7)'
          : isAccent
          ? '0 0 24px rgba(0,224,208,0.7)'
          : isOk
          ? '0 0 16px rgba(51,255,51,0.9)'
          : '0 0 10px rgba(51,255,51,0.3)',
        textAlign: 'center',
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
      }}>
        {text}
        {isTyping && (
          <span style={{
            display: 'inline-block',
            width: '0.6em',
            background: isBig ? 'var(--orange)' : isAccent ? 'var(--cyan)' : 'rgba(51,255,51,0.85)',
            marginLeft: 2,
            verticalAlign: 'middle',
            height: '1em',
            animation: 'cursorBlink 0.7s step-end infinite',
          }} />
        )}
      </div>
    );
  };

  return (
    <div
      className={`celebrate-overlay${glitching ? ' boot-glitch' : ''}`}
      onClick={() => onDoneRef.current?.()}
      style={{
        cursor: 'pointer',
        background: 'rgba(0,0,0,0.97)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: glitching ? 'opacity 0.4s ease' : 'none',
        opacity: glitching ? 0 : 1,
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 clamp(16px, 4vw, 32px)',
        maxWidth: 720,
        width: '100%',
      }}>
        <img
          src="/assets/phreezer-snowflake.png"
          alt=""
          style={{
            width: 'clamp(150px, 40vw, 240px)',
            height: 'clamp(150px, 40vw, 240px)',
            objectFit: 'contain',
            marginBottom: 'clamp(28px, 6vw, 52px)',
            transformOrigin: 'bottom center',
            filter: 'drop-shadow(0 0 24px rgba(0,224,208,0.65))',
            animation: melting ? 'snowflakeMelt 0.7s ease-in forwards' : 'none',
          }}
        />

        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(10px, 3vw, 20px)',
        }}>
          {completedLines.map((line, i) => renderLine(line.text, line, `done-${i}`, false))}
          {currentLine < lines.length && currentText !== null && (
            renderLine(currentText, lines[currentLine], 'current', true)
          )}
        </div>

        {completedLines.length >= 2 && (
          <div style={{
            marginTop: 'clamp(24px, 6vw, 56px)',
            fontFamily: 'var(--font-display)',
            fontSize: '0.42rem',
            color: 'rgba(255,255,255,0.18)',
            letterSpacing: '4px',
          }}>
            TAP TO SKIP
          </div>
        )}
      </div>
    </div>
  );
}
