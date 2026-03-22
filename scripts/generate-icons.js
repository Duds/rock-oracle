#!/usr/bin/env node
/**
 * Generates PNG PWA icons from assets/icons/icon.svg
 * Requires: npm install (sharp is added as a dev dependency)
 *
 * Usage: npm run icons
 */
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const iconsDir = join(root, 'assets', 'icons');
const svgPath = join(iconsDir, 'icon.svg');

mkdirSync(iconsDir, { recursive: true });

const svg = readFileSync(svgPath);

const sizes = [
  { name: 'apple-touch-icon.png', size: 180, rounded: false },
  { name: 'icon-192.png',         size: 192, rounded: false },
  { name: 'icon-512.png',         size: 512, rounded: false },
  { name: 'icon-maskable-512.png', size: 512, rounded: false },
];

for (const { name, size } of sizes) {
  const outPath = join(iconsDir, name);
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✓ ${name} (${size}×${size})`);
}

console.log('\nAll icons generated in assets/icons/');
