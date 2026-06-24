import React from 'react';

const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
    zIndex: 2000, display: 'flex', alignItems: 'flex-start',
    justifyContent: 'center', overflowY: 'auto', padding: '24px 16px',
  },
  modal: {
    background: '#0f0f0f', border: '1px solid rgba(0,224,208,0.15)',
    borderRadius: 2, width: '100%', maxWidth: 680,
    boxShadow: '0 0 40px rgba(0,224,208,0.08)',
    position: 'relative', marginBottom: 24,
  },
  header: {
    borderBottom: '1px solid rgba(0,224,208,0.12)',
    padding: '20px 20px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'var(--font-display)', fontSize: '0.9rem',
    color: 'var(--cyan)', letterSpacing: '4px',
  },
  close: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 10px',
    fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '2px',
    borderRadius: 1,
  },
  body: { padding: '0 0 24px' },
  section: {
    borderLeft: '3px solid var(--cyan)', padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    background: 'rgba(0,224,208,0.02)',
  },
  sectionAlt: {
    borderLeft: '3px solid var(--green)', padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  sectionWarn: {
    borderLeft: '3px solid var(--orange)', padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    background: 'rgba(255,102,0,0.02)',
  },
  label: {
    fontFamily: 'var(--font-display)', fontSize: '0.6rem',
    color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: 10,
  },
  p: {
    fontFamily: 'var(--font-mono)', fontSize: '0.76rem',
    color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, margin: '0 0 10px',
  },
  li: {
    fontFamily: 'var(--font-mono)', fontSize: '0.76rem',
    color: 'rgba(255,255,255,0.65)', lineHeight: 1.8,
    display: 'flex', gap: 8, marginBottom: 6,
  },
  dot: { color: 'var(--cyan)', flexShrink: 0 },
  link: { color: 'var(--cyan)', textDecoration: 'none' },
  updated: {
    fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
    color: 'var(--text-muted)', padding: '12px 20px 0',
    borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 8,
    textAlign: 'center',
  },
};

function Item({ children }) {
  return (
    <div style={S.li}>
      <span style={S.dot}>◈</span>
      <span>{children}</span>
    </div>
  );
}

export function PrivacyModal({ onClose }) {
  return (
    <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S.modal}>

        <div style={S.header}>
          <div style={S.title}>❄ PRIVACY POLICY</div>
          <button style={S.close} onClick={onClose}>✕ CLOSE</button>
        </div>

        <div style={S.body}>

          {/* What we collect */}
          <div style={S.section}>
            <div style={S.label}>◈ WHAT WE COLLECT</div>
            <p style={S.p}>When you create an account, we store:</p>
            <Item>Your email address — used for account verification and occasional product emails</Item>
            <Item>A username you choose — displayed in community features like leaderboards</Item>
            <Item>Your password — hashed with bcrypt, never stored in plaintext, never readable by us</Item>
            <Item>Show attendance and song ratings you enter — this is the core of the app</Item>
            <Item>Your Phish.net handle, if you choose to import your data</Item>
            <Item>Optional profile preferences (home venue, first show, stage side, etc.)</Item>
          </div>

          {/* What we don't collect */}
          <div style={S.sectionAlt}>
            <div style={S.label}>◈ WHAT WE DON'T COLLECT</div>
            <Item>Payment information — Etsy handles all transactions directly</Item>
            <Item>Location data — we don't track where you are</Item>
            <Item>Device fingerprints or persistent ad identifiers</Item>
            <Item>Any data from minors — Phreezer is intended for adults</Item>
          </div>

          {/* How we use it */}
          <div style={S.section}>
            <div style={S.label}>◈ HOW WE USE YOUR DATA</div>
            <Item>To run the app — show ratings, stats, leaderboards, Deep Phreeze</Item>
            <Item>To send transactional emails — verification, milestones, re-engagement nudges</Item>
            <Item>To power Uncle Ebenezer — your show history is sent to the AI as context for your session only, not stored permanently by the AI provider</Item>
            <Item>To improve the product — aggregated, anonymous usage data helps us understand what's working</Item>
          </div>

          {/* Third-party services */}
          <div style={S.sectionAlt}>
            <div style={S.label}>◈ THIRD-PARTY SERVICES</div>
            <p style={S.p}>Phreezer uses the following external services:</p>
            <Item><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Phish.net</strong> — show and setlist data, optional import of your attendance history</Item>
            <Item><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Phish.in</strong> — live recording audio, streamed via a server-side proxy</Item>
            <Item><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Anthropic</strong> — powers Uncle Ebenezer (Claude) and Vibe Check. Session context only, not used for training</Item>
            <Item><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Resend</strong> — transactional email delivery</Item>
            <Item><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Sentry</strong> — anonymous error reporting to help us catch bugs</Item>
            <Item><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Posthog</strong> — anonymous product analytics (feature usage, tab visits). No personal data in events</Item>
            <Item><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Etsy / Printify</strong> — merch fulfillment. Purchases go through Etsy's platform directly</Item>
          </div>

          {/* Data retention */}
          <div style={S.section}>
            <div style={S.label}>◈ DATA RETENTION</div>
            <Item>Your data is retained as long as your account is active</Item>
            <Item>You can delete your account at any time — this removes all your ratings, attendance records, and personal data from our database</Item>
            <Item>Community-aggregated stats (e.g. top songs, top venues) may persist in anonymized form after account deletion</Item>
          </div>

          {/* Your rights */}
          <div style={S.sectionAlt}>
            <div style={S.label}>◈ YOUR RIGHTS</div>
            <Item>You can export your data — email us and we'll send you everything we have</Item>
            <Item>You can delete your account from the profile menu</Item>
            <Item>You can opt out of non-essential emails via the unsubscribe link in any email</Item>
            <Item>Questions or requests: <a href="mailto:phreezer.support@mpgink.com" style={S.link}>phreezer.support@mpgink.com</a></Item>
          </div>

          {/* Plain language */}
          <div style={S.sectionWarn}>
            <div style={S.label}>◈ PLAIN LANGUAGE VERSION</div>
            <p style={{ ...S.p, margin: 0 }}>
              We collect what we need to run the app. We don't sell your data. We don't share it with advertisers.
              This is a Phish fan app built by one person. Your show ratings are yours.
              If you want them gone, say the word.
            </p>
          </div>

          <div style={S.updated}>Last updated: June 2026 · Built by mpgink · <a href="mailto:phreezer.support@mpgink.com" style={S.link}>phreezer.support@mpgink.com</a></div>

        </div>
      </div>
    </div>
  );
}
