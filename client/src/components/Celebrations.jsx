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

// Pool of rotating Phish inside-joke boot lines
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

// Typewriter hook — types out text char by char at given speed
function useTypewriter(lines, charDelay = 38, lineGap = 320) {
  // completedLines: array of fully typed strings
  // currentLine: index of line being typed
  // currentChars: how many chars of current line are visible
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
      // Type next character
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
      // Line complete — pause then move to next
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
  const jokeLines = useRef(pickJokeLines(2)).current;

  const lines = [
    { text: 'PHREEZER v2.0 — INITIALIZING...', pauseAfter: 200 },
    { text: 'LOADING SHOW DATABASE............OK', pauseAfter: 120 },
    { text: jokeLines[0], pauseAfter: 120 },
    { text: jokeLines[1], pauseAfter: 300 },
    { text: `IDENTITY CONFIRMED: ${(username || 'PHREEK').toUpperCase()}`, pauseAfter: 500, accent: true },
    { text: "DON'T SUCK AT PHISH.", pauseAfter: 9999, big: true },
  ];

  const { completedLines, currentLine, currentText, done } = useTypewriter(lines, 36, 300);

  // Auto-dismiss after big line finishes typing
  useEffect(() => {
    if (currentLine >= lines.length - 1 && currentText === lines[lines.length - 1]?.text) {
      const t = setTimeout(() => onDoneRef.current?.(), 2200);
      return () => clearTimeout(t);
    }
  }, [currentLine, currentText]);

  const renderLine = (text, meta, key, isTyping = false) => {
    const isBig = meta?.big;
    const isAccent = meta?.accent;
    return (
      <div key={key} style={{
        fontFamily: isBig ? 'var(--font-display)' : 'var(--font-mono)',
        fontSize: isBig
          ? 'clamp(1.1rem, 4.5vw, 1.8rem)'
          : isAccent
          ? 'clamp(0.82rem, 2.8vw, 1.15rem)'
          : 'clamp(0.7rem, 2.4vw, 1rem)',
        color: isBig ? 'var(--orange)' : isAccent ? 'var(--cyan)' : 'rgba(51,255,51,0.85)',
        letterSpacing: isBig ? '8px' : isAccent ? '5px' : '3px',
        textShadow: isBig
          ? '0 0 40px rgba(255,102,0,0.7)'
          : isAccent
          ? '0 0 24px rgba(0,224,208,0.7)'
          : '0 0 10px rgba(51,255,51,0.3)',
        textAlign: 'center',
        lineHeight: 1.5,
        whiteSpace: 'pre',
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
      className="celebrate-overlay"
      onClick={() => onDoneRef.current?.()}
      style={{
        cursor: 'pointer',
        background: 'rgba(0,0,0,0.97)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
            width: 'clamp(56px, 14vw, 90px)',
            height: 'clamp(56px, 14vw, 90px)',
            objectFit: 'contain',
            marginBottom: 'clamp(20px, 5vw, 44px)',
            filter: 'drop-shadow(0 0 24px rgba(0,224,208,0.65))',
          }}
        />

        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(10px, 3vw, 20px)',
        }}>
          {/* Completed lines */}
          {completedLines.map((line, i) => renderLine(line.text, line, `done-${i}`, false))}

          {/* Currently typing line */}
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
