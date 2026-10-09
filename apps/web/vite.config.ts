import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`         → dist/          (normal static site, for a unit server or any web host)
// `npm run build:single`  → dist-single/   (one self-contained index.html with fonts inlined; runs fully offline)
export default defineConfig(({ mode }) => ({
  plugins: mode === 'single' ? [viteSingleFile()] : [],
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    assetsInlineLimit: mode === 'single' ? 100_000_000 : 4096,
    target: 'es2022',
  },
  server: { fs: { allow: ['../..'] } },
}));
