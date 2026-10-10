# The view model owns the conditionals; the DOM layer only binds

Presentation logic — score bands, UV and bluebottle labels, banner visibility,
verdict selection, tide-chart geometry — lives in pure functions in
`src/viewmodel.js`, taking a validated snapshot and a pool and returning plain
objects. The DOM layer assigns `textContent` and `className` and decides
nothing. This settles the open question in wayfinder ticket #5 and defines seam
S3.

The alternative, letting the view model emit shapes only and leaving the DOM
layer to choose labels and visibility, was rejected because it keeps the
interesting decisions unreachable from a test.

## Consequences

- The interface becomes testable under Vitest without a DOM or jsdom, which
  settles the tooling question in the wayfinder map.
- Verdict copy takes its randomness as an injected seed, because a pure
  function cannot call `Math.random()` and stay pure.
- Chart geometry must be extracted from the canvas draw calls before it can be
  asserted on.
