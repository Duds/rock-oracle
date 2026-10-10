# Purge inline event handlers to allow a strict script-src

The app shipped 19 inline `onclick`/`oninput` attributes and 12 `window.*`
exports that existed only so those handlers could reach module scope. That
forced `script-src 'self' 'unsafe-inline'`, which is the directive that makes
any injected string executable. We replaced the inline handlers with event
delegation in the module and deleted the globals, so `script-src` can drop
`'unsafe-inline'`.

`style-src` deliberately keeps `'unsafe-inline'`. The interface sets 20+
static `style="…"` attributes in markup and builds more inside `innerHTML`
strings (stat-bar widths, swim-window borders, Leaflet markers). Those are not
load-bearing for security the way scripts are, and tokenising them all is a
separate change. A future reader will notice the asymmetry and assume it is an
oversight; it is not.

## Consequences

- `style-src 'unsafe-inline'` remains a small XSS surface for CSS injection,
  not for script execution.
- Removing it later requires moving all inline styles to classes driven by CSS
  custom properties.
