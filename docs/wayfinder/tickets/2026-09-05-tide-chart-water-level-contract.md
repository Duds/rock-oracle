---
status: closed
type: wayfinder
labels: [wayfinder:grilling]
claimed: dale
created: 2026-09-05
closed: 2026-09-05
---

# Tide chart y-mapping is a water-level contract

## Question

What does the `drawTide` canvas actually depict, and which y-mapping is correct?

## Resolution

**Decision:** the chart is a **water-level profile**, not a bare sine graph. The gradient-filled region below the curve is the water body; the curve is the surface level over 24 h. Canvas y grows downward, so:

- `y = pad + (1 − norm) · cH` is the **correct** mapping: high tide → curve near canvas **top** (max on the y axis, large water region below), low tide → curve near bottom.
- The 5 Sep 2026 "180° inverse" bug report was itself inverted: the original mapping was correct. The edit that flipped it (`y = pad + norm·cH`) was reverted same day.
- Terminology locked: time on the X axis; height (the sine value) on the Y axis with origin at the canvas top. "Phase = high ⇒ +max" means the **top of the Y axis**, not X.

**Refactor consequence:** extract the curve geometry into a pure view-model function with an explicit named contract (`TIDE_Y_ORIGIN = 'top'`, water-level semantics documented) plus a regression test asserting the high-tide point has smaller y than the low-tide point. Tracked via the view-model prototype ticket.
