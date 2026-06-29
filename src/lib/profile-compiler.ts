import type { ActivityEntry, ActivityProfile, AttributeKey } from "./types";

const ATTRIBUTE_KEYS: AttributeKey[] = [
  "energy",
  "tempo",
  "valence",
  "danceability",
  "acousticness",
];

// FNV-1a 32-bit: maps an arbitrary string to a uint32.
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Mulberry32: stateful PRNG that returns floats in [0, 1).
function makePrng(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pure. Deterministic. No I/O, no Math.random().
 * Takes the authored registry entry + URL seed and produces an ActivityProfile
 * where each attribute target is seed-jittered within [min, max].
 */
export function compileProfile(
  entry: ActivityEntry,
  seed: string,
): ActivityProfile {
  const rand = makePrng(hashSeed(seed));

  const attributes = Object.fromEntries(
    ATTRIBUTE_KEYS.map((key) => {
      const { min, max } = entry.attributes[key];
      const target = Math.round(min + rand() * (max - min));
      return [key, { min, max, target }];
    }),
  ) as ActivityProfile["attributes"];

  return {
    activityId: entry.id,
    seed,
    attributes,
    poolRef: entry.poolRef,
    trackLimit: entry.trackLimit,
    moodPrimary: entry.moodPrimary,
    namePoolKey: entry.namePoolKey,
  };
}
