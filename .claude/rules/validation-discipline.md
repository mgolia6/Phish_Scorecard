# Validation Discipline — Phreezer

## Core Rules

1. **Read INSTRUCTIONS.md + LAYOUT.md + STYLE_GUIDE.md before any UI work**
2. **Don't make UX decisions unilaterally** — flag and confirm with Matthew
3. **No new routes without vercel.json entry** — check this before every deploy
4. **Reproduce before fixing** — confirm the bug exists before writing the fix
5. **Never weaken a guard** — attendance type gate, layout locks, auth guards are non-negotiable

## Pre-Code Review

Before writing code, surface:
- Which files will be modified
- Whether a new `vercel.json` entry is needed
- Whether `LAYOUT.md` has a decision about the component being changed
- The blast radius (which other components depend on the file being changed)

Then get Matthew's go-ahead before non-trivial changes.

## Design System Enforcement

Before any UI work:
- Colors from `--green`, `--cyan`, `--orange`, `--bg`, `--bg-panel` only
- Fonts: Orbitron (headings) + Share Tech Mono (body/data)
- No light redesign attempts — neon accents require dark backgrounds

Violating the design system = work gets reverted. Check STYLE_GUIDE.md.

## Layout Locks — Non-Negotiable

Never revert these without explicit instruction from Matthew:
- Song row mobile: column layout
- Feed: default Community landing
- Phriend Overlap: second in sidebar
- Attendance type gate: mandatory on first star tap
- Entry animation: terminal boot, typewriter, glitch exit
- Bottom nav: fixed, 72px, mobile only (max-width: 768px), 4 tabs
- Ebenezer FAB: bottom 88px
- ProfileModal tabs: MY PHISH · BADGES · ABOUT · AI · SHOP — do not reorder

## Session Wrap

1. Update `SESSION_LOG.md` — what shipped, what's open
2. Update `ROADMAP.md` — mark completed, add new items
3. Update `LAYOUT.md` if any layout decision was made
4. Update `STYLE_GUIDE.md` if any design token changed
5. Commit and push
