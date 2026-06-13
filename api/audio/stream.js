// GET /api/audio/stream?url=ENCODED_MP3_URL
// Proxies Phish.in MP3 files server-side to avoid CORS restrictions.
// Supports Range requests for seeking.

import { cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url required' });

  // Only allow phish.in audio URLs
  let decoded;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  if (!decoded.match(/^https:\/\/phish\.in\//)) {
    return res.status(403).json({ error: 'Only phish.in URLs allowed' });
  }

  try {
    const headers = { 'User-Agent': 'Phreezer/1.0 (phreezer.mpgink.com)' };

    // Forward Range header for seeking
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const upstream = await fetch(decoded, { headers });

    if (!upstream.ok && upstream.status !== 206) {
      return res.status(upstream.status).end();
    }

    // Forward relevant headers
    const contentType    = upstream.headers.get('content-type')    || 'audio/mpeg';
    const contentLength  = upstream.headers.get('content-length');
    const contentRange   = upstream.headers.get('content-range');
    const acceptRanges   = upstream.headers.get('accept-ranges')   || 'bytes';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', acceptRanges);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (contentLength)  res.setHeader('Content-Length', contentLength);
    if (contentRange)   res.setHeader('Content-Range', contentRange);

    res.status(upstream.status);

    // Stream body
    const reader = upstream.body.getReader();
    const stream = new ReadableStream({
      start(controller) {
        function push() {
          reader.read().then(({ done, value }) => {
            if (done) { controller.close(); return; }
            controller.enqueue(value);
            push();
          }).catch(err => controller.error(err));
        }
        push();
      }
    });

    // Pipe to response
    const nodeStream = require('stream').Readable.from(
      (async function* () {
        const r = stream.getReader();
        while (true) {
          const { done, value } = await r.read();
          if (done) break;
          yield value;
        }
      })()
    );
    nodeStream.pipe(res);

  } catch (err) {
    console.error('Audio proxy error:', err);
    res.status(502).json({ error: 'Upstream error' });
  }
}

export const config = {
  api: {
    responseLimit: false, // Required for streaming large audio files
  },
};
