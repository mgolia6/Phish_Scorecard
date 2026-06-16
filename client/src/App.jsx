import React, { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';

import { useApi } from './useApi';
import { API } from './utils';
import { FeedbackModal, PassiveFeedbackButton } from './components/FeedbackModal';
import { WelcomeCelebration } from './components/Celebrations';
import { FullPageLoader, MikeError } from './components/FullPageLoader';
import { TandCModal, AuthModal } from './components/AuthModals';
import { OnboardingFlow, ProfileSetupModal } from './components/OnboardingFlow';
import { Sidebar } from './components/Sidebar';
import { ScorecardTab } from './components/ScorecardTab';
import { MyShowsTab } from './components/MyShowsTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { MySongsTab } from './components/MySongsTab';
import { MyVenuesTab } from './components/MyVenuesTab';
import { MyStatesTab } from './components/MyStatesTab';
import { MyPhriends } from './components/MyPhriends';
import { DeepPhreezeTab } from './components/DeepPhreezeTab';
import { CommunityTab } from './components/CommunityTab';
import { AdminTab } from './components/AdminTab';
import { ProfileTab } from './components/ProfileTab';
import { ProfileModal, PhreezerAvatar } from './components/ProfileModal';
import { EbenezerDrawer, EbenezerRail } from './components/EbenezerDrawer';
import { TourGuide } from './components/TourGuide';
import { Analytics, identifyUser, resetIdentity } from './analytics';

export default function App() {
  const [tab, setTab] = useState('scorecard'); // will be overridden on user load
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [messages, setMessages] = useState([]);
  const [mikeError, setMikeError] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [showTandC, setShowTandC] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [pendingImportOnMyShows, setPendingImportOnMyShows] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showFirstShowPrompt, setShowFirstShowPrompt] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(null); // 'post_rating' | 'week1' | null
  const [rateShowDate, setRateShowDate] = useState(null);
  // Scorecard overlay — replaces tab navigation for rating
  const [scorecardOverlay, setScorecardOverlay] = useState(false);
  const [scorecardOverlayDate, setScorecardOverlayDate] = useState(null);
  const [scorecardOverlayOrigin, setScorecardOverlayOrigin] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileInitSection, setProfileInitSection] = useState('phish');
  const [headerHeight, setHeaderHeight] = useState(132);
  // Ebenezer — shared across mobile drawer + desktop rail
  const [ebenHistory, setEbenHistory] = useState([]);
  const [ebenLoading, setEbenLoading] = useState(false);
  const [ebenError, setEbenError] = useState(null);
  const [ebenInput, setEbenInput] = useState('');
  const [ebenOpen, setEbenOpen] = useState(false);     // mobile drawer
  const openEbenezerDrawer = () => { setEbenOpen(true); Analytics.ebenezerOpened('drawer'); };
  const [ebenRailOpen, setEbenRailOpen] = useState(true); // desktop rail
  const [showTour, setShowTour] = useState(false);
  const [profileTapped, setProfileTapped] = useState(false);
  const stickyHeaderRef = useRef(null);
  const api = useApi();

  // Track tab views
  useEffect(() => {
    Analytics.tabViewed(tab);
  }, [tab]);

  const showMessage = useCallback((text, type = 'info') => {
    const id = Date.now() + Math.random();
    setMessages(prev => [...prev, { id, text, type }]);
    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 4000);
  }, []);

  const showError = useCallback((text) => setMikeError(text), []);

  useEffect(() => {
    const token = localStorage.getItem('phish_token');
    if (!token) return;
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    }).then(async res => {
      if (res.status === 401) {
        localStorage.removeItem('phish_token');
        setUser(null);
        return;
      }
      if (!res.ok) return; // non-401 error — keep token, stay logged in
      const u = await res.json();
      setUser(u);
      identifyUser(u);
      setProfileTapped(false); // reset pulse on every session load
      setTab(!u.tandc_accepted ? 'scorecard' : 'my-shows');
      if (!u.tandc_accepted) {
        setShowTandC(true);
      } else if (!u.onboarding_complete) {
        // Onboarding was reset — re-trigger T&C → profile setup flow
        setShowTandC(true);
      } else if (!sessionStorage.getItem('phreezer_welcomed')) {
        sessionStorage.setItem('phreezer_welcomed', '1');
        setShowWelcome(true);
      }
      // Week-1 feedback trigger
      if (u.created_at && u.onboarding_complete) {
        const daysSince = (Date.now() - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24);
        const alreadyDone = localStorage.getItem('phreezer_week1_feedback_done');
        if (daysSince >= 7 && !alreadyDone) {
          localStorage.setItem('phreezer_week1_feedback_done', '1');
          setTimeout(() => setFeedbackModal('week1'), 2000);
        }
      }
    }).catch(() => {}); // network failure — keep token
  }, []);

  const handleTandCAccept = async () => {
    setShowTandC(false);
    try {
      await api.post('/auth/accept?field=tandc', {});
      setUser(u => ({ ...u, tandc_accepted: true }));
    } catch (e) {}
    // Show profile setup for new users (onboarding is queued after)
    if (!user?.onboarding_complete) {
      setShowProfileSetup(true);
    }
  };

  const handleAuthSuccess = (u, isNewUser = false) => {
    setUser(u);
    setShowAuth(false);
    setProfileTapped(false); // reset pulse on every login
    if (isNewUser) { Analytics.registered(); } else { Analytics.loginSuccess(); }
    identifyUser(u);
    if (!u.tandc_accepted) {
      setShowTandC(true);
      if (isNewUser) {
        setTimeout(() => setShowOnboarding(true), 100);
      }
    } else if (isNewUser && !u.onboarding_complete) {
      setShowOnboarding(true);
    } else if (!u.onboarding_complete) {
      // Returning user who reset onboarding — re-trigger profile setup
      setShowTandC(true);
    } else if (!isNewUser) {
      setShowWelcome(true);
    }
  };

  const handleLogout = () => { localStorage.removeItem('phish_token'); setUser(null); setTab('scorecard'); Analytics.loggedOut(); resetIdentity(); };
  const openAuth = (mode = 'login') => { setAuthMode(mode); setShowAuth(true); };

  // Measure sticky header height dynamically
  useEffect(() => {
    const el = stickyHeaderRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setHeaderHeight(el.offsetHeight);
    });
    ro.observe(el);
    setHeaderHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // Open scorecard as overlay — keeps user in their current tab
  const handleRateShow = (showDate) => {
    setScorecardOverlayDate(showDate);
    setScorecardOverlayOrigin(tab);
    setScorecardOverlay(true);
    Analytics.scorecardOpened(showDate, tab);
  };

  const [kpiRefreshKey, setKpiRefreshKey] = useState(0);
  const closeScorecardOverlay = () => {
    setScorecardOverlay(false);
    setScorecardOverlayDate(null);
    setScorecardOverlayOrigin(null);
    setKpiRefreshKey(k => k + 1); // force KPI refresh
  };

  // After onboarding, navigate to My Shows with import panel open
  const handleProfileSetupComplete = () => {
    setShowProfileSetup(false);
    if (!user?.onboarding_complete) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingImport = async () => {
    setShowOnboarding(false);
    try {
      await api.post('/auth/accept?field=onboarding', {});
      setUser(u => ({ ...u, onboarding_complete: true }));
    } catch (e) {}
    setPendingImportOnMyShows(true);
    setTimeout(() => setTab('my-shows'), 100);
    // Tour fires server-side — check user flag not localStorage
    setShowTour(true);
    Analytics.tourStarted();
  };

  const handleOnboardingScorecard = async () => {
    setShowOnboarding(false);
    try {
      await api.post('/auth/accept?field=onboarding', {});
      setUser(u => ({ ...u, onboarding_complete: true }));
    } catch (e) {}
    setTab('my-shows');
    setTimeout(() => setShowTour(true), 600);
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    try {
      await api.post('/auth/accept?field=onboarding', {});
      setUser(u => ({ ...u, onboarding_complete: true }));
    } catch (e) {}
    setShowFirstShowPrompt(true);
    setTimeout(() => setShowTour(true), 800);
  };

  const renderMain = (isMobile = false) => (
    <>
      {tab === 'scorecard' && (
        <ScorecardTab
          api={api}
          showMessage={showMessage}
          showError={showError}
          onAuthRequired={() => openAuth('login')}
          initialShowDate={rateShowDate}
          onShowLoaded={() => setRateShowDate(null)}
          onFeedbackTrigger={setFeedbackModal}
        />
      )}
      {tab === 'my-shows' && user && (
        <MyShowsTab
          api={api}
          showMessage={showMessage}
          showError={showError}
          onRateShow={handleRateShow}
          openImportOnMount={pendingImportOnMyShows}
          kpiRefreshKey={kpiRefreshKey}
          onDeepPhreeze={() => setTab('my-deep-phreeze')}
        />
      )}
      {tab === 'analytics'  && user && <AnalyticsTab  api={api} showMessage={showMessage} showError={showError} />}
      {tab === 'my-songs'      && user && <MySongsTab   api={api} showMessage={showMessage} showError={showError} />}
      {tab === 'my-venues'     && user && <MyVenuesTab  api={api} showMessage={showMessage} showError={showError} />}
      {tab === 'my-states'     && user && <MyStatesTab  api={api} showMessage={showMessage} showError={showError} />}
      {tab === 'my-phriends'      && user && <MyPhriends      api={api} showMessage={showMessage} showError={showError} />}
      {tab === 'my-deep-phreeze'  && user && <DeepPhreezeTab  api={api} showMessage={showMessage} showError={showError} onOpenScorecard={handleRateShow} />}
      {tab === 'feed'              && <CommunityTab  api={api} subTab="feed"         onRateShow={handleRateShow} />}
      {tab === 'community'         && <CommunityTab  api={api} subTab="leaderboard"  onRateShow={handleRateShow} />}
      {tab === 'top-shows'         && <CommunityTab  api={api} subTab="top-shows"    onRateShow={handleRateShow} />}
      {tab === 'top-songs'         && <CommunityTab  api={api} subTab="top-songs"    onRateShow={handleRateShow} />}
      {tab === 'top-venues'        && <CommunityTab  api={api} subTab="top-venues"   onRateShow={handleRateShow} />}
      {tab === 'top-states'        && <CommunityTab  api={api} subTab="top-states"   onRateShow={handleRateShow} />}
      {tab === 'phriend-overlap'   && <CommunityTab  api={api} subTab="phriend-overlap" onRateShow={handleRateShow} />}
      {tab === 'profile'    && user && <ProfileTab api={api} user={user} />}
      {tab === 'admin' && user?.is_admin && <AdminTab api={api} showMessage={showMessage} showError={showError} />}
    </>
  );

  return (
    <div className="app-shell">
      {mikeError && <MikeError message={mikeError} onClose={() => setMikeError(null)} />}
      <div className="messages-container">
        {messages.map(m => <div key={m.id} className={`message ${m.type}`}>{m.text}</div>)}
      </div>

      {/* Welcome back celebration */}
      {showWelcome && !showTandC && !showOnboarding && (
        <WelcomeCelebration username={user?.username} onDone={() => setShowWelcome(false)} />
      )}

      {/* T&C fires first */}
      {showTandC && !showOnboarding && <TandCModal onAccept={handleTandCAccept} />}

      {/* Profile setup fires after T&C for new users */}
      {showProfileSetup && !showTandC && !showOnboarding && (
        <ProfileSetupModal api={api} onComplete={handleProfileSetupComplete} />
      )}

      {/* Onboarding fires after T&C for new users */}
      {showOnboarding && !showTandC && !showProfileSetup && (
        <OnboardingFlow
          user={user}
          onComplete={handleOnboardingComplete}
          onStartImport={handleOnboardingImport}
          onGoToScorecard={handleOnboardingScorecard}
        />
      )}

      {/* DESKTOP LAYOUT: sidebar + main */}
      <div className="desktop-layout">
        <Sidebar
          tab={tab}
          setTab={setTab}
          user={user}
          onLogin={openAuth}
          onLogout={handleLogout}
          expanded={sidebarExpanded}
          setExpanded={setSidebarExpanded}
          onOpenProfile={() => { setProfileInitSection('phish'); setShowProfileModal(true); }}
          onFeedback={() => setFeedbackModal('passive')}
        />
        <div className="main-area">
          <div className="marquee-bar">
            <span className="marquee-track" onClick={() => {
                const now = Date.now();
                if (!window._marqueeTaps) window._marqueeTaps = [];
                window._marqueeTaps = window._marqueeTaps.filter(t => now - t < 800);
                window._marqueeTaps.push(now);
                if (window._marqueeTaps.length >= 3) {
                  window._marqueeTaps = [];
                  setProfileInitSection('about');
                  setShowProfileModal(true);
                }
              }} style={{ cursor: 'default' }}>
              DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp; DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp; DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp; DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp;
            </span>
          </div>
          <div className="container">
            {renderMain()}
          </div>
        </div>
      {user && (
        <div data-tour="ebenezer" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <EbenezerRail
            history={ebenHistory}
            setHistory={setEbenHistory}
            loading={ebenLoading}
            setLoading={setEbenLoading}
            error={ebenError}
            setError={setEbenError}
            input={ebenInput}
            setInput={setEbenInput}
            railOpen={ebenRailOpen}
            setRailOpen={setEbenRailOpen}
          />
        </div>
      )}
      </div>

      {/* MOBILE LAYOUT: original header + tabs */}
      <div className="mobile-layout">
        <div className="mobile-sticky-header" ref={stickyHeaderRef}>
          <div className="marquee-bar">
            <span className="marquee-track">
              DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp; DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp; DON'T SUCK AT PHISH &nbsp;&nbsp;◈&nbsp;&nbsp;
            </span>
          </div>
          <header className="app-header">
            <div className="header-left">
              <div className="header-title">
                <img
                  src="/assets/phreezer-logo.png"
                  alt="The Phreezer"
                  className="mobile-header-logo"
                  onClick={() => {
                    if (!user?.is_admin) return;
                    const now = Date.now();
                    if (!window._logoTaps) window._logoTaps = [];
                    window._logoTaps = window._logoTaps.filter(t => now - t < 800);
                    window._logoTaps.push(now);
                    if (window._logoTaps.length >= 3) {
                      window._logoTaps = [];
                      setTab('admin');
                    }
                  }}
                  style={{ cursor: user?.is_admin ? 'pointer' : 'default' }}
                />
              </div>
            </div>
            <div className="header-right">
              <div className="header-auth">
                {user ? (
                  <button
                    className={`avatar-btn${profileTapped ? '' : ' avatar-pulse'}`}
                    onClick={() => { setShowProfileModal(true); setProfileTapped(true); }}
                    aria-label="Profile"
                    style={{ background: 'transparent', border: '1.5px solid rgba(0,224,208,0.4)', borderRadius: '50%', width: 44, height: 44, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(0,224,208,0.2)' }}
                  >
                    <PhreezerAvatar seed={user.avatar_icon || 'phreeze'} size={34} color="#00ffff" />
                  </button>
                ) : (
                  <><button onClick={() => openAuth('login')}>LOGIN</button><button className="btn-primary" onClick={() => openAuth('signup')}>REGISTER</button></>
                )}
              </div>
            </div>
          </header>
          <nav className="tab-nav">
            {user && <>
              <button className={`tab-btn ${['my-shows','my-songs','my-venues','my-states','my-phriends','my-deep-phreeze','analytics'].includes(tab) ? 'active' : ''}`} onClick={() => setTab('my-shows')}>MY PHREEZER</button>
              <button className={`tab-btn ${['feed','community','leaderboard','top-shows','top-songs','top-venues','top-states','phriend-overlap'].includes(tab) ? 'active' : ''}`} onClick={() => setTab('feed')}>COMMUNITY</button>
            </>}
            <button className={`tab-btn ${tab === 'scorecard' ? 'active' : ''}`} onClick={() => setTab('scorecard')}>SCORECARD</button>
          </nav>
          {user && ['my-shows','my-songs','my-venues','my-states','my-phriends','my-deep-phreeze','analytics'].includes(tab) && (
            <div className="sub-tab-nav">
              <button className={`sub-tab-btn ${tab === 'my-shows'  ? 'active' : ''}`} onClick={() => setTab('my-shows')}>MY SHOWS</button>
              <button className={`sub-tab-btn ${tab === 'my-songs'  ? 'active' : ''}`} onClick={() => setTab('my-songs')}>MY SONGS</button>
              <button className={`sub-tab-btn ${tab === 'my-venues' ? 'active' : ''}`} onClick={() => setTab('my-venues')}>MY VENUES</button>
              <button className={`sub-tab-btn ${tab === 'my-states' ? 'active' : ''}`} onClick={() => setTab('my-states')}>MY STATES</button>
              <button className={`sub-tab-btn ${tab === 'my-phriends' ? 'active' : ''}`} onClick={() => setTab('my-phriends')}>MY PHRIENDS</button>
              <button className={`sub-tab-btn ${tab === 'my-deep-phreeze' ? 'active' : ''}`} onClick={() => setTab('my-deep-phreeze')}>DEEP PHREEZE</button>
            </div>
          )}
          {['feed','community','leaderboard','top-shows','top-songs','top-venues','top-states','phriend-overlap'].includes(tab) && (
            <div className="sub-tab-nav">
              <button className={`sub-tab-btn ${tab === 'feed'         ? 'active' : ''}`} onClick={() => setTab('feed')}>FEED</button>
              <button className={`sub-tab-btn ${tab === 'community'   ? 'active' : ''}`} onClick={() => setTab('community')}>LEADERBOARD</button>
              <button className={`sub-tab-btn ${tab === 'phriend-overlap' ? 'active' : ''}`} onClick={() => setTab('phriend-overlap')}>PHRIEND OVERLAP</button>
              <button className={`sub-tab-btn ${tab === 'top-shows'   ? 'active' : ''}`} onClick={() => setTab('top-shows')}>TOP SHOWS</button>
              <button className={`sub-tab-btn ${tab === 'top-songs'   ? 'active' : ''}`} onClick={() => setTab('top-songs')}>TOP SONGS</button>
              <button className={`sub-tab-btn ${tab === 'top-venues'  ? 'active' : ''}`} onClick={() => setTab('top-venues')}>TOP VENUES</button>
              <button className={`sub-tab-btn ${tab === 'top-states'  ? 'active' : ''}`} onClick={() => setTab('top-states')}>TOP STATES</button>
            </div>
          )}
        </div>
        <div className="mobile-scroll-body" style={{ paddingTop: headerHeight }}>
          <div className="container">
            {renderMain(true)}
          </div>
        </div>
      </div>

      {showAuth && <AuthModal mode={authMode} setMode={setAuthMode} onSuccess={handleAuthSuccess} onClose={() => setShowAuth(false)} />}
      {/* Scorecard overlay — full screen, preserves tab context */}
      {scorecardOverlay && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'var(--bg)', overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Back bar */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'var(--bg)', borderBottom: '1px solid rgba(51,255,51,0.15)',
            padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <button onClick={closeScorecardOverlay} style={{
              background: 'transparent', border: '1px solid rgba(51,255,51,0.25)',
              color: 'var(--green)', fontFamily: 'var(--font-display)', fontSize: '0.48rem',
              letterSpacing: '2px', padding: '6px 12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>◀ BACK</button>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--text-muted)', letterSpacing: '2px' }}>
              SCORECARD
            </span>
          </div>
          {/* Scorecard content */}
          <div style={{ flex: 1, padding: '12px 12px 100px' }}>
            <ScorecardTab
              api={api}
              showMessage={showMessage}
              showError={showError}
              onAuthRequired={() => openAuth('login')}
              initialShowDate={scorecardOverlayDate}
              onFeedbackTrigger={setFeedbackModal}
            />
          </div>
        </div>
      )}

      {showProfileModal && user && <ProfileModal user={user} api={api} onClose={() => { setShowProfileModal(false); setProfileInitSection('phish'); }} initialSection={profileInitSection} onAvatarChange={(icon) => setUser(u => ({ ...u, avatar_icon: icon }))} onLogout={handleLogout} />}

      {feedbackModal && (
        <FeedbackModal type={feedbackModal} api={api} onClose={() => setFeedbackModal(null)} />
      )}
      <PassiveFeedbackButton api={api} />

      {showTour && (
        <TourGuide
          onComplete={async () => {
            setShowTour(false);
            // Mark tour complete server-side so admin can reset it
            try { await api.post('/auth/accept?field=tour', {}); } catch (e) {}
          }}
          setTab={setTab}
        />
      )}

      {showFirstShowPrompt && (
        <div className="modal-overlay" style={{ zIndex: 750 }}>
          <div className="modal" style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>❄</div>
            <div className="modal-title" style={{ fontSize: '1rem', letterSpacing: '3px' }}>LET'S GO BACKWARDS</div>
            <p style={{ fontSize: '0.78rem', color: 'rgba(51,255,51,0.65)', lineHeight: 1.7, margin: '16px 0 24px', letterSpacing: '0.5px' }}>
              Take a trip down memory lane. Rate the first show you ever attended — then keep going backwards down the number line.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '13px' }}
                onClick={() => {
                  setShowFirstShowPrompt(false);
                  setScorecardOverlay(true);
                  setScorecardOverlayOrigin('my-shows');
                }}
              >
                ◈ RATE MY FIRST SHOW
              </button>
              <button style={{ width: '100%', padding: '11px', fontSize: '0.6rem' }} onClick={() => setShowFirstShowPrompt(false)}>
                MAYBE LATER
              </button>
            </div>
          </div>
        </div>
      )}
      {user && <EbenezerDrawer
        history={ebenHistory}
        setHistory={setEbenHistory}
        loading={ebenLoading}
        setLoading={setEbenLoading}
        error={ebenError}
        setError={setEbenError}
        input={ebenInput}
        setInput={setEbenInput}
        open={ebenOpen}
        setOpen={(v) => { if (v) Analytics.ebenezerOpened('drawer'); setEbenOpen(v); }}
      />}
    </div>
  );
}













