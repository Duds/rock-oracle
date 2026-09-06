---
status: active
type: wayfinder
labels: [wayfinder:map]
tracker: https://github.com/Duds/rock-oracle/issues/1
project: rock-oracle
charted: 2026-09-05
migrated: 2026-09-05
---

# Wayfinder Map: rock-oracle spike-to-spec refactor

> **Canonical tracker moved to GitHub issues 5 Sep 2026.** The map is now
> [issue #1](https://github.com/Duds/rock-oracle/issues/1) (pinned); tickets are
> child issues #2–#8. This file and `tickets/` are the pre-migration mirror,
> kept for history; do not update them going forward.

## Destination

A complete, decision-complete refactor spec (`docs/refactor-spec.md`) for turning the rock-oracle spike into the spec-driven architecture defined in `docs/spike-assessment.md`: seams S1–S6 contracted and testable, the Sydney-tuned tide model replaced by a decided real-data provider, `index.html` reduced to bootstrap + DOM binding. Zero open architectural decisions remain; implementation hands off to vertical-slice TDD execution (Phase 4).

## Notes

- Domain: vanilla ESM, no build step, no framework. Any proposal must survive `npm test` + Netlify deploy (`netlify.toml`).
- Consult: `docs/spike-assessment.md` (seams S1–S6, coupling inventory), `DESIGN.md` (design tokens are frozen).
- Standing preference: evidence-first. Today's live tide checks (Botany Bay 2:14 am 1.17 m / 2:41 pm 1.65 m vs model 0.64 m at 17:00) are founding evidence for the tide-provider work.
- Tracker: GitHub issues ([map = issue #1](https://github.com/Duds/rock-oracle/issues/1), pinned). Tickets are child issues, labelled `wayfinder:*`, with native cross-references for blocking.

## Decisions so far

- [Tide chart y-mapping is a water-level contract](https://github.com/Duds/rock-oracle/issues/8) (closed): high tide plots at canvas top, fill region below curve is the water body; reverted the 180° inversion, semantics now named for extraction into the view model.

### Open tickets (frontier)

- [#2 Replace Sydney-tuned harmonic tide model with a real tide provider](https://github.com/Duds/rock-oracle/issues/2) — `research`, unblocked, foundational.
- [#3 Weather snapshot contract](https://github.com/Duds/rock-oracle/issues/3) — `grilling`, unblocked.
- [#4 Weather cache staleness policy](https://github.com/Duds/rock-oracle/issues/4) — `grilling`, blocked by #3.
- [#5 View model projection: how far without a framework](https://github.com/Duds/rock-oracle/issues/5) — `prototype`, unblocked.
- [#6 Persistence boundary](https://github.com/Duds/rock-oracle/issues/6) — `grilling`, unblocked.
- [#7 Tide chart behaviour contract](https://github.com/Duds/rock-oracle/issues/7) — `grilling`, blocked by #2.

## Not yet specified

- Per-pool tide station mapping: which station serves each of the 40+ pools once a provider is chosen (depends on provider research).
- Service worker cache versioning policy: how `sw.js` asset list and the weather cache interact with the new persistence seam (depends on persistence + cache decisions).
- CI/test tooling migration shape: whether Vitest coverage extends to DOM-less modules only or adds jsdom (depends on view-model prototype outcome).
- Weather snapshot schema versioning: how the cached payload shape migrates when the validated contract lands (depends on snapshot contract).

## Out of scope

- Rewriting `src/lib.js` algorithms (score/UV/bluebottle): already pure, tested, correct.
- Design system changes: `DESIGN.md` tokens and Press Start 2P aesthetic are frozen.
- Adding new pools or legend entries: content work, not architecture.
- Replacing Leaflet or the no-build-step constraint: deployment and stack decisions already made.
- Mobile/native app packaging.
