import React, { useState, useRef } from 'react';

const SENTIMENT_COLORS = {
  FIRE: 'var(--orange)',
  SOLID: 'var(--cyan)',
  MIXED: 'rgba(var(--green-rgb),0.5)',
  SLEEPER: 'var(--text-muted)',
};

export function OTDCard({ otdShow, fullDate, yearsAgo, scoreColor, onRateShow, api, cardBorder, cardBorderLeft, cardGlow, cardBackground }) {
  const [expanded, setExpanded] = useState(false);
  const [reviews, setReviews] = useState(null);
  const [aiData, setAiData] = useState(null); // { structured } or { summary }
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const fetched = useRef(false);

  const handleExpand = async () => {
    const next = !expanded;
    setExpanded(next);
    if (!next || fetched.current) return;
    fetched.current = true;
    setLoadingReviews(true);
    try {
      const data = await api.get(`/shows/${otdShow.show_date}`);
      const items = data?.reviews?.items || [];
      setReviews(items);

      if (items.length > 0) {
        setLoadingAI(true);
        try {
          // Try cache first
          const cacheRes = await fetch(`/api/ai/summarize?showDate=${otdShow.show_date}`);
          const cacheData = cacheRes.ok ? await cacheRes.json() : null;
          if (cacheData?.structured?.overall) {
            setAiData(cacheData);
          } else {
            // Cache miss — generate
            const res = await fetch('/api/ai/summarize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reviews: items,
                showDate: otdShow.show_date,
                venue: otdShow.venue,
                city: otdShow.city,
                yearsAgo,
              }),
            });
            const result = await res.json();
            if (!res.ok) {
              console.error('Vibe check error:', result);
            }
            setAiData(result);
          }
        } catch (e) {
          console.error('Vibe check fetch error:', e);
          setAiData(null);
        } finally {
          setLoadingAI(false);
        }
      }
    } catch (e) {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const structured = aiData?.structured;
  const fallbackSummary = aiData?.summary;

  return (
    <div style={{
      background: cardBackground || 'linear-gradient(135deg, rgba(var(--cyan-rgb),0.07) 0%, rgba(5,18,5,0.98) 100%)',
      border: cardBorder || '1px solid rgba(var(--cyan-rgb),0.3)',
      borderLeft: cardBorderLeft || '3px solid var(--cyan)',
      boxShadow: cardGlow || 'none',
    }}>
      {/* ── Header ── */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', color: 'var(--cyan)', letterSpacing: '3px' }}>ON THIS DAY</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.66rem', color: 'var(--cyan)', letterSpacing: '2.5px' }}>{yearsAgo} YRS AGO</span>
        </div>

        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 900, color: '#fff', letterSpacing: '2px', lineHeight: 1.1, marginBottom: 6 }}>
          {fullDate}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--cyan)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {otdShow.venue}
        </div>
        {otdShow.city && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--cyan)', marginBottom: 12 }}>
            {otdShow.city}{otdShow.state ? `, ${otdShow.state}` : ''}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {otdShow.phreezer_avg ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: scoreColor, textShadow: `0 0 18px ${scoreColor}66`, letterSpacing: 1, lineHeight: 1 }}>{otdShow.phreezer_avg}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '2px' }}>MY SCORE</span>
              </div>
            ) : (
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'rgba(var(--cyan-rgb),0.7)', letterSpacing: '2px' }}>NOT YET RATED</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`https://phish.in/${otdShow.show_date}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(var(--cyan-bright-rgb),0.4)', background: 'rgba(var(--cyan-bright-rgb),0.06)', color: 'var(--cyan)', fontSize: '0.8rem', textDecoration: 'none', paddingLeft: 2, boxShadow: '0 0 10px rgba(var(--cyan-rgb),0.2)' }}>▶</a>
            <button onClick={() => onRateShow(otdShow.show_date)}
              style={{ height: 40, padding: '0 16px', border: '1px solid rgba(var(--orange-bright-rgb),0.5)', color: 'var(--orange)', background: 'rgba(var(--orange-bright-rgb),0.08)', fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '1.5px', cursor: 'pointer', boxShadow: '0 0 10px rgba(var(--orange-bright-rgb),0.2)' }}>
              ◈ RATE
            </button>
          </div>
        </div>
      </div>

      {/* ── Toggle ── */}
      <button onClick={handleExpand} style={{
        width: '100%', padding: '10px 16px', background: 'rgba(var(--cyan-rgb),0.04)', border: 'none',
        borderTop: '1px solid rgba(var(--cyan-rgb),0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, cursor: 'pointer', color: 'var(--cyan)', fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '2px',
      }}>
        {expanded ? '▲ HIDE VIBE CHECK' : '▼ VIBE CHECK — WHAT DID THE PHANS SAY?'}
      </button>

      {/* ── Expanded ── */}
      {expanded && (
        <div style={{ padding: '16px', borderTop: '1px solid rgba(var(--cyan-rgb),0.1)', background: 'var(--inset)' }}>
          {loadingReviews ? (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '12px 0' }}>
              PULLING REVIEWS...
            </div>
          ) : reviews && reviews.length > 0 ? (
            <>
              {/* ── AI Synthesis ── */}
              <div style={{ marginBottom: 16 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--orange)', letterSpacing: '2px' }}>◈ VIBE CHECK</span>
                    {structured?.sentiment && (
                      <span style={{
                        fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2px',
                        color: SENTIMENT_COLORS[structured.sentiment] || 'var(--text-muted)',
                        border: `1px solid ${SENTIMENT_COLORS[structured.sentiment] || 'var(--border)'}`,
                        padding: '2px 8px',
                      }}>{structured.sentiment}</span>
                    )}
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'rgba(var(--orange-bright-rgb),0.7)', letterSpacing: '1px' }}>
                    AI · {structured?.reviewCount || reviews.length} PHISH.NET REVIEWS
                  </span>
                </div>

                {loadingAI ? (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Synthesizing {reviews.length} reviews...
                  </div>
                ) : structured ? (
                  <div>
                    {/* Overall verdict */}
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--white)', lineHeight: 1.7, marginBottom: 14, borderLeft: '2px solid rgba(var(--orange-bright-rgb),0.5)', paddingLeft: 12 }}>
                      {structured.overall}
                    </div>

                    {/* Themes */}
                    {structured.themes && structured.themes.map((theme, i) => (
                      <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < structured.themes.length - 1 ? '1px solid rgba(var(--green-rgb),0.07)' : 'none' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--cyan)', letterSpacing: '2.5px', marginBottom: 5 }}>
                          {theme.label}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-label)', lineHeight: 1.65 }}>
                          {theme.text}
                        </div>
                      </div>
                    ))}

                    {/* Attribution */}
                    <div style={{ marginTop: 12, fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--text-muted)', letterSpacing: '1.5px', borderTop: '1px solid rgba(var(--green-rgb),0.06)', paddingTop: 10 }}>
                      AI SYNTHESIS OF {structured.reviewCount} PHISH.NET REVIEWS · NOT A SUBSTITUTE FOR READING THEM
                    </div>
                  </div>
                ) : fallbackSummary ? (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--white)', lineHeight: 1.65, borderLeft: '2px solid rgba(var(--orange-bright-rgb),0.4)', paddingLeft: 10 }}>
                    {fallbackSummary}
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {aiData?.detail || aiData?.raw || aiData?.error || 'Could not generate synthesis.'}
                  </div>
                )}
              </div>

              {/* ── Raw reviews ── */}
              <div style={{ borderTop: '1px solid rgba(var(--green-rgb),0.08)', paddingTop: 14 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 12 }}>
                  PHISH.NET REVIEWS ({reviews.length})
                </div>
                {reviews.slice(0, 4).map((r, i) => (
                  <div key={i} style={{ marginBottom: i < Math.min(reviews.length, 4) - 1 ? 14 : 0, paddingBottom: i < Math.min(reviews.length, 4) - 1 ? 14 : 0, borderBottom: i < Math.min(reviews.length, 4) - 1 ? '1px solid rgba(var(--green-rgb),0.06)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--cyan)', letterSpacing: '1px' }}>{r.author}</span>
                      {r.posted && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{r.posted}</span>}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-label)', lineHeight: 1.6, fontStyle: 'italic' }}>
                      "{r.review?.substring(0, 300)}{r.review?.length > 300 ? '...' : ''}"
                    </div>
                  </div>
                ))}
                {reviews.length > 4 && (
                  <a href={`https://phish.net/setlists/?d=${otdShow.show_date}#reviews`} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', marginTop: 12, fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--cyan)', letterSpacing: '2px', textDecoration: 'none', opacity: 0.7 }}>
                    + {reviews.length - 4} MORE ON PHISH.NET →
                  </a>
                )}
              </div>
            </>
          ) : (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '10px 0' }}>
              NO REVIEWS FOR THIS SHOW
            </div>
          )}
        </div>
      )}
    </div>
  );
}




