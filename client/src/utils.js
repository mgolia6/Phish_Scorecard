export const API = '/api';
export const PNET = 'https://phish.net';
export const RELISTEN = 'https://relisten.net/phish';
export const TODAY = new Date().toISOString().split('T')[0];

export function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m)-1]} ${parseInt(day)}, ${y}`;
}

export function formatDuration(secs) {
  if (!secs) return null;
  const total = secs > 3600 ? Math.round(secs / 1000) : Math.round(secs);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function filterByQuery(shows, q) {
  if (!q) return shows;
  const isYearOnly = /^\d{4}$/.test(q.trim());
  const isYearMonth = /^\d{4}-\d{2}$/.test(q.trim());
  if (isYearOnly || isYearMonth) {
    return shows.filter(s => s.showdate?.startsWith(q.trim()));
  }
  const query = q.toLowerCase();
  return shows.filter(s =>
    s.showdate?.includes(q) ||
    s.venue?.toLowerCase().includes(query) ||
    s.city?.toLowerCase().includes(query) ||
    s.state?.toLowerCase().includes(query) ||
    s.tour_name?.toLowerCase().includes(query)
  );
}
