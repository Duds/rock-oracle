---
status: open
type: wayfinder
labels: [wayfinder:prototype]
claimed: null
created: 2026-09-05
---

# View model projection: how far without a framework

## Question

What does the pure projection layer (`snapshot + pool -> view model`) look like in practice, and how much of the render decision should live there vs in the DOM layer?

## To prototype

A cheap stub of `src/viewmodel.js`: pure functions consuming a validated snapshot and pool, emitting plain objects for tide curve points, weather tiles, score track segments, and verdict copy. Include the tide chart geometry extraction (the water-level contract from Decisions-so-far) as the first function, with its high-tide-at-top assertion as a test.

## To react to

- Does the view model own conditionals (e.g. `uvLabel`, verdict string selection, banner visibility) or only shapes?
- Does the DOM layer stay dumb (textContent assignment only), or does it keep some logic?
- Does this shape work under Vitest without jsdom (plain object in/out)?

## Output

A linked stub file plus a short note on the chosen split, recorded as the resolution; becomes the spec for seam S3 and settles the CI/tooling fog item.
