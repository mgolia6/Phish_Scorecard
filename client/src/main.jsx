import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import * as Sentry from '@sentry/react';
import { initPosthog } from './analytics';

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
          color: '#ff6600', fontFamily: 'Share Tech Mono, monospace', padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❄</div>
          <div style={{ fontSize: '1rem', letterSpacing: '3px', marginBottom: '0.5rem',
            fontFamily: 'Orbitron, sans-serif', color: '#33ff33' }}>
            EBENEZER IS FROZEN
          </div>
          <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '2rem', maxWidth: '400px' }}>
            Something unexpected happened. The error has been logged.
          </div>
          <button onClick={resetError} style={{
            background: 'transparent', border: '1px solid #ff6600', color: '#ff6600',
            padding: '0.75rem 2rem', cursor: 'pointer', letterSpacing: '2px',
            fontFamily: 'Orbitron, sans-serif', fontSize: '0.7rem'
          }}>
            TRY AGAIN
          </button>
        </div>
      )}
    >
      <AppWithSentry />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
