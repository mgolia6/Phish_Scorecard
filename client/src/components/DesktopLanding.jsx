import React from 'react';

export function DesktopLanding({ onLogin, onGoToScorecard }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '90vh', padding: '48px 32px', textAlign: 'center',
    }}>

      {/* Logo — full asset with snowflake + wordmark + tagline baked in */}
      <img
        src="/assets/phreezer-logo.png"
        alt="PHREEZER"
        style={{
          height: 110, objectFit: 'contain', marginBottom: 52,
          filter: 'drop-shadow(0 0 20px rgba(0,224,208,0.4))',
        }}
      />

      {/* Value prop cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: 20, maxWidth: 820, width: '100%', marginBottom: 52,
      }}>
        {[
          { glyph: '★', label: 'RATE SHOWS', sub: "Song-by-song ratings for every show you've seen", color: 'var(--orange)', action: onGoToScorecard, cta: 'OPEN SCORECARD →' },
          { glyph: '◉', label: 'TRACK YOUR RUN', sub: 'Import your full attendance history from Phish.net in seconds', color: 'var(--cyan)', action: () => onLogin('signup'), cta: 'CREATE ACCOUNT →' },
          { glyph: '⚇', label: 'FIND PHRIENDS', sub: "Discover who you've shared setlists with without ever knowing", color: 'var(--green)', action: () => onLogin('signup'), cta: 'JOIN FREE →' },
        ].map(({ glyph, label, sub, color, action, cta }) => (
          <div key={label} onClick={action} style={{
            padding: '28px 20px 22px', cursor: 'pointer',
            border: `1px solid ${color === 'var(--orange)' ? 'rgba(255,102,0,0.2)' : color === 'var(--cyan)' ? 'rgba(0,224,208,0.2)' : 'rgba(51,255,51,0.2)'}`,
            background: 'rgba(255,255,255,0.02)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = `rgba(${color === 'var(--orange)' ? '255,102,0' : color === 'var(--cyan)' ? '0,224,208' : '51,255,51'},0.06)`;
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          >
            <div style={{ fontSize: '2.2rem', color, textShadow: `0 0 16px ${color}` }}>{glyph}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color, letterSpacing: '2.5px' }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{sub}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color, letterSpacing: '2px', marginTop: 4, opacity: 0.7 }}>{cta}</div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 32 }}>
        <button onClick={() => onLogin('signup')} style={{
          fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: '3px',
          padding: '18px 52px', background: 'transparent', border: '1px solid var(--orange)',
          color: 'var(--orange)', cursor: 'pointer', boxShadow: '0 0 24px rgba(255,102,0,0.3)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.target.style.background = 'rgba(255,102,0,0.1)'; e.target.style.boxShadow = '0 0 40px rgba(255,102,0,0.5)'; }}
        onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.boxShadow = '0 0 24px rgba(255,102,0,0.3)'; }}
        >+ CREATE ACCOUNT</button>
        <button onClick={() => onLogin('login')} style={{
          fontFamily: 'var(--font-display)', fontSize: '0.78rem', letterSpacing: '2px',
          padding: '16px 36px', background: 'transparent',
          border: '1px solid rgba(51,255,51,0.25)', color: 'rgba(51,255,51,0.6)', cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.target.style.color = 'var(--green)'; e.target.style.borderColor = 'rgba(51,255,51,0.5)'; }}
        onMouseLeave={e => { e.target.style.color = 'rgba(51,255,51,0.6)'; e.target.style.borderColor = 'rgba(51,255,51,0.25)'; }}
        >→ LOGIN</button>
      </div>

      <div onClick={onGoToScorecard} style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
        color: 'rgba(51,255,51,0.28)', letterSpacing: '2px', cursor: 'pointer',
      }}>OR BROWSE SETLISTS + COMMUNITY WITHOUT AN ACCOUNT →</div>
    </div>
  );
}
