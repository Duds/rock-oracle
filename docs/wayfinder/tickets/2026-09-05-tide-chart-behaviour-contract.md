---
status: open
type: wayfinder
labels: [wayfinder:grilling]
claimed: null
created: 2026-09-05
---

# Tide chart contract: per-pool tide dependency and alert semantics

## Question

Beyond the y-mapping already decided, what is the full contract for tide-dependent behaviour: chart, alerts, score penalties, and the `tideDependent` flag semantics across pools?

## Sub-questions to grill

1. `tideDependent` is currently overloaded: `true` (low-tide pool), `'high'` (fills from surf), `false`/undefined. Should this become a typed enum with per-value rules for chart annotation, alert copy, and the `getVerdict`/score penalties at lines 924–930?
2. Should the chart annotate the swim-window (e.g. shaded "2 hrs either side of low") once real tide data lands, or stay a bare curve?
3. With a real provider, does `TIDES` (the precomputed 25-point array) remain a module-level export, or move behind the provider so pools can have different curves?
4. What happens for pools outside the provider's station coverage (inland/harbour pools with `onshoreWind: {min:0,max:0}` today)?

## Output

A written contract recorded as the resolution; becomes the spec for the tide slice of `src/viewmodel.js` and the `tideAt` replacement interface. Blocks on the tide provider research ticket.
