# CLAUDE.md

> **This file is a living document.** Claude updates it automatically using `/lessons-learned`.
> Rules here persist across sessions. Keep them concise, specific, and actionable.

---

## Project Overview

- **Project:** Rock Oracle
- **Stack:** Vanilla HTML/CSS/JS, ES Modules, Open-Meteo API (weather + marine), Leaflet.js (maps)
- **Purpose:** Real-time swim conditions for ocean rock pools and natural swimming spots on Australia's east coast
- **Owner:** Dale Rogers
- **Deployed:** https://rock-oracle.pages.dev (Cloudflare Pages, auto-deploys on push to `main`)
- **Content:** Pool Legends (mythology + history per pool) — style guide at `content/deep-record.md`
- **Skills:** `session-start`, `lessons-learned`, `parking-lot`, `scope-check` installed at project level

---

## Meta-Rules (how to write rules in this file)

These govern how Claude adds new rules. Follow them exactly when updating this file.

1. **Specific over general** — rules must describe a concrete behaviour, not a vague intent.
   - ✅ "Always run `npm test` before committing."
   - ❌ "Be careful with tests."

2. **One rule, one concern** — never combine two distinct behaviours into a single rule.

3. **Evidence-based** — only add rules triggered by an actual mistake or repeated correction.
   Do not add speculative rules.

4. **Falsifiable** — every rule must have a clear pass/fail condition.

5. **Prune regularly** — if Claude already behaves correctly without a rule, delete it.
   Dead rules dilute attention.

6. **Sections stay flat** — use `###` headers only. No nested subheadings.

---

## Workflow

Follow this four-phase approach for every non-trivial task:

1. **Explore** — read relevant files before touching anything. Use `@filepath` references.
2. **Plan** — propose an approach and list files to change. Confirm before implementing.
3. **Implement** — make only the changes agreed in the plan. No scope creep.
4. **Verify** — run tests or provide a verification script. Never mark done without evidence.

Use Plan Mode (`Shift+Tab`) during Explore and Plan phases.

---

## Standing Rules

### General

- After two failed correction attempts on the same issue, run `/clear` and restate the problem from scratch.
- Do not add features, refactor, or "improve" surrounding code unless explicitly asked.
- Do not add comments or docstrings to code that was not changed in the current task.

### Git

- Always confirm the commit message before running `git commit`.
- Never push directly to `main` without explicit instruction.

### Context management

- Use subagents for exploratory tasks to protect the main context window.
- Scope all "investigate" requests narrowly — no open-ended file crawls.

### Deployment

- Always increment the SW cache name in `sw.js` (`CACHE = 'oracle-vN'`) before pushing any change to `index.html`, `src/pools.js`, or `src/lib.js`. Without this, returning users get stale files from the service worker cache.
- After pushing a SW cache bump, explicitly tell the user to hard-refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`). If the site still serves stale content, offer to nuke the SW via browser tools (`navigator.serviceWorker.getRegistrations()` + `caches.keys()`). A cache name change alone does not clear the old SW in already-open browser tabs.

### Content

- For new content systems (pool legends, style guides, mythology), pitch the framework and get explicit sign-off before writing any content. Do not start writing until the creative direction is confirmed.
- All Pool Legends must follow `content/deep-record.md`. Natural pools use Type A register (elemental, Mara-centric). Hewn pools use Type B register (human, historical, Mara fills it). Do not mix registers.

### Tasks

- When the user provides files via `@` reference from Downloads with install instructions, complete that installation fully before moving to any new topic.

### Pools data

- Insert new pools in latitude order (north-to-south = least negative to most negative lat) within each state block in `src/pools.js`.
- Natural rock pools require `natural: true`, `tideDependent: true|'high'|false`, and `swellLimit` (metres) where a documented safety limit exists.

### Agents

- Approve WebSearch in permissions before launching background research agents, or the agent will silently fail every search call.

---

## Lessons Learned

<!-- Auto-populated by /lessons-learned. Each entry: date | pattern | rule added -->

| Date | Mistake pattern | Rule added |
|------|----------------|------------|
| 24/03/2026 | SW served stale assets after deploy — cache name not bumped | Always bump `oracle-vN` in sw.js on every deploy |
| 24/03/2026 | Background research agent failed — WebSearch permission denied to subagent | Approve WebSearch before launching research subagents |
| 24/03/2026 | Natural pools needed separate scoring logic — tide/swell not factored in calcScore | Add `tideDependent` + `swellLimit` to pool objects; cap score in `render()` |
| 24/03/2026 | Bumping SW cache name didn't clear stale content in open tabs — user still saw old version | After pushing cache bump, tell user to hard-refresh; offer browser tool nuke if still stale |
| 24/03/2026 | User provided 6 files from Downloads to install — task abandoned before completion as new topics took over | Complete file installation tasks fully before moving to new topics |
| 24/03/2026 | Wrote Pool Legend style guide and mythology without pitching framework first in previous session — worked better when framework was co-developed | Pitch creative framework, get sign-off, then write content |
| 24/03/2026 | Git commit message not confirmed with user before committing — violated existing standing rule multiple times | none — existing rule, recurring failure to follow it |

---

## Reminders

- `/lessons-learned` — reflect on this session and update this file.
- `/clear` — reset context between unrelated tasks.
- `@filepath` — reference files directly instead of describing them.
