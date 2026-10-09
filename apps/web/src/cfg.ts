import { getConfig, confLabel as cl } from '@parashurama/engine';

// Read-only views of the active config, so UI code stays short.
export const C = getConfig();
export const TYPES = C.threats.threats;
export const ORDER = C.threats.order;
export const EFF = C.effectors.effectors;
export const EFF_ORDER = C.effectors.order;
export const CONF = C.doctrine.confidence;
export const RULES = C.doctrine.rules;
export const SIM = C.training.sim;
export const DT = SIM.dt, SWEEP = SIM.sweepSec, RMAX = SIM.radarRangeM, BASE = SIM.assetRadiusM, MAXT = SIM.maxDrillSec;
export const T = (s: number): number => Math.round(s / DT);
export const confLabel = (p: number): string => cl(C, p);
export const CERT = C.training.certification;
