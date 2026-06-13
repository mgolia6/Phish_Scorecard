import React, { useState, useEffect, useRef, useCallback } from 'react';

const STEPS = [
  {
    tab: 'my-shows',
    target: 'otd',
    position: 'below',
    title: 'ON THIS DAY',
    body: "Every show Phish has ever played on today's date. Tap through them. If you were there, it's marked. If you've rated it, it's phrozen.",
  },
  {
    tab: 'scorecard',
    target: 'scorecard',
    position: 'right',
    title: 'SCORECARD',
    body: "Search any show and rate it song by song, 1–5. This is the core of everything. The more you rate, the more the rest of the app means something.",
  },
  {
    tab: 'my-shows',
    target: 'my-phreezer',
    position: 'right',
    title: 'MY PHREEZER',
    body: "Your shows, your songs, your venues, your states. Everything you've attended or rated lives here.",
  },
  {
    tab: 'my-deep-phreeze',
    target: 'deep-phreeze',
    position: 'right',
    title: 'DEEP PHREEZE',
    body: "Your personal stats engine. Top songs, top venues, era breakdown, show frequency. Gets more interesting every time you rate.",
  },
  {
    tab: 'community',
    target: 'community',
    position: 'right',
    title: 'COMMUNITY',
    body: "Leaderboard, top shows, top songs, top venues. See how the community hears things — and where you stand.",
  },
  {
    tab: 'my-shows',
    target: 'ebenezer',
    position: 'left',
    title: 'UNCLE EBENEZER',
    body: "That's me. I know your show history, your ratings, and I have opinions about both. Ask me anything.",
  },
  {
    tab: 'my-shows',
    target: 'profile-avatar',
    position: 'below',
    title: 'YOUR PROFILE',
    body: "Tap here to connect your Phish.net account, set preferences, pick your avatar — and find ABOUT and SHOP.",
  },
];

const PAD = 10;

// Find the target element — handles display:contents by falling through to first real child
function findElement(target) {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  // If the wrapper is display:contents, it has no layout box — use first child instead
  const style = window.getComputedStyle(el);
  if (style.display === 'contents') {
    return el.firstElementChild || null;
  }
  return el;
}

function getRect(target) {
  const el = findElement(target);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return {
    top:     r.top    - PAD,
    left:    r.left   - PAD,
    width:   r.width  + PAD * 2,
    height:  r.height + PAD * 2,
    right:   r.right  + PAD,
    bottom:  r.bottom + PAD,
    centerX: r.left + r.width  / 2,
    centerY: r.top  + r.height / 2,
  };
}

const CARD_W = 272;

function positionCard(step, rect, cardH) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = 14;
  let top, left;

  if (!rect) {
    return { top: vh / 2 - cardH / 2, left: vw / 2 - CARD_W / 2 };
  }

  switch (step.position) {
    case 'below':
      top  = rect.bottom + gap;
      left = rect.centerX - CARD_W / 2;
      break;
    case 'above':
      top  = rect.top - cardH - gap;
      left = rect.centerX - CARD_W / 2;
      break;
    case 'right':
      top  = rect.centerY - cardH / 2;
      left = rect.right + gap;
      break;
    case 'left':
    default:
      top  = rect.centerY - cardH / 2;
      left = rect.left - CARD_W - gap;
      break;
  }

  // Clamp to viewport
  left = Math.max(12, Math.min(left, vw - CARD_W - 12));
  top  = Math.max(12, Math.min(top,  vh - cardH  - 12));
  return { top, left };
}

function Spotlight({ rect }) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!rect) return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)' }} />;
  return (
    <svg
      width={vw} height={vh}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
    >
      <defs>
        <mask id="tour-spotlight">
          <rect width="100%" height="100%" fill="white" />
          <rect
            x={rect.left} y={rect.top}
            width={rect.width} height={rect.height}
            rx={4} fill="black"
          />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.82)" mask="url(#tour-spotlight)" />
      {/* glow ring */}
      <rect
        x={rect.left} y={rect.top}
        width={rect.width} height={rect.height}
        rx={4} fill="none"
        stroke="rgba(0,224,208,0.7)" strokeWidth={2}
      />
    </svg>
  );
}

function TooltipCard({ step, rect, onNext, onSkip, stepIdx, total, waiting, onReady }) {
  const cardRef = useRef(null);
  const [pos, setPos] = useState(null); // null = not yet positioned

  useEffect(() => {
    if (!cardRef.current) return;
    const h = cardRef.current.offsetHeight;
    setPos(positionCard(step, rect, h));
    onReady?.();
  }, [rect, step, waiting]);

  const visible = pos !== null && !waiting;

  return (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        top:  pos ? pos.top  : -9999,
        left: pos ? pos.left : -9999,
        width: CARD_W,
        background: '#0d0d0d',
        border: '1px solid rgba(0,224,208,0.25)',
        borderTop: '2px solid var(--cyan)',
        padding: '16px',
        zIndex: 10002,
        boxShadow: '0 0 40px rgba(0,224,208,0.12)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.15s',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', letterSpacing: '3px', color: 'rgba(0,224,208,0.35)', marginBottom: 8 }}>
        {stepIdx + 1} / {total}
      </div>

      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '3px', color: 'var(--cyan)', marginBottom: 10, fontWeight: 700 }}>
        {waiting ? 'NAVIGATING...' : step.title}
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.58)', lineHeight: 1.75, marginBottom: 16 }}>
        {waiting ? '' : step.body}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onSkip}
          style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.18)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 0' }}
        >
          SKIP TOUR
        </button>
        <button
          onClick={onNext}
          disabled={waiting}
          style={{
            fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '2px',
            color: '#000', background: waiting ? 'rgba(0,224,208,0.25)' : 'var(--cyan)',
            border: 'none', cursor: waiting ? 'not-allowed' : 'pointer',
            padding: '10px 16px', fontWeight: 700,
          }}
        >
          {stepIdx === total - 1 ? 'FINISH' : 'NEXT →'}
        </button>
      </div>
    </div>
  );
}

function IntroCard({ onStart, onSkip }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 380, width: '100%', background: '#0d0d0d', border: '1px solid rgba(255,102,0,0.3)', borderTop: '2px solid var(--orange)', padding: '32px 24px', boxShadow: '0 0 48px rgba(255,102,0,0.08)', textAlign: 'center' }}>
        <div style={{ fontSize: '2.2rem', marginBottom: 14 }}>❄</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', letterSpacing: '3px', color: 'rgba(255,102,0,0.5)', marginBottom: 10 }}>
          A MESSAGE FROM UNCLE EBENEZER
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', letterSpacing: '3px', color: 'var(--orange)', fontWeight: 700, marginBottom: 18 }}>
          YOU MADE IT IN.
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, marginBottom: 26, textAlign: 'left' }}>
          I've been here a while. I know where everything is.<br /><br />
          Let me show you around. It'll take two minutes — unlike most opening acts, I'll be worth your time.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onStart} style={{ width: '100%', padding: '14px', fontFamily: 'var(--font-display)', fontSize: '0.58rem', letterSpacing: '3px', background: 'var(--orange)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            SHOW ME AROUND
          </button>
          <button onClick={onSkip} style={{ width: '100%', padding: '11px', fontFamily: 'var(--font-display)', fontSize: '0.48rem', letterSpacing: '2px', background: 'transparent', color: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
            I KNOW MY WAY AROUND
          </button>
        </div>
      </div>
    </div>
  );
}

function OutroCard({ onFinish }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 380, width: '100%', background: '#0d0d0d', border: '1px solid rgba(255,102,0,0.3)', borderTop: '2px solid var(--orange)', padding: '32px 24px', boxShadow: '0 0 48px rgba(255,102,0,0.08)', textAlign: 'center' }}>
        <div style={{ fontSize: '2.2rem', marginBottom: 14 }}>❄</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', letterSpacing: '3px', color: 'var(--orange)', fontWeight: 700, marginBottom: 18 }}>
          THAT'S THE PLACE.
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, marginBottom: 26, textAlign: 'left' }}>
          Now go rate something. I'll be in the corner if you need me.<br /><br />
          Don't suck at Phish.
        </div>
        <button onClick={onFinish} style={{ width: '100%', padding: '14px', fontFamily: 'var(--font-display)', fontSize: '0.58rem', letterSpacing: '3px', background: 'var(--orange)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          LET'S GO
        </button>
      </div>
    </div>
  );
}

export function TourGuide({ onComplete, setTab }) {
  const [phase, setPhase] = useState('intro');
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect]       = useState(null);
  const [waiting, setWaiting] = useState(false);

  const step = STEPS[stepIdx];

  const navigateAndMeasure = useCallback(async (s) => {
    setWaiting(true);
    setRect(null);
    setTab(s.tab);

    // Wait for tab render
    await new Promise(r => setTimeout(r, 400));

    // Retry finding element up to 8 times
    let r = null;
    for (let i = 0; i < 8; i++) {
      r = getRect(s.target);
      if (r) break;
      await new Promise(res => setTimeout(res, 120));
    }

    setRect(r);
    setWaiting(false);
  }, [setTab]);

  useEffect(() => {
    if (phase === 'steps') {
      navigateAndMeasure(STEPS[stepIdx]);
    }
  }, [phase, stepIdx]);

  useEffect(() => {
    if (phase !== 'steps' || waiting) return;
    const remeasure = () => setRect(getRect(step.target));
    window.addEventListener('resize', remeasure);
    return () => window.removeEventListener('resize', remeasure);
  }, [phase, stepIdx, waiting]);

  const handleNext = () => {
    if (stepIdx < STEPS.length - 1) setStepIdx(i => i + 1);
    else setPhase('outro');
  };

  const handleSkip = () => { localStorage.setItem('phreezer_tour_done', '1'); onComplete(); };
  const handleFinish = () => { localStorage.setItem('phreezer_tour_done', '1'); onComplete(); };

  if (phase === 'intro') return <IntroCard onStart={() => setPhase('steps')} onSkip={handleSkip} />;
  if (phase === 'outro') return <OutroCard onFinish={handleFinish} />;

  return (
    <>
      {/* Full-screen click blocker */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }} />

      {/* Spotlight overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }}>
        <Spotlight rect={waiting ? null : rect} />
      </div>

      {/* Tooltip */}
      <TooltipCard
        step={step}
        rect={waiting ? null : rect}
        onNext={handleNext}
        onSkip={handleSkip}
        stepIdx={stepIdx}
        total={STEPS.length}
        waiting={waiting}
      />
    </>
  );
}
