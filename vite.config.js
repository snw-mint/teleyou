import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: 'app.html',
        leading: 'index.html',
        privacy: 'privacy.html',
        terms: 'terms.html',
      },
    },
  },
});