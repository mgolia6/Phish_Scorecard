// Server-side Sentry — no-op when SENTRY_DSN is not set
// Same DSN as client (SENTRY_DSN, no VITE_ prefix — server-side only)

let _initialized = false;
let Sentry = null;

export async function initSentry() {
  if (_initialized) return Sentry;
  _initialized = true;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return null;

  try {
    Sentry = await import('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'production',
      tracesSampleRate: 0.2,
      integrations: [],
    });
  } catch (e) {
    // @sentry/node not available — silent fail
    Sentry = null;
  }

  return Sentry;
}

export async function captureException(err, context = {}) {
  const s = await initSentry();
  if (!s) return;
  s.withScope(scope => {
    Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
    scope.setTag('source', 'server');
    s.captureException(err);
  });
}
