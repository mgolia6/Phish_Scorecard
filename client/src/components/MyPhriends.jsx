import React, { useState } from 'react';
import { formatDate } from './utils';

export function MyPhriends({ api, showMessage, showError }) {
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await api.get(`/community/phriend-overlap?username=${encodeURIComponent(searchInput.trim())}`);
      setResult(data);
    } catch (e) { showError(e.message || 'User not found'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '0 0 20px' }}>
      {/* Search bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="enter phreezer username..."
          style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,140,0,0.35)', color: 'var(--orange)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: '9px 10px', outline: 'none' }}
        />
        <button onClick={handleSearch} disabled={loading}
          style={{ background: 'rgba(255,140,0,0.07)', border: '1px solid rgba(255,140,0,0.35)', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.4rem', letterSpacing: '2px', padding: '9px 14px', cursor: 'pointer', opacity: loading ? 0.5 : 1, whiteSpace: 'nowrap' }}>
          {loading ? '...' : 'SEARCH'}
        </button>
      </div>

      {result && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '12px 14px', border: '1px solid rgba(255,140,0,0.25)', background: 'linear-gradient(135deg, rgba(255,140,0,0.05), rgba(5,18,5,0.98))' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,140,0,0.45)', background: 'rgba(255,140,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--orange)', flexShrink: 0 }}>
              {result.target.username.slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--white)' }}>{result.target.username}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {result.total_shared} shows together · {result.unique_venues} venues · {result.unique_years} years
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
            {[
              { v: result.total_shared, l: 'SHOWS TOGETHER' },
              { v: result.unique_venues, l: 'VENUES' },
              { v: result.unique_years, l: 'YEARS' },
            ].map(({ v, l }) => (
              <div key={l} style={{ textAlign: 'center', padding: '10px 4px', border: '1px solid rgba(255,140,0,0.2)', background: 'rgba(255,140,0,0.04)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--orange)', lineHeight: 1, marginBottom: 5 }}>{v}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.32rem', letterSpacing: '1.5px', color: 'rgba(255,140,0,0.5)' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Shared shows list */}
          {result.shows.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: '0 2px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.36rem', letterSpacing: '2px', color: 'var(--text-muted)' }}>SHOW</span>
                <div style={{ display: 'flex', gap: 22 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.36rem', letterSpacing: '1.5px', color: 'var(--cyan)' }}>YOU</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.36rem', letterSpacing: '1.5px', color: 'var(--orange)' }}>THEM</span>
                </div>
              </div>
              {result.shows.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', marginBottom: 5 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: 2 }}>
                      {(() => { const [y,m,d]=s.show_date.split('-'); const mn=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']; return `${mn[+m-1]} ${+d}, ${y}`; })()}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-label)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.venue}{s.city ? ` — ${s.city}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', padding: '2px 6px', border: '1px solid rgba(0,224,208,0.3)', color: 'var(--cyan)', minWidth: 32, textAlign: 'center' }}>
                      {s.my_score || '—'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', padding: '2px 6px', border: '1px solid rgba(255,140,0,0.3)', color: 'var(--orange)', minWidth: 32, textAlign: 'center' }}>
                      {s.their_score || '—'}
                    </span>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '20px 0' }}>NO SHARED SHOWS FOUND</div>
          )}
        </>
      )}

      {!result && !loading && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '24px 0', border: '1px solid var(--border)' }}>
          SEARCH A PHREEZER USERNAME TO SEE<br/>
          <span style={{ color: 'rgba(255,140,0,0.4)', marginTop: 6, display: 'block' }}>SHOWS YOU BOTH ATTENDED</span>
        </div>
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

