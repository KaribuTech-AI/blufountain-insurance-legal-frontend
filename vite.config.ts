import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

// The portal is for people on basic phones and slow networks: one small script, no router,
// no component library. The build fails if it grows past the budget (scripts/check-budget.mjs).
export default defineConfig({
  plugins: [react()],
  build: { target: 'es2020', cssCodeSplit: false, sourcemap: false },
  server: {
    port: 5174,
    proxy: { '/api': 'http://localhost:3000' },
  },
  test: {
    exclude: [...configDefaults.exclude, 'packages/**'],
    environment: 'jsdom',
    setupFiles: ['./src/setup.ts'],
    testTimeout: 20_000,
  },
});
