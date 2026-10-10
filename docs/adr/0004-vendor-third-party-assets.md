# Vendoring Leaflet and the pixel font instead of using CDNs

Leaflet loaded from jsdelivr and Press Start 2P from Google Fonts, neither with
a Subresource Integrity hash, so a CDN compromise would have executed code in
this origin. Both are now vendored into the repository and self-hosted. The
font is OFL-licensed and redistributable.

SRI was the alternative, and was rejected because it pins an exact version and
requires a fresh hash on every bump — a maintenance burden that also leaves the
third-party origins in the CSP.

## Consequences

- The CSP drops `cdn.jsdelivr.net` and `fonts.googleapis.com` /
  `fonts.gstatic.com` from every directive.
- Offline support becomes possible for the whole app, not just its own assets.
- Dependency bumps are a manual file replacement, with no hash to maintain.
- This is compatible with the no-build-step constraint: vendoring is committing
  the files.
