import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Відносні шляхи коректно працюють як у корені домену, так і в /назва-репозиторію/ на GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: './',
  publicDir: 'public',
  build: {
    assetsInlineLimit: 0,
    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: true
  }
});
