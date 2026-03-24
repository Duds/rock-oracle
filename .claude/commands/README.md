# Claude Code — Session Commands

A self-improving session management system for Claude Code.
Maintained by Dale Rogers.

---

## How it works

Every session follows the same loop:

```
/session-start → work → /scope-check → /parking-lot → /lessons-learned
```

Each session ends with `CLAUDE.md` slightly smarter than it started.
Over time, Claude makes fewer mistakes on this codebase and needs less correction.

---

## Commands

### `/session-start`
Run this **first thing**, every session.

- Reads `CLAUDE.md` and confirms rules loaded
- Asks for the one thing you want to finish
- Checks git state (branch, dirty tree)
- Prints a session header to anchor the work

---

### `/scope-check`
Run this **mid-session**, anytime something feels off.

Detects three drift types:
- **Scope drift** — extra files touched, features added beyond the goal
- **Goal drift** — conversation has shifted to a different problem
- **Complexity drift** — solution growing beyond what the problem needs

Returns one of three states: ✅ on track / ⚠️ minor drift / 🔴 significant drift.
Forces a decision before work continues.

---

### `/parking-lot [idea]`
Run this **anytime** an out-of-scope idea surfaces.

- Captures the item to `CLAUDE.md › Parking Lot` immediately
- Returns focus to the session goal
- No discussion, no rabbit holes

Run `/parking-lot triage` at sprint start to review, promote, or drop parked items.

---

### `/lessons-learned`
Run this **last thing**, every session.

- Reviews the session for mistakes and repeated corrections
- Adds, modifies, or deletes standing rules in `CLAUDE.md`
- Updates the Lessons Learned table with a dated entry
- Prints a handoff note: what was done, what comes next

---

## File structure

```
.claude/
└── commands/
    ├── README.md           ← this file
    ├── session-start.md
    ├── scope-check.md
    ├── parking-lot.md
    └── lessons-learned.md
CLAUDE.md                   ← project rules, lessons, parking lot
```

---

## Tips

- Install commands globally (`~/.claude/commands/`) to use across all projects.
- Keep `CLAUDE.md` lean — prune rules Claude already follows without being told.
- Run `/parking-lot triage` before planning a new sprint, not during one.
- If the same issue recurs after `/lessons-learned` ran, the rule wasn't specific enough — tighten it.
