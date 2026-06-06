import { useState } from "react";

// ── TOKENS ────────────────────────────────────────────────────
const C = {
  cyan:"#00ffff", orange:"#ff6600", green:"#33ff33", red:"#ff3333",
  white:"#f0fff0", bg:"#000000", panel:"#050f05", raised:"#0a1a0a",
  border:"rgba(51,255,51,0.15)",
  // Contrast-safe dim values — nothing below 0.5 opacity for text
  labelColor:"rgba(51,255,51,0.55)",
  mutedColor:"rgba(51,255,51,0.42)",
  dimColor:"rgba(255,255,255,0.5)",
};
const mono = "'Share Tech Mono', monospace";
const disp = "'Orbitron', monospace";
const scan = { backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)" };

// ── DATA ──────────────────────────────────────────────────────
const ME = { username:"mpgink", email:"mgolia6@gmail.com", phishnet:"Mgolia6",
  fav_song:"Carini", fav_venue:"Gorge Amphitheatre", first_show:"Jul 16, 1994",
  streak:7, shows_rated:43, attended:188, avg:4.59, reviews:32, last_sync:"Jun 3, 2026 · 9:14am" };

const BADGES = [
  { glyph:"💯", label:"CENTURY CLUB",  sub:"Attended 100 shows",   earned:true,  color:C.orange },
  { glyph:"❄",  label:"FIRST PHREEZE", sub:"Rated your first show", earned:true,  color:C.cyan   },
  { glyph:"✎",  label:"PHISH CRITIC",  sub:"Wrote 10 reviews",      earned:true,  color:C.green  },
  { glyph:"⚡",  label:"ON A STREAK",   sub:"7-day login streak",    earned:true,  color:C.orange },
  { glyph:"◈",  label:"PHAN OF 10",    sub:"Rated 10 shows",        earned:true,  color:C.cyan   },
  { glyph:"◉",  label:"ARCHIVIST",     sub:"Rated 50 shows",        earned:false, color:C.green  },
  { glyph:"✦",  label:"HALL OF PHAME", sub:"Rated 100 shows",       earned:false, color:C.orange },
  { glyph:"⬡",  label:"WORLD PHAN",    sub:"Shows in 10 states",    earned:false, color:C.cyan   },
];

const initShows = [
  { id:1, date:"Aug 13, 1997", venue:"Darien Lake PAC",       score:4.2, rated:18, tour:"Summer 1997", state:"NY", set1:4.0, set2:4.5, enc:3.8, notes:"Incredible Maze. Second set was on fire.", favorited:true,
    songs:[{name:"Wolfman's Brother",s:4,audio:"https://phish.in"},{name:"Maze",s:5,jam:true,audio:"https://phish.in"},{name:"Character Zero",s:3,audio:"https://phish.in"}] },
  { id:2, date:"Jul 16, 1994", venue:"Sugarbush Summerstage", score:3.9, rated:24, tour:"Summer 1994", state:"VT", set1:3.8, set2:4.1, enc:3.5, notes:"My first show. Never the same after.", favorited:false,
    songs:[{name:"Reba",s:5,jam:true,audio:"https://phish.in"},{name:"Stash",s:4,audio:"https://phish.in"},{name:"Harry Hood",s:5,audio:null}] },
  { id:3, date:"Dec 31, 1995", venue:"Madison Square Garden", score:4.7, rated:29, tour:"New Year's",  state:"NY", set1:4.5, set2:4.9, enc:5.0, notes:"Ball drop Harpua. All-timer.", favorited:true,
    songs:[{name:"Harpua",s:5,jam:true,audio:"https://phish.in"},{name:"Wilson",s:4,audio:"https://phish.in"},{name:"Auld Lang Syne",s:5,audio:null}] },
];

const initMySongs = [
  { name:"Down with Disease", plays:12, avg:5.0, versions:[
    {date:"Aug 13, 1997",score:5.0,venue:"Darien Lake",audio:"https://phish.in"},
    {date:"Jul 4, 1999", score:5.0,venue:"Oswego",    audio:"https://phish.in"},
    {date:"Dec 31, 1995",score:4.8,venue:"MSG",       audio:"https://phish.in"},
    {date:"Aug 9, 2004", score:4.5,venue:"Coventry",  audio:null},
    {date:"Jun 22, 2012",score:4.2,venue:"SPAC",      audio:"https://phish.in"}]},
  { name:"Carini", plays:8, avg:4.87, versions:[
    {date:"Jul 16, 1994",score:5.0,venue:"Sugarbush",     audio:"https://phish.in"},
    {date:"Aug 2, 2003", score:4.9,venue:"Alpine Valley", audio:"https://phish.in"},
    {date:"Dec 28, 2015",score:4.7,venue:"MSG",           audio:"https://phish.in"},
    {date:"Jul 22, 2019",score:4.5,venue:"Camden",        audio:null},
    {date:"Aug 6, 2021", score:4.3,venue:"SPAC",          audio:"https://phish.in"}]},
  { name:"Tweezer", plays:11, avg:4.72, versions:[
    {date:"Jul 4, 1999",  score:5.0,venue:"Oswego",       audio:"https://phish.in"},
    {date:"Dec 31, 1995", score:4.8,venue:"MSG",          audio:"https://phish.in"},
    {date:"Aug 14, 2010", score:4.6,venue:"Gorge",        audio:"https://phish.in"},
    {date:"Jul 19, 2014", score:4.4,venue:"Merriweather", audio:null},
    {date:"Sep 1, 2012",  score:4.1,venue:"Dick's",       audio:"https://phish.in"}]},
];

const myVenues = [
  { name:"Madison Square Garden", city:"New York, NY",    shows:29, avg:4.6, state:"NY",
    topShows:[{date:"Dec 31, 1995",score:4.9,audio:"https://phish.in"},{date:"Dec 30, 2012",score:4.7,audio:"https://phish.in"},{date:"Dec 31, 2002",score:4.6,audio:null},{date:"Dec 28, 2015",score:4.5,audio:"https://phish.in"},{date:"Dec 29, 1994",score:4.3,audio:"https://phish.in"}]},
  { name:"Gorge Amphitheatre",    city:"George, WA",      shows:11, avg:4.8, state:"WA",
    topShows:[{date:"Aug 6, 2009",score:5.0,audio:"https://phish.in"},{date:"Aug 7, 2009",score:4.9,audio:"https://phish.in"},{date:"Aug 5, 2011",score:4.8,audio:"https://phish.in"},{date:"Aug 6, 2011",score:4.7,audio:null},{date:"Jul 14, 2018",score:4.5,audio:"https://phish.in"}]},
  { name:"Hampton Coliseum",      city:"Hampton, VA",     shows:8,  avg:4.5, state:"VA",
    topShows:[{date:"Mar 1, 2009",score:5.0,audio:"https://phish.in"},{date:"Mar 7, 2009",score:4.8,audio:"https://phish.in"},{date:"Nov 16, 1996",score:4.6,audio:null},{date:"Feb 20, 1993",score:4.3,audio:"https://phish.in"},{date:"Apr 4, 1998",score:4.1,audio:"https://phish.in"}]},
];

const myStates = {
  WA:{avg:4.8,shows:11,topVenue:"Gorge Amphitheatre"},
  NY:{avg:4.6,shows:29,topVenue:"Madison Square Garden"},
  CO:{avg:4.7,shows:5, topVenue:"Red Rocks"},
  VA:{avg:4.5,shows:8, topVenue:"Hampton Coliseum"},
  VT:{avg:4.3,shows:7, topVenue:"Sugarbush"},
  MA:{avg:4.1,shows:12,topVenue:"Great Woods"},
  IN:{avg:4.2,shows:7, topVenue:"Deer Creek"},
  NH:{avg:3.9,shows:4, topVenue:"SPAC"},
};

const commSongs = [
  { name:"You Enjoy Myself", avg:4.72, ratings:8341, versions:[
    {date:"Dec 31, 1995",score:4.95,venue:"MSG",       audio:"https://phish.in"},
    {date:"Aug 26, 1989",score:4.91,venue:"Townshend", audio:null},
    {date:"Jul 4, 1999", score:4.89,venue:"Oswego",    audio:"https://phish.in"},
    {date:"Nov 2, 1994", score:4.85,venue:"Glens Falls",audio:"https://phish.in"},
    {date:"Dec 31, 1993",score:4.82,venue:"Portland ME",audio:"https://phish.in"}]},
  { name:"Tweezer", avg:4.68, ratings:7892, versions:[
    {date:"Nov 28, 1994",score:4.94,venue:"Providence", audio:"https://phish.in"},
    {date:"Jul 4, 1999", score:4.92,venue:"Oswego",     audio:"https://phish.in"},
    {date:"Nov 17, 1997",score:4.89,venue:"Denver",     audio:"https://phish.in"},
    {date:"Dec 29, 1994",score:4.86,venue:"Providence", audio:null},
    {date:"Aug 7, 2009", score:4.84,venue:"Gorge",      audio:"https://phish.in"}]},
  { name:"Harry Hood", avg:4.65, ratings:7201, versions:[
    {date:"Oct 31, 1994",score:4.96,venue:"Glens Falls",  audio:"https://phish.in"},
    {date:"Aug 12, 1993",score:4.91,venue:"Toronto",      audio:null},
    {date:"Nov 16, 1995",score:4.88,venue:"Rosemont",     audio:"https://phish.in"},
    {date:"Dec 31, 1994",score:4.84,venue:"Boston Garden", audio:"https://phish.in"},
    {date:"Aug 9, 2004", score:4.80,venue:"Coventry",     audio:"https://phish.in"}]},
];

const commVenues = [
  { name:"Gorge Amphitheatre", city:"George, WA", avg:4.78, shows:42, state:"WA",
    topShows:[{date:"Aug 6, 2009",score:4.97,audio:"https://phish.in"},{date:"Aug 7, 2009",score:4.95,audio:"https://phish.in"},{date:"Aug 5, 2011",score:4.91,audio:"https://phish.in"},{date:"Aug 6, 2011",score:4.88,audio:null},{date:"Jul 14, 2018",score:4.82,audio:"https://phish.in"}]},
  { name:"Hampton Coliseum",   city:"Hampton, VA", avg:4.74, shows:38, state:"VA",
    topShows:[{date:"Mar 1, 2009",score:4.99,audio:"https://phish.in"},{date:"Nov 16, 1996",score:4.96,audio:"https://phish.in"},{date:"Mar 7, 2009",score:4.93,audio:"https://phish.in"},{date:"Apr 4, 1998",score:4.87,audio:null},{date:"Feb 20, 1993",score:4.81,audio:"https://phish.in"}]},
  { name:"Red Rocks",          city:"Morrison, CO", avg:4.71, shows:31, state:"CO",
    topShows:[{date:"Aug 13, 1996",score:4.96,audio:"https://phish.in"},{date:"Aug 14, 1995",score:4.93,audio:"https://phish.in"},{date:"Aug 12, 1995",score:4.88,audio:null},{date:"Jul 31, 1997",score:4.84,audio:"https://phish.in"},{date:"Aug 11, 1996",score:4.80,audio:"https://phish.in"}]},
];

const commStatesData = {
  WA:{avg:4.78,shows:42,topVenue:"Gorge Amphitheatre",    topShow:"Aug 6, 2009"},
  VA:{avg:4.74,shows:38,topVenue:"Hampton Coliseum",      topShow:"Mar 1, 2009"},
  CO:{avg:4.71,shows:31,topVenue:"Red Rocks",             topShow:"Aug 13, 1996"},
  NY:{avg:4.65,shows:61,topVenue:"MSG",                   topShow:"Dec 31, 1995"},
  VT:{avg:4.61,shows:18,topVenue:"Sugarbush",             topShow:"Aug 26, 1989"},
  ME:{avg:4.55,shows:12,topVenue:"Portland Civic Center", topShow:"Dec 31, 1993"},
  IN:{avg:4.48,shows:24,topVenue:"Deer Creek",            topShow:"Jul 22, 1997"},
  MA:{avg:4.42,shows:38,topVenue:"Great Woods",           topShow:"Aug 2, 1998"},
};

const commShows = [
  { date:"Dec 31, 1999", venue:"Big Cypress",          score:4.94, raters:312, audio:"https://phish.in",
    songs:[{name:"Quadraphonic Toppling",s:5,jam:true,audio:"https://phish.in"},{name:"Tweezer",s:5,jam:true,audio:"https://phish.in"},{name:"Harry Hood",s:5,audio:"https://phish.in"}]},
  { date:"Aug 26, 1989", venue:"Townshend Family Park", score:4.91, raters:89, audio:null,
    songs:[{name:"You Enjoy Myself",s:5,jam:true,audio:null},{name:"Fee",s:5,audio:null},{name:"Alumni Blues",s:4,audio:null}]},
  { date:"Jul 22, 1997", venue:"Deer Creek",            score:4.88, raters:201, audio:"https://phish.in",
    songs:[{name:"Tweezer",s:5,jam:true,audio:"https://phish.in"},{name:"Maze",s:5,audio:"https://phish.in"},{name:"Mike's Song",s:5,jam:true,audio:"https://phish.in"}]},
];

const leaderboard = [
  { rank:1, user:"phanatic99",  rated:312, avg:4.2,  streak:14, badges:7 },
  { rank:2, user:"gorge_ghost", rated:241, avg:4.0,  streak:3,  badges:5 },
  { rank:3, user:"tweezerhead", rated:198, avg:4.3,  streak:7,  badges:6 },
  { rank:4, user:"mpgink",      rated:43,  avg:4.59, streak:7,  badges:5, me:true },
  { rank:5, user:"zzyzx_phan",  rated:38,  avg:3.9,  streak:1,  badges:3 },
];

// ── PRIMITIVES ────────────────────────────────────────────────
const Card = ({children,accent=C.cyan,pad="14px 16px",mb=10,style={}})=>(
  <div style={{background:C.panel,border:`1px solid ${C.border}`,borderLeft:`3px solid ${accent}`,marginBottom:mb,padding:pad,...style}}>{children}</div>
);

const SecLabel = ({children})=>(
  <div style={{fontFamily:disp,fontSize:"0.5rem",color:C.labelColor,letterSpacing:"2.5px",marginBottom:9,paddingLeft:2,textTransform:"uppercase"}}>{children}</div>
);

function GlowBtn({children,color=C.orange,onClick,href,small=false,mb=0}){
  const [h,setH]=useState(false);
  const rgb=color===C.cyan?"0,255,255":color===C.red?"255,51,51":"255,102,0";
  const s={display:"block",width:"100%",padding:small?"10px":"15px",
    background:h?`rgba(${rgb},0.08)`:"transparent",
    border:`1px solid ${h?color:color+"99"}`,color,fontFamily:disp,
    fontSize:small?"0.52rem":"0.6rem",letterSpacing:"2.5px",cursor:"pointer",
    textAlign:"center",textDecoration:"none",transition:"all 0.18s",marginBottom:mb,
    boxShadow:h?`0 0 22px ${color}55,inset 0 0 28px ${color}0c`:
               `0 0 8px ${color}22`};
  if(href) return <a href={href} target="_blank" rel="noopener noreferrer" style={s} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}>{children}</a>;
  return <button style={s} onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}>{children}</button>;
}

// ── PLAY BUTTON ───────────────────────────────────────────────
function PlayBtn({href, size=30, label=""}){
  const [h,setH]=useState(false);
  if(!href) return <div style={{width:size,height:size,flexShrink:0,opacity:0.15,
    border:`1px solid rgba(51,255,51,0.2)`,display:"flex",alignItems:"center",justifyContent:"center",
    fontFamily:mono,fontSize:"0.55rem",color:"rgba(51,255,51,0.3)"}}>–</div>;
  return(
    <a href={href} target="_blank" rel="noopener noreferrer"
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      title={label||"Stream on Phish.in"}
      style={{display:"flex",alignItems:"center",justifyContent:"center",
        width:size,height:size,flexShrink:0,textDecoration:"none",
        border:`1px solid ${h?C.cyan:"rgba(0,255,255,0.4)"}`,
        background:h?"rgba(0,255,255,0.12)":"rgba(0,255,255,0.05)",
        color:C.cyan,fontSize:size*0.38,
        boxShadow:h?`0 0 12px ${C.cyan}55`:`0 0 4px ${C.cyan}22`,
        transition:"all 0.15s"}}>
      ▶
    </a>
  );
}

function KPIGrid({items}){
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
      {items.map((k,i)=>(
        <div key={i} style={{background:C.raised,border:`1px solid rgba(51,255,51,0.12)`,
          borderTop:`2px solid ${k.color||C.cyan}`,padding:"14px 10px",
          display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
          <div style={{fontFamily:disp,fontSize:"1.55rem",color:k.color||C.cyan,
            textShadow:`0 0 16px ${k.color||C.cyan}55`,letterSpacing:1,lineHeight:1}}>{k.value}</div>
          <div style={{fontFamily:disp,fontSize:"0.46rem",color:C.labelColor,
            letterSpacing:"2px",textAlign:"center"}}>{k.label}</div>
          {k.sub&&<div style={{fontFamily:mono,fontSize:"0.62rem",color:C.mutedColor,textAlign:"center"}}>{k.sub}</div>}
        </div>
      ))}
    </div>
  );
}

function ProgBar({value,max,color=C.cyan,label,sub}){
  const pct=Math.min((value/max)*100,100);
  return(
    <div style={{marginBottom:10}}>
      {label&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontFamily:mono,fontSize:"0.8rem",color:C.white}}>{label}</span>
        <span style={{fontFamily:disp,fontSize:"0.52rem",color,letterSpacing:"1px"}}>{value} / {max}</span>
      </div>}
      <div style={{height:4,background:"rgba(51,255,51,0.1)",borderRadius:2}}>
        <div style={{width:`${pct}%`,height:"100%",background:color,boxShadow:`0 0 8px ${color}88`,borderRadius:2,transition:"width 0.6s"}}/>
      </div>
      {sub&&<div style={{fontFamily:disp,fontSize:"0.46rem",color:C.labelColor,letterSpacing:"2px",marginTop:4}}>{sub}</div>}
    </div>
  );
}

// Set score mini bars — visual punch on show cards
function SetBars({set1,set2,enc}){
  const bars=[["I",set1,C.cyan],["II",set2,set2>=4.7?C.orange:C.cyan],["E",enc,C.green]];
  return(
    <div style={{display:"flex",gap:6,alignItems:"flex-end",height:28}}>
      {bars.map(([l,v,col])=>(
        <div key={l} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
          <div style={{width:18,background:col,opacity:0.8,borderRadius:"1px 1px 0 0",
            height:Math.max(4,((v-3)/2)*24),boxShadow:`0 0 4px ${col}66`}}/>
          <span style={{fontFamily:disp,fontSize:"0.38rem",color:C.labelColor,letterSpacing:"1px"}}>{l}</span>
        </div>
      ))}
    </div>
  );
}

// ── HEATMAP ───────────────────────────────────────────────────
const POS={
  WA:{r:0,c:0},OR:{r:1,c:0},CA:{r:3,c:0},NV:{r:2,c:1},ID:{r:1,c:1},MT:{r:0,c:2},
  WY:{r:1,c:2},UT:{r:2,c:2},AZ:{r:3,c:2},CO:{r:2,c:3},NM:{r:3,c:3},ND:{r:0,c:3},
  SD:{r:1,c:3},NE:{r:2,c:4},KS:{r:3,c:4},OK:{r:4,c:4},TX:{r:4,c:5},MN:{r:0,c:4},
  IA:{r:1,c:4},MO:{r:2,c:5},AR:{r:3,c:5},LA:{r:4,c:6},WI:{r:0,c:5},IL:{r:1,c:5},
  MS:{r:3,c:6},MI:{r:0,c:6},IN:{r:1,c:6},TN:{r:2,c:6},AL:{r:3,c:7},KY:{r:1,c:7},
  OH:{r:0,c:7},WV:{r:1,c:8},GA:{r:3,c:8},FL:{r:4,c:8},VA:{r:0,c:8},NC:{r:1,c:9},
  SC:{r:2,c:9},MD:{r:0,c:9},DE:{r:0,c:10},NJ:{r:0,c:11},PA:{r:0,c:10},NY:{r:0,c:12},
  CT:{r:1,c:11},RI:{r:1,c:12},MA:{r:0,c:13},VT:{r:1,c:13},NH:{r:0,c:14},ME:{r:0,c:15},
};
const scoreColor=s=>{
  if(!s)return"rgba(51,255,51,0.08)";
  if(s>=4.7)return"rgba(255,102,0,0.9)";
  if(s>=4.4)return"rgba(255,140,0,0.75)";
  if(s>=4.1)return"rgba(0,200,200,0.75)";
  if(s>=3.8)return"rgba(0,180,180,0.45)";
  return"rgba(51,255,51,0.22)";
};
function Heatmap({data,title}){
  const [hov,setHov]=useState(null);
  const rows=5,cols=16;
  const cells=Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>{
    const st=Object.entries(POS).find(([,v])=>v.r===r&&v.c===c);
    return st?{abbr:st[0],score:data[st[0]]?.avg||data[st[0]]||null}:null;
  }));
  return(
    <div style={{marginBottom:14}}>
      {title&&<SecLabel>{title}</SecLabel>}
      <div style={{overflowX:"auto",paddingBottom:4}}>
        <div style={{display:"grid",gridTemplateRows:`repeat(${rows},28px)`,
          gridTemplateColumns:`repeat(${cols},1fr)`,gap:2,minWidth:300}}>
          {cells.flat().map((cell,i)=>(
            <div key={i} style={{background:cell?scoreColor(cell.score):"transparent",
              border:cell?(hov===cell.abbr?`1px solid ${C.cyan}`:`1px solid rgba(51,255,51,0.15)`):"none",
              display:"flex",alignItems:"center",justifyContent:"center",
              cursor:cell?"pointer":"default",transition:"all 0.12s"}}
              onMouseEnter={()=>cell&&setHov(cell.abbr)}
              onMouseLeave={()=>setHov(null)}>
              {/* White text so initials are always visible */}
              {cell&&<span style={{fontFamily:disp,fontSize:"0.38rem",color:"#ffffff",fontWeight:900,letterSpacing:0,
                textShadow:"0 1px 2px rgba(0,0,0,0.8)"}}>{cell.abbr}</span>}
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
        {[["rgba(255,102,0,0.9)","4.7+"],["rgba(255,140,0,0.75)","4.4+"],["rgba(0,200,200,0.75)","4.1+"],["rgba(0,180,180,0.45)","3.8+"],["rgba(51,255,51,0.22)","<3.8"],["rgba(51,255,51,0.08)","N/A"]].map(([col,lbl],i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:10,height:10,background:col,border:"1px solid rgba(255,255,255,0.15)"}}/>
            <span style={{fontFamily:disp,fontSize:"0.4rem",color:C.labelColor,letterSpacing:"1px"}}>{lbl}</span>
          </div>
        ))}
      </div>
      {hov&&data[hov]&&(
        <div style={{fontFamily:disp,fontSize:"0.54rem",color:C.cyan,letterSpacing:"2px",marginTop:7}}>
          {hov} — AVG {data[hov]?.avg||data[hov]}{data[hov]?.topVenue?` · ${data[hov].topVenue}`:""}
        </div>
      )}
    </div>
  );
}

// ── SHOW CARD ─────────────────────────────────────────────────
function ShowCard({show,onFavorite,isFav}){
  const [open,setOpen]=useState(false);
  const accent=show.score>=4.7?C.orange:show.score>=4.3?C.cyan:"rgba(51,255,51,0.4)";
  return(
    <div style={{marginBottom:8}}>
      <div style={{background:`linear-gradient(135deg,${C.panel},${show.score>=4.7?"rgba(255,102,0,0.05)":"rgba(0,255,255,0.01)"})`,
        border:`1px solid ${C.border}`,borderLeft:`3px solid ${accent}`}}>
        {/* Collapsed row */}
        <div style={{padding:"12px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:disp,fontSize:"0.46rem",color:C.labelColor,letterSpacing:"2px",marginBottom:3}}>{show.tour}</div>
            <div style={{fontFamily:disp,fontSize:"0.84rem",color:C.cyan,letterSpacing:"1.5px",marginBottom:3}}>{show.date}</div>
            <div style={{fontFamily:mono,fontSize:"0.78rem",color:C.white,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{show.venue}</div>
            {/* Set bars — visual mini chart */}
            <SetBars set1={show.set1} set2={show.set2} enc={show.enc}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {/* Stream whole show */}
              <PlayBtn href={show.audio||"https://phish.in"} size={28} label="Stream show on Phish.in"/>
              {/* Favorite */}
              <button onClick={()=>onFavorite(show.id)} style={{background:"transparent",border:"none",
                cursor:"pointer",fontSize:"1.1rem",padding:0,lineHeight:1,
                color:isFav?C.orange:"rgba(51,255,51,0.25)",
                filter:isFav?`drop-shadow(0 0 5px ${C.orange}88)`:"none",
                transition:"all 0.2s"}}>
                {isFav?"★":"☆"}
              </button>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:disp,fontSize:"1.5rem",color:show.score>=4.7?C.orange:C.cyan,
                textShadow:`0 0 16px ${show.score>=4.7?C.orange:C.cyan}55`,letterSpacing:1,lineHeight:1}}>{show.score}</div>
              <div style={{fontFamily:disp,fontSize:"0.4rem",color:C.mutedColor,letterSpacing:"1.5px",marginTop:3}}>{show.rated} SONGS</div>
            </div>
            <button onClick={()=>setOpen(o=>!o)} style={{background:"transparent",
              border:`1px solid rgba(51,255,51,0.2)`,color:C.labelColor,
              fontFamily:disp,fontSize:"0.44rem",letterSpacing:"2px",padding:"4px 8px",cursor:"pointer"}}>
              {open?"▲ LESS":"▼ MORE"}
            </button>
          </div>
        </div>
        {/* Expanded */}
        {open&&(
          <div style={{borderTop:`1px solid rgba(51,255,51,0.08)`,padding:"12px 14px",background:C.raised}}>
            {/* Set scores */}
            <div style={{display:"flex",gap:16,marginBottom:14}}>
              {[["SET I",show.set1],["SET II",show.set2],["ENCORE",show.enc]].map(([l,v])=>(
                <div key={l} style={{textAlign:"center"}}>
                  <div style={{fontFamily:disp,fontSize:"1rem",color:v>=4.5?C.orange:C.cyan,
                    textShadow:`0 0 8px ${v>=4.5?C.orange:C.cyan}44`}}>{v}</div>
                  <div style={{fontFamily:disp,fontSize:"0.4rem",color:C.labelColor,letterSpacing:"2px"}}>{l}</div>
                </div>
              ))}
            </div>
            {/* Songs with play buttons */}
            <div style={{fontFamily:disp,fontSize:"0.46rem",color:C.mutedColor,letterSpacing:"2px",marginBottom:8}}>TOP RATED SONGS</div>
            {show.songs.map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,
                padding:"8px 0",borderBottom:i<show.songs.length-1?`1px solid rgba(51,255,51,0.06)`:"none"}}>
                <PlayBtn href={s.audio} size={28}/>
                <div style={{flex:1}}>
                  <span style={{fontFamily:mono,fontSize:"0.85rem",color:s.jam?C.cyan:C.white}}>
                    {s.name}
                  </span>
                  {s.jam&&<span style={{fontFamily:disp,fontSize:"0.4rem",border:`1px solid ${C.cyan}`,
                    color:C.cyan,padding:"1px 4px",marginLeft:7,letterSpacing:1}}>JAM</span>}
                </div>
                <div style={{display:"flex",gap:2,flexShrink:0}}>
                  {[1,2,3,4,5].map(n=>(
                    <span key={n} style={{fontSize:"0.72rem",color:n<=s.s?C.orange:"rgba(51,255,51,0.2)"}}>{n<=s.s?"★":"·"}</span>
                  ))}
                </div>
              </div>
            ))}
            {show.notes&&(
              <div style={{marginTop:10,padding:"8px 10px",background:C.bg,
                border:`1px solid rgba(51,255,51,0.12)`,fontFamily:mono,fontSize:"0.74rem",
                color:C.mutedColor,fontStyle:"italic",lineHeight:1.6}}>
                "{show.notes}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── EXPANDABLE CARD ───────────────────────────────────────────
function ExpandCard({name,sub,avg,count,countLabel="SHOWS",accent=C.cyan,scoreColor:sc,children,rightExtra}){
  const [open,setOpen]=useState(false);
  const col=sc||(avg>=4.7?C.orange:C.cyan);
  return(
    <div style={{marginBottom:8}}>
      <div style={{background:C.panel,border:`1px solid ${C.border}`,borderLeft:`3px solid ${accent}`}}>
        <div style={{padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:mono,fontSize:"0.9rem",color:C.white,marginBottom:2,
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
            {sub&&<div style={{fontFamily:mono,fontSize:"0.72rem",color:C.mutedColor}}>{sub}</div>}
            {rightExtra}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:disp,fontSize:"1.35rem",color:col,
                textShadow:`0 0 12px ${col}55`,letterSpacing:1,lineHeight:1}}>{avg}</div>
              <div style={{fontFamily:disp,fontSize:"0.4rem",color:C.mutedColor,letterSpacing:"1.5px",marginTop:3}}>{count} {countLabel}</div>
            </div>
            <button onClick={()=>setOpen(o=>!o)} style={{background:"transparent",
              border:`1px solid rgba(51,255,51,0.2)`,color:C.labelColor,
              fontFamily:disp,fontSize:"0.44rem",letterSpacing:"1.5px",padding:"5px 9px",cursor:"pointer"}}>
              {open?"▲":"▼"}
            </button>
          </div>
        </div>
        {open&&(
          <div style={{borderTop:`1px solid rgba(51,255,51,0.07)`,padding:"12px 14px",background:C.raised}}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// Shows list inside expanded card
function TopShowsInside({shows,label="TOP SHOWS",accent=C.cyan}){
  return(
    <div>
      <div style={{fontFamily:disp,fontSize:"0.46rem",color:C.mutedColor,letterSpacing:"2px",marginBottom:9}}>{label}</div>
      {shows.map((s,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,
          padding:"8px 0",borderBottom:i<shows.length-1?`1px solid rgba(51,255,51,0.06)`:"none"}}>
          <PlayBtn href={s.audio} size={26}/>
          <span style={{fontFamily:mono,fontSize:"0.8rem",color:C.labelColor,flex:1}}>{s.date}</span>
          <span style={{fontFamily:disp,fontSize:"0.84rem",color:s.score>=4.9?C.orange:accent,
            textShadow:`0 0 8px ${s.score>=4.9?C.orange:accent}44`,letterSpacing:1}}>{s.score}</span>
        </div>
      ))}
    </div>
  );
}

// Song versions inside expanded card
function TopVersionsInside({versions,label="TOP VERSIONS",accent=C.orange}){
  return(
    <div>
      <div style={{fontFamily:disp,fontSize:"0.46rem",color:C.mutedColor,letterSpacing:"2px",marginBottom:9}}>{label}</div>
      {versions.map((v,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,
          padding:"8px 0",borderBottom:i<versions.length-1?`1px solid rgba(51,255,51,0.06)`:"none"}}>
          <PlayBtn href={v.audio} size={26}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:mono,fontSize:"0.78rem",color:C.white}}>{v.date}</div>
            <div style={{fontFamily:mono,fontSize:"0.65rem",color:C.mutedColor}}>{v.venue}</div>
          </div>
          <span style={{fontFamily:disp,fontSize:"0.84rem",color:v.score>=4.9?C.orange:accent,
            textShadow:`0 0 8px ${v.score>=4.9?C.orange:accent}44`,letterSpacing:1,flexShrink:0}}>{v.score}</span>
        </div>
      ))}
    </div>
  );
}

// Songs inside an expanded show (community)
function TopSongsInShow({songs,label="TOP SONGS IN THIS SHOW"}){
  return(
    <div>
      <div style={{fontFamily:disp,fontSize:"0.46rem",color:C.mutedColor,letterSpacing:"2px",marginBottom:9}}>{label}</div>
      {songs.map((s,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,
          padding:"8px 0",borderBottom:i<songs.length-1?`1px solid rgba(51,255,51,0.06)`:"none"}}>
          <PlayBtn href={s.audio} size={26}/>
          <span style={{fontFamily:mono,fontSize:"0.82rem",color:s.jam?C.cyan:C.white,flex:1}}>
            {s.name}{s.jam&&<span style={{fontFamily:disp,fontSize:"0.38rem",border:`1px solid ${C.cyan}`,color:C.cyan,padding:"1px 4px",marginLeft:6,letterSpacing:1}}>JAM</span>}
          </span>
          <div style={{display:"flex",gap:2,flexShrink:0}}>
            {[1,2,3,4,5].map(n=><span key={n} style={{fontSize:"0.7rem",color:n<=s.s?C.orange:"rgba(51,255,51,0.2)"}}>{n<=s.s?"★":"·"}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MY SHOWS ──────────────────────────────────────────────────
function MyShows(){
  const [shows,setShows]=useState(initShows);
  const [filter,setFilter]=useState("all");
  const toggle=id=>setShows(ss=>ss.map(s=>s.id===id?{...s,favorited:!s.favorited}:s));
  const filtered=filter==="favorites"?shows.filter(s=>s.favorited):filter==="rated"?shows.filter(s=>s.rated>0):shows;
  return(
    <div>
      <KPIGrid items={[
        {label:"SHOWS ATTENDED",value:ME.attended,color:C.cyan},
        {label:"SHOWS RATED",value:ME.shows_rated,color:C.orange},
        {label:"AVG SCORE",value:ME.avg,color:C.green},
        {label:"REVIEWS",value:ME.reviews,color:C.cyan},
      ]}/>
      <Card accent={C.orange} pad="12px 14px" mb={12}>
        {[["TOP SONG","Down with Disease","(5.00)",C.orange],
          ["MOST VISITED","Madison Square Garden","(29x)",C.cyan],
          ["FIRST SHOW",ME.first_show,"",C.cyan]].map(([l,v,s,col],i,arr)=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",
            padding:"7px 0",borderBottom:i<arr.length-1?`1px solid rgba(51,255,51,0.08)`:"none"}}>
            <span style={{fontFamily:disp,fontSize:"0.5rem",color:C.labelColor,letterSpacing:"2px"}}>{l}</span>
            <span style={{fontFamily:mono,fontSize:"0.86rem",color:C.white}}>
              {v} <span style={{color:col,fontSize:"0.78rem"}}>{s}</span>
            </span>
          </div>
        ))}
      </Card>
      {/* On This Day */}
      <Card accent={C.cyan} pad="12px 14px" mb={12} style={{borderTop:`2px solid ${C.cyan}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:disp,fontSize:"0.52rem",color:C.cyan,letterSpacing:"2px",marginBottom:5}}>◈ ON THIS DAY</div>
            <div style={{fontFamily:mono,fontSize:"0.86rem",color:C.white,marginBottom:2}}>Jul 4, 1999 · Oswego Speedway</div>
            <div style={{fontFamily:mono,fontSize:"0.72rem",color:C.labelColor}}>Your score: <span style={{color:C.orange}}>4.9</span> · 25 years ago</div>
          </div>
          <PlayBtn href="https://phish.in" size={34} label="Stream this show"/>
        </div>
      </Card>
      {/* Streak */}
      <Card accent={C.orange} pad="13px 14px" mb={12}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <span style={{fontSize:"1.4rem"}}>⚡</span>
          <div>
            <div style={{fontFamily:disp,fontSize:"1rem",color:C.orange,letterSpacing:2,textShadow:`0 0 14px ${C.orange}66`}}>{ME.streak}-DAY STREAK</div>
            <div style={{fontFamily:disp,fontSize:"0.44rem",color:C.labelColor,letterSpacing:"2px",marginTop:3}}>LOG IN TOMORROW TO KEEP IT</div>
          </div>
        </div>
        <ProgBar value={ME.shows_rated} max={50} color={C.cyan} label="Rated shows" sub="NEXT: ARCHIVIST (50)"/>
        <ProgBar value={ME.attended} max={200} color={C.orange} label="Shows attended" sub="NEXT: 200 SHOWS"/>
      </Card>
      {/* Badges */}
      <SecLabel>BADGES</SecLabel>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
        {BADGES.filter(b=>b.earned).map((b,i)=>(
          <div key={i} style={{border:`1px solid ${b.color}66`,background:C.raised,
            padding:"6px 11px",display:"flex",alignItems:"center",gap:6,
            boxShadow:`0 0 10px ${b.color}22`}}>
            <span style={{fontSize:"0.9rem"}}>{b.glyph}</span>
            <span style={{fontFamily:disp,fontSize:"0.48rem",color:b.color,letterSpacing:"1.5px"}}>{b.label}</span>
          </div>
        ))}
      </div>
      {/* Sync */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
        marginBottom:10,padding:"8px 12px",border:`1px solid rgba(51,255,51,0.12)`,background:C.raised}}>
        <span style={{fontFamily:mono,fontSize:"0.67rem",color:C.labelColor}}>Last synced: {ME.last_sync}</span>
        <button style={{background:"transparent",border:`1px solid rgba(0,255,255,0.35)`,color:C.cyan,
          fontFamily:disp,fontSize:"0.46rem",letterSpacing:"2px",padding:"4px 10px",cursor:"pointer"}}>↓ SYNC</button>
      </div>
      {/* Filters */}
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        {[["all","ALL"],["attended","ATTENDED"],["rated","RATED"],["favorites","★ FAV"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{flex:1,padding:"9px 4px",
            border:`1px solid ${filter===k?C.cyan:"rgba(51,255,51,0.22)"}`,
            background:filter===k?"rgba(0,255,255,0.05)":"transparent",
            color:filter===k?C.cyan:C.labelColor,
            fontFamily:disp,fontSize:"0.44rem",letterSpacing:"1.5px",cursor:"pointer"}}>
            {l}
          </button>
        ))}
      </div>
      {filtered.map(s=><ShowCard key={s.id} show={s} onFavorite={toggle} isFav={s.favorited}/>)}
      <div style={{marginTop:6}}><GlowBtn color={C.orange} small>↓ IMPORT FROM PHISH.NET</GlowBtn></div>
    </div>
  );
}

function MySongs(){
  return(
    <div>
      <KPIGrid items={[
        {label:"SONGS RATED",value:"847",color:C.cyan},
        {label:"UNIQUE SONGS",value:"203",color:C.orange},
        {label:"AVG SONG SCORE",value:"4.12",color:C.green},
        {label:"PERFECT 5s",value:"38",color:C.orange},
      ]}/>
      <SecLabel>YOUR TOP SONGS — TAP FOR YOUR VERSIONS</SecLabel>
      {initMySongs.map((s,i)=>(
        <ExpandCard key={i} name={s.name} avg={s.avg} count={s.plays} countLabel="HEARD"
          accent={i===0?C.orange:C.cyan}
          sub={`${s.plays} versions · avg ${s.avg}`}>
          <TopVersionsInside versions={s.versions} accent={i===0?C.orange:C.cyan}/>
        </ExpandCard>
      ))}
    </div>
  );
}

function MyVenues(){
  return(
    <div>
      <KPIGrid items={[
        {label:"UNIQUE VENUES",value:"34",color:C.cyan},
        {label:"STATES VISITED",value:"18",color:C.orange},
        {label:"TOP VENUE AVG",value:"4.8",color:C.green},
        {label:"HOME VENUE",value:"MSG",color:C.cyan},
      ]}/>
      <Heatmap data={Object.fromEntries(Object.entries(myStates).map(([k,v])=>[k,v.avg]))} title="MY RATINGS BY STATE"/>
      <SecLabel>MY VENUES — TAP FOR TOP SHOWS</SecLabel>
      {myVenues.map((v,i)=>(
        <ExpandCard key={i} name={v.name} sub={v.city} avg={v.avg} count={v.shows}
          accent={i===0?C.orange:i===1?C.cyan:"rgba(51,255,51,0.45)"}>
          <TopShowsInside shows={v.topShows} accent={i===0?C.orange:C.cyan}/>
        </ExpandCard>
      ))}
    </div>
  );
}

function MyStates(){
  const sorted=Object.entries(myStates).sort(([,a],[,b])=>b.avg-a.avg);
  return(
    <div>
      <KPIGrid items={[
        {label:"STATES VISITED",value:Object.keys(myStates).length,color:C.cyan},
        {label:"TOP STATE",value:"WA",color:C.orange},
        {label:"TOP STATE AVG",value:"4.8",color:C.green},
        {label:"SHOWS IN WA",value:"11",color:C.cyan},
      ]}/>
      <Heatmap data={Object.fromEntries(Object.entries(myStates).map(([k,v])=>[k,v.avg]))} title="MY RATINGS BY STATE"/>
      <SecLabel>MY STATES — TAP TO EXPAND</SecLabel>
      {sorted.map(([st,d],i)=>(
        <ExpandCard key={st} name={st} avg={d.avg} count={d.shows}
          accent={i===0?C.orange:i<3?C.cyan:"rgba(51,255,51,0.4)"}
          sub={`${d.shows} shows · top: ${d.topVenue}`}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div>
              <div style={{fontFamily:disp,fontSize:"0.46rem",color:C.mutedColor,letterSpacing:"2px",marginBottom:4}}>TOP VENUE IN {st}</div>
              <div style={{fontFamily:mono,fontSize:"0.92rem",color:C.cyan}}>{d.topVenue}</div>
            </div>
            <div>
              <div style={{fontFamily:disp,fontSize:"0.46rem",color:C.mutedColor,letterSpacing:"2px",marginBottom:4}}>YOUR AVG SCORE</div>
              <div style={{fontFamily:disp,fontSize:"1.1rem",color:d.avg>=4.7?C.orange:C.cyan,
                textShadow:`0 0 10px ${d.avg>=4.7?C.orange:C.cyan}55`}}>{d.avg}</div>
            </div>
          </div>
        </ExpandCard>
      ))}
    </div>
  );
}

// ── COMMUNITY TABS ────────────────────────────────────────────
function CommLeaderboard(){
  return(
    <div>
      <KPIGrid items={[
        {label:"TOTAL RATINGS",value:"94.2K",color:C.cyan},
        {label:"AVG SHOW SCORE",value:"4.21",color:C.orange},
        {label:"ACTIVE USERS",value:"1,847",color:C.green},
        {label:"SHOWS COVERED",value:"1,432",color:C.cyan},
      ]}/>
      <Card accent={C.cyan} pad="0" mb={0}>
        <div style={{padding:"12px 14px 8px",borderBottom:`1px solid rgba(51,255,51,0.08)`}}>
          <div style={{fontFamily:disp,fontSize:"0.52rem",color:C.cyan,letterSpacing:"2px"}}>LEADERBOARD</div>
        </div>
        {leaderboard.map((row,i)=>(
          <div key={i} style={{display:"grid",gridTemplateColumns:"26px 1fr auto auto auto",
            alignItems:"center",gap:8,padding:"12px 14px",
            borderBottom:`1px solid rgba(51,255,51,0.06)`,
            borderLeft:row.me?`2px solid ${C.cyan}`:"none",
            background:row.me?"rgba(0,255,255,0.025)":"transparent"}}>
            <span style={{fontFamily:disp,fontSize:"0.7rem",
              color:row.rank===1?C.orange:row.rank===2?C.cyan:row.rank===3?C.green:C.labelColor}}>
              {row.rank===1?"★":row.rank===2?"◈":row.rank===3?"◉":row.rank}
            </span>
            <span style={{fontFamily:mono,fontSize:"0.86rem",color:row.me?C.cyan:C.white}}>{row.user}</span>
            <span style={{fontFamily:mono,fontSize:"0.72rem",color:C.labelColor}}>{row.rated}</span>
            <span style={{fontFamily:disp,fontSize:"0.78rem",color:C.orange,letterSpacing:1}}>{row.avg}</span>
            <span style={{fontFamily:mono,fontSize:"0.64rem",color:C.labelColor}}>⚡{row.streak}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function CommShows(){
  return(
    <div>
      <KPIGrid items={[
        {label:"SHOWS RATED",value:"1,432",color:C.cyan},
        {label:"HIGHEST RATED",value:"4.94",color:C.orange},
        {label:"TOTAL RATINGS",value:"94.2K",color:C.green},
        {label:"MOST RATED",value:"512",color:C.cyan,sub:"Big Cypress"},
      ]}/>
      <SecLabel>TOP RATED SHOWS — TAP FOR SONGS</SecLabel>
      {commShows.map((show,i)=>(
        <ExpandCard key={i} name={show.date}
          sub={`${show.venue} · ${show.raters} ratings`}
          avg={show.score} count={show.raters} countLabel="RATINGS"
          accent={i===0?C.orange:C.cyan}>
          {/* ✅ Correctly labeled "TOP SONGS IN THIS SHOW" */}
          <TopSongsInShow songs={show.songs}/>
          {/* Stream whole show */}
          <div style={{marginTop:12}}>
            <PlayBtn href={show.audio} size={32} label={`Stream ${show.date} on Phish.in`}/>
          </div>
        </ExpandCard>
      ))}
    </div>
  );
}

function CommSongs(){
  return(
    <div>
      <KPIGrid items={[
        {label:"SONGS RATED",value:"1,203",color:C.cyan},
        {label:"HIGHEST RATED",value:"4.72",color:C.orange},
        {label:"TOTAL RATINGS",value:"94.2K",color:C.green},
        {label:"MOST RATED",value:"8.3K",color:C.cyan,sub:"You Enjoy Myself"},
      ]}/>
      <SecLabel>TOP SONGS — TAP FOR TOP VERSIONS</SecLabel>
      {commSongs.map((s,i)=>(
        <ExpandCard key={i} name={s.name} avg={s.avg}
          count={`${(s.ratings/1000).toFixed(1)}K`} countLabel="RATINGS"
          accent={i===0?C.orange:C.cyan}
          sub={`${(s.ratings/1000).toFixed(1)}K community ratings`}>
          <TopVersionsInside versions={s.versions} accent={i===0?C.orange:C.cyan}/>
        </ExpandCard>
      ))}
    </div>
  );
}

function CommVenues(){
  return(
    <div>
      <KPIGrid items={[
        {label:"VENUES RATED",value:"342",color:C.cyan},
        {label:"STATES COVERED",value:"38",color:C.orange},
        {label:"TOP VENUE AVG",value:"4.78",color:C.green},
        {label:"TOP VENUE",value:"GORGE",color:C.cyan},
      ]}/>
      <Heatmap data={Object.fromEntries(Object.entries(commStatesData).map(([k,v])=>[k,v.avg]))} title="COMMUNITY RATINGS BY STATE"/>
      <SecLabel>TOP VENUES — TAP FOR TOP SHOWS</SecLabel>
      {commVenues.map((v,i)=>(
        <ExpandCard key={i} name={v.name} sub={v.city} avg={v.avg} count={v.shows}
          accent={i===0?C.orange:i===1?C.cyan:"rgba(51,255,51,0.45)"}>
          <TopShowsInside shows={v.topShows} accent={i===0?C.orange:C.cyan}/>
        </ExpandCard>
      ))}
    </div>
  );
}

function CommStates(){
  const sorted=Object.entries(commStatesData).sort(([,a],[,b])=>b.avg-a.avg);
  return(
    <div>
      <KPIGrid items={[
        {label:"STATES COVERED",value:"38",color:C.cyan},
        {label:"TOP STATE",value:"WA",color:C.orange},
        {label:"TOP STATE AVG",value:"4.78",color:C.green},
        {label:"BOTTOM STATE",value:"RI",color:C.cyan},
      ]}/>
      <Heatmap data={Object.fromEntries(Object.entries(commStatesData).map(([k,v])=>[k,v.avg]))} title="COMMUNITY RATINGS BY STATE"/>
      <SecLabel>STATE RANKINGS — TAP TO EXPAND</SecLabel>
      {sorted.map(([st,d],i)=>(
        <ExpandCard key={st} name={st} avg={d.avg} count={d.shows}
          accent={i===0?C.orange:i<3?C.cyan:"rgba(51,255,51,0.4)"}
          sub={`${d.shows} shows · top: ${d.topVenue}`}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div>
              <div style={{fontFamily:disp,fontSize:"0.46rem",color:C.mutedColor,letterSpacing:"2px",marginBottom:4}}>TOP VENUE</div>
              <div style={{fontFamily:mono,fontSize:"0.9rem",color:C.cyan}}>{d.topVenue}</div>
            </div>
            <div>
              <div style={{fontFamily:disp,fontSize:"0.46rem",color:C.mutedColor,letterSpacing:"2px",marginBottom:4}}>HIGHEST RATED SHOW</div>
              <div style={{fontFamily:mono,fontSize:"0.9rem",color:C.white}}>{d.topShow}</div>
            </div>
          </div>
        </ExpandCard>
      ))}
    </div>
  );
}

// ── PROFILE MODAL ─────────────────────────────────────────────
function ProfileModal({onClose}){
  const [sec,setSec]=useState("info");
  return(
    <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.93)",
      display:"flex",flexDirection:"column",...scan}}>
      <div style={{background:C.panel,borderBottom:`1px solid rgba(51,255,51,0.2)`,
        padding:"13px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontFamily:disp,fontSize:"0.62rem",color:C.cyan,letterSpacing:"3px"}}>◈ PROFILE</div>
        <button onClick={onClose} style={{background:"transparent",border:`1px solid rgba(51,255,51,0.25)`,
          color:C.labelColor,fontFamily:disp,fontSize:"0.52rem",letterSpacing:"2px",padding:"5px 10px",cursor:"pointer"}}>
          ✕ CLOSE
        </button>
      </div>
      <div style={{background:C.panel,borderBottom:`1px solid rgba(51,255,51,0.1)`,
        borderLeft:`3px solid ${C.cyan}`,padding:"18px 18px 14px"}}>
        <div style={{fontFamily:disp,fontSize:"0.48rem",color:C.labelColor,letterSpacing:"3px",marginBottom:6}}>USERNAME</div>
        <div style={{fontFamily:mono,fontSize:"1.65rem",color:C.cyan,letterSpacing:"3px",lineHeight:1,
          marginBottom:5,textShadow:`0 0 16px ${C.cyan}33`}}>{ME.username}</div>
        <div style={{fontFamily:mono,fontSize:"0.72rem",color:C.mutedColor,marginBottom:14}}>{ME.email}</div>
        <div style={{display:"flex",gap:20}}>
          {[{l:"RATED",v:ME.shows_rated,c:C.orange},{l:"ATTENDED",v:ME.attended,c:C.cyan},
            {l:"AVG",v:ME.avg,c:C.orange},{l:"STREAK",v:`⚡${ME.streak}`,c:C.orange}].map(k=>(
            <div key={k.l}>
              <div style={{fontFamily:disp,fontSize:"0.95rem",color:k.c,letterSpacing:1}}>{k.v}</div>
              <div style={{fontFamily:disp,fontSize:"0.42rem",color:C.labelColor,letterSpacing:"2px"}}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",background:C.bg,borderBottom:`1px solid rgba(51,255,51,0.1)`}}>
        {[["info","INFO"],["badges","BADGES"],["settings","SETTINGS"]].map(([k,l])=>(
          <button key={k} onClick={()=>setSec(k)} style={{flex:1,padding:"10px 0",fontFamily:disp,
            fontSize:"0.49rem",letterSpacing:"2px",color:sec===k?C.cyan:C.labelColor,
            background:"transparent",border:"none",
            borderBottom:sec===k?`2px solid ${C.cyan}`:"2px solid transparent",cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 16px 30px"}}>
        {sec==="info"&&(
          <Card accent={C.orange} pad="4px 14px 8px">
            {[["Phish.net Handle",ME.phishnet,C.cyan],["Favorite Song",ME.fav_song,C.orange],
              ["Favorite Venue",ME.fav_venue,C.orange],["First Show",ME.first_show,C.cyan]].map(([l,v,col],i,arr)=>(
              <div key={l} style={{padding:"13px 0",borderBottom:i<arr.length-1?`1px solid rgba(51,255,51,0.08)`:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                  <span style={{display:"inline-block",width:2,height:10,background:col,borderRadius:1}}/>
                  <span style={{fontFamily:disp,fontSize:"0.56rem",letterSpacing:"2.5px",color:col,opacity:0.9,textTransform:"uppercase"}}>{l}</span>
                </div>
                <div style={{fontFamily:mono,fontSize:"1rem",color:C.white,paddingLeft:9}}>{v}</div>
              </div>
            ))}
          </Card>
        )}
        {sec==="badges"&&(
          <div>
            <div style={{fontFamily:disp,fontSize:"0.48rem",color:C.labelColor,letterSpacing:"3px",marginBottom:10}}>
              {BADGES.filter(b=>b.earned).length} OF {BADGES.length} EARNED
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {BADGES.filter(b=>b.earned).map((b,i)=>(
                <div key={i} style={{background:C.raised,border:`1px solid ${b.color}55`,
                  borderTop:`2px solid ${b.color}`,padding:"14px 10px",
                  display:"flex",flexDirection:"column",alignItems:"center",gap:6,
                  boxShadow:`0 0 16px ${b.color}22`}}>
                  <span style={{fontSize:"1.4rem",filter:`drop-shadow(0 0 6px ${b.color}99)`}}>{b.glyph}</span>
                  <div style={{fontFamily:disp,fontSize:"0.48rem",color:b.color,letterSpacing:"1.5px",textAlign:"center"}}>{b.label}</div>
                  <div style={{fontFamily:mono,fontSize:"0.62rem",color:C.labelColor,textAlign:"center",lineHeight:1.4}}>{b.sub}</div>
                </div>
              ))}
            </div>
            <div style={{fontFamily:disp,fontSize:"0.46rem",color:C.mutedColor,letterSpacing:"3px",marginBottom:8}}>LOCKED</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {BADGES.filter(b=>!b.earned).map((b,i)=>(
                <div key={i} style={{background:C.panel,border:`1px solid rgba(51,255,51,0.08)`,
                  padding:"14px 10px",display:"flex",flexDirection:"column",
                  alignItems:"center",gap:6,opacity:0.45}}>
                  <span style={{fontSize:"1.4rem",filter:"grayscale(1)"}}>{b.glyph}</span>
                  <div style={{fontFamily:disp,fontSize:"0.48rem",color:C.labelColor,letterSpacing:"1.5px",textAlign:"center"}}>{b.label}</div>
                  <div style={{fontFamily:mono,fontSize:"0.62rem",color:C.mutedColor,textAlign:"center",lineHeight:1.4}}>{b.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {sec==="settings"&&(
          <div>
            <Card accent={C.cyan} pad="4px 14px 8px" mb={12}>
              {[["Phish.net Handle",ME.phishnet,C.cyan],["Email",ME.email,C.cyan]].map(([l,v,col],i,arr)=>(
                <div key={l} style={{padding:"13px 0",borderBottom:i<arr.length-1?`1px solid rgba(51,255,51,0.08)`:"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                    <span style={{display:"inline-block",width:2,height:10,background:col,borderRadius:1}}/>
                    <span style={{fontFamily:disp,fontSize:"0.56rem",letterSpacing:"2.5px",color:col,textTransform:"uppercase"}}>{l}</span>
                  </div>
                  <div style={{fontFamily:mono,fontSize:"1rem",color:C.white,paddingLeft:9}}>{v}</div>
                </div>
              ))}
            </Card>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <GlowBtn color={C.orange}>✎ EDIT PROFILE</GlowBtn>
              <GlowBtn color={C.cyan} href="https://buymeacoffee.com/mpgink">◈ SUPPORT THE PHREEZER</GlowBtn>
              <GlowBtn color={C.red} small>SIGN OUT</GlowBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SUB TABS ──────────────────────────────────────────────────
function SubTabs({tabs,active,setActive}){
  return(
    <div style={{display:"flex",background:C.bg,borderBottom:`1px solid rgba(51,255,51,0.1)`,
      overflowX:"auto",scrollbarWidth:"none",marginBottom:14}}>
      {tabs.map(([k,l])=>(
        <button key={k} onClick={()=>setActive(k)} style={{flexShrink:0,padding:"9px 13px",
          fontFamily:disp,fontSize:"0.46rem",letterSpacing:"1.5px",
          color:active===k?C.cyan:C.labelColor,background:"transparent",border:"none",
          borderBottom:active===k?`2px solid ${C.cyan}`:"2px solid transparent",
          cursor:"pointer",whiteSpace:"nowrap"}}>{l}</button>
      ))}
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]=useState("my-phreezer");
  const [myTab,setMyTab]=useState("my-shows");
  const [commTab,setCommTab]=useState("leaderboard");
  const [profile,setProfile]=useState(false);

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:mono,...scan}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        button{font-family:inherit;}
        ::-webkit-scrollbar{display:none;}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      `}</style>
      {/* Marquee */}
      <div style={{background:C.bg,padding:"5px 0",overflow:"hidden",borderBottom:`1px solid rgba(51,255,51,0.12)`}}>
        <div style={{fontFamily:disp,fontSize:"0.48rem",color:C.orange,letterSpacing:"3px",
          whiteSpace:"nowrap",animation:"marquee 22s linear infinite",display:"inline-block",width:"200%"}}>
          DON'T SUCK AT PHISH &nbsp;◈&nbsp; DON'T SUCK AT PHISH &nbsp;◈&nbsp; DON'T SUCK AT PHISH &nbsp;◈&nbsp; DON'T SUCK AT PHISH &nbsp;◈&nbsp; DON'T SUCK AT PHISH &nbsp;◈&nbsp;
        </div>
      </div>
      {/* Header */}
      <div style={{background:C.bg,borderBottom:`1px solid rgba(51,255,51,0.2)`,
        padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontFamily:disp,fontSize:"0.85rem",color:C.green,letterSpacing:3,fontWeight:900}}>❄ THE PHREEZER</div>
        <button onClick={()=>setProfile(true)} style={{width:38,height:38,borderRadius:"50%",
          border:`1.5px solid ${C.cyan}`,background:"transparent",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontFamily:disp,fontSize:"0.62rem",color:C.cyan,cursor:"pointer",
          boxShadow:`0 0 10px ${C.cyan}44`}}>MP</button>
      </div>
      {/* Main tabs */}
      <div style={{display:"flex",background:C.bg,borderBottom:`1px solid rgba(51,255,51,0.12)`}}>
        {[["scorecard","SCORECARD"],["my-phreezer","MY PHREEZER"],["community","COMMUNITY"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"11px 4px",
            fontFamily:disp,fontSize:"0.46rem",letterSpacing:"1.5px",
            color:tab===k?C.cyan:C.labelColor,background:"transparent",border:"none",
            borderBottom:tab===k?`2px solid ${C.cyan}`:"2px solid transparent",cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      <div style={{padding:"12px 12px 100px"}}>
        {tab==="scorecard"&&(
          <div style={{fontFamily:disp,fontSize:"0.6rem",color:C.labelColor,letterSpacing:"2px",padding:"40px 0",textAlign:"center"}}>
            ◈ SCORECARD — see v3 mock
          </div>
        )}
        {tab==="my-phreezer"&&(
          <>
            <SubTabs tabs={[["my-shows","MY SHOWS"],["my-songs","MY SONGS"],["my-venues","MY VENUES"],["my-states","MY STATES"]]} active={myTab} setActive={setMyTab}/>
            {myTab==="my-shows" &&<MyShows/>}
            {myTab==="my-songs" &&<MySongs/>}
            {myTab==="my-venues"&&<MyVenues/>}
            {myTab==="my-states"&&<MyStates/>}
          </>
        )}
        {tab==="community"&&(
          <>
            <SubTabs tabs={[["leaderboard","LEADERBOARD"],["top-shows","TOP SHOWS"],["top-songs","TOP SONGS"],["top-venues","TOP VENUES"],["top-states","TOP STATES"]]} active={commTab} setActive={setCommTab}/>
            {commTab==="leaderboard"&&<CommLeaderboard/>}
            {commTab==="top-shows"  &&<CommShows/>}
            {commTab==="top-songs"  &&<CommSongs/>}
            {commTab==="top-venues" &&<CommVenues/>}
            {commTab==="top-states" &&<CommStates/>}
          </>
        )}
      </div>
      {profile&&<ProfileModal onClose={()=>setProfile(false)}/>}
    </div>
  );
}
