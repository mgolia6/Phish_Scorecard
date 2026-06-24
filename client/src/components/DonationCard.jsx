import React, { useState, useEffect } from 'react';

export function DonationCard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/admin/donations')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {});
  }, []);

  const total = data ? `$${parseFloat(data.total_donated).toFixed(2)}` : '—';
  const items = data ? data.items_sold : '—';

  return (
    <div style={{
      background: 'rgba(0,0,0,0.35)',
      border: '1px solid rgba(var(--green-rgb),0.15)',
      borderLeft: '3px solid var(--green)',
      padding: '14px 16px',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(var(--green-rgb),0.6)', marginBottom: 10 }}>
        ◈ MOCKINGBIRD FOUNDATION
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--green)', letterSpacing: '1px', lineHeight: 1 }}>
            {total}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            donated · {items} item{items !== 1 ? 's' : ''} sold
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'rgba(var(--green-rgb),0.4)', textAlign: 'right', lineHeight: 1.6 }}>
          $1.00 per item<br />
          supports music education
        </div>
      </div>
    </div>
  );
}
