# Rock Oracle

A guide to Australian ocean and harbour pools: which one to swim in, how
conditions rate today, and the local history behind each spot.

## Language

### Places

**Pool**:
A named swimming spot with fixed coordinates and the risk metadata that
governs it. Identified by a stable id, not by name.
_Avoid_: beach, location, spot

**Natural pool**:
A pool carved from rock or filled by the surf rather than built and filled
from a tap. Carries a swell limit and a tide dependence that artificial pools
do not.
_Avoid_: rockpool, tidal pool, ocean bath

**Tide mode**:
How a pool relates to the tide: `low` (best within a couple of hours of low
water), `high` (fills from the surf, best near high water), or `none` (the
tide is irrelevant to it).
_Avoid_: tideDependent, tidal flag

**Onshore wind window**:
The range of wind directions that pushes bluebottles towards a given pool.
Harbour pools have no window, so they are never exposed.
_Avoid_: wind range, exposure

### Conditions

**WeatherSnapshot**:
The single validated, versioned reading of conditions that the entire
interface renders from. Every layer consumes this and nothing else.
_Avoid_: weather, forecast, payload, data

**Tide curve**:
A day-aligned series of water levels for one pool, one point per local hour.
A curve is either `LIVE`, taken from a tide provider, or `MODEL`, produced by
the built-in Sydney approximation when no provider reading exists.

**Tide predicate**:
The yes/no/whether test of whether a pool's tide is currently suitable for
swimming. Datum-invariant: it never assumes a water-level reference frame.
_Avoid_: tide gate, tidal check

**Swim score**:
A 0–100 rating of how good a swim would be right now, for one pool.
_Avoid_: rating, fun index

**Grade**:
The named band a swim score falls into, from `STAY HOME` up to `EPIC SWIM`.
_Avoid_: verdict, rating label

**Verdict**:
The single headline sentence shown beside the score. One per pool per day.
_Avoid_: copy, blurb, headline

**Bluebottle risk**:
The likelihood that bluebottles are being driven into a pool, from `LOW` to
`HIGH`.

**Snapshot tier**:
How trustworthy the current snapshot is: `LIVE` from the provider, `STALE`
from cache after a failed fetch, or `SIMULATED` from a seasonal estimate.
_Avoid_: freshness, cache state

### Narrative

**Deep Record**:
The collected history, local knowledge and myth attached to a pool. Beats
within it are either `VERIFIED` (sourced) or `DEEP RECORD` (myth).
_Avoid_: legend, story, lore

## Relationships

- A **Pool** has one **Tide mode** and at most one **Onshore wind window**.
- A **WeatherSnapshot** carries exactly one **Tide curve**.
- A **Swim score** produces one **Grade** and one **Verdict**, and a
  **Natural pool** may cap it by swell or tide.
- A **Pool** has at most one **Deep Record**.
