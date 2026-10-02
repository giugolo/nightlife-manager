import { test, expect } from '@playwright/test';
import { unique, blockCdns, registerAdmin, onboard, createEvent } from './helpers';

/**
 * P3 fix: opening a door link while logged in with a REAL account must NOT silently
 * create a door session under that account. The app asks the operator to explicitly
 * continue (which signs out and restarts as an anonymous door operator).
 */
test('a logged-in user opening a door link is asked to switch to operator mode', async ({ page }) => {
  await blockCdns(page);
  await registerAdmin(page, `admin-${unique()}@test.it`, 'Admin Door LI');
  await onboard(page, 'Club Door LI');
  await createEvent(page, 'Evento Door LI');
  await page.getByRole('heading', { name: 'Evento Door LI' }).click();

  // Dashboard is the default tab -> generate the door link.
  await page.getByRole('button', { name: 'Genera Link Door' }).click();
  const doorInput = page.locator('input[readonly]');
  await expect(doorInput).toHaveValue(/\/checkin\//);
  const doorLink = await doorInput.inputValue();

  // Navigate the SAME (logged-in) page to the door link.
  await page.goto(doorLink, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Sei già connesso' })).toBeVisible();

  // Explicitly continue -> signs out + restarts as anonymous door operator.
  await page.getByRole('button', { name: 'Continua come operatore door' }).click();
  await expect(page.getByRole('heading', { name: 'Door Check-in' })).toBeVisible();
});
