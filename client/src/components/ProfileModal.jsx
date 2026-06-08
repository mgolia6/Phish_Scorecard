import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils';

// ============================================================
// PHREEZER AVATAR — geometric SVG, seeded by avatar id
// ============================================================
const AVATAR_OPTIONS = [
  { id: 'phreeze',    label: 'PHREEZE'    },
  { id: 'crosshair',  label: 'CROSSHAIR'  },
  { id: 'waveform',   label: 'WAVEFORM'   },
  { id: 'hexagon',    label: 'HEXAGON'    },
];

export function PhreezerAvatar({ seed, size = 52, color = '#00ffff' }) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r = s * 0.35;

  if (seed === 'crosshair') return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={s*0.025} opacity="0.5"/>
      <circle cx={cx} cy={cy} r={r*0.45} fill="none" stroke={color} strokeWidth={s*0.03} opacity="0.85"/>
      <circle cx={cx} cy={cy} r={s*0.04} fill={color}/>
      <line x1={cx - r*1.1} y1={cy} x2={cx - r*0.55} y2={cy} stroke={color} strokeWidth={s*0.025} opacity="0.7"/>
      <line x1={cx + r*0.55} y1={cy} x2={cx + r*1.1} y2={cy} stroke={color} strokeWidth={s*0.025} opacity="0.7"/>
      <line x1={cx} y1={cy - r*1.1} x2={cx} y2={cy - r*0.55} stroke={color} strokeWidth={s*0.025} opacity="0.7"/>
      <line x1={cx} y1={cy + r*0.55} x2={cx} y2={cy + r*1.1} stroke={color} strokeWidth={s*0.025} opacity="0.7"/>
    </svg>
  );

  if (seed === 'waveform') {
    const bars = [0.3, 0.6, 1, 0.6, 0.3, 0.15];
    const bw = s * 0.09;
    const gap = s * 0.04;
    const totalW = bars.length * bw + (bars.length - 1) * gap;
    const startX = (s - totalW) / 2;
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
        {bars.map((h, i) => {
          const bh = h * s * 0.7;
          const x = startX + i * (bw + gap);
          return <rect key={i} x={x} y={cy - bh/2} width={bw} height={bh} rx={bw*0.3} fill={color} opacity={0.2 + h * 0.8}/>;
        })}
      </svg>
    );
  }

  if (seed === 'hexagon') {
    const pts = (radius) => Array.from({length:6}, (_,i) => {
      const a = (Math.PI/180)*(60*i - 30);
      return `${cx + radius*Math.cos(a)},${cy + radius*Math.sin(a)}`;
    }).join(' ');
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
        <polygon points={pts(r)} fill="none" stroke={color} strokeWidth={s*0.025} opacity="0.4"/>
        <polygon points={pts(r*0.6)} fill="none" stroke={color} strokeWidth={s*0.03} opacity="0.75"/>
        <circle cx={cx} cy={cy} r={s*0.05} fill={color}/>
      </svg>
    );
  }

  // Default: phreeze (snowflake geometry)
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke={color} strokeWidth={s*0.025} opacity="0.55"/>
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke={color} strokeWidth={s*0.025} opacity="0.55"/>
      <line x1={cx - r*0.7} y1={cy - r*0.7} x2={cx + r*0.7} y2={cy + r*0.7} stroke={color} strokeWidth={s*0.02} opacity="0.38"/>
      <line x1={cx + r*0.7} y1={cy - r*0.7} x2={cx - r*0.7} y2={cy + r*0.7} stroke={color} strokeWidth={s*0.02} opacity="0.38"/>
      <circle cx={cx} cy={cy} r={r*0.22} fill="none" stroke={color} strokeWidth={s*0.03} opacity="0.9"/>
      <circle cx={cx} cy={cy} r={s*0.04} fill={color}/>
      {[[0,-1],[0,1],[-1,0],[1,0]].map(([dx,dy],i) => (
        <circle key={i} cx={cx + dx*r} cy={cy + dy*r} r={s*0.035} fill={color} opacity="0.65"/>
      ))}
    </svg>
  );
}

const ALL_BADGES_DEF = [
  { id: 'century',    label: 'CENTURY CLUB',    desc: 'Attended 100 shows',         glyph: '💯', color: 'var(--orange)' },
  { id: 'fifty',      label: 'HALF-CENTURY',    desc: 'Attended 50 shows',          glyph: '★',  color: 'var(--cyan)'   },
  { id: 'quarter',    label: 'QUARTER-CENTURY', desc: 'Attended 25 shows',          glyph: '◉',  color: 'var(--cyan)'   },
  { id: 'ten',        label: 'DOUBLE DIGITS',   desc: 'Attended 10 shows',          glyph: '◈',  color: 'var(--cyan)'   },
  { id: 'rated_100',  label: 'HALL OF PHAME',   desc: 'Rated 100 shows',            glyph: '🏆', color: 'var(--orange)' },
  { id: 'rated_50',   label: 'ARCHIVIST',       desc: 'Rated 50 shows',             glyph: '⬡',  color: 'var(--green)'  },
  { id: 'rated_25',   label: 'PHISH SCHOLAR',   desc: 'Rated 25 shows',             glyph: '▦',  color: 'var(--cyan)'   },
  { id: 'rated_10',   label: 'PHAN OF 10',      desc: 'Rated 10 shows',             glyph: '✦',  color: 'var(--cyan)'   },
  { id: 'rated_1',    label: 'FIRST PHREEZE',   desc: 'Rated your first show',      glyph: '❄',  color: 'var(--cyan)'   },
  { id: 'critic',     label: 'PHISH CRITIC',    desc: 'Imported 10+ reviews',       glyph: '✍',  color: 'var(--green)'  },
  { id: 'reviewer',   label: 'REVIEWER',        desc: 'Imported phish.net reviews', glyph: '✎',  color: 'var(--green)'  },
  { id: 'streak_30',  label: 'ON FIRE',         desc: '30-day login streak',        glyph: '🔥', color: 'var(--orange)' },
  { id: 'streak_7',   label: 'ON A STREAK',     desc: '7-day login streak',         glyph: '⚡', color: 'var(--orange)' },
];

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
export function ProfileModal({ user, api, onClose, onAvatarChange, onLogout, initialSection = 'info' }) {
  const [sec, setSec] = React.useState(initialSection === 'info' ? 'phish' : initialSection);
  const [profile, setProfile] = React.useState(null);
  const [selectedIcon, setSelectedIcon] = React.useState(user?.avatar_icon || null);
  const [savingIcon, setSavingIcon] = React.useState(false);

  React.useEffect(() => {
    api.get('/user/profile').then(d => {
      setProfile(d);
      if (d.avatar_icon) setSelectedIcon(d.avatar_icon);
    }).catch(() => {});
  }, []);

  const saveProfile = async (patch) => {
    const updated = { ...profile, ...patch };
    setProfile(updated);
    try {
      await api.post('/user/profile', {
        phishnet_username: updated.phishnet_username || null,
        favorite_song: updated.favorite_song || null,
        favorite_venue: updated.favorite_venue || null,
        favorite_show_date: updated.favorite_show_date || null,
        avatar_icon: updated.avatar_icon || null,
        vantage_point: updated.vantage_point || null,
        show_style: updated.show_style || null,
        era_preference: updated.era_preference || null,
      });
    } catch (e) {}
  };

  const handleSaveIcon = async (icon) => {
    setSelectedIcon(icon);
    setSavingIcon(true);
    try {
      await saveProfile({ avatar_icon: icon });
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="profile-username-label">USERNAME</div>
              <div className="profile-username">{user?.username}</div>
              <div className="profile-email">{user?.email}</div>
            </div>
            <a href="https://buymeacoffee.com/mpgink" target="_blank" rel="noopener noreferrer" style={{
              fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '2.5px',
              border: '2px solid var(--orange)', padding: '12px 18px', flexShrink: 0, marginTop: 6,
              color: '#000',
              textDecoration: 'none', display: 'block',
              background: 'var(--orange)',
              boxShadow: '0 0 20px rgba(255,140,0,0.5)',
              fontWeight: 700,
            }}>◈ SUPPORT</a>
          </div>
        </div>
        {/* Section tabs */}
        <div className="profile-modal-tabs">
          {[['phish','MY PHISH'],['badges','BADGES'],['about','ABOUT']].map(([k,l]) => (
            <button key={k} onClick={() => setSec(k)}
              className={`profile-modal-tab ${sec === k ? 'active' : ''}`}>{l}</button>
          ))}
        </div>
        {/* Body */}
        <div className="profile-modal-body">

          {/* ── MY PHISH TAB ── */}
          {sec === 'phish' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

              {/* Identity block */}
              <div style={{ background: 'rgba(0,224,208,0.04)', borderLeft: '3px solid var(--cyan)', borderBottom: '1px solid rgba(0,224,208,0.15)', padding: '16px 14px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: 14 }}>◈ YOUR PHISH IDENTITY</div>
                {[
                  ['PHISH.NET HANDLE', profile?.phishnet_username],
                  ['FAVORITE SONG',    profile?.favorite_song],
                  ['FAVORITE VENUE',   profile?.favorite_venue],
                  ['FIRST SHOW',       profile?.favorite_show_date ? formatDate(profile.favorite_show_date) : null],
                ].map(([label, val]) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: val ? 'var(--white)' : 'rgba(51,255,51,0.2)' }}>
                      {val || '—'}
                    </div>
                  </div>
                ))}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'rgba(51,255,51,0.25)', marginTop: 8 }}>
                  Edit via phish.net import ↗
                </div>
              </div>

              {/* Avatar */}
              <div style={{ background: 'rgba(0,224,208,0.03)', borderLeft: '3px solid var(--cyan)', borderBottom: '1px solid rgba(0,224,208,0.1)', padding: '16px 14px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: 12 }}>
                  ◈ CHOOSE YOUR AVATAR{savingIcon && <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.44rem' }}>SAVING...</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {AVATAR_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => handleSaveIcon(opt.id)} style={{
                      aspectRatio: '1',
                      border: `2px solid ${selectedIcon === opt.id ? 'var(--cyan)' : 'rgba(51,255,51,0.12)'}`,
                      background: selectedIcon === opt.id ? 'rgba(0,224,208,0.1)' : 'rgba(0,0,0,0.3)',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8,
                      boxShadow: selectedIcon === opt.id ? '0 0 14px rgba(0,224,208,0.3)' : 'none',
                      transition: 'all 0.15s',
                    }}>
                      <PhreezerAvatar seed={opt.id} size={40} color={selectedIcon === opt.id ? '#00ffff' : 'rgba(0,224,208,0.4)'} />
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.36rem', color: selectedIcon === opt.id ? 'var(--cyan)' : 'var(--text-muted)', letterSpacing: '1px' }}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tap-to-select questions */}
              {[
                {
                  label: 'WHERE DO YOU USUALLY SIT?',
                  field: 'vantage_point',
                  options: [
                    { val: 'floor', label: 'FLOOR' },
                    { val: 'reserved', label: 'RESERVED' },
                    { val: 'lawn', label: 'LAWN' },
                  ]
                },
                {
                  label: 'FAVORITE ERA?',
                  field: 'era_preference',
                  options: [
                    { val: '1.0', label: '1.0' },
                    { val: '2.0', label: '2.0' },
                    { val: '3.0', label: '3.0' },
                    { val: '4.0', label: '4.0' },
                    { val: 'no-preference', label: 'ALL OF IT' },
                  ]
                },
                {
                  label: 'MIKE SIDE OR PAGE SIDE?',
                  field: 'stage_side',
                  options: [
                    { val: 'mike', label: 'MIKE SIDE' },
                    { val: 'page', label: 'PAGE SIDE' },
                    { val: 'center', label: 'CENTER' },
                    { val: 'no-preference', label: 'WHEREVER' },
                  ]
                },
                {
                  label: 'DO YOU DANCE OR CHILL?',
                  field: 'show_vibe',
                  options: [
                    { val: 'dance', label: 'I DANCE' },
                    { val: 'chill', label: 'I CHILL' },
                    { val: 'depends', label: 'DEPENDS ON THE JAM' },
                  ]
                },
              ].map(({ label, field, options }) => (
                <div key={field} style={{ borderLeft: '3px solid var(--cyan)', borderBottom: '1px solid rgba(0,224,208,0.1)', padding: '16px 14px', background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 12 }}>◈ {label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {options.map(opt => {
                      const active = profile?.[field] === opt.val;
                      return (
                        <button key={opt.val} onClick={() => saveProfile({ [field]: active ? null : opt.val })} style={{
                          padding: '10px 18px',
                          fontFamily: 'var(--font-display)',
                          fontSize: '0.62rem',
                          letterSpacing: '2px',
                          border: `1px solid ${active ? 'var(--cyan)' : 'rgba(51,255,51,0.2)'}`,
                          background: active ? 'rgba(0,224,208,0.12)' : 'transparent',
                          color: active ? 'var(--cyan)' : 'var(--text-label)',
                          cursor: 'pointer',
                          boxShadow: active ? '0 0 16px rgba(0,224,208,0.3)' : 'none',
                          textShadow: active ? '0 0 10px rgba(0,224,208,0.6)' : 'none',
                          transition: 'all 0.15s',
                        }}>
                          {active ? '◈ ' : ''}{opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Sign out + BMaC */}
              <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="https://buymeacoffee.com/mpgink" target="_blank" rel="noopener noreferrer"
                  className="btn-glow-cyan">◈ SUPPORT THE PHREEZER</a>
                <button className="btn-glow-red" onClick={() => { onLogout && onLogout(); onClose(); }}>SIGN OUT</button>
              </div>

            </div>
          )}

          {/* ── BADGES TAB ── */}
          {sec === 'badges' && (
            <BadgesSection api={api} />
          )}

          {/* ── ABOUT TAB ── */}
          {sec === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>

              <div style={{ background: 'rgba(0,224,208,0.04)', borderLeft: '3px solid var(--cyan)', borderBottom: '1px solid rgba(0,224,208,0.1)', padding: '20px 16px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: 14 }}>◈ ORIGIN STORY</div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-label)', lineHeight: 1.8, margin: '0 0 12px' }}>
                  Been part of this community for a long time. Always in awe of what the fans at Phish.net built — the reviews, the forums, the data, the obsession. I've contributed my own reviews and been part of the conversations for years.
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-label)', lineHeight: 1.8, margin: '0 0 12px' }}>
                  What I kept wanting was a way to rate — not just review. To score individual songs, track what I'd seen, and let the data tell me things about my own history with this band. Phish.net didn't have that. So I built it.
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-label)', lineHeight: 1.8, margin: 0 }}>
                  Phreezer is built on top of the community's work — the setlist data, the audio archives, the decades of fan documentation — and tries to add a layer that complements what's already there.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid var(--orange)', borderBottom: '1px solid rgba(255,140,0,0.1)', padding: '20px 16px', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: 16 }}>◈ WHAT THIS IS</div>
                {[
                  ['RATE', 'Score every song 1–5. Build a record of how you actually hear the music.'],
                  ['TRACK', 'Log what you attended, watched, or listened back. Your history, your way.'],
                  ['RELIVE', 'Deep Phreeze surfaces patterns in your data. When you see Phish, where, how often, what sticks.'],
                ].map(([verb, desc]) => (
                  <div key={verb} style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
                    <span style={{
                      fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '2px', flexShrink: 0, paddingTop: 2,
                      background: 'linear-gradient(90deg, #FF8C00 0%, #FFD700 40%, #FF6600 70%, #FF8C00 100%)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                      filter: 'drop-shadow(0 0 5px rgba(255,140,0,0.5))',
                    }}>{verb}.</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-label)', lineHeight: 1.6 }}>{desc}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderLeft: '3px solid var(--green)', borderBottom: '1px solid rgba(51,255,51,0.1)', padding: '20px 16px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: 12 }}>◈ BUILT BY</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--white)', marginBottom: 4 }}>mpgink</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
                  Fan. Builder. Trying not to suck at Phish.
                </div>
                <a href="https://buymeacoffee.com/mpgink" target="_blank" rel="noopener noreferrer"
                  className="btn-glow-cyan" style={{ display: 'block', textAlign: 'center' }}>
                  ◈ SUPPORT THE PHREEZER
                </a>
              </div>

              <div style={{ borderLeft: '3px solid rgba(51,255,51,0.3)', padding: '20px 16px', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: 16 }}>◈ STANDING ON SHOULDERS</div>
                {[
                  ['PHISH.NET', 'Setlists, show data, reviews, and decades of community documentation.', 'https://phish.net'],
                  ['PHISH.IN', 'Live audio archives. Stream what you\'re rating.', 'https://phish.in'],
                  ['ANTHROPIC', 'AI powering Vibe Check and Uncle Ebenezer.', 'https://anthropic.com'],
                ].map(([name, desc, href]) => (
                  <div key={name} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(51,255,51,0.06)' }}>
                    <a href={href} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: 'var(--font-display)', fontSize: '0.54rem', color: 'var(--cyan)', letterSpacing: '2px', textDecoration: 'none' }}>
                      {name} ↗
                    </a>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>{desc}</div>
                  </div>
                ))}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.64rem', color: 'rgba(51,255,51,0.2)', marginTop: 4 }}>
                  Independent fan project. Not affiliated with Phish, Phish.net, or Phish.in.
                </div>
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
