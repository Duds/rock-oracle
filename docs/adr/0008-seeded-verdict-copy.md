# Verdict copy is seeded from the pool and the day

The headline verdict was drawn at random from four strings on every render, so
refreshing without any change in conditions rewrote it, and no test could
assert on it. It is now chosen from a seed derived from the pool id and the
current date: identical conditions give an identical sentence, and the sentence
still changes from day to day.

## Consequences

- A user who reloads sees the same message, which is the behaviour a forecast
  implies.
- The copy pool must stay at least four entries per grade, or the seed space
  collapses to constant text.
- Tests can pin the seed and assert exact wording.
