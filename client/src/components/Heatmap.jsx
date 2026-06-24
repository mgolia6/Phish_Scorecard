import React, { useState } from 'react';

const HEATMAP_POS = {
  WA:{r:0,c:0},OR:{r:1,c:0},CA:{r:3,c:0},NV:{r:2,c:1},ID:{r:1,c:1},MT:{r:0,c:2},
  WY:{r:1,c:2},UT:{r:2,c:2},AZ:{r:3,c:2},CO:{r:2,c:3},NM:{r:3,c:3},ND:{r:0,c:3},
  SD:{r:1,c:3},NE:{r:2,c:4},KS:{r:3,c:4},OK:{r:4,c:4},TX:{r:4,c:5},MN:{r:0,c:4},
  IA:{r:1,c:4},MO:{r:2,c:5},AR:{r:3,c:5},LA:{r:4,c:6},WI:{r:0,c:5},IL:{r:1,c:5},
  MS:{r:3,c:6},MI:{r:0,c:6},IN:{r:1,c:6},TN:{r:2,c:6},AL:{r:3,c:7},KY:{r:1,c:7},
  OH:{r:0,c:7},WV:{r:1,c:8},GA:{r:3,c:8},FL:{r:4,c:8},VA:{r:0,c:8},NC:{r:1,c:9},
  SC:{r:2,c:9},MD:{r:0,c:9},DE:{r:0,c:10},NJ:{r:0,c:11},PA:{r:0,c:10},NY:{r:0,c:12},
  CT:{r:1,c:11},RI:{r:1,c:12},MA:{r:0,c:13},VT:{r:1,c:13},NH:{r:0,c:14},ME:{r:0,c:15},
};

const hmColor = s => {
  if (!s) return 'rgba(51,255,51,0.08)';
  const n = parseFloat(s);
  if (n >= 4.7) return 'rgba(255,102,0,0.9)';
  if (n >= 4.4) return 'rgba(255,140,0,0.75)';
  if (n >= 4.1) return 'rgba(0,200,200,0.75)';
  if (n >= 3.8) return 'rgba(0,180,180,0.45)';
  return 'rgba(51,255,51,0.22)';
};

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
      {title && <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-label)', letterSpacing: '2.5px', marginBottom: 9, textTransform: 'uppercase' }}>{title}</div>}
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'grid', gridTemplateRows: `repeat(${rows},28px)`, gridTemplateColumns: `repeat(${cols},1fr)`, gap: 2, minWidth: 300 }}>
          {cells.flat().map((cell, i) => (
            <div key={i}
              style={{ background: cell ? hmColor(cell.score) : 'transparent', border: cell ? (hov === cell.abbr ? '1px solid var(--cyan)' : '1px solid rgba(51,255,51,0.15)') : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: cell ? 'pointer' : 'default', transition: 'all 0.12s' }}
              onMouseEnter={() => cell && setHov(cell.abbr)}
              onMouseLeave={() => setHov(null)}>
              {cell && <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: '#ffffff', fontWeight: 900, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{cell.abbr}</span>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {[['rgba(255,102,0,0.9)','4.7+'],['rgba(255,140,0,0.75)','4.4+'],['rgba(0,200,200,0.75)','4.1+'],['rgba(0,180,180,0.45)','3.8+'],['rgba(51,255,51,0.22)','<3.8'],['rgba(51,255,51,0.08)','N/A']].map(([col,lbl]) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, background: col, border: '1px solid rgba(255,255,255,0.15)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--text-label)', letterSpacing: '1px' }}>{lbl}</span>
          </div>
        ))}
      </div>
      {hov && data[hov] && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', color: 'var(--cyan)', letterSpacing: '2px', marginTop: 7 }}>
          {hov} — AVG {data[hov]}
        </div>
      )}
    </div>
  );
}
