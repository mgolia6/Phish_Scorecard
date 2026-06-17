import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FullPageLoader } from './FullPageLoader';

// ── Shared styles ──────────────────────────────────────────
const D = {
  disp: 'var(--font-display)',
  mono: 'var(--font-mono)',
  cyan: 'var(--cyan)',
  orange: 'var(--orange)',
  green: 'var(--green)',
  red: 'var(--red, #ff3333)',
  muted: 'var(--text-muted)',
  label: 'var(--text-label)',
  border: 'var(--border)',
  panel: 'var(--bg-panel)',
};

const SectionLabel = ({ color = D.cyan, children }) => (
  <div style={{ fontFamily: D.disp, fontSize: '0.7rem', letterSpacing: '3px', color, marginBottom: 10 }}>
    {children}
  </div>
);

const StatBox = ({ val, label, color = D.cyan }) => (
  <div style={{ textAlign: 'center', padding: '12px 6px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${color}22` }}>
    <div style={{ fontFamily: D.disp, fontSize: '1.6rem', color, lineHeight: 1 }}>{val}</div>
    <div style={{ fontFamily: D.disp, fontSize: '0.52rem', color: D.muted, letterSpacing: '1.5px', marginTop: 4 }}>{label}</div>
  </div>
);

const TabBtn = ({ active, color, onClick, children }) => (
  <button onClick={onClick} style={{
    fontFamily: D.disp, fontSize: '0.62rem', letterSpacing: '2px',
    padding: '10px 14px', border: `1px solid ${active ? color : 'rgba(51,255,51,0.15)'}`,
    background: active ? `${color}18` : 'transparent',
    color: active ? color : D.muted, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
  }}>{children}</button>
);

// ── API Health ─────────────────────────────────────────────
const API_PROBES = [
  { name: 'AUTH / ME',           path: '/api/auth/me',                  method: 'GET' },
  { name: 'USER / SHOWS',        path: '/api/user/shows',               method: 'GET' },
  { name: 'USER / KPI',          path: '/api/user/kpi',                 method: 'GET' },
  { name: 'USER / ATTENDANCE',   path: '/api/user/attendance',          method: 'GET' },
  { name: 'USER / DEEP-PHREEZE', path: '/api/user/deep-phreeze',        method: 'GET' },
  { name: 'USER / PROFILE',      path: '/api/user/profile',             method: 'GET' },
  { name: 'SHOWS / SEARCH',      path: '/api/shows?q=test',             method: 'GET' },
  { name: 'SHOWS / ON-THIS-DAY', path: '/api/shows/on-this-day',        method: 'GET' },
  { name: 'ANALYTICS / SONGS',   path: '/api/analytics/songs',          method: 'GET' },
  { name: 'ANALYTICS / VENUES',  path: '/api/analytics/venues',         method: 'GET' },
  { name: 'COMMUNITY / LEADERBOARD', path: '/api/community/leaderboard', method: 'GET' },
  { name: 'AI / SUMMARIZE',      path: '/api/ai/summarize?showDate=2024-07-14', method: 'GET' },
  { name: 'AI / EBENEZER',       path: '/api/ai/ebenezer',              method: 'GET', expectError: true },
  { name: 'ADMIN / STATS',       path: '/api/admin/stats',              method: 'GET' },
  { name: 'FEEDBACK / SUBMIT',   path: '/api/feedback/submit',          method: 'GET', expectError: true },
];

// External API health probes
// Phish.in — direct (public, CORS-friendly)
// Phish.net / Anthropic / Resend — proxied through /api/admin/health (require server-side keys)
const PHISHIN_PROBE = { name: 'PHISH.IN API', url: 'https://phish.in/api/v2/shows?per_page=1' };

function ApiHealthTab() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  const runProbes = useCallback(async () => {
    setRunning(true);
    const token = localStorage.getItem('phish_token');
    const fresh = API_PROBES.map(p => ({ ...p, status: 'pending', ms: null, statusCode: null }));
    setResults(fresh);

    const updated = [...fresh];
    await Promise.all(API_PROBES.map(async (probe, i) => {
      const t0 = Date.now();
      try {
        const res = await fetch(probe.path, {
          method: probe.method,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
        });
        const ms = Date.now() - t0;
        // expectError = endpoint expects auth error (POST-only, etc) — any response means it's alive
        const ok = probe.expectError ? res.status < 500 : res.status < 400 || res.status === 401;
        updated[i] = { ...probe, status: ok ? (ms > 2000 ? 'slow' : 'ok') : 'error', ms, statusCode: res.status };
      } catch (e) {
        updated[i] = { ...probe, status: 'error', ms: Date.now() - t0, statusCode: null, err: e.message };
      }
      setResults([...updated]);
    }));

    setLastRun(new Date());
    setRunning(false);
  }, []);

  useEffect(() => { runProbes(); }, []);

  const statusColor = s => s === 'ok' ? D.green : s === 'slow' ? D.orange : s === 'pending' ? D.muted : D.red;
  const statusIcon  = s => s === 'ok' ? '✓' : s === 'slow' ? '⚡' : s === 'pending' ? '◌' : '✗';

  const okCount   = results.filter(r => r.status === 'ok').length;
  const slowCount = results.filter(r => r.status === 'slow').length;
  const errCount  = results.filter(r => r.status === 'error').length;

  return (
    <div style={{ padding: '0 10px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionLabel color={D.green}>◈ API HEALTH</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastRun && <span style={{ fontFamily: D.mono, fontSize: '0.65rem', color: D.muted }}>{lastRun.toLocaleTimeString()}</span>}
          <button onClick={runProbes} disabled={running} style={{
            fontFamily: D.disp, fontSize: '0.58rem', letterSpacing: '2px', padding: '8px 14px',
            border: `1px solid ${D.green}`, background: 'transparent', color: D.green, cursor: 'pointer',
          }}>{running ? 'PROBING...' : '↺ REFRESH'}</button>
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
        <StatBox val={okCount} label="OK" color={D.green} />
        <StatBox val={slowCount} label="SLOW" color={D.orange} />
        <StatBox val={errCount} label="DOWN" color={D.red} />
      </div>

      {/* Results list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {results.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 12px', background: 'rgba(0,0,0,0.2)',
            border: `1px solid ${statusColor(r.status)}22`,
            borderLeft: `3px solid ${statusColor(r.status)}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: D.disp, fontSize: '0.7rem', color: statusColor(r.status), width: 14 }}>
                {statusIcon(r.status)}
              </span>
              <div>
                <div style={{ fontFamily: D.disp, fontSize: '0.62rem', color: D.label, letterSpacing: '1.5px' }}>{r.name}</div>
                <div style={{ fontFamily: D.mono, fontSize: '0.72rem', color: D.muted, marginTop: 1 }}>{r.path}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {r.statusCode && <div style={{ fontFamily: D.mono, fontSize: '0.78rem', color: statusColor(r.status) }}>{r.statusCode}</div>}
              {r.ms !== null && <div style={{ fontFamily: D.mono, fontSize: '0.72rem', color: D.muted }}>{r.ms}ms</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Error Log ──────────────────────────────────────────────
// Module-level log so it persists across renders and is populated before mount
const ERROR_LOG = [];
const origConsoleError = console.error;
console.error = (...args) => {
  origConsoleError(...args);
  ERROR_LOG.push({
    id: Date.now() + Math.random(),
    ts: new Date().toISOString(),
    type: 'console.error',
    message: args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '),
    stack: null,
  });
};

// Global unhandled error/promise capture
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    ERROR_LOG.push({
      id: Date.now() + Math.random(),
      ts: new Date().toISOString(),
      type: 'uncaught',
      message: e.message,
      stack: e.error?.stack || null,
      source: `${e.filename}:${e.lineno}:${e.colno}`,
    });
  });
  window.addEventListener('unhandledrejection', (e) => {
    ERROR_LOG.push({
      id: Date.now() + Math.random(),
      ts: new Date().toISOString(),
      type: 'unhandledrejection',
      message: String(e.reason?.message || e.reason),
      stack: e.reason?.stack || null,
    });
  });
}

function ErrorLogTab() {
  const [log, setLog] = useState([...ERROR_LOG]);
  const [expanded, setExpanded] = useState(null);

  const refresh = () => setLog([...ERROR_LOG]);
  const clearLog = () => { ERROR_LOG.length = 0; setLog([]); };

  const exportText = () => {
    const txt = log.map(e =>
      `[${e.ts}] ${e.type.toUpperCase()}\n${e.message}${e.stack ? '\n' + e.stack : ''}${e.source ? '\nSource: ' + e.source : ''}\n`
    ).join('\n---\n\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `phreezer-errors-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
  };

  const typeColor = t => t === 'uncaught' ? D.red : t === 'unhandledrejection' ? D.orange : D.muted;

  return (
    <div style={{ padding: '0 10px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionLabel color={D.red}>◈ ERROR LOG</SectionLabel>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={refresh} style={{ fontFamily: D.disp, fontSize: '0.56rem', letterSpacing: '1.5px', padding: '7px 12px', border: `1px solid ${D.muted}`, background: 'transparent', color: D.muted, cursor: 'pointer' }}>↺</button>
          <button onClick={copyAll} disabled={!log.length} style={{ fontFamily: D.disp, fontSize: '0.56rem', letterSpacing: '1.5px', padding: '7px 12px', border: `1px solid ${D.cyan}`, background: 'transparent', color: D.cyan, cursor: 'pointer' }}>COPY JSON</button>
          <button onClick={exportText} disabled={!log.length} style={{ fontFamily: D.disp, fontSize: '0.56rem', letterSpacing: '1.5px', padding: '7px 12px', border: `1px solid ${D.orange}`, background: 'transparent', color: D.orange, cursor: 'pointer' }}>EXPORT .TXT</button>
          <button onClick={clearLog} disabled={!log.length} style={{ fontFamily: D.disp, fontSize: '0.56rem', letterSpacing: '1.5px', padding: '7px 12px', border: `1px solid ${D.red}`, background: 'transparent', color: D.red, cursor: 'pointer' }}>CLEAR</button>
        </div>
      </div>

      {!log.length ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontFamily: D.disp, fontSize: '0.52rem', color: D.green, letterSpacing: '2px', marginBottom: 8 }}>✓ NO ERRORS</div>
          <div style={{ fontFamily: D.mono, fontSize: '0.75rem', color: D.muted }}>Errors from console.error, uncaught exceptions, and unhandled promise rejections will appear here.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[...log].reverse().map((e) => (
            <div key={e.id} style={{
              border: `1px solid ${typeColor(e.type)}33`,
              borderLeft: `3px solid ${typeColor(e.type)}`,
              background: 'rgba(0,0,0,0.25)',
            }}>
              <div
                onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: D.disp, fontSize: '0.54rem', letterSpacing: '1.5px', color: typeColor(e.type), border: `1px solid ${typeColor(e.type)}55`, padding: '1px 6px', flexShrink: 0 }}>
                      {e.type.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: D.mono, fontSize: '0.72rem', color: D.muted, flexShrink: 0 }}>
                      {new Date(e.ts).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ fontFamily: D.mono, fontSize: '0.82rem', color: D.label, lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {e.message.length > 120 ? e.message.slice(0, 120) + '…' : e.message}
                  </div>
                </div>
                <span style={{ color: D.muted, fontSize: '0.7rem', flexShrink: 0 }}>{expanded === e.id ? '▲' : '▼'}</span>
              </div>
              {expanded === e.id && (
                <div style={{ padding: '0 12px 12px', borderTop: '1px solid rgba(51,255,51,0.06)' }}>
                  <div style={{ fontFamily: D.mono, fontSize: '0.68rem', color: D.label, lineHeight: 1.5, wordBreak: 'break-all', marginTop: 10 }}>
                    {e.message}
                  </div>
                  {e.source && (
                    <div style={{ fontFamily: D.mono, fontSize: '0.74rem', color: D.muted, marginTop: 6 }}>
                      📍 {e.source}
                    </div>
                  )}
                  {e.stack && (
                    <pre style={{ fontFamily: D.mono, fontSize: '0.58rem', color: D.muted, marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: 'rgba(0,0,0,0.3)', padding: 10, maxHeight: 200, overflowY: 'auto' }}>
                      {e.stack}
                    </pre>
                  )}
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(e, null, 2))}
                    style={{ marginTop: 8, fontFamily: D.disp, fontSize: '0.54rem', letterSpacing: '1.5px', padding: '6px 12px', border: `1px solid ${D.cyan}55`, background: 'transparent', color: D.cyan, cursor: 'pointer' }}
                  >
                    COPY THIS ERROR
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tooltip component ──────────────────────────────────────
function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onTouchStart={() => setVisible(v => !v)}
    >
      {children}
      {visible && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
          background: '#111', border: '1px solid rgba(0,224,208,0.3)', padding: '8px 12px',
          fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'rgba(0,224,208,0.85)',
          lineHeight: 1.5, whiteSpace: 'nowrap', zIndex: 999, pointerEvents: 'none',
          boxShadow: '0 0 12px rgba(0,224,208,0.15)',
        }}>
          {text}
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            borderTop: '5px solid rgba(0,224,208,0.3)' }} />
        </div>
      )}
    </div>
  );
}

// ── ActionButton with tooltip ───────────────────────────────
function ActionBtn({ label, tooltip, color, working, workingKey, onClick, disabled }) {
  const isWorking = working === workingKey;
  return (
    <Tooltip text={tooltip}>
      <button
        onClick={onClick}
        disabled={isWorking || disabled}
        style={{
          fontFamily: 'var(--font-display)', fontSize: '0.58rem', letterSpacing: '2px',
          padding: '12px 14px', border: `1px solid ${color}`,
          background: isWorking ? `${color}18` : 'transparent',
          color, cursor: isWorking || disabled ? 'default' : 'pointer',
          opacity: isWorking || disabled ? 0.5 : 1, width: '100%', textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span>{isWorking ? '◈ WORKING...' : label}</span>
        <span style={{ fontSize: '0.5rem', color: `${color}66`, fontFamily: 'var(--font-mono)' }}>?</span>
      </button>
    </Tooltip>
  );
}

// ── System Stats ───────────────────────────────────────────
function SystemTab({ api, showMessage }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(null);
  const [migrationResult, setMigrationResult] = useState(null);
  const [actionResult, setActionResult] = useState(null);

  const loadStats = () => {
    setLoading(true);
    api.get('/admin/stats')
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStats(); }, []);

  const adminFetch = (path, method = 'GET') => {
    const token = localStorage.getItem('phish_token');
    return fetch(path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
  };

  const runAction = async (key, path, method = 'POST', successFn) => {
    setWorking(key);
    try {
      const res = await adminFetch(path, method);
      const data = await res.json();
      if (successFn) successFn(data);
      else showMessage(data.ok ? 'Done.' : ('Error: ' + (data.error || JSON.stringify(data))));
      loadStats();
    } catch (err) {
      showMessage('Failed: ' + err.message);
    } finally { setWorking(null); }
  };

  if (loading) return <FullPageLoader text="LOADING STATS..." />;

  const ACTIONS = [
    {
      group: 'DATABASE',
      color: D.cyan,
      items: [
        {
          key: 'migrate',
          label: '⚙ RUN MIGRATIONS',
          tooltip: 'Run pending DB schema migrations. Safe to run multiple times — skips already-applied ones.',
          action: async () => {
            setWorking('migrate');
            try {
              const res = await adminFetch('/api/admin/migrate', 'POST');
              const data = await res.json();
              setMigrationResult(data);
              loadStats();
            } catch (err) { setMigrationResult({ error: err.message }); }
            finally { setWorking(null); }
          },
        },
        {
          key: 'cache',
          label: '✕ CLEAR SHOW CACHE',
          tooltip: 'Clears the cached show/setlist data. Shows will re-fetch from Phish.net on next load.',
          action: () => runAction('cache', '/api/admin/clear-cache'),
        },
      ],
    },
    {
      group: 'UNCLE EBENEZER',
      color: D.orange,
      items: [
        {
          key: 'seed-jamcharts',
          label: '❄ SEED JAMCHART CATALOG',
          tooltip: 'Fetches ALL Phish.net jamchart entries (~2500) into the DB. Run once. Takes ~30s. Ebenezer uses this for vibe/style queries.',
          action: () => runAction('seed-jamcharts', '/api/admin/seed-jamcharts', 'GET', (d) => {
            setActionResult({ title: 'JAMCHART SEED COMPLETE', lines: [
              `Inserted: ${d.inserted}`,
              `Updated: ${d.updated}`,
              `Errors: ${d.errors}`,
              `Total in DB: ${d.total}`,
              `Pages fetched: ${d.pages}`,
            ]});
          }),
        },
        {
          key: 'refresh-jamcharts',
          label: '↺ REFRESH JAMCHARTS',
          tooltip: 'Fetches the 200 most recent Phish.net jamchart entries and upserts them. Also runs automatically every Monday.',
          action: () => runAction('refresh-jamcharts', '/api/admin/refresh-jamcharts', 'GET', (d) => {
            showMessage(`Refreshed — ${d.inserted} new, ${d.updated} updated, ${d.total} total`);
          }),
        },
        {
          key: 'seed-ebenezer',
          label: '◈ SEED EBENEZER POST',
          tooltip: 'Creates or refreshes the pinned Uncle Ebenezer introduction post in the community feed.',
          action: () => runAction('seed-ebenezer', '/api/admin/seed-ebenezer'),
        },
      ],
    },
    {
      group: 'USERS + BADGES',
      color: D.green,
      items: [
        {
          key: 'seed-badges',
          label: '⬡ SEED FOUNDER BADGES',
          tooltip: 'Assigns PHAB PHIVE (users #1-5) and EARLY PHREEZE (users #6-20) badges by signup date. Safe to re-run — picks up newly verified users.',
          action: () => runAction('seed-badges', '/api/admin/seed-founder-badges', 'GET', (d) => {
            if (d.ok) setActionResult({ title: 'BADGES ASSIGNED', lines: d.assigned.map(u => `#${u.rank} ${u.username} → ${u.badge}`) });
          }),
        },
      ],
    },
  ];

  return (
    <div style={{ padding: '0 10px 20px' }}>
      {migrationResult && (
        <div className="modal-overlay" style={{ zIndex: 700 }}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-title" style={{ color: migrationResult.error ? D.red : D.cyan }}>
              {migrationResult.error ? 'MIGRATION ERROR' : 'MIGRATIONS COMPLETE'}
            </div>
            {migrationResult.error ? (
              <p style={{ color: D.red, fontSize: '0.8rem', marginBottom: 20 }}>{migrationResult.error}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '50vh', overflowY: 'auto', marginBottom: 20 }}>
                {migrationResult.results?.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: r.status === 'ok' ? D.green : D.red, fontFamily: D.disp, fontSize: '0.7rem' }}>{r.status === 'ok' ? '✓' : '✗'}</span>
                    <span style={{ fontFamily: D.mono, fontSize: '0.7rem', color: r.status === 'ok' ? 'rgba(51,255,51,0.7)' : D.red }}>{r.migration}</span>
                    {r.error && <span style={{ fontSize: '0.6rem', color: D.red, opacity: 0.7 }}>{r.error}</span>}
                  </div>
                ))}
              </div>
            )}
            <button className="btn-primary" style={{ width: '100%', padding: '13px' }} onClick={() => setMigrationResult(null)}>CLOSE</button>
          </div>
        </div>
      )}

      {actionResult && (
        <div className="modal-overlay" style={{ zIndex: 700 }}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-title" style={{ color: D.green }}>{actionResult.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '50vh', overflowY: 'auto', marginBottom: 20 }}>
              {actionResult.lines.map((line, i) => (
                <div key={i} style={{ fontFamily: D.mono, fontSize: '0.75rem', color: 'rgba(51,255,51,0.8)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>{line}</div>
              ))}
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: '13px' }} onClick={() => setActionResult(null)}>CLOSE</button>
          </div>
        </div>
      )}

      <SectionLabel color={D.cyan}>◈ SYSTEM STATS</SectionLabel>

      {stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 8 }}>
            <StatBox val={stats.users}        label="USERS"      color={D.cyan} />
            <StatBox val={stats.ratings}      label="RATINGS"    color={D.orange} />
            <StatBox val={stats.attendance}   label="ATTENDANCE" color={D.green} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
            <StatBox val={stats.shows_cached} label="CACHED SHOWS"  color={D.cyan} />
            <StatBox val={stats.vibe_checks}  label="VIBE CHECKS"   color={D.orange} />
            <StatBox val={stats.feedback}     label="FEEDBACK"       color={D.green} />
          </div>
          <div style={{ fontFamily: D.mono, fontSize: '0.74rem', color: D.muted, marginBottom: 20 }}>
            Last updated: {new Date(stats.generated_at).toLocaleTimeString()}
            <button onClick={loadStats} style={{ marginLeft: 10, fontFamily: D.disp, fontSize: '0.54rem', letterSpacing: '1.5px', padding: '4px 10px', border: `1px solid ${D.muted}`, background: 'transparent', color: D.muted, cursor: 'pointer' }}>↺</button>
          </div>
        </>
      )}

      {ACTIONS.map(group => (
        <div key={group.group} style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: D.disp, fontSize: '0.52rem', color: group.color, letterSpacing: '3px', marginBottom: 8, opacity: 0.7 }}>
            ◈ {group.group}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {group.items.map(item => (
              <Tooltip key={item.key} text={item.tooltip}>
                <button
                  onClick={item.action}
                  disabled={!!working}
                  style={{
                    fontFamily: D.disp, fontSize: '0.58rem', letterSpacing: '2px',
                    padding: '13px 16px', border: `1px solid ${group.color}`,
                    background: working === item.key ? `${group.color}18` : 'transparent',
                    color: group.color, cursor: !!working ? 'default' : 'pointer',
                    opacity: !!working && working !== item.key ? 0.4 : 1,
                    width: '100%', textAlign: 'left',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <span>{working === item.key ? '◈ WORKING...' : item.label}</span>
                  <span style={{ fontSize: '0.55rem', color: `${group.color}55`, fontFamily: D.mono }}>HOLD FOR INFO</span>
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Feedback Tab ───────────────────────────────────────────
function FeedbackTab({ api }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/admin/feedback')
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageLoader text="LOADING FEEDBACK..." />;
  if (!data) return <div style={{ padding: 20, fontFamily: D.mono, color: D.red }}>Failed to load feedback.</div>;

  const types = ['all', ...new Set(data.responses.map(r => r.trigger_type))];
  const filtered = filter === 'all' ? data.responses : data.responses.filter(r => r.trigger_type === filter);

  return (
    <div style={{ padding: '0 10px 20px' }}>
      <SectionLabel color={D.orange}>◈ FEEDBACK SUMMARY</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
        {data.summary.map(s => (
          <StatBox key={s.trigger_type} val={s.count} label={s.trigger_type.toUpperCase()} color={D.orange} />
        ))}
      </div>

      {data.section_summary?.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: D.disp, fontSize: '0.6rem', letterSpacing: '2px', color: D.muted, marginBottom: 8 }}>SECTIONS (PASSIVE)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.section_summary.map(s => (
              <span key={s.section} style={{ fontFamily: D.mono, fontSize: '0.78rem', color: D.cyan, border: `1px solid ${D.cyan}33`, padding: '3px 8px' }}>
                {s.section} <span style={{ color: D.orange }}>({s.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }}>
        {types.map(t => (
          <TabBtn key={t} active={filter === t} color={D.orange} onClick={() => setFilter(t)}>
            {t.toUpperCase()}
          </TabBtn>
        ))}
      </div>

      <div style={{ fontFamily: D.disp, fontSize: '0.6rem', color: D.muted, letterSpacing: '2px', marginBottom: 10 }}>
        {filtered.length} RESPONSES
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(r => (
          <div key={r.id} style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,140,0,0.15)', borderLeft: '3px solid var(--orange)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontFamily: D.mono, fontSize: '0.84rem', color: D.label }}>{r.phishnet_username || r.email}</span>
                <span style={{ fontFamily: D.disp, fontSize: '0.54rem', letterSpacing: '1.5px', color: D.orange, border: '1px solid rgba(255,140,0,0.35)', padding: '1px 6px' }}>{r.trigger_type}</span>
                {r.section && <span style={{ fontFamily: D.disp, fontSize: '0.54rem', letterSpacing: '1.5px', color: D.cyan, border: '1px solid rgba(0,224,208,0.35)', padding: '1px 6px' }}>{r.section}</span>}
              </div>
              <span style={{ fontFamily: D.mono, fontSize: '0.6rem', color: D.muted, flexShrink: 0 }}>
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
            {r.free_text && (
              <div style={{ fontFamily: D.mono, fontSize: '0.75rem', color: 'var(--white)', lineHeight: 1.6, borderLeft: '2px solid rgba(255,140,0,0.3)', paddingLeft: 10 }}>
                "{r.free_text}"
              </div>
            )}
            {r.answers && Object.keys(r.answers).length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(r.answers).map(([k, v]) => (
                  <span key={k} style={{ fontFamily: D.mono, fontSize: '0.62rem', color: D.muted }}>
                    <span style={{ color: D.label }}>{k}:</span> {String(v)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Users Tab (existing, extracted) ───────────────────────
function UsersTab({ api, showError }) {
  const [expanded, setExpanded] = React.useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);
  const [working, setWorking] = useState(null);

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
      const token = localStorage.getItem('phish_token');
      if (method === 'DELETE') {
        const res = await fetch(`/api/admin/user?id=${userId}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else if (action === 'resend-verify') {
        const u = users.find(u => u.id === userId);
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: u.email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } else {
        const res = await fetch(`/api/admin/user?id=${userId}&action=${action}`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (action === 'reset-onboarding' || action === 'clear-data') loadUsers();
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setWorking(null);
      setConfirming(null);
    }
  };

  if (loading) return <FullPageLoader text="LOADING..." />;

  return (
    <div style={{ padding: '0 10px 20px' }}>
      {confirming && (
        <div className="modal-overlay" style={{ zIndex: 600 }}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-title" style={{ color: D.red }}>CONFIRM</div>
            <p style={{ fontSize: '0.85rem', color: 'rgba(51,255,51,0.8)', marginBottom: 24, lineHeight: 1.6 }}>
              {confirming.action === 'delete' && <>Delete <strong style={{ color: D.red }}>{confirming.username}</strong>? Permanent. Cannot be undone.</>}
              {confirming.action === 'clear-data' && <>Clear all show data for <strong style={{ color: D.orange }}>{confirming.username}</strong>? Ratings, attendance, and reviews will be removed. Account preserved.</>}
              {confirming.action === 'reset-onboarding' && <>Reset onboarding for <strong style={{ color: D.cyan }}>{confirming.username}</strong>? They'll go through setup again on next login.</>}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary"
                style={{ flex: 1, borderColor: confirming.action === 'delete' ? D.red : D.orange, color: confirming.action === 'delete' ? D.red : D.orange }}
                onClick={() => confirming.action === 'delete' ? doAction(confirming.userId, null, 'DELETE') : doAction(confirming.userId, confirming.action)}
                disabled={!!working}
              >{working ? '◈ WORKING...' : 'CONFIRM'}</button>
              <button style={{ flex: 1 }} onClick={() => setConfirming(null)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* KPI bar */}
      {(() => {
        const total    = users.length;
        const verified = users.filter(u => u.email_verified).length;
        const rated    = users.filter(u => parseInt(u.shows_rated) > 0).length;
        const linked   = users.filter(u => u.phishnet_username).length;
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { val: total,    lbl: 'TOTAL',    col: D.cyan },
              { val: verified, lbl: 'VERIFIED', col: D.green },
              { val: rated,    lbl: 'RATED',    col: D.orange },
              { val: linked,   lbl: '.NET LINKED', col: D.cyan },
            ].map(({ val, lbl, col }) => (
              <div key={lbl} style={{ padding: '10px 4px', background: 'rgba(0,0,0,0.4)', borderTop: `2px solid ${col}`, textAlign: 'center' }}>
                <div style={{ fontFamily: D.disp, fontSize: '1.4rem', color: col, lineHeight: 1 }}>{val}</div>
                <div style={{ fontFamily: D.disp, fontSize: '0.46rem', color: D.muted, letterSpacing: '1.5px', marginTop: 5 }}>{lbl}</div>
              </div>
            ))}
          </div>
        );
      })()}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {users.map(u => (
          <div key={u.id} style={{
            border: `1px solid ${u.is_admin ? 'rgba(0,224,208,0.35)' : D.border}`,
            borderLeft: `3px solid ${u.is_admin ? D.cyan : 'rgba(51,255,51,0.3)'}`,
            background: D.panel,
          }}>
            {/* Collapsed header — always visible, tap to expand */}
            <div
              onClick={() => setExpanded(expanded === u.id ? null : u.id)}
              style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: D.mono, fontSize: '1.05rem', color: 'var(--white)' }}>{u.username}</span>
                  {u.is_admin && <span style={{ fontFamily: D.disp, fontSize: '0.54rem', letterSpacing: '2px', color: D.cyan, border: '1px solid rgba(0,224,208,0.4)', padding: '2px 6px' }}>ADMIN</span>}
                </div>
                <div style={{ fontFamily: D.mono, fontSize: '0.8rem', color: D.muted, marginTop: 3 }}>{u.email}</div>
                {/* Mini stat pills — always visible */}
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  {[
                    { val: u.shows_attended, lbl: 'ATT', col: D.cyan },
                    { val: u.shows_rated,    lbl: 'RATED', col: D.orange },
                    { val: u.reviews,        lbl: 'REV', col: D.green },
                  ].map(({ val, lbl, col }) => (
                    <span key={lbl} style={{ fontFamily: D.mono, fontSize: '0.78rem', color: col }}>
                      <span style={{ fontFamily: D.disp, fontSize: '0.9rem' }}>{val}</span>
                      <span style={{ color: D.muted, fontSize: '0.64rem', marginLeft: 3 }}>{lbl}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span style={{ fontFamily: D.mono, fontSize: '0.72rem', color: D.muted }}>{u.joined}</span>
                <span style={{ color: D.muted, fontSize: '1rem' }}>{expanded === u.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Expanded — stats + actions */}
            {expanded === u.id && (
              <div style={{ borderTop: '1px solid rgba(51,255,51,0.1)' }}>
                {/* Full stat grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', borderBottom: '1px solid rgba(51,255,51,0.08)' }}>
                  {[
                    { val: u.shows_attended, lbl: 'ATTENDED', col: D.cyan },
                    { val: u.shows_rated,    lbl: 'RATED',    col: D.orange },
                    { val: u.reviews,        lbl: 'REVIEWS',  col: D.green },
                    { val: u.tandc_accepted ? '✓' : '✗', lbl: 'T&C', col: u.tandc_accepted ? D.green : 'rgba(51,255,51,0.2)' },
                    { val: u.onboarding_complete ? '✓' : '✗', lbl: 'ONBOARD', col: u.onboarding_complete ? D.green : 'rgba(51,255,51,0.2)' },
                    { val: u.email_verified ? '✓' : '✗', lbl: 'VERIFIED', col: u.email_verified ? D.green : D.orange },
                  ].map(({ val, lbl, col }) => (
                    <div key={lbl} style={{ padding: '12px 4px', textAlign: 'center', borderRight: '1px solid rgba(51,255,51,0.06)' }}>
                      <div style={{ fontFamily: D.disp, fontSize: '1.3rem', color: col, lineHeight: 1 }}>{val}</div>
                      <div style={{ fontFamily: D.disp, fontSize: '0.5rem', color: D.muted, letterSpacing: '1.5px', marginTop: 5 }}>{lbl}</div>
                    </div>
                  ))}
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 16px' }}>
                  {[
                    { label: 'RESET ONBOARDING', action: 'reset-onboarding', col: D.cyan },
                    { label: 'RESET TOUR',       action: 'reset-tour',       col: D.cyan },
                    { label: 'RESET PASSWORD',   action: 'reset-password',   col: D.label },
                    { label: 'CLEAR DATA',       action: 'clear-data',       col: D.orange },
                  ].map(({ label, action, col }) => (
                    <button key={action}
                      onClick={() => (action === 'reset-password' || action === 'reset-tour') ? doAction(u.id, action) : setConfirming({ userId: u.id, username: u.username, action })}
                      disabled={!!working}
                      style={{ fontFamily: D.disp, fontSize: '0.58rem', letterSpacing: '1.5px', padding: '10px 16px', border: `1px solid ${col}55`, background: 'transparent', color: col, cursor: 'pointer' }}>
                      {working === `${u.id}-${action}` ? 'WORKING...' : label}
                    </button>
                  ))}
                  {!u.email_verified && (
                    <button onClick={() => doAction(u.id, 'resend-verify')} disabled={!!working}
                      style={{ fontFamily: D.disp, fontSize: '0.58rem', letterSpacing: '1.5px', padding: '10px 16px', border: `1px solid ${D.cyan}55`, background: 'transparent', color: D.cyan, cursor: 'pointer' }}>
                      {working === `${u.id}-resend-verify` ? 'SENDING...' : 'RESEND VERIFY'}
                    </button>
                  )}
                  {!u.is_admin && (
                    <button onClick={() => setConfirming({ userId: u.id, username: u.username, action: 'delete' })} disabled={!!working}
                      style={{ fontFamily: D.disp, fontSize: '0.58rem', letterSpacing: '1.5px', padding: '10px 16px', border: `1px solid ${D.red}55`, background: 'transparent', color: D.red, cursor: 'pointer' }}>
                      DELETE USER
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── External API Health ────────────────────────────────────
function ExternalApiHealthTab() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  const runProbes = useCallback(async () => {
    setRunning(true);
    const token = localStorage.getItem('phish_token');

    // Seed pending state for 4 services
    const names = ['PHISH.NET API', 'PHISH.IN API', 'ANTHROPIC API', 'RESEND API'];
    const fresh = names.map(name => ({ name, status: 'pending', ms: null, statusCode: null }));
    setResults([...fresh]);
    const updated = [...fresh];

    // Server-side probe (Phish.net, Anthropic, Resend)
    const serverProbe = (async () => {
      const t0 = Date.now();
      try {
        const res = await fetch('/api/admin/health', {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(10000),
        });
        const body = await res.json();
        const elapsed = Date.now() - t0;
        const map = { 'PHISH.NET API': body.phishnet, 'ANTHROPIC API': body.anthropic, 'RESEND API': body.resend };
        for (const [name, result] of Object.entries(map)) {
          const idx = updated.findIndex(r => r.name === name);
          if (idx === -1 || !result) continue;
          const ms = result.ms ?? elapsed;
          updated[idx] = { ...updated[idx], status: result.ok ? (ms > 3000 ? 'slow' : 'ok') : 'error', ms, statusCode: result.status };
          setResults([...updated]);
        }
      } catch (e) {
        ['PHISH.NET API', 'ANTHROPIC API', 'RESEND API'].forEach(name => {
          const idx = updated.findIndex(r => r.name === name);
          if (idx !== -1) { updated[idx] = { ...updated[idx], status: 'error', ms: null }; }
        });
        setResults([...updated]);
      }
    })();

    // Direct probe — Phish.in (public, no key)
    const phishinProbe = (async () => {
      const t0 = Date.now();
      const idx = updated.findIndex(r => r.name === 'PHISH.IN API');
      try {
        const res = await fetch(PHISHIN_PROBE.url, { signal: AbortSignal.timeout(8000) });
        const ms = Date.now() - t0;
        updated[idx] = { ...updated[idx], status: res.status < 500 ? (ms > 3000 ? 'slow' : 'ok') : 'error', ms, statusCode: res.status };
      } catch (e) {
        updated[idx] = { ...updated[idx], status: 'error', ms: Date.now() - t0 };
      }
      setResults([...updated]);
    })();

    await Promise.all([serverProbe, phishinProbe]);
    setLastRun(new Date());
    setRunning(false);
  }, []);

  useEffect(() => { runProbes(); }, []);

  const statusColor = s => s === 'ok' ? D.green : s === 'slow' ? D.orange : s === 'pending' ? D.muted : D.red;
  const statusIcon  = s => s === 'ok' ? '✓' : s === 'slow' ? '⚡' : s === 'pending' ? '◌' : '✗';

  return (
    <div style={{ padding: '0 10px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionLabel color={D.orange}>◈ EXTERNAL API STATUS</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastRun && <span style={{ fontFamily: D.mono, fontSize: '0.65rem', color: D.muted }}>{lastRun.toLocaleTimeString()}</span>}
          <button onClick={runProbes} disabled={running} style={{
            fontFamily: D.disp, fontSize: '0.58rem', letterSpacing: '2px', padding: '8px 14px',
            border: `1px solid ${D.orange}`, background: 'transparent', color: D.orange, cursor: 'pointer',
          }}>{running ? 'CHECKING...' : '↺ RECHECK'}</button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {results.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', background: 'rgba(0,0,0,0.3)',
            borderLeft: `3px solid ${statusColor(r.status)}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: D.mono, fontSize: '0.9rem', color: statusColor(r.status) }}>
                {statusIcon(r.status)}
              </span>
              <span style={{ fontFamily: D.disp, fontSize: '0.58rem', letterSpacing: '2px', color: D.label }}>
                {r.name}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {r.statusCode && (
                <span style={{ fontFamily: D.mono, fontSize: '0.65rem', color: D.muted }}>{r.statusCode}</span>
              )}
              {r.ms !== null && (
                <span style={{ fontFamily: D.mono, fontSize: '0.65rem', color: statusColor(r.status) }}>{r.ms}ms</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AI Usage Tab ───────────────────────────────────────────
function AiUsageTab({ api }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('phish_token');
    fetch('/api/admin/ai-usage', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <div style={{ padding: 20, fontFamily: D.mono, color: D.muted, fontSize: '0.75rem' }}>LOADING...</div>;
  if (error)   return <div style={{ padding: 20, fontFamily: D.mono, color: D.red, fontSize: '0.75rem' }}>{error}</div>;
  if (!data)   return null;

  const { totals, byFeature, byDay, byModel, recent } = data;

  const fmt = n => Number(n).toLocaleString();
  const fmtCost = n => `$${Number(n).toFixed(4)}`;

  return (
    <div style={{ padding: '0 10px 40px' }}>

      {/* Totals */}
      <SectionLabel color={D.orange}>◈ AI USAGE — ALL TIME</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
        {[
          { label: 'TOTAL CALLS',    val: fmt(totals.total_calls),          color: D.cyan },
          { label: 'INPUT TOKENS',   val: fmt(totals.total_input_tokens),   color: D.green },
          { label: 'OUTPUT TOKENS',  val: fmt(totals.total_output_tokens),  color: D.orange },
          { label: 'EST. COST',      val: fmtCost(totals.total_cost_usd),   color: D.red },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px 10px', background: 'rgba(0,0,0,0.4)', borderTop: `2px solid ${s.color}`, textAlign: 'center' }}>
            <div style={{ fontFamily: D.mono, fontSize: '1rem', color: s.color, fontWeight: 700 }}>{s.val}</div>
            <div style={{ fontFamily: D.disp, fontSize: '0.42rem', color: D.muted, letterSpacing: '2px', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* By Feature */}
      <SectionLabel color={D.cyan}>◈ BY FEATURE</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
        {byFeature.map(f => (
          <div key={f.feature} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderLeft: `3px solid ${D.cyan}` }}>
            <span style={{ fontFamily: D.disp, fontSize: '0.58rem', letterSpacing: '2px', color: D.label }}>{f.feature.toUpperCase()}</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ fontFamily: D.mono, fontSize: '0.65rem', color: D.cyan }}>{fmt(f.calls)} calls</span>
              <span style={{ fontFamily: D.mono, fontSize: '0.65rem', color: D.muted }}>{fmt(parseInt(f.input_tokens) + parseInt(f.output_tokens))} tokens</span>
              <span style={{ fontFamily: D.mono, fontSize: '0.65rem', color: D.orange }}>{fmtCost(f.cost_usd)}</span>
            </div>
          </div>
        ))}
        {byFeature.length === 0 && <div style={{ fontFamily: D.mono, fontSize: '0.7rem', color: D.muted, padding: '10px 0' }}>No data yet.</div>}
      </div>

      {/* By Model */}
      <SectionLabel color={D.green}>◈ BY MODEL</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
        {byModel.map(m => (
          <div key={m.model} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderLeft: `3px solid ${D.green}` }}>
            <span style={{ fontFamily: D.mono, fontSize: '0.62rem', color: D.label }}>{m.model}</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ fontFamily: D.mono, fontSize: '0.65rem', color: D.green }}>{fmt(m.calls)} calls</span>
              <span style={{ fontFamily: D.mono, fontSize: '0.65rem', color: D.orange }}>{fmtCost(m.cost_usd)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Last 30 days */}
      <SectionLabel color={D.label}>◈ LAST 30 DAYS</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 24 }}>
        {byDay.slice(0, 14).map(d => (
          <div key={d.day} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', background: 'rgba(0,0,0,0.2)' }}>
            <span style={{ fontFamily: D.mono, fontSize: '0.65rem', color: D.muted }}>{d.day}</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ fontFamily: D.mono, fontSize: '0.65rem', color: D.cyan }}>{d.calls} calls</span>
              <span style={{ fontFamily: D.mono, fontSize: '0.65rem', color: D.orange }}>{fmtCost(d.cost_usd)}</span>
            </div>
          </div>
        ))}
        {byDay.length === 0 && <div style={{ fontFamily: D.mono, fontSize: '0.7rem', color: D.muted, padding: '10px 0' }}>No data yet.</div>}
      </div>

      {/* Recent calls */}
      <SectionLabel color={D.label}>◈ RECENT CALLS</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {recent.map(r => (
          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: 'rgba(0,0,0,0.2)' }}>
            <div>
              <span style={{ fontFamily: D.disp, fontSize: '0.52rem', letterSpacing: '2px', color: D.orange, marginRight: 10 }}>{r.feature}</span>
              <span style={{ fontFamily: D.mono, fontSize: '0.6rem', color: D.muted }}>{r.username || 'system'}</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontFamily: D.mono, fontSize: '0.6rem', color: D.muted }}>{r.input_tokens}+{r.output_tokens}tok</span>
              <span style={{ fontFamily: D.mono, fontSize: '0.6rem', color: D.orange }}>{fmtCost(r.cost_usd)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Donations Tab ─────────────────────────────────────────
function DonationsTab({ api, showMessage, showError }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [input, setInput] = React.useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/admin/donations', {
      headers: { Authorization: `Bearer ${localStorage.getItem('phish_token')}` }
    })
      .then(r => r.json())
      .then(d => { setData(d); setInput(String(d.items_sold)); setLoading(false); })
      .catch(() => setLoading(false));
  };

  React.useEffect(() => { load(); }, []);

  const save = async () => {
    const val = parseInt(input, 10);
    if (isNaN(val) || val < 0) { showError('Enter a valid number'); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('phish_token');
      const res = await fetch('/api/admin/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items_sold: val }),
      });
      const d = await res.json();
      setData(d);
      setInput(String(d.items_sold));
      showMessage(`Updated — $${d.total_donated} donated`);
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 20, fontFamily: D.mono, color: D.muted, fontSize: '0.75rem' }}>LOADING...</div>;
  if (!data)   return null;

  return (
    <div style={{ padding: '0 10px 40px' }}>
      <SectionLabel color={D.green}>◈ MOCKINGBIRD FOUNDATION TRACKER</SectionLabel>
      <div style={{ fontFamily: D.mono, fontSize: '0.68rem', color: D.muted, lineHeight: 1.8, marginBottom: 20 }}>
        $1.00 donated per item sold. Update the total items sold below after each Etsy payout.
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
        {[
          { label: 'ITEMS SOLD',    val: data.items_sold,    color: D.cyan },
          { label: 'PER ITEM',      val: `$${data.donation_per_item.toFixed(2)}`, color: D.label },
          { label: 'TOTAL DONATED', val: `$${data.total_donated}`, color: D.green },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px 10px', background: 'rgba(0,0,0,0.4)', borderTop: `2px solid ${s.color}`, textAlign: 'center' }}>
            <div style={{ fontFamily: D.mono, fontSize: '1.2rem', color: s.color, fontWeight: 700 }}>{s.val}</div>
            <div style={{ fontFamily: D.disp, fontSize: '0.4rem', color: D.muted, letterSpacing: '2px', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Update form */}
      <SectionLabel color={D.label}>◈ UPDATE ITEMS SOLD</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
        <input
          type="number" min="0" value={input}
          onChange={e => setInput(e.target.value)}
          style={{
            flex: 1, padding: '12px 14px', background: 'rgba(0,0,0,0.4)',
            border: `1px solid ${D.border}`, color: D.white,
            fontFamily: D.mono, fontSize: '0.85rem',
          }}
          placeholder="Total items sold to date"
        />
        <button
          onClick={save} disabled={saving}
          style={{
            padding: '12px 20px', fontFamily: D.disp, fontSize: '0.55rem',
            letterSpacing: '2px', background: D.green, color: '#000',
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700,
            opacity: saving ? 0.6 : 1, whiteSpace: 'nowrap',
          }}
        >
          {saving ? 'SAVING...' : 'SAVE'}
        </button>
      </div>
      <div style={{ fontFamily: D.mono, fontSize: '0.6rem', color: D.muted }}>
        This is a cumulative total — enter the all-time number of items sold.
      </div>
    </div>
  );
}

// ── Main AdminTab ──────────────────────────────────────────

// ── Monitoring Tab ─────────────────────────────────────────
function MonitoringTab({ api }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/admin/monitoring')
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <div style={{ fontFamily: D.disp, fontSize: '0.6rem', color: D.muted, letterSpacing: '2px', padding: 24 }}>LOADING...</div>;
  if (error)   return <div style={{ fontFamily: D.mono, fontSize: '0.75rem', color: D.red, padding: 24 }}>Error: {error}</div>;
  if (!data)   return null;

  const { activation, email, ai, users, ratings, donations, feedback } = data;

  const SERVICE_DEFS = [
    { key: 'sentry_client',  label: 'SENTRY (CLIENT)',  desc: 'Add VITE_SENTRY_DSN to Vercel env vars',  built: true, url: 'https://mpgink.sentry.io/issues/' },
    { key: 'posthog',        label: 'POSTHOG',          desc: 'Add VITE_POSTHOG_KEY to Vercel env vars', built: true, url: 'https://us.posthog.com/' },
    { key: 'resend',         label: 'RESEND EMAIL',     desc: 'Email delivery',                          built: true, url: 'https://resend.com/emails' },
    { key: 'anthropic',      label: 'ANTHROPIC AI',     desc: 'Ebenezer + Vibe Check',                   built: true  },
    { key: 'phishnet',       label: 'PHISH.NET API',    desc: 'Setlist + review data',                   built: true  },
    { key: 'etsy_oauth',     label: 'ETSY OAUTH',       desc: 'Pending Etsy app review',                 built: true, url: 'https://www.etsy.com/your/shops/me/dashboard' },
    { key: 'sentry_server',  label: 'SENTRY (SERVER)',  desc: 'Add SENTRY_DSN to Vercel env vars',       built: true, url: 'https://mpgink.sentry.io/issues/' },
  ];

  const StatusDot = ({ on, built }) => {
    const color = !built ? D.muted : on ? D.green : D.orange;
    const label = !built ? 'NOT BUILT' : on ? 'ACTIVE' : 'INACTIVE';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: on && built ? `0 0 6px ${color}` : 'none', flexShrink: 0 }} />
        <span style={{ fontFamily: D.disp, fontSize: '0.42rem', letterSpacing: '2px', color }}>{label}</span>
      </div>
    );
  };

  const fmtCost = v => v != null ? `$${parseFloat(v).toFixed(4)}` : '—';
  const fmtNum  = v => v != null ? Number(v).toLocaleString() : '—';

  const Row = ({ label, val, sub, color = D.label }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontFamily: D.disp, fontSize: '0.44rem', color: D.muted, letterSpacing: '2px' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontFamily: D.mono, fontSize: '0.82rem', color }}>{val}</span>
        {sub && <div style={{ fontFamily: D.mono, fontSize: '0.6rem', color: D.muted }}>{sub}</div>}
      </div>
    </div>
  );

  const Panel = ({ title, color = D.cyan, children }) => (
    <div style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${color}22`, borderTop: `2px solid ${color}55`, padding: '14px 16px', marginBottom: 14 }}>
      <div style={{ fontFamily: D.disp, fontSize: '0.52rem', color, letterSpacing: '3px', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ padding: '0 10px 24px' }}>

      {/* Activation Status */}
      <Panel title="◈ ACTIVATION STATUS" color={D.cyan}>
        {SERVICE_DEFS.map(s => (
          <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div>
              <div style={{ fontFamily: D.disp, fontSize: '0.5rem', color: D.label, letterSpacing: '1.5px' }}>{s.label}</div>
              {!activation[s.key] && <div style={{ fontFamily: D.mono, fontSize: '0.6rem', color: D.muted, marginTop: 2 }}>{s.desc}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {activation[s.key] && s.url && (
                <a href={s.url} target='_blank' rel='noopener noreferrer' style={{ fontFamily: D.disp, fontSize: '0.4rem', letterSpacing: '1.5px', color: D.cyan, textDecoration: 'none', opacity: 0.7 }}>OPEN →</a>
              )}
              <StatusDot on={activation[s.key]} built={s.built} />
            </div>
          </div>
        ))}
      </Panel>

      {/* User Growth */}
      <Panel title="◈ USER GROWTH" color={D.cyan}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
          {[
            { val: fmtNum(users?.total),    label: 'TOTAL' },
            { val: fmtNum(users?.verified), label: 'VERIFIED' },
            { val: fmtNum(users?.last_7d),  label: 'LAST 7D' },
            { val: fmtNum(users?.last_24h), label: 'TODAY' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '10px 4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(0,224,208,0.1)' }}>
              <div style={{ fontFamily: D.disp, fontSize: '1.2rem', color: D.cyan, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontFamily: D.disp, fontSize: '0.38rem', color: D.muted, letterSpacing: '1px', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Rating Activity */}
      <Panel title="◈ RATING ACTIVITY" color={D.green}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { val: fmtNum(ratings?.total),    label: 'TOTAL RATED' },
            { val: fmtNum(ratings?.last_7d),  label: 'LAST 7D' },
            { val: fmtNum(ratings?.last_24h), label: 'TODAY' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '10px 4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(51,255,51,0.1)' }}>
              <div style={{ fontFamily: D.disp, fontSize: '1.2rem', color: D.green, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontFamily: D.disp, fontSize: '0.38rem', color: D.muted, letterSpacing: '1px', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* AI Usage */}
      <Panel title="◈ AI USAGE" color={D.orange}>
        <Row label="CALLS · 7 DAYS"  val={fmtNum(ai?.seven_day?.calls)} sub={fmtCost(ai?.seven_day?.cost)} color={D.orange} />
        <Row label="CALLS · 30 DAYS" val={fmtNum(ai?.thirty_day?.calls)} sub={fmtCost(ai?.thirty_day?.cost)} color={D.orange} />
        {(ai?.today || []).length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontFamily: D.disp, fontSize: '0.42rem', color: D.muted, letterSpacing: '2px', marginBottom: 6 }}>TODAY BY FEATURE</div>
            {ai.today.map(r => (
              <Row key={r.feature} label={r.feature.toUpperCase()} val={`${fmtNum(r.calls)} calls`} sub={fmtCost(r.cost)} />
            ))}
          </div>
        )}
      </Panel>

      {/* Email Activity */}
      <Panel title="◈ EMAIL ACTIVITY" color={D.cyan}>
        {email?.by_type?.length > 0 ? (
          email.by_type.map(r => (
            <Row key={r.email_type}
              label={r.email_type.toUpperCase().replace(/_/g,' ')}
              val={`${fmtNum(r.count)} sent`}
              sub={r.last_sent ? new Date(r.last_sent).toLocaleDateString() : null}
            />
          ))
        ) : (
          <div style={{ fontFamily: D.mono, fontSize: '0.7rem', color: D.muted }}>No emails sent yet</div>
        )}
      </Panel>

      {/* Feedback + Donations */}
      <Panel title="◈ FEEDBACK + DONATIONS" color={D.green}>
        <Row label="FEEDBACK TOTAL"   val={fmtNum(feedback?.total)} />
        <Row label="FEEDBACK UNREAD"  val={fmtNum(feedback?.unread)}  color={feedback?.unread > 0 ? D.orange : D.label} />
        <Row label="FEEDBACK · 7D"    val={fmtNum(feedback?.last_7d)} />
        <Row label="ITEMS SOLD"       val={fmtNum(donations?.items_sold)} />
        <Row label="DONATED"          val={donations?.donation_total != null ? `$${parseFloat(donations.donation_total).toFixed(2)}` : '—'} color={D.green} />
      </Panel>

    </div>
  );
}

const TABS = [
  { id: 'users',     label: 'USERS',     color: 'var(--cyan)' },
  { id: 'system',    label: 'SYSTEM',    color: 'var(--cyan)' },
  { id: 'api',       label: 'API',       color: 'var(--green)' },
  { id: 'external',  label: 'EXTERNAL',  color: 'var(--orange)' },
  { id: 'ai-usage',  label: 'AI USAGE',  color: 'var(--orange)' },
  { id: 'errors',    label: 'ERRORS',    color: 'var(--red, #ff3333)' },
  { id: 'feedback',   label: 'FEEDBACK',   color: 'var(--orange)' },
  { id: 'donations',  label: 'DONATIONS',  color: 'var(--green)'  },
  { id: 'monitoring', label: 'MONITORING', color: 'var(--cyan)'  },
];

export function AdminTab({ api, showMessage, showError }) {
  const [activeTab, setActiveTab] = useState('users');
  const tab = TABS.find(t => t.id === activeTab);

  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 10px 0',
        borderBottom: `2px solid ${tab.color}44`, marginBottom: 14,
        scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
      }}>
        {TABS.map(t => (
          <TabBtn key={t.id} active={activeTab === t.id} color={t.color} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </TabBtn>
        ))}
      </div>

      {activeTab === 'users'    && <UsersTab           api={api} showError={showError} />}
      {activeTab === 'system'   && <SystemTab          api={api} showMessage={showMessage} />}
      {activeTab === 'api'      && <ApiHealthTab />}
      {activeTab === 'external' && <ExternalApiHealthTab />}
      {activeTab === 'ai-usage' && <AiUsageTab          api={api} />}
      {activeTab === 'errors'   && <ErrorLogTab />}
      {activeTab === 'feedback'  && <FeedbackTab          api={api} />}
      {activeTab === 'donations'  && <DonationsTab  api={api} showMessage={showMessage} showError={showError} />}
      {activeTab === 'monitoring' && <MonitoringTab api={api} />}
    </div>
  );
}




