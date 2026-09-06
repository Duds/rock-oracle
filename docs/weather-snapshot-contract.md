---
status: active
type: architecture
project: rock-oracle
updated: 2026-09-07
ticket: https://github.com/Duds/rock-oracle/issues/3
---

# Weather snapshot contract

Resolution of wayfinder ticket [#3: Weather snapshot contract](https://github.com/Duds/rock-oracle/issues/3).
Founding type for the S3 view model and S2 weather cache seams.

## The shape

Every weather payload (live fetch, fallback, cache read) collapses through one pure
normaliser into a single, versioned, typed object. Consumers never see a raw fetch.

```ts
interface WeatherSnapshot {
  version: 1;
  h:        number;              // pool-local hour 0–23
  syd:      Date;                // pool-local "now"
  src:      string;              // "Open-Meteo (live)" | "seasonal estimate" | …
  live:     boolean;
  at:       number | null;       // air temp °C
  cc:       number | null;       // cloud cover %
  wind:     number | null;       // km/h
  gust:     number;              // km/h, default 0
  windDir:  number | null;       // degrees
  uvRaw:    number | null;       // UV index
  st:       number | null;       // sea temp °C
  wp:       number | null;       // wave period s
  wh:       number | null;       // wave height m
  days:     Array<{              // 7-day daily forecast
    at: number | null; wind: number | null; windDir: number | null;
    cc: number | null; uvRaw: number | null; wh: number | null;
  }>;
  tide:     { curve: number[25]; src: 'LIVE' | 'MODEL' };  // day-aligned, pool-local hour i
}
```

## Rules

1. **Single normalisation point.** `normaliseSnapshot(raw)` in `src/lib.js` (pure, tested)
   is the only place raw → snapshot conversion happens. It runs:
   - at the fetch boundary: `fetchWeather()` and `makeFallback()` both return a snapshot,
   - on every cache read: `loadCache()` re-normalises the stored payload.
2. **Versioned cache.** `saveCache` writes `{ ts, version, data }`; `loadCache` returns
   `null` unless `version === SNAPSHOT_VERSION` **and** TTL is fresh. A shape mismatch
   forces a safe refetch within ≤30 min instead of rendering a wrong-shape snapshot.
3. **Partial data is explicit, not `NaN`/`undefined`.** Missing optionals become `null`;
   `gust` defaults to `0`; tide/uvRaw/days already behave this way in consumers and the
   normaliser enforces it.
4. **Null-tolerant consumers.** Every consumer must handle `null` optionals (UV fallback,
   partial `days[]` seeded estimate, `gust` upgrade). The normaliser guarantees the *shape*,
   not that every field is populated.

## The tide curve lives here

Ticket #2 chose Open-Meteo `sea_level_height_msl`. `tide` (curve + `LIVE`/`MODEL` label) is
now part of the snapshot, replacing the module-level `tideHeights`/`tideSrc` globals:

- `fetchWeather` builds the live curve when the marine hourly has ≥25 finite MSL values;
  otherwise `source` is `MODEL` and the normaliser falls back to the Sydney `TIDES` array.
- `drawTide`, the swim-window tide rows, and the natural-pool penalty all read
  `snapshot.tide.curve`/`src`. The only `TIDES` reads left are the normaliser fallback and
  the no-snapshot chart default.
- **This kills the two-source conflict** the audit flagged: the scoring penalty previously
  read `tideAt(d.h)` directly while the chart read `tideHeights`. Both now consume the same
  `snapshot.tide.curve`.

## Boundaries

- Numeric tide scoring semantics (datum, time-to-extreme) are **#9**, not here.
- Datum-aware swim-window gate: already neutral for `LIVE` (see `docs/tide-behaviour-contract.md` §D2); not part of the shape contract.
- The S1 provider seam (`src/weather/provider.js` interface, `OpenMeteoProvider`/
  `FallbackProvider`/`CachedProvider`) invokes `normaliseSnapshot` internally but is its
  own ticket (Phase-4 slice), not #3.

## Consequences for the spec

- `src/viewmodel.js` (S3) consumes `WeatherSnapshot` + pool → view models; it can trust the
  type and nulls.
- `WeatherCache` (S2) stores `{ ts, version, data }` and runs `normaliseSnapshot` on read;
  this contract is precedent for the `FavouriteStore`/`RecentStore` versioning decision in
  #6.
- New `normaliseSnapshot` + `SNAPSHOT_VERSION` exported from `src/lib.js`, covered by 5
  tests (58 total).