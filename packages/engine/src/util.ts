export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
export const avg = (a: number[]): number => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

/** Small, fast, seedable PRNG. Same seed → same sequence on every machine. */
export function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stateless hash of two integers → [0,1). Used for radar paint rolls so they never depend on call order. */
export function hash2(a: number, b: number): number {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Bearing in degrees (0 = north, clockwise) of a point relative to the asset. */
export const brgOf = (x: number, y: number): number => ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
export const WIND = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'] as const;
export const windOf = (d: number): string => WIND[Math.round((((d % 360) + 360) % 360) / 45) % 8];
export const sectorOf = (d: number): number => Math.floor((((d % 360) + 360) % 360) / 30) % 12;
export const fmtTime = (s: number): string => {
  const v = Math.max(0, Math.floor(s));
  return Math.floor(v / 60) + ':' + String(v % 60).padStart(2, '0');
};
