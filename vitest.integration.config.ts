import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node', // Use node environment for integration tests
    globals: true,
    setupFiles: ['./tests/integration/setup.ts'],
    include: ['**/*.integration.test.{ts,tsx}'],
    exclude: ['node_modules', 'e2e', '**/*.config.*', '.next'],
    testTimeout: 30000, // 30 seconds timeout for integration tests
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

