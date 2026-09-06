# TASKS — Rock Oracle

Tiered task list for the project. Context notes aid session continuity.

---

## NOW (Active)

- **Design System Token Layer** (COMPLETE)
  > Last: Implemented spacing, alpha, semantic tokens. All CSS values token-based.
  > Next: done. Spacing token adoption complete 2026-09-07.

---

## NEXT (Ready to Start)

- **Spacing Token Adoption** (COMPLETE, 2026-09-07)
  > All padding/margin/gap px values tokenised: exact matches (4/8/16/20/24/28) plus 10px→`--space-3`, 14px→`--space-4` rounding. Sub-8px literals (3/5/6/7px) kept: pixel-font components depend on them. Tests 49/49, brace balance OK.
  > Next: visual check at 320px/680px/1100px (see Responsive Layout Testing).
- **Responsive Layout Testing** (COMPLETE, 2026-09-07)
  > Verified visual layout and spacing token application at 320px, 680px, and 1100px breakpoints. All main views, tab views, and the search overlay render correctly without overflow or console errors. Screenshots captured and reviewed.
  > Next: Review Bluebottle Risk Algorithm.
- **Add Pool Selector Styling** — Enhance search-panel layout with token-based spacing/colors (COMPLETE)
  > Constrained width via .search-inner, sticky search header, focus/hover states, token-based padding/font-vars
- **Bluebottle Risk Algorithm Review** — Validate `bluebottleRisk()` against live conditions; consider wind gust peaks (COMPLETE, 2026-09-07)
  > Added optional `windGust` param: gust ≥ 30 km/h upgrades MEDIUM→HIGH (direction still gates). Fetch `wind_gusts_10m`, carried through snapshot + fallback. Live Maroubra confirmed value: gust 46 km/h. Tests 53/53.

---

## BLOCKED

(none currently)

---

## BACKLOG

- **Tide Graph Canvas Refactor** — Migrate tide chart canvas to SVG (better small-size rendering). All data/predicate dependencies resolved: #8 (water-level y-contract, `TIDE_Y_ORIGIN = 'top'`), #2 (live curve in `snapshot.tide`), #7 (behaviour contract), #3 (versioned snapshot), #9 (datum-invariant `tideState` predicate, landed: chart no-go shading uses it). Remaining: port the canvas drawing (curve points + no-go shading + meta line) to SVG, extract the pure curve geometry per #8, add the high-y<low-y regression test. Still the S3 view-model seam; no longer block-looped.
  > Landed #2: `fetchWeather` fetches `sea_level_height_msl` on the marine GET; live curve rendered with `[LIVE]`/`[MODEL]` source. Landed #3: tide curve now lives in the versioned `WeatherSnapshot` as `snapshot.tide` (`normaliseSnapshot` + `SNAPSHOT_VERSION`, `docs/weather-snapshot-contract.md`); cache is version-stamped. SVG migration + no-go shading still behind #9 (datum-aware scoring semantics).
- **PWA Icons** — Regenerate from `assets/icons/icon.svg` with sharp; verify maskable variant
- **Add Alert Sound** — Audio cue for UV/bluebottle warnings (accessibility + UX)
- **Offline Legend Cache** — Service worker pre-cache legends for offline browsing
- **Pool Metadata Enrichment** — Add lifeguard roster links, nearby facilities, parking info
- **Test on Real Devices** — iOS Safari, Android Chrome, tablet layouts (680px+ landscape)
- **Performance Audit** — Lighthouse score; optimize canvas rendering, API call batching
- **Deep Record Expansion** — Source more historical/mythological narratives for pools (currently 10/40+ pools covered)

---

## ARCHIVE

(none)

## EVENTS

- 2026-09-03: Migrated from ~/20-INDIE to ~/00-PERSONAL/projects/ (indie domain dissolved, task 20260829-025)
