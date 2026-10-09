import { describe, expect, it } from 'vitest';
import { createEngine, isDone, mulberry, runSim, scoreRun, stateHash, step, ticks, type Action } from '../src';
import { C, baseCfg } from './helpers';

describe('fuzz: random and invalid actions never break the engine', () => {
  it('200 random drills with random decisions stay in bounds and replay exactly', () => {
    const kinds = ['track', 'id', 'eng'] as const;
    const classes = [...C.threats.order, 'not-a-threat'];
    const effs = [...C.effectors.order, 'hold', 'not-a-weapon'];
    for (let seed = 1; seed <= 200; seed++) {
      const r = mulberry(seed * 9973);
      const cfg = baseCfg({ seed, time: r() < 0.5 ? 'day' : 'night', terrain: r() < 0.5 ? 'urban' : 'rural', fault: (['none', 'radar', 'eo', 'rf'] as const)[Math.floor(r() * 4)], pattern: r() < 0.5 ? 'swarm' : 'mixed', difficulty: 1 + Math.floor(r() * 6) });
      const E = createEngine(cfg);
      const log: Action[] = [];
      const lim = ticks(C, C.training.sim.maxDrillSec);
      while (E.tick < lim && !isDone(E)) {
        const acts: Action[] = [];
        if (r() < 0.3) {
          const a: Action = { tick: E.tick, k: kinds[Math.floor(r() * 3)], cid: 1 + Math.floor(r() * (E.nid + 2)) };
          if (a.k === 'id') { a.cls = classes[Math.floor(r() * classes.length)]; a.conf = [0.6, 0.8, 0.95][Math.floor(r() * 3)]; }
          if (a.k === 'eng') a.eff = effs[Math.floor(r() * effs.length)];
          acts.push(a);
        }
        log.push(...acts);
        step(E, acts);
      }
      for (const s of scoreRun(E)) {
        expect(s.D).toBeGreaterThanOrEqual(0); expect(s.D).toBeLessThanOrEqual(30);
        expect(s.C).toBeGreaterThanOrEqual(0); expect(s.C).toBeLessThanOrEqual(30);
        expect(s.F).toBeGreaterThanOrEqual(0); expect(s.F).toBeLessThanOrEqual(40);
        expect(s.total).toBeGreaterThanOrEqual(0); expect(s.total).toBeLessThanOrEqual(100);
      }
      expect(Object.values(E.stock).every((v) => v >= 0)).toBe(true);
      expect(stateHash(runSim(cfg, { actions: log, until: E.tick }))).toBe(stateHash(E));
    }
  });
});
