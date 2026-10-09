import { describe, expect, it } from 'vitest';
import { buildScenario, createEngine, expertPolicy, runSim, runTotal, scoreRun, stateHash, step, ticks } from '../src';
import { C, baseCfg, controller, drive } from './helpers';

const trainee = controller({ trackAfterPaintSec: 1.5, idAfterSec: 3, conf: 0.8, eff: (c) => (C.threats.threats[c.type].hostile ? (C.threats.threats[c.type].rfOn ? 'jam' : 'spoof') : 'hold') });

describe('determinism: same seed + same actions = same drill', () => {
  it('the scenario generator is reproducible', () => {
    const cfg = baseCfg({ seed: 777, pattern: 'swarm', difficulty: 5 });
    expect(buildScenario(cfg)).toEqual(buildScenario(cfg));
    expect(buildScenario(cfg)).not.toEqual(buildScenario(baseCfg({ seed: 778, pattern: 'swarm', difficulty: 5 })));
  });

  it('two live runs with the same controller end in an identical state', () => {
    const cfg = baseCfg({ seed: 31337, time: 'night', pattern: 'swarm', difficulty: 4 });
    const a = createEngine(cfg), b = createEngine(cfg);
    drive(a, trainee); drive(b, trainee);
    expect(stateHash(a)).toBe(stateHash(b));
    expect(runTotal(scoreRun(a))).toBe(runTotal(scoreRun(b)));
  });

  it('replaying the recorded decision log reproduces the live drill exactly', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const cfg = baseCfg({ seed: seed * 101, pattern: seed % 2 ? 'swarm' : 'mixed', fault: (['none', 'radar', 'eo', 'rf'] as const)[seed % 4], difficulty: 1 + (seed % 6) });
      const live = createEngine(cfg);
      const log = drive(live, trainee);
      const replay = runSim(cfg, { actions: log, until: live.tick });
      expect(stateHash(replay), `seed ${seed}`).toBe(stateHash(live));
      expect(runTotal(scoreRun(replay))).toBe(runTotal(scoreRun(live)));
    }
  });

  it('the expert ghost is itself deterministic and scores highly', () => {
    const cfg = baseCfg({ seed: 4242, pattern: 'swarm', difficulty: 4 });
    const a = runSim(cfg, { policy: expertPolicy, stopWhenDone: true });
    const b = runSim(cfg, { policy: expertPolicy, stopWhenDone: true });
    expect(stateHash(a)).toBe(stateHash(b));
    expect(runTotal(scoreRun(a))).toBeGreaterThanOrEqual(85);
    expect(a.tick).toBeLessThanOrEqual(ticks(C, C.training.sim.maxDrillSec));
  });
  it('scripted spawns with a start distance place the threat exactly there', () => {
    const E = createEngine(baseCfg(), C, [{ type: 'recon', t: 0, brg: 90, dist: 2200 }]);
    step(E, []);
    expect(Math.round(Math.hypot(E.contacts[0].x, E.contacts[0].y))).toBeGreaterThan(2190);
    expect(Math.round(Math.hypot(E.contacts[0].x, E.contacts[0].y))).toBeLessThanOrEqual(2200);
  });
});
