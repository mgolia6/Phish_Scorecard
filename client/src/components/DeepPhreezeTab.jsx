import React, { useState, useEffect } from 'react';
import { FullPageLoader } from './FullPageLoader';
import { formatDate } from '../utils';

const PHISH_IN = 'https://phish.in';
const PHISH_NET_SONG = 'https://phish.net/song';

function fmtSeconds(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtLiveTime(totalMinutes) {
  if (!totalMinutes) return '—';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const days = Math.floor(h / 24);
  const remH = h % 24;
  if (days > 0) return `${days}d ${remH}h ${m}m`;
  return `${h}h ${m}m`;
}

export function DeepPhreezeTab({ api, showMessage, showError, onOpenScorecard }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [syncResult, setSyncResult] = useState(null);
  const [syncStatus, setSyncStatus] = useState('');
  const [toggle, setToggle] = useState('attended');
  const [expandedSong, setExpandedSong] = useState(null);
  const [longestToggle, setLongestToggle] = useState('songs'); // 'songs' | 'time'
  const [expandedCard, setExpandedCard] = useState(null);
  const toggleCard = (id) => setExpandedCard(prev => prev === id ? null : id);
  const [expandedMostHeard, setExpandedMostHeard] = useState(null);
  const longPressTimer = React.useRef(null);

  const handleSyncPressStart = () => {
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      handleSync(true); // FULL rebuild on long press
    }, 1500);
  };
  const handleSyncPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      handleSync(false); // normal sync on tap
    }
  };

  const load = () => {
    setLoading(true);
    api.get('/user/deep-phreeze')
      .then(setData)
      .catch(() => setData({ needs_sync: true }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSync = async (forceRefresh = false) => {
    setSyncing(true);
    setSyncResult(null);
    try {
      if (forceRefresh) {
        setSyncStatus('Clearing cached show data...');
        await api.post('/admin/clear-cache', {});
      }
      setSyncStatus('Pulling setlists from Phish.net...');
      await new Promise(r => setTimeout(r, 300));
      setSyncStatus('Fetching precise timing from Phish.in...');
      await new Promise(r => setTimeout(r, 300));
      setSyncStatus('Computing your lifetime stats...');
      const res = await api.post('/user/sync', {});
      setSyncStatus('');
      setSyncResult(`✓ ${res.synced} shows updated · precise timing for ${res.stats?.precise_show_count || 0} shows`);
      setData({ needs_sync: false, stats: res.stats, computed_at: new Date().toISOString() });
    } catch (e) {
      setSyncStatus('');
      setSyncResult(`✗ ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };



  const D = {
    bg: 'var(--bg-panel)', border: 'var(--border)',
    cyan: 'var(--cyan)', orange: 'var(--orange)', green: 'var(--green)',
    white: 'var(--white)', label: 'var(--text-label)', muted: 'var(--text-muted)',
    disp: 'var(--font-display)', mono: 'var(--font-mono)',
  };

  const Section = ({ icon, label, color = D.cyan, children }) => (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0 10px' }}>
        <span style={{ fontFamily: D.disp, fontSize: '0.62rem', color, letterSpacing: '3px', flexShrink: 0 }}>{icon} {label}</span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}44, transparent)` }} />
      </div>
      {children}
    </div>
  );

  const Hero = ({ id, value, label, sub, color = D.cyan, unit, factoid }) => {
    const isOpen = expandedCard === id;
    return (
      <div
        onClick={factoid && id ? () => toggleCard(id) : undefined}
        style={{ background: D.bg, border: `1px solid ${color}33`, borderTop: `3px solid ${color}`, flex: 1, minWidth: 0, cursor: factoid ? 'pointer' : 'default' }}
      >
        <div style={{ padding: '16px 14px 12px' }}>
          <div style={{ fontFamily: D.disp, fontSize: '2.8rem', fontWeight: 900, color, textShadow: `0 0 30px ${color}44`, lineHeight: 1, letterSpacing: 1 }}>{value}</div>
          {unit && <div style={{ fontFamily: D.disp, fontSize: '0.52rem', color: D.label, letterSpacing: '2px', marginTop: 4 }}>{unit}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 }}>
            <div>
              <div style={{ fontFamily: D.disp, fontSize: '0.52rem', color: D.label, letterSpacing: '2px' }}>{label}</div>
              {sub && <div style={{ fontFamily: D.mono, fontSize: '0.68rem', color: D.muted, marginTop: 4 }}>{sub}</div>}
            </div>
            {factoid && <div style={{ fontFamily: D.disp, fontSize: '0.44rem', color, opacity: 0.5, letterSpacing: '1px', flexShrink: 0, marginLeft: 6 }}>{isOpen ? '▲' : '▼'}</div>}
          </div>
        </div>
        {isOpen && factoid && (
          <div style={{ borderTop: `1px solid ${color}22`, background: `${color}08`, padding: '10px 14px' }}>
            {factoid.map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0', borderBottom: i < factoid.length - 1 ? `1px solid ${color}11` : 'none' }}>
                <span style={{ fontFamily: D.disp, fontSize: '0.46rem', color: D.label, letterSpacing: '1.5px' }}>{f.label}</span>
                <span style={{ fontFamily: D.mono, fontSize: '0.76rem', color: f.color || D.white }}>{f.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const Tile = ({ id, value, label, sub, color = D.orange, size = '1.7rem', href, onClick, factoid }) => {
    const isOpen = expandedCard === id;
    const hasTap = !!(onClick || href || (factoid && id));
    const handleTap = factoid && id ? () => toggleCard(id) : onClick;
    const inner = (
      <div style={{ background: D.bg, border: `1px solid ${D.border}`, borderTop: `2px solid ${color}`, flex: 1, minWidth: 0, cursor: hasTap ? 'pointer' : 'default' }}>
        <div style={{ padding: '12px 10px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontFamily: D.disp, fontSize: size, fontWeight: 700, color, textShadow: `0 0 12px ${color}44`, lineHeight: 1, marginBottom: 5 }}>{value}</div>
            {factoid && id && <div style={{ fontFamily: D.disp, fontSize: '0.44rem', color, opacity: 0.5, letterSpacing: '1px', flexShrink: 0, marginLeft: 4 }}>{isOpen ? '▲' : '▼'}</div>}
          </div>
          <div style={{ fontFamily: D.disp, fontSize: '0.5rem', color: D.label, letterSpacing: '1.5px' }}>{label}</div>
          {sub && <div style={{ fontFamily: D.mono, fontSize: '0.64rem', color: D.muted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
        </div>
        {isOpen && factoid && (
          <div style={{ borderTop: `1px solid ${color}22`, background: `${color}08`, padding: '8px 10px' }}>
            {factoid.map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '3px 0', borderBottom: i < factoid.length - 1 ? `1px solid ${color}11` : 'none' }}>
                <span style={{ fontFamily: D.disp, fontSize: '0.44rem', color: D.label, letterSpacing: '1.5px' }}>{f.label}</span>
                <span style={{ fontFamily: D.mono, fontSize: '0.72rem', color: f.color || D.white }}>{f.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
    if (onClick && !factoid) return <div onClick={onClick} style={{ flex: 1, minWidth: 0 }}>{inner}</div>;
    if (href && !factoid) return <a href={href} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textDecoration: 'none', minWidth: 0 }}>{inner}</a>;
    if (handleTap) return <div onClick={handleTap} style={{ flex: 1, minWidth: 0 }}>{inner}</div>;
    return <div style={{ flex: 1, minWidth: 0 }}>{inner}</div>;
  };

  const Row = ({ label, value, color = D.white, mono = false, href, onClick }) => {
    const isLink = !!(onClick || href);
    const content_inner = (
      <>
        <span style={{ fontFamily: D.disp, fontSize: '0.52rem', color: D.label, letterSpacing: '1.5px', flexShrink: 0 }}>{label}</span>
        <span style={{ fontFamily: mono ? D.mono : D.disp, fontSize: mono ? '0.8rem' : '0.76rem', color, textAlign: 'right', textDecoration: isLink ? 'underline' : 'none', textDecorationColor: `${color}44` }}>
          {value}{isLink ? ' ▶' : ''}
        </span>
      </>
    );
    if (onClick) return (
      <div onClick={onClick} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderBottom: '1px solid rgba(51,255,51,0.05)', gap: 8, cursor: 'pointer' }}>
        {content_inner}
      </div>
    );
    if (href) return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderBottom: '1px solid rgba(51,255,51,0.05)', gap: 8, textDecoration: 'none' }}>
        {content_inner}
      </a>
    );
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0', borderBottom: '1px solid rgba(51,255,51,0.05)', gap: 8 }}>
        {content_inner}
      </div>
    );
  };

  const RankedList = ({ title, items, renderRow, emptyMsg = 'NOT ENOUGH DATA YET' }) => (
    <div style={{ background: D.bg, border: `1px solid ${D.border}`, marginBottom: 8 }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid rgba(51,255,51,0.08)`, fontFamily: D.disp, fontSize: '0.54rem', letterSpacing: '2px', color: D.cyan }}>{title}</div>
      {items.length ? items.map((item, i) => (
        <div key={i} style={{ padding: '10px 14px', borderBottom: i < items.length - 1 ? `1px solid rgba(51,255,51,0.06)` : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: D.disp, fontSize: '0.58rem', color: i === 0 ? D.orange : D.muted, width: 22, flexShrink: 0, textAlign: 'right' }}>{i + 1}</span>
          {renderRow(item, i)}
        </div>
      )) : (
        <div style={{ padding: '14px', fontFamily: D.disp, fontSize: '0.52rem', color: D.muted, letterSpacing: '2px' }}>{emptyMsg}</div>
      )}
    </div>
  );

  const PlayLink = ({ date, style = {} }) => date ? (
    <a href={`${PHISH_IN}/${date}`} target="_blank" rel="noopener noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, border: '1px solid rgba(0,255,255,0.35)', background: 'rgba(0,255,255,0.05)', color: 'var(--cyan)', fontSize: '0.5rem', textDecoration: 'none', flexShrink: 0, ...style }}>▶</a>
  ) : null;

  const SongLink = ({ song, children, style = {} }) => song ? (
    <a href={`${PHISH_NET_SONG}/${encodeURIComponent(song.toLowerCase().replace(/\s+/g,'-'))}`}
      target="_blank" rel="noopener noreferrer"
      style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px solid rgba(0,224,208,0.2)', ...style }}>
      {children || song}
    </a>
  ) : <span style={style}>{children || song}</span>;

  if (loading) return <FullPageLoader text="LOADING DEEP PHREEZE..." subtext="Pulling your lifetime stats from the vault." />;

  if (!data || data.needs_sync) return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ background: D.bg, border: '1px solid rgba(0,224,208,0.3)', borderTop: '3px solid var(--cyan)', padding: '28px 16px', textAlign: 'center' }}>
        <div style={{ fontFamily: D.disp, fontSize: '1rem', color: D.cyan, letterSpacing: '4px', marginBottom: 12 }}>DEEP PHREEZE</div>
        <div style={{ fontFamily: D.mono, fontSize: '0.82rem', color: D.muted, lineHeight: 1.7, marginBottom: 24 }}>
          Pulls setlist data for every show you've attended.<br/>
          Computes your complete Phish lifetime stats.<br/>
          Takes ~30 seconds.
        </div>
        <button onClick={handleSync} disabled={syncing} style={{ width: '100%', padding: '16px', background: 'rgba(0,224,208,0.08)', border: '1px solid rgba(0,224,208,0.45)', color: D.cyan, fontFamily: D.disp, fontSize: '0.62rem', letterSpacing: '3px', cursor: syncing ? 'wait' : 'pointer' }}>
          {syncing ? '◈ SYNCING...' : '❄ RUN DEEP PHREEZE SYNC'}
        </button>
        {syncResult && <div style={{ fontFamily: D.mono, fontSize: '0.74rem', color: syncResult.startsWith('✓') ? D.green : 'var(--red)', marginTop: 14 }}>{syncResult}</div>}
      </div>
    </div>
  );

  const s = data.stats || {};
  const isAttended = toggle === 'attended';
  const liveTime = fmtLiveTime(s.live_duration_minutes);
  const preciseCount = s.precise_show_count || 0;
  const totalAttended = s.total_attended || 0;
  const timingNote = preciseCount > 0
    ? `Precise for ${preciseCount}/${totalAttended} shows, ~3hr est. for rest`
    : `~3hr avg per show × ${totalAttended} shows`;

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* Toggle + Re-sync */}
      <div style={{ display: 'flex', marginBottom: 6 }}>
        <div style={{ display: 'flex', flex: 1, border: `1px solid ${D.border}` }}>
          {[['attended', `ATTENDED (${s.total_attended || 0})`], ['rated', `RATED (${s.total_rated || 0})`]].map(([k, l]) => (
            <button key={k} onClick={() => setToggle(k)} style={{
              flex: 1, padding: '11px 6px',
              background: toggle === k ? 'rgba(0,224,208,0.07)' : 'transparent',
              border: 'none', borderBottom: `2px solid ${toggle === k ? D.cyan : 'transparent'}`,
              color: toggle === k ? D.cyan : D.muted,
              fontFamily: D.disp, fontSize: '0.56rem', letterSpacing: '2px', cursor: 'pointer',
            }}>{l}</button>
          ))}
        </div>
        <button
          onMouseDown={handleSyncPressStart} onMouseUp={handleSyncPressEnd} onMouseLeave={handleSyncPressEnd}
          onTouchStart={handleSyncPressStart} onTouchEnd={handleSyncPressEnd}
          disabled={syncing}
          style={{
            marginLeft: 8, padding: '0 16px',
            background: syncing ? 'transparent' : 'rgba(51,255,51,0.06)',
            border: `1px solid ${syncing ? D.border : 'rgba(51,255,51,0.3)'}`,
            color: syncing ? D.muted : D.green,
            fontFamily: D.disp, fontSize: '0.52rem', letterSpacing: '2px', cursor: 'pointer', flexShrink: 0,
            boxShadow: syncing ? 'none' : '0 0 8px rgba(51,255,51,0.1)',
          }}>
          {syncing ? '◈ ...' : '↺ SYNC'}
        </button>
      </div>
      {syncing && syncStatus && (
        <div style={{ background: 'rgba(0,224,208,0.06)', border: '1px solid rgba(0,224,208,0.2)', padding: '10px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: D.cyan, boxShadow: `0 0 8px ${D.cyan}`, animation: 'pulse 1s infinite', flexShrink: 0 }} />
          <span style={{ fontFamily: D.mono, fontSize: '0.74rem', color: D.cyan }}>{syncStatus}</span>
        </div>
      )}
      {syncResult && <div style={{ fontFamily: D.mono, fontSize: '0.72rem', color: syncResult.startsWith('✓') ? D.green : 'var(--red)', marginBottom: 8, padding: '8px 0' }}>{syncResult}</div>}

      {isAttended ? (
        <>
          {/* ── YOUR PHISH LIFE ── */}
          <Section icon="◈" label="YOUR PHISH LIFE" color={D.cyan}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <Hero id="shows_attended" value={s.total_attended || '—'} label="SHOWS ATTENDED" color={D.cyan}
                factoid={[
                  { label: 'FIRST SHOW', value: s.first_show ? formatDate(s.first_show) : '—' },
                  { label: 'MOST RECENT', value: s.latest_show ? formatDate(s.latest_show) : '—' },
                  { label: 'BUSIEST YEAR', value: s.busiest_year ? `${s.busiest_year.year} · ${s.busiest_year.count} shows` : '—', color: D.orange },
                  { label: 'AVG / YEAR', value: s.avg_shows_per_year || '—' },
                ]}
              />
              <Hero id="years_active" value={s.years_active || '—'} label="YEARS WITH PHISH"
                sub={s.first_show ? `Since ${formatDate(s.first_show)}` : ''} color={D.orange}
                factoid={[
                  { label: 'YEARS SINCE FIRST SHOW', value: s.first_show ? `${new Date().getFullYear() - parseInt(s.first_show)} yrs` : '—', color: D.orange },
                  { label: 'CONSECUTIVE YEARS', value: s.consecutive_years ? `${s.consecutive_years.count} yrs` : '—' },
                  { label: 'HIATUS YEARS SKIPPED', value: s.first_show && s.years_active ? `${(new Date().getFullYear() - parseInt(s.first_show) + 1) - s.years_active}` : '—', color: D.muted },
                ]}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <Tile id="live_time" value={liveTime} label="LIVE PHISH TIME" size="1.1rem"
                sub={timingNote} color={D.cyan}
                factoid={[
                  { label: 'PRECISE TIMING', value: `${preciseCount} of ${totalAttended} shows` },
                  { label: 'EST. REMAINDER', value: `${totalAttended - preciseCount} × ~3hr` , color: D.muted },
                  { label: 'TOTAL SONGS HEARD', value: (s.total_songs_heard || 0).toLocaleString(), color: D.cyan },
                ]}
              />
              <Tile id="avg_shows_yr" value={s.avg_shows_per_year || '—'} label="AVG SHOWS / YEAR" color={D.orange}
                sub={s.busiest_year ? `Best: ${s.busiest_year.year} (${s.busiest_year.count} shows)` : ''}
                factoid={[
                  { label: 'BUSIEST YEAR', value: s.busiest_year ? `${s.busiest_year.year}` : '—', color: D.orange },
                  { label: 'SHOWS THAT YEAR', value: s.busiest_year ? `${s.busiest_year.count}` : '—' },
                  { label: 'SHOW DENSITY', value: s.show_density ? `${s.show_density}/yr` : '—', color: D.muted },
                ]}
              />
            </div>
            <div style={{ background: D.bg, border: `1px solid ${D.border}`, padding: '12px 14px', marginBottom: 6 }}>
              <Row label="FIRST SHOW ◈"
                value={s.first_show ? formatDate(s.first_show) : '—'}
                color={D.cyan} mono
                onClick={s.first_show ? () => onOpenScorecard && onOpenScorecard(s.first_show) : null} />
              <Row label="MOST RECENT SHOW ◈"
                value={s.latest_show ? formatDate(s.latest_show) : '—'}
                color={D.cyan} mono
                onClick={s.latest_show ? () => onOpenScorecard && onOpenScorecard(s.latest_show) : null} />
              <Row label="DAYS SINCE FIRST SHOW" value={s.days_since_first ? s.days_since_first.toLocaleString() : '—'} color={D.white} />
              <Row label="CONSECUTIVE YEARS"
                value={s.consecutive_years ? `${s.consecutive_years.count} YRS (from ${s.consecutive_years.start})` : '—'}
                color={D.orange} />
              <Row label="SHOW DENSITY" value={s.show_density ? `${s.show_density} shows/yr` : '—'} color={D.muted} />
            </div>
          </Section>

          {/* ── ERA BREAKDOWN ── */}
          {s.eras && (
            <Section icon="◉" label="BY ERA" color={D.orange}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                {[['1.0', 'pre-2000', D.muted], ['2.0', '2002–04', D.cyan], ['3.0', '2009–19', D.orange], ['4.0', '2021+', D.green]].map(([era, dates, col]) => {
                  const eraCount = s.eras[era] || 0;
                  const pct = s.total_attended ? Math.round((eraCount / s.total_attended) * 100) : 0;
                  return (
                    <Tile key={era} id={`era_${era}`} value={eraCount} label={`${era} ERA`} sub={dates} color={col}
                      factoid={eraCount > 0 ? [
                        { label: 'OF YOUR SHOWS', value: `${pct}%`, color: col },
                      ] : null}
                    />
                  );
                })}
              </div>
            </Section>
          )}

          {/* ── SONGS YOU'VE HEARD ── */}
          <Section icon="♪" label="SONGS YOU'VE HEARD" color={D.green}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <Hero id="total_songs" value={(s.total_songs_heard || 0).toLocaleString()} label="TOTAL SONGS HEARD" color={D.green}
                factoid={[
                  { label: 'SET I SONGS', value: (s.total_set1_songs || 0).toLocaleString(), color: D.cyan },
                  { label: 'SET II SONGS', value: (s.total_set2_songs || 0).toLocaleString(), color: D.orange },
                  { label: 'ENCORE SONGS', value: (s.total_encore_songs || 0).toLocaleString(), color: D.green },
                ]}
              />
              <Hero id="unique_songs" value={s.unique_songs_heard || '—'} label="UNIQUE SONGS"
                sub={s.total_songs_heard ? `${Math.round((s.unique_songs_heard / s.total_songs_heard) * 100)}% variety` : ''}
                color={D.cyan}
                factoid={[
                  { label: 'SONGS HEARD ONCE', value: s.rarest_caught ? `${s.rarest_caught.length}+` : '—', color: D.muted },
                  { label: 'FIRST SONG EVER', value: s.first_song_ever || '—', color: D.orange },
                  { label: 'LAST SONG HEARD', value: s.last_song_ever || '—', color: D.cyan },
                ]}
              />
            </div>

            <div style={{ background: D.bg, border: `1px solid ${D.border}`, padding: '12px 14px', marginBottom: 6 }}>
              <Row label="AVG SHOW LENGTH" value={s.avg_show_duration_seconds ? fmtSeconds(s.avg_show_duration_seconds) : s.avg_songs_per_show ? `~${Math.round(s.avg_songs_per_show * 6)} min (est.)` : '—'} color={D.white} />
              <Row label="AVG ENCORE LENGTH" value={s.avg_encore_duration_seconds ? fmtSeconds(s.avg_encore_duration_seconds) : s.avg_set1_length ? `~${Math.round((s.total_encore_songs / Math.max(s.total_attended,1)) * 6)} min (est.)` : '—'} color={D.green} />
              <Row label="AVG SET I LENGTH"
                value={s.avg_set1_duration_seconds
                  ? `${fmtSeconds(s.avg_set1_duration_seconds)} · ${s.avg_set1_length} songs`
                  : s.avg_set1_length ? `${s.avg_set1_length} songs` : '—'}
                color={D.cyan} />
              <Row label="AVG SET II LENGTH"
                value={s.avg_set2_duration_seconds
                  ? `${fmtSeconds(s.avg_set2_duration_seconds)} · ${s.avg_set2_length} songs`
                  : s.avg_set2_length ? `${s.avg_set2_length} songs` : '—'}
                color={D.orange} />
              <Row label="AVG SONGS / SHOW" value={s.avg_songs_per_show || '—'} color={D.muted} />
              {s.first_song_ever && (
                <Row label="FIRST SONG YOU EVER HEARD" value={s.first_song_ever} color={D.orange} mono />
              )}
              {s.last_song_ever && (
                <Row label="LAST SONG YOU HEARD" value={s.last_song_ever} color={D.cyan} mono />
              )}
            </div>
          </Section>

          {/* ── GEOGRAPHY ── */}
          <Section icon="◉" label="GEOGRAPHY" color={D.orange}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <Tile id="unique_venues" value={s.unique_venues || '—'} label="UNIQUE VENUES" color={D.cyan}
                factoid={[
                  { label: 'AVG SHOWS / VENUE', value: s.unique_venues && s.total_attended ? (s.total_attended / s.unique_venues).toFixed(1) : '—', color: D.cyan },
                ]}
              />
              <Tile id="unique_states" value={s.unique_states || '—'} label="STATES / REGIONS" color={D.orange}
                factoid={[
                  { label: 'OF 50 STATES', value: s.unique_states ? `${Math.round((s.unique_states / 50) * 100)}%` : '—', color: D.orange },
                ]}
              />
            </div>
          </Section>

          {/* ── WHEN YOU SEE PHISH ── */}
          {(s.shows_by_dow || s.shows_by_month) && (
            <Section icon="◈" label="WHEN YOU SEE PHISH" color={D.cyan}>
              {s.shows_by_dow && (() => {
                const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                const max = Math.max(...DAYS.map(d => s.shows_by_dow[d] || 0), 1);
                const top = DAYS.reduce((a, b) => (s.shows_by_dow[b] || 0) > (s.shows_by_dow[a] || 0) ? b : a);
                return (
                  <div style={{ background: D.bg, border: `1px solid ${D.border}`, padding: '12px 14px', marginBottom: 6 }}>
                    <div style={{ fontFamily: D.disp, fontSize: '0.5rem', color: D.label, letterSpacing: '2px', marginBottom: 10 }}>SHOWS BY DAY OF WEEK</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60, marginBottom: 8 }}>
                      {DAYS.map(day => {
                        const count = s.shows_by_dow[day] || 0;
                        const h = Math.max(4, (count / max) * 100);
                        const isTop = day === top;
                        return (
                          <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                            <div style={{ fontFamily: D.disp, fontSize: '0.42rem', color: isTop ? D.orange : D.muted }}>{count || ''}</div>
                            <div style={{ width: '100%', height: `${h}%`, background: isTop ? D.orange : D.cyan, opacity: isTop ? 1 : 0.45, borderRadius: '1px 1px 0 0' }} />
                            <div style={{ fontFamily: D.disp, fontSize: '0.42rem', color: isTop ? D.orange : D.muted }}>{day}</div>
                          </div>
                        );
                      })}
                    </div>
                    <Row label="YOUR MOST COMMON SHOW DAY" value={`${top} (${s.shows_by_dow[top]}x)`} color={D.orange} />
                  </div>
                );
              })()}
              {s.shows_by_month && (() => {
                const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const max = Math.max(...MONTHS.map(m => s.shows_by_month[m] || 0), 1);
                const top = MONTHS.reduce((a, b) => (s.shows_by_month[b] || 0) > (s.shows_by_month[a] || 0) ? b : a);
                return (
                  <div style={{ background: D.bg, border: `1px solid ${D.border}`, padding: '12px 14px', marginBottom: 6 }}>
                    <div style={{ fontFamily: D.disp, fontSize: '0.5rem', color: D.label, letterSpacing: '2px', marginBottom: 10 }}>SHOWS BY MONTH</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 60, marginBottom: 8 }}>
                      {MONTHS.map(mon => {
                        const count = s.shows_by_month[mon] || 0;
                        const h = Math.max(2, (count / max) * 100);
                        const isTop = mon === top;
                        return (
                          <div key={mon} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
                            <div style={{ width: '100%', height: `${h}%`, background: isTop ? D.green : D.cyan, opacity: isTop ? 1 : 0.45, borderRadius: '1px 1px 0 0' }} />
                            <div style={{ fontFamily: D.disp, fontSize: '0.36rem', color: isTop ? D.green : D.muted }}>{mon}</div>
                          </div>
                        );
                      })}
                    </div>
                    <Row label="YOUR BUSIEST MONTH" value={`${top} (${s.shows_by_month[top]}x)`} color={D.green} />
                  </div>
                );
              })()}
            </Section>
          )}

          {/* ── LONGEST MOMENTS ── */}
          <Section icon="⏱" label="LONGEST SHOWS" color={D.cyan}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
              <div style={{ display: 'inline-flex', border: `1px solid ${D.border}` }}>
                {[['songs', 'SONGS'], ['time', 'TIME']].map(([k, l]) => (
                  <button key={k} onClick={() => setLongestToggle(k)} style={{
                    padding: '5px 12px', background: longestToggle === k ? 'rgba(0,224,208,0.08)' : 'transparent',
                    border: 'none', borderBottom: `2px solid ${longestToggle === k ? D.cyan : 'transparent'}`,
                    color: longestToggle === k ? D.cyan : D.muted,
                    fontFamily: D.disp, fontSize: '0.48rem', letterSpacing: '1.5px', cursor: 'pointer',
                  }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <Tile
                value={longestToggle === 'songs'
                  ? (s.longest_show?.song_count ? `${s.longest_show.song_count} songs` : '—')
                  : (s.longest_show?.duration_seconds ? fmtSeconds(s.longest_show.duration_seconds) : s.longest_show?.song_count ? `${s.longest_show.song_count} songs` : '—')
                }
                label="LONGEST SHOW"
                sub={s.longest_show ? `${s.longest_show.venue} · ${formatDate(s.longest_show.date)}` : ''}
                color={D.cyan} size="1.2rem"
                onClick={s.longest_show?.date ? () => onOpenScorecard && onOpenScorecard(s.longest_show.date) : null}
              />
              <Tile
                value={longestToggle === 'songs'
                  ? (s.longest_encore?.count ? `${s.longest_encore.count} songs` : '—')
                  : (s.longest_encore?.duration_seconds ? fmtSeconds(s.longest_encore.duration_seconds) : s.longest_encore?.count ? `${s.longest_encore.count} songs` : '—')
                }
                label="LONGEST ENCORE"
                sub={s.longest_encore ? `${s.longest_encore.venue} · ${formatDate(s.longest_encore.date)}` : ''}
                color={D.orange} size="1.2rem"
                onClick={s.longest_encore?.date ? () => onOpenScorecard && onOpenScorecard(s.longest_encore.date) : null}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <Tile
                value={longestToggle === 'songs'
                  ? (s.longest_set1?.count ? `${s.longest_set1.count} songs` : '—')
                  : (s.longest_set1?.duration_seconds ? fmtSeconds(s.longest_set1.duration_seconds) : s.longest_set1?.count ? `${s.longest_set1.count} songs` : '—')
                }
                label="LONGEST SET I"
                sub={s.longest_set1 ? `${s.longest_set1.venue} · ${formatDate(s.longest_set1.date)}` : ''}
                color={D.cyan} size="1.2rem"
                onClick={s.longest_set1?.date ? () => onOpenScorecard && onOpenScorecard(s.longest_set1.date) : null}
              />
              <Tile
                value={longestToggle === 'songs'
                  ? (s.longest_set2?.count ? `${s.longest_set2.count} songs` : '—')
                  : (s.longest_set2?.duration_seconds ? fmtSeconds(s.longest_set2.duration_seconds) : s.longest_set2?.count ? `${s.longest_set2.count} songs` : '—')
                }
                label="LONGEST SET II"
                sub={s.longest_set2 ? `${s.longest_set2.venue} · ${formatDate(s.longest_set2.date)}` : ''}
                color={D.orange} size="1.2rem"
                onClick={s.longest_set2?.date ? () => onOpenScorecard && onOpenScorecard(s.longest_set2.date) : null}
              />
            </div>

          </Section>

          {/* ── STREAKS & GAPS ── */}
          <Section icon="⚡" label="STREAKS & GAPS" color={D.orange}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <Tile id="longest_run" value={`${s.longest_run?.shows || '—'} shows`}
                label="LONGEST CONSECUTIVE RUN"
                sub={s.longest_run?.start ? `Starting ${formatDate(s.longest_run.start)}` : ''}
                color={D.orange} size="1.1rem"
                factoid={[
                  { label: 'RUN ENDED', value: s.longest_run?.end ? formatDate(s.longest_run.end) : '—' },
                  { label: 'SONGS HEARD', value: s.longest_run?.songs_heard ? s.longest_run.songs_heard.toLocaleString() : '—', color: D.orange },
                  { label: 'UNIQUE SONGS', value: s.longest_run?.unique_songs || '—' },
                  ...(s.longest_run?.states?.length ? [{ label: 'STATES', value: s.longest_run.states.join(', '), color: D.muted }] : []),
                ]}
              />
              <Tile id="consec_years" value={s.consecutive_years?.count ? `${s.consecutive_years.count} yrs` : '—'}
                label="CONSECUTIVE YEARS"
                sub={s.consecutive_years?.start ? `${s.consecutive_years.start}–${s.consecutive_years.start + s.consecutive_years.count - 1}` : ''}
                color={D.cyan} size="1.1rem"
                factoid={[
                  { label: 'FROM', value: s.consecutive_years?.start || '—' },
                  { label: 'TO', value: s.consecutive_years?.start && s.consecutive_years?.count ? s.consecutive_years.start + s.consecutive_years.count - 1 : '—' },
                  { label: 'OF YOUR TOTAL', value: s.years_active ? `${Math.round((s.consecutive_years?.count / s.years_active) * 100)}%` : '—', color: D.cyan },
                ]}
              />
            </div>
            <div style={{ background: D.bg, border: `1px solid ${D.border}`, padding: '12px 14px', marginBottom: 6 }}>
              {s.longest_run?.start && (
                <Row label="RUN STARTED" value={formatDate(s.longest_run.start)} color={D.orange} mono
                  onClick={onOpenScorecard ? () => onOpenScorecard(s.longest_run.start) : null} />
              )}
              {s.longest_run?.end && (
                <Row label="RUN ENDED" value={formatDate(s.longest_run.end)} color={D.orange} mono
                  onClick={onOpenScorecard ? () => onOpenScorecard(s.longest_run.end) : null} />
              )}
              {s.longest_run?.songs_heard != null && (
                <Row label="SONGS HEARD DURING RUN" value={(s.longest_run.songs_heard || 0).toLocaleString()} color={D.cyan} />
              )}
              {s.longest_run?.unique_songs != null && (
                <Row label="UNIQUE SONGS" value={s.longest_run.unique_songs || 0} color={D.cyan} />
              )}
              {s.longest_run?.states?.length > 0 && (
                <Row label="STATES COVERED" value={s.longest_run.states.join(', ')} color={D.muted} mono />
              )}
              <div style={{ borderTop: `1px solid rgba(51,255,51,0.06)`, marginTop: 8, paddingTop: 8 }}>
                <Row label="LONGEST GAP"
                  value={s.longest_gap?.days ? `${Math.round(s.longest_gap.days / 30.5)} months (${s.longest_gap.days} days)` : '—'}
                  color={D.muted} />
                {s.longest_gap?.from && (
                  <Row label="GAP FROM"
                    value={formatDate(s.longest_gap.from)}
                    color={D.muted} mono
                    onClick={onOpenScorecard ? () => onOpenScorecard(s.longest_gap.from) : null} />
                )}
                {s.longest_gap?.to && (
                  <Row label="GAP TO"
                    value={formatDate(s.longest_gap.to)}
                    color={D.muted} mono
                    onClick={onOpenScorecard ? () => onOpenScorecard(s.longest_gap.to) : null} />
                )}
              </div>
            </div>
          </Section>

          {/* ── MOST HEARD ── */}
          <Section icon="◉" label="MOST HEARD" color={D.green}>
            <div style={{ background: D.bg, border: `1px solid ${D.border}`, marginBottom: 8 }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid rgba(51,255,51,0.08)`, fontFamily: D.disp, fontSize: '0.54rem', letterSpacing: '2px', color: D.cyan }}>
                SONGS YOU'VE SEEN THE MOST — TAP TO EXPAND
              </div>
              {(s.most_heard_attended || []).slice(0, 10).length ? (s.most_heard_attended || []).slice(0, 10).map((item, i) => {
                const isOpen = expandedMostHeard === item.song;
                return (
                  <div key={item.song}>
                    <div
                      onClick={() => setExpandedMostHeard(isOpen ? null : item.song)}
                      style={{ padding: '10px 14px', borderBottom: `1px solid rgba(51,255,51,0.06)`, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: isOpen ? 'rgba(0,224,208,0.04)' : 'transparent' }}
                    >
                      <span style={{ fontFamily: D.disp, fontSize: '0.58rem', color: i === 0 ? D.orange : D.muted, width: 22, flexShrink: 0, textAlign: 'right' }}>{i + 1}</span>
                      <div style={{ flex: 1, fontFamily: D.mono, fontSize: '0.86rem', color: D.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.song}
                      </div>
                      <div style={{ fontFamily: D.disp, fontSize: '0.9rem', color: i === 0 ? D.orange : D.cyan, letterSpacing: 1, flexShrink: 0 }}>{item.count}x</div>
                      <div style={{ fontFamily: D.disp, fontSize: '0.54rem', color: D.muted, flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</div>
                    </div>
                    {isOpen && (
                      <div style={{ background: 'rgba(0,0,0,0.3)', borderBottom: `1px solid rgba(51,255,51,0.06)` }}>
                        <div style={{ padding: '8px 14px 4px', fontFamily: D.disp, fontSize: '0.48rem', color: D.muted, letterSpacing: '2px' }}>
                          TOP 5 VERSIONS YOU'VE SEEN
                        </div>
                        {(item.versions || []).length > 0 ? item.versions.slice(0, 5).map((v, vi) => (
                          <div key={vi} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderTop: `1px solid rgba(51,255,51,0.04)` }}>
                            <PlayLink date={v.date} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: D.mono, fontSize: '0.8rem', color: D.white }}>{formatDate(v.date)}</div>
                              <div style={{ fontFamily: D.mono, fontSize: '0.66rem', color: D.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.venue}</div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); onOpenScorecard && onOpenScorecard(v.date); }}
                              style={{ padding: '4px 8px', border: `1px solid rgba(0,224,208,0.3)`, background: 'transparent', color: D.cyan, fontFamily: D.disp, fontSize: '0.42rem', letterSpacing: '1px', cursor: 'pointer', flexShrink: 0 }}
                            >GO TO SHOW</button>
                          </div>
                        )) : (
                          <div style={{ padding: '10px 14px', fontFamily: D.mono, fontSize: '0.72rem', color: D.muted }}>
                            Rate individual songs in MY SHOWS to see version history.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }) : (
                <div style={{ padding: '14px', fontFamily: D.disp, fontSize: '0.52rem', color: D.muted, letterSpacing: '2px' }}>NOT ENOUGH DATA YET</div>
              )}
            </div>
          </Section>

          {/* ── ENCORE PATTERNS ── */}
          {s.most_common_encore?.length > 0 && (
            <Section icon="★" label="ENCORE PATTERNS" color={D.orange}>
              <div style={{ background: D.bg, border: `1px solid ${D.border}`, marginBottom: 8 }}>
                <div style={{ padding: '10px 14px', borderBottom: `1px solid rgba(51,255,51,0.08)`, fontFamily: D.disp, fontSize: '0.54rem', letterSpacing: '2px', color: D.cyan }}>YOUR MOST COMMON ENCORE SONGS</div>
                {(s.most_common_encore || []).slice(0, 5).map((item, i) => (
                  <div key={item.song} style={{ padding: '10px 14px', borderBottom: i < 4 ? `1px solid rgba(51,255,51,0.06)` : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: D.disp, fontSize: '0.58rem', color: i === 0 ? D.orange : D.muted, width: 22, flexShrink: 0, textAlign: 'right' }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: D.mono, fontSize: '0.86rem', color: D.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <SongLink song={item.song}>{item.song}</SongLink>
                      </div>
                      {item.last_date && (
                        <div style={{ fontFamily: D.mono, fontSize: '0.64rem', color: D.muted, marginTop: 2 }}>
                          Last: {formatDate(item.last_date)} · {item.last_venue || ''}
                        </div>
                      )}
                    </div>
                    <div style={{ fontFamily: D.disp, fontSize: '0.9rem', color: i === 0 ? D.orange : D.cyan, flexShrink: 0 }}>{item.count}x</div>
                    {item.last_date && <PlayLink date={item.last_date} />}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── RAREST CATCHES ── */}
          <Section icon="⬡" label="RAREST CATCHES" color={D.muted}>
            <div style={{ background: D.bg, border: `1px solid ${D.border}`, marginBottom: 8 }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid rgba(51,255,51,0.08)`, fontFamily: D.disp, fontSize: '0.54rem', letterSpacing: '2px', color: D.cyan }}>SONGS YOU'VE ONLY SEEN ONCE</div>
              {(s.rarest_caught || []).slice(0, 8).map((item, i) => (
                <div key={item.song} style={{ padding: '10px 14px', borderBottom: i < 7 ? `1px solid rgba(51,255,51,0.06)` : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: D.disp, fontSize: '0.58rem', color: D.muted, width: 22, flexShrink: 0, textAlign: 'right' }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: D.mono, fontSize: '0.86rem', color: D.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <SongLink song={item.song}>{item.song}</SongLink>
                    </div>
                    {item.date && (
                      <div style={{ fontFamily: D.mono, fontSize: '0.64rem', color: D.muted, marginTop: 2 }}>
                        {formatDate(item.date)}{item.venue ? ` · ${item.venue}` : ''}
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: D.disp, fontSize: '0.52rem', color: D.muted, letterSpacing: '1px', flexShrink: 0 }}>ONCE</div>
                  {item.date && <PlayLink date={item.date} />}
                </div>
              ))}
            </div>
          </Section>
        </>
      ) : (
        <>
          {/* ── YOUR RATINGS ── */}
          <Section icon="★" label="YOUR RATINGS" color={D.orange}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <Hero value={s.total_rated || '—'} label="SHOWS RATED" color={D.orange} />
              <Hero value={s.perfect_5s || '—'} label="PERFECT 5.0 SONGS" color={D.cyan} />
            </div>
            {(s.set1_personal_avg || s.set2_personal_avg) && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <Tile value={s.set1_personal_avg || '—'} label="YOUR AVG SET I" color={D.cyan}
                  sub="across all rated shows" />
                <Tile value={s.set2_personal_avg || '—'} label="YOUR AVG SET II" color={D.orange}
                  sub="across all rated shows" />
              </div>
            )}
            {s.preferred_set && (
              <div style={{ background: D.bg, border: `1px solid ${D.border}`, padding: '12px 14px', marginBottom: 6 }}>
                <Row label="YOU'RE A" value={`${s.preferred_set} PERSON`}
                  color={s.preferred_set === 'SET II' ? D.orange : D.cyan} />
                <Row label="BEST SHOW" value={s.highest_show?.avg || '—'} color={D.orange} />
                {s.highest_show && (
                  <Row label="" value={`${s.highest_show.venue} · ${formatDate(s.highest_show.date)}`}
                    color={D.muted} mono
                    onClick={onOpenScorecard ? () => onOpenScorecard(s.highest_show.date) : null}
                    href={!onOpenScorecard ? `${PHISH_IN}/${s.highest_show.date}` : null} />
                )}
                <Row label="ROUGHEST SHOW" value={s.lowest_show?.avg || '—'} color={D.muted} />
                {s.lowest_show && (
                  <Row label="" value={`${s.lowest_show.venue} · ${formatDate(s.lowest_show.date)}`}
                    color={D.muted} mono
                    onClick={onOpenScorecard ? () => onOpenScorecard(s.lowest_show.date) : null}
                    href={!onOpenScorecard ? `${PHISH_IN}/${s.lowest_show.date}` : null} />
                )}
              </div>
            )}
          </Section>

          {/* ── PEAK MOMENT ── */}
          {s.highest_song && (
            <Section icon="◈" label="PEAK MOMENT" color={D.orange}>
              <div style={{ background: D.bg, border: `1px solid rgba(255,102,0,0.3)`, borderTop: `3px solid ${D.orange}`, padding: '18px 14px', marginBottom: 6 }}>
                <div style={{ fontFamily: D.disp, fontSize: '0.52rem', color: D.label, letterSpacing: '2px', marginBottom: 8 }}>HIGHEST SINGLE SONG RATING</div>
                <div style={{ fontFamily: D.disp, fontSize: '3rem', fontWeight: 900, color: D.orange, lineHeight: 1, marginBottom: 8 }}>{s.highest_song.rating}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <PlayLink date={s.highest_song.date} />
                  <div style={{ fontFamily: D.mono, fontSize: '0.92rem', color: D.white }}>
                    <SongLink song={s.highest_song.song}>{s.highest_song.song}</SongLink>
                  </div>
                </div>
                <div style={{ fontFamily: D.mono, fontSize: '0.7rem', color: D.muted }}>{formatDate(s.highest_song.date)} · {s.highest_song.venue}</div>
              </div>
            </Section>
          )}

          {/* ── SET SWING ── */}
          {s.biggest_set_gap && (() => {
            const g = s.biggest_set_gap;
            const up = g.direction === 'up';
            return (
              <Section icon="▦" label="BIGGEST SET SWING" color={D.green}>
                <div style={{ background: D.bg, border: `1px solid ${D.border}`, borderTop: `2px solid ${D.green}`, padding: 14, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'flex-end', height: 100, marginBottom: 14 }}>
                    {[['SET I', g.set1_avg, D.cyan], ['SET II', g.set2_avg, up ? D.orange : D.cyan]].map(([lbl, val, col]) => {
                      const h = Math.max(20, (parseFloat(val) / 5) * 100);
                      return (
                        <div key={lbl} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end', flex: 1 }}>
                          <div style={{ fontFamily: D.disp, fontSize: '0.9rem', color: col }}>{val}</div>
                          <div style={{ width: '60%', height: `${h}%`, background: col, opacity: 0.8, borderRadius: '2px 2px 0 0', boxShadow: `0 0 8px ${col}44` }} />
                          <div style={{ fontFamily: D.disp, fontSize: '0.54rem', color: D.label }}>{lbl}</div>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 24, flex: 0.5 }}>
                      <div style={{ fontFamily: D.disp, fontSize: '1.4rem', color: up ? D.orange : D.cyan }}>{up ? '↑' : '↓'}</div>
                      <div style={{ fontFamily: D.disp, fontSize: '0.66rem', color: up ? D.orange : D.cyan }}>+{g.delta}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PlayLink date={g.date} />
                    <div>
                      <div style={{ fontFamily: D.mono, fontSize: '0.82rem', color: D.white }}>{formatDate(g.date)}</div>
                      <div style={{ fontFamily: D.mono, fontSize: '0.68rem', color: D.muted }}>{g.venue} · {up ? 'Set II went nuclear' : 'Set I was the peak'}</div>
                    </div>
                  </div>
                </div>
              </Section>
            );
          })()}

          {/* ── MOST RATED VERSIONS ── */}
          <Section icon="◉" label="MOST RATED VERSIONS" color={D.cyan}>
            {!s.most_heard_rated?.length ? (
              <div style={{ fontFamily: D.mono, fontSize: '0.78rem', color: D.muted, padding: '12px 0', lineHeight: 1.6 }}>
                No rated songs yet. Rate shows in MY SHOWS to see your top song versions here.
              </div>
            ) : (
              <div style={{ background: D.bg, border: `1px solid ${D.border}`, marginBottom: 8 }}>
                <div style={{ padding: '10px 14px', borderBottom: `1px solid rgba(51,255,51,0.08)`, fontFamily: D.disp, fontSize: '0.54rem', letterSpacing: '2px', color: D.cyan }}>
                  YOUR MOST RATED SONGS — TAP FOR TOP VERSIONS
                </div>
                {(s.most_heard_rated || []).slice(0, 10).map((item, i) => {
                  const isOpen = expandedSong === item.song;
                  return (
                    <div key={item.song}>
                      <div
                        onClick={() => setExpandedSong(isOpen ? null : item.song)}
                        style={{ padding: '10px 14px', borderBottom: `1px solid rgba(51,255,51,0.06)`, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: isOpen ? 'rgba(0,224,208,0.04)' : 'transparent' }}
                      >
                        <span style={{ fontFamily: D.disp, fontSize: '0.58rem', color: i === 0 ? D.orange : D.muted, width: 22, flexShrink: 0, textAlign: 'right' }}>{i + 1}</span>
                        <div style={{ flex: 1, fontFamily: D.mono, fontSize: '0.86rem', color: D.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.song}</div>
                        <div style={{ fontFamily: D.disp, fontSize: '0.9rem', color: i === 0 ? D.orange : D.cyan, flexShrink: 0 }}>{item.count}x</div>
                        <div style={{ fontFamily: D.disp, fontSize: '0.54rem', color: D.muted, flexShrink: 0, minWidth: 38, textAlign: 'right' }}>avg {item.avg}</div>
                        <div style={{ fontFamily: D.disp, fontSize: '0.54rem', color: D.muted, flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</div>
                      </div>
                      {isOpen && (
                        <div style={{ background: 'rgba(0,0,0,0.3)', borderBottom: `1px solid rgba(51,255,51,0.06)` }}>
                          <div style={{ padding: '8px 14px 4px', fontFamily: D.disp, fontSize: '0.48rem', color: D.muted, letterSpacing: '2px' }}>
                            YOUR TOP VERSIONS
                          </div>
                          {(item.versions || []).length > 0 ? item.versions.map((v, vi) => (
                            <div key={vi} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderTop: `1px solid rgba(51,255,51,0.04)` }}>
                              <PlayLink date={v.date} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: D.mono, fontSize: '0.8rem', color: D.white }}>{formatDate(v.date)}</div>
                                <div style={{ fontFamily: D.mono, fontSize: '0.66rem', color: D.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.venue}</div>
                              </div>
                              <div style={{ fontFamily: D.disp, fontSize: '1rem', color: v.rating >= 4.5 ? D.orange : D.cyan, flexShrink: 0 }}>{v.rating.toFixed(1)}</div>
                            </div>
                          )) : (
                            <div style={{ padding: '10px 14px', fontFamily: D.mono, fontSize: '0.72rem', color: D.muted }}>
                              Rate individual songs in MY SHOWS to see version history.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </>
      )}

      {data.computed_at && (
        <div style={{ fontFamily: D.mono, fontSize: '0.64rem', color: D.muted, textAlign: 'center', paddingTop: 16, borderTop: `1px solid ${D.border}` }}>
          Last synced {new Date(data.computed_at).toLocaleDateString()} · Hit SYNC to recompute
        </div>
      )}
    </div>
  );
}

// ============================================================
// MY PHRIENDS TAB
// ============================================================






