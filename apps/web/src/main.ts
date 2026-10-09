// Boot order matters: pick online/offline mode and apply the unit's config BEFORE the app modules read it.
import '@fontsource/saira-stencil-one/latin-400.css';
import '@fontsource/barlow-condensed/latin-500.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/barlow/latin-400.css';
import '@fontsource/barlow/latin-500.css';
import '@fontsource/barlow/latin-600.css';
import './styles.css';
import { detectServer, startSession, initOnline, type Session } from './online';
import { toast } from './toast';

async function applyConfig(c: unknown, source: string) {
  try { const { useConfig } = await import('./validator'); useConfig(c as any); }
  catch (e) { console.warn(e); toast(`${source} settings were invalid, so the defaults are used.`); }
}
(async () => {
  const online = await detectServer();
  let session: Session | null = null;
  if (online) { session = await startSession(); if (session.config) await applyConfig(session.config, 'Unit'); }
  else { try { const raw = localStorage.getItem('parashurama.config'); if (raw) await applyConfig(JSON.parse(raw), 'Saved'); } catch { /* ignore */ } }
  const { app, hooks, on, boot } = await import('./app');
  const { planNext } = await import('@parashurama/engine');
  if (session) { app.DB.H = session.history; app.plan = planNext(app.DB.H); initOnline(app, hooks, on, session); }
  const [fg, ac, au, wi, ed, sc, v3, hm, shw] = await Promise.all([import('./fieldguide'), import('./academy'), import('./audio'), import('./whatif'), import('./editor'), import('./scenarios'), import('./view3d'), import('./home'), import('./showcase')]);
  fg.initFieldGuide(); ac.initAcademy(); au.initAudio(); wi.initWhatIf(); ed.initEditor({ online, user: session?.user ?? null, templates: session?.templates ?? null }); sc.initScenarios(); v3.init3D(); hm.initHome(); shw.initShowcase();
  boot();
  if (import.meta.env.PROD && 'serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => undefined);
})();
