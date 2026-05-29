# Architecture

Engineering reference for Music Tribe Finder. Describes *how the system is
built* — modules, contracts, flows, and the invariants that hold it
together.

For current sprint tasks, see `ROADMAP.md`. For stack, commands, and
project conventions, see `CLAUDE.md`.

---

## Overview

The system turns a preset activity (e.g. "Snowboard", "Coding") into a
curated music **tribe**: an identity (name, description, mood), structured
attributes (energy, tempo, valence), and 10–20 Deezer tracks. Tracks are
harvested from Deezer **at build time** into static per-activity pools
(committed to the repo); request-time rendering reads those pools, so the
request path makes no external API calls. The tribe is rendered server-side
and served as a complete HTML page; the URL (`/tribe/[activityId]?seed=...`)
is the entire state, so the same URL always produces the same tribe.

> **Source = Deezer, not Spotify.** New Spotify client_credentials apps can't
> reach `/recommendations` or `/audio-features` and return `null` previews. See
> `DECISIONS.md` ADR-001 (static pools, authored attributes) and ADR-002 (Deezer).

---

## Architecture diagram

```
  BUILD TIME (offline, deliberate)
┌──────────────────────────────────────────────────────────────────┐
│  deezer-harvest (script) ──▶ Deezer API ──▶ src/data/pools/*.json │
│  reads activity-registry source refs (playlist / chart ids)       │
└──────────────────────────────────────────────────────────────────┘
        committed JSON pools ─┐
                              ▼  (read at request time, no network)
  REQUEST TIME
┌──────────────────────────────────────────────────────────────────┐
│ Browser (Next.js client components)                              │
│  ┌────────────┐    ┌──────────────┐     ┌──────────────────┐     │
│  │ Home       │ ─▶ │ Generating   │ ──▶ │ Tribe screen     │     │
│  │ select +   │    │ (loading.tsx)│     │ renders tribe    │     │
│  │ Generate   │    │ theatrical   │     │ from server props│     │
│  └────────────┘    └──────────────┘     └──────────────────┘     │
└──────────────┬───────────────────────▲──────────────────────────┘
               │ navigate w/ seed       │ HTML response
               ▼                        │
┌──────────────────────────────────────────────────────────────────┐
│ Next.js server (App Router, Vercel)                              │
│                                                                  │
│  Server Component: /tribe/[activityId]?seed=                     │
│    │                                                             │
│    ▼                                                             │
│  ┌─────────────────┐   ┌──────────────────┐   ┌─────────────┐    │
│  │ activity-       │──▶│ profile-compiler │──▶│ track-source│    │
│  │ registry (data) │   │ (pure fn)        │   │ (pool load) │    │
│  └─────────────────┘   └──────────────────┘   └──────┬──────┘    │
│                                                      │ reads      │
│                                                      ▼ pool JSON  │
│                                          ┌──────────────────┐    │
│                                          │ tribe-composer   │    │
│                                          │ (pure fn)        │    │
│                                          └──────────────────┘    │
│                                                      │           │
│                                                      ▼ Tribe     │
└──────────────────────────────────────────────────────────────────┘
       No outbound network in the request path.
```

---

## Modules

Strict separation: only `track-source` (and its build-time harvester) touches
Deezer. Everything in the request path is pure functions over data.

| Module | Type | Inputs → Outputs | Responsibility |
|---|---|---|---|
| `activity-registry` | Static data | `activityId → ActivityEntry` | Catalog of preset activities with rule inputs: Deezer **source refs** (playlist / genre-chart ids), **authored attributes** (energy/tempo/valence/…), name-pool key, description fragments. |
| `deezer-harvest` | Build-time tool | `ActivityEntry[] → src/data/pools/*.json` | The **only** code that calls Deezer. Fetches each activity's source refs (paginated), normalizes, dedupes, and writes committed JSON pools. Run deliberately; bumps `generationVersion`. Not in the request path. |
| `profile-compiler` | Pure | `(ActivityEntry, seed) → ActivityProfile` | Resolves the activity rules into authored attributes + a pool ref, applies seed-driven jitter within bounds. |
| `track-source` | I/O (local read) | `ActivityProfile → NormalizedTrack[]` | Loads the activity's committed pool JSON. The request-time boundary; reads files, never the network. (Build-time fetching lives in `deezer-harvest`.) |
| `tribe-composer` | Pure | `(ActivityProfile, NormalizedTrack[], seed) → Tribe` | Generates identity (name from pool, description from template), filters/orders/samples tracks by seed, computes the final attribute summary. The **only** module that knows what a `Tribe` is. |
| `web-ui` | Presentation | `Tribe → HTML` | Three screens (Home, Generating, Tribe). Renders semantic HTML with Tailwind classes. |

**Why no source-adapter interface**: there is one source at a time. The
`NormalizedTrack` contract is the seam — it's what let us swap Spotify → Deezer
(ADR-002) without touching the compiler or composer. A generic multi-source
`MusicSource` interface for a single live implementation would be abstraction
without benefit; the normalized contract already gives the decoupling.

**Why no tribe-repository**: there is no database. Tribes are reproduced
from URL inputs.

---

## Data contracts

All shared types live in `src/lib/types.ts`. No Deezer-specific types
leak past `track-source` — the composer takes `NormalizedTrack[]`, not
Deezer's raw response.

### ActivityProfile

Produced by `profile-compiler`. Source-agnostic shape. Attributes are
**authored** in the registry (Deezer exposes no audio features — see ADR-001),
not measured per track; the compiler applies seed jitter within bounds.

```
ActivityProfile {
  activityId        string
  seed              string
  attributes {                                     // authored, seed-jittered
    energy          { min, max, target: number }   // 0–100
    tempo           { min, max, target: number }   // BPM
    valence         { min, max, target: number }   // 0–100
    danceability    { min, max, target: number }   // 0–100
    acousticness    { min, max, target: number }   // 0–100
  }
  poolRef           string                         // → src/data/pools/<poolRef>.json
  trackLimit        number                         // target count (10–20)
  moodPrimary       string                         // enum
  namePoolKey       string                         // → composer name pool
}
```

### NormalizedTrack

Output of `track-source` (and the row shape stored in pool JSON). The contract
between the source boundary and the composer. No per-track audio features —
Deezer doesn't provide them, and tribe attributes are authored (ADR-001).

```
NormalizedTrack {
  id                string         // Deezer track id
  title             string
  artists           string[]
  album             string
  imageUrl?         string         // album cover
  durationMs        number
  previewUrl?       string         // 30s MP3 (Deezer; reliably present)
  externalUrl       string         // www.deezer.com/track/...
}
```

### Tribe

The product. Rendered to the Tribe screen.

```
Tribe {
  id                  string         // `${activityId}:${seed}`
  activityId          string
  activityLabel       string         // denormalized for rendering
  seed                string
  generationVersion   string         // semver of the rule set

  identity {
    name              string         // from per-activity name pool
    tagline           string
    description       string         // 2–3 sentences
    icon              string         // emoji or icon key
  }

  mood {
    primary           string         // "energetic" | "focused" | "calm" | "melancholic" | "uplifting" | "intense"
    secondary?        string
    keywords          string[]       // 3–5 short tags
  }

  attributes {                       // 0–100 ints, except tempo (BPM)
    energy            number
    tempo             number
    valence           number
    danceability      number
    acousticness      number
  }

  items: TribeItem[]                 // 10–20 tracks, ordered
}

TribeItem {
  trackId             string         // Deezer track id
  title               string
  artist              string         // joined from artists[]
  album?              string
  imageUrl?           string
  durationMs          number
  previewUrl?         string
  externalUrl         string         // www.deezer.com/track/...
}
```

---

## Data flow

End-to-end. Server-rendered. No client-side API calls.

1. **Home** lists activities from `activity-registry`. Tile click sets
   local "selected" state. Generate button disabled until selection.
2. User clicks **Generate Tribe**. Client mints a 6-char base36 `seed`
   and navigates to `/tribe/[activityId]?seed=<seed>`.
3. **Generating screen** appears automatically: `loading.tsx` renders
   while the Server Component resolves. Phase messages cycle on a ~600ms
   timer (or display statically if `prefers-reduced-motion`).
4. **Server Component** at `/tribe/[activityId]` reads `activityId` from
   route params and `seed` from search params.
5. Server looks up `activity-registry[activityId]`. Unknown → 404.
6. `profile-compiler` produces `ActivityProfile` from `(entry, seed)` —
   authored attributes with seed jitter, plus the `poolRef`.
7. `track-source` loads the activity's committed pool
   (`src/data/pools/<poolRef>.json`) and returns `NormalizedTrack[]`.
   Local read, no network. (The pool was produced earlier by `deezer-harvest`
   at build time.)
8. `tribe-composer` produces the `Tribe` object from
   `(profile, tracks, seed)` — deterministically samples/orders the pool by seed.
9. Server Component renders the Tribe screen with the tribe as props.
   Browser receives finished HTML; Generating screen is replaced.
10. Vercel edge can cache the response by URL — same URL on later visits
    returns instantly. (No external API to re-query either way.)

---

## Routes

| Route | Method | Purpose |
|---|---|---|
| `/` | GET | Home page. Lists activities. |
| `/tribe/[activityId]` | GET | Tribe page. `?seed=` query param. Server-renders. Has `loading.tsx` sibling for the Generating screen. |

No public JSON API. `track-source` reads committed pool files; there is no
runtime token helper or outbound request in the request path.

---

## Determinism contract

The single invariant that makes URL-as-state work.

**Rule**: For any `(activityId, seed)`, the system must produce the
**same `Tribe`** byte-for-byte (excluding any non-data fields like
timestamps).

**Where it's enforced**:
- `profile-compiler` and `tribe-composer` are pure functions. No
  `Math.random()`, no `Date.now()`, no I/O.
- All randomness flows through the `seed` parameter (used to seed a
  deterministic PRNG inside the composer).
- The track source is **static committed JSON** (harvested at build time), so
  it is fully deterministic at request time — there is no live catalog to drift.
  This is a key win of the static-pool strategy (ADR-001): the whole request
  path, source included, is reproducible byte-for-byte. The pool only changes
  when `deezer-harvest` is re-run deliberately, which bumps `generationVersion`.

**Verification**: a golden-file test snapshots a tribe for
`(activity=snowboard, seed=abc, tracks=fixture)` and asserts byte-for-byte
equality in CI.

**`generationVersion`** is bumped manually when rule logic changes, so
old shared URLs may produce different tribes after a deploy. Documented
to users in a footer line; not encoded in the URL.

---

## Accessibility requirements

WCAG 2.1 AA. Goal: **fully usable without a mouse and without sight.**

| Concern | Requirement |
|---|---|
| Semantic HTML | Real `<button>`, `<a>`, `<input type="radio">`, `<ol>`, `<meter>`, `<h1>`/`<h2>`. Never `<div onClick>`. |
| Keyboard | Tab order logical. Arrow keys move within the tile radiogroup. Enter activates. No keyboard traps. |
| Focus visibility | Visible focus ring on every interactive element. Never `outline: none` without replacement. |
| Screen reader | Generating screen wrapped in `role="status" aria-live="polite"`. Icon-only buttons have `aria-label`. Decorative emoji `aria-hidden="true"`. Album art has descriptive `alt`. |
| Color contrast | 4.5:1 body, 3:1 large text. Verified with axe-core. Never rely on color alone (energy bar has fill *and* numeric label). |
| Motion | `prefers-reduced-motion: reduce` collapses the Generating animation to static. |
| Page structure | One `<h1>` per screen, logical heading order. `<html lang="en">`. |
| Forms | Activity tiles in `<fieldset>` + `<legend>`. Generate button associated with the form. |

**Enforcement**: `eslint-plugin-jsx-a11y` at lint time;
`@axe-core/playwright` in the E2E smoke test asserting zero
serious/critical violations per screen.

---

## Testing strategy

| Layer | What | How |
|---|---|---|
| `activity-registry` | Schema integrity, unique IDs, valid enums | Structural test |
| `profile-compiler` | Determinism + variation across seeds | Pure unit tests |
| `track-source` | Pool JSON loads + parses; schema matches `NormalizedTrack` | Unit test against a fixture pool |
| `deezer-harvest` | Normalization + dedupe of Deezer responses | Mock `fetch`; one gated integration test against real Deezer |
| `tribe-composer` | Determinism, name pool selection, ordering/sampling rule | Pure unit tests with fixture tracks |
| Page routes | Home → Generate → Generating → Tribe navigation; tribe HTML contains identity + 10–20 items | Playwright smoke with a fixture pool |
| `loading.tsx` | Renders three messages on timer; safe to unmount mid-animation | Component unit with fake timers |
| Accessibility | Zero serious/critical violations on each screen | `@axe-core/playwright` in smoke test |
| Determinism | Golden tribe snapshot | Byte-for-byte assertion in CI |

**Runner**: Vitest + React Testing Library + `@testing-library/jest-dom` + `vitest-axe`.
**Where tests run**: pre-commit = lint + typecheck + unit + golden (fast); CI = all,
including E2E (Playwright + axe); E2E is excluded from pre-commit (too slow). The
Claude Code Stop hook runs lint + typecheck only.

---

## Risks (engineering)

| Risk | Mitigation |
|---|---|
| ~~Spotify restricted endpoints / null previews~~ | **Resolved**: Sprint 0 spike confirmed the restriction; switched source to Deezer (ADR-002). Kept here as a pointer to `DECISIONS.md`. |
| Deezer API ToS — previews/metadata intended for promotional use; commercial use needs approval | Acceptable gray zone for a non-commercial MVP/portfolio demo. Flagged in ADR-002. Revisit before any commercial launch. |
| Pool staleness — committed pools drift from Deezer's live catalog over time | Accepted by design (static pools buy determinism). Re-run `deezer-harvest` deliberately; bump `generationVersion`. |
| A harvested playlist/chart gets emptied or removed at Deezer | Pools are committed JSON, so existing builds are unaffected. Harvest validates a minimum track count per activity and fails loudly. |
| Determinism breaks (e.g. `Math.random()` slips into pure module) | Golden-file test in CI. Lint rule: no `Math.random()` / `Date.now()` in `src/lib/`. |
| `generationVersion` drift across deploys changing shared-link output | Accepted trade-off; documented in footer copy. |
| Accessibility regressions late in development | axe-core in CI from Sprint 1. Manual VoiceOver pass at end of Sprints 2 and 3. |
