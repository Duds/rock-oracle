# Production Hardening Checklist

The gate for treating Rock Oracle as production. Each item is a check that can
pass or fail, not a task title. Decisions behind the items live in
[`docs/adr/`](./adr/).

Scope: `netlify.toml`, `_headers`, `sw.js`, `index.html`, `src/`, `tests/`,
`.github/workflows/ci.yml`. Out of scope: `src/lib.js` algorithms, `DESIGN.md`
tokens, adding pools or legend content.

---

## 1. Runtime and build

- [x] **1.1** Node 24 pinned in `.nvmrc`, `engines`, `netlify.toml` and CI, all
      four agreeing — [ADR-0005](./adr/0005-node-24-pinned-in-four-places.md)
      *Now: `NODE_VERSION = "20"` in `netlify.toml`, `'20'` in CI, no `.nvmrc`,
      no `engines`. Node 20 is end-of-life.*
- [x] **1.2** Deploy happens by exactly one mechanism
      — [ADR-0007](./adr/0007-single-deploy-path.md)
      *Now: both Netlify Git integration and a GitHub Actions CLI deploy exist.*
- [x] **1.3** `main` requires a pull request with passing checks
      — [ADR-0007](./adr/0007-single-deploy-path.md)
      *Now: unprotected; direct pushes reach production.*
- [x] **1.4** `npm ci` is reproducible from the committed lockfile alone.

## 2. Publish surface

- [x] **2.1** Only app assets are published: `index.html`, `src/`, `assets/`,
      `manifest.json`, `sw.js`, `_headers`
      *Now: `publish = "."` serves `TASKS.md`, `AGENTS.md`, `docs/`, `tests/`,
      `scripts/`, `package.json` and `.github/**` at the site root.*
- [x] **2.2** No internal note, session plan or design decision is reachable
      over HTTP.
- [x] **2.3** `node_modules` and any local state are unreachable over HTTP.
- [x] **2.4** A published-paths check runs in CI so 2.1 cannot silently regress.

## 3. Response headers and transport

- [x] **3.1** Existing baseline retained: `X-Frame-Options`, `nosniff`,
      `Referrer-Policy`, `Permissions-Policy`.
- [ ] **3.2** `script-src` drops `'unsafe-inline'`
      — [ADR-0001](./adr/0001-event-delegation-over-inline-handlers.md)
      *Now: 19 inline handlers and 12 `window.*` exports force it.*
- [x] **3.3** CSP removals applied: `cdn.jsdelivr.net`, `fonts.googleapis.com`,
      `fonts.gstatic.com` gone from all directives
      — [ADR-0004](./adr/0004-vendor-third-party-assets.md)
- [ ] **3.4** Tightened CSP served in `Content-Security-Policy-Report-Only`
      first, with reports observed, then promoted to enforcing.
- [ ] **3.5** `Strict-Transport-Security` with `includeSubDomains` and
      `preload`, applied only once the custom domain is confirmed final.
- [x] **3.6** `style-src` retains `'unsafe-inline'` and the reason is recorded
      — [ADR-0001](./adr/0001-event-delegation-over-inline-handlers.md)
- [x] **3.7** No inline `onerror`/`onload`/`onclick` remains anywhere.

## 4. Offline and deploy freshness

- [x] **4.1** HTML is network-first, static assets cache-first
      — [ADR-0003](./adr/0003-network-first-html.md)
- [x] **4.2** Precache list covers the whole module graph
      *Was: listed 2 of 4 modules, and `pools.js` is imported as `?v=6` so the
      query string missed the cache key. Both fixed — the SW now matches with
      `ignoreSearch`, which is what offline actually needed.*
- [x] **4.3** Asset list is generated at build time, not hand-maintained
      *`scripts/generate-sw.js` walks `dist/` and bakes a content hash into the
      cache name, so any change to any file produces a new cache.*
- [x] **4.4** A returning visitor receives a new deploy without clearing caches
      *Verified by simulating a deploy: changing `dist/index.html` and reloading
      showed the new title with caches untouched.*
- [x] **4.5** Offline load renders the app from cache, verified with the network
      disabled in a browser
      *Verified with the context set offline: full render, Leaflet present, no
      JS exceptions. Previously the app hung on the loader.*

## 5. Third-party dependencies

- [x] **5.1** Leaflet vendored and self-hosted
      — [ADR-0004](./adr/0004-vendor-third-party-assets.md)
      *From the npm tarball, not the CDN: the CDN serves a dynamically minified
      stylesheet whose bytes are not stable, which is why no hash could be
      trusted. Hashes recorded in [vendor-provenance.md](./vendor-provenance.md).*
- [x] **5.2** Press Start 2P self-hosted, licence recorded
      *Latin subset, OFL 1.1. Latin-only changes nothing: the box-drawing and
      non-Latin glyphs the UI uses were already falling back to system fonts.*
- [x] **5.3** No runtime request leaves the origin except the weather API and
      the error endpoint
      *Verified by capturing every request: only the two Open-Meteo calls.*
- [x] **5.4** Vendored versions recorded so a bump is a deliberate act
      — [vendor-provenance.md](./vendor-provenance.md)

## 6. Interface architecture

- [ ] **6.1** `src/viewmodel.js` holds presentation logic as pure functions
      — [ADR-0006](./adr/0006-view-model-owns-conditionals.md); closes
      [wayfinder #5](https://github.com/Duds/rock-oracle/issues/5)
- [ ] **6.2** Tide-chart geometry extracted from canvas draw calls and asserted
      (high tide plots at the top; the fill below the curve is the water body).
- [ ] **6.3** Weather fetch and cache tiering move to `src/weather.js`.
- [ ] **6.4** Leaflet setup moves to `src/map.js`.
- [ ] **6.5** `index.html` is markup, wiring and DOM binding only.
- [ ] **6.6** The DOM layer performs no conditional presentation logic.
- [x] **6.7** Verdict copy is chosen from a pool-and-day seed, injectable
      — [ADR-0008](./adr/0008-seeded-verdict-copy.md)

## 7. Accessibility

- [x] **7.1** `lang` on `<html>` and landmark structure present.
      *Now: `<html lang="en">` is set; no landmarks, roles or ARIA anywhere.*
- [ ] **7.2** Tabs expose `role="tablist"`/`tab`/`tabpanel` with
      `aria-selected`, and are operable by keyboard.
- [ ] **7.3** Every control has an accessible name; icon-only controls
      (favourite, close, PWA install, copy link) are labelled.
- [ ] **7.4** Alert banners are `role="status"` or `aria-live="polite"` so a
      change is announced.
- [ ] **7.5** Text meets 4.5:1 contrast; smaller text meets it too.
- [ ] **7.6** `prefers-reduced-motion` stops the scanline, flicker, wave and
      pulse animations.
- [ ] **7.7** Usable at 200% zoom.
- [ ] **7.8** Reflows at 320px with no horizontal scroll.
- [x] **7.9** Small type is confined to decorative and secondary chrome
      — [ADR-0002](./adr/0002-pixel-scale-type-floor.md)
- [ ] **7.10** Automated check (axe or equivalent) runs in CI at zero serious
      or critical violations.

## 8. Client-side failure reporting

- [ ] **8.1** Global handlers for `error` and `unhandledrejection`
      — [ADR-0009](./adr/0009-self-hosted-error-beacon.md)
- [ ] **8.2** Failures beacon to a Netlify function; endpoint in `connect-src`.
- [ ] **8.3** A reporting failure never surfaces to the user and cannot recurse.
- [ ] **8.4** The beacon sends no personal data and no URL query strings.

## 9. Test gate

- [ ] **9.1** Existing unit suites stay green (77 tests).
- [ ] **9.2** View model covered by unit tests with no DOM and no jsdom
      — [ADR-0010](./adr/0010-browser-smoke-test-gate.md)
- [ ] **9.3** Playwright smoke suite: app loads, zero console errors, score
      renders, all six tabs activate.
- [ ] **9.4** Smoke test fails the build on any console error.
- [ ] **9.5** Smoke test runs against the built output, not the source tree.
- [ ] **9.6** Every check above that can be automated is automated.

---

## Status

**§1 Runtime and build**, **§2 Publish surface**, **§4 Offline and deploy
freshness** and **§5 Third-party dependencies** are complete — see
[#10](https://github.com/Duds/rock-oracle/issues/10),
[#11](https://github.com/Duds/rock-oracle/issues/11),
[#13](https://github.com/Duds/rock-oracle/issues/13) and
[#14](https://github.com/Duds/rock-oracle/issues/14). 24 of 51 checks ticked.

Remaining: **3.2, 3.4, 3.5** (strict `script-src`, Report-Only rollout, HSTS),
**6.x** (view-model extraction), **7.x** (accessibility), **8.x** (error
reporting) and **9.x** (test gate) — tracked by
[#12](https://github.com/Duds/rock-oracle/issues/12),
[#15](https://github.com/Duds/rock-oracle/issues/15),
[#16](https://github.com/Duds/rock-oracle/issues/16),
[#17](https://github.com/Duds/rock-oracle/issues/17) and
[#18](https://github.com/Duds/rock-oracle/issues/18).

`script-src` still carries `'unsafe-inline'`; the third-party origins are
already gone. [#15](https://github.com/Duds/rock-oracle/issues/15) removes the
inline handlers, after which [#12](https://github.com/Duds/rock-oracle/issues/12)
drops the directive.
