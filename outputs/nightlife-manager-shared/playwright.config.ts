import { defineConfig } from '@playwright/test';

// npm run e2e owns a fresh Auth+Firestore suite before Playwright starts.
// Separate ports allow a running development app, without reusing unknown servers.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:13000',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev:frontend -- --port 13000',
    url: 'http://localhost:13000',
    reuseExistingServer: false,
    timeout: 90_000,
    env: {
      VITE_USE_EMULATORS: 'true',
      VITE_AUTH_EMULATOR_PORT: '19099',
      VITE_FIRESTORE_EMULATOR_PORT: '18080'
    }
  }
});
