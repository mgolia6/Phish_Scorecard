import { useState } from "react";

// ── ALT DIRECTION: DARK LUXURY EDITORIAL ─────────────────────
// Concept: think Letterboxd × Pitchfork × a high-end vinyl store
// Dark slate background, warm amber/cream accents, serif display type
// Data-forward but feels premium, not terminal
// Audience: every Phish fan, not just the technical ones

const A = {
  bg:       "#0d0d10",      // near-black with blue undertone
  panel:    "#141418",      // slightly lifted
  raised:   "#1c1c22",      // card surface
  border:   "rgba(255,220,160,0.12)",
  amber:    "#f5a623",      // warm gold — replaces orange
  cream:    "#f0e6d0",      // warm white — replaces harsh green
  teal:     "#4ecdc4",      // softer teal — replaces neon cyan
  rose:     "#e85d75",      // accent for top scores
  muted:    "rgba(240,230,208,0.45)",
  dim:      "rgba(240,230,208,0.28)",
};

// Fonts — serif display + clean sans body
// Playfair Display for show names/scores (editorial weight)
// Inter for data labels (clarity)
// Space Mono for numbers/stats (keeps the data feel)
const serif = "'Playfair Display', Georgia, serif";
const sans  = "'Inter', system-ui, sans-serif";
const mono  = "'Space Mono', monospace";

const shows = [
  { id:1, date:"August 13, 1997",   venue:"Darien Lake PAC",        city:"Darien Center, NY", score:4.2, rated:18, tour:"Summer Tour 1997", set1:4.0, set2:4.5, enc:3.8, favorited:true,
    note:"Maze in Set II was transcendent. One of those versions.",
    songs:[{name:"Wolfman's Brother",s:4,jam:false},{name:"Maze",s:5,jam:true},{name:"Character Zero",s:3}]},
  { id:2, date:"July 16, 1994",     venue:"Sugarbush Summerstage",  city:"Fayston, VT",       score:3.9, rated:24, tour:"Summer Tour 1994", set1:3.8, set2:4.1, enc:3.5, favorited:false,
    note:"My first show. I didn't know what I was walking into.",
    songs:[{name:"Reba",s:5,jam:true},{name:"Stash",s:4},{name:"Harry Hood",s:5}]},
  { id:3, date:"December 31, 1995", venue:"Madison Square Garden",  city:"New York, NY",      score:4.7, rated:29, tour:"New Year's Run",   set1:4.5, set2:4.9, enc:5.0, favorited:true,
    note:"Ball drop Harpua. The whole building lost its mind.",
    songs:[{name:"Harpua",s:5,jam:true},{name:"Wilson",s:4},{name:"Auld Lang Syne",s:5}]},
];

// ── SCORE COLOR ───────────────────────────────────────────────
const scoreCol = s => s >= 4.7 ? A.rose : s >= 4.3 ? A.amber : A.teal;

// ── PLAY BTN ──────────────────────────────────────────────────
function PlayBtn({ size = 32 }) {
  const [h, setH] = useState(false);
  return (
    <button
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        border: `1px solid ${h ? A.teal : "rgba(78,205,196,0.4)"}`,
        background: h ? "rgba(78,205,196,0.15)" : "rgba(78,205,196,0.06)",
        color: A.teal, fontSize: size * 0.36, display: "flex",
        alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.15s",
        boxShadow: h ? `0 0 14px rgba(78,205,196,0.4)` : "none",
        paddingLeft: 2,
      }}>▶</button>
  );
}

// ── KPI STRIP ─────────────────────────────────────────────────
function KPIStrip() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 1, marginBottom: 24, background: A.border }}>
      {[
        { v: "188", l: "Attended",   c: A.cream  },
        { v: "43",  l: "Rated",      c: A.amber  },
        { v: "4.59",l: "Avg Score",  c: A.rose   },
        { v: "32",  l: "Reviews",    c: A.teal   },
      ].map((k, i) => (
        <div key={i} style={{ background: A.panel, padding: "16px 12px", textAlign: "center" }}>
          <div style={{ fontFamily: serif, fontSize: "1.55rem", color: k.c, lineHeight: 1, marginBottom: 4,
            fontStyle: "italic", fontWeight: 700 }}>{k.v}</div>
          <div style={{ fontFamily: sans, fontSize: "0.58rem", color: A.muted, letterSpacing: "1.5px",
            textTransform: "uppercase", fontWeight: 500 }}>{k.l}</div>
        </div>
      ))}
    </div>
  );
}

// ── SHOW CARD ─────────────────────────────────────────────────
function ShowCard({ show }) {
  const [open, setOpen] = useState(false);
  const [fav, setFav]   = useState(show.favorited);
  const col = scoreCol(show.score);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        background: A.raised,
        border: `1px solid ${A.border}`,
        borderLeft: `3px solid ${col}`,
        overflow: "hidden",
      }}>
        {/* Tour tag */}
        <div style={{ padding: "8px 18px 0", fontFamily: sans, fontSize: "0.58rem",
          color: A.dim, letterSpacing: "2px", textTransform: "uppercase", fontWeight: 600 }}>
          {show.tour}
        </div>

        {/* Main row */}
        <div style={{ padding: "10px 18px 14px", display: "flex", gap: 16, alignItems: "flex-start" }}>
          {/* Left: show identity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Date — big editorial serif */}
            <div style={{ fontFamily: serif, fontSize: "1.25rem", color: A.cream,
              lineHeight: 1.15, marginBottom: 4, fontStyle: "italic", fontWeight: 700 }}>
              {show.date}
            </div>
            <div style={{ fontFamily: sans, fontSize: "0.82rem", color: A.muted,
              fontWeight: 500, marginBottom: 3 }}>{show.venue}</div>
            <div style={{ fontFamily: sans, fontSize: "0.7rem", color: A.dim,
              marginBottom: show.note ? 10 : 0 }}>{show.city}</div>
            {show.note && (
              <div style={{ fontFamily: serif, fontSize: "0.8rem", color: A.dim,
                fontStyle: "italic", lineHeight: 1.55, borderLeft: `2px solid ${A.border}`,
                paddingLeft: 10 }}>
                "{show.note}"
              </div>
            )}
          </div>

          {/* Right: score + actions */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
            {/* Score */}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: serif, fontSize: "2.2rem", color: col,
                lineHeight: 1, fontWeight: 700, fontStyle: "italic",
                textShadow: `0 0 20px ${col}44` }}>{show.score}</div>
              <div style={{ fontFamily: mono, fontSize: "0.48rem", color: A.dim,
                letterSpacing: "1.5px", marginTop: 3 }}>{show.rated} SONGS</div>
            </div>
            {/* Set bars */}
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 24 }}>
              {[["I",show.set1],["II",show.set2],["E",show.enc]].map(([l,v])=>(
                <div key={l} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                  <div style={{ width:14, background: scoreCol(v), opacity:0.7, borderRadius:2,
                    height: Math.max(3,((v-3)/2)*20) }}/>
                  <span style={{ fontFamily:sans, fontSize:"0.38rem", color:A.dim }}>{l}</span>
                </div>
              ))}
            </div>
            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PlayBtn size={28}/>
              <button onClick={() => setFav(f => !f)} style={{ background:"transparent",border:"none",
                cursor:"pointer", fontSize:"1.1rem", padding:0, lineHeight:1,
                color: fav ? A.amber : "rgba(245,166,35,0.25)",
                filter: fav ? `drop-shadow(0 0 4px ${A.amber}88)` : "none",
                transition:"all 0.2s" }}>
                {fav ? "★" : "☆"}
              </button>
            </div>
          </div>
        </div>

        {/* Expand toggle */}
        <button onClick={() => setOpen(o=>!o)} style={{
          width: "100%", padding: "9px", background: "rgba(255,255,255,0.02)",
          border: "none", borderTop: `1px solid ${A.border}`,
          color: A.dim, fontFamily: sans, fontSize: "0.6rem", fontWeight: 600,
          letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer",
          transition: "background 0.15s",
        }}>
          {open ? "▲  COLLAPSE" : "▼  SETLIST & RATINGS"}
        </button>

        {/* Expanded setlist */}
        {open && (
          <div style={{ padding: "14px 18px 16px", background: A.bg, borderTop: `1px solid ${A.border}` }}>
            {/* Set scores */}
            <div style={{ display: "flex", gap: 20, marginBottom: 16, paddingBottom: 12,
              borderBottom: `1px solid ${A.border}` }}>
              {[["Set I", show.set1],["Set II", show.set2],["Encore", show.enc]].map(([l,v])=>(
                <div key={l}>
                  <div style={{ fontFamily: serif, fontSize: "1.1rem", color: scoreCol(v),
                    fontWeight: 700, fontStyle: "italic", lineHeight: 1, marginBottom: 2 }}>{v}</div>
                  <div style={{ fontFamily: sans, fontSize: "0.55rem", color: A.dim,
                    letterSpacing: "1.5px", textTransform: "uppercase" }}>{l}</div>
                </div>
              ))}
            </div>
            {/* Songs */}
            {show.songs.map((s, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12,
                padding:"9px 0", borderBottom: i < show.songs.length-1 ? `1px solid ${A.border}` : "none" }}>
                <PlayBtn size={26}/>
                <div style={{ flex:1 }}>
                  <span style={{ fontFamily: sans, fontSize: "0.88rem", fontWeight: 500,
                    color: s.jam ? A.teal : A.cream }}>{s.name}</span>
                  {s.jam && (
                    <span style={{ fontFamily: sans, fontSize: "0.55rem", fontWeight: 700,
                      color: A.teal, background: "rgba(78,205,196,0.12)",
                      border: `1px solid rgba(78,205,196,0.3)`,
                      padding: "1px 5px", marginLeft: 8, letterSpacing: "1px",
                      borderRadius: 2 }}>JAM</span>
                  )}
                </div>
                <div style={{ display:"flex", gap:3, flexShrink:0 }}>
                  {[1,2,3,4,5].map(n=>(
                    <span key={n} style={{ fontSize:"0.78rem",
                      color: n<=s.s ? A.amber : "rgba(240,230,208,0.15)" }}>
                      {n<=s.s?"★":"·"}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── FILTER BAR ────────────────────────────────────────────────
function FilterBar({ active, setActive }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
      {[["all","All"],["attended","Attended"],["rated","Rated"],["favorites","★ Favorites"]].map(([k,l])=>(
        <button key={k} onClick={()=>setActive(k)} style={{
          padding: "7px 12px", fontFamily: sans, fontSize: "0.62rem", fontWeight: 600,
          border: `1px solid ${active===k ? A.amber : "rgba(240,230,208,0.15)"}`,
          background: active===k ? "rgba(245,166,35,0.1)" : "transparent",
          color: active===k ? A.amber : A.muted,
          cursor: "pointer", transition: "all 0.15s",
          borderRadius: 2,
        }}>{l}</button>
      ))}
    </div>
  );
}

// ── QUICK STATS ───────────────────────────────────────────────
function QuickStats() {
  return (
    <div style={{ marginBottom: 20, padding: "14px 16px",
      background: A.panel, border: `1px solid ${A.border}`,
      borderLeft: `3px solid ${A.amber}` }}>
      <div style={{ fontFamily: sans, fontSize: "0.55rem", fontWeight: 700,
        color: A.dim, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 10 }}>
        AT A GLANCE
      </div>
      {[
        ["Top Song",     "Down with Disease",       "(5.00)", A.amber],
        ["Most Visited", "Madison Square Garden",   "(29x)",  A.teal ],
        ["First Show",   "July 16, 1994",           "",       A.teal ],
      ].map(([l,v,s,col],i,arr)=>(
        <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline",
          padding:"7px 0", borderBottom: i<arr.length-1 ? `1px solid ${A.border}` : "none" }}>
          <span style={{ fontFamily:sans, fontSize:"0.62rem", fontWeight:600, color:A.muted }}>{l}</span>
          <span style={{ fontFamily:serif, fontSize:"0.9rem", color:A.cream, fontStyle:"italic" }}>
            {v} <span style={{ color:col, fontStyle:"normal", fontFamily:mono, fontSize:"0.7rem" }}>{s}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// ── ON THIS DAY ───────────────────────────────────────────────
function OnThisDay() {
  return (
    <div style={{ marginBottom: 20, padding: "14px 16px",
      background: `linear-gradient(135deg, ${A.panel}, rgba(78,205,196,0.05))`,
      border: `1px solid rgba(78,205,196,0.2)`,
      borderLeft: `3px solid ${A.teal}` }}>
      <div style={{ fontFamily:sans, fontSize:"0.55rem", fontWeight:700,
        color:A.teal, letterSpacing:"2px", textTransform:"uppercase", marginBottom:8 }}>
        ◈ On This Day
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:serif, fontSize:"1.05rem", color:A.cream,
            fontStyle:"italic", fontWeight:700, marginBottom:3 }}>
            July 4, 1999
          </div>
          <div style={{ fontFamily:sans, fontSize:"0.78rem", color:A.muted }}>Oswego Speedway · Oswego, NY</div>
          <div style={{ fontFamily:sans, fontSize:"0.7rem", color:A.dim, marginTop:4 }}>
            Your score: <span style={{ color:A.amber, fontFamily:mono }}>4.9</span> · 25 years ago today
          </div>
        </div>
        <PlayBtn size={36}/>
      </div>
    </div>
  );
}

// ── STREAK ────────────────────────────────────────────────────
function Streak() {
  return (
    <div style={{ marginBottom: 20, padding: "14px 16px",
      background: A.panel, border: `1px solid ${A.border}`,
      borderLeft: `3px solid ${A.amber}`,
      display: "flex", alignItems: "center", gap: 14 }}>
      <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>⚡</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: serif, fontSize: "1.15rem", fontWeight: 700,
          fontStyle: "italic", color: A.amber, marginBottom: 3,
          textShadow: `0 0 16px rgba(245,166,35,0.4)` }}>7-Day Streak</div>
        <div style={{ fontFamily: sans, fontSize: "0.62rem", color: A.dim,
          letterSpacing: "1px", textTransform: "uppercase" }}>Log in tomorrow to keep it</div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────
export default function AltMock() {
  const [filter, setFilter] = useState("all");
  const [showNote, setShowNote] = useState(true);

  return (
    <div style={{ minHeight: "100vh", background: A.bg, fontFamily: sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=Inter:wght@400;500;600&family=Space+Mono&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
      `}</style>

      {/* Header */}
      <div style={{ background: A.panel, borderBottom: `1px solid ${A.border}`,
        padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: serif, fontSize: "1.1rem", fontWeight: 700,
            fontStyle: "italic", color: A.cream, letterSpacing: 0.5 }}>The Phreezer</div>
          <div style={{ fontFamily: sans, fontSize: "0.55rem", fontWeight: 600,
            color: A.amber, letterSpacing: "2.5px", textTransform: "uppercase", marginTop: 1 }}>
            Rate · Track · Relive
          </div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: "50%",
          border: `1.5px solid ${A.amber}`, background: "rgba(245,166,35,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: mono, fontSize: "0.62rem", color: A.amber,
          boxShadow: `0 0 12px rgba(245,166,35,0.3)` }}>MP</div>
      </div>

      {/* Tab nav */}
      <div style={{ display: "flex", background: A.panel,
        borderBottom: `1px solid ${A.border}` }}>
        {["Scorecard", "My Phreezer", "Community"].map((t, i) => (
          <button key={t} style={{ flex: 1, padding: "11px 4px", background: "transparent",
            border: "none", borderBottom: i === 1 ? `2px solid ${A.amber}` : "2px solid transparent",
            fontFamily: sans, fontSize: "0.58rem", fontWeight: 600, letterSpacing: "1px",
            color: i === 1 ? A.amber : A.dim, cursor: "pointer",
            textTransform: "uppercase" }}>{t}</button>
        ))}
      </div>

      {/* Sub tabs */}
      <div style={{ display: "flex", background: A.bg,
        borderBottom: `1px solid ${A.border}`, overflowX: "auto" }}>
        {["My Shows", "My Songs", "My Venues", "My States"].map((t, i) => (
          <button key={t} style={{ flexShrink: 0, padding: "9px 14px", background: "transparent",
            border: "none", borderBottom: i === 0 ? `2px solid ${A.teal}` : "2px solid transparent",
            fontFamily: sans, fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.5px",
            color: i === 0 ? A.teal : A.dim, cursor: "pointer",
            whiteSpace: "nowrap" }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: "16px 14px 80px" }}>
        {/* Design note */}
        {showNote && (
          <div style={{ marginBottom: 20, padding: "12px 14px",
            background: "rgba(78,205,196,0.06)", border: `1px solid rgba(78,205,196,0.2)`,
            display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div>
              <div style={{ fontFamily: sans, fontSize: "0.65rem", fontWeight: 700, color: A.teal,
                letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>
                ◈ Alt Direction: Dark Luxury Editorial
              </div>
              <div style={{ fontFamily: sans, fontSize: "0.72rem", color: A.muted, lineHeight: 1.6 }}>
                Serif display type · Warm amber/cream palette · No scanlines · Feels premium not terminal · Same data, different emotional register
              </div>
            </div>
            <button onClick={() => setShowNote(false)} style={{ background:"transparent",border:"none",
              color:A.dim,cursor:"pointer",fontSize:"1rem",flexShrink:0 }}>✕</button>
          </div>
        )}

        <KPIStrip/>
        <QuickStats/>
        <OnThisDay/>
        <Streak/>

        <div style={{ fontFamily: sans, fontSize: "0.58rem", fontWeight: 700,
          color: A.dim, letterSpacing: "2px", textTransform: "uppercase",
          marginBottom: 12 }}>Your Shows</div>

        <FilterBar active={filter} setActive={setFilter}/>
        {shows.filter(s => filter==="favorites" ? s.favorited : true).map(s => (
          <ShowCard key={s.id} show={s}/>
        ))}
      </div>
    </div>
  );
}
