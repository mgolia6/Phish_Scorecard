import React, { useState } from 'react';

export function Heatmap({ data, title }) {
  const [hov, setHov] = useState(null);
  const rows = 5, cols = 16;
  const cells = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const st = Object.entries(HEATMAP_POS).find(([, v]) => v.r === r && v.c === c);
      return st ? { abbr: st[0], score: data[st[0]] || null } : null;
    })
  );
  return (
    <div style={{ marginBottom: 14 }}>
      {title && <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-label)', letterSpacing: '2.5px', marginBottom: 9, textTransform: 'uppercase' }}>{title}</div>}
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'grid', gridTemplateRows: `repeat(${rows},28px)`, gridTemplateColumns: `repeat(${cols},1fr)`, gap: 2, minWidth: 300 }}>
          {cells.flat().map((cell, i) => (
            <div key={i}
              style={{ background: cell ? hmColor(cell.score) : 'transparent', border: cell ? (hov === cell.abbr ? '1px solid var(--cyan)' : '1px solid rgba(51,255,51,0.15)') : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: cell ? 'pointer' : 'default', transition: 'all 0.12s' }}
              onMouseEnter={() => cell && setHov(cell.abbr)}
              onMouseLeave={() => setHov(null)}>
              {cell && <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.38rem', color: '#ffffff', fontWeight: 900, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{cell.abbr}</span>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {[['rgba(255,102,0,0.9)','4.7+'],['rgba(255,140,0,0.75)','4.4+'],['rgba(0,200,200,0.75)','4.1+'],['rgba(0,180,180,0.45)','3.8+'],['rgba(51,255,51,0.22)','<3.8'],['rgba(51,255,51,0.08)','N/A']].map(([col,lbl]) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, background: col, border: '1px solid rgba(255,255,255,0.15)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', color: 'var(--text-label)', letterSpacing: '1px' }}>{lbl}</span>
          </div>
        ))}
      </div>
      {hov && data[hov] && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.54rem', color: 'var(--cyan)', letterSpacing: '2px', marginTop: 7 }}>
          {hov} — AVG {data[hov]}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MY SONGS TAB
// ============================================================
