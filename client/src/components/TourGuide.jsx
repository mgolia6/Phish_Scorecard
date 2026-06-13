import React, { useState, useEffect, useRef, useCallback } from 'react';

// Each step declares which tab it needs to be on before spotlighting
const STEPS = [
  {
    tab: 'my-shows',
    target: 'otd',
    position: 'below',
    title: 'ON THIS DAY',
    body: 'Every show Phish has ever played on today\'s date. Tap through them. If you were there, it\'s marked. If you\'ve rated it, it\'s phrozen.',
  },
  {
    tab: 'scorecard',
    target: 'scorecard',
    position: 'right',
    title: 'SCORECARD',
    body: 'Search any show and rate it song by song, 1–5. This is the core of everything. The more you rate, the more the rest of the app means something.',
  },
  {
    tab: 'my-shows',
    target: 'my-phreezer',
    position: 'right',
    title: 'MY PHREEZER',
    body: 'Your shows, your songs, your venues, your states. Everything you\'ve attended or rated lives here.',
  },
  {
    tab: 'my-deep-phreeze',
    target: 'deep-phreeze',
    position: 'right',
    title: 'DEEP PHREEZE',
    body: 'Your personal stats engine. Top songs, top venues, era breakdown, show frequency. Gets more interesting every time you rate.',
  },
  {
    tab: 'community',
    target: 'community',
    position: 'right',
    title: 'COMMUNITY',
    body: 'Leaderboard, top shows, top songs, top venues. See how the community hears things — and where you stand.',
  },
  {
    tab: 'my-shows',
    target: 'ebenezer',
    position: 'left',
    title: 'UNCLE EBENEZER',
    body: 'That\'s me. I know your show history, your ratings, and I have opinions about both. Ask me anything.',
  },
  {
    tab: 'my-shows',
    target: 'profile-avatar',
    position: 'above',
    title: 'YOUR PROFILE',
    body: 'Connect your Phish.net account, set preferences, and pick your avatar. Also where you'll find ABOUT — the story behind the app — and SHOP, if you want to represent at lot.',
  },
];

const PADDING = 12;

function getRect(target) {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PADDING,
    left: r.left - PADDING,
    width: r.width + PADDING * 2,
    height: r.height + PADDING * 2,
    centerX: r.left + r.width / 2,
    centerY: r.top + r.height / 2,
  };
}

function TooltipCard({ step, rect, onNext, onSkip, stepIndex, total, waiting }) {
  const [pos, setPos] = useState({ top: '50%', left: '50%' });
  const cardRef = useRef(null);

  useEffect(() => {
    if (!rect || !cardRef.current || waiting) return;
    const card = cardRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 16;
    let top, left;

    if (step.position === 'below') {
      top = rect.top + rect.height + gap;
      left = rect.centerX - card.width / 2;
    } else if (step.position === 'above') {
      top = rect.top - card.height - gap;
      left = rect.centerX - card.width / 2;
    } else if (step.position === 'right') {
      top = rect.centerY - card.height / 2;
      left = rect.left + rect.width + gap;
    } else {
      top = rect.centerY - card.height / 2;
      left = rect.left - card.width - gap;
    }

    left = Math.max(12, Math.min(left, vw - card.width - 12));
    top  = Math.max(12, Math.min(top,  vh - card.height - 12));
    setPos({ top, left });
  }, [rect, step, waiting]);

  return (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        top: waiting ? '50%' : pos.top,
        left: waiting ? '50%' : pos.left,
        transform: waiting ? 'translate(-50%, -50%)' : 'none',
        width: 280,
        background: '#0f0f0f',
        border: '1px solid rgba(0,224,208,0.3)',
        borderTop: '2px solid var(--cyan)',
        padding: '16px',
        zIndex: 10001,
        boxShadow: '0 0 32px rgba(0,224,208,0.15)',
        transition: 'opacity 0.2s',
        opacity: waiting ? 0.5 : 1,
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', letterSpacing: '3px', color: 'rgba(0,224,208,0.4)', marginBottom: 8 }}>
        {stepIndex + 1} OF {total}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '3px', color: 'var(--cyan)', marginBottom: 10, fontWeight: 700 }}>
        {waiting ? 'NAVIGATING...' : step.title}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 16 }}>
        {waiting ? '...' : step.body}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onSkip} style={{ fontFamily: 'var(--font-display)', fontSize: '0.45rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.2)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
          SKIP TOUR
        </button>
        <button onClick={onNext} disabled={waiting} style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', letterSpacing: '2px', color: '#000', background: waiting ? 'rgba(0,224,208,0.3)' : 'var(--cyan)', border: 'none', cursor: waiting ? 'not-allowed' : 'pointer', padding: '10px 18px', fontWeight: 700 }}>
          {stepIndex === total - 1 ? 'FINISH' : 'NEXT →'}
        </button>
      </div>
    </div>
  );
}

export function TourGuide({ onComplete, setTab }) {
  const [phase, setPhase] = useState('intro');
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [waiting, setWaiting] = useState(false);

  const currentStep = STEPS[stepIndex];

  // Navigate to the right tab and wait for render, then measure
  const navigateAndMeasure = useCallback(async (step) => {
    setWaiting(true);
    setRect(null);

    // Navigate to the required tab
    setTab(step.tab);

    // Wait for React to render + DOM to settle
    await new Promise(r => setTimeout(r, 350));

    // Try to find the element — retry a few times in case it's still rendering
    let r = null;
    for (let i = 0; i < 5; i++) {
      r = getRect(step.target);
      if (r) break;
      await new Promise(res => setTimeout(res, 150));
    }

    setRect(r);
    setWaiting(false);
  }, [setTab]);

  // When we enter steps phase or change step, navigate and measure
  useEffect(() => {
    if (phase !== 'steps') return;
    navigateAndMeasure(currentStep);
  }, [phase, stepIndex]);

  // Also re-measure on resize
  useEffect(() => {
    if (phase !== 'steps' || waiting) return;
    const measure = () => setRect(getRect(currentStep.target));
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [phase, stepIndex, waiting]);

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(i => i + 1);
    } else {
      setPhase('outro');
    }
  };

  const handleSkip = () => {
    localStorage.setItem('phreezer_tour_done', '1');
    onComplete();
  };

  const handleFinish = () => {
    localStorage.setItem('phreezer_tour_done', '1');
    onComplete();
  };

  // ── INTRO ─────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 400, background: '#0f0f0f', border: '1px solid rgba(255,102,0,0.3)', borderTop: '2px solid var(--orange)', padding: '32px 28px', boxShadow: '0 0 48px rgba(255,102,0,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>❄</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', letterSpacing: '3px', color: 'rgba(255,102,0,0.5)', marginBottom: 12 }}>
            A MESSAGE FROM UNCLE EBENEZER
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: '3px', color: 'var(--orange)', fontWeight: 700, marginBottom: 20 }}>
            YOU MADE IT IN.
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: 28, textAlign: 'left' }}>
            I've been here a while. I know where everything is.<br /><br />
            Let me show you around. It'll take two minutes, and unlike most opening acts, I'll actually be worth your time.
          </div>
          <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
            <button
              onClick={() => setPhase('steps')}
              style={{ width: '100%', padding: '14px', fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '3px', background: 'var(--orange)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              SHOW ME AROUND
            </button>
            <button
              onClick={handleSkip}
              style={{ width: '100%', padding: '11px', fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '2px', background: 'transparent', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
            >
              I KNOW MY WAY AROUND
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── OUTRO ─────────────────────────────────────────────────
  if (phase === 'outro') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 400, background: '#0f0f0f', border: '1px solid rgba(255,102,0,0.3)', borderTop: '2px solid var(--orange)', padding: '32px 28px', boxShadow: '0 0 48px rgba(255,102,0,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>❄</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: '3px', color: 'var(--orange)', fontWeight: 700, marginBottom: 20 }}>
            THAT'S THE PLACE.
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: 28, textAlign: 'left' }}>
            Now go rate something. I'll be in the corner if you need me.<br /><br />
            Don't suck at Phish.
          </div>
          <button
            onClick={handleFinish}
            style={{ width: '100%', padding: '14px', fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '3px', background: 'var(--orange)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            LET'S GO
          </button>
        </div>
      </div>
    );
  }

  // ── STEPS ─────────────────────────────────────────────────
  return (
    <>
      {/* Dim overlay with spotlight cutout */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }}>
        {rect && !waiting ? (
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <mask id="tour-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect x={rect.left} y={rect.top} width={rect.width} height={rect.height} rx={4} fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.82)" mask="url(#tour-mask)" />
            <rect x={rect.left} y={rect.top} width={rect.width} height={rect.height} rx={4} fill="none" stroke="rgba(0,224,208,0.6)" strokeWidth={2} />
          </svg>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.82)' }} />
        )}
      </div>

      {/* Click blocker */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }} />

      <TooltipCard
        step={currentStep}
        rect={rect}
        onNext={handleNext}
        onSkip={handleSkip}
        stepIndex={stepIndex}
        total={STEPS.length}
        waiting={waiting}
      />
    </>
  );
}

