import React from 'react';
import { formatDate } from './utils';

export function BadgesSection({ api }) {
  const [kpi, setKpi] = useState(null);
  useEffect(() => { api.get('/user/kpi').then(setKpi).catch(() => {}); }, []);

  if (!kpi) return <div className="empty-state">LOADING BADGES...</div>;

  const earnedIds = new Set((kpi.badges || []).map(b => b.id));
  const earned = ALL_BADGES_DEF.filter(b => earnedIds.has(b.id));
  const locked = ALL_BADGES_DEF.filter(b => !earnedIds.has(b.id));

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', color: 'var(--text-label)', letterSpacing: '3px', marginBottom: 12 }}>
        {earned.length} OF {ALL_BADGES_DEF.length} EARNED
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {earned.map((b, i) => (
          <div key={i} style={{ background: 'var(--bg-elevated)', border: `1px solid ${b.color}55`, borderTop: `2px solid ${b.color}`, padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, boxShadow: `0 0 16px ${b.color}22` }}>
            <span style={{ fontSize: '1.4rem', filter: `drop-shadow(0 0 6px ${b.color}99)` }}>{b.glyph}</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', color: b.color, letterSpacing: '1.5px', textAlign: 'center' }}>{b.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-label)', textAlign: 'center', lineHeight: 1.4 }}>{b.desc}</div>
          </div>
        ))}
      </div>
      {locked.length > 0 && (
        <>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: 8 }}>LOCKED</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {locked.map((b, i) => (
              <div key={i} style={{ background: 'var(--bg-panel)', border: '1px solid rgba(51,255,51,0.08)', padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.4 }}>
                <span style={{ fontSize: '1.4rem', filter: 'grayscale(1)' }}>{b.glyph}</span>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', color: 'var(--text-label)', letterSpacing: '1.5px', textAlign: 'center' }}>{b.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// PROFILE MODAL — launched from avatar (Phase 1)
// ============================================================
const AVATAR_ICONS = ['❄','◈','⚡','✦','⬡','◉','▦','✎','🔥','🐟','🌀','🎸','💯','★','✍','🏔'];

export function ProfileModal({ user, api, onClose, onAvatarChange, onLogout }) {
  const [sec, setSec] = React.useState('info');
  const [profile, setProfile] = React.useState(null);
  const [selectedIcon, setSelectedIcon] = React.useState(user?.avatar_icon || null);
  const [savingIcon, setSavingIcon] = React.useState(false);

  React.useEffect(() => {
    api.get('/user/profile').then(d => {
      setProfile(d);
      if (d.avatar_icon) setSelectedIcon(d.avatar_icon);
    }).catch(() => {});
  }, []);

  const handleSaveIcon = async (icon) => {
    setSelectedIcon(icon);
    setSavingIcon(true);
    try {
      await api.post('/user/profile', {
        phishnet_username: profile?.phishnet_username || null,
        favorite_song: profile?.favorite_song || null,
        favorite_venue: profile?.favorite_venue || null,
        favorite_show_date: profile?.favorite_show_date || null,
        avatar_icon: icon,
      });
      onAvatarChange && onAvatarChange(icon);
    } catch (e) {}
    finally { setSavingIcon(false); }
  };

  return (
    <div className="profile-modal" onClick={onClose}>
      <div className="profile-modal-inner" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="profile-modal-header">
          <div style={{ fontFamily:'var(--font-display)', fontSize:'0.62rem', color:'var(--cyan)', letterSpacing:'3px' }}>◈ PROFILE</div>
          <button onClick={onClose} style={{ background:'transparent', border:'1px solid rgba(51,255,51,0.25)', color:'var(--text-label)', fontFamily:'var(--font-display)', fontSize:'0.52rem', letterSpacing:'2px', padding:'5px 10px', cursor:'pointer' }}>
            ✕ CLOSE
          </button>
        </div>
        {/* Identity hero */}
        <div className="profile-modal-hero">
          <div className="profile-username-label">USERNAME</div>
          <div className="profile-username">{user?.username}</div>
          <div className="profile-email">{user?.email}</div>
        </div>
        {/* Section tabs */}
        <div className="profile-modal-tabs">
          {[['info','INFO'],['badges','BADGES'],['settings','SETTINGS']].map(([k,l]) => (
            <button key={k} onClick={() => setSec(k)}
              className={`profile-modal-tab ${sec === k ? 'active' : ''}`}>{l}</button>
          ))}
        </div>
        {/* Body */}
        <div className="profile-modal-body">
          {sec === 'info' && (
            <div className="panel" style={{ marginBottom: 12 }}>
              <div className="profile-section">
                {[
                  ['PHISH.NET HANDLE', profile?.phishnet_username],
                  ['FAVORITE SONG',    profile?.favorite_song],
                  ['FAVORITE VENUE',   profile?.favorite_venue],
                  ['FIRST SHOW',       profile?.favorite_show_date ? formatDate(profile.favorite_show_date) : null],
                ].map(([label, val]) => (
                  <div key={label} className="profile-field-row">
                    <div className="profile-field-label">{label}</div>
                    <div className="profile-field-val" style={{ color: val ? 'var(--white)' : 'var(--text-muted)', fontSize: val ? '0.92rem' : '0.8rem' }}>
                      {val || (profile ? '—' : '...')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {sec === 'badges' && (
            <BadgesSection api={api} />
          )}
          {sec === 'settings' && (
            <div>
              {/* Avatar icon picker */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-label)', letterSpacing: '2.5px', marginBottom: 10 }}>
                  ◈ CHOOSE YOUR ICON
                  {savingIcon && <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>SAVING...</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
                  {AVATAR_ICONS.map(icon => (
                    <button key={icon} onClick={() => handleSaveIcon(icon)} style={{
                      width: '100%', aspectRatio: '1', border: `2px solid ${selectedIcon === icon ? 'var(--cyan)' : 'rgba(51,255,51,0.15)'}`,
                      background: selectedIcon === icon ? 'rgba(0,224,208,0.12)' : 'var(--bg-elevated)',
                      fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: selectedIcon === icon ? '0 0 12px rgba(0,224,208,0.35)' : 'none',
                      transition: 'all 0.15s',
                    }}>
                      {icon}
                    </button>
                  ))}
                </div>
                {selectedIcon && (
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--cyan)', letterSpacing: '2px', marginTop: 8, textAlign: 'center' }}>
                    ACTIVE: {selectedIcon}
                  </div>
                )}
              </div>
              <div style={{ borderTop: '1px solid rgba(51,255,51,0.08)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="https://buymeacoffee.com/mpgink" target="_blank" rel="noopener noreferrer"
                  className="btn-glow-cyan" style={{ marginBottom: 4 }}>◈ SUPPORT THE PHREEZER</a>
                <button className="btn-glow-red" onClick={() => { onLogout && onLogout(); onClose(); }}>SIGN OUT</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ROOT APP
// ============================================================