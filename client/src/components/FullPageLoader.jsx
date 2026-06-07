import React, { useEffect } from 'react';

export function FullPageLoader({ text }) {
  return (
    <div className="fullpage-loader">
      <div className="fullpage-loader-inner">
        <img src="/assets/phreezer-snowflake.png" alt="Phreezer" className="fullpage-snowflake" />
        <div className="fullpage-loader-text">{text || 'LOADING...'}</div>
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
