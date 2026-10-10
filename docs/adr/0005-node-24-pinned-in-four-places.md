# Node 24 pinned in four places

The build pinned Node 20 in `netlify.toml` and CI, while the development
machine ran 24, and nothing recorded the intent. Node 20 reached end-of-life on
2026-04-30, so production was running an unpatched runtime. We target Node 24
(Active LTS from 2025-10-28) and pin it identically in `.nvmrc`, the `engines`
field, `netlify.toml` and the CI workflow.

Pinning in four places looks redundant. It is not: `netlify.toml` controls the
deploy runtime, CI controls the test runtime, `.nvmrc` controls local shells,
and `engines` is what tooling reads. They drifted apart silently before.

## Consequences

- A Node bump is a four-file change, deliberately.
- `engines` should be treated as the honest declaration of the minimum version
  the project actually needs.
