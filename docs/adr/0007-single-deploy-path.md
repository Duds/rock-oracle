# One deploy path, and main requires a passing check

Two deploy mechanisms existed. `netlify.toml` declared a build command and
publish directory for Netlify's own Git integration, while a GitHub Actions job
deployed through the Netlify CLI using two repository secrets — which
`gh secret list` does not report, and which `main` could bypass entirely
because the branch was unprotected. The Actions deploy job is deleted; Netlify's
Git integration is the only path, and `main` now requires a pull request with
passing checks.

Hardening that a direct push can walk past is advisory, not a gate. This
matters because the app's first deploy after the change is what users receive.

## Consequences

- Deploys happen on merge to `main`, gated by the test and smoke-test checks.
- The smoke test is load-bearing: it is the only automated check on the app
  shell, and it is the class of check that would have caught the `tideExtremes`
  failure that shipped.
