# /scope-check

Check whether the current work is drifting from the session goal. Flag drift and offer a decision.

## Instructions

1. Retrieve the session goal from the session header (set by `/session-start`).
   - If no session header exists, ask: "What was the goal you set at the start of this session?"
   - Wait for the answer before continuing.

2. Review recent conversation and any files changed in this session.

3. Assess drift across three dimensions:

   **Scope drift** — are changes going beyond what the goal requires?
   - Extra files touched that weren't in the plan
   - Features added that weren't asked for
   - Refactoring happening alongside a bug fix

   **Goal drift** — has the conversation shifted to a different problem?
   - New topics introduced mid-session
   - Original goal deprioritised or forgotten
   - "While we're here..." additions

   **Complexity drift** — is the solution growing beyond what the problem needs?
   - Abstractions added for hypothetical future use
   - Over-engineered error handling
   - Unnecessary configurability

4. Report the finding in one of three states:

### On track
```
## /scope-check — On track ✅

**Goal:** [original goal]
**Status:** Work is aligned with the session goal.
**Files changed:** [list]

No action needed. Continue.
```

### Minor drift
```
## /scope-check — Minor drift ⚠️

**Goal:** [original goal]
**Drift detected:** [one sentence description]
**Affected area:** [file or feature]

Options:
1. Revert the drift and stay on goal
2. Capture it as a separate task and continue on goal
3. Expand the session goal to include it (confirm this explicitly)

Which do you want?
```

### Significant drift
```
## /scope-check — Significant drift 🔴

**Goal:** [original goal]
**Drift detected:** [description]
**Recommendation:** Stop. Decide what this session is actually for before continuing.

Options:
1. Revert to last on-goal state and refocus
2. Formally change the session goal to: [new goal]
3. End this session, run /lessons-learned, start fresh

Which do you want?
```

## Notes

- Never continue working after flagging significant drift without an explicit user decision.
- Capture any drifted ideas in a `## Parking Lot` section of `CLAUDE.md` so they're not lost.
- Run automatically if the same file has been modified more than three times in one session — that's a signal of unresolved drift.
