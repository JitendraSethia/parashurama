import { createEngine, defaultConfig, inReach, isDone, step, ticks, visibleBlip, type Action, type Contact, type DrillConfig, type Engine, type Spawn } from '../src';

export const C = defaultConfig;
export const baseCfg = (o: Partial<DrillConfig> = {}): DrillConfig => ({
  seed: 1234, drill: 1, time: 'day', terrain: 'rural', fault: 'none', faultSector: 0, pattern: 'mixed', difficulty: 3,
  focus: { sector: null, loiter: false, decoy: false }, ...o,
});
export type Controller = (E: Engine) => Action[];

export interface PlanOpts {
  trackAfterPaintSec?: number; ignoreVisibility?: boolean; idAfterSec?: number; cls?: (c: Contact) => string; conf?: number;
  eff?: (c: Contact, E: Engine) => string | null; engageIf?: (c: Contact, E: Engine) => boolean;
}
/** A scripted trainee for tests: track → identify → engage, with tunable timing and choices. */
export function controller(p: PlanOpts): Controller {
  return (E) => {
    const acts: Action[] = [];
    for (const c of E.contacts) {
      if (c.state !== 'live') continue;
      if (c.trackTick == null) {
        if (c.firstPaint != null && E.tick >= c.firstPaint + ticks(E.C, p.trackAfterPaintSec ?? 0) && (p.ignoreVisibility || visibleBlip(E, c))) acts.push({ k: 'track', cid: c.id, tick: E.tick });
        continue;
      }
      if (c.idTick == null) {
        if (E.tick >= c.trackTick + ticks(E.C, p.idAfterSec ?? 1)) acts.push({ k: 'id', cid: c.id, cls: p.cls ? p.cls(c) : c.type, conf: p.conf ?? 0.95, tick: E.tick });
        continue;
      }
      if (c.engs.length || c.effectAt != null) continue;
      const eff = p.eff ? p.eff(c, E) : null;
      if (!eff) continue;
      if (eff === 'hold' || ((p.engageIf ? p.engageIf(c, E) : true) && inReach(c, eff, E.C))) acts.push({ k: 'eng', cid: c.id, eff, tick: E.tick });
    }
    return acts;
  };
}

/** Run an engine under a controller, recording every action exactly as the live app does. */
export function drive(E: Engine, ctl: Controller, maxSec = 150, stopWhenDone = true): Action[] {
  const log: Action[] = [];
  const lim = ticks(E.C, maxSec);
  while (E.tick < lim) {
    const acts = ctl(E).map((a) => ({ ...a, tick: E.tick }));
    log.push(...acts);
    step(E, acts);
    if (stopWhenDone && isDone(E)) break;
  }
  return log;
}

export function single(type: string, o: Partial<DrillConfig> = {}, brg = 90, t = 0): Engine {
  const sp: Spawn[] = [{ type, t, brg }];
  return createEngine(baseCfg(o), C, sp);
}
