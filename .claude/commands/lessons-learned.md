# /lessons-learned

Reflect on this session and update CLAUDE.md with any new lessons.

## Instructions

1. Review the conversation history for this session.

2. Identify any of the following:
   - Mistakes Claude made that required correction
   - Patterns where the user had to clarify the same thing more than once
   - Assumptions that turned out to be wrong
   - Approaches that worked unusually well and should be repeated

3. For each finding, decide:
   - Is this specific enough to become a standing rule? → Add to `## Standing Rules`
   - Is it a one-off context note? → Add to `## Lessons Learned` table only
   - Is an existing rule now redundant? → Delete it

4. When writing new rules, strictly follow the **Meta-Rules** section in CLAUDE.md.
   - Specific, not vague
   - One concern per rule
   - Evidence-based — must come from something that actually happened today
   - Falsifiable

5. Update the `## Lessons Learned` table with a one-line entry:
   - Date: today's date (DD/MM/YYYY)
   - Mistake pattern: what went wrong or what worked
   - Rule added: the rule text, or "none — one-off"

6. Report back to the user with:
   - Number of rules added / modified / deleted
   - Summary of what changed and why
   - A clean "handoff note": what was done, what comes next

## Example output

```
## /lessons-learned complete

**Rules added:** 2
**Rules deleted:** 1
**Rules unchanged:** 8

### Changes
- Added to Standing Rules › Git: "Always check for uncommitted changes before starting a new task."
  *Reason: Claude started a refactor with a dirty working tree, causing a confusing diff.*

- Added to Standing Rules › General: "When asked to 'clean up' a file, confirm scope before editing."
  *Reason: 'Clean up' was interpreted as full refactor; user meant formatting only.*

- Deleted: "Run npm install before every task."
  *Reason: Claude already does this without the rule.*

### Lessons Learned table updated
| 24/03/2026 | Started task with dirty git working tree | Always check for uncommitted changes before starting |

### Handoff note
- Completed: auth module refactor, PR opened
- Next: write unit tests for the new OAuth handler
```
