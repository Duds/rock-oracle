---
status: open
type: wayfinder
labels: [wayfinder:grilling]
claimed: null
created: 2026-09-05
---

# Persistence boundary: store shape, versioning, injectable storage

## Question

What is the contract for the persistence seam (favourites, recents, weather cache), replacing six scattered localStorage try/catch blocks?

## Sub-questions to grill

1. One `Persistence` object with namespaced keys, or separate `FavouriteStore` / `RecentStore` / `WeatherCache`?
2. Storage injection: constructor takes a `Storage`-like interface (memory impl for tests) or hard-wires localStorage?
3. Error semantics: on quota/full/corrupt JSON, fail silently, reset key, or surface to the error banner?
4. Schema versioning: prefix version in key (`v2:rock_oracle_favs`) or embed a `v` field in payloads?

## Output

A written contract recorded as the resolution; becomes the spec for `src/store/persistence.js` (seam S2) and unblocks the service-worker fog item.
