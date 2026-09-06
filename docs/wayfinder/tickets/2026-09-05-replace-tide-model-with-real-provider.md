---
status: open
type: wayfinder
labels: [wayfinder:research]
claimed: null
created: 2026-09-05
---

# Replace Sydney-tuned harmonic tide model with a real tide provider

## Question

Which tide data source should `tideAt()` be replaced with, given the harmonic model is empirically wrong for Sydney itself (17:00 AEST 5 Sep 2026: model 0.64 m vs observed ~1.35 m falling; PM high model ~13:00 vs actual 14:41 at 1.65 m; amplitude off by up to 0.7 m)?

## Context

- Evidence captured 5 Sep 2026: WillyWeather Botany Bay shows 2:14 am 1.17 m / 7:52 am 0.66 m / 2:41 pm 1.65 m / 9:48 pm 0.54 m. Model predicted high at 01:00 and 13:00, peak 1.57 m, 17:00 value 0.64 m.
- `src/lib.js tideAt()` is M2+S2+K1 tuned for Sydney (Fort Denison) but silently reused for all 40+ pools across QLD/NSW/VIC.
- `AGENTS.md` and README already flag this as a known production gap.

## To resolve

1. Survey candidates: BOM National Tidal Centre tables (PDF/JSON), WillyWeather, WorldTides.info (API key, free tier), Storm Glass (key), NSW gov tide tables.
2. For each: cost, licence/attribution, endpoint shape, coverage for QLD/NSW/VIC pools, forecast vs realtime, suitability for a static Netlify-hosted client-side app (CORS, key exposure).
3. Recommend one provider plus the fallback chain when it fails (the existing `makeFallback` path is the seam's error branch).

## Output

A recommendation with a comparison table, recorded as the ticket resolution; feeds the per-pool station-mapping fog item on the map.
