# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Run tests (watch mode for development)
npm test          # Run tests once
npm run test:watch  # Watch mode (auto-rerun on file changes)

# Generate PWA icons from SVG
npm run icons     # Creates PNG icons (192, 512, maskable) in assets/icons/

# Local server (choose one)
npx serve .                # Node.js static server
python3 -m http.server 8080  # Python static server
```

**Test Framework:** Vitest — run individual tests with `npm test -- --reporter=verbose` or filter by pattern with `npm test lib.test.js`.

---

## Project Architecture

### Single-Page App Structure

This is a **self-contained vanilla HTML/CSS/JS app** (no frameworks, no build step needed). The core logic is modularized into **three JS modules** imported by `index.html`:

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `src/lib.js` | Core algorithms: tide harmonic model, UV calculation, bluebottle risk, scoring system | `tideAt()`, `calcUV()`, `bluebottleRisk()`, `calcScore()`, `getGrade()` |
| `src/pools.js` | Ocean pool database (40+ pools across QLD/NSW/VIC) with metadata | `POOLS` array, `POOL_GROUPS` |
| `src/legends.js` | Pool-specific legend narratives (history, myths, local knowledge) | `LEGENDS` object (keyed by pool ID) |

### Data Flow

1. **Fetch weather** → Anthropic API (via `web_search` tool) or Open-Meteo direct API
2. **Process** → Regex parsing, unit conversion (m/s → km/h)
3. **Calculate** → `lib.js` functions (tide, UV, risk, score) take raw data and return structured results
4. **Render** → DOM updates (no templating library)

### URL Structure

- **Pool selection:** Pool ID passed as `?pool=<pool-id>` (e.g. `?pool=mahon-pool`)
- **Defaults to:** Mahon Pool (the primary focus pool)
- **Search/modal:** Overlay map with pool selector (Leaflet-based)

---

## Key Algorithms (src/lib.js)

All core calculations are testable functions with deterministic behavior. Tests are comprehensive (`tests/lib.test.js`).

### Tide Model
- **Function:** `tideAt(hour)` — harmonic approximation for Sydney (M2 + S2 + K1 constituents)
- **Output:** Normalized height 0–1.7m, semi-cyclic over ~12.42 hours
- **Usage:** Pass hour 0–24, get back water level for tide chart and tide-dependent scoring

### UV Index
- **Function:** `calcUV(hour, month, cloudCover)`
- **Inputs:**
  - `hour`: 0–23 AEST
  - `month`: 0–11 (Jan=0, Dec=11)
  - `cloudCover`: 0–100 (percent)
- **Output:** UV index 0–12+ (stops at 0 at sunrise/sunset due to solar curve)
- **Alert:** Triggers at UV ≥6

### Bluebottle Risk
- **Function:** `bluebottleRisk(windDir, windSpeed, onshoreWind)`
- **Pool Parameter:** Each pool has `onshoreWind: {min: deg, max: deg}` defining dangerous directions
  - Example: Mahon Pool (east-facing) = `{min: 22, max: 158}` (NE to SE)
  - Harbour pools = `{min: 0, max: 0}` (always LOW)
- **Logic:** HIGH (risk=3) if onshore + windSpeed ≥ 15; MEDIUM (risk=2) if onshore only; LOW (risk=1) otherwise
- **Return:** `{text, cls, risk}` — used for color-coding and alerts

### Swim Score (0–100)
- **Function:** `calcScore(data)` where data = `{wh, wind, h, at, st, cc}`
- **Inputs:**
  - `wh`: wave height (m)
  - `wind`: wind speed (km/h)
  - `h`: hour (0–23)
  - `at`: air temperature (°C)
  - `st`: sea temperature (°C)
  - `cc`: cloud cover (0–100%)
- **Output:** `{total: 0–100, bk: [{label, s, m}...]}` — bk array breaks down 6 factors + points/max
- **Ideal conditions:** Waves 0.5–1.5m, wind < 15 km/h, 6–9am or 3–6pm, air 22–28°C, sea 18–24°C, 20–60% cloud
- **Grade mapping:** EPIC SWIM (85+), GREAT SWIM (70–84), DECENT SWIM (55–69), MEH SWIM (40–54), STAY HOME (<40)

---

## Design System (Reference)

The app uses a cohesive **80s/90s retro-cyberpunk** aesthetic. See `DESIGN.md` for the full spec. Key constraints:

- **Colour palette:** Dark navy (#0a0e2e) bg, neon cyan (#00e5ff) accents, semantic tokens in CSS `:root`
- **Typography:** Press Start 2P pixel font (Google Fonts), 8px base, clamp() for fluid scaling
- **Borders:** 4px solid, no border-radius (square corners essential)
- **Components:** `.pbox` (cyan glow border), `.ybox` (yellow variant), `.wtile` (weather grid), `.strack` (progress bars)
- **Animations:** `flk` (flicker), `wb` (wave bounce), `pulse` (glow), `pb` (brightness)

**Design tool:** Google Stitch generates new screens using the semantic tokens defined in `DESIGN.md`. Claude Code should respect these constraints when refactoring UI.

---

## Pool Database (src/pools.js)

```javascript
{
  id: 'mahon-pool',                    // Unique identifier
  name: 'Mahon Pool',                  // Display name
  suburb: 'Maroubra',
  state: 'NSW',
  lat: -33.9455, lon: 151.2524,        // Coordinates
  timezone: 'Australia/Sydney',
  onshoreWind: { min: 22, max: 158 }, // Bluebottle risk wind range (degrees)
  hasLifeguard: false,                 // Safety flag
  natural: false,                      // Natural rock formation?
  tideDependent: true,                 // Only safe at low tide?
  swellLimit: 1.7,                     // Max safe swell (NSW NP guideline)
}
```

Pools are organized **north to south** by state (QLD → NSW → VIC). `POOL_GROUPS` array organizes them by region/category for the search overlay.

---

## Testing Pattern

Test with:
```bash
npm test              # Run all tests
npm test lib.test.js  # Run lib tests only
```

**Test style:** Vitest + Chai. Each function gets a `describe()` block with multiple `it()` cases covering:
- Boundary values (e.g. windDir=22 vs 21)
- Edge cases (midnight UV, perfect conditions)
- Clamping (scores stay in [0, 100])
- Semantic correctness (summer > winter UV)

Add tests before refactoring core algorithms. The `lib.js` module is the **source of truth** for swim logic — test coverage is critical.

---

## Deployment & Build

- **Netlify build command:** `npm ci && npm test` (installs deps + runs tests before deploy)
- **Publish directory:** `.` (root — the entire repo is published)
- **Node version:** 20 (specified in `netlify.toml`)
- **CI/CD:** Tests must pass before deployment; no manual build step

---

## Important Context

### Why Anthropic API for Weather?

The app uses Claude's `web_search` tool to fetch live Maroubra conditions because:
- Direct calls to Open-Meteo are blocked in the claude.ai artifact sandbox
- Web search returns natural-language weather summaries that are regex-parsed
- For standalone or self-hosted use, `fetchWeather()` can be replaced with direct Open-Meteo API calls (see `docs/open-meteo.md`)

### Tide Accuracy

The harmonic model (M2, S2, K1 constituents) provides a **good approximation** for Sydney. For production, integrate BOM or WorldTides API predictions (noted in README).

### Legend System

`src/legends.js` contains pool-specific narratives: historical facts, local myths, notable incidents. These are displayed in the **Legend tab**. Each pool ID maps to a legend object with `title`, `description`, `facts` array, and source attribution.

---

## Common Tasks

**Adding a new pool:**
1. Add entry to `POOLS` array in `src/pools.js` with coordinates, onshoreWind range, metadata
2. (Optional) Add legend to `LEGENDS` in `src/legends.js`
3. Test pool selector overlay to ensure it appears on map

**Refactoring calculations:**
- All core logic is in `src/lib.js` with 100% test coverage
- Always run `npm test` before committing changes to scoring/tide/UV functions
- Tests validate boundary conditions and semantic correctness

**UI changes:**
- Respect the design constraints in `DESIGN.md` (no border-radius, no pastel colors, Press Start 2P only)
- Use semantic color tokens (`.pbox`, `.ybox`, `.wtile`) — do not add inline styles for color
- Follow the retro-cyberpunk aesthetic (pixel borders, glow effects, scanline overlay)

**Alerts and banners:**
- Alert banners use `.alert-banner` with severity classes: `.alert-tide`, `.alert-uv`, `.alert-swell`, `.alert-bluebottle`
- Color inheritance from severity class (no inline color)
- Animation: `pulse 2s infinite`

---

## Files Reference

| File | Purpose |
|------|---------|
| `index.html` | Main app entry point (all-in-one HTML/CSS/JS) |
| `src/lib.js` | Core algorithms (tide, UV, risk, score) |
| `src/pools.js` | Ocean pool database (40+ pools, metadata) |
| `src/legends.js` | Pool-specific narratives and history |
| `tests/lib.test.js` | Vitest unit tests for lib.js |
| `DESIGN.md` | Design system spec (colors, typography, components) |
| `README.md` | User-facing documentation |
| `docs/open-meteo.md` | Guide for direct API integration |
| `docs/scoring.md` | Detailed swim score algorithm notes |
| `docs/legend-sources.md` | Attribution for pool legends |
| `netlify.toml` | Netlify build config |
| `scripts/generate-icons.js` | PWA icon generator (Sharp) |
| `manifest.json` | PWA manifest (metadata, icons) |
| `sw.js` | Service worker (offline capability) |

---

## Gotchas & Notes

1. **No build step:** The app is vanilla HTML/CSS/JS. Changes to `src/*.js` require a manual refresh (or build tool if you add one).

2. **Module system:** `index.html` uses `<script type="module">` to import `src/lib.js`, `src/pools.js`, `src/legends.js`. Circular imports will break; keep dependencies acyclic.

3. **Pool search overlay:** Uses Leaflet (CDN) for mapping. Pool selection updates `?pool=` query param and triggers re-render.

4. **Responsive design:** Mobile-first with `clamp()` scaling. Test on narrow screens (320px width).

5. **SVG icon requirement:** `npm run icons` reads `assets/icons/icon.svg` and generates PNG variants. The SVG must exist before running the script.

6. **Offline mode:** Service worker (`sw.js`) caches assets for PWA. Verify cache invalidation when deploying changes.
