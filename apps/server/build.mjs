// Bundle the server (and the shared engine + config JSON) into one file. npm dependencies stay external.
import { build } from 'esbuild';
await build({ entryPoints: ['src/index.ts', 'src/cli.ts'], outdir: 'dist', outExtension: { '.js': '.mjs' }, bundle: true, platform: 'node', format: 'esm', target: 'node22',
  external: ['fastify', '@fastify/cookie', '@fastify/static', 'ajv', 'node:sqlite'], logLevel: 'info' });
await import('node:fs').then((fs) => fs.renameSync('dist/index.mjs', 'dist/server.mjs'));
