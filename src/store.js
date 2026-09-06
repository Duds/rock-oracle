// ── PERSISTENCE STORES (wayfinder #6) + WEATHER CACHE POLICY (wayfinder #4) ──
// Contracts documented in docs/persistence-contract.md.
//
// Storage contract: { getItem(key) -> string|null, setItem(key, val) }.
// localStorage in production; an in-memory shim in tests. Nothing here touches the DOM.
//
// Versioning: every write wraps data as { version, data }. Reads accept the legacy bare
// payloads (pre-versioning favourites/recents) and migrate them on the next write.

const SCHEMA_VERSION = 1;

function readJSON(storage, key) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// Reads a versioned envelope. Legacy bare payloads (plain arrays from before versioning)
// pass through as data so favourites/recents survive the migration.
function readVersioned(storage, key) {
  const parsed = readJSON(storage, key);
  if (parsed == null) return null;
  if (Array.isArray(parsed)) return parsed;              // legacy shape
  if (parsed.version !== SCHEMA_VERSION) return null;    // future/mismatched shape
  return parsed.data ?? null;
}

function writeVersioned(storage, key, data) {
  try { storage.setItem(key, JSON.stringify({ version: SCHEMA_VERSION, data })); } catch {}
}

// ── FAVOURITES ───────────────────────────────────────────────
export function createFavs(storage) {
  const KEY = 'rock_oracle_favs';
  return {
    list() { const v = readVersioned(storage, KEY); return Array.isArray(v) ? v : []; },
    has(id) { return this.list().includes(id); },
    toggle(id) {
      const favs = this.list();
      const i = favs.indexOf(id);
      if (i >= 0) favs.splice(i, 1); else favs.unshift(id);
      writeVersioned(storage, KEY, favs);
      return favs.includes(id);
    },
  };
}

// ── RECENTLY VISITED ─────────────────────────────────────────
export function createRecents(storage, { max = 5 } = {}) {
  const KEY = 'oracle_recent';
  return {
    list() { const v = readVersioned(storage, KEY); return Array.isArray(v) ? v.slice(0, max) : []; },
    add(id) {
      const r = this.list().filter((x) => x !== id);
      r.unshift(id);
      if (r.length > max) r.length = max;
      writeVersioned(storage, KEY, r);
      return r;
    },
  };
}

// ── WEATHER CACHE (staleness policy, wayfinder #4) ───────────
// Three tiers:
//   fresh   (< ttlMs,   default 30 min) : returned always
//   stale   (< staleMs, default 7 days) : returned only when allowStale (fetch-failure path)
//   ancient (>= staleMs)                : discarded
// Version mismatch (schema change) discards regardless of age.
export function createWeatherCache(storage, { ttlMs = 30 * 60 * 1000, staleMs = 7 * 24 * 60 * 60 * 1000, normalise, version } = {}) {
  const key = (poolId) => 'oracle_wx_' + (poolId || 'default');
  return {
    read(poolId, { allowStale = false } = {}) {
      try {
        const { ts, version: v, data } = JSON.parse(storage.getItem(key(poolId)) || 'null') || {};
        if (!ts || v !== version) return null;
        const age = Date.now() - ts;
        if (age < ttlMs) return normalise(data);
        if (allowStale && age < staleMs) return normalise(data);
        return null;
      } catch { return null; }
    },
    write(poolId, data) {
      try {
        storage.setItem(key(poolId), JSON.stringify({ ts: Date.now(), version, data }));
      } catch {}
    },
  };
}
