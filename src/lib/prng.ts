// FNV-1a 32-bit hash + Mulberry32 PRNG.
// Shared by profile-compiler and tribe-composer so the same seed string
// always seeds the same sequence regardless of which module calls it.

export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function makePrng(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
