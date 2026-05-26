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
attributes (energy, tempo, valence), and 10–20 Spotify tracks. The tribe
is rendered server-side and served as a complete HTML page; the URL
(`/tribe/[activityId]?seed=...`) is the entire state, so the same URL
always produces the same tribe.

---

## Architecture diagram

```
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
│  │ activity-       │──▶│ profile-compiler │──▶│ spotify-    │    │
│  │ registry (data) │   │ (pure fn)        │   │ client (I/O)│    │
│  └─────────────────┘   └──────────────────┘   └──────┬──────┘    │
│                                                      │           │
│                                                      ▼           │
│                                          ┌──────────────────┐    │
│                                          │ tribe-composer   │    │
│                                          │ (pure fn)        │    │
│                                          └──────────────────┘    │
│                                                      │           │
│                                                      ▼ Tribe     │
└──────────────────────────────────────────────────────────────────┘
                                       │ outbound (server-side only)
                                       ▼
                                  Spotify Web API
```

---

## Modules

Strict separation: only `spotify-client` performs I/O. Everything else is
pure functions over data.

| Module | Type | Inputs → Outputs | Responsibility |
|---|---|---|---|
| `activity-registry` | Static data | `activityId → ActivityEntry` | Catalog of preset activities with rule inputs (seed genres, target audio features, name-pool key, description fragments). |
| `profile-compiler` | Pure | `(ActivityEntry, seed) → ActivityProfile` | Normalizes the activity rules into a resolved query, applies seed-driven jitter within bounds. |
| `spotify-client` | I/O | `ActivityProfile → NormalizedTrack[]` | The **only** module that touches the network or holds the `client_secret`. Handles token caching, retries, and normalization of Spotify response shapes. |
| `tribe-composer` | Pure | `(ActivityProfile, NormalizedTrack[], seed) → Tribe` | Generates identity (name from pool, description from template), filters/orders tracks, computes the final attribute summary. The **only** module that knows what a `Tribe` is. |
| `web-ui` | Presentation | `Tribe → HTML` | Three screens (Home, Generating, Tribe). Renders semantic HTML with Tailwind classes. |

**Why no source-adapter interface**: there is only one source. Wrapping
Spotify in a generic `MusicSource` interface for a single implementation is
abstraction without benefit.

**Why no tribe-repository**: there is no database. Tribes are reproduced
from URL inputs.

---

## Data contracts

All shared types live in `src/lib/types.ts`. No Spotify-specific types
leak past `spotify-client` — the composer takes `NormalizedTrack[]`, not
Spotify's raw response.

### ActivityProfile

Produced by `profile-compiler`. Source-agnostic query shape.

```
ActivityProfile {
  activityId        string
  seed              string
  targetAudio {
    energy          { min, max, target: number }   // 0–1
    tempo           { min, max, target: number }   // BPM
    valence         { min, max, target: number }   // 0–1
    danceability    { min, max, target: number }   // 0–1
    acousticness    { min, max, target: number }   // 0–1
  }
  seedGenres        string[]                       // Spotify genre seeds
  trackLimit        number                         // target count
  moodPrimary       string                         // enum
  namePoolKey       string                         // → composer name pool
}
```

### NormalizedTrack

Output of `spotify-client`. The contract between I/O and the composer.

```
NormalizedTrack {
  id                string
  title             string
  artists           string[]
  album             string
  imageUrl?         string
  durationMs        number
  previewUrl?       string         // 30s preview, often null
  externalUrl       string         // open.spotify.com/track/...
  audio {
    energy          number         // 0–1
    tempo           number         // BPM
    valence         number         // 0–1
    danceability    number         // 0–1
    acousticness    number         // 0–1
  }
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
  spotifyId           string
  title               string
  artist              string         // joined from artists[]
  album?              string
  imageUrl?           string
  durationMs          number
  previewUrl?         string
  externalUrl         string
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
6. `profile-compiler` produces `ActivityProfile` from `(entry, seed)`.
7. `spotify-client` queries Spotify and returns `NormalizedTrack[]`.
   Token cached in module memory (~1h). If results are sparse, the
   compiler is asked to relax one constraint and the query retries up to
   N times.
8. `tribe-composer` produces the `Tribe` object from
   `(profile, tracks, seed)`.
9. Server Component renders the Tribe screen with the tribe as props.
   Browser receives finished HTML; Generating screen is replaced.
10. Vercel edge can cache the response by URL — same URL on later visits
    returns instantly without re-querying Spotify.

---

## Routes

| Route | Method | Purpose |
|---|---|---|
| `/` | GET | Home page. Lists activities. |
| `/tribe/[activityId]` | GET | Tribe page. `?seed=` query param. Server-renders. Has `loading.tsx` sibling for the Generating screen. |

No public JSON API. The `spotify-client` token helper is an internal
module, not an HTTP route.

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
- `spotify-client` is **not** deterministic by nature (Spotify can drift).
  Mitigation: the composer captures track IDs into the `Tribe`, so once a
  tribe exists in a response/edge cache, the rendered output is stable.
  When the cache expires, Spotify may return a different set; this is an
  accepted trade-off.

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
| `spotify-client` | Token caching, response normalization, sparse-result fallback | Mock `fetch`; one gated integration test |
| `tribe-composer` | Determinism, name pool selection, ordering rule | Pure unit tests with fixture tracks |
| Page routes | Home → Generate → Generating → Tribe navigation; tribe HTML contains identity + 10–20 items | Playwright smoke with mocked `spotify-client` |
| `loading.tsx` | Renders three messages on timer; safe to unmount mid-animation | Component unit with fake timers |
| Accessibility | Zero serious/critical violations on each screen | `@axe-core/playwright` in smoke test |
| Determinism | Golden tribe snapshot | Byte-for-byte assertion in CI |

---

## Risks (engineering)

| Risk | Mitigation |
|---|---|
| Spotify `/recommendations` unavailable for new client IDs | Verified in Sprint 0. Fallback path: `/search` + `/audio-features` with client-side filtering. |
| Spotify ToS on caching metadata | No persistence in MVP. Edge cache TTL ≤ 24h. |
| Sparse Spotify results for niche profiles | Constraint-relaxation loop in `profile-compiler`. Bounded retry count. |
| Determinism breaks (e.g. `Math.random()` slips into pure module) | Golden-file test in CI. Lint rule: no `Math.random()` / `Date.now()` in `src/lib/`. |
| `generationVersion` drift across deploys changing shared-link output | Accepted trade-off; documented in footer copy. |
| Accessibility regressions late in development | axe-core in CI from Sprint 1. Manual VoiceOver pass at end of Sprints 2 and 3. |
