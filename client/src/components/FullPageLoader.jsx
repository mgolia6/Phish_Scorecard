import React, { useEffect } from 'react';

export function FullPageLoader({ text, subtext }) {
  return (
    <div className="fullpage-loader">
      <div className="fullpage-loader-inner">
        <img src="/assets/phreezer-snowflake.png" alt="Phreezer" className="fullpage-snowflake" />
        <div className="fullpage-loader-text">{text || 'LOADING...'}</div>
        {subtext && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            marginTop: 8,
            textAlign: 'center',
            maxWidth: 260,
            lineHeight: 1.5,
          }}>{subtext}</div>
        )}
      </div>
    </div>
  );
}

export function MikeError({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="mike-error" onClick={onClose}>
      <div className="mike-error-inner">
        <div className="mike-no">MIKE SAYS NO</div>
        <div className="mike-msg">{message}</div>
        <div className="mike-sub">[ TAP TO DISMISS ]</div>
      </div>
    </div>
  );
}
