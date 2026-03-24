# /session-start

Prime this session with project context and set a clear goal before any work begins.

## Instructions

1. Read `CLAUDE.md` in full. Confirm you have read it by briefly summarising:
   - Project name and stack
   - Number of standing rules loaded
   - Any rules added since the last session (check the Lessons Learned table)

2. Ask the user one question:
   **"What is the one thing you want to finish this session?"**

   Wait for the answer before proceeding.

3. Once the user states their goal, confirm:
   - Restate the goal in one sentence
   - Identify which phase to start in (Explore / Plan / Implement / Verify)
   - Propose a scope limit if the goal is large: "Want to aim for just [smallest useful slice] first?"

4. Set context for the session:
   - Check for uncommitted changes: run `git status`
   - Note the current branch
   - Flag anything that looks like it needs attention before starting (dirty tree, unknown branch, etc.)

5. Print a session header in this format:

```
## Session started — [DD/MM/YYYY]

**Goal:** [one sentence from user]
**Starting phase:** [Explore / Plan / Implement / Verify]
**Branch:** [current branch]
**Working tree:** [clean / dirty — N uncommitted files]
**Rules loaded:** [N standing rules from CLAUDE.md]

Ready. Let's go.
```

## Notes

- Do not start any work before the user states their goal.
- Do not ask more than one question at a time.
- If the user's goal is vague, ask one clarifying question to sharpen it — then confirm and proceed.
- If `CLAUDE.md` is missing, say so and offer to create it using the standard template.
