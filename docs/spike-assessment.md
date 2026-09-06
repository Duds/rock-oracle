---
status: active
type: architecture
project: rock-oracle
updated: 2026-09-05
---

# Spike Assessment: rock-oracle

Phase 1 output of the spike-to-spec refactor. Read-only inventory. No code changed.

## 1. Current shape

| Artifact | Lines | Nature |
|---|---|---|
| `index.html` | 1267 (~860 lines JS in one `<script type="module">`) | All UI, state, fetch, cache, map, PWA glue |
| `src/lib.js` | 71 | Pure domain algorithms (well-factored, 100% tested) |
| `src/pools.js` | 760 | Pool database (data, clean) |
| `src/legends.js` | 176 | Legend narratives (data, clean) |
| `tests/lib.test.js` | 189 | Vitest coverage for lib.js only |
| `sw.js`, `scripts/generate-icons.js` | small | PWA shell + icon build |

The pure-logic layer is in good shape. Nearly all architectural debt lives in `index.html`.

## 2. Core domain entities (must preserve)

- **Pool** (`src/pools.js`): id, name, suburb, state, lat/lon, timezone, `onshoreWind {min,max}`, `hasLifeguard`, `natural`, `tideDependent`, `swellLimit`. N = 40+.
- **Weather snapshot** (untyped object from `fetchWeather`): `{h, syd, src, live, at, cc, wind, windDir, uvRaw, wh, wp, st, days[]}`. This is the single most important implicit contract in the app; it is duplicated by `makeFallback()` and mutated by nothing, but nothing validates it.
- **Forecast day**: `{at, wind, windDir, cc, uvRaw, wh}` from Open-Meteo daily arrays.
- **Derived assessments** (all in `lib.js`, already pure): `tideAt` height, `calcUV`/`uvLabel`, `bluebottleRisk`, `calcScore`/`getGrade`.
- **Legend** (`src/legends.js`): keyed narrative with fact/myth beats (parsed via `splitLegendSentences`, deep-record markers).
- **User state**: favourites (`rock_oracle_favs`), recents (`oracle_recent`), weather cache (`oracle_wx_<poolId>`), all in localStorage.

## 3. Accidental coupling (where the spike hurts)

1. **Weather contract is implicit.** The shape returned by `fetchWeather` is copied by `makeFallback` (which also smuggles in seasonality logic: `warm = month>=10||<=3`). No type, no validator, no test. Anyone changing one must change both.
2. **Fallback is domain logic living in the fetch layer.** `makeFallback()` invents plausible weather AND seasonal adjustment AND random noise. It is a pseudo-forecast generator masquerading as an error path.
3. **fetch + retry + cache + render are fused.** `doRefresh()` does: fetch, retry after 2s, fall back, cache write, error banner class, render, showApp, button state. One function, six concerns, untestable without a DOM.
4. **Persistence is scattered raw localStorage calls.** Two key constants, six try/catch JSON.parse blocks, no single boundary. Fav logic (`getFavs/toggleFav`) is interleaved with header rendering.
5. **Rendering is imperative DOM soup.** ~20 `render*` functions directly mutating `document.getElementById`. Tied to hand-written element IDs. No view model separation.
6. **Date/timezone handling leaks.** `new Date(new Date().toLocaleString('en-US', {...}))` appears in both `fetchWeather` and `makeFallback`. Fragile locale parsing, duplicated.
7. **Cache has no schema or expiry.** `oracle_wx_<id>` stores whatever shape was fetched last, with no timestamp, so stale data is indistinguishable from fresh.
8. **Myth/fact beat parsing** (`splitLegendSentences`, deep-record markers) is presentation logic that is actually a domain rule about legend content, and is untested.

## 4. Critical seams (contracts to introduce)

| # | Seam | Contract needed |
|---|---|---|
| S1 | **Weather provider** | `WeatherProvider` interface: `getSnapshot(pool) -> WeatherSnapshot`. Implementations: `OpenMeteoProvider`, `FallbackProvider` (explicit, testable), `CachedProvider` (decorator). Snapshot gets a validated schema + tests. |
| S2 | **Persistence** | `FavouriteStore` / `RecentStore` / `WeatherCache` objects wrapping localStorage. JSON in/out, versioned, injectable storage (memory for tests). |
| S3 | **View model / render boundary** | Pure functions: `snapshot + pool -> view model objects`; DOM layer only consumes view models. Enables testing render decisions without DOM. |
| S4 | **Legend parser** | `parseLegend(text) -> beats[]` as a pure, tested module (`src/legend-parse.js`). |
| S5 | **Clock** | Injected `now()` / timezone conversion instead of duplicated locale-parse hacks. Also fixes `calcUV(hour...)` vs forecast-day semantics. |
| S6 | **PWA/service worker** | Explicit asset manifest list; cache versioning policy. Low priority but currently just a hardcoded array. |

## 5. What is already fine (do not touch)

- `src/lib.js` algorithms, `src/pools.js`, `src/legends.js` data.
- `tests/lib.test.js` coverage and its boundary-case discipline.
- Design system (`DESIGN.md`), CSS tokens, no-build-step constraint (vanilla modules, no bundler).
- Netlify/CI pipeline (`npm ci && npm test` before deploy).

## 6. Proposed destination (for Phase 2 sign-off)

`index.html` shrinks to a thin bootstrap + DOM binding layer. New modules (no build step, plain ESM):

```
src/weather/provider.js    S1 interface + snapshot validation
src/weather/open-meteo.js  fetch + parse
src/weather/fallback.js    deterministic seasonal fallback (no randomness in prod path? -> grilling)
src/weather/cache.js       S2 cache w/ timestamp
src/store/persistence.js   S2 favourites/recents
src/legend-parse.js        S4
src/viewmodel.js           S3 pure projection
src/clock.js               S5
index.html                 DOM wiring only
```

## 7. Open questions feeding Phase 2 fog

1. Should fallback weather stay random, or become deterministic/flagged-degraded? (grilling)
2. Cache staleness policy: TTL? show-stale-while-refreshing? (grilling)
3. Do we validate the Open-Meteo payload at the boundary, and what happens on partial data (null sea temp, missing wave height)? (grilling)
4. View model depth: how far do we go without a framework? (prototype)
5. Target test tooling stays Vitest for new modules? (research, small)