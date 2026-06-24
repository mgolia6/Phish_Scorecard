import React from 'react';

// Bump this version string with every release that has user-facing changes.
// Modal shows once per version via localStorage key.
const CHANGELOG_VERSION = '2.1';
const STORAGE_KEY = `phreezer_changelog_seen_${CHANGELOG_VERSION}`;

const CHANGES = [
  {
    icon: '◉',
    title: 'Nav moved to the bottom',
    desc: 'MY PHREEZER, COMMUNITY, and SCORECARD now live at the bottom of the screen where your thumbs actually are.',
  },
  {
    icon: '❄',
    title: 'Deep Phreeze promoted',
    desc: 'Deep Phreeze moves to second in MY PHREEZER — right after MY SHOWS. Stop burying the good stuff.',
  },
];

export function shouldShowChangelog() {
  try {
    return !localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

export function markChangelogSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {}
}

export function ChangelogModal({ onDismiss }) {
  const handleDismiss = () => {
    markChangelogSeen();
    onDismiss?.();
  };

  return (
    <div
      onClick={handleDismiss}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 4000,
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid rgba(var(--cyan-rgb),0.4)',
          boxShadow: '0 0 40px rgba(var(--cyan-rgb),0.12), 0 0 80px rgba(0,0,0,0.6)',
          width: '100%', maxWidth: 420,
          padding: '28px 24px 24px',
          position: 'relative',
        }}
      >
        {/* Snowflake decoration */}
        <span style={{
          position: 'absolute', top: 20, right: 20,
          color: 'var(--cyan)', fontSize: '0.9rem', opacity: 0.5,
          fontFamily: 'var(--font-mono)',
        }}>❄</span>

        {/* Header */}
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '0.56rem',
          letterSpacing: '4px', color: 'var(--cyan)', opacity: 0.6,
          textTransform: 'uppercase', marginBottom: 6,
        }}>
          WHAT'S NEW
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '1rem',
          color: 'var(--cyan)', letterSpacing: '4px',
          textShadow: '0 0 20px rgba(var(--cyan-rgb),0.5)',
          marginBottom: 4,
        }}>
          PHREEZER UPDATE
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
          color: 'rgba(var(--green-rgb),0.4)', letterSpacing: '2px',
          marginBottom: 24, paddingBottom: 16,
          borderBottom: '1px solid rgba(var(--green-rgb),0.12)',
        }}>
          v{CHANGELOG_VERSION} — Jun 17, 2026
        </div>

        {/* Changes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 24 }}>
          {CHANGES.map((c, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 0' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '1rem',
                  flexShrink: 0, width: 20, textAlign: 'center',
                  color: 'var(--cyan)', marginTop: 1,
                }}>{c.icon}</span>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: '0.62rem',
                    letterSpacing: '2px', color: 'var(--orange)',
                    textTransform: 'uppercase', marginBottom: 5,
                  }}>{c.title}</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                    color: 'rgba(var(--green-rgb),0.72)', lineHeight: 1.6,
                  }}>{c.desc}</div>
                </div>
              </div>
              {i < CHANGES.length - 1 && (
                <div style={{ height: 1, background: 'rgba(var(--green-rgb),0.1)' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.66rem',
            color: 'rgba(var(--green-rgb),0.25)', letterSpacing: '1px',
          }}>TAP OUTSIDE TO DISMISS</span>
          <button
            onClick={handleDismiss}
            style={{
              fontFamily: 'var(--font-display)', fontSize: '0.6rem',
              letterSpacing: '3px', background: 'transparent',
              border: '1px solid var(--cyan)', color: 'var(--cyan)',
              padding: '10px 20px', cursor: 'pointer',
              textTransform: 'uppercase', whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            GOT IT ◈
          </button>
        </div>
      </div>
    </div>
  );
}
