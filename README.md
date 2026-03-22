# Mahon Pool Tracker 🏊

Real-time swim conditions tracker for [Mahon Pool](https://www.randwick.nsw.gov.au/facilities-and-recreation/beaches-and-coast/ocean-pools/mahon-pool), Maroubra NSW Australia.

**Coordinates:** 33.9455°S 151.2524°E — Jack Vanny Reserve

---

## Features

- **Live conditions** — air temp, sea temp, wave height/period, wind speed/direction, cloud cover
- **UV index** — calculated from Sydney seasonal peak UV, solar angle, and cloud cover. Alert fires at UV 6+
- **Bluebottle risk** — based on wind direction (NE–SE onshore = risk for Maroubra's east-facing beach)
- **Swim score** — 0–100 index across 6 weighted factors
- **Fun index** — pixel block meter + rotating comedy verdicts
- **24h tide chart** — harmonic model (M2 + S2 + K1 constituents) for Sydney
- **Top 5 swim windows** — best hours today ranked by score + tide
- **7-day outlook** — projected scores using seasonal variation
- **PWA** — installable to phone home screen, offline capable

---

## How It Works

### Data Source
Live weather is fetched via the **Anthropic API** with the `web_search` tool. Claude searches for current Maroubra conditions and returns values in a structured format that the app parses with regex.

Direct fetches to [Open-Meteo](https://open-meteo.com) are blocked in the claude.ai artifact sandbox. When running as a standalone local file or hosted site, you can replace `fetchWeather()` with direct Open-Meteo calls — see `docs/open-meteo.md`.

### Scoring System

| Factor       | Max pts | Notes |
|--------------|---------|-------|
| Wave height  | 25      | Ideal 0.5–1.5m for Mahon Pool |
| Wind speed   | 20      | Under 15 km/h = glassy |
| Time of day  | 20      | 6–9am and 3–6pm peak |
| Air temp     | 15      | Ideal 22–28°C |
| Sea temp     | 10      | Ideal 18–24°C |
| Cloud cover  | 10      | Partial cloud (20–60%) preferred |

### Bluebottle Logic
Maroubra Beach faces east. Onshore winds (NE–SE, 22°–158°) push bluebottles toward shore.
- **LOW** — offshore winds (W/SW/NW)
- **MEDIUM** — light onshore (< 15 km/h)
- **HIGH** — strong onshore (≥ 15 km/h)

### UV Calculation
Uses Sydney's monthly peak UV values and a Gaussian solar curve peaking at 13:00 AEST, adjusted for cloud cover.

```
UV = peakUV[month] × solar_factor(hour) × (1 - cloud_cover × 0.75)
```

---

## Project Structure

```
mahon-pool-tracker/
├── index.html          # Main app (self-contained)
├── README.md
├── docs/
│   ├── open-meteo.md   # Direct API integration guide
│   └── scoring.md      # Detailed scoring algorithm notes
└── assets/
    └── icons/          # PWA icons (add your own)
```

---

## Running Locally

Just open `index.html` in any modern browser. No build step, no dependencies.

```bash
# Or serve with any static server, e.g.:
npx serve .
python3 -m http.server 8080
```

---

## Extending the Project

### Replace Claude web search with direct Open-Meteo

When running outside the claude.ai sandbox, direct API calls work fine. Replace `fetchWeather()` in `index.html`:

```javascript
const W_URL = 'https://api.open-meteo.com/v1/forecast?latitude=-33.9455&longitude=151.2524&current=temperature_2m,cloud_cover,wind_speed_10m,wind_direction_10m,uv_index&timezone=Australia%2FSydney&forecast_days=1';
const M_URL = 'https://marine-api.open-meteo.com/v1/marine?latitude=-33.9455&longitude=151.2524&current=wave_height,wave_period&hourly=sea_surface_temperature&timezone=Australia%2FSydney&forecast_days=1';
```

### Add real tidal data
The current tide model is a harmonic approximation. For production use, integrate the [BOM tide predictions API](http://www.bom.gov.au/oceanography/tides/) or [WorldTides API](https://www.worldtides.info/).

### Refactor into components
The app is currently a single HTML file. For a larger project:
- Extract CSS → `styles.css`
- Extract JS → `src/fetch.js`, `src/scoring.js`, `src/render.js`, `src/tide.js`
- Add a build step with Vite or esbuild

### Add notifications
Use the Web Notifications API to alert when conditions hit "EPIC SWIM" score.

---

## Disclaimers

⚠️ **This is not an official safety resource.** Always check conditions in person before swimming. There is no lifeguard on duty at Mahon Pool. Check [BOM](http://www.bom.gov.au) for official forecasts.

Data is sourced from web search results and may not reflect actual current conditions.

---

## Built With

- Vanilla HTML/CSS/JS — zero dependencies
- [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) — pixel font (Google Fonts)
- [Anthropic API](https://docs.anthropic.com) — weather data via `web_search` tool
- Harmonic tide model — M2 + S2 + K1 tidal constituents for Sydney
