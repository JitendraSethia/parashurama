import { afterEach, describe, expect, it } from 'vitest';
import { createEngine, defaultConfig, inReach, useConfig, validateConfig, getConfig, type Config } from '../src';

const clone = (): Config => JSON.parse(JSON.stringify(defaultConfig));

describe('config validation', () => {
  afterEach(() => useConfig(defaultConfig));

  it('the shipped config is valid', () => {
    const r = validateConfig(defaultConfig);
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('rejects a weapon whose minimum range is beyond its maximum', () => {
    const c = clone(); c.effectors.effectors.intc.min = 3000;
    expect(validateConfig(c).errors.join()).toMatch(/intc.*min >= range/);
  });

  it('rejects doctrine that points to an unknown weapon', () => {
    const c = clone(); c.doctrine.defeat.preferred.rfLinked = 'laser';
    expect(validateConfig(c).errors.join()).toMatch(/unknown effector "laser"/);
  });

  it('rejects a threat with a missing field (schema check)', () => {
    const c = clone(); delete (c.threats.threats.fpv as Partial<typeof c.threats.threats.fpv>).motion;
    expect(validateConfig(c).ok).toBe(false);
  });

  it('rejects points that do not total 100', () => {
    const c = clone(); c.doctrine.defeat.points = 50;
    expect(validateConfig(c).errors.join()).toMatch(/total 100/);
  });

  it('useConfig refuses invalid config with readable errors', () => {
    const c = clone(); c.training.scenario.swarmType = 'ghost';
    expect(() => useConfig(c)).toThrow(/unknown threat "ghost"/);
    expect(getConfig()).toBe(defaultConfig);
  });

  it('a valid edit (shorter jammer) changes engine behaviour with no code change', () => {
    const c = clone(); c.effectors.effectors.jam.range = 1500;
    useConfig(c);
    const E = createEngine({ seed: 1, drill: 1, time: 'day', terrain: 'rural', fault: 'none', faultSector: 0, pattern: 'mixed', difficulty: 1, focus: { sector: null, loiter: false, decoy: false } }, c, [{ type: 'recon', t: 0, brg: 0 }]);
    const fake = { x: 0, y: -1800 } as Parameters<typeof inReach>[0];
    expect(inReach(fake, 'jam', c)).toBe(false);
    expect(inReach(fake, 'jam', defaultConfig)).toBe(true);
    expect(E.C.effectors.effectors.jam.range).toBe(1500);
  });
});
