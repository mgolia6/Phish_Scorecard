import React from 'react';

export function Sidebar({ tab, setTab, user, onLogin, onLogout, onOpenProfile, onFeedback, expanded, setExpanded, onGoHome }) {

  const myPhreezerItems = [
    { id: 'my-shows',        label: 'MY SHOWS',     glyph: '◉', authRequired: true },
    { id: 'my-songs',        label: 'MY SONGS',     glyph: '♪', authRequired: true },
    { id: 'my-venues',       label: 'MY VENUES',    glyph: '⌖', authRequired: true },
    { id: 'my-states',       label: 'MY STATES',    glyph: '⬡', authRequired: true },
    { id: 'my-phriends',     label: 'MY PHRIENDS',  glyph: '⚇', authRequired: true },
    { id: 'my-deep-phreeze', label: 'DEEP PHREEZE', glyph: '❄', authRequired: true },
  ];

  const communityItems = [
    { id: 'feed',            label: 'FEED',            glyph: '◈' },
    { id: 'phriend-overlap', label: 'PHRIEND OVERLAP', glyph: '⚇' },
    { id: 'community',       label: 'LEADERBOARD',     glyph: '★' },
    { id: 'top-shows',       label: 'TOP SHOWS',       glyph: '◈' },
    { id: 'top-songs',       label: 'TOP SONGS',       glyph: '♪' },
    { id: 'top-venues',      label: 'TOP VENUES',      glyph: '⌖' },
    { id: 'top-states',      label: 'TOP STATES',      glyph: '⬡' },
  ];

  const renderItem = (item) => {
    const disabled = item.authRequired && !user;
    if (disabled) return null; // hide auth-required items entirely when logged out
    return (
      <button
        key={item.id}
        className={`sidebar-nav-btn sidebar-nav-sub-item ${tab === item.id ? 'active' : ''}`}
        onClick={() => setTab(item.id)}
        title={item.label}
      >
        <span className="sidebar-nav-glyph">{item.glyph}</span>
        {expanded && <span className="sidebar-nav-label">{item.label}</span>}
      </button>
    );
  };

  const sectionDot = (color) => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 2px' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
    </div>
  );

  return (
    <div className="sidebar-wrapper">
      <aside className={`sidebar ${expanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>

        {/* LOGO */}
        <div className="sidebar-logo">
          {expanded ? (
            <img
              src="/assets/phreezer-logo.png"
              alt="The Phreezer"
              className="sidebar-logo-img-expanded"
              onClick={() => {
                if (!user) { onGoHome && onGoHome(); return; }
                if (!user?.is_admin) return;
                const now = Date.now();
                if (!window._logoTaps) window._logoTaps = [];
                window._logoTaps = window._logoTaps.filter(t => now - t < 800);
                window._logoTaps.push(now);
                if (window._logoTaps.length >= 3) { window._logoTaps = []; setTab('admin'); }
              }}
              style={{ cursor: user?.is_admin ? 'pointer' : 'default' }}
            />
          ) : (
            <img
              src="/assets/phreezer-snowflake.png"
              alt="Phreezer"
              className="sidebar-logo-img-collapsed"
              onClick={() => !user && onGoHome && onGoHome()}
              style={{ cursor: !user ? 'pointer' : 'default' }}
            />
          )}
        </div>

        {/* NAV */}
        <nav className="sidebar-nav">

          {/* MY PHREEZER — only shown when logged in */}
          {user && (
            <>
              {expanded
                ? <div className="sidebar-section-label section-my-phreezer" data-tour="my-phreezer">◈ MY PHREEZER</div>
                : sectionDot('var(--cyan)')
              }
              {myPhreezerItems.map(item => {
                const el = renderItem(item);
                if (!el) return null;
                if (item.id === 'my-deep-phreeze') {
                  return <div key={item.id} data-tour="deep-phreeze">{el}</div>;
                }
                return el;
              })}
            </>
          )}

          {/* COMMUNITY — always visible */}
          {expanded
            ? <div className="sidebar-section-label section-community" data-tour="community">★ COMMUNITY</div>
            : sectionDot('var(--orange)')
          }
          {communityItems.map(renderItem)}

          {/* SCORECARD — always visible */}
          <div className="sidebar-divider" style={{ margin: '12px 16px' }} />
          {expanded ? (
            <div
              className={`sidebar-section-label section-scorecard ${tab === 'scorecard' ? 'active' : ''}`}
              onClick={() => setTab('scorecard')}
              style={{ cursor: 'pointer', padding: '14px 16px' }}
              data-tour="scorecard"
            >
              ◈ SCORECARD
            </div>
          ) : (
            <>
              {sectionDot('var(--green)')}
              <button
                className={`sidebar-nav-btn sidebar-nav-sub-item ${tab === 'scorecard' ? 'active' : ''}`}
                onClick={() => setTab('scorecard')}
                title="SCORECARD"
              >
                <span className="sidebar-nav-glyph">◈</span>
              </button>
            </>
          )}

          {/* FEEDBACK — logged in only */}
          {user && (
            <>
              <div className="sidebar-divider" style={{ margin: '12px 16px' }} />
              <button
                className="sidebar-nav-btn sidebar-nav-sub-item"
                onClick={onFeedback}
                title="Send Feedback"
                style={{ color: 'rgba(51,255,51,0.4)' }}
              >
                <span className="sidebar-nav-glyph">◈</span>
                {expanded && <span className="sidebar-nav-label">FEEDBACK</span>}
              </button>
            </>
          )}

        </nav>

        {/* FOOTER */}
        <div className="sidebar-footer">
          {user ? (
            <div
              className={`sidebar-user ${expanded ? '' : 'sidebar-user-collapsed'}`}
              onClick={onOpenProfile}
              data-tour="profile-avatar"
              title="My Profile"
              style={{ cursor: 'pointer' }}
            >
              <div className="sidebar-avatar">
                {user.avatar_icon || user.username?.[0]?.toUpperCase() || '?'}
              </div>
              {expanded && (
                <div style={{ overflow: 'hidden' }}>
                  <div className="sidebar-username">{user.username}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'rgba(0,224,208,0.4)', letterSpacing: '1.5px', marginTop: 3 }}>VIEW PROFILE</div>
                </div>
              )}
            </div>
          ) : (
            /* Logged-out CTA — prominent, not buried */
            expanded ? (
              <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', color: 'rgba(51,255,51,0.45)', letterSpacing: '2px', marginBottom: 4, textAlign: 'center' }}>
                  RATE. TRACK. RELIVE.
                </div>
                <button
                  className="btn-primary"
                  onClick={() => onLogin('signup')}
                  style={{ width: '100%', padding: '12px', fontSize: '0.62rem', letterSpacing: '2px', fontFamily: 'var(--font-display)' }}
                >
                  + CREATE ACCOUNT
                </button>
                <button
                  onClick={() => onLogin('login')}
                  style={{ width: '100%', padding: '10px', fontSize: '0.58rem', letterSpacing: '2px', fontFamily: 'var(--font-display)', border: '1px solid rgba(51,255,51,0.25)', color: 'rgba(51,255,51,0.6)', background: 'transparent' }}
                >
                  → LOGIN
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0', alignItems: 'center' }}>
                <button
                  className="sidebar-nav-btn"
                  onClick={() => onLogin('signup')}
                  title="Register"
                  style={{ color: 'var(--orange)', justifyContent: 'center', padding: '10px 0' }}
                >
                  <span className="sidebar-nav-glyph">+</span>
                </button>
                <button
                  className="sidebar-nav-btn"
                  onClick={() => onLogin('login')}
                  title="Login"
                  style={{ justifyContent: 'center', padding: '10px 0' }}
                >
                  <span className="sidebar-nav-glyph">→</span>
                </button>
              </div>
            )
          )}
        </div>

      </aside>

      {/* COLLAPSE TAB */}
      <button
        className="sidebar-tab"
        onClick={() => setExpanded(e => !e)}
        title={expanded ? 'Collapse' : 'Expand'}
      >
        {expanded ? '◀' : '▶'}
      </button>
    </div>
  );
}
