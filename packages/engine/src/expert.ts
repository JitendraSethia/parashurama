import { decisionClass, ticks } from './config';
import { inReach, visibleBlip } from './engine';
import type { Action, Engine } from './types';

/** The expert ghost: doctrine-optimal choices with realistic human reaction times. */
export function expertPolicy(E: Engine): Action[] {
  const acts: Action[] = [];
  const t = E.tick, X = E.C.training.expert;
  for (const c of E.contacts) {
    if (c.state !== 'live' || c.effectAt != null) continue;
    if (c.trackTick == null) {
      if (c.firstPaint != null && t >= c.firstPaint + ticks(E.C, X.trackDelaySec) && visibleBlip(E, c)) acts.push({ k: 'track', cid: c.id, tick: t });
      continue;
    }
    if (c.idTick == null) {
      if (t >= c.trackTick + ticks(E.C, X.identifyDelaySec)) acts.push({ k: 'id', cid: c.id, cls: c.type, conf: E.C.doctrine.confidence[E.C.doctrine.confidence.length - 1].p, tick: t });
      continue;
    }
    if (c.engs.length) continue;
    const Ty = E.C.threats.threats[c.type];
    if (!Ty.hostile) { acts.push({ k: 'eng', cid: c.id, eff: 'hold', tick: t }); continue; }
    const want = E.C.doctrine.defeat.preferred[decisionClass(Ty)];
    if (inReach(c, want, E.C)) acts.push({ k: 'eng', cid: c.id, eff: want, tick: t });
  }
  return acts;
}
