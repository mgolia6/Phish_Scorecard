// analytics.js — Posthog + Sentry instrumentation for Phreezer
// Posthog key: set VITE_POSTHOG_KEY in Vercel env vars
// Sentry DSN:  set VITE_SENTRY_DSN in Vercel env vars

import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const IS_PROD = import.meta.env.PROD;

// ── Posthog init ──────────────────────────────────────────────────────────
export function initPosthog() {
  if (!POSTHOG_KEY) return; // no key = silent no-op in dev
  posthog.init(POSTHOG_KEY, {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,      // we do this manually per tab
    capture_pageleave: true,
    autocapture: false,           // explicit only — keeps noise down
    disable_session_recording: false,
  });
}

// ── Identity ──────────────────────────────────────────────────────────────
export function identifyUser(user) {
  if (!POSTHOG_KEY || !user) return;
  posthog.identify(String(user.id), {
    username: user.username,
    email: user.email,
    created_at: user.created_at,
  });
}

export function resetIdentity() {
  if (!POSTHOG_KEY) return;
  posthog.reset();
}

// ── Track helper ─────────────────────────────────────────────────────────
export function track(event, props = {}) {
  if (!POSTHOG_KEY) return;
  posthog.capture(event, props);
}

// ── Named events (use these from components) ─────────────────────────────
export const Analytics = {
  // Navigation
  tabViewed:        (tab)             => track('tab_viewed',           { tab }),
  
  // Auth
  loginSuccess:     ()                => track('login_success'),
  loginFailed:      ()                => track('login_failed'),
  registered:       ()                => track('registered'),
  loggedOut:        ()                => track('logged_out'),

  // Scorecard
  scorecardOpened:  (date, source)    => track('scorecard_opened',     { date, source }),
  ratingSubmitted:  (date, songCount) => track('rating_submitted',     { date, song_count: songCount }),
  songRated:        (song, rating)    => track('song_rated',           { song, rating }),
  vibeCheckOpened:  (date)            => track('vibe_check_opened',    { date }),

  // Audio
  audioPlayed:      (date, song)      => track('audio_played',         { date, song }),
  audioSeeked:      (date)            => track('audio_seeked',         { date }),

  // Ebenezer
  ebenezerOpened:   (surface)         => track('ebenezer_opened',      { surface }), // 'drawer' | 'rail'
  ebenezerMessage:  ()                => track('ebenezer_message_sent'),

  // My Shows / Import
  phishnetImport:   (showCount)       => track('phishnet_import',      { show_count: showCount }),
  attendanceToggled:(date, attending) => track('attendance_toggled',   { date, attending }),

  // Deep Phreeze
  deepPhreezeOpened: ()               => track('deep_phreeze_opened'),

  // Tour
  tourStarted:      ()                => track('tour_started'),
  tourCompleted:    ()                => track('tour_completed'),
  tourSkipped:      (step)            => track('tour_skipped',         { step }),

  // Profile
  profileOpened:    (tab)             => track('profile_opened',       { tab }),
  settingsSaved:    ()                => track('settings_saved'),

  // Shop
  etsyListingClicked: (item)          => track('etsy_listing_clicked', { item }),
  donationBannerViewed: ()            => track('donation_banner_viewed'),

  // Feedback
  feedbackSubmitted: (section)        => track('feedback_submitted',   { section }),
  feedbackModalShown:(trigger)        => track('feedback_modal_shown', { trigger }),

  // Community
  communityTabViewed: (subtab)        => track('community_tab_viewed', { subtab }),
};
