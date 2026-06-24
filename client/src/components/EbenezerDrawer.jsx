import React, { useRef, useEffect, useState, useCallback } from 'react';

const MAX_HISTORY = 10;

const suggestions = [
  "What should I rate next?",
  "Find me a nasty second set",
  "Best shows from 1997 I should know",
  "What's a good show to relisten tonight?",
];

// ── Shared chat UI (used by both mobile drawer and desktop rail) ──────────────

function exportConversation(history) {
  const lines = history.map(m =>
    m.role === 'user' ? 'YOU: ' + m.content : 'UNCLE EBENEZER:\n' + m.content
  ).join('\n\n---\n\n');
  const blob = new Blob(['PHREEZER -- UNCLE EBENEZER CONVERSATION\n' + '='.repeat(40) + '\n\n' + lines], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'ebenezer-' + new Date().toISOString().slice(0,10) + '.txt';
  a.click(); URL.revokeObjectURL(url);
}

export function EbenezerChat({ history, setHistory, loading, setLoading, error, setError, input, setInput, inputRef, compact, optOut, onToggleOptOut }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    setError(null);
    const newHistory = [...history, { role: 'user', content: msg, ts: Date.now() }];
    setHistory(newHistory);
    setLoading(true);
    try {
      const contextHistory = newHistory.slice(-MAX_HISTORY).map(({ role, content }) => ({ role, content }));
      const res = await fetch('/api/ai/ebenezer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('phish_token')}` },
        body: JSON.stringify({ message: msg, history: contextHistory.slice(0, -1) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setHistory(h => [...h, { role: 'assistant', content: data.reply, ts: Date.now() }]);
    } catch (e) {
      setError(e.message);
      setHistory(h => h.slice(0, -1));
      setInput(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const fontSize = compact ? '0.78rem' : '0.82rem';

  return (
    <>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {history.length === 0 && (
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize, color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 16, fontStyle: 'italic' }}>
              "Ask me about a show. Tell me what you're in the mood for. I'll find something worth your time."
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 10 }}>TRY ASKING</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  style={{ textAlign: 'left', padding: '8px 12px', background: 'rgba(0,224,208,0.04)', border: '1px solid rgba(0,224,208,0.2)', color: 'rgba(0,224,208,0.7)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', cursor: 'pointer', lineHeight: 1.4 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {history.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'user' ? (
              <div style={{ maxWidth: '82%', background: 'rgba(51,255,51,0.07)', border: '1px solid rgba(51,255,51,0.2)', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize, color: 'var(--green)', lineHeight: 1.55 }}>
                {msg.content}
              </div>
            ) : (
              <div style={{ maxWidth: '95%' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--orange)', letterSpacing: '2px', marginBottom: 5 }}>UNCLE EBENEZER</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize, color: 'var(--white)', lineHeight: 1.7, borderLeft: '2px solid rgba(255,102,0,0.4)', paddingLeft: 10, whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--orange)', letterSpacing: '2px', marginBottom: 5 }}>UNCLE EBENEZER</div>
            <div style={{ borderLeft: '2px solid rgba(255,102,0,0.4)', paddingLeft: 10 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'rgba(255,102,0,0.5)', letterSpacing: '2px', animation: 'pulse 1.5s infinite' }}>THINKING...</span>
            </div>
          </div>
        )}
        {error && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,50,50,0.7)', padding: '8px 12px', border: '1px solid rgba(255,50,50,0.2)' }}>
            Error: {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(255,102,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'rgba(255,102,0,0.04)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
          Conversations logged anonymously.{' '}
          <button onClick={onToggleOptOut} style={{ background: 'none', border: 'none', padding: 0, color: optOut ? 'var(--green)' : 'var(--orange)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', cursor: 'pointer', textDecoration: 'underline', fontWeight: optOut ? 700 : 400 }}>
            {optOut ? '✓ Opted out' : 'Opt out'}
          </button>
        </div>
        {history.length > 0 && (
          <button onClick={() => exportConversation(history)} style={{ background: 'rgba(255,102,0,0.15)', border: '1px solid rgba(255,102,0,0.6)', padding: '5px 12px', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '1.5px', cursor: 'pointer', marginLeft: 10, fontWeight: 700 }}>↓ EXPORT</button>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px 16px', borderTop: '1px solid rgba(255,102,0,0.15)', display: 'flex', gap: 8, flexShrink: 0, background: 'var(--bg)' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask Ebenezer..."
          rows={1}
          style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid rgba(255,102,0,0.3)', color: 'var(--white)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', padding: '10px 12px', resize: 'none', outline: 'none', lineHeight: 1.5 }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            width: 52, height: 52, borderRadius: '50%',
            background: loading || !input.trim() ? 'rgba(255,102,0,0.15)' : 'rgba(255,102,0,0.92)',
            border: '2px solid var(--orange)',
            color: loading || !input.trim() ? 'rgba(255,102,0,0.3)' : '#000',
            cursor: loading || !input.trim() ? 'default' : 'pointer',
            flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
            boxShadow: loading || !input.trim() ? 'none' : '0 0 16px rgba(255,102,0,0.5)',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>❄</span>
          <span style={{ fontSize: '0.56rem', letterSpacing: '1.5px', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            {loading ? '...' : 'SEND'}
          </span>
        </button>
      </div>
    </>
  );
}

// ── MOBILE: bottom drawer ─────────────────────────────────────────────────────
export function EbenezerDrawer({ history, setHistory, loading, setLoading, error, setError, input, setInput, open, setOpen }) {
  const inputRef = useRef(null);
  const [optOut, setOptOut] = useState(() => { try { return localStorage.getItem('ebenezer_opt_out') === 'true'; } catch { return false; } });

  // Sync opt-out from profile on first open -- ensures cross-device consistency
  const optOutSynced = useRef(false);
  useEffect(() => {
    if (open && !optOutSynced.current) {
      optOutSynced.current = true;
      fetch('/api/user/profile', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('phish_token') } })
        .then(r => r.json())
        .then(d => {
          const serverVal = d.ebenezer_opt_out === true;
          setOptOut(serverVal);
          try { localStorage.setItem('ebenezer_opt_out', String(serverVal)); } catch {}
        }).catch(() => {});
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const handleToggleOptOut = useCallback(async () => {
    const next = !optOut; setOptOut(next);
    try { localStorage.setItem('ebenezer_opt_out', String(next)); } catch {}
    try { await fetch('/api/user/profile', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('phish_token') }, body: JSON.stringify({ ebenezer_opt_out: next }) }); } catch {}
  }, [optOut]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{ position: 'fixed', bottom: 88, right: 16, height: 52, width: open ? 52 : 'auto', borderRadius: open ? '50%' : 26, paddingLeft: open ? 0 : 16, paddingRight: open ? 0 : 16, display: open ? 'none' : 'flex', background: 'rgba(255,102,0,0.92)', border: `2px solid ${open ? 'rgba(51,255,51,0.3)' : 'var(--orange)'}`, color: '#000', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 0 24px rgba(255,102,0,0.6), 0 2px 8px rgba(0,0,0,0.4)', zIndex: 1000, transition: 'all 0.2s', fontFamily: 'var(--font-display)' }}
        title="Uncle Ebenezer · Jaded Vet"
        className="ebenezer-float-btn"
      >
        <span style={{ fontSize: '1.2rem' }}>❄</span>
        <span style={{ fontSize: '0.56rem', letterSpacing: '2px', fontWeight: 700 }}>ASK EBENEZER</span>
      </button>

      {/* Drawer */}
      <div style={{ position: 'fixed', bottom: 72, left: 0, right: 0, height: open ? 'calc(72vh - 72px)' : 0, background: 'var(--bg-panel)', borderTop: open ? '2px solid rgba(255,102,0,0.4)' : 'none', zIndex: 999, transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '12px 18px 10px', borderBottom: '1px solid rgba(255,102,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'rgba(255,102,0,0.05)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--orange)', letterSpacing: '3px', fontWeight: 700 }}>UNCLE EBENEZER</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>jaded vet · show analyst · discovery engine</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {history.length > 0 && (
              <button onClick={() => setHistory([])} style={{ background: 'transparent', border: '1px solid rgba(51,255,51,0.2)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '1.5px', padding: '4px 10px', cursor: 'pointer' }}>CLEAR</button>
            )}
            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: '1px solid rgba(255,102,0,0.3)', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.9rem', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
        <EbenezerChat history={history} setHistory={setHistory} loading={loading} setLoading={setLoading} error={error} setError={setError} input={input} setInput={setInput} inputRef={inputRef} optOut={optOut} onToggleOptOut={handleToggleOptOut} />
      </div>

      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 'calc(72vh - 72px + 72px)', zIndex: 998, background: 'rgba(0,0,0,0.4)' }} />}
    </>
  );
}

// ── DESKTOP: right rail ───────────────────────────────────────────────────────
export function EbenezerRail({ history, setHistory, loading, setLoading, error, setError, input, setInput, railOpen, setRailOpen }) {
  const inputRef = useRef(null);
  const expandInputRef = useRef(null);
  const [optOut, setOptOut] = useState(() => { try { return localStorage.getItem('ebenezer_opt_out') === 'true'; } catch { return false; } });
  const [expanded, setExpanded] = useState(false);

  // Sync opt-out from profile on first open
  const optOutSynced = useRef(false);
  useEffect(() => {
    if (railOpen && !optOutSynced.current) {
      optOutSynced.current = true;
      fetch('/api/user/profile', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('phish_token') } })
        .then(r => r.json())
        .then(d => {
          const serverVal = d.ebenezer_opt_out === true;
          setOptOut(serverVal);
          try { localStorage.setItem('ebenezer_opt_out', String(serverVal)); } catch {}
        }).catch(() => {});
    }
    if (railOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [railOpen]);

  useEffect(() => {
    if (expanded) setTimeout(() => expandInputRef.current?.focus(), 100);
  }, [expanded]);

  const handleToggleOptOut = useCallback(async () => {
    const next = !optOut; setOptOut(next);
    try { localStorage.setItem('ebenezer_opt_out', String(next)); } catch {}
    try { await fetch('/api/user/profile', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('phish_token') }, body: JSON.stringify({ ebenezer_opt_out: next }) }); } catch {}
  }, [optOut]);

  return (
    <>
      {/* Expanded modal overlay */}
      {expanded && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) setExpanded(false); }}>
          <div style={{ width: 'min(860px, 90vw)', height: 'min(700px, 85vh)', background: 'var(--bg-panel)', border: '2px solid rgba(255,102,0,0.5)', display: 'flex', flexDirection: 'column', boxShadow: '0 0 60px rgba(255,102,0,0.2)' }}>
            {/* Modal header */}
            <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(255,102,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,102,0,0.06)', flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--orange)', letterSpacing: '4px', fontWeight: 900, textShadow: '0 0 20px rgba(255,102,0,0.5)' }}>UNCLE EBENEZER</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'rgba(255,102,0,0.5)', marginTop: 4, letterSpacing: '1px' }}>JADED VET · SHOW ANALYST · DISCOVERY ENGINE</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {history.length > 0 && (
                  <button onClick={() => setHistory([])} style={{ background: 'transparent', border: '1px solid rgba(255,102,0,0.25)', color: 'rgba(255,102,0,0.6)', fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '1.5px', padding: '5px 10px', cursor: 'pointer' }}>CLEAR</button>
                )}
                <button onClick={() => setExpanded(false)} style={{ background: 'transparent', border: '1px solid rgba(255,102,0,0.35)', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.9rem', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
            <EbenezerChat history={history} setHistory={setHistory} loading={loading} setLoading={setLoading} error={error} setError={setError} input={input} setInput={setInput} inputRef={expandInputRef} optOut={optOut} onToggleOptOut={handleToggleOptOut} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', flexShrink: 0 }}>
        {/* Toggle tab */}
        <button
          className="ebenezer-rail-tab"
          onClick={() => setRailOpen(v => !v)}
          title={railOpen ? 'Collapse' : 'Expand'}
        >
          {railOpen ? '▶' : '◀'}
        </button>

        {/* Rail body */}
        {railOpen && (
          <div className="ebenezer-rail">
            {/* Header */}
            <div className="ebenezer-rail-header">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--orange)', letterSpacing: '4px', fontWeight: 900, textShadow: '0 0 20px rgba(255,102,0,0.5)', lineHeight: 1 }}>UNCLE EBENEZER</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'rgba(255,102,0,0.55)', marginTop: 6, letterSpacing: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>JADED VET · SHOW ANALYST · DISCOVERY ENGINE</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button onClick={() => setExpanded(true)} title="Expand to full screen" style={{ background: 'transparent', border: '1px solid rgba(255,102,0,0.25)', color: 'rgba(255,102,0,0.5)', fontFamily: 'var(--font-display)', fontSize: '0.7rem', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>⛶</button>
                {history.length > 0 && (
                  <button onClick={() => setHistory([])} style={{ background: 'transparent', border: '1px solid rgba(255,102,0,0.25)', color: 'rgba(255,102,0,0.6)', fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '1.5px', padding: '5px 10px', cursor: 'pointer', flexShrink: 0 }}>CLEAR</button>
                )}
              </div>
            </div>
            <EbenezerChat history={history} setHistory={setHistory} loading={loading} setLoading={setLoading} error={error} setError={setError} input={input} setInput={setInput} inputRef={inputRef} compact optOut={optOut} onToggleOptOut={handleToggleOptOut} />
          </div>
        )}
      </div>
    </>
  );
}







