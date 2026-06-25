import React, { useState, useEffect } from 'react';
import { PhreezeFeed } from './PhreezeFeed';
import { FullPageLoader } from './FullPageLoader';
import { formatDate } from '../utils';

// ============================================================
// SHARED EXPAND CARD
// ============================================================
export function CommExpandCard({ name, sub, avg, count, countLabel = 'RATINGS', accent = 'var(--cyan)', extraStats = [], badge = null, children }) {
  const [open, setOpen] = useState(false);
  const scoreColor = parseFloat(avg) >= 4.7 ? 'var(--orange)' : 'var(--cyan)';
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderLeft: `3px solid ${accent}` }}>
        <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          {/* Name + sub + badge */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
              {badge && (
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '1.5px', padding: '2px 7px', border: `1px solid ${badge.color}55`, color: badge.color, background: `${badge.color}0d`, whiteSpace: 'nowrap', flexShrink: 0 }}>{badge.label}</span>
              )}
            </div>
            {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub}</div>}
          </div>
          {/* Extra stats — desktop only */}
          {extraStats.length > 0 && (
            <div className="desktop-card-stats">
              {extraStats.map((s, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '0 12px', borderLeft: '1px solid rgba(var(--ink-rgb),0.06)' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: s.color || 'var(--green)', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--text-muted)', letterSpacing: '1.5px', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
          {/* Score + user delta + expand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: scoreColor, textShadow: `0 0 12px ${scoreColor}55`, letterSpacing: 1, lineHeight: 1 }}>{avg}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--text-muted)', letterSpacing: '1.5px', marginTop: 3 }}>{count} {countLabel}</div>
            </div>
            <button onClick={() => setOpen(o => !o)} style={{ background: 'transparent', border: '1px solid rgba(var(--green-rgb),0.2)', color: 'var(--text-label)', fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '1.5px', padding: '5px 9px', cursor: 'pointer' }}>
              {open ? '▲' : '▼'}
            </button>
          </div>
        </div>
        {open && (
          <div style={{ borderTop: '1px solid rgba(var(--green-rgb),0.07)', padding: '12px 14px', background: 'var(--bg-elevated)' }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// USER DELTA CHIP — shown when logged in
// ============================================================
function UserDelta({ userScore, communityAvg, label = 'YOUR SCORE' }) {
  if (!userScore) return null;
  const delta = Math.round((parseFloat(userScore) - parseFloat(communityAvg)) * 10) / 10;
  const sign = delta > 0 ? '+' : '';
  const color = delta > 0.2 ? 'var(--orange)' : delta < -0.2 ? 'rgba(255,51,51,0.8)' : 'var(--green)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--inset)', border: `1px solid ${color}33`, marginBottom: 10 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--text-muted)', letterSpacing: '2px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color, letterSpacing: 1 }}>{parseFloat(userScore).toFixed(2)}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color, letterSpacing: '1.5px' }}>{sign}{delta} VS COMMUNITY</div>
    </div>
  );
}

// ============================================================
// ROW COMPONENTS
// ============================================================
export function CommShowRows({ shows, label = 'TOP SHOWS' }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 9 }}>{label}</div>
      {shows.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < shows.length - 1 ? '1px solid rgba(var(--green-rgb),0.06)' : 'none' }}>
          <a href={`https://phish.in/${s.show_date}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, border: '1px solid rgba(var(--cyan-bright-rgb),0.4)', background: 'rgba(var(--cyan-bright-rgb),0.05)', color: 'var(--cyan)', fontSize: '0.62rem', textDecoration: 'none', flexShrink: 0 }}>▶</a>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-label)', flex: 1 }}>{formatDate(s.show_date)}</span>
          {s.day_of_week && <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>{s.day_of_week.toUpperCase()}</span>}
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.84rem', color: parseFloat(s.avg_score) >= 4.9 ? 'var(--orange)' : 'var(--cyan)', letterSpacing: 1 }}>{s.avg_score}</span>
        </div>
      ))}
    </div>
  );
}

export function CommVersionRows({ versions, label = 'TOP VERSIONS' }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 9 }}>{label}</div>
      {versions.map((v, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < versions.length - 1 ? '1px solid rgba(var(--green-rgb),0.06)' : 'none' }}>
          <a href={`https://phish.in/${v.show_date}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, border: '1px solid rgba(var(--cyan-bright-rgb),0.4)', background: 'rgba(var(--cyan-bright-rgb),0.05)', color: 'var(--cyan)', fontSize: '0.62rem', textDecoration: 'none', flexShrink: 0 }}>▶</a>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--white)' }}>{formatDate(v.show_date)}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {v.venue}{v.city ? `, ${v.city}` : ''}
              {v.set_number && <span style={{ marginLeft: 6, fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>SET {v.set_number.toUpperCase()}</span>}
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.84rem', color: parseFloat(v.avg_score) >= 4.9 ? 'var(--orange)' : 'var(--cyan)', letterSpacing: 1, flexShrink: 0 }}>{v.avg_score}</span>
        </div>
      ))}
    </div>
  );
}

export function CommSongRows({ songs, label = 'TOP SONGS IN THIS SHOW' }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 9 }}>{label}</div>
      {songs.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < songs.length - 1 ? '1px solid rgba(var(--green-rgb),0.06)' : 'none' }}>
          {s.set_number && <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--text-muted)', letterSpacing: '1px', minWidth: 20, flexShrink: 0 }}>S{s.set_number.toUpperCase()}</span>}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--white)', flex: 1 }}>{s.song_name}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.84rem', color: parseFloat(s.avg_score) >= 4.9 ? 'var(--orange)' : 'var(--cyan)', letterSpacing: 1 }}>{s.avg_score}</span>
        </div>
      ))}
    </div>
  );
}

// Set breakdown pill row
function SetBreakdown({ s1, s2, enc }) {
  const items = [];
  if (s1 > 0) items.push({ label: 'SET 1', count: s1, color: 'var(--cyan)' });
  if (s2 > 0) items.push({ label: 'SET 2', count: s2, color: 'var(--orange)' });
  if (enc > 0) items.push({ label: 'ENCORE', count: enc, color: 'var(--green)' });
  if (!items.length) return null;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6, marginBottom: 2 }}>
      {items.map((it, i) => (
        <span key={i} style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '1.5px', padding: '2px 8px', border: `1px solid ${it.color}44`, color: it.color, background: `${it.color}0a` }}>
          {it.label}: {it.count}
        </span>
      ))}
    </div>
  );
}

export function CommStateRows({ states, label = 'STATE RANKINGS' }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 9 }}>{label}</div>
      {states.map((s, i) => (
        <div key={s.state} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < states.length - 1 ? '1px solid rgba(var(--green-rgb),0.06)' : 'none' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', color: 'var(--text-muted)', minWidth: 22 }}>{i + 1}.</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: 'var(--white)', letterSpacing: '2px', marginBottom: 2 }}>{s.state}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)' }}>Top: {s.top_venue} · {s.show_count} shows</div>
          </div>
          <div style={{ width: 50, height: 3, background: 'rgba(var(--green-rgb),0.07)', borderRadius: 2 }}>
            <div style={{ width: `${Math.min(((parseFloat(s.avg_score) - 3) / 2) * 100, 100)}%`, height: '100%', background: i === 0 ? 'var(--orange)' : 'var(--cyan)', borderRadius: 2 }} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: i === 0 ? 'var(--orange)' : 'var(--cyan)', letterSpacing: 1, textAlign: 'right', minWidth: 36 }}>{s.avg_score}</div>
        </div>
      ))}
    </div>
  );
}

export function CommKPIGrid({ items }) {
  return (
    <div className="kpi-grid" style={{ marginBottom: 14 }}>
      {items.map((k, i) => (
        <div key={i} className="kpi-card" style={{ borderTopColor: k.color }}>
          <div className="kpi-value" style={{ color: k.color, fontSize: k.small ? '0.72rem' : '1.55rem', lineHeight: 1.2, textAlign: 'center', wordBreak: 'break-word' }}>{k.value}</div>
          <div className="kpi-label">{k.label}</div>
          {k.sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)', textAlign: 'center' }}>{k.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// PHRIEND OVERLAP
// ============================================================
export function PhriendOverlapCommunity({ api, onRateShow, user, onLogin }) {
  if (!user) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:24, textAlign:'center', padding:'40px 24px' }}>
        <div style={{ fontSize:'4rem', color:'var(--cyan)', textShadow:'0 0 30px rgba(var(--cyan-rgb),0.5)' }}>⚇</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', color:'var(--cyan)', letterSpacing:'4px', textShadow:'0 0 20px rgba(var(--cyan-rgb),0.4)' }}>PHRIEND OVERLAP</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'0.65rem', color:'rgba(var(--ink-rgb),0.5)', letterSpacing:'2px', lineHeight:2, maxWidth:420 }}>
          Find out who you shared a setlist with — intentionally or not.<br/>
          40 years of shows. Countless accidental reunions waiting to be discovered.
        </div>
        <div style={{ display:'flex', gap:16 }}>
          <button onClick={() => onLogin('signup')} style={{ fontFamily:'var(--font-display)', fontSize:'0.72rem', letterSpacing:'2.5px', padding:'14px 36px', background:'transparent', border:'1px solid var(--orange)', color:'var(--orange)', cursor:'pointer', boxShadow:'0 0 16px rgba(var(--orange-rgb),0.25)' }}>+ CREATE ACCOUNT</button>
          <button onClick={() => onLogin('login')} style={{ fontFamily:'var(--font-display)', fontSize:'0.65rem', letterSpacing:'2px', padding:'12px 24px', background:'transparent', border:'1px solid rgba(var(--green-rgb),0.25)', color:'rgba(var(--green-rgb),0.6)', cursor:'pointer' }}>→ LOGIN</button>
        </div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.65rem', color:'rgba(var(--ink-rgb),0.2)', letterSpacing:'1.5px', marginTop:8 }}>FREE · NO CREDIT CARD · JUST A USERNAME</div>
      </div>
    );
  }

  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [autocomplete, setAutocomplete] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companions, setCompanions] = useState({});
  const debounceRef = React.useRef(null);

  React.useEffect(() => {
    api.get('/community/overlap-suggestions')
      .then(d => setSuggestions(d.suggestions || []))
      .catch(() => setSuggestions([]))
      .finally(() => setSuggestionsLoading(false));
  }, []);

  const handleInputChange = (val) => {
    setInput(val); setSelectedUser(null); setResult(null); setError('');
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setAutocomplete([]); setDropdownOpen(true); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const d = await api.get(`/community/user-search?q=${encodeURIComponent(val.trim())}`);
        setAutocomplete(d.users || []); setDropdownOpen(true);
      } catch { setAutocomplete([]); }
    }, 250);
  };

  const selectUser = (username) => { setInput(username); setSelectedUser(username); setDropdownOpen(false); setAutocomplete([]); runSearch(username); };

  const runSearch = async (username) => {
    if (!username?.trim()) return;
    setLoading(true); setResult(null); setError(''); setCompanions({});
    try {
      const data = await api.get(`/community/phriend-overlap?username=${encodeURIComponent(username.trim())}`);
      setResult(data);
      if (data.shows?.length && data.target?.user_id) {
        const dates = data.shows.map(s => s.show_date).join(',');
        try {
          const cd = await api.get(`/community/companions?with_user_id=${data.target.user_id}&show_dates=${encodeURIComponent(dates)}`);
          setCompanions(cd.companions || {});
        } catch (e) {}
      }
    } catch (e) { setError(e.message || 'User not found'); }
    finally { setLoading(false); }
  };

  const toggleCompanion = async (showDate) => {
    if (!result?.target?.user_id) return;
    try {
      const updated = await api.post('/community/companions', { companion_user_id: result.target.user_id, show_date: showDate });
      setCompanions(c => ({ ...c, [showDate]: updated }));
    } catch (e) {}
  };

  const dropdownItems = input.trim()
    ? autocomplete.map(u => ({ username: u, sub: null }))
    : suggestions.map(s => ({ username: s.username, sub: `${s.shared_count} shared show${s.shared_count !== 1 ? 's' : ''}` }));
  const showDropdown = dropdownOpen && !selectedUser && dropdownItems.length > 0;

  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 12 }}>FIND SHOWS YOU BOTH ATTENDED — INTENTIONAL OR NOT</div>
      <div style={{ position: 'relative', marginBottom: 0 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => handleInputChange(e.target.value)} onFocus={() => setDropdownOpen(true)} onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
            onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { setDropdownOpen(false); runSearch(input.trim()); } if (e.key === 'Escape') setDropdownOpen(false); }}
            placeholder="type a username or tap a phriend below..."
            type="text" name="phriend-search" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} inputMode="text" enterKeyHint="search" data-1p-ignore data-lpignore="true" data-form-type="other"
            style={{ flex: 1, background: 'var(--inset-strong)', border: dropdownOpen ? '1px solid rgba(var(--orange-bright-rgb),0.6)' : '1px solid rgba(var(--orange-bright-rgb),0.35)', color: 'var(--white)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: '10px 12px', outline: 'none' }} />
          <button onClick={() => { setDropdownOpen(false); runSearch(input.trim()); }} disabled={loading || !input.trim()}
            style={{ border: '1px solid rgba(var(--orange-bright-rgb),0.35)', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2px', padding: '10px 14px', cursor: 'pointer', opacity: (loading || !input.trim()) ? 0.4 : 1, background: 'transparent' }}>
            {loading ? '...' : 'SCAN'}
          </button>
        </div>
        {showDropdown && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-elevated)', border: '1px solid rgba(var(--orange-bright-rgb),0.35)', borderTop: 'none', zIndex: 100, maxHeight: 260, overflowY: 'auto' }}>
            {!input.trim() && <div style={{ padding: '7px 12px 5px', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2.5px', color: 'rgba(var(--orange-bright-rgb),0.75)', borderBottom: '1px solid rgba(var(--orange-bright-rgb),0.1)' }}>{suggestionsLoading ? 'SCANNING YOUR SHOWS...' : 'PHRIENDS WHO WERE THERE'}</div>}
            {dropdownItems.map((item, i) => (
              <div key={item.username} onMouseDown={() => selectUser(item.username)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: i < dropdownItems.length - 1 ? '1px solid rgba(var(--ink-rgb),0.04)' : 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--orange-bright-rgb),0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(var(--orange-bright-rgb),0.4)', background: 'rgba(var(--orange-bright-rgb),0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.62rem', color: 'var(--orange)', flexShrink: 0 }}>{item.username.slice(0, 2).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.username}</div>
                  {item.sub && <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'rgba(var(--orange-bright-rgb),0.78)', letterSpacing: '1.5px', marginTop: 2 }}>{item.sub.toUpperCase()}</div>}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'rgba(var(--orange-bright-rgb),0.7)', letterSpacing: '1px', flexShrink: 0 }}>▶</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!result && !loading && !error && !dropdownOpen && !input.trim() && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'rgba(var(--orange-bright-rgb),0.75)', letterSpacing: '2px', marginBottom: 10 }}>PHRIENDS WHO WERE THERE</div>
          {suggestionsLoading ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', padding: '16px 0' }}>scanning your shows...</div>
          ) : suggestions.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '20px 0', border: '1px solid var(--border)' }}>NO OTHER USERS SHARE YOUR ATTENDED SHOWS YET<br/><span style={{ color: 'rgba(var(--orange-bright-rgb),0.65)', marginTop: 6, display: 'block' }}>CHECK BACK AS THE COMMUNITY GROWS</span></div>
          ) : (
            suggestions.map(s => (
              <div key={s.username} onClick={() => selectUser(s.username)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', border: '1px solid rgba(var(--orange-bright-rgb),0.15)', borderLeft: '3px solid rgba(var(--orange-bright-rgb),0.4)', background: 'rgba(var(--orange-bright-rgb),0.03)', marginBottom: 6, cursor: 'pointer' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(var(--orange-bright-rgb),0.4)', background: 'rgba(var(--orange-bright-rgb),0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.62rem', color: 'var(--orange)', flexShrink: 0 }}>{s.username.slice(0, 2).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: 'var(--white)' }}>{s.username}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'rgba(var(--orange-bright-rgb),0.8)', letterSpacing: '1.5px', marginTop: 2 }}>{s.shared_count} SHARED SHOW{s.shared_count !== 1 ? 'S' : ''}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'rgba(var(--orange-bright-rgb),0.7)', letterSpacing: '1px' }}>SCAN ▶</div>
              </div>
            ))
          )}
        </div>
      )}

      {error && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--red)', marginTop: 12 }}>{error}</div>}

      {result && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, marginTop: 14, padding: '12px 14px', border: '1px solid rgba(var(--orange-bright-rgb),0.25)', background: 'linear-gradient(135deg, rgba(var(--orange-bright-rgb),0.05), var(--card-deep))' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(var(--orange-bright-rgb),0.45)', background: 'rgba(var(--orange-bright-rgb),0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.66rem', color: 'var(--orange)', flexShrink: 0 }}>{result.target.username.slice(0,2).toUpperCase()}</div>
            <div style={{ flex: 1 }}><div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: 'var(--white)' }}>{result.target.username}</div></div>
            <button onClick={() => { setResult(null); setInput(''); setSelectedUser(null); }} style={{ background: 'transparent', border: '1px solid rgba(var(--orange-bright-rgb),0.25)', color: 'rgba(var(--orange-bright-rgb),0.7)', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '1.5px', padding: '5px 9px', cursor: 'pointer' }}>X CLEAR</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
            {[{ v: result.total_shared, l: 'SHOWS TOGETHER' }, { v: result.unique_venues, l: 'VENUES' }, { v: result.unique_years, l: 'YEARS' }].map(({ v, l }) => (
              <div key={l} style={{ textAlign: 'center', padding: '10px 4px', border: '1px solid rgba(var(--orange-bright-rgb),0.2)', background: 'rgba(var(--orange-bright-rgb),0.04)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--orange)', lineHeight: 1, marginBottom: 4 }}>{v}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '1.5px', color: 'rgba(var(--orange-bright-rgb),0.7)' }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 2px 8px', marginBottom: 4, borderBottom: '1px solid rgba(var(--ink-rgb),0.06)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '2px', color: 'var(--text-muted)' }}>SHOW</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '1.5px', color: 'var(--cyan)' }}>YOU</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '1.5px', color: 'var(--orange)' }}>THEM</span>
            </div>
          </div>
          {result.shows.map((s, i) => {
            const cs = companions[s.show_date] || {};
            const iMarked = cs.i_marked;
            const mutual = cs.mutual;
            return (
              <div key={i} style={{ padding: '12px 12px', border: mutual ? '1px solid rgba(var(--green-rgb),0.5)' : '1px solid var(--border)', borderLeft: mutual ? '3px solid var(--green)' : iMarked ? '3px solid rgba(var(--cyan-rgb),0.5)' : '3px solid transparent', background: mutual ? 'rgba(var(--green-rgb),0.04)' : 'rgba(0,0,0,0.3)', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '1.5px' }}>
                    {(() => { const [y,m,dd]=s.show_date.split('-'); const mn=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']; return `${mn[+m-1]} ${+dd}, ${y}`; })()}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => onRateShow && onRateShow(s.show_date)} title={s.my_score ? 'View / edit your rating' : 'Rate this show'}
                      style={{ fontFamily: 'var(--font-display)', fontSize: '0.66rem', padding: '3px 8px', border: '1px solid rgba(var(--cyan-rgb),0.4)', color: s.my_score ? 'var(--cyan)' : 'rgba(var(--cyan-rgb),0.4)', minWidth: 36, textAlign: 'center', background: 'transparent', cursor: 'pointer' }}>{s.my_score || '+'}</button>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.66rem', padding: '3px 8px', border: '1px solid rgba(var(--orange-bright-rgb),0.3)', color: 'var(--orange)', minWidth: 36, textAlign: 'center' }}>{s.their_score || '—'}</span>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--green)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.venue ? `${s.venue}${s.city ? ` — ${s.city}` : ''}` : '—'}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {mutual ? <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--green)', letterSpacing: '2px' }}>❄ MUTUAL COMPANION</span> : <span />}
                  <button onClick={() => toggleCompanion(s.show_date)}
                    style={{ background: iMarked ? 'rgba(var(--green-rgb),0.1)' : 'rgba(var(--cyan-rgb),0.05)', border: `1px solid ${iMarked ? 'rgba(var(--green-rgb),0.6)' : 'rgba(var(--cyan-rgb),0.4)'}`, color: iMarked ? 'var(--green)' : 'var(--cyan)', fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '2px', padding: '6px 14px', cursor: 'pointer' }}>
                    {iMarked ? '◈ COMPANION' : '+ COMPANION'}
                  </button>
                </div>
              </div>
            );
          })}
          {result.shows.length === 0 && <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '20px 0' }}>NO SHARED SHOWS FOUND</div>}
        </>
      )}
    </div>
  );
}

// ============================================================
// COMMUNITY TAB — all sub-tabs
// ============================================================
export function CommunityTab({ api, subTab = 'leaderboard', onRateShow, user, onLogin }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [topShows, setTopShows] = useState(null);
  const [topSongs, setTopSongs] = useState(null);
  const [topVenues, setTopVenues] = useState(null);
  const [topStates, setTopStates] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subTab === 'feed') { setLoading(false); return; }
    setLoading(true);
    let req;
    if (subTab === 'leaderboard')    req = api.get('/community/leaderboard').then(setLeaderboard);
    else if (subTab === 'top-shows')  req = api.get('/community/top-shows').then(setTopShows);
    else if (subTab === 'top-songs')  req = api.get('/community/top-songs').then(setTopSongs);
    else if (subTab === 'top-venues') req = api.get('/community/top-venues').then(setTopVenues);
    else if (subTab === 'top-states') req = api.get('/community/top-states').then(setTopStates);
    if (req) req.catch(() => {}).finally(() => setLoading(false));
    else setLoading(false);
  }, [subTab]);

  if (loading) return <FullPageLoader text="LOADING..." />;

  // ── LEADERBOARD ──────────────────────────────────────────
  if (subTab === 'leaderboard') {
    return (
      <div className="panel">
        <div className="panel-title">LEADERBOARD</div>
        {!leaderboard.length ? (
          <div className="lb-empty">NO DATA YET — RATE SOME SHOWS</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {leaderboard.map(row => (
              <div key={row.username} className={`leaderboard-row ${row.is_me ? 'is-me' : ''}`}
                style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto auto auto auto auto', alignItems: 'center', gap: '8px', padding: '11px 14px', borderBottom: '1px solid rgba(var(--green-rgb),0.06)', borderLeft: row.is_me ? '2px solid var(--cyan)' : 'none', background: row.is_me ? 'rgba(var(--cyan-bright-rgb),0.025)' : 'transparent' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: row.rank === 1 ? 'var(--orange)' : row.rank === 2 ? 'var(--cyan)' : row.rank === 3 ? 'var(--green)' : 'var(--text-muted)' }}>{row.rank === 1 ? '★' : row.rank === 2 ? '◈' : row.rank === 3 ? '◉' : row.rank}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: row.is_me ? 'var(--cyan)' : 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.username}{row.is_me && <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--cyan)', marginLeft: 6, letterSpacing: '1px', opacity: 0.7 }}> ◈ YOU</span>}</span>
                <span title="Shows rated" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-label)', textAlign: 'right' }}>{row.shows_rated}</span>
                <span title="Avg score" style={{ fontFamily: 'var(--font-display)', fontSize: '0.76rem', color: 'var(--orange)', letterSpacing: 1, textAlign: 'right' }}>{row.avg_score ?? '—'}</span>
                <span title="Login streak" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-label)', textAlign: 'right' }}>{row.login_streak > 1 ? `⚡${row.login_streak}` : '—'}</span>
                <span title="Feedback submitted" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: row.feedback_count > 0 ? 'var(--green)' : 'var(--text-muted)', textAlign: 'right' }}>{row.feedback_count > 0 ? `◈${row.feedback_count}` : '—'}</span>
                <span title="Bugs reported" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: row.bugs_reported > 0 ? 'var(--orange)' : 'var(--text-muted)', textAlign: 'right' }}>{row.bugs_reported > 0 ? `⚠${row.bugs_reported}` : '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── TOP SHOWS ─────────────────────────────────────────────
  if (subTab === 'top-shows') {
    const s = topShows?.stats;
    return (
      <div>
        <CommKPIGrid items={[
          { label: 'SHOWS COVERED', value: s?.shows_covered || '—', color: 'var(--cyan)' },
          { label: 'OVERALL AVG', value: s?.overall_avg || '—', color: 'var(--orange)' },
          { label: 'MOST RATED', value: s?.most_rated?.raters ? `${s.most_rated.raters} RATERS` : '—', color: 'var(--green)', small: true },
          { label: 'TOP SHOW', value: s?.most_rated?.show_date ? formatDate(s.most_rated.show_date) : '—', color: 'var(--cyan)', small: true },
        ]} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 9 }}>TOP RATED SHOWS — TAP FOR SONGS</div>
        {(topShows?.shows || []).map((show, i) => {
          const badge = show.user_score
            ? { label: show.user_delta > 0 ? `YOU +${show.user_delta}` : show.user_delta < 0 ? `YOU ${show.user_delta}` : 'YOU ±0', color: show.user_delta > 0.2 ? 'var(--orange)' : show.user_delta < -0.2 ? 'rgba(255,51,51,0.8)' : 'var(--green)' }
            : null;
          return (
            <CommExpandCard key={show.show_date}
              name={formatDate(show.show_date)}
              sub={`${show.venue}${show.city ? ` · ${show.city}` : ''}${show.state ? `, ${show.state}` : ''}`}
              avg={show.avg_score} count={show.rater_count} countLabel="RATERS"
              accent={i === 0 ? 'var(--orange)' : 'var(--cyan)'}
              badge={badge}
              extraStats={[
                { value: show.rater_count, label: 'RATERS', color: 'var(--cyan)' },
                { value: show.song_count || '—', label: 'SONGS', color: 'var(--green)' },
                { value: show.day_of_week ? show.day_of_week.toUpperCase() : '—', label: 'DAY', color: 'var(--text-muted)' },
                ...(show.set1_count > 0 || show.set2_count > 0 ? [{ value: `${show.set1_count}·${show.set2_count}${show.encore_count > 0 ? `·${show.encore_count}` : ''}`, label: 'S1·S2·E', color: 'var(--orange)' }] : []),
              ]}>
              {show.user_score && <UserDelta userScore={show.user_score} communityAvg={show.avg_score} />}
              <CommSongRows songs={show.top_songs || []} />
              {(show.set1_count > 0 || show.set2_count > 0) && (
                <SetBreakdown s1={show.set1_count} s2={show.set2_count} enc={show.encore_count} />
              )}
              <div style={{ marginTop: 12 }}>
                <a href={`https://phish.in/${show.show_date}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, border: '1px solid rgba(var(--cyan-bright-rgb),0.4)', background: 'rgba(var(--cyan-bright-rgb),0.05)', color: 'var(--cyan)', fontSize: '0.65rem', textDecoration: 'none' }}>▶</a>
              </div>
            </CommExpandCard>
          );
        })}
      </div>
    );
  }

  // ── TOP SONGS ─────────────────────────────────────────────
  if (subTab === 'top-songs') {
    const s = topSongs?.stats;
    return (
      <div>
        <CommKPIGrid items={[
          { label: 'SONGS RATED', value: s?.songs_rated || '—', color: 'var(--cyan)' },
          { label: 'HIGHEST RATED', value: topSongs?.songs?.[0]?.avg_score || '—', color: 'var(--orange)' },
          { label: 'TOTAL RATINGS', value: s?.total_ratings ? `${(s.total_ratings / 1000).toFixed(1)}K` : '—', color: 'var(--green)' },
          { label: 'MOST RATED', value: s?.most_rated?.song_name || '—', color: 'var(--cyan)', small: true },
        ]} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 9 }}>TOP SONGS — TAP FOR TOP VERSIONS</div>
        {(topSongs?.songs || []).map((song, i) => {
          const badge = song.user_avg
            ? { label: song.user_avg > song.avg_score ? `YOU +${Math.round((parseFloat(song.user_avg) - parseFloat(song.avg_score)) * 10) / 10}` : `YOU ${Math.round((parseFloat(song.user_avg) - parseFloat(song.avg_score)) * 10) / 10}`, color: parseFloat(song.user_avg) > parseFloat(song.avg_score) ? 'var(--orange)' : 'rgba(255,51,51,0.8)' }
            : null;
          return (
            <CommExpandCard key={song.song_name} name={song.song_name}
              sub={`${song.unique_shows_rated} show${song.unique_shows_rated !== 1 ? 's' : ''} · ${song.unique_raters} rater${song.unique_raters !== 1 ? 's' : ''}`}
              avg={song.avg_score} count={song.total_ratings} countLabel="RATINGS"
              accent={i === 0 ? 'var(--orange)' : 'var(--cyan)'}
              badge={badge}
              extraStats={[
                { value: song.unique_raters, label: 'RATERS', color: 'var(--cyan)' },
                { value: song.unique_shows_rated, label: 'VERSIONS', color: 'var(--green)' },
                { value: song.set2_ratings > song.set1_ratings ? 'SET 2' : song.set1_ratings > 0 ? 'SET 1' : '—', label: 'HOME SET', color: 'var(--orange)' },
                ...(song.first_rated_date ? [{ value: song.first_rated_date.slice(0, 4), label: 'FIRST RATED', color: 'var(--text-muted)' }] : []),
              ]}>
              {song.user_avg && <UserDelta userScore={song.user_avg} communityAvg={song.avg_score} label="YOUR AVG FOR THIS SONG" />}
              <SetBreakdown s1={song.set1_ratings} s2={song.set2_ratings} enc={song.encore_ratings} />
              {song.first_rated_date && (
                <div style={{ display: 'flex', gap: 16, margin: '8px 0', flexWrap: 'wrap' }}>
                  <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--text-muted)', letterSpacing: '1.5px' }}>FIRST RATED</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-label)' }}>{song.first_rated_date}</div></div>
                  <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--text-muted)', letterSpacing: '1.5px' }}>LAST RATED</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-label)' }}>{song.last_rated_date}</div></div>
                </div>
              )}
              <CommVersionRows versions={song.top_versions || []} />
            </CommExpandCard>
          );
        })}
      </div>
    );
  }

  // ── TOP VENUES ────────────────────────────────────────────
  if (subTab === 'top-venues') {
    const s = topVenues?.stats;
    return (
      <div>
        <CommKPIGrid items={[
          { label: 'VENUES RATED', value: s?.venues_rated || '—', color: 'var(--cyan)' },
          { label: 'STATES COVERED', value: s?.states_covered || '—', color: 'var(--orange)' },
          { label: 'TOP VENUE AVG', value: topVenues?.venues?.[0]?.avg_score || '—', color: 'var(--green)' },
          { label: 'TOP VENUE', value: topVenues?.venues?.[0]?.venue || '—', color: 'var(--cyan)', small: true },
        ]} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 9 }}>TOP VENUES — TAP FOR TOP SHOWS</div>
        {(topVenues?.venues || []).map((venue, i) => {
          const userBadge = venue.user_was_there
            ? { label: `I WAS THERE${venue.user_show_count > 1 ? ` · ${venue.user_show_count} SHOWS` : ''}`, color: 'var(--orange)' }
            : venue.user_rated
            ? { label: `I RATED · ${venue.user_show_count} SHOW${venue.user_show_count !== 1 ? 'S' : ''}`, color: 'var(--cyan)' }
            : null;
          const dowLabel = [
            venue.fri_count > 0 && `FRI×${venue.fri_count}`,
            venue.sat_count > 0 && `SAT×${venue.sat_count}`,
            venue.sun_count > 0 && `SUN×${venue.sun_count}`,
          ].filter(Boolean).join(' · ') || null;
          return (
            <CommExpandCard key={venue.venue} name={venue.venue}
              sub={`${venue.city ? `${venue.city}, ` : ''}${venue.state || ''} · ${venue.show_count} shows · ${venue.unique_raters} rater${venue.unique_raters !== 1 ? 's' : ''}`}
              avg={venue.avg_score} count={venue.show_count} countLabel="SHOWS"
              accent={i === 0 ? 'var(--orange)' : i === 1 ? 'var(--cyan)' : 'rgba(var(--green-rgb),0.4)'}
              badge={userBadge}
              extraStats={[
                { value: venue.show_count, label: 'SHOWS', color: 'var(--cyan)' },
                { value: venue.unique_raters, label: 'RATERS', color: 'var(--green)' },
                { value: venue.total_ratings, label: 'RATINGS', color: 'var(--text-muted)' },
                ...(dowLabel ? [{ value: dowLabel, label: 'DOW', color: 'var(--orange)' }] : []),
              ]}>
              {dowLabel && (
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'rgba(var(--orange-bright-rgb),0.6)', letterSpacing: '1.5px', marginBottom: 10 }}>
                  WEEKEND SHOWS: {dowLabel}
                </div>
              )}
              <CommShowRows shows={venue.top_shows || []} />
            </CommExpandCard>
          );
        })}
      </div>
    );
  }

  // ── TOP STATES ────────────────────────────────────────────
  if (subTab === 'top-states') {
    const s = topStates?.stats;
    const states = topStates?.states || [];
    return (
      <div>
        <CommKPIGrid items={[
          { label: 'STATES COVERED', value: s?.states_covered || '—', color: 'var(--cyan)' },
          { label: 'TOP STATE', value: s?.top_state?.state || '—', color: 'var(--orange)' },
          { label: 'TOP STATE AVG', value: s?.top_state?.avg_score || '—', color: 'var(--green)' },
          { label: 'BOTTOM STATE', value: s?.bottom_state?.state || '—', color: 'var(--cyan)' },
        ]} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 9 }}>STATE RANKINGS — TAP TO EXPAND</div>
        {states.map((st, i) => {
          const accent = i === 0 ? 'var(--orange)' : i < 3 ? 'var(--cyan)' : 'rgba(var(--green-rgb),0.4)';
          const covPct = st.coverage_pct || 0;
          return (
            <CommExpandCard key={st.state} name={st.state}
              avg={st.avg_score} count={st.show_count} countLabel="SHOWS"
              sub={`${st.show_count} rated · ${st.venue_count} venue${st.venue_count !== 1 ? 's' : ''} · top: ${st.top_venue || '—'}`}
              accent={accent}
              extraStats={[
                { value: st.show_count, label: 'RATED', color: 'var(--cyan)' },
                { value: st.venue_count, label: 'VENUES', color: 'var(--green)' },
                { value: st.unique_raters, label: 'RATERS', color: 'var(--text-muted)' },
                { value: `${covPct}%`, label: 'COVERAGE', color: covPct > 50 ? 'var(--orange)' : 'var(--cyan)' },
              ]}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Coverage bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--text-muted)', letterSpacing: '2px' }}>PHREEZER COVERAGE</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: accent, letterSpacing: '1px' }}>{st.show_count} / {st.total_shows_in_state || '?'} SHOWS</div>
                  </div>
                  <div style={{ height: 4, background: 'rgba(var(--green-rgb),0.07)' }}>
                    <div style={{ width: `${Math.min(covPct, 100)}%`, height: '100%', background: accent, boxShadow: `0 0 6px ${accent}` }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 4 }}>TOP VENUE</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--cyan)' }}>{st.top_venue || '—'}</div>
                </div>
                {st.top_show && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 4 }}>HIGHEST RATED SHOW</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <a href={`https://phish.in/${st.top_show.show_date}`} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, border: '1px solid rgba(var(--cyan-bright-rgb),0.4)', background: 'rgba(var(--cyan-bright-rgb),0.05)', color: 'var(--cyan)', fontSize: '0.6rem', textDecoration: 'none', flexShrink: 0 }}>▶</a>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--white)' }}>{formatDate(st.top_show.show_date)}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: parseFloat(st.top_show.avg_score) >= 4.7 ? 'var(--orange)' : 'var(--cyan)', letterSpacing: 1 }}>{st.top_show.avg_score}</div>
                    </div>
                  </div>
                )}
              </div>
            </CommExpandCard>
          );
        })}
      </div>
    );
  }

  if (subTab === 'phriend-overlap') {
    return <PhriendOverlapCommunity api={api} onRateShow={onRateShow} user={user} onLogin={onLogin} />;
  }

  if (subTab === 'feed') {
    return <PhreezeFeed api={api} currentUser={user} />;
  }

  return null;
}
