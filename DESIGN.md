# Studio — designer.autox.tools design language

The visual identity of the Autocross Course Designer. Chosen 2026-07-17 from an
8-candidate exploration; "Studio" is a quiet, professional-tool aesthetic: charcoal
chrome that recedes behind the satellite imagery, one muted blue accent, and no
motorsport costume. The map is the hero; the chrome is furniture.

This document describes the intent behind the tokens in `src/app.css` — the tokens
themselves are the source of truth. It is also the seed for a future autox.tools-wide
design system.

## Principles

1. **The map is the hero.** Chrome stays low-contrast charcoal; the only saturated
   things on screen should be course elements (cones, markers) and the single accent.
2. **One accent.** Muted blue `#6ea8ff` marks the active tool, selection, focus, and
   the primary action. Nothing else competes with it. Green/red are reserved for
   semantic success/danger.
3. **Domain colors are law.** Cone orange, worker purple, hazard red etc. match
   physical objects on course and never shift with theme. They live in `app.css`
   (`--cone-*`, `--worker`, …) mirrored in `src/lib/config/palette.ts` and
   `src/lib/engine/renderColors.ts` for Mapbox/canvas contexts.
4. **Quiet at rest, obvious when active.** Buttons and tool pills are transparent or
   flat surfaces at rest; hover raises them one surface step; active states get the
   accent tint (`--accent-dim` background + `--accent` text), not a filled block.
5. **Print stays paper.** PNG/PDF export (`printCapture.ts`) and SVG export draw
   their own light-on-paper palette, independent of the app theme.

## Tokens (see `src/app.css`)

- **Surfaces** (darkest → lightest): `--bg-base #17181c` (app chrome) →
  `--bg-surface #1d1f24` (panels/cards) → `--bg-elevated #24262c` (raised controls,
  menus, tooltips) → `--bg-hover #2b2e35`. Elevation = lightness, shadows secondary.
- **Borders**: `--border-subtle #26282e` between chrome regions, `--border #2e3138`
  around raised/floating things.
- **Text**: `--text-primary #e6e7ea`, secondary `#c9ccd1`, muted `#a2a6ad`,
  dim `#64686f`. Body UI is 12–14px.
- **Accent**: `--accent #6ea8ff`, hover lightens (`#8cbaff`), `--accent-dim` is the
  13% tint for active-state backgrounds, `--accent-ink #0d1522` is text on accent.
  Success `#57c98b` and danger `#f06a6a` follow the same pattern with their own ink
  colors — filled buttons use dark ink text, never white.
- **Type**: UI = Schibsted Grotesk (Google Fonts, loaded in `src/app.html`);
  data/numerals/shortcuts = Fragment Mono. Sentence case everywhere; uppercase is
  allowed only for tiny section labels (10–11px, letterspaced).
- **Radii**: 6px controls (`--radius-md`), 10px map frame and cards (`--radius-lg`).
- **Motion**: 0.12s ease on background/color; no glows, no transforms on chrome.

## Component rules

- **Shell**: flat `--bg-base` top bar and toolbar separated by `--border-subtle`
  hairlines; the map sits inset in a `--radius-lg` bordered frame (`+page.svelte`).
- **Mode switcher**: borderless text tabs; the active tab is a raised
  `--bg-elevated` block with an inset 1px border — not accent-filled.
- **Tool pills**: transparent at rest, `--bg-elevated` on hover, `--accent-dim` +
  accent text when active. Shortcut chips are mono, in `--bg-elevated`.
- **Primary action** (Save & Share): `variant="primary"` accent-filled button with
  `--accent-ink` text. There is exactly one per surface.
- **Dialogs**: `--bg-surface` cards over a black scrim; tooltips are hardcoded
  Studio-elevated chips (`ui/tooltip.ts`) since they float over any context.
- **Mapbox widgets**: default controls and the geocoder are re-themed in `app.css`
  (`.mapboxgl-ctrl-*` overrides) — keep those in sync if Mapbox versions change
  their DOM.

## Theming

Studio dark is the only theme. The old Atlas light theme and the dormant
`data-theme="dark"` slate palette were removed with this redesign; print/SVG export
remain light by design.
