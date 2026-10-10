import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const assets = resolve(process.cwd(), 'Front-end/assets');

export default defineConfig({
  root: assets,
  publicDir: false,
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(assets, 'index.html'),
        discover: resolve(assets, 'discover.html'),
        categories: resolve(assets, 'categories.html'),
        search: resolve(assets, 'search.html'),
        library: resolve(assets, 'library.html'),
        book: resolve(assets, 'book.html'),
      },
    },
  },
});
