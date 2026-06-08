import React from 'react';

export function Sidebar({ tab, setTab, user, onLogin, onLogout, onOpenProfile, expanded, setExpanded }) {

  const myPhreezerItems = [
    { id: 'scorecard',       label: 'SCORECARD',    glyph: '◈', top: true },
    { id: 'my-shows',        label: 'MY SHOWS',     glyph: '◉', authRequired: true },
    { id: 'my-songs',        label: 'MY SONGS',     glyph: '♪', authRequired: true },
    { id: 'my-venues',       label: 'MY VENUES',    glyph: '⌖', authRequired: true },
    { id: 'my-states',       label: 'MY STATES',    glyph: '⬡', authRequired: true },
    { id: 'my-phriends',     label: 'MY PHRIENDS',  glyph: '⚇', authRequired: true },
    { id: 'my-deep-phreeze', label: 'DEEP PHREEZE', glyph: '❄', authRequired: true },
  ];

  const communityItems = [
    { id: 'community',       label: 'LEADERBOARD',     glyph: '★', top: true },
    { id: 'top-shows',       label: 'TOP SHOWS',       glyph: '◈' },
    { id: 'top-songs',       label: 'TOP SONGS',       glyph: '♪' },
    { id: 'top-venues',      label: 'TOP VENUES',      glyph: '⌖' },
    { id: 'top-states',      label: 'TOP STATES',      glyph: '⬡' },
    { id: 'phriend-overlap', label: 'PHRIEND OVERLAP', glyph: '⚇' },
  ];

  const renderItems = (items) => items.map(item => {
    const disabled = item.authRequired && !user;
    const isSubItem = !item.top;
    return (
      <button
        key={item.id}
        className={`sidebar-nav-btn ${isSubItem ? 'sidebar-nav-sub-item' : ''} ${tab === item.id ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setTab(item.id)}
        title={item.label}
        disabled={disabled}
      >
        <span className="sidebar-nav-glyph">{item.glyph}</span>
        {expanded && <span className="sidebar-nav-label">{item.label}</span>}
      </button>
    );
  });

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
            <img src="/assets/phreezer-snowflake.png" alt="Phreezer" className="sidebar-logo-img-collapsed" />
          )}
        </div>

        {/* NAV */}
        <nav className="sidebar-nav">
          {/* MY PHREEZER */}
          {expanded && <div className="sidebar-section-label section-my-phreezer">◈ MY PHREEZER</div>}
          {!expanded && <div className="sidebar-divider" />}
          {renderItems(myPhreezerItems)}

          {/* COMMUNITY */}
          {expanded && <div className="sidebar-section-label section-community">★ COMMUNITY</div>}
          {!expanded && <div className="sidebar-divider" />}
          {renderItems(communityItems)}
        </nav>

        {/* FOOTER */}
        <div className="sidebar-footer">
          {user ? (
            <>
              {/* Avatar — tappable, opens profile */}
              <div
                className={`sidebar-user ${expanded ? '' : 'sidebar-user-collapsed'}`}
                onClick={onOpenProfile}
                title="My Profile"
              >
                <div className="sidebar-avatar">
                  {user.avatar_icon || user.username?.[0]?.toUpperCase() || '?'}
                </div>
                {expanded && (
                  <div style={{ overflow: 'hidden' }}>
                    <div className="sidebar-username">{user.username}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '1px', marginTop: 2 }}>VIEW PROFILE</div>
                  </div>
                )}
              </div>
              <button className="sidebar-nav-btn sidebar-logout" onClick={onLogout} title="Logout">
                <span className="sidebar-nav-glyph">⏻</span>
                {expanded && <span className="sidebar-nav-label">LOGOUT</span>}
              </button>
            </>
          ) : (
            <>
              <button className="sidebar-nav-btn" onClick={() => onLogin('login')} title="Login">
                <span className="sidebar-nav-glyph">→</span>
                {expanded && <span className="sidebar-nav-label">LOGIN</span>}
              </button>
              <button className="sidebar-nav-btn sidebar-register" onClick={() => onLogin('signup')} title="Register">
                <span className="sidebar-nav-glyph">+</span>
                {expanded && <span className="sidebar-nav-label">REGISTER</span>}
              </button>
            </>
          )}
        </div>

      </aside>

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
