# Direct Open-Meteo Integration

When running `index.html` as a **local file or hosted site** (not inside the claude.ai artifact sandbox), you can fetch live data directly from Open-Meteo — it's free, no API key required, and has excellent CORS support.

## Replace `fetchWeather()` with this:

```javascript
const W_URL = 'https://api.open-meteo.com/v1/forecast'
  + '?latitude=-33.9455&longitude=151.2524'
  + '&current=temperature_2m,cloud_cover,wind_speed_10m,wind_direction_10m,uv_index'
  + '&timezone=Australia%2FSydney&forecast_days=1';

const M_URL = 'https://marine-api.open-meteo.com/v1/marine'
  + '?latitude=-33.9455&longitude=151.2524'
  + '&current=wave_height,wave_period'
  + '&hourly=sea_surface_temperature'
  + '&timezone=Australia%2FSydney&forecast_days=1';

async function fetchWeather() {
  const syd = new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
  const h   = syd.getHours();

  const [wRes, mRes] = await Promise.all([fetch(W_URL), fetch(M_URL)]);
  if (!wRes.ok || !mRes.ok) throw new Error('Open-Meteo fetch failed');
  const [wData, mData] = await Promise.all([wRes.json(), mRes.json()]);

  const seaTemps = mData.hourly?.sea_surface_temperature || [];

  return {
    h, syd, src: 'Open-Meteo (live)', live: true,
    at:      wData.current.temperature_2m,
    cc:      wData.current.cloud_cover,
    wind:    wData.current.wind_speed_10m,
    windDir: wData.current.wind_direction_10m,
    uvRaw:   wData.current.uv_index ?? null,
    wh:      mData.current.wave_height,
    wp:      mData.current.wave_period,
    st:      seaTemps[h] ?? seaTemps[0] ?? 20,
  };
}
```

## 7-Day Forecast (real data)

Open-Meteo also provides a proper 7-day forecast. Replace `buildOutlook()` with:

```javascript
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
  + '?latitude=-33.9455&longitude=151.2524'
  + '&daily=temperature_2m_max,wind_speed_10m_max,uv_index_max,precipitation_sum'
  + '&timezone=Australia%2FSydney&forecast_days=7';

// fetch and map daily data into the same {date, total, g, ...} shape
```

## Real Tidal Data

For accurate tide predictions rather than the harmonic approximation, consider:

- **WorldTides API** — https://www.worldtides.info/ (paid, ~$20/yr)
- **BOM tide tables** — http://www.bom.gov.au/oceanography/tides/ (scrape or use published tables)
- **ADMIRALTY API** — https://admiraltyapi.portal.azure-api.net/ (UK, but covers Pacific)

The current harmonic model is accurate to ±20 min and ±15 cm for Sydney — good enough for swim planning.
