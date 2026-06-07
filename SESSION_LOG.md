# Phreezer Session Log

## Last Session — Jun 7 2026

### What Was Done
- Full App.jsx refactor: 4,424-line monolith split into 26 component files
- New structure:
  - `client/src/utils.js` — shared constants + formatDate/Duration/filterByQuery
  - `client/src/useApi.js` — useApi hook
  - `client/src/components/` — 24 component files
  - `client/src/App.jsx` — ~435-line routing shell only
- Component file list:
  FeedbackModal.jsx, Celebrations.jsx, FullPageLoader.jsx, AuthModals.jsx,
  OnboardingFlow.jsx, Sidebar.jsx, KPICards.jsx, ScorecardHelpers.jsx,
  ScorecardTab.jsx, OTDCard.jsx, ShowCard.jsx, MyShowsTab.jsx,
  AnalyticsTab.jsx, ProfileTab.jsx, CommunityTab.jsx, AdminTab.jsx,
  Heatmap.jsx, MySongsTab.jsx, MyVenuesTab.jsx, MyStatesTab.jsx,
  DeepPhreezeTab.jsx, MyPhriends.jsx, ProfileModal.jsx, ScorecardHelpers.jsx
- Added onFeedbackTrigger prop threading through ScorecardTab
- Added onDeepPhreeze prop threading through KPICards -> MyShowsTab -> App
- Build: READY on Vercel (dpl_3P63pKDYd33xz1EpCwaMZhFo6nK3)

### Known Issues / What Didn't Land
- None from this session — refactor is clean

### Import path conventions going forward
- `utils.js` and `useApi.js` live at `src/` level
- All components live in `src/components/`
- Component imports of utils/useApi use `../utils` and `../useApi`
- Cross-component imports (same dir) use `./ComponentName`
- App.jsx imports components with `./components/ComponentName`

---

## NEXT SESSION PRIORITIES

1. Now that refactor is done and CSS edits will actually work:
   - Implement My Shows mock design from docs/myshows_mock.html
   - Move KPI inline styles to CSS classes
   - Confirm mobile sticky header fix is working

2. Logo integration (Phishook/Phreezer branding decision TBD)

3. COMMUNITY tab still a placeholder — flesh out

---

## Credentials (rotate each session)
- GitHub token: rotate at session start
- Vercel project: prj_onaoLl2oL7lnxrd8LTKffGprHQQy | team: team_txjg87rhKGXKGjIRZFfoUOoJ
- Neon (pooled): postgresql://neondb_owner:npg_7HTio3yXbhcP@ep-broad-shadow-aqjnr5ks-pooler.c-8.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
