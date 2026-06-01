# Decision log

Immutable, append-only. One entry per consequential, non-obvious decision —
the kind a reviewer would re-litigate. Routine choices stay in `ROADMAP.md`.
Never edit a past entry; supersede it with a new one and flip its **Status**.

---

## ADR-001 — Static curated pools, no live audio-features (2026-05-29)

**Status:** Accepted
**Context:** Sprint 0 Spotify spike (`scripts/spotify-spike.sh`) against a real new
`client_credentials` app: `/recommendations` → 404, `/audio-features` → 403,
`preview_url` → null everywhere. Live audio-feature targeting is impossible.
**Decision:** Build static track pools harvested at build time; author mood/energy
attributes in the activity-registry; sample deterministically by `seed`.
**Why:** Honors the byte-for-byte determinism invariant; removes the runtime API
dependency from the result page; attributes no longer drift with an external catalog.
**Consequences:** Need a harvest script + committed JSON pools + a `generationVersion`
to refresh deliberately. Attribute meters describe the _activity_, not the literal tracks.

## ADR-002 — Deezer over Spotify as track source (2026-05-29)

**Status:** Accepted
**Supersedes:** the original Spotify assumption (pre-spike `CLAUDE.md` / `ARCHITECTURE.md`)
**Context:** New Spotify apps give 0% preview coverage and no usable genre/mood
retrieval (see ADR-001). Empirical head-to-head of no-auth alternatives
(`scripts/altmusic-headtohead.sh`): iTunes Search vs Deezer.
**Decision:** Use Deezer as the track source — editorial playlists for mood-driven
activities (chill/focus), genre charts for genre-driven ones (electronic/dance).
**Why:** 100% preview coverage (resurrects the 30s-preview feature); editorial
playlists yield coherent _mood_ pools that keyword search cannot; Deezer beat iTunes
head-to-head precisely on mood coverage (iTunes has no mood mechanism). No secret to
protect (public reads).
**Consequences:** Replace `spotify-client` with `track-source` (request-time pool
loader) + `deezer-harvest` (build-time fetcher — the only code that calls Deezer);
the `NormalizedTrack` boundary is unchanged, so `profile-compiler` / `tribe-composer`
are untouched.
Deezer API ToS is a gray zone for non-commercial demos — acceptable for an MVP, flagged.
