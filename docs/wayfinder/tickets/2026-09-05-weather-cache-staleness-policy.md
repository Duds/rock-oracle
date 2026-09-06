---
status: open
type: wayfinder
labels: [wayfinder:grilling]
claimed: null
created: 2026-09-05
---

# Weather cache staleness policy

## Question

What is the cache policy for `oracle_wx_<poolId>`: time-to-live, stale-while-refresh behaviour, and eviction/versioning?

## Sub-questions to grill

1. TTL: how old before cached weather is considered stale and must re-fetch on load?
2. On load: show cached instantly then refresh in background, or block on network with the existing loader sequence?
3. Should the cache record a fetch timestamp so stale vs fresh is distinguishable (it currently is not)?
4. Versioning: bump/migrate/discard strategy when the snapshot schema changes (links to the schema-versioning fog item).

## Output

A written policy recorded as the resolution; becomes the spec for the `CachedProvider` decorator in `src/weather/cache.js` (seams S1 + S2).
