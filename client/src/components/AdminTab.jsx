import React, { useState, useEffect } from 'react';
import { FullPageLoader } from './FullPageLoader';

export function AdminTab({ api, showMessage, showError }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null); // { userId, action }
  const [working, setWorking] = useState(null);
  const [migrationResult, setMigrationResult] = useState(null); // { results: [...] }

  const loadUsers = () => {
    setLoading(true);
    api.get('/admin/users')
      .then(setUsers)
      .catch(err => showError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const doAction = async (userId, action, method = 'POST') => {
    setWorking(`${userId}-${action}`);
    try {
      if (method === 'DELETE') {
        await api.post(`/admin/user?id=${userId}&_method=DELETE`, {});
        // Actually use fetch directly for DELETE
        const token = localStorage.getItem('phish_token');
        const res = await fetch(`/api/admin/user?id=${userId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        const token = localStorage.getItem('phish_token');
        const res = await fetch(`/api/admin/user?id=${userId}&action=${action}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (action === 'reset-password') {
          // email sent — confirm modal handles feedback
        } else if (action === 'reset-onboarding') {
          loadUsers();
        } else if (action === 'clear-data') {
          loadUsers();
        }
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setWorking(null);
      setConfirming(null);
    }
  };

  const runMigrations = async () => {
    setWorking('migrate');
    try {
      const token = localStorage.getItem('phish_token');
      const res = await fetch('/api/admin/migrate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setMigrationResult(data);
      loadUsers();
    } catch (err) {
      setMigrationResult({ error: err.message });
    } finally {
      setWorking(null);
    }
  };

  if (loading) return <FullPageLoader text="LOADING USERS..." />;

  return (
    <div>
      {/* Migration result modal */}
      {migrationResult && (
        <div className="modal-overlay" style={{ zIndex: 700 }}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-title" style={{ color: migrationResult.error ? 'var(--red)' : 'var(--cyan)' }}>
              {migrationResult.error ? 'MIGRATION ERROR' : 'MIGRATIONS COMPLETE'}
            </div>
            {migrationResult.error ? (
              <p style={{ color: 'var(--red)', fontSize: '0.8rem', marginBottom: 20 }}>{migrationResult.error}</p>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'rgba(51,255,51,0.4)', letterSpacing: '2px' }}>
                    {migrationResult.results?.filter(r => r.status === 'ok').length} OK
                    {migrationResult.results?.filter(r => r.status === 'error').length > 0 &&
                      ` · ${migrationResult.results.filter(r => r.status === 'error').length} FAILED`}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '50vh', overflowY: 'auto', marginBottom: 20 }}>
                  {migrationResult.results?.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: r.status === 'ok' ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-display)', fontSize: '0.7rem', flexShrink: 0 }}>
                        {r.status === 'ok' ? '✓' : '✗'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: r.status === 'ok' ? 'rgba(51,255,51,0.7)' : 'var(--red)' }}>
                        {r.migration}
                      </span>
                      {r.error && (
                        <span style={{ fontSize: '0.6rem', color: 'var(--red)', opacity: 0.7 }}>{r.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            <button className="btn-primary" style={{ width: '100%', padding: '13px' }} onClick={() => setMigrationResult(null)}>
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Confirm overlay */}
      {confirming && (
        <div className="modal-overlay" style={{ zIndex: 600 }}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-title" style={{ color: 'var(--red)' }}>CONFIRM</div>
            {confirming.action === 'delete' && (
              <p style={{ fontSize: '0.85rem', color: 'rgba(51,255,51,0.8)', marginBottom: 24, lineHeight: 1.6 }}>
                Delete <strong style={{ color: 'var(--red)' }}>{confirming.username}</strong>? This removes all their data permanently. Cannot be undone.
              </p>
            )}
            {confirming.action === 'clear-data' && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: '0.85rem', color: 'rgba(51,255,51,0.8)', lineHeight: 1.6, marginBottom: 12 }}>
                  Clear all show data for <strong style={{ color: 'var(--orange)' }}>{confirming.username}</strong>?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px', background: 'rgba(255,102,0,0.05)', border: '1px solid rgba(255,102,0,0.2)' }}>
                  {['All ratings', 'All attendance records', 'All imported reviews', 'KPI / streak data'].map(item => (
                    <div key={item} style={{ display: 'flex', gap: 8, fontSize: '0.75rem', color: 'rgba(255,102,0,0.8)' }}>
                      <span>✗</span><span>{item}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.7rem', color: 'rgba(51,255,51,0.4)', marginTop: 10 }}>Account and login are preserved.</p>
              </div>
            )}
            {confirming.action === 'reset-onboarding' && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: '0.85rem', color: 'rgba(51,255,51,0.8)', lineHeight: 1.6, marginBottom: 12 }}>
                  Reset onboarding for <strong style={{ color: 'var(--cyan)' }}>{confirming.username}</strong>?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px', background: 'rgba(0,224,208,0.04)', border: '1px solid rgba(0,224,208,0.15)' }}>
                  {['T&C acceptance cleared', 'Onboarding complete flag cleared', 'Profile setup will re-fire on next login'].map(item => (
                    <div key={item} style={{ display: 'flex', gap: 8, fontSize: '0.75rem', color: 'rgba(0,224,208,0.7)' }}>
                      <span>↺</span><span>{item}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.7rem', color: 'rgba(51,255,51,0.4)', marginTop: 10 }}>Show data and ratings are not affected.</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-primary"
                style={{ flex: 1, borderColor: confirming.action === 'delete' ? 'var(--red)' : 'var(--orange)', color: confirming.action === 'delete' ? 'var(--red)' : 'var(--orange)' }}
                onClick={() => {
                  if (confirming.action === 'delete') doAction(confirming.userId, null, 'DELETE');
                  else doAction(confirming.userId, confirming.action);
                }}
                disabled={!!working}
              >
                {working ? '◈ WORKING...' : 'CONFIRM'}
              </button>
              <button style={{ flex: 1 }} onClick={() => setConfirming(null)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-title">ADMIN</div>

        {/* DB controls */}
        <div className="admin-controls">
          <button
            className="admin-action-btn"
            onClick={runMigrations}
            disabled={working === 'migrate'}
            style={{ borderColor: 'var(--cyan)', color: 'var(--cyan)' }}
          >
            {working === 'migrate' ? 'RUNNING...' : '⚙ RUN MIGRATIONS'}
          </button>
        </div>

        {/* User count */}
        <div className="admin-stat-bar">
          <span>{users.length} REGISTERED USER{users.length !== 1 ? 'S' : ''}</span>
        </div>

        {/* User cards — mobile-first card layout */}
        <div className="admin-user-list">
          {users.map(u => (
            <div key={u.id} style={{
              marginBottom: 12,
              border: `1px solid ${u.is_admin ? 'rgba(0,224,208,0.35)' : 'var(--border)'}`,
              borderLeft: `3px solid ${u.is_admin ? 'var(--cyan)' : 'rgba(51,255,51,0.3)'}`,
              background: 'var(--bg-panel)',
            }}>
              {/* Header */}
              <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(51,255,51,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--white)' }}>{u.username}</span>
                    {u.is_admin && <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.38rem', letterSpacing: '2px', color: 'var(--cyan)', border: '1px solid rgba(0,224,208,0.4)', padding: '2px 5px' }}>ADMIN</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{u.email}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', color: 'var(--text-muted)', letterSpacing: '1.5px', textAlign: 'right', flexShrink: 0 }}>
                  JOINED<br/>
                  <span style={{ color: 'var(--text-label)' }}>{u.joined}</span>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: '1px solid rgba(51,255,51,0.08)' }}>
                {[
                  { val: u.shows_attended, lbl: 'ATTENDED', col: 'var(--cyan)' },
                  { val: u.shows_rated,    lbl: 'RATED',    col: 'var(--orange)' },
                  { val: u.reviews,        lbl: 'REVIEWS',  col: 'var(--green)' },
                  { val: u.tandc_accepted ? '✓' : '✗', lbl: 'T&C', col: u.tandc_accepted ? 'var(--green)' : 'rgba(51,255,51,0.2)' },
                  { val: u.onboarding_complete ? '✓' : '✗', lbl: 'ONBOARD', col: u.onboarding_complete ? 'var(--green)' : 'rgba(51,255,51,0.2)' },
                ].map(({ val, lbl, col }) => (
                  <div key={lbl} style={{ padding: '10px 4px', textAlign: 'center', borderRight: '1px solid rgba(51,255,51,0.06)' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: col, lineHeight: 1 }}>{val}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.34rem', color: 'var(--text-muted)', letterSpacing: '1.5px', marginTop: 4 }}>{lbl}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 14px' }}>
                <button onClick={() => setConfirming({ userId: u.id, username: u.username, action: 'reset-onboarding' })} disabled={!!working}
                  style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', letterSpacing: '1.5px', padding: '6px 10px', border: '1px solid rgba(0,224,208,0.35)', background: 'transparent', color: 'var(--cyan)', cursor: 'pointer' }}>
                  RESET ONBOARDING
                </button>
                <button onClick={() => doAction(u.id, 'reset-password')} disabled={!!working}
                  style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', letterSpacing: '1.5px', padding: '6px 10px', border: '1px solid rgba(51,255,51,0.3)', background: 'transparent', color: 'var(--text-label)', cursor: 'pointer' }}>
                  {working === `${u.id}-reset-password` ? 'SENDING...' : 'RESET PASSWORD'}
                </button>
                <button onClick={() => setConfirming({ userId: u.id, username: u.username, action: 'clear-data' })} disabled={!!working}
                  style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', letterSpacing: '1.5px', padding: '6px 10px', border: '1px solid rgba(255,102,0,0.4)', background: 'transparent', color: 'var(--orange)', cursor: 'pointer' }}>
                  CLEAR DATA
                </button>
                {!u.is_admin && (
                  <button onClick={() => setConfirming({ userId: u.id, username: u.username, action: 'delete' })} disabled={!!working}
                    style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', letterSpacing: '1.5px', padding: '6px 10px', border: '1px solid rgba(255,51,51,0.4)', background: 'transparent', color: 'var(--red)', cursor: 'pointer' }}>
                    DELETE USER
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



// ============================================================
// HEATMAP — reusable state grid (My Venues, My States, Comm)
// ============================================================
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
