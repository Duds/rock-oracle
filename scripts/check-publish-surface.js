#!/usr/bin/env node
// Fails if anything that is not meant to be public ends up in dist/.
//
// Guards docs/production-hardening.md checks 2.1-2.3 and 2.4: a future edit to
// the build allowlist, or a new file dropped into a published directory, must
// not silently expose internal notes over HTTP.

import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'dist');

// Directories that may be published, plus the exact files allowed at the root.
const ALLOWED_DIRS = ['src/', 'assets/'];
const ALLOWED_ROOT_FILES = new Set(['index.html', 'manifest.json', 'sw.js', '_headers']);

// Names that must never reach the public web, checked independently of the
// allowlist so the intent survives a careless widening of it.
const FORBIDDEN = [
  /(^|\/)docs\//,
  /(^|\/)tests\//,
  /(^|\/)scripts\//,
  /(^|\/)\.github\//,
  /(^|\/)node_modules\//,
  /(^|\/)content\//,
  /(^|\/)package(-lock)?\.json$/,
  /\.md$/,
  /(^|\/)\.env/,
  /\.log$/,
];

const REQUIRED = ['index.html', 'sw.js', 'manifest.json', '_headers'];

async function listFiles(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const found = await Promise.all(entries.map((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full, base) : [relative(base, full)];
  }));
  return found.flat();
}

async function main() {
  if (!existsSync(DIST)) {
    console.error('check-publish-surface: dist/ not found — run `npm run build` first');
    process.exit(1);
  }

  const files = (await listFiles(DIST)).map((f) => f.split('\\').join('/'));
  const problems = [];

  for (const file of files) {
    const forbidden = FORBIDDEN.find((pattern) => pattern.test(file));
    if (forbidden) {
      problems.push(`${file} is forbidden (matched ${forbidden})`);
      continue;
    }
    const allowed = ALLOWED_ROOT_FILES.has(file) || ALLOWED_DIRS.some((d) => file.startsWith(d));
    if (!allowed) problems.push(`${file} is not in the publish allowlist`);
  }

  for (const file of REQUIRED) {
    if (!files.includes(file)) problems.push(`${file} is required but was not published`);
  }

  if (problems.length) {
    console.error('check-publish-surface: FAILED');
    for (const problem of problems) console.error('  ' + problem);
    process.exit(1);
  }

  console.log(`check-publish-surface: OK — ${files.length} files, all within the allowlist`);
}

main().catch((err) => {
  console.error('check-publish-surface failed:', err.message);
  process.exit(1);
});
