import React from 'react';

export function DesktopLanding({ onLogin }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '40px 24px',
      textAlign: 'center',
    }}>

      {/* Snowflake */}
      <div style={{ fontSize: '4rem', marginBottom: 24, filter: 'drop-shadow(0 0 20px rgba(0,224,208,0.6))' }}>❄</div>

      {/* Wordmark */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '3.2rem',
        fontWeight: 900,
        color: 'var(--cyan)',
        letterSpacing: '8px',
        textShadow: '0 0 30px rgba(0,224,208,0.5), 0 0 60px rgba(0,224,208,0.2)',
        marginBottom: 8,
      }}>PHREEZER</div>

      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem',
        color: 'rgba(51,255,51,0.5)',
        letterSpacing: '4px',
        marginBottom: 48,
      }}>RATE · TRACK · RELIVE</div>

      {/* Value props */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 16,
        maxWidth: 640,
        width: '100%',
        marginBottom: 48,
      }}>
        {[
          { glyph: '★', label: 'RATE SHOWS', sub: 'Song-by-song ratings for every show you've seen' },
          { glyph: '◉', label: 'TRACK YOUR RUN', sub: 'Import your attendance history from Phish.net' },
          { glyph: '⚇', label: 'FIND PHRIENDS', sub: 'See who you've shared setlists with without knowing' },
        ].map(({ glyph, label, sub }) => (
          <div key={label} style={{
            padding: '20px 16px',
            border: '1px solid rgba(51,255,51,0.12)',
            background: 'rgba(51,255,51,0.02)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{ fontSize: '1.8rem', color: 'var(--cyan)', textShadow: '0 0 12px rgba(0,224,208,0.4)' }}>{glyph}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'var(--cyan)', letterSpacing: '2px' }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(51,255,51,0.5)', lineHeight: 1.5 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <button
          onClick={() => onLogin('signup')}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.72rem',
            letterSpacing: '3px',
            padding: '16px 40px',
            background: 'transparent',
            border: '1px solid var(--orange)',
            color: 'var(--orange)',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(255,102,0,0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.target.style.background = 'rgba(255,102,0,0.1)'; e.target.style.boxShadow = '0 0 30px rgba(255,102,0,0.5)'; }}
          onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.boxShadow = '0 0 20px rgba(255,102,0,0.3)'; }}
        >
          + CREATE ACCOUNT
        </button>
        <button
          onClick={() => onLogin('login')}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.65rem',
            letterSpacing: '2px',
            padding: '14px 28px',
            background: 'transparent',
            border: '1px solid rgba(51,255,51,0.25)',
            color: 'rgba(51,255,51,0.6)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.target.style.color = 'var(--green)'; e.target.style.borderColor = 'rgba(51,255,51,0.5)'; }}
          onMouseLeave={e => { e.target.style.color = 'rgba(51,255,51,0.6)'; e.target.style.borderColor = 'rgba(51,255,51,0.25)'; }}
        >
          → LOGIN
        </button>
      </div>

      {/* Tip */}
      <div style={{
        marginTop: 48,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.68rem',
        color: 'rgba(51,255,51,0.28)',
        letterSpacing: '1.5px',
      }}>
        OR BROWSE COMMUNITY STATS + TOP SHOWS WITHOUT AN ACCOUNT →
      </div>

    </div>
  );
}
