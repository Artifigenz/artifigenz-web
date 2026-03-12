# Artifigenz Design System

## Color Palette

| Token        | Hex       | Usage                              |
| ------------ | --------- | ---------------------------------- |
| `--bg`       | `#f5f0eb` | Page background — warm off-white   |
| `--text`     | `#1a1a1a` | Primary text, headings             |
| `--text-mid` | `#3d3830` | Secondary text, links              |
| `--text-dim` | `#8a8078` | Muted text, labels, descriptions   |
| `--accent`   | `#e85d26` | Brand accent — hover states, CTA   |

Selection highlight uses the accent at 15% opacity: `rgba(232, 93, 38, 0.15)`.

## Typography

| Property      | Value                            |
| ------------- | -------------------------------- |
| Font Family   | **JetBrains Mono** (monospace)   |
| Weights Used  | 300 (light), 400, 500, 600, 700 |
| Smoothing     | Antialiased (webkit + moz)       |

### Type Scale

| Element         | Size                             | Weight | Spacing        |
| --------------- | -------------------------------- | ------ | -------------- |
| Brand name      | `clamp(3.2rem, 6.5vw, 5.8rem)`  | 700    | -0.04em        |
| Hero subtitle   | `clamp(1.6rem, 3.2vw, 2.8rem)`  | 300    | -0.01em        |
| Tagline         | `clamp(0.85rem, 1.5vw, 1rem)`   | 300    | 0.01em         |
| Nav logo text   | `1.05rem`                        | 700    | 0.08em, UPPER  |
| Section label   | `0.7rem`                         | 300    | 0.18em, UPPER  |
| Product name    | `1rem`                           | 500    | 0.02em         |
| Product desc    | `0.78rem`                        | 300    | 0.01em         |
| Footer text     | `0.78rem`                        | 400    | —              |
| Footer links    | `0.72rem`                        | 400    | 0.03em         |

## Design Theme

### Philosophy
Minimal, monospaced, developer-native. The site reads like a terminal crossed with a well-set book — clean type on warm paper with a single bold accent. Every element earns its space.

### Visual Language
- **Warm neutrality** — no pure white, no pure black. The palette sits in a warm sepia range that softens screen fatigue while staying professional.
- **Single accent rule** — only `#e85d26` (burnt orange) is used for interactive/hover emphasis. No gradients, no multi-color branding.
- **Monospace identity** — JetBrains Mono across the entire site reinforces the "builders who ship code" positioning. No serif/sans-serif mixing.
- **Subtle texture** — a fine SVG grain overlay at 4.5% opacity adds analog warmth without noise.
- **Particle system** — mouse-following particle cloud in the background provides ambient motion; particles are clustered, drift organically, and gently attract toward the cursor.

## UI Patterns

### Layout
- Full-viewport single-page (`100vh`, no scroll)
- CSS Grid: `grid-template-rows: auto 1fr auto` (header / main / footer)
- Max content width: `1200px`, centered
- Two-column main: hero (left, fluid) + product list (right, `380px` fixed)

### Components

**Header** — Logo icon (30x30) + uppercase brand text, left-aligned. Padding `24px 40px`.

**Hero** — Large brand name on top, lighter subtitle below, tagline last. Staggered fade-up entrance animation with cubic-bezier easing.

**Product List ("The Fleet")** — Vertical stack separated by 1px borders at 8% opacity. Each item: bold name + dim description. Hover shifts item 6px right and colors name in accent.

**Footer** — Founders on left (names as links), social on right (X icon + handle). Inline, space-between.

### Logo Assets

| File                          | Type             | Use Case                    |
| ----------------------------- | ---------------- | --------------------------- |
| `logo.png` / `logo.svg`      | Symbol only      | Favicon, apple-touch-icon   |
| `logo_transparent.png/.svg`  | Symbol, no bg    | Nav bar                     |
| `logo_text.png` / `.svg`     | Symbol + text    | External/marketing use      |
| `logo_text_transparent.*`    | Symbol + text, no bg | On colored backgrounds  |

## UX Principles

### Motion
- **Entrance animations** — Elements fade up on load with staggered delays (hero at 0.2s, tagline at 0.45s, products at 0.6s+). Easing: `cubic-bezier(0.16, 1, 0.3, 1)` for a fast-start, gentle-land feel.
- **Hover feedback** — Product items slide right on hover with a 0.25s ease transition. Link colors transition over 0.3s.
- **Ambient motion** — Background particle cloud drifts continuously with mouse-aware attraction. No jarring movement; everything stays calm and organic.

### Interaction
- No scroll required — everything fits in one viewport.
- Interactive elements (links, product items) have clear hover states using color and/or position shifts.
- Cursor doesn't change on canvas; particles are non-interactive (`pointer-events: none`).

### Responsiveness

| Breakpoint | Adjustments                                                    |
| ---------- | -------------------------------------------------------------- |
| `<= 900px` | Stack hero + products vertically, fluid widths                |
| `<= 600px` | Tighter padding (20px), smaller logo (24px), smaller type     |

### Accessibility
- Semantic HTML: `header`, `main`, `footer`, `section`, `h1`
- External links use `rel="noopener"` and `target="_blank"`
- Text selection is styled but remains functional
- All images have `alt` attributes
