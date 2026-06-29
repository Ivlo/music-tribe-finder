// Shared data contracts for the Music Tribe Finder pipeline.
//
// activity-registry → profile-compiler → track-source → tribe-composer → web-ui
//
// These are the seams between modules. No Deezer-specific types leak past
// track-source — the composer takes NormalizedTrack[]. See ARCHITECTURE.md
// §Data contracts for the canonical spec behind each shape.

/** The five authored attributes, named once so both shapes below stay in sync. */
export type AttributeKey =
  | "energy"
  | "tempo"
  | "valence"
  | "danceability"
  | "acousticness";

/** Mood enum. Modeled as a string-literal union (no runtime enum). */
export type Mood =
  | "energetic"
  | "focused"
  | "calm"
  | "melancholic"
  | "uplifting"
  | "intense";

/** An authored attribute range. The compiler picks a seed-jittered value in [min, max]. */
export interface AttributeRange {
  min: number;
  max: number;
  target: number;
}

/**
 * A Deezer source the build-time harvester pulls tracks from. Discriminated by
 * `kind` so `deezer-harvest` can dispatch per endpoint (ADR-002): editorial
 * playlists for mood-driven activities, genre charts for genre-driven ones.
 */
export type DeezerSource =
  | { kind: "playlist"; id: string } // /playlist/{id}   — editorial, mood-driven
  | { kind: "chart"; genreId: string }; // /chart/{genreId} — genre chart

/**
 * A preset activity in the static catalog (`activity-registry`). The authored
 * rule inputs for one tribe: what to render (label/icon), where its tracks come
 * from (sources → poolRef), and the attribute bounds the compiler jitters within.
 * Distinct from ActivityProfile, which is what the compiler *produces* per seed.
 */
export interface ActivityEntry {
  id: string; // url-safe slug, e.g. "snowboard"; appears in the URL
  label: string; // display name, e.g. "Snowboard"
  icon: string; // emoji or icon key
  sources: DeezerSource[]; // → deezer-harvest (build time)
  poolRef: string; // → src/data/pools/<poolRef>.json (may be shared)
  attributes: Record<AttributeKey, AttributeRange>; // authored, seed-jittered later
  moodPrimary: Mood;
  namePoolKey: string; // → composer name pool (Sprint 2)
  trackLimit: number; // target count (10–20)
}

/**
 * Produced by profile-compiler. Source-agnostic. Attributes are authored in the
 * registry (Deezer exposes no audio features — ADR-001), not measured per track.
 * Values are 0–100 ints, except `tempo` which is BPM.
 */
export interface ActivityProfile {
  activityId: string;
  label: string; // display name, denormalized for rendering
  icon: string; // emoji or icon key, denormalized for rendering
  seed: string;
  attributes: Record<AttributeKey, AttributeRange>;
  poolRef: string; // → src/data/pools/<poolRef>.json
  trackLimit: number; // target count (10–20)
  moodPrimary: Mood;
  namePoolKey: string; // → composer name pool
}

/**
 * Output of track-source (and the row shape stored in pool JSON). The contract
 * between the source boundary and the composer. No per-track audio features.
 */
export interface NormalizedTrack {
  id: string; // Deezer track id
  title: string;
  artists: string[];
  album: string;
  imageUrl?: string; // album cover
  durationMs: number;
  previewUrl?: string; // 30s MP3 (Deezer; reliably present)
  externalUrl: string; // www.deezer.com/track/...
}

/** A single track as rendered on the Tribe screen (artists joined to one string). */
export interface TribeItem {
  trackId: string; // Deezer track id
  title: string;
  artist: string; // joined from NormalizedTrack.artists[]
  album?: string;
  imageUrl?: string;
  durationMs: number;
  previewUrl?: string;
  externalUrl: string; // www.deezer.com/track/...
}

/**
 * The product, produced by tribe-composer and rendered to the Tribe screen.
 * tribe-composer is the only module that knows what a Tribe is.
 */
export interface Tribe {
  id: string; // `${activityId}:${seed}`
  activityId: string;
  activityLabel: string; // denormalized for rendering
  seed: string;
  generationVersion: string; // semver of the rule set

  identity: {
    name: string; // from per-activity name pool
    tagline: string;
    description: string; // 2–3 sentences
    icon: string; // emoji or icon key
  };

  mood: {
    primary: Mood;
    secondary?: Mood;
    keywords: string[]; // 3–5 short tags
  };

  attributes: Record<AttributeKey, number>; // 0–100 ints, except tempo (BPM)

  items: TribeItem[]; // 10–20 tracks, ordered
}
