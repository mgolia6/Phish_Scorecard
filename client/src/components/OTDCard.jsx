import React, { useState, useRef } from 'react';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

export function OTDCard({ otdShow, fullDate, yearsAgo, scoreColor, onRateShow, api }) {
  const [expanded, setExpanded] = useState(false);
  const [reviews, setReviews] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const fetched = useRef(false);

  const handleExpand = async () => {
    const next = !expanded;
    setExpanded(next);
    if (!next || fetched.current) return;
    fetched.current = true;

    // Fetch reviews from our show endpoint
    setLoadingReviews(true);
    try {
      const data = await api.get(`/shows/${otdShow.show_date}`);
      const items = data?.reviews?.items || [];
      setReviews(items);

      if (items.length > 0) {
        // Build AI summary
        setLoadingAI(true);
        const reviewText = items
          .filter(r => r.review && r.review.trim().length > 20)
          .slice(0, 8)
          .map((r, i) => `Review ${i+1} (${r.author}): "${r.review.trim()}"`)
          .join('\n\n');

        const prompt = `You are summarizing Phish fan reviews of a concert. Be concise, vivid, and capture the collective vibe. Use Phish fan language naturally — jams, teases, exploratory, etc. Do not mention that you're summarizing reviews. Just describe the show as if you were there.

Show: ${fullDate} at ${otdShow.venue}${otdShow.city ? `, ${otdShow.city}` : ''}
${yearsAgo} years ago

Fan reviews:
${reviewText}

Write a 2-3 sentence summary of what made this show memorable. Be specific. No fluff.`;

        const res = await fetch(ANTHROPIC_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        const aiData = await res.json();
        const text = aiData?.content?.[0]?.text || null;
        setAiSummary(text);
      }
    } catch (e) {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
      setLoadingAI(false);
    }
  };

  return (
    <div className="otd-card" style={{
      marginBottom: 0,
      background: 'linear-gradient(135deg, rgba(0,224,208,0.07) 0%, rgba(5,18,5,0.98) 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Scanline accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px)', pointerEvents: 'none' }} />

      {/* Header — always visible */}
      <div style={{ padding: '14px 16px' }}>
        {/* Label + years ago */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', color: 'var(--cyan)', letterSpacing: '3px' }}>ON THIS DAY</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'rgba(0,224,208,0.5)', letterSpacing: '2px' }}>{yearsAgo} YRS AGO</span>
        </div>

        {/* Date — hero moment */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 900, color: 'var(--white)', letterSpacing: '2px', lineHeight: 1.1, marginBottom: 6 }}>
          {fullDate}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--cyan)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {otdShow.venue}
        </div>
        {otdShow.city && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 10 }}>
            {otdShow.city}{otdShow.state ? `, ${otdShow.state}` : ''}
          </div>
        )}

        {/* Score + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {otdShow.phreezer_avg ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: scoreColor, textShadow: `0 0 18px ${scoreColor}66`, letterSpacing: 1, lineHeight: 1 }}>{otdShow.phreezer_avg}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.4rem', color: 'var(--text-muted)', letterSpacing: '1.5px' }}>MY SCORE</span>
              </div>
            ) : (
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'rgba(0,224,208,0.4)', letterSpacing: '2px' }}>NOT YET RATED</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a href={`https://phish.in/${otdShow.show_date}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(0,255,255,0.4)', background: 'rgba(0,255,255,0.06)', color: 'var(--cyan)', fontSize: '0.75rem', textDecoration: 'none', paddingLeft: 2, boxShadow: '0 0 10px rgba(0,224,208,0.2)' }}>▶</a>
            <button onClick={() => onRateShow(otdShow.show_date)}
              style={{ height: 36, padding: '0 12px', border: '1px solid rgba(255,140,0,0.5)', background: 'rgba(255,140,0,0.08)', color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: '0.44rem', letterSpacing: '1.5px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 0 10px rgba(255,140,0,0.2)' }}>
              ◈ RATE
            </button>
          </div>
        </div>
      </div>

      {/* Expand toggle */}
      <button onClick={handleExpand} style={{
        width: '100%', padding: '8px 16px', background: 'rgba(0,224,208,0.04)', border: 'none',
        borderTop: '1px solid rgba(0,224,208,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, cursor: 'pointer', color: 'var(--cyan)', fontFamily: 'var(--font-display)', fontSize: '0.42rem', letterSpacing: '2px',
      }}>
        {expanded ? '▲ HIDE VIBE CHECK' : '▼ VIBE CHECK — WHAT DID THE PHANS SAY?'}
      </button>

      {/* Expanded — AI summary + reviews */}
      {expanded && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(0,224,208,0.1)', background: 'rgba(0,0,0,0.3)' }}>
          {loadingReviews ? (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.48rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '12px 0' }}>
              PULLING REVIEWS...
            </div>
          ) : reviews && reviews.length > 0 ? (
            <>
              {/* AI summary */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', color: 'var(--orange)', letterSpacing: '2px' }}>◈ THE VIBE</span>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,140,0,0.3), transparent)' }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.36rem', color: 'rgba(255,140,0,0.4)', letterSpacing: '1px' }}>AI SYNTHESIS</span>
                </div>
                {loadingAI ? (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Synthesizing {reviews.length} reviews...
                  </div>
                ) : aiSummary ? (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--white)', lineHeight: 1.65, borderLeft: '2px solid rgba(255,140,0,0.4)', paddingLeft: 10 }}>
                    {aiSummary}
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Could not generate summary.</div>
                )}
              </div>

              {/* Raw reviews */}
              <div style={{ borderTop: '1px solid rgba(51,255,51,0.08)', paddingTop: 12 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 10 }}>
                  PHISH.NET REVIEWS ({reviews.length})
                </div>
                {reviews.slice(0, 3).map((r, i) => (
                  <div key={i} style={{ marginBottom: i < reviews.length - 1 ? 12 : 0, paddingBottom: i < reviews.length - 1 ? 12 : 0, borderBottom: i < reviews.length - 1 ? '1px solid rgba(51,255,51,0.06)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.42rem', color: 'var(--cyan)', letterSpacing: '1px' }}>{r.author}</span>
                      {r.posted && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{r.posted}</span>}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-label)', lineHeight: 1.6, fontStyle: 'italic' }}>
                      "{r.review}"
                    </div>
                  </div>
                ))}
                {reviews.length > 3 && (
                  <a href={`https://phish.net/setlists/?d=${otdShow.show_date}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', marginTop: 10, fontFamily: 'var(--font-display)', fontSize: '0.42rem', color: 'var(--cyan)', letterSpacing: '2px', textDecoration: 'none', opacity: 0.7 }}>
                    + {reviews.length - 3} MORE ON PHISH.NET →
                  </a>
                )}
              </div>
            </>
          ) : reviews && reviews.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.46rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '10px 0' }}>
              NO REVIEWS YET FOR THIS SHOW
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MY SHOWS TAB
// ============================================================
