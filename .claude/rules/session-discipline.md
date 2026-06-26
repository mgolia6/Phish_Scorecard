# Session Discipline — Phreezer

## Session Start — MANDATORY READ ORDER

1. Read `INSTRUCTIONS.md` — architecture, conventions, env vars
2. Read `SESSION_LOG.md` — what shipped last session
3. Read `ROADMAP.md` — open items and priorities
4. Read `LAYOUT.md` and `STYLE_GUIDE.md` before ANY UI work

Do not start work until all four are read for UI sessions.

## The Division of Labor

**claude.ai (chat / this project):**
- Design decisions, UX discussions, layout planning
- Architectural decisions before code is written
- Copy review
- Session wrap and roadmap

**Claude Code (you):**
- Implementation only
- Design decisions have already been made in claude.ai
- Flag and confirm if you're about to make a UX decision

Never make unilateral UX calls. If the design hasn't been decided in claude.ai first, flag it.

## Session Wrap

At every session close:
1. `SESSION_LOG.md` — add session entry: what shipped, decisions made, what's open
2. `ROADMAP.md` — update open/done items
3. `LAYOUT.md` — update if any layout decision was made or reversed
4. `STYLE_GUIDE.md` — update if any design token changed
5. Commit: `git add -A && git commit -m "Session [date] — [summary]" && git push`
