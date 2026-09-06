// ── TIDE MODEL ───────────────────────────────────────────────
export function tideAt(h) {
  return 0.85 + 0.55*Math.sin(2*Math.PI*(h/12.42)+1.2)
              + 0.12*Math.sin(2*Math.PI*(h/12.0)+0.8)
              + 0.08*Math.sin(2*Math.PI*(h/23.93)+2.1);
}
export const TIDES = Array.from({length:25}, (_, i) => tideAt(i));

// ── UV INDEX ─────────────────────────────────────────────────
export function calcUV(hour, month, cloudCover) {
  // Peak UV for Sydney by month (Jan=0 .. Dec=11)
  const peakUV = [12,11,10,7,5,3,3,4,6,8,10,12];
  const peak = peakUV[month] || 6;
  // UV follows a bell curve peaking at solar noon (~13:00 AEST)
  const hourFrac = (hour - 13) / 6;
  const solar = Math.max(0, Math.exp(-hourFrac * hourFrac * 2.5));
  // Cloud cover reduces UV
  const cloudFactor = 1 - (cloudCover / 100) * 0.75;
  return Math.round(peak * solar * cloudFactor * 10) / 10;
}

export function uvLabel(uv) {
  if (uv <= 0)  return {text:'NONE',   cls:'ok'};
  if (uv <= 2)  return {text:'LOW',    cls:'ok'};
  if (uv <= 5)  return {text:'MOD',    cls:'ok'};
  if (uv <= 7)  return {text:'HIGH',   cls:'caution'};
  if (uv <= 10) return {text:'V.HIGH', cls:'danger'};
  return              {text:'EXTREME', cls:'danger'};
}

// ── BLUEBOTTLE RISK ──────────────────────────────────────────
export function bluebottleRisk(windDir, windSpeed, onshoreWind = { min: 22, max: 158 }, windGust = 0) {
  // onshoreWind defines the wind direction range that pushes bluebottles toward this pool.
  // Harbour pools use { min: 0, max: 0 } — always LOW (no open-ocean swell exposure).
  // windGust (km/h, optional) captures peaks: strong gusts (> 30) alone push MEDIUM → HIGH.
  if (onshoreWind.min === 0 && onshoreWind.max === 0) return { text: 'LOW', cls: 'ok', risk: 1 };
  const onshore = (windDir >= onshoreWind.min && windDir <= onshoreWind.max);
  const strong  = windSpeed >= 15 || windGust >= 30;
  if (onshore && strong)  return {text:'HIGH',   cls:'danger',  risk:3};
  if (onshore)            return {text:'MEDIUM', cls:'caution', risk:2};
  return                         {text:'LOW',    cls:'ok',      risk:1};
}

// ── SCORING ──────────────────────────────────────────────────
export function calcScore(d) {
  const wave = d.wh<=0.5?22:d.wh<=1.0?25:d.wh<=1.5?18:d.wh<=2.0?10:d.wh<=2.5?4:0;
  const wnd  = d.wind<=10?20:d.wind<=20?15:d.wind<=30?8:d.wind<=40?3:0;
  const time = (d.h>=6&&d.h<9)?20:(d.h>=15&&d.h<18)?18:(d.h>=9&&d.h<11)?14:(d.h>=11&&d.h<15)?7:(d.h>=18&&d.h<20)?10:5;
  const air  = (d.at>=22&&d.at<=28)?15:(d.at>=18&&d.at<22)?12:(d.at>=28&&d.at<33)?10:(d.at>=15&&d.at<18)?7:3;
  const sea  = (d.st>=20&&d.st<=24)?10:(d.st>=17&&d.st<20)?8:(d.st>=24&&d.st<27)?7:(d.st>=14&&d.st<17)?4:2;
  const cld  = (d.cc>=20&&d.cc<=60)?10:d.cc<20?7:d.cc<=80?6:4;
  return {
    total: Math.min(100,wave+wnd+time+air+sea+cld),
    bk: [
      {label:'WAVE HEIGHT',s:wave,m:25},{label:'WIND SPEED',s:wnd,m:20},
      {label:'TIME OF DAY',s:time,m:20},{label:'AIR TEMP',s:air,m:15},
      {label:'SEA TEMP',s:sea,m:10},{label:'CLOUD COVER',s:cld,m:10},
    ]
  };
}

export function getGrade(n) {
  if(n>=85) return {g:'EPIC SWIM',  c:'r-epic', e:'🏆',col:'#00ff88'};
  if(n>=70) return {g:'GREAT SWIM', c:'r-great',e:'⭐',col:'#ffe600'};
  if(n>=55) return {g:'DECENT SWIM',c:'r-ok',   e:'👍',col:'#ff8c00'};
  if(n>=40) return {g:'MEH SWIM',   c:'r-meh',  e:'😐',col:'#ff6eb4'};
  return           {g:'STAY HOME',  c:'r-nope', e:'🚫',col:'#ff3060'};
}

export function dirLabel(deg) {
  return ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round(deg/22.5)%16];
}

// ── WEATHER SNAPSHOT ─────────────────────────────────────────
// Versioned, validated snapshot shape. Contract documented in
// docs/weather-snapshot-contract.md (wayfinder #3). normaliseSnapshot runs at the
// S1 fetch boundary and on cache read, so every consumer sees one, typed shape.
export const SNAPSHOT_VERSION = 1;

const fin = (v) => (typeof v === 'number' && isFinite(v));
// null-safe numeric: returns v if a finite number, else fallback (null by default).
const num = (v, fb = null) => (fin(v) ? v : fb);

// A 25-point day-aligned tide curve. Live (MSL) when raw.tide.curve is a finite 25-array
// and flagged LIVE; otherwise the Sydney model curve, flagged MODEL.
function normaliseTide(rawTide) {
  const curveOk = Array.isArray(rawTide && rawTide.curve)
    && rawTide.curve.length === 25 && rawTide.curve.every(fin);
  const src = (rawTide && rawTide.src === 'LIVE' && curveOk) ? 'LIVE' : 'MODEL';
  const curve = curveOk ? rawTide.curve.slice(0, 25) : TIDES.slice(0, 25);
  return { curve, src };
}

// Collapse any weather payload (live fetch, fallback, cache) into a validated snapshot.
export function normaliseSnapshot(raw) {
  const r = raw || {};
  return {
    version: SNAPSHOT_VERSION,
    h:      num(r.h, 0),
    syd:    r.syd instanceof Date ? r.syd : new Date(r.syd),
    src:    String(r.src || 'unknown'),
    live:   !!r.live,
    at:     num(r.at),
    cc:     num(r.cc),
    wind:   num(r.wind),
    gust:   num(r.gust, 0),
    windDir:num(r.windDir),
    uvRaw:  num(r.uvRaw),
    st:     num(r.st),
    wp:     num(r.wp),
    wh:     num(r.wh),
    days:  Array.isArray(r.days) ? r.days.map((d) => ({
      at:      num(d && d.at),
      wind:    num(d && d.wind),
      windDir: num(d && d.windDir),
      cc:      num(d && d.cc),
      uvRaw:   num(d && d.uvRaw),
      wh:      num(d && d.wh),
    })) : [],
    tide:    normaliseTide(r.tide),
  };
}
