# Phreezer Session Log

## Last Session — Jun 6 2026

### What Was Done
- Logo assets integrated (phreezer-logo.png, phreezer-snowflake.png)
- Full page loader swapped from ❄ emoji to real snowflake PNG with spin+glow
- Top nav tabs: bigger, bolder, evenly spread, active tab cyan glow
- Sub nav: evenly spread (flex:1)
- Playfair Display serif font removed — show dates now use Orbitron
- KPI grid forced to 4-col on all screen sizes
- Accessibility pass: ambient button glows, bigger venue/city text, bigger KPI values
- My Shows page restructured into 3 sections:
  1. QUICK STATS header (orange) + IMPORT button inline
  2. KPI 4x1 row + progress bars + badges + top stats + DIVE DEEP link
  3. ON THIS DAY (cyan left border, big date)
  4. MY SHOWS section with filter pills + sort row
- ATTENDED/RATED toggle buttons removed (redundant)
- Mock saved at: docs/myshows_mock.html

### Known Issues / What Didn't Land
- Many App.jsx changes partially failed — App.jsx is 4000+ lines, GitHub API string replacements drift and fail silently
- Sub-nav still truncating labels on mobile (flex:1 may not be applying correctly)
- KPI inline styles vs CSS class conflict (My Shows KPIs use inline styles, not .kpi-card classes)
- Show card dates still rendering in script/serif on some cards (show-date-serif class applied inconsistently)

---

## NEXT SESSION — REFACTOR PLAN

### Priority 1: Split App.jsx into component files

App.jsx is ~4200 lines. Split into:

```
client/src/
  App.jsx                  (routing shell only, ~200 lines)
  components/
    KPICards.jsx           (QUICK STATS section — KPI row + progress bars)
    OTDCard.jsx            (On This Day card)
    ShowCard.jsx           (individual show card, expandable)
    MyShowsTab.jsx         (full My Shows tab)
    MySongsTab.jsx
    MyVenuesTab.jsx
    MyStatesTab.jsx
    ScorecardTab.jsx
    CommunityTab.jsx
    DeepPhreezeTab.jsx
    FeedbackModal.jsx
    ImportModal.jsx
    ProfileModal.jsx
    FullPageLoader.jsx
    PassiveFeedbackButton.jsx
```

### Priority 2: Move ALL inline styles to index.css

Every inline `style={{}}` block should become a CSS class. This is why changes don't take — CSS edits don't affect inline styles.

Key culprits:
- KPICards — entire component is inline styles
- MyShowsTab controls — inline styles throughout
- OTDCard — partially inline

After refactor, CSS-only changes will work reliably.

### Priority 3: Implement the mock design (docs/myshows_mock.html)

Once refactored, implement these design changes cleanly:

**Top nav:** flex:1 spread, font 0.62rem bold, active = cyan + text-shadow glow

**My Shows structure:**
```
[QUICK STATS header (orange)] [↓ IMPORT button]
[KPI 4x1 row — ATT / RATED / AVG / REV]
[Progress bars — Shows Rated / Reviewed / Streak]
[Badges row if any]
[Top stats — Top Song / Most Visited / First Show]
[❄ DIVE INTO DEEP PHREEZE ▶ — subtle link]
─────────────────────────────────────────
[ON THIS DAY — cyan left border]
[Big date, venue, city, RATE + PLAY buttons]
─────────────────────────────────────────
[◈ MY SHOWS]
[ALL | REVIEWED | RATED | UNRATED | ★ FAV]
[SORT: DATE↓ | DATE↑ | SCORE | UNRATED]
[show cards — compact, expand on tap]
```

**Show cards (compact default):**
- Date left (Orbitron, bold)
- Venue + city center
- Score or — right
- Play button inline
- Expand on tap → full current card view

**Buttons — ambient glow at rest:**
- Orange buttons: `box-shadow: 0 0 10px rgba(255,102,0,0.3)`
- Cyan buttons: `box-shadow: 0 0 10px rgba(0,224,208,0.2)`
- Green buttons: `box-shadow: 0 0 8px rgba(51,255,51,0.2)`

### Priority 4: Claude Code

Use Claude Code for the refactor — no GitHub API roundtrips, reliable multi-file edits.

```bash
cd ~/path/to/Phish_Scorecard
claude
```

Tell it: "Refactor App.jsx into component files per SESSION_LOG.md plan"

---

## Credentials (rotate each session)
- GitHub token: rotate at session start
- Vercel project: prj_onaoLl2oL7lnxrd8LTKffGprHQQy | team: team_txjg87rhKGXKGjIRZFfoUOoJ
- Neon (pooled): postgresql://neondb_owner:npg_7HTio3yXbhcP@ep-broad-shadow-aqjnr5ks-pooler.c-8.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
