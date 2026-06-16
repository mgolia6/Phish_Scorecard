import React, { useState, useEffect } from 'react';
import { PrivacyModal } from './PrivacyModal';
import { DonationCard } from './DonationCard';
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

// ── BADGE METADATA ──────────────────────────────────────────
const BADGE_META = {
  phab_phive: {
    icon: '⬡',
    color: 'var(--orange)',
    label: 'PHAB PHIVE',
    desc: 'One of the first five Phreezers. Were here before anyone knew what this was.',
  },
  early_phreeze: {
    icon: '◈',
    color: 'var(--cyan)',
    label: 'EARLY PHREEZE',
    desc: 'Founding member. Showed up early and helped shape the room.',
  },
  milestone_5: {
    icon: '✦',
    color: 'var(--green)',
    label: '5 SHOWS RATED',
    desc: 'Rated 5 shows. You\'re in it.',
  },
  milestone_25: {
    icon: '✦',
    color: 'var(--cyan)',
    label: '25 SHOWS RATED',
    desc: 'Rated 25 shows. Serious Phreezer.',
  },
  milestone_50: {
    icon: '✦',
    color: 'var(--orange)',
    label: '50 SHOWS RATED',
    desc: 'Rated 50 shows. This is your thing now.',
  },
};

function BadgesTab({ api, user }) {
  const [badges, setBadges] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    api.get(`/users/badges?user_id=${user.id}`)
      .then(d => setBadges(d.badges || []))
      .catch(() => setBadges([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return (
    <div style={{ padding: '32px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
      LOADING...
    </div>
  );

  if (!badges.length) return (
    <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
      <div style={{ fontSize: '2.5rem', opacity: 0.2 }}>⬡</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'var(--text-muted)', letterSpacing: '3px' }}>NO BADGES YET</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', lineHeight: 1.7 }}>
        Rate shows, stay active, and badges will find you.
      </div>
    </div>
  );

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: 4 }}>
        ◈ YOUR BADGES — {badges.length}
      </div>
      {badges.map(b => {
        const meta = BADGE_META[b.badge_key] || { icon: '◉', color: 'var(--green)', label: b.badge_label, desc: '' };
        return (
          <div key={b.badge_key} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px',
            background: `${meta.color}08`,
            border: `1px solid ${meta.color}33`,
            borderLeft: `3px solid ${meta.color}`,
          }}>
            <div style={{
              width: 48, height: 48, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', color: meta.color,
              textShadow: `0 0 20px ${meta.color}88`,
              border: `1px solid ${meta.color}33`,
              background: `${meta.color}0d`,
            }}>
              {meta.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', color: meta.color, letterSpacing: '2.5px', marginBottom: 4 }}>
                {meta.label}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                {meta.desc}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


function AITab() {
  const D = {
    cyan: 'var(--cyan)',
    orange: 'var(--orange)',
    green: 'var(--green)',
    muted: 'var(--text-muted)',
    label: 'var(--text-label)',
    mono: 'var(--font-mono)',
    display: 'var(--font-display)',
    panel: 'var(--bg-panel)',
    border: 'var(--border)',
  };

  const features = [
    {
      icon: '◈',
      color: D.orange,
      title: 'ASK EBENEZER',
      where: 'Floating button — available on every show',
      what: 'A conversational agent with deep knowledge of Phish history, eras, setlists, and key jams. Ask him about a show, a tour, a song, or what to listen to next. He has access to your attended shows and ratings and will reference them when relevant.',
      loop: 'You ask. He responds. You decide what to do with it. He never rates shows on your behalf, never modifies your data, and never has access to any other user\'s information.',
    },
    {
      icon: '✦',
      color: D.cyan,
      title: 'VIBE CHECK',
      where: 'Show masthead — loads automatically when you open a show',
      what: 'Reads publicly available Phish.net community reviews for a show and generates a structured summary: what the community said, what stood out, what the consensus was. Results are cached so the same show doesn\'t regenerate on every visit.',
      loop: 'The source is public community reviews — not your ratings, not our data. You see the summary. You form your own opinion. Then you rate.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: 'rgba(0,224,208,0.04)', borderLeft: '3px solid var(--cyan)', borderBottom: '1px solid rgba(0,224,208,0.1)', padding: '20px 16px' }}>
        <div style={{ fontFamily: D.display, fontSize: '0.52rem', color: D.muted, letterSpacing: '3px', marginBottom: 14 }}>◈ AI IN THE PHREEZER</div>
        <p style={{ fontFamily: D.mono, fontSize: '0.8rem', color: D.label, lineHeight: 1.8, margin: '0 0 10px' }}>
          Two AI features. Both have a clear job. Neither makes decisions for you.
        </p>
        <p style={{ fontFamily: D.mono, fontSize: '0.8rem', color: D.label, lineHeight: 1.8, margin: 0 }}>
          The principle is simple: your ratings are yours. AI can inform, contextualize, and add personality — but it does not touch your data, influence your scores, or operate without you in the loop.
        </p>
      </div>

      {/* Feature cards */}
      {features.map((f, i) => (
        <div key={i} style={{ borderLeft: `3px solid ${f.color}`, borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '20px 16px', background: `${f.color}05` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontFamily: D.display, fontSize: '1.1rem', color: f.color, textShadow: `0 0 16px ${f.color}66` }}>{f.icon}</span>
            <div>
              <div style={{ fontFamily: D.display, fontSize: '0.62rem', color: f.color, letterSpacing: '2.5px' }}>{f.title}</div>
              <div style={{ fontFamily: D.mono, fontSize: '0.62rem', color: D.muted, marginTop: 2 }}>{f.where}</div>
            </div>
          </div>
          <p style={{ fontFamily: D.mono, fontSize: '0.78rem', color: D.label, lineHeight: 1.8, margin: '0 0 12px' }}>{f.what}</p>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${f.color}22`, borderLeft: `2px solid ${f.color}66`, padding: '10px 12px' }}>
            <div style={{ fontFamily: D.display, fontSize: '0.38rem', color: f.color, letterSpacing: '2px', marginBottom: 5, opacity: 0.7 }}>HUMAN IN THE LOOP</div>
            <p style={{ fontFamily: D.mono, fontSize: '0.74rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: 0 }}>{f.loop}</p>
          </div>
        </div>
      ))}

      {/* Principles */}
      <div style={{ borderLeft: '3px solid rgba(51,255,51,0.4)', padding: '20px 16px', background: 'rgba(51,255,51,0.02)' }}>
        <div style={{ fontFamily: D.display, fontSize: '0.52rem', color: D.muted, letterSpacing: '3px', marginBottom: 14 }}>◈ WHAT WE DON'T DO</div>
        {[
          'No AI-generated ratings. Every score in this app came from a human.',
          'No algorithmic recommendation engine. Ebenezer will suggest shows when you ask — that's a conversation, not a system working on you in the background.',
          'No user data shared between sessions or used to train models.',
          'No black box. Both features have a defined scope and stay in it.',
          'No AI that operates without you explicitly asking it to.',
        ].map((line, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--green)', fontFamily: D.mono, fontSize: '0.75rem', flexShrink: 0, marginTop: 1 }}>—</span>
            <span style={{ fontFamily: D.mono, fontSize: '0.78rem', color: D.label, lineHeight: 1.7 }}>{line}</span>
          </div>
        ))}
      </div>

      {/* Model disclosure */}
      <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ fontFamily: D.display, fontSize: '0.38rem', color: D.muted, letterSpacing: '2px', marginBottom: 6 }}>MODEL</div>
        <div style={{ fontFamily: D.mono, fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>
          Powered by Claude (Anthropic). Prompts are designed to keep responses grounded in Phish-specific knowledge and user context. Ebenezer does not have access to the internet, other users, or anything outside what you and the show record provide.
        </div>
      </div>

    </div>
  );
}

export function ProfileModal({ user, api, onClose, onAvatarChange, onLogout, initialSection = 'info' }) {
  const [sec, setSec] = React.useState(initialSection === 'info' ? 'phish' : initialSection);
  const [showPrivacy, setShowPrivacy] = React.useState(false);
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
        stage_side: updated.stage_side || null,
        show_vibe: updated.show_vibe || null,
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
    <>
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
          {[['phish','MY PHISH'],['badges','BADGES'],['about','ABOUT'],['ai','AI'],['shop','SHOP']].map(([k,l]) => (
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
          {sec === 'badges' && <BadgesTab api={api} user={user} />}
          {sec === 'badges_placeholder' && (
            <BadgesSection api={api} />
          )}

          {/* ── ABOUT TAB ── */}
          {sec === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>

              <div style={{ background: 'rgba(0,224,208,0.04)', borderLeft: '3px solid var(--cyan)', borderBottom: '1px solid rgba(0,224,208,0.1)', padding: '20px 16px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: 14 }}>◈ ORIGIN STORY</div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-label)', lineHeight: 1.8, margin: '0 0 14px' }}>
                  I’ve been blessed to be a part of the Phish community for over three decades. I remember immediately feeling embraced by the community even at my first few shows. There is a comfort I have found being in a crowd of thousands at a Phish show that evades me in other large crowd situations. It’s that felt sense of joy and also critical analysis of the music that keeps the experience fresh and perpetuates the scene.
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-label)', lineHeight: 1.8, margin: '0 0 14px' }}>
                  For a while I have looked for ways to participate further in the community. I have volunteered for reviews, participated in forums, done meetups during tours. But I always wanted to contribute more.
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-label)', lineHeight: 1.8, margin: '0 0 14px' }}>
                  I’ve always been fascinated by statistics, keeping records of things that others might have felt were arbitrary or unimportant. That is a huge allure to this community that keeps track of so many of the important details.
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-label)', lineHeight: 1.8, margin: '0 0 14px' }}>
                  The honest inspiration for this whole thing is <a href="http://www.ihoz.com/PhishStats.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>ihoz.com</a> — ZZYZX’s Phishtistics page. I’ve loved that site for years. It’s where the idea was sparked. The data compiled in this community over the decades is extraordinary — it deserves a place to shine. Phreezer is my attempt to build on that foundation and elevate it for a new era.
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-label)', lineHeight: 1.8, margin: '0 0 14px' }}>
                  It started as an Excel spreadsheet pulling from the Phish.net API, turned into a stab at a website, and eventually became this. The ability to rate shows by song, stream the live recording directly from Phish.in, and surface stats specific to you — all in one place.
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-label)', lineHeight: 1.8, margin: '0 0 14px' }}>
                  Please use the feedback button to share your thoughts — what’s missing for you, what you like, what you hate, what I did right and wrong. Be honest. I’ll try to accommodate and adjust to the best of my ability.
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-label)', lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>
                  And, hopefully you enjoy it and it helps us all suck a little less at Phish.
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

              {/* Privacy link */}
              <div style={{ padding: '16px 20px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <button
                  onClick={() => setShowPrivacy(true)}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                    color: 'rgba(255,255,255,0.25)', letterSpacing: '1px',
                    textDecoration: 'underline', padding: 0,
                  }}
                >
                  Privacy Policy
                </button>
              </div>

            </div>
          )}

          {/* ── SHOP TAB ── */}
          {sec === 'ai' && <AITab />}
          {sec === 'shop' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 0 40px' }}>

              {/* Mockingbird donation tracker */}
              <DonationCard />

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, padding: '0 4px' }}>
                Represent at lot. Every purchase supports an independent fan project.
              </div>

              {[
                {
                  name: 'PHREEZER LOGO T-SHIRT',
                  sub: 'Ice Blue Tech Typography',
                  price: 'From $23.99',
                  desc: 'Softstyle tee. Phreezer snowflake logo across the chest. Multiple colors and sizes.',
                  url: 'https://mattymattemodgepodge.etsy.com/listing/4521116067',
                  img: 'https://i.etsystatic.com/65030338/r/il/d9b7e1/8178642947/il_794xN.8178642947_6oe7.jpg',
                  color: 'var(--cyan)',
                },
                {
                  name: 'PHREEZER LOGO BUMPER STICKER',
                  sub: 'Snowflake Tech Decal',
                  price: 'From $11.99',
                  desc: 'Matte finish, UV-resistant, waterproof. For bumpers, laptops, water bottles.',
                  url: 'https://mattymattemodgepodge.etsy.com/listing/4521118995',
                  img: 'https://i.etsystatic.com/65030338/r/il/109253/8130742818/il_794xN.8130742818_7dzl.jpg',
                  color: 'var(--orange)',
                },
                {
                  name: "DON'T SUCK AT PHISH BUMPER STICKER",
                  sub: 'The Tagline. On a Sticker.',
                  price: 'From $8.99',
                  desc: 'Three sizes. Matte finish, UV laminate, durable vinyl rated 5+ years outdoors. Say it loud.',
                  url: 'https://mattymattemodgepodge.etsy.com/listing/4521316287',
                  img: 'https://i.etsystatic.com/65030338/r/il/cce4b4/8132229006/il_794xN.8132229006_2xw7.jpg',
                  color: 'var(--green)',
                },
              ].map(p => (
                <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderTop: `2px solid ${p.color}`, overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: 200, overflow: 'hidden', background: '#111' }}>
                      <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                    <div style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', letterSpacing: '2px', color: p.color, fontWeight: 700, marginBottom: 2 }}>{p.name}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>{p.sub}</div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: p.color, whiteSpace: 'nowrap', marginLeft: 10 }}>{p.price}</div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 12 }}>{p.desc}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '2px', color: p.color }}>SHOP ON ETSY →</div>
                    </div>
                  </div>
                </a>
              ))}

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.15)', lineHeight: 1.8, textAlign: 'center', paddingTop: 8 }}>
                Sold via Etsy · Fulfilled by Printify<br />
                Questions? phreezer.support@mpgink.com
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
    {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </>
  );
}

// ============================================================
// ROOT APP
// ============================================================







