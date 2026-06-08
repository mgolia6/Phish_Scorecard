import React from 'react';

export function Sidebar({ tab, setTab, user, onLogin, onLogout, onOpenProfile, expanded, setExpanded }) {

  const myPhreezerItems = [
    { id: 'my-shows',        label: 'MY SHOWS',     glyph: '◉', authRequired: true },
    { id: 'my-songs',        label: 'MY SONGS',     glyph: '♪', authRequired: true },
    { id: 'my-venues',       label: 'MY VENUES',    glyph: '⌖', authRequired: true },
    { id: 'my-states',       label: 'MY STATES',    glyph: '⬡', authRequired: true },
    { id: 'my-phriends',     label: 'MY PHRIENDS',  glyph: '⚇', authRequired: true },
    { id: 'my-deep-phreeze', label: 'DEEP PHREEZE', glyph: '❄', authRequired: true },
  ];

  // Community: leaderboard is top, rest are sub under it
  const communityTop = { id: 'community', label: 'LEADERBOARD', glyph: '★' };
  const communitySubItems = [
    { id: 'top-shows',       label: 'TOP SHOWS',       glyph: '◈' },
    { id: 'top-songs',       label: 'TOP SONGS',       glyph: '♪' },
    { id: 'top-venues',      label: 'TOP VENUES',      glyph: '⌖' },
    { id: 'top-states',      label: 'TOP STATES',      glyph: '⬡' },
    { id: 'phriend-overlap', label: 'PHRIEND OVERLAP', glyph: '⚇' },
  ];

  const isCommunityActive = ['community','top-shows','top-songs','top-venues','top-states','phriend-overlap'].includes(tab);

  const renderItem = (item, isSubItem = false) => {
    const disabled = item.authRequired && !user;
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
  };

  const sectionDot = (color) => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
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

          {/* MY PHREEZER — section label, items flat (no sub-indent) */}
          {expanded
            ? <div className="sidebar-section-label section-my-phreezer">◈ MY PHREEZER</div>
            : sectionDot('var(--cyan)')
          }
          {myPhreezerItems.map(item => renderItem(item, false))}

          {/* COMMUNITY — section label, leaderboard top-level, rest sub */}
          {expanded
            ? <div className="sidebar-section-label section-community">★ COMMUNITY</div>
            : sectionDot('var(--orange)')
          }
          {renderItem(communityTop, false)}
          {communitySubItems.map(item => renderItem(item, true))}

          {/* SCORECARD — standalone, section label IS the nav target */}
          <div className="sidebar-divider" style={{ margin: '12px 16px' }} />
          {expanded ? (
            <div
              className={`sidebar-section-label section-scorecard ${tab === 'scorecard' ? 'active' : ''}`}
              onClick={() => setTab('scorecard')}
              style={{ padding: '14px 16px 14px' }}
            >
              ◈ SCORECARD
            </div>
          ) : (
            <>
              {sectionDot('var(--green)')}
              {renderItem({ id: 'scorecard', label: 'SCORECARD', glyph: '◈' }, false)}
            </>
          )}

        </nav>

        {/* FOOTER */}
        <div className="sidebar-footer">
          {user ? (
            <>
              <div
                className={`sidebar-user ${expanded ? '' : 'sidebar-user-collapsed'}`}
                onClick={onOpenProfile}
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

          {/* COLLAPSE TOGGLE — always visible */}
          <button
            className="sidebar-nav-btn"
            onClick={() => setExpanded(e => !e)}
            style={{
              borderTop: '1px solid var(--border)',
              color: 'rgba(51,255,51,0.35)',
              fontSize: '0.55rem',
              letterSpacing: '2px',
              justifyContent: expanded ? 'flex-start' : 'center',
              marginTop: 4,
            }}
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <span className="sidebar-nav-glyph">{expanded ? '◀' : '▶'}</span>
            {expanded && <span className="sidebar-nav-label">COLLAPSE</span>}
          </button>

        </div>
      </aside>
    </div>
  );
}
