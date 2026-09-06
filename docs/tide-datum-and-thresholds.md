---
status: active
type: architecture
project: rock-oracle
updated: 2026-09-07
ticket: https://github.com/Duds/rock-oracle/issues/9
related: https://github.com/Duds/rock-oracle/issues/7
---

# Tide datum and thresholds

Resolution of wayfinder ticket [#9: Tide datum and tide-dependent thresholds after the
provider swap](https://github.com/Duds/rock-oracle/issues/9). Fills in the numeric body
for the predicate interface defined in [#7](https://github.com/Duds/rock-oracle/issues/7)
(`docs/tide-behaviour-contract.md`).

## The problem this dissolves

The old rules gated tide-dependent pools on the model's arbitrary datum:
`tideAt(d.h) > 0.85` (low pools bad) and `< 0.25` (fill pools bad). Those numbers have no
relationship to water level, and broke outright against the live MSL curve — on 5 Sep they
scored a real 1.17 m falling tide as "fine" (see #2). The provider swap made a height-based
gate un-usable because LAT (Australian tables) and MSL (Open-Meteo) are offset by ~+0.78 m.

## Resolution: a datum-invariant predicate

The layer's real question was always **"are we near the tide this pool needs?"**, not
"is the (arbitrary) height past a threshold". So the predicate is expressed in **minutes to
the nearest relevant extreme**, which is immune to the datum entirely:

- `tideMode(pool)`: `true → 'low'`, `'high' → 'high'`, else `'none'` (normalises the
  loaded `tideDependent`; #7 D1).
- `tideState(curve, hour, mode, { lowWindow, highWindow })` returns
  `{ favourable: boolean|null, nearest: { event, minutes } | null }`.
  - `'low'` pools: favourable within `lowWindow` (default **120 min** = 2 h) of a low tide.
  - `'high'` pools: favourable within `highWindow` (default **120 min**) of a high tide.
  - minutes wrap the 24 h cycle, so the current pool near a wrap-around extreme is handled.
  - `favourable: null` when mode is `'none'`, no extreme found, or the curve is < 25 points
    (degraded) → caller applies no penalty.

Time-on-X / height-on-Y extremes are found from local extrema of the curve; no datum, no
regional offset table, nothing to maintain. This is exactly why minutes-to-extreme beats a
metre threshold.

## Where it lands

- The natural-pool **bonus penalty** in `render` now uses `tideState(...).favourable`
  instead of the `0.85` / `0.25` literals on `tideAt`.
- The **swim-window ±5 gate** that was neutral for the live curve now applies the shared
  predicate (`+5` favourable, `-3` when not, `0` in degraded). §D2 of the behaviour contract
  is satisfied: chart shading and the penalty consume the same predicate.
- The **tide chart** shades unfavourable hours (no-go windows) using the same predicate
  (`tideState(tideHeights, h+0.5, mode)` → false), fulfilling the D2 annotation requirement
  that had to wait for calibrated numbers.
- The tide tab now displays **next high / next low times and heights** from the same
  `tideExtremes` discovery.

## Metres display: optional, datum-labelled (sub-question 1)

We do **not** hide the height number (swimmers want to cross-check with a BOM table), but we
**label the datum** so it cannot be misread as BOM's LATMSL. The chart caption stays
`■ SEA LEVEL (m)`; the height values shown are whatever data the active curve is (MSL for a
live fetch, model for `MODEL`). No regional offset table is introduced — if we ever need
true LAT display, that becomes its own decked addition at the provider seam, not baked into
the chart.

## What is NOT changed

- `src/lib.js` retains `tideAt()`/`TIDES` as the `MODEL` fallback curve and test fixture
  (#7 D3). The predicate works on any curve — live or model — because it is datum-invariant.
- No per-region offset constant is added or hardcoded anywhere (avoids the exact beta test
  hole the original 0.85/0.25 logic had).

## Tests

5 new pure cases (suite now 77/77): `tideMode` normalisation; `tideExtremes` detects one
high + one low on a clean sine day and returns empty for short curves; `tideState`
favourable/unfavourable within the 120-min window and the boundary at exactly 2 h; custom
`lowWindow`; and `favourable null` for degraded inputs (no penalty).