# Network-first HTML so a deploy reaches returning users

The service worker served `/index.html` cache-first from a hand-maintained
precache list. A returning visitor therefore kept running the previous deploy
until the cache happened to be invalidated — during development this produced a
`ReferenceError` from superseded code that persisted across reloads. HTML is
now fetched network-first with a cache fallback, while static assets stay
cache-first.

The alternative, keeping cache-first and bumping the cache version on every
deploy, was rejected: it makes deploy freshness depend on remembering a manual
step, and the failure mode is silent.

## Consequences

- Offline still works: the network-first fallback serves the cached HTML.
- Deploys are visible to returning users immediately, with no reload prompt.
- The precache list must cover the whole module graph; the previous list was
  missing two of four modules, so offline could never have worked.
