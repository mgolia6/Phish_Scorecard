import React from 'react';

export function Sidebar({ tab, setTab, user, onLogin, onLogout, expanded, setExpanded }) {

  const navItems = [
    // ── MY PHREEZER ──────────────────────────────────────────────────────────
    { id: 'scorecard',       label: 'SCORECARD',    glyph: '◈', section: 'MY PHREEZER' },
    { id: 'my-shows',        label: 'MY SHOWS',     glyph: '◉', section: null, authRequired: true },
    { id: 'my-songs',        label: 'MY SONGS',     glyph: '♪', section: null, authRequired: true },
    { id: 'my-venues',       label: 'MY VENUES',    glyph: '⌖', section: null, authRequired: true },
    { id: 'my-states',       label: 'MY STATES',    glyph: '⬡', section: null, authRequired: true },
    { id: 'my-phriends',     label: 'MY PHRIENDS',  glyph: '⚇', section: null, authRequired: true },
    { id: 'my-deep-phreeze', label: 'DEEP PHREEZE', glyph: '❄', section: null, authRequired: true },
    // ── COMMUNITY ────────────────────────────────────────────────────────────
    { id: 'community',       label: 'LEADERBOARD',  glyph: '★', section: 'COMMUNITY' },
    { id: 'top-shows',       label: 'TOP SHOWS',    glyph: '◈', section: null },
    { id: 'top-songs',       label: 'TOP SONGS',    glyph: '♪', section: null },
    { id: 'top-venues',      label: 'TOP VENUES',   glyph: '⌖', section: null },
    { id: 'top-states',      label: 'TOP STATES',   glyph: '⬡', section: null },
    { id: 'phriend-overlap', label: 'PHRIEND OVERLAP', glyph: '⚇', section: null },
  ];

  const isMyPhreezer = ['scorecard','my-shows','my-songs','my-venues','my-states','my-phriends','my-deep-phreeze','analytics'].includes(tab);
  const isCommunity  = ['community','top-shows','top-songs','top-venues','top-states','phriend-overlap'].includes(tab);

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
          {navItems.map((item, i) => {
            const disabled = item.authRequired && !user;
            return (
              <React.Fragment key={item.id}>
                {item.section && expanded && (
                  <div className="sidebar-section-label">{item.section}</div>
                )}
                {item.section && !expanded && i > 0 && (
                  <div className="sidebar-divider" />
                )}
                <button
                  className={`sidebar-nav-btn ${tab === item.id ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                  onClick={() => !disabled && setTab(item.id)}
                  title={item.label}
                  disabled={disabled}
                >
                  <span className="sidebar-nav-glyph">{item.glyph}</span>
                  {expanded && <span className="sidebar-nav-label">{item.label}</span>}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="sidebar-footer">
          {user ? (
            <>
              <div className={`sidebar-user ${expanded ? '' : 'sidebar-user-collapsed'}`}>
                <div className="sidebar-avatar" style={{ fontSize: user.avatar_icon ? '1rem' : undefined }}>
                  {user.avatar_icon || user.username?.[0]?.toUpperCase() || '?'}
                </div>
                {expanded && <span className="sidebar-username">{user.username}</span>}
              </div>
              {expanded && (
                <a
                  href="https://buymeacoffee.com/mpgink"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sidebar-nav-btn"
                  style={{ textDecoration: 'none', color: 'var(--orange)', borderColor: 'rgba(255,102,0,0.3)', marginBottom: 4 }}
                  title="Buy Me a Coffee"
                >
                  <span className="sidebar-nav-glyph">☕</span>
                  <span className="sidebar-nav-label">BUY A COFFEE</span>
                </a>
              )}
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
