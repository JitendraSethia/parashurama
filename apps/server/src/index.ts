import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:https';
import { buildApp } from './app';
import { createUser } from './auth';

process.removeAllListeners('warning');
const env = process.env;
const tls = env.TLS_CERT && env.TLS_KEY ? { cert: readFileSync(env.TLS_CERT), key: readFileSync(env.TLS_KEY) } : null;
const { app, db } = await buildApp({ dataDir: env.DATA_DIR ?? './data', webDir: env.WEB_DIR ?? '../web/dist', secureCookies: !!tls || env.COOKIE_SECURE === '1', logger: env.LOG !== '0' });
// First start: create the admin account.
if ((db.prepare('SELECT COUNT(*) AS n FROM users').get() as any).n === 0) {
  const password = env.ADMIN_PASSWORD ?? randomBytes(9).toString('base64url');
  createUser(db, { username: env.ADMIN_USERNAME ?? 'admin', name: 'Administrator', role: 'admin', unit: env.UNIT_NAME ?? 'Unit', password });
  console.log(`\n  First start: created admin account "${env.ADMIN_USERNAME ?? 'admin'}"${env.ADMIN_PASSWORD ? '' : ` with password: ${password}\n  Save it now; it is not shown again.`}\n`);
}
const port = +(env.PORT ?? (tls ? 8443 : 8080)), host = env.HOST ?? '0.0.0.0';
if (tls) {
  await app.ready();
  createServer(tls, (req, res) => app.server.emit('request', req, res)).listen(port, host, () => console.log(`PARASHURAMA unit server on https://${host}:${port}`));
} else {
  await app.listen({ port, host });
  console.log(`PARASHURAMA unit server on http://${host}:${port}`);
}
