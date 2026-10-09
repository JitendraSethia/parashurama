import { describe, expect, it } from 'vitest';
import { expertPolicy, runSim, runTotal, scenarioCfg, scoreRun, SCENARIOS } from '../src';
import { C } from './helpers';

describe('real-world scenario library', () => {
  it('every scenario uses known threats and valid times, bearings and distances', () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(4);
    for (const s of SCENARIOS) {
      expect(s.lesson.length).toBeGreaterThan(20);
      for (const sp of s.spawns) {
        expect(C.threats.threats[sp.type], `${s.id}: ${sp.type}`).toBeDefined();
        expect(sp.t).toBeGreaterThanOrEqual(0); expect(sp.t).toBeLessThanOrEqual(C.training.sim.maxDrillSec);
        expect(sp.brg).toBeGreaterThanOrEqual(0); expect(sp.brg).toBeLessThan(360);
        if (sp.dist != null) { expect(sp.dist).toBeGreaterThanOrEqual(300); expect(sp.dist).toBeLessThanOrEqual(C.training.sim.radarRangeM); }
      }
      expect(s.cfg.pattern === 'swarm').toBe(s.spawns.some((x) => C.threats.threats[x.type].motion === 'swarm'));
    }
  });
  it('ids are unique and each scenario always plays the same way', () => {
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(SCENARIOS.length);
    const s = SCENARIOS[0];
    const a = runSim(scenarioCfg(s, 1), { spawns: s.spawns, until: 600 });
    const b = runSim(scenarioCfg(s, 9), { spawns: s.spawns, until: 600 });
    expect(JSON.stringify(a.contacts)).toBe(JSON.stringify(b.contacts));
  });
  it('the expert ghost can win every scenario (scenarios are hard but fair)', () => {
    for (const s of SCENARIOS) {
      const E = runSim(scenarioCfg(s, 1), { spawns: s.spawns, policy: expertPolicy, stopWhenDone: true });
      const leaked = E.contacts.filter((c) => c.state === 'leaked' && C.threats.threats[c.type].hostile).length;
      const total = runTotal(scoreRun(E));
      console.log(`${s.id}: expert ${total}, leaked ${leaked}`);
      expect(leaked, s.id).toBe(0);
      expect(total, s.id).toBeGreaterThanOrEqual(75);
    }
  });
});
