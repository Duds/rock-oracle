# Client errors are beacons to a Netlify function, not a hosted service

Nothing reported client-side failures. A `ReferenceError` in the render path
shipped and broke the interface on every load while the deploy stayed green,
because a static site cannot catch a throw that happens in the browser after
delivery. A global error handler now posts failures to a Netlify function for
logging.

A hosted service such as Sentry was the alternative and was rejected because it
reintroduces a third-party origin into the CSP that vendoring had just removed,
for an app with no accounts and no user data.

## Consequences

- The CSP must allow the function endpoint in `connect-src`.
- The endpoint should stay dependency-free and must not become a data store.
- Failure reporting is best-effort: an error while reporting an error is
  swallowed.
