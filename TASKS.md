# TASKS — Rock Oracle

Tiered task list for the project. Context notes aid session continuity.

---

## NOW (Active)

- **Design System Token Layer** (COMPLETE)
  > Last: Implemented spacing, alpha, semantic tokens. All CSS values token-based.
  > Next: Start spacing token adoption phase or move to NEXT.

---

## NEXT (Ready to Start)

- **Spacing Token Adoption** — Apply `--space-*` vars to padding/margin/gap throughout index.html (phase-based by section)
- **Responsive Layout Testing** — Test at 320px, 680px, 1100px breakpoints; verify tab/search overlays
- **Add Pool Selector Styling** — Enhance search-panel layout with token-based spacing/colors
- **Bluebottle Risk Algorithm Review** — Validate `bluebottleRisk()` against live conditions; consider wind gust peaks

---

## BLOCKED

(none currently)

---

## BACKLOG

- **Tide Graph Canvas Refactor** — Consider SVG alternative to canvas for better rendering at small sizes
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
