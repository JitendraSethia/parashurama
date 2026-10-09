import { inReach, runSim, scoreRun, fmtTime, type Action, type Engine } from '@parashurama/engine';
import { app, on } from './app';
import { CONF, DT, EFF, EFF_ORDER, ORDER, TYPES, T } from './cfg';
import { $ } from './dom';

// "What if": rewind one contact to the moment you decided, change the decision, and re-run the exact same drill.
export function whatIf(cid: number, altCls: string, altEff: string) {
  const R = app.R; const c0 = R.E.contacts.find((c: any) => c.id === cid);
  if (!c0 || c0.firstPaint == null) return null;
  const others: Action[] = R.acts.filter((a: Action) => a.cid !== cid);
  const trackTick = c0.trackTick ?? c0.firstPaint + T(1.5);
  const idTick = c0.idTick ?? trackTick + T(3);
  const conf = c0.idConf ?? CONF[CONF.length - 1].p;
  const mine: Action[] = [{ k: 'track', cid, tick: trackTick }, { k: 'id', cid, cls: altCls, conf, tick: idTick }];
  const from = c0.engs[0]?.tick ?? idTick + 1;
  let fired = false;
  const policy = (E: Engine): Action[] => {
    if (fired || E.tick < from) return [];
    const c = E.contacts.find((x) => x.id === cid);
    if (!c || c.state !== 'live' || c.idTick == null) return [];
    if (altEff === 'hold' || (c.effectAt == null && inReach(c, altEff))) { fired = true; return [{ k: 'eng', cid, eff: altEff, tick: E.tick }]; }
    return [];
  };
  const E = runSim(R.cfg, { actions: [...others, ...mine].sort((a, b) => a.tick - b.tick), policy, until: R.endTick, spawns: R.spawns });
  return { before: R.sc.find((s: any) => s.c.id === cid), after: scoreRun(E).find((s) => s.c.id === cid), c1: E.contacts.find((x) => x.id === cid), c0 };
}
const outcome = (c: any) => (c.state === 'neutralised' ? `stopped at ${fmtTime(c.endTick * DT)}` : c.state === 'leaked' ? `<b class="bad">reached the asset at ${fmtTime(c.endTick * DT)}</b>` : TYPES[c.type].hostile ? 'still flying at the end' : 'left alone');
const did = (s: any) => (s?.e0 ? (s.e0.eff === 'hold' ? `held at ${fmtTime(s.e0.tick * DT)}` : `${EFF[s.e0.eff].label} at ${fmtTime(s.e0.tick * DT)}`) : 'no decision');
function render() {
  const R = app.R; if (!R) return;
  let p = $('#whatIf');
  if (!p) { p = document.createElement('div'); p.id = 'whatIf'; p.className = 'whatif'; $('#replayCard').appendChild(p); }
  const opts = R.sc.filter((s: any) => s.c.firstPaint != null && s.src === s.c).sort((a: any, b: any) => a.total - b.total); // biggest loss first
  p.innerHTML = `<div class="wiHead"><b>What if…</b><span>Rewind one decision and replay the same drill</span></div>
   <div class="wiRow"><label>Contact<select id="wiC">${opts.map((s: any) => `<option value="${s.c.id}">${app.labelOf(s.c)} · ${TYPES[s.c.type].short}</option>`).join('')}</select></label>
   <label>Call it<select id="wiId">${ORDER.map((k) => `<option value="${k}">${TYPES[k].short}</option>`).join('')}</select></label>
   <label>Respond<select id="wiEff">${[...EFF_ORDER, 'hold'].map((k) => `<option value="${k}">${k === 'hold' ? 'Hold' : EFF[k].label}</option>`).join('')}</select></label></div>
   <button class="wiBtn" id="wiRun">Replay with this decision</button><div class="wiOut" id="wiOut"></div>`;
  const sync = () => { const s = R.sc.find((x: any) => x.c.id === +$('#wiC').value); if (!s) return; $('#wiId').value = s.c.type; $('#wiEff').value = TYPES[s.c.type].hostile ? (s.e0 && s.e0.eff !== 'hold' ? s.e0.eff : EFF_ORDER[0]) : 'hold'; };
  $('#wiC').onchange = sync; sync();
  $('#wiRun').onclick = () => {
    const r = whatIf(+$('#wiC').value, $('#wiId').value, $('#wiEff').value);
    if (!r || !r.after) { $('#wiOut').innerHTML = 'That contact never appeared on radar, so there is nothing to rewind.'; return; }
    const eff = $('#wiEff').value;
    if (!r.after.e0 && eff !== 'hold') { $('#wiOut').innerHTML = `${EFF[eff].label} never had it in reach (it reaches ${(EFF[eff].range / 1000).toFixed(1)} km), so nothing would have been fired. Try another weapon.`; return; }
    const d = r.after.total - r.before.total;
    $('#wiOut').innerHTML = `<div><span>You:</span> ${did(r.before)} → ${outcome(r.c0)} · <b>${r.before.total}</b> pts</div>
      <div><span>What if:</span> ${did(r.after)} → ${outcome(r.c1)} · <b>${r.after.total}</b> pts <em class="${d > 0 ? 'good' : d < 0 ? 'bad' : ''}">${d > 0 ? '+' : ''}${d}</em></div>
      <div class="wiWhy">${r.after.why.join('. ')}.</div>`;
  };
}
export function initWhatIf() { on('learn', render); }
