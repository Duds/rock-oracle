import { describe, it, expect, beforeEach } from 'vitest';
import { createFavs, createRecents, createWeatherCache } from '../src/store.js';

// In-memory storage shim matching the localStorage contract.
function memStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
  };
}

let storage;
beforeEach(() => { storage = memStorage(); });

describe('createFavs', () => {
  it('toggles ids and persists across store instances (same storage)', () => {
    const a = createFavs(storage);
    expect(a.list()).toEqual([]);
    expect(a.toggle('mahon-pool')).toBe(true);
    expect(a.toggle('bondi-icebergs')).toBe(true);
    expect(a.list()).toEqual(['bondi-icebergs', 'mahon-pool']);
    const b = createFavs(storage);
    expect(b.list()).toEqual(['bondi-icebergs', 'mahon-pool']);
    expect(b.has('mahon-pool')).toBe(true);
  });

  it('untoggling removes and returns false', () => {
    const f = createFavs(storage);
    f.toggle('x');
    expect(f.toggle('x')).toBe(false);
    expect(f.list()).toEqual([]);
  });

  it('migrates a legacy bare-array payload instead of discarding it', () => {
    storage.setItem('rock_oracle_favs', JSON.stringify(['old-pool']));
    const f = createFavs(storage);
    expect(f.list()).toEqual(['old-pool']);
    f.toggle('new-pool');
    // next write upgrades to the versioned envelope
    const parsed = JSON.parse(storage.getItem('rock_oracle_favs'));
    expect(parsed.version).toBe(1);
    expect(parsed.data).toContain('old-pool');
  });

  it('rejects future/mismatched versions and returns empty list', () => {
    storage.setItem('rock_oracle_favs', JSON.stringify({ version: 99, data: ['x'] }));
    expect(createFavs(storage).list()).toEqual([]);
  });

  it('corrupt JSON yields empty list, never throws', () => {
    storage.setItem('rock_oracle_favs', '{not json');
    expect(createFavs(storage).list()).toEqual([]);
  });
});

describe('createRecents', () => {
  it('caps at max (default 5), most recent first, no duplicates', () => {
    const r = createRecents(storage);
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) r.add(id);
    expect(r.list()).toEqual(['f', 'e', 'd', 'c', 'b']);
    r.add('c');
    expect(r.list()[0]).toBe('c');
    expect(r.list().filter((x) => x === 'c')).toHaveLength(1);
  });

  it('migrates a legacy bare array', () => {
    storage.setItem('oracle_recent', JSON.stringify(['p1', 'p2']));
    expect(createRecents(storage).list()).toEqual(['p1', 'p2']);
  });
});

describe('createWeatherCache', () => {
  const norm = (d) => ({ ...d, normalised: true });
  const opts = { ttlMs: 1000, staleMs: 5000, normalise: norm, version: 7 };
  let now;
  beforeEach(() => { now = 1_000_000; });

  // stub Date.now
  beforeEach(() => {
    const real = Date.now;
    Date.now = () => now;
    return () => { Date.now = real; };
  });

  it('fresh (< ttl) read returns normalised data', () => {
    const c = createWeatherCache(storage, opts);
    c.write('pool-a', { wind: 10 });
    expect(c.read('pool-a')).toEqual({ wind: 10, normalised: true });
  });

  it('stale tier: hidden by default, served with allowStale, discarded past staleMs', () => {
    const c = createWeatherCache(storage, opts);
    c.write('pool-a', { wind: 10 });
    now += 3000; // past ttl (1s), within stale (5s)
    expect(c.read('pool-a')).toBe(null);
    expect(c.read('pool-a', { allowStale: true })).toEqual({ wind: 10, normalised: true });
    now += 3000; // now past staleMs
    expect(c.read('pool-a', { allowStale: true })).toBe(null);
  });

  it('version mismatch discards regardless of age', () => {
    const cWrite = createWeatherCache(storage, opts);          // writes version 7
    cWrite.write('pool-a', { wind: 10 });
    const cRead = createWeatherCache(storage, { ...opts, version: 2 });
    expect(cRead.read('pool-a')).toBe(null);
  });

  it('per-pool keys: one pool\'s entry never leaks to another', () => {
    const c = createWeatherCache(storage, opts);
    c.write('pool-a', { wind: 1 });
    c.write('pool-b', { wind: 2 });
    expect(c.read('pool-a').wind).toBe(1);
    expect(c.read('pool-b').wind).toBe(2);
    expect(c.read('pool-c')).toBe(null);
  });

  it('corrupt payload returns null instead of throwing', () => {
    storage.setItem('oracle_wx_pool-a', 'not json');
    const c = createWeatherCache(storage, opts);
    expect(c.read('pool-a')).toBe(null);
  });
});
