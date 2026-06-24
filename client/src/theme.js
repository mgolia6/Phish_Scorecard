// Theme (dark / light) — Phase 1.
// Dark is the default identity; light is opt-in. Applied to <html data-theme>.
// Persistence is localStorage for now; cross-device server sync is a later phase.

const KEY = 'phreezer_theme';

export function getTheme() {
  try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; }
  catch { return 'dark'; }
}

export function applyTheme(theme) {
  const t = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
}

export function setTheme(theme) {
  const t = theme === 'light' ? 'light' : 'dark';
  try { localStorage.setItem(KEY, t); } catch {}
  applyTheme(t);
  return t;
}

export function toggleTheme() {
  return setTheme(getTheme() === 'light' ? 'dark' : 'light');
}
