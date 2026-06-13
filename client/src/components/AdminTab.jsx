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

// External API health probes — these hit third-party services directly
const EXTERNAL_PROBES = [
  { name: 'PHISH.NET API',  url: 'https://api.phish.net/v5/shows/recent.json?apikey=&limit=1', label: 'Phish.net' },
  { name: 'PHISH.IN API',   url: 'https://phish.in/api/v2/shows?per_page=1', label: 'Phish.in' },
  { name: 'ANTHROPIC API',  url: 'https://api.anthropic.com/v1/models', label: 'Anthropic', expectApiKey: true },
  { name: 'RESEND API',     url: 'https://api.resend.com/emails', label: 'Resend', expectError: true },
];

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

// ── System Stats ───────────────────────────────────────────
function SystemTab({ api, showMessage }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(null);
  const [migrationResult, setMigrationResult] = useState(null);

  const loadStats = () => {
    setLoading(true);
    api.get('/admin/stats')
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStats(); }, []);

  const runMigrations = async () => {
    setWorking('migrate');
    try {
      const token = localStorage.getItem('phish_token');
      const res = await fetch('/api/admin/migrate', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setMigrationResult(data);
      loadStats();
    } catch (err) {
      setMigrationResult({ error: err.message });
    } finally { setWorking(null); }
  };

  const clearCache = async () => {
    setWorking('cache');
    try {
      const token = localStorage.getItem('phish_token');
      await fetch('/api/admin/clear-cache', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      showMessage('Cache cleared');
      loadStats();
    } catch (err) {
      showMessage('Failed: ' + err.message);
    } finally { setWorking(null); }
  };

  if (loading) return <FullPageLoader text="LOADING STATS..." />;

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

      <SectionLabel color={D.orange}>◈ ACTIONS</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={runMigrations} disabled={!!working} style={{
          fontFamily: D.disp, fontSize: '0.66rem', letterSpacing: '2px', padding: '15px',
          border: `1px solid ${D.cyan}`, background: 'transparent', color: D.cyan, cursor: 'pointer',
        }}>{working === 'migrate' ? 'RUNNING...' : '⚙ RUN MIGRATIONS'}</button>
        <button onClick={clearCache} disabled={!!working} style={{
          fontFamily: D.disp, fontSize: '0.5rem', letterSpacing: '2px', padding: '13px',
          border: `1px solid ${D.orange}`, background: 'transparent', color: D.orange, cursor: 'pointer',
        }}>{working === 'cache' ? 'CLEARING...' : '✕ CLEAR SHOW CACHE'}</button>
      </div>
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

      <div style={{ fontFamily: D.disp, fontSize: '0.62rem', color: D.muted, letterSpacing: '2px', marginBottom: 12 }}>
        {users.length} REGISTERED USER{users.length !== 1 ? 'S' : ''}
      </div>

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
    const fresh = EXTERNAL_PROBES.map(p => ({ ...p, status: 'pending', ms: null, statusCode: null }));
    setResults(fresh);
    const updated = [...fresh];

    await Promise.all(EXTERNAL_PROBES.map(async (probe, i) => {
      const t0 = Date.now();
      try {
        const res = await fetch(probe.url, {
          method: 'GET',
          signal: AbortSignal.timeout(8000),
        });
        const ms = Date.now() - t0;
        // 401/403 means the service is up but rejected us — that's fine, means it's alive
        const ok = res.status < 500;
        updated[i] = { ...probe, status: ok ? (ms > 3000 ? 'slow' : 'ok') : 'error', ms, statusCode: res.status };
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
const TABS = [
  { id: 'users',     label: 'USERS',     color: 'var(--cyan)' },
  { id: 'system',    label: 'SYSTEM',    color: 'var(--cyan)' },
  { id: 'api',       label: 'API',       color: 'var(--green)' },
  { id: 'external',  label: 'EXTERNAL',  color: 'var(--orange)' },
  { id: 'ai-usage',  label: 'AI USAGE',  color: 'var(--orange)' },
  { id: 'errors',    label: 'ERRORS',    color: 'var(--red, #ff3333)' },
  { id: 'feedback',   label: 'FEEDBACK',   color: 'var(--orange)' },
  { id: 'donations',  label: 'DONATIONS',  color: 'var(--green)'  },
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
      {activeTab === 'donations' && <DonationsTab         api={api} showMessage={showMessage} showError={showError} />}
    </div>
  );
}




