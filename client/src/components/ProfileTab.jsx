import React, { useState, useEffect } from 'react';
import { FullPageLoader } from './FullPageLoader';

export function ProfileTab({ api, user }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState({ songs: [], venues: [] });

  useEffect(() => {
    Promise.all([
      api.get('/user/profile'),
      api.get('/user/profile-options'),
    ]).then(([p, o]) => {
      setProfile(p);
      setForm(p);
      setOptions(o);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/user/profile', form);
      setProfile(form);
      setEditing(false);
    } catch (e) {}
    finally { setSaving(false); }
  };

  if (!profile) return <FullPageLoader text="LOADING PROFILE..." />;

  const fields = [
    { key: 'phishnet_username', label: 'PHISH.NET HANDLE' },
    { key: 'favorite_song', label: 'FAVORITE SONG' },
    { key: 'favorite_venue', label: 'FAVORITE VENUE' },
    { key: 'favorite_show_date', label: 'FIRST SHOW' },
  ];

  return (
    <div className="panel">
      <div className="panel-title">PROFILE</div>

      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--cyan)', letterSpacing: '2px' }}>
          {user.username}
        </div>
        <div style={{ fontSize: '0.65rem', color: 'rgba(51,255,51,0.35)', marginTop: 4, letterSpacing: '1px' }}>
          {user.email}
        </div>
      </div>

      {!editing ? (
        <>
          {fields.map(f => (
            <div key={f.key} className="profile-field-row">
              <div className="profile-field-label">{f.label}</div>
              {profile[f.key]
                ? <div className="profile-field-val">{profile[f.key]}</div>
                : <div className="profile-field-empty">not set</div>
              }
            </div>
          ))}
          <button className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: 8 }} onClick={() => setEditing(true)}>
            ✎ EDIT PROFILE
          </button>
        </>
      ) : (
        <>
          {fields.map(f => (
            <div key={f.key} className="profile-field-row">
              <label className="profile-field-label">{f.label}</label>
              {f.key === 'favorite_song' && options.songs.length > 0 ? (
                <select className="era-select" style={{ width: '100%' }} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}>
                  <option value="">— SELECT —</option>
                  {options.songs.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : f.key === 'favorite_venue' && options.venues.length > 0 ? (
                <select className="era-select" style={{ width: '100%' }} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}>
                  <option value="">— SELECT —</option>
                  {options.venues.map((v, i) => <option key={i} value={v.venue}>{v.venue}{v.city ? ` — ${v.city}` : ''}</option>)}
                </select>
              ) : (
                <input type="text" value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.label.toLowerCase()} />
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button className="btn-primary" style={{ flex: 1, padding: '12px' }} onClick={handleSave} disabled={saving}>
              {saving ? 'SAVING...' : 'SAVE'}
            </button>
            <button style={{ flex: 1, padding: '12px' }} onClick={() => { setEditing(false); setForm(profile); }}>
              CANCEL
            </button>
          </div>
        </>
      )}

      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <a href="https://buymeacoffee.com/mpgink" target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--orange)', letterSpacing: '2px', textDecoration: 'none', padding: '12px', border: '1px solid rgba(255,102,0,0.3)' }}>
          ☕ BUY A COFFEE — KEEP PHREEZER RUNNING
        </a>
      </div>
    </div>
  );
}

// ============================================================
// COMMUNITY HELPERS
// ============================================================
