// GET /api/audio/stream?url=ENCODED_MP3_URL
// Proxies Phish.in MP3 files server-side to avoid CORS restrictions.
// Supports Range requests for seeking.

import { cors } from '../_auth.js';
import { captureException } from '../_sentry.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url required' });

  // Only allow phish.in audio URLs (including CDN subdomains and partner CDNs)
  let decoded;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  let parsed;
  try {
    parsed = new URL(decoded);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const { hostname, protocol } = parsed;
  const allowed =
    protocol === 'https:' &&
    (
      hostname === 'phish.in' ||
      hostname.endsWith('.phish.in') ||
      hostname.includes('phish')
    );

  if (!allowed) {
    console.error(`Audio proxy: rejected URL hostname=${hostname}`);
    captureException(err, { path: 'api/audio/stream.js' });
    return res.status(403).json({ error: 'Only phish.in audio URLs allowed' });
  }

  try {
    const headers = { 'User-Agent': 'Phreezer/1.0 (phreezer.mpgink.com)' };

    // Forward Range header for seeking
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const upstream = await fetch(decoded, { headers });

    if (!upstream.ok && upstream.status !== 206) {
      console.error(`Audio proxy: upstream returned ${upstream.status} for ${decoded}`);
      captureException(err, { path: 'api/audio/stream.js' });
      return res.status(upstream.status).end();
    }

    // Forward relevant headers
    const contentType   = upstream.headers.get('content-type')   || 'audio/mpeg';
    const contentLength = upstream.headers.get('content-length');
    const contentRange  = upstream.headers.get('content-range');
    const acceptRanges  = upstream.headers.get('accept-ranges')  || 'bytes';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', acceptRanges);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange)  res.setHeader('Content-Range', contentRange);

    res.status(upstream.status);

    // Stream body using Web Streams API (no require() — ES module compatible)
    const reader = upstream.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } finally {
      reader.releaseLock();
    }
    res.end();

  } catch (err) {
    console.error('Audio proxy error:', err);
    captureException(err, { path: 'api/audio/stream.js' });
    if (!res.headersSent) {
      res.status(502).json({ error: 'Upstream error' });
    } else {
      res.end();
    }
  }
}

export const config = {
  api: {
    responseLimit: false, // Required for streaming large audio files
  },
};
