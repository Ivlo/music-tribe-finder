# Design

Design system, visual rules, and decisions for Music Tribe Finder. This
captures the _why_ behind the design — the `.pen` captures the _what_.

For commands, conventions, and project setup: see `CLAUDE.md`.
For module structure and a11y requirements: see `ARCHITECTURE.md`.

---

## Source of truth

Visual artifacts live in **`design/music-tribe-finder.pen`** (saved as
`design/design.pen` in the working copy). Open via Pencil MCP tools:
`get_editor_state`, `batch_get`, `get_screenshot`, `batch_design`.

Reference renders are in `design/screenshots/` — regenerate with
`mcp__pencil__export_nodes` when the `.pen` changes.

| Screen               | File                                        |
| -------------------- | ------------------------------------------- |
| Home (Desktop)       | `design/screenshots/home-desktop.png`       |
| Home (Mobile)        | `design/screenshots/home-mobile.png`        |
| Generating (Desktop) | `design/screenshots/generating-desktop.png` |
| Tribe (Desktop)      | `design/screenshots/tribe-desktop.png`      |
| Tribe (Mobile)       | `design/screenshots/tribe-mobile.png`       |

---

## Non-negotiable rules

These came out of the original brief and survived iteration. Re-read
before any design change.

1. **Typography is the protagonist.** Display = **Fraunces** (editorial
   serif, Google Fonts). Body/UI = **Geist** (Vercel sans). Mono =
   **IBM Plex Mono**. Avoid Inter — it was the auto-generated default
   and explicitly rejected for lacking display character.
2. **Aggressive negative space.** Density only in the track list.
3. **One accent per screen.** Multiple accents competing in a single
   component is a reject criterion.
4. **Dark mode only in MVP.** Most usage moments are low-light (gym,
   late coding, snowboard cabin, chill). Light mode is out of scope.
5. **No color-alone signaling.** Every meter pairs colored fill with
   numeric value; every state pairs color with text or icon.

---

## Per-mood accent system

Three accents map to activity energy families. Code applies the right
accent based on `activityId`; the design depicts only the high-energy
variant (Snowboard / "Frostbite Collective").

| Family | Token          | Color                     | Activities            |
| ------ | -------------- | ------------------------- | --------------------- |
| High   | `$accent-high` | `#FF9800` (signal orange) | Snowboard, Skate, Gym |
| Mid    | `$accent-mid`  | `#3B82F6` (electric blue) | Coding                |
| Low    | `$accent-low`  | `#A78BFA` (dusty violet)  | Night Focus, Chill    |

`$accent-chill` exists as an alias of `$accent-low` (legacy from initial
generation — safe to leave; cosmetic cleanup).

Accents are used **sparingly**: chips, attribute meter fills, focus
rings, the "playing" play button. Never as full background washes.

---

## Color tokens

Dark-mode-first. `$bg-primary` is the canonical page background;
`$bg-inverse` is reserved for rare contrastive cases (currently unused).

| Token                  | Value     | Use                                        |
| ---------------------- | --------- | ------------------------------------------ |
| `$bg-primary`          | `#0A0A0A` | Page background                            |
| `$bg-surface`          | `#1F1F1F` | Tiles, buttons (secondary), chips          |
| `$bg-surface-hover`    | `#2A2A2A` | Hover, album art placeholder               |
| `$bg-surface-selected` | `#353535` | Selected tile fill                         |
| `$bg-elevated`         | `#161616` | Modal/popover (unused in MVP)              |
| `$text-primary`        | `#F5F5F5` | Body text, headings                        |
| `$text-secondary`      | `#B3B3B3` | Tagline, descriptions, artist names        |
| `$text-tertiary`       | `#808080` | Captions, meta, "no preview" tooltips      |
| `$border-default`      | `#2A2A2A` | Tile borders                               |
| `$border-subtle`       | `#1F1F1F` | Track list dividers                        |
| `$border-focus`        | `#FF9800` | Focus rings (always visible)               |
| `$meter-fill`          | `#FF9800` | Attribute bars (replaced per-mood in code) |
| `$meter-track`         | `#2A2A2A` | Attribute bar empty track                  |

**Contrast verified** (WCAG 2.1 AA):

- `$text-primary` on `$bg-primary` → ~18:1 ✓
- `$text-secondary` on `$bg-primary` → ~9:1 ✓
- `$text-tertiary` on `$bg-primary` → ~5:1 ✓ (passes body AA)

---

## Radius scale

| Token          | Value | Use                                                                |
| -------------- | ----- | ------------------------------------------------------------------ |
| `$radius-none` | 0     | Default                                                            |
| `$radius-sm`   | 4     | (unused; reserved)                                                 |
| `$radius-md`   | 8     | Activity tiles, surface chips                                      |
| `$radius-lg`   | 16    | (reserved for larger cards)                                        |
| `$radius-xl`   | 24    | (reserved)                                                         |
| `$radius-full` | 9999  | Pill buttons (Generate, Regenerate), mood chips, play/icon buttons |

Decision: subtle radius on cards (8), pill on CTAs (full). Pure-sharp
"Swiss" felt too cold for the editorial direction we landed on.

---

## Reusable components (in `.pen`)

| Component              | ID       | Purpose                                               |
| ---------------------- | -------- | ----------------------------------------------------- |
| ActivityTile/Default   | `wPQzJ`  | Activity grid tile (radio item)                       |
| ActivityTile/Selected  | `Y3MM8I` | Selected state with `$accent-high` stroke             |
| PrimaryButton/Default  | `Qjaeo`  | Generate, Regenerate CTA (pill, `$accent-high` fill)  |
| PrimaryButton/Disabled | `f7RrRl` | Same shape, `opacity: 0.35`                           |
| MoodChip               | `g6903`  | Tribe mood keywords (pill, `$accent-high-muted` fill) |
| AttributeMeter         | `PLwa7`  | Label + bar + numeric value                           |
| TrackItem              | `kIrqn`  | Play button + art + title/artist + Deezer link icon   |
| PhasedMessage          | `bPitO`  | Generating screen heading + dots                      |

The Tribe screen's track rows are **inline frames**, not refs to
`kIrqn`. The component is the spec; the rows are an example. When
implementing in code, treat `kIrqn` as the single source.

---

## TrackItem three states

Deezer populates `preview` reliably (spike: ~100% coverage — see
`DECISIONS.md` ADR-002), so previews are the norm and the play button is
the primary interaction. The "no preview" state is kept as a **defensive
fallback** for the rare null, not a frequently-hit case.

| State            | Visual                                                                       | Where shown in `.pen`             |
| ---------------- | ---------------------------------------------------------------------------- | --------------------------------- |
| Paused (default) | Circular `$bg-surface` button, `play` icon `$text-primary`                   | Tracks 1, 4–12 (Desktop + Mobile) |
| Playing          | Circular `$accent-high` button (orange), `pause` icon `$text-inverse` (dark) | Track 2 (Desktop + Mobile)        |
| No preview       | Same as paused, `opacity: 0.3`, `cursor: not-allowed`                        | Track 3 (Desktop + Mobile)        |

The "Open in Deezer" action persists in all 3 states as a small
`external-link` icon on the right (secondary, never the primary
interaction).

> **Pending `.pen` update:** the `kIrqn` node still carries a Spotify brand
> icon. Swapping it to a Deezer/neutral icon is a follow-up (needs the icon
> asset verified in the kit first).

---

## Accessibility constraints applied in design

WCAG 2.1 AA. Verified in design; re-verified by `@axe-core/playwright`
in CI (Sprint 1+).

- All tap targets ≥ 44×44px on mobile (play button, primary CTAs, tiles).
- `$border-focus` (`#FF9800`) is the focus ring color — high contrast
  on `$bg-primary`.
- Never color-alone: attribute meter has fill **and** numeric value;
  TrackItem state has color **and** icon shape (play vs. pause).
- Disabled state uses opacity + cursor, not just color.
- Icon-only buttons (Deezer external-link, play/pause) need
  `aria-label` in code — design ensures button area is sufficient.

---

## Visual references (from original brief)

Studied closely:

- https://linear.app — restrained dark UI, typographic confidence
- https://teenage.engineering — Swiss minimal, "neutral + one accent"
- https://ra.co — music editorial, cool grays, condensed sans
- https://music.apple.com — curated-playlist hierarchy

Adjacent — neutral systems with strong character:

- https://vercel.com, https://railway.com, https://stripe.com,
  https://www.raycast.com

Curation / typography:

- https://minimal.gallery, https://www.typewolf.com

---

## Pencil gotchas (for future iterations)

Discovered the hard way during the initial sweep. Save them anyone or
agent looking at this avoids the same traps.

1. **`replace_all_matching_properties` corrupts variable refs.** When
   `to` starts with `$`, it stores a literal `\$` (backslash escape)
   that breaks the reference. **Always use `batch_design U()`** for
   any change that targets a variable reference. Pattern-based
   replacement is only safe for hex → hex.
2. **Custom fonts often unavailable.** PP Editorial New (our original
   pick) wasn't installed in Pencil. Stick to fonts that ship with
   Google Fonts and are widely deployed (Fraunces, Geist, Inter, IBM
   Plex Mono, Funnel Sans).
3. **Initial Pencil generation collapses similar concepts.** All four
   mood accents were generated as the same orange; we had to manually
   distinguish them in tokens. Don't trust a single generation —
   always audit tokens before considering the design done.
4. **Component instances vs. inline frames.** Pencil generation
   tends to make inline frames even when a reusable component exists.
   The screens in our `.pen` are inline, not refs — updates to the
   component don't cascade. For now we keep both; in code, the
   component is the source of truth.
5. **Hardcoded values leak in.** First-pass generation mixes token
   refs with hex values. Audit with `search_all_unique_properties`
   before declaring a design system "consistent."

---

## Design → code handoff

When implementing the design in Next.js + Tailwind:

- **Tokens → Tailwind theme**: replicate the color / radius / font
  tokens above in `tailwind.config.ts` so JSX can use `bg-surface`,
  `text-secondary`, `rounded-full`, `font-display`.
- **Components → React components**: each reusable in the `.pen` maps
  1:1 to a React component (e.g. `<ActivityTile />`, `<TrackItem />`).
- **Per-mood accent**: code applies the correct accent token based on
  `activityId → mood family` mapping. The `.pen` only shows the high
  variant.
- **TrackItem is a Client Component** (uses `<audio>` + state for
  play/pause). Everything else can stay Server Component.
- **Semantic HTML**: design ensures layouts don't force non-semantic
  markup. Tiles → `<input type="radio">` styled as cards; meter →
  `<meter>`; track list → `<ol>`.

---

## What's NOT designed (deferred)

- Error states (sparse/empty pool, missing preview) — Sprint 3
- Empty states — Sprint 3
- Settings / account / login — out of MVP
- Onboarding — out of MVP
- Light mode — out of MVP

When these are added, they live in the same `.pen` as new frames; this
doc gets a new section describing them.
