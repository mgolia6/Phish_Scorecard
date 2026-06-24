import React, { useState } from 'react';

const STEPS = [
  {
    glyph: '❄',
    glyphColor: 'var(--orange)',
    title: 'YOU MADE IT IN.',
    subtitle: 'A MESSAGE FROM UNCLE EBENEZER',
    body: "I've been here a while. I know where everything is. Let me show you around — it'll take two minutes, and unlike most opening acts, I'll be worth your time.",
  },
  {
    glyph: '◈',
    glyphColor: 'var(--orange)',
    title: 'SCORECARD',
    subtitle: 'RATE · EVERY · SONG',
    body: "Search any show. Rate every song 1–5. The jam that peaked perfectly. The bust-out that didn't land. The segue you'll be thinking about in ten years. Score it all. This is the core of everything.",
  },
  {
    glyph: '◉',
    glyphColor: 'var(--cyan)',
    title: 'MY SHOWS',
    subtitle: 'MY PHREEZER',
    body: "Every show you've attended or rated lives here. Connect your Phish.net account in your profile and your full attendance history imports in seconds.",
  },
  {
    glyph: '◈',
    glyphColor: 'var(--green)',
    title: 'ON THIS DAY',
    subtitle: 'TODAY IN PHISH HISTORY',
    body: "Every show Phish has ever played on today's date — right at the top. Tap through them. If you were there, it's marked. If you've rated it, it's phrozen.",
  },
  {
    glyph: '❄',
    glyphColor: 'var(--cyan)',
    title: 'DEEP PHREEZE',
    subtitle: 'YOUR STATS ENGINE',
    body: "Top songs, top venues, era breakdown, show frequency. The more you rate, the more it tells you. This is where your taste becomes visible — more honestly than anything you'd say out loud.",
  },
  {
    glyph: '★',
    glyphColor: 'var(--orange)',
    title: 'COMMUNITY',
    subtitle: 'LEADERBOARD · TOP SHOWS · TOP SONGS',
    body: "See how the community hears things. Leaderboard, top shows, top songs, top venues. Where you stand. What everyone else thinks. Whether they're wrong.",
  },
  {
    glyph: '❄',
    glyphColor: 'var(--orange)',
    title: 'UNCLE EBENEZER',
    subtitle: 'ASK ME ANYTHING',
    body: "I know your show history. I know your ratings. I have opinions about both. Find me in the corner of the app — on desktop I'm in the right rail, on mobile tap the ❄ button. Ask me anything.",
  },
  {
    glyph: '⚇',
    glyphColor: 'var(--cyan)',
    title: 'YOUR PROFILE',
    subtitle: 'AVATAR · SETTINGS · SHOP · ABOUT',
    body: "Tap your avatar to get in. Connect Phish.net, set your preferences, pick your avatar. Also where you'll find ABOUT — the story behind the app — and SHOP, if you want to represent at lot.",
  },
  {
    glyph: '❄',
    glyphColor: 'var(--orange)',
    title: "THAT'S THE PLACE.",
    subtitle: 'GO RATE SOMETHING',
    body: "Now go rate something. I'll be in the corner if you need me.\n\nDon't suck at Phish.",
    isOutro: true,
  },
];

export function TourGuide({ onComplete }) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setStepIdx(i => i + 1);
    }
  };

  const handleSkip = () => onComplete();

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 400,
        background: '#0d0d0d',
        border: '1px solid rgba(var(--ink-rgb),0.07)',
        borderTop: `2px solid ${step.glyphColor}`,
        display: 'flex', flexDirection: 'column',
        boxShadow: `0 0 48px ${step.glyphColor}18`,
        maxHeight: '90vh',
        overflow: 'hidden',
      }}>

        {/* Glyph hero */}
        <div style={{
          padding: '28px 24px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: 'var(--inset)',
          borderBottom: `1px solid ${step.glyphColor}22`,
        }}>
          <div style={{
            fontSize: '3.2rem',
            color: step.glyphColor,
            textShadow: `0 0 30px ${step.glyphColor}88`,
            marginBottom: 16,
            lineHeight: 1,
          }}>
            {step.glyph}
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.56rem',
            letterSpacing: '3px',
            color: `${step.glyphColor}88`,
            marginBottom: 8,
          }}>
            {step.subtitle}
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.85rem',
            letterSpacing: '3px',
            color: step.glyphColor,
            fontWeight: 700,
            textAlign: 'center',
          }}>
            {step.title}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 0', flex: 1, overflowY: 'auto' }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.76rem',
            color: 'rgba(var(--ink-rgb),0.58)',
            lineHeight: 1.85,
            margin: 0,
            whiteSpace: 'pre-line',
          }}>
            {step.body}
          </p>
        </div>

        {/* Progress dots */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 6,
          padding: '20px 24px 4px',
        }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === stepIdx ? 18 : 6,
              height: 6,
              borderRadius: 3,
              background: i === stepIdx ? step.glyphColor : 'rgba(var(--ink-rgb),0.12)',
              transition: 'all 0.25s',
            }} />
          ))}
        </div>

        {/* Actions */}
        <div style={{ padding: '12px 24px 24px', display: 'flex', gap: 10, alignItems: 'center' }}>
          {!step.isOutro && (
            <button
              onClick={handleSkip}
              style={{
                fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2px',
                color: 'rgba(var(--ink-rgb),0.18)', background: 'transparent',
                border: '1px solid rgba(var(--ink-rgb),0.08)', cursor: 'pointer',
                padding: '11px 14px', whiteSpace: 'nowrap',
              }}
            >
              SKIP
            </button>
          )}
          <button
            onClick={handleNext}
            style={{
              flex: 1, padding: '13px',
              fontFamily: 'var(--font-display)', fontSize: '0.66rem', letterSpacing: '3px',
              background: step.glyphColor, color: '#000',
              border: 'none', cursor: 'pointer', fontWeight: 700,
            }}
          >
            {isLast ? "LET'S GO" : stepIdx === 0 ? 'SHOW ME AROUND' : 'NEXT →'}
          </button>
        </div>

      </div>
    </div>
  );
}
