import React, { useState, useEffect, useRef } from 'react';

const YEARS = ['1983','1984','1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003','2004','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025'];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const DAYS = Array.from({length:31},(_,i)=>String(i+1).padStart(2,'0'));

function Reel({ values, spinning, locked, lockedValue, direction = 1, color = 'var(--cyan)', speed = 60 }) {
  const [displayIdx, setDisplayIdx] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (spinning && !locked) {
      intervalRef.current = setInterval(() => {
        setDisplayIdx(i => (i + direction + values.length) % values.length);
      }, speed);
    } else {
      clearInterval(intervalRef.current);
      if (locked && lockedValue) {
        const idx = values.indexOf(lockedValue);
        if (idx !== -1) setDisplayIdx(idx);
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [spinning, locked, lockedValue, direction, speed, values]);

  const prev = values[(displayIdx - 1 + values.length) % values.length];
  const curr = values[displayIdx];
  const next = values[(displayIdx + 1) % values.length];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      overflow: 'hidden', height: 120, position: 'relative',
      borderLeft: locked ? `2px solid ${color}` : '2px solid rgba(var(--ink-rgb),0.06)',
      borderRight: locked ? `2px solid ${color}` : '2px solid rgba(var(--ink-rgb),0.06)',
      transition: 'border-color 0.3s',
      flex: 1,
    }}>
      {/* top fade */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 36, background: 'linear-gradient(to bottom, rgba(0,0,0,0.95), transparent)', zIndex: 2, pointerEvents: 'none' }} />
      {/* bottom fade */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 36, background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)', zIndex: 2, pointerEvents: 'none' }} />
      {/* center highlight */}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 40, transform: 'translateY(-50%)', background: locked ? `rgba(${color === 'var(--cyan)' ? '0,224,208' : color === 'var(--orange)' ? '255,102,0' : '51,255,51'},0.08)` : 'rgba(var(--ink-rgb),0.03)', borderTop: `1px solid ${locked ? color : 'rgba(var(--ink-rgb),0.06)'}`, borderBottom: `1px solid ${locked ? color : 'rgba(var(--ink-rgb),0.06)'}`, zIndex: 1, pointerEvents: 'none', transition: 'all 0.3s' }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'rgba(var(--ink-rgb),0.18)', letterSpacing: '2px', height: 40, display: 'flex', alignItems: 'center' }}>{prev}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: locked ? '1.1rem' : '0.95rem', color: locked ? color : 'rgba(var(--ink-rgb),0.55)', letterSpacing: '3px', height: 40, display: 'flex', alignItems: 'center', transition: 'all 0.2s', textShadow: locked ? `0 0 20px ${color}` : 'none' }}>{curr}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'rgba(var(--ink-rgb),0.18)', letterSpacing: '2px', height: 40, display: 'flex', alignItems: 'center' }}>{next}</div>
      </div>

      {locked && (
        <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: color, letterSpacing: '3px', zIndex: 3, opacity: 0.8 }}>LOCKED</div>
      )}
    </div>
  );
}

export function ShowSlotMachine({ onRandomClick, randomizing, targetDate }) {
  const [phase, setPhase] = useState('idle'); // idle | spinning | year-locked | month-locked | done
  const [lockedYear, setLockedYear] = useState(null);
  const [lockedMonth, setLockedMonth] = useState(null);
  const [lockedDay, setLockedDay] = useState(null);
  const phaseRef = useRef('idle');

  useEffect(() => {
    if (randomizing && phase === 'idle') {
      setPhase('spinning');
      phaseRef.current = 'spinning';
      setLockedYear(null); setLockedMonth(null); setLockedDay(null);
    }
  }, [randomizing]);

  useEffect(() => {
    if (targetDate && phase === 'spinning') {
      const [y, m, d] = targetDate.split('-');
      const monthName = MONTHS[parseInt(m) - 1];
      const dayStr = String(parseInt(d)).padStart(2,'0');

      // Lock year after 900ms
      setTimeout(() => {
        setLockedYear(y);
        setPhase('year-locked');
        phaseRef.current = 'year-locked';
      }, 900);

      // Lock month after 1.6s
      setTimeout(() => {
        setLockedMonth(monthName);
        setPhase('month-locked');
        phaseRef.current = 'month-locked';
      }, 1600);

      // Lock day after 2.2s
      setTimeout(() => {
        setLockedDay(dayStr);
        setPhase('done');
        phaseRef.current = 'done';
      }, 2200);
    }
  }, [targetDate, phase]);

  // Reset when not randomizing and done
  useEffect(() => {
    if (!randomizing && phase === 'done') {
      setTimeout(() => {
        setPhase('idle');
        setLockedYear(null); setLockedMonth(null); setLockedDay(null);
      }, 600);
    }
  }, [randomizing, phase]);

  const isSpinning = ['spinning', 'year-locked', 'month-locked'].includes(phase);
  const showArrow = phase === 'idle';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0 24px', userSelect: 'none' }}>

      {showArrow ? (
        <>
          {/* Big arrow pointing up */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 28, animation: 'bounce 1.8s ease-in-out infinite' }}>
            <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }`}</style>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', color: 'var(--orange)', lineHeight: 1, textShadow: '0 0 30px rgba(var(--orange-rgb),0.7)', animation: 'none' }}>↑</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', color: 'var(--orange)', letterSpacing: '3px', textShadow: '0 0 15px rgba(var(--orange-rgb),0.5)' }}>HIT THAT BUTTON</div>
          </div>

          {/* Dare copy */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'rgba(var(--green-rgb),0.45)', letterSpacing: '2px', textAlign: 'center', lineHeight: 1.8, maxWidth: 400 }}>
            40+ years of shows.<br/>
            <span style={{ color: 'rgba(var(--green-rgb),0.7)' }}>Dare to let fate pick one.</span>
          </div>
        </>
      ) : (
        <>
          {/* Slot machine label */}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--text-muted)', letterSpacing: '4px', marginBottom: 16 }}>
            {phase === 'done' ? 'FOUND ONE' : 'SEARCHING THE VAULT...'}
          </div>

          {/* Reels */}
          <div style={{
            display: 'flex', gap: 0, width: '100%', maxWidth: 400,
            border: '1px solid rgba(var(--ink-rgb),0.08)',
            background: 'var(--inset-xstrong)',
            boxShadow: isSpinning ? '0 0 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5)' : '0 0 20px rgba(var(--green-rgb),0.1)',
          }}>
            <Reel
              values={YEARS}
              spinning={isSpinning || phase === 'year-locked'}
              locked={['year-locked','month-locked','done'].includes(phase)}
              lockedValue={lockedYear}
              direction={1}
              color="var(--orange)"
              speed={45}
            />
            <div style={{ width: 1, background: 'rgba(var(--ink-rgb),0.06)', flexShrink: 0 }} />
            <Reel
              values={MONTHS}
              spinning={isSpinning}
              locked={['month-locked','done'].includes(phase)}
              lockedValue={lockedMonth}
              direction={-1}
              color="var(--cyan)"
              speed={55}
            />
            <div style={{ width: 1, background: 'rgba(var(--ink-rgb),0.06)', flexShrink: 0 }} />
            <Reel
              values={DAYS}
              spinning={isSpinning && phase !== 'year-locked' ? true : phase === 'month-locked' || isSpinning}
              locked={phase === 'done'}
              lockedValue={lockedDay}
              direction={1}
              color="var(--green)"
              speed={35}
            />
          </div>

          {phase === 'done' && (
            <div style={{ marginTop: 14, fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'var(--green)', letterSpacing: '4px', animation: 'fadeIn 0.4s ease' }}>
              <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
              LOADING...
            </div>
          )}
        </>
      )}
    </div>
  );
}
