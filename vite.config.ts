import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

// Vite configuration for the Digital Dictionary app.
export default defineConfig({
  plugins: [react()],

  // IMPORTANT for GitHub Pages (repo name = Digital-Dictionary)
  base: '/Digital-Dictionary/',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true,
  },
  resolve: {
    alias: {
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
    },
  },
});
