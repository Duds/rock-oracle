#!/usr/bin/env node
// Assembles the deployable site into dist/.
//
// Only the entries in PUBLISHED are served. Everything else in the repo
// (docs/, tests/, scripts/, AGENTS.md, TASKS.md, package.json, .github/) is
// source material and must stay off the public web. See
// docs/production-hardening.md check 2.1.

import { cp, mkdir, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, 'dist');

const PUBLISHED = ['index.html', 'manifest.json', 'sw.js', '_headers', 'src', 'assets'];

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const missing = PUBLISHED.filter((entry) => !existsSync(join(ROOT, entry)));
  if (missing.length) {
    console.error('build: missing required entries:\n  ' + missing.join('\n  '));
    process.exit(1);
  }

  for (const entry of PUBLISHED) {
    await cp(join(ROOT, entry), join(OUT, entry), { recursive: true });
  }

  const files = await listFiles(OUT);
  console.log(`build: published ${files.length} files to dist/`);
  for (const file of files.sort()) console.log('  ' + file);
}

async function listFiles(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const found = await Promise.all(entries.map((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full, base) : [relative(base, full)];
  }));
  return found.flat();
}

main().catch((err) => {
  console.error('build failed:', err.message);
  process.exit(1);
});
