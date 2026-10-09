import { describe, expect, it } from 'vitest';
import { cameraRange, demoHistory, mastery, observe, planNext, runSim, scoreRun, weatherFx, type SessionRecord } from '../src';
import { baseCfg, C } from './helpers';

/** Average time (s) from spawn to first radar paint over many seeds: a simple, deterministic detection measure. */
function meanFirstPaint(weather: 'clear' | 'rain' | 'fog' | 'dust'): number {
  let sum = 0, n = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const E = runSim(baseCfg({ seed, weather }), { until: 900 });
    for (const c of E.contacts) if (c.firstPaint != null) { sum += (c.firstPaint - c.born) * C.training.sim.dt; n++; }
  }
  return sum / n;
}

describe('weather degrades sensors (realistic conditions)', () => {
  it('a drill without weather replays exactly like a clear-weather drill (old records stay valid)', () => {
    const a = runSim(baseCfg({ seed: 77 }), { until: 1200 });
    const b = runSim(baseCfg({ seed: 77, weather: 'clear' }), { until: 1200 });
    expect(JSON.stringify(a.contacts)).toBe(JSON.stringify(b.contacts));
  });
  it('heavy rain makes radar detection slower than clear weather', () => {
    expect(meanFirstPaint('rain')).toBeGreaterThan(meanFirstPaint('clear'));
  });
  it('fog shortens camera identification range the most; night and weather combine', () => {
    expect(cameraRange(C, 'day', 'fog')).toBeLessThan(cameraRange(C, 'day', 'dust'));
    expect(cameraRange(C, 'day', 'dust')).toBeLessThan(cameraRange(C, 'day', 'clear'));
    expect(cameraRange(C, 'night', 'rain')).toBeCloseTo(C.training.sim.cameraRangeM.night * weatherFx(C, 'rain').camera);
  });
  it('unknown or missing weather falls back to clear', () => {
    expect(weatherFx(C, undefined).radar).toBe(1);
    expect(weatherFx(C, 'snow').camera).toBe(1);
  });
  it('bad-weather drills feed the "weather" skill; clear drills do not', () => {
    const wet = runSim(baseCfg({ seed: 9, weather: 'fog' }), { until: 1500 });
    const dry = runSim(baseCfg({ seed: 9 }), { until: 1500 });
    expect(observe(wet, scoreRun(wet)).weather.length).toBeGreaterThan(0);
    expect(observe(dry, scoreRun(dry)).weather.length).toBe(0);
  });
  it('the enemy AI sends bad weather to a trainee who is weak in it', () => {
    const H: SessionRecord[] = demoHistory().map((s) => ({
      ...s, obs: { ...s.obs, night: [true, true, true, true], swarm: [true, true, true, true], degraded: [true, true, true, true], weather: [false, false, false, false] },
    }));
    expect(mastery(H).weather).toBeLessThan(mastery(H).night);
    const p = planNext(H);
    expect(['rain', 'fog', 'dust']).toContain(p.cfg.weather);
    expect(p.tests[0]).toBe('bad weather');
  });
});
