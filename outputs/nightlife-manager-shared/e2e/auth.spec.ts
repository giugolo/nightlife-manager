import { test, expect } from '@playwright/test';
import { unique, blockCdns, registerAdmin, onboard, createEvent } from './helpers';

test.beforeEach(async ({ page }) => {
  await blockCdns(page);
});

/**
 * Core authenticated flow against the Firebase emulators:
 * register admin -> onboarding (create organization) -> create event.
 * Exercises Auth, Firestore writes and firestore.rules (create org/user/event).
 */
test('admin registers, creates an organization and an event', async ({ page }) => {
  await registerAdmin(page, `admin-${unique()}@test.it`, 'Mario Rossi');
  await onboard(page, 'Club Test E2E');
  await createEvent(page, 'Serata Test');

  // The new event card is visible on the dashboard.
  await expect(page.getByRole('heading', { name: 'Serata Test' })).toBeVisible();
});
