# /parking-lot

Capture a drifted idea, out-of-scope finding, or future improvement — without losing it and without acting on it now.

## Instructions

1. Accept input in any of these forms:
   - Called with a description: `/parking-lot Add rate limiting to the API`
   - Called after a `/scope-check` flagged drift — use the drift description as the item
   - Called mid-session when the user says something like "oh, while we're here..." or "actually, we should also..."

2. Add the item to a `## Parking Lot` section in `CLAUDE.md`.
   - Create the section if it doesn't exist, placed after `## Lessons Learned`.
   - Format each entry as a table row.

3. Print a confirmation and redirect:

```
## Parked ✅

**Item:** [description]
**Added to:** CLAUDE.md › Parking Lot

Returning to: [current session goal]
```

4. Do not act on the parked item. Do not ask follow-up questions about it. Return focus to the session goal immediately.

## Parking Lot table format

Add to `CLAUDE.md` under `## Parking Lot`:

```markdown
## Parking Lot

| Date | Item | Source | Priority |
|------|------|---------|----------|
| DD/MM/YYYY | [description] | [scope-check / mid-session / manual] | [high / medium / low / ?] |
```

## Triage mode

When called as `/parking-lot triage`, review all existing parking lot items and:

1. List items grouped by priority
2. For each item, suggest one of:
   - **Promote** — move to a GitHub issue or next session goal
   - **Keep** — valid but not urgent, leave parked
   - **Drop** — no longer relevant, safe to delete

3. Ask the user to confirm each decision before modifying `CLAUDE.md`.

4. After triage, print a summary:

```
## Parking Lot triage complete

- Promoted: N items
- Kept: N items
- Dropped: N items

Parking Lot now has N items remaining.
```

## Notes

- `/parking-lot` should feel frictionless — one command, item captured, back to work in seconds.
- Never let a parked item become a rabbit hole. If the user starts discussing it, redirect once, then park the discussion too if needed.
- Run `/parking-lot triage` at the start of a new sprint or before `/session-start` on a major task.
