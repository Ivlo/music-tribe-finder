import { describe, expect, it } from "vitest";

import { composeTribe, GENERATION_VERSION } from "./tribe-composer";
import type { ActivityProfile, NormalizedTrack } from "./types";

const PROFILE: ActivityProfile = {
  activityId: "coding",
  label: "Coding",
  icon: "💻",
  seed: "abc123",
  attributes: {
    energy: { min: 40, max: 65, target: 52 },
    tempo: { min: 100, max: 125, target: 112 },
    valence: { min: 40, max: 65, target: 52 },
    danceability: { min: 45, max: 65, target: 55 },
    acousticness: { min: 15, max: 40, target: 25 },
  },
  poolRef: "coding",
  trackLimit: 5,
  moodPrimary: "focused",
  namePoolKey: "code-flow",
};

// 10 tracks — more than trackLimit so the shuffle + slice is exercised.
const TRACKS: NormalizedTrack[] = Array.from({ length: 10 }, (_, i) => ({
  id: `track-${i}`,
  title: `Track ${i}`,
  artists: [`Artist ${i}`, `Feature ${i}`],
  album: `Album ${i}`,
  imageUrl: `https://example.com/img/${i}.jpg`,
  durationMs: 200000 + i * 1000,
  previewUrl: `https://example.com/preview/${i}.mp3`,
  externalUrl: `https://www.deezer.com/track/${i}`,
}));

const FOCUSED_NAMES = [
  "Deep Focus",
  "Flow State",
  "Zone Collective",
  "Signal Drift",
  "Still Current",
];

describe("tribe-composer", () => {
  describe("determinism", () => {
    it("same (profile, tracks, seed) → identical tribe", () => {
      expect(composeTribe(PROFILE, TRACKS, "abc123")).toEqual(
        composeTribe(PROFILE, TRACKS, "abc123"),
      );
    });

    it("different seeds → different item order or different name", () => {
      const a = composeTribe(PROFILE, TRACKS, "abc123");
      const b = composeTribe(PROFILE, TRACKS, "xyz789");
      const sameItems = a.items.every(
        (item, i) => item.trackId === b.items[i].trackId,
      );
      expect(sameItems && a.identity.name === b.identity.name).toBe(false);
    });
  });

  describe("items", () => {
    it("respects trackLimit", () => {
      expect(composeTribe(PROFILE, TRACKS, "abc123").items).toHaveLength(
        PROFILE.trackLimit,
      );
    });

    it("caps at pool size when pool is smaller than trackLimit", () => {
      const smallPool = TRACKS.slice(0, 3);
      const tribe = composeTribe(
        { ...PROFILE, trackLimit: 10 },
        smallPool,
        "abc123",
      );
      expect(tribe.items).toHaveLength(3);
    });

    it("joins multiple artists with ', '", () => {
      const tribe = composeTribe(PROFILE, TRACKS, "abc123");
      tribe.items.forEach((item) => expect(item.artist).toContain(", "));
    });

    it("trackId comes from NormalizedTrack.id", () => {
      const tribe = composeTribe(PROFILE, TRACKS, "abc123");
      tribe.items.forEach((item) =>
        expect(item.trackId).toMatch(/^track-\d+$/),
      );
    });
  });

  describe("identity", () => {
    it("name is drawn from the mood name pool", () => {
      const tribe = composeTribe(PROFILE, TRACKS, "abc123");
      expect(FOCUSED_NAMES).toContain(tribe.identity.name);
    });

    it("icon matches profile.icon", () => {
      expect(composeTribe(PROFILE, TRACKS, "abc123").identity.icon).toBe(
        PROFILE.icon,
      );
    });
  });

  describe("attributes", () => {
    it("final values equal the profile jittered targets", () => {
      const tribe = composeTribe(PROFILE, TRACKS, "abc123");
      (
        Object.keys(PROFILE.attributes) as (keyof typeof PROFILE.attributes)[]
      ).forEach((key) => {
        expect(tribe.attributes[key]).toBe(PROFILE.attributes[key].target);
      });
    });
  });

  describe("metadata", () => {
    it("id is activityId:seed", () => {
      expect(composeTribe(PROFILE, TRACKS, "abc123").id).toBe("coding:abc123");
    });

    it("activityLabel matches profile.label", () => {
      expect(composeTribe(PROFILE, TRACKS, "abc123").activityLabel).toBe(
        PROFILE.label,
      );
    });

    it("generationVersion matches the exported constant", () => {
      expect(composeTribe(PROFILE, TRACKS, "abc123").generationVersion).toBe(
        GENERATION_VERSION,
      );
    });
  });
});
