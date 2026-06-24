import React, { useState, useEffect, useRef } from 'react';
import { API } from '../utils';

// Converts seconds to m:ss
function fmt(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function proxyUrl(mp3Url) {
  return `${API}/audio/stream?url=${encodeURIComponent(mp3Url)}`;
}

// ── MINI PLAYER — expands below the song row ──────────────────
export function InlineAudioPlayer({ track, onClose }) {
  const audioRef  = useRef(null);
  const [playing, setPlaying]     = useState(false);
  const [current, setCurrent]     = useState(0);
  const [duration, setDuration]   = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);

  const src = proxyUrl(track.mp3_url);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onLoaded  = () => { setDuration(a.duration); setLoading(false); };
    const onTime    = () => setCurrent(a.currentTime);
    const onPlay    = () => setPlaying(true);
    const onPause   = () => setPlaying(false);
    const onEnded   = () => { setPlaying(false); setCurrent(0); };
    const onError   = () => { setError(true); setLoading(false); };

    a.addEventListener('loadedmetadata', onLoaded);
    a.addEventListener('timeupdate',     onTime);
    a.addEventListener('play',           onPlay);
    a.addEventListener('pause',          onPause);
    a.addEventListener('ended',          onEnded);
    a.addEventListener('error',          onError);

    a.play().catch(() => {});

    return () => {
      a.removeEventListener('loadedmetadata', onLoaded);
      a.removeEventListener('timeupdate',     onTime);
      a.removeEventListener('play',           onPlay);
      a.removeEventListener('pause',          onPause);
      a.removeEventListener('ended',          onEnded);
      a.removeEventListener('error',          onError);
      a.pause();
    };
  }, [src]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    playing ? a.pause() : a.play().catch(() => {});
  };

  const seek = (e) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = pct * duration;
  };

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.5)',
      borderTop: '1px solid rgba(0,224,208,0.15)',
      padding: '10px 12px',
      animation: 'fadeIn 0.18s ease',
      width: '100%',
      gridColumn: '1 / -1',
      boxSizing: 'border-box',
    }}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {error ? (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '2px', color: 'rgba(255,80,80,0.7)', textAlign: 'center' }}>
          STREAM UNAVAILABLE
        </div>
      ) : (
        <>
          {/* Track label */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '2px', color: 'rgba(0,224,208,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {loading ? 'LOADING...' : `◉ ${track.title?.toUpperCase()}`}
            </div>
            <button onClick={onClose} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 0 0 12px', flexShrink: 0 }}>
              ✕
            </button>
          </div>

          {/* Controls row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Play/pause */}
            <button
              onClick={togglePlay}
              disabled={loading}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: loading ? 'rgba(0,224,208,0.15)' : 'var(--cyan)',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: '#000', fontSize: '0.75rem',
                transition: 'background 0.15s',
              }}
            >
              {loading ? '◌' : playing ? '⏸' : '▶'}
            </button>

            {/* Time */}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'rgba(255,255,255,0.35)', flexShrink: 0, minWidth: 32 }}>
              {fmt(current)}
            </span>

            {/* Scrubber */}
            <div
              onClick={seek}
              style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, cursor: 'pointer', position: 'relative' }}
            >
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${pct}%`, background: 'var(--cyan)', borderRadius: 2,
                transition: 'width 0.1s linear',
              }} />
              <div style={{
                position: 'absolute', top: '50%', left: `${pct}%`,
                transform: 'translate(-50%, -50%)',
                width: 10, height: 10, borderRadius: '50%',
                background: 'var(--cyan)',
                boxShadow: '0 0 6px rgba(0,224,208,0.8)',
              }} />
            </div>

            {/* Duration */}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'rgba(255,255,255,0.25)', flexShrink: 0, minWidth: 32, textAlign: 'right' }}>
              {fmt(duration)}
            </span>
          </div>

          {/* Phish.in attribution */}
          <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.15)', textAlign: 'right' }}>
            via phish.in
          </div>
        </>
      )}
    </div>
  );
}
