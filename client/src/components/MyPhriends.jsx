import React, { useState } from 'react';
import { formatDate } from '../utils';

export function MyPhriends({ api, showMessage, showError }) {
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [autocomplete, setAutocomplete] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const debounceRef = React.useRef(null);

  // People who share your attended shows — so you can pick instead of recalling a name.
  React.useEffect(() => {
    api.get('/community/overlap-suggestions')
      .then(d => setSuggestions(d.suggestions || []))
      .catch(() => setSuggestions([]))
      .finally(() => setSuggestionsLoading(false));
  }, []);

  const handleInputChange = (val) => {
    setSearchInput(val); setSelectedUser(null);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setAutocomplete([]); setDropdownOpen(true); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const d = await api.get(`/community/user-search?q=${encodeURIComponent(val.trim())}`);
        setAutocomplete(d.users || []); setDropdownOpen(true);
      } catch { setAutocomplete([]); }
    }, 250);
  };

  const runSearch = async (username) => {
    const u = (username ?? searchInput).trim();
    if (!u) return;
    setDropdownOpen(false);
    setLoading(true);
    setResult(null);
    try {
      const data = await api.get(`/community/phriend-overlap?username=${encodeURIComponent(u)}`);
      setResult(data);
    } catch (e) { showError(e.message || 'User not found'); }
    finally { setLoading(false); }
  };

  const selectUser = (username) => { setSearchInput(username); setSelectedUser(username); setDropdownOpen(false); setAutocomplete([]); runSearch(username); };

  const dropdownItems = searchInput.trim()
    ? autocomplete.map(u => ({ username: u, sub: null }))
    : suggestions.map(s => ({ username: s.username, sub: `${s.shared_count} shared show${s.shared_count !== 1 ? 's' : ''}` }));
  const showDropdown = dropdownOpen && !selectedUser && dropdownItems.length > 0;

  return (
    <div style={{ padding: '0 0 20px' }}>
      {/* Search bar — pick a phriend from the list or type to find one */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={searchInput}
            onChange={e => handleInputChange(e.target.value)}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
            onKeyDown={e => { if (e.key === 'Enter' && searchInput.trim()) runSearch(); if (e.key === 'Escape') setDropdownOpen(false); }}
            placeholder="tap a phriend below or type a username..."
            type="text"
            name="phriend-search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="text"
            enterKeyHint="search"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            style={{ flex: 1, background: 'var(--inset-strong)', border: dropdownOpen ? '1px solid rgba(var(--orange-bright-rgb),0.6)' : '1px solid rgba(var(--orange-bright-rgb),0.35)', color: 'var(--orange)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: '9px 10px', outline: 'none' }}
          />
          <button onClick={() => runSearch()} disabled={loading || !searchInput.trim()}
            style={{ border: '1px solid rgba(var(--orange-bright-rgb),0.35)', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2px', padding: '9px 14px', cursor: 'pointer', opacity: (loading || !searchInput.trim()) ? 0.4 : 1, whiteSpace: 'nowrap', background: 'transparent' }}>
            {loading ? '...' : 'SEARCH'}
          </button>
        </div>
        {showDropdown && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-elevated)', border: '1px solid rgba(var(--orange-bright-rgb),0.35)', borderTop: 'none', zIndex: 100, maxHeight: 260, overflowY: 'auto' }}>
            {!searchInput.trim() && <div style={{ padding: '7px 12px 5px', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2.5px', color: 'rgba(var(--orange-bright-rgb),0.75)', borderBottom: '1px solid rgba(var(--orange-bright-rgb),0.1)' }}>{suggestionsLoading ? 'SCANNING YOUR SHOWS...' : 'PHRIENDS WHO WERE THERE'}</div>}
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

      {/* Suggestion list below — visible before any search, so you never need a name */}
      {!result && !loading && !dropdownOpen && !searchInput.trim() && (
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'rgba(var(--orange-bright-rgb),0.75)', letterSpacing: '2px', marginBottom: 10 }}>PHRIENDS WHO WERE THERE</div>
          {suggestionsLoading ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', padding: '16px 0' }}>scanning your shows...</div>
          ) : suggestions.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '20px 0', border: '1px solid var(--border)' }}>NO OTHER PHREEZERS SHARE YOUR ATTENDED SHOWS YET<br/><span style={{ color: 'rgba(var(--orange-bright-rgb),0.65)', marginTop: 6, display: 'block' }}>CHECK BACK AS THE COMMUNITY GROWS</span></div>
          ) : (
            suggestions.map(s => (
              <div key={s.username} onClick={() => selectUser(s.username)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', border: '1px solid rgba(var(--orange-bright-rgb),0.15)', borderLeft: '3px solid rgba(var(--orange-bright-rgb),0.4)', background: 'rgba(var(--orange-bright-rgb),0.03)', marginBottom: 6, cursor: 'pointer' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(var(--orange-bright-rgb),0.4)', background: 'rgba(var(--orange-bright-rgb),0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.62rem', color: 'var(--orange)', flexShrink: 0 }}>{s.username.slice(0, 2).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.username}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'rgba(var(--orange-bright-rgb),0.8)', letterSpacing: '1.5px', marginTop: 2 }}>{s.shared_count} SHARED SHOW{s.shared_count !== 1 ? 'S' : ''}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'rgba(var(--orange-bright-rgb),0.7)', letterSpacing: '1px', flexShrink: 0 }}>SEARCH ▶</div>
              </div>
            ))
          )}
        </div>
      )}

      {result && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '12px 14px', border: '1px solid rgba(var(--orange-bright-rgb),0.25)', background: 'linear-gradient(135deg, rgba(var(--orange-bright-rgb),0.08), var(--bg-elevated))' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(var(--orange-bright-rgb),0.45)', background: 'rgba(var(--orange-bright-rgb),0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.66rem', color: 'var(--orange)', flexShrink: 0 }}>
              {result.target.username.slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--white)' }}>{result.target.username}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {result.total_shared} shows together · {result.unique_venues} venues · {result.unique_years} years
              </div>
            </div>
            <button onClick={() => { setResult(null); setSearchInput(''); setSelectedUser(null); setAutocomplete([]); }}
              style={{ background: 'transparent', border: '1px solid rgba(var(--orange-bright-rgb),0.25)', color: 'rgba(var(--orange-bright-rgb),0.7)', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '1.5px', padding: '5px 9px', cursor: 'pointer', flexShrink: 0 }}>X CLEAR</button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
            {[
              { v: result.total_shared, l: 'SHOWS TOGETHER' },
              { v: result.unique_venues, l: 'VENUES' },
              { v: result.unique_years, l: 'YEARS' },
            ].map(({ v, l }) => (
              <div key={l} style={{ textAlign: 'center', padding: '10px 4px', border: '1px solid rgba(var(--orange-bright-rgb),0.2)', background: 'rgba(var(--orange-bright-rgb),0.04)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--orange)', lineHeight: 1, marginBottom: 5 }}>{v}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '1.5px', color: 'rgba(var(--orange-bright-rgb),0.7)' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Shared shows list */}
          {result.shows.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: '0 2px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2px', color: 'var(--text-muted)' }}>SHOW</span>
                <div style={{ display: 'flex', gap: 22 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '1.5px', color: 'var(--cyan)' }}>YOU</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '1.5px', color: 'var(--orange)' }}>THEM</span>
                </div>
              </div>
              {result.shows.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid var(--border)', background: 'var(--inset)', marginBottom: 5 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: 2 }}>
                      {(() => { const [y,m,d]=s.show_date.split('-'); const mn=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']; return `${mn[+m-1]} ${+d}, ${y}`; })()}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-label)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.venue}{s.city ? ` — ${s.city}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', padding: '2px 6px', border: '1px solid rgba(var(--cyan-rgb),0.3)', color: 'var(--cyan)', minWidth: 32, textAlign: 'center' }}>
                      {s.my_score || '—'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', padding: '2px 6px', border: '1px solid rgba(var(--orange-bright-rgb),0.3)', color: 'var(--orange)', minWidth: 32, textAlign: 'center' }}>
                      {s.their_score || '—'}
                    </span>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '20px 0' }}>NO SHARED SHOWS FOUND</div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// BADGES SECTION — used in ProfileModal
// ============================================================
const ALL_BADGES_DEF = [
  { id: 'century',    label: 'CENTURY CLUB',    desc: 'Attended 100 shows',     glyph: '💯', color: 'var(--orange)' },
  { id: 'fifty',      label: 'HALF-CENTURY',    desc: 'Attended 50 shows',      glyph: '★',  color: 'var(--cyan)'   },
  { id: 'quarter',    label: 'QUARTER-CENTURY', desc: 'Attended 25 shows',      glyph: '◉',  color: 'var(--cyan)'   },
  { id: 'ten',        label: 'DOUBLE DIGITS',   desc: 'Attended 10 shows',      glyph: '◈',  color: 'var(--cyan)'   },
  { id: 'rated_100',  label: 'HALL OF PHAME',   desc: 'Rated 100 shows',        glyph: '🏆', color: 'var(--orange)' },
  { id: 'rated_50',   label: 'ARCHIVIST',       desc: 'Rated 50 shows',         glyph: '⬡',  color: 'var(--green)'  },
  { id: 'rated_25',   label: 'PHISH SCHOLAR',   desc: 'Rated 25 shows',         glyph: '▦',  color: 'var(--cyan)'   },
  { id: 'rated_10',   label: 'PHAN OF 10',      desc: 'Rated 10 shows',         glyph: '✦',  color: 'var(--cyan)'   },
  { id: 'rated_1',    label: 'FIRST PHREEZE',   desc: 'Rated your first show',  glyph: '❄',  color: 'var(--cyan)'   },
  { id: 'critic',     label: 'PHISH CRITIC',    desc: 'Imported 10+ reviews',   glyph: '✍',  color: 'var(--green)'  },
  { id: 'reviewer',   label: 'REVIEWER',        desc: 'Imported phish.net reviews', glyph: '✎', color: 'var(--green)' },
  { id: 'streak_30',  label: 'ON FIRE',         desc: '30-day login streak',    glyph: '🔥', color: 'var(--orange)' },
  { id: 'streak_7',   label: 'ON A STREAK',     desc: '7-day login streak',     glyph: '⚡', color: 'var(--orange)' },
];

