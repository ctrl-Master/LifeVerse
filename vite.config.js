import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      input: 'index.html',
      output: {
        manualChunks: {
          engines: [
            'js/engines/retirement.js',
            'js/engines/starmap.js',
            'js/engines/rulebase.js',
            'js/engines/vectorMatrix.js',
            'js/engines/audio.js',
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  preview: {
    port: 4173,
  },
});
