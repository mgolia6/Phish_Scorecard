import React, { useState } from 'react';

const PASSIVE_SECTIONS = [
  'Onboarding', 'Scorecard / Rating', 'My Phreezer', 'Deep Phreeze',
  'On This Day', 'Import / phish.net sync', 'Stats & Analytics',
  'Community', 'Account / Profile', 'Bug Report', 'Other'
];

export function FeedbackModal({ type, api, onClose }) {
  const [answers, setAnswers] = useState({});
  const [freeText, setFreeText] = useState('');
  const [section, setSection] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const questions = type === 'post_rating' ? [
    { id: 'q1', text: 'How did rating that show feel?' },
    { id: 'q2', text: 'Is the score you gave it what you actually think of that show, or did the UI push you one way?' },
    { id: 'q3', text: 'What\'s missing from the rating experience that you wish was there?' },
  ] : type === 'week1' ? [
    { id: 'q1', text: 'What\'s the one thing you\'ve actually come back to use more than once?' },
    { id: 'q2', text: 'What did you expect to find that wasn\'t there?' },
    { id: 'q3', text: 'If you told a friend about Phreezer, what would you say it does?' },
  ] : [];

  const isPassive = type === 'passive';
  const title = type === 'post_rating' ? 'HOW DID THAT FEEL?' : type === 'week1' ? 'ONE WEEK IN — REAL TALK' : 'SEND FEEDBACK';

  const canSubmit = isPassive ? (freeText.trim().length > 0 && section) : questions.every(q => answers[q.id]?.trim());

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('phish_token')}` },
        body: JSON.stringify({ trigger_type: type, section: section || null, answers, free_text: freeText || null }),
      });
      setDone(true);
      setTimeout(onClose, 1800);
    } catch (e) {
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const S = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900, padding: '16px' },
    modal: { background: 'var(--bg-elevated)', border: '1px solid rgba(51,255,51,0.2)', padding: '28px 24px', maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' },
    title: { fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '3px', color: 'var(--cyan)', marginBottom: 20 },
    qLabel: { fontFamily: 'var(--font-display)', fontSize: '0.48rem', letterSpacing: '2px', color: 'rgba(51,255,51,0.55)', marginBottom: 8, display: 'block' },
    textarea: { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '10px 12px', resize: 'vertical', minHeight: 72, boxSizing: 'border-box', marginBottom: 18 },
    select: { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '10px 12px', marginBottom: 18, appearance: 'none' },
  };

  if (done) return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>❄</div>
        <div style={S.title}>PHROZEN IN. THANKS.</div>
      </div>
    </div>
  );

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.title}>{title}</div>

        {isPassive && (
          <>
            <label style={S.qLabel}>WHICH SECTION?</label>
            <select style={S.select} value={section} onChange={e => setSection(e.target.value)}>
              <option value="">— SELECT —</option>
              {PASSIVE_SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label style={S.qLabel}>WHAT'S ON YOUR MIND?</label>
            <textarea style={S.textarea} value={freeText} onChange={e => setFreeText(e.target.value)} placeholder="Tell us what's working, broken, or missing..." />
          </>
        )}

        {!isPassive && questions.map((q, idx) => (
          <div key={q.id}>
            <label style={S.qLabel}>{String(idx + 1).padStart(2,'0')} — {q.text}</label>
            <textarea style={S.textarea} value={answers[q.id] || ''} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} placeholder="..." />
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button className="btn-primary" style={{ flex: 1, padding: '12px', opacity: canSubmit ? 1 : 0.4 }} onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? '...' : '◈ SUBMIT'}
          </button>
          <button style={{ padding: '12px 16px', fontSize: '0.55rem' }} onClick={onClose}>SKIP</button>
        </div>
      </div>
    </div>
  );
}

export function PassiveFeedbackButton({ api }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="passive-feedback-btn"
        style={{
          position: 'fixed', bottom: '50%', left: 0, zIndex: 500,
          background: 'var(--bg-elevated)', border: '1px solid rgba(51,255,51,0.2)',
          borderLeft: 'none',
          color: 'rgba(51,255,51,0.45)', fontFamily: 'var(--font-display)',
          fontSize: '0.52rem', letterSpacing: '2px', padding: '8px 10px',
          cursor: 'pointer', borderRadius: '0 4px 4px 0',
          writingMode: 'vertical-rl', transform: 'translateY(50%) rotate(180deg)',
        }}
        title="Send feedback"
      >
        ◈ FEEDBACK
      </button>
      {open && <FeedbackModal type="passive" api={api} onClose={() => setOpen(false)} />}
    </>
  );
}



