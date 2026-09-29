// src/utils/random.ts

export type RandomFn = () => number;

// FNV-1a: turns a string seed into a 32-bit integer.
const hashSeed = (seed: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

// Mulberry32: a small, fast seeded generator. Returns numbers in [0, 1) like
// Math.random, but the same seed always produces the same sequence.
export const createRandom = (seed: string): RandomFn => {
  let state = hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
