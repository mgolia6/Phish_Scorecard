import { useCallback } from 'react';
import { API } from './utils';

export function useApi() {
  const getToken = () => localStorage.getItem('phish_token');
  const request = useCallback(async (method, path, body = null) => {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(`${res.status}: ${data.error || 'Request failed'}`);
    return data;
  }, []);
  return { get: p => request('GET', p), post: (p, b) => request('POST', p, b), delete: (p, b) => request('DELETE', p, b) };
}
