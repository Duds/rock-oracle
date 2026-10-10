#!/usr/bin/env node
// Generates sw.js's precache list from dist/, so the asset list cannot drift
// from what the app actually imports.
//
// Background: the hand-maintained list named 2 of the 4 imported modules and
// missed the `?v=` query string, so offline could never work. See
// docs/production-hardening.md checks 4.2 and 4.3.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'dist');

// Never precached: the worker itself is fetched by the browser, the manifest is
// not needed to boot, and _headers is server config rather than an asset.
const EXCLUDE = new Set(['sw.js', 'manifest.json', '_headers']);

// Directory contents are precached only inside these. docs/, tests/ and
// scripts/ are not published at all, so this is a second line of defence.
const INCLUDE_DIRS = ['src/', 'assets/'];

async function walk(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const found = await Promise.all(entries.map((entry) => {
    const full = join(dir, entry.name);
    const rel = (base === dir ? entry.name : join(dir, entry.name).slice(base.length + 1));
    return entry.isDirectory() ? walk(full, base) : [rel.split('\\').join('/')];
  }));
  return found.flat();
}

function versionFor(contents) {
  const hash = createHash('sha256');
  for (const key of Object.keys(contents).sort()) {
    hash.update(key);
    hash.update(contents[key]);
  }
  return hash.digest('hex').slice(0, 12);
}

async function main() {
  if (!existsSync(DIST)) {
    console.error('generate-sw: dist/ not found — run `npm run build` first');
    process.exit(1);
  }

  const all = await walk(DIST);
  const assets = all
    .filter((file) => !EXCLUDE.has(file))
    .filter((file) => !file.includes('/') || INCLUDE_DIRS.some((d) => file.startsWith(d)))
    .sort();

  if (!assets.includes('index.html')) {
    console.error('generate-sw: index.html missing from dist/');
    process.exit(1);
  }

  // Absolute paths, and the document keyed at '/' rather than '/index.html'.
  // Hosts commonly redirect /index.html -> /, and cache.addAll stores a
  // redirected response under the requested key while navigations request '/'.
  // Keying both at '/' avoids a cache miss (or an outright addAll rejection)
  // for the one asset offline cannot do without.
  const precache = ['/'].concat(
    assets.filter((file) => file !== 'index.html').map((file) => '/' + file)
  );

  // Cache key is a content hash, so a deploy that changes any file changes the
  // version and the old cache is dropped on activate.
  const contents = {};
  for (const file of assets) contents[file] = await readFile(join(DIST, file));
  const version = versionFor(contents);

  const template = await readFile(join(ROOT, 'scripts', 'sw.template.js'), 'utf8');
  const output = template
    .replace('__CACHE_NAME__', `oracle-${version}`)
    .replace('__PRECACHE__', JSON.stringify(precache, null, 2));

  await writeFile(join(DIST, 'sw.js'), output);
  console.log(`generate-sw: oracle-${version}, ${precache.length} entries precached`);
  for (const entry of precache) console.log('  ' + entry);
}

main().catch((err) => {
  console.error('generate-sw failed:', err.message);
  process.exit(1);
});
