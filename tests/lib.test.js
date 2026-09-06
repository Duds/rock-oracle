import { describe, it, expect } from 'vitest';
import { tideAt, TIDES, calcUV, uvLabel, bluebottleRisk, calcScore, getGrade, dirLabel, normaliseSnapshot, SNAPSHOT_VERSION, tideMode, tideState, tideExtremes } from '../src/lib.js';

// ── tideAt ───────────────────────────────────────────────────
describe('tideAt', () => {
  it('returns values in plausible range for all hours', () => {
    for (let h = 0; h <= 24; h++) {
      const v = tideAt(h);
      expect(v).toBeGreaterThan(0.0);
      expect(v).toBeLessThan(1.7);
    }
  });

  it('TIDES has 25 entries (hours 0–24)', () => {
    expect(TIDES).toHaveLength(25);
  });

  it('tideAt(0) and tideAt(24) are close (semi-cyclic model)', () => {
    expect(Math.abs(tideAt(0) - tideAt(24))).toBeLessThan(0.3);
  });
});

// ── calcUV ───────────────────────────────────────────────────
describe('calcUV', () => {
  it('returns 0 at midnight (hour 0)', () => {
    expect(calcUV(0, 0, 0)).toBe(0);
  });

  it('returns 0 at hour 23', () => {
    expect(calcUV(23, 0, 0)).toBe(0);
  });

  it('peaks around solar noon (hour 13)', () => {
    const noon  = calcUV(13, 0, 0); // January, clear
    const early = calcUV(7,  0, 0);
    const late  = calcUV(19, 0, 0);
    expect(noon).toBeGreaterThan(early);
    expect(noon).toBeGreaterThan(late);
  });

  it('summer (January, month=0) gives higher UV than winter (July, month=6)', () => {
    const summer = calcUV(13, 0, 0);
    const winter = calcUV(13, 6, 0);
    expect(summer).toBeGreaterThan(winter);
  });

  it('100% cloud cover gives lower UV than 0%', () => {
    const clear  = calcUV(13, 0, 0);
    const cloudy = calcUV(13, 0, 100);
    expect(cloudy).toBeLessThan(clear);
  });

  it('returns non-negative values', () => {
    for (let h = 0; h <= 23; h++) {
      expect(calcUV(h, 0, 50)).toBeGreaterThanOrEqual(0);
    }
  });
});

// ── uvLabel ──────────────────────────────────────────────────
describe('uvLabel', () => {
  it('labels 0 as NONE', ()  => expect(uvLabel(0).text).toBe('NONE'));
  it('labels 1 as LOW', ()   => expect(uvLabel(1).text).toBe('LOW'));
  it('labels 4 as MOD', ()   => expect(uvLabel(4).text).toBe('MOD'));
  it('labels 7 as HIGH', ()  => expect(uvLabel(7).text).toBe('HIGH'));
  it('labels 10 as V.HIGH', () => expect(uvLabel(10).text).toBe('V.HIGH'));
  it('labels 11 as EXTREME', () => expect(uvLabel(11).text).toBe('EXTREME'));
});

// ── bluebottleRisk ───────────────────────────────────────────
describe('bluebottleRisk', () => {
  it('onshore E wind (90°) at 20 km/h → HIGH risk=3', () => {
    const r = bluebottleRisk(90, 20);
    expect(r.text).toBe('HIGH');
    expect(r.risk).toBe(3);
  });

  it('onshore E wind (90°) at 10 km/h (< 15) → MEDIUM risk=2', () => {
    const r = bluebottleRisk(90, 10);
    expect(r.text).toBe('MEDIUM');
    expect(r.risk).toBe(2);
  });

  it('offshore W wind (270°) at 30 km/h → LOW risk=1', () => {
    const r = bluebottleRisk(270, 30);
    expect(r.text).toBe('LOW');
    expect(r.risk).toBe(1);
  });

  it('boundary windDir=22 → onshore', () => {
    expect(bluebottleRisk(22, 20).risk).toBe(3);
  });

  it('boundary windDir=21 → offshore (LOW)', () => {
    expect(bluebottleRisk(21, 30).text).toBe('LOW');
  });

  it('boundary windDir=158 → onshore', () => {
    expect(bluebottleRisk(158, 20).risk).toBe(3);
  });

  it('boundary windDir=159 → offshore (LOW)', () => {
    expect(bluebottleRisk(159, 30).text).toBe('LOW');
  });

  it('south-facing pool (90–270°): southerly 180° at 20 km/h → HIGH', () => {
    expect(bluebottleRisk(180, 20, { min: 90, max: 270 }).text).toBe('HIGH');
  });

  it('south-facing pool: northerly 0° → LOW', () => {
    expect(bluebottleRisk(0, 30, { min: 90, max: 270 }).text).toBe('LOW');
  });

  it('harbour pool (min:0, max:0) → always LOW regardless of wind', () => {
    expect(bluebottleRisk(90, 50, { min: 0, max: 0 }).text).toBe('LOW');
  });

  it('onshore light wind + strong gust (30) → HIGH risk=3', () => {
    const r = bluebottleRisk(90, 10, { min: 22, max: 158 }, 30);
    expect(r.text).toBe('HIGH');
    expect(r.risk).toBe(3);
  });

  it('onshore light wind + gust below threshold (< 30) → MEDIUM risk=2', () => {
    const r = bluebottleRisk(90, 10, { min: 22, max: 158 }, 29);
    expect(r.text).toBe('MEDIUM');
    expect(r.risk).toBe(2);
  });

  it('offshore wind + strong gust → LOW (direction still gates)', () => {
    const r = bluebottleRisk(270, 10, { min: 22, max: 158 }, 50);
    expect(r.text).toBe('LOW');
  });

  it('defaults windGust to 0 (backward compatible)', () => {
    expect(bluebottleRisk(90, 10).risk).toBe(2);
  });
});

// ── calcScore ────────────────────────────────────────────────
describe('calcScore', () => {
  const perfect = { wh: 0.8, wind: 8, h: 7, at: 25, st: 22, cc: 40 };
  const terrible = { wh: 3.5, wind: 55, h: 2, at: 10, st: 12, cc: 90 };

  it('near-perfect conditions score close to 100', () => {
    // wh=0.8 (25pts) + wind=8 (20pts) + h=7 (20pts) + at=25 (15pts) + st=22 (10pts) + cc=40 (10pts) = 100
    expect(calcScore(perfect).total).toBe(100);
  });

  it('terrible conditions score low', () => {
    // wh>2.5 (0) + wind>40 (0) + h=2 (5) + at=10 (3) + st=12 (2) + cc=90 (4) = 14
    expect(calcScore(terrible).total).toBeLessThan(20);
  });

  it('total is clamped to [0, 100]', () => {
    expect(calcScore(perfect).total).toBeLessThanOrEqual(100);
    expect(calcScore(terrible).total).toBeGreaterThanOrEqual(0);
  });

  it('bk array has exactly 6 entries', () => {
    expect(calcScore(perfect).bk).toHaveLength(6);
  });

  it('wave height ≤ 0.5m → 22 pts', () => {
    const bk = calcScore({ ...perfect, wh: 0.4 }).bk;
    expect(bk[0].s).toBe(22);
  });

  it('wave height 0.51m → 25 pts (sweet spot)', () => {
    const bk = calcScore({ ...perfect, wh: 0.51 }).bk;
    expect(bk[0].s).toBe(25);
  });

  it('wave height 1.01m → 18 pts', () => {
    const bk = calcScore({ ...perfect, wh: 1.01 }).bk;
    expect(bk[0].s).toBe(18);
  });

  it('each bk entry has label, s, and m keys', () => {
    calcScore(perfect).bk.forEach(entry => {
      expect(entry).toHaveProperty('label');
      expect(entry).toHaveProperty('s');
      expect(entry).toHaveProperty('m');
    });
  });
});

// ── getGrade ─────────────────────────────────────────────────
describe('getGrade', () => {
  it('85 → EPIC SWIM', ()   => expect(getGrade(85).g).toBe('EPIC SWIM'));
  it('100 → EPIC SWIM', ()  => expect(getGrade(100).g).toBe('EPIC SWIM'));
  it('84 → GREAT SWIM', ()  => expect(getGrade(84).g).toBe('GREAT SWIM'));
  it('70 → GREAT SWIM', ()  => expect(getGrade(70).g).toBe('GREAT SWIM'));
  it('69 → DECENT SWIM', () => expect(getGrade(69).g).toBe('DECENT SWIM'));
  it('55 → DECENT SWIM', () => expect(getGrade(55).g).toBe('DECENT SWIM'));
  it('54 → MEH SWIM', ()    => expect(getGrade(54).g).toBe('MEH SWIM'));
  it('40 → MEH SWIM', ()    => expect(getGrade(40).g).toBe('MEH SWIM'));
  it('39 → STAY HOME', ()   => expect(getGrade(39).g).toBe('STAY HOME'));
  it('0 → STAY HOME', ()    => expect(getGrade(0).g).toBe('STAY HOME'));
});

// ── dirLabel ─────────────────────────────────────────────────
describe('dirLabel', () => {
  it('0° → N',   () => expect(dirLabel(0)).toBe('N'));
  it('90° → E',  () => expect(dirLabel(90)).toBe('E'));
  it('180° → S', () => expect(dirLabel(180)).toBe('S'));
  it('270° → W', () => expect(dirLabel(270)).toBe('W'));
  it('45° → NE', () => expect(dirLabel(45)).toBe('NE'));
  it('315° → NW',() => expect(dirLabel(315)).toBe('NW'));
});

// ── normaliseSnapshot ────────────────────────────────────────
describe('normaliseSnapshot', () => {
  it('stamps version and collapses live payload into a typed snapshot', () => {
    const s = normaliseSnapshot({
      h: 14, syd: new Date('2026-09-07T04:00:00Z'), src: 'Open-Meteo (live)', live: true,
      at: 20, cc: 40, wind: 18.5, gust: 46, windDir: 148, uvRaw: 4,
      st: 19, wp: 8, wh: 1.1, days: [{ at: 22, wind: 15, windDir: 90, cc: 10, uvRaw: 6, wh: 0.8 }],
      tide: { curve: Array.from({ length: 25 }, (_, i) => i * 0.1), src: 'LIVE' },
    });
    expect(s.version).toBe(SNAPSHOT_VERSION);
    expect(s.live).toBe(true);
    expect(s.gust).toBe(46);
    expect(s.tide.src).toBe('LIVE');
    expect(s.tide.curve).toHaveLength(25);
    expect(s.days).toHaveLength(1);
    expect(s.days[0].wind).toBe(15);
    expect(s.syd instanceof Date).toBe(true);
  });

  it('defaults gust to 0 and tolerates missing optional fields as null', () => {
    const s = normaliseSnapshot({ h: 8, syd: new Date('2026-09-07T04:00:00Z'), wind: 10, at: 18, cc: 20, windDir: 90, st: 20 });
    expect(s.gust).toBe(0);
    expect(s.uvRaw).toBe(null);
    expect(s.wp).toBe(null);
    expect(s.wh).toBe(null);
    expect(s.days).toEqual([]);
  });

  it('invalid/absent tide curve falls back to the MODEL curve', () => {
    const s = normaliseSnapshot({ h: 8, syd: new Date(), wind: 5, at: 20, cc: 30, st: 20 });
    expect(s.tide.src).toBe('MODEL');
    expect(s.tide.curve).toEqual(TIDES);
  });

  it('LIVE label without a valid 25-array curve is downgraded to MODEL', () => {
    const s = normaliseSnapshot({ h: 8, syd: new Date(), wind: 5, at: 20, cc: 30, st: 20, tide: { curve: [1, 2, 3], src: 'LIVE' } });
    expect(s.tide.src).toBe('MODEL');
    expect(s.tide.curve).toEqual(TIDES);
  });

  it('converts a syd string back into a Date (cache round-trip)', () => {
    const s = normaliseSnapshot({ h: 10, syd: '2026-09-07T05:00:00.000Z', wind: 5, at: 21, cc: 30, st: 20 });
    expect(s.syd instanceof Date).toBe(true);
  });
});

// ── tideMode / tideState / tideExtremes (wayfinder #9) ──────
describe('tideMode', () => {
  it('true → low, high → high, false/undefined → none', () => {
    expect(tideMode({ tideDependent: true })).toBe('low');
    expect(tideMode({ tideDependent: 'high' })).toBe('high');
    expect(tideMode({ tideDependent: false })).toBe('none');
    expect(tideMode({})).toBe('none');
    expect(tideMode(null)).toBe('none');
  });
});

// One high at index 6, one low at index 18 (a single clean wave).
function sineWave() { return Array.from({ length: 25 }, (_, i) => Math.sin((i / 24) * 2 * Math.PI)); }

describe('tideExtremes', () => {
  it('finds exactly one high (6) and one low (18) on a clean sine day', () => {
    const ex = tideExtremes(sineWave());
    const highs = ex.filter((e) => e.type === 'high').map((e) => e.index);
    const lows = ex.filter((e) => e.type === 'low').map((e) => e.index);
    expect(highs).toContain(6);
    expect(lows).toContain(18);
    expect(ex).toHaveLength(2);
  });
  it('returns empty for a too-short curve', () => {
    expect(tideExtremes([1, 2])).toEqual([]);
    expect(tideExtremes(null)).toEqual([]);
  });
});

describe('tideState', () => {
  const c = sineWave();
  it('low mode is favourable within 120 min of a low tide, unfavourable far from it', () => {
    expect(tideState(c, 18, 'low').favourable).toBe(true);
    expect(tideState(c, 19, 'low').favourable).toBe(true);
    expect(tideState(c, 16, 'low').favourable).toBe(true);   // exactly 2 h → boundary inclusive
    expect(tideState(c, 15.5, 'low').favourable).toBe(false);
    expect(tideState(c, 6, 'low').favourable).toBe(false);   // midday, far from low
    expect(tideState(c, 18, 'low').nearest.minutes).toBe(0);
  });
  it('high mode mirrors: favourable near high tide', () => {
    expect(tideState(c, 6, 'high').favourable).toBe(true);
    expect(tideState(c, 7, 'high').favourable).toBe(true);
    expect(tideState(c, 18, 'high').favourable).toBe(false); // near low → bad for fill pools
  });
  it('respects a custom lowWindow', () => {
    expect(tideState(c, 17, 'low', { lowWindow: 60 }).favourable).toBe(true);  // 1h
    expect(tideState(c, 16, 'low', { lowWindow: 60 }).favourable).toBe(false); // 2h > 60
  });
  it('none mode or missing curve returns favourable null (degraded, no penalty)', () => {
    expect(tideState(c, 18, 'none').favourable).toBe(null);
    expect(tideState([1, 2], 10, 'low').favourable).toBe(null);
    expect(tideState(c, 18, 'low').nearest).not.toBe(null);
  });
});
