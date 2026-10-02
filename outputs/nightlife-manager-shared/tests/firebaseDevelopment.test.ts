import { expect, test, vi } from 'vitest';

test('development stays on demo Firebase even when emulator opt-in is disabled', async () => {
  vi.stubEnv('VITE_USE_EMULATORS', 'false');
  const { default: app, auth } = await import('../services/firebase');
  expect(app.options.projectId).toBe('demo-nightlife-manager');
  expect(auth.emulatorConfig).toMatchObject({ host: '127.0.0.1', port: 9099 });
  vi.unstubAllEnvs();
});
