---
status: active
type: architecture
project: rock-oracle
updated: 2026-09-07
ticket: https://github.com/Duds/rock-oracle/issues/6
related: https://github.com/Duds/rock-oracle/issues/4
---

# Persistence contract

Resolution of wayfinder tickets [#6: Persistence boundary](https://github.com/Duds/rock-oracle/issues/6)
and [#4: Weather cache staleness policy](https://github.com/Duds/rock-oracle/issues/4).

## The storage seam (S2)

All localStorage access is confined to `src/store.js`. Three factory functions, each taking
an injectable storage (`{ getItem, setItem }` — `localStorage` in production, in-memory
`Map` shim in tests). Nothing in the store module touches the DOM.

```ts
createFavs(storage)     -> { list(): string[], has(id): boolean, toggle(id): boolean }
createRecents(storage, { max = 5 }) -> { list(): string[], add(id): string[] }
createWeatherCache(storage, { ttlMs, staleMs, normalise, version })
                        -> { read(poolId, {allowStale}), write(poolId, data) }
```

- **Keys:** `rock_oracle_favs` (string[]), `oracle_recent` (string[], max 5),
  `oracle_wx_<poolId>` (`{ ts, version, data }`).
- **Envelope:** every write wraps data as `{ version: 1, data }`. Reads accept legacy bare
  arrays (pre-versioning favourites/recents) and migrate them on the next write, so no
  existing user loses favourites.
- **DOM decoupling:** `toggleFav` no longer re-renders internally; `index.html` keeps a thin
  `toggleFav(id)` wrapper that calls the store then re-renders the search list.

## Weather cache staleness policy (#4)

Three tiers, encoded in `createWeatherCache`:

| Tier | Age (default) | Served when |
|---|---|---|
| **Fresh** | < 30 min (`ttlMs`) | always (startup + refresh) |
| **Stale** | 30 min – 7 days (`staleMs`) | only on fetch failure (`allowStale: true`), flagged `STALE` in the badge |
| **Ancient** | ≥ 7 days | never, discarded |

Additional rules:

- **Version mismatch discards regardless of age.** A schema change (e.g. a future
  `SNAPSHOT_VERSION = 2`) safely invalidates every cached payload instead of rendering a
  wrong-shape snapshot.
- **Degraded ordering on fetch failure** (both primary and retry): stale cache → flagged
  `STALE` → else the simulated seasonal estimate. Rationale: a 2-hour-old real reading is
  strictly better than invented data.
- The `STALE` badge is derived from `src` containing "stale" with `live: false`; no shape
  change to `WeatherSnapshot`.
- Corrupt payloads return `null` (safe refetch), never throw.

## What this does NOT decide

- Service worker cache versioning for offline assets (S6, separate slice).
- Whether favourites gain metadata (timestamps, notes): current shape stays `string[]`;
  the version envelope allows a future v2 migration without a breaking read.
- Sync across devices: out of scope, no backend by design.
