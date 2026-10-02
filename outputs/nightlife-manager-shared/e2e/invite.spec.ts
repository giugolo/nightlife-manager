import { test, expect } from '@playwright/test';
import { unique, blockCdns, registerAdmin, onboard } from './helpers';

/**
 * Staff invite flow: an admin generates an invite link; a fresh user registers and
 * accepts it, joining the organization as staff. Exercises invite create/accept
 * rules + the user role transition pending -> staff and first-time org assignment.
 */
test('an invited user can register and join the organization as staff', async ({ browser }) => {
  // --- Admin generates an invite link ---
  const adminCtx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const admin = await adminCtx.newPage();
  await blockCdns(admin);
  await registerAdmin(admin, `admin-${unique()}@test.it`, 'Admin Inv');
  await onboard(admin, 'Org Invito E2E');

  await admin.getByRole('button', { name: 'Impostazioni Organizzazione' }).click();
  await admin.getByRole('button', { name: 'Invita Staff' }).click();
  await admin.getByRole('button', { name: 'Genera Link Invito' }).click();
  await expect(admin.getByText('Invito creato!')).toBeVisible();
  const inviteUrl = await admin.evaluate(() => {
    const input = Array.from(document.querySelectorAll('input')).find(i => i.value.includes('/invite/'));
    return input ? input.value : '';
  });
  expect(inviteUrl).toContain('/invite/');

  // --- Invitee registers via the invite link and accepts ---
  const inviteeCtx = await browser.newContext();
  const invitee = await inviteeCtx.newPage();
  await blockCdns(invitee);
  await invitee.goto(inviteUrl, { waitUntil: 'domcontentloaded' });

  await expect(invitee.getByRole('heading', { name: 'Invito Staff' })).toBeVisible();
  // Register form is the default tab.
  await invitee.getByPlaceholder('Mario Rossi').fill('Staff Test');
  await invitee.getByPlaceholder('nome@esempio.it').fill(`staff-${unique()}@test.it`);
  const passwords = invitee.locator('input[type="password"]');
  await passwords.nth(0).fill('password123');
  await passwords.nth(1).fill('password123');
  await invitee.getByRole('button', { name: 'Registrati e Continua' }).click();

  // After registration the accept step appears.
  await invitee.getByRole('button', { name: 'Accetta Invito' }).click();

  // Joined the org (success screen), then redirected to the staff dashboard.
  await expect(invitee.getByRole('heading', { name: 'Benvenuto!' })).toBeVisible();
  await expect(invitee.getByText('Org Invito E2E')).toBeVisible();
  await expect(invitee.getByRole('heading', { name: 'I Tuoi Eventi' })).toBeVisible();

  await adminCtx.close();
  await inviteeCtx.close();
});
