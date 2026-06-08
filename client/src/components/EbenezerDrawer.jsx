import React, { useState, useRef, useEffect } from 'react';

const MAX_HISTORY = 10; // turns to keep in memory

export function EbenezerDrawer({ api }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]); // { role, content, ts }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, open]);

  // Focus input when drawer opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    setInput('');
    setError(null);

    const newHistory = [...history, { role: 'user', content: msg, ts: Date.now() }];
    setHistory(newHistory);
    setLoading(true);

    try {
      // Send last MAX_HISTORY turns (fading memory)
      const contextHistory = newHistory
        .slice(-MAX_HISTORY)
        .map(({ role, content }) => ({ role, content }));

      const res = await fetch('/api/ai/ebenezer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('phish_token')}`,
        },
        body: JSON.stringify({
          message: msg,
          history: contextHistory.slice(0, -1), // exclude the current message
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setHistory(h => [...h, { role: 'assistant', content: data.reply, ts: Date.now() }]);
    } catch (e) {
      setError(e.message);
      setHistory(h => h.slice(0, -1)); // remove the user message on error
      setInput(msg); // restore input
    } finally {
      setLoading(false);
    }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const suggestions = [
    "What should I rate next?",
    "Find me a nasty second set",
    "Best shows from 1997 I should know",
    "What's a good show to relisten tonight?",
  ];

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 16,
          height: 52,
          width: open ? 52 : 'auto',
          borderRadius: open ? '50%' : 26,
          paddingLeft: open ? 0 : 16,
          paddingRight: open ? 0 : 16,
           display: open ? 'none' : 'flex',
           background: 'rgba(255,102,0,0.92)',
          border: `2px solid ${open ? 'rgba(51,255,51,0.3)' : 'var(--orange)'}`,
          color: open ? 'rgba(51,255,51,0.6)' : '#000',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          cursor: 'pointer',
          boxShadow: open ? 'none' : '0 0 24px rgba(255,102,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
          zIndex: 1000,
          transition: 'all 0.2s',
          fontFamily: 'var(--font-display)',
        }}
        title="Uncle Ebenezer · Jaded Vet"
      >
        <><span style={{ fontSize: '1.2rem' }}>❄</span><span style={{ fontSize: '0.48rem', letterSpacing: '2px', fontWeight: 700 }}>ASK</span></>
      </button>


      {/* ── Drawer ── */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: open ? '72vh' : 0,
        background: 'var(--bg-panel)',
        borderTop: open ? '2px solid rgba(255,102,0,0.4)' : 'none',
        zIndex: 999,
        transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 18px 10px',
          borderBottom: '1px solid rgba(255,102,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'rgba(255,102,0,0.05)',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--orange)', letterSpacing: '3px', fontWeight: 700 }}>
              UNCLE EBENEZER
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
              jaded vet · show analyst · discovery engine
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                style={{ background: 'transparent', border: '1px solid rgba(51,255,51,0.2)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.38rem', letterSpacing: '1.5px', padding: '4px 10px', cursor: 'pointer' }}
              >
                CLEAR
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'transparent', border: '1px solid rgba(255,102,0,0.3)', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.9rem', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >✕</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {history.length === 0 && (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 16, fontStyle: 'italic' }}>
                "Ask me about a show. Tell me what you're in the mood for. I'll find something worth your time."
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 10 }}>TRY ASKING</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                    style={{ textAlign: 'left', padding: '8px 12px', background: 'transparent', border: '1px solid rgba(51,255,51,0.15)', color: 'rgba(51,255,51,0.5)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', cursor: 'pointer', lineHeight: 1.4 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              {msg.role === 'user' ? (
                <div style={{
                  maxWidth: '82%',
                  background: 'rgba(51,255,51,0.07)',
                  border: '1px solid rgba(51,255,51,0.2)',
                  padding: '8px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  color: 'var(--green)',
                  lineHeight: 1.55,
                }}>
                  {msg.content}
                </div>
              ) : (
                <div style={{ maxWidth: '92%' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.38rem', color: 'var(--orange)', letterSpacing: '2px', marginBottom: 5 }}>UNCLE EBENEZER</div>

                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    color: 'var(--white)',
                    lineHeight: 1.7,
                    borderLeft: '2px solid rgba(255,102,0,0.4)',
                    paddingLeft: 10,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.38rem', color: 'var(--orange)', letterSpacing: '2px', marginBottom: 5 }}>UNCLE EBENEZER</div>

              <div style={{ borderLeft: '2px solid rgba(255,102,0,0.4)', paddingLeft: 10 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'rgba(255,102,0,0.5)', letterSpacing: '2px', animation: 'pulse 1.5s infinite' }}>THINKING...</span>
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

        {/* Input */}
        <div style={{
          padding: '10px 14px 16px',
          borderTop: '1px solid rgba(255,102,0,0.15)',
          display: 'flex',
          gap: 8,
          flexShrink: 0,
          background: 'var(--bg)',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Ebenezer..."
            rows={1}
            style={{
              flex: 1,
              background: 'var(--bg-elevated)',
              border: '1px solid rgba(255,102,0,0.3)',
              color: 'var(--white)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              padding: '10px 12px',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              padding: '0 16px',
              background: loading || !input.trim() ? 'rgba(255,102,0,0.1)' : 'var(--orange)',
              border: '2px solid var(--orange)',
              color: loading || !input.trim() ? 'rgba(255,102,0,0.3)' : '#000',
              fontFamily: 'var(--font-display)',
              fontSize: '0.48rem',
              letterSpacing: '2px',
              cursor: loading || !input.trim() ? 'default' : 'pointer',
              flexShrink: 0,
              boxShadow: loading || !input.trim() ? 'none' : '0 0 12px rgba(255,102,0,0.2)',
            }}
          >
            SEND
          </button>
        </div>
      </div>

      {/* Backdrop when open */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: '72vh', zIndex: 998, background: 'rgba(0,0,0,0.4)' }}
        />
      )}
    </>
  );
}
