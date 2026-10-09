import { brgOf } from '@parashurama/engine';
import { app, on } from './app';
import { TYPES, T } from './cfg';
import { $ } from './dom';

// Sound cues (Web Audio, generated, no files) and spoken radio callouts (browser speech). Modes: off → sound → voice.
const MODES = ['off', 'sound', 'voice'] as const;
let ac: AudioContext | null = null;
const prev = new Map<number, string>(), warned = new Set<number>();
const mode = () => app.DB.settings.sound || 'sound';
function ctx(): AudioContext | null {
  if (mode() === 'off') return null;
  try { if (!ac) ac = new AudioContext(); if (ac.state === 'suspended') ac.resume(); } catch { return null; }
  return ac;
}
function tone(f: number, dur = 0.08, type: OscillatorType = 'sine', gain = 0.04, at = 0) {
  const a = ctx(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = f;
  const t0 = a.currentTime + at; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.02);
}
const DIG = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'niner'];
const spell = (n: number) => String(n).padStart(3, '0').split('').map((d) => DIG[+d]).join(' ');
const callsign = (c: any) => (app.live.labels[c.id] || 'contact').replace('T0', 'T zero ').replace('T', 'T ');
function say(text: string) {
  if (mode() !== 'voice' || !('speechSynthesis' in window)) return;
  const s = window.speechSynthesis; if (s.pending) s.cancel();
  const u = new SpeechSynthesisUtterance(text); u.rate = 1.12; u.pitch = 0.95; s.speak(u);
}
function label() { const m = mode(); $('#soundBtn').firstChild.textContent = m === 'off' ? 'Sound off ' : m === 'sound' ? 'Sound on ' : 'Sound + voice '; }
export function cycleSound() { const i = MODES.indexOf(mode()); app.DB.settings.sound = MODES[(i + 1) % MODES.length]; app.saveDB(); label(); if (mode() !== 'off') tone(880, 0.1); if (mode() === 'voice') say('Voice callouts on'); }
export function initAudio() {
  $('#soundBtn').onclick = cycleSound; label();
  addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'm' && app.phase === 'fight') cycleSound(); });
  on('start', () => { prev.clear(); warned.clear(); });
  on('tick', () => {
    const L = app.L;
    for (const c of L.contacts) {
      if (c.firstPaint === L.tick - 1) tone(1200 - Math.hypot(c.x, c.y) * 0.12, 0.06, 'sine', 0.025);
      const was = prev.get(c.id); if (was !== c.state) {
        if (was === 'live' && c.state === 'neutralised') { tone(660, 0.09); tone(990, 0.14, 'sine', 0.04, 0.09); say(`${callsign(c)}, splash`); }
        if (was === 'live' && c.state === 'leaked') { tone(220, 0.35, 'sawtooth', 0.05); say('Asset hit'); }
        prev.set(c.id, c.state);
      }
      const t = TYPES[c.type];
      if (t.hostile && c.state === 'live' && c.trackTick != null && c.effectAt == null && !warned.has(c.id)) {
        const d = Math.hypot(c.x, c.y), tt = (d - 120) / c.v;
        if (!c.hover && t.motion !== 'wander' && tt < 15) { warned.add(c.id); tone(740, 0.12, 'square', 0.03); tone(740, 0.12, 'square', 0.03, 0.18); say(`${callsign(c)}, fifteen seconds`); }
      }
    }
  });
  on('act', (e: any) => {
    if (e.k === 'track') { tone(520, 0.05, 'triangle'); const c = e.c; say(`${callsign(c)}, bearing ${spell(Math.round(brgOf(c.x, c.y)))}, ${(Math.hypot(c.x, c.y) / 1000).toFixed(1)} kilometres`); }
    if (e.k === 'id') tone(700, 0.05, 'triangle');
    if (e.k === 'eng') { tone(300, 0.12, 'sawtooth', 0.03); tone(450, 0.12, 'sawtooth', 0.03, 0.06); }
  });
  void T;
}
