---
status: active
type: research
project: rock-oracle
updated: 2026-09-05
ticket: https://github.com/Duds/rock-oracle/issues/2
---

# Tide provider research: replacing the Sydney harmonic model

Resolution of wayfinder ticket [#2: Replace Sydney-tuned harmonic tide model with a real tide provider](https://github.com/Duds/rock-oracle/issues/2).

## Recommendation

**Use Open-Meteo Marine `sea_level_height_msl` as the tide provider.** It is the same
supplier the app already uses for weather, needs no API key, sends
`access-control-allow-origin: *`, and measured against authoritative BOM predictions on
5 Sep 2026 it lands high/low water within 26 to 45 minutes with the tidal range correct to
0.03 m. The current `tideAt()` model is off by up to 150 minutes.

**Do not add a second, keyed supplier now.** The fallback chain, in order:

1. Fresh `sea_level_height_msl` curve, fetched on the same refresh as weather (one extra GET).
2. Last cached curve from the persistence seam (S2), stamped with its age and shown as stale.
3. The existing `tideAt()` curve, relabelled `MODEL` in the tide tab and excluded from
   tide-dependent scoring (neutral factor, not a penalty).
4. Tide-dependent alerts degrade to the existing static "check tide times" banner.

Escalation path, only if station-grade LAT heights become a requirement: proxy WorldTides v3
through a Netlify Function so the key never reaches the browser. That adds a backend to a
deliberately no-build-step static app, so it stays a decision for a later ticket, not this one.

## Evidence (5 Sep 2026, Sydney)

Observed against BOM, the authority for Australian tide predictions. Two independent BOM
reads agree with each other and with the WillyWeather figures already captured in the
ticket: BOM `getNextTides.php` for Botany Bay (`NSW_TP001`) returned next low 2026-09-05
21:48 at 0.54 m and next high 2026-09-06 03:45 at 1.16 m, matching the recorded
21:48 / 0.54 m exactly.

Heights are metres above the datum each source publishes on: BOM publishes Australian tide
tables on LAT, Open-Meteo publishes on global mean sea level.

| Event (AEST) | BOM truth (LAT) | Open-Meteo (MSL) | Error | Current `tideAt()` | Error |
|---|---|---|---|---|---|
| High 5 Sep | 02:14, 1.17 m | 01:47, +0.34 m | -27 min | 00:47, 1.57 m | -87 min |
| Low 5 Sep | 07:52, 0.66 m | 07:07, -0.14 m | -45 min | 07:07, 0.13 m | -45 min |
| High 5 Sep | 14:41, 1.65 m | 14:07, +0.92 m | -34 min | 13:18, 1.47 m | -83 min |
| Low 5 Sep | 21:48, 0.54 m | 21:22, -0.21 m | -26 min | 19:18, 0.24 m | -150 min |
| High 6 Sep | 03:45, 1.16 m | 03:10, +0.37 m | -35 min | 01:28, 1.57 m | -137 min |

Derived numbers:

- **Phase.** Open-Meteo runs early every time, mean -33 min, worst -45 min. The current model
  averages -100 min and reaches -150 min.
- **Range.** Open-Meteo 0.48 m and 1.13 m against BOM 0.51 m and 1.11 m. The current model
  produces 1.44 m against a true 1.11 m.
- **Datum offset (BOM LAT minus Open-Meteo MSL).** +0.83, +0.80, +0.73, +0.75. Mean +0.78 m,
  spread 0.10 m. A single constant converts MSL to a display height close to published tables.
- **The 17:00 case in the ticket.** BOM truth is about 1.17 m and falling. The current model
  says 0.64 m. Open-Meteo says +0.51 m, which is +1.29 m after the +0.78 m offset.

Extremes above are parabolic interpolations of hourly values, so sub-hour precision is
modelled, not reported.

## Coverage and resolution

Sampled 10 pool coordinates (Maroubra, Bondi, Bronte, Bilgola, Shelly Beach, Balmain,
Nielsen Park, Byron Bay, Noosa, Wollongong, Batemans Bay, Half Moon Bay, St Kilda,
Williamstown). Every one returned a complete 24-hour series with no nulls.

Caveats found:

- Requests snap to a 1/24 degree grid (about 4.6 km), while the docs describe the SMOC tides
  dataset as 0.08 degrees (about 8 km). Some cells report a land elevation yet still return
  water level: Maroubra's cell is (-33.958, 151.292) at elevation 15 m.
- **Enclosed waters are not resolved.** Balmain, Bondi and Nielsen Park all snap to the same
  cell and return an identical curve. Port Phillip cells (St Kilda and Williamstown are the
  same cell) show a 1.36 m range, far larger than the bay actually experiences. Treat harbour
  and bay pools as lower confidence until measured.
- Open-Meteo's own docs say: "The reference (datum) height is the global mean sea level, not
  the lowest astronomical tide. Accuracy is limited in coastal areas, while it can be
  reasonably accurate near unobstructed coasts, it may be completely unreliable further
  inland. This data is not suitable for coastal navigation."
- A `forecast_days=16` request returned 384 hourly values. The docs list the SMOC tides
  dataset as a 10 day forecast, so trust 10 days and treat beyond that as unverified.

## Candidate comparison

| Candidate | Cost | Licence and attribution | Key | CORS | Coverage | Datum | Verdict |
|---|---|---|---|---|---|---|---|
| Open-Meteo Marine `sea_level_height_msl` | Free tier: non-commercial only, 10,000 calls/day, 5,000/hour, 600/min, 300,000/month. Commercial use needs a paid plan | CC BY 4.0, attribution required | No | Yes, `access-control-allow-origin: *` | Global ocean grid, verified at every sampled pool | Global mean sea level, explicitly not LAT | **Chosen** |
| WorldTides v3 | 100 free credits, then from $4.99/month for 20,000 credits. 1 credit per 7 days of extremes at one location, +1 for 30 minute heights, +1 for the full datum list | Brainware LLC. Australian stations are BOM data carrying a mandatory BOM disclaimer. Global data is AVISO+ FES2014/FES2022. The response `copyright` field must be reproduced in the app. Terms scope use to "individual spatial coordinates on behalf of/by an end user" and state each request "may only be used for a single user" | Yes | Not applicable, key required | Global plus the BOM station network, with a `stations` endpoint | Supports LAT, CD and MSL | Rejected for now. Per-user licence terms and credit billing do not suit a public PWA |
| Stormglass | Free 10 requests/day, then 19 EUR/month for 500/day, 49 EUR for 5,000/day, 129 EUR for 25,000/day | Not verified from primary docs, the docs site renders client side | Yes | Yes, echoes the request Origin | Global | Not verified | Rejected for now. 10 requests/day cannot serve even one user per refresh |
| BOM tides (`getNextTides.php`, `getTidesTable.php`, `tide_prediction_sites.json`) | Free | CC BY 4.0, attributed as "Bureau of Meteorology, (c) Commonwealth of Australia" | No | **No.** Returns 403 as soon as an `Origin` header is present | Australian station catalogue as GeoJSON with AAC codes, lat/lon and timezone | LAT, matching published Australian tables | Not usable from the browser. Keep as ground truth for tests |
| XTide free harmonics | Free | Flater's file is US NOS data. Non-US stations are no longer maintained. The TICON-4 alternative is CC BY 4.0 but derived from GESLA-4, whose licences are "not fully spelled out" | No key, offline | Not applicable | Australian stations not maintained | Per station | Rejected. No maintained Australian station data |
| NOAA CO-OPS, Admiralty UKHO, Copernicus/CMEMS, FES via AVISO | Free to registration-gated | Varies | Varies | Varies | US only, or not AU-focused, or NetCDF requiring heavy processing | Varies | Out of scope, none fit a client-side app |

## What this changes in the code

- New `src/weather/tide.js` behind the S1 provider seam:
  `getTideCurve(pool, now) -> {hours[], heightsMSL[], fetchedAt}` with schema validation.
- Extremes are derived, not fetched: parabolic interpolation of the hourly series gives high
  and low times to a few minutes, accurate enough for a 24 hour chart and for
  minutes-to-nearest-low.
- `TIDES`, the 25 point array built at module load in `index.html`, is replaced by the
  snapshot curve. The chart, the hourly rows and the rising/falling indicator all read it.
- **Thresholds must be recalibrated, not ported.** `index.html` gates tide-dependent pools on
  `tideAt(d.h) > 0.85` and `< 0.25`, both relative to the fake model's arbitrary datum. On
  5 Sep at 17:00 the model returns 0.64, which passes the "low tide is fine" test, while the
  real water level was about 1.17 m and falling. Re-express these rules in the view model as
  minutes to the nearest low or high, which is what the banner text already promises.
- Datum: keep MSL internally, since that is what the provider returns. If the UI shows a
  height in metres, add a per-region offset so the number matches BOM tables. Measured
  +0.78 m for the Sydney region on 5 Sep, from four extremes with 0.10 m spread.
- A Netlify Function is the escalation path for a keyed provider. Nothing changes in
  `netlify.toml` for the recommended option.

## Open questions this hands forward

- Display datum: show raw MSL, or offset to LAT so the number matches the BOM table a swimmer
  might check, or show no height at all and only the curve? Raised as
  [#9: Tide datum and tide-dependent thresholds](https://github.com/Duds/rock-oracle/issues/9).
- Accuracy envelope for enclosed waters. Sydney Harbour and Port Phillip pools read off open
  coast cells. Left in fog until the datum ticket settles how heights are presented.
