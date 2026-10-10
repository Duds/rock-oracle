# Vendored third-party assets

Provenance for everything under `assets/vendor/` and `assets/fonts/`. Nothing
here is loaded from a third-party origin at runtime — see
[ADR-0004](./adr/0004-vendor-third-party-assets.md).

## Leaflet 1.9.4

Source: the published npm tarball for `leaflet@1.9.4`.

- Registry tarball integrity: `sha512-nxS1ynzJOmOlHp+iL3FyWqK89GtNL8U8rvlMOsQdTTssxZwCXh8N2NB3GDQOL+YR3XnWyZAxwQixURb+FA74PA==`
- Registry tarball shasum: `23fae724e282fa25745aff82ca4d394748db7d8d`

Files taken from `package/dist/`:

| File | sha256 |
|---|---|
| `leaflet.js` | `db49d009c841f5ca34a888c96511ae936fd9f5533e90d8b2c4d57596f4e5641a` |
| `leaflet.css` | `a7837102824184820dfa198d1ebcd109ff6d0ff9a2672a074b9a1b4d147d04c6` |

`package/dist/images/` is also taken verbatim: `layers.png`, `layers-2x.png`,
`marker-icon.png`, `marker-icon-2x.png`, `marker-shadow.png`. `leaflet.css`
references them relatively as `images/…`, which is why they sit in a sibling
`images/` directory rather than beside the stylesheet.

### Why not the CDN files

The CDN previously used here serves a *dynamically minified* stylesheet — its own
banner reads "Do NOT use SRI with dynamically generated files!" — so its bytes
are not stable across fetches and cannot carry a verifiable hash. That is why
this project shipped without `integrity` attributes for so long. The npm tarball
is the authoritative artefact and is reproducible.

Note that `package/dist/leaflet.js` is already minified upstream; there is no
`.min.js` in the tarball. `leaflet.css` is not minified upstream, and is
therefore slightly larger than the CDN variant it replaces.

## Fonts

Both families are licensed under the SIL Open Font License 1.1, which permits
redistribution. Only the **latin** subset is vendored.

Latin-only is deliberate and does not change rendering. The interface uses
box-drawing characters (`▓`, `░`, `■`) and non-Latin symbols (`⏱`, `◼`, `🪼`,
`★`), none of which exist in these fonts' latin ranges — they already fall back
to system fonts, so omitting the other subsets removes no glyph the app can
currently draw.

| File | Family | sha256 |
|---|---|---|
| `press-start-2p-latin.woff2` | Press Start 2P 400 normal | `42144b97bd2942ea606e5d880684eae0f7be5c804bdd57b1faac5a8d7699ae6e` |
| `crimson-text-italic-latin.woff2` | Crimson Text 400 italic | `381a244e30f7b32581984c81692d9a3b4babcb7e4a308d9bd7c62bf7866450d1` |

Both are valid WOFF2 (file signature `wOF2`). `@font-face` rules with the
matching `unicode-range` live in `index.html`, not in a separate stylesheet, so
the unstyled-text window is shorter.

## Updating

Bumping either dependency means replacing the files, updating the hashes in this
document, and updating the version references in `_headers` comments and
`index.html`. There is no automation for this: it is a deliberate manual act, and
check 5.4 exists to make it one.
