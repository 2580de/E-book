import { defineConfig } from 'vite';

export default defineConfig({
  root: 'Front-end/assets',
  publicDir: false,
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
  },
});
