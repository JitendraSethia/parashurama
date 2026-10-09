import { describe, expect, it } from 'vitest';
import { bkt, calStats, createEngine, demoHistory, mastery, observe, scoreRun, SKILLS } from '../src';
import { C, baseCfg, controller, drive } from './helpers';

describe('learning model', () => {
  it('mastery rises with correct answers and falls with mistakes', () => {
    expect(bkt(Array(20).fill(true))).toBeGreaterThan(0.8);
    expect(bkt(Array(20).fill(false))).toBeLessThan(0.2);
    expect(bkt([true, true, false, true])).toBeLessThan(bkt([true, true, true, true]));
  });

  it('mastery is always a probability', () => {
    const m = mastery(demoHistory());
    for (const [k] of SKILLS) { expect(m[k]).toBeGreaterThanOrEqual(0); expect(m[k]).toBeLessThanOrEqual(1); }
  });

  it('the demo trainee is weakest at calibration and swarms', () => {
    const m = mastery(demoHistory());
    expect(m.calib).toBeLessThan(0.5);
    expect(m.swarm).toBeLessThan(0.5);
  });

  it('one drill contributes at most maxObsPerDrill observations per skill', () => {
    const E = createEngine(baseCfg({ seed: 99, pattern: 'swarm', time: 'night', difficulty: 6 }));
    drive(E, controller({ eff: (c) => (C.threats.threats[c.type].hostile ? 'intc' : 'hold') }));
    const o = observe(E, scoreRun(E));
    for (const k of Object.keys(o)) expect(o[k].length).toBeLessThanOrEqual(C.training.learning.maxObsPerDrill);
  });

  it('calibration stats count calls per confidence level', () => {
    const E = createEngine(baseCfg({ seed: 5 }));
    drive(E, controller({ conf: 0.95, eff: () => 'hold' }));
    const cal = calStats(scoreRun(E));
    expect(cal.certain[0]).toBeGreaterThan(0);
    expect(cal.certain[1]).toBe(cal.certain[0]); // the controller always names the truth
    expect(cal.likely[0]).toBe(0);
  });
});
