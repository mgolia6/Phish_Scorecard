import React, { useState, useEffect } from 'react';
import { FullPageLoader } from './FullPageLoader';
import { formatDate } from '../utils';

export function DeepPhreezeTab({ api, showMessage, showError }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [toggle, setToggle] = useState('attended'); // 'attended' | 'rated'

  const load = () => {
    setLoading(true);
    api.get('/user/deep-phreeze')
      .then(setData)
      .catch(() => setData({ needs_sync: true }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.post('/user/sync', {});
      setSyncResult(`✓ SYNCED ${res.synced} SHOWS — ${res.total_attended} TOTAL`);
      setData({ needs_sync: false, stats: res.stats, computed_at: new Date().toISOString() });
    } catch (e) {
      setSyncResult(`✗ SYNC FAILED: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // ── PRIMITIVES ──────────────────────────────────────────
  const DP = {
    bg: 'var(--bg-panel)',
    border: 'var(--border)',
    cyan: 'var(--cyan)',
    orange: 'var(--orange)',
    green: 'var(--green)',
    white: 'var(--white)',
    label: 'var(--text-label)',
    muted: 'var(--text-muted)',
    disp: 'var(--font-display)',
    mono: 'var(--font-mono)',
  };

  const SecLabel = ({ children, color = DP.label }) => (
    <div style={{ fontFamily: DP.disp, fontSize: '0.52rem', letterSpacing: '2.5px', color, padding: '14px 0 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
      {children}
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, rgba(51,255,51,0.15), transparent)` }} />
    </div>
  );

  const HeroStat = ({ label, value, unit, context, sub, color = DP.cyan }) => (
    <div style={{ background: DP.bg, border: `1px solid ${color}44`, borderLeft: `3px solid ${color}`, borderTop: `2px solid ${color}`, padding: '16px', marginBottom: 8, position: 'relative', overflow: 'hidden' }}>
      <div style={{ fontFamily: DP.disp, fontSize: '0.52rem', letterSpacing: '2.5px', color, opacity: 0.9, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
        {label}
      </div>
      <div style={{ fontFamily: DP.disp, fontSize: '2.8rem', fontWeight: 900, color, textShadow: `0 0 30px ${color}55`, letterSpacing: 2, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      {unit && <div style={{ fontFamily: DP.disp, fontSize: '0.54rem', color: DP.label, letterSpacing: '2px', marginBottom: 8 }}>{unit}</div>}
      {context && <div style={{ fontFamily: DP.mono, fontSize: '0.82rem', color: DP.white, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{context}</div>}
      {sub && <div style={{ fontFamily: DP.mono, fontSize: '0.65rem', color: DP.muted }}>{sub}</div>}
    </div>
  );

  const StatRow = ({ items }) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 8, marginBottom: 8 }}>
      {items.map(({ label, value, context, sub, color = DP.orange }) => (
        <div key={label} style={{ background: DP.bg, border: `1px solid ${DP.border}`, borderTop: `2px solid ${color}`, padding: '12px 10px' }}>
          <div style={{ fontFamily: DP.disp, fontSize: '0.48rem', letterSpacing: '1.5px', color: DP.label, marginBottom: 7 }}>{label}</div>
          <div style={{ fontFamily: DP.disp, fontSize: '1.4rem', fontWeight: 700, color, textShadow: `0 0 14px ${color}44`, letterSpacing: 1, lineHeight: 1, marginBottom: 4 }}>{value}</div>
          {context && <div style={{ fontFamily: DP.mono, fontSize: '0.7rem', color: DP.label, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{context}</div>}
          {sub && <div style={{ fontFamily: DP.mono, fontSize: '0.64rem', color: DP.muted, marginTop: 2 }}>{sub}</div>}
        </div>
      ))}
    </div>
  );

  const ListCard = ({ label, items, renderRow }) => (
    <div style={{ background: DP.bg, border: `1px solid ${DP.border}`, marginBottom: 8 }}>
      <div style={{ padding: '9px 14px', borderBottom: `1px solid rgba(51,255,51,0.08)`, fontFamily: DP.disp, fontSize: '0.52rem', letterSpacing: '2px', color: DP.cyan }}>{label}</div>
      {items.length ? items.map((item, i) => (
        <div key={i} style={{ padding: '9px 14px', borderBottom: i < items.length - 1 ? `1px solid rgba(51,255,51,0.06)` : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: DP.disp, fontSize: '0.54rem', color: DP.muted, width: 20, flexShrink: 0 }}>{i+1}.</span>
          {renderRow(item, i)}
        </div>
      )) : (
        <div style={{ padding: '12px 14px', fontFamily: DP.disp, fontSize: '0.52rem', color: DP.muted, letterSpacing: '2px' }}>NOT ENOUGH DATA YET</div>
      )}
    </div>
  );

  const SetGapViz = ({ show }) => {
    if (!show) return null;
    const s1 = parseFloat(show.set1_avg);
    const s2 = parseFloat(show.set2_avg);
    const max = Math.max(s1, s2, 3.5);
    const s1h = Math.max(10, ((s1 - 2) / (max - 2)) * 80);
    const s2h = Math.max(10, ((s2 - 2) / (max - 2)) * 80);
    const up = show.direction === 'up';
    return (
      <div style={{ background: DP.bg, border: `1px solid ${DP.border}`, borderTop: `2px solid ${DP.green}`, padding: 14, marginBottom: 8 }}>
        <div style={{ fontFamily: DP.disp, fontSize: '0.52rem', letterSpacing: '2px', color: DP.green, marginBottom: 12, opacity: 0.8 }}>◈ BIGGEST SET SWING</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 90, marginBottom: 10 }}>
          {[['SET I', s1h, DP.cyan, show.set1_avg], ['SET II', s2h, up ? DP.orange : DP.cyan, show.set2_avg]].map(([lbl, h, col, val]) => (
            <div key={lbl} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ fontFamily: DP.disp, fontSize: '0.7rem', color: col, letterSpacing: 1 }}>{val}</div>
              <div style={{ width: '100%', height: `${h}%`, background: col, opacity: 0.75, borderRadius: '2px 2px 0 0', boxShadow: `0 0 8px ${col}44`, transition: 'height 0.6s' }} />
              <div style={{ fontFamily: DP.disp, fontSize: '0.5rem', color: DP.label, letterSpacing: '1px' }}>{lbl}</div>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 20 }}>
            <div style={{ fontFamily: DP.disp, fontSize: '1rem', color: up ? DP.orange : DP.cyan }}>{up ? '↑' : '↓'}</div>
            <div style={{ fontFamily: DP.disp, fontSize: '0.52rem', color: up ? DP.orange : DP.cyan, letterSpacing: 1 }}>+{show.delta}</div>
          </div>
        </div>
        <div style={{ fontFamily: DP.mono, fontSize: '0.78rem', color: DP.white }}>{formatDate(show.date)}</div>
        <div style={{ fontFamily: DP.mono, fontSize: '0.66rem', color: DP.muted }}>{show.venue} · {up ? 'Set II went nuclear' : 'Set I was the moment'}</div>
      </div>
    );
  };

  const CompleteBar = ({ stat }) => {
    if (!stat) return null;
    return (
      <div style={{ background: DP.bg, border: `1px solid ${DP.border}`, borderLeft: `3px solid ${DP.green}`, padding: 14, marginBottom: 8 }}>
        <div style={{ fontFamily: DP.disp, fontSize: '0.52rem', letterSpacing: '2px', color: DP.green, marginBottom: 10, opacity: 0.8 }}>◈ MOST COMPLETE SHOW RATED</div>
        <div style={{ fontFamily: DP.mono, fontSize: '0.88rem', color: DP.white, marginBottom: 2 }}>{stat.venue}</div>
        <div style={{ fontFamily: DP.mono, fontSize: '0.68rem', color: DP.muted, marginBottom: 10 }}>{formatDate(stat.date)} · {stat.rated} of {stat.total} songs rated</div>
        <div style={{ height: 8, background: 'rgba(51,255,51,0.08)', borderRadius: 2, marginBottom: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${stat.pct}%`, background: `linear-gradient(90deg, ${DP.green}, rgba(51,255,51,0.6))`, boxShadow: '0 0 8px rgba(51,255,51,0.5)', borderRadius: 2 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: DP.disp, fontSize: '1.2rem', color: DP.green, textShadow: '0 0 12px rgba(51,255,51,0.5)' }}>{stat.pct}%</div>
          <div style={{ fontFamily: DP.disp, fontSize: '0.5rem', color: DP.muted, letterSpacing: '1.5px' }}>{stat.pct === 100 ? 'FULLY PHROZEN' : 'PHROZEN'}</div>
        </div>
      </div>
    );
  };

  // ── RENDER ───────────────────────────────────────────────
  if (loading) return <FullPageLoader text="LOADING DEEP PHREEZE..." />;

  if (!data || data.needs_sync) return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ background: 'var(--bg-panel)', border: '1px solid rgba(0,224,208,0.3)', borderTop: '2px solid var(--cyan)', padding: '24px 16px', marginBottom: 14, textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>❄</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--cyan)', letterSpacing: '3px', marginBottom: 8 }}>DEEP PHREEZE</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
          Your first sync pulls setlist data for all {'\n'}
          your attended shows from phish.net and {'\n'}
          computes your deep stats. Takes ~30 seconds.
        </div>
        <button onClick={handleSync} disabled={syncing} style={{ width: '100%', padding: '14px', background: 'rgba(0,224,208,0.08)', border: '1px solid rgba(0,224,208,0.45)', color: 'var(--cyan)', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2.5px', cursor: syncing ? 'wait' : 'pointer', boxShadow: '0 0 20px rgba(0,224,208,0.15)' }}>
          {syncing ? '◈ SYNCING...' : '❄ RUN DEEP PHREEZE SYNC'}
        </button>
        {syncResult && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: syncResult.startsWith('✓') ? 'var(--green)' : 'var(--red)', marginTop: 12 }}>{syncResult}</div>}
      </div>
    </div>
  );

  const s = data.stats || {};
  const isAttended = toggle === 'attended';

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, rgba(0,224,208,0.06) 0%, transparent 100%)', borderBottom: '1px solid rgba(0,224,208,0.2)', padding: '14px 0 12px', marginBottom: 4 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', letterSpacing: '2.5px', color: 'var(--cyan)', opacity: 0.8, marginBottom: 4 }}>◈ MY PHREEZER</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 900, color: 'var(--white)', letterSpacing: '3px', marginBottom: 4 }}>
          DEEP <span style={{ color: 'var(--cyan)', textShadow: '0 0 20px rgba(0,255,255,0.5)' }}>PHREEZE</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          Every number a story. {s.total_attended} shows · {s.years_active} years.
        </div>
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 14, border: '1px solid var(--border)' }}>
        {[['attended', `ATTENDED (${s.total_attended || 0})`], ['rated', `RATED (${s.total_rated || 0})`]].map(([k, l]) => (
          <button key={k} onClick={() => setToggle(k)} style={{
            flex: 1, padding: '10px 6px', background: toggle === k ? 'rgba(0,224,208,0.07)' : 'transparent',
            border: 'none', borderBottom: `2px solid ${toggle === k ? 'var(--cyan)' : 'transparent'}`,
            color: toggle === k ? 'var(--cyan)' : 'var(--text-muted)',
            fontFamily: 'var(--font-display)', fontSize: '0.54rem', letterSpacing: '2px', cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      {/* Sync button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button onClick={handleSync} disabled={syncing} style={{ background: 'transparent', border: '1px solid rgba(51,255,51,0.2)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '2px', padding: '6px 12px', cursor: 'pointer' }}>
          {syncing ? '◈ SYNCING...' : '↺ RE-SYNC'}
        </button>
      </div>
      {syncResult && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: syncResult.startsWith('✓') ? 'var(--green)' : 'var(--red)', marginBottom: 10 }}>{syncResult}</div>}

      {isAttended ? (
        /* ── ATTENDED VIEW ── */
        <>
          <SecLabel color="var(--cyan)">❄ LONGEST MOMENTS</SecLabel>
          <HeroStat
            label="LONGEST SHOW YOU ATTENDED"
            value={s.longest_show?.song_count || '—'}
            unit="SONGS IN THE SETLIST"
            context={s.longest_show?.venue}
            sub={s.longest_show ? formatDate(s.longest_show.date) : ''}
            color="var(--cyan)"
          />
          <StatRow items={[
            { label: 'LONGEST SET I', value: s.longest_set1?.count || '—', context: s.longest_set1?.venue, sub: s.longest_set1 ? formatDate(s.longest_set1.date) : '', color: 'var(--cyan)' },
            { label: 'LONGEST SET II', value: s.longest_set2?.count || '—', context: s.longest_set2?.venue, sub: s.longest_set2 ? formatDate(s.longest_set2.date) : '', color: 'var(--orange)' },
          ]} />

          <SecLabel>⚡ ATTENDANCE STREAKS</SecLabel>
          <StatRow items={[
            { label: 'LONGEST RUN', value: `${s.longest_run?.shows || '—'}`, context: 'consecutive shows', sub: s.longest_run?.start ? `starting ${formatDate(s.longest_run.start)}` : '', color: 'var(--orange)' },
            { label: 'LONGEST GAP', value: s.longest_gap?.days ? `${Math.round(s.longest_gap.days / 365 * 10) / 10}y` : '—', context: 'between shows', sub: s.longest_gap?.from ? `${formatDate(s.longest_gap.from)} → ${formatDate(s.longest_gap.to)}` : '', color: 'var(--cyan)' },
          ]} />

          <SecLabel>◉ MOST HEARD (ATTENDED)</SecLabel>
          <ListCard label="SONGS YOU'VE SEEN THE MOST" items={(s.most_heard_attended || []).slice(0, 8)} renderRow={(item, i) => (
            <>
              <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.song}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: i === 0 ? 'var(--orange)' : 'var(--cyan)', letterSpacing: 1, flexShrink: 0 }}>{item.count}x</div>
            </>
          )} />

          <SecLabel>⬡ RAREST SONGS CAUGHT</SecLabel>
          <ListCard label="SONGS YOU'VE ONLY SEEN ONCE" items={(s.rarest_caught || []).slice(0, 6)} renderRow={(item) => (
            <>
              <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.song}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'var(--text-muted)', letterSpacing: '1px', flexShrink: 0 }}>1x ONLY</div>
            </>
          )} />
        </>
      ) : (
        /* ── RATED VIEW ── */
        <>
          <SecLabel color="var(--orange)">★ EXTREME RATINGS</SecLabel>
          {s.highest_song && (
            <HeroStat
              label="HIGHEST SINGLE SONG RATING"
              value={s.highest_song.rating}
              unit={`${s.perfect_5s} PERFECT 5s IN YOUR HISTORY`}
              context={s.highest_song.song}
              sub={`${formatDate(s.highest_song.date)} · ${s.highest_song.venue}`}
              color="var(--orange)"
            />
          )}
          <StatRow items={[
            { label: 'BEST SHOW', value: s.highest_show?.avg || '—', context: s.highest_show?.venue, sub: s.highest_show ? formatDate(s.highest_show.date) : '', color: 'var(--orange)' },
            { label: 'LOWEST SHOW', value: s.lowest_show?.avg || '—', context: s.lowest_show?.venue, sub: s.lowest_show ? formatDate(s.lowest_show.date) : '', color: 'var(--cyan)' },
          ]} />

          <SecLabel>▦ BIGGEST SET SWING</SecLabel>
          <SetGapViz show={s.biggest_set_gap} />

          <SecLabel>◈ COMPLETIONISM</SecLabel>
          <CompleteBar stat={s.most_complete} />

          <SecLabel>◉ MOST RATED VERSIONS</SecLabel>
          <ListCard label="SONGS YOU'VE RATED THE MOST" items={(s.most_heard_rated || []).slice(0, 8)} renderRow={(item, i) => (
            <>
              <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.song}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', color: i === 0 ? 'var(--orange)' : 'var(--cyan)', letterSpacing: 1, flexShrink: 0 }}>{item.count}x</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '1px', flexShrink: 0, textAlign: 'right', minWidth: 36 }}>avg {item.avg}</div>
            </>
          )} />
        </>
      )}

      {/* Footer */}
      {data.computed_at && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          Last computed: {new Date(data.computed_at).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MY PHRIENDS TAB
// ============================================================

