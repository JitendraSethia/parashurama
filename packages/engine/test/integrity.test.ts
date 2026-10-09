import { describe, expect, it } from 'vitest';
import { chainHash, type Action } from '../src';

describe('tamper-evident decision log', () => {
  const log: Action[] = [{ tick: 10, k: 'track', cid: 1 }, { tick: 40, k: 'id', cid: 1, cls: 'fpv', conf: 0.8 }, { tick: 70, k: 'eng', cid: 1, eff: 'jam' }];
  it('is a stable 64-character SHA-256 chain', async () => {
    const h = await chainHash(log);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(await chainHash(log)).toBe(h);
  });
  it('changes if any single decision is edited', async () => {
    const h = await chainHash(log);
    const edited = log.map((a, i) => (i === 2 ? { ...a, eff: 'spoof' } : a));
    expect(await chainHash(edited)).not.toBe(h);
    const reordered = [log[1], log[0], log[2]];
    expect(await chainHash(reordered)).not.toBe(h);
  });
});
