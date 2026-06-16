import React, { useState, useEffect } from 'react';
import { FullPageLoader } from './FullPageLoader';
import { formatDate } from '../utils';

export function CommExpandCard({ name, sub, avg, count, countLabel = 'RATINGS', accent = 'var(--cyan)', children }) {
  const [open, setOpen] = useState(false);
  const scoreColor = parseFloat(avg) >= 4.7 ? 'var(--orange)' : 'var(--cyan)';
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderLeft: `3px solid ${accent}` }}>
        <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--white)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sub}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: scoreColor, textShadow: `0 0 12px ${scoreColor}55`, letterSpacing: 1, lineHeight: 1 }}>{avg}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', color: 'var(--text-muted)', letterSpacing: '1.5px', marginTop: 3 }}>{count} {countLabel}</div>
            </div>
            <button onClick={() => setOpen(o => !o)} style={{ background: 'transparent', border: '1px solid rgba(51,255,51,0.2)', color: 'var(--text-label)', fontFamily: 'var(--font-display)', fontSize: '0.44rem', letterSpacing: '1.5px', padding: '5px 9px', cursor: 'pointer' }}>
              {open ? '▲' : '▼'}
            </button>
          </div>
        </div>
        {open && (
          <div style={{ borderTop: '1px solid rgba(51,255,51,0.07)', padding: '12px 14px', background: 'var(--bg-elevated)' }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommShowRows({ shows, label = 'TOP SHOWS' }) {
  return (
    <div>
      {donations && (
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          borderLeft: '3px solid var(--green)',
          padding: '12px 14px',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', letterSpacing: '3px', color: 'var(--green)', marginBottom: 4 }}>
              ◈ GIVING BACK
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              $1 from every Phreezer merch purchase goes to the{' '}
              <a href="https://mbird.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)', textDecoration: 'none' }}>
                Mockingbird Foundation
              </a>
              .
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--green)', fontWeight: 700, letterSpacing: '2px' }}>
              ${donations.total_donated}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.38rem', color: 'rgba(51,255,51,0.4)', letterSpacing: '2px', marginTop: 2 }}>
              {donations.items_sold} ITEMS SOLD
            </div>
          </div>
        </div>
      )}
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 9 }}>{label}</div>
      {shows.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < shows.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
          <a href={`https://phish.in/${s.show_date}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, border: '1px solid rgba(0,255,255,0.4)', background: 'rgba(0,255,255,0.05)', color: 'var(--cyan)', fontSize: '0.55rem', textDecoration: 'none', flexShrink: 0 }}>▶</a>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-label)', flex: 1 }}>{formatDate(s.show_date)}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.84rem', color: parseFloat(s.avg_score) >= 4.9 ? 'var(--orange)' : 'var(--cyan)', letterSpacing: 1 }}>{s.avg_score}</span>
        </div>
      ))}
    </div>
  );
}

export function CommVersionRows({ versions, label = 'TOP VERSIONS' }) {
  return (
    <div>
      {donations && (
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          borderLeft: '3px solid var(--green)',
          padding: '12px 14px',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', letterSpacing: '3px', color: 'var(--green)', marginBottom: 4 }}>
              ◈ GIVING BACK
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              $1 from every Phreezer merch purchase goes to the{' '}
              <a href="https://mbird.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)', textDecoration: 'none' }}>
                Mockingbird Foundation
              </a>
              .
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--green)', fontWeight: 700, letterSpacing: '2px' }}>
              ${donations.total_donated}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.38rem', color: 'rgba(51,255,51,0.4)', letterSpacing: '2px', marginTop: 2 }}>
              {donations.items_sold} ITEMS SOLD
            </div>
          </div>
        </div>
      )}
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 9 }}>{label}</div>
      {versions.map((v, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < versions.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
          <a href={`https://phish.in/${v.show_date}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, border: '1px solid rgba(0,255,255,0.4)', background: 'rgba(0,255,255,0.05)', color: 'var(--cyan)', fontSize: '0.55rem', textDecoration: 'none', flexShrink: 0 }}>▶</a>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--white)' }}>{formatDate(v.show_date)}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{v.venue}{v.city ? `, ${v.city}` : ''}</div>
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
      {donations && (
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          borderLeft: '3px solid var(--green)',
          padding: '12px 14px',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', letterSpacing: '3px', color: 'var(--green)', marginBottom: 4 }}>
              ◈ GIVING BACK
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              $1 from every Phreezer merch purchase goes to the{' '}
              <a href="https://mbird.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)', textDecoration: 'none' }}>
                Mockingbird Foundation
              </a>
              .
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--green)', fontWeight: 700, letterSpacing: '2px' }}>
              ${donations.total_donated}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.38rem', color: 'rgba(51,255,51,0.4)', letterSpacing: '2px', marginTop: 2 }}>
              {donations.items_sold} ITEMS SOLD
            </div>
          </div>
        </div>
      )}
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 9 }}>{label}</div>
      {songs.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < songs.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--white)', flex: 1 }}>{s.song_name}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.84rem', color: parseFloat(s.avg_score) >= 4.9 ? 'var(--orange)' : 'var(--cyan)', letterSpacing: 1 }}>{s.avg_score}</span>
        </div>
      ))}
    </div>
  );
}

export function CommStateRows({ states, label = 'STATE RANKINGS' }) {
  return (
    <div>
      {donations && (
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          borderLeft: '3px solid var(--green)',
          padding: '12px 14px',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', letterSpacing: '3px', color: 'var(--green)', marginBottom: 4 }}>
              ◈ GIVING BACK
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              $1 from every Phreezer merch purchase goes to the{' '}
              <a href="https://mbird.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)', textDecoration: 'none' }}>
                Mockingbird Foundation
              </a>
              .
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--green)', fontWeight: 700, letterSpacing: '2px' }}>
              ${donations.total_donated}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.38rem', color: 'rgba(51,255,51,0.4)', letterSpacing: '2px', marginTop: 2 }}>
              {donations.items_sold} ITEMS SOLD
            </div>
          </div>
        </div>
      )}
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 9 }}>{label}</div>
      {states.map((s, i) => (
        <div key={s.state} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < states.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'var(--text-muted)', minWidth: 22 }}>{i + 1}.</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: 'var(--white)', letterSpacing: '2px', marginBottom: 2 }}>{s.state}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)' }}>Top: {s.top_venue} · {s.show_count} shows</div>
          </div>
          <div style={{ width: 50, height: 3, background: 'rgba(51,255,51,0.07)', borderRadius: 2 }}>
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
          {k.sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center' }}>{k.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// PHRIEND OVERLAP — community surface (unintentional overlap)
// ============================================================
export function PhriendOverlapCommunity({ api }) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [autocomplete, setAutocomplete] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = React.useRef(null);

  React.useEffect(() => {
    api.get('/community/overlap-suggestions')
      .then(d => setSuggestions(d.suggestions || []))
      .catch(() => setSuggestions([]))
      .finally(() => setSuggestionsLoading(false));
  }, []);

  const handleInputChange = (val) => {
    setInput(val);
    setSelectedUser(null);
    setResult(null);
    setError('');
    clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setAutocomplete([]);
      setDropdownOpen(true);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const d = await api.get(`/community/user-search?q=${encodeURIComponent(val.trim())}`);
        setAutocomplete(d.users || []);
        setDropdownOpen(true);
      } catch { setAutocomplete([]); }
    }, 250);
  };

  const selectUser = (username) => {
    setInput(username);
    setSelectedUser(username);
    setDropdownOpen(false);
    setAutocomplete([]);
    runSearch(username);
  };

  const runSearch = async (username) => {
    if (!username?.trim()) return;
    setLoading(true); setResult(null); setError('');
    try {
      const data = await api.get(`/community/phriend-overlap?username=${encodeURIComponent(username.trim())}`);
      setResult(data);
    } catch (e) { setError(e.message || 'User not found'); }
    finally { setLoading(false); }
  };

  const dropdownItems = input.trim()
    ? autocomplete.map(u => ({ username: u, sub: null }))
    : suggestions.map(s => ({ username: s.username, sub: `${s.shared_count} shared show${s.shared_count !== 1 ? 's' : ''}` }));

  const showDropdown = dropdownOpen && !selectedUser && dropdownItems.length > 0;

  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 12 }}>
        FIND SHOWS YOU BOTH ATTENDED — INTENTIONAL OR NOT
      </div>

      <div style={{ position: 'relative', marginBottom: 0 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => handleInputChange(e.target.value)}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
            onKeyDown={e => {
              if (e.key === 'Enter' && input.trim()) { setDropdownOpen(false); runSearch(input.trim()); }
              if (e.key === 'Escape') setDropdownOpen(false);
            }}
            placeholder="type a username or tap a phriend below..."
            style={{
              flex: 1,
              background: 'rgba(0,0,0,0.5)',
              border: dropdownOpen ? '1px solid rgba(255,140,0,0.6)' : '1px solid rgba(255,140,0,0.35)',
              color: 'var(--white)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              padding: '10px 12px',
              outline: 'none',
            }}
          />
          <button
            onClick={() => { setDropdownOpen(false); runSearch(input.trim()); }}
            disabled={loading || !input.trim()}
            style={{
              border: '1px solid rgba(255,140,0,0.35)',
              color: 'var(--orange)',
              fontFamily: 'var(--font-display)',
              fontSize: '0.4rem',
              letterSpacing: '2px',
              padding: '10px 14px',
              cursor: 'pointer',
              opacity: (loading || !input.trim()) ? 0.4 : 1,
              background: 'transparent',
            }}>
            {loading ? '...' : 'SCAN'}
          </button>
        </div>

        {showDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#0d0d0d',
            border: '1px solid rgba(255,140,0,0.35)',
            borderTop: 'none',
            zIndex: 100,
            maxHeight: 260,
            overflowY: 'auto',
          }}>
            {!input.trim() && (
              <div style={{
                padding: '7px 12px 5px',
                fontFamily: 'var(--font-display)',
                fontSize: '0.38rem',
                letterSpacing: '2.5px',
                color: 'rgba(255,140,0,0.45)',
                borderBottom: '1px solid rgba(255,140,0,0.1)',
              }}>
                {suggestionsLoading ? 'SCANNING YOUR SHOWS...' : 'PHRIENDS WHO WERE THERE'}
              </div>
            )}
            {dropdownItems.map((item, i) => (
              <div
                key={item.username}
                onMouseDown={() => selectUser(item.username)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderBottom: i < dropdownItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,140,0,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  border: '1px solid rgba(255,140,0,0.4)',
                  background: 'rgba(255,140,0,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: '0.52rem',
                  color: 'var(--orange)', flexShrink: 0, letterSpacing: '1px',
                }}>
                  {item.username.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.username}
                  </div>
                  {item.sub && (
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.36rem', color: 'rgba(255,140,0,0.5)', letterSpacing: '1.5px', marginTop: 2 }}>
                      {item.sub.toUpperCase()}
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'rgba(255,140,0,0.4)', letterSpacing: '1px', flexShrink: 0 }}>▶</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!result && !loading && !error && !dropdownOpen && !input.trim() && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'rgba(255,140,0,0.35)', letterSpacing: '2px', marginBottom: 10 }}>
            PHRIENDS WHO WERE THERE
          </div>
          {suggestionsLoading ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', padding: '16px 0' }}>scanning your shows...</div>
          ) : suggestions.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '20px 0', border: '1px solid var(--border)' }}>
              NO OTHER USERS SHARE YOUR ATTENDED SHOWS YET<br/>
              <span style={{ color: 'rgba(255,140,0,0.35)', marginTop: 6, display: 'block' }}>CHECK BACK AS THE COMMUNITY GROWS</span>
            </div>
          ) : (
            suggestions.map(s => (
              <div
                key={s.username}
                onClick={() => selectUser(s.username)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 12px',
                  border: '1px solid rgba(255,140,0,0.15)',
                  borderLeft: '3px solid rgba(255,140,0,0.4)',
                  background: 'rgba(255,140,0,0.03)',
                  marginBottom: 6, cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  border: '1px solid rgba(255,140,0,0.4)',
                  background: 'rgba(255,140,0,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: '0.55rem',
                  color: 'var(--orange)', flexShrink: 0,
                }}>
                  {s.username.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: 'var(--white)' }}>{s.username}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.36rem', color: 'rgba(255,140,0,0.5)', letterSpacing: '1.5px', marginTop: 2 }}>
                    {s.shared_count} SHARED SHOW{s.shared_count !== 1 ? 'S' : ''}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'rgba(255,140,0,0.4)', letterSpacing: '1px' }}>SCAN ▶</div>
              </div>
            ))
          )}
        </div>
      )}

      {error && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--red)', marginTop: 12 }}>{error}</div>}

      {result && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, marginTop: 14, padding: '12px 14px', border: '1px solid rgba(255,140,0,0.25)', background: 'linear-gradient(135deg, rgba(255,140,0,0.05), rgba(5,18,5,0.98))' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(255,140,0,0.45)', background: 'rgba(255,140,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.58rem', color: 'var(--orange)', flexShrink: 0 }}>
              {result.target.username.slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: 'var(--white)' }}>{result.target.username}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {result.total_shared} shared shows · {result.unique_venues} venues · {result.unique_years} years
              </div>
            </div>
            <button
              onClick={() => { setResult(null); setInput(''); setSelectedUser(null); }}
              style={{ background: 'transparent', border: '1px solid rgba(255,140,0,0.25)', color: 'rgba(255,140,0,0.5)', fontFamily: 'var(--font-display)', fontSize: '0.36rem', letterSpacing: '1.5px', padding: '5px 9px', cursor: 'pointer' }}>
              X CLEAR
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
            {[
              { v: result.total_shared, l: 'SHOWS TOGETHER' },
              { v: result.unique_venues, l: 'VENUES' },
              { v: result.unique_years, l: 'YEARS' },
            ].map(({ v, l }) => (
              <div key={l} style={{ textAlign: 'center', padding: '10px 4px', border: '1px solid rgba(255,140,0,0.2)', background: 'rgba(255,140,0,0.04)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--orange)', lineHeight: 1, marginBottom: 4 }}>{v}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.3rem', letterSpacing: '1.5px', color: 'rgba(255,140,0,0.5)' }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.34rem', letterSpacing: '2px', color: 'var(--text-muted)' }}>SHOW</span>
            <div style={{ display: 'flex', gap: 20 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.34rem', letterSpacing: '1.5px', color: 'var(--cyan)' }}>YOU</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.34rem', letterSpacing: '1.5px', color: 'var(--orange)' }}>THEM</span>
            </div>
          </div>

          {result.shows.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', marginBottom: 5 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: 2 }}>
                  {(() => { const [y,m,dd]=s.show_date.split('-'); const mn=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']; return `${mn[+m-1]} ${+dd}, ${y}`; })()}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-label)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.venue}{s.city ? ` — ${s.city}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', padding: '2px 6px', border: '1px solid rgba(0,224,208,0.3)', color: 'var(--cyan)', minWidth: 30, textAlign: 'center' }}>{s.my_score || '—'}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', padding: '2px 6px', border: '1px solid rgba(255,140,0,0.3)', color: 'var(--orange)', minWidth: 30, textAlign: 'center' }}>{s.their_score || '—'}</span>
              </div>
            </div>
          ))}

          {result.shows.length === 0 && (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '20px 0' }}>NO SHARED SHOWS FOUND</div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// COMMUNITY TAB — all sub-tabs
// ============================================================
export function CommunityTab({ api, subTab = "leaderboard" }) {
  const [donations, setDonations] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [topShows, setTopShows] = useState(null);
  const [topSongs, setTopSongs] = useState(null);
  const [topVenues, setTopVenues] = useState(null);
  const [topStates, setTopStates] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/donations')
      .then(r => r.json())
      .then(d => setDonations(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    let req;
    if (subTab === 'leaderboard') req = api.get('/community/leaderboard').then(setLeaderboard);
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
                style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto auto auto auto auto', alignItems: 'center', gap: '8px', padding: '11px 14px', borderBottom: '1px solid rgba(51,255,51,0.06)', borderLeft: row.is_me ? '2px solid var(--cyan)' : 'none', background: row.is_me ? 'rgba(0,255,255,0.025)' : 'transparent' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: row.rank === 1 ? 'var(--orange)' : row.rank === 2 ? 'var(--cyan)' : row.rank === 3 ? 'var(--green)' : 'var(--text-muted)' }}>
                  {row.rank === 1 ? '★' : row.rank === 2 ? '◈' : row.rank === 3 ? '◉' : row.rank}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: row.is_me ? 'var(--cyan)' : 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.username}{row.is_me && <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', color: 'var(--cyan)', marginLeft: 6, letterSpacing: '1px', opacity: 0.7 }}> ◈ YOU</span>}
                </span>
                <span title="Shows rated" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-label)', textAlign: 'right' }}>{row.shows_rated}</span>
                <span title="Avg score" style={{ fontFamily: 'var(--font-display)', fontSize: '0.76rem', color: 'var(--orange)', letterSpacing: 1, textAlign: 'right' }}>{row.avg_score ?? '—'}</span>
                <span title="Login streak" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-label)', textAlign: 'right' }}>{row.login_streak > 1 ? `⚡${row.login_streak}` : '—'}</span>
                <span title="Feedback submitted" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: row.feedback_count > 0 ? 'var(--green)' : 'var(--text-muted)', textAlign: 'right' }}>{row.feedback_count > 0 ? `◈${row.feedback_count}` : '—'}</span>
                <span title="Bugs reported" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: row.bugs_reported > 0 ? 'var(--orange)' : 'var(--text-muted)', textAlign: 'right' }}>{row.bugs_reported > 0 ? `⚠${row.bugs_reported}` : '—'}</span>
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
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 9 }}>TOP RATED SHOWS — TAP FOR SONGS</div>
        {(topShows?.shows || []).map((show, i) => (
          <CommExpandCard key={show.show_date} name={formatDate(show.show_date)}
            sub={`${show.venue}${show.city ? ` · ${show.city}` : ''}${show.state ? `, ${show.state}` : ''} · ${show.rater_count} raters`}
            avg={show.avg_score} count={show.rater_count} countLabel="RATERS"
            accent={i === 0 ? 'var(--orange)' : 'var(--cyan)'}>
            <CommSongRows songs={show.top_songs || []} />
            <div style={{ marginTop: 12 }}>
              <a href={`https://phish.in/${show.show_date}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, border: '1px solid rgba(0,255,255,0.4)', background: 'rgba(0,255,255,0.05)', color: 'var(--cyan)', fontSize: '0.65rem', textDecoration: 'none' }}>▶</a>
            </div>
          </CommExpandCard>
        ))}
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
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 9 }}>TOP SONGS — TAP FOR TOP VERSIONS</div>
        {(topSongs?.songs || []).map((song, i) => (
          <CommExpandCard key={song.song_name} name={song.song_name}
            sub={`${song.total_ratings} ratings · ${song.unique_raters} raters`}
            avg={song.avg_score} count={song.total_ratings} countLabel="RATINGS"
            accent={i === 0 ? 'var(--orange)' : 'var(--cyan)'}>
            <CommVersionRows versions={song.top_versions || []} />
          </CommExpandCard>
        ))}
      </div>
    );
  }

  // ── TOP VENUES ────────────────────────────────────────────
  if (subTab === 'top-venues') {
    const s = topVenues?.stats;
    // Build state map for heatmap from states array
    const stateMap = {};
    (topVenues?.states || []).forEach(st => { if (st.state) stateMap[st.state] = st.avg_score; });
    return (
      <div>
        <CommKPIGrid items={[
          { label: 'VENUES RATED', value: s?.venues_rated || '—', color: 'var(--cyan)' },
          { label: 'STATES COVERED', value: s?.states_covered || '—', color: 'var(--orange)' },
          { label: 'TOP VENUE AVG', value: topVenues?.venues?.[0]?.avg_score || '—', color: 'var(--green)' },
          { label: 'TOP VENUE', value: topVenues?.venues?.[0]?.venue || '—', color: 'var(--cyan)', small: true },
        ]} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 9 }}>TOP VENUES — TAP FOR TOP SHOWS</div>
        {(topVenues?.venues || []).map((venue, i) => (
          <CommExpandCard key={venue.venue} name={venue.venue}
            sub={`${venue.city ? `${venue.city}, ` : ''}${venue.state || ''} · ${venue.show_count} shows`}
            avg={venue.avg_score} count={venue.show_count} countLabel="SHOWS"
            accent={i === 0 ? 'var(--orange)' : i === 1 ? 'var(--cyan)' : 'rgba(51,255,51,0.4)'}>
            <CommShowRows shows={venue.top_shows || []} />
          </CommExpandCard>
        ))}
      </div>
    );
  }

  // ── TOP STATES ────────────────────────────────────────────
  if (subTab === 'top-states') {
    const s = topStates?.stats;
    const states = topStates?.states || [];
    const stateMap = {};
    states.forEach(st => { if (st.state) stateMap[st.state] = st.avg_score; });
    return (
      <div>
        <CommKPIGrid items={[
          { label: 'STATES COVERED', value: s?.states_covered || '—', color: 'var(--cyan)' },
          { label: 'TOP STATE', value: s?.top_state?.state || '—', color: 'var(--orange)' },
          { label: 'TOP STATE AVG', value: s?.top_state?.avg_score || '—', color: 'var(--green)' },
          { label: 'BOTTOM STATE', value: s?.bottom_state?.state || '—', color: 'var(--cyan)' },
        ]} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '2.5px', marginBottom: 9 }}>STATE RANKINGS — TAP TO EXPAND</div>
        {states.map((st, i) => {
          const accent = i === 0 ? 'var(--orange)' : i < 3 ? 'var(--cyan)' : 'rgba(51,255,51,0.4)';
          return (
            <CommExpandCard key={st.state} name={st.state}
              avg={st.avg_score} count={st.show_count} countLabel="SHOWS"
              sub={`${st.show_count} shows · top: ${st.top_venue || '—'}`}
              accent={accent}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 4 }}>TOP VENUE</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--cyan)' }}>{st.top_venue || '—'}</div>
                </div>
                {st.top_show && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 4 }}>HIGHEST RATED SHOW</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <a href={`https://phish.in/${st.top_show.show_date}`} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, border: '1px solid rgba(0,255,255,0.4)', background: 'rgba(0,255,255,0.05)', color: 'var(--cyan)', fontSize: '0.5rem', textDecoration: 'none', flexShrink: 0 }}>▶</a>
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
    return <PhriendOverlapCommunity api={api} />;
  }

  return null;
}


// ============================================================
// ADMIN TAB
// ============================================================

