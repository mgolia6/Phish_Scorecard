import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import * as Sentry from '@sentry/react';
import { initPosthog } from './analytics';
import { applyTheme, getTheme } from './theme';

// Apply saved theme before first paint to avoid a flash of the wrong theme.
applyTheme(getTheme());

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

// ── Sentry init ───────────────────────────────────────────────────────────
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 0.2,        // 20% of transactions
    replaysSessionSampleRate: 0.1, // 10% of sessions recorded
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    beforeSend(event) {
      // Strip any auth tokens from error payloads
      if (event.request?.headers?.Authorization) {
        delete event.request.headers.Authorization;
      }
      return event;
    },
  });
}

// ── Posthog init ──────────────────────────────────────────────────────────
initPosthog();

// ── Render ────────────────────────────────────────────────────────────────
const AppWithSentry = SENTRY_DSN ? Sentry.withProfiler(App) : App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', background: '#0a0a0a',
          fontFamily: 'Share Tech Mono, monospace', padding: '2rem', textAlign: 'center',
          cursor: 'pointer',
        }} onClick={resetError}>
          <div style={{ fontSize: '0.62rem', letterSpacing: '4px', color: 'rgba(255,80,80,0.5)', marginBottom: 16, fontFamily: 'Orbitron, sans-serif' }}>
            ⚠ SYSTEM ALERT
          </div>
          <div style={{ fontSize: '2.2rem', letterSpacing: '6px', marginBottom: '0.75rem',
            fontFamily: 'Orbitron, sans-serif', color: '#ff3333',
            textShadow: '0 0 30px rgba(255,51,51,0.6)' }}>
            MIKE SAYS NO
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', marginBottom: 8, letterSpacing: '2px' }}>
            {error?.message || 'Something broke. Mike is not sorry about it.'}
          </div>
          <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.18)', marginBottom: '2.5rem', letterSpacing: '2px' }}>
            The error has been logged. Mike does not care.
          </div>
          <div style={{
            fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,51,51,0.5)',
            fontFamily: 'Orbitron, sans-serif', border: '1px solid rgba(255,51,51,0.2)',
            padding: '8px 20px',
          }}>
            [ TAP ANYWHERE TO TRY AGAIN ]
          </div>
        </div>
      )}
    >
      <AppWithSentry />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
