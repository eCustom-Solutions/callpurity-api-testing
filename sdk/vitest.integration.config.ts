import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/integration/**/*.test.ts'],
    testTimeout: 15000,           // sandbox is slow
    setupFiles: ['dotenv/config'],// pulls .env automatically
    reporters: 'verbose',
    env: { VITEST_MODE: 'integration' }, // runtime flag if needed
    // serial: true,               // enable if sandbox state is shared
  },
}); 