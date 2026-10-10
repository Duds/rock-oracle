# Test gate: pure unit tests plus a browser smoke test

`tests/` covered `src/lib.js` and `src/store.js` and nothing else, so the app
shell was ungated. The gap was demonstrated by a `ReferenceError` from a
missing import that broke `render()` on every load and passed CI. The gate is
now pure-module unit tests plus a Playwright suite that loads the built app,
asserts no console errors, that the score renders, and that tabs switch.

jsdom was the alternative and was rejected: it would not have caught a missing
module-scope import at the browser boundary, which is the exact failure it was
needed for.

## Consequences

- CI needs a browser download, so the check is slower than the unit tests.
- The smoke test is deliberately shallow. It asserts the app assembled and
  responded, not that the content is correct; correctness belongs to the unit
  tests on the view model.
