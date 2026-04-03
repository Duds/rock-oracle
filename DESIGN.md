# DESIGN.md — Mahon Pool Tracker

This file is the single source of truth for design decisions. It is read by Google Stitch when generating new screens and by Claude Code when refactoring existing UI.

---

## Aesthetic

**Abyssal deep-sea research station.** Dark teal-slate backgrounds (not pure navy), neon cyan and green accents, pixel font for UI / serif italic for atmospheric text, CRT scanline overlay. Think submersible instrument panel meets ocean mythology archive.

Do NOT generate: rounded corners (border-radius), shadows, gradients (except bg gradients on headers), flat/material design patterns, Tailwind utility classes, or any pastel/light-mode palette.

---

## Colour Palette

| Token | Variable | Hex | Usage |
|---|---|---|---|
| `--color-bg-primary` | `var(--dk)` | `#0A141E` | Page background, overlays |
| `--color-bg-surface` | `var(--md)` | `#0F1D2E` | Cards, panels, nav |
| `--color-bg-raised` | `var(--bl)` | `#162A3A` | Hover states, button shadows |
| `--color-accent-primary` | `var(--cy)` | `#81ECFF` | Borders, titles, primary actions, links |
| `--color-accent-secondary` | `var(--pk)` | `#587D84` | Secondary actions, copy/share |
| `--color-success` | `var(--gn)` | `#00ff88` | Good conditions, active states, PWA install |
| `--color-warning` | `var(--yw)` | `#FED96C` | Caution conditions, warning states |
| `--color-caution` | `var(--or)` | `#ff8c00` | Moderate risk |
| `--color-danger` | `var(--rd)` | `#ff3060` | Poor conditions, close buttons, danger states |
| `--color-text-primary` | `var(--wh)` | `#e8f4ff` | Body text |
| `--color-text-muted` | `var(--gr)` | `#4a5568` | Footer text, tab inactive, secondary labels |
| `--color-grade-great` | `var(--color-grade-great)` | `#ffe600` | Grade: GREAT SWIM |
| `--color-grade-meh` | `var(--color-grade-meh)` | `#ff6eb4` | Grade: MEH SWIM |

When Stitch generates CSS: use the semantic token names above. Claude will map them to the shorthand variables already in `:root`.

---

## Spacing Tokens

Spacing uses a **4px base unit scale**:
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 20px
- `--space-6`: 24px
- `--space-7`: 28px

---

## Alpha / RGB Tokens

For rgba calculations:
- `--cy-rgb`: `129, 236, 255` — enables `rgba(var(--cy-rgb), .5)` patterns
- `--dk-rgb`: `10, 20, 30` — enables `rgba(var(--dk-rgb), .6)` patterns
- `--border-subtle`: `rgba(255, 255, 255, 0.1)` — subtle borders on tiles, stat bars, outlook cards

---

## Typography

- **UI labels / menu:** `'Press Start 2P', monospace` — Google Fonts, pixel/8-bit style (CSS variable: `--font-pixel`)
- **Atmospheric text / quotes / subtitles:** `'Crimson Text', Georgia, serif` — italic, for emotional/narrative moments (CSS variable: `--font-serif`)
- **Base size:** `8px` body, scaled with `clamp()` for fluid responsive sizing
- **Letter spacing:** `1–2px` on headings and buttons for legibility at small sizes
- **Line height:** `1.8` body

---

## Borders & Boxes

- **Standard border:** `4px solid var(--color-accent-primary)` — thick pixel borders, no radius
- **Double-border glow (`.pbox`):** `border: 4px solid var(--cy); box-shadow: 0 0 0 4px var(--dk), 0 0 0 8px var(--cy)`
- **Yellow variant (`.ybox`):** same pattern using `var(--yw)` — for tidal/forecast callouts
- **No border-radius anywhere** — square corners are essential to the aesthetic

---

## Component Patterns

### Stat row (`.strack`)
Score/value displayed as a labeled progress bar. Label left, value right, bar below.

### Status cards (`.scard`)
Boxed panels with a title chip, value display, and color-coded state (ok/caution/danger via class).

### Weather tiles (`.wtile` in `.wgrd`)
Grid of small tiles, each showing an icon label + value. Icon is a short text badge.

### Alert banner (`.alert-banner`)
Full-width banner with left border accent. Color inherits from severity class:
- `.alert-tide` → cyan
- `.alert-uv` → yellow
- `.alert-swell` → orange
- `.alert-bb` → red/pink (bluebottle risk)

### Buttons (`.rbtn`)
Block-level, full-width optional. On hover: background fills with accent color, text inverts to `--dk`, offset shadow `4px 4px 0 var(--bl)`.

### Tabs (`.tabbar` / `.tbtn`)
Horizontal tab bar, `4px` top border on active tab matching `--cy`. Active tab has `--md` background and drops down `4px` to merge with content below.

---

## Animations

| Name | Keyframe | Usage |
|---|---|---|
| `flk` | opacity flicker | Titles, loader text |
| `wb` | vertical wave bounce | Header wave dots |
| `pulse` | glow scale pulse | Alert icons |
| `pb` | brightness pulse | Badge highlights |

---

## Layout

- **Single-column mobile-first**, max content ~480px wide centered
- **CSS Grid** for weather tile grids (`.wgrd`)
- **No CSS frameworks** — vanilla CSS only
- Spacing unit: multiples of `4px` (4, 8, 12, 16, 24, 28px)
- Map containers: fixed `260px` (search) / `420px` (main) height, `2px` cyan border

---

## Screens / Sections

1. **Loader** — fullscreen abyssal splash screen with boxed frame, SVG wave logo, progress bar, terminal-style status panel, and atmospheric quote
2. **Header** — app title + animated wave dots + pool selector button
3. **Score panel** — large swim score number + verdict text (`.pbox`)
4. **Weather grid** — tide, UV, swell, wind, temp tiles
5. **Alert banners** — stacked condition warnings
6. **Tab panel** — Forecast / Map / Legend / About tabs
7. **Search panel** — fullscreen pool selector overlay with map
8. **Footer** — attribution + refresh + share buttons

---

## What Stitch Should Generate

When generating new screens or components for this project:

1. Use the semantic colour tokens from the palette table above
2. Use `'Press Start 2P'` for all UI text
3. Use `4px` solid borders, no border-radius
4. Dark navy (`#0a0e2e`) backgrounds only
5. Export plain **HTML + CSS** (not Tailwind, not React, not styled-components)
6. Keep component structure flat — no deep nesting, no framework abstractions
7. Match the double-border glow pattern for primary panels
