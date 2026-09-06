---
status: active
type: architecture
project: rock-oracle
updated: 2026-09-07
ticket: https://github.com/Duds/rock-oracle/issues/7
---

# Tide chart behaviour contract

Resolution of wayfinder ticket [#7: Tide chart behaviour contract](https://github.com/Duds/rock-oracle/issues/7).
Depends on [#2](https://github.com/Duds/rock-oracle/issues/2) (provider, closed).
Numeric thresholds and datum display are **out of scope here**: they belong to
[#9](https://github.com/Duds/rock-oracle/issues/9) (datum and tide-dependent thresholds).

## D1. `tideDependent` becomes a typed enum

Values: `'low' | 'high' | 'none'`.

- `true` → `'low'` (safe/accessible within ~2 h of low tide)
- `'high'` stays (fills from surf, best near high tide)
- `false` / `undefined` → `'none'`

**Data files are not edited in this migration** (current stock: 7 × `true`, 1 × `'high'`,
2 × `false`, rest implicit `'none'`). Normalisation happens at the read boundary via a
pure helper (`tideMode(pool)`), placed in `src/lib.js` or the view model per #5. New pool
entries use the enum literals directly.

Per-value rule table (badge, alert, penalty). Penalties keep the existing gate: they apply
only to `natural: true` pools. Mahon-style engineered pools carry the badge but no scoring
penalty. This gate is recorded as an explicit rule, not an accident; revisit only with
evidence that an engineered pool's scoring should move with tide.

| mode | badge | alert copy (natural pools only) | scoring penalty (natural pools only) |
|---|---|---|---|
| `'low'` | `⏱ TIDE` — "Best within 2hrs of low tide" | shown when not swell-blocked | `min(total, 28)` + `nope_tide` verdict when tide state is unfavourable per #9's predicate |
| `'high'` | `⏱ TIDE` — "Best near high tide" | "fills from surf, best near high tide" | same shape, `'high'` predicate per #9 |
| `'none'` | `⛰ NATURAL` if natural, else no badge | none | none |

## D2. The chart annotates, driven by one predicate

The chart is no longer a bare curve. No-go / unfavourable windows are shaded, computed from
the **same predicate the scoring penalty uses** (the one #9 calibrates). One predicate,
two consumers: chart shading and score/verdict penalties cannot drift apart.

- Shaded windows: per-pool, derived from the active curve (`tideHeights`, live or model).
- Implementation lives with the curve geometry in the view model (#8's refactor
  consequence: pure function, `TIDE_Y_ORIGIN = 'top'`, regression test high-y < low-y).
- Ships **with #9**, not before: shading without the calibrated predicate would encode the
  fake model's datum into the visual layer. Until then the chart stays unshaded.

## D3. `TIDES` demotes to fallback + test fixture

Agreed in principle in #2's resolution, made concrete here:

- `tideAt()` / `TIDES` stay exported in `src/lib.js` (pure, 53-test-covered) as the **MODEL
  fallback curve** in the chain from #2: live → cached → model → static banner.
- No consumer may render or score from `TIDES` when `tideSrc === 'LIVE'`. Display and
  scoring read the snapshot curve (`tideHeights` in the current implementation; the
  validated snapshot field after #3).
- `TIDES` stops being the render source permanently once the S1 provider seam exists;
  removal is a Phase-4 slice, not an independent task.
- Per-pool curves already exist via the provider (fetched at each pool's lat/lon);
  `TIDES` is Sydney-only by definition and only ever the fallback.

## D4. Coverage gaps: the fallback chain is the contract

No per-pool station mapping is introduced (resolves the map's "per-pool tide station
mapping" fog item: station selection is implicit in lat/lon through Open-Meteo's grid).

- If the marine payload yields < 25 finite `sea_level_height_msl` values (marine model gap,
  estuary, inland cell), `fetchWeather` flips that pool to `[MODEL]` automatically. This is
  the existing implementation and it is the contract.
- Tide-dependent alerts on a `[MODEL]` pool degrade to the static "check tide times" copy
  (already implemented).
- Enclosed-water display semantics (Sydney Harbour, Port Phillip cells that read open-coast
  water) are a display question: owned by #9 sub-question 4, not here.
- Harbour/bay confidence caveat from #2 stands: cells are unresolved until measured.

## Consequences for the spec

- The tide slice of `src/viewmodel.js` exposes: `tideCurve` (25-pt, source-tagged),
  `tideMode(pool)`, and `tidePredicate(curve, mode)` (numeric body per #9). Chart + score +
  alerts consume only these.
- The swim-window bonus/penalty gate in `index.html` (currently neutral for `'LIVE'`)
  switches to the same predicate when #9 lands.
- Regression tests required: enum normalisation (`true`→`'low'`, `undefined`→`'none'`),
  predicate symmetry on the model curve (reproduces `0.85`/`0.25` behaviour within
  rounding), and the #8 y-mapping assertion.
