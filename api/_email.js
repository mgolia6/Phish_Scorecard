// Shared email sender + all Phreezer email templates
// From: Phreezer Support <phreezer.support@mpgink.com>

const FROM = 'Phreezer Support <phreezer.support@mpgink.com>';
const APP_URL = 'https://phreezer.mpgink.com';

export async function sendEmail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PHREEZER_RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// SHARED LAYOUT WRAPPER
// ─────────────────────────────────────────────────────────────
function layout(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Phreezer</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;min-height:100vh;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:500px;">

        <!-- HEADER -->
        <tr><td style="padding-bottom:4px;">
          <span style="font-family:monospace;font-size:22px;letter-spacing:8px;color:#00e0d0;font-weight:bold;">❄ PHREEZER</span>
        </td></tr>
        <tr><td style="padding-bottom:28px;">
          <span style="font-family:monospace;font-size:10px;letter-spacing:4px;color:rgba(0,224,208,0.5);">RATE. TRACK. RELIVE.</span>
        </td></tr>
        <tr><td style="border-top:1px solid rgba(0,224,208,0.2);padding-bottom:32px;"></td></tr>

        <!-- BODY -->
        ${body}

        <!-- FOOTER -->
        <tr><td style="border-top:1px solid rgba(51,255,51,0.1);padding-top:24px;padding-bottom:8px;"></td></tr>
        <tr><td>
          <p style="font-family:monospace;font-size:10px;color:rgba(255,255,255,0.2);line-height:1.9;margin:0;">
            You're receiving this because you have a Phreezer account.<br>
            Questions? Reply to this email or reach us at <a href="mailto:phreezer.support@mpgink.com" style="color:rgba(0,224,208,0.4);text-decoration:none;">phreezer.support@mpgink.com</a><br>
            <a href="${APP_URL}" style="color:rgba(0,224,208,0.4);text-decoration:none;">phreezer.mpgink.com</a> &nbsp;·&nbsp; Independent fan project. Not affiliated with Phish.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function heading(text, color = '#33ff33') {
  return `<tr><td style="padding-bottom:14px;">
    <span style="font-family:monospace;font-size:13px;letter-spacing:4px;color:${color};font-weight:bold;">${text}</span>
  </td></tr>`;
}

function body(text) {
  return `<tr><td style="padding-bottom:28px;">
    <p style="font-family:monospace;font-size:13px;line-height:1.9;color:rgba(255,255,255,0.65);margin:0;">${text}</p>
  </td></tr>`;
}

function button(label, url, color = '#ff6600') {
  return `<tr><td style="padding-bottom:36px;">
    <a href="${url}" style="display:inline-block;padding:16px 32px;background-color:${color};color:#000000;font-family:monospace;font-size:12px;font-weight:bold;letter-spacing:3px;text-decoration:none;">${label}</a>
  </td></tr>`;
}

function stat(label, value, color = '#00e0d0') {
  return `<td style="padding:12px 16px;background:rgba(0,0,0,0.4);border-top:2px solid ${color};text-align:center;">
    <div style="font-family:monospace;font-size:18px;color:${color};font-weight:bold;letter-spacing:2px;">${value}</div>
    <div style="font-family:monospace;font-size:9px;color:rgba(255,255,255,0.35);letter-spacing:2px;margin-top:4px;">${label}</div>
  </td>`;
}

// ─────────────────────────────────────────────────────────────
// 1. ONBOARDING — fires after email verification
// ─────────────────────────────────────────────────────────────
export function onboardingEmail(username) {
  const name = username || 'phan';
  const html = layout(`
    ${heading('YOU\'RE IN THE PHREEZER.')}
    ${body(`Hey ${name},<br><br>
There is a comfort that comes from being in a crowd of thousands at a Phish show that is hard to find anywhere else. That felt sense of joy and critical analysis — both at the same time — is what keeps it fresh.<br><br>
Phreezer is a place to record that. Not just that you were there, but how it landed. Song by song. Set by set. Show by show. The honest inspiration is ihoz.com — Phishtistics. The data this community has built over decades is extraordinary. Phreezer tries to give it a home that reflects how seriously we all take the music.<br><br>
Here\'s how to get started:`)}
    <!-- THREE PILLARS -->
    <tr><td style="padding-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:14px;background:rgba(0,0,0,0.4);border-left:3px solid #ff6600;vertical-align:top;padding-right:20px;">
            <div style="font-family:monospace;font-size:11px;font-weight:bold;letter-spacing:3px;color:#ff6600;margin-bottom:6px;">RATE.</div>
            <div style="font-family:monospace;font-size:12px;color:rgba(255,255,255,0.55);line-height:1.7;">Score every song 1–5. Pull up any show and rate the set song by song — the jams that went somewhere, the segues that landed, the songs that didn't need to be there.</div>
          </td>
        </tr>
        <tr><td style="padding-bottom:8px;"></td></tr>
        <tr>
          <td style="padding:14px;background:rgba(0,0,0,0.4);border-left:3px solid #00e0d0;vertical-align:top;padding-right:20px;">
            <div style="font-family:monospace;font-size:11px;font-weight:bold;letter-spacing:3px;color:#00e0d0;margin-bottom:6px;">TRACK.</div>
            <div style="font-family:monospace;font-size:12px;color:rgba(255,255,255,0.55);line-height:1.7;">If you have a Phish.net account, import your attendance in one tap. Your whole history shows up — every show you've been to, linked to live recordings on Phish.in.</div>
          </td>
        </tr>
        <tr><td style="padding-bottom:8px;"></td></tr>
        <tr>
          <td style="padding:14px;background:rgba(0,0,0,0.4);border-left:3px solid #33ff33;vertical-align:top;padding-right:20px;">
            <div style="font-family:monospace;font-size:11px;font-weight:bold;letter-spacing:3px;color:#33ff33;margin-bottom:6px;">RELIVE.</div>
            <div style="font-family:monospace;font-size:12px;color:rgba(255,255,255,0.55);line-height:1.7;">Deep Phreeze surfaces your patterns. Your top songs, your best shows, where you see them, when you see them. Stats that actually reflect how <em>you</em> hear the music.</div>
          </td>
        </tr>
      </table>
    </td></tr>
    ${button('RATE YOUR FIRST SHOW', APP_URL)}
    ${body(`One more thing: this is a beta. If something's broken, missing, or just not right — hit the feedback button inside the app. I read every one.<br><br>
Hopefully you enjoy it and it helps us all suck a little less at Phish.<br><br>
— mpgink`)}
  `);
  return { subject: 'You\'re in the Phreezer. Here\'s how to get started.', html };
}

// ─────────────────────────────────────────────────────────────
// 2. DAY 3 — no ratings yet
// ─────────────────────────────────────────────────────────────
export function day3NudgeEmail(username) {
  const name = username || 'phan';
  const html = layout(`
    ${heading('YOUR PHREEZER IS EMPTY.', '#00e0d0')}
    ${body(`Hey ${name},<br><br>
You signed up three days ago and haven't rated a show yet. That's fine — but you're missing out.<br><br>
Pick any show you remember well. A night that stuck with you. Rate it song by song — it takes about two minutes — and you'll immediately see your overall score, set breakdown, and a Vibe Check from Uncle Ebenezer.<br><br>
You don't need to start with your first show or your best show. Start with any show.`)}
    ${button('FIND A SHOW TO RATE', APP_URL)}
    ${body(`If you attended Phish shows and have a Phish.net account, you can import your full attendance history in one tap from your profile. Your whole archive — ready to rate.<br><br>
— mpgink`)}
  `);
  return { subject: 'Your Phreezer is still empty.', html };
}

// ─────────────────────────────────────────────────────────────
// 3. DAY 7 — has at least 1 rating, encourage deeper use
// ─────────────────────────────────────────────────────────────
export function day7EngageEmail(username, showsRated) {
  const name = username || 'phan';
  const html = layout(`
    ${heading('YOUR PHREEZER IS WARMING UP.', '#33ff33')}
    <tr><td style="padding-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        ${stat('SHOWS PHROZEN', showsRated, '#ff6600')}
      </tr></table>
    </td></tr>
    ${body(`Hey ${name},<br><br>
You've been in the Phreezer for a week. ${showsRated === 1 ? 'You\'ve rated your first show.' : `You've rated ${showsRated} shows.`} Good start.<br><br>
A few things worth exploring if you haven't yet:`)}
    <!-- FEATURE LIST -->
    <tr><td style="padding-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${[
          ['◈ DEEP PHREEZE', 'Your personal stats engine. Top songs, top venues, show frequency, era breakdown. The more you rate, the more it tells you.', '#ff6600'],
          ['◈ UNCLE EBENEZER', 'The AI agent in the corner. Ask him anything about your shows, your ratings, or Phish in general. He knows your history.', '#00e0d0'],
          ['◈ PHISH.NET IMPORT', 'If you have a Phish.net account, connect it in your profile. Your full attendance history imports in seconds.', '#33ff33'],
        ].map(([label, desc, color]) => `
        <tr>
          <td style="padding:12px 14px;background:rgba(0,0,0,0.35);border-left:2px solid ${color};margin-bottom:8px;display:block;">
            <div style="font-family:monospace;font-size:10px;font-weight:bold;letter-spacing:3px;color:${color};margin-bottom:5px;">${label}</div>
            <div style="font-family:monospace;font-size:12px;color:rgba(255,255,255,0.5);line-height:1.7;">${desc}</div>
          </td>
        </tr>
        <tr><td style="padding-bottom:6px;"></td></tr>`).join('')}
      </table>
    </td></tr>
    ${button('OPEN MY PHREEZER', APP_URL)}
    ${body(`Keep rating. The stats get interesting fast.<br><br>— mpgink`)}
  `);
  return { subject: `${showsRated} show${showsRated === 1 ? '' : 's'} phrozen. Your Phreezer is warming up.`, html };
}

// ─────────────────────────────────────────────────────────────
// 4. DAY 30 INACTIVE — hasn't logged in for 30 days
// ─────────────────────────────────────────────────────────────
export function day30ReengageEmail(username) {
  const name = username || 'phan';
  const html = layout(`
    ${heading('THE PHREEZER MISSES YOU.', '#ff6600')}
    ${body(`Hey ${name},<br><br>
You haven't been in the Phreezer in a while. No guilt — Phish has been on a break too.<br><br>
But summer tour is coming. Shows to attend, recordings to revisit, ratings to settle. Your history is right where you left it.<br><br>
Come back whenever you're ready.`)}
    ${button('OPEN MY PHREEZER', APP_URL)}
    ${body(`If something in the app wasn't working for you, I want to know. Hit reply — I read everything.<br><br>— mpgink`)}
  `);
  return { subject: 'The Phreezer misses you.', html };
}

// ─────────────────────────────────────────────────────────────
// 5. MILESTONE — 5, 25, 50 shows rated
// ─────────────────────────────────────────────────────────────
export function milestoneEmail(username, showsRated) {
  const name = username || 'phan';
  const milestones = {
    5:  { label: 'FIVE SHOWS PHROZEN.',  sub: 'You\'re building something real now. Five shows in and your Deep Phreeze is starting to take shape — top songs emerging, patterns forming. Keep going.', color: '#00e0d0' },
    25: { label: 'TWENTY-FIVE SHOWS PHROZEN.', sub: 'That\'s a real dataset. Your top songs, top venues, and era breakdown are meaningful now. Check Deep Phreeze — it\'s starting to tell your story.', color: '#ff6600' },
    50: { label: 'FIFTY SHOWS PHROZEN.', sub: 'Fifty. That\'s a serious record. You\'ve built something that most Phish fans only keep in their heads. This is what Phreezer is for.', color: '#33ff33' },
  };
  const m = milestones[showsRated] || { label: `${showsRated} SHOWS PHROZEN.`, sub: 'Keep going.', color: '#00e0d0' };
  const html = layout(`
    ${heading(m.label, m.color)}
    <tr><td style="padding-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        ${stat('SHOWS PHROZEN', showsRated, m.color)}
      </tr></table>
    </td></tr>
    ${body(`Hey ${name},<br><br>${m.sub}`)}
    ${button('SEE MY DEEP PHREEZE', APP_URL)}
    ${body(`— mpgink`)}
  `);
  return { subject: `${showsRated} shows phrozen. ◈`, html };
}

// ─────────────────────────────────────────────────────────────
// 6. RATING REMINDER — attended shows but never rated anything
// ─────────────────────────────────────────────────────────────
export function ratingReminderEmail(username, showsAttended) {
  const name = username || 'phan';
  const html = layout(`
    ${heading('YOU\'VE BEEN THERE. NOW TELL US HOW IT WAS.', '#ff6600')}
    <tr><td style="padding-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        ${stat('SHOWS ATTENDED', showsAttended, '#ff6600')}
      </tr></table>
    </td></tr>
    ${body(`Hey ${name},<br><br>
You\'ve got ${showsAttended} show${showsAttended === 1 ? '' : 's'} logged in your Phreezer — but you haven\'t rated any of them yet.<br><br>
Pick one you remember well. Pull it up, score each song 1–5. It takes about two minutes. You get a Vibe Check from Uncle Ebenezer, a full set breakdown, and your score lives in the community record permanently.<br><br>
Summer tour starts July 7. Good time to get your rating legs under you before the new shows hit.`)}
    <!-- HOW TO RATE -->
    <tr><td style="padding-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${[
          ['1. OPEN MY SHOWS', 'Go to the MY PHREEZER tab and tap any show in your attendance history.', '#00e0d0'],
          ['2. SCORECARD', 'Hit the scorecard for that show. Every song in the setlist is right there.', '#33ff33'],
          ['3. RATE 1–5', 'Tap the stars. Add notes if you want. Hit SAVE RATINGS when you\'re done.', '#ff6600'],
        ].map(([label, desc, color]) => `
        <tr>
          <td style="padding:12px 14px;background:rgba(0,0,0,0.35);border-left:2px solid ${color};margin-bottom:8px;display:block;">
            <div style="font-family:monospace;font-size:10px;font-weight:bold;letter-spacing:3px;color:${color};margin-bottom:5px;">${label}</div>
            <div style="font-family:monospace;font-size:12px;color:rgba(255,255,255,0.5);line-height:1.7;">${desc}</div>
          </td>
        </tr>
        <tr><td style="padding-bottom:6px;"></td></tr>`).join('')}
      </table>
    </td></tr>
    ${button('RATE A SHOW', APP_URL)}
    ${body(`— mpgink`)}
  `);
  return { subject: `You\'ve been to ${showsAttended} show${showsAttended === 1 ? '' : 's'}. How were they?`, html };
}
