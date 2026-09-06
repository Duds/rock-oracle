---
status: open
type: wayfinder
labels: [wayfinder:grilling]
claimed: null
created: 2026-09-05
---

# Weather snapshot contract: validation, partial data, fallback determinism

## Question

What is the exact, validated contract for the weather snapshot (`{at, cc, wind, windDir, uvRaw, wh, wp, st, h, days[]}`), and what happens when Open-Meteo returns partial or malformed data?

## Sub-questions to grill

1. Should the snapshot be validated at the provider boundary (schema check) or trusted after parse?
2. Partial data policy: sea temp missing (`null`), wave height missing, daily arrays shorter than expected. Degrade which fields, fail which?
3. Should `makeFallback()` remain random noise, or become deterministic + flagged `live: false` (so the UI can label it "seasonal estimate" honestly)? Randomness makes the fallback path untestable as-is.
4. Does the snapshot get a schema version baked in, given the cache persists it to localStorage across deploys?

## Output

A written contract (field list, types, nullability, validation rules, fallback semantics) recorded as the resolution; becomes the spec for `src/weather/provider.js` (seam S1).
